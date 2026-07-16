const SamplePreview = ({ previewSample, previewSheet, previewColumns, setPreviewSheet, setPreviewColumns, setPreviewSample, setColumnDropdownOpen, columnDropdownOpen, columnDropdownRef }) => {
  const { Modal, Icons } = window;

  if (!previewSample) return null;

  return /*#__PURE__*/ React.createElement(
    Modal,
    {
      title: /*#__PURE__*/ React.createElement(
        React.Fragment,
        null,
        /*#__PURE__*/ React.createElement(Icons.Eye, null),
        " \u6837\u8868\u9884\u89C8 - ",
        previewSample.alias || previewSample.fileName,
      ),
      width: "1200px",
      onClose: () => { setPreviewSample(null); setColumnDropdownOpen(false); },
      footer: /*#__PURE__*/ React.createElement(
        Button,
        { onClick: () => { setPreviewSample(null); setColumnDropdownOpen(false); } },
        "\u5173\u95ED",
      ),
    },
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        },
      },
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 8 } },
        /*#__PURE__*/ React.createElement(
          "label",
          {
            style: {
              fontSize: 13,
              color: "var(--color-text-secondary)",
              fontWeight: 500,
            },
          },
          "\u5DE5\u4F5C\u8868\uFF1A",
        ),
        /*#__PURE__*/ React.createElement(
          "select",
          {
            className: "select",
            value: previewSheet,
            onChange: (e) => {
              setPreviewSheet(e.target.value);
              setPreviewColumns(
                previewSample.sheets[e.target.value]?.headers || [],
              );
            },
            style: { width: 200 },
          },
          Object.keys(previewSample.sheets).map((name) =>
            /*#__PURE__*/ React.createElement(
              "option",
              { key: name, value: name },
              name,
            ),
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 300,
          },
        },
        /*#__PURE__*/ React.createElement(
          "label",
          {
            style: {
              fontSize: 13,
              color: "var(--color-text-secondary)",
              fontWeight: 500,
              whiteSpace: "nowrap",
            },
          },
          "\u663E\u793A\u5217\uFF1A",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            ref: columnDropdownRef,
            style: {
              position: "relative",
              flex: 1,
              minWidth: 200,
            },
          },
          /*#__PURE__*/ React.createElement(
            "button",
            {
              type: "button",
              onClick: (e) => { e.stopPropagation(); setColumnDropdownOpen(!columnDropdownOpen); },
              style: {
                width: "100%",
                padding: "6px 12px",
                fontSize: 13,
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              },
            },
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              },
              previewColumns.length === 0
                ? "\u8BF7\u9009\u62E9\u5217"
                : previewColumns.length ===
                    (previewSample.sheets[previewSheet]?.headers?.length || 0)
                  ? "\u5168\u90E8\u5217"
                  : `\u5DF2\u9009 ${previewColumns.length} \u5217`,
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontSize: 10,
                  transition: "transform 0.2s",
                  transform: columnDropdownOpen ? "rotate(180deg)" : "none",
                },
              },
              "\u25BC",
            ),
          ),
          columnDropdownOpen &&
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  maxHeight: 240,
                  overflowY: "auto",
                  zIndex: 10,
                },
              },
              /*#__PURE__*/ React.createElement(
                "label",
                {
                  style: {
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--color-border-light)",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                  },
                },
                /*#__PURE__*/ React.createElement("input", {
                  type: "checkbox",
                  checked:
                    previewColumns.length ===
                    (previewSample.sheets[previewSheet]?.headers?.length || 0),
                  onChange: (e) => {
                    if (e.target.checked) {
                      setPreviewColumns(
                        previewSample.sheets[previewSheet]?.headers || [],
                      );
                    } else {
                      setPreviewColumns([]);
                    }
                  },
                }),
                "\u5168\u9009",
              ),
              (previewSample.sheets[previewSheet]?.headers || []).map(
                (h) =>
                  /*#__PURE__*/ React.createElement(
                    "label",
                    {
                      key: h,
                      style: {
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "6px 12px",
                        color: previewColumns.includes(h)
                          ? "var(--color-primary)"
                          : "var(--color-text-secondary)",
                        background: previewColumns.includes(h)
                          ? "var(--color-primary-50)"
                          : "transparent",
                        transition: "background 0.15s",
                      },
                    },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked: previewColumns.includes(h),
                      onChange: (e) => {
                        if (e.target.checked) {
                          setPreviewColumns([...previewColumns, h]);
                        } else {
                          setPreviewColumns(
                            previewColumns.filter((col) => col !== h),
                          );
                        }
                      },
                    }),
                    h,
                  ),
              ),
            ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            fontSize: 12,
            color: "var(--color-text-tertiary)",
            whiteSpace: "nowrap",
          },
        },
        "\u5171 ",
        previewSample.sheets[previewSheet]?.rows?.length || 0,
        " \u884C\u6570\u636E",
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: "data-table-container",
        style: { maxHeight: 450, overflow: "auto" },
      },
      /*#__PURE__*/ React.createElement(
        "table",
        { className: "table" },
        /*#__PURE__*/ React.createElement(
          "thead",
          { style: { position: "sticky", top: 0, zIndex: 1 } },
          /*#__PURE__*/ React.createElement(
            "tr",
            null,
            /*#__PURE__*/ React.createElement(
              "th",
              {
                style: {
                  width: 50,
                  position: "sticky",
                  left: 0,
                  background: "var(--color-bg-secondary)",
                },
              },
              "#",
            ),
            previewColumns.map((h) =>
              /*#__PURE__*/ React.createElement(
                "th",
                {
                  key: h,
                  title: h,
                  style: { minWidth: 100, maxWidth: 200 },
                },
                h,
              ),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "tbody",
          null,
          (previewSample.sheets[previewSheet]?.rows || []).slice(0, 100).map(
            (row, idx) =>
              /*#__PURE__*/ React.createElement(
                "tr",
                { key: idx },
                /*#__PURE__*/ React.createElement(
                  "td",
                  {
                    style: {
                      position: "sticky",
                      left: 0,
                      background:
                        idx % 2 === 0
                          ? "var(--color-bg-secondary)"
                          : "var(--color-bg-tertiary)",
                      zIndex: 0,
                    },
                  },
                  idx + 1,
                ),
                previewColumns.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "td",
                    { key: h, title: row[h] },
                    /*#__PURE__*/ React.createElement(
                      "span",
                      {
                        style: {
                          display: "inline-block",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      },
                      row[h] !== null && row[h] !== undefined
                        ? String(row[h])
                        : "",
                    ),
                  ),
                ),
              ),
          ),
        ),
      ),
    ),
    (previewSample.sheets[previewSheet]?.rows?.length || 0) > 100 &&
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            marginTop: 10,
            fontSize: 12,
            color: "var(--color-text-tertiary)",
            textAlign: "center",
            padding: "8px 0",
            background: "var(--color-bg-tertiary)",
            borderRadius: 8,
          },
        },
        "\u4EC5\u663E\u793A\u524D 100 \u884C\uFF08\u5171 ",
        previewSample.sheets[previewSheet]?.rows?.length || 0,
        "\u884C\uFF09",
      ),
  );
};

