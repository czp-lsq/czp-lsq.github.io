// hooks/useNotification.js - 通知 Hook
// 功能：提供便捷的通知方法供 React 组件使用

(function() {
  const { useState, useEffect, useCallback, useRef, useMemo } = React;

  const useNotification = () => {
    const notificationCenter = useMemo(() => {
      return window.NotificationCenter || window.Services?.Notification || window.NotificationService || null;
    }, []);

    const [unreadCount, setUnreadCount] = useState(0);
    const [history, setHistory] = useState([]);
    const [settings, setSettings] = useState(null);
    const loadingRef = useRef(null);

    useEffect(() => {
      if (!notificationCenter) return;

      setUnreadCount(notificationCenter.getUnreadCount());
      setHistory(notificationCenter.getHistory());
      setSettings(notificationCenter.getSettings());

      const unsubscribe = notificationCenter.subscribe((type, data) => {
        if (type === 'badge') {
          setUnreadCount(data);
        } else if (type === 'history') {
          setHistory([...data]);
        } else if (type === 'settings') {
          setSettings({ ...data });
        }
      });

      return unsubscribe;
    }, [notificationCenter]);

    const notify = useCallback((message, options = {}) => {
      if (!notificationCenter) return null;
      return notificationCenter.toast(message, options);
    }, [notificationCenter]);

    const success = useCallback((message, options = {}) => {
      if (!notificationCenter) return null;
      return notificationCenter.success(message, options);
    }, [notificationCenter]);

    const error = useCallback((message, options = {}) => {
      if (!notificationCenter) return null;
      return notificationCenter.error(message, options);
    }, [notificationCenter]);

    const warning = useCallback((message, options = {}) => {
      if (!notificationCenter) return null;
      return notificationCenter.warning(message, options);
    }, [notificationCenter]);

    const info = useCallback((message, options = {}) => {
      if (!notificationCenter) return null;
      return notificationCenter.info(message, options);
    }, [notificationCenter]);

    const alert = useCallback((title, message, options = {}) => {
      if (!notificationCenter) return Promise.resolve();
      return notificationCenter.alert(title, message, options);
    }, [notificationCenter]);

    const confirm = useCallback((title, message, options = {}) => {
      if (!notificationCenter) return Promise.resolve(true);
      return notificationCenter.confirm(title, message, options);
    }, [notificationCenter]);

    const loading = useCallback((message = '加载中...', options = {}) => {
      if (!notificationCenter) {
        return { close: () => {}, update: () => {} };
      }

      if (loadingRef.current) {
        loadingRef.current.close();
      }

      const toast = notificationCenter.loading(message, options);
      loadingRef.current = toast;

      const close = () => {
        if (toast && toast.close) {
          toast.close();
        }
        if (loadingRef.current === toast) {
          loadingRef.current = null;
        }
      };

      const update = (newMessage, newOptions = {}) => {
        if (toast && toast.update) {
          toast.update(newMessage, newOptions);
        }
      };

      return { close, update };
    }, [notificationCenter]);

    const showLoading = useCallback((message = '加载中...') => {
      if (!notificationCenter) return () => {};
      return notificationCenter.showLoading(message);
    }, [notificationCenter]);

    const hideLoading = useCallback(() => {
      if (!notificationCenter) return;
      notificationCenter.hideLoading();
    }, [notificationCenter]);

    const playSound = useCallback((type = 'info') => {
      if (!notificationCenter) return;
      notificationCenter.playSound(type);
    }, [notificationCenter]);

    const desktopNotification = useCallback((title, options = {}) => {
      if (!notificationCenter) return false;
      return notificationCenter.desktopNotification(title, options);
    }, [notificationCenter]);

    const markAsRead = useCallback((id) => {
      if (!notificationCenter) return;
      notificationCenter.markAsRead(id);
    }, [notificationCenter]);

    const markAllAsRead = useCallback(() => {
      if (!notificationCenter) return;
      notificationCenter.markAllAsRead();
    }, [notificationCenter]);

    const clearHistory = useCallback(() => {
      if (!notificationCenter) return;
      notificationCenter.clearHistory();
    }, [notificationCenter]);

    const getHistory = useCallback((options = {}) => {
      if (!notificationCenter) return [];
      return notificationCenter.getHistory(options);
    }, [notificationCenter]);

    const getSettings = useCallback(() => {
      if (!notificationCenter) return null;
      return notificationCenter.getSettings();
    }, [notificationCenter]);

    const updateSettings = useCallback((newSettings) => {
      if (!notificationCenter) return null;
      return notificationCenter.updateSettings(newSettings);
    }, [notificationCenter]);

    const createBadge = useCallback((element, options = {}) => {
      if (!notificationCenter) return null;
      return notificationCenter.createBadgeElement(element, options);
    }, [notificationCenter]);

    useEffect(() => {
      return () => {
        if (loadingRef.current && loadingRef.current.close) {
          loadingRef.current.close();
        }
      };
    }, []);

    return {
      notify,
      success,
      error,
      warning,
      info,
      alert,
      confirm,
      loading,
      showLoading,
      hideLoading,
      playSound,
      desktopNotification,
      markAsRead,
      markAllAsRead,
      clearHistory,
      getHistory,
      getSettings,
      updateSettings,
      createBadge,
      unreadCount,
      history,
      settings,
      notificationCenter,
    };
  };

  window.useNotification = useNotification;
})();
