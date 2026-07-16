const TemplatePreview = ({ templateData, parseResult, debugMode, previewExpanded, setPreviewExpanded, setSelectedField }) => {
  if (!templateData?.aoa) return null;
  const aoa = templateData.aoa;
  const maxRows = Math.min(aoa.length, 50);
  const maxCols = Math.max(
    ...aoa.slice(0, maxRows).map((r) => r?.length || 0),
    0,
  );
  const isDebugCell = (row, col) => {
    if (!debugMode || !parseResult) return false;
    return parseResult.debugInfo.some((d) => d.row === row && d.col === col);
  };
  const getDebugInfo = (row, col) => {
    if (!parseResult) return null;
    return parseResult.debugInfo.find((d) => d.row === row && d.col === col);
  };
  return /*#__PURE__*/ React.createElement(
    "div",
    {
      className: `preview-section ${previewExpanded ? "" : "toggle-collapsed"}`,
    },
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: "preview-section-header",
        onClick: () => setPreviewExpanded(!previewExpanded),
      },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preview-section-title" },
        /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
        "\u5229\u6DA6\u8868\u9884\u89C8",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preview-section-toggle" },
        /*#__PURE__*/ React.createElement(
          "span",
          null,
          previewExpanded ? "收起" : "展开",
        ),
        previewExpanded
          ? /*#__PURE__*/ React.createElement(Icons.ChevronUp, null)
          : /*#__PURE__*/ React.createElement(Icons.ChevronDown, null),
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "preview-section-body" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preview-table-wrap" },
        /*#__PURE__*/ React.createElement(
          "table",
          { className: "preview-table" },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              /*#__PURE__*/ React.createElement("th", {
                style: {
                  width: 40,
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  background: "var(--color-bg-tertiary)",
                },
              }),
              Array.from({ length: maxCols }, (_, i) =>
                /*#__PURE__*/ React.createElement(
                  "th",
                  { key: i },
                  TemplateParser.colLetters(i),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            Array.from({ length: maxRows }, (_, rowIdx) =>
              /*#__PURE__*/ React.createElement(
                "tr",
                { key: rowIdx },
                /*#__PURE__*/ React.createElement(
                  "td",
                  {
                    className: "preview-row-num",
                  },
                  rowIdx + 1,
                ),
                Array.from({ length: maxCols }, (_, colIdx) => {
                  const cellVal = aoa[rowIdx]?.[colIdx];
                  const isDebug = isDebugCell(rowIdx, colIdx);
                  const debug = getDebugInfo(rowIdx, colIdx);
                  const field = parseResult?.fields.find(
                    (f) => f.row === rowIdx && f.col === colIdx,
                  );
                  return /*#__PURE__*/ React.createElement(
                    "td",
                    {
                      key: colIdx,
                      className: isDebug ? "debug-marker" : "",
                      onClick: () => field && setSelectedField(field),
                      style: { cursor: field ? "pointer" : "default" },
                    },
                    isDebug &&
                      debug &&
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "debug-marker-label" },
                        debug.type === "text" ? "文本" : "数值",
                        debug.match === "shop_name" &&
                          /*#__PURE__*/ React.createElement(
                            Tag,
                            { type: "info", style: { marginLeft: 4, fontSize: 10 } },
                            "\u5E97\u94FA",
                          ),
                      ),
                    cellVal != null ? String(cellVal) : "",
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
};