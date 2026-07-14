// components/Empty.js - 空状态组件
(function() {
  const Empty = ({
    description = "暂无数据",
    image,
    children,
    className = "",
    style,
  }) => {
    const defaultImage = /*#__PURE__*/ React.createElement(
      "div",
      { className: "empty-default-image" },
      /*#__PURE__*/ React.createElement(
        "svg",
        {
          width: "100",
          height: "100",
          viewBox: "0 0 100 100",
          fill: "none",
        },
        /*#__PURE__*/ React.createElement("circle", {
          cx: "50",
          cy: "35",
          r: "25",
          fill: "var(--color-bg-tertiary)",
        }),
        /*#__PURE__*/ React.createElement("path", {
          d: "M20 85 Q50 60 80 85",
          stroke: "var(--color-bg-tertiary)",
          strokeWidth: "8",
          fill: "none",
          strokeLinecap: "round",
        })
      )
    );

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `empty ${className}`,
        style: style,
      },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "empty-image" },
        image || defaultImage
      ),
      description &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "empty-description" },
          description
        ),
      children &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "empty-footer" },
          children
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Empty = Empty;
  window.Empty = Empty;
})();
