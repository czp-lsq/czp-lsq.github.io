
// RulesPage - 计算规则页面组件
const RulesPage = ({ state, currentPlatform, onNavigate }) => {
  const { addToast } = useToast();
  const getSemanticIcon = (semantic, type) => {
    const t = (semantic || type || "").toLowerCase();
    if (t.includes("money") || t.includes("price") || t.includes("amount") || t.includes("金额") || t.includes("价格") || t.includes("收入") || t.includes("成本") || t.includes("费用") || t.includes("利润")) return "\u00A5";
    if (t.includes("rate") || t.includes("percent") || t.includes("ratio") || t.includes("率") || t.includes("占比")) return "%";
    if (t.includes("count") || t.includes("qty") || t.includes("数量") || t.includes("件数") || t.includes("订单")) return "#";
    if (t.includes("date") || t.includes("time") || t.includes("日期") || t.includes("时间") || t.includes("年") || t.includes("月") || t.includes("日")) return "\u{1F4C5}";
    if (t.includes("text") || t.includes("name") || t.includes("名称") || t.includes("标题") || t.includes("备注")) return "Aa";
    return "\u00B7";
  };
  const SearchableSelect = window.SearchableSelect || ((props) => {
    const { value, onChange, options, placeholder, disabled, allowCreate, className = "", size = "default" } = props;
    const opts = (options || []).map((o) => typeof o === "object" ? { value: o.value, label: o.label || o.value } : { value: o, label: String(o) });
    const selectedOpt = opts.find((o) => String(o.value) === String(value));
    const displayValue = selectedOpt ? selectedOpt.label : value;
    return /*#__PURE__*/ React.createElement("div", { className: `searchable-select ${className} ${disabled ? "disabled" : ""} size-${size}` },
      /*#__PURE__*/ React.createElement("div", {
        className: "searchable-select-trigger",
        onClick: () => !disabled && document.querySelector(`[data-select-id="${props.key}"]`)?.focus(),
      },
        /*#__PURE__*/ React.createElement("span", { className: `searchable-select-value ${!value ? "placeholder" : ""}` }, displayValue || placeholder),
        /*#__PURE__*/ React.createElement("span", { className: "searchable-select-arrow" },
          /*#__PURE__*/ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            /*#__PURE__*/ React.createElement("polyline", { points: "6 9 12 15 18 9" })
          )
        )
      ),
      /*#__PURE__*/ React.createElement("select", {
        className: "select",
        value: value || "",
        onChange: (e) => onChange && onChange(e.target.value),
        disabled: disabled,
        "data-select-id": props.key,
        style: { display: 'none' }
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
  const [formulaFieldSearch, setFormulaFieldSearch] = useState("");
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
  const [debugStepId, setDebugStepId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewStepId, setPreviewStepId] = useState(null);
  const [previewTab, setPreviewTab] = useState("both");
  const [isPreviewPinned, setIsPreviewPinned] = useState(false);
  const [hoveredStepType, setHoveredStepType] = useState(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [infoPanelOpen, setInfoPanelOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(`rules_page_info_open_${currentPlatform}`);
      return saved === null ? true : saved === "true";
    } catch (e) { return true; }
  });
  const [isSaved, setIsSaved] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [fieldCategoryFilter, setFieldCategoryFilter] = useState("all");

  useEffect(() => {
    if (leftPanelCollapsed) {
      try {
        localStorage.setItem(`rules_page_left_collapsed_${currentPlatform}`, "true");
      } catch (e) {}
    }
  }, [leftPanelCollapsed, currentPlatform]);

  useEffect(() => {
    localStorage.setItem(`rules_page_info_open_${currentPlatform}`, infoPanelOpen);
  }, [infoPanelOpen, currentPlatform]);

  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const template = state.templates[currentPlatform];
  const savedRules = state.rules[currentPlatform] || {};
  const fields = template?.parseResult?.fields || [];
  const currentRule = activeField ? savedRules[activeField.id] : null;

  const { validateRule, inferFieldLevel, categorizeField, getFieldCategoryInfo } = window.RulesUtils;

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

  const groupedFields = useMemo(() => {
    const groups = { sales: [], cost: [], profit: [], other: [] };
    filteredFields.forEach((f) => {
      const cat = categorizeField(f);
      groups[cat].push(f);
    });
    return groups;
  }, [filteredFields]);

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
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [targetId]: {
              ...platformRules[targetId],
              steps: sourceRule.steps.map((step, i) => ({
                ...step,
                id: `step_${Date.now()}_${i}`,
              })),
            },
          },
        },
      };
    });
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
        Store.set((s) => {
          const platformRules = s.rules[currentPlatform] || {};
          return {
            ...s,
            rules: {
              ...s.rules,
              [currentPlatform]: {
                ...platformRules,
                [fieldId]: { steps: [], saved: false },
              },
            },
          };
        });
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
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [fieldId]: {
              ...rule,
              saved: true,
              savedAt: new Date().toISOString(),
            },
          },
        },
      };
    });
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
  // 步骤类型元数据已抽离到 assets/js/pages/rules/stepTypes.js（window.StepTypes）
  const { getStepTypeInfo, getStepTypePreview } = window.StepTypes || {};
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
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      const fieldRule = platformRules[activeField.id];
      if (!fieldRule || !fieldRule.steps) return s;
      const idx = fieldRule.steps.findIndex((st) => st.id === stepId);
      if (idx === -1) return s;
      const orig = fieldRule.steps[idx];
      const newStep = {
        ...orig,
        id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        config: { ...orig.config },
      };
      const newSteps = [
        ...fieldRule.steps.slice(0, idx + 1),
        newStep,
        ...fieldRule.steps.slice(idx + 1),
      ];
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [activeField.id]: { ...fieldRule, steps: newSteps },
          },
        },
      };
    });
    setExpandedStep(stepId);
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
      fill: () => ({ ok: true }),
      filter: () => {
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
      virtual: () => ({ ok: true }),
      join: () => ({ ok: true }),
      aggregate: () => ({ ok: true }),
      formula: () => ({ ok: true }),
      constant: () => ({ ok: true }),
      text: () => ({ ok: true }),
      distinct: () => ({ ok: true }),
      sort: () => ({ ok: true }),
      limit: () => ({ ok: true }),
      lookup: () => ({ ok: true }),
      condition: () => ({ ok: true }),
      group: () => ({ ok: true }),
      round: () => ({ ok: true }),
      concat: () => ({ ok: true }),
      substring: () => ({ ok: true }),
      date: () => ({ ok: true }),
      math: () => ({ ok: true }),
      rank: () => ({ ok: true }),
      diff: () => ({ ok: true }),
      ratio: () => ({ ok: true }),
      union: () => ({ ok: true }),
      crossMatch: () => ({ ok: true }),
      runningTotal: () => ({ ok: true }),
      percentOfTotal: () => ({ ok: true }),
      movingAverage: () => ({ ok: true }),
      binning: () => ({ ok: true }),
      conditionalTag: () => ({ ok: true }),
      stringExtract: () => ({ ok: true }),
      fillNA: () => ({ ok: true }),
      normalize: () => ({ ok: true }),
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
      formula: { expr: "" },
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
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      const fieldRule = platformRules[activeField.id] || { steps: [] };
      const currentSteps = fieldRule.steps || [];
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [activeField.id]: {
              ...fieldRule,
              steps: [...currentSteps, newStep],
            },
          },
        },
      };
    });
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
        Store.set((s) => {
          const platformRules = s.rules[currentPlatform] || {};
          const fieldRule = platformRules[activeField.id];
          if (!fieldRule || !fieldRule.steps) return s;
          const newSteps = fieldRule.steps.filter((st) => st.id !== stepId);
          return {
            ...s,
            rules: {
              ...s.rules,
              [currentPlatform]: {
                ...platformRules,
                [activeField.id]: { ...fieldRule, steps: newSteps },
              },
            },
          };
        });
        addToast("info", "删除步骤", "已删除计算步骤");
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const moveStep = (stepId, direction) => {
    if (!activeField || !currentRule) return;
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      const fieldRule = platformRules[activeField.id];
      if (!fieldRule || !fieldRule.steps) return s;
      const steps = [...fieldRule.steps];
      const idx = steps.findIndex((st) => st.id === stepId);
      if (idx === -1) return s;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= steps.length) return s;
      [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [activeField.id]: { ...fieldRule, steps },
          },
        },
      };
    });
  };
  const renderStepConfig = window.StepEditor.createRenderStepConfig({
    state,
    currentPlatform,
    currentRule,
    activeField,
    platform,
    updateStepConfig,
    SearchableSelect,
  });

  const copyToClipboard = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  };

  const dataToCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return "";
    const headers = new Set();
    data.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith("_")) headers.add(k);
        });
      }
    });
    const headerArr = Array.from(headers);
    const escapeCSV = (val) => {
      if (val == null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return "\"" + str.replace(/"/g, "\"\"") + "\"";
      }
      return str;
    };
    const lines = [headerArr.join(",")];
    data.forEach((row) => {
      lines.push(headerArr.map((h) => escapeCSV(row[h])).join(","));
    });
    return lines.join("\n");
  };

  const downloadCSV = (data, filename) => {
    const csv = dataToCSV(data);
    if (!csv) return;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPreviewData = (step, stepIdx) => {
    try {
      const allSteps = currentRule?.steps || [];
      const prevSteps = allSteps.slice(0, stepIdx);
      const activeFieldId = activeField?.id;
      const samples = state.samples || {};
      const fieldSamples = activeFieldId ? samples[activeFieldId] || [] : [];
      const sampleTables = (state.samples[currentPlatform] || []).map((s, i) => ({
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
      const tables = [...sampleTables, ...externalTables];
      let inputData = null;
      let outputData = null;
      try {
        if (typeof CalcEngine?.runSteps === "function") {
          const ctx = {
            fieldId: activeFieldId,
            platform: currentPlatform,
            samples: fieldSamples,
            template,
            tables,
            externals: state.externals || [],
            shopName: platform?.shops?.[0]?.name || "",
          };
          const resIn = CalcEngine.runSteps(prevSteps, ctx);
          inputData = resIn?.data ?? resIn?.result ?? resIn;
          const resOut = CalcEngine.runSteps(allSteps.slice(0, stepIdx + 1), ctx);
          outputData = resOut?.data ?? resOut?.result ?? resOut;
        }
      } catch (e) {}
      return { inputData, outputData };
    } catch (e) {
      return { inputData: null, outputData: null };
    }
  };

  const renderDataTable = (data, maxRows) => {
    const mRows = maxRows || 100;
    if (!data) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "暂无数据",
      );
    }
    if (!Array.isArray(data)) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "数据格式不支持预览",
      );
    }
    if (data.length === 0) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "空数组（0行）",
      );
    }
    const headerSet = new Set();
    data.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith("_")) headerSet.add(k);
        });
      }
    });
    const allHeaders = Array.from(headerSet);
    if (allHeaders.length === 0) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "无可见列",
      );
    }
    const displayRows = data.slice(0, mRows);
    return /*#__PURE__*/ React.createElement(
      "div",
      { style: { width: "100%" } },
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "6px", maxHeight: "300px", overflowY: "auto" } },
        /*#__PURE__*/ React.createElement(
          "table",
          { style: { width: "100%", borderCollapse: "collapse", fontSize: "12px" } },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              allHeaders.map((h) => /*#__PURE__*/ React.createElement(
                "th",
                {
                  key: h,
                  title: h,
                  style: {
                    padding: "8px 10px",
                    textAlign: "left",
                    background: "var(--color-bg-tertiary)",
                    borderBottom: "1px solid var(--color-border)",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  },
                },
                h,
              )),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            displayRows.map((row, ri) => /*#__PURE__*/ React.createElement(
              "tr",
              {
                key: ri,
                style: {
                  background: ri % 2 === 0 ? "var(--color-bg-primary)" : "var(--color-bg-secondary)",
                },
              },
              allHeaders.map((h) => /*#__PURE__*/ React.createElement(
                "td",
                {
                  key: h,
                  style: {
                    padding: "6px 10px",
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                  title: row[h] != null ? String(row[h]) : "",
                },
                row[h] != null
                  ? (typeof row[h] === "number"
                    ? row[h].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                    : String(row[h]))
                  : "-",
              )),
            )),
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { marginTop: "6px", fontSize: "11px", color: "var(--color-text-tertiary)", display: "flex", justifyContent: "space-between" } },
        /*#__PURE__*/ React.createElement("span", null, "共 " + data.length + " 行，显示前 " + Math.min(mRows, data.length) + " 行"),
        /*#__PURE__*/ React.createElement("span", null, allHeaders.length + " 列"),
      ),
    );
  };

  // 调试预览：模拟执行当前步骤，展示输入/输出
  const renderStepDebug = (step, stepIdx) => {
    try {
      // 收集前面步骤作为前置上下文
      const allSteps = currentRule?.steps || [];
      const prevSteps = allSteps.slice(0, stepIdx);

      // 获取当前字段的样例数据作为输入
      const activeFieldId = activeField?.id;
      const samples = state.samples || {};
      const fieldSamples = activeFieldId ? samples[activeFieldId] || [] : [];

      // 构建数据表，包含样本表和全局表
      const sampleTables = (state.samples[currentPlatform] || []).map((s, i) => ({
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
      const tables = [...sampleTables, ...externalTables];

      // 尝试执行前面所有步骤，获取当前步骤的输入数据
      let inputData = null;
      let executeError = null;
      try {
        if (typeof CalcEngine?.runSteps === "function") {
          const ctx = {
            fieldId: activeFieldId,
            platform: currentPlatform,
            samples: fieldSamples,
            template,
            tables,
            externals: state.externals || [],
            shopName: platform?.shops?.[0]?.name || "",
          };
          const res = CalcEngine.runSteps(prevSteps, ctx);
          inputData = res?.data ?? res?.result ?? res;
        }
      } catch (e) {
        executeError = e.message || String(e);
      }

      // 当前步骤执行
      let outputData = null;
      let currentError = null;
      try {
        if (typeof CalcEngine?.runSteps === "function") {
          const ctx = {
            fieldId: activeFieldId,
            platform: currentPlatform,
            samples: fieldSamples,
            template,
            tables,
            externals: state.externals || [],
            shopName: platform?.shops?.[0]?.name || "",
          };
          const res = CalcEngine.runSteps(allSteps.slice(0, stepIdx + 1), ctx);
          outputData = res?.data ?? res?.result ?? res;
        }
      } catch (e) {
        currentError = e.message || String(e);
      }

      const renderDataPreview = (data) => {
        if (!data) return null;
        if (Array.isArray(data)) {
          if (data.length === 0) {
            return /*#__PURE__*/ React.createElement("span", { className: "debug-empty" }, "空数组");
          }
          // 从所有行收集列名，避免首行缺失列导致显示不完整
          const headerSet = new Set();
          data.forEach((row) => {
            if (row && typeof row === "object") {
              Object.keys(row).forEach((k) => {
                if (!k.startsWith("_")) headerSet.add(k);
              });
            }
          });
          const allHeaders = Array.from(headerSet);
          if (allHeaders.length === 0) {
            return /*#__PURE__*/ React.createElement("span", { className: "debug-empty" }, "无可见列");
          }
          const cfg = step.config || {};
          let relevantHeaders = [];
          const extractExprFields = (expr) => {
            if (!expr) return [];
            const matches = expr.match(/{([^}]+)}/g);
            return matches ? matches.map((m) => m.slice(1, -1)) : [];
          };
          switch (step.type) {
            case "filter":
            case "filterEqual":
            case "filterContain":
            case "filterRange":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "virtual":
              relevantHeaders = [cfg.source, cfg.target].filter(Boolean);
              break;
            case "join":
              relevantHeaders = [cfg.key, cfg.fk, cfg.col, cfg.sizeField].filter(Boolean);
              break;
            case "aggregate":
            case "group":
              if (cfg.column === "__expr__" && cfg.expr) {
                relevantHeaders = extractExprFields(cfg.expr);
              } else {
                relevantHeaders = [cfg.column, cfg.aggColumn, cfg.groupBy].filter(Boolean);
              }
              break;
            case "formula":
            case "math":
            case "ratio":
            case "diff":
              relevantHeaders = extractExprFields(cfg.expr);
              break;
            case "sort":
            case "topN":
            case "runningTotal":
            case "movingAverage":
            case "percentOfTotal":
            case "normalize":
            case "fillNA":
            case "binning":
            case "conditionalTag":
            case "stringExtract":
            case "round":
            case "date":
            case "rank":
            case "valueNormalize":
              relevantHeaders = [cfg.column, cfg.targetColumn, cfg.orderColumn].filter(Boolean);
              break;
            case "concat":
              relevantHeaders = (cfg.columns || []).filter(Boolean);
              break;
            case "substring":
            case "lookup":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "condition":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "crossMatch":
            case "intersect":
              relevantHeaders = [...(cfg.columns || []), ...(cfg.compareColumns || []), cfg.key, cfg.compareKey].filter(Boolean);
              break;
            case "keepDuplicate":
            case "keepUnique":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "union":
              relevantHeaders = (cfg.tables || []).map((t) => (typeof t === "string" ? t : t.id)).filter(Boolean);
              break;
            case "source":
            case "limit":
            case "constant":
            case "text":
            case "fill":
            default:
              relevantHeaders = [];
              break;
          }
          const validRelevant = relevantHeaders.filter((h) => allHeaders.includes(h));
          // 单列数据使用卡片式展示，避免表格过宽
          if (allHeaders.length === 1) {
            const key = allHeaders[0];
            return /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-single-column" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "debug-single-column-header" },
                /*#__PURE__*/ React.createElement(Icons.Column, { size: 14 }),
                key,
              ),
              data.slice(0, 50).map((row, ri) => /*#__PURE__*/ React.createElement(
                "div",
                { key: ri, className: "debug-single-column-row" },
                /*#__PURE__*/ React.createElement("span", { className: "debug-single-column-index" }, ri + 1),
                /*#__PURE__*/ React.createElement("span", { className: "debug-single-column-value" },
                  row[key] != null
                    ? typeof row[key] === "number"
                      ? row[key].toLocaleString("zh-CN", { maximumFractionDigits: 4 })
                      : String(row[key]).slice(0, 80)
                    : "-",
                ),
              )),
              data.length > 50 && /*#__PURE__*/ React.createElement(
                "div",
                { className: "debug-table-more" },
                `... 共 ${data.length} 行，显示前50行`,
              ),
            );
          }
          // 多列数据：优先高亮相关列，但展示所有列，支持横向滚动
          const displayHeaders = validRelevant.length > 0
            ? Array.from(new Set([...validRelevant, ...allHeaders]))
            : allHeaders;
          const displayRows = data.slice(0, 100);
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-data-table" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-scroll" },
              /*#__PURE__*/ React.createElement(
                "table",
                { className: "debug-table" },
                /*#__PURE__*/ React.createElement(
                  "thead",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    null,
                    displayHeaders.map((h) => /*#__PURE__*/ React.createElement(
                      "th",
                      {
                        key: h,
                        title: h,
                        className: validRelevant.includes(h) ? "debug-col-relevant" : "",
                      },
                      h,
                    )),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "tbody",
                  null,
                  displayRows.map((row, ri) => /*#__PURE__*/ React.createElement(
                    "tr",
                    { key: ri },
                    displayHeaders.map((h) => /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        key: h,
                        className: validRelevant.includes(h) ? "debug-col-relevant" : "",
                      },
                      row[h] != null
                        ? typeof row[h] === "number"
                          ? row[h].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                          : String(row[h]).slice(0, 50)
                        : "-",
                    )),
                  )),
                ),
              ),
            ),
            validRelevant.length > 0 && validRelevant.length < allHeaders.length && /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-more" },
              `💡 高亮列：${validRelevant.join("、")}（共 ${allHeaders.length} 列，可横向滚动查看全部）`,
            ),
            data.length > 100 && /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-more" },
              `... 共 ${data.length} 行，显示前100行`,
            ),
          );
        }
        if (typeof data === "object") {
          const entries = Object.entries(data).filter(([k]) => !k.startsWith("_"));
          if (entries.length === 0) {
            return /*#__PURE__*/ React.createElement("span", { className: "debug-empty" }, "空对象");
          }
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-data-object" },
            entries.map(([key, val]) => /*#__PURE__*/ React.createElement(
              "div",
              { key: key, className: "debug-object-row" },
              /*#__PURE__*/ React.createElement("span", { className: "debug-object-key" }, key),
              /*#__PURE__*/ React.createElement("span", { className: "debug-object-value" },
                typeof val === "number"
                  ? val.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                  : typeof val === "object"
                    ? JSON.stringify(val).slice(0, 50)
                    : String(val).slice(0, 50),
              ),
            )),
          );
        }
        return /*#__PURE__*/ React.createElement("span", null,
          typeof data === "number"
            ? data.toLocaleString("zh-CN", { maximumFractionDigits: 4 })
            : String(data),
        );
      };

      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "debug-section" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-row" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-label" },
            "📥 输入数据",
            inputData && Array.isArray(inputData) && /*#__PURE__*/ React.createElement(
              "span",
              { className: "debug-count" },
              `(${inputData.length} 行)`,
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-value" },
            inputData
              ? renderDataPreview(inputData)
              : executeError
                ? /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-error" },
                    "执行失败: ",
                    executeError,
                  )
                : /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-empty" },
                    "暂无输入数据（请先在「样例数据」中配置字段样例）",
                  ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-arrow" },
          "↓",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-row" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-label" },
            "📤 输出结果",
            outputData && Array.isArray(outputData) && /*#__PURE__*/ React.createElement(
              "span",
              { className: "debug-count" },
              `(${outputData.length} 行)`,
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-value" },
            outputData
              ? renderDataPreview(outputData)
              : currentError
                ? /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-error" },
                    "执行失败: ",
                    currentError,
                  )
                : /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-empty" },
                    "暂无输出",
                  ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-tip" },
          "💡 提示：调试预览仅用于验证步骤逻辑。实际计算时会基于真实数据源执行。",
        ),
      );
    } catch (e) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "debug-error" },
        "调试面板加载失败: ",
        e.message,
      );
    }
  };

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "fade-in rules-page", style: { position: "relative" } },
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
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "rules-page-header",
              style: {
                padding: "12px 20px",
                borderBottom: "1px solid var(--color-border-light)",
                background: "var(--color-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: "1 1 auto", overflow: "hidden" } },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  className: "breadcrumb",
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  },
                },
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    style: { cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
                    onClick: () => onNavigate && onNavigate("template"),
                  },
                  /*#__PURE__*/ React.createElement(Icons.LayoutGrid, { size: 14 }),
                  "模板中心",
                ),
                /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-text-tertiary)" } }, "/"),
                /*#__PURE__*/ React.createElement(
                  "span",
                  { style: { fontWeight: 600, color: "var(--color-text-primary)", display: "inline-flex", alignItems: "center", gap: "4px" } },
                  /*#__PURE__*/ React.createElement(Icons.Calculator, { size: 14 }),
                  "计算规则",
                ),
                activeField && /*#__PURE__*/ React.createElement(
                  React.Fragment,
                  null,
                  /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-text-tertiary)" } }, "/"),
                  /*#__PURE__*/ React.createElement(
                    "span",
                    {
                      style: {
                        color: "var(--color-primary)",
                        fontWeight: 500,
                        maxWidth: "240px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                      title: activeField.name,
                    },
                    activeField.name,
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { style: { display: "flex", alignItems: "center", gap: "12px" } },
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  className: `save-status-indicator ${isSaved ? "saved" : "unsaved"}`,
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: isSaved ? "#f0fdf4" : "#fef3c7",
                    color: isSaved ? "#16a34a" : "#d97706",
                    border: `1px solid ${isSaved ? "#bbf7d0" : "#fde68a"}`,
                  },
                },
                isSaved
                  ? /*#__PURE__*/ React.createElement(Icons.CheckCircle, { size: 12 })
                  : /*#__PURE__*/ React.createElement(Icons.Circle, { size: 12 }),
                isSaved ? "已保存" : "未保存",
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm",
                  onClick: () => setShowShortcuts(!showShortcuts),
                  title: "快捷键 (Ctrl+/)",
                  style: { display: "flex", alignItems: "center", gap: "4px" },
                },
                /*#__PURE__*/ React.createElement(Icons.Keyboard, { size: 14 }),
                "快捷键",
              ),
              activeField && /*#__PURE__*/ React.createElement(
                Button,
                {
                  size: "sm",
                  onClick: () => {
                    const idx = filteredFields.findIndex((f) => f.id === activeField.id);
                    if (idx > 0) setActiveField(filteredFields[idx - 1]);
                  },
                  disabled: filteredFields.findIndex((f) => f.id === activeField.id) <= 0,
                },
                /*#__PURE__*/ React.createElement(Icons.ChevronLeft, { size: 14 }),
                " 上一个",
              ),
              activeField && /*#__PURE__*/ React.createElement(
                Button,
                {
                  type: "primary",
                  size: "sm",
                  onClick: () => {
                    const idx = filteredFields.findIndex((f) => f.id === activeField.id);
                    if (idx < filteredFields.length - 1) setActiveField(filteredFields[idx + 1]);
                  },
                  disabled: filteredFields.findIndex((f) => f.id === activeField.id) >= filteredFields.length - 1,
                },
                "下一个 ",
                /*#__PURE__*/ React.createElement(Icons.ChevronRight, { size: 14 }),
              ),
            ),
          ),
          showShortcuts && /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "shortcuts-panel",
              style: {
                position: "absolute",
                top: "60px",
                right: "20px",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
                boxShadow: "var(--shadow-lg)",
                zIndex: 1000,
                minWidth: "280px",
              },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              },
              "快捷键提示",
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  onClick: () => setShowShortcuts(false),
                  style: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-tertiary)",
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.X, { size: 16 }),
              ),
            ),
            [
              { keys: "Ctrl + S", desc: "保存当前规则" },
              { keys: "Ctrl + Z", desc: "撤销" },
              { keys: "Ctrl + Y", desc: "重做" },
              { keys: "Ctrl + /", desc: "显示/隐藏快捷键" },
              { keys: "Alt + ←", desc: "上一个字段" },
              { keys: "Alt + →", desc: "下一个字段" },
              { keys: "Ctrl + N", desc: "添加步骤" },
            ].map((item, i) => /*#__PURE__*/ React.createElement(
              "div",
              {
                key: i,
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  fontSize: "12px",
                  borderBottom: i < 6 ? "1px solid var(--color-border-light)" : "none",
                },
              },
              /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-text-secondary)" } }, item.desc),
              /*#__PURE__*/ React.createElement(
                "kbd",
                {
                  style: {
                    padding: "2px 6px",
                    background: "var(--color-bg-tertiary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-primary)",
                  },
                },
                item.keys,
              ),
            )),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "rules-layout" },
            /*#__PURE__*/ React.createElement(
              "aside",
              { className: "rules-sidebar", style: { width: leftPanelCollapsed ? "0" : "260px" } },
              !leftPanelCollapsed && /*#__PURE__*/ React.createElement(
                "div",
                { className: "sidebar-inner" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "sidebar-header" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "sidebar-title" },
                    /*#__PURE__*/ React.createElement(Icons.Layers, { size: 16 }),
                    "\u6A21\u677F\u5B57\u6BB5",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "sidebar-header-actions" },
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "sidebar-count" },
                      filteredFields.length,
                      "/",
                      fields.length,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "button",
                      { className: "sidebar-collapse", onClick: () => setLeftPanelCollapsed(true) },
                      /*#__PURE__*/ React.createElement(Icons.ChevronLeft, { size: 14 }),
                    ),
                  ),
                ),
                fields.length > 0 &&
                  /*#__PURE__*/ React.createElement(
                    React.Fragment,
                    null,
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "sidebar-search" },
                      /*#__PURE__*/ React.createElement(Icons.Search, { size: 14 }),
                      /*#__PURE__*/ React.createElement("input", {
                        type: "text",
                        className: "sidebar-search-input",
                        placeholder: "搜索字段...",
                        value: fieldSearch,
                        onChange: (e) => setFieldSearch(e.target.value),
                      }),
                      fieldSearch &&
                        /*#__PURE__*/ React.createElement(
                          "button",
                          { className: "sidebar-search-clear", onClick: () => setFieldSearch("") },
                          /*#__PURE__*/ React.createElement(Icons.X, { size: 14 }),
                        ),
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "sidebar-filters" },
                      [
                        { key: "all", label: "全部" },
                        { key: "done", label: "已配置" },
                        { key: "pending", label: "未配置" },
                        { key: "warning", label: "有问题" },
                      ].map((tab) =>
                        /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            key: tab.key,
                            className: `sidebar-filter-tab ${fieldFilter === tab.key ? "active" : ""}`,
                            onClick: () => setFieldFilter(tab.key),
                          },
                          tab.label,
                        ),
                      ),
                    ),
                  ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "sidebar-content" },
                    fields.length === 0
                      ? /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "sidebar-empty" },
                          /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, { size: 32 }),
                          /*#__PURE__*/ React.createElement("div", { className: "sidebar-empty-title" }, "暂无模板"),
                          /*#__PURE__*/ React.createElement("div", { className: "sidebar-empty-desc" }, "请先上传利润表模板"),
                          /*#__PURE__*/ React.createElement(
                            Button,
                            { type: "primary", size: "sm", onClick: () => onNavigate && onNavigate("template") },
                            "\u53BB\u4E0A\u4F20",
                          ),
                        )
                      : filteredFields.length === 0
                        ? /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "sidebar-empty" },
                            /*#__PURE__*/ React.createElement(Icons.SearchX, { size: 32 }),
                            /*#__PURE__*/ React.createElement("div", { className: "sidebar-empty-title" }, "未找到字段"),
                            /*#__PURE__*/ React.createElement("div", { className: "sidebar-empty-desc" }, "请尝试其他搜索条件"),
                          )
                        : /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "field-groups" },
                    ["sales", "cost", "profit", "other"].map((catKey) => {
                      const catFields = groupedFields[catKey] || [];
                      if (catFields.length === 0) return null;
                      const catInfo = getFieldCategoryInfo(catKey);
                      return /*#__PURE__*/ React.createElement(
                        "div",
                        { key: catKey, className: "field-group" },
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "field-group-header", style: { background: catInfo.bg, color: catInfo.color } },
                          catInfo.icon,
                          catInfo.name,
                          /*#__PURE__*/ React.createElement("span", { className: "field-group-count" }, catFields.length),
                        ),
                        /*#__PURE__*/ React.createElement(
                          "ul",
                          { className: "field-items" },
                          catFields.map((field) => {
                            const v = validateRule(savedRules[field.id], field);
                            const stepCount = (savedRules[field.id]?.steps || []).length;
                            const status = stepCount === 0 ? "empty" : (v.valid ? "done" : "partial");
                            return /*#__PURE__*/ React.createElement(
                              "li",
                              {
                                key: field.id,
                                className: `field-item ${activeField?.id === field.id ? "active" : ""} field-status-${status}`,
                                onClick: () => setActiveField(field),
                                title: `${field.name} · ${field.cell}${stepCount > 0 ? " · " + stepCount + "步" : ""}`,
                              },
                              /*#__PURE__*/ React.createElement("span", { className: `field-item-dot ${status === "done" ? "done" : status === "partial" ? "partial" : ""}` }),
                              /*#__PURE__*/ React.createElement("div", { className: "field-item-name" }, field.name),
                              stepCount > 0 && /*#__PURE__*/ React.createElement("span", { className: "field-item-badge" }, stepCount),
                            );
                          }),
                        ),
                      );
                    }),
                  ),
                ),
              ),
              leftPanelCollapsed && /*#__PURE__*/ React.createElement(
                "button",
                { className: "sidebar-expand", onClick: () => setLeftPanelCollapsed(false) },
                /*#__PURE__*/ React.createElement(Icons.ChevronRight, { size: 16 }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "main",
              { className: "rules-main" },
              /*#__PURE__*/ React.createElement(
                "header",
                { className: "rules-main-header" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-main-header-left" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "rules-main-title" },
                    /*#__PURE__*/ React.createElement(Icons.Calculator, { size: 18 }),
                    activeField
                      ? `「${activeField.name}」计算规则`
                      : "请选择字段",
                  ),
                  activeField &&
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "rules-main-subtitle" },
                      "单元格 ",
                      activeField.cell,
                      " · ",
                      activeField.type === "text" ? "文本填充" : "数值填充",
                      (() => {
                        const v = validateRule(currentRule, activeField);
                        return /*#__PURE__*/ React.createElement(
                          "span",
                          {
                            className: `rules-main-status ${v.valid ? "ok" : "warn"}`,
                          },
                          v.valid ? "✓ " + v.msg : "⚠ " + v.msg,
                        );
                      })(),
                    ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "rules-main-header-right" },
                  activeField &&
                    /*#__PURE__*/ React.createElement(
                      React.Fragment,
                      null,
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "field-nav" },
                        /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            className: "field-nav-btn",
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
                          },
                          "‹",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "span",
                          { className: "field-nav-count" },
                          filteredFields.findIndex((f) => f.id === activeField.id) + 1,
                          "/",
                          filteredFields.length,
                        ),
                        /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            className: "field-nav-btn",
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
                          },
                          "›",
                        ),
                      ),
                      /*#__PURE__*/ React.createElement(
                        "button",
                        { className: "header-action-btn", onClick: () => setInfoPanelOpen(!infoPanelOpen) },
                        /*#__PURE__*/ React.createElement(Icons.Info, { size: 16 }),
                      ),
                    ),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "rules-main-body" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "card" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "card-header card-header-actions-only" },
                    activeField &&
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "card-header-actions" },
                        currentRule?.steps?.length > 0 &&
                          /*#__PURE__*/ React.createElement(
                            Button,
                            {
                              size: "sm",
                              onClick: () => clearFieldRule(activeField.id),
                            },
                            /*#__PURE__*/ React.createElement(Icons.Refresh, null),
                            "清空",
                          ),
                        /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "header-divider" },
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
                          " 调试模式",
                        ),
                        /*#__PURE__*/ React.createElement(
                          Button,
                          {
                            type: "primary",
                            size: "sm",
                            onClick: () => setShowAddStepModal(true),
                          },
                          /*#__PURE__*/ React.createElement(Icons.Plus, null),
                          "添加步骤",
                        ),
                        /*#__PURE__*/ React.createElement(
                          Button,
                          {
                            type: "primary",
                            size: "sm",
                            onClick: () => saveFieldRule(activeField.id),
                          },
                          /*#__PURE__*/ React.createElement(Icons.Save, null),
                          "保存规则",
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
                    window.Presets.renderPresetGrid(activeField, presetCategory, setPresetCategory, currentPlatform, getCategoryInfo, addToast),
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
                          "\u70B9\u51FB\u4E0A\u65B9\u300C+ \u6DFB\u52A0\u6B65\u9AA4\u300D\u6309\u94AE\u5F00\u59CB\u914D\u7F6E\u8BA1\u7B97\u89C4\u5219",
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
                              { style: { color: info.color, fontSize: 16, display: "inline-flex", flexShrink: 0 } },
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
                                    "step-action-btn step-action-preview",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    setPreviewStepId(step.id);
                                    setShowPreviewModal(true);
                                  },
                                  title: "\u9884\u89C8",
                                },
                                /*#__PURE__*/ React.createElement(
                                  Icons.Eye,
                                  null,
                                ),
                              ),
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
                              { className: "step-body" },
                              info.desc &&
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  { className: "step-description" },
                                  /*#__PURE__*/ React.createElement(
                                    "span",
                                    {
                                      className:
                                        "step-description-icon",
                                    },
                                    info.icon,
                                  ),
                                  /*#__PURE__*/ React.createElement(
                                    "div",
                                    { className: "step-description-text" },
                                    /*#__PURE__*/ React.createElement(
                                      "div",
                                      {
                                        className:
                                          "step-description-title",
                                      },
                                      info.name,
                                      " \u2014 ",
                                      info.desc,
                                    ),
                                  ),
                                ),
                              !stepValidation.valid &&
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  { className: "step-alert error" },
                                  /*#__PURE__*/ React.createElement(
                                    Icons.AlertCircle,
                                    { size: 16 },
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
                                    hint.type === "warning"
                                      ? /*#__PURE__*/ React.createElement(Icons.AlertTriangle, { size: 16 })
                                      : hint.type === "error"
                                        ? /*#__PURE__*/ React.createElement(Icons.AlertCircle, { size: 16 })
                                        : /*#__PURE__*/ React.createElement(Icons.Info, { size: 16 }),
                                    /*#__PURE__*/ React.createElement(
                                      "span",
                                      null,
                                      hint.text,
                                    ),
                                  ),
                                ),
                              renderStepConfig(step, activeField),
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "step-debug-panel" },
                                /*#__PURE__*/ React.createElement(
                                  "button",
                                  {
                                    className: "btn btn-text btn-sm",
                                    onClick: () => {
                                      setPreviewStepId(step.id);
                                      setShowPreviewModal(true);
                                    },
                                    style: { fontSize: "12px", padding: "4px 12px", gap: "6px" },
                                  },
                                  /*#__PURE__*/ React.createElement(Icons.Eye, { size: 14 }),
                                  "查看数据预览",
                                ),
                              ),
                            ),
                        );
                      }),
                    activeField && /*#__PURE__*/ React.createElement(
                      "button",
                      {
                        className: "add-step-bottom-btn",
                        onClick: () => setShowAddStepModal(true),
                        style: {
                          width: "100%",
                          padding: "16px",
                          marginTop: "16px",
                          border: "2px dashed var(--color-border)",
                          borderRadius: "var(--radius-lg)",
                          background: "var(--color-bg-card)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                          transition: "all 0.2s",
                        },
                        onMouseEnter: (e) => {
                          e.target.style.borderColor = "var(--color-primary)";
                          e.target.style.color = "var(--color-primary)";
                          e.target.style.background = "var(--color-primary-50)";
                        },
                        onMouseLeave: (e) => {
                          e.target.style.borderColor = "var(--color-border)";
                          e.target.style.color = "var(--color-text-secondary)";
                          e.target.style.background = "var(--color-bg-card)";
                        },
                      },
                      /*#__PURE__*/ React.createElement(Icons.PlusCircle, { size: 20 }),
                      "添加计算步骤",
                    ),
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
            activeField &&
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "rules-field-info-card", style: { marginBottom: 16 } },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "card-header", style: { padding: "12px 16px" } },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "card-title", style: { display: "flex", alignItems: "center", gap: 8 } },
                    /*#__PURE__*/ React.createElement(Icons.Info, { size: 14 }),
                    "\u5B57\u6BB5\u8BE6\u60C5",
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "card-body", style: { padding: "12px 16px" } },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "info-card" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "info-card-header" },
                      /*#__PURE__*/ React.createElement("span", { className: `info-card-icon ${activeField.type === "text" ? "text" : "value"}` }, activeField.type === "text" ? "📝" : "💰"),
                      /*#__PURE__*/ React.createElement("div", { className: "info-card-title" }, activeField.name),
                      /*#__PURE__*/ React.createElement("span", { className: "info-card-cell" }, activeField.cell),
                    ),
                    (() => {
                      const v = validateRule(currentRule, activeField);
                      return /*#__PURE__*/ React.createElement(
                        "div",
                        { className: `info-card-status ${v.valid ? "ok" : "warn"}` },
                        /*#__PURE__*/ React.createElement(v.valid ? Icons.CheckCircle : Icons.AlertCircle, { size: 14 }),
                        v.valid ? "配置完整" : "配置不完整",
                        /*#__PURE__*/ React.createElement("span", { className: "info-card-status-msg" }, v.msg),
                      );
                    })(),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "info-section", style: { marginTop: 12 } },
                    /*#__PURE__*/ React.createElement("div", { className: "info-section-title" }, /*#__PURE__*/ React.createElement(Icons.Tag, { size: 14 }), "\u5B57\u6BB5\u5C5E\u6027"),
                    /*#__PURE__*/ React.createElement("div", { className: "info-properties" },
                      /*#__PURE__*/ React.createElement("div", { className: "info-property" }, /*#__PURE__*/ React.createElement("span", { className: "info-property-label" }, "填充类型"), /*#__PURE__*/ React.createElement("span", { className: "info-property-value" }, activeField.type === "text" ? "文本填充" : "数值填充")),
                      activeField.semanticType && /*#__PURE__*/ React.createElement("div", { className: "info-property" }, /*#__PURE__*/ React.createElement("span", { className: "info-property-label" }, "语义类型"), /*#__PURE__*/ React.createElement("span", { className: "info-property-value" },
                        activeField.semanticType === "shop" && "🏪 店铺名",
                        activeField.semanticType === "year" && "📅 年份",
                        activeField.semanticType === "month" && "📅 月份",
                        activeField.semanticType === "day" && "📅 日期",
                        activeField.semanticType === "date" && "📅 日期",
                        activeField.semanticType === "value" && "💰 数值",
                        activeField.semanticType === "text" && "📝 文本",
                        !["shop", "year", "month", "day", "date", "value", "text"].includes(activeField.semanticType) && "📦 占位符",
                      )),
                      (currentRule?.steps || []).length > 0 && /*#__PURE__*/ React.createElement("div", { className: "info-property" }, /*#__PURE__*/ React.createElement("span", { className: "info-property-label" }, "步骤数"), /*#__PURE__*/ React.createElement("span", { className: "info-property-value" }, currentRule.steps.length, "\u6B65")),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "info-section", style: { marginTop: 12 } },
                    /*#__PURE__*/ React.createElement("div", { className: "info-section-title" }, /*#__PURE__*/ React.createElement(Icons.HelpCircle, { size: 14 }), "\u4F7F\u7528\u63D0\u793A"),
                    /*#__PURE__*/ React.createElement("div", { className: "info-tip" },
                      activeField.semanticType === "shop" && "该字段为店铺名占位符，系统会自动从上传的文件名中识别店铺名并填充，无需手动配置计算步骤。",
                      (activeField.semanticType === "year" || activeField.semanticType === "month" || activeField.semanticType === "day" || activeField.semanticType === "date") && "该字段为日期占位符，系统会自动填充当前处理数据的对应日期部分，可根据需要调整日期格式。",
                      activeField.semanticType === "value" && "该字段为数值占位符，需要通过计算步骤从数据源获取值。建议先添加「数据源」步骤选择数据表，再添加筛选、公式等处理步骤。",
                      activeField.semanticType === "text" && "该字段为文本占位符，可从数据源字段中提取文本，或设置固定文本值。",
                      !["shop", "year", "month", "day", "date", "value", "text"].includes(activeField.semanticType) && "该字段为通用占位符，可根据实际需要配置填充方式或计算规则。",
                    ),
                  ),
                ),
              ),
                    ),
                  ),
            /*#__PURE__*/ React.createElement(
              "aside",
              { className: "rules-info-panel", style: { width: infoPanelOpen ? "320px" : "0" } },
              infoPanelOpen && /*#__PURE__*/ React.createElement(
                "div",
                { className: "info-panel-inner" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "info-panel-header" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "info-panel-title" },
                    /*#__PURE__*/ React.createElement(Icons.Eye, { size: 16 }),
                    "\u5B9E\u65F6\u9884\u89C8",
                  ),
                  /*#__PURE__*/ React.createElement(
                    "button",
                    { className: "info-panel-close", onClick: () => setInfoPanelOpen(false) },
                    /*#__PURE__*/ React.createElement(Icons.X, { size: 14 }),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "info-panel-content" },
                  !activeField
                    ? /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "info-panel-empty" },
                        /*#__PURE__*/ React.createElement(Icons.FileSpreadsheet, { size: 40, style: { color: "var(--color-text-tertiary)" } }),
                        /*#__PURE__*/ React.createElement("div", { className: "info-panel-empty-title" }, "请选择字段"),
                        /*#__PURE__*/ React.createElement("div", { className: "info-panel-empty-desc" }, "从左侧选择字段后，此处将显示实时计算预览"),
                      )
                    : !debugMode
                      ? /*#__PURE__*/ React.createElement(
                          "div",
                          { className: "info-panel-empty" },
                          /*#__PURE__*/ React.createElement(Icons.Bug, { size: 40, style: { color: "var(--color-text-tertiary)" } }),
                          /*#__PURE__*/ React.createElement("div", { className: "info-panel-empty-title" }, "调试模式未开启"),
                          /*#__PURE__*/ React.createElement("div", { className: "info-panel-empty-desc" }, "开启调试模式后，此处将显示实时计算预览"),
                        )
                      : !previewResult
                        ? /*#__PURE__*/ React.createElement(
                            "div",
                            { className: "info-panel-empty" },
                            /*#__PURE__*/ React.createElement(Icons.Loader, { size: 40, style: { color: "var(--color-text-tertiary)", animation: "spin 1s linear infinite" } }),
                            /*#__PURE__*/ React.createElement("div", { className: "info-panel-empty-title" }, "计算中..."),
                            /*#__PURE__*/ React.createElement("div", { className: "info-panel-empty-desc" }, "正在计算当前字段的结果"),
                          )
                        : /*#__PURE__*/ React.createElement(
                            React.Fragment,
                            null,
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
                                    previewResult.data &&
                                      previewResult.data[0] &&
                                      previewResult.data[0]._format &&
                                      previewResult.data[0]._format !== "none" &&
                                      typeof previewResult.data[0]._raw === "number" &&
                                      /*#__PURE__*/ React.createElement(
                                        "div",
                                        {
                                          className: "debug-final-meta",
                                          style: { marginTop: 4, color: "var(--color-text-tertiary)" },
                                        },
                                        "\u539F\u59CB\u503C\uFF1A",
                                        previewResult.data[0]._raw.toLocaleString("zh-CN", {
                                          maximumFractionDigits: 4,
                                        }),
                                        " \u00B7 \u8F93\u51FA\u683C\u5F0F\uFF1A",
                                        previewResult.data[0]._format,
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
                                ),
                          ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "button",
              { className: "info-panel-expand", onClick: () => setInfoPanelOpen(true) },
              /*#__PURE__*/ React.createElement(Icons.Eye, { size: 16 }),
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
    showPreviewModal && (() => {
      const step = currentRule?.steps?.find((s) => s.id === previewStepId);
      const stepIdx = currentRule?.steps?.findIndex((s) => s.id === previewStepId);
      if (!step) return null;
      const engineResult = currentRule?.steps?.length > 0 ? (() => {
        try {
          return CalcEngine.exec(currentRule, platform?.tables || [], {
            fieldSemanticType: activeField?.semanticType,
            shopName: platform?.name,
          });
        } catch (e) { return null; }
      })() : null;
      const stepResult = engineResult?.stepResults?.[stepIdx];
      const stats = stepResult?.stats;
      return /*#__PURE__*/ React.createElement(
        DraggableModal,
        {
          title: `${getStepTypeInfo(step.type).icon} ${getStepTypeInfo(step.type).name} - 第${stepIdx + 1}步预览`,
          onClose: () => { setShowPreviewModal(false); setPreviewStepId(null); },
          width: 900,
          height: 600,
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { padding: "16px" } },
          stats && /*#__PURE__*/ React.createElement(
            "div",
            { style: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" } },
            /*#__PURE__*/ React.createElement("div", { style: { flex: "1 1 120px", padding: "10px 14px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" } },
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#0369a1", marginBottom: "2px" } }, "输入行数"),
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "20px", fontWeight: 700, color: "#0c4a6e" } }, (stats.inputRows || 0).toLocaleString()),
            ),
            /*#__PURE__*/ React.createElement("div", { style: { flex: "1 1 120px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" } },
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#15803d", marginBottom: "2px" } }, "输出行数"),
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "20px", fontWeight: 700, color: "#14532d" } }, (stats.outputRows || 0).toLocaleString()),
            ),
            /*#__PURE__*/ React.createElement("div", {
              style: {
                flex: "1 1 120px", padding: "10px 14px",
                background: stats.change > 0 ? "#fef2f2" : stats.change < 0 ? "#fefce8" : "#f8fafc",
                borderRadius: "8px",
                border: stats.change > 0 ? "1px solid #fecaca" : stats.change < 0 ? "1px solid #fef08a" : "1px solid #e2e8f0",
              },
            },
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#64748b", marginBottom: "2px" } }, "行数变化"),
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "20px", fontWeight: 700, color: stats.change > 0 ? "#991b1b" : stats.change < 0 ? "#854d0e" : "#334155" } },
                stats.change > 0 ? `+${stats.change}` : stats.change < 0 ? `${stats.change}` : "0",
              ),
            ),
            stepResult?.columns && stepResult.columns.length > 0 && /*#__PURE__*/ React.createElement("div",
              { style: { flex: "1 1 180px", padding: "10px 14px", background: "#faf5ff", borderRadius: "8px", border: "1px solid #e9d5ff" } },
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#7e22ce", marginBottom: "2px" } }, "输出列"),
              /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", fontWeight: 600, color: "#581c87", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                stepResult.columns.join(", "),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { style: { fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" } },
            /*#__PURE__*/ React.createElement(Icons.Database, { size: 12 }),
            "数据预览",
          ),
          renderStepDebug(step, stepIdx),
        ),
      );
    })(),
    showAddStepModal &&
      /*#__PURE__*/ React.createElement(
        Modal,
        {
          title: "\u6DFB\u52A0\u8BA1\u7B97\u6B65\u9AA4",
          width: "900px",
          onClose: () => { setShowAddStepModal(false); setHoveredStepType(null); },
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
          (() => {
            // 智能推荐步骤 - 基于已有步骤和数据列特征
            const steps = currentRule?.steps || [];
            const hasSource = steps.some((s) => s.type === "source");
            const hasFilter = steps.some((s) => s.type === "filter");
            const hasVirtual = steps.some((s) => s.type === "virtual");
            const hasJoin = steps.some((s) => s.type === "join");
            const hasFormula = steps.some((s) => s.type === "formula");
            const hasAggregate = steps.some((s) => s.type === "aggregate");
            const hasSort = steps.some((s) => s.type === "sort");
            const hasLimit = steps.some((s) => s.type === "limit");
            // 收集所有可用列名（样本表 + 已选源表 + 虚拟字段生成列）
            const samples = state.samples[currentPlatform] || [];
            const sampleHeaders = new Set();
            samples.forEach((s) => {
              const sheet = s.sheets[Object.keys(s.sheets)[0]];
              (sheet?.headers || []).forEach((h) => sampleHeaders.add(h));
            });
            const sourceStep = steps.find((s) => s.type === "source");
            const sourceTableIds = sourceStep?.config?.tables || [];
            const sourceHeaders = new Set(sampleHeaders);
            if (sourceTableIds.length > 0) {
              sourceTableIds.forEach((tid) => {
                const t = samples.find((s) => s.id === tid);
                const sheet = t?.sheets[Object.keys(t?.sheets || {})[0]];
                (sheet?.headers || []).forEach((h) => sourceHeaders.add(h));
              });
            }
            // 加入虚拟字段生成的列
            steps.filter((s) => s.type === "virtual").forEach((s) => {
              (s.config.target || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => sourceHeaders.add(t));
            });
            const headers = Array.from(sourceHeaders).map((h) => h.toLowerCase());
            const hasCol = (keys) => headers.some((h) => keys.some((k) => h.includes(k)));
            const externals = state.externals || [];
            const hasCostTable = externals.length > 0;
            const recommendations = [];
            const addRec = (type, reason, priority = 0) => {
              if (!recommendations.some((r) => r.type === type)) {
                recommendations.push({ type, reason, priority });
              }
            };
            // 根据字段语义判断是否需要数据源
            const semanticType = activeField?.semanticType || "";
            const isFillField = ["shop", "year", "month", "day", "date", "text"].includes(semanticType);
            const isValueField = semanticType === "value";
            // 判断当前规则是否依赖外部数据（公式/常量/文本等纯计算不依赖）
            const dataDependentTypes = ["source", "filter", "aggregate", "join", "group", "union", "limit", "sort", "crossMatch", "keepDuplicate", "keepUnique", "intersect", "lookup", "runningTotal", "percentOfTotal", "movingAverage", "binning", "conditionalTag", "stringExtract", "fillNA", "normalize", "valueNormalize"];
            const needsDataSource = steps.some((s) => dataDependentTypes.includes(s.type));
            const hasPureCompute = steps.some((s) => ["formula", "constant", "text", "math", "ratio", "diff", "round", "concat", "substring", "date", "condition", "rank"].includes(s.type));
            if (isFillField) {
              // 填充类型字段优先推荐填充步骤，不提示选择数据源
              const hasFill = steps.some((s) => s.type === "fill");
              if (!hasFill) {
                addRec("fill", `该字段为${semanticType === "shop" ? "店铺名" : semanticType.includes("date") || semanticType === "year" || semanticType === "month" || semanticType === "day" ? "日期" : "文本"}占位符，建议添加填充步骤`, 100);
              }
            } else if (!needsDataSource && !hasPureCompute) {
              // 数值字段且尚未配置任何计算步骤时，才提示选择数据源
              addRec("source", "首先需要选择数据源", 100);
            }
            // 数据列特征识别（仅对需要数据操作的字段推荐）
            if ((hasSource || needsDataSource) && !isFillField) {
              // 合并已选源表和外部表的列，提升识别准确性
              const sourceStep = steps.find((s) => s.type === "source");
              const sourceTableIds = sourceStep?.config?.tables || [];
              sourceTableIds.forEach((tid) => {
                const t = samples.find((s) => s.id === tid);
                const sheet = t?.sheets[Object.keys(t?.sheets || {})[0]];
                (sheet?.headers || []).forEach((h) => sourceHeaders.add(h));
              });
              (state.externals || []).forEach((e) => {
                (e.headers || []).forEach((h) => sourceHeaders.add(h));
              });
              const headers = Array.from(sourceHeaders).map((h) => h.toLowerCase());
              const hasCol = (keys) => headers.some((h) => keys.some((k) => h.includes(k)));
              const hasSpec = hasCol(["规格", "型号", "商品规格", "款式"]);
              const hasSku = hasCol(["款号", "sku", "商品编码", "货号"]);
              const hasSize = hasCol(["尺码", "size", "码数"]);
              const hasPieces = hasCol(["条数", "件数", "数量", "购买数量"]);
              const hasCost = hasCol(["成本", "cost", "单价", "价格"]);
              const hasAmount = hasCol(["金额", "销售额", "实付", "总价", "收入"]);
              const hasShop = hasCol(["店铺", "来源", "渠道", "门店"]);
              const hasDate = hasCol(["日期", "时间", "下单", "创建"]);
              const hasRefund = hasCol(["退款", "退货", "售后"]);
              // 虚拟字段：有规格列且未提取条数/尺码
              if (hasSpec && !hasVirtual) {
                addRec("virtual", "检测到规格列，建议提取条数和尺码", 90);
              } else if (!hasSize && hasSpec && hasVirtual) {
                addRec("virtual", "建议添加尺码识别虚拟字段", 85);
              } else if (!hasPieces && hasSpec && hasVirtual) {
                addRec("virtual", "建议添加条数识别虚拟字段", 85);
              }
              // 跨表关联：有款号+尺码/规格+全局成本表
              if (hasSku && (hasSize || hasSpec) && hasCostTable && !hasJoin) {
                addRec("join", "检测到款号与全局成本表，建议关联匹配单件成本", 80);
              }
              // 公式计算：有条数和成本，且目标是数值字段
              if (isValueField && (hasPieces || hasVirtual) && (hasCost || hasJoin) && !hasFormula) {
                addRec("formula", "建议用公式计算金额（数量×单价）", 75);
              }
              // 聚合：数值字段且检测到金额/数量列，且前面没有公式
              if (isValueField && (hasAmount || hasCost || hasPieces) && !hasAggregate && !hasFormula) {
                addRec("aggregate", `检测到${hasAmount || hasCost ? "金额" : "数量"}列，建议聚合汇总数据`, 70);
              }
              // 筛选
              if (hasShop && !hasFilter) {
                addRec("filter", "检测到店铺/来源列，建议按店铺筛选数据", 60);
              } else if (hasRefund && !hasFilter) {
                addRec("filter", "检测到退款列，建议过滤退款订单", 60);
              } else if (!hasFilter && steps.length >= 2 && isValueField) {
                addRec("filter", "建议添加筛选条件过滤数据", 50);
              }
              // 排序
              if (hasDate && !hasSort) {
                addRec("sort", "检测到日期列，建议按时间排序", 45);
              }
              // 限制
              if (!hasLimit && steps.length >= 3) {
                addRec("limit", "步骤较多，建议限制输出条数便于预览", 30);
              }
            }
            if (recommendations.length === 0) return null;
            recommendations.sort((a, b) => b.priority - a.priority);
            return /*#__PURE__*/ React.createElement(
              "div",
              { style: { marginBottom: "16px", padding: "12px 16px", background: "var(--color-primary-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-primary-100)" } },
              /*#__PURE__*/ React.createElement(
                "div",
                { style: { fontSize: "13px", fontWeight: 700, color: "var(--color-primary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" } },
                /*#__PURE__*/ React.createElement(Icons.Lightbulb, { size: 16 }),
                "智能推荐",
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
                recommendations.slice(0, 3).map((rec) => {
                  const info = getStepTypeInfo(rec.type);
                  return /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      key: rec.type,
                      className: "quick-tag",
                      style: { cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", flexShrink: 0 },
                      onClick: () => { addStep(rec.type); setShowAddStepModal(false); setHoveredStepType(null); },
                    },
                    /*#__PURE__*/ React.createElement("span", { style: { fontSize: "14px", display: "inline-flex", flexShrink: 0 } }, info.icon),
                    /*#__PURE__*/ React.createElement("span", { style: { whiteSpace: "nowrap" } }, info.name),
                    /*#__PURE__*/ React.createElement("span", { style: { fontSize: "11px", color: "var(--color-text-tertiary)", marginLeft: "4px", whiteSpace: "nowrap" } }, rec.reason),
                  );
                }),
              ),
            );
          })(),
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
                      className: `step-type-card ${hoveredStepType === type ? "previewing" : ""}`,
                      onClick: () => { addStep(type); setHoveredStepType(null); },
                      onMouseEnter: () => setHoveredStepType(type),
                      onMouseLeave: () => setHoveredStepType((cur) => (cur === type ? null : cur)),
                      onFocus: () => setHoveredStepType(type),
                      onBlur: () => setHoveredStepType((cur) => (cur === type ? null : cur)),
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
              hoveredStepType && (() => {
                const pInfo = getStepTypeInfo(hoveredStepType);
                const pPrev = getStepTypePreview(hoveredStepType);
                return /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-preview-panel" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-preview-header" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-type-preview-icon", style: { color: pInfo.color, background: pInfo.bg } },
                      pInfo.icon,
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "step-type-preview-titles" },
                      /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-name" }, pInfo.name),
                      /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-desc" }, pInfo.desc),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-preview-section" },
                    /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-label" }, "💡 适用场景"),
                    /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-value" }, pPrev.scenario),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-preview-section" },
                    /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-label" }, "📌 典型示例"),
                    /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-example" }, pPrev.example),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-preview-section" },
                    /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-label" }, "⚙️ 配置要点"),
                    /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-value" }, pPrev.config),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "step-type-preview-footer" },
                    "点击卡片即可添加此步骤",
                  ),
                );
              })(),
            );
          }),
        ),
      );
}; // ========== External Data Page ==========
