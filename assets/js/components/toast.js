// toast - Toast通知系统组件与Hook
const SoundManager = {
  _audioContext: null,
  _enabled: true,
  
  getAudioContext() {
    if (!this._audioContext) {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._audioContext;
  },
  
  setEnabled(enabled) {
    this._enabled = enabled;
  },
  
  playSuccess() {
    if (!this._enabled) return;
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },
  
  playError() {
    if (!this._enabled) return;
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },
  
  playWarning() {
    if (!this._enabled) return;
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(392, ctx.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(392, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  },
  
  playInfo() {
    if (!this._enabled) return;
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  },
};

const NotificationCenter = {
  _listeners: [],
  _notifications: [],
  _settings: null,
  getSettings() {
    if (!this._settings) {
      try {
        const saved = localStorage.getItem("app_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          this._settings = parsed.notificationSettings || {
            masterEnabled: true,
            calculationComplete: true,
            importComplete: true,
            exportComplete: true,
            versionUpdate: true,
            storageWarning: true,
          };
        } else {
          this._settings = {
            masterEnabled: true,
            calculationComplete: true,
            importComplete: true,
            exportComplete: true,
            versionUpdate: true,
            storageWarning: true,
          };
        }
      } catch (e) {
        this._settings = {
          masterEnabled: true,
          calculationComplete: true,
          importComplete: true,
          exportComplete: true,
          versionUpdate: true,
          storageWarning: true,
        };
      }
    }
    return this._settings;
  },
  refreshSettings() {
    this._settings = null;
    return this.getSettings();
  },
  isEnabled(notificationType) {
    const settings = this.getSettings();
    if (settings[notificationType] === undefined) return true;
    return settings[notificationType] !== false;
  },
  addNotification(notification) {
    const notif = {
      id: Utils.uniqueId(),
      time: new Date().toISOString(),
      read: false,
      ...notification,
    };
    this._notifications.unshift(notif);
    if (this._notifications.length > 100) {
      this._notifications = this._notifications.slice(0, 100);
    }
    try {
      localStorage.setItem("app_notifications", JSON.stringify(this._notifications));
    } catch (e) {}
    this._listeners.forEach((fn) => fn(this._notifications));
  },
  getNotifications() {
    if (this._notifications.length === 0) {
      try {
        const saved = localStorage.getItem("app_notifications");
        if (saved) {
          this._notifications = JSON.parse(saved);
        }
      } catch (e) {}
    }
    return this._notifications;
  },
  getUnreadCount() {
    return this.getNotifications().filter((n) => !n.read).length;
  },
  markAsRead(id) {
    this._notifications = this._notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    try {
      localStorage.setItem("app_notifications", JSON.stringify(this._notifications));
    } catch (e) {}
    this._listeners.forEach((fn) => fn(this._notifications));
  },
  markAllAsRead() {
    this._notifications = this._notifications.map((n) => ({ ...n, read: true }));
    try {
      localStorage.setItem("app_notifications", JSON.stringify(this._notifications));
    } catch (e) {}
    this._listeners.forEach((fn) => fn(this._notifications));
  },
  clearAll() {
    this._notifications = [];
    try {
      localStorage.removeItem("app_notifications");
    } catch (e) {}
    this._listeners.forEach((fn) => fn(this._notifications));
  },
  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  },
};

// 全局应用设置管理器 - 让系统设置真正控制网页行为
const AppSettings = {
  _cache: null,
  _listeners: [],

  _defaults: {
    autoSave: true,
    confirmDelete: true,
    language: "zh",
    autoUpdateCheck: true,
    sidebarDefaultCollapsed: false,
    defaultPlatform: "pdd",
    pageSize: 20,
    compactMode: false,
    animationEnabled: true,
  },

  get() {
    if (!this._cache) {
      try {
        const saved = localStorage.getItem("app_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          this._cache = { ...this._defaults, ...(parsed.appSettings || {}) };
        } else {
          this._cache = { ...this._defaults };
        }
      } catch (e) {
        this._cache = { ...this._defaults };
      }
    }
    return this._cache;
  },

  getSetting(key) {
    return this.get()[key];
  },

  shouldConfirmDelete() {
    return this.get().confirmDelete !== false;
  },

  isAutoSaveEnabled() {
    return this.get().autoSave !== false;
  },

  isAnimationEnabled() {
    return this.get().animationEnabled !== false;
  },

  getPageSize() {
    return this.get().pageSize || 20;
  },

  getDefaultPlatform() {
    return this.get().defaultPlatform || "pdd";
  },

  refresh() {
    this._cache = null;
    const settings = this.get();
    this._listeners.forEach((fn) => fn(settings));
    return settings;
  },

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  },
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, title, message, duration = 3000, options = {}) => {
    const { notificationType, saveToHistory = true, forceShow = false, sound = true } = options;
    const settings = NotificationCenter.getSettings();
    if (settings.masterEnabled === false && !forceShow && type !== "error") {
      return;
    }
    if (notificationType && !NotificationCenter.isEnabled(notificationType)) {
      return;
    }
    const id = Utils.uniqueId();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    if (sound) {
      if (type === "success") SoundManager.playSuccess();
      else if (type === "error") SoundManager.playError();
      else if (type === "warning") SoundManager.playWarning();
      else SoundManager.playInfo();
    }
    if (saveToHistory && notificationType && NotificationCenter.isEnabled(notificationType)) {
      NotificationCenter.addNotification({
        type,
        title,
        message,
        category: notificationType,
      });
    }
  }, []);

  const getIcon = (type) => {
    const props = { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
    if (type === "success") return React.createElement("svg", props, React.createElement("polyline", { points: "20 6 9 17 4 12" }));
    if (type === "error") return React.createElement("svg", props, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" }));
    if (type === "warning") return React.createElement("svg", props, React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }), React.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" }));
    return React.createElement("svg", props, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" }));
  };

  return React.createElement(ToastContext.Provider, { value: { addToast } },
    children,
    React.createElement("div", { className: "toast-container" },
      toasts.map(toast =>
        React.createElement("div", { key: toast.id, className: `toast ${toast.type}` },
          React.createElement("div", { className: "toast-icon" }, getIcon(toast.type)),
          React.createElement("div", { className: "toast-content" },
            React.createElement("div", { className: "toast-title" }, toast.title),
            React.createElement("div", { className: "toast-message" }, toast.message)
          )
        )
      )
    )
  );
};

const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {}, NotificationCenter, SoundManager };
  return { ...ctx, NotificationCenter, SoundManager };
};

// 模态框
