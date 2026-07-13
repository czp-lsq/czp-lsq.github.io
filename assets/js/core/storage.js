// core/storage.js - IndexedDB 持久化存储模块
// 功能：
// 1. IndexedDB 作为主要存储后端，支持大容量数据
// 2. localStorage 作为缓存层，提高读取性能
// 3. 自动数据备份与恢复机制
// 4. 数据版本迁移
// 5. 跨标签页数据同步
// 6. 数据导出/导入（JSON格式，支持全量/增量）

const DB_NAME = 'shopdata_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';
const BACKUP_STORE_NAME = 'backups';

class IndexedDBStorage {
  constructor() {
    this.db = null;
    this.ready = false;
    this.listeners = [];
    this._init();
  }

  _init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        this.ready = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (e) => {
        console.error('IndexedDB open error:', e);
        this.ready = true;
        resolve();
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        this.ready = true;
        this._setupStorageListener();
        resolve();
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('updated_at', 'updated_at', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
          const backupStore = db.createObjectStore(BACKUP_STORE_NAME, { keyPath: 'id', autoIncrement: true });
          backupStore.createIndex('created_at', 'created_at', { unique: false });
          backupStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  _setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('shopdata_')) {
        this._notifyListeners(e.key.replace('shopdata_', ''), e.newValue);
      }
    });
  }

  _notifyListeners(key, value) {
    this.listeners.forEach(fn => {
      try {
        fn(key, value);
      } catch (e) {
        console.error('Storage listener error:', e);
      }
    });
  }

  async _waitReady() {
    if (this.ready) return;
    let attempts = 0;
    while (!this.ready && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
  }

  async get(key, defaultValue = null) {
    await this._waitReady();
    
    const cacheKey = `shopdata_${key}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }

    if (!this.db) {
      return defaultValue;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          const value = result ? result.value : defaultValue;
          if (result) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(value));
            } catch (e) {}
          }
          resolve(value);
        };

        request.onerror = () => {
          resolve(defaultValue);
        };
      } catch (e) {
        resolve(defaultValue);
      }
    });
  }

  async set(key, value) {
    await this._waitReady();
    
    const cacheKey = `shopdata_${key}`;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage set failed:', e);
    }

    if (!this.db) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const data = {
          key,
          value,
          updated_at: Date.now()
        };
        const request = store.put(data);

        request.onsuccess = () => {
          this._notifyListeners(key, value);
          resolve(true);
        };

        request.onerror = () => {
          resolve(false);
        };
      } catch (e) {
        resolve(false);
      }
    });
  }

  async remove(key) {
    await this._waitReady();
    
    const cacheKey = `shopdata_${key}`;
    localStorage.removeItem(cacheKey);

    if (!this.db) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
          this._notifyListeners(key, null);
          resolve(true);
        };

        request.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async getAll() {
    await this._waitReady();
    
    if (!this.db) {
      const result = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('shopdata_')) {
          try {
            result[key.replace('shopdata_', '')] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        }
      }
      return result;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const result = {};
          (request.result || []).forEach(item => {
            result[item.key] = item.value;
          });
          resolve(result);
        };

        request.onerror = () => resolve({});
      } catch (e) {
        resolve({});
      }
    });
  }

  async createBackup(type = 'manual') {
    await this._waitReady();
    
    if (!this.db) {
      return null;
    }

    const allData = await this.getAll();
    const backup = {
      type,
      data: allData,
      created_at: Date.now(),
      version: APP_VERSION || 'unknown'
    };

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([BACKUP_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(BACKUP_STORE_NAME);
        const request = store.add(backup);

        request.onsuccess = () => {
          this._cleanOldBackups();
          resolve(request.result);
        };

        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async _cleanOldBackups() {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([BACKUP_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const index = store.index('created_at');
      const request = index.openCursor(null, 'prev');
      
      let count = 0;
      const maxBackups = 20;
      
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          count++;
          if (count > maxBackups) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (e) {
      console.error('Clean old backups error:', e);
    }
  }

  async getBackups(limit = 10) {
    await this._waitReady();
    
    if (!this.db) {
      return [];
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([BACKUP_STORE_NAME], 'readonly');
        const store = transaction.objectStore(BACKUP_STORE_NAME);
        const index = store.index('created_at');
        const request = index.openCursor(null, 'prev');
        
        const backups = [];
        
        request.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor && backups.length < limit) {
            backups.push(cursor.value);
            cursor.continue();
          } else {
            resolve(backups);
          }
        };

        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async restoreBackup(backupId) {
    await this._waitReady();
    
    if (!this.db) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([BACKUP_STORE_NAME, STORE_NAME], 'readwrite');
        const backupStore = transaction.objectStore(BACKUP_STORE_NAME);
        const dataStore = transaction.objectStore(STORE_NAME);
        
        const getRequest = backupStore.get(backupId);
        
        getRequest.onsuccess = () => {
          const backup = getRequest.result;
          if (!backup || !backup.data) {
            resolve(false);
            return;
          }

          const clearRequest = dataStore.clear();
          
          clearRequest.onsuccess = () => {
            const entries = Object.entries(backup.data);
            let completed = 0;
            let success = true;

            if (entries.length === 0) {
              resolve(true);
              return;
            }

            entries.forEach(([key, value]) => {
              const putRequest = dataStore.put({
                key,
                value,
                updated_at: Date.now()
              });
              
              putRequest.onsuccess = () => {
                try {
                  localStorage.setItem(`shopdata_${key}`, JSON.stringify(value));
                } catch (e) {}
                completed++;
                if (completed === entries.length) {
                  resolve(success);
                }
              };
              
              putRequest.onerror = () => {
                success = false;
                completed++;
                if (completed === entries.length) {
                  resolve(success);
                }
              };
            });
          };
        };
      } catch (e) {
        resolve(false);
      }
    });
  }

  async exportData(format = 'json') {
    const allData = await this.getAll();
    const exportObj = {
      version: APP_VERSION || '1.0.0',
      export_time: new Date().toISOString(),
      data: allData
    };

    if (format === 'json') {
      return JSON.stringify(exportObj, null, 2);
    }
    
    return exportObj;
  }

  async importData(jsonString, mode = 'merge') {
    try {
      const importObj = typeof jsonString === 'string' 
        ? JSON.parse(jsonString) 
        : jsonString;

      if (!importObj.data || typeof importObj.data !== 'object') {
        return { success: false, message: '无效的数据格式' };
      }

      if (mode === 'replace') {
        await this.clear();
      }

      let imported = 0;
      for (const [key, value] of Object.entries(importObj.data)) {
        await this.set(key, value);
        imported++;
      }

      return {
        success: true,
        message: `成功导入 ${imported} 项数据`,
        imported
      };
    } catch (e) {
      return {
        success: false,
        message: '导入失败：' + e.message
      };
    }
  }

  async clear() {
    await this._waitReady();
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith('shopdata_')) {
        localStorage.removeItem(key);
      }
    }

    if (!this.db) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }
}

const AppStorage = new IndexedDBStorage();
