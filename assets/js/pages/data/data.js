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
      setAliasInput("");
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
        result.displayName = file.name;
        result.alias = "";
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
    if (!aliasInput.trim()) {
      addToast("warning", "请填写备注名", "上传样表前必须设置备注名");
      return;
    }
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
        result.displayName = file.name;
        result.alias = aliasInput.trim();
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
                placeholder: "\u8BF7\u8F93\u5165\u5907\u6CE8\u540D\uFF08\u5FC5\u586B\uFF09...",
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
                          sample.alias
                            ? /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                style: {
                                  fontWeight: 600,
                                  color: "var(--color-text-primary)",
                                },
                              },
                              sample.alias,
                            )
                            : /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                style: {
                                  fontSize: 12,
                                  color: "var(--color-text-tertiary)",
                                  fontStyle: "italic",
                                },
                              },
                              "\u672A\u8BBE\u7F6E",
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
                              maxWidth: 220,
                              display: "inline-block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            title: sample.fileName || "未识别",
                          },
                          sample.fileName || "未识别",
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
                                setEditAliasValue(sample.alias || "");
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
                        updateSampleAlias(
                          editAliasIdx,
                          editAliasValue.trim(),
                        );
                        setEditAliasIdx(null);
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
                    if (e.key === "Enter") {
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
    /*#__PURE__*/ React.createElement(SamplePreview, {
      previewSample,
      previewSheet,
      previewColumns,
      setPreviewSheet,
      setPreviewColumns,
      setPreviewSample,
      setColumnDropdownOpen,
      columnDropdownOpen,
      columnDropdownRef,
    }),
  );
};

