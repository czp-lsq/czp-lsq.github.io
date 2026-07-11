// ExternalsPage - 全局数据表页面组件
const ExternalsPage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const [previewExternal, setPreviewExternal] = useState(null);
  const [editExternal, setEditExternal] = useState(null);
  const [editData, setEditData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const fileInputRef = useRef(null);
  const externals = state.externals || [];
  const platform = state.platforms.find((p) => p.id === currentPlatform);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const newExternals = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await ExcelUtils.parse(file, (p) => {
          setUploadProgress(Math.round(((i + p / 100) / files.length) * 100));
        });
        const sheetEntries = Object.entries(result.sheets).map(
          ([name, data]) => ({
            id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            fileName: result.fileName,
            sheetName: name,
            sheetKey: name.includes("::") ? name.split("::").pop() : name,
            rows: data.rows.length,
            cols: data.headers.length,
            headers: data.headers,
            data: data.rows,
            allData: data.rows,
            uploadTime: new Date().toISOString(),
            platformId: currentPlatform,
            fileSize: result.fileSize,
          }),
        );
        newExternals.push(...sheetEntries);
      }
      Store.set((s) => ({
        ...s,
        externals: [...(s.externals || []), ...newExternals],
      }));
      addToast(
        "success",
        "上传成功",
        `成功导入 ${newExternals.length} 个全局数据表`,
      );
      ActivityLogger.add(
        "上传全局数据",
        `${platform?.name} - ${newExternals.length}个表`,
      );
    } catch (err) {
      addToast("error", "上传失败", err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteExternal = (ext) => {
    setConfirmDialog({
      title: "确认删除",
      message: `确认删除数据表「${ext.sheetKey}」？此操作不可撤销。`,
      type: "danger",
      onConfirm: () => {
        Store.set((s) => ({
          ...s,
          externals: (s.externals || []).filter((e) => e.id !== ext.id),
        }));
        addToast("success", "删除成功", "全局数据表已删除");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleEdit = (ext) => {
    setEditExternal(ext);
    setEditData(
      (ext.allData || ext.data || []).map((row, idx) => ({
        ...row,
        __editIndex: idx,
      })),
    );
  };

  const handleCellChange = (rowIdx, colName, value) => {
    setEditData((prev) =>
      prev.map((row, idx) =>
        idx === rowIdx ? { ...row, [colName]: value } : row,
      ),
    );
  };

  const handleAddRow = () => {
    if (!editExternal?.headers) return;
    const newRow = { __editIndex: editData.length };
    editExternal.headers.forEach((h) => {
      newRow[h] = "";
    });
    setEditData((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (rowIdx) => {
    setEditData((prev) => prev.filter((_, idx) => idx !== rowIdx));
  };

  const saveEdit = () => {
    if (!editExternal) return;
    const saveData = editData.map((row) => {
      const cleaned = { ...row };
      delete cleaned.__editIndex;
      return cleaned;
    });
    Store.set((s) => ({
      ...s,
      externals: (s.externals || []).map((e) =>
        e.id === editExternal.id
          ? { ...e, data: saveData, allData: saveData, rows: saveData.length }
          : e,
      ),
    }));
    addToast("success", "保存成功", "全局数据表已更新");
    setEditExternal(null);
    setEditData([]);
  };

  const filteredExternals = externals;

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "externals-page" },
    /*#__PURE__*/ React.createElement("input", {
      ref: fileInputRef,
      type: "file",
      accept: ".xlsx,.xls,.csv,.zip",
      multiple: true,
      onChange: handleUpload,
      style: { display: "none" },
    }),
    isUploading &&
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
            "\u4E0A\u4F20\u89E3\u6790\u4E2D...",
          ),
          /*#__PURE__*/ React.createElement(
            "span",
            { style: { fontSize: 12, color: "var(--color-text-tertiary)" } },
            uploadProgress,
            "%",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "progress-bar" },
          /*#__PURE__*/ React.createElement("div", {
            className: "progress-fill",
            style: { width: `${uploadProgress}%` },
          }),
        ),
      ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "action-bar" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "action-left" },
        /*#__PURE__*/ React.createElement(
          "span",
          { style: { fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" } },
          "\u5168\u5C40\u6570\u636E\u8868",
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "action-right" },
        /*#__PURE__*/ React.createElement(
          Button,
          {
            type: "primary",
            onClick: () => fileInputRef.current?.click(),
            loading: isUploading,
            style: { minWidth: 120 },
          },
          !isUploading && /*#__PURE__*/ React.createElement(Icons.Upload, null),
          isUploading ? "\u4E0A\u4F20\u4E2D..." : "\u4E0A\u4F20\u6570\u636E",
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
            /*#__PURE__*/ React.createElement("th", null, "\u6587\u4EF6\u540D"),
            /*#__PURE__*/ React.createElement("th", null, "\u5DE5\u4F5C\u8868"),
            /*#__PURE__*/ React.createElement("th", null, "\u6570\u636E\u91CF"),
            /*#__PURE__*/ React.createElement("th", null, "\u5B57\u6BB5\u6570"),
            /*#__PURE__*/ React.createElement("th", null, "\u4E0A\u4F20\u65F6\u95F4"),
            /*#__PURE__*/ React.createElement("th", { style: { width: 140 } }, "\u64CD\u4F5C"),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "tbody",
          null,
          filteredExternals.length === 0
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
                      "\uD83D\uDDC4\uFE0F",
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "empty-text" },
                      "\u6682\u65E0\u5916\u90E8\u6570\u636E\u8868",
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "empty-desc" },
                      "\u4E0A\u4F20\u5546\u54C1\u6210\u672C\u8868\u3001\u8D39\u7387\u8868\u7B49\u5916\u90E8\u6570\u636E",
                    ),
                  ),
                ),
              )
            : filteredExternals.map((ext) =>
                /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: ext.id },
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
                      /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { style: { fontWeight: 500 } },
                        ext.fileName,
                      ),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(Tag, { type: "default" }, ext.sheetKey),
                  ),
                  /*#__PURE__*/ React.createElement("td", null, ext.rows.toLocaleString(), " \u884C"),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
                      ext.headers
                        .slice(0, 3)
                        .map((h) =>
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              key: h,
                              className: "tag tag-default",
                              style: { fontSize: 10 },
                            },
                            h,
                          ),
                        ),
                      ext.headers.length > 3 &&
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            className: "tag tag-default",
                            style: { fontSize: 10 },
                          },
                          "+",
                          ext.headers.length - 3,
                        ),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    { style: { fontSize: 12, color: "var(--color-text-tertiary)" } },
                    new Date(ext.uploadTime).toLocaleString("zh-CN"),
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
                          onClick: () => setPreviewExternal(ext),
                          title: "\u9884\u89C8\u6570\u636E",
                        },
                        /*#__PURE__*/ React.createElement(Icons.Eye, null),
                        " \u9884\u89C8",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          className: "action-btn action-edit",
                          onClick: () => handleEdit(ext),
                          title: "\u7F16\u8F91\u6570\u636E",
                        },
                        /*#__PURE__*/ React.createElement(Icons.Pencil, null),
                        " \u7F16\u8F91",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          className: "action-btn action-delete",
                          onClick: () => deleteExternal(ext),
                          title: "\u5220\u9664\u6570\u636E",
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
    previewExternal &&
      /*#__PURE__*/ React.createElement(
        Modal,
        {
          title: `预览: ${previewExternal.sheetKey}`,
          width: "1000px",
          onClose: () => setPreviewExternal(null),
          footer: /*#__PURE__*/ React.createElement(
            Button,
            { onClick: () => setPreviewExternal(null) },
            "\u5173\u95ED",
          ),
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { maxHeight: 400, overflow: "auto" } },
          /*#__PURE__*/ React.createElement(
            "table",
            { className: "table table-sm" },
            /*#__PURE__*/ React.createElement(
              "thead",
              null,
              /*#__PURE__*/ React.createElement(
                "tr",
                null,
                previewExternal.headers.map((h) =>
                  /*#__PURE__*/ React.createElement("th", { key: h }, h),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "tbody",
              null,
              previewExternal.data.map((row, i) =>
                /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: i },
                  previewExternal.headers.map((h) =>
                    /*#__PURE__*/ React.createElement(
                      "td",
                      { key: h, style: { fontSize: 12 } },
                      row[h],
                    ),
                  ),
                ),
              ),
            ),
          ),
          previewExternal.rows > 100 &&
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  textAlign: "center",
                  padding: 12,
                  color: "var(--color-text-tertiary)",
                  fontSize: 12,
                },
              },
              "\u4EC5\u663E\u793A\u524D100\u884C\uFF0C\u5171 ",
              previewExternal.rows,
              " \u884C",
            ),
        ),
      ),
    editExternal &&
      /*#__PURE__*/ React.createElement(
        Modal,
        {
          title: `编辑: ${editExternal.sheetKey}`,
          large: true,
          onClose: () => {
            setEditExternal(null);
            setEditData([]);
          },
          footer: /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              Button,
              {
                onClick: () => {
                  setEditExternal(null);
                  setEditData([]);
                },
              },
              "\u53D6\u6D88",
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              { type: "primary", onClick: handleAddRow },
              /*#__PURE__*/ React.createElement(Icons.Plus, null),
              " \u6DFB\u52A0\u884C",
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              { type: "primary", onClick: saveEdit },
              /*#__PURE__*/ React.createElement(Icons.Save, null),
              "\u4FDD\u5B58\u4FEE\u6539",
            ),
          ),
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { maxHeight: 500, overflow: "auto" } },
          /*#__PURE__*/ React.createElement(
            "table",
            { className: "table table-sm" },
            /*#__PURE__*/ React.createElement(
              "thead",
              null,
              /*#__PURE__*/ React.createElement(
                "tr",
                null,
                /*#__PURE__*/ React.createElement("th", { style: { width: 60 } }, "#"),
                editExternal.headers.map((h) =>
                  /*#__PURE__*/ React.createElement("th", { key: h }, h),
                ),
                /*#__PURE__*/ React.createElement("th", { style: { width: 60 } }, "\u64CD\u4F5C"),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "tbody",
              null,
              editData.map((row, i) =>
                /*#__PURE__*/ React.createElement(
                  "tr",
                  { key: i },
                  /*#__PURE__*/ React.createElement(
                    "td",
                    {
                      style: {
                        fontWeight: 600,
                        color: "var(--color-text-tertiary)",
                        fontSize: 12,
                      },
                    },
                    i + 1,
                  ),
                  editExternal.headers.map((h) =>
                    /*#__PURE__*/ React.createElement(
                      "td",
                      { key: h },
                      /*#__PURE__*/ React.createElement("input", {
                        type: "text",
                        className: "input",
                        value: row[h] ?? "",
                        onChange: (e) => handleCellChange(i, h, e.target.value),
                        style: {
                          width: "100%",
                          padding: "4px 8px",
                          fontSize: 12,
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                        },
                      }),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "td",
                    null,
                    /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "btn-link danger",
                        onClick: () => handleDeleteRow(i),
                        style: { fontSize: 12 },
                      },
                      /*#__PURE__*/ React.createElement(Icons.Trash, null),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              marginTop: 12,
              fontSize: 12,
              color: "var(--color-text-tertiary)",
            },
          },
          "\u63D0\u793A\uFF1A\u76F4\u63A5\u5728\u5355\u5143\u683C\u4E2D\u8F93\u5165\u6570\u636E\u8FDB\u884C\u4FEE\u6539\uFF0C\u4FEE\u6539\u540E\u70B9\u51FB\u300C\u4FDD\u5B58\u4FEE\u6539\u300D\u6309\u94AE\u786E\u8BA4\u3002",
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
}; // ========== Batch Calculation Page ==========
