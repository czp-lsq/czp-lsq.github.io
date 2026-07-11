// button - 通用按钮组件
const Button = ({
  children,
  onClick,
  type = "default",
  size,
  disabled,
  className = "",
  style,
  loading,
}) =>
  /*#__PURE__*/ React.createElement(
    "button",
    {
      className: `btn btn-${type} ${size === "sm" ? "btn-sm" : ""} ${className}`,
      onClick: onClick,
      disabled: disabled || loading,
      style: style,
    },
    loading &&
      /*#__PURE__*/ React.createElement("span", {
        className: "spinner",
        style: { marginRight: 6 },
      }),
    children,
  );
