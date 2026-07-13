const StoragePage = ({ state, setState }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [importMode, setImportMode] = useState("merge");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [syncCode, setSyncCode] = useState("");
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [syncCodeType, setSyncCodeType] = useState("config");
  const [accountImportMode, setAccountImportMode] = useState("merge");
  const fileInputRef = useRef(null);

  const exportTypes = [
    { id: "all", name: "全部数据", desc: "导出所有配置和数据，适合完整备份", icon: Icons.Layers },
    { id: "templates", name: "模板配置", desc: "导出所有平台的模板配置", icon: Icons.FileSpreadsheet },
    { id: "rules", name: "计算规则", desc: "导出所有字段的计算规则", icon: Icons.Calculator },
    { id: "shops", name: "店铺数据", desc: "导出所有平台的店铺信息", icon: Icons.Store },
    { id: "samples", name: "样表数据", desc: "导出已上传的样表数据", icon: Icons.Database },
    { id: "externals", name: "全局数据", desc: "导出全局数据配置", icon: Icons.Server },
    { id: "platforms", name: "平台配置", desc: "导出平台设置", icon: Icons.Settings },
  ];

  const tabs = [
    { id: "overview", name: "数据概览", icon: Icons.BarChart3 },
    { id: "export", name: "数据导出", icon: Icons.Download },
    { id: "import", name: "数据导入", icon: Icons.Upload },
    { id: "sync", name: "跨设备同步", icon: Icons.RefreshCw },
    { id: "cleanup", name: "数据清理", icon: Icons.Trash2 },
  ];

  const getExportData = (type) => {
    switch (type) {
      case "templates": return { templates: state.templates };
      case "rules": return { rules: state.rules };
      case "shops": return { shops: state.shops };
      case "samples": return { samples: state.samples };
      case "externals": return { externals: state.externals };
      case "platforms": return { platforms: state.platforms };
      default: return state;
    }
  };

  const getTypeCount = (type) => {
    switch (type) {
      case "templates": return Object.keys(state.templates || {}).length;
      case "rules": return Object.keys(state.rules || {}).reduce((sum, p) => sum + Object.keys(state.rules[p] || {}).length, 0);
      case "shops": return Object.keys(state.shops || {}).reduce((sum, p) => sum + (state.shops[p]?.length || 0), 0);
      case "samples": return Object.values(state.samples || {}).reduce((sum, arr) => sum + arr.length, 0);
      case "externals": return Object.keys(state.externals || {}).length;
      case "platforms": return state.platforms?.length || 0;
      default: return 0;
    }
  };

  const storageInfo = Store.getStorageInfo();
  const usedKB = Math.round(storageInfo.usedBytes / 1024);
  const quotaKB = Math.round(storageInfo.estimatedQuota / 1024);
  const usagePercent = Math.round(storageInfo.usage * 100);

  const dataStats = [
    { label: "平台数量", value: state.platforms?.length || 0, color: "primary", icon: Icons.Layers },
    { label: "模板数量", value: Object.keys(state.templates || {}).length, color: "success", icon: Icons.FileSpreadsheet },
    { label: "规则数量", value: Object.keys(state.rules || {}).reduce((s, p) => s + Object.keys(state.rules[p] || {}).length, 0), color: "warning", icon: Icons.Calculator },
    { label: "店铺数量", value: Object.keys(state.shops || {}).reduce((s, p) => s + (state.shops[p]?.length || 0), 0), color: "info", icon: Icons.Store },
    { label: "样表数量", value: Object.values(state.samples || {}).reduce((s, arr) => s + arr.length, 0), color: "danger", icon: Icons.Database },
    { label: "全局数据", value: Object.keys(state.externals || {}).length, color: "default", icon: Icons.Server },
  ];

  useEffect(() => {
    try {
      setActivityLogs(ActivityLogger.get().slice(0, 10));
    } catch (e) {}
  }, []);

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
        addToast("success", "导出成功", `数据已保存为JSON文件`, 3000, { notificationType: "exportComplete" });
        ActivityLogger.add("数据导出", selectedType);
        setActivityLogs(ActivityLogger.get().slice(0, 10));
      } catch (error) {
        addToast("error", "导出失败", error.message);
      }
      setExporting(false);
    }, 500);
  };

  const generateSyncCode = () => {
    try {
      if (syncCodeType === "accounts") {
        if (typeof AccountManager === "undefined") {
          throw new Error("账号管理模块未加载");
        }
        const code = AccountManager.exportAccounts();
        setSyncCode(code);
        addToast("success", "账号同步码已生成", "复制同步码到另一设备粘贴即可同步账号");
        return;
      }

      let data;
      if (syncCodeType === "config") {
        data = {
          platforms: state.platforms,
          templates: state.templates,
          rules: state.rules,
          shops: state.shops,
          externals: state.externals,
          settings: state.settings,
        };
      } else {
        data = state;
      }
      const jsonStr = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      const prefix = syncCodeType === "config" ? "SD-CFG-" : "SD-ALL-";
      setSyncCode(prefix + encoded);
      addToast("success", "同步码已生成", "复制同步码到另一设备粘贴即可同步");
    } catch (e) {
      addToast("error", "生成失败", e.message);
    }
  };

  const copySyncCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode).then(() => {
      addToast("success", "已复制", "同步码已复制到剪贴板");
    }).catch(() => {
      addToast("error", "复制失败", "请手动选择复制");
    });
  };

  const applySyncCode = () => {
    if (!syncCodeInput.trim()) {
      addToast("error", "请输入同步码", "请粘贴有效的同步码");
      return;
    }
    try {
      let code = syncCodeInput.trim();

      if (code.startsWith("SD-ACC-")) {
        if (typeof AccountManager === "undefined") {
          addToast("error", "同步失败", "账号管理模块未加载");
          return;
        }
        const result = AccountManager.importAccounts(code, accountImportMode);
        if (result.success) {
          addToast("success", "账号同步成功", result.message);
          ActivityLogger.add("账号导入", `同步码导入 (${accountImportMode})`);
          setSyncCodeInput("");
        } else {
          addToast("error", "账号同步失败", result.message);
        }
        return;
      }

      let isConfig = false;
      if (code.startsWith("SD-CFG-")) {
        isConfig = true;
        code = code.substring(7);
      } else if (code.startsWith("SD-ALL-")) {
        code = code.substring(7);
      }
      const decoded = decodeURIComponent(escape(atob(code)));
      const data = JSON.parse(decoded);
      
      if (isConfig) {
        setState((prev) => ({
          ...prev,
          platforms: data.platforms || prev.platforms,
          templates: data.templates || prev.templates,
          rules: data.rules || prev.rules,
          shops: data.shops || prev.shops,
          externals: data.externals || prev.externals,
          settings: data.settings || prev.settings,
        }));
      } else {
        Store.importData(data);
      }
      addToast("success", "同步成功", "数据已成功导入");
      ActivityLogger.add("导入配置", "同步码导入");
      setSyncCodeInput("");
    } catch (e) {
      addToast("error", "同步失败", "同步码无效或已损坏，请检查后重试");
    }
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
        const modeText = importMode === "merge" ? "合并（保留现有数据，覆盖同名字段）" : "替换（清空现有数据后导入）";
        setConfirmDialog({
          title: "确认导入",
          message: `文件：${file.name}\n导入模式：${modeText}\n\n确定要继续吗？`,
          type: "warning",
          onConfirm: () => {
            setState((prev) => {
              if (importMode === "replace") {
                return { ...prev, ...importedData };
              }
              // 合并模式：深度合并
              const merged = { ...prev };
              if (importedData.templates) merged.templates = { ...(prev.templates || {}), ...importedData.templates };
              if (importedData.rules) merged.rules = { ...(prev.rules || {}), ...importedData.rules };
              if (importedData.shops) merged.shops = { ...(prev.shops || {}), ...importedData.shops };
              if (importedData.samples) merged.samples = { ...(prev.samples || {}), ...importedData.samples };
              if (importedData.externals) merged.externals = { ...(prev.externals || {}), ...importedData.externals };
              if (importedData.platforms) merged.platforms = importedData.platforms;
              return merged;
            });
            addToast("success", "导入成功", `数据已${importMode === "merge" ? "合并" : "替换"}到系统中`, 3000, { notificationType: "importComplete" });
            ActivityLogger.add("数据导入", `${file.name} (${importMode})`);
            setActivityLogs(ActivityLogger.get().slice(0, 10));
            setConfirmDialog(null);
          },
          onCancel: () => setConfirmDialog(null),
        });
      } catch (error) {
        addToast("error", "导入失败", error.message);
      }
      setImporting(false);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const doClear = (type) => {
    const typeNames = {
      samples: "样表数据",
      externals: "全局数据",
      templates: "模板配置",
      rules: "计算规则",
    };
    const doClearAction = () => {
      if (type === "samples") Store.set((s) => ({ ...s, samples: {} }));
      else if (type === "externals") Store.set((s) => ({ ...s, externals: {} }));
      else if (type === "templates") Store.set((s) => ({ ...s, templates: {} }));
      else if (type === "rules") Store.set((s) => ({ ...s, rules: {} }));
      addToast("success", "清理成功", `已清空${typeNames[type] || type}`);
      ActivityLogger.add("数据清理", typeNames[type] || type);
      setActivityLogs(ActivityLogger.get().slice(0, 10));
      setConfirmDialog(null);
    };
    // 检查系统设置中的删除确认开关
    if (typeof AppSettings !== "undefined" && !AppSettings.shouldConfirmDelete()) {
      doClearAction();
      return;
    }
    setConfirmDialog({
      title: `确认清空${typeNames[type] || type}`,
      message: `确定要清空所有${typeNames[type] || type}吗？此操作不可撤销，建议先导出备份。`,
      type: "danger",
      onConfirm: doClearAction,
      onCancel: () => setConfirmDialog(null),
    });
  };

  const clearAllData = () => {
    const doClearAll = () => {
      Store.clear();
      localStorage.clear();
      location.reload();
    };
    if (typeof AppSettings !== "undefined" && !AppSettings.shouldConfirmDelete()) {
      doClearAll();
      return;
    }
    setConfirmDialog({
      title: "确认清空所有数据",
      message: "⚠️ 警告：此操作将清空所有数据（模板、规则、样表、全局数据等），并恢复到默认状态。此操作不可撤销！\n\n请确保已导出重要数据后再执行此操作。",
      type: "danger",
      onConfirm: doClearAll,
      onCancel: () => setConfirmDialog(null),
    });
  };

  const renderOverview = () => React.createElement("div", { className: "storage-overview" },
    React.createElement("div", { className: "storage-grid-row" },
      React.createElement("div", { className: "storage-grid-col-1" },
        React.createElement("div", { className: "card storage-storage-card" },
          React.createElement("div", { className: "card-header" },
            React.createElement("div", null,
              React.createElement("h3", null, "存储使用情况"),
              React.createElement("p", { className: "card-desc" }, "浏览器本地存储空间使用概览"),
            ),
          ),
          React.createElement("div", { className: "card-body" },
            React.createElement("div", { className: "storage-usage-visual" },
              React.createElement("div", { className: "storage-usage-circle" },
                React.createElement("svg", { viewBox: "0 0 120 120", className: "storage-circle-svg" },
                  React.createElement("circle", {
                    cx: "60", cy: "60", r: "50",
                    fill: "none",
                    stroke: "var(--color-bg-tertiary)",
                    strokeWidth: "10",
                  }),
                  React.createElement("circle", {
                    cx: "60", cy: "60", r: "50",
                    fill: "none",
                    stroke: storageInfo.isCritical ? "var(--color-danger)" : storageInfo.isWarning ? "var(--color-warning)" : "var(--color-primary)",
                    strokeWidth: "10",
                    strokeLinecap: "round",
                    strokeDasharray: `${usagePercent * 3.14} 314`,
                    transform: "rotate(-90 60 60)",
                    style: { transition: "stroke-dasharray 0.8s ease" },
                  }),
                ),
                React.createElement("div", { className: "storage-circle-text" },
                  React.createElement("div", { className: "storage-circle-percent" }, `${usagePercent}%`),
                  React.createElement("div", { className: "storage-circle-label" }, "已使用"),
                ),
              ),
              React.createElement("div", { className: "storage-usage-details" },
                React.createElement("div", { className: "storage-detail-row" },
                  React.createElement("span", { className: "storage-detail-label" }, "已使用"),
                  React.createElement("span", { className: "storage-detail-value" }, `${usedKB} KB`),
                ),
                React.createElement("div", { className: "storage-detail-row" },
                  React.createElement("span", { className: "storage-detail-label" }, "总容量"),
                  React.createElement("span", { className: "storage-detail-value" }, `${quotaKB} KB`),
                ),
                React.createElement("div", { className: "storage-detail-row" },
                  React.createElement("span", { className: "storage-detail-label" }, "剩余空间"),
                  React.createElement("span", { className: "storage-detail-value" }, `${quotaKB - usedKB} KB`),
                ),
                storageInfo.isWarning && React.createElement("div", { className: `storage-warning-box ${storageInfo.isCritical ? "critical" : "warning"}` },
                  React.createElement(Icons.AlertTriangle, null),
                  React.createElement("span", null,
                    storageInfo.isCritical
                      ? "存储空间即将用尽，请导出数据后清理"
                      : "存储空间使用较高，建议定期备份",
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      React.createElement("div", { className: "storage-grid-col-2" },
        React.createElement("div", { className: "card" },
          React.createElement("div", { className: "card-header" },
            React.createElement("h3", null, "数据统计"),
            React.createElement("p", { className: "card-desc" }, "各类数据的数量汇总"),
          ),
          React.createElement("div", { className: "card-body" },
            React.createElement("div", { className: "storage-stats-grid" },
              dataStats.map((stat, idx) => React.createElement("div", { key: idx, className: "storage-stat-item" },
                React.createElement("div", { className: `storage-stat-icon storage-stat-icon-${stat.color}` },
                  React.createElement(stat.icon, null),
                ),
                React.createElement("div", { className: "storage-stat-content" },
                  React.createElement("div", { className: "storage-stat-value" }, stat.value),
                  React.createElement("div", { className: "storage-stat-label" }, stat.label),
                ),
              )),
            ),
          ),
        ),
      ),
    ),
    React.createElement("div", { className: "storage-grid-row" },
      React.createElement("div", { className: "storage-grid-col-full" },
        React.createElement("div", { className: "card" },
          React.createElement("div", { className: "card-header" },
            React.createElement("h3", null, "数据类型明细"),
            React.createElement("p", { className: "card-desc" }, "各类数据的详细数量统计"),
          ),
          React.createElement("div", { className: "card-body" },
            React.createElement("div", { className: "data-type-grid" },
              exportTypes.filter((t) => t.id !== "all").map((type) => {
                const count = getTypeCount(type.id);
                const total = Math.max(dataStats.reduce((s, d) => s + d.value, 0), 1);
                const percent = Math.round((count / total) * 100);
                return React.createElement("div", { key: type.id, className: "data-type-card" },
                  React.createElement("div", { className: "data-type-icon", style: { background: "var(--color-primary-50)", color: "var(--color-primary)" } },
                    React.createElement(type.icon, null),
                  ),
                  React.createElement("div", { className: "data-type-info" },
                    React.createElement("div", { className: "data-type-name" }, type.name),
                    React.createElement("div", { className: "data-type-desc" }, type.desc),
                    React.createElement("div", { className: "data-type-bar-container" },
                      React.createElement("div", { className: "data-type-bar" },
                        React.createElement("div", {
                          className: "data-type-bar-fill",
                          style: { width: `${Math.min(percent, 100)}%` },
                        }),
                      ),
                      React.createElement("span", { className: "data-type-bar-percent" }, `${percent}%`),
                    ),
                  ),
                  React.createElement("div", { className: "data-type-count" }, count),
                );
              }),
            ),
          ),
        ),
      ),
    ),
  );

  const renderExport = () => React.createElement("div", { className: "storage-export" },
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", null,
          React.createElement("h3", null, "数据导出"),
          React.createElement("p", { className: "card-desc" }, "选择要导出的数据类型，导出为JSON格式备份文件"),
        ),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "form-group" },
          React.createElement("label", null, "选择导出类型"),
          React.createElement("div", { className: "export-type-grid" },
            exportTypes.map((type) => React.createElement("button", {
              key: type.id,
              className: `export-type-card ${selectedType === type.id ? "active" : ""}`,
              onClick: () => setSelectedType(type.id),
            },
              React.createElement("div", { className: "export-type-icon" },
                React.createElement(type.icon, null),
              ),
              React.createElement("div", { className: "export-type-info" },
                React.createElement("span", { className: "export-type-name" }, type.name),
                React.createElement("span", { className: "export-type-desc" }, type.desc),
                React.createElement("span", { className: "export-type-count" }, `当前 ${getTypeCount(type.id)} 条`),
              ),
              selectedType === type.id && React.createElement("div", { className: "export-type-check" },
                React.createElement(Icons.Check, null),
              ),
            )),
          ),
        ),
        React.createElement("div", { className: "form-actions" },
          React.createElement(Button, {
            type: "primary",
            onClick: handleExport,
            loading: exporting,
            style: { minWidth: 160 },
          },
            React.createElement(Icons.Download, null),
            exporting ? "导出中..." : "导出数据",
          ),
        ),
      ),
    ),
  );

  const renderImport = () => React.createElement("div", { className: "storage-import" },
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", null,
          React.createElement("h3", null, "数据导入"),
          React.createElement("p", { className: "card-desc" }, "从JSON备份文件导入数据"),
        ),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "form-group", style: { marginBottom: "20px" } },
          React.createElement("label", null, "导入模式"),
          React.createElement("div", { className: "import-mode-grid" },
            React.createElement("button", {
              className: `import-mode-card ${importMode === "merge" ? "active" : ""}`,
              onClick: () => setImportMode("merge"),
            },
              React.createElement("div", { className: "import-mode-icon" }, React.createElement(Icons.GitMerge, null)),
              React.createElement("div", { className: "import-mode-info" },
                React.createElement("span", { className: "import-mode-name" }, "合并导入"),
                React.createElement("span", { className: "import-mode-desc" }, "保留现有数据，覆盖同名字段"),
              ),
            ),
            React.createElement("button", {
              className: `import-mode-card ${importMode === "replace" ? "active" : ""}`,
              onClick: () => setImportMode("replace"),
            },
              React.createElement("div", { className: "import-mode-icon" }, React.createElement(Icons.RefreshCw, null)),
              React.createElement("div", { className: "import-mode-info" },
                React.createElement("span", { className: "import-mode-name" }, "替换导入"),
                React.createElement("span", { className: "import-mode-desc" }, "清空现有数据后完全替换"),
              ),
            ),
          ),
        ),
        React.createElement("div", { className: "upload-area", style: { minHeight: 200 } },
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
            React.createElement("div", { className: "upload-icon-lg" },
              React.createElement(Icons.Upload, null),
            ),
            React.createElement("div", { className: "upload-area-text" }, "点击选择JSON文件或拖拽到此处"),
            React.createElement("div", { className: "upload-area-desc" }, "支持从导出的备份文件恢复数据"),
          ),
        ),
        React.createElement("div", { className: "form-actions" },
          React.createElement(Button, {
            type: "primary",
            onClick: () => fileInputRef.current?.click(),
            loading: importing,
            style: { minWidth: 160 },
          },
            React.createElement(Icons.Upload, null),
            importing ? "导入中..." : "选择文件导入",
          ),
        ),
        React.createElement("div", { className: "warning-box" },
          React.createElement(Icons.AlertTriangle, null),
          React.createElement("span", null, `${importMode === "merge" ? "合并模式会覆盖同名字段" : "替换模式会清空现有数据"}，请谨慎操作。建议先导出备份。`),
        ),
      ),
    ),
  );

  const renderSync = () => React.createElement("div", { className: "storage-sync" },
    React.createElement("div", { className: "card", style: { marginBottom: "20px" } },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", null,
          React.createElement("h3", null, "同步码快速同步"),
          React.createElement("p", { className: "card-desc" }, "生成同步码，复制粘贴到另一设备即可快速同步配置"),
        ),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "grid-2", style: { marginBottom: "20px" } },
          React.createElement("div", { className: "sync-code-section" },
            React.createElement("div", { className: "sync-code-title" },
              React.createElement("span", { className: "sync-code-icon" }, React.createElement(Icons.Link, null)),
              " 生成同步码",
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "同步类型"),
              React.createElement("select", {
                className: "select",
                value: syncCodeType,
                onChange: (e) => setSyncCodeType(e.target.value),
              },
                React.createElement("option", { value: "config" }, "仅配置（规则/模板/店铺等）"),
                React.createElement("option", { value: "accounts" }, "账号数据"),
                React.createElement("option", { value: "all" }, "全部数据"),
              ),
            ),
            React.createElement(Button, { type: "primary", onClick: generateSyncCode, style: { width: "100%", marginBottom: "12px" } },
              React.createElement(Icons.FileText, null), " 生成同步码",
            ),
            syncCode && React.createElement("div", { className: "sync-code-result" },
              React.createElement("textarea", {
                className: "input",
                value: syncCode,
                readOnly: true,
                style: { width: "100%", minHeight: "100px", fontFamily: "monospace", fontSize: "12px", resize: "vertical" },
              }),
              React.createElement(Button, { type: "primary", variant: "outline", onClick: copySyncCode, style: { marginTop: "8px", width: "100%" } },
                React.createElement(Icons.Copy, null), " 复制同步码",
              ),
            ),
          ),
          React.createElement("div", { className: "sync-code-section" },
            React.createElement("div", { className: "sync-code-title" },
              React.createElement("span", { className: "sync-code-icon" }, React.createElement(Icons.Download, null)),
              " 导入同步码",
            ),
            syncCodeType === "accounts" && React.createElement("div", { className: "form-item", style: { marginBottom: "12px" } },
              React.createElement("label", { className: "form-label" }, "账号导入模式"),
              React.createElement("select", {
                className: "select",
                value: accountImportMode,
                onChange: (e) => setAccountImportMode(e.target.value),
              },
                React.createElement("option", { value: "merge" }, "合并导入（保留现有账号，添加新账号）"),
                React.createElement("option", { value: "replace" }, "替换导入（替换所有账号）"),
              ),
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "粘贴同步码"),
              React.createElement("textarea", {
                className: "input",
                value: syncCodeInput,
                onChange: (e) => setSyncCodeInput(e.target.value),
                placeholder: "在此粘贴同步码...",
                style: { width: "100%", minHeight: "100px", fontFamily: "monospace", fontSize: "12px", resize: "vertical" },
              }),
            ),
            React.createElement(Button, { type: "success", onClick: applySyncCode, style: { width: "100%" } },
              React.createElement(Icons.CheckCircle, null), " 应用同步码",
            ),
          ),
        ),
        React.createElement("div", { className: "step-desc" },
          React.createElement(Icons.Info, null),
          " 提示：同步码为 Base64 编码格式，配置同步码较短，全部数据同步码可能很长。大数据量建议使用文件导出导入。",
        ),
      ),
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", null,
          React.createElement("h3", null, "跨设备数据同步"),
          React.createElement("p", { className: "card-desc" }, "在不同设备间保持数据一致"),
        ),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "sync-info-box" },
          React.createElement("div", { className: "sync-info-icon" }, React.createElement(Icons.Info, null)),
          React.createElement("div", { className: "sync-info-content" },
            React.createElement("div", { className: "sync-info-title" }, "关于数据存储"),
            React.createElement("div", { className: "sync-info-desc" },
              "本系统使用浏览器本地存储（IndexedDB 主存储 + localStorage 缓存）双层持久化方案，容量充足，刷新页面或重新打开浏览器后数据依然存在。数据存储在当前浏览器中，不会自动上传到云端。要在不同设备间同步数据，请使用以下方法：",
            ),
          ),
        ),
        React.createElement("div", { className: "sync-methods" },
          React.createElement("div", { className: "sync-method-card" },
            React.createElement("div", { className: "sync-method-number" }, "1"),
            React.createElement("div", { className: "sync-method-content" },
              React.createElement("div", { className: "sync-method-title" }, "导出备份文件"),
              React.createElement("div", { className: "sync-method-desc" }, "在当前设备点击「数据导出」标签，选择「全部数据」导出为 JSON 文件，保存到可跨设备访问的位置（如网盘、U盘等）。"),
              React.createElement(Button, { type: "primary", variant: "outline", onClick: () => { setActiveTab("export"); setSelectedType("all"); }, style: { marginTop: "12px" } }, "前往导出"),
            ),
          ),
          React.createElement("div", { className: "sync-method-card" },
            React.createElement("div", { className: "sync-method-number" }, "2"),
            React.createElement("div", { className: "sync-method-content" },
              React.createElement("div", { className: "sync-method-title" }, "在另一设备导入"),
              React.createElement("div", { className: "sync-method-desc" }, "在目标设备打开本系统，点击「数据导入」标签，选择导出的 JSON 文件，选择「合并导入」或「替换导入」模式完成同步。"),
              React.createElement(Button, { type: "primary", variant: "outline", onClick: () => setActiveTab("import"), style: { marginTop: "12px" } }, "前往导入"),
            ),
          ),
          React.createElement("div", { className: "sync-method-card" },
            React.createElement("div", { className: "sync-method-number" }, "3"),
            React.createElement("div", { className: "sync-method-content" },
              React.createElement("div", { className: "sync-method-title" }, "定期备份习惯"),
              React.createElement("div", { className: "sync-method-desc" }, "建议每次修改配置后导出备份，确保数据安全。系统也会自动在本地创建备份，防止意外丢失。"),
            ),
          ),
        ),
        React.createElement("div", { className: "sync-tips" },
          React.createElement("div", { className: "sync-tips-title" }, React.createElement(Icons.AlertTriangle, { style: { width: 16, height: 16 } }), " 注意事项"),
          React.createElement("ul", { className: "sync-tips-list" },
            React.createElement("li", null, "不同浏览器（Chrome、Edge、Firefox）的数据相互独立，不共享"),
            React.createElement("li", null, "清除浏览器缓存可能导致本地数据丢失，请提前导出备份"),
            React.createElement("li", null, "合并导入会保留现有数据并覆盖同名字段，替换导入会清空后导入"),
            React.createElement("li", null, "导入数据前建议先导出当前数据作为备份"),
          ),
        ),
      ),
    ),
  );

  const renderCleanup = () => React.createElement("div", { className: "storage-cleanup" },
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "card-header" },
        React.createElement("div", null,
          React.createElement("h3", null, "数据清理"),
          React.createElement("p", { className: "card-desc" }, "清理不需要的数据以释放存储空间"),
        ),
      ),
      React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "cleanup-list" },
          [
            { id: "samples", name: "清理样表数据", desc: "删除所有已上传的样表文件数据", icon: Icons.Database, count: getTypeCount("samples") },
            { id: "externals", name: "清理全局数据", desc: "删除所有全局数据配置", icon: Icons.Server, count: getTypeCount("externals") },
            { id: "rules", name: "清理计算规则", desc: "删除所有字段的计算规则配置", icon: Icons.Calculator, count: getTypeCount("rules") },
            { id: "templates", name: "清理模板配置", desc: "删除所有平台的模板配置", icon: Icons.FileSpreadsheet, count: getTypeCount("templates") },
          ].map((item) => React.createElement("div", { key: item.id, className: "cleanup-item" },
            React.createElement("div", { className: "cleanup-icon" },
              React.createElement(item.icon, null),
            ),
            React.createElement("div", { className: "cleanup-info" },
              React.createElement("div", { className: "cleanup-name" }, item.name),
              React.createElement("div", { className: "cleanup-desc" }, `${item.desc}（当前 ${item.count} 条）`),
            ),
            React.createElement(Button, {
              type: "danger",
              variant: "outline",
              onClick: () => doClear(item.id),
              disabled: item.count === 0,
            }, "清理"),
          )),
        ),
        React.createElement("div", { className: "cleanup-danger-zone" },
          React.createElement("div", { className: "cleanup-danger-title" },
            React.createElement(Icons.AlertTriangle, { style: { color: "var(--color-danger)" } }),
            React.createElement("span", null, "危险操作"),
          ),
          React.createElement("div", { className: "cleanup-danger-desc" },
            "初始化系统将清空所有数据，恢复到默认状态。此操作不可撤销！",
          ),
          React.createElement(Button, {
            type: "danger",
            onClick: clearAllData,
          }, React.createElement(Icons.RefreshCw, null), " 初始化系统"),
        ),
      ),
    ),
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "export": return renderExport();
      case "import": return renderImport();
      case "sync": return renderSync();
      case "cleanup": return renderCleanup();
      default: return renderOverview();
    }
  };

  return React.createElement("div", { className: "storage-page fade-in" },
    React.createElement("div", { className: "page-header" },
      React.createElement("div", { className: "page-title" },
        React.createElement("h1", null, "数据管理"),
        React.createElement("p", null, "管理系统数据，支持导出、导入、跨设备同步和清理。当前版本：" + (window.AppVersion || "czp-1.15.0") + "，支持 IndexedDB 双层持久化"),
      ),
    ),
    React.createElement("div", { className: "storage-tabs" },
      tabs.map((tab) => React.createElement("button", {
        key: tab.id,
        className: `storage-tab ${activeTab === tab.id ? "active" : ""}`,
        onClick: () => setActiveTab(tab.id),
      },
        React.createElement("span", { className: "storage-tab-icon" }, React.createElement(tab.icon, null)),
        React.createElement("span", { className: "storage-tab-label" }, tab.name),
      )),
    ),
    React.createElement("div", { className: "storage-content" }, renderContent()),
    confirmDialog && React.createElement(ConfirmModal, {
      title: confirmDialog.title,
      message: confirmDialog.message,
      type: confirmDialog.type,
      onConfirm: confirmDialog.onConfirm,
      onCancel: confirmDialog.onCancel,
    }),
  );
};
