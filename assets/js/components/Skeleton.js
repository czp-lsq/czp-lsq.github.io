// components/Skeleton.js - 骨架屏组件
(function() {
  const Skeleton = ({
    active = true,
    loading = true,
    avatar = false,
    title = true,
    paragraph = true,
    rows = 3,
    className = "",
    style,
    children,
  }) => {
    if (!loading) {
      return children || null;
    }

    const paragraphRows = typeof paragraph === "object"
      ? (paragraph.rows || rows)
      : (paragraph ? rows : 0);

    const paragraphWidths = typeof paragraph === "object" && paragraph.width
      ? (Array.isArray(paragraph.width) ? paragraph.width : [paragraph.width])
      : [];

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `skeleton ${active ? "skeleton-active" : ""} ${className}`,
        style: style,
      },
      avatar &&
        /*#__PURE__*/ React.createElement(
          "div",
          {
            className: `skeleton-avatar ${typeof avatar === "object" && avatar.shape === "square" ? "skeleton-avatar-square" : ""}`,
            style: typeof avatar === "object" && avatar.size
              ? { width: avatar.size, height: avatar.size }
              : null,
          }
        ),
      (title || paragraph) &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "skeleton-content" },
          title &&
            /*#__PURE__*/ React.createElement("div", {
              className: "skeleton-title",
              style: typeof title === "object" && title.width
                ? { width: title.width }
                : null,
            }),
          paragraph &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "skeleton-paragraph" },
              Array.from({ length: paragraphRows }).map((_, index) =>
                /*#__PURE__*/ React.createElement("div", {
                  key: index,
                  className: "skeleton-line",
                  style: paragraphWidths[index]
                    ? { width: paragraphWidths[index] }
                    : index === paragraphRows - 1
                      ? { width: "60%" }
                      : null,
                })
              )
            )
        )
    );
  };

  const SkeletonInput = ({
    size = "default",
    active = true,
    block = false,
    className = "",
    style,
  }) =>
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `skeleton-input skeleton-input-${size} ${block ? "skeleton-input-block" : ""} ${active ? "skeleton-active" : ""} ${className}`,
        style: style,
      }
    );

  const SkeletonImage = ({
    className = "",
    style,
  }) =>
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `skeleton-image ${className}`,
        style: style,
      },
      /*#__PURE__*/ React.createElement(
        "svg",
        {
          width: "48",
          height: "48",
          viewBox: "0 0 48 48",
          fill: "none",
        },
        /*#__PURE__*/ React.createElement("path", {
          d: "M24 20V28M20 24H28",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
        }),
        /*#__PURE__*/ React.createElement("circle", {
          cx: "24",
          cy: "24",
          r: "18",
          stroke: "currentColor",
          strokeWidth: "2",
        })
      )
    );

  const SkeletonButton = ({
    size = "default",
    shape = "default",
    active = true,
    block = false,
    className = "",
    style,
  }) =>
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `skeleton-button skeleton-button-${size} skeleton-button-${shape} ${block ? "skeleton-button-block" : ""} ${active ? "skeleton-active" : ""} ${className}`,
        style: style,
      }
    );

  if (!window.Components) window.Components = {};
  window.Components.Skeleton = Skeleton;
  window.Components.SkeletonInput = SkeletonInput;
  window.Components.SkeletonImage = SkeletonImage;
  window.Components.SkeletonButton = SkeletonButton;
  window.Skeleton = Skeleton;
  window.SkeletonInput = SkeletonInput;
  window.SkeletonImage = SkeletonImage;
  window.SkeletonButton = SkeletonButton;
})();
