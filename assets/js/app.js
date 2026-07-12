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
    return { config: true, calc: true, system: true };
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const notifPanelRef = useRef(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateDetectedAt, setUpdateDetectedAt] = useState(null);

  const APP_VERSION = "5.7.0";
  const VERSION_KEY = "app_version_seen";
  const UPDATE_LOG = [
    { version: "5.7.0", date: "2026-07-12", changes: [
      "全新可搜索下拉组件，支持搜索和快速选择",
      "过滤步骤升级为「筛选」，与Excel体验一致",
      "新增等于筛选、包含筛选、范围筛选、前N行筛选",
      "筛选值支持下拉选择+搜索+快捷标签",
      "新增Store.flush方法，上传数据后立即保存",
      "修复模板/配置中心上传后刷新数据丢失",
      "完善自动登录，登录页自动填充账号密码",
      "优化筛选步骤UI，更清晰直观",
    ]},
    { version: "5.2.0", date: "2026-07-11", changes: [
      "修复刷新页面跳回登录页的问题",
      "修复计算规则只识别500行数据的限制",
      "新增音效开关设置",
      "优化系统设置模块布局",
      "优化计算规则下拉框样式",
      "完善数据存储机制（快照功能）",
    ]},
    { version: "5.1.0", date: "2026-07-10", changes: [
      "新增自动登录功能",
      "新增Toast声音通知",
      "设置页改为侧边栏分类布局",
      "存储页新增数据统计卡片",
      "优化组件样式（渐变背景、光效动画）",
    ]},
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

  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem(VERSION_KEY);
      if (seenVersion !== APP_VERSION) {
        setUpdateInfo(UPDATE_LOG[0]);
        setShowUpdateModal(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const parseVersion = (html) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const meta = doc.querySelector('meta[name="app-version"]');
        return meta ? meta.getAttribute("content") : null;
      } catch (e) {
        return null;
      }
    };
    const checkForUpdate = async () => {
      try {
        const res = await fetch(`index.html?_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const html = await res.text();
        const remoteVersion = parseVersion(html);
        if (remoteVersion && remoteVersion !== APP_VERSION) {
          const now = new Date();
          setUpdateInfo({
            version: remoteVersion,
            date: now.toLocaleString(),
            changes: ["检测到新版本，建议刷新页面以获取最新功能。"],
            detectedAt: now,
          });
          setUpdateDetectedAt(now);
          setShowUpdateModal(true);
          addToast("info", "发现新版本", `v${remoteVersion} 已发布，请刷新页面`, 5000);
        }
      } catch (e) {}
    };
    checkForUpdate();
    const timer = setInterval(checkForUpdate, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [addToast]);

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
              className: "nav-item",
              onClick: () => handleNavigate("settings"),
              "data-tooltip": "\u7CFB\u7EDF\u8BBE\u7F6E",
            },
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "nav-icon" },
              /*#__PURE__*/ React.createElement(Icons.Settings, null),
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "nav-text" },
              "\u7CFB\u7EDF\u8BBE\u7F6E",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "nav-item",
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
      { className: "modal-mask", onClick: () => { setShowUpdateModal(false); localStorage.setItem(VERSION_KEY, APP_VERSION); } },
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
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-version" }, `v${updateInfo.version}`),
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-date" }, updateInfo.date),
          updateDetectedAt && /*#__PURE__*/ React.createElement(
            "div",
            { className: "update-modal-detected", style: { fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 } },
            `检测到更新时间：${updateDetectedAt.toLocaleString()}`,
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "update-modal-body" },
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-title" }, "🎉 新功能已上线"),
          /*#__PURE__*/ React.createElement("div", { className: "update-modal-subtitle" }, "感谢您的使用！本次更新带来了多项功能优化和体验提升，建议刷新页面以获得最佳体验。"),
          /*#__PURE__*/ React.createElement(
            "ul",
            { className: "update-modal-list" },
            updateInfo.changes.map((change, idx) => /*#__PURE__*/ React.createElement("li", { key: idx }, change)),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "update-modal-footer" },
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: "btn btn-secondary",
              onClick: () => {
                setShowUpdateModal(false);
                localStorage.setItem(VERSION_KEY, APP_VERSION);
              },
            },
            "稍后再说",
          ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: "btn btn-primary",
              onClick: () => {
                localStorage.setItem(VERSION_KEY, APP_VERSION);
                window.location.reload();
              },
            },
            /*#__PURE__*/ React.createElement(Icons.RefreshCw, null),
            " 立即刷新",
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
