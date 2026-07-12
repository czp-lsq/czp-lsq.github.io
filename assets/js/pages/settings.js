// SettingsPage - 系统设置页面组件
const SettingsPage = ({ state, onNavigate, currentTheme, colorTheme, onChangeTheme, onChangeColorTheme, currentUser }) => {
  const { addToast } = useToast();
  const isAdmin = currentUser?.role === "admin";
  const [activeSection, setActiveSection] = useState("appearance");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [appSettings, setAppSettings] = useState({
    autoSave: true,
    confirmDelete: true,
    language: "zh",
    autoUpdateCheck: true,
    sidebarDefaultCollapsed: false,
    defaultPlatform: "pdd",
    pageSize: 20,
    compactMode: false,
    animationEnabled: true,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    masterEnabled: true,
    calculationComplete: true,
    importComplete: true,
    exportComplete: true,
    versionUpdate: true,
    storageWarning: true,
  });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "user",
    status: "active",
  });
  const [isEditing, setIsEditing] = useState(false);

  const colorThemes = [
    { id: "business", name: "深邃商务", desc: "专业稳重", primary: "#1E3A5F", accent: "#D4A574", bg: "#F8F9FA" },
    { id: "tech", name: "清新科技", desc: "现代科技感", primary: "#0D9488", accent: "#0EA5E9", bg: "#F8FAFC" },
    { id: "warm", name: "温暖活力", desc: "活力亲和", primary: "#EA580C", accent: "#E11D48", bg: "#FFFAF5" },
    { id: "elegant", name: "优雅紫调", desc: "精致优雅", primary: "#7C3AED", accent: "#DB2777", bg: "#FAF9FC" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("app_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAppSettings((prev) => ({ ...prev, ...parsed.appSettings }));
        setNotificationSettings((prev) => ({ ...prev, ...parsed.notificationSettings }));
      } catch (e) {}
    }
    const profile = localStorage.getItem("app_profile");
    if (profile) {
      try {
        setProfileForm(JSON.parse(profile));
      } catch (e) {}
    }
    const savedAccounts = localStorage.getItem("app_accounts");
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
      } catch (e) {}
    } else {
      const defaultAccount = {
        id: "admin_001",
        username: "刘思琦",
        password: "520lsq",
        name: "刘思琦",
        email: "liusq@shopdata.com",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };
      setAccounts([defaultAccount]);
      localStorage.setItem("app_accounts", JSON.stringify([defaultAccount]));
    }
  }, []);

  useEffect(() => {
    if (appSettings.autoSave) {
      const settings = { appSettings, notificationSettings };
      localStorage.setItem("app_settings", JSON.stringify(settings));
      if (typeof NotificationCenter !== "undefined") {
        NotificationCenter.refreshSettings();
      }
      if (typeof AppSettings !== "undefined") {
        AppSettings.refresh();
      }
    }
  }, [appSettings, notificationSettings]);

  const saveSettings = () => {
    const settings = { appSettings, notificationSettings };
    localStorage.setItem("app_settings", JSON.stringify(settings));
    if (typeof NotificationCenter !== "undefined") {
      NotificationCenter.refreshSettings();
    }
    if (typeof AppSettings !== "undefined") {
      AppSettings.refresh();
    }
    addToast("success", "保存成功", "系统设置已更新并立即生效", 3000, { notificationType: "versionUpdate" });
  };

  const saveProfile = () => {
    localStorage.setItem("app_profile", JSON.stringify(profileForm));
    addToast("success", "保存成功", "个人信息已更新");
  };

  const resetSettings = () => {
    setConfirmDialog({
      title: "确认重置",
      message: "确认重置所有设置为默认值？此操作不可撤销。",
      type: "danger",
      onConfirm: () => {
        localStorage.removeItem("app_settings");
        setAppSettings({
          autoSave: true,
          confirmDelete: true,
          language: "zh",
          autoUpdateCheck: true,
          sidebarDefaultCollapsed: false,
          defaultPlatform: "pdd",
          pageSize: 20,
          compactMode: false,
          animationEnabled: true,
        });
        setNotificationSettings({
          masterEnabled: true,
          calculationComplete: true,
          importComplete: true,
          exportComplete: true,
          versionUpdate: true,
          storageWarning: true,
        });
        onChangeColorTheme("business");
        onChangeTheme("light");
        if (typeof AppSettings !== "undefined") {
          AppSettings.refresh();
        }
        addToast("success", "重置成功", "设置已恢复默认值");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const sections = [
    { id: "appearance", name: "外观设置", icon: Icons.Sparkles, desc: "主题与显示模式" },
    { id: "profile", name: "个人信息", icon: Icons.User, desc: "管理您的个人资料" },
    { id: "app", name: "应用设置", icon: Icons.Settings, desc: "配置应用行为" },
    { id: "notification", name: "通知设置", icon: Icons.Bell, desc: "自定义通知偏好" },
    ...(isAdmin ? [{ id: "accounts", name: "账户管理", icon: Icons.Users, desc: "添加和管理账户" }] : []),
    { id: "about", name: "关于系统", icon: Icons.Info, desc: "系统信息与操作" },
  ];

  const saveAccounts = (newAccounts) => {
    setAccounts(newAccounts);
    localStorage.setItem("app_accounts", JSON.stringify(newAccounts));
  };

  const handleAddAccount = () => {
    if (!accountForm.username || !accountForm.password) {
      addToast("error", "信息不完整", "用户名和密码为必填项");
      return;
    }
    if (accounts.some((a) => a.username === accountForm.username)) {
      addToast("error", "用户名已存在", "请使用不同的用户名");
      return;
    }
    const newAccount = {
      ...accountForm,
      id: `acc_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    saveAccounts([...accounts, newAccount]);
    addToast("success", "添加成功", `账户「${newAccount.name || newAccount.username}」已创建`);
    setAccountForm({ username: "", password: "", name: "", email: "", role: "user", status: "active" });
    setIsEditing(false);
    setEditingAccount(null);
  };

  const handleUpdateAccount = () => {
    if (!accountForm.username || !editingAccount) {
      addToast("error", "信息不完整", "用户名为必填项");
      return;
    }
    if (accounts.some((a) => a.username === accountForm.username && a.id !== editingAccount.id)) {
      addToast("error", "用户名已存在", "请使用不同的用户名");
      return;
    }
    const updated = accounts.map((a) =>
      a.id === editingAccount.id
        ? {
            ...a,
            username: accountForm.username,
            name: accountForm.name,
            email: accountForm.email,
            role: accountForm.role,
            status: accountForm.status,
            ...(accountForm.password ? { password: accountForm.password } : {}),
          }
        : a,
    );
    saveAccounts(updated);
    addToast("success", "修改成功", `账户「${accountForm.name || accountForm.username}」已更新`);
    setAccountForm({ username: "", password: "", name: "", email: "", role: "user", status: "active" });
    setIsEditing(false);
    setEditingAccount(null);
  };

  const initializeSystem = () => {
    setConfirmDialog({
      title: "确认初始化系统",
      message: "⚠️ 警告：此操作将清空所有数据（模板、规则、样表、全局数据等），并恢复到默认状态。此操作不可撤销！\n\n请确保已导出重要数据后再执行此操作。",
      type: "danger",
      onConfirm: () => {
        Store.clear();
        localStorage.clear();
        location.reload();
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const checkUpdate = () => {
    addToast("info", "检查更新", "正在检查新版本...");
    setTimeout(() => {
      addToast("success", "更新检查", "当前已是最新版本 v7.0.0");
    }, 1500);
  };

  const handleDeleteAccount = (account) => {
    const adminCount = accounts.filter((a) => a.role === "admin" && a.status === "active").length;
    if (account.role === "admin" && adminCount <= 1) {
      addToast("error", "无法删除", "系统至少需要保留一个管理员账户");
      return;
    }
    setConfirmDialog({
      title: "确认删除账户",
      message: `确认删除账户「${account.name || account.username}」？此操作不可撤销。`,
      type: "danger",
      onConfirm: () => {
        saveAccounts(accounts.filter((a) => a.id !== account.id));
        addToast("success", "删除成功", "账户已删除");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const startEditAccount = (account) => {
    setEditingAccount(account);
    setIsEditing(true);
    setAccountForm({
      username: account.username,
      password: "",
      name: account.name || "",
      email: account.email || "",
      role: account.role,
      status: account.status,
    });
  };

  const cancelEditAccount = () => {
    setAccountForm({ username: "", password: "", name: "", email: "", role: "user", status: "active" });
    setIsEditing(false);
    setEditingAccount(null);
  };

  const toggleAccountStatus = (account) => {
    const adminCount = accounts.filter((a) => a.role === "admin" && a.status === "active").length;
    if (account.role === "admin" && account.status === "active" && adminCount <= 1) {
      addToast("error", "无法禁用", "系统至少需要保留一个启用的管理员账户");
      return;
    }
    const updated = accounts.map((a) =>
      a.id === account.id ? { ...a, status: a.status === "active" ? "disabled" : "active" } : a,
    );
    saveAccounts(updated);
    addToast("success", "操作成功", `账户已${account.status === "active" ? "禁用" : "启用"}`);
  };

  const Toggle = ({ checked, onChange, label, desc, disabled }) => React.createElement(
    "div",
    { className: `form-row settings-toggle-row ${disabled ? "settings-toggle-disabled" : ""}` },
    React.createElement("div", { className: "settings-toggle-label" },
      React.createElement("label", { className: "form-row-label" }, label),
      desc && React.createElement("div", { className: "settings-toggle-desc" }, desc),
    ),
    React.createElement("label", { className: "settings-switch" },
      React.createElement("input", {
        type: "checkbox",
        checked: checked,
        onChange: (e) => !disabled && onChange(e.target.checked),
        disabled: disabled,
      }),
      React.createElement("span", { className: "settings-slider" }),
    ),
  );

  const FormInput = ({ label, type = "text", placeholder, value, onChange, required }) => React.createElement(
    "div",
    { className: "form-item" },
    React.createElement("label", { className: `form-label ${required ? "required" : ""}` }, label),
    React.createElement("input", {
      type: type,
      className: "input",
      placeholder: placeholder,
      value: value,
      onChange: (e) => onChange(e.target.value),
    }),
  );

  const FormSelect = ({ label, value, onChange, options }) => React.createElement(
    "div",
    { className: "form-item" },
    React.createElement("label", { className: "form-label" }, label),
    React.createElement("select", {
      className: "select",
      value: value,
      onChange: (e) => onChange(e.target.value),
    },
      options.map((opt) => React.createElement("option", { key: opt.value, value: opt.value }, opt.label)),
    ),
  );

  const renderAppearance = () => React.createElement(
    "div",
    { className: "settings-content" },
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title" }, "主题配色"),
      React.createElement("div", { className: "settings-section-desc" }, "选择您喜欢的主题风格，所有界面将立即切换"),
      React.createElement("div", { className: "theme-selector", style: { marginTop: "20px" } },
        colorThemes.map((t) => React.createElement(
          "div",
          {
            key: t.id,
            className: `theme-option ${colorTheme === t.id ? "active" : ""}`,
            onClick: () => onChangeColorTheme(t.id),
          },
          React.createElement("div", {
            className: "theme-preview",
            style: { background: `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)` },
          },
            React.createElement("div", { className: "theme-preview-row" },
              React.createElement("div", { className: "theme-dot", style: { background: "rgba(255,255,255,0.9)" } }),
              React.createElement("div", { className: "theme-dot", style: { background: "rgba(255,255,255,0.7)" } }),
              React.createElement("div", { className: "theme-dot", style: { background: "rgba(255,255,255,0.5)" } }),
            ),
          ),
          React.createElement("div", { className: "theme-name" },
            React.createElement("div", { className: "theme-name-text" }, t.name),
            colorTheme === t.id && React.createElement("span", { className: "theme-check" }, "✓"),
          ),
          React.createElement("div", { className: "theme-desc" }, t.desc),
        )),
      ),
    ),
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title" }, "显示模式"),
      React.createElement("div", { className: "settings-section-desc" }, "选择浅色或深色显示模式"),
      React.createElement("div", { className: "theme-selector", style: { gridTemplateColumns: "repeat(2, 1fr)", marginTop: "20px" } },
        React.createElement(
          "div",
          {
            className: `theme-option ${currentTheme === "light" ? "active" : ""}`,
            onClick: () => onChangeTheme("light"),
          },
          React.createElement("div", {
            className: "theme-preview",
            style: { background: "linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)", borderBottom: "1px solid var(--color-border-light)" },
          },
            React.createElement("div", { className: "theme-preview-row" },
              React.createElement("div", { className: "theme-dot", style: { background: "var(--color-text-primary)" } }),
              React.createElement("div", { className: "theme-dot", style: { background: "var(--color-border)" } }),
              React.createElement("div", { className: "theme-dot", style: { background: "var(--color-text-muted)" } }),
            ),
          ),
          React.createElement("div", { className: "theme-name" },
            React.createElement("div", { className: "theme-name-text" }, "浅色模式"),
            currentTheme === "light" && React.createElement("span", { className: "theme-check" }, "✓"),
          ),
          React.createElement("div", { className: "theme-desc" }, "明亮清爽"),
        ),
        React.createElement(
          "div",
          {
            className: `theme-option ${currentTheme === "dark" ? "active" : ""}`,
            onClick: () => onChangeTheme("dark"),
          },
          React.createElement("div", {
            className: "theme-preview",
            style: { background: "linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)", borderBottom: "1px solid var(--color-border-light)" },
          },
            React.createElement("div", { className: "theme-preview-row" },
              React.createElement("div", { className: "theme-dot", style: { background: "var(--color-text-primary)" } }),
              React.createElement("div", { className: "theme-dot", style: { background: "var(--color-border)" } }),
              React.createElement("div", { className: "theme-dot", style: { background: "var(--color-text-muted)" } }),
            ),
          ),
          React.createElement("div", { className: "theme-name" },
            React.createElement("div", { className: "theme-name-text" }, "深色模式"),
            currentTheme === "dark" && React.createElement("span", { className: "theme-check" }, "✓"),
          ),
          React.createElement("div", { className: "theme-desc" }, "护眼舒适"),
        ),
      ),
    ),
  );

  const renderProfile = () => React.createElement(
    "div",
    { className: "settings-content" },
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title" }, "个人信息"),
      React.createElement("div", { className: "settings-section-desc" }, "管理您的个人资料信息"),
    ),
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" } },
        FormInput({
          label: "姓名",
          placeholder: "请输入您的姓名",
          value: profileForm.name,
          onChange: (v) => setProfileForm({ ...profileForm, name: v }),
        }),
        FormInput({
          label: "邮箱",
          type: "email",
          placeholder: "请输入邮箱地址",
          value: profileForm.email,
          onChange: (v) => setProfileForm({ ...profileForm, email: v }),
        }),
        FormInput({
          label: "手机号",
          type: "tel",
          placeholder: "请输入手机号码",
          value: profileForm.phone,
          onChange: (v) => setProfileForm({ ...profileForm, phone: v }),
        }),
        FormInput({
          label: "公司名称",
          placeholder: "请输入公司名称",
          value: profileForm.company,
          onChange: (v) => setProfileForm({ ...profileForm, company: v }),
        }),
      ),
      React.createElement("div", { style: { marginTop: "24px", textAlign: "right" } },
        React.createElement(Button, { type: "primary", onClick: saveProfile }, "保存信息"),
      ),
    ),
  );

  const renderAppSettings = () => React.createElement(
    "div",
    { className: "settings-content" },
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title" }, "应用设置"),
      React.createElement("div", { className: "settings-section-desc" }, "配置应用的行为偏好，所有设置保存后立即生效"),
    ),
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "16px" } }, "基础设置"),
      Toggle({
        checked: appSettings.autoSave,
        onChange: (v) => setAppSettings({ ...appSettings, autoSave: v }),
        label: "自动保存",
        desc: "更改自动保存到本地存储（关闭后需手动点击保存按钮）",
      }),
      Toggle({
        checked: appSettings.confirmDelete,
        onChange: (v) => setAppSettings({ ...appSettings, confirmDelete: v }),
        label: "删除确认",
        desc: "删除数据前显示确认对话框，防止误删",
      }),
      Toggle({
        checked: appSettings.autoUpdateCheck,
        onChange: (v) => setAppSettings({ ...appSettings, autoUpdateCheck: v }),
        label: "自动检查更新",
        desc: "启动时自动检查系统更新",
      }),
    ),
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "16px" } }, "界面偏好"),
      Toggle({
        checked: appSettings.sidebarDefaultCollapsed,
        onChange: (v) => setAppSettings({ ...appSettings, sidebarDefaultCollapsed: v }),
        label: "默认收起侧边栏",
        desc: "打开系统时侧边栏默认收起，仅显示图标",
      }),
      Toggle({
        checked: appSettings.compactMode,
        onChange: (v) => setAppSettings({ ...appSettings, compactMode: v }),
        label: "紧凑模式",
        desc: "减少间距和留白，在屏幕上显示更多内容",
      }),
      Toggle({
        checked: appSettings.animationEnabled,
        onChange: (v) => setAppSettings({ ...appSettings, animationEnabled: v }),
        label: "启用动画",
        desc: "页面切换和元素交互的过渡动画",
      }),
      React.createElement("div", { className: "form-row" },
        React.createElement("label", { className: "form-row-label" }, "默认平台"),
        React.createElement("div", { style: { maxWidth: "240px" } },
          FormSelect({
            label: "",
            value: appSettings.defaultPlatform,
            onChange: (v) => setAppSettings({ ...appSettings, defaultPlatform: v }),
            options: [
              { value: "pdd", label: "拼多多" },
              { value: "taobao", label: "淘宝" },
              { value: "douyin", label: "抖音" },
            ],
          }),
        ),
      ),
      React.createElement("div", { className: "form-row" },
        React.createElement("label", { className: "form-row-label" }, "每页显示条数"),
        React.createElement("div", { style: { maxWidth: "240px" } },
          FormSelect({
            label: "",
            value: String(appSettings.pageSize),
            onChange: (v) => setAppSettings({ ...appSettings, pageSize: parseInt(v) }),
            options: [
              { value: "10", label: "10 条/页" },
              { value: "20", label: "20 条/页" },
              { value: "50", label: "50 条/页" },
              { value: "100", label: "100 条/页" },
            ],
          }),
        ),
      ),
      React.createElement("div", { className: "form-row" },
        React.createElement("label", { className: "form-row-label" }, "语言"),
        React.createElement("div", { style: { maxWidth: "240px" } },
          FormSelect({
            label: "",
            value: appSettings.language,
            onChange: (v) => setAppSettings({ ...appSettings, language: v }),
            options: [
              { value: "zh", label: "中文" },
              { value: "en", label: "English" },
            ],
          }),
        ),
      ),
    ),
    React.createElement("div", { className: "settings-section", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" } }, "重置设置"),
        React.createElement("div", { style: { fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: "4px" } }, "将所有设置恢复为默认值"),
      ),
      React.createElement(Button, { type: "danger", onClick: resetSettings }, "重置所有设置"),
    ),
    React.createElement("div", { className: "settings-section", style: { textAlign: "right" } },
      React.createElement(Button, { type: "primary", onClick: saveSettings }, "保存设置"),
    ),
  );

  const renderNotification = () => React.createElement(
    "div",
    { className: "settings-content" },
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title" }, "通知设置"),
      React.createElement("div", { className: "settings-section-desc" }, "自定义您的通知偏好，关闭后将不再显示对应通知"),
    ),
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "16px" } }, "总开关"),
      Toggle({
        checked: notificationSettings.masterEnabled,
        onChange: (v) => setNotificationSettings({ ...notificationSettings, masterEnabled: v }),
        label: "启用通知",
        desc: "关闭后将屏蔽所有非错误的提示通知（错误通知仍会显示）",
      }),
    ),
    React.createElement("div", { className: `settings-section ${notificationSettings.masterEnabled === false ? "settings-disabled" : ""}` },
      React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "16px" } }, "操作通知"),
      Toggle({
        checked: notificationSettings.calculationComplete,
        onChange: (v) => setNotificationSettings({ ...notificationSettings, calculationComplete: v }),
        label: "计算完成",
        desc: "批量计算完成后显示通知",
        disabled: notificationSettings.masterEnabled === false,
      }),
      Toggle({
        checked: notificationSettings.importComplete,
        onChange: (v) => setNotificationSettings({ ...notificationSettings, importComplete: v }),
        label: "导入完成",
        desc: "数据导入完成后显示通知",
        disabled: notificationSettings.masterEnabled === false,
      }),
      Toggle({
        checked: notificationSettings.exportComplete,
        onChange: (v) => setNotificationSettings({ ...notificationSettings, exportComplete: v }),
        label: "导出完成",
        desc: "数据导出完成后显示通知",
        disabled: notificationSettings.masterEnabled === false,
      }),
    ),
    React.createElement("div", { className: `settings-section ${notificationSettings.masterEnabled === false ? "settings-disabled" : ""}` },
      React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "16px" } }, "系统通知"),
      Toggle({
        checked: notificationSettings.versionUpdate,
        onChange: (v) => setNotificationSettings({ ...notificationSettings, versionUpdate: v }),
        label: "版本更新",
        desc: "发现新版本时显示通知",
        disabled: notificationSettings.masterEnabled === false,
      }),
      Toggle({
        checked: notificationSettings.storageWarning,
        onChange: (v) => setNotificationSettings({ ...notificationSettings, storageWarning: v }),
        label: "存储警告",
        desc: "本地存储不足时显示警告",
        disabled: notificationSettings.masterEnabled === false,
      }),
    ),
    React.createElement("div", { className: "settings-section", style: { textAlign: "right" } },
      React.createElement(Button, { type: "primary", onClick: saveSettings }, "保存设置"),
    ),
  );

  const renderAbout = () => {
    const storageInfo = Store.getStorageInfo();
    const usedKB = Math.round(storageInfo.usedBytes / 1024);
    const quotaKB = Math.round(storageInfo.estimatedQuota / 1024);
    const usagePercent = Math.round(storageInfo.usage * 100);
    return React.createElement(
      "div",
      { className: "settings-content" },
      React.createElement("div", { className: "settings-section" },
        React.createElement("div", { className: "about-info" },
          React.createElement("div", { className: "about-logo" },
            React.createElement(Icons.Layers, { style: { width: 48, height: 48, color: "var(--color-primary)" } }),
          ),
          React.createElement("div", { className: "about-title" }, "店数智 ShopData"),
          React.createElement("div", { className: "about-version" }, "版本 v7.0.0"),
          React.createElement("div", { className: "about-desc" }, "店铺数据智能分析与报表平台"),
        ),
        React.createElement("div", { className: "about-grid" },
          React.createElement("div", { className: "about-item" },
            React.createElement("div", { className: "about-item-label" }, "支持平台"),
            React.createElement("div", { className: "about-item-value" }, "拼多多、淘宝、抖音"),
          ),
          React.createElement("div", { className: "about-item" },
            React.createElement("div", { className: "about-item-label" }, "数据存储"),
            React.createElement("div", { className: "about-item-value" }, "浏览器本地存储"),
          ),
          React.createElement("div", { className: "about-item" },
            React.createElement("div", { className: "about-item-label" }, "支持格式"),
            React.createElement("div", { className: "about-item-value" }, "Excel、CSV、ZIP"),
          ),
          React.createElement("div", { className: "about-item" },
            React.createElement("div", { className: "about-item-label" }, "系统版本"),
            React.createElement("div", { className: "about-item-value" }, Store.getVersion()),
          ),
        ),
      ),
      React.createElement("div", { className: "settings-section" },
        React.createElement("div", { className: "settings-section-title" }, "存储使用情况"),
        React.createElement("div", { className: "settings-section-desc" }, "浏览器本地存储的使用情况，数据接近满额时请及时清理或导出备份"),
        React.createElement("div", { style: { marginTop: "16px" } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" } },
            React.createElement("span", { style: { color: "var(--color-text-secondary)" } }, `已使用 ${usedKB} KB / ${quotaKB} KB`),
            React.createElement("span", { style: { color: storageInfo.isCritical ? "var(--color-danger)" : storageInfo.isWarning ? "var(--color-warning)" : "var(--color-success)", fontWeight: 600 } }, `${usagePercent}%`),
          ),
          React.createElement("div", { style: { height: "8px", background: "var(--color-bg-tertiary)", borderRadius: "4px", overflow: "hidden" } },
            React.createElement("div", { style: { width: `${Math.min(usagePercent, 100)}%`, height: "100%", background: storageInfo.isCritical ? "var(--color-danger)" : storageInfo.isWarning ? "var(--color-warning)" : "var(--color-success)", transition: "width 0.3s ease" } }),
          ),
          storageInfo.isWarning && React.createElement("div", { style: { marginTop: "12px", padding: "10px 14px", background: storageInfo.isCritical ? "var(--color-danger-bg)" : "var(--color-warning-bg)", border: `1px solid ${storageInfo.isCritical ? "var(--color-danger-border)" : "var(--color-warning-border)"}`, borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)" } },
            storageInfo.isCritical ? "⚠ 存储空间即将用尽，请导出数据后清理浏览器存储" : "💡 存储空间使用较高，建议定期导出数据备份",
          ),
        ),
      ),
      React.createElement("div", { className: "settings-section" },
        React.createElement("div", { className: "settings-section-title" }, "系统操作"),
        React.createElement("div", { className: "settings-section-desc" }, "执行高级系统操作"),
        React.createElement("div", { style: { marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" } },
          React.createElement(Button, { type: "default", onClick: checkUpdate }, React.createElement(Icons.Download, null), " 检查更新"),
          React.createElement(Button, { type: "danger", onClick: initializeSystem }, React.createElement(Icons.Refresh, null), " 初始化系统"),
        ),
        React.createElement("div", { style: { marginTop: "12px", padding: "10px 14px", background: "var(--color-warning-bg)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-warning)" } },
          "⚠ 初始化系统将清空所有数据，请确保已导出重要数据。此操作不可撤销。",
        ),
      ),
      React.createElement("div", { className: "settings-section" },
        React.createElement("div", { className: "settings-section-title" }, "技术支持"),
        React.createElement("div", { className: "settings-section-desc" }, "如有问题请联系技术支持"),
        React.createElement("div", { style: { marginTop: "16px", fontSize: "13px", color: "var(--color-text-secondary)" } },
          React.createElement("div", { style: { marginBottom: "8px" } }, "📧 邮箱：support@shopdata.com"),
          React.createElement("div", { style: { marginBottom: "8px" } }, "📱 电话：400-888-8888"),
          React.createElement("div", { style: { marginBottom: "8px" } }, "🕐 工作时间：周一至周五 9:00-18:00"),
        ),
      ),
    );
  };

  const renderAccounts = () => React.createElement(
    "div",
    { className: "settings-content" },
    React.createElement("div", { className: "settings-section" },
      React.createElement("div", { className: "settings-section-title" }, "账户管理"),
      React.createElement("div", { className: "settings-section-desc" }, "添加、修改和管理系统账户"),
    ),
    isEditing
      ? React.createElement("div", { className: "settings-section" },
          React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "16px" } }, editingAccount ? "修改账户" : "添加账户"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" } },
            FormInput({
              label: "用户名",
              placeholder: "请输入用户名",
              value: accountForm.username,
              onChange: (v) => setAccountForm({ ...accountForm, username: v }),
              required: true,
            }),
            FormInput({
              label: editingAccount ? "新密码（留空不改）" : "密码",
              type: "password",
              placeholder: editingAccount ? "留空则不修改密码" : "请输入密码",
              value: accountForm.password,
              onChange: (v) => setAccountForm({ ...accountForm, password: v }),
              required: !editingAccount,
            }),
            FormInput({
              label: "姓名",
              placeholder: "请输入姓名",
              value: accountForm.name,
              onChange: (v) => setAccountForm({ ...accountForm, name: v }),
            }),
            FormInput({
              label: "邮箱",
              type: "email",
              placeholder: "请输入邮箱",
              value: accountForm.email,
              onChange: (v) => setAccountForm({ ...accountForm, email: v }),
            }),
            FormSelect({
              label: "角色",
              value: accountForm.role,
              onChange: (v) => setAccountForm({ ...accountForm, role: v }),
              options: [
                { value: "admin", label: "管理员" },
                { value: "user", label: "普通用户" },
              ],
            }),
            FormSelect({
              label: "状态",
              value: accountForm.status,
              onChange: (v) => setAccountForm({ ...accountForm, status: v }),
              options: [
                { value: "active", label: "启用" },
                { value: "disabled", label: "禁用" },
              ],
            }),
          ),
          React.createElement("div", { style: { marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" } },
            React.createElement(Button, { onClick: cancelEditAccount }, "取消"),
            React.createElement(Button, { type: "primary", onClick: editingAccount ? handleUpdateAccount : handleAddAccount }, editingAccount ? "保存修改" : "添加账户"),
          ),
        )
      : React.createElement("div", { className: "settings-section" },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" } },
            React.createElement("div", { className: "settings-section-title", style: { fontSize: "14px", marginBottom: "0" } }, `账户列表（${accounts.length}）`),
            React.createElement(Button, { type: "primary", onClick: () => { setIsEditing(true); setEditingAccount(null); setAccountForm({ username: "", password: "", name: "", email: "", role: "user", status: "active" }); } }, React.createElement(Icons.Plus, null), " 添加账户"),
          ),
          accounts.length === 0
            ? React.createElement("div", { className: "empty", style: { padding: "40px 20px" } },
                React.createElement("div", { className: "empty-text" }, "暂无账户"),
                React.createElement("div", { className: "empty-desc" }, "点击上方按钮添加第一个账户"),
              )
            : React.createElement("div", { className: "data-table-container" },
                React.createElement("table", { className: "table" },
                  React.createElement("thead", null,
                    React.createElement("tr", null,
                      React.createElement("th", null, "用户名"),
                      React.createElement("th", null, "姓名"),
                      React.createElement("th", null, "邮箱"),
                      React.createElement("th", { style: { width: 100 } }, "角色"),
                      React.createElement("th", { style: { width: 80 } }, "状态"),
                      React.createElement("th", { style: { width: 160 } }, "操作"),
                    ),
                  ),
                  React.createElement("tbody", null,
                    accounts.map((acc) => React.createElement("tr", { key: acc.id },
                      React.createElement("td", null, React.createElement("span", { style: { fontWeight: 500 } }, acc.username)),
                      React.createElement("td", null, acc.name || "-"),
                      React.createElement("td", null, React.createElement("span", { style: { fontSize: 13, color: "var(--color-text-tertiary)" } }, acc.email || "-")),
                      React.createElement("td", null,
                        React.createElement("span", { className: `tag ${acc.role === "admin" ? "tag-primary" : "tag-default"}` }, acc.role === "admin" ? "管理员" : "用户"),
                      ),
                      React.createElement("td", null,
                        React.createElement("span", { className: `tag ${acc.status === "active" ? "tag-success" : "tag-danger"}` }, acc.status === "active" ? "启用" : "禁用"),
                      ),
                      React.createElement("td", null,
                        React.createElement("div", { className: "action-btn-group" },
                          React.createElement("button", { className: "action-btn action-edit", onClick: () => startEditAccount(acc), title: "修改" }, React.createElement(Icons.Pencil, null), " 修改"),
                          React.createElement("button", { className: `action-btn ${acc.status === "active" ? "action-delete" : "action-view"}`, onClick: () => toggleAccountStatus(acc), title: acc.status === "active" ? "禁用" : "启用" }, acc.status === "active" ? "禁用" : "启用"),
                          React.createElement("button", { className: "action-btn action-delete", onClick: () => handleDeleteAccount(acc), title: "删除" }, React.createElement(Icons.Trash, null), " 删除"),
                        ),
                      ),
                    )),
                  ),
                ),
              ),
        ),
  );

  const renderContent = () => {
    switch (activeSection) {
      case "appearance": return renderAppearance();
      case "profile": return renderProfile();
      case "accounts": return isAdmin ? renderAccounts() : renderNoAccess();
      case "app": return renderAppSettings();
      case "notification": return renderNotification();
      case "about": return renderAbout();
      default: return renderAppearance();
    }
  };

  const renderNoAccess = () => React.createElement(
    "div",
    { className: "settings-content" },
    React.createElement("div", { className: "empty", style: { padding: "60px 20px" } },
      React.createElement("div", { className: "empty-icon" }, "🔒"),
      React.createElement("div", { className: "empty-text" }, "无访问权限"),
      React.createElement("div", { className: "empty-desc" }, "账户管理功能仅限管理员访问"),
    ),
  );

  return React.createElement(
    "div",
    { className: "settings-page fade-in" },
    React.createElement("div", { className: "settings-layout" },
      React.createElement("div", { className: "settings-sidebar" },
        React.createElement("div", { className: "settings-sidebar-header" },
          React.createElement(Icons.Settings, { style: { width: "24px", height: "24px", color: "var(--color-primary)" } }),
          React.createElement("span", { className: "settings-sidebar-title" }, "系统设置"),
        ),
        React.createElement("div", { className: "settings-menu-items" },
          sections.map((section) => React.createElement(
            "div",
            {
              key: section.id,
              onClick: () => setActiveSection(section.id),
              className: `settings-menu-item ${activeSection === section.id ? "active" : ""}`,
            },
            React.createElement("span", { className: "nav-icon", style: { width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center" } },
              React.createElement(section.icon, null),
            ),
            React.createElement("span", { className: "settings-menu-name" }, section.name),
            React.createElement("span", { className: "settings-menu-desc" }, section.desc),
          )),
        ),
      ),
      React.createElement("div", { className: "settings-main" },
        React.createElement("div", { className: "card", style: { minHeight: "600px" } },
          renderContent(),
        ),
      ),
    ),
    confirmDialog && React.createElement(ConfirmModal, {
      title: confirmDialog.title,
      message: confirmDialog.message,
      type: confirmDialog.type,
      onConfirm: confirmDialog.onConfirm,
      onCancel: confirmDialog.onCancel,
    }),
  );
};


