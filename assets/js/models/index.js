// models/index.js - 模型统一入口
// 自动注册所有模型到 window.Models

(function() {
  const models = {
    userModel: window.UserModel,
    templateModel: window.TemplateModel,
    platformModel: window.PlatformModel,
    ruleModel: window.RuleModel,
    recognitionModel: window.RecognitionModel,
  };

  if (!window.Models) {
    window.Models = {};
  }

  Object.entries(models).forEach(([name, model]) => {
    if (model) {
      window.Models[name] = model;
    }
  });

  window.Models.install = function() {
    return models;
  };

  window.Models.list = function() {
    return Object.keys(models).filter(k => models[k]);
  };

  window.Models.get = function(name) {
    return window.Models[name] || null;
  };
})();
