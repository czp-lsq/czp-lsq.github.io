// DashboardPage - 数据概览页面组件
const DashboardPage = ({ state }) => {
  const totalShopCount = useMemo(() => {
    return state.platforms.reduce((sum, p) => sum + p.shops.length, 0);
  }, [state]);

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "dashboard-page" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "page-header" },
      /*#__PURE__*/ React.createElement(
        "h1",
        { className: "page-title" },
        /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        "\u6570\u636E\u6982\u89C8",
      ),
      /*#__PURE__*/ React.createElement(
        "p",
        { className: "page-subtitle" },
        "\u5404\u5E73\u53F0\u5E97\u94FA\u6570\u91CF\u7EDF\u8BA1",
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "stats-grid" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "stat-card" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stat-label" },
          /*#__PURE__*/ React.createElement(Icons.Layers, null),
          "\u5E73\u53F0\u6570\u91CF",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stat-value" },
          state.platforms.length,
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stat-icon" },
          /*#__PURE__*/ React.createElement(Icons.Layout, null),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "stat-card success" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stat-label" },
          /*#__PURE__*/ React.createElement(Icons.Store, null),
          "\u5E97\u94FA\u603B\u6570",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stat-value" },
          totalShopCount,
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "stat-icon" },
          /*#__PURE__*/ React.createElement(Icons.Store, null),
        ),
      ),
    ),

  );
};