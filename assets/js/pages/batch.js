const BatchPage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const [batchFiles, setBatchFiles] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcProgress, setCalcProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [expandedShops, setExpandedShops] = useState(new Set());
  const fileInputRef = useRef(null);
  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const template = state.templates[currentPlatform];
  const rules = state.rules[currentPlatform] || {};
  const shops = platform?.shops || [];
  const samples = state.samples[currentPlatform] || [];

  const toggleShopExpand = (shopId) => {
    setExpandedShops((prev) => {
      const next = new Set(prev);
      if (next.has(shopId)) {
        next.delete(shopId);
      } else {
        next.add(shopId);
      }
      return next;
    });
  };

  const fileGroups = BatchUtils.groupFilesByShop(batchFiles);

  const assignShop = (fileId, shopId) => {
    const shop = shops.find((s) => s.id === shopId);
    setBatchFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              detectedShop: shop || null,
              status: shop ? "matched" : "unmatched",
            }
          : f,
      ),
    );
  };

  const removeFile = (fileId) => {
    setBatchFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const toggleSelected = (fileId) => {
    setBatchFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, selected: !f.selected } : f)),
    );
  };

  const toggleShopSelected = (shopId) => {
    const group = fileGroups[shopId];
    if (!group) return;
    const allSelected = group.every((f) => f.selected);
    setBatchFiles((prev) =>
      prev.map((f) => {
        if (f.detectedShop?.id === shopId) {
          return { ...f, selected: !allSelected };
        }
        return f;
      }),
    );
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = [];
    const existingNames = batchFiles.map(f => f.displayName || f.fileName);
    
    for (const file of files) {
      try {
        const parsed = await ExcelUtils.parse(file);
        const shop = BatchUtils.detectShop(file.name, parsed, shops);
        const tableType = BatchUtils.detectTableType(file.name, parsed);
        const dateInfo = BatchUtils.extractDateFromFileName(file.name);
        const displayName = BatchUtils.generateUniqueTableName(file.name, parsed, shop, existingNames);

        newFiles.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name,
          displayName,
          fileSize: file.size,
          data: parsed,
          detectedShop: shop,
          tableType: tableType.type,
          tableTypeIcon: tableType.icon,
          tableTypeColor: tableType.color,
          date: dateInfo?.date || null,
          monthLabel: dateInfo?.monthLabel || null,
          yearMonthLabel: dateInfo?.yearMonthLabel || null,
          status: shop ? "matched" : "unmatched",
          selected: true,
        });
        
        existingNames.push(displayName);
      } catch (err) {
        newFiles.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name,
          displayName: file.name,
          fileSize: file.size,
          error: err.message,
          status: "error",
          selected: false,
        });
      }
    }
    setBatchFiles((prev) => [...prev, ...newFiles]);
    const matched = newFiles.filter((f) => f.status === "matched").length;
    const unmatched = newFiles.filter((f) => f.status === "unmatched").length;
    if (matched > 0)
      addToast(
        "success",
        "识别完成",
        `成功识别 ${matched} 个店铺，${unmatched} 个未识别`,
      );
  };

  const runBatchCalc = async () => {
    const selected = batchFiles.filter(
      (f) => f.selected && f.status !== "error",
    );
    if (!selected.length) {
      addToast("warning", "请先选择文件", "至少选择一个要计算的文件");
      return;
    }
    if (!template) {
      addToast("warning", "缺少模板", "请先在模板中心上传利润表模板");
      return;
    }
    const fields = template.parseResult?.fields || [];
    const configured = fields.filter(
      (f) => (rules[f.id]?.steps || []).length > 0,
    );
    const unconfigured = fields.filter(
      (f) => !(rules[f.id]?.steps || []).length > 0,
    );
    if (configured.length === 0) {
      addToast("warning", "缺少计算规则", "请先在计算规则页面配置字段规则");
      return;
    }
    if (unconfigured.length > 0) {
      addToast(
        "warning",
        "存在未配置字段",
        `以下字段尚未配置计算规则：${unconfigured.map((f) => f.name).join(", ")}，计算时这些字段将显示为空`,
      );
    }
    const missingSamples = BatchUtils.getMissingSampleTables(rules, samples);
    if (missingSamples.length > 0) {
      addToast(
        "warning",
        "缺少样本数据",
        `计算规则引用了以下未上传的样本表：${missingSamples.join(", ")}，请先在样表管理页面上传`,
      );
      return;
    }
    setIsCalculating(true);
    setCalcProgress(0);
    const calcResults = [];
    for (let i = 0; i < selected.length; i++) {
      const fileItem = selected[i];
      try {
        const firstSheet = Object.values(fileItem.data.sheets)[0];
        if (!firstSheet) continue;
        const tables = [
          {
            id: "main",
            rows: firstSheet.rows,
            headers: firstSheet.headers,
            originalName: fileItem.fileName,
          },
          ...samples.map((s, idx) => ({
            id: s.id || `sample_${idx}`,
            name: s.alias || s.fileName,
            originalName: s.fileName,
            headers: s.sheets[Object.keys(s.sheets)[0]]?.headers || [],
            rows: s.sheets[Object.keys(s.sheets)[0]]?.rows || [],
          })),
        ];
        const resultValues = {};
        fields.forEach((field) => {
          const rule = rules[field.id];
          if (rule?.steps?.length) {
            const adaptedRule = {
              ...rule,
              steps: rule.steps.map((step) => {
                if (step.type === "source") {
                  const cfg = { ...step.config };
                  if (cfg.table && cfg.table.startsWith("sample_")) {
                    cfg.table = "main";
                  }
                  if (cfg.tables && cfg.tables.length > 0) {
                    cfg.tables = cfg.tables.map((tid) =>
                      tid.startsWith("sample_") ? "main" : tid
                    );
                  }
                  return { ...step, config: cfg };
                }
                return step;
              }),
            };
            const val = CalcEngine.exec(adaptedRule, tables, {
              shopName: fileItem.detectedShop?.name || "",
              fieldSemanticType: field.semanticType || "",
              fieldType: field.type || "",
              fileName: fileItem.fileName,
              originalName: fileItem.fileName,
              externals: state.externals || [],
            });
            resultValues[field.id] = val;
          }
        });
        calcResults.push({
          fileId: fileItem.id,
          fileName: fileItem.fileName,
          shop: fileItem.detectedShop,
          values: resultValues,
          status: "success",
        });
      } catch (err) {
        calcResults.push({
          fileId: fileItem.id,
          fileName: fileItem.fileName,
          shop: fileItem.detectedShop,
          error: err.message,
          status: "error",
        });
      }
      setCalcProgress(Math.round(((i + 1) / selected.length) * 100));
    }
    setResults(calcResults);
    setIsCalculating(false);
    const success = calcResults.filter((r) => r.status === "success").length;
    const shopNames = new Set(
      calcResults.filter((r) => r.shop?.name).map((r) => r.shop.name),
    );
    const shopCount = shopNames.size || calcResults.length;
    addToast(
      "success",
      "计算完成",
      `成功计算 ${success}/${calcResults.length} 个文件，共 ${shopCount} 个店铺`,
      5000,
      { notificationType: "calculationComplete" },
    );
    Store.set((s) => ({
      ...s,
      calcHistory: [
        {
          id: Date.now(),
          time: new Date().toISOString(),
          platform: platform?.name,
          shopCount: shopCount,
          successCount: success,
          status: success === calcResults.length ? "success" : "partial",
          results: calcResults,
        },
        ...(s.calcHistory || []),
      ].slice(0, 100),
    }));
  };

  const downloadResults = () => {
    if (!template || results.length === 0) return;
    const fields = template.parseResult?.fields || [];
    const successResults = results.filter((r) => r.status === "success");
    const wb = XLSX.utils.book_new();
    if (template.aoa && successResults.length > 0) {
      successResults.forEach((r, idx) => {
        const filledAoa = template.aoa.map((row) => [...row]);
        fields.forEach((field) => {
          if (field.row !== undefined && field.col !== undefined) {
            const v = r.values[field.id];
            const val =
              v !== null && v !== undefined
                ? typeof v === "object" && v.val !== undefined
                  ? v.val
                  : v
                : "";
            if (
              filledAoa[field.row] &&
              filledAoa[field.row][field.col] !== undefined
            ) {
              filledAoa[field.row][field.col] = val;
            }
          }
        });
        const ws = XLSX.utils.aoa_to_sheet(filledAoa);
        const sheetName = r.shop?.name
          ? `利润表_${r.shop.name}`
          : `利润表_${idx + 1}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
    } else {
      const aoa = [fields.map((f) => f.name)];
      successResults.forEach((r) => {
        const row = fields.map((f) => {
          const v = r.values[f.id];
          if (v === null || v === undefined) return "";
          if (typeof v === "object" && v.val !== undefined) return v.val;
          return v;
        });
        aoa.push(row);
      });
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, "利润表");
    }
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const monthStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit" }).replace(/\//g, "-");
    ExcelUtils.download(
      buf,
      `${platform?.name}_${monthStr}_利润表.xlsx`,
    );
    addToast("success", "下载成功", "利润表已生成");
  };

  const downloadSingleResult = (result) => {
    if (!template) return;
    const fields = template.parseResult?.fields || [];
    const wb = XLSX.utils.book_new();
    if (template.aoa) {
      const filledAoa = template.aoa.map((row) => [...row]);
      fields.forEach((field) => {
        if (field.row !== undefined && field.col !== undefined) {
          const v = result.values[field.id];
          const val =
            v !== null && v !== undefined
              ? typeof v === "object" && v.val !== undefined
                ? v.val
                : v
              : "";
          if (
            filledAoa[field.row] &&
            filledAoa[field.row][field.col] !== undefined
          ) {
            filledAoa[field.row][field.col] = val;
          }
        }
      });
      const ws = XLSX.utils.aoa_to_sheet(filledAoa);
      const sheetName = result.shop?.name
        ? `利润表_${result.shop.name}`
        : "利润表";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } else {
      const aoa = [fields.map((f) => f.name)];
      const row = fields.map((f) => {
        const v = result.values[f.id];
        if (v === null || v === undefined) return "";
        if (typeof v === "object" && v.val !== undefined) return v.val;
        return v;
      });
      aoa.push(row);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, "利润表");
    }
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const shopName = result.shop?.name || "未知店铺";
    const monthStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit" }).replace(/\//g, "-");
    ExcelUtils.download(
      buf,
      `${shopName}_${monthStr}_利润表.xlsx`,
    );
  };

  const [batchTab, setBatchTab] = useState(() => localStorage.getItem("batch_page_active_tab") || "calc");
  useEffect(() => {
    localStorage.setItem("batch_page_active_tab", batchTab);
  }, [batchTab]);

  const renderUploadArea = () => {
    if (batchFiles.length > 0) return null;
    
    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: "upload-area",
        style: { padding: "48px 24px", margin: "20px 0" },
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
        "\u70B9\u51FB\u4E0A\u4F20\u5E97\u94FA\u6570\u636E\u6587\u4EF6",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "upload-hint" },
        "\u652F\u6301 .xlsx / .xls / .csv / .zip \u683C\u5F0F\uFF0C\u53EF\u6279\u91CF\u4E0A\u4F20\u591A\u4E2A\u6587\u4EF6",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { marginTop: 8 } },
        /*#__PURE__*/ React.createElement(
          "button",
          {
            className: "btn btn-ghost",
            style: { fontSize: 12 },
            onClick: () => document.getElementById("batch-folder-input")?.click(),
          },
          /*#__PURE__*/ React.createElement(Icons.Folder, null),
          " 或选择文件夹上传",
        ),
      ),
      /*#__PURE__*/ React.createElement("input", {
        ref: fileInputRef,
        type: "file",
        accept: ".xlsx,.xls,.csv,.zip",
        multiple: true,
        onChange: handleFileUpload,
        style: { display: "none" },
      }),
      /*#__PURE__*/ React.createElement("input", {
        id: "batch-folder-input",
        type: "file",
        accept: ".xlsx,.xls,.csv,.zip",
        multiple: true,
        onChange: handleFileUpload,
        style: { display: "none" },
        webkitdirectory: "",
        directory: "",
      }),
    );
  };

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "batch-page fade-in" },
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
            /*#__PURE__*/ React.createElement(Icons.Calculator, null),
            "\u6279\u91CF\u8BA1\u7B97",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card-desc" },
            "\u4E0A\u4F20\u5E97\u94FA\u6570\u636E\uFF0C\u7CFB\u7EDF\u81EA\u52A8\u8BC6\u522B\u5E97\u94FA\u5E76\u751F\u6210\u5229\u6DA6\u8868",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "section-tabs" },
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: `section-tab ${batchTab === "calc" ? "active" : ""}`,
              onClick: () => setBatchTab("calc"),
            },
            /*#__PURE__*/ React.createElement(Icons.Calculator, null),
            "\u6279\u91CF\u8BA1\u7B97",
          ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: `section-tab ${batchTab === "history" ? "active" : ""}`,
              onClick: () => setBatchTab("history"),
            },
            /*#__PURE__*/ React.createElement(Icons.History, null),
            "\u8BA1\u7B97\u8BB0\u5F55",
          ),
        ),
      ),
      batchTab === "calc" &&
        /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          renderUploadArea(),
          /*#__PURE__*/ React.createElement(BatchCalcView, {
            batchFiles,
            fileGroups,
            shops,
            expandedShops,
            isCalculating,
            calcProgress,
            results,
            template,
            toggleShopExpand,
            toggleSelected,
            toggleShopSelected,
            removeFile,
            assignShop,
            runBatchCalc,
            downloadResults,
            downloadSingleResult,
          }),
        ),
      batchTab === "history" &&
        /*#__PURE__*/ React.createElement(BatchHistoryView, {
          calcHistory: state.calcHistory,
          template,
          platform,
          addToast,
        }),
    ),
  );
};