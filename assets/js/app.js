// ========================================
// 全局快捷键管理器
// ========================================
const KeyboardShortcuts = {
  _handlers: {},
  _enabled: true,

  register(key, handler, description = '') {
    this._handlers[key.toLowerCase()] = { handler, description };
  },

  unregister(key) {
    delete this._handlers[key.toLowerCase()];
  },

  enable() {
    this._enabled = true;
  },

  disable() {
    this._enabled = false;
  },

  handle(e) {
    if (!this._enabled) return;

    // 检查是否在输入框中（允许正常输入）
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isEditable = target.isContentEditable;

    // Ctrl+S 保存 - 在输入框中也生效
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const handler = this._handlers['ctrl+s'];
      if (handler && handler.handler) {
        handler.handler(e);
        return true;
      }
    }

    // 在输入框中时，只响应特定快捷键
    if (isInput || isEditable) {
      // Escape - 取消/关闭
      if (e.key === 'Escape') {
        const handler = this._handlers['escape'];
        if (handler && handler.handler) {
          handler.handler(e);
          return true;
        }
      }
      return false;
    }

    // Ctrl+Z 撤销
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      const handler = this._handlers['ctrl+z'];
      if (handler && handler.handler) {
        handler.handler(e);
        return true;
      }
    }

    // Ctrl+Y 重做
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      const handler = this._handlers['ctrl+y'];
      if (handler && handler.handler) {
        handler.handler(e);
        return true;
      }
    }

    // Escape - 取消/关闭
    if (e.key === 'Escape') {
      const handler = this._handlers['escape'];
      if (handler && handler.handler) {
        handler.handler(e);
        return true;
      }
    }

    // Enter - 确认（在模态框中）
    if (e.key === 'Enter') {
      const handler = this._handlers['enter'];
      if (handler && handler.handler) {
        handler.handler(e);
        return true;
      }
    }

    // 数字键快速导航 (1-9)
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.altKey) {
      const handler = this._handlers[e.key];
      if (handler && handler.handler) {
        handler.handler(e);
        return true;
      }
    }

    return false;
  },

  init() {
    document.addEventListener('keydown', (e) => this.handle(e));
  },

  getShortcuts() {
    return Object.entries(this._handlers).map(([key, value]) => ({
      key: key.toUpperCase(),
      description: value.description
    }));
  }
};

// 初始化快捷键监听
if (typeof window !== 'undefined') {
  KeyboardShortcuts.init();
  window.KeyboardShortcuts = KeyboardShortcuts;
}

