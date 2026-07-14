// components/index.js - 组件统一入口
// 自动注册所有组件到 window.Components

(function() {
  const components = {
    Alert: window.Alert,
    Tag: window.Tag,
    Button: window.Button,
    Modal: window.Modal,
    ConfirmModal: window.ConfirmModal,
    AlertModal: window.AlertModal,
    DraggableModal: window.DraggableModal,
    Select: window.Select,
    Toast: window.Toast,
    Card: window.Card,
    CardGrid: window.CardGrid,
    CardMeta: window.CardMeta,
    Tabs: window.Tabs,
    TabPane: window.TabPane,
    Table: window.Table,
    Pagination: window.Pagination,
    Badge: window.Badge,
    Avatar: window.Avatar,
    AvatarGroup: window.AvatarGroup,
    Progress: window.Progress,
    Empty: window.Empty,
    Skeleton: window.Skeleton,
    SkeletonInput: window.SkeletonInput,
    SkeletonImage: window.SkeletonImage,
    SkeletonButton: window.SkeletonButton,
    Tooltip: window.Tooltip,
  };

  if (!window.Components) {
    window.Components = {};
  }

  Object.entries(components).forEach(([name, component]) => {
    if (component) {
      window.Components[name] = component;
    }
  });

  window.Components.install = function() {
    return components;
  };

  window.Components.list = function() {
    return Object.keys(components).filter(k => components[k]);
  };
})();
