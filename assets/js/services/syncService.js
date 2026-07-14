// services/syncService.js - 同步服务
// 功能：多环境数据同步、冲突解决、同步状态管理

(function() {
  const SYNC_STATUS_KEY = 'shopdata_sync_status';
  const SYNC_QUEUE_KEY = 'shopdata_sync_queue';
  const LAST_SYNC_KEY = 'shopdata_last_sync';

  const SyncService = {
    _status: 'idle',
    _queue: [],
    _lastSync: null,
    _listeners: [],
    _remoteEndpoint: null,

    init() {
      this._loadState();
    },

    _loadState() {
      try {
        const status = localStorage.getItem(SYNC_STATUS_KEY);
        if (status) this._status = status;

        const queue = localStorage.getItem(SYNC_QUEUE_KEY);
        if (queue) this._queue = JSON.parse(queue);

        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (lastSync) this._lastSync = JSON.parse(lastSync);
      } catch (e) {}
    },

    _saveState() {
      try {
        localStorage.setItem(SYNC_STATUS_KEY, this._status);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this._queue));
        localStorage.setItem(LAST_SYNC_KEY, JSON.stringify(this._lastSync));
      } catch (e) {}
    },

    getStatus() {
      return {
        status: this._status,
        queueLength: this._queue.length,
        lastSync: this._lastSync,
      };
    },

    setRemoteEndpoint(endpoint) {
      this._remoteEndpoint = endpoint;
    },

    async sync(direction = 'both') {
      if (this._status === 'syncing') {
        return { success: false, message: '正在同步中，请稍候' };
      }

      this._setStatus('syncing');
      this._notifyListeners('sync-start');

      try {
        let result;
        if (direction === 'push') {
          result = await this._pushChanges();
        } else if (direction === 'pull') {
          result = await this._pullChanges();
        } else {
          result = await this._fullSync();
        }

        this._lastSync = {
          time: new Date().toISOString(),
          direction,
          result,
        };

        this._setStatus('idle');
        this._saveState();
        this._notifyListeners('sync-complete', result);

        return { success: true, ...result };
      } catch (e) {
        this._setStatus('error');
        this._notifyListeners('sync-error', { error: e.message });
        return { success: false, message: e.message };
      }
    },

    async _pushChanges() {
      if (!this._remoteEndpoint) {
        return { pushed: 0, message: '未配置远程端点，仅本地队列更新' };
      }

      let pushed = 0;
      const failedItems = [];

      for (const item of this._queue) {
        try {
          await this._sendToRemote(item);
          pushed++;
        } catch (e) {
          failedItems.push({ ...item, error: e.message });
        }
      }

      this._queue = failedItems;
      return { pushed, failed: failedItems.length };
    },

    async _pullChanges() {
      if (!this._remoteEndpoint) {
        return { pulled: 0, message: '未配置远程端点' };
      }

      try {
        const remoteData = await this._fetchFromRemote();
        let pulled = 0;

        for (const [key, value] of Object.entries(remoteData)) {
          const localValue = await this._getLocalValue(key);
          if (this._shouldUpdateLocal(localValue, value)) {
            await this._setLocalValue(key, value);
            pulled++;
          }
        }

        return { pulled };
      } catch (e) {
        throw new Error('拉取失败：' + e.message);
      }
    },

    async _fullSync() {
      const pushResult = await this._pushChanges();
      const pullResult = await this._pullChanges();
      return {
        pushed: pushResult.pushed,
        pulled: pullResult.pulled,
        failed: pushResult.failed || 0,
      };
    },

    async _sendToRemote(item) {
      if (!this._remoteEndpoint) return true;
      try {
        const response = await fetch(this._remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } catch (e) {
        throw new Error('远程同步失败：' + e.message);
      }
    },

    async _fetchFromRemote() {
      if (!this._remoteEndpoint) return {};
      try {
        const response = await fetch(this._remoteEndpoint);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } catch (e) {
        throw new Error('拉取远程数据失败：' + e.message);
      }
    },

    async _getLocalValue(key) {
      try {
        if (typeof AppStorage !== 'undefined') {
          return await AppStorage.get(key);
        }
        const cached = localStorage.getItem(`shopdata_${key}`);
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    },

    async _setLocalValue(key, value) {
      try {
        if (typeof AppStorage !== 'undefined') {
          return await AppStorage.set(key, value);
        }
        localStorage.setItem(`shopdata_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    _shouldUpdateLocal(localValue, remoteValue) {
      if (localValue === null || localValue === undefined) return true;
      if (!remoteValue || !remoteValue.updated_at) return false;
      if (!localValue.updated_at) return true;
      return new Date(remoteValue.updated_at) > new Date(localValue.updated_at);
    },

    addToQueue(action, key, data) {
      const item = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        action,
        key,
        data,
        timestamp: new Date().toISOString(),
      };
      this._queue.push(item);
      this._saveState();
      this._notifyListeners('queue-change', { queueLength: this._queue.length });
      return item;
    },

    clearQueue() {
      this._queue = [];
      this._saveState();
      this._notifyListeners('queue-change', { queueLength: 0 });
    },

    getQueue() {
      return [...this._queue];
    },

    _setStatus(status) {
      this._status = status;
      this._saveState();
      this._notifyListeners('status-change', { status });
    },

    onSyncEvent(callback) {
      if (typeof callback === 'function') {
        this._listeners.push(callback);
      }
      return () => {
        this._listeners = this._listeners.filter(fn => fn !== callback);
      };
    },

    _notifyListeners(event, data) {
      this._listeners.forEach(fn => {
        try {
          fn(event, data);
        } catch (e) {
          console.error('Sync listener error:', e);
        }
      });
    },

    generateSyncCode() {
      try {
        if (typeof Store !== 'undefined' && typeof Store.exportData === 'function') {
          const data = Store.exportData();
          return btoa(unescape(encodeURIComponent(data)));
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    applySyncCode(syncCode, mode = 'merge') {
      try {
        const decoded = decodeURIComponent(escape(atob(syncCode)));
        if (typeof Store !== 'undefined' && typeof Store.importData === 'function') {
          Store.importData(decoded, mode === 'merge');
          return { success: true };
        }
        return { success: false, message: 'Store not available' };
      } catch (e) {
        return { success: false, message: '同步码无效：' + e.message };
      }
    },

    exportAccounts() {
      if (typeof AccountManager !== 'undefined' && typeof AccountManager.exportAccounts === 'function') {
        return AccountManager.exportAccounts();
      }
      return null;
    },

    importAccounts(syncCode, mode = 'merge') {
      if (typeof AccountManager !== 'undefined' && typeof AccountManager.importAccounts === 'function') {
        return AccountManager.importAccounts(syncCode, mode);
      }
      return { success: false, message: 'AccountManager not available' };
    },
  };

  SyncService.init();
  window.SyncService = SyncService;
})();
