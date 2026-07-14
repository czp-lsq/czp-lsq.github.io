// components/Avatar.js - 头像组件
(function() {
  const Avatar = ({
    src,
    alt,
    size = "default",
    shape = "circle",
    icon,
    children,
    className = "",
    style,
    onClick,
  }) => {
    const sizeClass = typeof size === "number"
      ? ""
      : `avatar-${size}`;

    const sizeStyle = typeof size === "number"
      ? { width: size, height: size, fontSize: size / 2 }
      : {};

    if (src) {
      return /*#__PURE__*/ React.createElement(
        "span",
        {
          className: `avatar avatar-${shape} ${sizeClass} ${className}`,
          style: { ...sizeStyle, ...style },
          onClick: onClick,
        },
        /*#__PURE__*/ React.createElement("img", {
          src: src,
          alt: alt || "",
          onError: (e) => {
            e.target.style.display = "none";
          },
        })
      );
    }

    if (icon) {
      return /*#__PURE__*/ React.createElement(
        "span",
        {
          className: `avatar avatar-${shape} avatar-icon ${sizeClass} ${className}`,
          style: { ...sizeStyle, ...style },
          onClick: onClick,
        },
        icon
      );
    }

    return /*#__PURE__*/ React.createElement(
      "span",
      {
        className: `avatar avatar-${shape} ${sizeClass} ${className}`,
        style: { ...sizeStyle, ...style },
        onClick: onClick,
      },
      children
    );
  };

  const AvatarGroup = ({
    children,
    maxCount,
    maxStyle,
    size = "default",
    className = "",
  }) => {
    const childrenArray = React.Children.toArray(children);
    const displayChildren = maxCount ? childrenArray.slice(0, maxCount) : childrenArray;
    const remaining = maxCount ? childrenArray.length - maxCount : 0;

    return /*#__PURE__*/ React.createElement(
      "div",
      { className: `avatar-group ${className}` },
      displayChildren.map((child, index) =>
        /*#__PURE__*/ React.cloneElement(child, {
          key: index,
          style: {
            ...(child.props.style || {}),
            zIndex: displayChildren.length - index,
          },
        })
      ),
      remaining > 0 &&
        /*#__PURE__*/ React.createElement(
          Avatar,
          {
            key: "more",
            className: "avatar-more",
            style: {
              ...(maxStyle || {}),
              zIndex: 0,
            },
          },
          `+${remaining}`
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Avatar = Avatar;
  window.Components.AvatarGroup = AvatarGroup;
  window.Avatar = Avatar;
  window.AvatarGroup = AvatarGroup;
})();
