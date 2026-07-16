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
      const newTemplateData = {
        fileName: file.name,
        sheetName: firstSheetName,
        aoa: sheet.aoa,
        headers: sheet.headers,
        rows: sheet.rows,
      };
      setTemplateData(newTemplateData);
      setParseResult(fieldsResult);
      addToast(
        "success",
        "模板解析成功",
        `识别到 ${fieldsResult.fields.length} 个字段`,
      );
      ActivityLogger.add("上传模板", `${platform?.name} - ${file.name}`);
      Store.set((s) => ({
        ...s,
        templates: {
          ...s.templates,
          [currentPlatform]: {
            ...newTemplateData,
            parseResult: fieldsResult,
            savedAt: new Date().toISOString(),
          },
        },
      }));
      Store.flush();
      ActivityLogger.add("保存模板", `${platform?.name}模板`);
    } catch (err) {
      console.error(err);
      addToast("error", "解析失败", err.message || "文件解析出错");
    } finally {
      setIsParsing(false);
    }
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
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, name: newName });
    }
  };
  const renderDebugPanel = () => {
    if (!debugMode || !parseResult) return null;
    return /*#__PURE__*/ React.createElement(
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
            parseResult.fields.filter((f) => f.type === "text").length,
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
            parseResult.fields.filter((f) => f.type === "number").length,
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
              /*#__PURE__*/ React.createElement("span", { className: "platform-icon iconfont icon-" + platform?.id, style: { fontSize: 16, margin: "0 4px" } }),
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
            /*#__PURE__*/ React.createElement("input", {
              ref: fileInputRef,
              type: "file",
              accept: ".xlsx,.xls,.csv,.zip",
              onChange: handleTemplateUpload,
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
                    parseResult.fields.filter((f) => f.type === "number").length,
                  ),
                  /*#__PURE__*/ React.createElement(
                    Tag,
                    { type: "info" },
                    "\u5408\u5E76\u5355\u5143\u683C: ",
                    parseResult.mergedCells.length,
                  ),
                ),
            ),
            /*#__PURE__*/ React.createElement(TemplatePreview, {
              templateData,
              parseResult,
              debugMode,
              previewExpanded,
              setPreviewExpanded,
              setSelectedField,
            }),
            renderDebugPanel(),
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
            /*#__PURE__*/ React.createElement(FieldList, {
              fields: parseResult.fields,
              selectedField,
              onSelectField: setSelectedField,
            }),
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
                /*#__PURE__*/ React.createElement(FieldConfig, {
                  selectedField,
                  onFieldNameChange: handleFieldNameChange,
                }),
              ),
            ),
          ),
        ),
    ),
  );
};