const hashPassword = (password) => {
  let hash = 0;
  const salt = "ShopData_2026_Salt";
  const str = salt + password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

const encryptPassword = (password) => {
  const hash = hashPassword(password);
  return btoa(unescape(encodeURIComponent(hash)));
};

const decryptPassword = (encrypted) => {
  try {
    return decodeURIComponent(escape(atob(encrypted)));
  } catch (e) {
    return "";
  }
};

if (typeof window !== "undefined") {
  window.encryptPassword = encryptPassword;
  window.decryptPassword = decryptPassword;
}

// app.js - 主应用入口 (App / Root / 路由 / 布局)
const App = () => {
  const { addToast } = useToast();
  const [state, setState] = useState(Store.get());
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const saved = localStorage.getItem("app_login_user");
      if (!saved) return false;
      const userData = JSON.parse(saved);
      if (!userData || !userData.username || !userData.encryptedPassword) return false;
      
      const savedAccounts = localStorage.getItem("app_accounts");
      let accounts = [];
      if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
      }
      if (accounts.length === 0) {
        accounts = [{
          id: "admin_001",
          username: "刘思琦",
          password: "520lsq",
          name: "刘思琦",
          role: "admin",
          status: "active",
        }];
      }
      
      const matchedAccount = accounts.find(
        (a) => a.username === userData.username && a.status === "active"
      );
      if (!matchedAccount) return false;
      
      const storedHash = decryptPassword(userData.encryptedPassword);
      const accountPassword = matchedAccount.password || "";
      const isAccountHashed = accountPassword.length === 8 && /^[a-f0-9]+$/i.test(accountPassword);
      
      let passwordMatch = false;
      if (isAccountHashed) {
        passwordMatch = accountPassword === storedHash;
      } else {
        const accountHash = hashPassword(accountPassword);
        passwordMatch = accountHash === storedHash;
      }
      
      return passwordMatch;
    } catch (e) {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("app_login_user");
      if (!saved) return null;
      const userData = JSON.parse(saved);
      if (!userData || !userData.username) return null;
      
      const savedAccounts = localStorage.getItem("app_accounts");
      let accounts = [];
      if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
      }
      if (accounts.length === 0) {
        accounts = [{
          id: "admin_001",
          username: "刘思琦",
          password: "520lsq",
          name: "刘思琦",
          role: "admin",
          status: "active",
        }];
      }
      
      const matchedAccount = accounts.find(
        (a) => a.username === userData.username && a.status === "active"
      );
      if (!matchedAccount) return null;
      
      const storedHash = decryptPassword(userData.encryptedPassword || "");
      const accountPassword = matchedAccount.password || "";
      const isAccountHashed = accountPassword.length === 8 && /^[a-f0-9]+$/i.test(accountPassword);
      
      let passwordMatch = false;
      if (isAccountHashed) {
        passwordMatch = accountPassword === storedHash;
      } else {
        const accountHash = hashPassword(accountPassword);
        passwordMatch = accountHash === storedHash;
      }
      
      if (!passwordMatch) return null;
      
      return {
        id: matchedAccount.id,
        username: matchedAccount.username,
        name: matchedAccount.name || matchedAccount.username,
        role: matchedAccount.role || "user",
        email: matchedAccount.email,
        remember: true,
      };
    } catch (e) {
      return null;
    }
  });
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);
  const [openTabs, setOpenTabs] = useState([{ id: "dashboard", page: "dashboard" }]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentPlatform, setCurrentPlatform] = useState(() => {
    if (typeof AppSettings !== "undefined") {
      return AppSettings.getDefaultPlatform();
    }
    return "pdd";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof AppSettings !== "undefined") {
      return AppSettings.getSetting("sidebarDefaultCollapsed") === true;
    }
    return false;
  });
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const saved = localStorage.getItem("app_sidebar_expanded");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { config: true, calc: true, system: true, info: true };
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const notifPanelRef = useRef(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateDetectedAt, setUpdateDetectedAt] = useState(null);

  // 页面加载进度状态
  const [pageLoading, setPageLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingRef = useRef(null);

  const APP_VERSION = "czp-1.10.0";
  const VERSION_KEY = "app_version_seen";
  const VERSION_HISTORY_KEY = "app_version_history";
  const UPDATE_LOG = [
    { version: "czp-1.10.0", date: "2026-07-13 19:00:00",
      summary: "功能精简与版本号格式统一",
      changes: [
        { type: "feature", text: "版本号格式统一为 czp-x.x.x（小写）" },
        { type: "feature", text: "删除模板中心页面上传文件夹功能" },
        { type: "feature", text: "优化配置中心上传样表和上传文件夹按钮" },
        { type: "optimize", text: "修复导航栏点击计算规则报错无法显示bug" },
        { type: "optimize", text: "优化页面字体选择和样式" },
        { type: "optimize", text: "关于系统页面版本号与更新日志版本一致性优化" },
        { type: "optimize", text: "关于系统页面技术支持信息优化，删除收款码功能" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.9.0", date: "2026-07-13 18:00:00",
      summary: "关键Bug修复与版本号格式统一",
      changes: [
        { type: "feature", text: "版本号格式统一为 Czp-X.X.X" },
        { type: "feature", text: "修复点击选择表格时的页面崩溃错误" },
        { type: "feature", text: "计算规则页面「前往模板中心」按钮功能完善" },
        { type: "optimize", text: "计算步骤数据源选择布局优化为两列网格" },
        { type: "optimize", text: "数据表名称过长自动省略显示" },
        { type: "bugfix", text: "修复变量作用域错误导致的页面崩溃" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.8.0", date: "2026-07-13 16:30:00",
      summary: "关键Bug修复与布局稳定性提升",
      changes: [
        { type: "feature", text: "侧边栏固定定位，滚动时不再跳动" },
        { type: "feature", text: "计算规则页面无模板时添加引导提示和跳转按钮" },
        { type: "feature", text: "系统设置主题切换卡片可视化预览" },
        { type: "feature", text: "Icons组件添加Proxy兜底，防止图标缺失报错" },
        { type: "optimize", text: "页面滚动优化，仅内容区滚动，整体布局稳定" },
        { type: "optimize", text: "使用帮助页面信息密度提升，布局更紧凑" },
        { type: "optimize", text: "样本数据管理页面间距优化，减少空白" },
        { type: "optimize", text: "更新提示弹窗样式与图标专业化" },
        { type: "optimize", text: "版本检测逻辑优化，确保每次更新都有弹窗提示" },
        { type: "bugfix", text: "修复点击「添加步骤」按钮页面报错（React #130）" },
        { type: "bugfix", text: "修复浏览器上下滑动时的空白问题" },
        { type: "bugfix", text: "修复左侧导航栏与内容区滚动跳动问题" },
        { type: "bugfix", text: "修复刷新页面更新后无提示的问题" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.7.0", date: "2026-07-13 10:00:00",
      summary: "导航栏重构与页面体验全面优化",
      changes: [
        { type: "feature", text: "重构导航栏分类布局，新增「帮助信息」独立分组" },
        { type: "feature", text: "更新日志重构为 V1.0.0 起版本体系，时间精确到秒" },
        { type: "feature", text: "使用帮助页面以最新版本全面重构" },
        { type: "optimize", text: "侧边栏底部布局优化，退出登录固定于左下角" },
        { type: "optimize", text: "版本检测指示器移至侧边栏底部，交互更合理" },
        { type: "optimize", text: "更新提示弹窗样式与文案专业化" },
        { type: "optimize", text: "页面跳动优化，CSS 过渡动画统一" },
        { type: "optimize", text: "全局主题变量统一，线条与样式和谐性提升" },
        { type: "optimize", text: "删除数据管理页面冗余「最近操作」模块" },
        { type: "optimize", text: "操作日志页面布局优化" },
        { type: "bugfix", text: "修复页面切换时的布局跳动问题" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.6.0", date: "2026-07-12 16:50:16",
      summary: "计算规则引擎增强与数据保存机制重构",
      changes: [
        { type: "feature", text: "新增17种计算步骤类型（累计、窗口、排名、日期等）" },
        { type: "feature", text: "计算步骤弹窗分组优化，选择更便捷" },
        { type: "feature", text: "调试信息默认展开，每步结果显示值、列、行" },
        { type: "optimize", text: "跨表步骤列名自动识别生成下拉选项" },
        { type: "optimize", text: "筛选步骤对比值自动识别数据下拉" },
        { type: "optimize", text: "数据保存机制重构，刷新后无需重新上传" },
        { type: "bugfix", text: "修复点击「添加步骤」按钮页面报错（React #130）" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.5.0", date: "2026-07-12 14:15:19",
      summary: "全面优化升级：界面、交互与功能提升",
      changes: [
        { type: "feature", text: "深色模式配色优化，4种主题全面适配" },
        { type: "feature", text: "导航栏新增更新日志与操作日志入口" },
        { type: "feature", text: "上传样本支持文件夹选择" },
        { type: "optimize", text: "数据管理页面布局一致性优化" },
        { type: "optimize", text: "下拉框实时搜索与虚拟滚动" },
        { type: "optimize", text: "导航栏收起后二级菜单展示修复" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.4.0", date: "2026-07-12 12:24:54",
      summary: "可搜索下拉组件与筛选步骤全面升级",
      changes: [
        { type: "feature", text: "全新可搜索下拉组件，支持拼音首字母搜索" },
        { type: "feature", text: "下拉框支持虚拟滚动，性能提升10倍" },
        { type: "feature", text: "下拉框支持分组显示与键盘导航" },
        { type: "feature", text: "筛选步骤升级，新增等于/包含/范围/前N行筛选" },
        { type: "optimize", text: "版本更新弹窗全面优化" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.3.0", date: "2026-07-12 11:41:48",
      summary: "数据持久化增强与自动快照功能",
      changes: [
        { type: "feature", text: "数据持久化增强，LZString压缩存储" },
        { type: "feature", text: "自动快照功能，数据安全保障" },
        { type: "feature", text: "更新弹窗提示机制" },
        { type: "optimize", text: "自动登录完善与提示优化" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.2.0", date: "2026-07-12 10:36:11",
      summary: "计算引擎扩展与操作日志系统",
      changes: [
        { type: "feature", text: "新增3种计算步骤类型" },
        { type: "feature", text: "过滤列对比功能" },
        { type: "feature", text: "跨设备同步码功能" },
        { type: "feature", text: "操作日志分类系统" },
        { type: "optimize", text: "主题UI优化" },
      ],
      bugfixes: [],
    },
    { version: "czp-1.1.0", date: "2026-07-12 10:18:58",
      summary: "系统稳定性增强与存储优化",
      changes: [
        { type: "feature", text: "新增音效开关设置" },
        { type: "feature", text: "存储快照功能" },
        { type: "optimize", text: "系统设置模块布局优化" },
        { type: "optimize", text: "组件样式优化（渐变背景、光效动画）" },
      ],
      bugfixes: [
        "修复刷新页面跳回登录页的问题",
        "修复计算规则只识别500行数据的限制",
        "修复配置中心错误",
      ],
    },
    { version: "czp-1.0.0", date: "2026-07-12 08:50:41",
      summary: "店数智平台初始版本发布",
      changes: [
        { type: "feature", text: "店铺数据智能分析与报表平台上线" },
        { type: "feature", text: "支持拼多多、淘宝、抖音三大平台" },
        { type: "feature", text: "模板配置中心，自动识别占位符" },
        { type: "feature", text: "计算规则引擎，支持多种数据来源" },
        { type: "feature", text: "批量计算，一键生成利润报表" },
        { type: "feature", text: "数据导出与导入功能" },
        { type: "feature", text: "4种配色主题 + 深色/浅色模式" },
      ],
      bugfixes: [],
    },
  ];

  useEffect(() => {
    setUnreadCount(NotificationCenter.getUnreadCount());
    setNotifEnabled(NotificationCenter.getSettings().masterEnabled !== false);
    const unsub = NotificationCenter.subscribe(() => {
      setUnreadCount(NotificationCenter.getUnreadCount());
      setNotifEnabled(NotificationCenter.getSettings().masterEnabled !== false);
    });
    return unsub;
  }, []);

  const addToastRef = useRef(addToast);
  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  const checkForUpdate = useCallback(async (showToast = false) => {
    try {
      const res = await fetch(`index.html?_=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const meta = doc.querySelector('meta[name="app-version"]');
      const remoteVersion = meta ? meta.getAttribute("content") : null;
      const now = new Date();
      setUpdateDetectedAt(now);

      if (remoteVersion && remoteVersion !== APP_VERSION) {
        setUpdateInfo({
          version: remoteVersion,
          date: now.toLocaleString(),
          changes: ["检测到新版本，建议刷新页面以获取最新功能。"],
          detectedAt: now,
        });
        setShowUpdateModal(true);
        if (showToast) {
          addToastRef.current("info", "发现新版本", `${remoteVersion} 已发布，请刷新页面`, 5000);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    checkForUpdate(false);
  }, [checkForUpdate]);

  useEffect(() => {
    const timer = setInterval(() => checkForUpdate(true), 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [checkForUpdate]);

  // 获取用户已查看的版本历史
  const getSeenVersions = () => {
    try {
      const saved = localStorage.getItem(VERSION_HISTORY_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [];
  };
  
  // 记录用户已查看的版本
  const markVersionAsSeen = (version) => {
    try {
      const seen = getSeenVersions();
      if (!seen.includes(version)) {
        seen.push(version);
        localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(seen));
      }
    } catch (e) {}
  };
  
  // 检查是否需要显示版本更新弹窗
  useEffect(() => {
    try {
      const lastVersion = localStorage.getItem(VERSION_KEY);
      const seenVersions = getSeenVersions();
      
      // 版本号变化时（包括首次访问）都显示更新弹窗
      if (lastVersion !== APP_VERSION) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        
        const logEntry = UPDATE_LOG.find((l) => l.version === APP_VERSION);
        if (logEntry && !seenVersions.includes(APP_VERSION)) {
          setUpdateInfo(logEntry);
          setShowUpdateModal(true);
        }
      }
    } catch (e) {}
  }, []);
  
  // 关闭更新弹窗时记录已查看
  const handleUpdateModalClose = () => {
    if (updateInfo && updateInfo.version) {
      markVersionAsSeen(updateInfo.version);
    }
    setShowUpdateModal(false);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  };
  
  // 查看完整更新日志
  const handleViewFullLog = () => {
    handleUpdateModalClose();
    handleNavigate('help');
  };

  // ========================================
  // 快捷键注册
  // ========================================
  useEffect(() => {
    if (!isLoggedIn) return;

    // Ctrl+S 保存
    KeyboardShortcuts.register('ctrl+s', () => {
      addToast('info', '提示', '数据已自动保存', 1500);
    }, '保存');

    // Escape 关闭模态框
    KeyboardShortcuts.register('escape', () => {
      if (showLogoutConfirm) {
        setShowLogoutConfirm(false);
      }
      if (showUpdateModal) {
        handleUpdateModalClose();
      }
      if (showNotifications) {
        setShowNotifications(false);
      }
    }, '关闭弹窗');

    // 数字键快速导航
    const quickNavItems = ['dashboard', 'template', 'data', 'rules', 'batch', 'history', 'storage', 'shops', 'settings'];
    quickNavItems.forEach((page, index) => {
      KeyboardShortcuts.register(String(index + 1), () => {
        handleNavigate(page);
      }, `导航到 ${pageTitles[page]?.title || page}`);
    });

    return () => {
      // 清理注册的快捷键
      KeyboardShortcuts.unregister('ctrl+s');
      KeyboardShortcuts.unregister('escape');
      quickNavItems.forEach((_, index) => {
        KeyboardShortcuts.unregister(String(index + 1));
      });
    };
  }, [isLoggedIn, showLogoutConfirm, showUpdateModal, showNotifications]);

  // ========================================
  // 页面加载进度指示
  // ========================================
  useEffect(() => {
    // 显示加载进度
    const showLoading = () => {
      setPageLoading(true);
      setLoadingProgress(0);
      
      // 模拟加载进度
      let progress = 0;
      const updateProgress = () => {
        progress += Math.random() * 30;
        if (progress > 90) progress = 90;
        setLoadingProgress(progress);
      };
      
      loadingRef.current = setInterval(updateProgress, 100);
    };

    const hideLoading = () => {
      if (loadingRef.current) {
        clearInterval(loadingRef.current);
      }
      setLoadingProgress(100);
      setTimeout(() => {
        setPageLoading(false);
        setLoadingProgress(0);
      }, 200);
    };

    // 监听页面切换
    const originalSetCurrentPage = setCurrentPage;
    
    // 初始加载完成
    setTimeout(hideLoading, 500);
    
    return () => {
      if (loadingRef.current) {
        clearInterval(loadingRef.current);
      }
    };
  }, [currentPage]);

  useEffect(() => {
    if (showNotifications) {
      const handler = (e) => {
        if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
          setShowNotifications(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showNotifications]);
  const [logoUrl, setLogoUrl] = useState(
    () => localStorage.getItem("app_logo_url") || "",
  );
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("app_theme");
    return saved || "light";
  });
  const [colorTheme, setColorTheme] = useState(() => {
    const saved = localStorage.getItem("app_color_theme");
    return saved || "business";
  });

  useEffect(() => {
    const unsub = Store.sub((newState) => {
      setState({ ...newState });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      const savedUser = localStorage.getItem("app_login_user");
      if (!savedUser) return;
      
      try {
        const userData = JSON.parse(savedUser);
        if (!userData || !userData.username || !userData.encryptedPassword) {
          return;
        }
        
        const savedAccounts = localStorage.getItem("app_accounts");
        let accounts = [];
        if (savedAccounts) {
          accounts = JSON.parse(savedAccounts);
        }
        
        if (accounts.length === 0) {
          accounts = [{
            id: "admin_001",
            username: "刘思琦",
            password: "520lsq",
            name: "刘思琦",
            role: "admin",
            status: "active",
          }];
        }
        
        const matchedAccount = accounts.find(
          (a) => a.username === userData.username && a.status === "active"
        );
        
        if (!matchedAccount) {
          localStorage.removeItem("app_login_user");
          return;
        }
        
        const storedHash = decryptPassword(userData.encryptedPassword);
        const accountPassword = matchedAccount.password || "";
        const isAccountHashed = accountPassword.length === 8 && /^[a-f0-9]+$/i.test(accountPassword);
        
        let passwordMatch = false;
        if (isAccountHashed) {
          passwordMatch = accountPassword === storedHash;
        } else {
          const accountHash = hashPassword(accountPassword);
          passwordMatch = accountHash === storedHash;
        }
        
        if (!passwordMatch) {
          localStorage.removeItem("app_login_user");
          return;
        }
        
        const autoUser = {
          id: matchedAccount.id,
          username: matchedAccount.username,
          name: matchedAccount.name || matchedAccount.username,
          role: matchedAccount.role || "user",
          email: matchedAccount.email,
          remember: true,
        };
        
        setIsLoggedIn(true);
        setCurrentUser(autoUser);
        
        const updatedAccounts = accounts.map((a) =>
          a.id === matchedAccount.id
            ? { ...a, lastLogin: new Date().toISOString() }
            : a
        );
        localStorage.setItem("app_accounts", JSON.stringify(updatedAccounts));
        ActivityLogger.add("自动登录", autoUser.username);
        addToast("success", "自动登录成功", `欢迎回来，${autoUser.name || autoUser.username}！`, 3000);
        
      } catch (e) {
        localStorage.removeItem("app_login_user");
      }
    };
    
    tryAutoLogin();
  }, []);

  // 订阅存储事件，将存储异常/告警以 Toast 形式通知用户
  useEffect(() => {
    const unsub = Store.onStorageEvent((type, detail) => {
      if (!detail) return;
      const message = detail.message || "存储异常";
      const notifSettings = typeof NotificationCenter !== "undefined" ? NotificationCenter.getSettings() : null;
      const notificationsEnabled = !notifSettings || notifSettings.masterEnabled !== false;
      if (type === "error") {
        if (notificationsEnabled) {
          addToast("error", "存储错误", message, 6000, { notificationType: "storageWarning" });
        }
      } else if (type === "warning") {
        if (notificationsEnabled) {
          addToast("warning", "存储提示", message, 5000, { notificationType: "storageWarning" });
        }
      } else if (type === "restored") {
        if (notificationsEnabled) {
          addToast("success", "数据已恢复", "已从备份恢复上次保存的数据", 4000, { notificationType: "exportComplete" });
        }
      }
    });
    return unsub;
  }, [addToast]);

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.add("light");
    }
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app_sidebar_expanded", JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  useEffect(() => {
    document.body.classList.remove("theme-business", "theme-tech", "theme-warm", "theme-elegant");
    document.body.classList.add(`theme-${colorTheme}`);
    localStorage.setItem("app_color_theme", colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    const savedColorTheme = localStorage.getItem("app_color_theme");
    if (savedColorTheme) {
      document.body.classList.add(`theme-${savedColorTheme}`);
    } else {
      document.body.classList.add("theme-business");
    }
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }
    // 应用界面偏好设置
    if (typeof AppSettings !== "undefined") {
      if (AppSettings.getSetting("compactMode")) {
        document.body.classList.add("compact-mode");
      }
      if (!AppSettings.isAnimationEnabled()) {
        document.body.classList.add("no-animation");
      }
    }
  }, []);

  // 订阅应用设置变化，实时应用界面偏好
  useEffect(() => {
    if (typeof AppSettings === "undefined") return;
    const applySettings = (settings) => {
      document.body.classList.toggle("compact-mode", !!settings.compactMode);
      document.body.classList.toggle("no-animation", !settings.animationEnabled);
    };
    applySettings(AppSettings.get());
    return AppSettings.subscribe(applySettings);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const changeColorTheme = (newTheme) => {
    setColorTheme(newTheme);
  };
  const navGroups = [
    {
      id: "home",
      type: "single",
      items: [
        {
          id: "dashboard",
          name: "数据概览",
          icon: /*#__PURE__*/ React.createElement(Icons.Home, null),
        },
      ],
    },
    {
      id: "config",
      type: "group",
      title: "配置管理",
      icon: /*#__PURE__*/ React.createElement(Icons.Settings, null),
      items: [
        {
          id: "template",
          name: "模板中心",
          icon: /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
        },
        {
          id: "data",
          name: "配置中心",
          icon: /*#__PURE__*/ React.createElement(Icons.Database, null),
        },
        {
          id: "shops",
          name: "店铺管理",
          icon: /*#__PURE__*/ React.createElement(Icons.Store, null),
        },
      ],
    },
    {
      id: "calc",
      type: "group",
      title: "计算中心",
      icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
      items: [
        {
          id: "rules",
          name: "计算规则",
          icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
          highlight: true,
        },
        {
          id: "batch",
          name: "批量计算",
          icon: /*#__PURE__*/ React.createElement(Icons.Zap, null),
          highlight: true,
        },
        {
          id: "history",
          name: "计算记录",
          icon: /*#__PURE__*/ React.createElement(Icons.History, null),
        },
      ],
    },
    {
      id: "system",
      type: "group",
      title: "系统管理",
      icon: /*#__PURE__*/ React.createElement(Icons.Layers, null),
      items: [
        {
          id: "storage",
          name: "数据管理",
          icon: /*#__PURE__*/ React.createElement(Icons.HardDrive, null),
        },
        {
          id: "settings",
          name: "系统设置",
          icon: /*#__PURE__*/ React.createElement(Icons.Settings, null),
        },
        {
          id: "auditlog",
          name: "操作日志",
          icon: /*#__PURE__*/ React.createElement(Icons.Shield, null),
        },
      ],
    },
    {
      id: "info",
      type: "group",
      title: "帮助信息",
      icon: /*#__PURE__*/ React.createElement(Icons.HelpCircle, null),
      items: [
        {
          id: "changelog",
          name: "更新日志",
          icon: /*#__PURE__*/ React.createElement(Icons.GitCommit, null),
        },
        {
          id: "help",
          name: "使用帮助",
          icon: /*#__PURE__*/ React.createElement(Icons.HelpCircle, null),
        },
      ],
    },
  ];
  const handleNavigate = (pageId) => {
    setOpenTabs((prev) => {
      if (prev.find((t) => t.id === pageId)) return prev;
      return [...prev, { id: pageId, page: pageId }];
    });
    setCurrentPage(pageId);
    const group = navGroups.find((g) => g.items.some((i) => i.id === pageId));
    if (group && group.type === "group" && expandedGroups[group.id] === false) {
      toggleGroup(group.id);
    }
  };
  const closeTab = (tabId, e) => {
    if (e) e.stopPropagation();
    setOpenTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      if (idx < 0) return prev;
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (newTabs.length === 0) return [{ id: "dashboard", page: "dashboard" }];
      if (tabId === currentPage) {
        const nextTab = newTabs[Math.min(idx, newTabs.length - 1)];
        setCurrentPage(nextTab.id);
      }
      return newTabs;
    });
  };
  const pageTitles = {
    dashboard: { title: "数据概览", subtitle: "查看系统配置和统计信息" },
    template: { title: "模板中心", subtitle: "上传和配置利润表模板" },
    rules: { title: "计算规则", subtitle: "配置字段的计算逻辑" },
    batch: { title: "批量计算", subtitle: "上传店铺数据并批量计算利润" },
    data: { title: "配置中心", subtitle: "管理样表数据和全局数据" },
    storage: { title: "数据管理", subtitle: "导出和导入系统数据" },
    history: { title: "计算记录", subtitle: "查看历史计算结果" },
    shops: { title: "店铺管理", subtitle: "管理各平台下的店铺信息" },
    settings: { title: "系统设置", subtitle: "管理系统配置和个人信息" },
    help: { title: "使用帮助", subtitle: "系统使用指南和常见问题" },
    changelog: { title: "更新日志", subtitle: "查看系统版本更新历史" },
    auditlog: { title: "操作日志", subtitle: "查看用户操作安全记录" },
  };
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return /*#__PURE__*/ React.createElement(DashboardPage, {
          state: state,
          onNavigate: handleNavigate,
        });
      case "template":
        return /*#__PURE__*/ React.createElement(TemplatePage, {
          state: state,
          currentPlatform: currentPlatform,
        });
      case "rules":
        return /*#__PURE__*/ React.createElement(RulesPage, {
          state: state,
          currentPlatform: currentPlatform,
          onNavigate: handleNavigate,
        });
      case "batch":
        return /*#__PURE__*/ React.createElement(BatchPage, {
          state: state,
          currentPlatform: currentPlatform,
        });
      case "data":
        return /*#__PURE__*/ React.createElement(DataPage, {
          state: state,
          currentPlatform: currentPlatform,
        });
      case "storage":
        return /*#__PURE__*/ React.createElement(StoragePage, {
          state: state,
          setState: setState,
        });
      case "history":
        return /*#__PURE__*/ React.createElement(CalcHistoryPage, {
          state: state,
          currentPlatform: currentPlatform,
        });
      case "shops":
        return /*#__PURE__*/ React.createElement(ShopsPage, {
          state: state,
          currentPlatform: currentPlatform,
          onNavigate: handleNavigate,
        });
      case "settings":
        return /*#__PURE__*/ React.createElement(SettingsPage, { 
          state: state, 
          onNavigate: handleNavigate,
          currentTheme: theme,
          colorTheme: colorTheme,
          onChangeTheme: setTheme,
          onChangeColorTheme: changeColorTheme,
          currentUser: currentUser,
          onLogout: confirmLogout,
        });
      case "help":
        return /*#__PURE__*/ React.createElement(HelpPage, {});
      case "changelog":
        return /*#__PURE__*/ React.createElement(ChangelogPage, { updateLog: UPDATE_LOG, appVersion: APP_VERSION });
      case "auditlog":
        return /*#__PURE__*/ React.createElement(AuditLogPage, { currentUser: currentUser });
      default:
        return /*#__PURE__*/ React.createElement(DashboardPage, {
          state: state,
          onNavigate: handleNavigate,
        });
    }
  };
  const handleLogin = (userInfo) => {
    let accounts = [];
    try {
      const saved = localStorage.getItem("app_accounts");
      if (saved) {
        accounts = JSON.parse(saved);
      }
    } catch (e) {}
    if (accounts.length === 0) {
      accounts = [{
        id: "admin_001",
        username: "刘思琦",
        password: "520lsq",
        name: "刘思琦",
        role: "admin",
        status: "active",
      }];
    }
    const matchedAccount = accounts.find(
      (a) =>
        a.username === userInfo.username.trim() &&
        a.status === "active",
    );
    if (!matchedAccount) {
      if (typeof userInfo.onError === "function") {
        userInfo.onError("用户名或密码错误，或账户已被禁用");
      }
      return;
    }
    
    let passwordMatch = false;
    
    if (userInfo.isRemembered) {
      try {
        const savedUser = localStorage.getItem("app_login_user");
        if (savedUser) {
          const savedData = JSON.parse(savedUser);
          if (savedData.username === userInfo.username.trim() && savedData.encryptedPassword) {
            const storedHash = decryptPassword(savedData.encryptedPassword);
            const accountPassword = matchedAccount.password || "";
            const isAccountHashed = accountPassword.length === 8 && /^[a-f0-9]+$/i.test(accountPassword);
            if (isAccountHashed) {
              passwordMatch = accountPassword === storedHash;
            } else {
              passwordMatch = hashPassword(accountPassword) === storedHash;
            }
          }
        }
      } catch (e) {}
    }
    
    if (!passwordMatch && !userInfo.isRemembered) {
      const inputHash = hashPassword(userInfo.password);
      const storedPassword = matchedAccount.password || "";
      const isHashed = storedPassword.length === 8 && /^[a-f0-9]+$/i.test(storedPassword);
      
      if (isHashed) {
        passwordMatch = storedPassword === inputHash;
      } else {
        passwordMatch = storedPassword === userInfo.password;
        if (passwordMatch && storedPassword) {
          const updatedAccounts = accounts.map((a) =>
            a.id === matchedAccount.id ? { ...a, password: inputHash } : a
          );
          localStorage.setItem("app_accounts", JSON.stringify(updatedAccounts));
        }
      }
    }
    
    if (!passwordMatch) {
      if (typeof userInfo.onError === "function") {
        userInfo.onError("用户名或密码错误");
      }
      return;
    }
    const userData = {
      id: matchedAccount.id,
      username: matchedAccount.username,
      name: matchedAccount.name || matchedAccount.username,
      role: matchedAccount.role || "user",
      email: matchedAccount.email,
      remember: userInfo.remember,
    };
    setIsLoggedIn(true);
    setCurrentUser(userData);
    localStorage.setItem("app_login_user", JSON.stringify({ 
      username: userData.username, 
      encryptedPassword: encryptPassword(
        userInfo.isRemembered 
          ? decryptPassword(JSON.parse(localStorage.getItem("app_login_user")).encryptedPassword)
          : userInfo.password
      )
    }));
    const updatedAccounts = accounts.map((a) =>
      a.id === matchedAccount.id
        ? { ...a, lastLogin: new Date().toISOString() }
        : a,
    );
    localStorage.setItem("app_accounts", JSON.stringify(updatedAccounts));
    ActivityLogger.add("用户登录", userData.username);
  };
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  const confirmLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("app_login_user");
    setCurrentPage("dashboard");
    setShowLogoutConfirm(false);
    ActivityLogger.add("退出登录", "");
  };
  if (!isLoggedIn) {
    return /*#__PURE__*/ React.createElement(LoginPage, { onLogin: handleLogin });
  }
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "app" },
    // 页面加载进度条
    pageLoading && /*#__PURE__*/ React.createElement(
      "div",
      { className: "page-loading-bar" },
      /*#__PURE__*/ React.createElement("div", { 
        className: "page-loading-progress", 
        style: { width: `${loadingProgress}%` } 
      })
    ),
    /*#__PURE__*/ React.createElement(
      "aside",
      { className: `sidebar ${sidebarCollapsed ? "collapsed" : ""}` },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "sidebar-logo" },
        /*#__PURE__*/ React.createElement(
          "div",
          {
            className: "sidebar-logo-icon",
            onClick: () => document.getElementById("logo-upload-input").click(),
            title: "\u70B9\u51FB\u4E0A\u4F20\u81EA\u5B9A\u4E49Logo",
            style: { cursor: "pointer", overflow: "hidden" },
          },
          logoUrl
            ? /*#__PURE__*/ React.createElement("img", {
                src: logoUrl,
                alt: "Logo",
                style: { width: "100%", height: "100%", objectFit: "cover" },
              })
            : /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        ),
        /*#__PURE__*/ React.createElement("input", {
          id: "logo-upload-input",
          type: "file",
          accept: "image/*",
          style: { display: "none" },
          onChange: (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const url = ev.target.result;
              setLogoUrl(url);
              localStorage.setItem("app_logo_url", url);
            };
            reader.readAsDataURL(file);
          },
        }),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "sidebar-logo-text-wrap" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "sidebar-logo-text" },
            "\u5E97\u6570\u667A",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "sidebar-logo-sub" },
            "ShopData",
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "nav",
        { className: "sidebar-nav" },
        navGroups.map((group) => {
          if (group.type === "single") {
            const item = group.items[0];
            return /*#__PURE__*/ React.createElement(
              "div",
              { key: group.id, className: "nav-group" },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  key: item.id,
                  className: `nav-item ${currentPage === item.id ? "active" : ""} ${item.highlight ? "nav-highlight" : ""}`,
                  onClick: () => handleNavigate(item.id),
                  "data-tooltip": item.name,
                },
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "nav-icon" },
                  item.icon,
                ),
                /*#__PURE__*/ React.createElement("span", { className: "nav-text" }, item.name),
                item.highlight &&
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "nav-badge" },
                    "\u6838\u5FC3",
                  ),
              ),
            );
          }
          const isExpanded = expandedGroups[group.id] !== false;
          const hasActiveItem = group.items.some((item) => currentPage === item.id);
          return /*#__PURE__*/ React.createElement(
            "div",
            { key: group.id, className: "nav-group nav-group-collapsible" },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                className: `nav-group-header ${hasActiveItem ? "has-active" : ""}`,
                onClick: () => toggleGroup(group.id),
                "data-tooltip": group.title,
              },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "nav-icon" },
                group.icon,
              ),
              /*#__PURE__*/ React.createElement("span", { className: "nav-text nav-group-title-text" }, group.title),
              /*#__PURE__*/ React.createElement(
                "span",
                { className: `nav-group-arrow ${isExpanded ? "expanded" : ""}` },
                /*#__PURE__*/ React.createElement(Icons.ChevronDown, null),
              ),
            ),
            isExpanded && /*#__PURE__*/ React.createElement(
              "div",
              { className: "nav-sub-items" },
              group.items.map((item) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    key: item.id,
                    className: `nav-item nav-sub-item ${currentPage === item.id ? "active" : ""} ${item.highlight ? "nav-highlight" : ""}`,
                    onClick: () => handleNavigate(item.id),
                    "data-tooltip": item.name,
                  },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "nav-icon nav-sub-icon" },
                    item.icon,
                  ),
                  /*#__PURE__*/ React.createElement("span", { className: "nav-text" }, item.name),
                  item.highlight &&
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "nav-badge nav-sub-badge" },
                      "\u6838\u5FC3",
                    ),
                ),
              ),
            ),
          );
        }),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            className: "sidebar-toggle",
            onClick: () => setSidebarCollapsed(!sidebarCollapsed),
          },
          sidebarCollapsed
          ? /*#__PURE__*/ React.createElement(Icons.ChevronRight, null)
          : /*#__PURE__*/ React.createElement(Icons.ChevronLeft, null),
        ),
      ),
      /*#__PURE__*/ React.createElement(
          "div",
          { className: "sidebar-footer" },
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "sidebar-version-badge",
              onClick: () => {
                setUpdateInfo(UPDATE_LOG[0]);
                setShowUpdateModal(true);
              },
              title: "点击查看更新日志",
            },
            /*#__PURE__*/ React.createElement("span", { className: "sidebar-version-text" }, APP_VERSION),
            updateDetectedAt
              ? /*#__PURE__*/ React.createElement("span", { className: "sidebar-version-time" }, updateDetectedAt.toLocaleTimeString())
              : null,
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "nav-item sidebar-logout-btn",
              onClick: handleLogout,
              "data-tooltip": "\u9000\u51FA\u767B\u5F55",
            },
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "nav-icon" },
              /*#__PURE__*/ React.createElement(Icons.LogOut, null),
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "nav-text" },
              "\u9000\u51FA\u767B\u5F55",
            ),
          ),
        ),
    ),
    /*#__PURE__*/ React.createElement(
      "main",
      { className: "main" },
      /*#__PURE__*/ React.createElement(
        "header",
        { className: "main-header" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "main-header-left" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "header-platform-switcher" },
            state.platforms.map((platform) =>
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  key: platform.id,
                  className: `header-platform-item ${currentPlatform === platform.id ? "active" : ""}`,
                  onClick: () => setCurrentPlatform(platform.id),
                  title: `${platform.name}（${platform.shops.length}个店铺）`,
                },
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: `platform-icon ${platform.id}` },
                  platform.id === "pinduoduo" ? "PDD" : platform.id === "taobao" ? "TB" : platform.id === "douyin" ? "DY" : platform.emoji,
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "platform-name" },
                  platform.name,
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "platform-count" },
                  platform.shops.length,
                  "\u5E97",
                ),
              ),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-tabs" },
          openTabs.map((tab) => {
            const navItem = navGroups.flatMap((g) => g.items).find((i) => i.id === tab.id);
            const defaultIcons = {
              history: React.createElement(Icons.History, null),
              storage: React.createElement(Icons.HardDrive, null),
              settings: React.createElement(Icons.Settings, null),
              externals: React.createElement(Icons.User, null),
            };
            const tabIcon = navItem?.icon || defaultIcons[tab.id] || React.createElement(Icons.FileText, null);
            return /*#__PURE__*/ React.createElement(
              "div",
              {
                key: tab.id,
                className: `page-tab ${currentPage === tab.id ? "active" : ""}`,
                onClick: () => setCurrentPage(tab.id),
              },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "page-tab-icon" },
                tabIcon,
              ),
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "page-tab-title" },
                navItem?.name || pageTitles[tab.id]?.title || tab.id,
              ),
              openTabs.length > 1 &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    className: "page-tab-close",
                    onClick: (e) => closeTab(tab.id, e),
                  },
                  /*#__PURE__*/ React.createElement(Icons.X, null),
                ),
            );
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "main-header-actions" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "header-actions-group" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "notification-wrapper", ref: notifPanelRef },
              notifEnabled && /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "header-icon-btn notification-btn",
                  onClick: () => setShowNotifications(!showNotifications),
                  title: "\u901A\u77E5\u4E2D\u5FC3",
                },
                /*#__PURE__*/ React.createElement(Icons.Bell, null),
                unreadCount > 0 && /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "notification-badge" },
                  unreadCount > 99 ? "99+" : unreadCount,
                ),
              ),
              notifEnabled && showNotifications && /*#__PURE__*/ React.createElement(
                "div",
                { className: "notification-panel" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "notification-panel-header" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "notification-panel-title" },
                    "\u901A\u77E5\u4E2D\u5FC3",
                    unreadCount > 0 && /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "notification-unread-count" },
                      unreadCount,
                      "\u6761\u672A\u8BFB",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "notification-panel-actions" },
                    unreadCount > 0 && /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "notification-action-btn",
                        onClick: () => NotificationCenter.markAllAsRead(),
                      },
                      "\u5168\u90E8\u5DF2\u8BFB",
                    ),
                    NotificationCenter.getNotifications().length > 0 && /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "notification-action-btn",
                        onClick: () => NotificationCenter.clearAll(),
                      },
                      "\u6E05\u7A7A",
                    ),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "notification-list" },
                  NotificationCenter.getNotifications().length === 0
                    ? /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "notification-empty" },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "notification-empty-icon" },
                          /*#__PURE__*/ React.createElement(Icons.Inbox, null),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "notification-empty-text" },
                          "\u6682\u65E0\u901A\u77E5",
                        ),
                      )
                    : NotificationCenter.getNotifications().slice(0, 20).map((notif) =>
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            key: notif.id,
                            className: `notification-item ${notif.read ? "read" : "unread"}`,
                            onClick: () => NotificationCenter.markAsRead(notif.id),
                          },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: `notification-item-icon ${notif.type}` },
                            notif.type === "success" && /*#__PURE__*/ React.createElement(Icons.CheckCircle, null),
                            notif.type === "error" && /*#__PURE__*/ React.createElement(Icons.XCircle, null),
                            notif.type === "warning" && /*#__PURE__*/ React.createElement(Icons.AlertTriangle, null),
                            notif.type === "info" && /*#__PURE__*/ React.createElement(Icons.Info, null),
                          ),
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "notification-item-content" },
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "notification-item-title" },
                              notif.title,
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "notification-item-message" },
                              notif.message,
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "notification-item-time" },
                              new Date(notif.time).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            ),
                          ),
                          !notif.read && /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "notification-unread-dot" },
                          ),
                        ),
                      ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "header-icon-btn",
                onClick: toggleTheme,
                title: theme === "dark" ? "明亮模式" : "深色模式",
              },
              theme === "dark"
                ? /*#__PURE__*/ React.createElement(Icons.Sun, null)
                : /*#__PURE__*/ React.createElement(Icons.Moon, null),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "header-actions-divider" },
          ),
          /*#__PURE__*/ React.createElement(
            Button,
            {
              size: "sm",
              onClick: () => {
                const data = Store.exportData();
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `profit-config-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              },
            },
            /*#__PURE__*/ React.createElement(Icons.Download, null),
            "\u5BFC\u51FA",
          ),
          /*#__PURE__*/ React.createElement(
            Button,
            {
              size: "sm",
              onClick: () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    Store.importData(text);
                    ActivityLogger.add("导入配置", file.name);
                  } catch (err) {
                    alert("导入失败: " + err.message);
                  }
                };
                input.click();
              },
            },
            /*#__PURE__*/ React.createElement(Icons.Upload, null),
            "\u5BFC\u5165",
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "main-content" },
        renderPage(),
      ),
    ),
    showLogoutConfirm &&
      /*#__PURE__*/ React.createElement(ConfirmModal, {
        title: "确认退出登录",
        message: "确定要退出登录吗？退出后需要重新登录才能继续使用。",
        type: "warning",
        onConfirm: confirmLogout,
        onCancel: () => setShowLogoutConfirm(false),
      }),
    showUpdateModal && updateInfo && /*#__PURE__*/ React.createElement(
      "div",
      { className: "modal-mask", onClick: handleUpdateModalClose },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "modal update-modal", onClick: (e) => e.stopPropagation() },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "update-modal-header" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-icon" },
            /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
          ),
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-version" }, updateInfo.version),
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-date" }, updateInfo.date),
          updateInfo.summary && /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-summary" },
            updateInfo.summary
          ),
          updateDetectedAt && /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-detected" },
            `检测到更新时间：${updateDetectedAt.toLocaleString()}`,
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "update-modal-body" },
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-title" }, "版本更新提示"),
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-subtitle" }, "本次更新包含以下内容，建议刷新页面以获取最新体验。"),

          // 新增功能
          updateInfo.changes && updateInfo.changes.filter(c => c.type === 'feature').length > 0 && /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-section" },
            /*#__PURE__*/ React.createElement("div", { className: "update-modal-section-header" },
              /*#__PURE__*/ React.createElement(Icons.PlusCircle, null),
              "新增功能"
            ),
            /*#__PURE__*/ React.createElement(
              "ul",
              { className: "update-modal-list feature-list" },
              updateInfo.changes.filter(c => c.type === 'feature').map((change, idx) => /*#__PURE__*/ React.createElement("li", { key: idx },
                /*#__PURE__*/ React.createElement("span", { className: "update-change-icon feature" }, "✨"),
                change.text
              ))
            )
          ),

          // 优化项
          updateInfo.changes && updateInfo.changes.filter(c => c.type === 'optimize').length > 0 && /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-section" },
            /*#__PURE__*/ React.createElement("div", { className: "update-modal-section-header" },
              /*#__PURE__*/ React.createElement(Icons.Zap, null),
              "优化改进"
            ),
            /*#__PURE__*/ React.createElement(
              "ul",
              { className: "update-modal-list optimize-list" },
              updateInfo.changes.filter(c => c.type === 'optimize').map((change, idx) => /*#__PURE__*/ React.createElement("li", { key: idx },
                /*#__PURE__*/ React.createElement("span", { className: "update-change-icon optimize" }, "⚡"),
                change.text
              ))
            )
          ),

          // Bug修复 - 合并 changes 中 type==="bugfix" 的项和 bugfixes 数组
          (() => {
            const bugfixChanges = (updateInfo.changes || []).filter(c => c.type === 'bugfix').map(c => c.text);
            const bugfixes = [...bugfixChanges, ...(updateInfo.bugfixes || [])];
            if (bugfixes.length === 0) return null;
            return /*#__PURE__*/ React.createElement(
              "div",
              { className: "update-modal-section" },
              /*#__PURE__*/ React.createElement("div", { className: "update-modal-section-header" },
                /*#__PURE__*/ React.createElement(Icons.CheckCircle, null),
                "问题修复"
              ),
              /*#__PURE__*/ React.createElement(
                "ul",
                { className: "update-modal-list bugfix-list" },
                bugfixes.map((fix, idx) => /*#__PURE__*/ React.createElement("li", { key: idx },
                  /*#__PURE__*/ React.createElement("span", { className: "update-change-icon bugfix" }, "🔧"),
                  fix
                ))
              )
            );
          })(),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "update-modal-footer" },
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: "btn btn-ghost view-full-log-btn",
              onClick: handleViewFullLog,
            },
            /*#__PURE__*/ React.createElement(Icons.FileText, null),
            " 查看完整日志",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-footer-right" },
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "btn btn-secondary",
                onClick: handleUpdateModalClose,
              },
              "稍后再说",
            ),
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "btn btn-primary",
                onClick: () => {
                  handleUpdateModalClose();
                  window.location.reload();
                },
              },
              /*#__PURE__*/ React.createElement(Icons.RefreshCw, null),
              " 立即刷新",
            ),
          ),
        ),
      ),
    ),
  );
};
const Root = () =>
  /*#__PURE__*/ React.createElement(
    ErrorBoundary,
    null,
    /*#__PURE__*/ React.createElement(
      ToastProvider,
      null,
      /*#__PURE__*/ React.createElement(App, null),
    ),
  );
ReactDOM.createRoot(document.getElementById("root")).render(
  /*#__PURE__*/ React.createElement(Root, null),
);
window.__appReady = true;
