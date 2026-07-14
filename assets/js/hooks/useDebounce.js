// hooks/useDebounce.js - 防抖 Hook
// 功能：值防抖、函数防抖、延迟执行

(function() {
  const { useState, useEffect, useCallback, useRef } = React;

  const useDebounce = (value, delay = 300, options = {}) => {
    const { leading = false, trailing = true } = options;
    const [debouncedValue, setDebouncedValue] = useState(value);
    const isLeadingRef = useRef(true);
    const timerRef = useRef(null);

    useEffect(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (leading && isLeadingRef.current) {
        setDebouncedValue(value);
        isLeadingRef.current = false;
        timerRef.current = setTimeout(() => {
          isLeadingRef.current = true;
        }, delay);
        return;
      }

      if (trailing) {
        timerRef.current = setTimeout(() => {
          setDebouncedValue(value);
          isLeadingRef.current = true;
        }, delay);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [value, delay, leading, trailing]);

    return debouncedValue;
  };

  const useDebouncedCallback = (callback, delay = 300, options = {}) => {
    const { leading = false, trailing = true, maxWait } = options;
    const timerRef = useRef(null);
    const maxWaitTimerRef = useRef(null);
    const lastCallTimeRef = useRef(null);
    const callbackRef = useRef(callback);
    const isLeadingRef = useRef(true);

    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    const debounced = useCallback((...args) => {
      const now = Date.now();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (maxWait && !maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => {
          if (lastCallTimeRef.current && timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            callbackRef.current(...args);
            lastCallTimeRef.current = Date.now();
          }
          maxWaitTimerRef.current = null;
        }, maxWait);
      }

      if (leading && isLeadingRef.current) {
        callbackRef.current(...args);
        isLeadingRef.current = false;
        lastCallTimeRef.current = now;

        timerRef.current = setTimeout(() => {
          isLeadingRef.current = true;
          if (maxWaitTimerRef.current) {
            clearTimeout(maxWaitTimerRef.current);
            maxWaitTimerRef.current = null;
          }
        }, delay);
        return;
      }

      if (trailing) {
        timerRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastCallTimeRef.current = Date.now();
          isLeadingRef.current = true;
          timerRef.current = null;
          if (maxWaitTimerRef.current) {
            clearTimeout(maxWaitTimerRef.current);
            maxWaitTimerRef.current = null;
          }
        }, delay);
      }
    }, [delay, leading, trailing, maxWait]);

    const cancel = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
        maxWaitTimerRef.current = null;
      }
      isLeadingRef.current = true;
    }, []);

    const flush = useCallback((...args) => {
      cancel();
      callbackRef.current(...args);
    }, [cancel]);

    return [
      debounced,
      {
        cancel,
        flush,
      },
    ];
  };

  const useThrottle = (callback, limit = 300) => {
    const timerRef = useRef(null);
    const callbackRef = useRef(callback);
    const lastRunRef = useRef(0);

    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    const throttled = useCallback((...args) => {
      const now = Date.now();
      const remaining = limit - (now - lastRunRef.current);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          timerRef.current = null;
          callbackRef.current(...args);
        }, remaining);
      }
    }, [limit]);

    const cancel = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    return [throttled, { cancel }];
  };

  window.useDebounce = useDebounce;
  window.useDebouncedCallback = useDebouncedCallback;
  window.useThrottle = useThrottle;
})();
