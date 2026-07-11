// core/store.js - 状态管理 Store 与操作日志 ActivityLogger
// 数据持久化机制：
// 1. localStorage 主存储
// 2. 自动备份（保留最近一次成功状态）
// 3. 存储配额检测与降级策略
// 4. 数据完整性校验
// 5. 全局事件通知（供 UI 层订阅存储异常）

// ====== 存储事件总线 ======
const StorageEvents = (() => {
  const listeners = new Set();
  return {
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(type, detail) {
      listeners.forEach((fn) => {
        try {
          fn(type, detail);
        } catch (e) {}
      });
    },
  };
})();

const ActivityLogger = (() => {
  const KEY = "profit_calc_activity_v10";
  const MAX_ENTRIES = 100;
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  };
  const save = (entries) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
    } catch (e) {
      StorageEvents.emit("error", { source: "activity", error: e });
    }
  };
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem("app_login_user") || "null");
      return user?.username || "系统";
    } catch {
      return "系统";
    }
  };
  return {
    add(action, detail) {
      const entries = load();
      entries.unshift({
        id: Date.now(),
        action,
        detail,
        operator: getCurrentUser(),
        time: new Date().toISOString(),
      });
      if (entries.length > MAX_ENTRIES) {
        entries.splice(MAX_ENTRIES);
      }
      save(entries);
    },
    get() {
      return load();
    },
    clear() {
      localStorage.removeItem(KEY);
    },
  };
})();

