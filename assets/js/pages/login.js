// LoginPage - 登录页面组件
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateUsername = (val) => {
    if (!val.trim()) {
      setUsernameError("请输入用户名");
      return false;
    }
    if (val.trim().length < 2) {
      setUsernameError("用户名至少2个字符");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const validatePassword = (val) => {
    if (!val.trim()) {
      setPasswordError("请输入密码");
      return false;
    }
    if (val.trim().length < 4) {
      setPasswordError("密码至少4个字符");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const userValid = validateUsername(username);
    const pwdValid = validatePassword(password);
    if (!userValid || !pwdValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        username: username.trim(),
        password: password,
        remember,
        onError: (msg) => {
          setError(msg);
        },
      });
    }, 500);
  };

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
          /*#__PURE__*/ React.createElement("h2", null, "欢迎回来"),
          /*#__PURE__*/ React.createElement("p", null, "请登录您的账号开始使用"),
        ),
        error &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "alert alert-danger login-alert" },
            /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { marginRight: 8, width: 14, height: 14 } }),
            error,
          ),
        /*#__PURE__*/ React.createElement(
          "form",
          { className: "login-form", onSubmit: handleSubmit },
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
              value: username,
              onChange: (e) => {
                setUsername(e.target.value);
                if (usernameError) validateUsername(e.target.value);
              },
              onBlur: () => validateUsername(username),
              autoFocus: true,
            }),
          ),
          usernameError &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-error-text" },
              /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
              usernameError,
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
              placeholder: "请输入密码",
              value: password,
              onChange: (e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              },
              onBlur: () => validatePassword(password),
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
          passwordError &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "login-error-text" },
              /*#__PURE__*/ React.createElement(Icons.AlertCircle, { style: { width: 12, height: 12 } }),
              passwordError,
            ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-options" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "login-checkbox" },
              /*#__PURE__*/ React.createElement("input", {
                type: "checkbox",
                checked: remember,
                onChange: (e) => setRemember(e.target.checked),
              }),
              "\u8BB0\u4F4F\u6211",
            ),
            /*#__PURE__*/ React.createElement(
              "a",
              { href: "#", className: "login-forgot" },
              "\u5FD8\u8BB0\u5BC6\u7801\uFF1F",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              type: "submit",
              className: "login-btn",
              disabled: loading,
            },
            loading ? "登录中..." : "登录",
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