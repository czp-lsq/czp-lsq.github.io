// CalcHistoryPage - 计算记录页面组件
const CalcHistoryPage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState(null);
  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const calcHistory = state.calcHistory || [];
  const template = state.templates[currentPlatform];
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const downloadHistoryEntry = (entry) => {
    if (!template) {
      addToast("warning", "下载失败", "缺少利润表模板");
      return;
    }
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
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    ExcelUtils.download(
      buf,
      `利润表_${platform?.name}_${formatTime(entry.time).replace(/:/g, "-")}.xlsx`,
    );
    addToast("success", "下载成功", "利润表已生成");
  };
  const exportAllHistory = () => {
    if (!template || calcHistory.length === 0) {
      addToast("warning", "导出失败", "缺少模板或暂无记录");
      return;
    }
    const fields = template.parseResult?.fields || [];
    const wb = XLSX.utils.book_new();
    calcHistory.forEach((entry, idx) => {
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
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    ExcelUtils.download(
      buf,
      `利润表_全部记录_${new Date().toLocaleDateString("zh-CN")}.xlsx`,
    );
    addToast("success", "导出成功", "所有计算记录已导出");
  };
  const deleteHistoryEntry = (entryId) => {
    setConfirmDialog({
      title: "确认删除记录",
      message: "确认删除此计算记录？此操作不可撤销。",
      type: "danger",
      onConfirm: () => {
        Store.set((s) => ({
          ...s,
          calcHistory: (s.calcHistory || []).filter((h) => h.id !== entryId),
        }));
        addToast("success", "删除成功", "计算记录已删除");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "history-page fade-in" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "card" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "card-header" },
      /*#__PURE__*/ React.createElement(
        "div",
        null,
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-title" },
          /*#__PURE__*/ React.createElement(Icons.History, null),
          "\u8BA1\u7B97\u8BB0\u5F55",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-desc" },
          "\u67E5\u770B\u5386\u53F2\u8BA1\u7B97\u4EFB\u52A1\u548C\u7ED3\u679C",
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { display: "flex", gap: 10 } },
        calcHistory.length > 0 &&
          /*#__PURE__*/ React.createElement(
            Button,
            { onClick: exportAllHistory },
            /*#__PURE__*/ React.createElement(Icons.Download, null),
            "\u5BFC\u51FA\u5168\u90E8\u8BB0\u5F55",
          ),
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
            /*#__PURE__*/ React.createElement("th", null, "\u65F6\u95F4"),
            /*#__PURE__*/ React.createElement("th", null, "\u5E73\u53F0"),
            /*#__PURE__*/ React.createElement("th", null, "\u5E97\u94FA\u6570"),
            /*#__PURE__*/ React.createElement("th", null, "\u6210\u529F\u6570"),
            /*#__PURE__*/ React.createElement("th", null, "\u72B6\u6001"),
            /*#__PURE__*/ React.createElement(
              "th",
              { style: { width: 180 } },
              "\u64CD\u4F5C",
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "tbody",
          null,
          calcHistory.length === 0
            ? /*#__PURE__*/ React.createElement(
                "tr",
                null,
                /*#__PURE__*/ React.createElement(
                  "td",
                  { colSpan: 6 },
                  /*#__PURE__*/ React.createElement(
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
                  ),
                ),
              )
            : calcHistory.map((item) =>
                /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: item.id },
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    formatTime(item.time),
                  ),
                  /*#__PURE__*/ React.createElement("td", null, item.platform),
                  /*#__PURE__*/ React.createElement("td", null, item.shopCount),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    item.successCount,
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      Tag,
                      {
                        type:
                          item.status === "success"
                            ? "success"
                            : item.status === "processing"
                              ? "warning"
                              : "danger",
                      },
                      item.status === "success"
                        ? "成功"
                        : item.status === "processing"
                          ? "处理中"
                          : "部分成功",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "action-btn-group" },
                      /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          className: "action-btn action-view",
                          onClick: () => downloadHistoryEntry(item),
                          title: "\u4E0B\u8F7D\u5229\u6DA6\u8868",
                        },
                        /*#__PURE__*/ React.createElement(Icons.Download, null),
                        " \u4E0B\u8F7D",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          className: "action-btn action-delete",
                          onClick: () => deleteHistoryEntry(item.id),
                          title: "\u5220\u9664\u8BB0\u5F55",
                        },
                        /*#__PURE__*/ React.createElement(Icons.Trash, null),
                        " \u5220\u9664",
                      ),
                    ),
                  ),
                ),
              ),
        ),
      ),
    ),
    confirmDialog &&
      /*#__PURE__*/ React.createElement(ConfirmModal, {
        title: confirmDialog.title,
        message: confirmDialog.message,
        type: confirmDialog.type,
        onConfirm: confirmDialog.onConfirm,
        onCancel: confirmDialog.onCancel,
      }),
  );
};