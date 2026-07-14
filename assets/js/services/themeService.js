// services/themeService.js - 主题服务
// 功能：主题切换、自定义主题、主题持久化

(function() {
  const THEME_KEY = 'shopdata_theme';
  const CUSTOM_THEMES_KEY = 'shopdata_custom_themes';

  const defaultThemes = {
    light: {
      name: '浅色模式',
      variables: {
        '--color-bg-primary': '#ffffff',
        '--color-bg-secondary': '#f8f9fa',
        '--color-bg-tertiary': '#f1f3f5',
        '--color-text-primary': '#1a1a2e',
        '--color-text-secondary': '#4a4a68',
        '--color-text-tertiary': '#8b8ba7',
        '--color-border': '#e5e7eb',
        '--color-primary': '#6366f1',
        '--color-primary-hover': '#4f46e5',
        '--color-success': '#10b981',
        '--color-warning': '#f59e0b',
        '--color-danger': '#ef4444',
        '--color-info': '#3b82f6',
      }
    },
    dark: {
      name: '深色模式',
      variables: {
        '--color-bg-primary': '#0f0f23',
        '--color-bg-secondary': '#1a1a2e',
        '--color-bg-tertiary': '#252547',
        '--color-text-primary': '#e2e8f0',
        '--color-text-secondary': '#94a3b8',
        '--color-text-tertiary': '#64748b',
        '--color-border': '#2d2d4a',
        '--color-primary': '#818cf8',
        '--color-primary-hover': '#6366f1',
        '--color-success': '#34d399',
        '--color-warning': '#fbbf24',
        '--color-danger': '#f87171',
        '--color-info': '#60a5fa',
      }
    },
    sepia: {
      name: '护眼模式',
      variables: {
        '--color-bg-primary': '#fef7ed',
        '--color-bg-secondary': '#fef3e2',
        '--color-bg-tertiary': '#fde6c4',
        '--color-text-primary': '#5c4a3a',
        '--color-text-secondary': '#7c6a5a',
        '--color-text-tertiary': '#9c8a7a',
        '--color-border': '#e8d5c0',
        '--color-primary': '#d97706',
        '--color-primary-hover': '#b45309',
        '--color-success': '#059669',
        '--color-warning': '#d97706',
        '--color-danger': '#dc2626',
        '--color-info': '#0284c7',
      }
    }
  };

  const ThemeService = {
    _currentTheme: 'light',
    _customThemes: {},
    _listeners: [],

    init() {
      this._loadCustomThemes();
      const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
      this.applyTheme(savedTheme);
      this._watchSystemTheme();
    },

    _watchSystemTheme() {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          const current = localStorage.getItem(THEME_KEY);
          if (current === 'system') {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      }
    },

    getCurrentTheme() {
      return this._currentTheme;
    },

    getThemes() {
      return { ...defaultThemes, ...this._customThemes };
    },

    getThemeNames() {
      return Object.keys(this.getThemes());
    },

    getThemeInfo(themeName) {
      return this.getThemes()[themeName] || null;
    },

    applyTheme(themeName) {
      const themes = this.getThemes();
      const theme = themes[themeName];

      if (!theme) {
        console.warn(`Theme "${themeName}" not found, using default`);
        themeName = 'light';
      }

      this._currentTheme = themeName;
      localStorage.setItem(THEME_KEY, themeName);

      const root = document.documentElement;
      const themeVariables = theme.variables || theme;

      Object.entries(themeVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      document.body.setAttribute('data-theme', themeName);
      this._notifyListeners(themeName);

      return true;
    },

    toggleTheme() {
      const themes = this.getThemeNames();
      const currentIndex = themes.indexOf(this._currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      this.applyTheme(themes[nextIndex]);
      return this._currentTheme;
    },

    addCustomTheme(name, themeConfig) {
      if (!name || !themeConfig || typeof themeConfig !== 'object') {
        return false;
      }

      this._customThemes[name] = {
        name: themeConfig.name || name,
        variables: themeConfig.variables || themeConfig,
        isCustom: true,
      };

      this._saveCustomThemes();
      return true;
    },

    removeCustomTheme(name) {
      if (!this._customThemes[name]) return false;

      if (this._currentTheme === name) {
        this.applyTheme('light');
      }

      delete this._customThemes[name];
      this._saveCustomThemes();
      return true;
    },

    updateCustomTheme(name, themeConfig) {
      if (!this._customThemes[name]) return false;

      this._customThemes[name] = {
        ...this._customThemes[name],
        ...themeConfig,
        variables: {
          ...this._customThemes[name].variables,
          ...(themeConfig.variables || {}),
        },
      };

      this._saveCustomThemes();

      if (this._currentTheme === name) {
        this.applyTheme(name);
      }

      return true;
    },

    _loadCustomThemes() {
      try {
        const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
        if (saved) {
          this._customThemes = JSON.parse(saved);
        }
      } catch (e) {
        this._customThemes = {};
      }
    },

    _saveCustomThemes() {
      try {
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(this._customThemes));
      } catch (e) {}
    },

    getCSSVariable(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },

    setCSSVariable(name, value) {
      document.documentElement.style.setProperty(name, value);
    },

    onThemeChange(callback) {
      if (typeof callback === 'function') {
        this._listeners.push(callback);
      }
      return () => {
        this._listeners = this._listeners.filter(fn => fn !== callback);
      };
    },

    _notifyListeners(themeName) {
      this._listeners.forEach(fn => {
        try {
          fn(themeName);
        } catch (e) {
          console.error('Theme listener error:', e);
        }
      });
    },

    exportTheme(themeName) {
      const theme = this.getThemeInfo(themeName);
      if (!theme) return null;
      return JSON.stringify(theme, null, 2);
    },

    importTheme(jsonString) {
      try {
        const theme = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        if (!theme.name || !theme.variables) {
          return { success: false, message: '无效的主题格式' };
        }

        const themeKey = `custom_${Date.now()}`;
        this.addCustomTheme(themeKey, theme);
        return { success: true, themeKey, theme };
      } catch (e) {
        return { success: false, message: '导入失败：' + e.message };
      }
    },

    resetToDefault() {
      this._customThemes = {};
      this._saveCustomThemes();
      this.applyTheme('light');
    },
  };

  ThemeService.init();
  window.ThemeService = ThemeService;
})();
