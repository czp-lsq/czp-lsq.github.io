const BatchCalcView = ({
  batchFiles,
  fileGroups,
  shops,
  expandedShops,
  isCalculating,
  calcProgress,
  results,
  template,
  toggleShopExpand,
  toggleSelected,
  toggleShopSelected,
  removeFile,
  assignShop,
  runBatchCalc,
  downloadResults,
  downloadSingleResult,
}) => {
  const matchedShopCount = Object.keys(fileGroups).filter(
    (k) => k !== "_error" && k !== "_unmatched",
  ).length;

  const renderFileTable = () => {
    if (batchFiles.length === 0) {
      return null;
    }

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
      },
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { fontSize: 13, color: "var(--color-text-secondary)" } },
        "\u5DF2\u4E0A\u4F20 ",
        batchFiles.length,
        " \u4E2A\u6587\u4EF6",
        /*#__PURE__*/ React.createElement(
          "span",
          {
            style: { color: "var(--color-text-tertiary)", marginLeft: 8 },
          },
          "(\u5DF2\u8BC6\u522B ",
          matchedShopCount,
          " \u4E2A\u5E97\u94FA)",
        ),
      ),
    );
  };

  const renderUnmatchedFiles = () => {
    if (!fileGroups._unmatched) return null;

    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "card", style: { marginBottom: 16 } },
      /*#__PURE__*/ React.createElement(
        "div",
        {
          className: "card-header",
          style: { padding: "12px 16px" },
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-title", style: { fontSize: 14 } },
          /*#__PURE__*/ React.createElement(Icons.Warning, null),
          "\u672A\u8BC6\u522B\u6587\u4EF6\uFF08\u8BF7\u624B\u52A8\u5206\u914D\u5E97\u94FA\uFF09",
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "data-table-container" },
        /*#__PURE__*/ React.createElement(
          "table",
          { className: "table" },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 40 } },
                /*#__PURE__*/ React.createElement("input", {
                  type: "checkbox",
                  checked: fileGroups._unmatched.every(
                    (f) => f.selected,
                  ),
                  onChange: () =>
                    fileGroups._unmatched.forEach((f) =>
                      toggleSelected(f.id),
                    ),
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u6587\u4EF6\u540D",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u9009\u62E9\u5E97\u94FA",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u6570\u636E\u91CF",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u64CD\u4F5C",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            fileGroups._unmatched.map((file) =>
              /*#__PURE__*/ React.createElement(
                "tr",
                { key: file.id },
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  /*#__PURE__*/ React.createElement("input", {
                    type: "checkbox",
                    checked: file.selected,
                    onChange: () => toggleSelected(file.id),
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      },
                    },
                    /*#__PURE__*/ React.createElement(
                      Icons.FileSpreadsheet,
                      null,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "span",
                      {
                        style: { fontWeight: 500, fontSize: 13 },
                      },
                      file.fileName,
                    ),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      style: {
                        fontSize: 12,
                        padding: "4px 8px",
                        minWidth: 120,
                      },
                      value: file.detectedShop?.id || "",
                      onChange: (e) =>
                        assignShop(file.id, e.target.value),
                    },
                    /*#__PURE__*/ React.createElement(
                      "option",
                      { value: "" },
                      "\u9009\u62E9\u5E97\u94FA",
                    ),
                    shops.map((s) =>
                      /*#__PURE__*/ React.createElement(
                        "option",
                        { key: s.id, value: s.id },
                        s.name,
                      ),
                    ),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  {
                    style: {
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                    },
                  },
                  file.data
                    ? `${Object.values(file.data.sheets)[0]?.rows?.length || 0} 行`
                    : "-",
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "btn-link danger",
                      onClick: () => removeFile(file.id),
                    },
                    /*#__PURE__*/ React.createElement(
                      Icons.Trash,
                      null,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  };

  const renderResults = () => {
    if (results.length === 0) return null;

    return /*#__PURE__*/ React.createElement(
      "div",
      { style: { marginTop: 20 } },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "section-title" },
        "\u8BA1\u7B97\u7ED3\u679C",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "data-table-container" },
        /*#__PURE__*/ React.createElement(
          "table",
          { className: "table" },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u6587\u4EF6\u540D",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u5E97\u94FA",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u72B6\u6001",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u8BA1\u7B97\u503C\u9884\u89C8",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 80 } },
                "\u64CD\u4F5C",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            results.map((r, i) =>
              /*#__PURE__*/ React.createElement(
                "tr",
                { key: i },
                /*#__PURE__*/ React.createElement(
                  "td",
                  { style: { fontSize: 13 } },
                  r.fileName,
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  r.shop
                    ? /*#__PURE__*/ React.createElement(
                        Tag,
                        { type: "success" },
                        r.shop.name,
                      )
                    : /*#__PURE__*/ React.createElement(
                        "span",
                        { style: { color: "var(--color-text-muted)" } },
                        "-",
                      ),
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  r.status === "success"
                    ? /*#__PURE__*/ React.createElement(
                        Tag,
                        { type: "success" },
                        "\u6210\u529F",
                      )
                    : /*#__PURE__*/ React.createElement(
                        Tag,
                        { type: "danger" },
                        "\u5931\u8D25",
                      ),
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  {
                    style: {
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    },
                  },
                  r.status === "success"
                    ? Object.entries(r.values)
                        .slice(0, 3)
                        .map(
                          ([k, v]) =>
                            `${k}: ${typeof v === "object" ? v.val : v}`,
                        )
                        .join(", ") +
                        (Object.keys(r.values).length > 3 ? "..." : "")
                    : r.error,
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  null,
                  r.status === "success" &&
                    /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "btn-link",
                        onClick: () => downloadSingleResult(r),
                      },
                      /*#__PURE__*/ React.createElement(
                        Icons.Download,
                        null,
                      ),
                      " \u4E0B\u8F7D",
                    ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  };

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "card-body" },
    isCalculating &&
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { marginBottom: 16 } },
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            },
          },
          /*#__PURE__*/ React.createElement(
            "span",
            { style: { fontSize: 12, color: "var(--color-text-secondary)" } },
            "\u6B63\u5728\u8BA1\u7B97...",
          ),
          /*#__PURE__*/ React.createElement(
            "span",
            { style: { fontSize: 12, color: "var(--color-text-tertiary)" } },
            calcProgress,
            "%",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "progress-bar" },
          /*#__PURE__*/ React.createElement("div", {
            className: "progress-fill",
            style: { width: `${calcProgress}%` },
          }),
        ),
      ),
    renderFileTable(),
    batchFiles.length > 0 &&
      /*#__PURE__*/ React.createElement(
        "div",
        {
          className: "data-table-container",
          style: { marginBottom: 16 },
        },
        /*#__PURE__*/ React.createElement(
          "table",
          { className: "table" },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 40 } },
                /*#__PURE__*/ React.createElement("input", {
                  type: "checkbox",
                  checked:
                    batchFiles.length > 0 &&
                    batchFiles.every((f) => f.selected),
                  onChange: () =>
                    batchFiles.forEach((f) => toggleSelected(f.id)),
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u5E97\u94FA",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u6587\u4EF6\u6570\u91CF",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u6570\u636E\u91CF",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 100 } },
                "\u72B6\u6001",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 80 } },
                "\u64CD\u4F5C",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            Object.entries(fileGroups).map(([shopId, files]) => {
              if (shopId === "_error") {
                return /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: "_error" },
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked: files.every((f) => f.selected),
                      onChange: () =>
                        files.forEach((f) => toggleSelected(f.id)),
                    }),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      Tag,
                      { type: "danger" },
                      "\u89E3\u6790\u5931\u8D25",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    files.length,
                  ),
                  /*#__PURE__*/ React.createElement("td", null, "-"),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      Tag,
                      { type: "danger" },
                      "\u9519\u8BEF",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement("td", null, "-"),
                );
              }
              if (shopId === "_unmatched") {
                return /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: "_unmatched" },
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked: files.every((f) => f.selected),
                      onChange: () =>
                        files.forEach((f) => toggleSelected(f.id)),
                    }),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      Tag,
                      { type: "warning" },
                      "\u5F85\u5339\u914D",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    files.length,
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    files.reduce(
                      (sum, f) =>
                        sum +
                        (f.data
                          ? Object.values(f.data.sheets)[0]?.rows
                              ?.length || 0
                          : 0),
                      0,
                    ),
                    " \u884C",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      Tag,
                      { type: "warning" },
                      "\u672A\u8BC6\u522B",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement("td", null, "-"),
                );
              }
              const shop = shops.find((s) => s.id === shopId);
              const isExpanded = expandedShops.has(shopId);
              const totalRows = files.reduce(
                (sum, f) =>
                  sum +
                  (f.data
                    ? Object.values(f.data.sheets)[0]?.rows?.length ||
                      0
                    : 0),
                0,
              );
              return /*#__PURE__*/ React.createElement(
                React.Fragment,
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  {
                    key: shopId,
                    style: { background: "var(--color-bg-tertiary)" },
                  },
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked: files.every((f) => f.selected),
                      onChange: () => toggleShopSelected(shopId),
                    }),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        onClick: () => toggleShopExpand(shopId),
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "inherit",
                        },
                      },
                      /*#__PURE__*/ React.createElement(
                        Icons.ChevronRight,
                        {
                          style: {
                            transform: isExpanded
                              ? "rotate(90deg)"
                              : "none",
                            transition: "transform 0.2s",
                          },
                        },
                      ),
                      /*#__PURE__*/ React.createElement(
                        Tag,
                        { type: "success" },
                        shop?.name || "未知店铺",
                      ),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    files.length,
                    " \u4E2A\u6587\u4EF6",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    totalRows.toLocaleString(),
                    " \u884C",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      Tag,
                      { type: "success" },
                      "\u5DF2\u8BC6\u522B",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement("td", null, "-"),
                ),
                isExpanded &&
                  files.map((file) =>
                    /*#__PURE__*/ React.createElement(
                      "tr",
                      { key: file.id },
                      /*#__PURE__*/ React.createElement(
                        "td",
                        null,
                        /*#__PURE__*/ React.createElement("input", {
                          type: "checkbox",
                          checked: file.selected,
                          onChange: () => toggleSelected(file.id),
                        }),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { style: { paddingLeft: 32 } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            },
                          },
                          /*#__PURE__*/ React.createElement(
                            Icons.FileSpreadsheet,
                            null,
                          ),
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              style: {
                                fontWeight: 500,
                                fontSize: 13,
                              },
                            },
                            file.fileName,
                          ),
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "td",
                        null,
                        "-",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "td",
                        {
                          style: {
                            fontSize: 12,
                            color: "var(--color-text-tertiary)",
                          },
                        },
                        file.data
                          ? `${Object.values(file.data.sheets)[0]?.rows?.length || 0} 行`
                          : "-",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "td",
                        null,
                        /*#__PURE__*/ React.createElement(
                          Tag,
                          { type: "success" },
                          "\u5DF2\u8BC6\u522B",
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "td",
                        null,
                        /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            className: "btn-link danger",
                            onClick: () => removeFile(file.id),
                          },
                          /*#__PURE__*/ React.createElement(
                            Icons.Trash,
                            null,
                          ),
                        ),
                      ),
                    ),
                  ),
              );
            }),
          ),
        ),
      ),
    renderUnmatchedFiles(),
    renderResults(),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "float-action-bar" },
      results.length > 0 &&
        /*#__PURE__*/ React.createElement(
          Button,
          { onClick: downloadResults },
          /*#__PURE__*/ React.createElement(Icons.Download, null),
          "\u4E0B\u8F7D\u7ED3\u679C",
        ),
      /*#__PURE__*/ React.createElement(
        Button,
        {
          type: "primary",
          onClick: runBatchCalc,
          loading: isCalculating,
          disabled: batchFiles.filter((f) => f.selected).length === 0,
          style: { minWidth: 140 },
        },
        !isCalculating && /*#__PURE__*/ React.createElement(Icons.Play, null),
        isCalculating ? "计算中..." : "开始计算",
      ),
    ),
  );
};