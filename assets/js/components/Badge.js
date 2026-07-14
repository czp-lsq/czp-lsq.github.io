// components/Badge.js - 徽章组件
(function() {
  const Badge = ({
    count,
    dot = false,
    showZero = false,
    overflowCount = 99,
    status,
    text,
    color,
    offset,
    className = "",
    style,
    children,
  }) => {
    const displayCount =
      count !== undefined && count !== null ? Math.min(count, overflowCount) : 0;
    const showBadge =
      count !== undefined && count !== null && (count > 0 || showZero);
    const isDot = dot || (status && !children);

    if (!children) {
      if (status) {
        return /*#__PURE__*/ React.createElement(
          "span",
          {
            className: `badge badge-status ${className}`,
            style: style,
          },
          /*#__PURE__*/ React.createElement("span", {
            className: `badge-status-dot badge-status-${status || "default"}`,
            style: color ? { background: color } : null,
          }),
          text &&
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "badge-status-text" },
              text
            )
        );
      }
      return null;
    }

    return /*#__PURE__*/ React.createElement(
      "span",
      { className: `badge-wrapper ${className}`, style: style },
      children,
      (showBadge || dot) &&
        /*#__PURE__*/ React.createElement(
          "span",
          {
            className: `badge ${isDot ? "badge-dot" : ""}`,
            style: {
              top: offset ? offset[0] : null,
              right: offset ? offset[1] : null,
              background: color || null,
            },
          },
          !isDot && (displayCount > overflowCount ? `${overflowCount}+` : displayCount)
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Badge = Badge;
  window.Badge = Badge;
})();
