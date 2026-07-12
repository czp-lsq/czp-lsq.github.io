// RulesPage - 计算规则页面组件
const RulesPage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const SearchableSelect = window.SearchableSelect || ((props) => {
    const { value, onChange, options, placeholder } = props;
    return /*#__PURE__*/ React.createElement(
      "select",
      {
        className: "select",
        value: value || "",
        onChange: (e) => onChange && onChange(e.target.value),
      },
      placeholder && /*#__PURE__*/ React.createElement("option", { value: "" }, placeholder),
      (options || []).map((o) => {
        const optValue = typeof o === "object" ? o.value : o;
        const optLabel = typeof o === "object" ? (o.label || o.value) : String(o);
        return /*#__PURE__*/ React.createElement("option", { key: optValue, value: optValue }, optLabel);
      }),
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
  const [debugMode, setDebugMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
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
  const validateStep = (step, rule, field) => {
    if (!step) return { valid: true, message: "" };
    const cfg = step.config || {};
    const semanticType = field?.semanticType || "";
    switch (step.type) {
      case "fill":
        if (cfg.fillType === "field") {
          if (!cfg.sourceTable)
            return { valid: false, message: "请选择数据源表" };
          if (!cfg.sourceField)
            return { valid: false, message: "请选择目标字段" };
        }
        if (cfg.fillType === "auto" && !semanticType) {
          return {
            valid: false,
            message: "无法识别字段类型，请手动选择填充方式",
          };
        }
        return { valid: true, message: "配置完整" };
      case "source":
        if (!cfg.tables || cfg.tables.length === 0) {
          if (!cfg.table) return { valid: false, message: "请选择数据表" };
        }
        return { valid: true, message: "配置完整" };
      case "filter":
        if (!cfg.column) return { valid: false, message: "请选择过滤字段" };
        if (cfg.op && cfg.op !== "notEmpty" && cfg.op !== "empty") {
          if (
            cfg.value === undefined ||
            cfg.value === "" ||
            cfg.value === null
          ) {
            return { valid: false, message: "请输入过滤值" };
          }
        }
        return { valid: true, message: "配置完整" };
      case "virtual":
        if (!cfg.source) return { valid: false, message: "请输入源字段名" };
        if (!cfg.target) return { valid: false, message: "请输入目标字段名" };
        return { valid: true, message: "配置完整" };
      case "join":
        if (!cfg.table) return { valid: false, message: "请选择关联表" };
        if (!cfg.key) return { valid: false, message: "请选择主表关联键" };
        if (!cfg.fk) return { valid: false, message: "请选择从表关联键" };
        if (!cfg.col) return { valid: false, message: "请选择目标列" };
        return { valid: true, message: "配置完整" };
      case "aggregate":
        if (!cfg.func) return { valid: false, message: "请选择聚合函数" };
        return { valid: true, message: "配置完整" };
      case "formula":
        if (!cfg.expr) return { valid: false, message: "请输入计算公式" };
        return { valid: true, message: "配置完整" };
      case "condition":
        if (!cfg.column) return { valid: false, message: "请选择判断字段" };
        return { valid: true, message: "配置完整" };
      case "group":
        if (!cfg.column) return { valid: false, message: "请选择分组字段" };
        return { valid: true, message: "配置完整" };
      case "round":
        if (!cfg.column) return { valid: false, message: "请选择输入列" };
        return { valid: true, message: "配置完整" };
      case "concat":
        if (!cfg.columns || cfg.columns.length === 0) return { valid: false, message: "请添加拼接字段" };
        return { valid: true, message: "配置完整" };
      case "substring":
        if (!cfg.column) return { valid: false, message: "请选择源字段" };
        return { valid: true, message: "配置完整" };
      case "date":
        if (!cfg.column) return { valid: false, message: "请选择日期字段" };
        return { valid: true, message: "配置完整" };
      case "math":
        if (!cfg.column) return { valid: false, message: "请选择输入列" };
        return { valid: true, message: "配置完整" };
      case "rank":
        if (!cfg.column) return { valid: false, message: "请选择排名列" };
        return { valid: true, message: "配置完整" };
      case "diff":
        if (!cfg.column) return { valid: false, message: "请选择当前列" };
        if (!cfg.baseColumn) return { valid: false, message: "请选择基准列" };
        return { valid: true, message: "配置完整" };
      case "ratio":
        if (!cfg.numerator) return { valid: false, message: "请选择分子" };
        if (!cfg.denominator) return { valid: false, message: "请选择分母" };
        return { valid: true, message: "配置完整" };
      case "union":
        if (!cfg.tables || cfg.tables.length === 0) return { valid: false, message: "请添加合并数据表" };
        return { valid: true, message: "配置完整" };
      case "limit":
        if (!cfg.count) return { valid: false, message: "请输入限制数量" };
        return { valid: true, message: "配置完整" };
      case "lookup":
        if (!cfg.pairs || cfg.pairs.length === 0)
          return { valid: false, message: "请添加查找替换对" };
        return { valid: true, message: "配置完整" };
      case "sort":
        if (!cfg.column) return { valid: false, message: "请选择排序字段" };
        return { valid: true, message: "配置完整" };
      case "crossMatch":
        if (!cfg.columns || cfg.columns.length === 0) return { valid: false, message: "请填写匹配列" };
        if (cfg.mode === "keepIntersection" || cfg.mode === "keepDifference") {
          if (!cfg.table) return { valid: false, message: "请选择对比表" };
          if (!cfg.compareColumns || cfg.compareColumns.length === 0) return { valid: false, message: "请填写对比表匹配列" };
        }
        return { valid: true, message: "配置完整" };
      case "runningTotal":
        if (!cfg.column) return { valid: false, message: "请选择累计列" };
        return { valid: true, message: "配置完整" };
      case "percentOfTotal":
        if (!cfg.column) return { valid: false, message: "请选择计算列" };
        return { valid: true, message: "配置完整" };
      default:
        return { valid: true, message: "配置完整" };
    }
  };
  const getStepHint = (step, rule, field) => {
    if (!step) return null;
    const hints = [];
    const semanticType = field?.semanticType || "";
    const stepIdx = rule?.steps?.findIndex((s) => s.id === step.id) ?? -1;
    if (stepIdx === 0 && step.type === "source") {
      if (
        semanticType === "shop" ||
        semanticType === "year" ||
        semanticType === "month"
      ) {
        hints.push({
          type: "info",
          text: "💡 该字段为占位符，建议使用「填充占位符」步骤，无需数据源",
        });
      }
    }
    if (
      stepIdx === 0 &&
      step.type === "fill" &&
      (semanticType === "value" || !semanticType)
    ) {
      if (field?.type === "value") {
        hints.push({
          type: "warning",
          text: "💡 数值字段建议从「数据源」步骤开始配置",
        });
      }
    }
    if (
      step.type === "source" &&
      stepIdx > 0 &&
      rule?.steps?.[0]?.type === "source"
    ) {
      hints.push({
        type: "warning",
        text: "⚠ 已有数据源步骤，第二个数据源通常需要「跨表关联」配合使用",
      });
    }
    if (step.type === "aggregate" && stepIdx > 0) {
      const prevHasData = rule?.steps
        ?.slice(0, stepIdx)
        ?.some((s) => s.type === "source" || s.type === "fill");
      if (!prevHasData) {
        hints.push({ type: "error", text: "❌ 聚合步骤前需要有数据源步骤" });
      }
    }
    return hints;
  };
  const getCategoryInfo = (cat) => {
    const map = {
      sales: { name: "销售类", icon: "💰", color: "var(--color-success)" },
      cost: { name: "成本类", icon: "🧾", color: "var(--color-warning)" },
      profit: { name: "利润类", icon: "📈", color: "var(--color-primary)" },
    };
    return map[cat] || { name: cat, icon: "📦", color: "var(--color-text-tertiary)" };
  };
  const summarizeStep = (step) => {
    if (!step || !step.config) return "";
    const c = step.config;
    switch (step.type) {
      case "fill": {
        const typeNames = {
          auto: "自动",
          manual: "手动",
          date: "日期(周期)",
          dateNow: "日期(当前)",
          field: "数据字段",
          shop: "店铺名",
        };
        const tn = typeNames[c.fillType] || "自动";
        if (c.fillType === "date" || c.fillType === "dateNow")
          return `${c.fillType === "dateNow" ? "当前日期" : "周期日期"}: ${c.dateFormat || "yyyy-mm"}`;
        if (c.fillType === "manual" || c.fillType === "shop")
          return `值: ${c.value || "(空)"}`;
        if (c.fillType === "field") return `取: ${c.sourceField || "?"}`;
        return `类型: ${tn}`;
      }
      case "source": {
        const tables = c.tables || [];
        if (tables.length > 0) {
          return c.column ? `${tables.length}表 → ${c.column}` : `${tables.length}表全部列`;
        }
        return c.column ? `列: ${c.column}` : "全部列";
      }
      case "filter":
        return c.column && c.op
          ? `${c.column} ${c.op} ${c.value || ""}`
          : "未配置";
      case "virtual": {
        const ruleNames = {
          copy: "复制",
          toNumber: "转数字",
          toString: "转文本",
          trim: "去空格",
          parseQty: "提取数量",
          splitPlus: "按+计数",
          abs: "绝对值",
          round: "四舍五入",
          floor: "向下取整",
          ceil: "向上取整",
          toFixed2: "保留2位小数",
          percent: "百分比转小数",
          parsePercent: "解析百分比",
          formatMoney: "格式化金额",
          toLowerCase: "转小写",
          toUpperCase: "转大写",
          length: "字符串长度",
          substring: "截取子串",
          replace: "替换",
          concat: "拼接",
          ifEmpty: "空值替换",
          chineseToNumber: "中文转数字",
          mapValue: "映射替换",
          multiply: "乘倍数",
          divide: "除倍数",
          sumFields: "字段求和",
          diffFields: "字段求差",
        };
        const rn = ruleNames[c.rule] || c.rule;
        return c.source && c.target
          ? `${c.source} → ${c.target} (${rn})`
          : "未配置";
      }
      case "join":
        return c.key && c.fk ? `${c.key}=${c.fk}.${c.col || "?"}` : "未配置";
      case "aggregate":
        return `${c.func || "sum"}${c.column ? `(${c.column})` : "()"}`;
      case "formula":
        return c.expr || "未配置";
      case "constant":
        return `值: ${c.value}`;
      case "text":
        return c.value || "未配置";
      case "distinct":
        return `去重: ${c.column || "val"}`;
      case "sort":
        return `排序: ${c.column || "val"} ${c.direction === "desc" ? "↓" : "↑"}`;
      case "limit":
        return `限制: ${c.count || 100}行`;
      case "lookup":
        return `查找替换: ${c.column || "val"} (${(c.pairs || []).length}条映射)`;
      case "condition":
        return `条件: ${c.column || "val"} ${c.op || "=="} ${c.value || "?"}`;
      case "group":
        return `分组: ${c.column || "?"} → ${c.func || "sum"}(${c.aggColumn || "val"})`;
      case "round":
        return `四舍五入: ${c.column || "val"} → ${c.decimals || 2}位小数`;
      case "concat":
        return `拼接: ${(c.columns || []).join("+")} ${c.separator ? `("${c.separator}")` : ""}`;
      case "substring":
        return `截取: ${c.column || "val"} [${c.start || 0},${c.start + c.length || 10})`;
      case "date":
        const dateOps = { format: "格式化", extractYear: "提取年", extractMonth: "提取月", extractDay: "提取日", addDays: "增减天数" };
        return `日期: ${c.column || "val"} (${dateOps[c.operation] || c.operation})`;
      case "math":
        return `运算: ${c.column || "val"} ${c.operation} ${c.value}`;
      case "rank":
        return `排名: ${c.column || "val"} ${c.direction === "desc" ? "↓" : "↑"}`;
      case "diff":
        return `差值: ${c.column || "val"} - ${c.baseColumn || "?"}${c.percent ? "%" : ""}`;
      case "ratio":
        return `比率: ${c.numerator || "val"}/${c.denominator || "?"}${c.percent ? "%" : ""}`;
      case "union":
        return `合并: ${(c.tables || []).length}个表`;
      case "keepDuplicate":
        return `保留重复: ${c.column || "val"}列`;
      case "keepUnique":
        return `保留唯一: ${c.column || "val"}列`;
      case "intersect":
        return `对比筛选: ${c.key || "?"} ${c.mode === "keepExist" ? "存在于" : "不存在于"} ${c.table || "?"}`;
      case "crossMatch": {
        const modeNames = { keepIntersection: "交集", keepDifference: "差集", removeDuplicates: "去重", keepDuplicates: "保留重复" };
        return `${modeNames[c.mode] || c.mode}: ${(c.columns || []).join(",")}${c.table ? ` / ${c.table}` : ""}`;
      }
      case "runningTotal":
        return `累计: ${c.column || "val"}${c.orderColumn ? ` 按${c.orderColumn}排序` : ""}`;
      case "percentOfTotal":
        return `占比: ${c.column || "val"}${c.asPercent ? "%" : ""}`;
      default:
        return "";
    }
  };
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
    if (!activeField) return;
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
      source: "sample",
    }));
    const externalTables = (state.externals || []).map((e) => ({
      id: e.id || e.sheetKey,
      name: e.name || e.sheetKey,
      headers: e.headers || (e.allData && e.allData.length > 0 ? Object.keys(e.allData[0]) : []),
      source: "external",
      externalId: e.id || e.sheetKey,
    }));
    const allTables = [...sampleTables, ...externalTables];
    const getColumnValues = (columnName) => {
      if (!columnName) return [];
      const values = new Set();
      allTables.forEach((table) => {
        const rows = table.rows || [];
        rows.forEach((row) => {
          const val = row[columnName];
          if (val !== undefined && val !== null && val !== "") {
            values.add(String(val));
          }
        });
      });
      return Array.from(values).slice(0, 50);
    };
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
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u586B\u5145\u65B9\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.fillType,
                onChange: (e) =>
                  updateStepConfig(step.id, "fillType", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "auto" },
                "\uD83E\uDD16 \u81EA\u52A8\u8BC6\u522B\uFF08\u6839\u636E\u5360\u4F4D\u7B26\u7C7B\u578B\uFF09",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "shop" },
                "\uD83C\uDFEA \u5E97\u94FA\u540D\uFF08\u4ECE\u5F53\u524D\u5E97\u94FA\uFF09",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "date" },
                "\uD83D\uDCC5 \u65E5\u671F\uFF08\u6570\u636E\u5468\u671F\u65E5\u671F\uFF09",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "dateNow" },
                "\uD83D\uDCC6 \u65E5\u671F\uFF08\u5F53\u524D\u7CFB\u7EDF\u65E5\u671F\uFF09",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "field" },
                "\uD83D\uDCCA \u4ECE\u6570\u636E\u5B57\u6BB5\u53D6\u503C",
              ),
            ),
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
                { className: "step-info-box" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-info-title" },
                  /*#__PURE__*/ React.createElement(Icons.Clock, null),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    null,
                    step.config.fillType === "date"
                      ? "数据周期日期填充"
                      : "当前系统日期填充",
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
                      step.config.fillType === "date"
                        ? `数据周期日期：${formatDetectedDate(detectedDate)}`
                        : `当前系统日期：${formatNowDate()}`,
                    ),
                  ),
                  step.config.fillType === "date" &&
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-info-tip" },
                      detectedDate
                        ? `\uD83D\uDCA1 已从上传文件名中识别到数据周期：${formatDetectedDate(detectedDate)}，批量计算时会自动从每个文件中识别对应日期`
                        : "\uD83D\uDCA1 未从当前文件名中识别到日期，请确保文件名包含日期信息（如：2024年3月、202403、2024-03等），系统将自动识别",
                    ),
                  step.config.fillType === "dateNow" &&
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-info-tip" },
                      "\uD83D\uDCA1 使用当前操作系统真实日期，适用于制表日期、填报日期等场景",
                    ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u65E5\u671F\u683C\u5F0F",
                ),
                /*#__PURE__*/ React.createElement(
                  "select",
                  {
                    className: "select",
                    value: step.config.dateFormat,
                    onChange: (e) =>
                      updateStepConfig(step.id, "dateFormat", e.target.value),
                  },
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "yyyy" },
                    "\u4EC5\u5E74 (2024)",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "mm" },
                    "\u4EC5\u6708 (03)",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "dd" },
                    "\u4EC5\u65E5 (15)",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "yyyy-mm" },
                    "\u5E74\u6708 (2024\u5E7403\u6708)",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "yyyy-mm-dd" },
                    "\u5E74\u6708\u65E5 (2024\u5E7403\u670815\u65E5)",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "mm-dd" },
                    "\u6708\u65E5 (03\u670815\u65E5)",
                  ),
                ),
              ),
            ),
          step.config.fillType === "field" &&
            /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u9009\u62E9\u6570\u636E\u8868",
                ),
                /*#__PURE__*/ React.createElement(
                  "select",
                  {
                    className: "select",
                    value: step.config.sourceTable || "",
                    onChange: (e) =>
                      updateStepConfig(step.id, "sourceTable", e.target.value),
                  },
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "" },
                    "\u8BF7\u9009\u62E9\u6570\u636E\u8868",
                  ),
                  sampleTables.map((t) =>
                    /*#__PURE__*/ React.createElement(
                      "option",
                      { key: t.id, value: t.id },
                      t.name,
                    ),
                  ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "\u9009\u62E9\u5B57\u6BB5",
                ),
                /*#__PURE__*/ React.createElement(
                  "select",
                  {
                    className: "select",
                    value: step.config.sourceField,
                    onChange: (e) =>
                      updateStepConfig(step.id, "sourceField", e.target.value),
                    disabled: !step.config.sourceTable,
                  },
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { value: "" },
                    "\u8BF7\u9009\u62E9\u5B57\u6BB5",
                  ),
                  (
                    sampleTables.find((t) => t.id === step.config.sourceTable)
                      ?.headers || []
                  ).map((h) =>
                    /*#__PURE__*/ React.createElement(
                      "option",
                      { key: h, value: h },
                      h,
                    ),
                  ),
                ),
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
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u9009\u62E9\u6570\u636E\u8868",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 8 } },
              sampleTables.length > 0 && /*#__PURE__*/ React.createElement(
                "div",
                null,
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-sub-label" },
                  "\u6837\u8868\u6570\u636E",
                ),
                sampleTables.map((t) =>
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { key: t.id, className: "checkbox-label" },
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
                    " ",
                    t.name,
                  ),
                ),
              ),
              externalTables.length > 0 && /*#__PURE__*/ React.createElement(
                "div",
                null,
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-sub-label" },
                  "\u5168\u5C40\u6570\u636E\u8868",
                ),
                externalTables.map((t) =>
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { key: t.id, className: "checkbox-label" },
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
                    " ",
                    t.name,
                  ),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u9009\u62E9\u5217\uFF08\u53EF\u9009\uFF09",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5168\u90E8\u5217",
              ),
              selectedTables.length > 0
                ? allTables
                    .find((t) => t.id === selectedTables[0])
                    ?.headers.map((h) =>
                      /*#__PURE__*/ React.createElement(
                        "option",
                        { key: h, value: h },
                        h,
                      ),
                    )
                : step.config.table
                ? allTables
                    .find((t) => t.id === step.config.table)
                    ?.headers.map((h) =>
                      /*#__PURE__*/ React.createElement(
                        "option",
                        { key: h, value: h },
                        h,
                      ),
                    )
                : null,
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u53EF\u9009\u62E9\u591A\u4E2A\u6570\u636E\u8868\uFF0C\u6570\u636E\u5C06\u81EA\u52A8\u5408\u5E76\u3002\u5982\u679C\u9009\u62E9\u4E86\u5217\uFF0C\u53EA\u4F1A\u83B7\u53D6\u8BE5\u5217\u7684\u6570\u636E",
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
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u805A\u5408\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u805A\u5408\u51FD\u6570",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.func,
                onChange: (e) =>
                  updateStepConfig(step.id, "func", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "sum" },
                "\u6C42\u548C (SUM)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "avg" },
                "\u5E73\u5747\u503C (AVG)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "count" },
                "\u8BA1\u6570 (COUNT)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "countDistinct" },
                "\u53BB\u91CD\u8BA1\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "max" },
                "\u6700\u5927\u503C (MAX)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "min" },
                "\u6700\u5C0F\u503C (MIN)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "median" },
                "\u4E2D\u4F4D\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "product" },
                "\u4E58\u79EF",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "stddev" },
                "\u6807\u51C6\u5DEE",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "variance" },
                "\u65B9\u5DEE",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "mode" },
                "\u4F17\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "first" },
                "\u7B2C\u4E00\u4E2A\u503C",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "last" },
                "\u6700\u540E\u4E00\u4E2A\u503C",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "sumAbs" },
                "\u7EDD\u5BF9\u503C\u6C42\u548C",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            ' \u5C06\u591A\u884C\u6570\u636E\u805A\u5408\u6210\u5355\u4E2A\u7ED3\u679C\u503C\u3002\u9009\u62E9\u5177\u4F53\u5217\u540D\u65F6\uFF0C\u4F18\u5148\u4F7F\u7528\u8BE5\u5217\u6570\u636E\uFF1B\u9009\u62E9"\u5F53\u524D\u503C"\u65F6\u4F7F\u7528\u4E0A\u4E00\u6B65\u8F93\u51FA\u7684val\u5B57\u6BB5',
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
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8BA1\u7B97\u516C\u5F0F",
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
            ),
          ),
          availFields.length > 1 && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u53EF\u7528\u5B57\u6BB5",
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
                    title: "\u70B9\u51FB\u63D2\u5165\u516C\u5F0F",
                  },
                  f.name,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "formula-hints" },
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { marginBottom: 8, fontWeight: 600 } },
              "\u5E38\u7528\u51FD\u6570\uFF08\u70B9\u51FB\u63D2\u5165\uFF09\uFF1A",
            ),
            CalcEngine.getFormulaHints().map((hint, i) =>
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
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u4F7F\u7528 ",
            /*#__PURE__*/ React.createElement("code", null, "{字段名}"),
            " \u5F15\u7528\u5B57\u6BB5\u503C\uFF0C",
            /*#__PURE__*/ React.createElement("code", null, "{val}"),
            " \u4EE3\u8868\u4E0A\u4E00\u6B65\u7ED3\u679C\uFF0C\u652F\u6301\u6240\u6709JavaScript\u6570\u5B66\u51FD\u6570",
          ),
        );
      case "virtual":
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
                "\u6E90\u5B57\u6BB5",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.source,
                onChange: (e) =>
                  updateStepConfig(step.id, "source", e.target.value),
                placeholder: "\u6E90\u5B57\u6BB5\u540D",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u76EE\u6807\u5B57\u6BB5",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.target,
                onChange: (e) =>
                  updateStepConfig(step.id, "target", e.target.value),
                placeholder: "\u76EE\u6807\u5B57\u6BB5\u540D",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F6C\u6362\u89C4\u5219",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.rule,
                onChange: (e) =>
                  updateStepConfig(step.id, "rule", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "copy" },
                "\u590D\u5236",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "toNumber" },
                "\u8F6C\u6570\u5B57",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "toString" },
                "\u8F6C\u6587\u672C",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "trim" },
                "\u53BB\u9664\u7A7A\u683C",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "parseQty" },
                "\u63D0\u53D6\u6570\u91CF",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "splitPlus" },
                "\u6309+\u53F7\u62C6\u5206\u8BA1\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "abs" },
                "\u7EDD\u5BF9\u503C",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "round" },
                "\u56DB\u820D\u4E94\u5165",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "floor" },
                "\u5411\u4E0B\u53D6\u6574",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "ceil" },
                "\u5411\u4E0A\u53D6\u6574",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "toFixed2" },
                "\u4FDD\u75592\u4F4D\u5C0F\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "percent" },
                "\u767E\u5206\u6BD4\u8F6C\u5C0F\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "parsePercent" },
                "\u89E3\u6790\u767E\u5206\u6BD4",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "formatMoney" },
                "\u683C\u5F0F\u5316\u91D1\u989D",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "toLowerCase" },
                "\u8F6C\u5C0F\u5199",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "toUpperCase" },
                "\u8F6C\u5927\u5199",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "length" },
                "\u5B57\u7B26\u4E32\u957F\u5EA6",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "substring" },
                "\u622A\u53D6\u5B50\u4E32",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "replace" },
                "\u66FF\u6362",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "concat" },
                "\u62FC\u63A5\u524D\u540E\u7F00",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "ifEmpty" },
                "\u7A7A\u503C\u66FF\u6362",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "chineseToNumber" },
                "\u4E2D\u6587\u6570\u5B57\u8F6C\u6570\u5B57",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "mapValue" },
                "\u6620\u5C04\u66FF\u6362",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "multiply" },
                "\u4E58\u4EE3\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "divide" },
                "\u9664\u4EE3\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "sumFields" },
                "\u5B57\u6BB5\u4E4B\u548C",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "diffFields" },
                "\u5B57\u6BB5\u4E4B\u5DEE",
              ),
            ),
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
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5173\u8054\u6570\u636E\u8868",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.table,
                onChange: (e) => {
                  const tableId = e.target.value;
                  const tbl = allTables.find((t) => t.id === tableId);
                  updateStepConfig(step.id, "table", tableId);
                  updateStepConfig(step.id, "externalId", tbl?.externalId || "");
                  updateStepConfig(step.id, "fk", "");
                  updateStepConfig(step.id, "col", "");
                },
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u8BF7\u9009\u62E9\u6570\u636E\u8868",
              ),
              sampleTables.length > 0 && /*#__PURE__*/ React.createElement(
                "optgroup",
                { label: "样表数据" },
                sampleTables.map((t) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: t.id, value: t.id },
                    t.name,
                  ),
                ),
              ),
              externalTables.length > 0 && /*#__PURE__*/ React.createElement(
                "optgroup",
                { label: "全局数据表" },
                externalTables.map((t) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: t.id, value: t.id },
                    t.name,
                  ),
                ),
              ),
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
                "\u4E3B\u8868\u5173\u8054\u952E",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.key,
                  onChange: (e) =>
                    updateStepConfig(step.id, "key", e.target.value),
                },
                /*#__PURE__*/ React.createElement("option", { value: "" }, "\u8BF7\u9009\u62E9\u5B57\u6BB5"),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement("option", { key: h, value: h }, h),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5173\u8054\u8868\u5916\u952E",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.fk,
                  onChange: (e) =>
                    updateStepConfig(step.id, "fk", e.target.value),
                  disabled: !step.config.table,
                },
                /*#__PURE__*/ React.createElement("option", { value: "" }, step.config.table ? "\u8BF7\u9009\u62E9\u5B57\u6BB5" : "\u5148\u9009\u62E9\u5173\u8054\u8868"),
                joinHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement("option", { key: h, value: h }, h),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u53D6\u5173\u8054\u8868\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
                {
                  className: "select",
                  value: step.config.col,
                  onChange: (e) => updateStepConfig(step.id, "col", e.target.value),
                  disabled: !step.config.table,
                },
                /*#__PURE__*/ React.createElement("option", { value: "" }, step.config.table ? "\u8BF7\u9009\u62E9\u5B57\u6BB5" : "\u5148\u9009\u62E9\u5173\u8054\u8868"),
                joinHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement("option", { key: h, value: h }, h),
                ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6839\u636E\u4E3B\u8868\u5173\u8054\u952E\u4ECE\u5173\u8054\u8868\u4E2D\u5339\u914D\u6570\u636E\uFF0C\u5C06\u5173\u8054\u8868\u4E2D\u6307\u5B9A\u5217\u7684\u503C\u586B\u5145\u5230\u5F53\u524D\u5B57\u6BB5\u3002\u9002\u7528\u4E8E\u901A\u8FC7\u5546\u54C1ID\u5173\u8054\u6210\u672C\u8868\u3001\u901A\u8FC7\u5E97\u94FA\u540D\u5173\u8054\u5B9A\u4EF7\u8868\u7B49\u573A\u666F\u3002",
          ),
        );
      }
      case "distinct":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u53BB\u91CD\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            ' \u53BB\u9664\u6307\u5B9A\u5217\u7684\u91CD\u590D\u503C\uFF0C\u4FDD\u7559\u7B2C\u4E00\u6B21\u51FA\u73B0\u7684\u884C\u3002\u9009\u62E9"\u5F53\u524D\u503C"\u65F6\u4F7F\u7528\u4E0A\u4E00\u6B65\u8F93\u51FA\u7684val\u5B57\u6BB5',
          ),
        );
      case "sort":
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
                "\u6392\u5E8F\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.column,
                  onChange: (e) =>
                    updateStepConfig(step.id, "column", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u5F53\u524D\u503C (val)",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6392\u5E8F\u65B9\u5411",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.direction,
                  onChange: (e) =>
                    updateStepConfig(step.id, "direction", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "asc" },
                  "\u5347\u5E8F \u2191",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "desc" },
                  "\u964D\u5E8F \u2193",
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            ' \u6309\u6307\u5B9A\u5217\u7684\u503C\u6392\u5E8F\uFF0C\u6570\u5B57\u6309\u6570\u503C\u6392\u5E8F\uFF0C\u6587\u672C\u6309\u5B57\u5178\u5E8F\u6392\u5E8F\u3002\u9009\u62E9"\u5F53\u524D\u503C"\u65F6\u4F7F\u7528\u4E0A\u4E00\u6B65\u8F93\u51FA\u7684val\u5B57\u6BB5',
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
                "\u5224\u65AD\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.column,
                  onChange: (e) =>
                    updateStepConfig(step.id, "column", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u9ED8\u8BA4\u4F7F\u7528\u5F53\u524D\u503C(val)",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "val" },
                  "\u5F53\u524D\u503C (val)",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u64CD\u4F5C\u7B26",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.op,
                  onChange: (e) =>
                    updateStepConfig(step.id, "op", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "==" },
                  "\u7B49\u4E8E",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "!=" },
                  "\u4E0D\u7B49\u4E8E",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: ">" },
                  "\u5927\u4E8E",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "<" },
                  "\u5C0F\u4E8E",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: ">=" },
                  "\u5927\u4E8E\u7B49\u4E8E",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "<=" },
                  "\u5C0F\u4E8E\u7B49\u4E8E",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "contains" },
                  "\u5305\u542B",
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5BF9\u6BD4\u503C",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.value,
              onChange: (e) =>
                updateStepConfig(step.id, "value", e.target.value),
              placeholder: "\u8F93\u5165\u5BF9\u6BD4\u503C",
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
                "\u6EE1\u8DB3\u6761\u4EF6\u7684\u503C",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.trueValue,
                onChange: (e) =>
                  updateStepConfig(step.id, "trueValue", e.target.value),
                placeholder: "\u9ED8\u8BA4 1",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u4E0D\u6EE1\u8DB3\u7684\u503C",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.falseValue,
                onChange: (e) =>
                  updateStepConfig(step.id, "falseValue", e.target.value),
                placeholder: "\u9ED8\u8BA4 0",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \uD83E\uDD14 ",
            /*#__PURE__*/ React.createElement(
              "strong",
              null,
              "\u6761\u4EF6\u5224\u65AD",
            ),
            '\uFF1A\u6839\u636E\u6761\u4EF6\u8FD4\u56DE\u4E0D\u540C\u7684\u503C\uFF0C\u4E0D\u4E22\u5F03\u6570\u636E\u3002\u4F8B\u5982\uFF1A\u5982\u679C"\u9500\u91CF\u5927\u4E8E100"\u8FD4\u56DE1\uFF0C\u5426\u5219\u8FD4\u56DE0',
          ),
        );
      case "group":
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
                "\u5206\u7EC4\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.column,
                  onChange: (e) =>
                    updateStepConfig(step.id, "column", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u8BF7\u9009\u62E9\u5206\u7EC4\u5217",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u805A\u5408\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.aggColumn,
                  onChange: (e) =>
                    updateStepConfig(step.id, "aggColumn", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u5F53\u524D\u503C (val)",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u805A\u5408\u51FD\u6570",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.func,
                onChange: (e) =>
                  updateStepConfig(step.id, "func", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "sum" },
                "\u6C42\u548C (SUM)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "avg" },
                "\u5E73\u5747\u503C (AVG)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "count" },
                "\u8BA1\u6570 (COUNT)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "countDistinct" },
                "\u53BB\u91CD\u8BA1\u6570",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "max" },
                "\u6700\u5927\u503C (MAX)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "min" },
                "\u6700\u5C0F\u503C (MIN)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "median" },
                "\u4E2D\u4F4D\u6570",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6309\u6307\u5B9A\u5217\u5206\u7EC4\u540E\u5BF9\u53E6\u4E00\u5217\u8FDB\u884C\u805A\u5408\u8BA1\u7B97\uFF0C\u8FD4\u56DE\u5206\u7EC4\u540E\u7684\u7ED3\u679C\u96C6",
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
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column || "",
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u9ED8\u8BA4\u4F7F\u7528\u5F53\u524D\u503C(val)",
              ),
              (sourceTableHeaders || []).map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
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
                "\u5339\u914D\u6A21\u5F0F",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.mode || "exact",
                  onChange: (e) =>
                    updateStepConfig(step.id, "mode", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "exact" },
                  "\u7CBE\u786E\u5339\u914D",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "contains" },
                  "\u5305\u542B\u5339\u914D",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "regex" },
                  "\u6B63\u5219\u5339\u914D",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "startsWith" },
                  "\u5F00\u5934\u5339\u914D",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "endsWith" },
                  "\u7ED3\u5C3E\u5339\u914D",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u672A\u5339\u914D\u65F6",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.onMiss || "keep",
                  onChange: (e) =>
                    updateStepConfig(step.id, "onMiss", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "keep" },
                  "\u4FDD\u7559\u539F\u503C",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "default" },
                  "\u4F7F\u7528\u9ED8\u8BA4\u503C",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "empty" },
                  "\u7F6E\u7A7A",
                ),
              ),
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
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u5165\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
            ),
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
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: col,
                      onChange: (e) => {
                        const newCols = [...(step.config.columns || ["", ""])];
                        newCols[idx] = e.target.value;
                        updateStepConfig(step.id, "columns", newCols);
                      },
                      style: { flex: 1 },
                    },
                    /*#__PURE__*/ React.createElement(
                      "option",
                      { value: "" },
                      "\u8BF7\u9009\u62E9\u5B57\u6BB5",
                    ),
                    sourceTableHeaders.map((h) =>
                      /*#__PURE__*/ React.createElement(
                        "option",
                        { key: h, value: h },
                        h,
                      ),
                    ),
                  ),
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
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6E90\u5B57\u6BB5",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
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
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u65E5\u671F\u5B57\u6BB5",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u64CD\u4F5C\u7C7B\u578B",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.operation,
                onChange: (e) =>
                  updateStepConfig(step.id, "operation", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "format" },
                "\u683C\u5F0F\u5316\u65E5\u671F",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "extractYear" },
                "\u63D0\u53D6\u5E74\u4EFd",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "extractMonth" },
                "\u63D0\u53D6\u6708\u4EFd",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "extractDay" },
                "\u63D0\u53D6\u65E5",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "addDays" },
                "\u52A0\u51CF\u5929\u6570",
              ),
            ),
          ),
          step.config.operation === "format" && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u683C\u5F0F\u6A21\u677F",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.format,
                onChange: (e) =>
                  updateStepConfig(step.id, "format", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "yyyy-mm-dd" },
                "2024-01-15",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "yyyy/mm/dd" },
                "2024/01/15",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "yyyy年mm月dd日" },
                "2024年01月15日",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "yyyy-mm" },
                "2024-01",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "mm-dd" },
                "01-15",
              ),
            ),
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
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u5165\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
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
                "\u8FD0\u7B97\u7B26",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.operation,
                  onChange: (e) =>
                    updateStepConfig(step.id, "operation", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "+" },
                  "+",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "-" },
                  "-",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "*" },
                  "\u00D7",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "/" },
                  "\u00F7",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "^" },
                  "\u5E42\u6B21\u65B9",
                ),
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "%" },
                  "\u5269\u6570",
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u6570\u503C",
              ),
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
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6392\u540D\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column,
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6392\u540D\u65B9\u5411",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.direction,
                onChange: (e) =>
                  updateStepConfig(step.id, "direction", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "desc" },
                "\u964D\u5E8F (\u6700\u5927\u4E3A1)",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "asc" },
                "\u5347\u5E8F (\u6700\u5C0F\u4E3A1)",
              ),
            ),
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
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5F53\u524D\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.column,
                  onChange: (e) =>
                    updateStepConfig(step.id, "column", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u5F53\u524D\u503C (val)",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u57FA\u51C6\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.baseColumn,
                  onChange: (e) =>
                    updateStepConfig(step.id, "baseColumn", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u8BF7\u9009\u62E9\u57FA\u51C6\u5217",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
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
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5206\u5B50",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.numerator,
                  onChange: (e) =>
                    updateStepConfig(step.id, "numerator", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u5F53\u524D\u503C (val)",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5206\u6BCD",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.denominator,
                  onChange: (e) =>
                    updateStepConfig(step.id, "denominator", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u8BF7\u9009\u62E9\u5206\u6BCD\u5217",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
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
                  /*#__PURE__*/ React.createElement(
                    "select",
                    {
                      className: "select",
                      value: tableId,
                      onChange: (e) => {
                        const newTables = [...(step.config.tables || [])];
                        newTables[idx] = e.target.value;
                        updateStepConfig(step.id, "tables", newTables);
                      },
                      style: { flex: 1 },
                    },
                    /*#__PURE__*/ React.createElement(
                      "option",
                      { value: "" },
                      "\u8BF7\u9009\u62E9\u6570\u636E\u8868",
                    ),
                    sampleTables.map((t) =>
                      /*#__PURE__*/ React.createElement(
                        "option",
                        { key: t.id, value: t.id },
                        t.name,
                      ),
                    ),
                  ),
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
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5224\u65AD\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.column || "",
                onChange: (e) =>
                  updateStepConfig(step.id, "column", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u5F53\u524D\u503C (val)",
              ),
              sourceTableHeaders.map((h) =>
                /*#__PURE__*/ React.createElement(
                  "option",
                  { key: h, value: h },
                  h,
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            step.type === "keepDuplicate"
              ? " \u6309\u6307\u5B9A\u5217\u5224\u65AD\uFF0C\u4EC5\u4FDD\u7559\u51FA\u73B0\u8FC7\u591A\u6B21\u7684\u91CD\u590D\u884C\uFF08\u91CD\u590D\u884C\u4F1A\u5168\u90E8\u4FDD\u7559\uFF09"
              : " \u6309\u6307\u5B9A\u5217\u5224\u65AD\uFF0C\u4EC5\u4FDD\u7559\u53EA\u51FA\u73B0\u8FC7\u4E00\u6B21\u7684\u552F\u4E00\u884C",
          ),
        );
      case "intersect":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5BF9\u6BD4\u6A21\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.mode || "keepExist",
                onChange: (e) =>
                  updateStepConfig(step.id, "mode", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "keepExist" },
                "\u4FDD\u7559\u5B58\u5728\u4E8E\u5BF9\u6BD4\u8868\u7684\u884C\uFF08\u4EA4\u96C6\uFF09",
              ),
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "keepNotExist" },
                "\u4FDD\u7559\u4E0D\u5B58\u5728\u4E8E\u5BF9\u6BD4\u8868\u7684\u884C\uFF08\u5DEE\u96C6\uFF09",
              ),
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
                "\u5F53\u524D\u8868\u5173\u8054\u5217",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.key || "",
                  onChange: (e) =>
                    updateStepConfig(step.id, "key", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u8BF7\u9009\u62E9\u5217",
                ),
                sourceTableHeaders.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5BF9\u6BD4\u6570\u636E\u8868",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.table || "",
                  onChange: (e) =>
                    updateStepConfig(step.id, "table", e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u8BF7\u9009\u62E9\u6570\u636E\u8868",
                ),
                sampleTables.map((t) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: t.id, value: t.id },
                    t.name,
                  ),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5BF9\u6BD4\u8868\u5173\u8054\u5217",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.compareKey || "",
                onChange: (e) =>
                  updateStepConfig(step.id, "compareKey", e.target.value),
              },
              /*#__PURE__*/ React.createElement(
                "option",
                { value: "" },
                "\u8BF7\u9009\u62E9\u5217",
              ),
              (() => {
                const t = sampleTables.find((t) => t.id === step.config.table);
                const headers = t ? t.headers || Object.keys((t.rows && t.rows[0]) || {}) : [];
                return headers.map((h) =>
                  /*#__PURE__*/ React.createElement(
                    "option",
                    { key: h, value: h },
                    h,
                  ),
                );
              })(),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u5C06\u5F53\u524D\u8868\u4E0E\u53E6\u4E00\u8868\u6309\u6307\u5B9A\u5217\u8FDB\u884C\u5BF9\u6BD4\uFF0C\u7B5B\u9009\u51FA\u5339\u914D\u6216\u4E0D\u5339\u914D\u7684\u884C",
          ),
        );
      case "crossMatch":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5904\u7406\u6A21\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(
              "select",
              {
                className: "select",
                value: step.config.mode || "keepIntersection",
                onChange: (e) => updateStepConfig(step.id, "mode", e.target.value),
              },
              /*#__PURE__*/ React.createElement("option", { value: "keepIntersection" }, "\u4FDD\u7559\u4E0E\u5BF9\u6BD4\u8868\u7684\u4EA4\u96C6\u884C"),
              /*#__PURE__*/ React.createElement("option", { value: "keepDifference" }, "\u4FDD\u7559\u4E0D\u5728\u5BF9\u6BD4\u8868\u7684\u5DEE\u96C6\u884C"),
              /*#__PURE__*/ React.createElement("option", { value: "removeDuplicates" }, "\u5F53\u524D\u6570\u636E\u591A\u5217\u53BB\u91CD"),
              /*#__PURE__*/ React.createElement("option", { value: "keepDuplicates" }, "\u5F53\u524D\u6570\u636E\u4FDD\u7559\u91CD\u590D\u884C"),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5F53\u524D\u8868\u5339\u914D\u5217\uFF08\u591A\u5217\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\uFF09",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: (step.config.columns || []).join(","),
              onChange: (e) => updateStepConfig(step.id, "columns", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)),
              placeholder: "\u4F8B\u5982\uff1a\u5546\u54C1ID,\u89C4\u683C",
            }),
          ),
          (step.config.mode === "keepIntersection" || step.config.mode === "keepDifference") && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5BF9\u6BD4\u6570\u636E\u8868",
              ),
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: step.config.table || "",
                  onChange: (e) => updateStepConfig(step.id, "table", e.target.value),
                },
                /*#__PURE__*/ React.createElement("option", { value: "" }, "\u8BF7\u9009\u62E9\u6570\u636E\u8868"),
                sampleTables.map((t) => /*#__PURE__*/ React.createElement("option", { key: t.id, value: t.id }, t.name)),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5BF9\u6BD4\u8868\u5339\u914D\u5217\uFF08\u591A\u5217\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\uFF09",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: (step.config.compareColumns || []).join(","),
                onChange: (e) => updateStepConfig(step.id, "compareColumns", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)),
                placeholder: "\u4F8B\u5982\uff1a\u5546\u54C1ID,\u89C4\u683C",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u6309\u591A\u4E2A\u5217\u7EC4\u5408\u8FDB\u884C\u8DE8\u8868\u4EA4\u96C6\u3001\u5DEE\u96C6\u6216\u5F53\u524D\u6570\u636E\u7684\u53BB\u91CD/\u4FDD\u7559\u91CD\u590D\u3002",
          ),
        );
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
            "ul",
            { className: "field-list" },
            fields.length === 0
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
                  "\u8BF7\u5148\u5728\u6A21\u677F\u4E2D\u5FC3\u4E0A\u4F20\u6A21\u677F",
                )
              : filteredFields.length === 0
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
            activeField &&
              /*#__PURE__*/ React.createElement(
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
                    { className: "debug-preview" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "debug-preview-header" },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          },
                        },
                        /*#__PURE__*/ React.createElement(Icons.Play, null),
                        /*#__PURE__*/ React.createElement(
                          "span",
                          { style: { fontWeight: 600 } },
                          "\u5B9E\u65F6\u9884\u89C8\u7ED3\u679C",
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "span",
                        {
                          className: `debug-status ${previewResult.error ? "error" : "success"}`,
                        },
                        previewResult.error ? "⚠ 计算错误" : "✓ 计算成功",
                      ),
                    ),
                    previewResult.error
                      ? /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "debug-error" },
                          /*#__PURE__*/ React.createElement(
                            Icons.AlertCircle,
                            null,
                          ),
                          /*#__PURE__*/ React.createElement(
                            "span",
                            null,
                            previewResult.error,
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
                              "\u5171 ",
                              previewResult.data?.length || 0,
                              " \u6761\u6570\u636E",
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
                                "\uD83D\uDCCA \u6570\u636E\u9884\u89C8\uFF08\u524D5\u6761\uFF09",
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
                                        { style: { width: 40 } },
                                        "#",
                                      ),
                                      Object.keys(previewResult.data[0] || {})
                                        .slice(0, 6)
                                        .map((k) =>
                                          /*#__PURE__*/ React.createElement(
                                            "th",
                                            { key: k },
                                            k === "val" ? "计算值" : k,
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
                                            {
                                              style: {
                                                color: "var(--color-text-tertiary)",
                                                fontSize: 12,
                                              },
                                            },
                                            i + 1,
                                          ),
                                          Object.values(row)
                                            .slice(0, 6)
                                            .map((v, j) =>
                                              /*#__PURE__*/ React.createElement(
                                                "td",
                                                { key: j },
                                                typeof v === "number"
                                                  ? v.toLocaleString("zh-CN", {
                                                      maximumFractionDigits: 2,
                                                    })
                                                  : v != null
                                                    ? String(v)
                                                    : /*#__PURE__*/ React.createElement(
                                                        "span",
                                                        {
                                                          style: {
                                                            color:
                                                              "var(--color-text-muted)",
                                                          },
                                                        },
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
                                "\uD83D\uDD0D \u6BCF\u6B65\u8BA1\u7B97\u8BE6\u60C5",
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
                                      { className: "debug-step-index" },
                                      idx + 1,
                                    ),
                                    /*#__PURE__*/ React.createElement(
                                      "div",
                                      {
                                        className: "debug-step-icon",
                                        style: { color: stepInfo.color },
                                      },
                                      stepInfo.icon,
                                    ),
                                    /*#__PURE__*/ React.createElement(
                                      "div",
                                      { className: "debug-step-info" },
                                      /*#__PURE__*/ React.createElement(
                                        "div",
                                        { className: "debug-step-name" },
                                        stepInfo.name,
                                      ),
                                      sr.error
                                        ? /*#__PURE__*/ React.createElement(
                                            "div",
                                            { className: "debug-step-error" },
                                            sr.error,
                                          )
                                        : /*#__PURE__*/ React.createElement(
                                            "div",
                                            { className: "debug-step-meta" },
                                            sr.rows,
                                            " \u6761\u6570\u636E",
                                            sr.preview?.[0] &&
                                              /*#__PURE__*/ React.createElement(
                                                "span",
                                                {
                                                  className:
                                                    "debug-step-preview",
                                                },
                                                "\u2192 ",
                                                JSON.stringify(
                                                  sr.preview[0],
                                                ).slice(0, 60),
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
                    "\u9009\u62E9\u5B57\u6BB5\u540E\u53EF\u914D\u7F6E\u5BF9\u5E94\u7684\u8BA1\u7B97\u89C4\u5219\uFF0C\u4E0B\u65B9\u662F\u5E38\u89C1\u914D\u7F6E\u573A\u666F\u793A\u4F8B",
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-guide-section" },
                  /*#__PURE__*/ React.createElement("h3", { className: "rules-guide-title" }, "\uD83D\uDCE5 \u573A\u666F\u4E00\uFF1A\u81EA\u52A8\u586B\u5145\u65E5\u671F\u548C\u5E97\u94FA\u540D"),
                  /*#__PURE__*/ React.createElement("p", { className: "rules-guide-desc" }, "\u5BF9\u4E8E\u6A21\u677F\u4E2D\u7684\u5360\u4F4D\u7B26\uFF08\u5982 xxxx\u3001xx\u5E74xx\u6708\uFF09\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u8BC6\u522B\u7C7B\u578B\u5E76\u586B\u5145\u3002"),
                  /*#__PURE__*/ React.createElement("div", { className: "rules-guide-steps" },
                    React.createElement("div", { className: "rules-guide-step" }, "1. \u9009\u62E9\u5B57\u6BB5 \u2192 \u6DFB\u52A0\u300C\u586B\u5145\u5360\u4F4D\u7B26\u300D\u6B65\u9AA4"),
                    React.createElement("div", { className: "rules-guide-step" }, "2. \u586B\u5145\u65B9\u5F0F\u9009\u62E9\u300C\u81EA\u52A8\u300D\uFF0C\u7CFB\u7EDF\u6839\u636E\u5B57\u6BB5\u7C7B\u578B\u81EA\u52A8\u586B\u5145"),
                    React.createElement("div", { className: "rules-guide-step" }, "3. \u4E5F\u53EF\u9009\u62E9\u300C\u6307\u5B9A\u503C\u300D\u624B\u52A8\u8F93\u5165\u56FA\u5B9A\u5185\u5BB9"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-guide-section" },
                  /*#__PURE__*/ React.createElement("h3", { className: "rules-guide-title" }, "\uD83D\uDD17 \u573A\u666F\u4E8C\uFF1A\u901A\u8FC7\u5546\u54C1ID\u5173\u8054\u53E6\u4E00\u5F20\u8868\u83B7\u53D6\u6570\u636E"),
                  /*#__PURE__*/ React.createElement("p", { className: "rules-guide-desc" }, "\u5982\u679C\u5229\u6DA6\u8868\u9700\u8981\u5F15\u7528\u5546\u54C1\u6210\u672C\u8868\u4E2D\u7684\u6570\u636E\uFF0C\u53EF\u4F7F\u7528\u300C\u8DE8\u8868\u5173\u8054\u300D\u6B65\u9AA4\u3002"),
                  /*#__PURE__*/ React.createElement("div", { className: "rules-guide-steps" },
                    React.createElement("div", { className: "rules-guide-step" }, "1. \u6DFB\u52A0\u300C\u6570\u636E\u6E90\u300D\u6B65\u9AA4\uFF0C\u9009\u62E9\u4E3B\u6570\u636E\u8868"),
                    React.createElement("div", { className: "rules-guide-step" }, "2. \u6DFB\u52A0\u300C\u8DE8\u8868\u5173\u8054\u300D\u6B65\u9AA4\uFF0C\u9009\u62E9\u5173\u8054\u6570\u636E\u8868"),
                    React.createElement("div", { className: "rules-guide-step" }, "3. \u4E3B\u8868\u5173\u8054\u952E\u9009\u62E9\u5546\u54C1ID\u5217\uFF0C\u5173\u8054\u8868\u5916\u952E\u9009\u62E9\u5546\u54C1ID\u5217"),
                    React.createElement("div", { className: "rules-guide-step" }, "4. \u53D6\u5173\u8054\u8868\u5217\u9009\u62E9\u9700\u8981\u83B7\u53D6\u7684\u5217\uFF08\u5982\u6210\u672C\u4EF7\uFF09"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-guide-section" },
                  /*#__PURE__*/ React.createElement("h3", { className: "rules-guide-title" }, "\uD83D\uDD0D \u573A\u666F\u4E09\uFF1A\u5C06\u6587\u672C\u63CF\u8FF0\u8F6C\u4E3A\u6570\u503C"),
                  /*#__PURE__*/ React.createElement("p", { className: "rules-guide-desc" }, "\u5982\u300C\u5546\u54C1\u89C4\u683C\u300D\u5217\u6709\u300C\u767D+\u9ED1+\u7070\u300D\u300C6\u6761\u88C5\u300D\u7B49\u63CF\u8FF0\uFF0C\u53EF\u7528\u300C\u67E5\u627E\u66FF\u6362\u300D\u8F6C\u4E3A\u6570\u503C\u3002"),
                  /*#__PURE__*/ React.createElement("div", { className: "rules-guide-steps" },
                    React.createElement("div", { className: "rules-guide-step" }, "1. \u6DFB\u52A0\u300C\u67E5\u627E\u66FF\u6362\u300D\u6B65\u9AA4"),
                    React.createElement("div", { className: "rules-guide-step" }, "2. \u5339\u914D\u6A21\u5F0F\u9009\u62E9\u300C\u5305\u542B\u5339\u914D\u300D"),
                    React.createElement("div", { className: "rules-guide-step" }, "3. \u6DFB\u52A0\u6620\u5C04\u89C4\u5219\uFF1A\u300C6\u6761\u88C5\u300D\u2192\u300C6\u300D\u3001\u300C3\u6761\u88C5\u300D\u2192\u300C3\u300D"),
                    React.createElement("div", { className: "rules-guide-step" }, "4. \u672A\u5339\u914D\u65F6\u53EF\u8BBE\u7F6E\u9ED8\u8BA4\u503C\uFF08\u5982 1\uFF09"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-guide-section" },
                  /*#__PURE__*/ React.createElement("h3", { className: "rules-guide-title" }, "\uD83E\uDDEA \u573A\u666F\u56DB\uFF1A\u4F7F\u7528\u516C\u5F0F\u8FDB\u884C\u590D\u6742\u8BA1\u7B97"),
                  /*#__PURE__*/ React.createElement("p", { className: "rules-guide-desc" }, "\u53EF\u4EE5\u5F15\u7528\u5DF2\u8BA1\u7B97\u5B57\u6BB5\u3001\u6570\u636E\u6E90\u5B57\u6BB5\u8FDB\u884C\u516C\u5F0F\u8BA1\u7B97\u3002"),
                  /*#__PURE__*/ React.createElement("div", { className: "rules-guide-steps" },
                    React.createElement("div", { className: "rules-guide-step" }, "1. \u5148\u914D\u7F6E\u597D\u9700\u8981\u5F15\u7528\u7684\u5B57\u6BB5\uFF08\u5982\u300C\u9500\u552E\u989D\u300D\u3001\u300C\u6210\u672C\u300D\uFF09"),
                    React.createElement("div", { className: "rules-guide-step" }, "2. \u6DFB\u52A0\u300C\u516C\u5F0F\u8BA1\u7B97\u300D\u6B65\u9AA4"),
                    React.createElement("div", { className: "rules-guide-step" }, "3. \u70B9\u51FB\u53EF\u7528\u5B57\u6BB5\u5217\u8868\u63D2\u5165\u53D8\u91CF\uFF0C\u5982 {销售额} * 0.7 - {成本}"),
                    React.createElement("div", { className: "rules-guide-step" }, "4. \u652F\u6301 Math.max\u3001Math.round\u3001Math.abs \u7B49\u51FD\u6570"),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-guide-section" },
                  /*#__PURE__*/ React.createElement("h3", { className: "rules-guide-title" }, "\uD83D\uDCA1 \u573A\u666F\u4E94\uFF1A\u7ED9\u8868\u65B0\u589E\u4E00\u4E2A\u8BA1\u7B97\u5217"),
                  /*#__PURE__*/ React.createElement("p", { className: "rules-guide-desc" }, "\u6570\u636E\u6765\u6E90\u4E8E\u672C\u8868\u5173\u8054\u5176\u4ED6\u8868\u540E\u8FDB\u884C\u8BA1\u7B97\uFF0C\u53EF\u7EC4\u5408\u591A\u4E2A\u6B65\u9AA4\u3002"),
                  /*#__PURE__*/ React.createElement("div", { className: "rules-guide-steps" },
                    React.createElement("div", { className: "rules-guide-step" }, "1. \u6DFB\u52A0\u300C\u6570\u636E\u6E90\u300D\u2192 \u300C\u8DE8\u8868\u5173\u8054\u300D\u83B7\u53D6\u5173\u8054\u6570\u636E"),
                    React.createElement("div", { className: "rules-guide-step" }, "2. \u6DFB\u52A0\u300C\u516C\u5F0F\u8BA1\u7B97\u300D\u6216\u300C\u6570\u5B66\u8FD0\u7B97\u300D\u8FDB\u884C\u8BA1\u7B97"),
                    React.createElement("div", { className: "rules-guide-step" }, "3. \u53EF\u7EE7\u7EED\u6DFB\u52A0\u300C\u56DB\u820D\u4E94\u5165\u300D\u3001\u300C\u6392\u540D\u300D\u7B49\u540E\u7EED\u5904\u7406"),
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
              /*#__PURE__*/ React.createElement(
                "select",
                {
                  className: "select",
                  value: copySourceFieldId,
                  onChange: (e) => setCopySourceFieldId(e.target.value),
                },
                /*#__PURE__*/ React.createElement(
                  "option",
                  { value: "" },
                  "\u8BF7\u9009\u62E9\u6E90\u5B57\u6BB5",
                ),
                fields
                  .filter(
                    (f) =>
                      (savedRules[f.id]?.steps || []).length > 0 &&
                      f.id !== activeField?.id,
                  )
                  .map((f) =>
                    /*#__PURE__*/ React.createElement(
                      "option",
                      { key: f.id, value: f.id },
                      f.name,
                      " (",
                      (savedRules[f.id]?.steps || []).length,
                      "\u4E2A\u6B65\u9AA4)",
                    ),
                  ),
              ),
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
          width: "720px",
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
              types: ["filter", "distinct", "condition", "limit"],
              color: "var(--color-warning)",
            },
            {
              id: "transform",
              title: "\uD83D\uDD04 \u6570\u636E\u8F6C\u6362",
              desc: "\u8F6C\u6362\u3001\u66FF\u6362\u3001\u6392\u5E8F\u3001\u65E5\u671F\u5904\u7406",
              types: ["virtual", "lookup", "sort", "text", "round", "concat", "substring", "date"],
              color: "var(--color-info)",
            },
            {
              id: "compute",
              title: "\uD83E\uDDEA \u8BA1\u7B97\u805A\u5408",
              desc: "\u6C42\u548C\u3001\u5E73\u5747\u3001\u516C\u5F0F\u3001\u6392\u540D\u3001\u6BD4\u7387\u3001\u7D2F\u8BA1\u3001\u5360\u6BD4",
              types: ["aggregate", "group", "formula", "math", "rank", "diff", "ratio", "runningTotal", "percentOfTotal"],
              color: "var(--color-success)",
            },
            {
              id: "join",
              title: "\uD83D\uDD17 \u8DE8\u8868\u5173\u8054",
              desc: "\u5173\u8054\u5168\u5C40\u6570\u636E\u8868\u3001\u5408\u5E76\u6570\u636E\u3001\u8DE8\u8868\u4EA4\u96C6/\u53BB\u91CD",
              types: ["join", "union", "crossMatch"],
              color: "var(--color-accent)",
            },
          ].map((group) =>
            /*#__PURE__*/ React.createElement(
              "div",
              { key: group.id, className: "step-type-group" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-group-header" },
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
                  { className: "step-type-group-desc" },
                  group.desc,
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-grid" },
                group.types.map((type) => {
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
            ),
          ),
        ),
      ),
  );
}; // ========== External Data Page ==========
