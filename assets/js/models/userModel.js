// models/userModel.js - 用户模型
// 功能：用户数据结构定义、验证、转换

(function() {
  const ROLES = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    USER: 'user',
  };

  const STATUS = {
    ACTIVE: 'active',
    DISABLED: 'disabled',
    PENDING: 'pending',
  };

  const UserModel = {
    ROLES,
    STATUS,

    create(data = {}) {
      return {
        id: data.id || 'usr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        username: data.username || '',
        name: data.name || '',
        email: data.email || '',
        role: data.role || ROLES.USER,
        status: data.status || STATUS.ACTIVE,
        avatar: data.avatar || null,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        lastLoginAt: data.lastLoginAt || null,
        settings: data.settings || {
          theme: 'light',
          language: 'zh-CN',
          notifications: true,
          soundEnabled: true,
        },
        permissions: data.permissions || [],
      };
    },

    validate(user) {
      const errors = [];

      if (!user || typeof user !== 'object') {
        errors.push('用户数据不能为空');
        return { valid: false, errors };
      }

      if (!user.username || typeof user.username !== 'string') {
        errors.push('用户名不能为空');
      } else if (user.username.length < 3) {
        errors.push('用户名至少3个字符');
      } else if (user.username.length > 32) {
        errors.push('用户名最多32个字符');
      } else if (!/^[a-zA-Z0-9_]+$/.test(user.username)) {
        errors.push('用户名只能包含字母、数字和下划线');
      }

      if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push('邮箱格式不正确');
      }

      if (!user.role || !Object.values(ROLES).includes(user.role)) {
        errors.push('无效的用户角色');
      }

      if (!user.status || !Object.values(STATUS).includes(user.status)) {
        errors.push('无效的用户状态');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    isAdmin(user) {
      return user && user.role === ROLES.ADMIN;
    },

    isActive(user) {
      return user && user.status === STATUS.ACTIVE;
    },

    hasPermission(user, permission) {
      if (!user) return false;
      if (user.role === ROLES.ADMIN) return true;
      if (Array.isArray(user.permissions) && user.permissions.includes(permission)) {
        return true;
      }
      const rolePermissions = {
        [ROLES.USER]: ['read', 'calc'],
        [ROLES.EDITOR]: ['read', 'calc', 'edit', 'template', 'rule'],
        [ROLES.ADMIN]: ['*'],
      };
      const perms = rolePermissions[user.role] || [];
      return perms.includes('*') || perms.includes(permission);
    },

    getDisplayName(user) {
      if (!user) return '';
      return user.name || user.username || '未知用户';
    },

    getInitials(user) {
      const name = this.getDisplayName(user);
      if (!name) return '?';
      return name.charAt(0).toUpperCase();
    },

    getRoleLabel(role) {
      const labels = {
        [ROLES.ADMIN]: '管理员',
        [ROLES.EDITOR]: '编辑者',
        [ROLES.USER]: '普通用户',
      };
      return labels[role] || role;
    },

    getStatusLabel(status) {
      const labels = {
        [STATUS.ACTIVE]: '正常',
        [STATUS.DISABLED]: '已禁用',
        [STATUS.PENDING]: '待审核',
      };
      return labels[status] || status;
    },

    toPublic(user) {
      if (!user) return null;
      const { password, salt, ...publicData } = user;
      return publicData;
    },

    toSession(user, extra = {}) {
      if (!user) return null;
      return {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        ...extra,
      };
    },

    fromSession(session) {
      if (!session) return null;
      return {
        id: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
        email: session.email,
      };
    },

    merge(base, updates) {
      return {
        ...base,
        ...updates,
        id: base.id,
        username: updates.username || base.username,
        updatedAt: Date.now(),
      };
    },

    serialize(user) {
      return JSON.stringify(user);
    },

    deserialize(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        return this.create(data);
      } catch (e) {
        return null;
      }
    },

    isExpired(session) {
      if (!session || !session.expiresAt) return true;
      return session.expiresAt < Date.now();
    },

    getAvatarUrl(user, size = 40) {
      if (user && user.avatar) {
        return user.avatar;
      }
      const name = this.getDisplayName(user);
      const initials = encodeURIComponent(this.getInitials(user));
      const bgColor = this._getColorFromString(user ? user.username : 'default');
      return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=${size}`;
    },

    _getColorFromString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = Math.abs(hash % 16777215).toString(16);
      return color.padStart(6, '0');
    },
  };

  window.UserModel = UserModel;
})();
