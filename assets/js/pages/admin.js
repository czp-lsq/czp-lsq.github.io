(function() {
  const { useState, useEffect, useMemo } = React;

  const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    USER: "user",
  };

  const ROLE_LABELS = {
    [ROLES.ADMIN]: "超级管理员",
    [ROLES.MANAGER]: "普通管理员",
    [ROLES.USER]: "普通用户",
  };

  const STATUS_LABELS = {
    active: "启用",
    disabled: "禁用",
    pending: "待审核",
    rejected: "已拒绝",
  };

  const PERMISSIONS = {
    [ROLES.ADMIN]: [
      "dashboard",
      "users",
      "register_audit",
      "platforms",
      "templates",
      "data",
      "settings",
      "logs",
    ],
    [ROLES.MANAGER]: [
      "dashboard",
      "users_view",
      "platforms_limited",
      "templates_audit",
      "logs_own",
    ],
    [ROLES.USER]: [],
  };

  const hasPermission = (role, permission) => {
    if (role === ROLES.ADMIN) return true;
    const perms = PERMISSIONS[role] || [];
    return perms.includes(permission);
  };

  const AdminPage = ({ currentUser, onLogout, onBackToApp }) => {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [auditHistory, setAuditHistory] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [systemSettings, setSystemSettings] = useState({
      version: "",
      buildTime: "",
      systemName: "店数智 ShopData",
      maxUploadSize: 50,
      enableRegistration: true,
      defaultUserRole: "user",
      requireAudit: true,
    });
    const [updateLogs, setUpdateLogs] = useState([]);
    const [operationLogs, setOperationLogs] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      role: "user",
      status: "active",
    });
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [activeSettingTab, setActiveSettingTab] = useState("version");
    const [activeAuditTab, setActiveAuditTab] = useState("pending");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingUser, setRejectingUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [logSearchKeyword, setLogSearchKeyword] = useState("");
    const [platformSearch, setPlatformSearch] = useState("");
    const [templateSearch, setTemplateSearch] = useState("");
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState(null);
    const [platformForm, setPlatformForm] = useState({
      name: "",
      code: "",
      status: "active",
      description: "",
    });

    useEffect(() => {
      loadUsers();
      loadPendingUsers();
      loadAuditHistory();
      loadSystemSettings();
      loadUpdateLogs();
      loadOperationLogs();
      loadPlatforms();
      loadTemplates();
    }, []);

    const loadUsers = () => {
      try {
        const saved = localStorage.getItem("app_accounts");
        if (saved) {
          const all = JSON.parse(saved);
          setUsers(all.filter((u) => u.status !== "pending" && u.status !== "rejected"));
        } else {
          const defaultUsers = [
            {
              id: "admin_001",
              username: "admin",
              password: "admin123",
              name: "超级管理员",
              email: "admin@shopdata.com",
              phone: "13800138000",
              role: "admin",
              status: "active",
              createdAt: new Date().toISOString(),
              lastLogin: null,
            },
            {
              id: "manager_001",
              username: "manager",
              password: "manager123",
              name: "普通管理员",
              email: "manager@shopdata.com",
              phone: "13800138001",
              role: "manager",
              status: "active",
              createdAt: new Date().toISOString(),
              lastLogin: null,
            },
          ];
          setUsers(defaultUsers);
          localStorage.setItem("app_accounts", JSON.stringify(defaultUsers));
        }
      } catch (e) {
        console.error("加载用户失败:", e);
      }
    };

    const loadPendingUsers = () => {
      try {
        const saved = localStorage.getItem("app_pending_users");
        if (saved) {
          setPendingUsers(JSON.parse(saved));
        }
      } catch (e) {
        console.error("加载待审核用户失败:", e);
      }
    };

    const savePendingUsers = (list) => {
      setPendingUsers(list);
      localStorage.setItem("app_pending_users", JSON.stringify(list));
    };

    const loadAuditHistory = () => {
      try {
        const saved = localStorage.getItem("app_audit_history");
        if (saved) {
          setAuditHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error("加载审核历史失败:", e);
      }
    };

    const saveAuditHistory = (list) => {
      setAuditHistory(list);
      localStorage.setItem("app_audit_history", JSON.stringify(list));
    };

    const saveUsers = (newUsers) => {
      const all = [...newUsers, ...pendingUsers];
      setUsers(newUsers);
      localStorage.setItem("app_accounts", JSON.stringify(all));
    };

    const loadSystemSettings = () => {
      try {
        const saved = localStorage.getItem("app_system_settings");
        if (saved) {
          setSystemSettings({ ...systemSettings, ...JSON.parse(saved) });
        } else {
          const meta = document.querySelector('meta[name="app-version"]');
          const buildMeta = document.querySelector('meta[name="app-build-time"]');
          setSystemSettings({
            ...systemSettings,
            version: meta?.content || "czp-1.0.0",
            buildTime: buildMeta?.content || new Date().toLocaleString(),
          });
        }
      } catch (e) {
        console.error("加载系统设置失败:", e);
      }
    };

    const saveSystemSettings = () => {
      localStorage.setItem("app_system_settings", JSON.stringify(systemSettings));
      addOperationLog("系统设置", "修改系统参数配置");
      if (typeof useToast !== "undefined") {
        const { addToast } = useToast();
        addToast("success", "保存成功", "系统设置已更新");
      }
    };

    const loadUpdateLogs = () => {
      try {
        const saved = localStorage.getItem("app_update_logs");
        if (saved) {
          setUpdateLogs(JSON.parse(saved));
        } else {
          const defaultLogs = [
            {
              id: 1,
              version: "czp-1.0.0",
              date: new Date().toISOString(),
              title: "初始版本",
              content: "系统初始版本发布",
              type: "feature",
            },
          ];
          setUpdateLogs(defaultLogs);
          localStorage.setItem("app_update_logs", JSON.stringify(defaultLogs));
        }
      } catch (e) {
        console.error("加载更新日志失败:", e);
      }
    };

    const loadOperationLogs = () => {
      try {
        const saved = localStorage.getItem("app_operation_logs");
        if (saved) {
          setOperationLogs(JSON.parse(saved));
        } else {
          const defaultLogs = [
            {
              id: 1,
              userId: "admin_001",
              username: "admin",
              action: "用户登录",
              detail: "管理员登录系统",
              time: new Date().toISOString(),
              ip: "127.0.0.1",
            },
          ];
          setOperationLogs(defaultLogs);
          localStorage.setItem("app_operation_logs", JSON.stringify(defaultLogs));
        }
      } catch (e) {
        console.error("加载操作日志失败:", e);
      }
    };

    const loadPlatforms = () => {
      try {
        const saved = localStorage.getItem("app_admin_platforms");
        if (saved) {
          setPlatforms(JSON.parse(saved));
        } else {
          const defaultPlatforms = [
            {
              id: "pdd",
              name: "拼多多",
              code: "pdd",
              status: "active",
              description: "拼多多电商平台",
              createdAt: new Date().toISOString(),
              templateCount: 12,
              shopCount: 8,
            },
            {
              id: "taobao",
              name: "淘宝",
              code: "taobao",
              status: "active",
              description: "淘宝电商平台",
              createdAt: new Date().toISOString(),
              templateCount: 15,
              shopCount: 12,
            },
            {
              id: "douyin",
              name: "抖音",
              code: "douyin",
              status: "active",
              description: "抖音电商平台",
              createdAt: new Date().toISOString(),
              templateCount: 8,
              shopCount: 5,
            },
          ];
          setPlatforms(defaultPlatforms);
          localStorage.setItem("app_admin_platforms", JSON.stringify(defaultPlatforms));
        }
      } catch (e) {
        console.error("加载平台失败:", e);
      }
    };

    const savePlatforms = (list) => {
      setPlatforms(list);
      localStorage.setItem("app_admin_platforms", JSON.stringify(list));
    };

    const loadTemplates = () => {
      try {
        const saved = localStorage.getItem("app_admin_templates");
        if (saved) {
          setTemplates(JSON.parse(saved));
        } else {
          const defaultTemplates = [
            {
              id: "tpl_001",
              name: "利润表模板V1",
              platform: "拼多多",
              author: "admin",
              status: "approved",
              category: "利润核算",
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
              recommended: true,
              downloads: 128,
            },
            {
              id: "tpl_002",
              name: "销售明细表",
              platform: "淘宝",
              author: "manager",
              status: "pending",
              category: "销售统计",
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
              recommended: false,
              downloads: 0,
            },
            {
              id: "tpl_003",
              name: "库存预警模板",
              platform: "抖音",
              author: "user1",
              status: "approved",
              category: "库存管理",
              createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
              recommended: false,
              downloads: 56,
            },
            {
              id: "tpl_004",
              name: "推广效果分析",
              platform: "拼多多",
              author: "user2",
              status: "pending",
              category: "数据分析",
              createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
              recommended: false,
              downloads: 0,
            },
          ];
          setTemplates(defaultTemplates);
          localStorage.setItem("app_admin_templates", JSON.stringify(defaultTemplates));
        }
      } catch (e) {
        console.error("加载模板失败:", e);
      }
    };

    const saveTemplates = (list) => {
      setTemplates(list);
      localStorage.setItem("app_admin_templates", JSON.stringify(list));
    };

    const addOperationLog = (action, detail) => {
      const newLog = {
        id: Date.now(),
        userId: currentUser?.id || "",
        username: currentUser?.username || "",
        action,
        detail,
        time: new Date().toISOString(),
        ip: "127.0.0.1",
      };
      const newLogs = [newLog, ...operationLogs].slice(0, 500);
      setOperationLogs(newLogs);
      localStorage.setItem("app_operation_logs", JSON.stringify(newLogs));
    };

    const stats = useMemo(() => {
      const today = new Date().toDateString();
      const todayActive = operationLogs.filter(
        (log) => new Date(log.time).toDateString() === today
      ).length;

      const pendingCount = pendingUsers.length;
      const activeUsers = users.filter((u) => u.status === "active").length;

      return {
        totalUsers: users.length,
        activeUsers,
        pendingCount,
        totalPlatforms: platforms.length,
        totalTemplates: templates.length,
        todayActive,
        pendingTemplates: templates.filter((t) => t.status === "pending").length,
      };
    }, [users, operationLogs, pendingUsers, platforms, templates]);

    const filteredUsers = useMemo(() => {
      if (!searchKeyword) return users;
      const kw = searchKeyword.toLowerCase();
      return users.filter(
        (u) =>
          u.username.toLowerCase().includes(kw) ||
          (u.name && u.name.toLowerCase().includes(kw)) ||
          (u.email && u.email.toLowerCase().includes(kw))
      );
    }, [users, searchKeyword]);

    const filteredLogs = useMemo(() => {
      let logs = operationLogs;
      if (currentUser?.role === ROLES.MANAGER) {
        logs = logs.filter((l) => l.userId === currentUser.id);
      }
      if (!logSearchKeyword) return logs;
      const kw = logSearchKeyword.toLowerCase();
      return logs.filter(
        (l) =>
          l.username.toLowerCase().includes(kw) ||
          l.action.toLowerCase().includes(kw) ||
          l.detail.toLowerCase().includes(kw)
      );
    }, [operationLogs, logSearchKeyword, currentUser]);

    const filteredPlatforms = useMemo(() => {
      if (!platformSearch) return platforms;
      const kw = platformSearch.toLowerCase();
      return platforms.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.code.toLowerCase().includes(kw)
      );
    }, [platforms, platformSearch]);

    const filteredTemplates = useMemo(() => {
      if (!templateSearch) return templates;
      const kw = templateSearch.toLowerCase();
      return templates.filter(
        (t) =>
          t.name.toLowerCase().includes(kw) ||
          t.platform.toLowerCase().includes(kw) ||
          t.author.toLowerCase().includes(kw)
      );
    }, [templates, templateSearch]);

    const menuItems = useMemo(() => {
      const allItems = [
        { id: "dashboard", name: "仪表盘", icon: Icons.BarChart3, perm: "dashboard" },
        { id: "users", name: "用户管理", icon: Icons.Users, perm: "users" },
        { id: "register_audit", name: "注册审核", icon: Icons.UserCheck, perm: "register_audit", badge: stats.pendingCount },
        { id: "platforms", name: "平台管理", icon: Icons.Layers, perm: "platforms" },
        { id: "templates", name: "模板管理", icon: Icons.FileSpreadsheet, perm: "templates", badge: stats.pendingTemplates },
        { id: "data", name: "数据管理", icon: Icons.Database, perm: "data" },
        { id: "settings", name: "系统设置", icon: Icons.Settings, perm: "settings" },
        { id: "logs", name: "操作日志", icon: Icons.FileText, perm: "logs" },
      ];
      return allItems.filter((item) => hasPermission(currentUser?.role, item.perm));
    }, [currentUser, stats]);

    const handleAddUser = () => {
      if (!userForm.username || !userForm.password) {
        alert("用户名和密码为必填项");
        return;
      }
      if (users.some((u) => u.username === userForm.username)) {
        alert("用户名已存在");
        return;
      }
      const newUser = {
        ...userForm,
        id: `user_${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };
      saveUsers([...users, newUser]);
      addOperationLog("新增用户", `新增用户: ${newUser.username}`);
      setShowUserModal(false);
      resetUserForm();
    };

    const handleUpdateUser = () => {
      if (!userForm.username || !editingUser) return;
      if (users.some((u) => u.username === userForm.username && u.id !== editingUser.id)) {
        alert("用户名已存在");
        return;
      }
      const updated = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              username: userForm.username,
              name: userForm.name,
              email: userForm.email,
              phone: userForm.phone,
              role: userForm.role,
              status: userForm.status,
              ...(userForm.password ? { password: userForm.password } : {}),
            }
          : u
      );
      saveUsers(updated);
      addOperationLog("编辑用户", `编辑用户: ${userForm.username}`);
      setShowUserModal(false);
      resetUserForm();
    };

    const handleDeleteUser = (user) => {
      const adminCount = users.filter((u) => u.role === "admin" && u.status === "active").length;
      if (user.role === "admin" && adminCount <= 1) {
        alert("系统至少需要保留一个管理员账户");
        return;
      }
      setConfirmDialog({
        title: "确认删除",
        message: `确认删除用户「${user.name || user.username}」？此操作不可撤销。`,
        onConfirm: () => {
          saveUsers(users.filter((u) => u.id !== user.id));
          addOperationLog("删除用户", `删除用户: ${user.username}`);
          setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
      });
    };

    const handleResetPassword = (user) => {
      const newPassword = prompt(`请输入用户「${user.name || user.username}」的新密码：`);
      if (!newPassword) return;
      if (newPassword.length < 4) {
        alert("密码至少4个字符");
        return;
      }
      const updated = users.map((u) =>
        u.id === user.id ? { ...u, password: newPassword } : u
      );
      saveUsers(updated);
      addOperationLog("重置密码", `重置用户密码: ${user.username}`);
      alert("密码重置成功");
    };

    const resetUserForm = () => {
      setUserForm({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        role: "user",
        status: "active",
      });
      setEditingUser(null);
    };

    const openAddUser = () => {
      resetUserForm();
      setShowUserModal(true);
    };

    const openEditUser = (user) => {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        password: "",
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        status: user.status,
      });
      setShowUserModal(true);
    };

    const toggleUserStatus = (user) => {
      const adminCount = users.filter((u) => u.role === "admin" && u.status === "active").length;
      if (user.role === "admin" && user.status === "active" && adminCount <= 1) {
        alert("系统至少需要保留一个启用的管理员账户");
        return;
      }
      const updated = users.map((u) =>
        u.id === user.id ? { ...u, status: u.status === "active" ? "disabled" : "active" } : u
      );
      saveUsers(updated);
      addOperationLog(
        user.status === "active" ? "禁用用户" : "启用用户",
        `${user.status === "active" ? "禁用" : "启用"}用户: ${user.username}`
      );
    };

    const handleApproveUser = (user) => {
      setConfirmDialog({
        title: "确认通过",
        message: `确认通过用户「${user.name || user.username}」的注册申请？`,
        onConfirm: () => {
          const approvedUser = {
            ...user,
            status: "active",
            role: systemSettings.defaultUserRole || "user",
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser?.username,
          };
          saveUsers([...users, approvedUser]);
          savePendingUsers(pendingUsers.filter((u) => u.id !== user.id));
          const historyItem = {
            id: Date.now(),
            userId: user.id,
            username: user.username,
            action: "approve",
            reason: "",
            operator: currentUser?.username,
            time: new Date().toISOString(),
          };
          saveAuditHistory([historyItem, ...auditHistory]);
          addOperationLog("注册审核", `通过用户注册: ${user.username}`);
          setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
      });
    };

    const openRejectModal = (user) => {
      setRejectingUser(user);
      setRejectReason("");
      setShowRejectModal(true);
    };

    const handleRejectUser = () => {
      if (!rejectingUser) return;
      if (!rejectReason.trim()) {
        alert("请填写拒绝原因");
        return;
      }
      const rejectedUser = {
        ...rejectingUser,
        status: "rejected",
        rejectReason: rejectReason,
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.username,
      };
      const allAccounts = JSON.parse(localStorage.getItem("app_accounts") || "[]");
      const updatedAccounts = allAccounts.map((u) =>
        u.id === rejectingUser.id ? rejectedUser : u
      );
      if (!updatedAccounts.some((u) => u.id === rejectingUser.id)) {
        updatedAccounts.push(rejectedUser);
      }
      localStorage.setItem("app_accounts", JSON.stringify(updatedAccounts));
      savePendingUsers(pendingUsers.filter((u) => u.id !== rejectingUser.id));
      const historyItem = {
        id: Date.now(),
        userId: rejectingUser.id,
        username: rejectingUser.username,
        action: "reject",
        reason: rejectReason,
        operator: currentUser?.username,
        time: new Date().toISOString(),
      };
      saveAuditHistory([historyItem, ...auditHistory]);
      addOperationLog("注册审核", `拒绝用户注册: ${rejectingUser.username}`);
      setShowRejectModal(false);
      setRejectingUser(null);
      setRejectReason("");
    };

    const handleBatchApprove = () => {
      if (selectedUsers.length === 0) {
        alert("请先选择要审核的用户");
        return;
      }
      setConfirmDialog({
        title: "批量通过",
        message: `确认通过 ${selectedUsers.length} 个用户的注册申请？`,
        onConfirm: () => {
          const approvedUsers = pendingUsers
            .filter((u) => selectedUsers.includes(u.id))
            .map((u) => ({
              ...u,
              status: "active",
              role: systemSettings.defaultUserRole || "user",
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser?.username,
            }));
          saveUsers([...users, ...approvedUsers]);
          savePendingUsers(pendingUsers.filter((u) => !selectedUsers.includes(u.id)));
          const historyItems = approvedUsers.map((u, idx) => ({
            id: Date.now() + idx,
            userId: u.id,
            username: u.username,
            action: "approve",
            reason: "",
            operator: currentUser?.username,
            time: new Date().toISOString(),
          }));
          saveAuditHistory([...historyItems, ...auditHistory]);
          addOperationLog("注册审核", `批量通过 ${approvedUsers.length} 个用户`);
          setSelectedUsers([]);
          setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
      });
    };

    const toggleSelectUser = (userId) => {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    };

    const toggleSelectAll = () => {
      if (selectedUsers.length === pendingUsers.length) {
        setSelectedUsers([]);
      } else {
        setSelectedUsers(pendingUsers.map((u) => u.id));
      }
    };

    const handleAddPlatform = () => {
      if (!platformForm.name || !platformForm.code) {
        alert("平台名称和编码为必填项");
        return;
      }
      const newPlatform = {
        ...platformForm,
        id: `platform_${Date.now()}`,
        createdAt: new Date().toISOString(),
        templateCount: 0,
        shopCount: 0,
      };
      savePlatforms([...platforms, newPlatform]);
      addOperationLog("新增平台", `新增平台: ${newPlatform.name}`);
      setShowPlatformModal(false);
      resetPlatformForm();
    };

    const handleUpdatePlatform = () => {
      if (!platformForm.name || !editingPlatform) return;
      const updated = platforms.map((p) =>
        p.id === editingPlatform.id
          ? {
              ...p,
              name: platformForm.name,
              code: platformForm.code,
              status: platformForm.status,
              description: platformForm.description,
            }
          : p
      );
      savePlatforms(updated);
      addOperationLog("编辑平台", `编辑平台: ${platformForm.name}`);
      setShowPlatformModal(false);
      resetPlatformForm();
    };

    const handleDeletePlatform = (platform) => {
      setConfirmDialog({
        title: "确认删除",
        message: `确认删除平台「${platform.name}」？此操作不可撤销。`,
        onConfirm: () => {
          savePlatforms(platforms.filter((p) => p.id !== platform.id));
          addOperationLog("删除平台", `删除平台: ${platform.name}`);
          setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
      });
    };

    const togglePlatformStatus = (platform) => {
      const updated = platforms.map((p) =>
        p.id === platform.id ? { ...p, status: p.status === "active" ? "disabled" : "active" } : p
      );
      savePlatforms(updated);
      addOperationLog(
        platform.status === "active" ? "下架平台" : "上架平台",
        `${platform.status === "active" ? "下架" : "上架"}平台: ${platform.name}`
      );
    };

    const resetPlatformForm = () => {
      setPlatformForm({
        name: "",
        code: "",
        status: "active",
        description: "",
      });
      setEditingPlatform(null);
    };

    const openAddPlatform = () => {
      resetPlatformForm();
      setShowPlatformModal(true);
    };

    const openEditPlatform = (platform) => {
      setEditingPlatform(platform);
      setPlatformForm({
        name: platform.name,
        code: platform.code,
        status: platform.status,
        description: platform.description || "",
      });
      setShowPlatformModal(true);
    };

    const handleApproveTemplate = (template) => {
      const updated = templates.map((t) =>
        t.id === template.id ? { ...t, status: "approved", approvedAt: new Date().toISOString() } : t
      );
      saveTemplates(updated);
      addOperationLog("模板审核", `通过模板: ${template.name}`);
    };

    const handleRejectTemplate = (template) => {
      const reason = prompt("请输入拒绝原因：");
      if (!reason) return;
      const updated = templates.map((t) =>
        t.id === template.id
          ? { ...t, status: "rejected", rejectReason: reason, rejectedAt: new Date().toISOString() }
          : t
      );
      saveTemplates(updated);
      addOperationLog("模板审核", `拒绝模板: ${template.name}`);
    };

    const toggleRecommendTemplate = (template) => {
      const updated = templates.map((t) =>
        t.id === template.id ? { ...t, recommended: !t.recommended } : t
      );
      saveTemplates(updated);
      addOperationLog(
        template.recommended ? "取消推荐" : "推荐模板",
        `${template.recommended ? "取消推荐" : "推荐"}模板: ${template.name}`
      );
    };

    const handleDeleteTemplate = (template) => {
      setConfirmDialog({
        title: "确认删除",
        message: `确认删除模板「${template.name}」？此操作不可撤销。`,
        onConfirm: () => {
          saveTemplates(templates.filter((t) => t.id !== template.id));
          addOperationLog("删除模板", `删除模板: ${template.name}`);
          setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
      });
    };

    const handleBackupData = () => {
      try {
        const data = {
          accounts: localStorage.getItem("app_accounts"),
          pendingUsers: localStorage.getItem("app_pending_users"),
          auditHistory: localStorage.getItem("app_audit_history"),
          systemSettings: localStorage.getItem("app_system_settings"),
          operationLogs: localStorage.getItem("app_operation_logs"),
          platforms: localStorage.getItem("app_admin_platforms"),
          templates: localStorage.getItem("app_admin_templates"),
          appState: localStorage.getItem("app_state"),
          backupTime: new Date().toISOString(),
          version: systemSettings.version,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shopdata_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addOperationLog("数据备份", "执行数据备份操作");
        alert("备份成功！");
      } catch (e) {
        alert("备份失败: " + e.message);
      }
    };

    const handleRestoreData = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!confirm("恢复数据将覆盖当前所有数据，确定继续吗？")) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.accounts) localStorage.setItem("app_accounts", data.accounts);
            if (data.pendingUsers) localStorage.setItem("app_pending_users", data.pendingUsers);
            if (data.auditHistory) localStorage.setItem("app_audit_history", data.auditHistory);
            if (data.systemSettings) localStorage.setItem("app_system_settings", data.systemSettings);
            if (data.operationLogs) localStorage.setItem("app_operation_logs", data.operationLogs);
            if (data.platforms) localStorage.setItem("app_admin_platforms", data.platforms);
            if (data.templates) localStorage.setItem("app_admin_templates", data.templates);
            if (data.appState) localStorage.setItem("app_state", data.appState);
            addOperationLog("数据恢复", "执行数据恢复操作");
            alert("恢复成功！请刷新页面。");
            location.reload();
          } catch (err) {
            alert("恢复失败: 文件格式不正确");
          }
        };
        reader.readAsText(file);
      };
      input.click();
    };

    const handleExportData = (type) => {
      let data = [];
      let filename = "";
      if (type === "users") {
        data = users;
        filename = `users_${new Date().toISOString().slice(0, 10)}.json`;
      } else if (type === "logs") {
        data = filteredLogs;
        filename = `operation_logs_${new Date().toISOString().slice(0, 10)}.json`;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addOperationLog("数据导出", `导出数据: ${type}`);
    };

    const breadcrumbItems = useMemo(() => {
      const items = [{ name: "首页", id: "dashboard" }];
      const menuMap = {
        dashboard: "仪表盘",
        users: "用户管理",
        register_audit: "注册审核",
        platforms: "平台管理",
        templates: "模板管理",
        data: "数据管理",
        settings: "系统设置",
        logs: "操作日志",
      };
      if (activeMenu !== "dashboard" && menuMap[activeMenu]) {
        items.push({ name: menuMap[activeMenu], id: activeMenu });
      }
      return items;
    }, [activeMenu]);

    const renderSidebar = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-sidebar" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-sidebar-header" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "admin-logo" },
            /*#__PURE__*/ React.createElement(Icons.Layers, {
              style: { width: 28, height: 28, color: "var(--color-primary)" },
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "admin-brand" },
            /*#__PURE__*/ React.createElement("div", { className: "admin-brand-title" }, "店数智后台"),
            /*#__PURE__*/ React.createElement("div", { className: "admin-brand-sub" }, "管理控制台"),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-menu" },
          menuItems.map((item) =>
            /*#__PURE__*/ React.createElement(
              "button",
              {
                key: item.id,
                className: `admin-menu-item ${activeMenu === item.id ? "active" : ""}`,
                onClick: () => setActiveMenu(item.id),
              },
              /*#__PURE__*/ React.createElement(item.icon, { size: 18 }),
              /*#__PURE__*/ React.createElement("span", null, item.name),
              item.badge > 0 &&
                /*#__PURE__*/ React.createElement("span", { className: "menu-badge" }, item.badge),
            )
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-sidebar-footer" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "admin-user-info" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "admin-user-avatar" },
              (currentUser?.name || currentUser?.username || "A").charAt(0).toUpperCase(),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "admin-user-detail" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "admin-user-name" },
                currentUser?.name || currentUser?.username,
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "admin-user-role" },
                ROLE_LABELS[currentUser?.role] || "普通用户",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "admin-actions" },
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "admin-action-btn",
                onClick: onBackToApp,
                title: "返回前台",
              },
              /*#__PURE__*/ React.createElement(Icons.ArrowLeft, { size: 16 }),
            ),
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "admin-action-btn",
                onClick: onLogout,
                title: "退出登录",
              },
              /*#__PURE__*/ React.createElement(Icons.LogOut, { size: 16 }),
            ),
          ),
        ),
      );

    const renderTopBar = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-topbar" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-breadcrumb" },
          breadcrumbItems.map((item, index) =>
            /*#__PURE__*/ React.createElement(
              React.Fragment,
              { key: item.id },
              index > 0 &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "breadcrumb-sep" },
                  /*#__PURE__*/ React.createElement(Icons.ChevronRight, { size: 14 }),
                ),
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  className: `breadcrumb-item ${index === breadcrumbItems.length - 1 ? "active" : ""}`,
                  onClick: () => index < breadcrumbItems.length - 1 && setActiveMenu(item.id),
                },
                item.name,
              ),
            )
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-topbar-right" },
          /*#__PURE__*/ React.createElement(
            "button",
            { className: "topbar-icon-btn", title: "通知" },
            /*#__PURE__*/ React.createElement(Icons.Bell, { size: 18 }),
            stats.pendingCount > 0 &&
              /*#__PURE__*/ React.createElement("span", { className: "topbar-badge" }, stats.pendingCount),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "topbar-user" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "topbar-avatar" },
              (currentUser?.name || currentUser?.username || "A").charAt(0).toUpperCase(),
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "topbar-username" },
              currentUser?.name || currentUser?.username,
            ),
          ),
        ),
      );

    const renderDashboard = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-dashboard" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
            "仪表盘",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "系统数据概览与统计分析",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stats-grid" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stat-card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.Users, null),
              "总用户数",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-value" },
              stats.totalUsers,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-icon" },
              /*#__PURE__*/ React.createElement(Icons.Users, null),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stat-card success" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.UserCheck, null),
              "活跃用户",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-value" },
              stats.activeUsers,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-icon" },
              /*#__PURE__*/ React.createElement(Icons.UserCheck, null),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stat-card warning" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.Clock, null),
              "待审核",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-value" },
              stats.pendingCount,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-icon" },
              /*#__PURE__*/ React.createElement(Icons.Clock, null),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stat-card info" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.Activity, null),
              "今日活跃",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-value" },
              stats.todayActive,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-icon" },
              /*#__PURE__*/ React.createElement(Icons.Activity, null),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stat-card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.Layers, null),
              "平台数量",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-value" },
              stats.totalPlatforms,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-icon" },
              /*#__PURE__*/ React.createElement(Icons.Layers, null),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stat-card success" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
              "模板数量",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-value" },
              stats.totalTemplates,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-icon" },
              /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-dashboard-row" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-header" },
              /*#__PURE__*/ React.createElement(
                "h3",
                { className: "card-title" },
                "最近操作记录",
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-body" },
              operationLogs.length === 0
                ? /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "empty" },
                    /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无操作记录"),
                  )
                : /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "log-list" },
                    operationLogs.slice(0, 8).map((log) =>
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { key: log.id, className: "log-item" },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "log-icon" },
                          /*#__PURE__*/ React.createElement(Icons.FileText, { size: 16 }),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "log-content" },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "log-action" },
                            log.action,
                          ),
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "log-detail" },
                            log.detail,
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "log-meta" },
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "log-user" },
                            log.username,
                          ),
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "log-time" },
                            new Date(log.time).toLocaleString(),
                          ),
                        ),
                      )
                    ),
                  ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-header" },
              /*#__PURE__*/ React.createElement(
                "h3",
                { className: "card-title" },
                "快速操作",
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-body" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "quick-actions" },
                hasPermission(currentUser?.role, "users") &&
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "quick-action-btn", onClick: openAddUser },
                    /*#__PURE__*/ React.createElement(Icons.UserPlus, { size: 24 }),
                    /*#__PURE__*/ React.createElement("span", null, "新增用户"),
                  ),
                hasPermission(currentUser?.role, "register_audit") &&
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "quick-action-btn", onClick: () => setActiveMenu("register_audit") },
                    /*#__PURE__*/ React.createElement(Icons.UserCheck, { size: 24 }),
                    /*#__PURE__*/ React.createElement("span", null, "注册审核"),
                    stats.pendingCount > 0 &&
                      /*#__PURE__*/ React.createElement("span", { className: "quick-badge" }, stats.pendingCount),
                  ),
                hasPermission(currentUser?.role, "platforms") &&
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "quick-action-btn", onClick: openAddPlatform },
                    /*#__PURE__*/ React.createElement(Icons.Plus, { size: 24 }),
                    /*#__PURE__*/ React.createElement("span", null, "新增平台"),
                  ),
                hasPermission(currentUser?.role, "data") &&
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "quick-action-btn", onClick: handleBackupData },
                    /*#__PURE__*/ React.createElement(Icons.Download, { size: 24 }),
                    /*#__PURE__*/ React.createElement("span", null, "数据备份"),
                  ),
              ),
            ),
          ),
        ),
      );

    const renderUsers = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-users" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.Users, null),
            "用户管理",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "管理系统用户账户与权限",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "action-bar" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-left" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "search-box" },
              /*#__PURE__*/ React.createElement(Icons.Search, { size: 16 }),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                placeholder: "搜索用户名、姓名、邮箱...",
                className: "search-input",
                value: searchKeyword,
                onChange: (e) => setSearchKeyword(e.target.value),
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-right" },
            hasPermission(currentUser?.role, "users") &&
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-primary", onClick: openAddUser },
                /*#__PURE__*/ React.createElement(Icons.Plus, { size: 16 }),
                " 新增用户",
              ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "data-table-container" },
            /*#__PURE__*/ React.createElement(
              "table",
              { className: "table" },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  /*#__PURE__*/ React.createElement("th", null, "用户名"),
                  /*#__PURE__*/ React.createElement("th", null, "姓名"),
                  /*#__PURE__*/ React.createElement("th", null, "邮箱"),
                  /*#__PURE__*/ React.createElement("th", null, "手机号"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 100 } }, "角色"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 80 } }, "状态"),
                  /*#__PURE__*/ React.createElement("th", null, "创建时间"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 220 } }, "操作"),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                filteredUsers.length === 0
                  ? /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { colSpan: 8, style: { textAlign: "center", padding: "40px" } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty" },
                          /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无用户"),
                        ),
                      ),
                    )
                  : filteredUsers.map((user) =>
                      /*#__PURE__*/ React.createElement(
                        "tr",
                        { key: user.id },
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "font-medium" },
                            user.username,
                          ),
                        ),
                        /*#__PURE__*/ React.createElement("td", null, user.name || "-"),
                        /*#__PURE__*/ React.createElement("td", null, user.email || "-"),
                        /*#__PURE__*/ React.createElement("td", null, user.phone || "-"),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              className: `tag ${
                                user.role === "admin"
                                  ? "tag-primary"
                                  : user.role === "manager"
                                  ? "tag-warning"
                                  : "tag-default"
                              }`,
                            },
                            ROLE_LABELS[user.role] || user.role,
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              className: `tag ${user.status === "active" ? "tag-success" : "tag-danger"}`,
                            },
                            STATUS_LABELS[user.status] || user.status,
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          new Date(user.createdAt).toLocaleDateString(),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          hasPermission(currentUser?.role, "users") &&
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "action-btn-group" },
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: "action-btn action-edit",
                                  onClick: () => openEditUser(user),
                                },
                                /*#__PURE__*/ React.createElement(Icons.Pencil, { size: 14 }),
                                " 编辑",
                              ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: "action-btn",
                                  onClick: () => handleResetPassword(user),
                                },
                                /*#__PURE__*/ React.createElement(Icons.Key, { size: 14 }),
                                " 重置密码",
                              ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: `action-btn ${user.status === "active" ? "" : "action-view"}`,
                                  onClick: () => toggleUserStatus(user),
                                },
                                user.status === "active"
                                  ? /*#__PURE__*/ React.createElement(
                                      React.Fragment,
                                      null,
                                      /*#__PURE__*/ React.createElement(Icons.Pause, { size: 14 }),
                                      " 禁用",
                                    )
                                  : /*#__PURE__*/ React.createElement(
                                      React.Fragment,
                                      null,
                                      /*#__PURE__*/ React.createElement(Icons.Play, { size: 14 }),
                                      " 启用",
                                    ),
                              ),
                              user.role !== "admin" &&
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "action-btn action-delete",
                                    onClick: () => handleDeleteUser(user),
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.Trash, { size: 14 }),
                                  " 删除",
                                ),
                            ),
                        ),
                      )
                    ),
              ),
            ),
          ),
        ),
      );

    const renderRegisterAudit = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-audit" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.UserCheck, null),
            "注册审核",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "审核用户注册申请",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "tabs" },
          [
            { id: "pending", name: "待审核", count: pendingUsers.length },
            { id: "history", name: "审核历史", count: auditHistory.length },
          ].map((tab) =>
            /*#__PURE__*/ React.createElement(
              "button",
              {
                key: tab.id,
                className: `tab-item ${activeAuditTab === tab.id ? "active" : ""}`,
                onClick: () => setActiveAuditTab(tab.id),
              },
              tab.name,
              tab.count > 0 &&
                /*#__PURE__*/ React.createElement("span", { className: "tab-badge" }, tab.count),
            )
          ),
        ),
        activeAuditTab === "pending" &&
          /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "action-bar" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "action-left" },
                pendingUsers.length > 0 &&
                  /*#__PURE__*/ React.createElement(
                    React.Fragment,
                    null,
                    /*#__PURE__*/ React.createElement(
                      "label",
                      { className: "checkbox-label" },
                      /*#__PURE__*/ React.createElement("input", {
                        type: "checkbox",
                        checked: selectedUsers.length === pendingUsers.length && pendingUsers.length > 0,
                        onChange: toggleSelectAll,
                      }),
                      "全选",
                    ),
                    /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "btn btn-primary btn-sm",
                        onClick: handleBatchApprove,
                        disabled: selectedUsers.length === 0,
                      },
                      "批量通过",
                    ),
                  ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "action-right" },
                selectedUsers.length > 0 &&
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "selected-count" },
                    `已选择 ${selectedUsers.length} 项`,
                  ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "data-table-container" },
                /*#__PURE__*/ React.createElement(
                  "table",
                  { className: "table" },
                  /*#__PURE__*/ React.createElement(
                    "thead",
                    null,
                    /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement("th", { style: { width: 40 } }, ""),
                      /*#__PURE__*/ React.createElement("th", null, "用户名"),
                      /*#__PURE__*/ React.createElement("th", null, "姓名"),
                      /*#__PURE__*/ React.createElement("th", null, "邮箱"),
                      /*#__PURE__*/ React.createElement("th", null, "手机号"),
                      /*#__PURE__*/ React.createElement("th", null, "申请时间"),
                      /*#__PURE__*/ React.createElement("th", { style: { width: 160 } }, "操作"),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "tbody",
                    null,
                    pendingUsers.length === 0
                      ? /*#__PURE__*/ React.createElement(
                          "tr",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "td",
                            { colSpan: 7, style: { textAlign: "center", padding: "40px" } },
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "empty" },
                              /*#__PURE__*/ React.createElement("div", { className: "empty-icon" },
                                /*#__PURE__*/ React.createElement(Icons.CheckCircle, { size: 48 }),
                              ),
                              /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无待审核用户"),
                              /*#__PURE__*/ React.createElement("div", { className: "empty-desc" }, "所有注册申请已处理完毕"),
                            ),
                          ),
                        )
                      : pendingUsers.map((user) =>
                          /*#__PURE__*/ React.createElement(
                            "tr",
                            { key: user.id },
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement("input", {
                                type: "checkbox",
                                checked: selectedUsers.includes(user.id),
                                onChange: () => toggleSelectUser(user.id),
                              }),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                "span",
                                { className: "font-medium" },
                                user.username,
                              ),
                            ),
                            /*#__PURE__*/ React.createElement("td", null, user.name || "-"),
                            /*#__PURE__*/ React.createElement("td", null, user.email || "-"),
                            /*#__PURE__*/ React.createElement("td", null, user.phone || "-"),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              new Date(user.createdAt).toLocaleString(),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "action-btn-group" },
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "action-btn action-view",
                                    onClick: () => handleApproveUser(user),
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.Check, { size: 14 }),
                                  " 通过",
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "action-btn action-delete",
                                    onClick: () => openRejectModal(user),
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.X, { size: 14 }),
                                  " 拒绝",
                                ),
                              ),
                            ),
                          )
                        ),
                  ),
                ),
              ),
            ),
          ),
        activeAuditTab === "history" &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-table-container" },
              /*#__PURE__*/ React.createElement(
                "table",
                { className: "table" },
                /*#__PURE__*/ React.createElement(
                  "thead",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    null,
                    /*#__PURE__*/ React.createElement("th", null, "用户名"),
                    /*#__PURE__*/ React.createElement("th", null, "操作类型"),
                    /*#__PURE__*/ React.createElement("th", null, "原因"),
                    /*#__PURE__*/ React.createElement("th", null, "操作人"),
                    /*#__PURE__*/ React.createElement("th", null, "操作时间"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "tbody",
                  null,
                  auditHistory.length === 0
                    ? /*#__PURE__*/ React.createElement(
                        "tr",
                        null,
                        /*#__PURE__*/ React.createElement(
                          "td",
                          { colSpan: 5, style: { textAlign: "center", padding: "40px" } },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "empty" },
                            /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无审核记录"),
                          ),
                        ),
                      )
                    : auditHistory.map((item) =>
                        /*#__PURE__*/ React.createElement(
                          "tr",
                          { key: item.id },
                          /*#__PURE__*/ React.createElement(
                            "td",
                            null,
                            /*#__PURE__*/ React.createElement(
                              "span",
                              { className: "font-medium" },
                              item.username,
                            ),
                          ),
                          /*#__PURE__*/ React.createElement(
                            "td",
                            null,
                            /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                className: `tag ${item.action === "approve" ? "tag-success" : "tag-danger"}`,
                              },
                              item.action === "approve" ? "通过" : "拒绝",
                            ),
                          ),
                          /*#__PURE__*/ React.createElement("td", null, item.reason || "-"),
                          /*#__PURE__*/ React.createElement("td", null, item.operator || "-"),
                          /*#__PURE__*/ React.createElement(
                            "td",
                            null,
                            new Date(item.time).toLocaleString(),
                          ),
                        )
                      ),
                ),
              ),
            ),
          ),
      );

    const renderPlatforms = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-platforms" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.Layers, null),
            "平台管理",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "管理电商平台配置",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "action-bar" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-left" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "search-box" },
              /*#__PURE__*/ React.createElement(Icons.Search, { size: 16 }),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                placeholder: "搜索平台名称...",
                className: "search-input",
                value: platformSearch,
                onChange: (e) => setPlatformSearch(e.target.value),
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-right" },
            hasPermission(currentUser?.role, "platforms") &&
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-primary", onClick: openAddPlatform },
                /*#__PURE__*/ React.createElement(Icons.Plus, { size: 16 }),
                " 新增平台",
              ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "data-table-container" },
            /*#__PURE__*/ React.createElement(
              "table",
              { className: "table" },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  /*#__PURE__*/ React.createElement("th", null, "平台名称"),
                  /*#__PURE__*/ React.createElement("th", null, "编码"),
                  /*#__PURE__*/ React.createElement("th", null, "描述"),
                  /*#__PURE__*/ React.createElement("th", null, "模板数"),
                  /*#__PURE__*/ React.createElement("th", null, "店铺数"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 80 } }, "状态"),
                  /*#__PURE__*/ React.createElement("th", null, "创建时间"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 180 } }, "操作"),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                filteredPlatforms.length === 0
                  ? /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { colSpan: 8, style: { textAlign: "center", padding: "40px" } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty" },
                          /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无平台"),
                        ),
                      ),
                    )
                  : filteredPlatforms.map((platform) =>
                      /*#__PURE__*/ React.createElement(
                        "tr",
                        { key: platform.id },
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "font-medium" },
                            platform.name,
                          ),
                        ),
                        /*#__PURE__*/ React.createElement("td", null, platform.code),
                        /*#__PURE__*/ React.createElement("td", null, platform.description || "-"),
                        /*#__PURE__*/ React.createElement("td", null, platform.templateCount || 0),
                        /*#__PURE__*/ React.createElement("td", null, platform.shopCount || 0),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              className: `tag ${platform.status === "active" ? "tag-success" : "tag-danger"}`,
                            },
                            platform.status === "active" ? "上架" : "下架",
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          new Date(platform.createdAt).toLocaleDateString(),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          hasPermission(currentUser?.role, "platforms") &&
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "action-btn-group" },
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: "action-btn action-edit",
                                  onClick: () => openEditPlatform(platform),
                                },
                                /*#__PURE__*/ React.createElement(Icons.Pencil, { size: 14 }),
                                " 编辑",
                              ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: `action-btn ${platform.status === "active" ? "" : "action-view"}`,
                                  onClick: () => togglePlatformStatus(platform),
                                },
                                platform.status === "active"
                                  ? /*#__PURE__*/ React.createElement(
                                      React.Fragment,
                                      null,
                                      /*#__PURE__*/ React.createElement(Icons.Pause, { size: 14 }),
                                      " 下架",
                                    )
                                  : /*#__PURE__*/ React.createElement(
                                      React.Fragment,
                                      null,
                                      /*#__PURE__*/ React.createElement(Icons.Play, { size: 14 }),
                                      " 上架",
                                    ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: "action-btn action-delete",
                                  onClick: () => handleDeletePlatform(platform),
                                },
                                /*#__PURE__*/ React.createElement(Icons.Trash, { size: 14 }),
                                " 删除",
                              ),
                            ),
                        ),
                      )
                    ),
              ),
            ),
          ),
        ),
      );

    const renderTemplates = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-templates" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
            "模板管理",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "管理数据模板审核与推荐",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "action-bar" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-left" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "search-box" },
              /*#__PURE__*/ React.createElement(Icons.Search, { size: 16 }),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                placeholder: "搜索模板名称、平台、作者...",
                className: "search-input",
                value: templateSearch,
                onChange: (e) => setTemplateSearch(e.target.value),
              }),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "data-table-container" },
            /*#__PURE__*/ React.createElement(
              "table",
              { className: "table" },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  /*#__PURE__*/ React.createElement("th", null, "模板名称"),
                  /*#__PURE__*/ React.createElement("th", null, "所属平台"),
                  /*#__PURE__*/ React.createElement("th", null, "分类"),
                  /*#__PURE__*/ React.createElement("th", null, "作者"),
                  /*#__PURE__*/ React.createElement("th", null, "下载量"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 80 } }, "状态"),
                  /*#__PURE__*/ React.createElement("th", null, "创建时间"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 220 } }, "操作"),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                filteredTemplates.length === 0
                  ? /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { colSpan: 8, style: { textAlign: "center", padding: "40px" } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty" },
                          /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无模板"),
                        ),
                      ),
                    )
                  : filteredTemplates.map((template) =>
                      /*#__PURE__*/ React.createElement(
                        "tr",
                        { key: template.id },
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "font-medium" },
                            template.name,
                          ),
                          template.recommended &&
                            /*#__PURE__*/ React.createElement(
                              "span",
                              { className: "tag tag-warning", style: { marginLeft: 8 } },
                              "推荐",
                            ),
                        ),
                        /*#__PURE__*/ React.createElement("td", null, template.platform),
                        /*#__PURE__*/ React.createElement("td", null, template.category || "-"),
                        /*#__PURE__*/ React.createElement("td", null, template.author),
                        /*#__PURE__*/ React.createElement("td", null, template.downloads || 0),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              className: `tag ${
                                template.status === "approved"
                                  ? "tag-success"
                                  : template.status === "pending"
                                  ? "tag-warning"
                                  : "tag-danger"
                              }`,
                            },
                            template.status === "approved"
                              ? "已通过"
                              : template.status === "pending"
                              ? "待审核"
                              : "已拒绝",
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          new Date(template.createdAt).toLocaleDateString(),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          hasPermission(currentUser?.role, "templates") &&
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "action-btn-group" },
                              template.status === "pending" &&
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "action-btn action-view",
                                    onClick: () => handleApproveTemplate(template),
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.Check, { size: 14 }),
                                  " 通过",
                                ),
                              template.status === "pending" &&
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "action-btn action-delete",
                                    onClick: () => handleRejectTemplate(template),
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.X, { size: 14 }),
                                  " 拒绝",
                                ),
                              template.status === "approved" &&
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: `action-btn ${template.recommended ? "action-edit" : ""}`,
                                    onClick: () => toggleRecommendTemplate(template),
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.Star, { size: 14 }),
                                  template.recommended ? " 取消推荐" : " 推荐",
                                ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: "action-btn action-delete",
                                  onClick: () => handleDeleteTemplate(template),
                                },
                                /*#__PURE__*/ React.createElement(Icons.Trash, { size: 14 }),
                                " 删除",
                              ),
                            ),
                        ),
                      )
                    ),
              ),
            ),
          ),
        ),
      );

    const renderDataManagement = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-data" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.Database, null),
            "数据管理",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "数据备份、恢复与导出",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "data-cards" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card data-card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-icon" },
              /*#__PURE__*/ React.createElement(Icons.Download, { size: 36 }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-content" },
              /*#__PURE__*/ React.createElement("h3", null, "数据备份"),
              /*#__PURE__*/ React.createElement("p", null, "将系统所有数据备份为JSON文件，包括用户、平台、模板、设置等"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-primary", onClick: handleBackupData },
                "立即备份",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card data-card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-icon" },
              /*#__PURE__*/ React.createElement(Icons.Upload, { size: 36 }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-content" },
              /*#__PURE__*/ React.createElement("h3", null, "数据恢复"),
              /*#__PURE__*/ React.createElement("p", null, "从备份文件恢复数据，将覆盖当前所有数据，请谨慎操作"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-warning", onClick: handleRestoreData },
                "恢复数据",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card data-card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-icon" },
              /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, { size: 36 }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-content" },
              /*#__PURE__*/ React.createElement("h3", null, "导出用户数据"),
              /*#__PURE__*/ React.createElement("p", null, "导出所有用户账户信息为JSON格式"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn", onClick: () => handleExportData("users") },
                "导出用户",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card data-card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-icon" },
              /*#__PURE__*/ React.createElement(Icons.FileText, { size: 36 }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-card-content" },
              /*#__PURE__*/ React.createElement("h3", null, "导出操作日志"),
              /*#__PURE__*/ React.createElement("p", null, "导出系统所有操作日志记录"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn", onClick: () => handleExportData("logs") },
                "导出日志",
              ),
            ),
          ),
        ),
      );

    const renderSettings = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-settings" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.Settings, null),
            "系统设置",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            "配置系统参数与版本信息",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "settings-tabs" },
          [
            { id: "version", name: "版本信息", icon: Icons.Info },
            { id: "changelog", name: "更新日志", icon: Icons.FileText },
            { id: "params", name: "系统参数", icon: Icons.Sliders },
          ].map((tab) =>
            /*#__PURE__*/ React.createElement(
              "button",
              {
                key: tab.id,
                className: `settings-tab ${activeSettingTab === tab.id ? "active" : ""}`,
                onClick: () => setActiveSettingTab(tab.id),
              },
              /*#__PURE__*/ React.createElement(tab.icon, { size: 16 }),
              tab.name,
            )
          ),
        ),
        activeSettingTab === "version" &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-header" },
              /*#__PURE__*/ React.createElement("h3", { className: "card-title" }, "版本信息管理"),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-body" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "settings-form" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前版本"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: systemSettings.version,
                    onChange: (e) =>
                      setSystemSettings({ ...systemSettings, version: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "构建时间"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: systemSettings.buildTime,
                    onChange: (e) =>
                      setSystemSettings({ ...systemSettings, buildTime: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "系统名称"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: systemSettings.systemName,
                    onChange: (e) =>
                      setSystemSettings({ ...systemSettings, systemName: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { style: { marginTop: "20px", textAlign: "right" } },
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "btn btn-primary", onClick: saveSystemSettings },
                    "保存设置",
                  ),
                ),
              ),
            ),
          ),
        activeSettingTab === "changelog" &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-header" },
              /*#__PURE__*/ React.createElement("h3", { className: "card-title" }, "更新日志管理"),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-body" },
              updateLogs.length === 0
                ? /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "empty" },
                    /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无更新日志"),
                  )
                : /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "changelog-list" },
                    updateLogs.map((log) =>
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { key: log.id, className: "changelog-item" },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "changelog-header" },
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "changelog-version" },
                            log.version,
                          ),
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "changelog-date" },
                            new Date(log.date).toLocaleDateString(),
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "changelog-title" },
                          log.title,
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "changelog-content" },
                          log.content,
                        ),
                      )
                    ),
                  ),
            ),
          ),
        activeSettingTab === "params" &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-header" },
              /*#__PURE__*/ React.createElement("h3", { className: "card-title" }, "系统参数配置"),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-body" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "settings-form" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "最大上传大小 (MB)"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "number",
                    className: "input",
                    value: systemSettings.maxUploadSize,
                    onChange: (e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxUploadSize: parseInt(e.target.value) || 50,
                      }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "允许用户注册"),
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "switch-label" },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked: systemSettings.enableRegistration,
                      onChange: (e) =>
                        setSystemSettings({
                          ...systemSettings,
                          enableRegistration: e.target.checked,
                        }),
                    }),
                    /*#__PURE__*/ React.createElement("span", null, systemSettings.enableRegistration ? "已开启" : "已关闭"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "注册需要审核"),
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "switch-label" },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked: systemSettings.requireAudit,
                      onChange: (e) =>
                        setSystemSettings({
                          ...systemSettings,
                          requireAudit: e.target.checked,
                        }),
                    }),
                    /*#__PURE__*/ React.createElement("span", null, systemSettings.requireAudit ? "已开启" : "已关闭"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "默认用户角色"),
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: systemSettings.defaultUserRole,
                      onChange: (e) =>
                        setSystemSettings({
                          ...systemSettings,
                          defaultUserRole: e.target.value,
                        }),
                    },
                    /*#__PURE__*/ React.createElement("option", { value: "user" }, "普通用户"),
                    /*#__PURE__*/ React.createElement("option", { value: "manager" }, "普通管理员"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { style: { marginTop: "20px", textAlign: "right" } },
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "btn btn-primary", onClick: saveSystemSettings },
                    "保存设置",
                  ),
                ),
              ),
            ),
          ),
      );

    const renderLogs = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-logs" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(Icons.FileText, null),
            "操作日志",
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "page-subtitle" },
            currentUser?.role === ROLES.MANAGER ? "查看我的操作记录" : "查看系统所有操作记录",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "action-bar" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-left" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "search-box" },
              /*#__PURE__*/ React.createElement(Icons.Search, { size: 16 }),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                placeholder: "搜索操作人、操作类型...",
                className: "search-input",
                value: logSearchKeyword,
                onChange: (e) => setLogSearchKeyword(e.target.value),
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-right" },
            hasPermission(currentUser?.role, "logs") &&
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-danger",
                  onClick: () => {
                    if (confirm("确认清空所有操作日志？")) {
                      setOperationLogs([]);
                      localStorage.removeItem("app_operation_logs");
                      addOperationLog("清空日志", "清空所有操作日志");
                    }
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Trash, { size: 16 }),
                " 清空日志",
              ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "data-table-container" },
            /*#__PURE__*/ React.createElement(
              "table",
              { className: "table" },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  /*#__PURE__*/ React.createElement("th", null, "操作人"),
                  /*#__PURE__*/ React.createElement("th", null, "操作类型"),
                  /*#__PURE__*/ React.createElement("th", null, "操作详情"),
                  /*#__PURE__*/ React.createElement("th", null, "IP地址"),
                  /*#__PURE__*/ React.createElement("th", null, "操作时间"),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                filteredLogs.length === 0
                  ? /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { colSpan: 5, style: { textAlign: "center", padding: "40px" } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty" },
                          /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无操作日志"),
                        ),
                      ),
                    )
                  : filteredLogs.map((log) =>
                      /*#__PURE__*/ React.createElement(
                        "tr",
                        { key: log.id },
                        /*#__PURE__*/ React.createElement("td", null, log.username),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "tag tag-default" },
                            log.action,
                          ),
                        ),
                        /*#__PURE__*/ React.createElement("td", null, log.detail),
                        /*#__PURE__*/ React.createElement("td", null, log.ip),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          new Date(log.time).toLocaleString(),
                        ),
                      )
                    ),
              ),
            ),
          ),
        ),
      );

    const renderNoPermission = () =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-no-permission" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "empty", style: { padding: "80px 20px" } },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "empty-icon" },
              /*#__PURE__*/ React.createElement(Icons.Shield, { size: 64 }),
            ),
            /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "权限不足"),
            /*#__PURE__*/ React.createElement("div", { className: "empty-desc" }, "您没有访问该页面的权限，请联系管理员"),
            /*#__PURE__*/ React.createElement(
              "button",
              { className: "btn btn-primary", style: { marginTop: 20 }, onClick: () => setActiveMenu("dashboard") },
              "返回仪表盘",
            ),
          ),
        ),
      );

    const renderContent = () => {
      const menuPermMap = {
        dashboard: "dashboard",
        users: "users",
        register_audit: "register_audit",
        platforms: "platforms",
        templates: "templates",
        data: "data",
        settings: "settings",
        logs: "logs",
      };
      const perm = menuPermMap[activeMenu];
      if (perm && !hasPermission(currentUser?.role, perm)) {
        return renderNoPermission();
      }

      switch (activeMenu) {
        case "dashboard":
          return renderDashboard();
        case "users":
          return renderUsers();
        case "register_audit":
          return renderRegisterAudit();
        case "platforms":
          return renderPlatforms();
        case "templates":
          return renderTemplates();
        case "data":
          return renderDataManagement();
        case "settings":
          return renderSettings();
        case "logs":
          return renderLogs();
        default:
          return renderDashboard();
      }
    };

    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "admin-page" },
      renderSidebar(),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-main" },
        renderTopBar(),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-content" },
          renderContent(),
        ),
      ),
      showUserModal &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-overlay", onClick: () => setShowUserModal(false) },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "modal", onClick: (e) => e.stopPropagation() },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-header" },
              /*#__PURE__*/ React.createElement("h3", null, editingUser ? "编辑用户" : "新增用户"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "modal-close", onClick: () => setShowUserModal(false) },
                /*#__PURE__*/ React.createElement(Icons.X, { size: 18 }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-body" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-grid" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label required" }, "用户名"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: userForm.username,
                    onChange: (e) =>
                      setUserForm({ ...userForm, username: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: `form-label ${!editingUser ? "required" : ""}` },
                    editingUser ? "新密码（留空不改）" : "密码",
                  ),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "password",
                    className: "input",
                    value: userForm.password,
                    onChange: (e) =>
                      setUserForm({ ...userForm, password: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "姓名"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: userForm.name,
                    onChange: (e) => setUserForm({ ...userForm, name: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "邮箱"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "email",
                    className: "input",
                    value: userForm.email,
                    onChange: (e) => setUserForm({ ...userForm, email: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "手机号"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "tel",
                    className: "input",
                    value: userForm.phone,
                    onChange: (e) => setUserForm({ ...userForm, phone: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "角色"),
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: userForm.role,
                      onChange: (e) => setUserForm({ ...userForm, role: e.target.value }),
                    },
                    /*#__PURE__*/ React.createElement("option", { value: "admin" }, "超级管理员"),
                    /*#__PURE__*/ React.createElement("option", { value: "manager" }, "普通管理员"),
                    /*#__PURE__*/ React.createElement("option", { value: "user" }, "普通用户"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "状态"),
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: userForm.status,
                      onChange: (e) => setUserForm({ ...userForm, status: e.target.value }),
                    },
                    /*#__PURE__*/ React.createElement("option", { value: "active" }, "启用"),
                    /*#__PURE__*/ React.createElement("option", { value: "disabled" }, "禁用"),
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-footer" },
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn", onClick: () => setShowUserModal(false) },
                "取消",
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-primary",
                  onClick: editingUser ? handleUpdateUser : handleAddUser,
                },
                editingUser ? "保存修改" : "添加用户",
              ),
            ),
          ),
        ),
      showPlatformModal &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-overlay", onClick: () => setShowPlatformModal(false) },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "modal", onClick: (e) => e.stopPropagation() },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-header" },
              /*#__PURE__*/ React.createElement("h3", null, editingPlatform ? "编辑平台" : "新增平台"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "modal-close", onClick: () => setShowPlatformModal(false) },
                /*#__PURE__*/ React.createElement(Icons.X, { size: 18 }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-body" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-grid" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label required" }, "平台名称"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: platformForm.name,
                    onChange: (e) =>
                      setPlatformForm({ ...platformForm, name: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label required" }, "平台编码"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: platformForm.code,
                    onChange: (e) =>
                      setPlatformForm({ ...platformForm, code: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item", style: { gridColumn: "1 / -1" } },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "描述"),
                  /*#__PURE__*/ React.createElement("textarea", {
                    className: "input",
                    rows: 3,
                    value: platformForm.description,
                    onChange: (e) =>
                      setPlatformForm({ ...platformForm, description: e.target.value }),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "状态"),
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: platformForm.status,
                      onChange: (e) => setPlatformForm({ ...platformForm, status: e.target.value }),
                    },
                    /*#__PURE__*/ React.createElement("option", { value: "active" }, "上架"),
                    /*#__PURE__*/ React.createElement("option", { value: "disabled" }, "下架"),
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-footer" },
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn", onClick: () => setShowPlatformModal(false) },
                "取消",
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-primary",
                  onClick: editingPlatform ? handleUpdatePlatform : handleAddPlatform,
                },
                editingPlatform ? "保存修改" : "添加平台",
              ),
            ),
          ),
        ),
      showRejectModal &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-overlay", onClick: () => setShowRejectModal(false) },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "modal modal-small", onClick: (e) => e.stopPropagation() },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-header" },
              /*#__PURE__*/ React.createElement("h3", null, "拒绝注册"),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "modal-close", onClick: () => setShowRejectModal(false) },
                /*#__PURE__*/ React.createElement(Icons.X, { size: 18 }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-body" },
              /*#__PURE__*/ React.createElement(
                "p",
                { style: { marginBottom: "12px" } },
                "请填写拒绝原因（用户将看到此原因）：",
              ),
              /*#__PURE__*/ React.createElement("textarea", {
                className: "input",
                rows: 4,
                placeholder: "请输入拒绝原因...",
                value: rejectReason,
                onChange: (e) => setRejectReason(e.target.value),
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-footer" },
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn", onClick: () => setShowRejectModal(false) },
                "取消",
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-danger", onClick: handleRejectUser },
                "确认拒绝",
              ),
            ),
          ),
        ),
      confirmDialog &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-overlay", onClick: confirmDialog.onCancel },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "modal modal-small", onClick: (e) => e.stopPropagation() },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-header" },
              /*#__PURE__*/ React.createElement("h3", null, confirmDialog.title),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-body" },
              /*#__PURE__*/ React.createElement("p", null, confirmDialog.message),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "modal-footer" },
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn", onClick: confirmDialog.onCancel },
                "取消",
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-danger", onClick: confirmDialog.onConfirm },
                "确认",
              ),
            ),
          ),
        ),
    );
  };

  window.AdminPage = AdminPage;
})();
