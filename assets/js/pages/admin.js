(function() {
  const { useState, useEffect, useMemo } = React;

  const AdminPage = ({ currentUser, onLogout, onBackToApp }) => {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [users, setUsers] = useState([]);
    const [systemSettings, setSystemSettings] = useState({
      version: "",
      buildTime: "",
      systemName: "店数智 ShopData",
      maxUploadSize: 50,
      enableRegistration: true,
      defaultUserRole: "user",
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
      role: "user",
      status: "active",
    });
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [activeSettingTab, setActiveSettingTab] = useState("version");

    useEffect(() => {
      loadUsers();
      loadSystemSettings();
      loadUpdateLogs();
      loadOperationLogs();
    }, []);

    const loadUsers = () => {
      try {
        const saved = localStorage.getItem("app_accounts");
        if (saved) {
          setUsers(JSON.parse(saved));
        } else {
          const defaultUsers = [
            {
              id: "admin_001",
              username: "admin",
              password: "admin123",
              name: "超级管理员",
              email: "admin@shopdata.com",
              role: "admin",
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

    const saveUsers = (newUsers) => {
      setUsers(newUsers);
      localStorage.setItem("app_accounts", JSON.stringify(newUsers));
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

    const saveUpdateLogs = (logs) => {
      setUpdateLogs(logs);
      localStorage.setItem("app_update_logs", JSON.stringify(logs));
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

      let platformCount = 0;
      let templateCount = 0;
      try {
        const state = JSON.parse(localStorage.getItem("app_state") || "{}");
        if (state.platforms) {
          platformCount = state.platforms.length;
          templateCount = state.templates?.length || 0;
        }
      } catch (e) {}

      return {
        totalUsers: users.length,
        totalPlatforms: platformCount,
        totalTemplates: templateCount,
        todayActive,
      };
    }, [users, operationLogs]);

    const trendData = useMemo(() => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const count = operationLogs.filter(
          (log) => new Date(log.time).toDateString() === dateStr
        ).length;
        days.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          count,
        });
      }
      return days;
    }, [operationLogs]);

    const menuItems = [
      { id: "dashboard", name: "仪表盘", icon: Icons.BarChart3 },
      { id: "users", name: "用户管理", icon: Icons.Users },
      { id: "platforms", name: "平台管理", icon: Icons.Layers },
      { id: "templates", name: "模板管理", icon: Icons.FileSpreadsheet },
      { id: "data", name: "数据管理", icon: Icons.Database },
      { id: "settings", name: "系统设置", icon: Icons.Settings },
      { id: "logs", name: "操作日志", icon: Icons.FileText },
    ];

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
                currentUser?.role === "admin" ? "超级管理员" : "普通用户",
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
              /*#__PURE__*/ React.createElement(Icons.Layers, null),
              "总平台数",
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
            { className: "stat-card warning" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-label" },
              /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
              "总模板数",
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
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "admin-chart-section" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-header" },
              /*#__PURE__*/ React.createElement(
                "h3",
                { className: "card-title" },
                "最近7天使用趋势",
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-body" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "trend-chart" },
                trendData.map((day, index) =>
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { key: index, className: "trend-bar-group" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "trend-bar-wrapper" },
                      /*#__PURE__*/ React.createElement("div", {
                        className: "trend-bar",
                        style: {
                          height: `${Math.max(day.count * 10, 4)}px`,
                          opacity: day.count > 0 ? 1 : 0.3,
                        },
                      }),
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "trend-label" },
                      day.date,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "trend-value" },
                      day.count,
                    ),
                  )
                ),
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
                  operationLogs.slice(0, 10).map((log) =>
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
                placeholder: "搜索用户名、姓名...",
                className: "search-input",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-right" },
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
                  /*#__PURE__*/ React.createElement("th", { style: { width: 90 } }, "角色"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 80 } }, "状态"),
                  /*#__PURE__*/ React.createElement("th", null, "创建时间"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 180 } }, "操作"),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                users.length === 0
                  ? /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { colSpan: 7, style: { textAlign: "center", padding: "40px" } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty" },
                          /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, "暂无用户"),
                        ),
                      ),
                    )
                  : users.map((user) =>
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
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              className: `tag ${user.role === "admin" ? "tag-primary" : "tag-default"}`,
                            },
                            user.role === "admin" ? "管理员" : "用户",
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
                            user.status === "active" ? "启用" : "禁用",
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

    const renderPlaceholder = (title, desc, icon) =>
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "admin-placeholder" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "page-header" },
          /*#__PURE__*/ React.createElement(
            "h1",
            { className: "page-title" },
            /*#__PURE__*/ React.createElement(icon, null),
            title,
          ),
          /*#__PURE__*/ React.createElement("p", { className: "page-subtitle" }, desc),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "empty", style: { padding: "80px 20px" } },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "empty-icon" },
              /*#__PURE__*/ React.createElement(icon, { size: 48 }),
            ),
            /*#__PURE__*/ React.createElement("div", { className: "empty-text" }, `${title}功能开发中`),
            /*#__PURE__*/ React.createElement("div", { className: "empty-desc" }, "敬请期待..."),
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
              /*#__PURE__*/ React.createElement(
                "button",
                { className: "btn btn-primary btn-sm" },
                /*#__PURE__*/ React.createElement(Icons.Plus, { size: 14 }),
                " 新增",
              ),
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
                    /*#__PURE__*/ React.createElement("option", { value: "admin" }, "管理员"),
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
            "查看系统所有操作记录",
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
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "action-right" },
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "btn",
                onClick: () => {
                  if (confirm("确认清空所有操作日志？")) {
                    setOperationLogs([]);
                    localStorage.removeItem("app_operation_logs");
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
                operationLogs.length === 0
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
                  : operationLogs.map((log) =>
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

    const renderContent = () => {
      switch (activeMenu) {
        case "dashboard":
          return renderDashboard();
        case "users":
          return renderUsers();
        case "platforms":
          return renderPlaceholder("平台管理", "管理电商平台配置", Icons.Layers);
        case "templates":
          return renderPlaceholder("模板管理", "管理数据模板配置", Icons.FileSpreadsheet);
        case "data":
          return renderPlaceholder("数据管理", "管理系统数据存储", Icons.Database);
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
                  /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "角色"),
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: userForm.role,
                      onChange: (e) => setUserForm({ ...userForm, role: e.target.value }),
                    },
                    /*#__PURE__*/ React.createElement("option", { value: "admin" }, "管理员"),
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
