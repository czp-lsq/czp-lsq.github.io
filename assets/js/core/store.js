// core/store.js - 状态管理 Store 与操作日志 ActivityLogger
// 数据持久化机制：
// 1. localStorage 主存储（支持 LZString 数据压缩）
// 2. 自动备份（保留最近一次成功状态）
// 3. 存储配额检测与智能清理策略
// 4. 数据版本迁移机制（自动迁移升级）
// 5. 数据完整性校验
// 6. 全局事件通知（供 UI 层订阅存储异常）
// 7. 存储异常恢复机制

// ====== LZString 压缩库（精简版）======
const LZString = (() => {
  const keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
  
  const compressToBase64 = (input) => {
    if (input == null) return "";
    const res = _compress(input, 6, (a) => keyStrBase64.charAt(a));
    switch (res.length % 4) {
      case 0: return res;
      case 1: return res + "===";
      case 2: return res + "==";
      case 3: return res + "=";
    }
  };

  const decompressFromBase64 = (input) => {
    if (input == null) return "";
    if (input == "") return null;
    return _decompress(input.length, 32, (index) => getBaseValue(keyStrBase64, input.charAt(index)));
  };

  const compressToUTF16 = (input) => {
    if (input == null) return "";
    return _compress(input, 15, (a) => String.fromCharCode(a + 32)) + " ";
  };

  const decompressFromUTF16 = (compressed) => {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return _decompress(compressed.length, 16384, (index) => compressed.charCodeAt(index) - 32);
  };

  const compress = (uncompressed) => {
    return _compress(uncompressed, 16, (a) => String.fromCharCode(a));
  };

  const decompress = (compressed) => {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return _decompress(compressed.length, 32768, (index) => compressed.charCodeAt(index));
  };

  const getBaseValue = (alphabet, character) => {
    const index = alphabet.indexOf(character);
    return index === -1 ? 0 : index;
  };

  const _compress = (uncompressed, bitsPerChar, getCharFromInt) => {
    if (uncompressed == null) return "";
    let i, value, context_dictionary = {}, context_dictionaryToCreate = {};
    let context_c = "", context_wc = "", context_w = "";
    let context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2;
    let context_data = [], context_data_val = 0, context_data_position = 0;
    const ii = uncompressed.length;

    for (i = 0; i < ii; i++) {
      context_c = uncompressed.charAt(i);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }
      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (value = 0; value < context_numBits; value++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (let j = 0; j < 8; j++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (let j = 0; j < context_numBits; j++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (let j = 0; j < 16; j++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          context_dictionaryToCreate[context_w] = false;
        } else {
          value = context_dictionary[context_w];
          for (let j = 0; j < context_numBits; j++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (value = 0; value < context_numBits; value++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (let j = 0; j < 8; j++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (let j = 0; j < context_numBits; j++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (let j = 0; j < 16; j++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        context_dictionaryToCreate[context_w] = false;
      } else {
        value = context_dictionary[context_w];
        for (let j = 0; j < context_numBits; j++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    value = 2;
    for (i = 0; i < context_numBits; i++) {
      context_data_val = (context_data_val << 1) | (value & 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      } else {
        context_data_position++;
      }
    }
    return context_data.join('');
  };

  const _decompress = (length, resetValue, getNextValue) => {
    let dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3;
    let entry = "", result = [], w, c, n, i, bits, resb, maxpower, power;
    let data = { val: getNextValue(0), position: resetValue, index: 1 };

    for (i = 0; i < 3; i++) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2, 2);
    power = 1;
    while (power != maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    next = bits;
    switch (next) {
      case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = String.fromCharCode(bits);
        break;
      case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = String.fromCharCode(bits);
        break;
      case 2: return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) return "";
      bits = 0;
      maxpower = Math.pow(2, numBits);
      power = 1;
      while (power != maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (next = bits) {
        case 0:
          bits = 0; maxpower = Math.pow(2, 8); power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = String.fromCharCode(bits);
          next = dictSize - 1;
          enlargeIn--;
          break;
        case 1:
          bits = 0; maxpower = Math.pow(2, 16); power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = String.fromCharCode(bits);
          next = dictSize - 1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[next]) {
        entry = dictionary[next];
      } else {
        if (next === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }
      w = entry;
    }
  };

  return {
    compress,
    decompress,
    compressToBase64,
    decompressFromBase64,
    compressToUTF16,
    decompressFromUTF16,
  };
})();

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
  const MAX_ENTRIES = 200;
  const CATEGORIES = {
    login: { name: "登录登出", icon: "log-in", color: "var(--color-primary)" },
    data: { name: "数据操作", icon: "database", color: "var(--color-info)" },
    calc: { name: "计算操作", icon: "calculator", color: "var(--color-success)" },
    rule: { name: "规则配置", icon: "settings", color: "var(--color-warning)" },
    setting: { name: "系统设置", icon: "sliders", color: "var(--color-accent)" },
    account: { name: "账户管理", icon: "users", color: "var(--color-danger)" },
    export: { name: "导入导出", icon: "download", color: "var(--color-primary)" },
    system: { name: "系统操作", icon: "info", color: "var(--color-text-tertiary)" },
  };
  const ACTION_MAP = {
    "登录": "login",
    "退出登录": "login",
    "导入数据": "data",
    "删除样本": "data",
    "批量删除样本": "data",
    "清空数据": "data",
    "更新数据": "data",
    "重命名样本": "data",
    "计算": "calc",
    "批量计算": "calc",
    "新增规则": "rule",
    "修改规则": "rule",
    "删除规则": "rule",
    "添加步骤": "rule",
    "删除步骤": "rule",
    "保存设置": "setting",
    "切换主题": "setting",
    "添加账户": "account",
    "修改账户": "account",
    "删除账户": "account",
    "导出数据": "export",
    "导入配置": "export",
    "备份恢复": "system",
    "清理数据": "system",
  };
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      // 尝试解压缩
      if (raw.startsWith("__COMPRESSED__:")) {
        const compressed = raw.slice(15);
        return JSON.parse(LZString.decompressFromUTF16(compressed) || "[]");
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };
  const save = (entries) => {
    try {
      const serialized = JSON.stringify(entries);
      // 大于 10KB 时启用压缩
      if (serialized.length > 10240) {
        const compressed = LZString.compressToUTF16(serialized);
        localStorage.setItem(KEY, "__COMPRESSED__:" + compressed);
      } else {
        localStorage.setItem(KEY, serialized);
      }
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
  const getCategory = (action) => {
    return ACTION_MAP[action] || "system";
  };
  return {
    add(action, detail, extra = {}) {
      const entries = load();
      entries.unshift({
        id: Date.now() + Math.random().toString(36).slice(2, 8),
        action,
        detail,
        category: getCategory(action),
        operator: getCurrentUser(),
        time: new Date().toISOString(),
        ...extra,
      });
      if (entries.length > MAX_ENTRIES) {
        entries.splice(MAX_ENTRIES);
      }
      save(entries);
    },
    get(category) {
      const all = load();
      if (category) {
        return all.filter((e) => e.category === category);
      }
      return all;
    },
    getCategories() {
      return CATEGORIES;
    },
    clear() {
      localStorage.removeItem(KEY);
    },
  };
})();

// ====== 存储清理策略 ======
const StorageCleaner = (() => {
  const CLEANUP_KEYS = [
    "profit_calc_temp_",
    "snapshot_auto_",
  ];
  const MAX_AUTO_SNAPSHOTS = 5;
  const MAX_MANUAL_SNAPSHOTS = 10;
  const MAX_HISTORY_ITEMS = 200;
  const MAX_CALC_HISTORY = 200;

  const cleanupOldSnapshots = () => {
    try {
      let snapshots = [];
      try {
        snapshots = JSON.parse(localStorage.getItem("profit_calc_snapshots") || "[]");
      } catch (e) {}
      
      const autoSnapshots = snapshots.filter(s => s.key.startsWith("snapshot_auto_"));
      const manualSnapshots = snapshots.filter(s => !s.key.startsWith("snapshot_auto_"));
      
      // 清理超过限制的自动快照
      if (autoSnapshots.length > MAX_AUTO_SNAPSHOTS) {
        autoSnapshots.slice(0, -MAX_AUTO_SNAPSHOTS).forEach(s => {
          localStorage.removeItem(s.key);
        });
        snapshots = snapshots.filter(s => 
          !s.key.startsWith("snapshot_auto_") || 
          autoSnapshots.slice(-MAX_AUTO_SNAPSHOTS).some(a => a.key === s.key)
        );
      }
      
      // 清理超过限制的手动快照
      if (manualSnapshots.length > MAX_MANUAL_SNAPSHOTS) {
        manualSnapshots.slice(0, -MAX_MANUAL_SNAPSHOTS).forEach(s => {
          localStorage.removeItem(s.key);
        });
        snapshots = snapshots.filter(s => 
          s.key.startsWith("snapshot_auto_") || 
          manualSnapshots.slice(-MAX_MANUAL_SNAPSHOTS).some(m => m.key === s.key)
        );
      }
      
      localStorage.setItem("profit_calc_snapshots", JSON.stringify(snapshots));
      return true;
    } catch (e) {
      return false;
    }
  };

  const cleanupTempData = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        CLEANUP_KEYS.some(prefix => {
          if (key.startsWith(prefix)) {
            keysToRemove.push(key);
            return true;
          }
          return false;
        });
      }
      keysToRemove.forEach(key => {
        // 不删除最近5分钟内的自动快照
        if (key.startsWith("snapshot_auto_")) {
          const timestamp = parseInt(key.split("_")[2] || "0");
          if (Date.now() - timestamp < 5 * 60 * 1000) return;
        }
        localStorage.removeItem(key);
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const trimCalcHistory = (state) => {
    if (state.calcHistory && Array.isArray(state.calcHistory) && state.calcHistory.length > MAX_CALC_HISTORY) {
      state.calcHistory = state.calcHistory.slice(-MAX_CALC_HISTORY);
    }
    return state;
  };

  const aggressiveCleanup = () => {
    // 激进清理策略：当存储空间紧张时执行
    cleanupTempData();
    cleanupOldSnapshots();
    
    // 清理其他非关键数据
    const keysToCheck = [
      "profit_calc_activity_v10",
    ];
    
    keysToCheck.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data && data.length > 50 * 1024) { // 大于50KB
          // 对于活动日志，截断到100条
          if (key === "profit_calc_activity_v10") {
            try {
              let entries;
              if (data.startsWith("__COMPRESSED__:")) {
                entries = JSON.parse(LZString.decompressFromUTF16(data.slice(15)) || "[]");
              } else {
                entries = JSON.parse(data);
              }
              entries = entries.slice(0, 100);
              const serialized = JSON.stringify(entries);
              if (serialized.length > 10240) {
                localStorage.setItem(key, "__COMPRESSED__:" + LZString.compressToUTF16(serialized));
              } else {
                localStorage.setItem(key, serialized);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    });
    
    return true;
  };

  return {
    cleanupOldSnapshots,
    cleanupTempData,
    trimCalcHistory,
    aggressiveCleanup,
  };
})();

// 状态管理 Store
const Store = (() => {
  const STORAGE_KEY = "profit_calc_system_v10";
  const BACKUP_KEY = "profit_calc_system_v10_backup";
  const COMPRESSED_MARKER = "__COMPRESSED__:";
  const CURRENT_VERSION = "6.0.0"; // 升级版本以触发迁移
  const QUOTA_WARN_THRESHOLD = 0.85; // 85% 配额告警
  const QUOTA_CRITICAL_THRESHOLD = 0.95; // 95% 严重告警
  const MAX_DATA_SIZE = 4 * 1024 * 1024; // 4MB 数据大小告警阈值
  const SAVE_DEBOUNCE_MS = 200; // 保存防抖延迟
  const COMPRESS_THRESHOLD = 50 * 1024; // 50KB 以上启用压缩
  
  let _saveTimer = null;
  let _pendingState = null;
  let _lastSerialized = null; // 缓存上次序列化结果，避免重复序列化
  let _stateCache = null; // 状态缓存
  let _isDirty = false; // 状态是否已修改

  // ====== 数据版本迁移机制 ======
  const migrations = {
    "1.0.0": (state) => state,
    "2.0.0": (state) => {
      // 添加平台默认配置
      if (!state.platforms || !Array.isArray(state.platforms)) {
        state.platforms = [
          { id: "pdd", name: "拼多多", emoji: "🍊", shops: [] },
          { id: "tb", name: "淘宝", emoji: "🛒", shops: [] },
          { id: "dy", name: "抖音", emoji: "🎵", shops: [] },
        ];
      }
      return state;
    },
    "3.0.0": (state) => {
      // 添加 externals 和 batchData
      if (!state.externals || !Array.isArray(state.externals)) state.externals = [];
      if (!state.batchData || typeof state.batchData !== "object") state.batchData = {};
      return state;
    },
    "4.0.0": (state) => {
      // 添加 calcHistory
      if (!state.calcHistory || !Array.isArray(state.calcHistory)) state.calcHistory = [];
      return state;
    },
    "5.0.0": (state) => {
      // 添加 userSettings
      if (!state.userSettings || typeof state.userSettings !== "object") {
        state.userSettings = { theme: "light", language: "zh-CN", autoSave: true };
      }
      return state;
    },
    "5.7.0": (state) => {
      // 数据结构优化
      state = StorageCleaner.trimCalcHistory(state);
      return state;
    },
    "6.0.0": (state) => {
      // 启用压缩存储
      // 清理历史数据，确保数据结构完整
      state = StorageCleaner.trimCalcHistory(state);
      
      // 确保 _compressed 标记
      state._compressed = true;
      
      // 添加迁移日志
      ActivityLogger.add("数据迁移", `数据结构从 v${state._version || 'unknown'} 升级到 v${CURRENT_VERSION}`, { category: "system" });
      
      return state;
    },
  };

  // 执行迁移
  const runMigrations = (state, fromVersion) => {
    let version = fromVersion || "1.0.0";
    const sortedVersions = Object.keys(migrations).sort((a, b) => {
      const parseVersion = (v) => v.split(".").map(Number);
      const va = parseVersion(a);
      const vb = parseVersion(b);
      for (let i = 0; i < 3; i++) {
        if (va[i] !== vb[i]) return va[i] - vb[i];
      }
      return 0;
    });

    sortedVersions.forEach((v) => {
      if (v > version) {
        try {
          state = migrations[v](state);
          console.log(`Migration completed: ${version} -> ${v}`);
        } catch (e) {
          console.error(`Migration failed for version ${v}:`, e);
          StorageEvents.emit("warning", {
            source: "migration",
            message: `数据迁移失败：版本 ${v}`,
            error: e,
          });
        }
      }
    });

    return state;
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
        usedKB: Math.round(usedBytes / 1024),
        quotaKB: Math.round(estimatedQuota / 1024),
        isWarning: usage >= QUOTA_WARN_THRESHOLD && usage < QUOTA_CRITICAL_THRESHOLD,
        isCritical: usage >= QUOTA_CRITICAL_THRESHOLD,
        availableKB: Math.round((estimatedQuota - usedBytes) / 1024),
      };
    } catch (e) {
      return { usedBytes: 0, estimatedQuota: 0, usage: 0, isWarning: false, isCritical: false };
    }
  };

  // 压缩数据
  const compressData = (data) => {
    const serialized = JSON.stringify(data);
    if (serialized.length > COMPRESS_THRESHOLD) {
      return COMPRESSED_MARKER + LZString.compressToUTF16(serialized);
    }
    return serialized;
  };

  // 解压缩数据
  const decompressData = (raw) => {
    if (!raw) return null;
    if (raw.startsWith(COMPRESSED_MARKER)) {
      const compressed = raw.slice(COMPRESSED_MARKER.length);
      const decompressed = LZString.decompressFromUTF16(compressed);
      if (!decompressed) {
        throw new Error("Decompression failed");
      }
      return JSON.parse(decompressed);
    }
    return JSON.parse(raw);
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
        const parsed = decompressData(backupData);
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

  // 异常恢复：从快照恢复
  const restoreFromSnapshot = () => {
    try {
      const snapshots = Store.getSnapshots();
      if (snapshots.length === 0) return null;
      
      // 尝试最近的快照
      const recentSnapshot = snapshots[snapshots.length - 1];
      const data = localStorage.getItem(recentSnapshot.key);
      if (data) {
        const parsed = decompressData(data);
        if (validate(parsed)) {
          StorageEvents.emit("restored", { source: "snapshot", snapshot: recentSnapshot });
          return parsed;
        }
      }
    } catch (e) {
      StorageEvents.emit("error", { source: "snapshot", error: e });
    }
    return null;
  };

  // 加载状态
  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let state = decompressData(saved);
        let version = state._version || "1.0.0";

        // 确保基本结构存在
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

        // 执行版本迁移
        if (version !== CURRENT_VERSION) {
          state = runMigrations(state, version);
          state._version = CURRENT_VERSION;
          save(state, true); // 立即保存迁移后的数据
        }

        _stateCache = state;
        return state;
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
      StorageEvents.emit("error", { source: "load", error: e });
      
      // 尝试恢复策略
      let restored = restoreFromBackup();
      if (!restored) {
        restored = restoreFromSnapshot();
      }
      
      if (restored) {
        _stateCache = restored;
        return restored;
      }
      
      // 清理损坏的数据
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
            });
          }
        });
      });
    }
    if (Array.isArray(lite.calcHistory) && lite.calcHistory.length > 100) {
      lite.calcHistory = lite.calcHistory.slice(-100);
    }
    return lite;
  };

  // 保存状态（优化性能）
  const save = (state, immediate = false) => {
    try {
      const toSave = {
        ...state,
        _version: CURRENT_VERSION,
        _lastSaved: new Date().toISOString(),
        _compressed: true,
      };

      // 检查是否需要实际保存（避免不必要的序列化）
      const serialized = compressData(toSave);
      
      // 如果数据相同，跳过保存
      if (_lastSerialized === serialized && !immediate) {
        return;
      }
      
      _lastSerialized = serialized;

      // 数据大小告警
      const dataSize = serialized.length;
      if (dataSize > MAX_DATA_SIZE) {
        console.warn("Data size is large:", Math.round(dataSize / 1024), "KB");
        StorageEvents.emit("warning", {
          source: "size",
          size: dataSize,
          message: `数据量较大（${Math.round(dataSize / 1024)}KB），建议备份或清理历史数据`,
        });
      }

      // 配额检测
      const info = getStorageInfo();
      if (info.isCritical) {
        // 执行激进清理
        StorageCleaner.aggressiveCleanup();
        StorageEvents.emit("warning", {
          source: "quota",
          usage: info.usage,
          message: "浏览器存储空间即将用尽，已自动清理部分数据，请及时导出数据备份",
        });
      } else if (info.isWarning) {
        // 执行常规清理
        StorageCleaner.cleanupOldSnapshots();
        StorageCleaner.cleanupTempData();
        StorageEvents.emit("warning", {
          source: "quota",
          usage: info.usage,
          message: "存储空间使用率较高，建议清理历史数据或导出备份",
        });
      }

      localStorage.setItem(STORAGE_KEY, serialized);
      backup(serialized);
      
      _stateCache = toSave;
      _isDirty = false;
      
    } catch (e) {
      console.error("Failed to save:", e);
      StorageEvents.emit("error", { source: "save", error: e });

      // 降级策略 1：精简模式保存
      try {
        StorageCleaner.aggressiveCleanup();
        const lite = liteState(state);
        const liteSerialized = compressData({
          ...lite,
          _version: CURRENT_VERSION,
          _lastSaved: new Date().toISOString(),
          _compressed: true,
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
            _compressed: true,
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
    _compressed: true,
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
  
  // 优化后的防抖保存
  const debouncedSave = (newState) => {
    state = newState;
    _isDirty = true;
    subs.forEach((s) => s(state));
    
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (_isDirty) {
        save(state);
      }
      saveTimeout = null;
    }, SAVE_DEBOUNCE_MS);
  };

  // 页面关闭/刷新前立即保存，防止数据丢失
  if (typeof window !== "undefined") {
    const forceSave = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      if (_isDirty) {
        save(state);
      }
      saveTimeout = null;
    };
    const autoSnapshot = () => {
      try {
        Store.autoSnapshot();
      } catch (e) {}
    };
    window.addEventListener("beforeunload", forceSave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        forceSave();
        autoSnapshot();
      }
    });
    window.addEventListener("pagehide", forceSave);
    // 每30秒自动保存一次（仅当数据有变化）
    setInterval(() => {
      if (_isDirty) {
        forceSave();
      }
    }, 30000);
    // 每5分钟自动快照一次
    setInterval(autoSnapshot, 5 * 60 * 1000);
  }

  return {
    get: () => state,
    set: (fn) => {
      const newState = typeof fn === "function" ? fn(state) : { ...state, ...fn };
      newState._version = CURRENT_VERSION;
      newState._lastSaved = new Date().toISOString();
      debouncedSave(newState);
    },
    flush: () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      if (_isDirty) {
        save(state);
      }
      saveTimeout = null;
      return true;
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
      save(state, true);
      subs.forEach((s) => s(state));
    },
    getVersion: () => CURRENT_VERSION,
    getStorageInfo,
    exportData: () => JSON.stringify(state, null, 2),
    exportDataLite: () => {
      const lite = liteState(state);
      return JSON.stringify(lite, null, 2);
    },
    importData: (data) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (!parsed.platforms) throw new Error("无效的配置文件");
      if (!validate(parsed)) throw new Error("配置文件数据不完整或格式错误");
      state = { 
        ...parsed, 
        _version: CURRENT_VERSION, 
        _lastSaved: new Date().toISOString(),
        _compressed: true,
      };
      save(state, true);
      subs.forEach((s) => s(state));
    },
    createSnapshot: (label) => {
      try {
        const key = `snapshot_${Date.now()}_${label || "manual"}`;
        const data = compressData(state);
        localStorage.setItem(key, data);
        let snapshots = [];
        try {
          snapshots = JSON.parse(localStorage.getItem("profit_calc_snapshots") || "[]");
        } catch (e) {}
        snapshots.push({ key, time: Date.now(), label: label || "manual", size: data.length });
        
        // 保持快照数量限制
        const manualSnapshots = snapshots.filter(s => !s.key.startsWith("snapshot_auto_"));
        if (manualSnapshots.length > 10) {
          manualSnapshots.slice(0, -10).forEach(s => localStorage.removeItem(s.key));
          snapshots = snapshots.filter(s => s.key.startsWith("snapshot_auto_") || manualSnapshots.slice(-10).some(m => m.key === s.key));
        }
        
        localStorage.setItem("profit_calc_snapshots", JSON.stringify(snapshots.slice(-20)));
        return true;
      } catch (e) {
        return false;
      }
    },
    getSnapshots: () => {
      try {
        return JSON.parse(localStorage.getItem("profit_calc_snapshots") || "[]");
      } catch (e) {
        return [];
      }
    },
    restoreSnapshot: (key) => {
      try {
        const data = localStorage.getItem(key);
        if (!data) return false;
        const parsed = decompressData(data);
        if (!parsed.platforms) return false;
        state = { 
          ...parsed, 
          _version: CURRENT_VERSION, 
          _lastSaved: new Date().toISOString(),
          _compressed: true,
        };
        save(state, true);
        subs.forEach((s) => s(state));
        return true;
      } catch (e) {
        return false;
      }
    },
    autoSnapshot: () => {
      try {
        const key = `snapshot_auto_${Date.now()}`;
        const data = compressData(state);
        localStorage.setItem(key, data);
        let snapshots = [];
        try {
          snapshots = JSON.parse(localStorage.getItem("profit_calc_snapshots") || "[]");
        } catch (e) {}
        snapshots.push({ key, time: Date.now(), label: "auto", size: data.length });
        
        // 清理旧的自动快照
        StorageCleaner.cleanupOldSnapshots();
        
        localStorage.setItem("profit_calc_snapshots", JSON.stringify(snapshots.slice(-20)));
        return true;
      } catch (e) {
        return false;
      }
    },
    // 新增：存储清理功能
    cleanup: () => {
      StorageCleaner.cleanupOldSnapshots();
      StorageCleaner.cleanupTempData();
      StorageCleaner.aggressiveCleanup();
    },
    // 新增：获取压缩率信息
    getCompressionInfo: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        
        const decompressed = decompressData(raw);
        const rawSize = JSON.stringify(decompressed).length;
        const storedSize = raw.length;
        
        return {
          rawSizeKB: Math.round(rawSize / 1024),
          storedSizeKB: Math.round(storedSize / 1024),
          compressionRatio: storedSize / rawSize,
          isCompressed: raw.startsWith(COMPRESSED_MARKER),
          savedKB: Math.round((rawSize - storedSize) / 1024),
        };
      } catch (e) {
        return null;
      }
    },
    // 新增：恢复功能
    attemptRecovery: () => {
      let recovered = restoreFromBackup();
      if (!recovered) {
        recovered = restoreFromSnapshot();
      }
      if (recovered) {
        state = recovered;
        save(state, true);
        subs.forEach((s) => s(state));
        return true;
      }
      return false;
    },
    // 新增：LZString 工具访问
    LZString,
  };
})();