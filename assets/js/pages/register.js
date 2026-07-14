// RegisterPage - 注册页面组件
const RegisterPage = ({ onBackToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requireAudit, setRequireAudit] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    try {
      const settings = localStorage.getItem("app_system_settings");
      if (settings) {
        const s = JSON.parse(settings);
        setRequireAudit(s.requireAudit !== false);
      }
    } catch (e) {}
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "请输入用户名";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "用户名至少3个字符";
    } else if (formData.username.trim().length > 32) {
      newErrors.username = "用户名最多32个字符";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = "用户名只能包含字母、数字和下划线";
    }

    if (!formData.password) {
      newErrors.password = "请输入密码";
    } else if (formData.password.length < 4) {
      newErrors.password = "密码至少4个字符";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "请确认密码";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "邮箱格式不正确";
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "手机号格式不正确";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    setTimeout(() => {
      try {
        const accounts = JSON.parse(localStorage.getItem("app_accounts") || "[]");
        const pendingUsers = JSON.parse(localStorage.getItem("app_pending_users") || "[]");

        if (accounts.some((a) => a.username.toLowerCase() === formData.username.toLowerCase())) {
          setErrors({ username: "该用户名已存在" });
          setLoading(false);
          return;
        }

        if (pendingUsers.some((a) => a.username.toLowerCase() === formData.username.toLowerCase())) {
          setErrors({ username: "该用户名已注册，正在等待审核" });
          setLoading(false);
          return;
        }

        const newUser = {
          id: "user_" + Date.now(),
          username: formData.username.trim(),
          password: formData.password,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: "user",
          status: requireAudit ? "pending" : "active",
          createdAt: new Date().toISOString(),
          lastLogin: null,
        };

        if (requireAudit) {
          pendingUsers.push(newUser);
          localStorage.setItem("app_pending_users", JSON.stringify(pendingUsers));
          setSuccess(true);
        } else {
          accounts.push(newUser);
          localStorage.setItem("app_accounts", JSON.stringify(accounts));
          if (typeof onRegisterSuccess === "function") {
            onRegisterSuccess(newUser);
          }
        }

        const operationLogs = JSON.parse(localStorage.getItem("app_operation_logs") || "[]");
        operationLogs.unshift({
          id: Date.now(),
          userId: newUser.id,
          username: newUser.username,
          action: "用户注册",
          detail: requireAudit ? "用户提交注册申请，等待审核" : "用户注册成功",
          time: new Date().toISOString(),
          ip: "127.0.0.1",
        });
        localStorage.setItem("app_operation_logs", JSON.stringify(operationLogs.slice(0, 500)));
      } catch (e) {
        setErrors({ submit: "注册失败，请稍后重试" });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  if (success) {
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "login-page" },
      /*#__PURE__*/ React.createElement("div", { className: "login-bg-grid" }),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "login-bg-orbs" },
        /*#__PURE__*/ React.createElement("div", { className: "login-bg-orb login-bg-orb-1" }),
        /*#__PURE__*/ React.createElement("div", { className: "login-bg-orb login-bg-orb-2" }),
        /*#__PURE__*/ React.createElement("div", { className: "login-bg-orb login-bg-orb-3" }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "login-container" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "login-left" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-left-content" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-brand" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-brand-icon" },
                /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-brand-text" },
                /*#__PURE__*/ React.createElement("h1", null, "店数智"),
                /*#__PURE__*/ React.createElement("p", null, "ShopData"),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "h2",
              { className: "login-left-title" },
              "多店数据，",
              /*#__PURE__*/ React.createElement("span", { className: "highlight" }, "一屏尽览"),
            ),
            /*#__PURE__*/ React.createElement(
              "p",
              { className: "login-left-desc" },
              "支持多平台店铺数据整合，智能对比分析，一键生成报表，让店铺运营决策更高效。",
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "login-right" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-form-header" },
            /*#__PURE__*/ React.createElement("h2", null, "注册成功"),
            /*#__PURE__*/ React.createElement("p", null, "您的账号已提交注册申请"),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "register-success" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "register-success-icon" },
              /*#__PURE__*/ React.createElement(Icons.CheckCircle, { size: 64 }),
            ),
            /*#__PURE__*/ React.createElement(
              "h3",
              null,
              "提交成功！",
            ),
            /*#__PURE__*/ React.createElement(
              "p",
              null,
              "您的注册申请已提交，请等待管理员审核。",
            ),
            /*#__PURE__*/ React.createElement(
              "p",
              { className: "register-success-tip" },
              "审核通过后，您将可以正常登录系统。",
            ),
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "login-btn",
                onClick: onBackToLogin,
              },
              "返回登录",
            ),
          ),
        ),
      ),
    );
  }

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "login-page" },
    /*#__PURE__*/ React.createElement("div", { className: "login-bg-grid" }),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "login-bg-orbs" },
      /*#__PURE__*/ React.createElement("div", { className: "login-bg-orb login-bg-orb-1" }),
      /*#__PURE__*/ React.createElement("div", { className: "login-bg-orb login-bg-orb-2" }),
      /*#__PURE__*/ React.createElement("div", { className: "login-bg-orb login-bg-orb-3" }),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "login-container" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "login-left" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "login-left-content" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-brand" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-brand-icon" },
              /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-brand-text" },
              /*#__PURE__*/ React.createElement("h1", null, "店数智"),
              /*#__PURE__*/ React.createElement("p", null, "ShopData"),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "h2",
            { className: "login-left-title" },
            "多店数据，",
            /*#__PURE__*/ React.createElement("span", { className: "highlight" }, "一屏尽览"),
          ),
          /*#__PURE__*/ React.createElement(
            "p",
            { className: "login-left-desc" },
            "支持多平台店铺数据整合，智能对比分析，一键生成报表，让店铺运营决策更高效。",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-features" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-feature-item" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-feature-icon" },
                /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-feature-text" },
                /*#__PURE__*/ React.createElement("h4", null, "智能模板识别"),
                /*#__PURE__*/ React.createElement("p", null, "自动识别Excel模板字段"),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-feature-item" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-feature-icon" },
                /*#__PURE__*/ React.createElement(Icons.Calculator, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-feature-text" },
                /*#__PURE__*/ React.createElement("h4", null, "可视化计算规则"),
                /*#__PURE__*/ React.createElement("p", null, "拖拽式配置计算步骤"),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-feature-item" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-feature-icon" },
                /*#__PURE__*/ React.createElement(Icons.Zap, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-feature-text" },
                /*#__PURE__*/ React.createElement("h4", null, "批量计算"),
                /*#__PURE__*/ React.createElement("p", null, "多店铺一键批量生成报表"),
              ),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "login-left-footer" },
          /*#__PURE__*/ React.createElement("p", null, "\u00A9 2026 \u5E97\u6570\u667A ShopData. \u4FDD\u7559\u6240\u6709\u6743\u5229."),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "login-right" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "login-form-header" },
          /*#__PURE__*/ React.createElement("h2", null, "创建账号"),
          /*#__PURE__*/ React.createElement("p", null, "填写以下信息完成注册"),
        ),
        errors.submit &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "alert alert-danger login-alert" },
            /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { marginRight: 8, width: 14, height: 14 } }),
            errors.submit,
          ),
        /*#__PURE__*/ React.createElement(
          "form",
          { className: "login-form", onSubmit: handleSubmit },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "register-form-grid" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label required" },
                "用户名",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-input-group" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-input-icon" },
                  /*#__PURE__*/ React.createElement(Icons.User, null),
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "login-input",
                  placeholder: "请输入用户名",
                  value: formData.username,
                  onChange: (e) => handleChange("username", e.target.value),
                  autoFocus: true,
                }),
              ),
              errors.username &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-error-text" },
                  /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
                  errors.username,
                ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label required" },
                "姓名",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-input-group" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-input-icon" },
                  /*#__PURE__*/ React.createElement(Icons.User, null),
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "login-input",
                  placeholder: "请输入真实姓名",
                  value: formData.name,
                  onChange: (e) => handleChange("name", e.target.value),
                }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label required" },
                "密码",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-input-group" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-input-icon" },
                  /*#__PURE__*/ React.createElement(Icons.Lock, null),
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: showPassword ? "text" : "password",
                  className: "login-input",
                  placeholder: "请输入密码（至少4位）",
                  value: formData.password,
                  onChange: (e) => handleChange("password", e.target.value),
                }),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "login-toggle-password",
                    onClick: () => setShowPassword(!showPassword),
                  },
                  showPassword ? /*#__PURE__*/ React.createElement(Icons.EyeOff, null) : /*#__PURE__*/ React.createElement(Icons.Eye, null),
                ),
              ),
              errors.password &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-error-text" },
                  /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
                  errors.password,
                ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label required" },
                "确认密码",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-input-group" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-input-icon" },
                  /*#__PURE__*/ React.createElement(Icons.Lock, null),
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: showConfirmPassword ? "text" : "password",
                  className: "login-input",
                  placeholder: "请再次输入密码",
                  value: formData.confirmPassword,
                  onChange: (e) => handleChange("confirmPassword", e.target.value),
                }),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "login-toggle-password",
                    onClick: () => setShowConfirmPassword(!showConfirmPassword),
                  },
                  showConfirmPassword ? /*#__PURE__*/ React.createElement(Icons.EyeOff, null) : /*#__PURE__*/ React.createElement(Icons.Eye, null),
                ),
              ),
              errors.confirmPassword &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-error-text" },
                  /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
                  errors.confirmPassword,
                ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "邮箱",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-input-group" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-input-icon" },
                  /*#__PURE__*/ React.createElement(Icons.Inbox, null),
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "email",
                  className: "login-input",
                  placeholder: "请输入邮箱地址",
                  value: formData.email,
                  onChange: (e) => handleChange("email", e.target.value),
                }),
              ),
              errors.email &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-error-text" },
                  /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
                  errors.email,
                ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "手机号",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "login-input-group" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-input-icon" },
                  /*#__PURE__*/ React.createElement(Icons.Phone, null),
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "tel",
                  className: "login-input",
                  placeholder: "请输入手机号",
                  value: formData.phone,
                  onChange: (e) => handleChange("phone", e.target.value),
                }),
              ),
              errors.phone &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "login-error-text" },
                  /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
                  errors.phone,
                ),
            ),
          ),
          requireAudit &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "register-audit-notice" },
              /*#__PURE__*/ React.createElement(Icons.Info, { size: 16 }),
              /*#__PURE__*/ React.createElement(
                "span",
                null,
                "注册后需管理员审核通过后方可登录",
              ),
            ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              type: "submit",
              className: "login-btn",
              disabled: loading,
            },
            loading ? "注册中..." : "立即注册",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-admin-entry" },
            /*#__PURE__*/ React.createElement(
              "span",
              null,
              "已有账号？",
            ),
            /*#__PURE__*/ React.createElement(
              "a",
              {
                href: "#",
                className: "login-admin-link",
                onClick: (e) => {
                  e.preventDefault();
                  if (typeof onBackToLogin === "function") {
                    onBackToLogin();
                  }
                },
              },
              "立即登录 →",
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "login-footer" },
          /*#__PURE__*/ React.createElement(
            "p",
            null,
            "\u00A9 2026 \u5E97\u6570\u667A ShopData. \u4FDD\u7559\u6240\u6709\u6743\u5229.",
          ),
        ),
      ),
    ),
  );
};

window.RegisterPage = RegisterPage;
