// components/Tooltip.js - 提示组件
(function() {
  const { useState, useRef, useEffect } = React;

  const Tooltip = ({
    title,
    placement = "top",
    trigger = "hover",
    children,
    color,
    overlayClassName = "",
    overlayStyle,
    visible,
    onVisibleChange,
    className = "",
  }) => {
    const [internalVisible, setInternalVisible] = useState(false);
    const tooltipRef = useRef(null);
    const wrapperRef = useRef(null);

    const isVisible = visible !== undefined ? visible : internalVisible;

    const show = () => {
      if (visible === undefined) {
        setInternalVisible(true);
      }
      if (onVisibleChange) {
        onVisibleChange(true);
      }
    };

    const hide = () => {
      if (visible === undefined) {
        setInternalVisible(false);
      }
      if (onVisibleChange) {
        onVisibleChange(false);
      }
    };

    const toggle = () => {
      if (isVisible) {
        hide();
      } else {
        show();
      }
    };

    const getEventHandlers = () => {
      if (trigger === "hover") {
        return {
          onMouseEnter: show,
          onMouseLeave: hide,
        };
      }
      if (trigger === "click") {
        return {
          onClick: toggle,
        };
      }
      if (trigger === "focus") {
        return {
          onFocus: show,
          onBlur: hide,
        };
      }
      return {};
    };

    useEffect(() => {
      if (trigger === "click" && isVisible) {
        const handleClickOutside = (e) => {
          if (
            wrapperRef.current &&
            !wrapperRef.current.contains(e.target)
          ) {
            hide();
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isVisible, trigger]);

    if (!title) {
      return children;
    }

    return /*#__PURE__*/ React.createElement(
      "span",
      {
        ref: wrapperRef,
        className: `tooltip-wrapper ${className}`,
        ...getEventHandlers(),
      },
      children,
      isVisible &&
        /*#__PURE__*/ React.createElement(
          "div",
          {
            ref: tooltipRef,
            className: `tooltip tooltip-${placement} ${overlayClassName}`,
            style: overlayStyle,
          },
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "tooltip-arrow",
              style: color ? { borderTopColor: color } : null,
            }
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "tooltip-inner",
              style: color ? { background: color } : null,
            },
            title
          )
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Tooltip = Tooltip;
  window.Tooltip = Tooltip;
})();
