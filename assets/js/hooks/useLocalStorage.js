// hooks/useLocalStorage.js - 本地存储 Hook
// 功能：localStorage 状态同步、序列化、事件监听

(function() {
  const { useState, useEffect, useCallback, useRef } = React;

  const useLocalStorage = (key, initialValue, options = {}) => {
    const {
      prefix = 'shopdata_',
      serializer = JSON.stringify,
      deserializer = JSON.parse,
      syncAcrossTabs = true,
    } = options;

    const prefixedKey = prefix + key;
    const isFirstRender = useRef(true);

    const [storedValue, setStoredValue] = useState(() => {
      try {
        const item = localStorage.getItem(prefixedKey);
        return item ? deserializer(item) : initialValue;
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        return initialValue;
      }
    });

    const setValue = useCallback((value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(prefixedKey, serializer(valueToStore));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
    }, [prefixedKey, storedValue, serializer]);

    const removeValue = useCallback(() => {
      try {
        localStorage.removeItem(prefixedKey);
        setStoredValue(initialValue);
      } catch (e) {
        console.error('Error removing from localStorage:', e);
      }
    }, [prefixedKey, initialValue]);

    useEffect(() => {
      if (!syncAcrossTabs) return;

      const handleStorageChange = (e) => {
        if (e.key === prefixedKey && e.newValue !== null) {
          try {
            const newValue = deserializer(e.newValue);
            setStoredValue(newValue);
          } catch (e2) {}
        }
        if (e.key === prefixedKey && e.newValue === null) {
          setStoredValue(initialValue);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [prefixedKey, syncAcrossTabs, deserializer, initialValue]);

    const reset = useCallback(() => {
      setValue(initialValue);
    }, [setValue, initialValue]);

    const updateStoredValue = useCallback((updater) => {
      setValue(prev => {
        const updated = updater(prev);
        return updated;
      });
    }, [setValue]);

    return [
      storedValue,
      setValue,
      {
        remove: removeValue,
        reset,
        update: updateStoredValue,
        key: prefixedKey,
      },
    ];
  };

  window.useLocalStorage = useLocalStorage;
})();
