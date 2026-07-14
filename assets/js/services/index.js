// services/index.js - 服务统一入口
// 自动注册所有服务到 window.Services

(function() {
  const services = {
    authService: window.AuthService,
    dataService: window.DataService,
    notificationService: window.NotificationService,
    Notification: window.NotificationCenter,
    NotificationCenter: window.NotificationCenter,
    themeService: window.ThemeService,
    syncService: window.SyncService,
  };

  if (!window.Services) {
    window.Services = {};
  }

  Object.entries(services).forEach(([name, service]) => {
    if (service) {
      window.Services[name] = service;
    }
  });

  window.Services.install = function() {
    return services;
  };

  window.Services.list = function() {
    return Object.keys(services).filter(k => services[k]);
  };

  window.Services.get = function(name) {
    return window.Services[name] || null;
  };
})();
