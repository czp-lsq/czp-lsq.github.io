// core/accounts.js - 账号管理模块
// 功能：
// 1. 账号注册、登录、验证
// 2. 密码加密存储（SHA-256）
// 3. 管理员权限管理
// 4. 账号状态管理（启用/禁用）
// 5. 支持多设备同步账号配置

const AccountManager = (() => {
  const ACCOUNTS_KEY = "app_accounts_v2";
  const CURRENT_USER_KEY = "app_current_user";
  const SESSION_TOKEN_KEY = "app_session_token";

  const hashPassword = (password, salt) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      return crypto.subtle.digest('SHA-256', data).then(hash => {
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      });
    } catch (e) {
      return Promise.resolve(password);
    }
  };

  const generateSalt = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const getDefaultAccounts = () => [
    {
      id: "admin-001",
      username: "admin",
      name: "管理员",
      email: "admin@shopdata.com",
      role: "admin",
      status: "active",
      createdAt: Date.now(),
    }
  ];

  const loadAccounts = () => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    const defaults = getDefaultAccounts();
    saveAccounts(defaults);
    return defaults;
  };

  const saveAccounts = (accounts) => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (typeof AppStorage !== 'undefined') {
      AppStorage.set(ACCOUNTS_KEY, accounts).catch(() => {});
    }
  };

  let accounts = loadAccounts();

  const authenticate = async (username, password) => {
    const account = accounts.find(a => 
      a.username.toLowerCase() === username.toLowerCase() && 
      a.status === "active"
    );

    if (!account) {
      return { success: false, message: "用户名或密码错误" };
    }

    if (!account.password && !account.salt) {
      if (password === "admin") {
        return { success: true, account, token: generateToken() };
      }
      return { success: false, message: "用户名或密码错误" };
    }

    if (!account.salt || !account.password) {
      return { success: false, message: "账号信息不完整" };
    }

    const hashedPassword = await hashPassword(password, account.salt);
    if (hashedPassword === account.password) {
      return { success: true, account, token: generateToken() };
    }

    return { success: false, message: "用户名或密码错误" };
  };

  const login = async (username, password, remember = false) => {
    const result = await authenticate(username, password);
    
    if (!result.success) {
      return result;
    }

    const { account, token } = result;
    const sessionData = {
      userId: account.id,
      username: account.username,
      name: account.name,
      role: account.role,
      email: account.email,
      token,
      expiresAt: remember ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 24 * 60 * 60 * 1000,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionData));
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    
    if (typeof AppStorage !== 'undefined') {
      AppStorage.set(CURRENT_USER_KEY, sessionData).catch(() => {});
    }

    return { success: true, account, session: sessionData };
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    
    if (typeof AppStorage !== 'undefined') {
      AppStorage.remove(CURRENT_USER_KEY).catch(() => {});
      AppStorage.remove(SESSION_TOKEN_KEY).catch(() => {});
    }
  };

  const getCurrentUser = () => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) {
        const user = JSON.parse(saved);
        if (user.expiresAt && user.expiresAt > Date.now()) {
          return user;
        }
      }
    } catch (e) {}
    return null;
  };

  const isLoggedIn = () => {
    return getCurrentUser() !== null;
  };

  const isAdmin = () => {
    const user = getCurrentUser();
    return user && user.role === "admin";
  };

  const addAccount = async (accountData) => {
    if (!accountData.username || !accountData.password) {
      return { success: false, message: "用户名和密码不能为空" };
    }

    if (accounts.some(a => a.username.toLowerCase() === accountData.username.toLowerCase())) {
      return { success: false, message: "该用户名已存在" };
    }

    const salt = generateSalt();
    const hashedPassword = await hashPassword(accountData.password, salt);

    const newAccount = {
      id: "acc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      username: accountData.username,
      password: hashedPassword,
      salt,
      name: accountData.name || "",
      email: accountData.email || "",
      role: accountData.role || "user",
      status: accountData.status || "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    accounts = [...accounts, newAccount];
    saveAccounts(accounts);

    return { success: true, account: newAccount };
  };

  const updateAccount = async (accountId, accountData) => {
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) {
      return { success: false, message: "账号不存在" };
    }

    const existing = accounts[index];

    if (accountData.username && accountData.username !== existing.username) {
      if (accounts.some(a => a.id !== accountId && a.username.toLowerCase() === accountData.username.toLowerCase())) {
        return { success: false, message: "该用户名已存在" };
      }
    }

    const updates = {
      ...existing,
      ...accountData,
      updatedAt: Date.now(),
    };

    if (accountData.password) {
      updates.salt = generateSalt();
      updates.password = await hashPassword(accountData.password, updates.salt);
    }

    accounts[index] = updates;
    saveAccounts(accounts);

    if (getCurrentUser()?.userId === accountId) {
      const user = getCurrentUser();
      user.username = updates.username;
      user.name = updates.name;
      user.email = updates.email;
      user.role = updates.role;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }

    return { success: true, account: updates };
  };

  const deleteAccount = (accountId) => {
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) {
      return { success: false, message: "账号不存在" };
    }

    const account = accounts[index];
    if (account.role === "admin") {
      const adminCount = accounts.filter(a => a.role === "admin" && a.status === "active").length;
      if (adminCount <= 1) {
        return { success: false, message: "至少需要保留一个管理员账号" };
      }
    }

    accounts = accounts.filter(a => a.id !== accountId);
    saveAccounts(accounts);

    return { success: true };
  };

  const toggleAccountStatus = (accountId) => {
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) {
      return { success: false, message: "账号不存在" };
    }

    const account = accounts[index];
    if (account.role === "admin" && account.status === "active") {
      const adminCount = accounts.filter(a => a.role === "admin" && a.status === "active").length;
      if (adminCount <= 1) {
        return { success: false, message: "至少需要保留一个启用的管理员账号" };
      }
    }

    const newStatus = account.status === "active" ? "disabled" : "active";
    accounts[index] = { ...account, status: newStatus, updatedAt: Date.now() };
    saveAccounts(accounts);

    if (getCurrentUser()?.userId === accountId && newStatus === "disabled") {
      logout();
    }

    return { success: true, newStatus };
  };

  const getAccounts = () => {
    return accounts;
  };

  const getAccountById = (accountId) => {
    return accounts.find(a => a.id === accountId);
  };

  const initDefaultAdmin = async () => {
    const admin = accounts.find(a => a.username === "admin");
    if (!admin) {
      await addAccount({
        username: "admin",
        password: "admin",
        name: "管理员",
        email: "admin@shopdata.com",
        role: "admin",
        status: "active",
      });
    } else if (!admin.password && !admin.salt) {
      admin.salt = generateSalt();
      admin.password = await hashPassword("admin", admin.salt);
      admin.updatedAt = Date.now();
      saveAccounts(accounts);
    }
  };

  const SYNC_CODE_VERSION = "1";
  const SYNC_CODE_PREFIX = "SD-ACC-";

  const exportAccounts = () => {
    try {
      const accountsData = accounts.map(account => ({
        id: account.id,
        username: account.username,
        name: account.name,
        email: account.email,
        role: account.role,
        status: account.status,
        password: account.password,
        salt: account.salt,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }));

      const exportData = {
        version: SYNC_CODE_VERSION,
        exportTime: Date.now(),
        accountCount: accountsData.length,
        accounts: accountsData,
      };

      const jsonStr = JSON.stringify(exportData);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      return SYNC_CODE_PREFIX + encoded;
    } catch (e) {
      throw new Error("导出账号失败：" + e.message);
    }
  };

  const validateAccountData = (account) => {
    if (!account || typeof account !== "object") return false;
    if (!account.id || !account.username) return false;
    if (!account.role || !account.status) return false;
    return true;
  };

  const importAccounts = (syncCode, mode = "merge") => {
    try {
      if (!syncCode || typeof syncCode !== "string") {
        return { success: false, message: "同步码不能为空" };
      }

      let code = syncCode.trim();
      if (!code.startsWith(SYNC_CODE_PREFIX)) {
        return { success: false, message: "无效的账号同步码格式" };
      }
      code = code.substring(SYNC_CODE_PREFIX.length);

      let decoded, importData;
      try {
        decoded = decodeURIComponent(escape(atob(code)));
        importData = JSON.parse(decoded);
      } catch (e) {
        return { success: false, message: "同步码格式错误或已损坏" };
      }

      if (!importData.accounts || !Array.isArray(importData.accounts)) {
        return { success: false, message: "同步码数据格式不正确" };
      }

      const validAccounts = importData.accounts.filter(validateAccountData);
      if (validAccounts.length === 0) {
        return { success: false, message: "没有有效的账号数据" };
      }

      let newAccounts;
      let importedCount = 0;

      if (mode === "replace") {
        newAccounts = validAccounts;
        importedCount = validAccounts.length;
      } else {
        newAccounts = [...accounts];
        validAccounts.forEach(importedAcc => {
          const existingIndex = newAccounts.findIndex(a => 
            a.id === importedAcc.id || 
            a.username.toLowerCase() === importedAcc.username.toLowerCase()
          );
          if (existingIndex === -1) {
            newAccounts.push(importedAcc);
            importedCount++;
          }
        });
      }

      const hasActiveAdmin = newAccounts.some(a => a.role === "admin" && a.status === "active");
      if (!hasActiveAdmin) {
        return { success: false, message: "导入后将没有可用的管理员账号，操作已取消" };
      }

      accounts = newAccounts;
      saveAccounts(accounts);

      return {
        success: true,
        message: mode === "replace" 
          ? `成功替换所有账号（共 ${importedCount} 个）` 
          : `成功导入 ${importedCount} 个新账号`,
        importedCount,
        totalCount: accounts.length,
      };
    } catch (e) {
      return { success: false, message: "导入失败：" + e.message };
    }
  };

  initDefaultAdmin();

  return {
    login,
    logout,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    addAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    getAccounts,
    getAccountById,
    authenticate,
    exportAccounts,
    importAccounts,
  };
})();
