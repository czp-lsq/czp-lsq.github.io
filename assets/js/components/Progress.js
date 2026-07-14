// components/Progress.js - 进度条组件
(function() {
  const Progress = ({
    percent = 0,
    status,
    type = "line",
    strokeWidth = 8,
    strokeLinecap = "round",
    strokeColor,
    trailColor,
    format,
    showInfo = true,
    size = "default",
    width = 132,
    steps,
    className = "",
    style,
  }) => {
    const safePercent = Math.min(100, Math.max(0, percent));
    const displayPercent = format ? format(safePercent) : `${safePercent}%`;

    const getStatusColor = () => {
      if (strokeColor) return strokeColor;
      if (status === "success") return "var(--color-success)";
      if (status === "exception") return "var(--color-danger)";
      if (status === "active") return "var(--color-primary)";
      return "var(--color-primary)";
    };

    if (type === "circle") {
      const radius = (width - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (safePercent / 100) * circumference;

      return /*#__PURE__*/ React.createElement(
        "div",
        {
          className: `progress progress-circle ${status ? `progress-${status}` : ""} ${className}`,
          style: { width: width, height: width, ...style },
        },
        /*#__PURE__*/ React.createElement(
          "svg",
          {
            className: "progress-circle-svg",
            width: width,
            height: width,
          },
          /*#__PURE__*/ React.createElement("circle", {
            className: "progress-circle-trail",
            cx: width / 2,
            cy: width / 2,
            r: radius,
            strokeWidth: strokeWidth,
            fill: "none",
            stroke: trailColor || "var(--color-border)",
          }),
          /*#__PURE__*/ React.createElement("circle", {
            className: `progress-circle-path ${status === "active" ? "progress-circle-active" : ""}`,
            cx: width / 2,
            cy: width / 2,
            r: radius,
            strokeWidth: strokeWidth,
            fill: "none",
            stroke: getStatusColor(),
            strokeLinecap: strokeLinecap,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          })
        ),
        showInfo &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "progress-circle-text" },
            displayPercent
          )
      );
    }

    if (type === "dashboard") {
      return /*#__PURE__*/ React.createElement(
        "div",
        {
          className: `progress progress-dashboard ${status ? `progress-${status}` : ""} ${className}`,
          style: style,
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "progress-inner" },
          /*#__PURE__*/ React.createElement("div", {
            className: "progress-bg",
            style: { height: strokeWidth, background: trailColor || "var(--color-border)" },
          }),
          /*#__PURE__*/ React.createElement("div", {
            className: `progress-bar ${status === "active" ? "progress-bar-active" : ""}`,
            style: {
              width: `${safePercent}%`,
              height: strokeWidth,
              background: getStatusColor(),
              borderRadius: strokeLinecap === "round" ? strokeWidth / 2 : 0,
            },
          })
        ),
        showInfo &&
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "progress-text" },
            displayPercent
          )
      );
    }

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `progress progress-line ${status ? `progress-${status}` : ""} ${size === "small" ? "progress-small" : ""} ${className}`,
        style: style,
      },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "progress-inner" },
        /*#__PURE__*/ React.createElement("div", {
          className: "progress-bg",
          style: { height: strokeWidth, background: trailColor || "var(--color-border)" },
        }),
        /*#__PURE__*/ React.createElement("div", {
          className: `progress-bar ${status === "active" ? "progress-bar-active" : ""}`,
          style: {
            width: `${safePercent}%`,
            height: strokeWidth,
            background: getStatusColor(),
            borderRadius: strokeLinecap === "round" ? strokeWidth / 2 : 0,
          },
        })
      ),
      showInfo &&
        /*#__PURE__*/ React.createElement(
          "span",
          { className: "progress-text" },
          displayPercent
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Progress = Progress;
  window.Progress = Progress;
})();
