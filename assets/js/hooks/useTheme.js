// hooks/useTheme.js - 主题 Hook
// 功能：主题状态管理、主题切换、主题监听

(function() {
  const { useState, useEffect, useCallback, useMemo } = React;

  const useTheme = () => {
    const [theme, setThemeState] = useState('light');
    const [themes, setThemes] = useState({});

    useEffect(() => {
      const loadTheme = () => {
        if (window.ThemeService) {
          setThemeState(window.ThemeService.getCurrentTheme());
          setThemes(window.ThemeService.getThemes() || {});
        } else {
          const saved = localStorage.getItem('shopdata_theme') || 'light';
          setThemeState(saved);
        }
      };

      loadTheme();

      if (window.ThemeService && typeof window.ThemeService.onThemeChange === 'function') {
        return window.ThemeService.onThemeChange((newTheme) => {
          setThemeState(newTheme);
        });
      }

      const handleStorageChange = (e) => {
        if (e.key === 'shopdata_theme') {
          setThemeState(e.newValue || 'light');
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const setTheme = useCallback((themeName) => {
      if (window.ThemeService) {
        window.ThemeService.applyTheme(themeName);
      } else {
        localStorage.setItem('shopdata_theme', themeName);
        document.body.setAttribute('data-theme', themeName);
        setThemeState(themeName);
      }
    }, []);

    const toggleTheme = useCallback(() => {
      if (window.ThemeService) {
        const newTheme = window.ThemeService.toggleTheme();
        setThemeState(newTheme);
      } else {
        const themeNames = ['light', 'dark'];
        const currentIndex = themeNames.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        setTheme(themeNames[nextIndex]);
      }
    }, [theme, setTheme]);

    const isDark = useMemo(() => {
      return theme === 'dark';
    }, [theme]);

    const themeList = useMemo(() => {
      return Object.keys(themes);
    }, [themes]);

    const getThemeInfo = useCallback((themeName) => {
      if (window.ThemeService) {
        return window.ThemeService.getThemeInfo(themeName);
      }
      return null;
    }, []);

    const getCSSVariable = useCallback((name) => {
      if (window.ThemeService) {
        return window.ThemeService.getCSSVariable(name);
      }
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }, []);

    const addCustomTheme = useCallback((name, config) => {
      if (window.ThemeService) {
        const result = window.ThemeService.addCustomTheme(name, config);
        if (result) {
          setThemes(window.ThemeService.getThemes() || {});
        }
        return result;
      }
      return false;
    }, []);

    const removeCustomTheme = useCallback((name) => {
      if (window.ThemeService) {
        const result = window.ThemeService.removeCustomTheme(name);
        if (result) {
          setThemes(window.ThemeService.getThemes() || {});
        }
        return result;
      }
      return false;
    }, []);

    return {
      theme,
      themes,
      themeList,
      isDark,
      setTheme,
      toggleTheme,
      getThemeInfo,
      getCSSVariable,
      addCustomTheme,
      removeCustomTheme,
    };
  };

  window.useTheme = useTheme;
})();
