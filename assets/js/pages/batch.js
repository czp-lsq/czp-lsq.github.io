// BatchPage - 批量计算页面组件
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
  const groupFilesByShop = () => {
    const groups = {};
    const unmatched = [];
    batchFiles.forEach((f) => {
      if (f.status === "error") {
        if (!groups._error) groups._error = [];
        groups._error.push(f);
      } else if (f.detectedShop) {
        if (!groups[f.detectedShop.id]) groups[f.detectedShop.id] = [];
        groups[f.detectedShop.id].push(f);
      } else {
        unmatched.push(f);
      }
    });
    if (unmatched.length > 0) groups._unmatched = unmatched;
    return groups;
  };
  const detectShop = (fileName, fileData) => {
    const baseName = fileName.replace(/\.[^.]+$/, "").toLowerCase();
    const normalizedBaseName = baseName
      .replace(/[\s_\-\.]+/g, "")
      .replace(/利润表|利润|报表|明细|账单|订单|销售|数据/g, "");
    for (const shop of shops) {
      const shopName = shop.name.toLowerCase();
      const normalizedShopName = shopName.replace(/[\s_\-\.]+/g, "");
      if (normalizedBaseName.includes(normalizedShopName) || normalizedShopName.includes(normalizedBaseName)) {
        return shop;
      }
      if (baseName === normalizedShopName || normalizedShopName === normalizedBaseName) {
        return shop;
      }
      const shortShopName = normalizedShopName.replace(/(旗舰店|专卖店|专营店|官方店|店铺|店)$/, "");
      if (shortShopName.length >= 2 && normalizedBaseName.includes(shortShopName)) {
        return shop;
      }
    }
    const sheetNames = Object.keys(fileData.sheets || {});
    for (const sheetName of sheetNames) {
      const lowerSheet = sheetName.toLowerCase();
      for (const shop of shops) {
        if (lowerSheet.includes(shop.name.toLowerCase())) {
          return shop;
        }
      }
    }
    const firstSheet = Object.values(fileData.sheets || {})[0];
    if (firstSheet?.rows) {
      for (let i = 0; i < Math.min(10, firstSheet.rows.length); i++) {
        const row = firstSheet.rows[i];
        const rowText = Object.values(row)
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        for (const shop of shops) {
          if (rowText.includes(shop.name.toLowerCase())) {
            return shop;
          }
        }
      }
    }
    if (firstSheet?.headers) {
      const headerText = firstSheet.headers.join(" ").toLowerCase();
      for (const shop of shops) {
        if (headerText.includes(shop.name.toLowerCase())) {
          return shop;
        }
      }
    }
    return null;
  };
  const getMissingSampleTables = () => {
    const usedTables = new Set();
    const allRules = rules || {};
    Object.values(allRules).forEach((rule) => {
      (rule.steps || []).forEach((step) => {
        if (step.config?.table) {
          usedTables.add(step.config.table);
        }
      });
    });
    const missing = [];
    usedTables.forEach((tableId) => {
      const sampleExists = samples.some(
        (s) =>
          s.id === tableId ||
          (tableId.startsWith("sample_") &&
            samples[parseInt(tableId.replace("sample_", ""))]),
      );
      if (!sampleExists) {
        const sampleInfo = samples.find((s) => s.id === tableId);
        missing.push(
          sampleInfo ? sampleInfo.alias || sampleInfo.fileName : tableId,
        );
      }
    });
    return missing;
  };
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = [];
    for (const file of files) {
      try {
        const parsed = await ExcelUtils.parse(file);
        const shop = detectShop(file.name, parsed);
        newFiles.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name,
          fileSize: file.size,
          data: parsed,
          detectedShop: shop,
          status: shop ? "matched" : "unmatched",
          selected: true,
        });
      } catch (err) {
        newFiles.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name,
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
    const group = groupFilesByShop()[shopId];
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
    const missingSamples = getMissingSampleTables();
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
            const val = CalcEngine.exec(rule, tables, {
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
  const fileGroups = groupFilesByShop();
  const matchedShopCount = Object.keys(fileGroups).filter(
    (k) => k !== "_error" && k !== "_unmatched",
  ).length;
  const [batchTab, setBatchTab] = useState(() => localStorage.getItem("batch_page_active_tab") || "calc");
  useEffect(() => {
    localStorage.setItem("batch_page_active_tab", batchTab);
  }, [batchTab]);
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
          "div",
          { className: "card-body" },
          isCalculating &&
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
                  "\u6B63\u5728\u8BA1\u7B97...",
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  { style: { fontSize: 12, color: "var(--color-text-tertiary)" } },
                  calcProgress,
                  "%",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "progress-bar" },
                /*#__PURE__*/ React.createElement("div", {
                  className: "progress-fill",
                  style: { width: `${calcProgress}%` },
                }),
              ),
            ),
          batchFiles.length === 0
            ? /*#__PURE__*/ React.createElement(
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
                /*#__PURE__*/ React.createElement("input", {
                  ref: fileInputRef,
                  type: "file",
                  accept: ".xlsx,.xls,.csv,.zip",
                  multiple: true,
                  onChange: handleFileUpload,
                  style: { display: "none" },
                }),
              )
            : /*#__PURE__*/ React.createElement(
                React.Fragment,
                null,
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    },
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { style: { fontSize: 13, color: "var(--color-text-secondary)" } },
                    "\u5DF2\u4E0A\u4F20 ",
                    batchFiles.length,
                    " \u4E2A\u6587\u4EF6",
                    /*#__PURE__*/ React.createElement(
                      "span",
                      {
                        style: { color: "var(--color-text-tertiary)", marginLeft: 8 },
                      },
                      "(\u5DF2\u8BC6\u522B ",
                      matchedShopCount,
                      " \u4E2A\u5E97\u94FA)",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    Button,
                    {
                      size: "sm",
                      onClick: () => fileInputRef.current?.click(),
                    },
                    /*#__PURE__*/ React.createElement(Icons.Plus, null),
                    " \u7EE7\u7EED\u6DFB\u52A0",
                  ),
                  /*#__PURE__*/ React.createElement("input", {
                    ref: fileInputRef,
                    type: "file",
                    accept: ".xlsx,.xls,.csv,.zip",
                    multiple: true,
                    onChange: handleFileUpload,
                    style: { display: "none" },
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "data-table-container",
                    style: { marginBottom: 16 },
                  },
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
                          { style: { width: 40 } },
                          /*#__PURE__*/ React.createElement("input", {
                            type: "checkbox",
                            checked:
                              batchFiles.length > 0 &&
                              batchFiles.every((f) => f.selected),
                            onChange: () =>
                              setBatchFiles((prev) =>
                                prev.map((f) => ({
                                  ...f,
                                  selected: !prev.every((x) => x.selected),
                                })),
                              ),
                          }),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "th",
                          null,
                          "\u5E97\u94FA",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "th",
                          null,
                          "\u6587\u4EF6\u6570\u91CF",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "th",
                          null,
                          "\u6570\u636E\u91CF",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "th",
                          { style: { width: 100 } },
                          "\u72B6\u6001",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "th",
                          { style: { width: 80 } },
                          "\u64CD\u4F5C",
                        ),
                      ),
                    ),
                    /*#__PURE__*/ React.createElement(
                      "tbody",
                      null,
                      Object.entries(fileGroups).map(([shopId, files]) => {
                        if (shopId === "_error") {
                          return /*#__PURE__*/ React.createElement(
                            "tr",
                            { key: "_error" },
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement("input", {
                                type: "checkbox",
                                checked: files.every((f) => f.selected),
                                onChange: () =>
                                  files.forEach((f) => toggleSelected(f.id)),
                              }),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "danger" },
                                "\u89E3\u6790\u5931\u8D25",
                              ),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              files.length,
                            ),
                            /*#__PURE__*/ React.createElement("td", null, "-"),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "danger" },
                                "\u9519\u8BEF",
                              ),
                            ),
                            /*#__PURE__*/ React.createElement("td", null, "-"),
                          );
                        }
                        if (shopId === "_unmatched") {
                          return /*#__PURE__*/ React.createElement(
                            "tr",
                            { key: "_unmatched" },
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement("input", {
                                type: "checkbox",
                                checked: files.every((f) => f.selected),
                                onChange: () =>
                                  files.forEach((f) => toggleSelected(f.id)),
                              }),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "warning" },
                                "\u5F85\u5339\u914D",
                              ),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              files.length,
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              files.reduce(
                                (sum, f) =>
                                  sum +
                                  (f.data
                                    ? Object.values(f.data.sheets)[0]?.rows
                                        ?.length || 0
                                    : 0),
                                0,
                              ),
                              " \u884C",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "warning" },
                                "\u672A\u8BC6\u522B",
                              ),
                            ),
                            /*#__PURE__*/ React.createElement("td", null, "-"),
                          );
                        }
                        const shop = shops.find((s) => s.id === shopId);
                        const isExpanded = expandedShops.has(shopId);
                        const totalRows = files.reduce(
                          (sum, f) =>
                            sum +
                            (f.data
                              ? Object.values(f.data.sheets)[0]?.rows?.length ||
                                0
                              : 0),
                          0,
                        );
                        return /*#__PURE__*/ React.createElement(
                          React.Fragment,
                          null,
                          /*#__PURE__*/ React.createElement(
                            "tr",
                            {
                              key: shopId,
                              style: { background: "var(--color-bg-tertiary)" },
                            },
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement("input", {
                                type: "checkbox",
                                checked: files.every((f) => f.selected),
                                onChange: () => toggleShopSelected(shopId),
                              }),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  onClick: () => toggleShopExpand(shopId),
                                  style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "inherit",
                                  },
                                },
                                /*#__PURE__*/ React.createElement(
                                  Icons.ChevronRight,
                                  {
                                    style: {
                                      transform: isExpanded
                                        ? "rotate(90deg)"
                                        : "none",
                                      transition: "transform 0.2s",
                                    },
                                  },
                                ),
                                /*#__PURE__*/ React.createElement(
                                  Tag,
                                  { type: "success" },
                                  shop?.name || "未知店铺",
                                ),
                              ),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              files.length,
                              " \u4E2A\u6587\u4EF6",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              totalRows.toLocaleString(),
                              " \u884C",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "td",
                              null,
                              /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "success" },
                                "\u5DF2\u8BC6\u522B",
                              ),
                            ),
                            /*#__PURE__*/ React.createElement("td", null, "-"),
                          ),
                          isExpanded &&
                            files.map((file) =>
                              /*#__PURE__*/ React.createElement(
                                "tr",
                                { key: file.id },
                                /*#__PURE__*/ React.createElement(
                                  "td",
                                  null,
                                  /*#__PURE__*/ React.createElement("input", {
                                    type: "checkbox",
                                    checked: file.selected,
                                    onChange: () => toggleSelected(file.id),
                                  }),
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "td",
                                  { style: { paddingLeft: 32 } },
                                  /*#__PURE__*/ React.createElement(
                                    "div",
                                    {
                                      style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      },
                                    },
                                    /*#__PURE__*/ React.createElement(
                                      Icons.FileSpreadsheet,
                                      null,
                                    ),
                                    /*#__PURE__*/ React.createElement(
                                      "span",
                                      {
                                        style: {
                                          fontWeight: 500,
                                          fontSize: 13,
                                        },
                                      },
                                      file.fileName,
                                    ),
                                  ),
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "td",
                                  null,
                                  "-",
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "td",
                                  {
                                    style: {
                                      fontSize: 12,
                                      color: "var(--color-text-tertiary)",
                                    },
                                  },
                                  file.data
                                    ? `${Object.values(file.data.sheets)[0]?.rows?.length || 0} 行`
                                    : "-",
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "td",
                                  null,
                                  /*#__PURE__*/ React.createElement(
                                    Tag,
                                    { type: "success" },
                                    "\u5DF2\u8BC6\u522B",
                                  ),
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "td",
                                  null,
                                  /*#__PURE__*/ React.createElement(
                                    "button",
                                    {
                                      className: "btn-link danger",
                                      onClick: () => removeFile(file.id),
                                    },
                                    /*#__PURE__*/ React.createElement(
                                      Icons.Trash,
                                      null,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        );
                      }),
                    ),
                  ),
                ),
                fileGroups._unmatched &&
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "card", style: { marginBottom: 16 } },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      {
                        className: "card-header",
                        style: { padding: "12px 16px" },
                      },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "card-title", style: { fontSize: 14 } },
                        /*#__PURE__*/ React.createElement(Icons.Warning, null),
                        "\u672A\u8BC6\u522B\u6587\u4EF6\uFF08\u8BF7\u624B\u52A8\u5206\u914D\u5E97\u94FA\uFF09",
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
                            /*#__PURE__*/ React.createElement(
                              "th",
                              { style: { width: 40 } },
                              /*#__PURE__*/ React.createElement("input", {
                                type: "checkbox",
                                checked: fileGroups._unmatched.every(
                                  (f) => f.selected,
                                ),
                                onChange: () =>
                                  fileGroups._unmatched.forEach((f) =>
                                    toggleSelected(f.id),
                                  ),
                              }),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "th",
                              null,
                              "\u6587\u4EF6\u540D",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "th",
                              null,
                              "\u9009\u62E9\u5E97\u94FA",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "th",
                              null,
                              "\u6570\u636E\u91CF",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "th",
                              null,
                              "\u64CD\u4F5C",
                            ),
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "tbody",
                          null,
                          fileGroups._unmatched.map((file) =>
                            /*#__PURE__*/ React.createElement(
                              "tr",
                              { key: file.id },
                              /*#__PURE__*/ React.createElement(
                                "td",
                                null,
                                /*#__PURE__*/ React.createElement("input", {
                                  type: "checkbox",
                                  checked: file.selected,
                                  onChange: () => toggleSelected(file.id),
                                }),
                              ),
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
                                  /*#__PURE__*/ React.createElement(
                                    Icons.FileSpreadsheet,
                                    null,
                                  ),
                                  /*#__PURE__*/ React.createElement(
                                    "span",
                                    {
                                      style: { fontWeight: 500, fontSize: 13 },
                                    },
                                    file.fileName,
                                  ),
                                ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "td",
                                null,
                                /*#__PURE__*/ React.createElement(
                                  "select",
                                  {
                                    className: "select",
                                    style: {
                                      fontSize: 12,
                                      padding: "4px 8px",
                                      minWidth: 120,
                                    },
                                    value: file.detectedShop?.id || "",
                                    onChange: (e) =>
                                      assignShop(file.id, e.target.value),
                                  },
                                  /*#__PURE__*/ React.createElement(
                                    "option",
                                    { value: "" },
                                    "\u9009\u62E9\u5E97\u94FA",
                                  ),
                                  shops.map((s) =>
                                    /*#__PURE__*/ React.createElement(
                                      "option",
                                      { key: s.id, value: s.id },
                                      s.name,
                                    ),
                                  ),
                                ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "td",
                                {
                                  style: {
                                    fontSize: 12,
                                    color: "var(--color-text-tertiary)",
                                  },
                                },
                                file.data
                                  ? `${Object.values(file.data.sheets)[0]?.rows?.length || 0} 行`
                                  : "-",
                              ),
                              /*#__PURE__*/ React.createElement(
                                "td",
                                null,
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "btn-link danger",
                                    onClick: () => removeFile(file.id),
                                  },
                                  /*#__PURE__*/ React.createElement(
                                    Icons.Trash,
                                    null,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ),
          results.length > 0 &&
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { marginTop: 20 } },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "section-title" },
                "\u8BA1\u7B97\u7ED3\u679C",
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
                      /*#__PURE__*/ React.createElement(
                        "th",
                        null,
                        "\u6587\u4EF6\u540D",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "th",
                        null,
                        "\u5E97\u94FA",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "th",
                        null,
                        "\u72B6\u6001",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "th",
                        null,
                        "\u8BA1\u7B97\u503C\u9884\u89C8",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "th",
                        { style: { width: 80 } },
                        "\u64CD\u4F5C",
                      ),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "tbody",
                    null,
                    results.map((r, i) =>
                      /*#__PURE__*/ React.createElement(
                        "tr",
                        { key: i },
                        /*#__PURE__*/ React.createElement(
                          "td",
                          { style: { fontSize: 13 } },
                          r.fileName,
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          r.shop
                            ? /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "success" },
                                r.shop.name,
                              )
                            : /*#__PURE__*/ React.createElement(
                                "span",
                                { style: { color: "var(--color-text-muted)" } },
                                "-",
                              ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          r.status === "success"
                            ? /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "success" },
                                "\u6210\u529F",
                              )
                            : /*#__PURE__*/ React.createElement(
                                Tag,
                                { type: "danger" },
                                "\u5931\u8D25",
                              ),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          {
                            style: {
                              fontSize: 12,
                              color: "var(--color-text-tertiary)",
                              fontFamily: "var(--font-mono)",
                            },
                          },
                          r.status === "success"
                            ? Object.entries(r.values)
                                .slice(0, 3)
                                .map(
                                  ([k, v]) =>
                                    `${k}: ${typeof v === "object" ? v.val : v}`,
                                )
                                .join(", ") +
                                (Object.keys(r.values).length > 3 ? "..." : "")
                            : r.error,
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          r.status === "success" &&
                            /*#__PURE__*/ React.createElement(
                              "button",
                              {
                                className: "btn-link",
                                onClick: () => downloadSingleResult(r),
                              },
                              /*#__PURE__*/ React.createElement(
                                Icons.Download,
                                null,
                              ),
                              " \u4E0B\u8F7D",
                            ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ),
      batchTab === "history" &&
        /*#__PURE__*/ React.createElement(
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
            (state.calcHistory || []).length > 0 &&
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  onClick: () => {
                    if (!template || (state.calcHistory || []).length === 0)
                      return;
                    const fields = template.parseResult?.fields || [];
                    const wb = XLSX.utils.book_new();
                    const formatTime = (isoString) => {
                      const d = new Date(isoString);
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                    };
                    (state.calcHistory || []).forEach((entry, idx) => {
                      const aoa = [fields.map((f) => f.name)];
                      entry.results
                        .filter((r) => r.status === "success")
                        .forEach((r) => {
                          const row = fields.map((f) => {
                            const v = r.values[f.id];
                            if (v === null || v === undefined) return "";
                            if (typeof v === "object" && v.val !== undefined)
                              return v.val;
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
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Download, null),
                "\u5BFC\u51FA\u5168\u90E8\u8BB0\u5F55",
              ),
          ),
          (state.calcHistory || []).length === 0
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
                    (state.calcHistory || []).map((entry) => {
                      const successCount = entry.results.filter(
                        (r) => r.status === "success",
                      ).length;
                      const failCount = entry.results.filter(
                        (r) => r.status === "error",
                      ).length;
                      const formatTime = (isoString) => {
                        const d = new Date(isoString);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                      };
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
                                onClick: () => {
                                  if (!template) return;
                                  const fields =
                                    template.parseResult?.fields || [];
                                  const aoa = [fields.map((f) => f.name)];
                                  entry.results
                                    .filter((r) => r.status === "success")
                                    .forEach((r) => {
                                      const row = fields.map((f) => {
                                        const v = r.values[f.id];
                                        if (v === null || v === undefined)
                                          return "";
                                        if (
                                          typeof v === "object" &&
                                          v.val !== undefined
                                        )
                                          return v.val;
                                        return v;
                                      });
                                      aoa.push(row);
                                    });
                                  const wb = XLSX.utils.book_new();
                                  const ws = XLSX.utils.aoa_to_sheet(aoa);
                                  XLSX.utils.book_append_sheet(
                                    wb,
                                    ws,
                                    "利润表",
                                  );
                                  const buf = XLSX.write(wb, {
                                    bookType: "xlsx",
                                    type: "array",
                                  });
                                  const formatTime = (isoString) => {
                                    const d = new Date(isoString);
                                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}`;
                                  };
                                  ExcelUtils.download(
                                    buf,
                                    `利润表_${platform?.name}_${formatTime(entry.time)}.xlsx`,
                                  );
                                  addToast(
                                    "success",
                                    "下载成功",
                                    "利润表已生成",
                                  );
                                },
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
                                onClick: () => {
                                  Store.set((s) => ({
                                    ...s,
                                    calcHistory: (s.calcHistory || []).filter(
                                      (h) => h.id !== entry.id,
                                    ),
                                  }));
                                  addToast(
                                    "success",
                                    "删除成功",
                                    "计算记录已删除",
                                  );
                                },
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
        ),
        batchTab === "calc" &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "float-action-bar" },
            results.length > 0 &&
              /*#__PURE__*/ React.createElement(
                Button,
                { onClick: downloadResults },
                /*#__PURE__*/ React.createElement(Icons.Download, null),
                "\u4E0B\u8F7D\u7ED3\u679C",
              ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                type: "primary",
                onClick: runBatchCalc,
                loading: isCalculating,
                disabled: batchFiles.filter((f) => f.selected).length === 0,
                style: { minWidth: 140 },
              },
              !isCalculating && /*#__PURE__*/ React.createElement(Icons.Play, null),
              isCalculating ? "计算中..." : "开始计算",
            ),
          ),
    ),
  );
}; // ========== Calculation History Page ==========