// 状态管理 Store
const Store = (() => {
  const STORAGE_KEY = "profit_calc_system_v10";
  const BACKUP_KEY = "profit_calc_system_v10_backup";
  const CURRENT_VERSION = "5.2.0";
  const QUOTA_WARN_THRESHOLD = 0.85; // 85% 配额告警
  const QUOTA_CRITICAL_THRESHOLD = 0.95; // 95% 严重告警
  const MAX_DATA_SIZE = 4 * 1024 * 1024; // 4MB 数据大小告警阈值

  const migrations = {
    "1.0.0": (state) => state,
    "2.0.0": (state) => state,
    "3.0.0": (state) => state,
    "4.0.0": (state) => state,
  };

  // 数据完整性校验
  const validate = (state) => {
    if (!state || typeof state !== "object") return false;
    if (!Array.isArray(state.platforms)) return false;
    if (typeof state.templates !== "object") return false;
    if (typeof state.samples !== "object") return false;
    if (typeof state.rules !== "object") return false;
    if (!Array.isArray(state.externals)) return false;
    return true;
  };

  // 估算 localStorage 可用容量（粗略）
  const getStorageInfo = () => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || "";
        total += key.length + val.length;
      }
      // 大多数浏览器 localStorage 限额为 5~10MB
      const estimatedQuota = 5 * 1024 * 1024;
      const usedBytes = total * 2; // UTF-16 每字符2字节
      const usage = usedBytes / estimatedQuota;
      return {
        usedBytes,
        estimatedQuota,
        usage,
        isWarning: usage >= QUOTA_WARN_THRESHOLD && usage < QUOTA_CRITICAL_THRESHOLD,
        isCritical: usage >= QUOTA_CRITICAL_THRESHOLD,
      };
    } catch (e) {
      return { usedBytes: 0, estimatedQuota: 0, usage: 0, isWarning: false, isCritical: false };
    }
  };

  // 备份最近一次成功保存的状态
  const backup = (serialized) => {
    try {
      localStorage.setItem(BACKUP_KEY, serialized);
    } catch (e) {
      // 备份失败不阻塞主流程
    }
  };

  // 从备份恢复
  const restoreFromBackup = () => {
    try {
      const backupData = localStorage.getItem(BACKUP_KEY);
      if (backupData) {
        const parsed = JSON.parse(backupData);
        if (validate(parsed)) {
          StorageEvents.emit("restored", { source: "backup" });
          return parsed;
        }
      }
    } catch (e) {
      StorageEvents.emit("error", { source: "backup", error: e });
    }
    return null;
  };

  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let state = JSON.parse(saved);
        let version = state._version || "1.0.0";
        if (!state.platforms || !Array.isArray(state.platforms)) {
          state.platforms = [
            { id: "pdd", name: "拼多多", emoji: "🍊", shops: [] },
            { id: "tb", name: "淘宝", emoji: "🛒", shops: [] },
            { id: "dy", name: "抖音", emoji: "🎵", shops: [] },
          ];
        }
        if (!state.templates || typeof state.templates !== "object") state.templates = {};
        if (!state.samples || typeof state.samples !== "object") state.samples = {};
        if (!state.rules || typeof state.rules !== "object") state.rules = {};
        if (!state.externals || !Array.isArray(state.externals)) state.externals = [];
        if (!state.batchData || typeof state.batchData !== "object") state.batchData = {};
        if (!state.calcHistory || !Array.isArray(state.calcHistory)) state.calcHistory = [];
        if (!state.userSettings || typeof state.userSettings !== "object") {
          state.userSettings = { theme: "light", language: "zh-CN", autoSave: true };
        }
        if (version !== CURRENT_VERSION) {
          Object.keys(migrations)
            .sort()
            .forEach((v) => {
              if (v > version) {
                state = migrations[v](state);
              }
            });
          state._version = CURRENT_VERSION;
          save(state);
        }
        return state;
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
      StorageEvents.emit("error", { source: "load", error: e });
      // 尝试从备份恢复
      const restored = restoreFromBackup();
      if (restored) return restored;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e2) {}
    }
    return null;
  };

  // 精简数据（移除 worksheet 等运行时对象，截断超长行）
  const liteState = (state) => {
    const lite = JSON.parse(JSON.stringify(state));
    if (lite.samples) {
      Object.keys(lite.samples).forEach((platform) => {
        (lite.samples[platform] || []).forEach((sample) => {
          if (sample.sheets) {
            Object.keys(sample.sheets).forEach((name) => {
              delete sample.sheets[name].worksheet;
              delete sample.sheets[name].aoaFormatted;
              if (sample.sheets[name].rows && sample.sheets[name].rows.length > 500) {
                sample.sheets[name].rows = sample.sheets[name].rows.slice(0, 500);
                sample.sheets[name].truncated = true;
              }
            });
          }
        });
      });
    }
    // 截断计算历史最多保留 50 条
    if (Array.isArray(lite.calcHistory) && lite.calcHistory.length > 50) {
      lite.calcHistory = lite.calcHistory.slice(0, 50);
    }
    return lite;
  };

  const save = (state) => {
    try {
      const toSave = {
        ...state,
        _version: CURRENT_VERSION,
        _lastSaved: new Date().toISOString(),
      };
      const serialized = JSON.stringify(toSave);

      // 数据大小告警
      if (serialized.length > MAX_DATA_SIZE) {
        console.warn("Data size is large:", Math.round(serialized.length / 1024), "KB");
        StorageEvents.emit("warning", {
          source: "size",
          size: serialized.length,
          message: `数据量较大（${Math.round(serialized.length / 1024)}KB），建议备份或清理历史数据`,
        });
      }

      // 配额检测
      const info = getStorageInfo();
      if (info.isCritical) {
        StorageEvents.emit("warning", {
          source: "quota",
          usage: info.usage,
          message: "浏览器存储空间即将用尽，请及时清理或导出数据",
        });
      }

      localStorage.setItem(STORAGE_KEY, serialized);
      // 保存成功后备份
      backup(serialized);
    } catch (e) {
      console.error("Failed to save:", e);
      StorageEvents.emit("error", { source: "save", error: e });

      // 降级策略 1：精简模式保存
      try {
        const lite = liteState(state);
        const liteSerialized = JSON.stringify({
          ...lite,
          _version: CURRENT_VERSION,
          _lastSaved: new Date().toISOString(),
        });
        localStorage.setItem(STORAGE_KEY, liteSerialized);
        backup(liteSerialized);
        StorageEvents.emit("warning", {
          source: "lite",
          message: "存储空间不足，已自动精简数据保存（部分历史数据被截断）",
        });
        console.warn("Saved in lite mode due to storage limit");
      } catch (e2) {
        console.error("Failed to save (lite):", e2);
        // 降级策略 2：最小化保存（仅保留核心配置）
        try {
          const minimalState = {
            _version: CURRENT_VERSION,
            _lastSaved: new Date().toISOString(),
            platforms: state.platforms || [],
            templates: {},
            samples: {},
            rules: {},
            externals: [],
            batchData: {},
            calcHistory: [],
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
          StorageEvents.emit("error", {
            source: "minimal",
            message: "存储空间严重不足，仅保存了平台基础配置，请清理浏览器存储后重新导入数据",
          });
          console.warn("Saved minimal state only");
        } catch (e3) {
          console.error("Failed to save (minimal):", e3);
          StorageEvents.emit("error", {
            source: "fatal",
            message: "数据保存失败，请立即导出数据备份，避免丢失",
          });
        }
      }
    }
  };

  const defaultState = {
    _version: CURRENT_VERSION,
    platforms: [
      { id: "pdd", name: "拼多多", emoji: "🍊", shops: [] },
      { id: "tb", name: "淘宝", emoji: "🛒", shops: [] },
      { id: "dy", name: "抖音", emoji: "🎵", shops: [] },
    ],
    templates: {},
    samples: {},
    rules: {},
    externals: [],
    batchData: {},
    calcHistory: [],
    userSettings: { theme: "light", language: "zh-CN", autoSave: true },
  };
  const saved = load();
  let state = saved || defaultState;
  const subs = new Set();
  let saveTimeout = null;
  const debouncedSave = (newState) => {
    state = newState;
    subs.forEach((s) => s(state));
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      save(state);
      saveTimeout = null;
    }, 200);
  };

  // 页面关闭/刷新前立即保存，防止数据丢失
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        save(state);
      }
    });
  }
  return {
    get: () => state,
    set: (fn) => {
      const newState = typeof fn === "function" ? fn(state) : { ...state, ...fn };
      newState._version = CURRENT_VERSION;
      newState._lastSaved = new Date().toISOString();
      debouncedSave(newState);
    },
    sub: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    onStorageEvent: (fn) => StorageEvents.on(fn),
    clear: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      state = { ...defaultState, _version: CURRENT_VERSION, _lastSaved: new Date().toISOString() };
      save(state);
      subs.forEach((s) => s(state));
    },
    getVersion: () => CURRENT_VERSION,
    getStorageInfo,
    exportData: () => JSON.stringify(state, null, 2),
    importData: (data) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (!parsed.platforms) throw new Error("无效的配置文件");
      if (!validate(parsed)) throw new Error("配置文件数据不完整或格式错误");
      state = { ...parsed, _version: CURRENT_VERSION, _lastSaved: new Date().toISOString() };
      save(state);
      subs.forEach((s) => s(state));
    },
  };
})();
