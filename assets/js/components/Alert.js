// alert - 提示与标签组件集合
const Alert = ({ type = "info", children, style }) => {
  const icons = {
    info: /*#__PURE__*/ React.createElement(Icons.Info, null),
    success: /*#__PURE__*/ React.createElement(Icons.Check, null),
    warning: /*#__PURE__*/ React.createElement(Icons.AlertCircle, null),
    error: /*#__PURE__*/ React.createElement(Icons.AlertCircle, null),
  };
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: `alert alert-${type}`, style: style },
    /*#__PURE__*/ React.createElement(
      "span",
      { className: "alert-icon" },
      icons[type],
    ),
    /*#__PURE__*/ React.createElement("div", null, children),
  );
};
const Tag = ({ type = "default", children }) =>
  /*#__PURE__*/ React.createElement(
    "span",
    { className: `tag tag-${type}` },
    children,
  );

window.Alert = Alert;
window.Tag = Tag;

