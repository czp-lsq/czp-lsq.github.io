const BatchHistoryView = ({ calcHistory, template, platform, addToast }) => {
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const downloadHistoryEntry = (entry) => {
    if (!template) return;
    const fields = template.parseResult?.fields || [];
    const aoa = [fields.map((f) => f.name)];
    entry.results
      .filter((r) => r.status === "success")
      .forEach((r) => {
        const row = fields.map((f) => {
          const v = r.values[f.id];
          if (v === null || v === undefined) return "";
          if (typeof v === "object" && v.val !== undefined) return v.val;
          return v;
        });
        aoa.push(row);
      });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "利润表");
    const buf = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });
    const formatTimeForFilename = (isoString) => {
      const d = new Date(isoString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}`;
    };
    ExcelUtils.download(
      buf,
      `利润表_${platform?.name}_${formatTimeForFilename(entry.time)}.xlsx`,
    );
    addToast(
      "success",
      "下载成功",
      "利润表已生成",
    );
  };

  const deleteHistoryEntry = (entryId) => {
    Store.set((s) => ({
      ...s,
      calcHistory: (s.calcHistory || []).filter(
        (h) => h.id !== entryId,
      ),
    }));
    addToast(
      "success",
      "删除成功",
      "计算记录已删除",
    );
  };

  const exportAllHistory = () => {
    if (!template || (calcHistory || []).length === 0) return;
    const fields = template.parseResult?.fields || [];
    const wb = XLSX.utils.book_new();
    (calcHistory || []).forEach((entry, idx) => {
      const aoa = [fields.map((f) => f.name)];
      entry.results
        .filter((r) => r.status === "success")
        .forEach((r) => {
          const row = fields.map((f) => {
            const v = r.values[f.id];
            if (v === null || v === undefined) return "";
            if (typeof v === "object" && v.val !== undefined) return v.val;
            return v;
          });
          aoa.push(row);
        });
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        `记录${idx + 1}_${formatTime(entry.time).slice(5, 16)}`,
      );
    });
    const buf = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });
    ExcelUtils.download(
      buf,
      `利润表_全部记录_${new Date().toLocaleDateString("zh-CN")}.xlsx`,
    );
    addToast("success", "导出成功", "所有计算记录已导出");
  };

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "card-body" },
    /*#__PURE__*/ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginBottom: 16,
        },
      },
      (calcHistory || []).length > 0 &&
        /*#__PURE__*/ React.createElement(
          Button,
          {
            onClick: exportAllHistory,
          },
          /*#__PURE__*/ React.createElement(Icons.Download, null),
          "\u5BFC\u51FA\u5168\u90E8\u8BB0\u5F55",
        ),
    ),
    (calcHistory || []).length === 0
      ? /*#__PURE__*/ React.createElement(
          "div",
          { className: "empty", style: { padding: "40px 20px" } },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "empty-icon" },
            "\uD83D\uDCCB",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "empty-text" },
            "\u6682\u65E0\u8BA1\u7B97\u8BB0\u5F55",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "empty-desc" },
            "\u5B8C\u6210\u6279\u91CF\u8BA1\u7B97\u540E\u4F1A\u5728\u8FD9\u91CC\u663E\u793A\u8BB0\u5F55",
          ),
        )
      : /*#__PURE__*/ React.createElement(
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
                  "\u65F6\u95F4",
                ),
                /*#__PURE__*/ React.createElement(
                  "th",
                  null,
                  "\u5E73\u53F0",
                ),
                /*#__PURE__*/ React.createElement(
                  "th",
                  null,
                  "\u6587\u4EF6\u6570",
                ),
                /*#__PURE__*/ React.createElement(
                  "th",
                  null,
                  "\u6210\u529F",
                ),
                /*#__PURE__*/ React.createElement(
                  "th",
                  null,
                  "\u5931\u8D25",
                ),
                /*#__PURE__*/ React.createElement(
                  "th",
                  { style: { width: 120 } },
                  "\u64CD\u4F5C",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "tbody",
              null,
              (calcHistory || []).map((entry) => {
                const successCount = entry.results.filter(
                  (r) => r.status === "success",
                ).length;
                const failCount = entry.results.filter(
                  (r) => r.status === "error",
                ).length;
                return /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: entry.id },
                  /*#__PURE__*/ React.createElement(
                    "td",
                    {
                      style: {
                        fontSize: 13,
                        fontFamily: "var(--font-mono)",
                      },
                    },
                    formatTime(entry.time),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    entry.platform || "-",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    entry.results.length,
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    {
                      style: { color: "var(--color-success)", fontWeight: 600 },
                    },
                    successCount,
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    {
                      style: {
                        color:
                          failCount > 0
                            ? "var(--color-danger)"
                            : "var(--color-text-tertiary)",
                        fontWeight: 600,
                      },
                    },
                    failCount,
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { display: "flex", gap: 8 } },
                      /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          className: "btn-link",
                          onClick: () => downloadHistoryEntry(entry),
                        },
                        /*#__PURE__*/ React.createElement(
                          Icons.Download,
                          null,
                        ),
                        " \u4E0B\u8F7D",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          className: "btn-link danger",
                          onClick: () => deleteHistoryEntry(entry.id),
                        },
                        /*#__PURE__*/ React.createElement(
                          Icons.Trash,
                          null,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
  );
};