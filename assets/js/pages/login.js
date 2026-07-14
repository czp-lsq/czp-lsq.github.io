// LoginPage - 登录页面组件
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem("app_login_user");
      if (saved) {
        const data = JSON.parse(saved);
        return data.username || "";
      }
    } catch (e) {}
    return "";
  });
  const [password, setPassword] = useState(() => {
    try {
      const saved = localStorage.getItem("app_login_user");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.encryptedPassword && data.username) {
          return "********";
        }
      }
    } catch (e) {}
    return "";
  });
  const [remember, setRemember] = useState(() => {
    try {
      const saved = localStorage.getItem("app_login_user");
      return !!saved;
    } catch (e) {
      return false;
    }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaSent, setCaptchaSent] = useState(false);
  const [captchaCountdown, setCaptchaCountdown] = useState(0);
  const [forgotError, setForgotError] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

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
    
    const isRemembered = password === "********";
    
    setTimeout(() => {
      setLoading(false);
      onLogin({
        username: username.trim(),
        password: password,
        remember,
        isRemembered,
        isAdminMode,
        onError: (msg) => {
          setError(msg);
          setPassword("");
        },
      });
    }, 500);
  };

  const getAccounts = () => {
    try {
      const saved = localStorage.getItem("app_accounts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const handleForgotStep1 = () => {
    setForgotError("");
    if (!forgotUsername.trim()) {
      setForgotError("请输入用户名");
      return;
    }
    const accounts = getAccounts();
    const account = accounts.find((a) => a.username === forgotUsername.trim());
    if (!account) {
      setForgotError("该用户名不存在");
      return;
    }
    if (!account.email) {
      setForgotError("该账户未绑定邮箱，请联系管理员重置密码");
      return;
    }
    setForgotEmail(account.email);
    setForgotStep(2);
  };

  const sendCaptcha = () => {
    setForgotError("");
    const captcha = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("app_reset_captcha", JSON.stringify({
      code: captcha,
      username: forgotUsername,
      expiresAt: Date.now() + 300000,
    }));
    setCaptchaSent(true);
    setCaptchaCountdown(60);
    alert(`验证码已发送至邮箱 ${forgotEmail}：${captcha}\n\n（注意：当前为演示模式，验证码直接显示在弹窗中）`);
    const timer = setInterval(() => {
      setCaptchaCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleForgotStep2 = () => {
    setForgotError("");
    if (!captchaCode.trim()) {
      setForgotError("请输入验证码");
      return;
    }
    try {
      const savedCaptcha = JSON.parse(localStorage.getItem("app_reset_captcha") || "null");
      if (!savedCaptcha) {
        setForgotError("验证码已过期，请重新获取");
        return;
      }
      if (Date.now() > savedCaptcha.expiresAt) {
        setForgotError("验证码已过期，请重新获取");
        localStorage.removeItem("app_reset_captcha");
        return;
      }
      if (savedCaptcha.username !== forgotUsername || savedCaptcha.code !== captchaCode.trim()) {
        setForgotError("验证码不正确");
        return;
      }
      setForgotStep(3);
    } catch (e) {
      setForgotError("验证码验证失败");
    }
  };

  const handleForgotStep3 = () => {
    setForgotError("");
    if (!newPassword.trim()) {
      setForgotError("请输入新密码");
      return;
    }
    if (newPassword.trim().length < 4) {
      setForgotError("密码至少4个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("两次输入的密码不一致");
      return;
    }
    const accounts = getAccounts();
    const updatedAccounts = accounts.map((a) =>
      a.username === forgotUsername ? { ...a, password: newPassword } : a
    );
    localStorage.setItem("app_accounts", JSON.stringify(updatedAccounts));
    localStorage.removeItem("app_reset_captcha");
    alert("密码重置成功！请使用新密码登录");
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotUsername("");
    setCaptchaCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCaptchaSent(false);
    setCaptchaCountdown(0);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotUsername("");
    setCaptchaCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCaptchaSent(false);
    setCaptchaCountdown(0);
    setForgotError("");
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
          /*#__PURE__*/ React.createElement("h2", null, isAdminMode ? "后台管理登录" : "欢迎回来"),
          /*#__PURE__*/ React.createElement("p", null, isAdminMode ? "请输入管理员账号密码" : "请登录您的账号开始使用"),
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
              { href: "#", className: "login-forgot", onClick: (e) => { e.preventDefault(); setShowForgotModal(true); } },
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
            loading ? "登录中..." : (isAdminMode ? "后台登录" : "登录"),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "login-admin-entry" },
            /*#__PURE__*/ React.createElement(
              "a",
              {
                href: "#",
                className: "login-admin-link",
                onClick: (e) => {
                  e.preventDefault();
                  setIsAdminMode(!isAdminMode);
                  setError("");
                  setUsername("");
                  setPassword("");
                  setUsernameError("");
                  setPasswordError("");
                },
              },
              isAdminMode ? "← 返回用户登录" : "后台管理入口 →",
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
    showForgotModal && /*#__PURE__*/ React.createElement(
      "div",
      { className: "login-forgot-overlay", onClick: closeForgotModal },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "login-forgot-modal", onClick: (e) => e.stopPropagation() },
        /*#__PURE__*/ React.createElement("div", { className: "login-forgot-header" },
          /*#__PURE__*/ React.createElement(Icons.Lock, { style: { width: 24, height: 24, color: "var(--color-primary)" } }),
          /*#__PURE__*/ React.createElement("h3", null, "找回密码"),
          /*#__PURE__*/ React.createElement("button", { className: "login-forgot-close", onClick: closeForgotModal },
            /*#__PURE__*/ React.createElement(Icons.X, null),
          ),
        ),
        /*#__PURE__*/ React.createElement("div", { className: "login-forgot-progress" },
          /*#__PURE__*/ React.createElement("div", { className: `login-progress-step ${forgotStep >= 1 ? "active" : ""}` }, "1"),
          /*#__PURE__*/ React.createElement("div", { className: `login-progress-line ${forgotStep >= 2 ? "active" : ""}` }),
          /*#__PURE__*/ React.createElement("div", { className: `login-progress-step ${forgotStep >= 2 ? "active" : ""}` }, "2"),
          /*#__PURE__*/ React.createElement("div", { className: `login-progress-line ${forgotStep >= 3 ? "active" : ""}` }),
          /*#__PURE__*/ React.createElement("div", { className: `login-progress-step ${forgotStep >= 3 ? "active" : ""}` }, "3"),
        ),
        forgotError && /*#__PURE__*/ React.createElement(
          "div",
          { className: "alert alert-danger", style: { marginBottom: "16px" } },
          forgotError,
        ),
        forgotStep === 1 && /*#__PURE__*/ React.createElement("div", { className: "login-forgot-body" },
          /*#__PURE__*/ React.createElement("p", { className: "login-forgot-desc" }, "请输入您的用户名，系统将向您绑定的邮箱发送验证码"),
          /*#__PURE__*/ React.createElement("div", { className: "login-input-group" },
            /*#__PURE__*/ React.createElement("div", { className: "login-input-icon" },
              /*#__PURE__*/ React.createElement(Icons.User, null),
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "login-input",
              placeholder: "请输入用户名",
              value: forgotUsername,
              onChange: (e) => setForgotUsername(e.target.value),
              autoFocus: true,
            }),
          ),
          /*#__PURE__*/ React.createElement("div", { className: "login-forgot-actions" },
            /*#__PURE__*/ React.createElement("button", { className: "login-btn", onClick: handleForgotStep1 }, "下一步"),
          ),
        ),
        forgotStep === 2 && /*#__PURE__*/ React.createElement("div", { className: "login-forgot-body" },
          /*#__PURE__*/ React.createElement("p", { className: "login-forgot-desc" }, `验证码已发送至邮箱：${forgotEmail.replace(/@.*/, '@***')}`),
          /*#__PURE__*/ React.createElement("div", { className: "login-input-group" },
            /*#__PURE__*/ React.createElement("div", { className: "login-input-icon" },
              /*#__PURE__*/ React.createElement(Icons.Inbox, null),
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "login-input",
              placeholder: "请输入6位验证码",
              value: captchaCode,
              onChange: (e) => setCaptchaCode(e.target.value),
              autoFocus: true,
              maxLength: 6,
            }),
            /*#__PURE__*/ React.createElement("button", {
              className: "login-forgot-send-captcha",
              onClick: sendCaptcha,
              disabled: captchaCountdown > 0,
            },
              captchaCountdown > 0 ? `${captchaCountdown}s` : (captchaSent ? "重新发送" : "发送验证码"),
            ),
          ),
          /*#__PURE__*/ React.createElement("div", { className: "login-forgot-actions" },
            /*#__PURE__*/ React.createElement("button", { className: "login-btn login-btn-secondary", onClick: () => setForgotStep(1) }, "返回"),
            /*#__PURE__*/ React.createElement("button", { className: "login-btn", onClick: handleForgotStep2 }, "验证"),
          ),
        ),
        forgotStep === 3 && /*#__PURE__*/ React.createElement("div", { className: "login-forgot-body" },
          /*#__PURE__*/ React.createElement("p", { className: "login-forgot-desc" }, "请设置新密码，密码至少4个字符"),
          /*#__PURE__*/ React.createElement("div", { className: "login-input-group" },
            /*#__PURE__*/ React.createElement("div", { className: "login-input-icon" },
              /*#__PURE__*/ React.createElement(Icons.Lock, null),
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "password",
              className: "login-input",
              placeholder: "请输入新密码",
              value: newPassword,
              onChange: (e) => setNewPassword(e.target.value),
              autoFocus: true,
            }),
          ),
          /*#__PURE__*/ React.createElement("div", { className: "login-input-group" },
            /*#__PURE__*/ React.createElement("div", { className: "login-input-icon" },
              /*#__PURE__*/ React.createElement(Icons.Lock, null),
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "password",
              className: "login-input",
              placeholder: "请确认新密码",
              value: confirmPassword,
              onChange: (e) => setConfirmPassword(e.target.value),
            }),
          ),
          /*#__PURE__*/ React.createElement("div", { className: "login-forgot-actions" },
            /*#__PURE__*/ React.createElement("button", { className: "login-btn login-btn-secondary", onClick: () => setForgotStep(2) }, "返回"),
            /*#__PURE__*/ React.createElement("button", { className: "login-btn", onClick: handleForgotStep3 }, "重置密码"),
          ),
        ),
      ),
    ),
  );
};