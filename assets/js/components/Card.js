// components/Card.js - 卡片组件
(function() {
  const Card = ({
    title,
    children,
    extra,
    footer,
    hoverable = false,
    bordered = true,
    loading = false,
    className = "",
    style,
    onClick,
  }) =>
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `card ${hoverable ? "card-hoverable" : ""} ${bordered ? "" : "card-bordered-none"} ${loading ? "card-loading" : ""} ${className}`,
        style: style,
        onClick: onClick,
      },
      loading &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-loading-mask" },
          /*#__PURE__*/ React.createElement("span", { className: "spinner" })
        ),
      (title || extra) &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-header" },
          title &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-title" },
              title
            ),
          extra &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-extra" },
              extra
            )
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "card-body" },
        children
      ),
      footer &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-footer" },
          footer
        )
    );

  const CardGrid = ({ children, columns = 3, gutter = 16, className = "", style }) =>
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `card-grid card-grid-${columns} ${className}`,
        style: { gap: gutter, ...style },
      },
      children
    );

  const CardMeta = ({ title, description, avatar, className = "" }) =>
    /*#__PURE__*/ React.createElement(
      "div",
      { className: `card-meta ${className}` },
      avatar &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-meta-avatar" },
          avatar
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "card-meta-content" },
        title &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card-meta-title" },
            title
          ),
        description &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card-meta-description" },
            description
          )
      )
    );

  if (!window.Components) window.Components = {};
  window.Components.Card = Card;
  window.Components.CardGrid = CardGrid;
  window.Components.CardMeta = CardMeta;
  window.Card = Card;
  window.CardGrid = CardGrid;
  window.CardMeta = CardMeta;
})();
