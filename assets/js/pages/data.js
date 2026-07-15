// DataPage - 配置中心页面组件
const DataPage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("data_page_active_tab");
    const validTabs = ["samples", "externals"];
    return validTabs.includes(saved) ? saved : "samples";
  });
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`data_page_selected_items_${currentPlatform}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) { return new Set(); }
  });
  useEffect(() => {
    localStorage.setItem(`data_page_selected_items_${currentPlatform}`, JSON.stringify(Array.from(selectedItems)));
  }, [selectedItems, currentPlatform]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const samples = state.samples[currentPlatform] || [];
  const calcHistory = state.calcHistory || [];
  const externals = state.externals || [];
  const filteredSamples = samples.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.alias || "").toLowerCase().includes(q) ||
      (s.fileName || "").toLowerCase().includes(q)
    );
  });
  const totalRows = samples.reduce((sum, s) => {
    return sum + Object.values(s.sheets || {}).reduce((s2, sh) => s2 + (sh.rows?.length || 0), 0);
  }, 0);
  const totalSheets = samples.reduce((sum, s) => sum + Object.keys(s.sheets || {}).length, 0);
  const filteredIndices = samples.reduce((acc, s, idx) => {
    if (!searchQuery.trim()) {
      acc.push(idx);
    } else {
      const q = searchQuery.toLowerCase();
      if (
        (s.alias || "").toLowerCase().includes(q) ||
        (s.fileName || "").toLowerCase().includes(q)
      ) {
        acc.push(idx);
      }
    }
    return acc;
  }, []);

  useEffect(() => {
    localStorage.setItem("data_page_active_tab", activeTab);
  }, [activeTab]);
  const tabs = [
    {
      id: "samples",
      name: "样表数据管理",
      icon: /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
    },
    {
      id: "externals",
      name: "全局数据管理",
      icon: /*#__PURE__*/ React.createElement(Icons.Database, null),
    },
  ];
  const TABLE_TYPE_PATTERNS = [
    { type: "订单", keywords: ["订单", "交易", "成交"], icon: "📋", color: "var(--color-primary)", desc: "订单交易数据" },
    { type: "退款", keywords: ["退款", "退货"], icon: "🔄", color: "var(--color-warning)", desc: "退款退货数据" },
    { type: "推广", keywords: ["推广", "广告", "投放"], icon: "📢", color: "var(--color-success)", desc: "广告推广数据" },
    { type: "账务", keywords: ["账务", "账单", "结算"], icon: "💰", color: "var(--color-info)", desc: "账务结算数据" },
    { type: "成本", keywords: ["成本", "费用", "支出"], icon: "🧾", color: "var(--color-danger)", desc: "成本费用数据" },
    { type: "商品", keywords: ["商品", "库存"], icon: "📦", color: "var(--color-accent)", desc: "商品库存数据" },
    { type: "利润", keywords: ["利润", "收益"], icon: "📈", color: "var(--color-success)", desc: "利润收益数据" },
    { type: "报表", keywords: ["报表", "统计"], icon: "📊", color: "var(--color-primary)", desc: "统计报表数据" },
  ];

  const detectTableType = (fileName, fileData) => {
    const text = (fileName + " " + Object.keys(fileData.sheets || {}).join(" ")).toLowerCase();
    for (const pattern of TABLE_TYPE_PATTERNS) {
      if (pattern.keywords.some(k => text.includes(k.toLowerCase()))) {
        return pattern;
      }
    }
    return { type: "其他", keywords: [], icon: "📄", color: "var(--color-text-tertiary)", desc: "其他数据" };
  };

  const extractDateFromFileName = (fileName) => {
    const fullMatch = fileName.match(/(\d{4})[-_.年](\d{1,2})[-_.月]?(\d{1,2})/);
    if (fullMatch) {
      const [, year, month, day] = fullMatch;
      return {
        date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        month: Number(month),
        monthLabel: `${Number(month)}月`,
        yearMonthLabel: `${year}-${Number(month)}月`,
      };
    }
    const yearMonthMatch = fileName.match(/(\d{4})[-_.年](\d{1,2})/);
    if (yearMonthMatch) {
      const [, year, month] = yearMonthMatch;
      return {
        date: `${year}-${month.padStart(2, "0")}-01`,
        month: Number(month),
        monthLabel: `${Number(month)}月`,
        yearMonthLabel: `${year}-${Number(month)}月`,
      };
    }
    const cnMonthMatch = fileName.match(/(\d{1,2})月份?/);
    if (cnMonthMatch) {
      const m = Number(cnMonthMatch[1]);
      const yearMatch = fileName.match(/(\d{4})/);
      const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      return {
        date: `${year}-${String(m).padStart(2, "0")}-01`,
        month: m,
        monthLabel: `${m}月`,
        yearMonthLabel: `${year}-${m}月`,
      };
    }
    return null;
  };

  // 从数据中提取月份（优先从日期/时间列）
  const extractMonthFromData = (fileData) => {
    const sheets = fileData?.sheets || {};
    const sheetNames = Object.keys(sheets);
    if (sheetNames.length === 0) return null;
    const firstSheet = sheets[sheetNames[0]];
    const rows = firstSheet?.rows || [];
    const headers = firstSheet?.headers || [];
    if (rows.length === 0) return null;

    // 查找日期/时间/月份相关列
    const dateColPatterns = [
      /日期/, /时间/, /创建时间/, /下单时间/, /订单时间/, /成交时间/,
      /月份/, /周期/, /数据周期/, /月份/, /年月/
    ];
    let dateColIdx = -1;
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] || "");
      if (dateColPatterns.some((p) => p.test(h))) {
        dateColIdx = i;
        break;
      }
    }
    if (dateColIdx >= 0) {
      const firstVal = String(rows[0][dateColIdx] || "");
      // 尝试提取月份
      const m1 = firstVal.match(/(\d{4})[-_/年]?(\d{1,2})[-_/]?\d{0,2}/);
      if (m1) return Number(m1[2]);
      const m2 = firstVal.match(/(\d{1,2})月/);
      if (m2) return Number(m2[1]);
      // 尝试解析日期字符串
      const d = new Date(firstVal);
      if (!isNaN(d.getTime())) {
        return d.getMonth() + 1;
      }
    }
    return null;
  };

  // 从表头分析提取关键词
  const extractKeywordFromHeaders = (fileData) => {
    const sheets = fileData?.sheets || {};
    const sheetNames = Object.keys(sheets);
    if (sheetNames.length === 0) return null;
    const firstSheet = sheets[sheetNames[0]];
    const headers = (firstSheet?.headers || []).map((h) => String(h || "").toLowerCase());
    const headerText = headers.join(" ");

    // 按优先级匹配
    const keywordMap = [
      { keywords: ["订单号", "订单状态", "订单编号", "订单时间", "成交时间"], result: "订单" },
      { keywords: ["退款", "售后", "退货", "退款金额", "退款状态"], result: "退款" },
      { keywords: ["推广", "广告", "花费", "投放", "曝光", "点击", "推广费"], result: "推广" },
      { keywords: ["账单", "账务", "结算", "账单金额", "应结金额", "到账"], result: "账务" },
      { keywords: ["成本", "费用", "支出", "成本价", "单价"], result: "成本" },
      { keywords: ["商品", "sku", "商品id", "商品规格", "spu"], result: "商品" },
      { keywords: ["利润", "毛利", "净利", "利润率", "收益"], result: "利润" },
      { keywords: ["资金", "流水", "收支", "打款", "提现"], result: "资金" },
    ];
    for (const item of keywordMap) {
      if (item.keywords.some((k) => headers.some((h) => h.includes(k)))) {
        return item.result;
      }
    }
    return null;
  };

  // 提取表主要类型
  const extractTableKeyword = (fileName, fileData) => {
    // 优先从表头分析
    const fromHeaders = extractKeywordFromHeaders(fileData);
    if (fromHeaders) return fromHeaders;

    const cleanName = fileName.replace(/\.[^.]+$/, "").trim();
    const detailMatch = cleanName.match(/^([^\s_\-\.]+?)(明细|详情|清单|统计|报表|记录|流水)/);
    if (detailMatch) {
      return detailMatch[1] + detailMatch[2];
    }
    for (const pattern of TABLE_TYPE_PATTERNS) {
      for (const keyword of pattern.keywords) {
        if (cleanName.toLowerCase().includes(keyword.toLowerCase())) {
          return keyword;
        }
      }
    }
    const short = cleanName.replace(/[\d_\-\.年月日期\s]/g, "").substring(0, 4);
    return short || "数据";
  };

  const generateTableName = (fileName, fileData) => {
    const dateInfo = extractDateFromFileName(fileName);
    const keyword = extractTableKeyword(fileName, fileData);
    // 优先从数据中提取月份，其次从文件名
    const monthFromData = extractMonthFromData(fileData);
    const month = monthFromData || (dateInfo ? dateInfo.month : null);

    // 统一格式：关键词 + 月份 + 明细
    // 如: 账务2月明细, 订单6月明细, 推广7月明细
    if (keyword && month) {
      return `${keyword}${month}月明细`;
    }
    if (keyword) {
      return `${keyword}明细`;
    }
    if (month) {
      return `${month}月明细`;
    }
    return fileName.replace(/\.[^.]+$/, "").substring(0, 20) + "明细";
  };
  const [aliasInput, setAliasInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState(null);
  const [editAliasIdx, setEditAliasIdx] = useState(null);
  const [editAliasValue, setEditAliasValue] = useState("");
  const [previewSample, setPreviewSample] = useState(null);
  const [previewSheet, setPreviewSheet] = useState("");
  const [previewColumns, setPreviewColumns] = useState([]);
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target)) {
        setColumnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSampleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    e.target.value = "";
    if (files.length === 1) {
      const file = files[0];
      // 解析文件以获取表类型信息，生成统一的表名
      const tempResult = await ExcelUtils.parse(file);
      const autoName = generateTableName(file.name, tempResult);
      setAliasInput(autoName);
      setPendingFiles([file]);
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const newSamples = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await ExcelUtils.parse(file, (p) => {
          setUploadProgress(Math.round(((i + p / 100) / files.length) * 100));
        });
        const autoName = generateTableName(file.name, result);
        result.displayName = autoName;
        result.alias = autoName;
        ExcelUtils.stripForStorage(result);
        newSamples.push(result);
      }
      Store.set((s) => ({
        ...s,
        samples: {
          ...s.samples,
          [currentPlatform]: [
            ...(s.samples[currentPlatform] || []),
            ...newSamples,
          ],
        },
      }));
      Store.flush();
      addToast(
        "success",
        "上传成功",
        `成功上传 ${newSamples.length} 个样表文件`,
      );
      ActivityLogger.add(
        "上传样表",
        `${platform?.name} - ${newSamples.length}个文件`,
      );
    } catch (err) {
      addToast("error", "上传失败", err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  const confirmAliasUpload = async () => {
    if (!pendingFiles || pendingFiles.length === 0) return;
    const filesToUpload = [...pendingFiles];
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const newSamples = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const result = await ExcelUtils.parse(file, (p) => {
          setUploadProgress(p);
        });
        const autoName = generateTableName(file.name, result);
        result.displayName = autoName;
        result.alias = aliasInput.trim() || autoName;
        ExcelUtils.stripForStorage(result);
        newSamples.push(result);
      }
      Store.set((s) => ({
        ...s,
        samples: {
          ...s.samples,
          [currentPlatform]: [
            ...(s.samples[currentPlatform] || []),
            ...newSamples,
          ],
        },
      }));
      Store.flush();
      addToast("success", "上传成功", `样表「${newSamples[0].alias}」已上传`);
      ActivityLogger.add(
        "上传样表",
        `${platform?.name} - ${newSamples[0].alias}`,
      );
    } catch (err) {
      addToast("error", "上传失败", err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setPendingFiles(null);
      setAliasInput("");
    }
  };
  const updateSampleAlias = (index, newAlias) => {
    Store.set((s) => ({
      ...s,
      samples: {
        ...s.samples,
        [currentPlatform]: s.samples[currentPlatform].map((sample, i) =>
          i === index ? { ...sample, alias: newAlias } : sample,
        ),
      },
    }));
    Store.flush();
    addToast("success", "修改成功", `备注名已更新为「${newAlias}」`);
  };
  const deleteSample = (index) => {
    const sample = samples[index];
    setConfirmDialog({
      title: "确认删除样表",
      message: `确认删除样表「${sample?.alias || sample?.fileName || ""}」？此操作不可撤销。`,
      type: "danger",
      onConfirm: () => {
        Store.set((s) => ({
          ...s,
          samples: {
            ...s.samples,
            [currentPlatform]: s.samples[currentPlatform].filter(
              (_, i) => i !== index,
            ),
          },
        }));
        addToast("success", "删除成功", "样表已删除");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const deleteSelected = () => {
    const deleteCount = selectedItems.size;
    setConfirmDialog({
      title: "确认批量删除",
      message: `确认删除选中的${deleteCount} 个样表？此操作不可撤销。`,
      type: "danger",
      onConfirm: () => {
        Store.set((s) => ({
          ...s,
          samples: {
            ...s.samples,
            [currentPlatform]: s.samples[currentPlatform].filter(
              (_, i) => !selectedItems.has(i),
            ),
          },
        }));
        setSelectedItems(new Set());
        addToast("success", "批量删除", `已删除${deleteCount} 个文件`);
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const toggleSelect = (index) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedItems(newSet);
  };
  const toggleSelectAll = () => {
    const allFilteredSelected = filteredIndices.every((i) => selectedItems.has(i));
    if (allFilteredSelected && filteredIndices.length > 0) {
      const newSet = new Set(selectedItems);
      filteredIndices.forEach((i) => newSet.delete(i));
      setSelectedItems(newSet);
    } else {
      const newSet = new Set(selectedItems);
      filteredIndices.forEach((i) => newSet.add(i));
      setSelectedItems(newSet);
    }
  };
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString("zh-CN");
  };
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "data-page fade-in" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "card" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "card-header" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "section-tabs" },
          tabs.map((tab) =>
            /*#__PURE__*/ React.createElement(
              "button",
              {
                key: tab.id,
                className: `section-tab ${activeTab === tab.id ? "active" : ""}`,
                onClick: () => setActiveTab(tab.id),
              },
              tab.icon,
              tab.name,
            ),
          ),
        ),
      ),
      activeTab === "samples" &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-body" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "stats-grid" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-icon stat-icon-primary" },
                /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-value" },
                  samples.length,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-label" },
                  "样表数量",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-icon stat-icon-success" },
                /*#__PURE__*/ React.createElement(Icons.Layers, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-value" },
                  totalSheets,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-label" },
                  "工作表总数",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-icon stat-icon-warning" },
                /*#__PURE__*/ React.createElement(Icons.Table, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-value" },
                  totalRows.toLocaleString(),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-label" },
                  "数据行数",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "stat-card" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-icon stat-icon-info" },
                /*#__PURE__*/ React.createElement(Icons.Search, null),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "stat-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-value" },
                  filteredSamples.length,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "stat-label" },
                  "当前显示",
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "data-toolbar" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-toolbar-left" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "search-box" },
                /*#__PURE__*/ React.createElement(Icons.Search, null),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "search-input",
                  placeholder: "搜索样表备注名或文件名...",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                }),
                searchQuery && /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "search-clear",
                    onClick: () => setSearchQuery(""),
                  },
                  "×",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "data-toolbar-right" },
              selectedItems.size > 0 && /*#__PURE__*/ React.createElement(
                Button,
                { type: "danger", size: "sm", onClick: deleteSelected },
                /*#__PURE__*/ React.createElement(Icons.Trash, null),
                " 批量删除 (",
                selectedItems.size,
                ")",
              ),
              selectedItems.size > 0 && /*#__PURE__*/ React.createElement(
                "span",
                { style: { fontSize: 13, color: "var(--color-text-secondary)" } },
                " 已选择 ",
                selectedItems.size,
                " / ",
                samples.length,
                " 项",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "upload-btn-group" },
                /*#__PURE__*/ React.createElement(
                  Button,
                  {
                    type: "primary",
                    onClick: () => fileInputRef.current?.click(),
                    loading: isUploading,
                  },
                  !isUploading && /*#__PURE__*/ React.createElement(Icons.Upload, null),
                  isUploading ? "上传中..." : "上传样表",
                ),
                /*#__PURE__*/ React.createElement(
                  Button,
                  {
                    type: "default",
                    onClick: () => document.getElementById("folder-upload-input")?.click(),
                    disabled: isUploading,
                  },
                  /*#__PURE__*/ React.createElement(Icons.FolderOpen, null),
                  " 上传文件夹",
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement("input", {
              ref: fileInputRef,
              type: "file",
              accept: ".xlsx,.xls,.csv,.zip",
              multiple: true,
              onChange: handleSampleUpload,
              style: { display: "none" },
            }),
          /*#__PURE__*/ React.createElement("input", {
              id: "folder-upload-input",
              type: "file",
              accept: ".xlsx,.xls,.csv,.zip",
              multiple: true,
              onChange: handleSampleUpload,
              style: { display: "none" },
              webkitdirectory: "",
              directory: "",
            }),
          pendingFiles &&
            /*#__PURE__*/ React.createElement(
              "div",
              {
                className: "pending-files-card",
              },
              /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "file-info" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "file-title" },
                  "\u4E3A\u4E0A\u4F20\u7684\u6587\u4EF6\u8BBE\u7F6E\u5907\u6CE8\u540D",
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "file-name" },
                  "\u539F\u59CB\u6587\u4EF6\u540D\uFF1A",
                  pendingFiles[0]?.name,
                ),
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                placeholder: "\u8F93\u5165\u5907\u6CE8\u540D...",
                value: aliasInput,
                onChange: (e) => setAliasInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") confirmAliasUpload();
                },
                style: { width: 220, marginBottom: 0 },
                autoFocus: true,
              }),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  size: "sm",
                  onClick: () => {
                    setPendingFiles(null);
                    setAliasInput("");
                  },
                },
                "\u53D6\u6D88",
              ),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  type: "primary",
                  size: "sm",
                  onClick: confirmAliasUpload,
                  loading: isUploading,
                },
                "\u786E\u8BA4\u4E0A\u4F20",
              ),
            ),
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
                  "\u4E0A\u4F20\u4E2D...",
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
          selectedItems.size > 0 &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "batch-actions-bar" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "batch-actions-count" },
                "\u5DF2\u9009\u62E9 ",
                selectedItems.size,
                " \u9879",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "batch-actions-actions" },
                /*#__PURE__*/ React.createElement(
                  Button,
                  { size: "sm", onClick: () => setSelectedItems(new Set()) },
                  "\u53D6\u6D88\u9009\u62E9",
                ),
                /*#__PURE__*/ React.createElement(
                  Button,
                  { type: "danger", size: "sm", onClick: deleteSelected },
                  /*#__PURE__*/ React.createElement(Icons.Trash, null),
                  "\u6279\u91CF\u5220\u9664",
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
                  /*#__PURE__*/ React.createElement(
                    "th",
                    { className: "checkbox-cell" },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked:
                        filteredIndices.length > 0 &&
                        filteredIndices.every((i) => selectedItems.has(i)),
                      onChange: toggleSelectAll,
                    }),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "th",
                    null,
                    "\u5907\u6CE8\u540D",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "th",
                    null,
                    "\u539F\u59CB\u6587\u4EF6\u540D",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "th",
                    { style: { width: 120 } },
                    "\u5927\u5C0F",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "th",
                    { style: { width: 100 } },
                    "\u5DE5\u4F5C\u8868\u6570",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "th",
                    { style: { width: 140 } },
                    "\u64CD\u4F5C",
                  ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "tbody",
                null,
                filteredIndices.length === 0
                  ? /*#__PURE__*/ React.createElement(
                      "tr",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { colSpan: 6 },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            className: "empty",
                            style: { padding: "40px 20px" },
                          },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "empty-icon" },
                            samples.length === 0 ? "📁" : "🔍",
                          ),
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "empty-text" },
                            samples.length === 0
                              ? "暂无样表文件"
                              : "未找到匹配的样表",
                          ),
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "empty-desc" },
                            samples.length === 0
                              ? "上传样表文件以配置计算规则"
                              : "试试其他搜索关键词",
                          ),
                        ),
                      ),
                    )
                  : filteredIndices.map((originalIdx) => {
                      const sample = samples[originalIdx];
                      const idx = originalIdx;
                      return /*#__PURE__*/ React.createElement(
                        "tr",
                        {
                          key: idx,
                          className: selectedItems.has(idx) ? "highlight" : "",
                        },
                        /*#__PURE__*/ React.createElement(
                          "td",
                          { className: "checkbox-cell" },
                          /*#__PURE__*/ React.createElement("input", {
                            type: "checkbox",
                            checked: selectedItems.has(idx),
                            onChange: () => toggleSelect(idx),
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
                                gap: 6,
                              },
                            },
                            /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                style: {
                                  fontWeight: 600,
                                  color: "var(--color-text-primary)",
                                },
                              },
                              sample.alias || sample.fileName,
                            ),
                            !sample.alias &&
                              /*#__PURE__*/ React.createElement(
                                "span",
                                {
                                  style: {
                                    fontSize: 10,
                                    color: "var(--color-warning)",
                                    background: "var(--color-warning-bg)",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                  },
                                },
                                "\u672A\u5907\u6CE8",
                              ),
                          ),
                        ),
                        /*#__PURE__*/ React.createElement(
                        "td",
                        null,
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: 12,
                              color: "var(--color-text-secondary)",
                              fontStyle: "italic",
                              maxWidth: 180,
                              display: "inline-block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            title: sample.displayName || "未识别",
                          },
                          sample.displayName || "未识别",
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "td",
                        null,
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: 12,
                              color: "var(--color-text-tertiary)",
                              maxWidth: 200,
                              display: "inline-block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            title: sample.fileName,
                          },
                          sample.fileName,
                        ),
                      ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          ExcelUtils.formatSize(sample.fileSize),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "td",
                          null,
                          Object.keys(sample.sheets).length,
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
                                className: "action-btn action-note",
                                onClick: () => {
                                  setEditAliasIdx(idx);
                                  setEditAliasValue(
                                    sample.alias || sample.fileName,
                                  );
                                },
                                title: "\u4FEE\u6539\u5907\u6CE8",
                              },
                              /*#__PURE__*/ React.createElement(
                                Icons.Edit,
                                null,
                              ),
                              " \u5907\u6CE8",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "button",
                              {
                                className: "action-btn action-view",
                                onClick: () => {
                                  if (!sample.sheets || Object.keys(sample.sheets).length === 0) {
                                    addToast("warning", "无法预览", "该文件没有可预览的工作表");
                                    return;
                                  }
                                  const firstSheet = Object.keys(sample.sheets)[0];
                                  setPreviewSample(sample);
                                  setPreviewSheet(firstSheet);
                                  setPreviewColumns(
                                    sample.sheets[firstSheet]?.headers || [],
                                  );
                                },
                                title: "\u9884\u89C8\u6570\u636E",
                              },
                              /*#__PURE__*/ React.createElement(
                                Icons.Eye,
                                null,
                              ),
                              " \u9884\u89C8",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "button",
                              {
                                className: "action-btn action-delete",
                                onClick: () => deleteSample(idx),
                                title: "\u5220\u9664\u6837\u8868",
                              },
                              /*#__PURE__*/ React.createElement(
                                Icons.Trash,
                                null,
                              ),
                              " \u5220\u9664",
                            ),
                          ),
                        ),
                      );
                    }),
              ),
            ),
          ),
          editAliasIdx !== null &&
            /*#__PURE__*/ React.createElement(
              Modal,
              {
                title: /*#__PURE__*/ React.createElement(
                  React.Fragment,
                  null,
                  /*#__PURE__*/ React.createElement(Icons.Edit3, null),
                  " \u4FEE\u6539\u5907\u6CE8\u540D",
                ),
                width: "420px",
                onClose: () => setEditAliasIdx(null),
                footer: /*#__PURE__*/ React.createElement(
                  React.Fragment,
                  null,
                  /*#__PURE__*/ React.createElement(
                    Button,
                    { onClick: () => setEditAliasIdx(null) },
                    "\u53D6\u6D88",
                  ),
                  /*#__PURE__*/ React.createElement(
                    Button,
                    {
                      type: "primary",
                      onClick: () => {
                        if (editAliasValue.trim()) {
                          updateSampleAlias(
                            editAliasIdx,
                            editAliasValue.trim(),
                          );
                          setEditAliasIdx(null);
                        }
                      },
                    },
                    "\u786E\u8BA4\u4FEE\u6539",
                  ),
                ),
              },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u5907\u6CE8\u540D",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: editAliasValue,
                  onChange: (e) => setEditAliasValue(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && editAliasValue.trim()) {
                      updateSampleAlias(
                        editAliasIdx,
                        editAliasValue.trim(),
                      );
                      setEditAliasIdx(null);
                    }
                  },
                  placeholder: "\u8F93\u5165\u5907\u6CE8\u540D...",
                  autoFocus: true,
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: {
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    marginTop: 8,
                  },
                },
                "\u5907\u6CE8\u540D\u7528\u4E8E\u5728\u8BA1\u7B97\u89C4\u5219\u914D\u7F6E\u4E2D\u8BC6\u522B\u6570\u636E\u8868\uFF0C\u5EFA\u8BAE\u4F7F\u7528\u6709\u610F\u4E49\u7684\u540D\u79F0\u3002",
              ),
            ),
        ),
      activeTab === "externals" &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "card-body" },
          /*#__PURE__*/ React.createElement(ExternalsPage, {
            state: state,
            currentPlatform: currentPlatform,
          }),
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
    previewSample &&
      /*#__PURE__*/ React.createElement(
        Modal,
        {
          title: /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(Icons.Eye, null),
            " \u6837\u8868\u9884\u89C8 - ",
            previewSample.alias || previewSample.fileName,
          ),
          width: "1200px",
          onClose: () => { setPreviewSample(null); setColumnDropdownOpen(false); },
          footer: /*#__PURE__*/ React.createElement(
            Button,
            { onClick: () => { setPreviewSample(null); setColumnDropdownOpen(false); } },
            "\u5173\u95ED",
          ),
        },
        /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 16,
              marginBottom: 16,
              alignItems: "center",
              flexWrap: "wrap",
            },
          },
          /*#__PURE__*/ React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 8 } },
            /*#__PURE__*/ React.createElement(
              "label",
              {
                style: {
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  fontWeight: 500,
                },
              },
              "\u5DE5\u4F5C\u8868\uFF1A",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: previewSheet,
                onChange: (e) => {
                  setPreviewSheet(e.target.value);
                  setPreviewColumns(
                    previewSample.sheets[e.target.value]?.headers || [],
                  );
                },
                style: { width: 200 },
              },
              Object.keys(previewSample.sheets).map((name) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: name, value: name },
                  name,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 300,
              },
            },
            /*#__PURE__*/ React.createElement(
              "label",
              {
                style: {
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                },
              },
              "\u663E\u793A\u5217\uFF1A",
            ),
            /*#__PURE__*/ React.createElement(
                "div",
                {
                  ref: columnDropdownRef,
                  style: {
                    position: "relative",
                    flex: 1,
                    minWidth: 200,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => { e.stopPropagation(); setColumnDropdownOpen(!columnDropdownOpen); },
                  style: {
                    width: "100%",
                    padding: "6px 12px",
                    fontSize: 13,
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text-primary)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    style: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  },
                  previewColumns.length === 0
                    ? "\u8BF7\u9009\u62E9\u5217"
                    : previewColumns.length ===
                        (previewSample.sheets[previewSheet]?.headers?.length || 0)
                      ? "\u5168\u90E8\u5217"
                      : `\u5DF2\u9009 ${previewColumns.length} \u5217`,
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    style: {
                      fontSize: 10,
                      transition: "transform 0.2s",
                      transform: columnDropdownOpen ? "rotate(180deg)" : "none",
                    },
                  },
                  "\u25BC",
                ),
              ),
              columnDropdownOpen &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-md)",
                      maxHeight: 240,
                      overflowY: "auto",
                      zIndex: 10,
                    },
                  },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    {
                      style: {
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border-light)",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                      },
                    },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "checkbox",
                      checked:
                        previewColumns.length ===
                        (previewSample.sheets[previewSheet]?.headers?.length || 0),
                      onChange: (e) => {
                        if (e.target.checked) {
                          setPreviewColumns(
                            previewSample.sheets[previewSheet]?.headers || [],
                          );
                        } else {
                          setPreviewColumns([]);
                        }
                      },
                    }),
                    "\u5168\u9009",
                  ),
                  (previewSample.sheets[previewSheet]?.headers || []).map(
                    (h) =>
                      /*#__PURE__*/ React.createElement(
                        "label",
                        {
                          key: h,
                          style: {
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            padding: "6px 12px",
                            color: previewColumns.includes(h)
                              ? "var(--color-primary)"
                              : "var(--color-text-secondary)",
                            background: previewColumns.includes(h)
                              ? "var(--color-primary-50)"
                              : "transparent",
                            transition: "background 0.15s",
                          },
                        },
                        /*#__PURE__*/ React.createElement("input", {
                          type: "checkbox",
                          checked: previewColumns.includes(h),
                          onChange: (e) => {
                            if (e.target.checked) {
                              setPreviewColumns([...previewColumns, h]);
                            } else {
                              setPreviewColumns(
                                previewColumns.filter((col) => col !== h),
                              );
                            }
                          },
                        }),
                        h,
                      ),
                  ),
                ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                whiteSpace: "nowrap",
              },
            },
            "\u5171 ",
            previewSample.sheets[previewSheet]?.rows?.length || 0,
            " \u884C\u6570\u636E",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            className: "data-table-container",
            style: { maxHeight: 450, overflow: "auto" },
          },
          /*#__PURE__*/ React.createElement(
            "table",
            { className: "table" },
            /*#__PURE__*/ React.createElement(
              "thead",
              { style: { position: "sticky", top: 0, zIndex: 1 } },
              /*#__PURE__*/ React.createElement(
                "tr",
                null,
                /*#__PURE__*/ React.createElement(
                  "th",
                  {
                    style: {
                      width: 50,
                      position: "sticky",
                      left: 0,
                      background: "var(--color-bg-secondary)",
                    },
                  },
                  "#",
                ),
                previewColumns.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "th",
                    {
                      key: h,
                      title: h,
                      style: { minWidth: 100, maxWidth: 200 },
                    },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "tbody",
              null,
              (previewSample.sheets[previewSheet]?.rows || []).slice(0, 100).map(
                (row, idx) =>
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    { key: idx },
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: {
                          position: "sticky",
                          left: 0,
                          background:
                            idx % 2 === 0
                              ? "var(--color-bg-secondary)"
                              : "var(--color-bg-tertiary)",
                          zIndex: 0,
                        },
                      },
                      idx + 1,
                    ),
                    previewColumns.map((h) =>
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { key: h, title: row[h] },
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            style: {
                              display: "inline-block",
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          },
                          row[h] !== null && row[h] !== undefined
                            ? String(row[h])
                            : "",
                        ),
                      ),
                    ),
                  ),
              ),
            ),
          ),
        ),
        (previewSample.sheets[previewSheet]?.rows?.length || 0) > 100 &&
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                marginTop: 10,
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                textAlign: "center",
                padding: "8px 0",
                background: "var(--color-bg-tertiary)",
                borderRadius: 8,
              },
            },
            "\u4EC5\u663E\u793A\u524D 100 \u884C\uFF08\u5171 ",
            previewSample.sheets[previewSheet]?.rows?.length || 0,
            "\u884C\uFF09",
          ),
      ),
  );
}; // ========== Shops Management Page ==========
