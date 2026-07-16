window.RulesPage = function({ state, currentPlatform, onNavigate }) {
  const { addToast } = useToast();
  const SearchableSelect = window.SearchableSelect;

  const getSemanticIcon = (semantic, type) => {
    const t = (semantic || type || "").toLowerCase();
    if (t.includes("money") || t.includes("price") || t.includes("amount") || t.includes("金额") || t.includes("价格") || t.includes("收入") || t.includes("成本") || t.includes("费用") || t.includes("利润")) return "\u00A5";
    if (t.includes("rate") || t.includes("percent") || t.includes("ratio") || t.includes("率") || t.includes("占比")) return "%";
    if (t.includes("count") || t.includes("qty") || t.includes("数量") || t.includes("件数") || t.includes("订单")) return "#";
    if (t.includes("date") || t.includes("time") || t.includes("日期") || t.includes("时间") || t.includes("年") || t.includes("月") || t.includes("日")) return "\u{1F4C5}";
    if (t.includes("text") || t.includes("name") || t.includes("名称") || t.includes("标题") || t.includes("备注")) return "Aa";
    return "\u00B7";
  };

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
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [fieldCategoryFilter, setFieldCategoryFilter] = useState("all");

  useEffect(() => {
    if (leftPanelCollapsed) {
      try {
        localStorage.setItem(`rules_page_left_collapsed_${currentPlatform}`, "true");
      } catch (e) {}
    }
  }, [leftPanelCollapsed, currentPlatform]);

  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const template = state.templates[currentPlatform];
  const savedRules = state.rules[currentPlatform] || {};
  const fields = template?.parseResult?.fields || [];
  const currentRule = activeField ? savedRules[activeField.id] : null;

  const { validateRule, categorizeField, getFieldCategoryInfo, inferFieldLevel } = window.RulesUtils;
  const { getStepTypeInfo, getStepTypePreview, getCategorySteps, getStepCategories } = window.StepTypes;
  const { createRenderStepConfig } = window.StepEditor;
  const { getPreviewData, renderDataTable, renderStepDebug } = window.DebugPreview;

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(fieldSearch.toLowerCase()) || (f.cell || "").toLowerCase().includes(fieldSearch.toLowerCase());
      if (!matchSearch) return false;
      const steps = savedRules[f.id]?.steps || [];
      const hasConfig = steps.length > 0;
      const validation = validateRule(savedRules[f.id], f);
      switch (fieldFilter) {
        case "done": return hasConfig && validation.valid;
        case "pending": return !hasConfig;
        case "warning": return hasConfig && !validation.valid;
        default: return true;
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
    return fields.filter((f) => (savedRules[f.id]?.steps || []).length > 0).length;
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

  useEffect(() => {
    if (debugMode && activeField && currentRule && currentRule.steps.length > 0) {
      try {
        const result = getPreviewData(null, 0, currentRule, activeField, state, currentPlatform);
        setPreviewResult(result);
      } catch (e) {
        setPreviewResult({ error: e.message });
      }
    } else {
      setPreviewResult(null);
    }
  }, [debugMode, activeField, currentRule, state.rules]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      const currentIdx = filteredFields.findIndex((f) => f.id === activeField?.id);
      if (e.key === "ArrowUp" && currentIdx > 0) {
        e.preventDefault();
        setActiveField(filteredFields[currentIdx - 1]);
      } else if (e.key === "ArrowDown" && currentIdx < filteredFields.length - 1) {
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

  const recommendPreset = (field) => {
    if (!field) return null;
    const fieldName = typeof field === "string" ? field : field.name;
    if (!fieldName) return null;
    const n = fieldName.toLowerCase();
    const semanticType = (typeof field === "object" && field.semanticType) || "";
    const allPresets = CalcEngine.getPresetTemplates();
    const list = [...(allPresets[currentPlatform] || []), ...(allPresets.all || [])];
    const score = list.map((p) => {
      let s = 0;
      const pn = p.name.toLowerCase();
      const pd = (p.desc || "").toLowerCase();
      if (n.includes("销售") || n.includes("收入") || n.includes("实收") || n.includes("gmv") || n.includes("营业额")) {
        if (p.category === "sales") s += 12;
        if (pd.includes("销售") || pd.includes("收入")) s += 4;
      }
      if (n.includes("成本") || n.includes("扣点") || n.includes("费用") || n.includes("退款") || n.includes("推广") || n.includes("佣金")) {
        if (p.category === "cost") s += 12;
        if (pd.includes("成本") || pd.includes("费用")) s += 4;
      }
      if (n.includes("利润") || n.includes("净利") || n.includes("roi") || n.includes("毛利")) {
        if (p.category === "profit") s += 12;
        if (pd.includes("利润")) s += 4;
      }
      if (["shop", "year", "month", "day", "date", "text"].includes(semanticType)) {
        s -= 20;
      }
      const pnTail = pn.split("·").pop().toLowerCase();
      if (pn.includes(n) || n.includes(pnTail) || pnTail.includes(n)) s += 8;
      const pKeywords = [p.category, p.name, p.desc].filter(Boolean).join(" ");
      const fieldKeywords = n.split(/[^\u4e00-\u9fa5a-z0-9]+/);
      fieldKeywords.forEach((kw) => {
        if (kw.length >= 2 && pKeywords.toLowerCase().includes(kw)) s += 2;
      });
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
    const validation = validateRule(rule, fields.find((f) => f.id === fieldId));
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
        if (hasSource) return { ok: false, msg: "每个规则只能有一个「数据源」步骤" };
        if (currentSteps.length > 0) return { ok: false, msg: "「数据源」必须是第一个步骤" };
        return { ok: true };
      },
      fill: () => ({ ok: true }),
      filter: () => {
        const lastAggIdx = currentSteps.map((s, i) => (s.type === "aggregate" ? i : -1)).filter((i) => i >= 0).pop();
        if (lastAggIdx !== undefined && lastAggIdx >= 0 && lastAggIdx < currentSteps.length - 1) {
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
    const check = stepLogicChecks[type] ? stepLogicChecks[type]() : { ok: true };
    if (!check.ok) {
      addToast("warning", "步骤顺序不符合逻辑", check.msg);
      return;
    }
    const defaultConfigs = {
      source: { tables: [], table: "", column: "" },
      fill: { fillType: "auto", value: "", dateFormat: "yyyy-mm", sourceField: "", groupIndex: 0 },
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
      condition: { column: "", op: "==", value: "", trueValue: 1, falseValue: 0, resultCol: "condition_result" },
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
    addToast("success", "添加步骤", `已添加 ${getStepTypeInfo(type).name} 步骤`);
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

  const applyPreset = (preset) => {
    if (!activeField) return;
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      const fieldRule = platformRules[activeField.id] || {};
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [activeField.id]: {
              ...fieldRule,
              steps: preset.steps.map((st, i) => ({
                ...st,
                id: `step_${Date.now()}_${i}`,
              })),
            },
          },
        },
      };
    });
    addToast("success", "套用模板", `已应用「${preset.name}」模板`);
  };

  const renderStepConfig = createRenderStepConfig({
    state,
    currentPlatform,
    currentRule,
    activeField,
    updateStepConfig,
    formulaFieldSearch,
    setFormulaFieldSearch,
    getStepTypeInfo,
  });

  const summarizeStep = (step) => {
    const type = step.type;
    const cfg = step.config || {};
    switch (type) {
      case "source": return cfg.table || cfg.tables?.length ? `表: ${cfg.table || cfg.tables.join(',')}` : "未选表";
      case "fill": return cfg.fillType === "shop" ? "店铺名" : cfg.fillType === "date" ? `日期(${cfg.dateFormat})` : cfg.fillType === "dateNow" ? `当前日期(${cfg.dateFormat})` : cfg.fillType === "field" ? `${cfg.sourceField}` : "自动";
      case "filter": return `${cfg.column} ${cfg.op} ${cfg.value}`;
      case "aggregate": return `${cfg.func}(${cfg.column})`;
      case "formula": return cfg.expr || "未设置公式";
      case "constant": return `=${cfg.value}`;
      case "text": return `"${cfg.value}"`;
      case "virtual": return `${cfg.source} → ${cfg.target}`;
      case "join": return `${cfg.table} ON ${cfg.key}=${cfg.fk}`;
      case "group": return `按${cfg.column} ${cfg.func}`;
      case "sort": return `${cfg.column} ${cfg.direction}`;
      case "limit": return `取前${cfg.count}条`;
      case "lookup": return `${cfg.column}: ${cfg.pairs?.length || 0}组映射`;
      case "condition": return `${cfg.column} ${cfg.op} ${cfg.value}`;
      case "round": return `保留${cfg.decimals}位小数`;
      case "concat": return `${cfg.columns?.join(cfg.separator || '')}`;
      case "substring": return `${cfg.start},${cfg.length}`;
      case "date": return `${cfg.column} ${cfg.format}`;
      case "math": return `${cfg.column} ${cfg.operation} ${cfg.value}`;
      case "rank": return `${cfg.column} ${cfg.direction}`;
      case "diff": return `${cfg.column} - ${cfg.baseColumn}`;
      case "ratio": return `${cfg.numerator}/${cfg.denominator}`;
      case "union": return `${cfg.tables?.length}表合并`;
      case "crossMatch": return `${cfg.columns?.join(',')}匹配`;
      case "runningTotal": return `${cfg.column}累计`;
      case "percentOfTotal": return `${cfg.column}占比`;
      case "movingAverage": return `${cfg.column}(${cfg.windowSize}期)`;
      case "binning": return `${cfg.column}分${cfg.binCount}箱`;
      case "conditionalTag": return `${cfg.conditions?.length}个条件`;
      case "stringExtract": return `${cfg.extractType}: ${cfg.pattern}`;
      case "fillNA": return `${cfg.column}填${cfg.fillValue}`;
      case "normalize": return `${cfg.column}${cfg.normType}`;
      default: return "";
    }
  };

  const FieldList = window.FieldList;

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "rules-page" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "rules-header" },
      /*#__PURE__*/ React.createElement("div", { className: "rules-header-left" },
        /*#__PURE__*/ React.createElement("button", {
          className: "left-panel-toggle",
          onClick: () => setLeftPanelCollapsed(!leftPanelCollapsed),
        },
          /*#__PURE__*/ React.createElement(Icons.ChevronLeft, { size: 18 }),
        ),
        /*#__PURE__*/ React.createElement("h1", { className: "rules-title" },
          /*#__PURE__*/ React.createElement(Icons.FileRule, { size: 20 }),
          " 计算规则",
        ),
      ),
      /*#__PURE__*/ React.createElement("div", { className: "rules-header-center" },
        /*#__PURE__*/ React.createElement("div", { className: "progress-bar" },
          /*#__PURE__*/ React.createElement("div", { className: "progress-bar-fill", style: { width: `${completionRate}%` } }),
          /*#__PURE__*/ React.createElement("span", { className: "progress-bar-text" }, `${completedCount}/${fields.length}`),
        ),
      ),
      /*#__PURE__*/ React.createElement("div", { className: "rules-header-right" },
        /*#__PURE__*/ React.createElement("button", {
          className: "btn btn-secondary",
          onClick: () => setShowShortcuts(!showShortcuts),
        },
          /*#__PURE__*/ React.createElement(Icons.Keyboard, { size: 14 }),
          " 快捷键",
        ),
        /*#__PURE__*/ React.createElement("button", {
          className: "btn btn-secondary",
          onClick: () => setShowPresets(!showPresets),
        },
          /*#__PURE__*/ React.createElement(Icons.Library, { size: 14 }),
          " 预设模板",
        ),
        activeField && /*#__PURE__*/ React.createElement("button", {
          className: "btn btn-danger",
          onClick: () => clearFieldRule(activeField.id),
        },
          /*#__PURE__*/ React.createElement(Icons.Trash2, { size: 14 }),
          " 清空规则",
        ),
        activeField && /*#__PURE__*/ React.createElement("button", {
          className: "btn btn-secondary",
          onClick: () => setShowCopyModal(true),
        },
          /*#__PURE__*/ React.createElement(Icons.Copy, { size: 14 }),
          " 复制规则",
        ),
        activeField && /*#__PURE__*/ React.createElement("button", {
          className: "btn btn-primary",
          onClick: () => saveFieldRule(activeField.id),
        },
          /*#__PURE__*/ React.createElement(Icons.Save, { size: 14 }),
          " 保存规则",
        ),
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "rules-body" },
      /*#__PURE__*/ React.createElement("div", { className: `rules-left-panel ${leftPanelCollapsed ? 'collapsed' : ''}` },
        /*#__PURE__*/ React.createElement(FieldList, {
          fields: fields,
          activeField: activeField,
          setActiveField: setActiveField,
          savedRules: savedRules,
          fieldSearch: fieldSearch,
          setFieldSearch: setFieldSearch,
          fieldFilter: fieldFilter,
          setFieldFilter: setFieldFilter,
          leftCollapsed: leftPanelCollapsed,
          setLeftCollapsed: setLeftPanelCollapsed,
          validateRule: validateRule,
          categorizeField: categorizeField,
          getFieldCategoryInfo: getFieldCategoryInfo,
          inferFieldLevel: inferFieldLevel,
          getSemanticIcon: getSemanticIcon,
        }),
      ),
      /*#__PURE__*/ React.createElement("div", { className: "rules-main-panel" },
        activeField ? /*#__PURE__*/ React.createElement(React.Fragment, null,
          /*#__PURE__*/ React.createElement("div", { className: "field-header" },
            /*#__PURE__*/ React.createElement("div", { className: "field-header-left" },
              /*#__PURE__*/ React.createElement("span", { className: "field-icon" }, getSemanticIcon(activeField.semanticType, activeField.type)),
              /*#__PURE__*/ React.createElement("span", { className: "field-name" }, activeField.name),
              /*#__PURE__*/ React.createElement("span", { className: "field-type" }, activeField.semanticType || activeField.type),
            ),
            /*#__PURE__*/ React.createElement("div", { className: "field-header-right" },
              /*#__PURE__*/ React.createElement("button", {
                className: "btn btn-sm btn-primary",
                onClick: () => setShowAddStepModal(true),
              },
                /*#__PURE__*/ React.createElement(Icons.Plus, { size: 14 }),
                " 添加步骤",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement("div", { className: "steps-container" },
            currentRule?.steps?.length > 0 ? currentRule.steps.map((step, idx) => {
              const typeInfo = getStepTypeInfo(step.type);
              const isExpanded = expandedStep === step.id;
              return /*#__PURE__*/ React.createElement(
                "div",
                { key: step.id, className: "step-card" },
                /*#__PURE__*/ React.createElement("div", {
                  className: "step-header",
                  onClick: () => setExpandedStep(isExpanded ? null : step.id),
                },
                  /*#__PURE__*/ React.createElement("span", { className: "step-number" }, idx + 1),
                  /*#__PURE__*/ React.createElement("span", { className: "step-icon", style: { color: typeInfo.color } }, typeInfo.icon),
                  /*#__PURE__*/ React.createElement("span", { className: "step-name" }, typeInfo.name),
                  /*#__PURE__*/ React.createElement("span", { className: "step-summary" }, summarizeStep(step)),
                  /*#__PURE__*/ React.createElement("div", { className: "step-actions" },
                    idx > 0 && /*#__PURE__*/ React.createElement("button", {
                      className: "step-action-btn",
                      onClick: (e) => { e.stopPropagation(); moveStep(step.id, "up"); },
                    },
                      /*#__PURE__*/ React.createElement(Icons.ChevronUp, { size: 14 }),
                    ),
                    idx < currentRule.steps.length - 1 && /*#__PURE__*/ React.createElement("button", {
                      className: "step-action-btn",
                      onClick: (e) => { e.stopPropagation(); moveStep(step.id, "down"); },
                    },
                      /*#__PURE__*/ React.createElement(Icons.ChevronDown, { size: 14 }),
                    ),
                    /*#__PURE__*/ React.createElement("button", {
                      className: "step-action-btn",
                      onClick: (e) => { e.stopPropagation(); duplicateStep(step.id); },
                    },
                      /*#__PURE__*/ React.createElement(Icons.Copy, { size: 14 }),
                    ),
                    /*#__PURE__*/ React.createElement("button", {
                      className: "step-action-btn",
                      onClick: (e) => { e.stopPropagation(); deleteStep(step.id); },
                    },
                      /*#__PURE__*/ React.createElement(Icons.Trash2, { size: 14 }),
                    ),
                  ),
                  /*#__PURE__*/ React.createElement("span", { className: "step-expand-icon" },
                    /*#__PURE__*/ React.createElement(Icons.ChevronDown, { size: 16, className: isExpanded ? 'rotated' : '' }),
                  ),
                ),
                isExpanded && /*#__PURE__*/ React.createElement("div", { className: "step-config-panel" },
                  renderStepConfig(step, activeField),
                ),
              );
            }) : /*#__PURE__*/ React.createElement("div", { className: "empty-steps" },
              /*#__PURE__*/ React.createElement(Icons.PlusCircle, { size: 48 }),
              /*#__PURE__*/ React.createElement("p", null, "暂无计算步骤"),
              /*#__PURE__*/ React.createElement("button", {
                className: "btn btn-primary",
                onClick: () => setShowAddStepModal(true),
              },
                "添加步骤",
              ),
            ),
          ),
        ) : /*#__PURE__*/ React.createElement("div", { className: "empty-field" },
          /*#__PURE__*/ React.createElement(Icons.FileText, { size: 48 }),
          /*#__PURE__*/ React.createElement("p", null, "请选择左侧字段开始配置"),
        ),
      ),
      /*#__PURE__*/ React.createElement("div", { className: "rules-right-panel" },
        /*#__PURE__*/ React.createElement("div", { className: "right-panel-header" },
          /*#__PURE__*/ React.createElement("span", { className: "right-panel-title" },
            /*#__PURE__*/ React.createElement(Icons.Eye, { size: 16 }),
            " 实时预览",
          ),
          /*#__PURE__*/ React.createElement("label", { className: "toggle-switch" },
            /*#__PURE__*/ React.createElement("input", {
              type: "checkbox",
              checked: debugMode,
              onChange: (e) => setDebugMode(e.target.checked),
            }),
            /*#__PURE__*/ React.createElement("span", { className: "toggle-slider" }),
          ),
          /*#__PURE__*/ React.createElement("span", { className: "right-panel-hint" }, "调试模式"),
        ),
        debugMode && activeField && currentRule && currentRule.steps.length > 0 ? /*#__PURE__*/ React.createElement(React.Fragment, null,
          previewResult?.error ? /*#__PURE__*/ React.createElement("div", { className: "preview-error" },
            /*#__PURE__*/ React.createElement(Icons.AlertTriangle, { size: 24 }),
            /*#__PURE__*/ React.createElement("span", null, previewResult.error),
          ) : /*#__PURE__*/ React.createElement("div", { className: "preview-content" },
            /*#__PURE__*/ React.createElement("div", { className: "preview-result" },
              /*#__PURE__*/ React.createElement("span", { className: "preview-label" }, "计算结果"),
              /*#__PURE__*/ React.createElement("span", { className: "preview-value" },
                previewResult?.value !== undefined ? previewResult.value : "-",
              ),
            ),
            /*#__PURE__*/ React.createElement("div", { className: "preview-data" },
              /*#__PURE__*/ React.createElement("div", { className: "preview-data-header" },
                /*#__PURE__*/ React.createElement("span", null, "数据预览"),
                /*#__PURE__*/ React.createElement("button", {
                  className: "preview-expand-btn",
                  onClick: () => setDebugExpanded(!debugExpanded),
                },
                  debugExpanded ? "收起" : "展开",
                ),
              ),
              debugExpanded && previewResult?.data && /*#__PURE__*/ React.createElement("div", { className: "preview-table" },
                renderDataTable(previewResult.data, 10),
              ),
            ),
          ),
        ) : /*#__PURE__*/ React.createElement("div", { className: "preview-empty" },
          /*#__PURE__*/ React.createElement(Icons.Lightbulb, { size: 32 }),
          /*#__PURE__*/ React.createElement("p", null, debugMode ? "选择字段并添加步骤后自动预览" : "开启调试模式查看实时预览"),
        ),
      ),
    ),
    showCopyModal && /*#__PURE__*/ React.createElement(Modal, {
      title: "复制规则到其他字段",
      onClose: () => { setShowCopyModal(false); setCopySourceFieldId(""); },
      footer: /*#__PURE__*/ React.createElement(React.Fragment, null,
        /*#__PURE__*/ React.createElement(Button, { onClick: () => { setShowCopyModal(false); setCopySourceFieldId(""); } }, "取消"),
        /*#__PURE__*/ React.createElement(Button, {
          type: "primary",
          disabled: !copySourceFieldId,
          onClick: () => copyFieldRule(copySourceFieldId, activeField?.id),
        }, "确认复制"),
      ),
    },
      /*#__PURE__*/ React.createElement("div", { className: "copy-rule-form" },
        /*#__PURE__*/ React.createElement(Alert, { type: "info" },
          "将已配置字段的规则复制到当前字段「", activeField?.name, "」。源字段和目标字段不能相同。",
        ),
        /*#__PURE__*/ React.createElement("div", { className: "form-item", style: { marginTop: 12 } },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "选择源字段（要复制其规则的字段）"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: copySourceFieldId || "",
            onChange: (val) => setCopySourceFieldId(val),
            options: [
              { value: "", label: "请选择源字段" },
              ...fields.filter((f) => (savedRules[f.id]?.steps || []).length > 0 && f.id !== activeField?.id).map((f) => ({
                value: f.id,
                label: `${f.name} (${(savedRules[f.id]?.steps || []).length}个步骤)`,
              })),
            ],
            placeholder: "请选择源字段",
          }),
        ),
        copySourceFieldId && /*#__PURE__*/ React.createElement("div", { className: "copy-rule-preview" },
          /*#__PURE__*/ React.createElement("div", { className: "copy-rule-preview-title" }, "源规则预览："),
          (savedRules[copySourceFieldId]?.steps || []).map((s, i) => {
            const info = getStepTypeInfo(s.type);
            return /*#__PURE__*/ React.createElement("div", { key: s.id, className: "copy-rule-step" },
              /*#__PURE__*/ React.createElement("span", { style: { color: info.color } }, i + 1, ". ", info.name),
              /*#__PURE__*/ React.createElement("span", { className: "copy-rule-step-summary" }, summarizeStep(s)),
            );
          }),
        ),
      ),
    ),
    confirmDialog && /*#__PURE__*/ React.createElement(ConfirmModal, {
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
      return /*#__PURE__*/ React.createElement(DraggableModal, {
        title: `${getStepTypeInfo(step.type).icon} ${getStepTypeInfo(step.type).name} - 第${stepIdx + 1}步预览`,
        onClose: () => { setShowPreviewModal(false); setPreviewStepId(null); },
        width: 900,
        height: 600,
      },
        /*#__PURE__*/ React.createElement("div", { style: { padding: "16px" } },
          /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" } },
            /*#__PURE__*/ React.createElement(Icons.Database, { size: 12 }),
            "数据预览",
          ),
          renderStepDebug(step, stepIdx, currentRule, activeField, state, currentPlatform),
        ),
      );
    })(),
    window.AddStepModal && /*#__PURE__*/ React.createElement(window.AddStepModal, {
      showAddStepModal: showAddStepModal,
      setShowAddStepModal: setShowAddStepModal,
      stepSearchKeyword: stepSearchKeyword,
      setStepSearchKeyword: setStepSearchKeyword,
      stepCategory: stepCategory,
      setStepCategory: setStepCategory,
      hoveredStepType: hoveredStepType,
      setHoveredStepType: setHoveredStepType,
      addStep: addStep,
      getStepTypeInfo: getStepTypeInfo,
      getStepTypePreview: getStepTypePreview,
      currentRule: currentRule,
      state: state,
      activeField: activeField,
      currentPlatform: currentPlatform,
    }),
    showShortcuts && /*#__PURE__*/ React.createElement(Modal, {
      title: "快捷键",
      onClose: () => setShowShortcuts(false),
    },
      /*#__PURE__*/ React.createElement("div", { className: "shortcuts-list" },
        /*#__PURE__*/ React.createElement("div", { className: "shortcut-item" },
          /*#__PURE__*/ React.createElement("kbd", null, "Ctrl + S"),
          /*#__PURE__*/ React.createElement("span", null, "保存当前字段规则"),
        ),
        /*#__PURE__*/ React.createElement("div", { className: "shortcut-item" },
          /*#__PURE__*/ React.createElement("kbd", null, "↑"),
          /*#__PURE__*/ React.createElement("span", null, "上一个字段"),
        ),
        /*#__PURE__*/ React.createElement("div", { className: "shortcut-item" },
          /*#__PURE__*/ React.createElement("kbd", null, "↓"),
          /*#__PURE__*/ React.createElement("span", null, "下一个字段"),
        ),
      ),
    ),
    showPresets && window.Presets && window.Presets.PresetsComponent && /*#__PURE__*/ React.createElement(window.Presets.PresetsComponent, {
      show: showPresets,
      onClose: () => setShowPresets(false),
      onApply: applyPreset,
      recommendPreset: recommendPreset(activeField),
      activeField: activeField,
      presetCategory: presetCategory,
      setPresetCategory: setPresetCategory,
      currentPlatform: currentPlatform,
    }),
  );
};