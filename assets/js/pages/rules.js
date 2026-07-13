// RulesPage - 计算规则页面组件
const RulesPage = ({ state, currentPlatform, onNavigate }) => {
  const { addToast } = useToast();
  const SearchableSelect = window.SearchableSelect || ((props) => {
    const { value, onChange, options, placeholder, disabled, allowCreate } = props;
    const opts = (options || []).map((o) => typeof o === "object" ? { value: o.value, label: o.label || o.value } : { value: o, label: String(o) });
    const selectedOpt = opts.find((o) => String(o.value) === String(value));
    return /*#__PURE__*/ React.createElement("div", { className: "searchable-select" + (disabled ? " disabled" : "") },
      /*#__PURE__*/ React.createElement("select", {
        className: "select",
        value: value || "",
        onChange: (e) => onChange && onChange(e.target.value),
        disabled: disabled,
      },
        placeholder && /*#__PURE__*/ React.createElement("option", { value: "" }, placeholder),
        opts.map((o) => /*#__PURE__*/ React.createElement("option", { key: o.value, value: o.value }, o.label)),
        allowCreate && /*#__PURE__*/ React.createElement("option", { value: "__create__" }, "输入自定义值")
      ),
      allowCreate && !disabled && /*#__PURE__*/ React.createElement("input", {
        type: "text",
        className: "input",
        placeholder: "或输入自定义值",
        style: { marginTop: 4, fontSize: 12, padding: "4px 8px" },
        onChange: (e) => onChange && onChange(e.target.value),
      })
    );
  });
  const [activeField, setActiveField] = useState(() => {
    try {
      const saved = localStorage.getItem(`rules_page_active_field_${currentPlatform}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const template = state.templates[currentPlatform];
        const fields = template?.parseResult?.fields || [];
        if (fields.find((f) => f.id === parsed.id)) return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [expandedStep, setExpandedStep] = useState(() => {
    try {
      const saved = localStorage.getItem(`rules_page_expanded_step_${currentPlatform}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    if (activeField) {
      localStorage.setItem(`rules_page_active_field_${currentPlatform}`, JSON.stringify(activeField));
    } else {
      localStorage.removeItem(`rules_page_active_field_${currentPlatform}`);
    }
  }, [activeField, currentPlatform]);

  useEffect(() => {
    if (expandedStep !== null && expandedStep !== undefined) {
      localStorage.setItem(`rules_page_expanded_step_${currentPlatform}`, JSON.stringify(expandedStep));
    } else {
      localStorage.removeItem(`rules_page_expanded_step_${currentPlatform}`);
    }
  }, [expandedStep, currentPlatform]);

  const [previewResult, setPreviewResult] = useState(null);
  const [presetCategory, setPresetCategory] = useState("all");
  const [fieldSearch, setFieldSearch] = useState(() => {
    try {
      return localStorage.getItem(`rules_page_field_search_${currentPlatform}`) || "";
    } catch (e) { return ""; }
  });
  const [fieldFilter, setFieldFilter] = useState(() => {
    try {
      return localStorage.getItem(`rules_page_field_filter_${currentPlatform}`) || "all";
    } catch (e) { return "all"; }
  });

  useEffect(() => {
    localStorage.setItem(`rules_page_field_search_${currentPlatform}`, fieldSearch);
  }, [fieldSearch, currentPlatform]);

  useEffect(() => {
    localStorage.setItem(`rules_page_field_filter_${currentPlatform}`, fieldFilter);
  }, [fieldFilter, currentPlatform]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceFieldId, setCopySourceFieldId] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [stepSearchKeyword, setStepSearchKeyword] = useState("");
  const [stepCategory, setStepCategory] = useState("all");
  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const template = state.templates[currentPlatform];
  const savedRules = state.rules[currentPlatform] || {};
  const fields = template?.parseResult?.fields || [];
  const currentRule = activeField ? savedRules[activeField.id] : null;

  const validateRule = (rule, field) => {
    if (!rule || !rule.steps || rule.steps.length === 0) {
      return { valid: false, msg: "尚未配置任何步骤" };
    }
    const firstStep = rule.steps[0];
    const semanticType = field?.semanticType || "";
    if (
      ["shop", "year", "month", "day", "date", "text"].includes(semanticType) &&
      firstStep.type === "fill"
    ) {
      const cfg = firstStep.config || {};
      if (
        cfg.fillType === "auto" ||
        cfg.fillType === "shop" ||
        cfg.fillType === "date" ||
        cfg.fillType === "dateNow"
      ) {
        return { valid: true, msg: "配置完整（自动填充）" };
      }
      if (cfg.fillType === "field") {
        if (!cfg.sourceTable) return { valid: false, msg: "请选择数据源表" };
        if (!cfg.sourceField) return { valid: false, msg: "请选择目标字段" };
        return { valid: true, msg: "配置完整" };
      }
    }
    const source = rule.steps.find((s) => s.type === "source");
    if (!source) {
      return { valid: false, msg: "缺少「数据源」步骤" };
    }
    const hasTable = source.config.table || (source.config.tables && source.config.tables.length > 0);
    if (!hasTable) {
      return { valid: false, msg: "「数据源」步骤未选择数据表" };
    }
    return { valid: true, msg: "配置完整" };
  };

  const inferFieldLevel = (field) => {
    const steps = savedRules[field.id]?.steps || [];
    if (steps.length === 0) return null;
    const hasJoin = steps.some((s) => s.type === "join");
    const hasVirtual = steps.some((s) => s.type === "virtual");
    const hasFilter = steps.some((s) => s.type === "filter");
    if (hasJoin || hasVirtual) return 2;
    if (hasFilter) return 1;
    return 0;
  };

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(fieldSearch.toLowerCase()) ||
        (f.cell || "").toLowerCase().includes(fieldSearch.toLowerCase());
      if (!matchSearch) return false;
      const steps = savedRules[f.id]?.steps || [];
      const hasConfig = steps.length > 0;
      const validation = validateRule(savedRules[f.id], f);
      switch (fieldFilter) {
        case "done":
          return hasConfig && validation.valid;
        case "pending":
          return !hasConfig;
        case "warning":
          return hasConfig && !validation.valid;
        default:
          return true;
      }
    });
  }, [fields, savedRules, fieldFilter, fieldSearch]);

  const completedCount = useMemo(() => {
    return fields.filter(
      (f) => (savedRules[f.id]?.steps || []).length > 0,
    ).length;
  }, [fields, savedRules]);

  const completionRate = useMemo(() => {
    return fields.length > 0 ? Math.round((completedCount / fields.length) * 100) : 0;
  }, [completedCount, fields.length]);

  useEffect(() => {
    if (fields.length > 0 && !activeField) {
      setActiveField(fields[0]);
      setExpandedStep(null);
    }
  }, [fields]);

  useEffect(() => {
    setPresetCategory(currentPlatform || "all");
  }, [currentPlatform]);

  // 调试模式下实时预览
  useEffect(() => {
    if (
      debugMode &&
      activeField &&
      currentRule &&
      currentRule.steps.length > 0
    ) {
      const samples = state.samples[currentPlatform] || [];
      const sampleTablesArr = samples.map((s, i) => ({
        id: s.id || `sample_${i}`,
        name: s.alias || s.fileName,
        originalName: s.fileName,
        headers: s.sheets[Object.keys(s.sheets)[0]]?.headers || [],
        rows: s.sheets[Object.keys(s.sheets)[0]]?.rows || [],
      }));
      const extTablesArr = (state.externals || []).map((e) => ({
        id: e.id || e.sheetKey,
        name: e.name || e.sheetKey,
        headers: e.headers || (e.allData && e.allData.length > 0 ? Object.keys(e.allData[0]) : []),
        rows: e.allData || e.data || [],
      }));
      const tables = [...sampleTablesArr, ...extTablesArr];
      try {
        const savedFieldValues = getSavedFieldValues();
        const result = CalcEngine.exec(currentRule, tables, {
          externals: state.externals || [],
          shopName: platform?.shops?.[0]?.name || "示例店铺",
          fieldSemanticType: activeField.semanticType || "",
          fieldType: activeField.type || "value",
          savedFieldValues,
        });
        setPreviewResult(result);
      } catch (e) {
        setPreviewResult({ error: e.message });
      }
    } else {
      setPreviewResult(null);
    }
  }, [debugMode, activeField, currentRule, state.rules]);

  // 键盘快捷键：上下键切换字段，Ctrl+S保存
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      )
        return;
      const currentIdx = filteredFields.findIndex(
        (f) => f.id === activeField?.id,
      );
      if (e.key === "ArrowUp" && currentIdx > 0) {
        e.preventDefault();
        setActiveField(filteredFields[currentIdx - 1]);
      } else if (
        e.key === "ArrowDown" &&
        currentIdx < filteredFields.length - 1
      ) {
        e.preventDefault();
        setActiveField(filteredFields[currentIdx + 1]);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeField) saveFieldRule(activeField.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredFields, activeField]);
  const recommendPreset = (fieldName) => {
    if (!fieldName) return null;
    const n = fieldName.toLowerCase();
    const allPresets = CalcEngine.getPresetTemplates();
    const list = [
      ...(allPresets[currentPlatform] || []),
      ...(allPresets.all || []),
    ];
    let score = list.map((p) => {
      let s = 0;
      const pn = p.name.toLowerCase();
      if (
        n.includes("销售") ||
        n.includes("收入") ||
        n.includes("实收") ||
        n.includes("gmv")
      ) {
        if (p.category === "sales") s += 10;
      }
      if (
        n.includes("成本") ||
        n.includes("扣点") ||
        n.includes("费用") ||
        n.includes("退款")
      ) {
        if (p.category === "cost") s += 10;
      }
      if (n.includes("利润") || n.includes("净利") || n.includes("roi")) {
        if (p.category === "profit") s += 10;
      }
      if (pn.includes(n) || n.includes(pn.split("·").pop().toLowerCase()))
        s += 5;
      return { p, s };
    });
    score.sort((a, b) => b.s - a.s);
    return score[0]?.s > 0 ? score[0].p : null;
  };
  const copyFieldRule = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) {
      addToast("warning", "复制失败", "请选择不同的源字段和目标字段");
      return;
    }
    const sourceRule = savedRules[sourceId];
    if (!sourceRule?.steps?.length) {
      addToast("warning", "复制失败", "源字段尚未配置规则");
      return;
    }
    Store.set((s) => ({
      ...s,
      rules: {
        ...s.rules,
        [currentPlatform]: {
          ...savedRules,
          [targetId]: {
            ...savedRules[targetId],
            steps: sourceRule.steps.map((step, i) => ({
              ...step,
              id: `step_${Date.now()}_${i}`,
            })),
          },
        },
      },
    }));
    addToast("success", "复制成功", `已复制规则到目标字段`);
    setShowCopyModal(false);
    setCopySourceFieldId("");
  };
  const clearFieldRule = (fieldId) => {
    setConfirmDialog({
      title: "确认清空规则",
      message: "确认清空此字段的计算规则？此操作不可撤销。",
      type: "warning",
      onConfirm: () => {
        Store.set((s) => ({
          ...s,
          rules: {
            ...s.rules,
            [currentPlatform]: {
              ...savedRules,
              [fieldId]: { steps: [], saved: false },
            },
          },
        }));
        addToast("info", "已清空", "字段规则已重置");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const saveFieldRule = (fieldId) => {
    const rule = savedRules[fieldId];
    if (!rule?.steps?.length) {
      addToast("warning", "保存失败", "该字段尚未配置任何计算步骤");
      return;
    }
    const validation = validateRule(
      rule,
      fields.find((f) => f.id === fieldId),
    );
    if (!validation.valid) {
      addToast("warning", "保存失败", `规则配置不完整：${validation.msg}`);
      return;
    }
    Store.set((s) => ({
      ...s,
      rules: {
        ...s.rules,
        [currentPlatform]: {
          ...savedRules,
          [fieldId]: {
            ...rule,
            saved: true,
            savedAt: new Date().toISOString(),
          },
        },
      },
    }));
    addToast("success", "保存成功", "字段规则已保存");
  };
  const getSavedFieldValues = () => {
    const savedValues = {};
    const allRules = state.rules[currentPlatform] || {};
    const samples = state.samples[currentPlatform] || [];
    const sampleTablesArr = samples.map((s, i) => ({
      id: s.id || `sample_${i}`,
      name: s.alias || s.fileName,
      originalName: s.fileName,
      headers: s.sheets[Object.keys(s.sheets)[0]]?.headers || [],
      rows: s.sheets[Object.keys(s.sheets)[0]]?.rows || [],
    }));
    const extTablesArr = (state.externals || []).map((e) => ({
      id: e.id || e.sheetKey,
      name: e.name || e.sheetKey,
      headers: e.headers || (e.allData && e.allData.length > 0 ? Object.keys(e.allData[0]) : []),
      rows: e.allData || e.data || [],
    }));
    const tables = [...sampleTablesArr, ...extTablesArr];
    const computedFields = new Set();
    const computeFieldValue = (fieldId, path = []) => {
      if (computedFields.has(fieldId)) return;
      if (path.includes(fieldId)) {
        console.warn(`循环依赖检测: ${path.join(" -> ")} -> ${fieldId}`);
        return;
      }
      const field = fields.find((f) => f.id === fieldId);
      if (!field) return;
      const rule = allRules[fieldId];
      if (!rule?.steps?.length) return;
      computedFields.add(fieldId);
      try {
        const result = CalcEngine.exec(rule, tables, {
          externals: state.externals || [],
          shopName: platform?.shops?.[0]?.name || "",
          fieldSemanticType: field.semanticType || "",
          fieldType: field.type || "",
          savedFieldValues: { ...savedValues },
        });
        if (result && result.value !== undefined && result.value !== null) {
          savedValues[field.name] =
            typeof result.value === "number"
              ? result.value
              : String(result.value);
        }
      } catch (e) {
        console.warn(`Failed to compute field ${field.name}:`, e);
      }
    };
    const sortedFields = [...fields].sort((a, b) => {
      const aSteps = allRules[a.id]?.steps?.length || 0;
      const bSteps = allRules[b.id]?.steps?.length || 0;
      return aSteps - bSteps;
    });
    sortedFields.forEach((field) => {
      if (allRules[field.id]?.steps?.length) {
        computeFieldValue(field.id, []);
      }
    });
    return savedValues;
  };
  const getStepTypeInfo = (type) => {
    const types = {
      source: {
        name: "数据源",
        desc: "选择要计算的数据表",
        icon: /*#__PURE__*/ React.createElement(Icons.Database, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "input",
      },
      fill: {
        name: "填充占位符",
        desc: "自动填充日期、店铺名等",
        icon: /*#__PURE__*/ React.createElement(Icons.Edit3, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "input",
      },
      constant: {
        name: "常量值",
        desc: "使用固定数值",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "input",
      },
      filter: {
        name: "筛选",
        desc: "按条件筛选数据行",
        icon: /*#__PURE__*/ React.createElement(Icons.Filter, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      filterEqual: {
        name: "等于筛选",
        desc: "筛选出等于指定值的行",
        icon: /*#__PURE__*/ React.createElement(Icons.Filter, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      filterContain: {
        name: "包含筛选",
        desc: "筛选出包含指定文本的行",
        icon: /*#__PURE__*/ React.createElement(Icons.Search, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      filterRange: {
        name: "范围筛选",
        desc: "筛选数值在指定范围内的行",
        icon: /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      topN: {
        name: "前N行筛选",
        desc: "只保留前N条数据",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      distinct: {
        name: "去重",
        desc: "移除重复数据行",
        icon: /*#__PURE__*/ React.createElement(Icons.Filter, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      condition: {
        name: "条件判断",
        desc: "根据条件返回不同值",
        icon: /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "filter",
      },
      limit: {
        name: "限制",
        desc: "限制输出数据行数",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "filter",
      },
      virtual: {
        name: "虚拟字段",
        desc: "转换、提取、计算字段值",
        icon: /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "transform",
      },
      lookup: {
        name: "查找替换",
        desc: "按映射表替换值",
        icon: /*#__PURE__*/ React.createElement(Icons.Search, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "transform",
      },
      sort: {
        name: "排序",
        desc: "按列升序或降序排列",
        icon: /*#__PURE__*/ React.createElement(Icons.Layers, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "transform",
      },
      text: {
        name: "文本处理",
        desc: "拼接、截取、格式化文本",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "transform",
      },
      round: {
        name: "四舍五入",
        desc: "保留指定小数位数",
        icon: /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "transform",
      },
      concat: {
        name: "字符串拼接",
        desc: "将多个字段合并为文本",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "transform",
      },
      substring: {
        name: "字符串截取",
        desc: "提取字符串的指定部分",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "transform",
      },
      date: {
        name: "日期处理",
        desc: "格式化、提取日期组件",
        icon: /*#__PURE__*/ React.createElement(Icons.Clock, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
      },
      math: {
        name: "数学运算",
        desc: "加减乘除、幂次方等运算",
        icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      aggregate: {
        name: "聚合",
        desc: "求和、平均、最大最小值等",
        icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      group: {
        name: "分组聚合",
        desc: "按列分组后聚合计算",
        icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      formula: {
        name: "公式计算",
        desc: "自定义数学公式计算",
        icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "compute",
      },
      rank: {
        name: "排名计算",
        desc: "计算数据行的排名",
        icon: /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "compute",
      },
      diff: {
        name: "差值计算",
        desc: "计算与基准值的差异",
        icon: /*#__PURE__*/ React.createElement(Icons.ArrowUpDown, null),
        color: "var(--color-danger)",
        bg: "var(--color-danger-bg)",
        category: "compute",
      },
      ratio: {
        name: "比率计算",
        desc: "计算两个值的比率",
        icon: /*#__PURE__*/ React.createElement(Icons.PieChart, null),
        color: "var(--color-accent)",
        bg: "var(--color-info-bg)",
        category: "compute",
      },
      join: {
        name: "跨表关联",
        desc: "关联全局数据表获取数据",
        icon: /*#__PURE__*/ React.createElement(Icons.Layers, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "join",
      },
      union: {
        name: "数据合并",
        desc: "合并多个数据表",
        icon: /*#__PURE__*/ React.createElement(Icons.Layers, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "join",
      },
      keepDuplicate: {
        name: "保留重复行",
        desc: "按列筛选出重复的数据行",
        icon: /*#__PURE__*/ React.createElement(Icons.Filter, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "filter",
      },
      keepUnique: {
        name: "保留唯一行",
        desc: "按列筛选出不重复的数据行",
        icon: /*#__PURE__*/ React.createElement(Icons.Filter, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "filter",
      },
      intersect: {
        name: "两表对比筛选",
        desc: "与另一表对比，保留匹配/不匹配的行",
        icon: /*#__PURE__*/ React.createElement(Icons.Layers, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "join",
      },
      crossMatch: {
        name: "跨表重复/交集",
        desc: "按多列与另一表取交集、差集，或多列去重/保留重复",
        icon: /*#__PURE__*/ React.createElement(Icons.Layers, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "join",
      },
      runningTotal: {
        name: "累计求和",
        desc: "按顺序计算累计值",
        icon: /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      percentOfTotal: {
        name: "占比计算",
        desc: "计算每个值占总值的百分比或比例",
        icon: /*#__PURE__*/ React.createElement(Icons.PieChart, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "compute",
      },
      movingAverage: {
        name: "移动平均",
        desc: "按窗口大小计算移动平均值",
        icon: /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "compute",
      },
      binning: {
        name: "数据分箱",
        desc: "将连续值按区间分组",
        icon: /*#__PURE__*/ React.createElement(Icons.Grid, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "transform",
      },
      conditionalTag: {
        name: "条件标记",
        desc: "根据条件添加标签列",
        icon: /*#__PURE__*/ React.createElement(Icons.Tag, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "transform",
      },
      stringExtract: {
        name: "字符串提取",
        desc: "正则提取、截取、拼接等",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "transform",
      },
      fillNA: {
        name: "空值填充",
        desc: "支持多种填充策略",
        icon: /*#__PURE__*/ React.createElement(Icons.Droplet, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
      },
      normalize: {
        name: "数据标准化",
        desc: "最小最大标准化、Z-score",
        icon: /*#__PURE__*/ React.createElement(Icons.Minimize2, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "compute",
      },
      cumulativeMax: {
        name: "累计最大",
        desc: "按顺序计算累计最大值",
        icon: /*#__PURE__*/ React.createElement(Icons.Maximize2, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      cumulativeMin: {
        name: "累计最小",
        desc: "按顺序计算累计最小值",
        icon: /*#__PURE__*/ React.createElement(Icons.Minimize2, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "compute",
      },
      lag: {
        name: "滞后值",
        desc: "获取前N行的值",
        icon: /*#__PURE__*/ React.createElement(Icons.ArrowLeft, null),
        color: "var(--color-danger)",
        bg: "var(--color-danger-bg)",
        category: "compute",
      },
      lead: {
        name: "领先值",
        desc: "获取后N行的值",
        icon: /*#__PURE__*/ React.createElement(Icons.ArrowRight, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      percentRank: {
        name: "百分比排名",
        desc: "计算值在数据集中的百分比位置",
        icon: /*#__PURE__*/ React.createElement(Icons.PieChart, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "compute",
      },
      rankDense: {
        name: "稠密排名",
        desc: "无间隔排名，相同值相同排名",
        icon: /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "compute",
      },
      rankRowNumber: {
        name: "行号排名",
        desc: "连续行号，相同值不同排名",
        icon: /*#__PURE__*/ React.createElement(Icons.List, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "compute",
      },
      windowSum: {
        name: "窗口求和",
        desc: "在滑动窗口内求和",
        icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        category: "compute",
      },
      windowAvg: {
        name: "窗口平均",
        desc: "在滑动窗口内计算平均值",
        icon: /*#__PURE__*/ React.createElement(Icons.Calculator, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "compute",
      },
      jsonExtract: {
        name: "JSON提取",
        desc: "从JSON字符串中提取字段",
        icon: /*#__PURE__*/ React.createElement(Icons.Braces, null),
        color: "var(--color-accent)",
        bg: "var(--color-accent-100)",
        category: "transform",
      },
      regexReplace: {
        name: "正则替换",
        desc: "使用正则表达式替换文本",
        icon: /*#__PURE__*/ React.createElement(Icons.Search, null),
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        category: "transform",
      },
      trim: {
        name: "去除空格",
        desc: "去除字符串首尾空格或指定字符",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-info)",
        bg: "var(--color-info-bg)",
        category: "transform",
      },
      upperCase: {
        name: "转大写",
        desc: "将字符串转换为大写",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "transform",
      },
      lowerCase: {
        name: "转小写",
        desc: "将字符串转换为小写",
        icon: /*#__PURE__*/ React.createElement(Icons.FileText, null),
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "transform",
      },
      dateDiff: {
        name: "日期差值",
        desc: "计算两个日期之间的天数/月数/年数",
        icon: /*#__PURE__*/ React.createElement(Icons.Clock, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "compute",
      },
      dateAdd: {
        name: "日期增减",
        desc: "对日期进行加减操作",
        icon: /*#__PURE__*/ React.createElement(Icons.Clock, null),
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
      },
    };
    return (
      types[type] || {
        name: type,
        icon: /*#__PURE__*/ React.createElement(Icons.Settings, null),
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
      }
    );
  };
  // 步骤相关辅助函数已抽离到 assets/js/rules/stepMeta.js（window.RulesStepMeta）
  // 此处使用全局引用，保持组件逻辑清晰
  const __stepMeta = window.RulesStepMeta || {};
  const validateStep = __stepMeta.validateStep || function(step, rule, field) {
    if (!step) return { valid: true, message: "" };
    return { valid: true, message: "配置完整" };
  };
  const getStepHint = __stepMeta.getStepHint || function() { return null; };
  const getCategoryInfo = __stepMeta.getCategoryInfo || function(cat) {
    return { name: cat, icon: "📦", color: "var(--color-text-tertiary)" };
  };
  const summarizeStep = __stepMeta.summarizeStep || function() { return ""; };
  const duplicateStep = (stepId) => {
    if (!activeField || !currentRule) return;
    const idx = currentRule.steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const orig = currentRule.steps[idx];
    const newStep = {
      ...orig,
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      config: { ...orig.config },
    };
    const newSteps = [
      ...currentRule.steps.slice(0, idx + 1),
      newStep,
      ...currentRule.steps.slice(idx + 1),
    ];
    Store.set((s) => ({
      ...s,
      rules: {
        ...s.rules,
        [currentPlatform]: {
          ...savedRules,
          [activeField.id]: { ...savedRules[activeField.id], steps: newSteps },
        },
      },
    }));
    setExpandedStep(newStep.id);
    addToast("success", "克隆成功", "已克隆该步骤");
  };
  const addStep = (type) => {
    if (!activeField) {
      addToast("warning", "请先选择字段", "请在左侧字段区选择一个字段后再添加步骤");
      return;
    }
    const currentSteps = currentRule?.steps || [];
    const stepLogicChecks = {
      source: () => {
        const hasSource = currentSteps.some((s) => s.type === "source");
        if (hasSource)
          return { ok: false, msg: "每个规则只能有一个「数据源」步骤" };
        if (currentSteps.length > 0)
          return { ok: false, msg: "「数据源」必须是第一个步骤" };
        return { ok: true };
      },
      fill: () => {
        // 填充占位符步骤：文本字段专用，不需要数据源
        return { ok: true };
      },
      filter: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「过滤」前需要有「数据源」" };
        const lastAggIdx = currentSteps
          .map((s, i) => (s.type === "aggregate" ? i : -1))
          .filter((i) => i >= 0)
          .pop();
        if (
          lastAggIdx !== undefined &&
          lastAggIdx >= 0 &&
          lastAggIdx < currentSteps.length - 1
        ) {
          return { ok: false, msg: "「聚合」之后不能再添加「过滤」" };
        }
        return { ok: true };
      },
      virtual: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「虚拟字段」前需要有「数据源」" };
        return { ok: true };
      },
      join: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「跨表关联」前需要有「数据源」" };
        return { ok: true };
      },
      aggregate: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「聚合」前需要有「数据源」" };
        return { ok: true };
      },
      formula: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「公式计算」前需要有「数据源」" };
        return { ok: true };
      },
      constant: () => ({ ok: true }),
      text: () => ({ ok: true }),
      distinct: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「去重」前需要有「数据源」" };
        return { ok: true };
      },
      sort: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「排序」前需要有「数据源」" };
        return { ok: true };
      },
      limit: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「限制」前需要有「数据源」" };
        return { ok: true };
      },
      lookup: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「查找替换」前需要有「数据源」" };
        return { ok: true };
      },
      condition: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「条件判断」前需要有「数据源」" };
        return { ok: true };
      },
      group: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「分组聚合」前需要有「数据源」" };
        return { ok: true };
      },
      round: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「四舍五入」前需要有「数据源」" };
        return { ok: true };
      },
      concat: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「字符串拼接」前需要有「数据源」" };
        return { ok: true };
      },
      substring: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「字符串截取」前需要有「数据源」" };
        return { ok: true };
      },
      date: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「日期处理」前需要有「数据源」" };
        return { ok: true };
      },
      math: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「数学运算」前需要有「数据源」" };
        return { ok: true };
      },
      rank: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「排名计算」前需要有「数据源」" };
        return { ok: true };
      },
      diff: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「差值计算」前需要有「数据源」" };
        return { ok: true };
      },
      ratio: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「比率计算」前需要有「数据源」" };
        return { ok: true };
      },
      union: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「数据合并」前需要有「数据源」" };
        return { ok: true };
      },
      crossMatch: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「跨表重复/交集」前需要有「数据源」" };
        return { ok: true };
      },
      runningTotal: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「累计求和」前需要有「数据源」" };
        return { ok: true };
      },
      percentOfTotal: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「占比计算」前需要有「数据源」" };
        return { ok: true };
      },
      movingAverage: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「移动平均」前需要有「数据源」" };
        return { ok: true };
      },
      binning: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「数据分箱」前需要有「数据源」" };
        return { ok: true };
      },
      conditionalTag: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「条件标记」前需要有「数据源」" };
        return { ok: true };
      },
      stringExtract: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「字符串提取」前需要有「数据源」" };
        return { ok: true };
      },
      fillNA: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「空值填充」前需要有「数据源」" };
        return { ok: true };
      },
      normalize: () => {
        if (currentSteps.length === 0)
          return { ok: false, msg: "「数据标准化」前需要有「数据源」" };
        return { ok: true };
      },
    };
    const check = stepLogicChecks[type]
      ? stepLogicChecks[type]()
      : { ok: true };
    if (!check.ok) {
      addToast("warning", "步骤顺序不符合逻辑", check.msg);
      return;
    }
    const defaultConfigs = {
      source: { tables: [], table: "", column: "" },
      fill: {
        fillType: "auto",
        value: "",
        dateFormat: "yyyy-mm",
        sourceField: "",
        groupIndex: 0,
      },
      filter: { column: "", op: "==", value: "" },
      filterEqual: { column: "", op: "==", value: "" },
      filterContain: { column: "", op: "contains", value: "" },
      filterRange: { column: "", min: "", max: "" },
      topN: { count: 10, column: "", order: "desc" },
      virtual: { source: "", target: "", rule: "copy" },
      join: { table: "", key: "", fk: "", col: "" },
      aggregate: { column: "", func: "sum" },
      formula: { expr: "{val}" },
      constant: { value: 0 },
      text: { value: "" },
      distinct: { column: "" },
      sort: { column: "", direction: "asc" },
      limit: { count: 100 },
      lookup: { column: "", pairs: [{ from: "", to: "" }] },
      condition: {
        column: "",
        op: "==",
        value: "",
        trueValue: 1,
        falseValue: 0,
        resultCol: "condition_result",
      },
      group: { column: "", func: "sum", aggColumn: "val" },
      round: { column: "", decimals: 2 },
      concat: { columns: ["", ""], separator: "" },
      substring: { column: "", start: 0, length: 10 },
      date: { column: "", format: "yyyy-mm-dd", operation: "format" },
      math: { column: "", operation: "+", value: 0 },
      rank: { column: "", direction: "desc" },
      diff: { column: "", baseColumn: "", percent: false },
      ratio: { numerator: "", denominator: "", percent: true },
      union: { tables: [] },
      crossMatch: { columns: [""], table: "", compareColumns: [""], mode: "keepIntersection" },
      runningTotal: { column: "", orderColumn: "", direction: "asc" },
      percentOfTotal: { column: "", asPercent: true },
      movingAverage: { column: "", windowSize: 3, targetColumn: "moving_avg" },
      binning: { column: "", binType: "equalWidth", binCount: 5, binLabels: [], customBins: [], targetColumn: "bin" },
      conditionalTag: { conditions: [{ column: "", op: "==", value: "", tag: "" }], targetColumn: "tag", defaultTag: "" },
      stringExtract: { column: "", extractType: "regex", pattern: "", extractGroup: 0, targetColumn: "extracted", separator: "", start: 0, length: 10, splitIndex: 0, columns: [] },
      fillNA: { column: "", fillType: "value", fillValue: "" },
      normalize: { column: "", normType: "minmax", targetColumn: "normalized" },
    };
    const newStep = {
      id: `step_${Date.now()}`,
      type,
      config: defaultConfigs[type] || {},
    };
    Store.set((s) => ({
      ...s,
      rules: {
        ...s.rules,
        [currentPlatform]: {
          ...savedRules,
          [activeField.id]: {
            ...savedRules[activeField.id],
            steps: [...currentSteps, newStep],
          },
        },
      },
    }));
    setExpandedStep(newStep.id);
    setShowAddStepModal(false);
    addToast(
      "success",
      "添加步骤",
      `已添加 ${getStepTypeInfo(type).name} 步骤`,
    );
  };
  const updateStepConfig = (stepId, key, value) => {
    if (!activeField) return;
    Store.set((s) => {
      const currentSavedRules = s.rules[currentPlatform] || {};
      const currentRuleData = currentSavedRules[activeField.id];
      if (!currentRuleData || !currentRuleData.steps) return s;
      const newSteps = currentRuleData.steps.map((step) =>
        step.id === stepId ? { ...step, config: { ...step.config, [key]: value } } : step,
      );
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...currentSavedRules,
            [activeField.id]: { ...currentRuleData, steps: newSteps },
          },
        },
      };
    });
  };
  const deleteStep = (stepId) => {
    if (!activeField || !currentRule) return;
    const step = currentRule.steps.find((s) => s.id === stepId);
    if (!step) return;
    setConfirmDialog({
      title: "确认删除步骤",
      message: `确认删除「${getStepTypeInfo(step.type).name}」步骤？此操作不可撤销。`,
      type: "danger",
      onConfirm: () => {
        const newSteps = currentRule.steps.filter((s) => s.id !== stepId);
        Store.set((s) => ({
          ...s,
          rules: {
            ...s.rules,
            [currentPlatform]: {
              ...savedRules,
              [activeField.id]: { ...savedRules[activeField.id], steps: newSteps },
            },
          },
        }));
        addToast("info", "删除步骤", "已删除计算步骤");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const moveStep = (stepId, direction) => {
    if (!activeField || !currentRule) return;
    const steps = [...currentRule.steps];
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= steps.length) return;
    [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
    Store.set((s) => ({
      ...s,
      rules: {
        ...s.rules,
        [currentPlatform]: {
          ...savedRules,
          [activeField.id]: { ...savedRules[activeField.id], steps },
        },
      },
    }));
  };
  const applyPreset = (preset) => {
    if (!activeField) return;
    Store.set((s) => ({
      ...s,
      rules: {
        ...s.rules,
        [currentPlatform]: {
          ...savedRules,
          [activeField.id]: {
            ...savedRules[activeField.id],
            steps: preset.steps.map((s, i) => ({
              ...s,
              id: `step_${Date.now()}_${i}`,
            })),
          },
        },
      },
    }));
    addToast("success", "套用模板", `已应用「${preset.name}」模板`);
  };

  const renderStepConfig = (step, currentFieldRef) => {
    const samples = state.samples[currentPlatform] || [];
    const sampleTables = samples.map((s, i) => ({
      id: s.id || `sample_${i}`,
      name: s.alias || s.fileName,
      originalName: s.fileName,
      headers: s.sheets[Object.keys(s.sheets)[0]]?.headers || [],
      rows: s.sheets[Object.keys(s.sheets)[0]]?.rows || [],
      source: "sample",
    }));
    const externalTables = (state.externals || []).map((e) => ({
      id: e.id || e.sheetKey,
      name: e.name || e.sheetKey,
      headers: e.headers || (e.allData && e.allData.length > 0 ? Object.keys(e.allData[0]) : []),
      rows: e.allData || e.rows || [],
      source: "external",
      externalId: e.id || e.sheetKey,
    }));
    const allTables = [...sampleTables, ...externalTables];
    const sourceStep = currentRule?.steps?.find((s) => s.type === "source");
    const sourceTableId = sourceStep?.config?.table;
    const sourceTableIds = sourceStep?.config?.tables || [];
    const sourceTableHeaders = (() => {
      if (sourceTableIds.length > 0) {
        const allHeaders = new Set();
        sourceTableIds.forEach((tid) => {
          const table = allTables.find((t) => t.id === tid);
          table?.headers?.forEach((h) => allHeaders.add(h));
        });
        return Array.from(allHeaders);
      }
      return allTables.find((t) => t.id === sourceTableId)?.headers || [];
    })();
    const getColumnValues = (columnName, tableId) => {
      if (!columnName) return [];
      const values = new Set();
      const targetTables = tableId
        ? allTables.filter((t) => t.id === tableId)
        : (sourceTableIds.length > 0
          ? allTables.filter((t) => sourceTableIds.includes(t.id))
          : (sourceTableId ? allTables.filter((t) => t.id === sourceTableId) : allTables));
      targetTables.forEach((table) => {
        const rows = table.rows || [];
        rows.forEach((row) => {
          const val = row[columnName];
          if (val !== undefined && val !== null && val !== "") {
            values.add(String(val));
          }
        });
      });
      return Array.from(values).slice(0, 200);
    };
    const getTableHeaders = (tableId) => {
      if (!tableId) return [];
      const t = allTables.find((t) => t.id === tableId);
      if (!t) return [];
      return t.headers || (t.rows && t.rows.length > 0 ? Object.keys(t.rows[0]) : []);
    };
    const colOpts = [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))];
    const colOptsNoVal = sourceTableHeaders.map((h) => ({ value: h, label: h }));
    const allTableOpts = [{ value: "", label: "请选择数据表" }, ...allTables.map((t) => ({ value: t.id, label: t.name }))];
    switch (step.type) {
      case "fill": {
        const currentField = currentFieldRef || {};
        const detectedType = currentField.semanticType || "auto";
        const detectedDate = (() => {
          for (const s of samples) {
            const d = CalcEngine.extractDateFromFileName(s.fileName);
            if (d) return d;
          }
          return null;
        })();
        const nowDate = new Date();
        const formatDetectedDate = (d) => {
          if (!d) return "未识别到日期";
          const m = String(d.month).padStart(2, "0");
          const day = d.day ? String(d.day).padStart(2, "0") : null;
          return day ? `${d.year}年${m}月${day}日` : `${d.year}年${m}月`;
        };
        const formatNowDate = () => {
          const y = nowDate.getFullYear();
          const m = String(nowDate.getMonth() + 1).padStart(2, "0");
          const d = String(nowDate.getDate()).padStart(2, "0");
          return `${y}年${m}月${d}日`;
        };
        const fillTypeOptions = [
          { value: "auto", label: "🤖 自动识别（根据占位符类型）", group: "智能" },
          { value: "shop", label: "🏪 店铺名（从当前店铺）", group: "常用" },
          { value: "date", label: "📅 日期（数据周期日期）", group: "常用" },
          { value: "dateNow", label: "📆 日期（当前系统日期）", group: "常用" },
          { value: "field", label: "📊 从数据字段取值", group: "高级" },
        ];
        const dateFormatOptions = [
          { value: "yyyy", label: "仅年 (2024)" },
          { value: "mm", label: "仅月 (03)" },
          { value: "dd", label: "仅日 (15)" },
          { value: "yyyy-mm", label: "年月 (2024年03月)" },
          { value: "yyyy-mm-dd", label: "年月日 (2024年03月15日)" },
          { value: "mm-dd", label: "月日 (03月15日)" },
        ];
        const quickFillTypes = ["shop", "date", "dateNow"];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Fill, null),
                " 基本设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "填充方式",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择数据填充来源"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.fillType,
                onChange: (val) => updateStepConfig(step.id, "fillType", val),
                options: fillTypeOptions,
                placeholder: "请选择填充方式",
                groupBy: "group",
              }),
              quickFillTypes.length > 0 && /*#__PURE__*/ React.createElement(
                "div",
                { className: "quick-tags" },
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "quick-tags-label" },
                  "常用："
                ),
                quickFillTypes.map((ft) =>
                  /*#__PURE__*/ React.createElement(
                    "span",
                    {
                      key: ft,
                      className: `quick-tag ${step.config.fillType === ft ? "active" : ""}`,
                      onClick: () => updateStepConfig(step.id, "fillType", ft),
                    },
                    fillTypeOptions.find((o) => o.value === ft)?.label.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "").slice(0, 4)
                  )
                )
              )
            )
          ),
          step.config.fillType === "auto" &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-box" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-title" },
                /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
                /*#__PURE__*/ React.createElement(
                  "span",
                  null,
                  "\u81EA\u52A8\u586B\u5145\u89C4\u5219",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-info-row" },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "step-info-label" },
                    "\u5F53\u524D\u5B57\u6BB5\u7C7B\u578B\uFF1A",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "step-info-value" },
                    detectedType === "shop" && "🏪 店铺名占位符",
                    detectedType === "year" && "📅 年份占位符",
                    detectedType === "month" && "📅 月份占位符",
                    detectedType === "day" && "📅 日期占位符",
                    detectedType === "date" && "📅 日期占位符",
                    detectedType === "text" && "📝 文本占位符",
                    detectedType === "value" && "💰 数值占位符",
                    ![
                      "shop",
                      "year",
                      "month",
                      "day",
                      "date",
                      "text",
                      "value",
                    ].includes(detectedType) &&
                      "❓ 未知类型（请手动选择填充方式）",
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-info-row" },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "step-info-label" },
                    "\u7CFB\u7EDF\u5C06\u81EA\u52A8\uFF1A",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "step-info-value" },
                    detectedType === "shop" && "填充当前店铺名称",
                    (detectedType === "year" ||
                      detectedType === "month" ||
                      detectedType === "day" ||
                      detectedType === "date") &&
                      "填充当前处理日期",
                    detectedType === "text" && "从数据表中提取文本值",
                    !["shop", "year", "month", "day", "date", "text"].includes(
                      detectedType,
                    ) && "需手动选择填充方式",
                  ),
                ),
              ),
            ),
          step.config.fillType === "shop" &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-box" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-title" },
                /*#__PURE__*/ React.createElement(Icons.Store, null),
                /*#__PURE__*/ React.createElement(
                  "span",
                  null,
                  "\u5E97\u94FA\u540D\u79F0\u6765\u6E90",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-info-row" },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "step-info-label" },
                    "\u586B\u5145\u503C\uFF1A",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "step-info-value highlight" },
                    "\u81EA\u52A8\u4F7F\u7528\u5F53\u524D\u5904\u7406\u7684\u5E97\u94FA\u540D\u79F0\uFF08\u4ECE\u4E0A\u4F20\u6587\u4EF6\u540D\u4E2D\u8BC6\u522B\uFF09",
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-info-tip" },
                  "\uD83D\uDCA1 \u6279\u91CF\u8BA1\u7B97\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u4ECE\u6BCF\u4E2A\u6570\u636E\u6587\u4EF6\u4E2D\u8BC6\u522B\u5BF9\u5E94\u7684\u5E97\u94FA\u540D\u5E76\u586B\u5145",
                ),
              ),
            ),
          (step.config.fillType === "date" ||
            step.config.fillType === "dateNow") &&
            /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "config-section" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "config-section-header" },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "config-section-title" },
                    /*#__PURE__*/ React.createElement(Icons.Clock, null),
                    step.config.fillType === "date" ? " 数据周期日期设置" : " 系统日期设置"
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-preview-box" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-preview-row" },
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "step-preview-label" },
                      "预览填充值："
                    ),
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "step-preview-value highlight" },
                      step.config.fillType === "date"
                        ? formatDetectedDate(detectedDate)
                        : formatNowDate()
                    )
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "form-label" },
                    "日期格式",
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "form-label-hint" },
                      "选择输出格式"
                    )
                  ),
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: step.config.dateFormat || "yyyy-mm-dd",
                    onChange: (val) => updateStepConfig(step.id, "dateFormat", val),
                    options: dateFormatOptions,
                    placeholder: "请选择日期格式",
                  })
                ),
                step.config.fillType === "date" && /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-tip-box" },
                  detectedDate
                    ? `💡 已识别数据周期：${formatDetectedDate(detectedDate)}`
                    : "💡 未识别到日期，请确保文件名包含日期信息"
                ),
                step.config.fillType === "dateNow" && /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-tip-box" },
                  "💡 使用操作系统当前日期"
                )
              ),
            ),
          step.config.fillType === "field" &&
            /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "config-section" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "config-section-header" },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "config-section-title" },
                    /*#__PURE__*/ React.createElement(Icons.Table, null),
                    " 数据字段取值设置"
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "grid-2" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "form-item" },
                    /*#__PURE__*/ React.createElement(
                      "label",
                      { className: "form-label" },
                      "数据表",
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: "form-label-hint" },
                        "选择数据来源"
                      )
                    ),
                    /*#__PURE__*/ React.createElement(SearchableSelect, {
                      value: step.config.sourceTable || "",
                      onChange: (val) => {
                        updateStepConfig(step.id, "sourceTable", val);
                        updateStepConfig(step.id, "sourceField", "");
                      },
                      options: sampleTables.map((t) => ({
                        value: t.id,
                        label: t.name,
                        group: t.source === "sample" ? "样表数据" : "外部数据"
                      })),
                      placeholder: "请选择数据表",
                      groupBy: "group",
                    })
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "form-item" },
                    /*#__PURE__*/ React.createElement(
                      "label",
                      { className: "form-label" },
                      "取值字段",
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: "form-label-hint" },
                        "选择填充字段"
                      )
                    ),
                    /*#__PURE__*/ React.createElement(SearchableSelect, {
                      value: step.config.sourceField || "",
                      onChange: (val) => updateStepConfig(step.id, "sourceField", val),
                      options: (sampleTables.find((t) => t.id === step.config.sourceTable)?.headers || []).map((h) => ({
                        value: h,
                        label: h
                      })),
                      placeholder: step.config.sourceTable ? "请选择字段" : "先选择数据表",
                      disabled: !step.config.sourceTable,
                    })
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-tip-box" },
                  "💡 从指定数据表的指定字段提取值进行填充"
                )
              ),
            ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            step.config.fillType === "auto"
              ? "🤖 系统将根据字段的占位符类型自动选择最合适的填充方式"
              : step.config.fillType === "shop"
                ? "🏪 自动使用当前处理的店铺名（从文件名识别）"
                : step.config.fillType === "date"
                  ? "📅 使用数据周期日期（从文件名/内容识别），按指定格式填充"
                  : step.config.fillType === "dateNow"
                    ? "📆 使用当前系统日期，按指定格式填充"
                    : "📊 从指定数据表的指定字段中提取值进行填充",
          ),
        );
      }
      case "source": {
        const selectedTables = step.config.tables || [];
        const firstSelectedTableHeaders = selectedTables.length > 0
          ? allTables.find((t) => t.id === selectedTables[0])?.headers || []
          : [];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Database, null),
                " 数据源配置"
              ),
              selectedTables.length > 0 && /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-badge" },
                `已选 ${selectedTables.length} 个表`
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "数据表",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "勾选需要的数据表"
                )
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "table-select-grid" },
                sampleTables.length > 0 && /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "table-select-group" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "table-select-group-label" },
                    "📁 样表数据"
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "table-select-items" },
                    sampleTables.map((t) =>
                      /*#__PURE__*/ React.createElement(
                        "label",
                        {
                          key: t.id,
                          className: `table-select-item ${selectedTables.includes(t.id) ? "selected" : ""}`
                        },
                        /*#__PURE__*/ React.createElement("input", {
                          type: "checkbox",
                          checked: selectedTables.includes(t.id),
                          onChange: (e) => {
                            const newTables = e.target.checked
                              ? [...selectedTables, t.id]
                              : selectedTables.filter((id) => id !== t.id);
                            updateStepConfig(step.id, "tables", newTables);
                          },
                        }),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "table-select-item-info" },
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "table-select-item-name" },
                            t.name
                          ),
                          t.originalName && t.name === t.originalName && /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "table-select-item-desc" },
                            t.originalName
                          )
                        )
                      )
                    )
                  )
                ),
                externalTables.length > 0 && /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "table-select-group" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "table-select-group-label" },
                    "🌐 全局数据表"
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "table-select-items" },
                    externalTables.map((t) =>
                      /*#__PURE__*/ React.createElement(
                        "label",
                        {
                          key: t.id,
                          className: `table-select-item ${selectedTables.includes(t.id) ? "selected" : ""}`
                        },
                        /*#__PURE__*/ React.createElement("input", {
                          type: "checkbox",
                          checked: selectedTables.includes(t.id),
                          onChange: (e) => {
                            const newTables = e.target.checked
                              ? [...selectedTables, t.id]
                              : selectedTables.filter((id) => id !== t.id);
                            updateStepConfig(step.id, "tables", newTables);
                          },
                        }),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "table-select-item-info" },
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "table-select-item-name" },
                            t.name
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Column, null),
                " 列选择（可选）"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "筛选列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "不选则获取全部列"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [
                  { value: "", label: "全部列" },
                  ...firstSelectedTableHeaders.map((h) => ({ value: h, label: h }))
                ],
                placeholder: selectedTables.length > 0 ? "选择列" : "请先选择数据表",
                disabled: selectedTables.length === 0,
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 💡 可选择多个数据表，数据将自动合并。选择列后仅获取该列数据，不选则获取全部列。",
          ),
        );
      }
      case "filterEqual":
      case "filterContain":
      case "filter":
        const filterValues = getColumnValues(step.config.column);
        const columnOptions = [
          { value: "val", label: "当前值 (val)" },
          ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
        ];
        const opOptions = [
          { value: "==", label: "等于" },
          { value: "!=", label: "不等于" },
          { value: ">", label: "大于" },
          { value: "<", label: "小于" },
          { value: ">=", label: "大于等于" },
          { value: "<=", label: "小于等于" },
          { value: "contains", label: "包含" },
          { value: "notContains", label: "不包含" },
          { value: "startsWith", label: "开头是" },
          { value: "endsWith", label: "结尾是" },
          { value: "isEmpty", label: "为空" },
          { value: "notEmpty", label: "不为空" },
          { value: "regex", label: "正则匹配" },
        ];
        const valueOptions = filterValues.map((v) => ({ value: v, label: v }));
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-bar" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-title" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-header-icon" },
                "🔍",
              ),
              "筛选条件",
            ),
            filterValues.length > 0 && /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-count" },
              `该列共 ${filterValues.length} 个不同值`,
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "筛选列",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column,
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: columnOptions,
                placeholder: "请选择列",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "条件",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.op,
                onChange: (val) => updateStepConfig(step.id, "op", val),
                options: opOptions,
                placeholder: "请选择条件",
              }),
            ),
          ),
          (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "筛选值",
              filterValues.length > 0 && /*#__PURE__*/ React.createElement(
                "span",
                { style: { color: "var(--color-text-muted)", fontWeight: 400, fontSize: 12, marginLeft: 6 } },
                `（可搜索筛选）`,
              ),
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.value || "",
              onChange: (val) => updateStepConfig(step.id, "value", val),
              options: valueOptions,
              placeholder: "选择或输入筛选值",
              allowCreate: true,
            }),
          ),
          filterValues.length > 0 && (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-quick-select" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-quick-label" },
              "快捷选择：",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-value-tags" },
              filterValues.slice(0, 10).map((v) =>
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    key: v,
                    className: `filter-value-tag ${step.config.value === v ? "active" : ""}`,
                    onClick: () =>
                      updateStepConfig(
                        step.id,
                        "value",
                        step.config.value === v ? "" : v,
                      ),
                  },
                  v,
                ),
              ),
              filterValues.length > 10 && /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-value-tag filter-value-more" },
                `+${filterValues.length - 10}`,
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 🎯 ",
            /*#__PURE__*/ React.createElement("strong", null, "筛选"),
            "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。下拉列表自动识别列中所有值，与Excel筛选体验一致。",
          ),
        );
      case "filterRange":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-bar" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-title" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-header-icon" },
                "📊",
              ),
              "范围筛选",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-count" },
              "筛选数值在指定范围内的数据",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "筛选列",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column,
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "最小值",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.min ?? "",
                onChange: (e) =>
                  updateStepConfig(step.id, "min", e.target.value),
                placeholder: "输入最小值",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "最大值",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.max ?? "",
                onChange: (e) =>
                  updateStepConfig(step.id, "max", e.target.value),
                placeholder: "输入最大值",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 📊 ",
            /*#__PURE__*/ React.createElement("strong", null, "范围筛选"),
            "：筛选出数值在最小值和最大值之间的数据行，两端都包含。",
          ),
        );
      case "topN":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-bar" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-title" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-header-icon" },
                "🏆",
              ),
              "前N行筛选",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-count" },
              "只保留排名靠前的行",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "保留行数",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.count ?? 10,
                onChange: (e) =>
                  updateStepConfig(step.id, "count", Number(e.target.value)),
                placeholder: "输入行数",
                min: 1,
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "排序列（可选）",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [
                  { value: "", label: "保持原顺序" },
                  ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
                ],
                placeholder: "选择排序列",
              }),
            ),
          ),
          step.config.column && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "排序方式",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.order || "desc",
              onChange: (val) => updateStepConfig(step.id, "order", val),
              options: [
                { value: "desc", label: "降序（从大到小）" },
                { value: "asc", label: "升序（从小到大）" },
              ],
              placeholder: "选择排序方式",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 🏆 ",
            /*#__PURE__*/ React.createElement("strong", null, "前N行筛选"),
            "：只保留前N条数据，可指定按某列排序后取前N行。",
          ),
        );
      case "aggregate":
        const aggregateFuncOptions = [
          { value: "sum", label: "求和 (SUM)", group: "基础统计" },
          { value: "avg", label: "平均值 (AVG)", group: "基础统计" },
          { value: "count", label: "计数 (COUNT)", group: "基础统计" },
          { value: "max", label: "最大值 (MAX)", group: "基础统计" },
          { value: "min", label: "最小值 (MIN)", group: "基础统计" },
          { value: "countDistinct", label: "去重计数", group: "高级统计" },
          { value: "median", label: "中位数", group: "高级统计" },
          { value: "product", label: "乘积", group: "高级统计" },
          { value: "stddev", label: "标准差", group: "高级统计" },
          { value: "variance", label: "方差", group: "高级统计" },
          { value: "mode", label: "众数", group: "高级统计" },
          { value: "first", label: "第一个值", group: "位置" },
          { value: "last", label: "最后一个值", group: "位置" },
          { value: "sumAbs", label: "绝对值求和", group: "特殊" },
        ];
        const columnOptionsWithVal = [
          { value: "", label: "当前值 (val)", group: "上一步结果" },
          ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
        ];
        const quickAggFuncs = ["sum", "avg", "count", "max", "min"];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Aggregate, null),
                " 聚合设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "聚合列",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "选择要聚合的数据"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.column,
                  onChange: (val) => updateStepConfig(step.id, "column", val),
                  options: columnOptionsWithVal,
                  placeholder: "请选择列",
                  groupBy: "group",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "聚合函数",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "选择计算方式"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.func,
                  onChange: (val) => updateStepConfig(step.id, "func", val),
                  options: aggregateFuncOptions,
                  placeholder: "请选择函数",
                  groupBy: "group",
                }),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "quick-tags" },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "quick-tags-label" },
                    "常用："
                  ),
                  quickAggFuncs.map((f) =>
                    /*#__PURE__*/ React.createElement(
                      "span",
                      {
                        key: f,
                        className: `quick-tag ${step.config.func === f ? "active" : ""}`,
                        onClick: () => updateStepConfig(step.id, "func", f),
                      },
                      aggregateFuncOptions.find((o) => o.value === f)?.label.split("(")[0].trim()
                    )
                  )
                )
              )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            ' 💡 将多行数据聚合成单个结果值。选择具体列名时使用该列数据；选择"当前值"时使用上一步输出的val字段。',
          ),
        );
      case "formula":
        const getAvailableFields = () => {
          const avail = [];
          avail.push({ key: "val", name: "上一步结果", type: "result" });
          if (stepResults && stepResults.length > 0) {
            const lastResult = stepResults[stepResults.length - 1];
            if (lastResult.preview && lastResult.preview.length > 0) {
              const sampleRow = lastResult.preview[0];
              Object.keys(sampleRow).forEach((k) => {
                if (k !== "val" && k !== "_groupCount") {
                  avail.push({ key: k, name: k, type: "field" });
                }
              });
            }
          }
          Object.keys(savedRules).forEach((fieldId) => {
            const field = fields.find((f) => f.id === fieldId);
            if (field && field.id !== activeField?.id && savedRules[fieldId]?.steps?.length > 0) {
              avail.push({ key: field.name, name: field.name + " (已计算字段)", type: "computed" });
            }
          });
          return avail;
        };
        const availFields = getAvailableFields();
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Formula, null),
                " 公式编辑"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "计算公式",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "支持数学运算和函数"
                )
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "formula-editor" },
                /*#__PURE__*/ React.createElement("textarea", {
                  className: "input formula-textarea",
                  value: step.config.expr,
                  onChange: (e) =>
                    updateStepConfig(step.id, "expr", e.target.value),
                  placeholder: "{val} * 0.7 + {销售额} * 0.3",
                  style: { fontFamily: "var(--font-mono)", minHeight: "80px" },
                }),
              )
            ),
            availFields.length > 1 && /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "可用字段",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "点击插入到公式"
                )
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "formula-field-list" },
                availFields.map((f, i) =>
                  /*#__PURE__*/ React.createElement(
                    "span",
                    {
                      key: i,
                      className: `formula-field-chip ${f.type}`,
                      onClick: () => {
                        const insert = f.type === "result" ? `{${f.key}}` : `{${f.name}}`;
                        const newExpr = (step.config.expr || "") + insert;
                        updateStepConfig(step.id, "expr", newExpr);
                      },
                      title: "点击插入公式",
                    },
                    f.name,
                  ),
                ),
              )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section collapsible" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Function, null),
                " 常用函数（点击插入）"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "formula-hints" },
              CalcEngine.getFormulaHints().slice(0, 10).map((hint, i) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    key: i,
                    className: "formula-hint-item",
                    onClick: () => {
                      const newExpr = (step.config.expr || "") + hint.key;
                      updateStepConfig(step.id, "expr", newExpr);
                    },
                  },
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "formula-hint-key" },
                    hint.key,
                  ),
                  /*#__PURE__*/ React.createElement("span", null, hint.desc),
                ),
              ),
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 💡 使用 ",
            /*#__PURE__*/ React.createElement("code", null, "{字段名}"),
            " 引用字段值，",
            /*#__PURE__*/ React.createElement("code", null, "{val}"),
            " 代表上一步结果，支持所有JavaScript数学函数。",
          ),
        );
      case "virtual":
        const virtualRuleOptions = [
          { value: "copy", label: "复制", group: "基础" },
          { value: "toNumber", label: "转数字", group: "类型转换" },
          { value: "toString", label: "转文本", group: "类型转换" },
          { value: "trim", label: "去除空格", group: "文本处理" },
          { value: "parseQty", label: "提取数量", group: "文本处理" },
          { value: "splitPlus", label: "按+号拆分计数", group: "文本处理" },
          { value: "abs", label: "绝对值", group: "数值计算" },
          { value: "round", label: "四舍五入", group: "数值计算" },
          { value: "floor", label: "向下取整", group: "数值计算" },
          { value: "ceil", label: "向上取整", group: "数值计算" },
          { value: "toFixed2", label: "保留2位小数", group: "数值计算" },
          { value: "percent", label: "百分比转小数", group: "数值计算" },
          { value: "parsePercent", label: "解析百分比", group: "数值计算" },
          { value: "formatMoney", label: "格式化金额", group: "数值计算" },
          { value: "toLowerCase", label: "转小写", group: "文本处理" },
          { value: "toUpperCase", label: "转大写", group: "文本处理" },
          { value: "length", label: "字符串长度", group: "文本处理" },
          { value: "substring", label: "截取子串", group: "文本处理" },
          { value: "replace", label: "替换", group: "文本处理" },
          { value: "concat", label: "拼接前后缀", group: "文本处理" },
          { value: "ifEmpty", label: "空值替换", group: "高级" },
          { value: "chineseToNumber", label: "中文数字转数字", group: "高级" },
          { value: "mapValue", label: "映射替换", group: "高级" },
          { value: "multiply", label: "乘代数", group: "数学运算" },
          { value: "divide", label: "除代数", group: "数学运算" },
          { value: "sumFields", label: "字段之和", group: "数学运算" },
          { value: "diffFields", label: "字段之差", group: "数学运算" },
        ];
        const quickVirtualRules = ["copy", "toNumber", "abs", "round", "trim"];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Transform, null),
                " 字段转换设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "源字段",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "输入字段名"
                  )
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.source,
                  onChange: (e) =>
                    updateStepConfig(step.id, "source", e.target.value),
                  placeholder: "源字段名",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "目标字段",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "输出字段名"
                  )
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.target,
                  onChange: (e) =>
                    updateStepConfig(step.id, "target", e.target.value),
                  placeholder: "目标字段名",
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "转换规则",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择数据处理方式"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.rule,
                onChange: (val) => updateStepConfig(step.id, "rule", val),
                options: virtualRuleOptions,
                placeholder: "请选择转换规则",
                groupBy: "group",
              }),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "quick-tags" },
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "quick-tags-label" },
                  "常用："
                ),
                quickVirtualRules.map((r) =>
                  /*#__PURE__*/ React.createElement(
                    "span",
                    {
                      key: r,
                      className: `quick-tag ${step.config.rule === r ? "active" : ""}`,
                      onClick: () => updateStepConfig(step.id, "rule", r),
                    },
                    virtualRuleOptions.find((o) => o.value === r)?.label
                  )
                )
              )
            )
          ),
          step.config.rule === "mapValue" &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6620\u5C04\u8868",
              ),
              /*#__PURE__*/ React.createElement("textarea", {
                className: "textarea",
                value: JSON.stringify(step.config.valueMap || {}, null, 2),
                onChange: (e) => {
                  try {
                    const map = JSON.parse(e.target.value);
                    updateStepConfig(step.id, "valueMap", map);
                  } catch {
                  }
                },
                placeholder: '{"原值1": "新值1", "原值2": "新值2"}',
                rows: 4,
              }),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u9ED8\u8BA4\u503C",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.defaultValue ?? "",
                  onChange: (e) =>
                    updateStepConfig(step.id, "defaultValue", e.target.value),
                  placeholder: "未匹配到时使用的值",
                }),
              ),
            ),
          step.config.rule === "multiply" &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u4E58\u6570",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.factor ?? 1,
                onChange: (e) =>
                  updateStepConfig(step.id, "factor", Number(e.target.value)),
                placeholder: "请输入乘数",
                step: "any",
              }),
            ),
          step.config.rule === "divide" &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u9664\u6570",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.divisor ?? 1,
                onChange: (e) =>
                  updateStepConfig(step.id, "divisor", Number(e.target.value)),
                placeholder: "请输入除数",
                step: "any",
              }),
            ),
          (step.config.rule === "sumFields" || step.config.rule === "diffFields") &&
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
                value: (step.config.fields || []).join(", "),
                onChange: (e) =>
                  updateStepConfig(step.id, "fields", e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)),
                placeholder: "字段1, 字段2, 字段3",
              }),
            ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u521B\u5EFA\u865A\u62DF\u5B57\u6BB5\uFF0C\u5BF9\u6570\u636E\u8FDB\u884C\u8F6C\u6362\u5904\u7406",
          ),
        );
      case "join": {
        const joinTable = allTables.find((t) => t.id === step.config.table);
        const joinHeaders = joinTable?.headers || [];
        const joinTableOptions = [
          ...sampleTables.map((t) => ({ value: t.id, label: t.name, group: "样表数据" })),
          ...externalTables.map((t) => ({ value: t.id, label: t.name, group: "全局数据表" }))
        ];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Join, null),
                " 关联表设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "关联数据表",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择要关联的数据表"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.table || "",
                onChange: (val) => {
                  const tbl = allTables.find((t) => t.id === val);
                  updateStepConfig(step.id, "table", val);
                  updateStepConfig(step.id, "externalId", tbl?.externalId || "");
                  updateStepConfig(step.id, "fk", "");
                  updateStepConfig(step.id, "col", "");
                },
                options: joinTableOptions,
                placeholder: "请选择数据表",
                groupBy: "group",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "主表关联键",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "主表匹配字段"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.key || "",
                  onChange: (val) => updateStepConfig(step.id, "key", val),
                  options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                  placeholder: "请选择字段",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "关联表外键",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "关联表匹配字段"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.fk || "",
                  onChange: (val) => updateStepConfig(step.id, "fk", val),
                  options: joinHeaders.map((h) => ({ value: h, label: h })),
                  placeholder: step.config.table ? "请选择字段" : "先选择关联表",
                  disabled: !step.config.table,
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "取关联表列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "要获取的数据列"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.col || "",
                onChange: (val) => updateStepConfig(step.id, "col", val),
                options: joinHeaders.map((h) => ({ value: h, label: h })),
                placeholder: step.config.table ? "请选择字段" : "先选择关联表",
                disabled: !step.config.table,
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 💡 根据主表关联键从关联表中匹配数据，将关联表中指定列的值填充到当前字段。",
          ),
        );
      }
      case "distinct":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Filter, null),
                " 去重设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "去重列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "按此列去重"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: columnOptionsWithVal,
                placeholder: "请选择列",
                groupBy: "group",
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            ' 💡 去除指定列的重复值，保留第一次出现的行。选择"当前值"时使用上一步输出的val字段。',
          ),
        );
      case "sort":
        const sortDirectionOptions = [
          { value: "asc", label: "升序 ↑（从小到大）" },
          { value: "desc", label: "降序 ↓（从大到小）" },
        ];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Sort, null),
                " 排序设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "排序列",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "按此列排序"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.column || "",
                  onChange: (val) => updateStepConfig(step.id, "column", val),
                  options: columnOptionsWithVal,
                  placeholder: "请选择列",
                  groupBy: "group",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "排序方向",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "升序或降序"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.direction || "asc",
                  onChange: (val) => updateStepConfig(step.id, "direction", val),
                  options: sortDirectionOptions,
                  placeholder: "请选择方向",
                })
              )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            ' 💡 按指定列的值排序，数字按数值排序，文本按字典序排序。选择"当前值"时使用上一步输出的val字段。',
          ),
        );
      case "limit":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u9650\u5236\u6570\u91CF",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.count,
              onChange: (e) =>
                updateStepConfig(step.id, "count", Number(e.target.value)),
              min: 1,
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u53EA\u4FDD\u7559\u524DN\u884C\u6570\u636E",
          ),
        );
      case "condition":
        const conditionOpOptions = [
          { value: "==", label: "等于", group: "比较" },
          { value: "!=", label: "不等于", group: "比较" },
          { value: ">", label: "大于", group: "比较" },
          { value: "<", label: "小于", group: "比较" },
          { value: ">=", label: "大于等于", group: "比较" },
          { value: "<=", label: "小于等于", group: "比较" },
          { value: "contains", label: "包含", group: "文本" },
        ];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Condition, null),
                " 条件判断设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "判断列",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "要判断的字段"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.column || "val",
                  onChange: (val) => updateStepConfig(step.id, "column", val),
                  options: [
                    { value: "val", label: "当前值 (val)", group: "上一步结果" },
                    ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
                  ],
                  placeholder: "请选择列",
                  groupBy: "group",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "操作符",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "判断条件"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.op || "==",
                  onChange: (val) => updateStepConfig(step.id, "op", val),
                  options: conditionOpOptions,
                  placeholder: "请选择条件",
                  groupBy: "group",
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "对比值",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "与判断列比较的值"
                )
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.value,
                onChange: (e) =>
                  updateStepConfig(step.id, "value", e.target.value),
                placeholder: "输入对比值",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "满足条件的值",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "条件成立时返回"
                  )
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.trueValue,
                  onChange: (e) =>
                    updateStepConfig(step.id, "trueValue", e.target.value),
                  placeholder: "默认 1",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "不满足的值",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "条件不成立时返回"
                  )
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.falseValue,
                  onChange: (e) =>
                    updateStepConfig(step.id, "falseValue", e.target.value),
                  placeholder: "默认 0",
                })
              )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 💡 根据条件返回不同的值，不丢弃数据。例如：如果\"销量大于100\"返回1，否则返回0。",
          ),
        );
      case "group":
        const groupFuncOptions = [
          { value: "sum", label: "求和 (SUM)", group: "基础统计" },
          { value: "avg", label: "平均值 (AVG)", group: "基础统计" },
          { value: "count", label: "计数 (COUNT)", group: "基础统计" },
          { value: "max", label: "最大值 (MAX)", group: "基础统计" },
          { value: "min", label: "最小值 (MIN)", group: "基础统计" },
          { value: "countDistinct", label: "去重计数", group: "高级" },
          { value: "median", label: "中位数", group: "高级" },
        ];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Group, null),
                " 分组聚合设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "分组列",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "按此列分组"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.column || "",
                  onChange: (val) => updateStepConfig(step.id, "column", val),
                  options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                  placeholder: "请选择分组列",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "聚合列",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "要聚合的数值"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.aggColumn || "",
                  onChange: (val) => updateStepConfig(step.id, "aggColumn", val),
                  options: columnOptionsWithVal,
                  placeholder: "请选择列",
                  groupBy: "group",
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "聚合函数",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "计算方式"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.func || "sum",
                onChange: (val) => updateStepConfig(step.id, "func", val),
                options: groupFuncOptions,
                placeholder: "请选择函数",
                groupBy: "group",
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 💡 按指定列分组后对另一列进行聚合计算，返回分组后的结果集。",
          ),
        );
      case "lookup":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u67E5\u627E\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "默认使用当前值(val)" }, ...(sourceTableHeaders || []).map((h) => ({ value: h, label: h }))],
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5339\u914D\u6A21\u5F0F",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.mode || "exact",
                onChange: (val) => updateStepConfig(step.id, "mode", val),
                options: [
                  { value: "exact", label: "精确匹配" },
                  { value: "contains", label: "包含匹配" },
                  { value: "regex", label: "正则匹配" },
                  { value: "startsWith", label: "开头匹配" },
                  { value: "endsWith", label: "结尾匹配" },
                ],
                placeholder: "请选择匹配模式",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u672A\u5339\u914D\u65F6",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.onMiss || "keep",
                onChange: (val) => updateStepConfig(step.id, "onMiss", val),
                options: [
                  { value: "keep", label: "保留原值" },
                  { value: "default", label: "使用默认值" },
                  { value: "empty", label: "置空" },
                ],
                placeholder: "请选择未匹配策略",
              }),
            ),
          ),
          step.config.onMiss === "default" &&
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u9ED8\u8BA4\u503C",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.defaultValue || "",
                onChange: (e) =>
                  updateStepConfig(step.id, "defaultValue", e.target.value),
                placeholder: "\u672A\u5339\u914D\u65F6\u8FD4\u56DE\u7684\u9ED8\u8BA4\u503C",
              }),
            ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6620\u5C04\u89C4\u5219",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 8 } },
              (step.config.pairs || []).map((pair, idx) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    key: idx,
                    style: { display: "flex", gap: 8, alignItems: "center" },
                  },
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: pair.from,
                    onChange: (e) => {
                      const newPairs = [...(step.config.pairs || [])];
                      newPairs[idx] = { ...pair, from: e.target.value };
                      updateStepConfig(step.id, "pairs", newPairs);
                    },
                    placeholder: "\u539F\u503C/\u6A21\u5F0F",
                    style: { flex: 1 },
                  }),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { style: { color: "var(--color-text-tertiary)" } },
                    "\u2192",
                  ),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: pair.to,
                    onChange: (e) => {
                      const newPairs = [...(step.config.pairs || [])];
                      newPairs[idx] = { ...pair, to: e.target.value };
                      updateStepConfig(step.id, "pairs", newPairs);
                    },
                    placeholder: "\u66FF\u6362\u503C",
                    style: { flex: 1 },
                  }),
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "btn-link danger",
                      onClick: () => {
                        const newPairs = (step.config.pairs || []).filter(
                          (_, i) => i !== idx,
                        );
                        updateStepConfig(step.id, "pairs", newPairs);
                      },
                    },
                    /*#__PURE__*/ React.createElement(Icons.Trash, null),
                  ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => {
                    const newPairs = [
                      ...(step.config.pairs || []),
                      { from: "", to: "" },
                    ];
                    updateStepConfig(step.id, "pairs", newPairs);
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Plus, null),
                " \u6DFB\u52A0\u6620\u5C04\u89C4\u5219",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6839\u636E\u6620\u5C04\u8868\u67E5\u627E\u5E76\u66FF\u6362\u503C\u3002\u652F\u6301\u7CBE\u786E\u5339\u914D\u3001\u5305\u542B\u5339\u914D\u3001\u6B63\u5219\u5339\u914D\u7B49\u591A\u79CD\u6A21\u5F0F\u3002\u53EF\u7528\u4E8E\u5C06\u6587\u672C\u63CF\u8FF0\uFF08\u5982\u300C\u767D+\u9ED1+\u7070\u300D\u300C6\u6761\u88C5\u300D\uFF09\u8F6C\u6362\u4E3A\u6570\u503C\u3002",
          ),
        );
      case "constant":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5E38\u91CF\u503C",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.value,
              onChange: (e) =>
                updateStepConfig(step.id, "value", e.target.value),
              placeholder: "\u8F93\u5165\u56FA\u5B9A\u503C\uFF0C\u5982 0 \u6216 \u672A\u5339\u914D",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u8F93\u51FA\u4E00\u4E2A\u56FA\u5B9A\u5E38\u91CF\u503C\uFF0C\u53EF\u7528\u4E8E\u9ED8\u8BA4\u503C\u6216\u5360\u4F4D",
          ),
        );
      case "text":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6587\u672C\u6A21\u677F",
            ),
            /*#__PURE__*/ React.createElement("textarea", {
              className: "textarea",
              value: step.config.value,
              onChange: (e) =>
                updateStepConfig(step.id, "value", e.target.value),
              placeholder: "\u652F\u6301 {val}\u3001{shopName} \u7B49\u53D8\u91CF\u66FF\u6362",
              rows: 3,
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5BF9\u6587\u672C\u8FDB\u884C\u53D8\u91CF\u66FF\u6362\uFF0C\u53EF\u5F15\u7528\u4E0A\u4E00\u6B65\u7ED3\u679C {val} \u548C\u4E0A\u4E0B\u6587\u53D8\u91CF",
          ),
        );
      case "round":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "输入列"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5C0F\u6570\u4F4D\u6570",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.decimals,
              onChange: (e) =>
                updateStepConfig(step.id, "decimals", Number(e.target.value)),
              min: 0,
              max: 10,
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5BF9\u6570\u503C\u8FDB\u884C\u56DB\u820D\u4E94\u5165\uFF0C\u4FDD\u7559\u6307\u5B9A\u5C0F\u6570\u4F4D\u6570",
          ),
        );
      case "concat":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u62FC\u63A5\u5B57\u6BB5",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 8 } },
              (step.config.columns || ["", ""]).map((col, idx) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  { key: idx, style: { display: "flex", gap: 8 } },
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: col,
                    onChange: (val) => {
                      const newCols = [...(step.config.columns || ["", ""])];
                      newCols[idx] = val;
                      updateStepConfig(step.id, "columns", newCols);
                    },
                    options: [{ value: "", label: "请选择字段" }, ...colOptsNoVal],
                    placeholder: "请选择字段",
                  }),
                  idx < (step.config.columns || ["", ""]).length - 1 &&
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { style: { color: "var(--color-text-tertiary)", alignSelf: "center" } },
                      "+",
                    ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  size: "sm",
                  onClick: () => {
                    const newCols = [
                      ...(step.config.columns || ["", ""]),
                      "",
                    ];
                    updateStepConfig(step.id, "columns", newCols);
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Plus, null),
                " \u6DFB\u52A0\u5B57\u6BB5",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5206\u9694\u7B26",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.separator,
              onChange: (e) =>
                updateStepConfig(step.id, "separator", e.target.value),
              placeholder: "\u5982 - \u6216 /",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5C06\u591A\u4E2A\u5B57\u6BB5\u6570\u636E\u62FC\u63A5\u6210\u5355\u4E2A\u6587\u672C",
          ),
        );
      case "substring":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "源字段"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: colOpts,
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u8D77\u59CB\u4F4D\u7F6E",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.start,
                onChange: (e) =>
                  updateStepConfig(step.id, "start", Number(e.target.value)),
                min: 0,
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u957F\u5EA6",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.length,
                onChange: (e) =>
                  updateStepConfig(step.id, "length", Number(e.target.value)),
                min: 1,
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u4ECEText\u5B57\u6BB5\u4E2D\u63D0\u53D6\u6307\u5B9A\u90E8\u5206",
          ),
        );
      case "date":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "日期字段"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: colOpts,
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "操作类型"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.operation || "format",
              onChange: (val) => updateStepConfig(step.id, "operation", val),
              options: [
                { value: "format", label: "格式化日期" },
                { value: "extractYear", label: "提取年份" },
                { value: "extractMonth", label: "提取月份" },
                { value: "extractDay", label: "提取日" },
                { value: "addDays", label: "加减天数" },
              ],
              placeholder: "请选择操作",
            }),
          ),
          step.config.operation === "format" && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "格式模板"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.format || "yyyy-mm-dd",
              onChange: (val) => updateStepConfig(step.id, "format", val),
              options: [
                { value: "yyyy-mm-dd", label: "2024-01-15" },
                { value: "yyyy/mm/dd", label: "2024/01/15" },
                { value: "yyyy年mm月dd日", label: "2024年01月15日" },
                { value: "yyyy-mm", label: "2024-01" },
                { value: "mm-dd", label: "01-15" },
              ],
              placeholder: "请选择格式",
            }),
          ),
          step.config.operation === "addDays" && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5929\u6570",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.days || 0,
              onChange: (e) =>
                updateStepConfig(step.id, "days", Number(e.target.value)),
              placeholder: "\u6B63\u6570\u52A0\u51CF\uFF0C\u8D1F\u6570\u51CF\u5C11",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u65E5\u671F\u6570\u636E\u7684\u683C\u5F0F\u5316\u548C\u7EC4\u4EF6\u63D0\u53D6",
          ),
        );
      case "math":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "输入列"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: colOpts,
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "运算符"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.operation || "+",
                onChange: (val) => updateStepConfig(step.id, "operation", val),
                options: [
                  { value: "+", label: "+" },
                  { value: "-", label: "-" },
                  { value: "*", label: "×" },
                  { value: "/", label: "÷" },
                  { value: "^", label: "幂次方" },
                  { value: "%", label: "余数" },
                ],
                placeholder: "请选择运算符",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "数值"),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.value,
                onChange: (e) =>
                  updateStepConfig(step.id, "value", Number(e.target.value)),
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5BF9\u6570\u503C\u8FDB\u884C\u7B80\u5355\u6570\u5B66\u8FD0\u7B97",
          ),
        );
      case "rank":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "排名列"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: colOpts,
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "排名方向"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.direction || "desc",
              onChange: (val) => updateStepConfig(step.id, "direction", val),
              options: [
                { value: "desc", label: "降序 (最大为1)" },
                { value: "asc", label: "升序 (最小为1)" },
              ],
              placeholder: "请选择排序方向",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6839\u636E\u6307\u5B9A\u5217\u8FDB\u884C\u6392\u540D\uFF0C\u8FD4\u56DE\u6392\u540D\u7ED3\u679C",
          ),
        );
      case "diff":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前列"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: colOpts,
                placeholder: "请选择列",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "基准列"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.baseColumn || "",
                onChange: (val) => updateStepConfig(step.id, "baseColumn", val),
                options: [{ value: "", label: "请选择基准列" }, ...colOptsNoVal],
                placeholder: "请选择基准列",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "checkbox-label" },
              /*#__PURE__*/ React.createElement("input", {
                type: "checkbox",
                checked: step.config.percent,
                onChange: (e) =>
                  updateStepConfig(step.id, "percent", e.target.checked),
              }),
              " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u8BA1\u7B97\u5F53\u524D\u503C\u4E0E\u57FA\u51C6\u503C\u7684\u5dee\u503C",
          ),
        );
      case "ratio":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "分子"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.numerator || "",
                onChange: (val) => updateStepConfig(step.id, "numerator", val),
                options: colOpts,
                placeholder: "请选择分子列",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "分母"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.denominator || "",
                onChange: (val) => updateStepConfig(step.id, "denominator", val),
                options: [{ value: "", label: "请选择分母列" }, ...colOptsNoVal],
                placeholder: "请选择分母列",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "checkbox-label" },
              /*#__PURE__*/ React.createElement("input", {
                type: "checkbox",
                checked: step.config.percent,
                onChange: (e) =>
                  updateStepConfig(step.id, "percent", e.target.checked),
              }),
              " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u8BA1\u7B97\u5206\u5B50\u4E0E\u5206\u6BCD\u7684\u6BD4\u7387",
          ),
        );
      case "union":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5408\u5E76\u6570\u636E\u8868",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 8 } },
              (step.config.tables || []).map((tableId, idx) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  { key: idx, style: { display: "flex", gap: 8 } },
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: tableId || "",
                    onChange: (val) => {
                      const newTables = [...(step.config.tables || [])];
                      newTables[idx] = val;
                      updateStepConfig(step.id, "tables", newTables);
                    },
                    options: allTableOpts,
                    placeholder: "请选择数据表",
                  }),
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "btn-link danger",
                      onClick: () => {
                        const newTables = (step.config.tables || []).filter(
                          (_, i) => i !== idx,
                        );
                        updateStepConfig(step.id, "tables", newTables);
                      },
                    },
                    /*#__PURE__*/ React.createElement(Icons.Trash, null),
                  ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  size: "sm",
                  onClick: () => {
                    const newTables = [
                      ...(step.config.tables || []),
                      "",
                    ];
                    updateStepConfig(step.id, "tables", newTables);
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Plus, null),
                " \u6DFB\u52A0\u6570\u636E\u8868",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5C06\u591A\u4E2A\u6570\u636E\u8868\u7684\u6570\u636E\u8FDB\u884C\u5408\u5E76",
          ),
        );
      case "keepDuplicate":
      case "keepUnique":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "判断列"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            step.type === "keepDuplicate"
              ? " 按指定列判断，仅保留出现过多次的重复行（重复行会全部保留）"
              : " 按指定列判断，仅保留只出现过一次的唯一行",
          ),
        );
      case "intersect":
        return (() => {
          const intersectModeOptions = [
            { value: "keepExist", label: "保留存在于对比表的行（交集）" },
            { value: "keepNotExist", label: "保留不存在于对比表的行（差集）" },
          ];
          const intersectTableHeaders = getTableHeaders(step.config.table);
          const allTableOptions = [{ value: "", label: "请选择数据表" }, ...allTables.map((t) => ({ value: t.id, label: t.name }))];
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-config" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比模式"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.mode || "keepExist",
                onChange: (val) => updateStepConfig(step.id, "mode", val),
                options: intersectModeOptions,
                placeholder: "请选择对比模式",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前表关联列"),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.key || "",
                  onChange: (val) => updateStepConfig(step.id, "key", val),
                  options: [{ value: "", label: "请选择列" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                  placeholder: "请选择列",
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比数据表"),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.table || "",
                  onChange: (val) => {
                    updateStepConfig(step.id, "table", val);
                    updateStepConfig(step.id, "compareKey", "");
                  },
                  options: allTableOptions,
                  placeholder: "请选择数据表",
                }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比表关联列"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.compareKey || "",
                onChange: (val) => updateStepConfig(step.id, "compareKey", val),
                options: [{ value: "", label: "请选择列" }, ...intersectTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: step.config.table ? "请选择列" : "请先选择对比表",
                disabled: !step.config.table,
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-desc" },
              /*#__PURE__*/ React.createElement(Icons.Info, null),
              " 将当前表与另一表按指定列进行对比，筛选出匹配或不匹配的行",
            ),
          );
        })();
      case "crossMatch":
        return (() => {
          const crossMatchModeOptions = [
            { value: "keepIntersection", label: "保留与对比表的交集行" },
            { value: "keepDifference", label: "保留不在对比表的差集行" },
            { value: "removeDuplicates", label: "当前数据多列去重" },
            { value: "keepDuplicates", label: "当前数据保留重复行" },
          ];
          const compareTableHeaders = getTableHeaders(step.config.table);
          const columns = step.config.columns || [""];
          const compareColumns = step.config.compareColumns || [""];
          const needCompareTable = step.config.mode === "keepIntersection" || step.config.mode === "keepDifference";
          const allTableOptions = [{ value: "", label: "请选择数据表" }, ...allTables.map((t) => ({ value: t.id, label: t.name }))];
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-config" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "处理模式"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.mode || "keepIntersection",
                onChange: (val) => updateStepConfig(step.id, "mode", val),
                options: crossMatchModeOptions,
                placeholder: "请选择处理模式",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前表匹配列"),
              columns.map((col, idx) => /*#__PURE__*/ React.createElement(
                "div",
                { key: idx, className: "grid-2", style: { marginBottom: 6, gap: 6 } },
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: col,
                  onChange: (val) => {
                    const newCols = [...columns];
                    newCols[idx] = val;
                    updateStepConfig(step.id, "columns", newCols.filter(Boolean));
                  },
                  options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                  placeholder: "选择匹配列",
                }),
                columns.length > 1 && /*#__PURE__*/ React.createElement("button", {
                  className: "btn-icon",
                  onClick: () => {
                    const newCols = columns.filter((_, i) => i !== idx);
                    updateStepConfig(step.id, "columns", newCols.length ? newCols : [""]);
                  },
                  title: "删除此列",
                }, "×"),
              )),
              /*#__PURE__*/ React.createElement("button", {
                className: "btn-text",
                onClick: () => updateStepConfig(step.id, "columns", [...columns, ""]),
                style: { marginTop: 4 },
              }, "+ 添加匹配列"),
            ),
            needCompareTable && /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比数据表"),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.table || "",
                  onChange: (val) => {
                    updateStepConfig(step.id, "table", val);
                    updateStepConfig(step.id, "compareColumns", [""]);
                  },
                  options: allTableOptions,
                  placeholder: "请选择数据表",
                }),
              ),
              step.config.table && /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比表匹配列"),
                compareColumns.map((col, idx) => /*#__PURE__*/ React.createElement(
                  "div",
                  { key: idx, className: "grid-2", style: { marginBottom: 6, gap: 6 } },
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: col,
                    onChange: (val) => {
                      const newCols = [...compareColumns];
                      newCols[idx] = val;
                      updateStepConfig(step.id, "compareColumns", newCols.filter(Boolean));
                    },
                    options: compareTableHeaders.map((h) => ({ value: h, label: h })),
                    placeholder: "选择对比列",
                  }),
                  compareColumns.length > 1 && /*#__PURE__*/ React.createElement("button", {
                    className: "btn-icon",
                    onClick: () => {
                      const newCols = compareColumns.filter((_, i) => i !== idx);
                      updateStepConfig(step.id, "compareColumns", newCols.length ? newCols : [""]);
                    },
                    title: "删除此列",
                  }, "×"),
                )),
                /*#__PURE__*/ React.createElement("button", {
                  className: "btn-text",
                  onClick: () => updateStepConfig(step.id, "compareColumns", [...compareColumns, ""]),
                  style: { marginTop: 4 },
                }, "+ 添加对比列"),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-desc" },
              /*#__PURE__*/ React.createElement(Icons.Info, null),
              " 按多个列组合进行跨表交集、差集或当前数据的去重/保留重复。",
            ),
          );
        })();
      case "runningTotal":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u7D2F\u8BA1\u5217",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u5217",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6392\u5E8F\u5217\uFF08\u53EF\u9009\uFF09",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.orderColumn || "",
                onChange: (val) => updateStepConfig(step.id, "orderColumn", val),
                options: [{ value: "", label: "\u4FDD\u6301\u539F\u987A\u5E8F" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u9009\u62E9\u6392\u5E8F\u5217",
              }),
            ),
          ),
          step.config.orderColumn && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6392\u5E8F\u65B9\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.direction || "asc",
              onChange: (val) => updateStepConfig(step.id, "direction", val),
              options: [
                { value: "asc", label: "\u5347\u5E8F\uFF08\u4ECE\u5C0F\u5230\u5927\uFF09" },
                { value: "desc", label: "\u964D\u5E8F\uFF08\u4ECE\u5927\u5230\u5C0F\uFF09" },
              ],
              placeholder: "\u9009\u62E9\u6392\u5E8F\u65B9\u5F0F",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6309\u884C\u987A\u5E8F\u8BA1\u7B97\u7D2F\u8BA1\u503C\uFF0C\u53EF\u9009\u6309\u67D0\u5217\u6392\u5E8F\u540E\u7D2F\u8BA1\u3002",
          ),
        );
      case "percentOfTotal":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8BA1\u7B97\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "checkbox-label" },
              /*#__PURE__*/ React.createElement("input", {
                type: "checkbox",
                checked: step.config.asPercent !== false,
                onChange: (e) => updateStepConfig(step.id, "asPercent", e.target.checked),
              }),
              " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u8BA1\u7B97\u6BCF\u884C\u503C\u5360\u603B\u548C\u7684\u6BD4\u4F8B\uFF0C\u53EF\u9009\u8F6C\u4E3A\u767E\u5206\u6BD4\u3002",
          ),
        );
      case "movingAverage":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u8BA1\u7B97\u5217",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u5217",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u7A97\u53E3\u5927\u5C0F",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.windowSize || 3,
                onChange: (e) => updateStepConfig(step.id, "windowSize", parseInt(e.target.value) || 3),
                min: 1,
                max: 100,
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u51FA\u5217\u540D",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.targetColumn || "moving_avg",
              onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
              placeholder: "moving_avg",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6309\u7A97\u53E3\u5927\u5C0E\u8BA1\u7B97\u6EDA\u52A8\u79FB\u52A8\u5E73\u5747\u503C\uFF0C\u7A97\u53E3\u5927\u5C0E\u8868\u793A\u53C2\u8003\u7684\u524D N \u884C\u6570\u636E\u3002",
          ),
        );
      case "binning":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5206\u7BB1\u5217",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u5217",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5206\u7BB1\u65B9\u5F0F",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.binType || "equalWidth",
                onChange: (val) => updateStepConfig(step.id, "binType", val),
                options: [
                  { value: "equalWidth", label: "\u7B49\u5BBD\u5206\u7BB1" },
                  { value: "custom", label: "\u81EA\u5B9A\u4E49\u5206\u7BB1" },
                ],
                placeholder: "\u8BF7\u9009\u62E9\u5206\u7BB1\u65B9\u5F0F",
              }),
            ),
          ),
          step.config.binType === "equalWidth" && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u5206\u7BB1\u6570\u91CF",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "number",
                  className: "input",
                  value: step.config.binCount || 5,
                  onChange: (e) => updateStepConfig(step.id, "binCount", parseInt(e.target.value) || 5),
                  min: 1,
                  max: 20,
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u8F93\u51FA\u5217\u540D",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.targetColumn || "bin",
                  onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
                  placeholder: "bin",
                }),
              ),
            ),
          ),
          step.config.binType === "custom" && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u81EA\u5B9A\u4E49\u5206\u7BB1\u533A\u95F4",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "multi-row-config" },
                (step.config.customBins || []).map((bin, idx) =>
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { key: idx, className: "multi-row-item" },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "number",
                      className: "input input-sm",
                      value: bin.min || "",
                      onChange: (e) => {
                        const bins = [...(step.config.customBins || [])];
                        bins[idx] = { ...bins[idx], min: e.target.value };
                        updateStepConfig(step.id, "customBins", bins);
                      },
                      placeholder: "\u4E0B\u9650",
                    }),
                    /*#__PURE__*/ React.createElement("span", null, "-"),
                    /*#__PURE__*/ React.createElement("input", {
                      type: "number",
                      className: "input input-sm",
                      value: bin.max || "",
                      onChange: (e) => {
                        const bins = [...(step.config.customBins || [])];
                        bins[idx] = { ...bins[idx], max: e.target.value };
                        updateStepConfig(step.id, "customBins", bins);
                      },
                      placeholder: "\u4E0A\u9650",
                    }),
                    /*#__PURE__*/ React.createElement("input", {
                      type: "text",
                      className: "input input-sm",
                      value: bin.label || "",
                      onChange: (e) => {
                        const bins = [...(step.config.customBins || [])];
                        bins[idx] = { ...bins[idx], label: e.target.value };
                        updateStepConfig(step.id, "customBins", bins);
                      },
                      placeholder: "\u533A\u95F4\u540D",
                    }),
                    /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "btn-icon btn-icon-danger",
                        onClick: () => {
                          const bins = (step.config.customBins || []).filter((_, i) => i !== idx);
                          updateStepConfig(step.id, "customBins", bins);
                        },
                      },
                      /*#__PURE__*/ React.createElement(Icons.Trash, null),
                    ),
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "btn btn-sm btn-secondary",
                    onClick: () => {
                      const bins = [...(step.config.customBins || []), { min: "", max: "", label: "" }];
                      updateStepConfig(step.id, "customBins", bins);
                    },
                  },
                  /*#__PURE__*/ React.createElement(Icons.Plus, null),
                  " \u6DFB\u52A0\u533A\u95F4",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u8F93\u51FA\u5217\u540D",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.targetColumn || "bin",
                onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
                placeholder: "bin",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5C06\u8FDE\u7EED\u6570\u636E\u5206\u7BB1\u4E3A\u5206\u7C7B\u533A\u95F4\uFF0C\u7B49\u5BBD\u5206\u7BB1\u81EA\u52A8\u8BA1\u7B97\u95F4\u9694\uFF0C\u81EA\u5B9A\u4E49\u5206\u7BB1\u53EF\u6307\u5B9A\u8D77\u6B62\u533A\u95F4\u3002",
          ),
        );
      case "conditionalTag":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u51FA\u5217\u540D",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.targetColumn || "tag",
              onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
              placeholder: "tag",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6807\u8BB0\u6761\u4EF6\u89C4\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "multi-row-config" },
              (step.config.conditions || []).map((cond, idx) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  { key: idx, className: "multi-row-item condition-row" },
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: cond.column || "",
                    onChange: (val) => {
                      const conditions = [...(step.config.conditions || [])];
                      conditions[idx] = { ...conditions[idx], column: val };
                      updateStepConfig(step.id, "conditions", conditions);
                    },
                    options: [{ value: "", label: "val" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                    placeholder: "\u5217",
                  }),
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: cond.op || "==",
                    onChange: (val) => {
                      const conditions = [...(step.config.conditions || [])];
                      conditions[idx] = { ...conditions[idx], op: val };
                      updateStepConfig(step.id, "conditions", conditions);
                    },
                    options: [
                      { value: "==", label: "\u7B49\u4E8E" },
                      { value: "!=" },
                      { value: ">", label: "\u5927\u4E8E" },
                      { value: "<", label: "\u5C0E\u4E8E" },
                      { value: ">=" },
                      { value: "<=" },
                      { value: "contains", label: "\u5305\u542B" },
                      { value: "notContains", label: "\u4E0D\u5305\u542B" },
                      { value: "startsWith", label: "\u5F00\u59CB\u4E3A" },
                      { value: "endsWith", label: "\u7ED3\u5C3E\u4E3A" },
                      { value: "isEmpty", label: "\u4E3A\u7A7A" },
                      { value: "notEmpty", label: "\u4E0D\u4E3A\u7A7A" },
                      { value: "regex", label: "\u6B63\u5219" },
                    ],
                    placeholder: "\u8FD0\u7B97",
                  }),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input input-sm",
                    value: cond.value || "",
                    onChange: (e) => {
                      const conditions = [...(step.config.conditions || [])];
                      conditions[idx] = { ...conditions[idx], value: e.target.value };
                      updateStepConfig(step.id, "conditions", conditions);
                    },
                    placeholder: "\u503C",
                  }),
                  /*#__PURE__*/ React.createElement("span", null, "\u2192"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input input-sm",
                    value: cond.tag || "",
                    onChange: (e) => {
                      const conditions = [...(step.config.conditions || [])];
                      conditions[idx] = { ...conditions[idx], tag: e.target.value };
                      updateStepConfig(step.id, "conditions", conditions);
                    },
                    placeholder: "\u6807\u8BB1",
                  }),
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "btn-icon btn-icon-danger",
                      onClick: () => {
                        const conditions = (step.config.conditions || []).filter((_, i) => i !== idx);
                        updateStepConfig(step.id, "conditions", conditions);
                      },
                    },
                    /*#__PURE__*/ React.createElement(Icons.Trash, null),
                  ),
                )
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-sm btn-secondary",
                  onClick: () => {
                    const conditions = [...(step.config.conditions || []), { column: "", op: "==", value: "", tag: "" }];
                    updateStepConfig(step.id, "conditions", conditions);
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Plus, null),
                " \u6DFB\u52A0\u6761\u4EF6",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u9ED8\u8BA4\u6807\u8BB1",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.defaultTag || "",
              onChange: (e) => updateStepConfig(step.id, "defaultTag", e.target.value),
              placeholder: "\u6240\u6709\u6761\u4EF6\u90FD\u4E0D\u6EE1\u8DB3\u65F6\u7684\u9ED8\u8BA4\u6807\u8BB1",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6EE1\u8DB3\u6761\u4EF6\u65F6\u6DFB\u52A0\u6807\u8BB1\uFF0C\u8BA1\u7B97\u7ED3\u679C\u4E3A\u65B0\u5217\u3002\u6761\u4EF6\u6309\u987A\u5E8F\u5339\u9145\uFF0C\u6EE1\u8DB3\u7B2C\u4E00\u4E2A\u6761\u4EF6\u5373\u7ED3\u675F\u3002",
          ),
        );
      case "stringExtract":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6E90\u5217",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u6E90\u5217",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u8F93\u51FA\u5217\u540D",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.targetColumn || "extracted",
                onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
                placeholder: "extracted",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F6C\u6362\u65B9\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.extractType || "regex",
              onChange: (val) => updateStepConfig(step.id, "extractType", val),
              options: [
                { value: "regex", label: "\u6B63\u5219\u63D0\u53D6" },
                { value: "substring", label: "\u5B50\u4E32\u622A\u53D6" },
                { value: "concat", label: "\u5217\u62FC\u63A5" },
                { value: "split", label: "\u5206\u9694\u63D0\u53D6" },
                { value: "trim", label: "\u524D\u540E\u7A7A\u5228\u9664" },
                { value: "upper", label: "\u8F6C\u5927\u5199" },
                { value: "lower", label: "\u8F6C\u5C0E\u5199" },
              ],
              placeholder: "\u8BF7\u9009\u62E9\u8F6C\u6362\u65B9\u5F0F",
            }),
          ),
          step.config.extractType === "regex" && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6B63\u5219\u8868\u8F93\u5F0F",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.pattern || "",
                onChange: (e) => updateStepConfig(step.id, "pattern", e.target.value),
                placeholder: "\u4F8B\u5982: \\d+",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u63D0\u53D6\u5206\u7EC4\uFF08\u7B2C\u4E00\u4E2A\u5206\u7EC4\u4E3A 0\uFF09",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.extractGroup || 0,
                onChange: (e) => updateStepConfig(step.id, "extractGroup", parseInt(e.target.value) || 0),
                min: 0,
              }),
            ),
          ),
          step.config.extractType === "substring" && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u5F00\u59CB\u4F4D\u7F6E",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "number",
                  className: "input",
                  value: step.config.start || 0,
                  onChange: (e) => updateStepConfig(step.id, "start", parseInt(e.target.value) || 0),
                  min: 0,
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u957F\u5EA6",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "number",
                  className: "input",
                  value: step.config.length || 10,
                  onChange: (e) => updateStepConfig(step.id, "length", parseInt(e.target.value) || 10),
                  min: 1,
                }),
              ),
            ),
          ),
          step.config.extractType === "concat" && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u62FC\u63A5\u5217\uFF08\u7528\u82F1\u6587\u4E0E\u5218\u540D\u5206\u9694\uFF0C\u4F8B\u5982\uFF1A\u5546\u54C1ID,\u89C4\u683C\uFF09",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: (step.config.columns || []).join(","),
                onChange: (e) => updateStepConfig(step.id, "columns", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)),
                placeholder: "\u4F8B\u5982\uFF1A\u5546\u54C1ID,\u89C4\u683C",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5206\u9694\u7B26",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.separator || "",
                onChange: (e) => updateStepConfig(step.id, "separator", e.target.value),
                placeholder: "\u4F8B\u5982\uFF1A- \u6216\u7A7A\u4E3A\u76F4\u63A5\u62FC\u63A5",
              }),
            ),
          ),
          step.config.extractType === "split" && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u5206\u9694\u7B26",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.separator || ",",
                  onChange: (e) => updateStepConfig(step.id, "separator", e.target.value),
                  placeholder: "\u4F8B\u5982\uFF1A,",
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u63D0\u53D6\u4F4D\u7F6E\uFF08\u7B2C\u4E00\u4E2A\u4E3A 0\uFF09",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "number",
                  className: "input",
                  value: step.config.splitIndex || 0,
                  onChange: (e) => updateStepConfig(step.id, "splitIndex", parseInt(e.target.value) || 0),
                  min: 0,
                }),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5BF9\u5B57\u7B26\u4E32\u8FDB\u884C\u63D0\u53D6\u3001\u622A\u53D6\u3001\u62FC\u63A5\u3001\u5206\u9694\u6216\u5176\u4ED6\u64CD\u4F5C\u3002",
          ),
        );
      case "fillNA":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5904\u740E\u5217",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u5217",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5904\u740E\u65B9\u5F0F",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.fillType || "value",
                onChange: (val) => updateStepConfig(step.id, "fillType", val),
                options: [
                  { value: "value", label: "\u6307\u5B9A\u503C" },
                  { value: "zero", label: "\u7528\u96F6\u5904\u740E" },
                  { value: "empty", label: "\u7528\u7A7A\u5B57\u7B26\u4E32\u5904\u740E" },
                  { value: "mean", label: "\u7528\u5E73\u5747\u503C\u5904\u740E" },
                  { value: "median", label: "\u7528\u4E2D\u4F4D\u6570\u5904\u740E" },
                  { value: "mode", label: "\u7528\u4F17\u6570\u5904\u740E" },
                  { value: "forward", label: "\u524D\u5411\u5904\u740E" },
                  { value: "backward", label: "\u540E\u5411\u5904\u740E" },
                ],
                placeholder: "\u8BF7\u9009\u62E9\u5904\u740E\u65B9\u5F0F",
              }),
            ),
          ),
          step.config.fillType === "value" && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5904\u740E\u503C",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.fillValue || "",
              onChange: (e) => updateStepConfig(step.id, "fillValue", e.target.value),
              placeholder: "\u8BF7\u8F93\u5165\u5904\u740E\u503C",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5BF9\u7A7A\u503C\uFF08null\u3001\u7A7A\u5B57\u7B26\u4E32\u3001NaN\uFF09\u8FDB\u884C\u5904\u740E\uFF0C\u53EF\u6307\u5B9A\u5E38\u91CF\u6216\u4F7F\u7528\u7EDF\u8BA1\u65B9\u5F0F\u5904\u740E\u3002",
          ),
        );
      case "normalize":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6807\u51C6\u5316\u5217",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u5217",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u8F93\u51FA\u5217\u540D",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.targetColumn || "normalized",
                onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
                placeholder: "normalized",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6807\u51C6\u5316\u65B9\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.normType || "minmax",
              onChange: (val) => updateStepConfig(step.id, "normType", val),
              options: [
                { value: "minmax", label: "\u6700\u5C0E-\u6700\u5927\u6807\u51C6\u5316 (Min-Max)" },
                { value: "zscore", label: "Z-score \u6807\u51C6\u5316" },
                { value: "decimal", label: "\u5C0E\u5C0E\u5B9A\u6807\u5316" },
              ],
              placeholder: "\u8BF7\u9009\u62E9\u6807\u51C6\u5316\u65B9\u5F0F",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5BF9\u6570\u636E\u8FDB\u884C\u6807\u51C6\u5316\uFF0C\u7ED3\u679C\u4E3A 0-1 \u4E4B\u95F4\u7684\u6570\u636E\uFF0C\u7528\u4E8E\u4E0D\u540C\u5355\u4F4D\u6570\u636E\u7684\u5BF9\u6BD4\u3002",
          ),
        );
      default:
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6B64\u6B65\u9AA4\u7C7B\u578B\u914D\u7F6E\u5F00\u53D1\u4E2D...",
          ),
        );
    }
  };
  const renderPresetGrid = () => {
    const allPresets = CalcEngine.getPresetTemplates();
    const platformPresets = allPresets[presetCategory] || allPresets.all || [];
    const categoryKeys = ["all", "pdd", "taobao", "douyin"];
    const platformNames = {
      all: "通用",
      pdd: "拼多多",
      taobao: "淘宝",
      douyin: "抖音",
    };
    const recommend = activeField ? recommendPreset(activeField.name) : null;
    return /*#__PURE__*/ React.createElement(
      React.Fragment,
      null,
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preset-tabs" },
        categoryKeys.map((key) => {
          const count = (allPresets[key] || []).length;
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              key: key,
              className: `preset-tab ${presetCategory === key ? "active" : ""}`,
              onClick: () => setPresetCategory(key),
            },
            platformNames[key],
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "preset-tab-count" },
              count,
            ),
          );
        }),
      ),
      recommend &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "preset-recommend" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "preset-recommend-tag" },
            /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
            " \u667A\u80FD\u63A8\u8350",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "preset-recommend-content" },
            /*#__PURE__*/ React.createElement(
              "div",
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "preset-recommend-name" },
                recommend.name,
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "preset-recommend-desc" },
                recommend.desc,
              ),
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                type: "primary",
                size: "sm",
                onClick: () => applyPreset(recommend),
              },
              "\u4E00\u952E\u5E94\u7528",
            ),
          ),
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preset-grid" },
        platformPresets.map((preset) => {
          const catInfo = getCategoryInfo(preset.category);
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              key: preset.id,
              className: "preset-card",
              onClick: () => applyPreset(preset),
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  className: "preset-card-category",
                  style: { color: catInfo.color },
                },
                catInfo.icon,
                " ",
                catInfo.name,
              ),
              preset.level !== undefined &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: `preset-card-level level-${preset.level}` },
                  "L",
                  preset.level,
                ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-title" },
              preset.name,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-desc" },
              preset.desc,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-steps" },
              preset.steps.length,
              " \u4E2A\u6B65\u9AA4",
            ),
          );
        }),
        platformPresets.length === 0 &&
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "empty",
              style: { gridColumn: "1 / -1", padding: "30px 20px" },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "empty-icon" },
              "\uD83D\uDCCB",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "empty-text" },
              "\u8BE5\u5206\u7C7B\u6682\u65E0\u6A21\u677F",
            ),
          ),
      ),
    );
  };
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "fade-in rules-page" },
    fields.length === 0
      ? /*#__PURE__*/ React.createElement(
          "div",
          { className: "rules-empty-full" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "rules-empty-icon" },
            /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "rules-empty-title" },
            "暂无模板配置",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "rules-empty-desc" },
            "请先在模板中心上传利润表模板，系统将自动识别占位符并生成可配置字段",
          ),
          /*#__PURE__*/ React.createElement(
            Button,
            {
              type: "primary",
              onClick: () => onNavigate && onNavigate("template"),
            },
            /*#__PURE__*/ React.createElement(Icons.ArrowRight, null),
            " 前往模板中心",
          ),
        )
      : /*#__PURE__*/ React.createElement(
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
              "\u6A21\u677F\u5B57\u6BB5",
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "tag tag-default" },
              filteredFields.length,
              "/",
              fields.length,
            ),
          ),
          fields.length > 0 &&
            /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "field-filter-tabs" },
                [
                  { key: "all", label: "全部", count: fields.length },
                  {
                    key: "done",
                    label: "已配置",
                    count: fields.filter((f) => {
                      const s = savedRules[f.id]?.steps || [];
                      return (
                        s.length > 0 && validateRule(savedRules[f.id], f).valid
                      );
                    }).length,
                  },
                  {
                    key: "pending",
                    label: "未配置",
                    count: fields.filter(
                      (f) => (savedRules[f.id]?.steps || []).length === 0,
                    ).length,
                  },
                  {
                    key: "warning",
                    label: "有问题",
                    count: fields.filter((f) => {
                      const s = savedRules[f.id]?.steps || [];
                      return (
                        s.length > 0 && !validateRule(savedRules[f.id], f).valid
                      );
                    }).length,
                  },
                ].map((tab) =>
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      key: tab.key,
                      className: `field-filter-tab ${fieldFilter === tab.key ? "active" : ""}`,
                      onClick: () => setFieldFilter(tab.key),
                    },
                    tab.label,
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "field-filter-count" },
                      tab.count,
                    ),
                  ),
                ),
              ),
            ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "field-list-wrapper" },
            fields.length === 0
              ? /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "rules-empty-state",
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-icon" },
                    /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-title" },
                    "暂无模板配置",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-desc" },
                    "请先在模板中心上传利润表模板，系统将自动识别占位符并生成可配置字段",
                  ),
                  /*#__PURE__*/ React.createElement(
                    Button,
                    {
                      type: "primary",
                      onClick: () => onNavigate && onNavigate("template"),
                    },
                    /*#__PURE__*/ React.createElement(Icons.ArrowRight, null),
                    " 前往模板中心",
                  ),
                )
              : /*#__PURE__*/ React.createElement(
                  "ul",
                  { className: "field-list" },
                  filteredFields.length === 0
                ? /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        padding: 20,
                        textAlign: "center",
                        color: "var(--color-text-tertiary)",
                        fontSize: 13,
                      },
                    },
                    "\u672A\u627E\u5230\u5339\u914D\u5B57\u6BB5",
                  )
                : filteredFields.map((field) => {
                    const level = inferFieldLevel(field);
                    const validation = validateRule(
                      savedRules[field.id],
                      field,
                    );
                    const stepCount = (savedRules[field.id]?.steps || [])
                      .length;
                    return /*#__PURE__*/ React.createElement(
                      "li",
                      {
                        key: field.id,
                        className: `field-item ${activeField?.id === field.id ? "active" : ""}`,
                        onClick: () => setActiveField(field),
                      },
                      /*#__PURE__*/ React.createElement("span", {
                        className: `field-dot ${stepCount > 0 ? (validation.valid ? "done" : "partial") : ""}`,
                      }),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "field-item-content" },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "field-name" },
                          field.name,
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "field-meta" },
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "field-cell" },
                            field.cell,
                          ),
                          stepCount > 0 &&
                            /*#__PURE__*/ React.createElement(
                              "span",
                              { className: "field-step-count" },
                              stepCount,
                              "\u6B65",
                            ),
                          level !== null &&
                            /*#__PURE__*/ React.createElement(
                              "span",
                              { className: `field-level-tag level-${level}` },
                              "L",
                              level,
                            ),
                          stepCount > 0 &&
                            !validation.valid &&
                            /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                className: "field-warning",
                                title: validation.msg,
                              },
                              "\u26A0",
                            ),
                        ),
                      ),
                    );
                  }),
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
              { style: { flex: 1 } },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "card-title", style: { fontSize: 14 } },
                /*#__PURE__*/ React.createElement(Icons.Calculator, null),
                activeField ? `「${activeField.name}」计算规则` : "请选择字段",
              ),
              activeField &&
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "card-desc" },
                  "\u5355\u5143\u683C ",
                  activeField.cell,
                  " \xB7 ",
                  activeField.type === "text" ? "文本填充" : "数值填充",
                  (() => {
                    const v = validateRule(currentRule, activeField);
                    return /*#__PURE__*/ React.createElement(
                      "span",
                      {
                        className: `field-status ${v.valid ? "valid" : "invalid"}`,
                      },
                      v.valid ? "✓ " + v.msg : "⚠ " + v.msg,
                    );
                  })(),
                ),
            ),
            activeField &&
              /*#__PURE__*/ React.createElement(
                "div",
                { style: { display: "flex", gap: 8, alignItems: "center" } },
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "btn-icon",
                    onClick: () => {
                      const idx = filteredFields.findIndex(
                        (f) => f.id === activeField.id,
                      );
                      if (idx > 0) setActiveField(filteredFields[idx - 1]);
                    },
                    disabled:
                      filteredFields.findIndex(
                        (f) => f.id === activeField.id,
                      ) <= 0,
                    title: "\u4E0A\u4E00\u4E2A\u5B57\u6BB5",
                    style: {
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-text-secondary)",
                      fontSize: 12,
                    },
                  },
                  "\u2039",
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    style: {
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                      minWidth: 40,
                      textAlign: "center",
                    },
                  },
                  filteredFields.findIndex((f) => f.id === activeField.id) + 1,
                  "/",
                  filteredFields.length,
                ),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "btn-icon",
                    onClick: () => {
                      const idx = filteredFields.findIndex(
                        (f) => f.id === activeField.id,
                      );
                      if (idx < filteredFields.length - 1)
                        setActiveField(filteredFields[idx + 1]);
                    },
                    disabled:
                      filteredFields.findIndex(
                        (f) => f.id === activeField.id,
                      ) >=
                      filteredFields.length - 1,
                    title: "\u4E0B\u4E00\u4E2A\u5B57\u6BB5",
                    style: {
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-text-secondary)",
                      fontSize: 12,
                    },
                  },
                  "\u203A",
                ),
                /*#__PURE__*/ React.createElement("div", {
                  style: {
                    width: 1,
                    height: 20,
                    background: "var(--color-border-light)",
                    margin: "0 4px",
                  },
                }),
                currentRule?.steps?.length > 0 &&
                  /*#__PURE__*/ React.createElement(
                    React.Fragment,
                    null,
                    /*#__PURE__*/ React.createElement(
                      Button,
                      {
                        size: "sm",
                        onClick: () => clearFieldRule(activeField.id),
                      },
                      /*#__PURE__*/ React.createElement(Icons.Refresh, null),
                      "\u6E05\u7A7A",
                    ),

                  ),
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
                /*#__PURE__*/ React.createElement(
                  Button,
                  {
                    type: "primary",
                    size: "sm",
                    onClick: () => setShowAddStepModal(true),
                  },
                  /*#__PURE__*/ React.createElement(Icons.Plus, null),
                  "\u6DFB\u52A0\u6B65\u9AA4",
                ),
                /*#__PURE__*/ React.createElement(
                  Button,
                  {
                    type: "primary",
                    size: "sm",
                    onClick: () => saveFieldRule(activeField.id),
                  },
                  /*#__PURE__*/ React.createElement(Icons.Save, null),
                  "\u4FDD\u5B58\u89C4\u5219",
                ),
              ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card-scroll" },
            fields.length === 0
              ? /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "rules-empty-state",
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-icon" },
                    /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, null),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-title" },
                    "暂无模板配置",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-desc" },
                    "请先在模板中心上传利润表模板，系统将自动识别占位符并生成可配置字段",
                  ),
                  /*#__PURE__*/ React.createElement(
                    Button,
                    {
                      type: "primary",
                      onClick: () => onNavigate && onNavigate("template"),
                    },
                    /*#__PURE__*/ React.createElement(Icons.ArrowRight, null),
                    " 前往模板中心",
                  ),
                )
              : !activeField
              ? /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "rules-empty-state rules-empty-state-hint",
                  },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-icon" },
                    /*#__PURE__*/ React.createElement(Icons.Edit3, null),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-title" },
                    "请选择字段",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-empty-desc" },
                    "请从左侧选择一个字段开始配置计算规则",
                  ),
                )
              : /*#__PURE__*/ React.createElement(
                React.Fragment,
                null,
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "field-type-hint", style: { marginBottom: 12 } },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "field-type-hint-title" },
                    /*#__PURE__*/ React.createElement(Icons.Info, null),
                    /*#__PURE__*/ React.createElement(
                      "span",
                      null,
                      "\u5F53\u524D\u5B57\u6BB5\uFF1A",
                      activeField.name,
                    ),
                    activeField.semanticType &&
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: "field-type-badge" },
                        activeField.semanticType === "shop" && "🏪 店铺名",
                        activeField.semanticType === "year" && "📅 年份",
                        activeField.semanticType === "month" && "📅 月份",
                        activeField.semanticType === "day" && "📅 日期",
                        activeField.semanticType === "date" && "📅 日期",
                        activeField.semanticType === "value" && "💰 数值",
                        activeField.semanticType === "text" && "📝 文本",
                        ![
                          "shop",
                          "year",
                          "month",
                          "day",
                          "date",
                          "value",
                          "text",
                        ].includes(activeField.semanticType) && "📦 占位符",
                      ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "field-type-hint-desc" },
                    activeField.semanticType === "shop" &&
                      "该字段为店铺名占位符。系统会自动从上传文件名中识别店铺名并填充。",
                    (activeField.semanticType === "year" ||
                      activeField.semanticType === "month" ||
                      activeField.semanticType === "day" ||
                      activeField.semanticType === "date") &&
                      "该字段为日期占位符。系统会自动填充当前处理数据的对应日期部分。",
                    activeField.semanticType === "value" &&
                      "该字段为数值占位符，需要通过计算步骤从数据源获取值。",
                    activeField.semanticType === "text" &&
                      "该字段为文本占位符，可从数据源字段中提取文本。",
                  ),
                ),
                showPresets &&
                  /*#__PURE__*/ React.createElement(
                    "div",
                    {
                      style: {
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom: "1px solid var(--color-border-light)",
                      },
                    },
                    renderPresetGrid(),
                  ),
                debugMode &&
                  previewResult &&
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "debug-preview" + (debugExpanded ? "" : " collapsed") },
                    /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "debug-preview-header", onClick: () => setDebugExpanded(!debugExpanded), style: { cursor: "pointer" } },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "debug-preview-header-left" },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "debug-preview-icon-wrap" },
                          /*#__PURE__*/ React.createElement(Icons.Play, null),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "debug-preview-title-group" },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "debug-preview-title" },
                            "\u5B9E\u65F6\u9884\u89C8\u7ED3\u679C",
                          ),
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "debug-preview-subtitle" },
                            activeField?.name || "\u5F53\u524D\u5B57\u6BB5",
                          ),
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { style: { display: "flex", alignItems: "center", gap: "12px" } },
                        /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            className: `debug-status ${previewResult.error ? "error" : "success"}`,
                          },
                          previewResult.error
                            ? /*#__PURE__*/ React.createElement(Icons.AlertCircle, null)
                            : /*#__PURE__*/ React.createElement(Icons.CheckCircle, null),
                          previewResult.error ? "\u8BA1\u7B97\u9519\u8BEF" : "\u8BA1\u7B97\u6210\u529F",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "span",
                          { style: { fontSize: "12px", color: "var(--color-text-tertiary)", transition: "transform 0.2s", transform: debugExpanded ? "rotate(180deg)" : "rotate(0deg)" } },
                          /*#__PURE__*/ React.createElement(Icons.ChevronDown, null),
                        ),
                      ),
                    ),
                    previewResult.error
                      ? /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "debug-error" },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "debug-error-icon-wrap" },
                            /*#__PURE__*/ React.createElement(Icons.AlertCircle, null),
                          ),
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "debug-error-content" },
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-error-title" },
                              "\u8BA1\u7B97\u51FA\u9519",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-error-message" },
                              previewResult.error,
                            ),
                          ),
                        )
                      : /*#__PURE__*/ React.createElement(
                          React.Fragment,
                          null,
                          /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "debug-final-result" },
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-final-label" },
                              /*#__PURE__*/ React.createElement(Icons.Zap, null),
                              "\u6700\u7EC8\u7ED3\u679C",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-final-value" },
                              typeof previewResult.value === "number"
                                ? previewResult.value.toLocaleString("zh-CN", {
                                    maximumFractionDigits: 2,
                                  })
                                : String(previewResult.value ?? "-"),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-final-meta" },
                              /*#__PURE__*/ React.createElement(
                                "span",
                                { className: "debug-final-meta-item" },
                                /*#__PURE__*/ React.createElement(Icons.Database, null),
                                "\u5171 ",
                                previewResult.data?.length || 0,
                                " \u6761\u6570\u636E",
                              ),
                              previewResult.stepResults?.length > 0 && /*#__PURE__*/ React.createElement(
                                "span",
                                { className: "debug-final-meta-item" },
                                /*#__PURE__*/ React.createElement(Icons.List, null),
                                previewResult.stepResults.length,
                                " \u4E2A\u6B65\u9AA4",
                              ),
                            ),
                          ),
                          previewResult.data &&
                            previewResult.data.length > 0 &&
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-data-preview" },
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "debug-section-title" },
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  { className: "debug-section-title-icon" },
                                  /*#__PURE__*/ React.createElement(Icons.Table, null),
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "span",
                                  { className: "debug-section-title-text" },
                                  "\u6570\u636E\u9884\u89C8",
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "span",
                                  { className: "debug-section-badge" },
                                  "\u524D5\u6761",
                                ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "debug-table-wrap" },
                                /*#__PURE__*/ React.createElement(
                                  "table",
                                  { className: "debug-table" },
                                  /*#__PURE__*/ React.createElement(
                                    "thead",
                                    null,
                                    /*#__PURE__*/ React.createElement(
                                      "tr",
                                      null,
                                      /*#__PURE__*/ React.createElement(
                                        "th",
                                        null,
                                        "#",
                                      ),
                                      Object.keys(previewResult.data[0] || {})
                                        .slice(0, 6)
                                        .map((k) =>
                                          /*#__PURE__*/ React.createElement(
                                            "th",
                                            { key: k, className: k === "val" ? "debug-col-val" : "" },
                                            k === "val" ? "\u8BA1\u7B97\u503C" : k,
                                          ),
                                        ),
                                    ),
                                  ),
                                  /*#__PURE__*/ React.createElement(
                                    "tbody",
                                    null,
                                    previewResult.data
                                      .slice(0, 5)
                                      .map((row, i) =>
                                        /*#__PURE__*/ React.createElement(
                                          "tr",
                                          { key: i },
                                          /*#__PURE__*/ React.createElement(
                                            "td",
                                            null,
                                            i + 1,
                                          ),
                                          Object.entries(row)
                                            .slice(0, 6)
                                            .map(([k, v], j) =>
                                              /*#__PURE__*/ React.createElement(
                                                "td",
                                                { key: j, className: k === "val" ? "debug-col-val" : "" },
                                                typeof v === "number"
                                                  ? v.toLocaleString("zh-CN", {
                                                      maximumFractionDigits: 2,
                                                    })
                                                  : v != null
                                                    ? String(v)
                                                    : /*#__PURE__*/ React.createElement(
                                                        "span",
                                                        null,
                                                        "-",
                                                      ),
                                              ),
                                            ),
                                        ),
                                      ),
                                  ),
                                ),
                              ),
                              previewResult.data.length > 5 &&
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  { className: "debug-table-footer" },
                                  "\u4EC5\u663E\u793A\u524D 5 \u6761\uFF0C\u5171 ",
                                  previewResult.data.length,
                                  " \u6761\u6570\u636E",
                                ),
                            ),
                          previewResult.stepResults &&
                            previewResult.stepResults.length > 0 &&
                            /*#__PURE__*/ React.createElement(
                              "div",
                              { className: "debug-step-results" },
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "debug-section-title" },
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  { className: "debug-section-title-icon" },
                                  /*#__PURE__*/ React.createElement(Icons.Activity, null),
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "span",
                                  { className: "debug-section-title-text" },
                                  "\u6BCF\u6B65\u8BA1\u7B97\u8BE6\u60C5",
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "span",
                                  { className: "debug-section-badge" },
                                  previewResult.stepResults.length,
                                  " \u6B65",
                                ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "debug-steps" },
                                previewResult.stepResults.map((sr, idx) => {
                                  const stepInfo = getStepTypeInfo(sr.type);
                                  return /*#__PURE__*/ React.createElement(
                                    "div",
                                    {
                                      key: idx,
                                      className: `debug-step-item ${sr.error ? "error" : ""}`,
                                    },
                                    /*#__PURE__*/ React.createElement(
                                      "div",
                                      { className: "debug-step-left" },
                                      /*#__PURE__*/ React.createElement(
                                        "div",
                                        { className: "debug-step-index" },
                                        idx + 1,
                                      ),
                                      /*#__PURE__*/ React.createElement(
                                        "div",
                                        {
                                          className: "debug-step-icon",
                                          style: { color: stepInfo.color, background: stepInfo.bg },
                                        },
                                        stepInfo.icon,
                                      ),
                                    ),
                                    /*#__PURE__*/ React.createElement(
                                      "div",
                                      { className: "debug-step-info" },
                                      /*#__PURE__*/ React.createElement(
                                        "div",
                                        { className: "debug-step-header" },
                                        /*#__PURE__*/ React.createElement(
                                          "div",
                                          { className: "debug-step-name" },
                                          stepInfo.name,
                                        ),
                                      ),
                                      sr.error
                                        ? /*#__PURE__*/ React.createElement(
                                            React.Fragment,
                                            null,
                                            /*#__PURE__*/ React.createElement(
                                              "div",
                                              { className: "debug-step-error-header" },
                                              /*#__PURE__*/ React.createElement(Icons.AlertCircle, null),
                                              "\u6267\u884C\u5931\u8D25",
                                            ),
                                            /*#__PURE__*/ React.createElement(
                                              "div",
                                              { className: "debug-step-error" },
                                              sr.error,
                                            ),
                                          )
                                        : /*#__PURE__*/ React.createElement(
                                            "div",
                                            { className: "debug-step-details" },
                                            /*#__PURE__*/ React.createElement(
                                              "div",
                                              { className: "debug-step-meta-row" },
                                              /*#__PURE__*/ React.createElement(
                                                "span",
                                                { className: "debug-step-meta-tag highlight" },
                                                /*#__PURE__*/ React.createElement(Icons.Database, null),
                                                sr.rows?.length || sr.rows || 0,
                                                " \u884C",
                                              ),
                                              sr.columns && /*#__PURE__*/ React.createElement(
                                                "span",
                                                { className: "debug-step-meta-tag" },
                                                /*#__PURE__*/ React.createElement(Icons.Columns, null),
                                                sr.columns,
                                                " \u5217",
                                              ),
                                            ),
                                            sr.preview && sr.preview.length > 0 && /*#__PURE__*/ React.createElement(
                                              "div",
                                              { className: "debug-step-preview-box" },
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { className: "debug-step-preview-label" },
                                                /*#__PURE__*/ React.createElement(Icons.Eye, null),
                                                "\u9884\u89C8\u6570\u636E",
                                              ),
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { className: "debug-step-preview-content" },
                                                sr.preview.slice(0, 3).map((row, ri) => /*#__PURE__*/ React.createElement(
                                                  "div",
                                                  { key: ri, className: "debug-step-preview-row" },
                                                  Object.entries(row).map(([k, v]) => /*#__PURE__*/ React.createElement(
                                                    "span",
                                                    { key: k, className: "debug-step-preview-cell" },
                                                    /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-preview-key" },
                                                      k,
                                                    ),
                                                    ": ",
                                                    /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-preview-value" },
                                                      typeof v === "number"
                                                        ? v.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                                                        : v != null
                                                          ? String(v).slice(0, 30)
                                                          : "-",
                                                    ),
                                                  ),
                                                )),
                                              )),
                                              sr.preview.length > 3 && /*#__PURE__*/ React.createElement(
                                                "span",
                                                { className: "debug-step-preview-more" },
                                                `...(\u5171${sr.preview.length}\u6761)`,
                                              ),
                                            ),
                                            sr.value !== undefined && sr.value !== null && sr.value !== "" && /*#__PURE__*/ React.createElement(
                                              "div",
                                              { className: "debug-step-value-box" },
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { className: "debug-step-value-icon" },
                                                /*#__PURE__*/ React.createElement(Icons.Zap, null),
                                              ),
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { className: "debug-step-value-content-wrap" },
                                                /*#__PURE__*/ React.createElement(
                                                  "div",
                                                  { className: "debug-step-value-label" },
                                                  "\u8F93\u51FA\u503C",
                                                ),
                                                /*#__PURE__*/ React.createElement(
                                                  "div",
                                                  { className: "debug-step-value-content" },
                                                  typeof sr.value === "number"
                                                    ? sr.value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                                                    : typeof sr.value === "object"
                                                      ? JSON.stringify(sr.value).slice(0, 80)
                                                      : String(sr.value),
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
                  ),
                currentRule?.steps?.length > 0 &&
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-visual-flow" },
                    currentRule.steps.map((step, idx) => {
                      const info = getStepTypeInfo(step.type);
                      return /*#__PURE__*/ React.createElement(
                        React.Fragment,
                        { key: step.id },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            className: `flow-step ${idx === expandedStep ? "active" : ""}`,
                            onClick: () =>
                              setExpandedStep(
                                expandedStep === step.id ? null : step.id,
                              ),
                            style: { borderColor: info.color },
                          },
                          info.icon,
                          /*#__PURE__*/ React.createElement(
                            "span",
                            null,
                            idx + 1,
                            ". ",
                            info.name,
                          ),
                        ),
                        idx < currentRule.steps.length - 1 &&
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "flow-arrow" },
                            "\u2192",
                          ),
                      );
                    }),
                  ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "steps-list" },
                  !currentRule?.steps?.length
                    ? /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty", style: { padding: "40px 20px" } },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty-icon" },
                          "\uD83E\uDDEE",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty-text" },
                          "\u6682\u65E0\u8BA1\u7B97\u6B65\u9AA4",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "empty-desc" },
                          "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u8BA1\u7B97\u6B65\u9AA4\uFF0C\u6216\u5C55\u5F00\u89C4\u5219\u6A21\u677F\u5957\u7528\u9884\u8BBE",
                        ),
                      )
                    : currentRule.steps.map((step, idx) => {
                        const info = getStepTypeInfo(step.type);
                        const isExpanded = expandedStep === step.id;
                        const stepValidation = validateStep(
                          step,
                          currentRule,
                          activeField,
                        );
                        const stepHints = getStepHint(
                          step,
                          currentRule,
                          activeField,
                        );
                        const hasHints = stepHints && stepHints.length > 0;
                        const hasWarnings =
                          hasHints &&
                          stepHints.some(
                            (h) => h.type === "warning" || h.type === "error",
                          );
                        const statusType = !stepValidation.valid
                          ? "error"
                          : hasWarnings
                            ? "warning"
                            : "success";
                        return /*#__PURE__*/ React.createElement(
                          "div",
                          {
                            key: step.id,
                            className: `step-card ${!stepValidation.valid ? "has-error" : ""} ${hasWarnings ? "has-warning" : ""}`,
                          },
                          /*#__PURE__*/ React.createElement(
                            "div",
                            {
                              className: "step-header",
                              onClick: () =>
                                setExpandedStep(isExpanded ? null : step.id),
                            },
                            /*#__PURE__*/ React.createElement(
                              "div",
                              {
                                className: "step-number",
                                style: { background: info.color },
                              },
                              idx + 1,
                            ),
                            /*#__PURE__*/ React.createElement(
                              "span",
                              { style: { color: info.color, fontSize: 16 } },
                              info.icon,
                            ),
                            /*#__PURE__*/ React.createElement(
                              "span",
                              { className: "step-title" },
                              info.name,
                            ),
                            /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                className: "step-summary",
                                title: summarizeStep(step),
                              },
                              summarizeStep(step),
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              {
                                className: `step-status-icon ${statusType}`,
                                title:
                                  stepValidation.message ||
                                  (hasWarnings ? "有提示建议" : "配置正确"),
                              },
                              statusType === "success"
                                ? "✓"
                                : statusType === "warning"
                                  ? "!"
                                  : "×",
                            ),
                            /*#__PURE__*/ React.createElement(
                              "div",
                              {
                                className: "step-actions",
                                onClick: (e) => e.stopPropagation(),
                              },
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "step-action-group" },
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className:
                                      "step-action-btn step-action-move",
                                    onClick: () => moveStep(step.id, "up"),
                                    disabled: idx === 0,
                                    title: "\u4E0A\u79FB",
                                  },
                                  /*#__PURE__*/ React.createElement(
                                    Icons.MoveUp,
                                    null,
                                  ),
                                ),
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className:
                                      "step-action-btn step-action-move",
                                    onClick: () => moveStep(step.id, "down"),
                                    disabled:
                                      idx === currentRule.steps.length - 1,
                                    title: "\u4E0B\u79FB",
                                  },
                                  /*#__PURE__*/ React.createElement(
                                    Icons.MoveDown,
                                    null,
                                  ),
                                ),
                              ),
                              /*#__PURE__*/ React.createElement("div", {
                                className: "step-action-divider",
                              }),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className:
                                    "step-action-btn step-action-duplicate",
                                  onClick: () => duplicateStep(step.id),
                                  title: "\u514B\u9686\u6B65\u9AA4",
                                },
                                /*#__PURE__*/ React.createElement(
                                  Icons.Copy,
                                  null,
                                ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className:
                                    "step-action-btn step-action-toggle",
                                  title: isExpanded ? "收起" : "展开",
                                  onClick: () =>
                                    setExpandedStep(
                                      isExpanded ? null : step.id,
                                    ),
                                },
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  {
                                    className: `chevron-icon ${isExpanded ? "rotated" : ""}`,
                                  },
                                  /*#__PURE__*/ React.createElement(
                                    Icons.ChevronDown,
                                    null,
                                  ),
                                ),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "button",
                                {
                                  className: "step-action-btn danger",
                                  onClick: () => deleteStep(step.id),
                                  title: "\u5220\u9664",
                                },
                                /*#__PURE__*/ React.createElement(
                                  Icons.Trash,
                                  null,
                                ),
                              ),
                            ),
                          ),
                          isExpanded &&
                            /*#__PURE__*/ React.createElement(
                              "div",
                              null,
                              !stepValidation.valid &&
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  { className: "step-alert error" },
                                  /*#__PURE__*/ React.createElement(
                                    Icons.AlertCircle,
                                    null,
                                  ),
                                  /*#__PURE__*/ React.createElement(
                                    "span",
                                    null,
                                    stepValidation.message,
                                  ),
                                ),
                              stepHints &&
                                stepHints.length > 0 &&
                                stepHints.map((hint, hi) =>
                                  /*#__PURE__*/ React.createElement(
                                    "div",
                                    {
                                      key: hi,
                                      className: `step-alert ${hint.type}`,
                                    },
                                    /*#__PURE__*/ React.createElement(
                                      "span",
                                      null,
                                      hint.text,
                                    ),
                                  ),
                                ),
                              renderStepConfig(step, activeField),
                            ),
                        );
                      }),
                ),
              ),
            !activeField &&
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  className: "rules-guide",
                  style: {
                    flex: 1,
                    overflow: "auto",
                    padding: "24px",
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-guide-hero" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "empty-icon", style: { fontSize: 48, marginBottom: 12 } },
                    "\uD83D\uDC46",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "empty-text", style: { fontSize: 16, fontWeight: 600, marginBottom: 4 } },
                    "\u8BF7\u9009\u62E9\u5DE6\u4FA7\u5B57\u6BB5\u5F00\u59CB\u914D\u7F6E",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "empty-desc" },
                    "\u9009\u62E9\u5B57\u6BB5\u540E\u53EF\u914D\u7F6E\u5BF9\u5E94\u7684\u8BA1\u7B97\u89C4\u5219",
                  ),
                ),
              ),
          ),
        ),
      ),
      showCopyModal &&
        /*#__PURE__*/ React.createElement(
          Modal,
          {
            title: "\u590D\u5236\u89C4\u5219\u5230\u5176\u4ED6\u5B57\u6BB5",
            onClose: () => {
              setShowCopyModal(false);
              setCopySourceFieldId("");
            },
            footer: /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  onClick: () => {
                    setShowCopyModal(false);
                    setCopySourceFieldId("");
                  },
                },
                "\u53D6\u6D88",
              ),
              /*#__PURE__*/ React.createElement(
                Button,
                {
                  type: "primary",
                  disabled: !copySourceFieldId,
                  onClick: () =>
                    copyFieldRule(copySourceFieldId, activeField?.id),
                },
                "\u786E\u8BA4\u590D\u5236",
              ),
            ),
          },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "copy-rule-form" },
            /*#__PURE__*/ React.createElement(
              Alert,
              { type: "info" },
              "\u5C06\u5DF2\u914D\u7F6E\u5B57\u6BB5\u7684\u89C4\u5219\u590D\u5236\u5230\u5F53\u524D\u5B57\u6BB5\u300C",
              activeField?.name,
              "\u300D\u3002\u6E90\u5B57\u6BB5\u548C\u76EE\u6807\u5B57\u6BB5\u4E0D\u80FD\u76F8\u540C\u3002",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item", style: { marginTop: 12 } },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u9009\u62E9\u6E90\u5B57\u6BB5\uFF08\u8981\u590D\u5236\u5176\u89C4\u5219\u7684\u5B57\u6BB5\uFF09",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: copySourceFieldId || "",
                onChange: (val) => setCopySourceFieldId(val),
                options: [
                  { value: "", label: "请选择源字段" },
                  ...fields
                    .filter((f) => (savedRules[f.id]?.steps || []).length > 0 && f.id !== activeField?.id)
                    .map((f) => ({ value: f.id, label: `${f.name} (${(savedRules[f.id]?.steps || []).length}个步骤)` })),
                ],
                placeholder: "请选择源字段",
              }),
            ),
            copySourceFieldId &&
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "copy-rule-preview" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "copy-rule-preview-title" },
                  "\u6E90\u89C4\u5219\u9884\u89C8\uFF1A",
                ),
                (savedRules[copySourceFieldId]?.steps || []).map((s, i) => {
                  const info = getStepTypeInfo(s.type);
                  return /*#__PURE__*/ React.createElement(
                    "div",
                    { key: s.id, className: "copy-rule-step" },
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { style: { color: info.color } },
                      i + 1,
                      ". ",
                      info.name,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "copy-rule-step-summary" },
                      summarizeStep(s),
                    ),
                  );
                }),
              ),
          ),
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
    showAddStepModal &&
      /*#__PURE__*/ React.createElement(
        Modal,
        {
          title: "\u6DFB\u52A0\u8BA1\u7B97\u6B65\u9AA4",
          width: "900px",
          onClose: () => setShowAddStepModal(false),
          footer: /*#__PURE__*/ React.createElement(
            Button,
            { onClick: () => setShowAddStepModal(false) },
            "\u53D6\u6D88",
          ),
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-type-modal" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-type-search" },
            /*#__PURE__*/ React.createElement(Icons.Search, null),
            /*#__PURE__*/ React.createElement(
              "input",
              {
                type: "text",
                className: "step-type-search-input",
                placeholder: "搜索计算步骤类型...",
                value: stepSearchKeyword,
                onChange: (e) => setStepSearchKeyword(e.target.value),
              },
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-type-categories" },
            [
              { id: "all", name: "全部", icon: Icons.LayoutGrid },
              { id: "input", name: "数据输入", icon: Icons.FileText },
              { id: "filter", name: "数据筛选", icon: Icons.Filter },
              { id: "transform", name: "数据转换", icon: Icons.ArrowRightLeft },
              { id: "compute", name: "计算聚合", icon: Icons.Calculator },
              { id: "join", name: "跨表关联", icon: Icons.Link },
            ].map((cat) => /*#__PURE__*/ React.createElement(
              "button",
              {
                key: cat.id,
                className: "step-type-category-tab" + (stepCategory === cat.id ? " active" : ""),
                onClick: () => setStepCategory(cat.id),
              },
              /*#__PURE__*/ React.createElement(cat.icon, { size: 14 }),
              cat.name,
            )),
          ),
          [
            {
              id: "input",
              title: "\uD83D\uDCE5 \u6570\u636E\u8F93\u5165",
              desc: "\u5B9A\u4E49\u6570\u636E\u6765\u6E90\u548C\u57FA\u7840\u586B\u5145",
              types: ["source", "fill", "constant"],
              color: "var(--color-primary)",
            },
            {
              id: "filter",
              title: "\uD83D\uDD0D \u6570\u636E\u7B5B\u9009",
              desc: "\u8FC7\u6EE4\u3001\u53BB\u91CD\u3001\u9650\u5236\u6570\u636E\u8303\u56F4",
              types: ["filter", "filterEqual", "filterContain", "filterRange", "topN", "distinct", "condition", "limit", "keepDuplicate", "keepUnique"],
              color: "var(--color-warning)",
            },
            {
              id: "transform",
              title: "\uD83D\uDD04 \u6570\u636E\u8F6C\u6362",
              desc: "\u8F6C\u6362\u3001\u66FF\u6362\u3001\u6392\u5E8F\u3001\u65E5\u671F\u5904\u7406\u3001\u7A7A\u503C\u5904\u7406",
              types: ["virtual", "lookup", "sort", "text", "round", "concat", "substring", "date", "stringExtract", "fillNA", "binning", "conditionalTag", "jsonExtract", "regexReplace", "trim", "upperCase", "lowerCase", "dateAdd"],
              color: "var(--color-info)",
            },
            {
              id: "compute",
              title: "\uD83E\uDDEA \u8BA1\u7B97\u805A\u5408",
              desc: "\u6C42\u548C\u3001\u5E73\u5747\u3001\u516C\u5F0F\u3001\u6392\u540D\u3001\u6BD4\u7387\u3001\u7D2F\u8BA1\u3001\u5360\u6BD4",
              types: ["aggregate", "group", "formula", "math", "rank", "diff", "ratio", "runningTotal", "percentOfTotal", "movingAverage", "normalize", "cumulativeMax", "cumulativeMin", "lag", "lead", "percentRank", "rankDense", "rankRowNumber", "windowSum", "windowAvg", "dateDiff"],
              color: "var(--color-success)",
            },
            {
              id: "join",
              title: "\uD83D\uDD17 \u8DE8\u8868\u5173\u8054",
              desc: "\u5173\u8054\u5168\u5C40\u6570\u636E\u8868\u3001\u5408\u5E76\u6570\u636E\u3001\u8DE8\u8868\u4EA4\u96C6/\u53BB\u91CD",
              types: ["join", "union", "crossMatch", "intersect"],
              color: "var(--color-accent)",
            },
          ].filter((group) => stepCategory === "all" || group.id === stepCategory).map((group) => {
            const filteredTypes = group.types.filter((type) => {
              const info = getStepTypeInfo(type);
              return info.name.toLowerCase().includes(stepSearchKeyword.toLowerCase()) ||
                info.desc.toLowerCase().includes(stepSearchKeyword.toLowerCase());
            });
            if (filteredTypes.length === 0) return null;
            return /*#__PURE__*/ React.createElement(
              "div",
              { key: group.id, className: "step-type-group" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-group-header" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-group-info" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-group-title-row" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      {
                        className: "step-type-group-dot",
                        style: { background: group.color },
                      },
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-type-group-title" },
                      group.title,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      {
                        className: "step-type-group-count",
                        style: { color: group.color, background: group.color + "15" },
                      },
                      filteredTypes.length + " 种",
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-group-desc" },
                    group.desc,
                  ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-grid" },
                filteredTypes.map((type) => {
                  const info = getStepTypeInfo(type);
                  return /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      key: type,
                      className: "step-type-card",
                      onClick: () => addStep(type),
                      title: info.desc,
                    },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      {
                        className: "step-type-card-icon",
                        style: { color: info.color, background: info.bg },
                      },
                      info.icon,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-type-card-name" },
                      info.name,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-type-card-desc" },
                      info.desc,
                    ),
                  );
                }),
              ),
            );
          }),
        ),
      ),
  );
}; // ========== External Data Page ==========
