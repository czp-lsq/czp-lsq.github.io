// hooks/useAuth.js - 认证 Hook
// 功能：认证状态管理、登录登出、权限检查

(function() {
  const { useState, useEffect, useCallback, useMemo } = React;

  const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const loadUser = () => {
        try {
          const currentUser = window.AuthService
            ? window.AuthService.getCurrentUser()
            : (() => {
                try {
                  const saved = localStorage.getItem('app_current_user');
                  if (saved) {
                    const u = JSON.parse(saved);
                    if (u.expiresAt && u.expiresAt > Date.now()) {
                      return u;
                    }
                  }
                } catch (e) {}
                return null;
              })();
          setUser(currentUser);
        } finally {
          setIsLoading(false);
        }
      };

      loadUser();

      const handleStorageChange = (e) => {
        if (e.key === 'app_current_user') {
          loadUser();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = useCallback(async (username, password, remember) => {
      if (window.AuthService) {
        const result = await window.AuthService.login(username, password, remember);
        if (result.success) {
          setUser(result.session || result.account);
        }
        return result;
      }
      return { success: false, message: 'AuthService not available' };
    }, []);

    const logout = useCallback(() => {
      if (window.AuthService) {
        window.AuthService.logout();
      } else {
        localStorage.removeItem('app_current_user');
        localStorage.removeItem('app_session_token');
      }
      setUser(null);
    }, []);

    const hasPermission = useCallback((permission) => {
      if (window.AuthService) {
        return window.AuthService.hasPermission(permission);
      }
      if (user && user.role === 'admin') return true;
      return false;
    }, [user]);

    const isAdmin = useMemo(() => {
      if (window.AuthService) {
        return window.AuthService.isAdmin();
      }
      return user && user.role === 'admin';
    }, [user]);

    const isLoggedIn = useMemo(() => {
      return user !== null;
    }, [user]);

    const refreshUser = useCallback(() => {
      if (window.AuthService) {
        const currentUser = window.AuthService.getCurrentUser();
        setUser(currentUser);
      }
    }, []);

    return {
      user,
      isLoading,
      isLoggedIn,
      isAdmin,
      login,
      logout,
      hasPermission,
      refreshUser,
      setUser,
    };
  };

  window.useAuth = useAuth;
})();
