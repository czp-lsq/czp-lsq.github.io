const StoragePage = ({ state, setState }) => {
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const fileInputRef = useRef(null);

  const exportTypes = [
    { id: "all", name: "全部数据", desc: "导出所有配置和数据" },
    { id: "templates", name: "模板配置", desc: "导出所有平台的模板配置" },
    { id: "rules", name: "计算规则", desc: "导出所有字段的计算规则" },
    { id: "shops", name: "店铺数据", desc: "导出所有平台的店铺信息" },
    { id: "samples", name: "样表数据", desc: "导出已上传的样表数据" },
    { id: "externals", name: "全局数据", desc: "导出全局数据配置" },
    { id: "platforms", name: "平台配置", desc: "导出平台设置" },
  ];

  const getExportData = (type) => {
    switch (type) {
      case "templates":
        return { templates: state.templates };
      case "rules":
        return { rules: state.rules };
      case "shops":
        return { shops: state.shops };
      case "samples":
        return { samples: state.samples };
      case "externals":
        return { externals: state.externals };
      case "platforms":
        return { platforms: state.platforms };
      default:
        return state;
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      try {
        const data = getExportData(selectedType);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `shopdata-${selectedType}-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("success", "导出成功", `数据已保存为JSON文件`);
        ActivityLogger.add("数据导出", selectedType);
      } catch (error) {
        addToast("error", "导出失败", error.message);
      }
      setExporting(false);
    }, 500);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const importedData = JSON.parse(ev.target.result);
        if (!importedData || typeof importedData !== "object") {
          throw new Error("无效的JSON数据");
        }
        setState((prev) => {
          const merged = { ...prev, ...importedData };
          return merged;
        });
        addToast("success", "导入成功", "数据已加载到系统中");
        ActivityLogger.add("数据导入", file.name);
      } catch (error) {
        addToast("error", "导入失败", error.message);
      }
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const dataStats = [
    { label: "平台数量", value: state.platforms?.length || 0, color: "primary" },
    { label: "模板数量", value: Object.keys(state.templates || {}).length, color: "success" },
    { label: "规则数量", value: Object.keys(state.rules || {}).length, color: "warning" },
    { label: "店铺数量", value: Object.keys(state.shops || {}).length, color: "info" },
    { label: "样表数量", value: Object.values(state.samples || {}).reduce((sum, arr) => sum + arr.length, 0), color: "danger" },
    { label: "全局数据", value: Object.keys(state.externals || {}).length, color: "default" },
  ];

  return React.createElement("div", { className: "storage-page" },
    React.createElement("div", { className: "page-header" },
      React.createElement("div", { className: "page-title" },
        React.createElement("h1", null, "数据管理"),
        React.createElement("p", null, "导出和导入系统配置数据，支持JSON格式备份"),
      ),
    ),
    React.createElement("div", { className: "card-grid" },
      dataStats.map((stat, idx) => React.createElement("div", { key: idx, className: "card stat-card" },
        React.createElement("div", { className: "stat-value", style: { color: `var(--color-${stat.color})` } }, stat.value),
        React.createElement("div", { className: "stat-label" }, stat.label),
      )),
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("h3", null, "数据导出"),
        React.createElement("p", { className: "card-desc" }, "将系统数据导出为JSON文件，方便备份和迁移"),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "form-group" },
          React.createElement("label", null, "选择导出类型"),
          React.createElement("div", { className: "select-group" },
            exportTypes.map((type) => React.createElement("button", {
              key: type.id,
              className: `select-btn ${selectedType === type.id ? "active" : ""}`,
              onClick: () => setSelectedType(type.id),
            },
              React.createElement("span", null, type.name),
              React.createElement("span", { className: "select-btn-desc" }, type.desc),
            )),
          ),
        ),
        React.createElement("div", { className: "form-actions" },
          React.createElement(Button, {
            type: "primary",
            onClick: handleExport,
            loading: exporting,
            style: { minWidth: 140 },
          },
            React.createElement(Icons.Download, null),
            exporting ? "导出中..." : "导出数据",
          ),
        ),
      ),
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("h3", null, "数据导入"),
        React.createElement("p", { className: "card-desc" }, "从JSON文件导入数据，覆盖现有配置"),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "upload-area" },
          React.createElement("input", {
            ref: fileInputRef,
            type: "file",
            accept: ".json",
            onChange: handleImport,
            style: { display: "none" },
          }),
          React.createElement("div", {
            className: "upload-area-inner",
            onClick: () => fileInputRef.current?.click(),
          },
            React.createElement(Icons.Upload, null),
            React.createElement("div", { className: "upload-area-text" }, "点击选择JSON文件"),
            React.createElement("div", { className: "upload-area-desc" }, "支持从导出的备份文件恢复数据"),
          ),
        ),
        React.createElement("div", { className: "form-actions" },
          React.createElement(Button, {
            type: "default",
            onClick: () => fileInputRef.current?.click(),
            loading: importing,
            style: { minWidth: 140 },
          },
            React.createElement(Icons.Upload, null),
            importing ? "导入中..." : "选择文件",
          ),
        ),
      ),
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("h3", null, "数据说明"),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("ul", { className: "data-list" },
          React.createElement("li", null,
            React.createElement("strong", null, "模板配置："),
            "包含各平台的利润表模板结构和字段映射",
          ),
          React.createElement("li", null,
            React.createElement("strong", null, "计算规则："),
            "包含所有字段的计算公式和依赖关系",
          ),
          React.createElement("li", null,
            React.createElement("strong", null, "店铺数据："),
            "包含各平台下的店铺名称和标识信息",
          ),
          React.createElement("li", null,
            React.createElement("strong", null, "样表数据："),
            "包含已上传的Excel样表文件数据",
          ),
          React.createElement("li", null,
            React.createElement("strong", null, "全局数据："),
            "包含全局配置项和共享数据",
          ),
        ),
        React.createElement("div", { className: "warning-box" },
          React.createElement(Icons.AlertTriangle, null),
          React.createElement("span", null, "导入数据将覆盖现有配置，请谨慎操作。建议先导出备份。"),
        ),
      ),
    ),
  );
};