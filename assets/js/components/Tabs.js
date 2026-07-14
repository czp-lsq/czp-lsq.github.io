// components/Tabs.js - 标签页组件
(function() {
  const { useState } = React;

  const Tabs = ({
    defaultActiveKey,
    activeKey,
    items = [],
    onChange,
    type = "line",
    tabPosition = "top",
    className = "",
    style,
  }) => {
    const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || (items[0]?.key));
    const currentKey = activeKey !== undefined ? activeKey : internalActiveKey;

    const handleTabClick = (key) => {
      if (key === currentKey) return;
      if (activeKey === undefined) {
        setInternalActiveKey(key);
      }
      if (onChange) {
        onChange(key);
      }
    };

    const activeItem = items.find(item => item.key === currentKey);

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `tabs tabs-${type} tabs-${tabPosition} ${className}`,
        style: style,
      },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "tabs-nav" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "tabs-nav-wrap" },
          items.map((item) =>
            /*#__PURE__*/ React.createElement(
              "div",
              {
                key: item.key,
                className: `tabs-tab ${item.key === currentKey ? "tabs-tab-active" : ""} ${item.disabled ? "tabs-tab-disabled" : ""}`,
                onClick: () => {
                  if (!item.disabled) {
                    handleTabClick(item.key);
                  }
                },
              },
              item.icon && /*#__PURE__*/ React.createElement(
                "span",
                { className: "tabs-tab-icon" },
                item.icon
              ),
              item.label
            )
          )
        )
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "tabs-content" },
        activeItem?.children
      )
    );
  };

  const TabPane = ({ children }) => {
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "tab-pane" },
      children
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Tabs = Tabs;
  window.Components.TabPane = TabPane;
  window.Tabs = Tabs;
  window.TabPane = TabPane;
})();
