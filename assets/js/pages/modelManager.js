// pages/modelManager.js - 识别模型管理页面
const ModelManagerPage = ({ state, onNavigate }) => {
  const { addToast } = useToast();
  const [models, setModels] = useState([]);
  const [activeModelIds, setActiveModelIds] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [conflictMode, setConflictMode] = useState("skip");
  const [newModelName, setNewModelName] = useState("");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const fileInputRef = useRef(null);

  const modelTypes = RecognitionModelManager.getModelTypes();

  useEffect(() => {
    refreshModels();
  }, []);

  const refreshModels = () => {
    const allModels = RecognitionModelManager.getAllModels();
    const activeIds = RecognitionModelManager.getActiveModels().map((m) => m.id);
    setModels(allModels);
    setActiveModelIds(activeIds);
  };

  const filteredModels = models.filter((m) => {
    if (filterType !== "all" && m.type !== filterType) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return (
        m.name.toLowerCase().includes(kw) ||
        m.description.toLowerCase().includes(kw) ||
        m.id.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const handleToggleModel = (modelId) => {
    const result = RecognitionModelManager.toggleModel(modelId);
    if (result.success) {
      const activeIds = RecognitionModelManager.getActiveModels().map((m) => m.id);
      setActiveModelIds(activeIds);
      addToast("success", "操作成功", `模型已${result.enabled ? "启用" : "禁用"}`);
    } else {
      addToast("error", "操作失败", result.message);
    }
  };

  const handleExportModel = (model) => {
    const jsonStr = RecognitionModelManager.exportModel(model.id);
    if (!jsonStr) {
      addToast("error", "导出失败", "模型不存在");
      return;
    }
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${model.name}_v${model.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("success", "导出成功", `模型「${model.name}」已导出`);
  };

  const handleDuplicateModel = (model) => {
    const result = RecognitionModelManager.duplicateModel(model.id);
    if (result.success) {
      refreshModels();
      addToast("success", "复制成功", `已创建模型副本`);
    } else {
      addToast("error", "复制失败", result.message);
    }
  };

  const handleDeleteModel = (model) => {
    const result = RecognitionModelManager.deleteModel(model.id);
    if (result.success) {
      refreshModels();
      if (selectedModel?.id === model.id) {
        setSelectedModel(null);
      }
      addToast("success", "删除成功", "模型已删除");
    } else {
      addToast("error", "删除失败", result.message);
    }
    setShowDeleteConfirm(null);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      addToast("error", "格式错误", "请上传 .json 格式的模型文件");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        const validation = RecognitionModelManager.validateModel(data);
        if (!validation.valid) {
          addToast("error", "验证失败", validation.message);
          return;
        }
        const conflict = RecognitionModelManager.checkConflict(data);
        setImportPreview({ data, conflict, fileName: file.name });
        setImportFile(content);
        setConflictMode("skip");
      } catch (err) {
        addToast("error", "解析失败", "JSON 文件格式错误");
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!importFile) return;
    const result = RecognitionModelManager.importModel(importFile, {
      mode: conflictMode,
    });
    if (result.success) {
      refreshModels();
      setShowImportModal(false);
      setImportPreview(null);
      setImportFile(null);
      addToast("success", "导入成功", `模型「${result.model.name}」已导入`);
    } else if (result.skipped) {
      addToast("info", "已跳过", result.message);
    } else {
      addToast("error", "导入失败", result.message);
    }
  };

  const handleCreateModel = () => {
    if (!newModelName.trim()) {
      addToast("error", "信息不完整", "请输入模型名称");
      return;
    }
    const result = RecognitionModelManager.createCustomModel(
      newModelName.trim(),
      newModelDesc.trim()
    );
    if (result.success) {
      refreshModels();
      setShowCreateModal(false);
      setNewModelName("");
      setNewModelDesc("");
      addToast("success", "创建成功", `自定义模型「${result.model.name}」已创建`);
    } else {
      addToast("error", "创建失败", result.message);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const getTypeBadge = (type) => {
    const info = modelTypes[type] || modelTypes.custom;
    return React.createElement(
      "span",
      {
        className: `tag tag-${type === "cost" ? "primary" : type === "size" ? "success" : type === "platform" ? "info" : "warning"}`,
      },
      info.icon + " " + info.name
    );
  };

  const renderSidebar = () =>
    React.createElement(
      "div",
      { className: "model-sidebar" },
      React.createElement(
        "div",
        { className: "model-sidebar-header" },
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "10px" } },
          React.createElement(Icons.Layers, {
            style: { width: "24px", height: "24px", color: "var(--color-primary)" },
          }),
          React.createElement(
            "span",
            { className: "model-sidebar-title" },
            "识别模型管理"
          )
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: "8px" } },
          React.createElement(
            Button,
            {
              type: "primary",
              size: "sm",
              onClick: () => setShowImportModal(true),
            },
            React.createElement(Icons.Upload, { size: 14 }),
            " 导入"
          ),
          React.createElement(
            Button,
            {
              type: "default",
              size: "sm",
              onClick: () => setShowCreateModal(true),
            },
            React.createElement(Icons.Plus, { size: 14 }),
            " 新建"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "model-sidebar-search" },
        React.createElement(
          "div",
          { className: "input-group input-with-icon" },
          React.createElement(Icons.Search, {
            size: 16,
            style: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" },
          }),
          React.createElement("input", {
            type: "text",
            className: "input",
            placeholder: "搜索模型...",
            value: searchKeyword,
            onChange: (e) => setSearchKeyword(e.target.value),
            style: { paddingLeft: "36px" },
          })
        )
      ),
      React.createElement(
        "div",
        { className: "model-sidebar-filters" },
        ["all", ...Object.keys(modelTypes)].map((type) =>
          React.createElement(
            "button",
            {
              key: type,
              className: `filter-chip ${filterType === type ? "active" : ""}`,
              onClick: () => setFilterType(type),
            },
            type === "all" ? "全部" : modelTypes[type].name,
            React.createElement(
              "span",
              { className: "filter-count" },
              type === "all"
                ? models.length
                : models.filter((m) => m.type === type).length
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "model-list" },
        filteredModels.length === 0
          ? React.createElement(
              "div",
              { className: "empty", style: { padding: "40px 20px" } },
              React.createElement("div", { className: "empty-icon" }, "📦"),
              React.createElement("div", { className: "empty-text" }, "暂无模型"),
              React.createElement("div", { className: "empty-desc" }, "点击右上角导入或创建模型")
            )
          : filteredModels.map((model) =>
              React.createElement(
                "div",
                {
                  key: model.id,
                  className: `model-card ${selectedModel?.id === model.id ? "selected" : ""}`,
                  onClick: () => setSelectedModel(model),
                },
                React.createElement(
                  "div",
                  { className: "model-card-header" },
                  React.createElement(
                    "div",
                    { className: "model-card-title" },
                    model.name
                  ),
                  React.createElement(
                    "label",
                    {
                      className: "settings-switch",
                      onClick: (e) => e.stopPropagation(),
                    },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: activeModelIds.includes(model.id),
                      onChange: () => handleToggleModel(model.id),
                    }),
                    React.createElement("span", { className: "settings-slider" })
                  )
                ),
                React.createElement(
                  "div",
                  { className: "model-card-meta" },
                  getTypeBadge(model.type),
                  React.createElement(
                    "span",
                    { className: "model-version" },
                    "v" + model.version
                  ),
                  model.author === "系统" &&
                    React.createElement(
                      "span",
                      { className: "model-badge" },
                      "官方"
                    )
                ),
                React.createElement(
                  "div",
                  { className: "model-card-desc" },
                  model.description || "暂无描述"
                ),
                React.createElement(
                  "div",
                  { className: "model-card-stats" },
                  React.createElement(
                    "span",
                    null,
                    (model.fieldRecognition?.length || 0) + " 条规则"
                  ),
                  React.createElement(
                    "span",
                    null,
                    (model.ruleTemplates?.length || 0) + " 个模板"
                  )
                )
              )
            )
      )
    );

  const renderDetail = () => {
    if (!selectedModel) {
      return React.createElement(
        "div",
        { className: "model-detail-empty" },
        React.createElement(
          "div",
          { style: { fontSize: "64px", marginBottom: "16px" } },
          "🧩"
        ),
        React.createElement(
          "h3",
          { style: { color: "var(--color-text-primary)", marginBottom: "8px" } },
          "选择一个模型查看详情"
        ),
        React.createElement(
          "p",
          { style: { color: "var(--color-text-tertiary)" } },
          "从左侧列表中选择模型，查看识别规则、模板配置等详细信息"
        )
      );
    }

    const typeInfo = modelTypes[selectedModel.type] || modelTypes.custom;

    return React.createElement(
      "div",
      { className: "model-detail" },
      React.createElement(
        "div",
        { className: "model-detail-header" },
        React.createElement(
          "div",
          { className: "model-detail-title-row" },
          React.createElement(
            "div",
            {
              className: "model-icon",
              style: { background: typeInfo.color + "20", color: typeInfo.color },
            },
            typeInfo.icon
          ),
          React.createElement(
            "div",
            { style: { flex: 1 } },
            React.createElement(
              "h2",
              { className: "model-detail-title" },
              selectedModel.name
            ),
            React.createElement(
              "div",
              { className: "model-detail-subtitle" },
              getTypeBadge(selectedModel.type),
              React.createElement(
                "span",
                { style: { color: "var(--color-text-tertiary)", fontSize: "13px" } },
                "v" + selectedModel.version
              ),
              selectedModel.author === "系统" &&
                React.createElement(
                  "span",
                  { className: "model-badge model-badge-official" },
                  "官方模型"
                )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "model-detail-actions" },
          React.createElement(
            Button,
            { size: "sm", onClick: () => handleExportModel(selectedModel) },
            React.createElement(Icons.Download, { size: 14 }),
            " 导出"
          ),
          selectedModel.author !== "系统" &&
            React.createElement(
              Button,
              { size: "sm", onClick: () => handleDuplicateModel(selectedModel) },
              React.createElement(Icons.Copy, { size: 14 }),
              " 复制"
            ),
          selectedModel.author !== "系统" &&
            React.createElement(
              Button,
              {
                type: "danger",
                size: "sm",
                onClick: () => setShowDeleteConfirm(selectedModel),
              },
              React.createElement(Icons.Trash, { size: 14 }),
              " 删除"
            )
        )
      ),
      React.createElement(
        "div",
        { className: "model-detail-tabs" },
        ["info", "fields", "templates"].map((tab) =>
          React.createElement(
            "button",
            {
              key: tab,
              className: `tab-btn ${activeTab === tab ? "active" : ""}`,
              onClick: () => setActiveTab(tab),
            },
            tab === "info" ? "基本信息" : tab === "fields" ? "字段识别规则" : "规则模板"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "model-detail-content" },
        activeTab === "info" && renderInfoTab(),
        activeTab === "fields" && renderFieldsTab(),
        activeTab === "templates" && renderTemplatesTab()
      )
    );
  };

  const renderInfoTab = () =>
    React.createElement(
      "div",
      { className: "info-grid" },
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "模型ID"),
        React.createElement("div", { className: "info-value" }, selectedModel.id)
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "模型名称"),
        React.createElement("div", { className: "info-value" }, selectedModel.name)
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "模型类型"),
        React.createElement(
          "div",
          { className: "info-value" },
          getTypeBadge(selectedModel.type)
        )
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "版本号"),
        React.createElement("div", { className: "info-value" }, "v" + selectedModel.version)
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "作者"),
        React.createElement("div", { className: "info-value" }, selectedModel.author || "-")
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "状态"),
        React.createElement(
          "div",
          { className: "info-value" },
          activeModelIds.includes(selectedModel.id)
            ? React.createElement(
                "span",
                { className: "tag tag-success" },
                "已启用"
              )
            : React.createElement(
                "span",
                { className: "tag tag-default" },
                "已禁用"
              )
        )
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "创建时间"),
        React.createElement(
          "div",
          { className: "info-value" },
          formatDate(selectedModel.createdAt)
        )
      ),
      React.createElement(
        "div",
        { className: "info-item" },
        React.createElement("div", { className: "info-label" }, "更新时间"),
        React.createElement(
          "div",
          { className: "info-value" },
          formatDate(selectedModel.updatedAt)
        )
      ),
      React.createElement(
        "div",
        { className: "info-item", style: { gridColumn: "span 2" } },
        React.createElement("div", { className: "info-label" }, "描述"),
        React.createElement(
          "div",
          { className: "info-value" },
          selectedModel.description || "暂无描述"
        )
      )
    );

  const renderFieldsTab = () => {
    const fields = selectedModel.fieldRecognition || [];
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          },
        },
        React.createElement(
          "span",
          { style: { color: "var(--color-text-secondary)", fontSize: "13px" } },
          `共 ${fields.length} 条识别规则`
        )
      ),
      fields.length === 0
        ? React.createElement(
            "div",
            { className: "empty", style: { padding: "40px 20px" } },
            React.createElement("div", { className: "empty-icon" }, "📋"),
            React.createElement("div", { className: "empty-text" }, "暂无识别规则"),
            React.createElement(
              "div",
              { className: "empty-desc" },
              "该模型尚未配置字段识别规则"
            )
          )
        : React.createElement(
            "div",
            { className: "data-table-container" },
            React.createElement(
              "table",
              { className: "table" },
              React.createElement(
                "thead",
                null,
                React.createElement(
                  "tr",
                  null,
                  React.createElement("th", { style: { width: 50 } }, "优先级"),
                  React.createElement("th", null, "关键词"),
                  React.createElement("th", null, "语义类型"),
                  React.createElement("th", null, "字段类型")
                )
              ),
              React.createElement(
                "tbody",
                null,
                fields.map((rule, idx) =>
                  React.createElement(
                    "tr",
                    { key: idx },
                    React.createElement(
                      "td",
                      null,
                      React.createElement(
                        "span",
                        {
                          className:
                            "tag " +
                            (rule.priority >= 10
                              ? "tag-primary"
                              : rule.priority >= 7
                              ? "tag-info"
                              : "tag-default"),
                        },
                        rule.priority || 0
                      )
                    ),
                    React.createElement(
                      "td",
                      null,
                      React.createElement(
                        "div",
                        { style: { display: "flex", flexWrap: "wrap", gap: "4px" } },
                        (rule.keyword || []).slice(0, 4).map((kw, i) =>
                          React.createElement(
                            "span",
                            { key: i, className: "keyword-tag" },
                            kw
                          )
                        ),
                        (rule.keyword?.length || 0) > 4 &&
                          React.createElement(
                            "span",
                            { className: "keyword-tag keyword-more" },
                            "+" + (rule.keyword.length - 4)
                          )
                      )
                    ),
                    React.createElement(
                      "td",
                      null,
                      React.createElement(
                        "code",
                        { className: "code-inline" },
                        rule.semanticType
                      )
                    ),
                    React.createElement(
                      "td",
                      null,
                      rule.fieldType || "string"
                    )
                  )
                )
              )
            )
          )
    );
  };

  const renderTemplatesTab = () => {
    const templates = selectedModel.ruleTemplates || [];
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          },
        },
        React.createElement(
          "span",
          { style: { color: "var(--color-text-secondary)", fontSize: "13px" } },
          `共 ${templates.length} 个规则模板`
        )
      ),
      templates.length === 0
        ? React.createElement(
            "div",
            { className: "empty", style: { padding: "40px 20px" } },
            React.createElement("div", { className: "empty-icon" }, "📑"),
            React.createElement("div", { className: "empty-text" }, "暂无规则模板"),
            React.createElement(
              "div",
              { className: "empty-desc" },
              "该模型尚未配置计算规则模板"
            )
          )
        : React.createElement(
            "div",
            { className: "template-grid" },
            templates.map((tpl) =>
              React.createElement(
                "div",
                { key: tpl.id, className: "template-card" },
                React.createElement(
                  "div",
                  { className: "template-card-header" },
                  React.createElement(
                    "div",
                    { className: "template-card-title" },
                    tpl.name
                  ),
                  React.createElement(
                    "span",
                    { className: "tag tag-info" },
                    (tpl.steps?.length || 0) + " 步骤"
                  )
                ),
                React.createElement(
                  "div",
                  { className: "template-card-desc" },
                  tpl.description || "暂无描述"
                )
              )
            )
          )
    );
  };

  const renderImportModal = () => {
    if (!showImportModal) return null;

    return React.createElement(
      Modal,
      {
        title: "导入识别模型",
        large: true,
        onClose: () => {
          setShowImportModal(false);
          setImportPreview(null);
          setImportFile(null);
        },
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Button,
            {
              onClick: () => {
                setShowImportModal(false);
                setImportPreview(null);
                setImportFile(null);
              },
            },
            "取消"
          ),
          React.createElement(
            Button,
            {
              type: "primary",
              disabled: !importPreview,
              onClick: handleConfirmImport,
            },
            "确认导入"
          )
        ),
      },
      !importPreview
        ? React.createElement(
            "div",
            {
              className: `upload-dropzone ${isDragging ? "dragging" : ""}`,
              onDragOver: handleDragOver,
              onDragLeave: handleDragLeave,
              onDrop: handleDrop,
              onClick: () => fileInputRef.current?.click(),
            },
            React.createElement("input", {
              ref: fileInputRef,
              type: "file",
              accept: ".json",
              style: { display: "none" },
              onChange: (e) => handleFileSelect(e.target.files?.[0]),
            }),
            React.createElement(
              "div",
              { style: { fontSize: "48px", marginBottom: "16px" } },
              "📤"
            ),
            React.createElement(
              "div",
              { className: "dropzone-title" },
              "拖拽 JSON 文件到此处"
            ),
            React.createElement(
              "div",
              { className: "dropzone-desc" },
              "或点击选择文件，支持 .json 格式的模型文件"
            )
          )
        : React.createElement(
            "div",
            { className: "import-preview" },
            React.createElement(
              "div",
              { className: "import-preview-header" },
              React.createElement(
                "div",
                { style: { display: "flex", alignItems: "center", gap: "12px" } },
                React.createElement(
                  "div",
                  {
                    className: "model-icon",
                    style: {
                      background:
                        (modelTypes[importPreview.data.type] || modelTypes.custom)
                          .color + "20",
                      color:
                        (modelTypes[importPreview.data.type] || modelTypes.custom)
                          .color,
                    },
                  },
                  (modelTypes[importPreview.data.type] || modelTypes.custom).icon
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "div",
                    {
                      style: {
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      },
                    },
                    importPreview.data.name
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        fontSize: "13px",
                        color: "var(--color-text-tertiary)",
                        marginTop: "2px",
                      },
                    },
                    "v" + importPreview.data.version + " · " + importPreview.fileName
                  )
                )
              ),
              React.createElement(
                Button,
                {
                  size: "sm",
                  onClick: () => {
                    setImportPreview(null);
                    setImportFile(null);
                  },
                },
                "重新选择"
              )
            ),
            importPreview.conflict.hasConflict &&
              React.createElement(
                "div",
                { className: "conflict-section" },
                React.createElement(
                  "div",
                  { className: "conflict-title" },
                  React.createElement(Icons.AlertTriangle, {
                    size: 16,
                    style: { color: "var(--color-warning)", marginRight: "6px" },
                  }),
                  "检测到版本冲突"
                ),
                React.createElement(
                  "div",
                  { className: "conflict-compare" },
                  React.createElement(
                    "div",
                    { className: "conflict-item" },
                    React.createElement(
                      "div",
                      { className: "conflict-item-label" },
                      "当前版本"
                    ),
                    React.createElement(
                      "div",
                      { className: "conflict-item-value" },
                      "v" + importPreview.conflict.existing.version
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "conflict-arrow" },
                    "→"
                  ),
                  React.createElement(
                    "div",
                    { className: "conflict-item" },
                    React.createElement(
                      "div",
                      { className: "conflict-item-label" },
                      "导入版本"
                    ),
                    React.createElement(
                      "div",
                      {
                        className:
                          "conflict-item-value " +
                          (importPreview.conflict.isNewer
                            ? "text-success"
                            : importPreview.conflict.isSameVersion
                            ? "text-warning"
                            : "text-danger"),
                      },
                      "v" + importPreview.data.version +
                        (importPreview.conflict.isNewer
                          ? " (更新)"
                          : importPreview.conflict.isSameVersion
                          ? " (相同)"
                          : " (更旧)")
                    )
                  )
                ),
                React.createElement(
                  "div",
                  { className: "conflict-options" },
                  [
                    { value: "skip", label: "跳过", desc: "保留现有模型，不导入" },
                    { value: "overwrite", label: "覆盖", desc: "用导入的模型替换现有模型" },
                    { value: "rename", label: "重命名导入", desc: "以新名称导入，保留两个版本" },
                  ].map((opt) =>
                    React.createElement(
                      "label",
                      {
                        key: opt.value,
                        className: `radio-card ${conflictMode === opt.value ? "selected" : ""}`,
                      },
                      React.createElement("input", {
                        type: "radio",
                        name: "conflictMode",
                        value: opt.value,
                        checked: conflictMode === opt.value,
                        onChange: (e) => setConflictMode(e.target.value),
                      }),
                      React.createElement(
                        "div",
                        { className: "radio-card-content" },
                        React.createElement(
                          "div",
                          { className: "radio-card-title" },
                          opt.label
                        ),
                        React.createElement(
                          "div",
                          { className: "radio-card-desc" },
                          opt.desc
                        )
                      )
                    )
                  )
                )
              ),
            React.createElement(
              "div",
              { className: "import-info-grid" },
              React.createElement(
                "div",
                { className: "info-item" },
                React.createElement("div", { className: "info-label" }, "模型类型"),
                React.createElement(
                  "div",
                  { className: "info-value" },
                  getTypeBadge(importPreview.data.type)
                )
              ),
              React.createElement(
                "div",
                { className: "info-item" },
                React.createElement("div", { className: "info-label" }, "作者"),
                React.createElement(
                  "div",
                  { className: "info-value" },
                  importPreview.data.author || "-"
                )
              ),
              React.createElement(
                "div",
                { className: "info-item" },
                React.createElement("div", { className: "info-label" }, "识别规则"),
                React.createElement(
                  "div",
                  { className: "info-value" },
                  (importPreview.data.fieldRecognition?.length || 0) + " 条"
                )
              ),
              React.createElement(
                "div",
                { className: "info-item" },
                React.createElement("div", { className: "info-label" }, "规则模板"),
                React.createElement(
                  "div",
                  { className: "info-value" },
                  (importPreview.data.ruleTemplates?.length || 0) + " 个"
                )
              ),
              React.createElement(
                "div",
                { className: "info-item", style: { gridColumn: "span 2" } },
                React.createElement("div", { className: "info-label" }, "描述"),
                React.createElement(
                  "div",
                  { className: "info-value" },
                  importPreview.data.description || "暂无描述"
                )
              )
            )
          )
    );
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return React.createElement(
      Modal,
      {
        title: "创建自定义模型",
        onClose: () => {
          setShowCreateModal(false);
          setNewModelName("");
          setNewModelDesc("");
        },
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Button,
            {
              onClick: () => {
                setShowCreateModal(false);
                setNewModelName("");
                setNewModelDesc("");
              },
            },
            "取消"
          ),
          React.createElement(
            Button,
            { type: "primary", onClick: handleCreateModel },
            "创建"
          )
        ),
      },
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "16px" } },
        React.createElement(
          "div",
          { className: "form-item" },
          React.createElement(
            "label",
            { className: "form-label required" },
            "模型名称"
          ),
          React.createElement("input", {
            type: "text",
            className: "input",
            placeholder: "请输入模型名称",
            value: newModelName,
            onChange: (e) => setNewModelName(e.target.value),
            maxLength: 50,
          })
        ),
        React.createElement(
          "div",
          { className: "form-item" },
          React.createElement("label", { className: "form-label" }, "模型描述"),
          React.createElement("textarea", {
            className: "input",
            placeholder: "请输入模型描述（可选）",
            value: newModelDesc,
            onChange: (e) => setNewModelDesc(e.target.value),
            rows: 3,
            maxLength: 200,
            style: { resize: "vertical" },
          })
        ),
        React.createElement(
          "div",
          {
            style: {
              padding: "12px 16px",
              background: "var(--color-info-bg)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
            },
          },
          "💡 创建后可在模型详情中添加字段识别规则和计算规则模板"
        )
      )
    );
  };

  const renderDeleteConfirm = () => {
    if (!showDeleteConfirm) return null;

    return React.createElement(ConfirmModal, {
      title: "确认删除模型",
      message: `确认删除模型「${showDeleteConfirm.name}」？\n此操作不可撤销，删除后该模型的所有配置将丢失。`,
      type: "danger",
      confirmText: "删除",
      onConfirm: () => handleDeleteModel(showDeleteConfirm),
      onCancel: () => setShowDeleteConfirm(null),
    });
  };

  return React.createElement(
    "div",
    { className: "model-manager-page fade-in" },
    React.createElement(
      "div",
      { className: "model-manager-layout" },
      renderSidebar(),
      React.createElement(
        "div",
        { className: "model-main" },
        React.createElement(
          "div",
          { className: "card model-detail-card" },
          renderDetail()
        )
      )
    ),
    renderImportModal(),
    renderCreateModal(),
    renderDeleteConfirm()
  );
};

if (typeof window !== "undefined") {
  window.ModelManagerPage = ModelManagerPage;
}
