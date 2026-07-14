// services/authService.js - 认证服务
// 功能：登录、注册、登出、权限验证、会话管理

(function() {
  const CURRENT_USER_KEY = "app_current_user";
  const SESSION_TOKEN_KEY = "app_session_token";
  const ACCOUNTS_KEY = "app_accounts_v2";

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

  const loadAccounts = () => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [];
  };

  const saveAccounts = (accounts) => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (typeof AppStorage !== 'undefined') {
      AppStorage.set(ACCOUNTS_KEY, accounts).catch(() => {});
    }
  };

  const AuthService = {
    async login(username, password, remember = false) {
      const accounts = loadAccounts();
      const account = accounts.find(a =>
        a.username.toLowerCase() === username.toLowerCase() &&
        a.status === "active"
      );

      if (!account) {
        return { success: false, message: "用户名或密码错误" };
      }

      if (!account.password && !account.salt) {
        if (password === "admin") {
          return this._createSession(account, remember);
        }
        return { success: false, message: "用户名或密码错误" };
      }

      if (!account.salt || !account.password) {
        return { success: false, message: "账号信息不完整" };
      }

      const hashedPassword = await hashPassword(password, account.salt);
      if (hashedPassword === account.password) {
        return this._createSession(account, remember);
      }

      return { success: false, message: "用户名或密码错误" };
    },

    _createSession(account, remember) {
      const token = generateToken();
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
    },

    logout() {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);

      if (typeof AppStorage !== 'undefined') {
        AppStorage.remove(CURRENT_USER_KEY).catch(() => {});
        AppStorage.remove(SESSION_TOKEN_KEY).catch(() => {});
      }
    },

    getCurrentUser() {
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
    },

    isLoggedIn() {
      return this.getCurrentUser() !== null;
    },

    isAdmin() {
      const user = this.getCurrentUser();
      return user && user.role === "admin";
    },

    hasPermission(permission) {
      const user = this.getCurrentUser();
      if (!user) return false;
      if (user.role === "admin") return true;
      const permissions = {
        user: ["read", "calc"],
        editor: ["read", "calc", "edit"],
        admin: ["*"],
      };
      const userPerms = permissions[user.role] || [];
      return userPerms.includes("*") || userPerms.includes(permission);
    },

    async register(userData) {
      if (!userData.username || !userData.password) {
        return { success: false, message: "用户名和密码不能为空" };
      }

      const accounts = loadAccounts();
      if (accounts.some(a => a.username.toLowerCase() === userData.username.toLowerCase())) {
        return { success: false, message: "该用户名已存在" };
      }

      const salt = generateSalt();
      const hashedPassword = await hashPassword(userData.password, salt);

      const newAccount = {
        id: "acc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        username: userData.username,
        password: hashedPassword,
        salt,
        name: userData.name || "",
        email: userData.email || "",
        role: userData.role || "user",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      accounts.push(newAccount);
      saveAccounts(accounts);

      return { success: true, account: newAccount };
    },

    validateToken() {
      const user = this.getCurrentUser();
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      return user && token && user.token === token;
    },

    refreshSession() {
      const user = this.getCurrentUser();
      if (!user) return null;

      user.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    },
  };

  window.AuthService = AuthService;
})();
