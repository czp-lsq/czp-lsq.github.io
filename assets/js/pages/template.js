// TemplatePage - 模板中心页面组件
const TemplatePage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const [templateFile, setTemplateFile] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [selectedField, setSelectedField] = useState(() => {
    try {
      const saved = localStorage.getItem(`template_page_selected_field_${currentPlatform}`);
      return saved || null;
    } catch (e) { return null; }
  });
  useEffect(() => {
    if (selectedField) {
      localStorage.setItem(`template_page_selected_field_${currentPlatform}`, selectedField);
    } else {
      localStorage.removeItem(`template_page_selected_field_${currentPlatform}`);
    }
  }, [selectedField, currentPlatform]);
  const [debugMode, setDebugMode] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  // 文件夹上传相关状态
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchParsing, setIsBatchParsing] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const savedTemplate = state.templates[currentPlatform];
  useEffect(() => {
    if (savedTemplate) {
      setTemplateData(savedTemplate);
      setParseResult(savedTemplate.parseResult);
    } else {
      setTemplateData(null);
      setParseResult(null);
    }
    setSelectedField(null);
  }, [currentPlatform, savedTemplate]);

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setTemplateFile(file);
    try {
      const result = await ExcelUtils.parse(file);
      const firstSheetName = Object.keys(result.sheets)[0];
      const sheet = result.sheets[firstSheetName];
      const fieldsResult = TemplateParser.findFields(
        sheet.aoa,
        sheet.worksheet,
      );
      setTemplateData({
        fileName: file.name,
        sheetName: firstSheetName,
        aoa: sheet.aoa,
        headers: sheet.headers,
        rows: sheet.rows,
      });
      setParseResult(fieldsResult);
      addToast(
        "success",
        "模板解析成功",
        `识别到 ${fieldsResult.fields.length} 个字段`,
      );
      ActivityLogger.add("上传模板", `${platform?.name} - ${file.name}`);
    } catch (err) {
      console.error(err);
      addToast("error", "解析失败", err.message || "文件解析出错");
    } finally {
      setIsParsing(false);
    }
  };

  // 处理文件夹上传
  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 过滤出Excel文件
    const excelFiles = files.filter(file => 
      /\.(xlsx|xls|csv)$/i.test(file.name)
    );

    if (excelFiles.length === 0) {
      addToast("warning", "未找到Excel文件", "所选文件夹中没有Excel文件");
      return;
    }

    setIsBatchParsing(true);
    setBatchProgress(0);
    setBatchFiles(excelFiles.map(file => ({
      file,
      name: file.name,
      path: file.webkitRelativePath || file.name,
      status: 'pending',
      data: null,
      parseResult: null,
      selected: true,
    })));

    const parsedFiles = [];

    for (let i = 0; i < excelFiles.length; i++) {
      const file = excelFiles[i];
      try {
        const result = await ExcelUtils.parse(file);
        const firstSheetName = Object.keys(result.sheets)[0];
        const sheet = result.sheets[firstSheetName];
        const fieldsResult = TemplateParser.findFields(sheet.aoa, sheet.worksheet);

        parsedFiles.push({
          file,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          status: 'success',
          data: {
            fileName: file.name,
            sheetName: firstSheetName,
            aoa: sheet.aoa,
            headers: sheet.headers,
            rows: sheet.rows,
          },
          parseResult: fieldsResult,
          selected: true,
        });
      } catch (err) {
        parsedFiles.push({
          file,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          status: 'error',
          error: err.message,
          data: null,
          parseResult: null,
          selected: false,
        });
      }

      setBatchProgress(Math.round(((i + 1) / excelFiles.length) * 100));
      setBatchFiles(prev => prev.map((f, idx) => 
        idx < parsedFiles.length ? parsedFiles[idx] : f
      ));
    }

    setIsBatchParsing(false);
    const successCount = parsedFiles.filter(f => f.status === 'success').length;
    
    if (successCount > 0) {
      setShowBatchModal(true);
      addToast("success", "解析完成", `成功解析 ${successCount}/${excelFiles.length} 个文件`);
    } else {
      addToast("error", "解析失败", "所有文件解析失败");
    }
  };

  // 选择单个文件作为主模板
  const selectFileAsMain = (fileItem) => {
    if (fileItem.status !== 'success') return;
    setTemplateData(fileItem.data);
    setParseResult(fileItem.parseResult);
    setShowBatchModal(false);
    addToast("success", "已选择模板", `已选择「${fileItem.name}」作为主模板`);
  };

  // 切换文件选择状态
  const toggleFileSelection = (index) => {
    setBatchFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, selected: !f.selected } : f
    ));
  };

  // 合并选中的文件数据
  const mergeSelectedFiles = () => {
    const selectedFiles = batchFiles.filter(f => f.selected && f.status === 'success');
    if (selectedFiles.length === 0) {
      addToast("warning", "请选择文件", "请至少选择一个有效文件");
      return;
    }

    // 使用第一个选中文件作为主模板
    const mainFile = selectedFiles[0];
    setTemplateData(mainFile.data);
    setParseResult(mainFile.parseResult);

    // 将所有选中文件保存为样表
    const newSamples = selectedFiles.map(f => ({
      ...f.data,
      alias: f.name.replace(/\.(xlsx|xls|csv)$/i, ''),
      sheets: { [f.data.sheetName]: { aoa: f.data.aoa, headers: f.data.headers, rows: f.data.rows } }
    }));

    Store.set((s) => ({
      ...s,
      samples: {
        ...s.samples,
        [currentPlatform]: [...(s.samples[currentPlatform] || []), ...newSamples]
      }
    }));

    setShowBatchModal(false);
    addToast("success", "合并完成", `已选择「${mainFile.name}」作为模板，${selectedFiles.length} 个文件已保存为样表`);
  };
  const handleSaveTemplate = () => {
    if (!templateData || !parseResult) {
      addToast("warning", "请先上传模板", "上传模板后才能保存");
      return;
    }
    Store.set((s) => ({
      ...s,
      templates: {
        ...s.templates,
        [currentPlatform]: {
          ...templateData,
          parseResult,
          savedAt: new Date().toISOString(),
        },
      },
    }));
    Store.flush();
    addToast("success", "保存成功", `${platform?.name}模板已保存`);
    ActivityLogger.add("保存模板", `${platform?.name}模板`);
  };
  const handleFieldNameChange = (fieldId, newName) => {
    if (!parseResult) return;
    const newFields = parseResult.fields.map((f) =>
      f.id === fieldId ? { ...f, name: newName } : f,
    );
    setParseResult({ ...parseResult, fields: newFields });
  };
  const renderPreviewTable = () => {
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
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "template-view template-page fade-in" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "template-body" },
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
              /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
              platform?.emoji,
              " ",
              platform?.name,
              "\u5229\u6DA6\u8868\u6A21\u677F",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card-desc" },
              "\u4E0A\u4F20\u5229\u6DA6\u8868\u6A21\u677F\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u8BC6\u522BX\u6807\u8BB0\uFF08\u6587\u672C\u586B\u5145\uFF09\u548C0/-\u6807\u8BB0\uFF08\u6570\u503C\u586B\u5145\uFF09",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "template-header-actions" },
            /*#__PURE__*/ React.createElement(
              "label",
              {
                className: "btn btn-default btn-sm",
                style: { cursor: "pointer" },
              },
              /*#__PURE__*/ React.createElement("input", {
                type: "checkbox",
                checked: debugMode,
                onChange: (e) => setDebugMode(e.target.checked),
                style: { marginRight: 6 },
              }),
              /*#__PURE__*/ React.createElement(Icons.Bug, null),
              " \u8C03\u8BD5\u6A21\u5F0F",
            ),
            templateData && /*#__PURE__*/ React.createElement(
              Button,
              {
                className: "template-reset-btn",
                size: "sm",
                onClick: () => setTemplateData(null),
              },
              /*#__PURE__*/ React.createElement(Icons.Refresh, null),
              "\u91CD\u7F6E",
            ),
            templateData && /*#__PURE__*/ React.createElement(
              Button,
              {
                type: "primary",
                className: "template-save-btn",
                size: "sm",
                onClick: handleSaveTemplate,
                disabled: !templateData,
              },
              /*#__PURE__*/ React.createElement(Icons.Save, null),
              "\u4FDD\u5B58\u6A21\u677F\u914D\u7F6E",
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                type: "primary",
                onClick: () => fileInputRef.current?.click(),
                loading: isParsing,
              },
              /*#__PURE__*/ React.createElement(Icons.Upload, null),
              savedTemplate ? "重新上传模板" : "上传模板",
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                onClick: () => folderInputRef.current?.click(),
                loading: isBatchParsing,
              },
              /*#__PURE__*/ React.createElement(Icons.Folder, null),
              " 上传文件夹",
            ),
            /*#__PURE__*/ React.createElement("input", {
              ref: fileInputRef,
              type: "file",
              accept: ".xlsx,.xls,.csv,.zip",
              onChange: handleTemplateUpload,
              style: { display: "none" },
            }),
            /*#__PURE__*/ React.createElement("input", {
              ref: folderInputRef,
              type: "file",
              webkitdirectory: "true",
              directory: "",
              multiple: true,
              onChange: handleFolderUpload,
              style: { display: "none" },
            }),
          ),
        ),
        !templateData &&
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "upload-area",
              onClick: () => fileInputRef.current?.click(),
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "upload-icon" },
              "\uD83D\uDCCA",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "upload-text" },
              "\u70B9\u51FB\u6216\u62D6\u62FD\u4E0A\u4F20\u5229\u6DA6\u8868\u6A21\u677F",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "upload-hint" },
              "\u652F\u6301 .xlsx / .xls / .csv / .zip \u683C\u5F0F\uFF0C\u7CFB\u7EDF\u5C06\u81EA\u52A8\u8BC6\u522B\u586B\u5145\u5B57\u6BB5",
            ),
          ),
        templateData &&
          /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  padding: "12px 16px",
                  background: "var(--color-bg-tertiary)",
                  borderRadius: "var(--radius-lg)",
                },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 12 } },
                /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
                /*#__PURE__*/ React.createElement(
                  "div",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { style: { fontWeight: 600 } },
                    templateData.fileName,
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { style: { fontSize: 12, color: "var(--color-text-tertiary)" } },
                    "\u5DE5\u4F5C\u8868: ",
                    templateData.sheetName,
                    " \xB7 ",
                    templateData.aoa?.length || 0,
                    " \u884C",
                  ),
                ),
              ),
              parseResult &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { style: { display: "flex", gap: 12 } },
                  /*#__PURE__*/ React.createElement(
                    Tag,
                    { type: "primary" },
                    "\u6587\u672C\u5B57\u6BB5: ",
                    parseResult.fields.filter((f) => f.type === "text").length,
                  ),
                  /*#__PURE__*/ React.createElement(
                    Tag,
                    { type: "success" },
                    "\u6570\u503C\u5B57\u6BB5: ",
                    parseResult.fields.filter((f) => f.type === "number")
                      .length,
                  ),
                  /*#__PURE__*/ React.createElement(
                    Tag,
                    { type: "info" },
                    "\u5408\u5E76\u5355\u5143\u683C: ",
                    parseResult.mergedCells.length,
                  ),
                ),
            ),
            renderPreviewTable(),
            debugMode &&
              parseResult &&
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "debug-panel" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "debug-panel-title" },
                  /*#__PURE__*/ React.createElement(Icons.Bug, null),
                  "\u8BC6\u522B\u8C03\u8BD5\u4FE1\u606F",
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "debug-stats" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "debug-stat-item" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "debug-stat-value" },
                      parseResult.fields.length,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "debug-stat-label" },
                      "\u603B\u5B57\u6BB5\u6570",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "debug-stat-item" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      {
                        className: "debug-stat-value",
                        style: { color: "var(--color-primary)" },
                      },
                      parseResult.fields.filter((f) => f.type === "text")
                        .length,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "debug-stat-label" },
                      "\u6587\u672C\u5B57\u6BB5",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "debug-stat-item" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      {
                        className: "debug-stat-value",
                        style: { color: "var(--color-success)" },
                      },
                      parseResult.fields.filter((f) => f.type === "number")
                        .length,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "debug-stat-label" },
                      "\u6570\u503C\u5B57\u6BB5",
                    ),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "section-title" },
                  "\u8BC6\u522B\u8BE6\u60C5",
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "debug-details" },
                  parseResult.debugInfo.map((d, i) =>
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { key: i, className: "debug-detail-item" },
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: "debug-cell" },
                        d.cell,
                      ),
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: `debug-type ${d.type}` },
                        d.type === "text" ? "文本" : "数值",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: "debug-match" },
                        d.fieldName,
                        " (",
                        d.match,
                        ")",
                      ),
                    ),
                  ),
                ),
              ),
          ),
      ),
      parseResult &&
        parseResult.fields.length > 0 &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "workspace" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "workspace-left" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "card-header" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "card-title", style: { fontSize: 14 } },
                  /*#__PURE__*/ React.createElement(Icons.Layers, null),
                  "\u8BC6\u522B\u5230\u7684\u5B57\u6BB5",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "ul",
                { className: "field-list" },
                parseResult.fields.map((field) =>
                  /*#__PURE__*/ React.createElement(
                    "li",
                    {
                      key: field.id,
                      className: `field-item ${selectedField?.id === field.id ? "active" : ""}`,
                      onClick: () => setSelectedField(field),
                    },
                    /*#__PURE__*/ React.createElement("span", {
                      className: `field-dot ${field.type === "number" ? "done" : ""}`,
                    }),
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "field-name" },
                      field.name,
                    ),
                    field.semanticType === "shop" &&
                      /*#__PURE__*/ React.createElement(
                        Tag,
                        { type: "info", style: { marginLeft: 4 } },
                        "\u5E97\u94FA",
                      ),
                    field.semanticType === "date" &&
                      /*#__PURE__*/ React.createElement(
                        "span",
                        {
                          style: {
                            fontSize: 10,
                            color: "var(--color-success)",
                            background: "var(--color-success-bg)",
                            padding: "1px 6px",
                            borderRadius: 4,
                            marginLeft: 4,
                          },
                        },
                        "\u65E5\u671F",
                      ),
                    field.groupCount > 1 &&
                      /*#__PURE__*/ React.createElement(
                        "span",
                        {
                          style: {
                            fontSize: 10,
                            color: "var(--color-primary)",
                            background: "var(--color-primary-50)",
                            padding: "1px 5px",
                            borderRadius: 4,
                            marginLeft: 4,
                          },
                        },
                        field.groupIndex + 1,
                        "/",
                        field.groupCount,
                      ),
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "field-cell" },
                      field.cell,
                    ),
                  ),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "workspace-right" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "card-header" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "card-title", style: { fontSize: 14 } },
                  /*#__PURE__*/ React.createElement(Icons.Edit, null),
                  "\u5B57\u6BB5\u914D\u7F6E",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "card-scroll" },
                selectedField
                  ? /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { width: "100%", textAlign: "left", flex: "none" } },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "form-item" },
                        /*#__PURE__*/ React.createElement(
                          "label",
                          { className: "form-label" },
                          "\u5B57\u6BB5\u540D\u79F0",
                        ),
                        /*#__PURE__*/ React.createElement("input", {
                          type: "text",
                          className: "input",
                          value: selectedField.name,
                          onChange: (e) => {
                            handleFieldNameChange(
                              selectedField.id,
                              e.target.value,
                            );
                            setSelectedField({
                              ...selectedField,
                              name: e.target.value,
                            });
                          },
                        }),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "form-item" },
                        /*#__PURE__*/ React.createElement(
                          "label",
                          { className: "form-label" },
                          "\u5355\u5143\u683C\u4F4D\u7F6E",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            style: {
                              padding: "10px 14px",
                              background: "var(--color-bg-tertiary)",
                              borderRadius: "var(--radius-md)",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                            },
                          },
                          selectedField.cell,
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "form-item" },
                        /*#__PURE__*/ React.createElement(
                          "label",
                          { className: "form-label" },
                          "\u5B57\u6BB5\u7C7B\u578B",
                        ),
                        /*#__PURE__*/ React.createElement(
                          Tag,
                          {
                            type:
                              selectedField.type === "text"
                                ? "primary"
                                : "success",
                          },
                          selectedField.type === "text"
                            ? "文本填充"
                            : "数值填充",
                        ),
                        selectedField.semanticType === "shop" &&
                          /*#__PURE__*/ React.createElement(
                            Tag,
                            { type: "info" },
                            "\u5E97\u94FA\u540D",
                          ),
                        selectedField.semanticType === "date" &&
                          /*#__PURE__*/ React.createElement(
                            Tag,
                            { type: "success" },
                            "\u65E5\u671F",
                          ),
                        selectedField.groupCount > 1 &&
                          /*#__PURE__*/ React.createElement(
                            "span",
                            {
                              style: {
                                marginLeft: 8,
                                fontSize: 12,
                                color: "var(--color-primary)",
                              },
                            },
                            "\u5206\u7EC4: \u7B2C",
                            selectedField.groupIndex + 1,
                            "\u5904 / \u5171",
                            selectedField.groupCount,
                            "\u5904",
                          ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "form-item" },
                        /*#__PURE__*/ React.createElement(
                          "label",
                          { className: "form-label" },
                          "\u539F\u59CB\u503C",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            style: {
                              padding: "10px 14px",
                              background: "var(--color-bg-tertiary)",
                              borderRadius: "var(--radius-md)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                            },
                          },
                          selectedField.originalValue || "(空)",
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "form-item" },
                        /*#__PURE__*/ React.createElement(
                          "label",
                          { className: "form-label" },
                          "\u5339\u914D\u6A21\u5F0F",
                        ),
                        /*#__PURE__*/ React.createElement(
                          Tag,
                          { type: "info" },
                          selectedField.markerMatch,
                        ),
                      ),
                    )
                  : /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "empty", style: { padding: "40px 20px" } },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty-icon" },
                        "\uD83D\uDC46",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty-text" },
                        "\u9009\u62E9\u5DE6\u4FA7\u5B57\u6BB5\u67E5\u770B\u8BE6\u60C5",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty-desc" },
                        "\u70B9\u51FB\u5B57\u6BB5\u53EF\u7F16\u8F91\u540D\u79F0\u548C\u67E5\u770B\u5C5E\u6027",
                      ),
                    ),
              ),
            ),
          ),
        ),
    ),
    // 批量文件选择模态框
    showBatchModal && /*#__PURE__*/ React.createElement(
      "div",
      { className: "modal-mask", onClick: (e) => e.target === e.currentTarget && setShowBatchModal(false) },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "modal", style: { maxWidth: "800px" } },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-header" },
          /*#__PURE__*/ React.createElement("div", { className: "modal-title" }, /*#__PURE__*/ React.createElement(Icons.Folder, null), " 选择模板文件"),
          /*#__PURE__*/ React.createElement("button", { className: "modal-close", onClick: () => setShowBatchModal(false) }, /*#__PURE__*/ React.createElement(Icons.X, null))
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-body" },
          /*#__PURE__*/ React.createElement(
            "div",
            { style: { marginBottom: 16 } },
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
              /*#__PURE__*/ React.createElement("span", { style: { fontSize: 13, color: "var(--color-text-secondary)" } }, "共发现 ", batchFiles.length, " 个Excel文件，", batchFiles.filter(f => f.status === "success").length, " 个解析成功"),
              /*#__PURE__*/ React.createElement("span", { style: { fontSize: 12, color: "var(--color-text-tertiary)" } }, "点击行选择作为主模板")
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "data-table-container", style: { maxHeight: 400, overflow: "auto" } },
            /*#__PURE__*/ React.createElement(
              "table",
              { className: "table" },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement("tr", null,
                  /*#__PURE__*/ React.createElement("th", { style: { width: 40 } }, /*#__PURE__*/ React.createElement("input", { type: "checkbox", checked: batchFiles.filter(f => f.status === "success").every(f => f.selected), onChange: (e) => setBatchFiles(prev => prev.map(f => f.status === "success" ? { ...f, selected: e.target.checked } : f)) })),
                  /*#__PURE__*/ React.createElement("th", null, "文件路径"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 80 } }, "状态"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 100 } }, "字段数"),
                  /*#__PURE__*/ React.createElement("th", { style: { width: 80 } }, "操作")
                )
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                batchFiles.map((fileItem, idx) => /*#__PURE__*/ React.createElement("tr", {
                  key: idx,
                  className: fileItem.selected ? "highlight" : "",
                  style: { cursor: fileItem.status === "success" ? "pointer" : "default" },
                  onClick: () => fileItem.status === "success" && selectFileAsMain(fileItem)
                },
                  /*#__PURE__*/ React.createElement("td", null, fileItem.status === "success" && /*#__PURE__*/ React.createElement("input", { type: "checkbox", checked: fileItem.selected, onChange: (e) => { e.stopPropagation(); toggleFileSelection(idx); }, onClick: (e) => e.stopPropagation() })),
                  /*#__PURE__*/ React.createElement("td", null, /*#__PURE__*/ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null), /*#__PURE__*/ React.createElement("span", { style: { fontSize: 13 } }, fileItem.path))),
                  /*#__PURE__*/ React.createElement("td", null, fileItem.status === "success" ? /*#__PURE__*/ React.createElement("span", { className: "tag tag-success" }, "成功") : /*#__PURE__*/ React.createElement("span", { className: "tag tag-danger" }, "失败")),
                  /*#__PURE__*/ React.createElement("td", null, fileItem.parseResult ? fileItem.parseResult.fields.length : "-"),
                  /*#__PURE__*/ React.createElement("td", null, fileItem.status === "success" && /*#__PURE__*/ React.createElement("button", { className: "btn-link", onClick: (e) => { e.stopPropagation(); selectFileAsMain(fileItem); } }, "选择"))
                ))
              )
            )
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "modal-footer" },
          /*#__PURE__*/ React.createElement("button", { className: "btn btn-default", onClick: () => setShowBatchModal(false) }, "取消"),
          /*#__PURE__*/ React.createElement("button", { className: "btn btn-primary", onClick: mergeSelectedFiles }, /*#__PURE__*/ React.createElement(Icons.Check, null), " 合并选中文件")
        )
      )
    )
  );
};
