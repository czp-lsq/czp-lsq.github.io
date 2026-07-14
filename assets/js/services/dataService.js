// services/dataService.js - 数据服务
// 功能：CRUD操作、数据同步、数据导入导出

(function() {
  const DataService = {
    async get(key, defaultValue = null) {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.get(key, defaultValue);
        } catch (e) {}
      }
      try {
        const cached = localStorage.getItem(`shopdata_${key}`);
        if (cached !== null) {
          return JSON.parse(cached);
        }
      } catch (e) {}
      return defaultValue;
    },

    async set(key, value) {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.set(key, value);
        } catch (e) {}
      }
      try {
        localStorage.setItem(`shopdata_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    async remove(key) {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.remove(key);
        } catch (e) {}
      }
      try {
        localStorage.removeItem(`shopdata_${key}`);
        return true;
      } catch (e) {
        return false;
      }
    },

    async getAll() {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.getAll();
        } catch (e) {}
      }
      const result = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shopdata_')) {
          try {
            result[key.replace('shopdata_', '')] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        }
      }
      return result;
    },

    async createBackup(type = 'manual') {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.createBackup(type);
        } catch (e) {}
      }
      return null;
    },

    async getBackups(limit = 10) {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.getBackups(limit);
        } catch (e) {}
      }
      return [];
    },

    async restoreBackup(backupId) {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.restoreBackup(backupId);
        } catch (e) {}
      }
      return false;
    },

    async exportData(format = 'json') {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.exportData(format);
        } catch (e) {}
      }
      const allData = await this.getAll();
      const exportObj = {
        version: window.AppVersion || '1.0.0',
        export_time: new Date().toISOString(),
        data: allData
      };
      if (format === 'json') {
        return JSON.stringify(exportObj, null, 2);
      }
      return exportObj;
    },

    async importData(jsonString, mode = 'merge') {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.importData(jsonString, mode);
        } catch (e) {}
      }
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
    },

    async clear() {
      if (typeof AppStorage !== 'undefined') {
        try {
          return await AppStorage.clear();
        } catch (e) {}
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shopdata_')) {
          localStorage.removeItem(key);
        }
      }
      return true;
    },

    onChange(callback) {
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.onChange === 'function') {
        return AppStorage.onChange(callback);
      }
      const handler = (e) => {
        if (e.key && e.key.startsWith('shopdata_')) {
          callback(e.key.replace('shopdata_', ''), e.newValue);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },

    getStoreState() {
      if (typeof Store !== 'undefined' && typeof Store.get === 'function') {
        return Store.get();
      }
      return null;
    },

    updateStore(updater) {
      if (typeof Store !== 'undefined' && typeof Store.set === 'function') {
        Store.set(updater);
        return true;
      }
      return false;
    },

    subscribeStore(callback) {
      if (typeof Store !== 'undefined' && typeof Store.sub === 'function') {
        return Store.sub(callback);
      }
      return () => {};
    },
  };

  window.DataService = DataService;
})();
