// services/notificationService.js - 全局通知中心系统
// 功能：通知声音、Toast提示、Alert对话框、Confirm确认框、桌面通知、徽章通知、通知历史、配置管理

(function() {
  const STORAGE_KEYS = {
    SETTINGS: 'app_notification_settings',
    HISTORY: 'app_notifications_history',
    SOUND: 'app_sound_enabled',
  };

  const DEFAULT_SETTINGS = {
    masterEnabled: true,
    soundEnabled: true,
    desktopEnabled: false,
    badgeEnabled: true,
    toastEnabled: true,
    toastPosition: 'top-right',
    toastDuration: 3000,
    types: {
      success: true,
      error: true,
      warning: true,
      info: true,
      loading: true,
      custom: true,
    },
    volume: 0.3,
  };

  const POSITIONS = {
    'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto', direction: 'translateX(120%)' },
    'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto', direction: 'translateX(-120%)' },
    'bottom-right': { bottom: '20px', right: '20px', left: 'auto', top: 'auto', direction: 'translateX(120%)' },
    'bottom-left': { bottom: '20px', left: '20px', right: 'auto', top: 'auto', direction: 'translateX(-120%)' },
    'top-center': { top: '20px', left: '50%', right: 'auto', bottom: 'auto', direction: 'translateY(-120%)', transform: 'translateX(-50%)' },
  };

  let _settings = null;
  let _history = [];
  let _listeners = [];
  let _audioContext = null;
  let _toastContainer = null;
  let _badgeCount = 0;
  let _badgeElement = null;
  let _loadingOverlay = null;

  const NotificationCenter = {
    init() {
      this._loadSettings();
      this._loadHistory();
      this._initToastContainer();
      this._requestDesktopPermission();
      this._initBadge();
    },

    _loadSettings() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (saved) {
          const parsed = JSON.parse(saved);
          _settings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            types: { ...DEFAULT_SETTINGS.types, ...(parsed.types || {}) },
          };
        } else {
          _settings = { ...DEFAULT_SETTINGS };
        }
      } catch (e) {
        _settings = { ...DEFAULT_SETTINGS };
      }
    },

    _saveSettings() {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(_settings));
      } catch (e) {}
    },

    _loadHistory() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (saved) {
          _history = JSON.parse(saved);
        }
      } catch (e) {
        _history = [];
      }
    },

    _saveHistory() {
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(_history));
      } catch (e) {}
    },

    getSettings() {
      return { ..._settings };
    },

    updateSettings(newSettings) {
      _settings = {
        ..._settings,
        ...newSettings,
        types: { ..._settings.types, ...(newSettings.types || {}) },
      };
      this._saveSettings();
      this._notifyListeners('settings', _settings);
      return this.getSettings();
    },

    setMasterEnabled(enabled) {
      _settings.masterEnabled = enabled;
      this._saveSettings();
      this._notifyListeners('settings', _settings);
    },

    setSoundEnabled(enabled) {
      _settings.soundEnabled = enabled;
      this._saveSettings();
      this._notifyListeners('settings', _settings);
    },

    setDesktopEnabled(enabled) {
      _settings.desktopEnabled = enabled;
      this._saveSettings();
      this._notifyListeners('settings', _settings);
    },

    setToastPosition(position) {
      if (POSITIONS[position]) {
        _settings.toastPosition = position;
        this._saveSettings();
        this._updateToastContainerPosition();
        this._notifyListeners('settings', _settings);
      }
    },

    setToastDuration(duration) {
      _settings.toastDuration = Math.max(1000, Math.min(10000, duration));
      this._saveSettings();
      this._notifyListeners('settings', _settings);
    },

    setVolume(volume) {
      _settings.volume = Math.max(0, Math.min(1, volume));
      this._saveSettings();
      this._notifyListeners('settings', _settings);
    },

    isTypeEnabled(type) {
      if (!_settings.masterEnabled) return false;
      if (_settings.types[type] === false) return false;
      return true;
    },

    _getAudioContext() {
      if (!_audioContext) {
        _audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      return _audioContext;
    },

    playSound(type = 'info') {
      if (!_settings.soundEnabled || !_settings.masterEnabled) return;

      try {
        const ctx = this._getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const volume = _settings.volume || 0.3;
        const now = ctx.currentTime;

        const playTone = (freq, startTime, duration, oscType = 'sine', gainValue = volume) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration + 0.02);
        };

        switch (type) {
          case 'success':
            playTone(523.25, now, 0.12, 'sine', volume);
            playTone(659.25, now + 0.1, 0.12, 'sine', volume);
            playTone(783.99, now + 0.2, 0.15, 'sine', volume * 0.8);
            break;
          case 'error':
            playTone(300, now, 0.1, 'sawtooth', volume * 0.8);
            playTone(220, now + 0.12, 0.1, 'sawtooth', volume * 0.8);
            playTone(160, now + 0.24, 0.15, 'sawtooth', volume * 0.6);
            break;
          case 'warning':
            playTone(440, now, 0.08, 'triangle', volume);
            playTone(440, now + 0.12, 0.08, 'triangle', volume);
            break;
          case 'info':
            playTone(523.25, now, 0.1, 'sine', volume * 0.7);
            break;
          case 'confirm':
            playTone(440, now, 0.08, 'sine', volume);
            playTone(523.25, now + 0.08, 0.1, 'sine', volume);
            break;
          default:
            playTone(440, now, 0.1, 'sine', volume * 0.5);
        }
      } catch (e) {}
    },

    _initToastContainer() {
      if (_toastContainer) return;

      _toastContainer = document.createElement('div');
      _toastContainer.className = 'notification-toast-container';
      _toastContainer.style.cssText = `
        position: fixed;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 380px;
        pointer-events: none;
      `;
      this._updateToastContainerPosition();
      document.body.appendChild(_toastContainer);
    },

    _updateToastContainerPosition() {
      if (!_toastContainer) return;
      const pos = POSITIONS[_settings.toastPosition] || POSITIONS['top-right'];
      _toastContainer.style.top = pos.top || 'auto';
      _toastContainer.style.right = pos.right || 'auto';
      _toastContainer.style.bottom = pos.bottom || 'auto';
      _toastContainer.style.left = pos.left || 'auto';
      if (pos.transform) {
        _toastContainer.style.transform = pos.transform;
      }
    },

    _getIconSVG(type) {
      const props = { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };
      switch (type) {
        case 'success':
          return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        case 'error':
          return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        case 'warning':
          return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        case 'loading':
          return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-spinner"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>';
        default:
          return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      }
    },

    toast(message, options = {}) {
      const {
        type = 'info',
        title,
        duration,
        sound = true,
        saveToHistory = true,
        notificationType,
        forceShow = false,
        onClick,
        actionText,
        onAction,
      } = options;

      if (!forceShow && !this.isTypeEnabled(type)) return null;
      if (notificationType && !this.isTypeEnabled(notificationType)) return null;
      if (!_settings.toastEnabled && !forceShow) return null;

      if (typeof window.Toast !== 'undefined' && window.Toast.show) {
        window.Toast.show(message, { type, duration: duration || _settings.toastDuration });
        if (sound) this.playSound(type);
        if (saveToHistory) this._addToHistory({ type, title: title || message, message, notificationType });
        return null;
      }

      this._initToastContainer();

      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const toastEl = document.createElement('div');
      toastEl.id = id;
      toastEl.className = `notification-toast notification-toast-${type}`;
      toastEl.style.cssText = `
        background: var(--color-bg-primary, #ffffff);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        padding: 14px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 280px;
        max-width: 380px;
        border-left: 4px solid var(--color-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'}, #6366f1);
        transform: ${POSITIONS[_settings.toastPosition]?.direction || 'translateX(120%)'};
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        pointer-events: auto;
        cursor: ${onClick || onAction ? 'pointer' : 'default'};
      `;

      const colorVar = type === 'success' ? '--color-success' : type === 'error' ? '--color-danger' : type === 'warning' ? '--color-warning' : '--color-info';

      toastEl.innerHTML = `
        <div class="toast-icon" style="flex-shrink: 0; color: var(${colorVar}, #6366f1); margin-top: 2px;">
          ${this._getIconSVG(type)}
        </div>
        <div class="toast-content" style="flex: 1; min-width: 0;">
          ${title ? `<div class="toast-title" style="font-weight: 600; font-size: 14px; color: var(--color-text-primary, #1a1a2e); margin-bottom: 4px;">${title}</div>` : ''}
          <div class="toast-message" style="font-size: 13px; color: var(--color-text-secondary, #4a4a68); line-height: 1.5; word-break: break-word;">${message}</div>
          ${actionText && onAction ? `<div class="toast-action" style="margin-top: 8px;"><button class="toast-action-btn" data-action="true" style="background: none; border: none; color: var(${colorVar}, #6366f1); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0;">${actionText}</button></div>` : ''}
        </div>
        <button class="toast-close" data-close="true" style="flex-shrink: 0; background: none; border: none; color: var(--color-text-tertiary, #8b8ba7); cursor: pointer; padding: 4px; margin: -4px; font-size: 16px; line-height: 1;">×</button>
      `;

      _toastContainer.appendChild(toastEl);

      requestAnimationFrame(() => {
        toastEl.style.transform = 'translateX(0) translateY(0)';
        toastEl.style.opacity = '1';
      });

      const closeToast = () => {
        toastEl.style.transform = POSITIONS[_settings.toastPosition]?.direction || 'translateX(120%)';
        toastEl.style.opacity = '0';
        setTimeout(() => {
          if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
          }
        }, 300);
      };

      toastEl.querySelector('[data-close="true"]').addEventListener('click', (e) => {
        e.stopPropagation();
        closeToast();
      });

      if (onClick) {
        toastEl.addEventListener('click', (e) => {
          if (!e.target.closest('[data-close="true"]') && !e.target.closest('[data-action="true"]')) {
            onClick();
            closeToast();
          }
        });
      }

      if (actionText && onAction) {
        toastEl.querySelector('[data-action="true"]').addEventListener('click', (e) => {
          e.stopPropagation();
          onAction();
          closeToast();
        });
      }

      const closeDuration = duration || _settings.toastDuration;
      if (type !== 'loading' && closeDuration > 0) {
        setTimeout(closeToast, closeDuration);
      }

      if (sound) this.playSound(type);
      if (saveToHistory) this._addToHistory({ type, title: title || message, message, notificationType });

      return {
        id,
        close: closeToast,
        update: (newMessage, newOptions = {}) => {
          const msgEl = toastEl.querySelector('.toast-message');
          if (msgEl) msgEl.textContent = newMessage;
          if (newOptions.title) {
            const titleEl = toastEl.querySelector('.toast-title');
            if (titleEl) titleEl.textContent = newOptions.title;
          }
        }
      };
    },

    success(message, options = {}) {
      return this.toast(message, { ...options, type: 'success' });
    },

    error(message, options = {}) {
      return this.toast(message, { ...options, type: 'error' });
    },

    warning(message, options = {}) {
      return this.toast(message, { ...options, type: 'warning' });
    },

    info(message, options = {}) {
      return this.toast(message, { ...options, type: 'info' });
    },

    loading(message = '加载中...', options = {}) {
      return this.toast(message, { ...options, type: 'loading', duration: 0, sound: false, saveToHistory: false });
    },

    alert(title, message, options = {}) {
      return new Promise((resolve) => {
        if (typeof window.AlertModal !== 'undefined' && window.React && window.ReactDOM) {
          const container = document.createElement('div');
          document.body.appendChild(container);

          const onConfirm = () => {
            ReactDOM.unmountComponentAtNode(container);
            if (container.parentNode) container.parentNode.removeChild(container);
            resolve();
          };

          const element = React.createElement(window.AlertModal, {
            title: title || '提示',
            message: message,
            type: options.type || 'info',
            confirmText: options.confirmText || '我知道了',
            onConfirm: onConfirm,
          });

          ReactDOM.render(element, container);
          this.playSound('info');
          return;
        }

        if (window.alert) {
          window.alert(message || title);
          resolve();
        }
      });
    },

    confirm(title, message, options = {}) {
      return new Promise((resolve) => {
        if (typeof window.ConfirmModal !== 'undefined' && window.React && window.ReactDOM) {
          const container = document.createElement('div');
          document.body.appendChild(container);

          const onConfirm = () => {
            ReactDOM.unmountComponentAtNode(container);
            if (container.parentNode) container.parentNode.removeChild(container);
            resolve(true);
          };

          const onCancel = () => {
            ReactDOM.unmountComponentAtNode(container);
            if (container.parentNode) container.parentNode.removeChild(container);
            resolve(false);
          };

          const element = React.createElement(window.ConfirmModal, {
            title: title || '确认操作',
            message: message,
            type: options.type || 'warning',
            confirmText: options.confirmText || '确认',
            cancelText: options.cancelText || '取消',
            onConfirm: onConfirm,
            onCancel: onCancel,
          });

          ReactDOM.render(element, container);
          this.playSound('confirm');
          return;
        }

        if (window.confirm) {
          const result = window.confirm(message || title);
          resolve(result);
        } else {
          resolve(true);
        }
      });
    },

    _requestDesktopPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            _settings.desktopEnabled = true;
            this._saveSettings();
          }
        }).catch(() => {});
      }
    },

    requestDesktopPermission() {
      if (!('Notification' in window)) return Promise.resolve(false);
      return Notification.requestPermission().then((perm) => {
        const granted = perm === 'granted';
        _settings.desktopEnabled = granted;
        this._saveSettings();
        return granted;
      });
    },

    desktopNotification(title, options = {}) {
      if (!('Notification' in window)) return false;
      if (!_settings.desktopEnabled || !_settings.masterEnabled) return false;
      if (Notification.permission !== 'granted') return false;

      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
        });

        if (options.onClick) {
          notification.onclick = (e) => {
            e.preventDefault();
            window.focus();
            options.onClick();
            notification.close();
          };
        }

        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), options.duration || 5000);
        }

        this._addToHistory({
          type: 'info',
          title,
          message: options.body || '',
          isDesktop: true,
        });

        return notification;
      } catch (e) {
        return false;
      }
    },

    _initBadge() {
      _badgeCount = this.getUnreadCount();
    },

    setBadgeCount(count) {
      _badgeCount = Math.max(0, count);
      this._updateBadgeElement();
      this._notifyListeners('badge', _badgeCount);
    },

    incrementBadge() {
      this.setBadgeCount(_badgeCount + 1);
    },

    decrementBadge() {
      this.setBadgeCount(Math.max(0, _badgeCount - 1));
    },

    getBadgeCount() {
      return _badgeCount;
    },

    createBadgeElement(targetElement, options = {}) {
      if (!targetElement) return null;

      const badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.style.cssText = `
        position: absolute;
        top: ${options.offsetY || '-4px'};
        right: ${options.offsetX || '-4px'};
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        background: var(--color-danger, #ef4444);
        color: #ffffff;
        border-radius: 9px;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        pointer-events: none;
        z-index: 10;
      `;

      const updateBadge = () => {
        if (_badgeCount > 0) {
          badge.textContent = _badgeCount > 99 ? '99+' : _badgeCount;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      };

      targetElement.style.position = targetElement.style.position || 'relative';
      targetElement.appendChild(badge);
      updateBadge();

      const listener = this.onBadgeChange(updateBadge);
      return {
        element: badge,
        destroy: () => {
          listener();
          if (badge.parentNode) badge.parentNode.removeChild(badge);
        }
      };
    },

    _updateBadgeElement() {},

    _addToHistory(notification) {
      const item = {
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        time: new Date().toISOString(),
        read: false,
        ...notification,
      };

      _history.unshift(item);
      if (_history.length > 200) {
        _history = _history.slice(0, 200);
      }

      this._saveHistory();
      this.incrementBadge();
      this._notifyListeners('history', _history);
    },

    getHistory(options = {}) {
      let result = [..._history];
      if (options.type) {
        result = result.filter(n => n.type === options.type);
      }
      if (options.read !== undefined) {
        result = result.filter(n => n.read === options.read);
      }
      if (options.limit) {
        result = result.slice(0, options.limit);
      }
      return result;
    },

    getUnreadCount() {
      return _history.filter(n => !n.read).length;
    },

    markAsRead(id) {
      const wasUnread = _history.some(n => n.id === id && !n.read);
      _history = _history.map(n => n.id === id ? { ...n, read: true } : n);
      this._saveHistory();
      if (wasUnread) this.decrementBadge();
      this._notifyListeners('history', _history);
    },

    markAllAsRead() {
      const unreadCount = this.getUnreadCount();
      _history = _history.map(n => ({ ...n, read: true }));
      this._saveHistory();
      this.setBadgeCount(0);
      this._notifyListeners('history', _history);
    },

    clearHistory() {
      _history = [];
      this._saveHistory();
      this.setBadgeCount(0);
      this._notifyListeners('history', _history);
    },

    showLoading(message = '加载中...') {
      if (_loadingOverlay) {
        const msgEl = _loadingOverlay.querySelector('.loading-message');
        if (msgEl) msgEl.textContent = message;
        return () => this.hideLoading();
      }

      _loadingOverlay = document.createElement('div');
      _loadingOverlay.className = 'global-loading-overlay';
      _loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(2px);
      `;

      _loadingOverlay.innerHTML = `
        <div style="
          background: var(--color-bg-primary, #ffffff);
          padding: 28px 40px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        ">
          <div class="loading-spinner" style="
            width: 28px;
            height: 28px;
            border: 3px solid var(--color-border, #e5e7eb);
            border-top-color: var(--color-primary, #6366f1);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          "></div>
          <span class="loading-message" style="
            color: var(--color-text-primary, #1a1a2e);
            font-size: 15px;
            font-weight: 500;
          ">${message}</span>
        </div>
      `;

      if (!document.getElementById('loading-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'loading-spinner-style';
        style.textContent = `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .toast-spinner {
            animation: spin 1s linear infinite;
            transform-origin: center;
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(_loadingOverlay);

      return () => this.hideLoading();
    },

    hideLoading() {
      if (_loadingOverlay && _loadingOverlay.parentNode) {
        _loadingOverlay.parentNode.removeChild(_loadingOverlay);
      }
      _loadingOverlay = null;
    },

    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      _listeners.push(callback);
      return () => {
        _listeners = _listeners.filter(l => l !== callback);
      };
    },

    onHistoryChange(callback) {
      if (typeof callback !== 'function') return () => {};
      const listener = (type, data) => {
        if (type === 'history') callback(data);
      };
      return this.subscribe(listener);
    },

    onBadgeChange(callback) {
      if (typeof callback !== 'function') return () => {};
      const listener = (type, data) => {
        if (type === 'badge') callback(data);
      };
      return this.subscribe(listener);
    },

    onSettingsChange(callback) {
      if (typeof callback !== 'function') return () => {};
      const listener = (type, data) => {
        if (type === 'settings') callback(data);
      };
      return this.subscribe(listener);
    },

    _notifyListeners(type, data) {
      _listeners.forEach(fn => {
        try {
          fn(type, data);
        } catch (e) {
          console.error('Notification listener error:', e);
        }
      });
    },

    notify(message, options = {}) {
      return this.toast(message, options);
    },
  };

  NotificationCenter.init();

  window.NotificationCenter = NotificationCenter;

  if (!window.Services) {
    window.Services = {};
  }
  window.Services.Notification = NotificationCenter;

  if (!window.NotificationService) {
    window.NotificationService = NotificationCenter;
  }
})();
