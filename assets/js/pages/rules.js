// MapValueEditor - 映射值编辑器组件
const MapValueEditor = ({ step, updateStepConfig }) => {
  const pairs = step.config.pairs || [{ from: "", to: "" }];
  const updatePairs = (newPairs) => {
    updateStepConfig(step.id, "pairs", newPairs);
  };
  return React.createElement(
    "div",
    { className: "config-section", style: { marginTop: "12px" } },
    React.createElement(
      "div",
      { className: "config-section-header" },
      React.createElement(
        "span",
        { className: "config-section-title" },
        React.createElement(Icons.Edit3, null),
        " 映射值配置"
      )
    ),
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "8px" } },
      pairs.map((pair, idx) =>
        React.createElement(
          "div",
          { key: idx, style: { display: "flex", gap: "8px", alignItems: "center" } },
          React.createElement("input", {
            type: "text",
            className: "input",
            style: { flex: 1 },
            placeholder: "原始值",
            value: pair.from,
            onChange: (e) => {
              const newPairs = [...pairs];
              newPairs[idx] = { ...pair, from: e.target.value };
              updatePairs(newPairs);
            },
          }),
          React.createElement("span", { style: { color: "var(--color-text-tertiary)", fontSize: 12 } }, "→"),
          React.createElement("input", {
            type: "text",
            className: "input",
            style: { flex: 1 },
            placeholder: "替换为",
            value: pair.to,
            onChange: (e) => {
              const newPairs = [...pairs];
              newPairs[idx] = { ...pair, to: e.target.value };
              updatePairs(newPairs);
            },
          }),
          React.createElement(
            "button",
            {
              className: "action-btn action-delete icon-only",
              onClick: () => {
                if (pairs.length <= 1) return;
                const newPairs = pairs.filter((_, i) => i !== idx);
                updatePairs(newPairs);
              },
              title: "删除",
            },
            React.createElement(Icons.Trash, { size: 14 })
          ),
        )
      ),
      React.createElement(
        Button,
        {
          size: "sm",
          onClick: () => updatePairs([...pairs, { from: "", to: "" }]),
        },
        React.createElement(Icons.Plus, { size: 14 }),
        " 添加映射"
      )
    )
  );
};

// AdvancedRuleConfig - 高级规则配置组件
const AdvancedRuleConfig = ({ step, updateStepConfig }) => {
  const rule = step.config.rule;
  const cfg = step.config || {};

  const renderField = (label, hint, inputEl) =>
    React.createElement(
      "div",
      { className: "form-item", style: { marginTop: "12px" } },
      React.createElement(
        "label",
        { className: "form-label" },
        label,
        hint && React.createElement("span", { className: "form-label-hint" }, hint)
      ),
      inputEl
    );

  const renderInput = (key, placeholder, type = "text") =>
    React.createElement("input", {
      type: type,
      className: "input",
      placeholder: placeholder,
      value: cfg[key] || "",
      onChange: (e) => updateStepConfig(step.id, key, e.target.value),
    });

  switch (rule) {
    case "substring":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.FileText, null),
            " 截取子串配置"
          )
        ),
        React.createElement(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" } },
          renderField("起始位置", "从0开始", renderInput("start", "起始位置", "number")),
          renderField("截取长度", "要截取的字符数", renderInput("length", "长度", "number"))
        )
      );
    case "replace":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Edit3, null),
            " 替换配置"
          )
        ),
        React.createElement(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" } },
          renderField("查找内容", "要替换的文本", renderInput("from", "查找内容")),
          renderField("替换为", "替换后的文本", renderInput("to", "替换为"))
        )
      );
    case "concat":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Link, null),
            " 拼接配置"
          )
        ),
        React.createElement(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" } },
          renderField("连接符", "如 - 或 /", renderInput("separator", "连接符")),
          renderField("要拼接的字段", "逗号分隔的字段名", renderInput("columns", "字段1,字段2"))
        )
      );
    case "ifEmpty":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.HelpCircle, null),
            " 空值处理配置"
          )
        ),
        renderField("默认值", "当值为空时使用的默认值", renderInput("defaultValue", "默认值"))
      );
    case "multiply":
    case "divide":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Calculator, null),
            " ",
            rule === "multiply" ? "乘数配置" : "除数配置"
          )
        ),
        renderField(rule === "multiply" ? "乘数" : "除数", "数值", renderInput("value", "数值", "number"))
      );
    case "sumFields":
    case "diffFields":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Calculator, null),
            " ",
            rule === "sumFields" ? "求和字段配置" : "差值字段配置"
          )
        ),
        renderField("字段列表", "逗号分隔的字段名", renderInput("fields", "字段1,字段2,字段3"))
      );
    case "split":
    case "join":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.FileText, null),
            " ",
            rule === "split" ? "拆分分隔符" : "连接符"
          )
        ),
        renderField("分隔符", "如逗号、空格等", renderInput("separator", "分隔符"))
      );
    case "trim":
    case "upperCase":
    case "lowerCase":
    case "toFixed2":
      return React.createElement(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        React.createElement(
          "div",
          { className: "step-info-box" },
          React.createElement(
            "div",
            { className: "step-info-title" },
            React.createElement(Icons.Info, null),
            " 无需额外配置"
          ),
          React.createElement(
            "div",
            { className: "step-info-content" },
            rule === "trim" && "自动去除字符串首尾空格",
            rule === "upperCase" && "自动将文本转为大写",
            rule === "lowerCase" && "自动将文本转为小写",
            rule === "toFixed2" && "自动保留2位小数"
          )
        )
      );
    default:
      return null;
  }
};

// RulesPage - 计算规则页面组件
const RulesPage = ({ state, currentPlatform, onNavigate }) => {
  const { addToast } = useToast();
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
    // 填充类型字段的验证
    if (
      ["shop", "year", "month", "day", "date", "text"].includes(semanticType) &&
      firstStep.type === "fill"
    ) {
      const cfg = firstStep.config || {};
      if (cfg.fillType === "shop") {
        return { valid: true, msg: "配置完整（店铺名自动填充）" };
      }
      if (cfg.fillType === "date" || cfg.fillType === "dateNow") {
        if (!cfg.dateFormat) return { valid: false, msg: "请选择日期格式" };
        return { valid: true, msg: "配置完整（日期自动填充）" };
      }
      if (cfg.fillType === "auto") {
        if (!semanticType) {
          return { valid: false, msg: "无法识别字段类型，请手动选择填充方式" };
        }
        return { valid: true, msg: "配置完整（自动填充）" };
      }
      if (cfg.fillType === "field") {
        if (!cfg.sourceTable) return { valid: false, msg: "请选择数据源表" };
        if (!cfg.sourceField) return { valid: false, msg: "请选择目标字段" };
        return { valid: true, msg: "配置完整" };
      }
    }
    // 检查是否需要数据源步骤：公式/常量/文本等纯计算步骤不需要数据源
    const needsDataSource = rule.steps.some((s) => {
      const dataDependentTypes = ["source", "filter", "aggregate", "join", "group", "union", "limit", "sort", "crossMatch", "keepDuplicate", "keepUnique", "intersect", "lookup", "runningTotal", "percentOfTotal", "movingAverage", "binning", "conditionalTag", "stringExtract", "fillNA", "normalize", "valueNormalize"];
      return dataDependentTypes.includes(s.type);
    });
    // 对于formula步骤，如果只引用已配置字段（不含{val}），则不需要数据源
    const hasFormulaStep = rule.steps.some((s) => s.type === "formula");
    if (hasFormulaStep) {
      const formulaStep = rule.steps.find((s) => s.type === "formula");
      const expr = formulaStep.config?.expr || "";
      // 如果公式包含{val}或引用数据列，则需要数据源
      const needsDataForFormula = /\{val\}/.test(expr) || (needsDataSource && !/^\s*\{[^}]+\}\s*([+\-*\/]\s*\{[^}]+\}\s*)*$/s.test(expr));
      if (!needsDataForFormula && !needsDataSource) {
        return { valid: true, msg: "配置完整（引用已配置字段计算）" };
      }
    }
    // 常量、文本等纯值步骤不需要数据源
    if (!needsDataSource && (rule.steps.some((s) => s.type === "constant" || s.type === "text"))) {
      return { valid: true, msg: "配置完整（固定值）" };
    }
    const source = rule.steps.find((s) => s.type === "source");
    const hasTable = source ? (source.config.table || (source.config.tables && source.config.tables.length > 0)) : false;
    if (!source && needsDataSource) {
      return { valid: false, msg: "缺少「数据源」步骤" };
    }
    if (source && !hasTable) {
      return { valid: false, msg: "「数据源」步骤未选择数据表" };
    }
    const processTypes = ["filter", "aggregate", "join", "group", "formula", "virtual", "constant", "text", "valueNormalize", "normalize", "runningTotal", "percentOfTotal", "movingAverage", "binning"];
    const hasProcessStep = rule.steps.some((s) => processTypes.includes(s.type));
    if (source && hasTable && !hasProcessStep) {
      return { valid: false, msg: "已选数据源，请添加处理步骤（筛选/虚拟字段/公式等）" };
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
      const allHeaders = new Set();
      if (sourceTableIds.length > 0) {
        sourceTableIds.forEach((tid) => {
          const table = allTables.find((t) => t.id === tid);
          table?.headers?.forEach((h) => allHeaders.add(h));
        });
      } else {
        const table = allTables.find((t) => t.id === sourceTableId);
        table?.headers?.forEach((h) => allHeaders.add(h));
      }
      const allSteps = currentRule?.steps || [];
      // 添加前面虚拟字段步骤生成的列
      allSteps.filter((s) => s.type === "virtual").forEach((s) => {
        const targets = (s.config.target || "").split(",").map((t) => t.trim()).filter(Boolean);
        targets.forEach((t) => allHeaders.add(t));
      });
      // 添加前面join步骤导入的列
      allSteps.filter((s) => s.type === "join").forEach((s) => {
        const cfg = s.config || {};
        if (cfg.col) allHeaders.add(cfg.col);
        if (cfg.cols && Array.isArray(cfg.cols)) {
          cfg.cols.forEach((c) => allHeaders.add(c));
        }
      });
      return Array.from(allHeaders);
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
                    "样表数据"
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "table-select-items table-select-items-grid" },
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
                          (() => {
                            const nameLower = (t.name || "").toLowerCase();
                            const origLower = (t.originalName || "").toLowerCase();
                            const combined = nameLower + origLower;
                            let tag = null;
                            if (combined.includes("订单") || combined.includes("order")) tag = { text: "订单", color: "var(--color-primary)" };
                            else if (combined.includes("退款") || combined.includes("refund")) tag = { text: "退款", color: "var(--color-warning)" };
                            else if (combined.includes("推广") || combined.includes("ad")) tag = { text: "推广", color: "var(--color-success)" };
                            else if (combined.includes("账务") || combined.includes("账单") || combined.includes("bill")) tag = { text: "账务", color: "var(--color-info)" };
                            else if (combined.includes("成本") || combined.includes("cost")) tag = { text: "成本", color: "var(--color-danger)" };
                            if (tag && nameLower.includes(tag.text)) return null;
                            return tag && /*#__PURE__*/ React.createElement(
                              "span",
                              {
                                className: "table-select-item-tag",
                                style: { color: tag.color, borderColor: tag.color },
                              },
                              tag.text
                            );
                          })(),
                          t.originalName && t.name !== t.originalName && /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "table-select-item-desc" },
                            t.originalName
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
        const isMultiSelectOp = step.config.op === "==" || step.config.op === "!=";
        const selectedValues = isMultiSelectOp
          ? (Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []))
          : (step.config.value ? [step.config.value] : []);
        const toggleValue = (v) => {
          if (isMultiSelectOp) {
            const current = Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []);
            const newValues = current.includes(v)
              ? current.filter((item) => item !== v)
              : [...current, v];
            updateStepConfig(step.id, "values", newValues);
            if (newValues.length === 0) {
              updateStepConfig(step.id, "value", "");
            } else if (newValues.length === 1) {
              updateStepConfig(step.id, "value", newValues[0]);
            }
          } else {
            updateStepConfig(step.id, "value", step.config.value === v ? "" : v);
            updateStepConfig(step.id, "values", []);
          }
        };
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
                onChange: (val) => {
                  updateStepConfig(step.id, "op", val);
                  if (val !== "==" && val !== "!=") {
                    updateStepConfig(step.id, "values", []);
                  }
                },
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
              isMultiSelectOp ? "筛选值（可多选）" : "筛选值",
              filterValues.length > 0 && /*#__PURE__*/ React.createElement(
                "span",
                { style: { color: "var(--color-text-muted)", fontWeight: 400, fontSize: 12, marginLeft: 6 } },
                `（已选 ${selectedValues.length} 项）`,
              ),
            ),
            !isMultiSelectOp && /*#__PURE__*/ React.createElement(SearchableSelect, {
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
              isMultiSelectOp ? "快捷选择（可多选）：" : "快捷选择：",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-value-tags" },
              filterValues.slice(0, 15).map((v) =>
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    key: v,
                    className: `filter-value-tag ${selectedValues.includes(v) ? "active" : ""}`,
                    onClick: () => toggleValue(v),
                  },
                  v,
                ),
              ),
              filterValues.length > 15 && /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-value-tag filter-value-more" },
                `+${filterValues.length - 15}`,
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 🎯 ",
            /*#__PURE__*/ React.createElement("strong", null, "筛选"),
            isMultiSelectOp
              ? "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。支持同时选择多个值进行匹配。"
              : "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。下拉列表自动识别列中所有值，与Excel筛选体验一致。",
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
          { value: "__expr__", label: "计算表达式", group: "高级" },
          ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
        ];
        const quickAggFuncs = ["sum", "avg", "count", "max", "min"];
        const showExprInput = step.config.column === "__expr__";
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
                    "选择要聚合的数据或使用计算表达式"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.column,
                  onChange: (val) => updateStepConfig(step.id, "column", val),
                  options: columnOptionsWithVal,
                  placeholder: "请选择列",
                  groupBy: "group",
                }),
                showExprInput && /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item", style: { marginTop: "10px" } },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "form-label" },
                    "计算表达式",
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "form-label-hint" },
                      "先计算每行的值，再聚合。如: {单价} * {数量}"
                    )
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "form-control" },
                    /*#__PURE__*/ React.createElement("input", {
                      type: "text",
                      value: step.config.expr || "",
                      onChange: (e) => updateStepConfig(step.id, "expr", e.target.value),
                      placeholder: "输入计算表达式，如: {单价} * {数量}",
                      className: "form-input",
                      style: { fontFamily: "var(--font-mono)", letterSpacing: "0.5px" },
                    }),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { marginTop: "10px" } },
                      /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                        /*#__PURE__*/ React.createElement(Icons.Calculator, { size: 12 }),
                        "运算符",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" } },
                        [" + ", " - ", " * ", " / ", "(", ")"].map((op) => /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            key: op,
                            type: "button",
                            className: "quick-tag",
                            style: { cursor: "pointer", minWidth: "32px", textAlign: "center", padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 },
                            onClick: () => updateStepConfig(step.id, "expr", (step.config.expr || "") + op),
                          },
                          op.trim(),
                        )),
                      ),
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { marginTop: "6px" } },
                      /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                        /*#__PURE__*/ React.createElement(Icons.Columns, { size: 12 }),
                        "可用字段（点击插入）",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { style: { display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "120px", overflowY: "auto", padding: "2px" } },
                        sourceTableHeaders.map((h) => /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            key: h,
                            type: "button",
                            className: "quick-tag",
                            style: { cursor: "pointer", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                            title: h,
                            onClick: () => updateStepConfig(step.id, "expr", (step.config.expr || "") + `{${h}}`),
                          },
                          h,
                        )),
                      ),
                    ),
                    step.config.expr && /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { marginTop: "10px", padding: "10px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" } },
                      /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "#16a34a", marginBottom: "4px" } }, "公式预览"),
                      /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", fontFamily: "var(--font-mono)", color: "#166534" } },
                        (step.config.expr || "").replace(/{([^}]+)}/g, "【$1】"),
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
            ' 💡 将多行数据聚合成单个结果值。选择"计算表达式"可先计算如「单价×数量」再聚合求和。',
          ),
        );
      case "formula":
        const getAvailableFields = () => {
          const avail = [];
          avail.push({ key: "val", name: "上一步结果", type: "result", category: "变量" });
          const previewSteps = previewResult?.stepResults;
          if (Array.isArray(previewSteps) && previewSteps.length > 0) {
            const lastResult = previewSteps[previewSteps.length - 1];
            if (lastResult && lastResult.preview && lastResult.preview.length > 0) {
              const sampleRow = lastResult.preview[0];
              Object.keys(sampleRow).forEach((k) => {
                if (k !== "val" && k !== "_groupCount") {
                  avail.push({ key: k, name: k, type: "field", category: "字段" });
                }
              });
            }
          }
          if (savedRules && typeof savedRules === "object") {
            Object.keys(savedRules).forEach((fieldId) => {
              const field = fields.find((f) => f.id === fieldId);
              if (
                field &&
                field.id !== (currentFieldRef?.id || activeField?.id) &&
                savedRules[fieldId]?.steps?.length > 0
              ) {
                const chipName = field.name + " (已配置)";
                if (!avail.some((a) => a.key === field.name)) {
                  avail.push({ key: field.name, name: chipName, type: "computed", category: "已配置字段" });
                }
              }
            });
          }
          if (Array.isArray(sourceTableHeaders) && sourceTableHeaders.length > 0) {
            sourceTableHeaders.forEach((h) => {
              if (!avail.some((a) => a.key === h)) {
                avail.push({ key: h, name: h + " (源表字段)", type: "field", category: "字段" });
              }
            });
          }
          return avail;
        };
        const availFields = getAvailableFields();
        const formulaOperators = [
          { key: "+", name: "加法", type: "operator", category: "运算符", desc: "加法运算" },
          { key: "-", name: "减法", type: "operator", category: "运算符", desc: "减法运算" },
          { key: "*", name: "乘法", type: "operator", category: "运算符", desc: "乘法运算" },
          { key: "/", name: "除法", type: "operator", category: "运算符", desc: "除法运算" },
          { key: "%", name: "取余", type: "operator", category: "运算符", desc: "取余运算" },
          { key: "(", name: "左括号", type: "operator", category: "运算符", desc: "左括号" },
          { key: ")", name: "右括号", type: "operator", category: "运算符", desc: "右括号" },
          { key: " ? : ", name: "三元判断", type: "operator", category: "运算符", desc: "条件 ? 真值 : 假值" },
        ];
        const formulaFunctions = [
          { key: "Math.abs(", name: "绝对值", type: "function", category: "数学函数", desc: "Math.abs(val)" },
          { key: "Math.round(", name: "四舍五入", type: "function", category: "数学函数", desc: "Math.round(val)" },
          { key: "Math.floor(", name: "向下取整", type: "function", category: "数学函数", desc: "Math.floor(val)" },
          { key: "Math.ceil(", name: "向上取整", type: "function", category: "数学函数", desc: "Math.ceil(val)" },
          { key: "Math.max(", name: "最大值", type: "function", category: "数学函数", desc: "Math.max(a, b, ...)" },
          { key: "Math.min(", name: "最小值", type: "function", category: "数学函数", desc: "Math.min(a, b, ...)" },
          { key: "Math.pow(", name: "幂运算", type: "function", category: "数学函数", desc: "Math.pow(base, exp)" },
          { key: "Math.sqrt(", name: "平方根", type: "function", category: "数学函数", desc: "Math.sqrt(val)" },
          { key: "Math.log(", name: "自然对数", type: "function", category: "数学函数", desc: "Math.log(val)" },
          { key: "Math.exp(", name: "指数", type: "function", category: "数学函数", desc: "Math.exp(val)" },
        ];
        const allFormulaOptions = [
          ...availFields.map(f => ({ ...f, insert: `{${f.key}}` })),
          ...formulaOperators,
          ...formulaFunctions,
        ];
        const formatOptions = (CalcEngine.getOutputFormats && typeof CalcEngine.getOutputFormats === "function")
          ? CalcEngine.getOutputFormats()
          : [
              { value: "none", label: "不处理（原始数值）" },
              { value: "round2", label: "保留 2 位小数（四舍五入）" },
              { value: "thousands", label: "千分位格式化（如 1,234.56）" },
              { value: "money", label: "货币格式（¥1,234.56）" },
              { value: "percent", label: "百分比格式（12.34%）" },
            ];
        const currentFormat = step.config.format || "none";
        const insertAtCursor = (insertText) => {
          const expr = step.config.expr || "";
          updateStepConfig(step.id, "expr", expr + insertText);
        };
        const handleOptionSelect = (opt) => {
          if (opt.insert) {
            insertAtCursor(opt.insert);
          } else {
            insertAtCursor(opt.key);
          }
        };
        const filteredOptions = formulaFieldSearch.trim()
          ? allFormulaOptions.filter((opt) => {
              const q = formulaFieldSearch.toLowerCase();
              return (
                (opt.key || "").toLowerCase().includes(q) ||
                (opt.name || "").toLowerCase().includes(q) ||
                (opt.desc || "").toLowerCase().includes(q) ||
                (opt.category || "").toLowerCase().includes(q)
              );
            })
          : allFormulaOptions;
        const filteredGrouped = filteredOptions.reduce((acc, opt) => {
          const cat = opt.category || "其他";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(opt);
          return acc;
        }, {});
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
                  "支持下拉选择或手动输入"
                )
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "formula-editor" },
                /*#__PURE__*/ React.createElement("textarea", {
                  className: "input formula-textarea",
                  value: step.config.expr || "",
                  onChange: (e) =>
                    updateStepConfig(step.id, "expr", e.target.value),
                  placeholder: "{val} * 0.7 + {销售额} * 0.3",
                  style: { fontFamily: "var(--font-mono)", minHeight: "80px" },
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "formula-dropdown-panel" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "formula-search-box" },
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input formula-search-input",
                    placeholder: "搜索字段、函数、运算符...",
                    value: formulaFieldSearch,
                    onChange: (e) => setFormulaFieldSearch(e.target.value),
                  }),
                  formulaFieldSearch && /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "formula-search-clear",
                      onClick: () => setFormulaFieldSearch(""),
                    },
                    "✕"
                  ),
                ),
                Object.keys(filteredGrouped).length > 0
                  ? Object.keys(filteredGrouped).map((cat) => /*#__PURE__*/ React.createElement(
                      "div",
                      { key: cat, className: "formula-dropdown-group" },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "formula-dropdown-group-title" },
                        cat,
                        /*#__PURE__*/ React.createElement(
                          "span",
                          { className: "formula-dropdown-group-count" },
                          filteredGrouped[cat].length
                        )
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "formula-dropdown-options" },
                        filteredGrouped[cat].map((opt, i) => /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            key: i,
                            className: `formula-dropdown-option ${opt.type}`,
                            onClick: () => handleOptionSelect(opt),
                            title: opt.desc || opt.name,
                          },
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "formula-option-key" },
                            opt.key
                          ),
                          /*#__PURE__*/ React.createElement(
                            "span",
                            { className: "formula-option-name" },
                            opt.name
                          ),
                        ))
                      )
                    ))
                  : /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "formula-dropdown-empty" },
                      "未找到匹配项"
                    )
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "输出值格式",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "对计算结果进行格式转换"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: currentFormat,
                onChange: (val) => updateStepConfig(step.id, "format", val),
                options: formatOptions,
                placeholder: "请选择输出格式",
              })
            )
          ),
          step.config.expr && /*#__PURE__*/ React.createElement(
            "div",
            { style: { marginTop: "10px", padding: "10px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" } },
            /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "#0369a1", marginBottom: "4px" } }, "公式预览"),
            /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", fontFamily: "var(--font-mono)", color: "#0c4a6e" } },
              (step.config.expr || "").replace(/{([^}]+)}/g, "【$1】"),
            ),
            (() => {
              const expr = step.config.expr || "";
              const fields = expr.match(/{([^}]+)}/g);
              if (!fields) return null;
              return /*#__PURE__*/ React.createElement("div", { style: { marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px" } },
                fields.map((f, i) => /*#__PURE__*/ React.createElement("span", { key: i, style: { fontSize: "11px", padding: "2px 6px", background: "#e0f2fe", borderRadius: "4px", color: "#0369a1" } }, f.slice(1, -1)),
              ),
              /*#__PURE__*/ React.createElement("span", { style: { fontSize: "11px", color: "#7dd3fc" } }, `共${fields.length}个字段`),
              );
            })(),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " 💡 使用 ",
            /*#__PURE__*/ React.createElement("code", null, "{字段名}"),
            " 引用字段值，",
            /*#__PURE__*/ React.createElement("code", null, "{val}"),
            " 代表上一步结果。支持所有JavaScript数学函数；计算结果可按所选格式输出。",
          ),
        );
      case "virtual": {
        const virtualRuleOptions = [
          { value: "copy", label: "复制", group: "基础" },
          { value: "toNumber", label: "转数字", group: "类型转换" },
          { value: "toString", label: "转文本", group: "类型转换" },
          { value: "trim", label: "去除空格", group: "文本处理" },
          { value: "parseQty", label: "提取数量", group: "文本处理" },
          { value: "parsePieces", label: "条数识别（商品规格）", group: "文本处理" },
          { value: "parseSize", label: "尺码识别（商品规格）", group: "文本处理" },
          { value: "costLookup", label: "成本查找（全局表）", group: "高级" },
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
        const quickVirtualRules = ["copy", "toNumber", "abs", "round", "trim", "parsePieces", "parseSize", "costLookup"];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-box" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-title" },
              /*#__PURE__*/ React.createElement("span", { className: "step-info-icon" }, "💡"),
              "复杂运算步骤 - 虚拟字段转换"
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-content" },
              "虚拟字段用于创建派生数据列。",
              /*#__PURE__*/ React.createElement("br", null),
              "1. 源字段：选择要处理的列（如「商品规格」）",
              /*#__PURE__*/ React.createElement("br", null),
              "2. 目标字段：输出列名（多个用,分隔，可同时生成多个输出）",
              /*#__PURE__*/ React.createElement("br", null),
              "3. 转换规则：选择处理方式",
              /*#__PURE__*/ React.createElement("br", null),
              /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 转数字"), "：去除货币符号和逗号后转数字，支持百分比(50%→0.5)、提取字符串中第一个数字、中文数字识别",
              /*#__PURE__*/ React.createElement("br", null),
              /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 条数识别"), "：从商品规格中自动提取条数，支持「X条装」「X条」「X色各一」「X色各Y条」等模式，也可通过颜色词或+号自动计算",
              /*#__PURE__*/ React.createElement("br", null),
              /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 尺码识别"), "：从商品规格中自动提取尺码（S/M/L/XL/2XL/3XL等）",
              /*#__PURE__*/ React.createElement("br", null),
              /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 成本查找"), "：根据款号和尺码从全局成本表中匹配单件成本，支持自动按店铺名匹配成本表"
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
                    "选择字段"
                  )
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.source,
                  onChange: (val) =>
                    updateStepConfig(step.id, "source", val),
                  options: [
                    { value: "val", label: "当前值 (val)" },
                    ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
                  ],
                  placeholder: "请选择源字段",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "目标字段（多个用,分隔）",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "支持同一列多个输出"
                  )
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.target,
                  onChange: (e) =>
                    updateStepConfig(step.id, "target", e.target.value),
                  placeholder: "目标字段名（多个用,分隔）",
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
          /*#__PURE__*/ React.createElement(MapValueEditor, { step: step, updateStepConfig: updateStepConfig }),
          step.config.rule === "costLookup" &&
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section", style: { marginTop: "12px" } },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(Icons.Database, null),
                " 成本表配置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item", style: { marginBottom: "12px" } },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "成本表（全局表）",
                /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "自动按店铺名匹配")
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.costTableId || "",
                onChange: (val) => updateStepConfig(step.id, "costTableId", val),
                options: externalTables.map((t) => ({ value: t.id, label: t.name })),
                placeholder: "请选择全局成本表",
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
                  "款号字段",
                  /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "数据中的款号列")
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.skuField || "",
                  onChange: (val) => updateStepConfig(step.id, "skuField", val),
                  options: [
                    { value: "", label: "请选择" },
                    ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
                  ],
                  placeholder: "选择款号字段",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "尺码字段",
                  /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "虚拟字段生成的尺码列")
                ),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.sizeField || "",
                  onChange: (val) => updateStepConfig(step.id, "sizeField", val),
                  options: [
                    { value: "", label: "请选择" },
                    ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
                  ],
                  placeholder: "选择尺码字段",
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item", style: { marginTop: "8px" } },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "成本表款号列名",
                /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "成本表中的款号列，默认值为 款号")
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.skuCol || "款号",
                onChange: (e) => updateStepConfig(step.id, "skuCol", e.target.value),
                placeholder: "款号",
              })
            )
          ),
          [
            "substring",
            "replace",
            "concat",
            "ifEmpty",
            "multiply",
            "divide",
            "sumFields",
            "diffFields",
            "concat",
            "mapValue",
            "split",
            "join",
            "trim",
            "upperCase",
            "lowerCase",
            "toFixed2",
          ].includes(step.config.rule) &&
          /*#__PURE__*/ React.createElement(AdvancedRuleConfig, { step: step, updateStepConfig: updateStepConfig }),
        );
      }
      case "join": {
        const joinTable = allTables.find((t) => t.id === step.config.table);
        const joinHeaders = joinTable?.headers || [];
        const isExternal = joinTable?.isExternal || false;
        const shopName = platform?.shops?.[0]?.name || "";
        const autoMatchedExt = shopName ? externalTables.find((t) => t.name === shopName || t.sheetKey === shopName) : null;
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
                  isExternal ? "全局数据表" : "选择要关联的数据表"
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
              }),
              autoMatchedExt && !step.config.table && /*#__PURE__*/ React.createElement(
                "div",
                {
                  style: { marginTop: "8px", padding: "8px 12px", background: "var(--color-primary-50)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
                  onClick: () => {
                    updateStepConfig(step.id, "table", autoMatchedExt.id);
                    updateStepConfig(step.id, "externalId", autoMatchedExt.externalId || "");
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Lightbulb, { size: 14 }),
                `检测到店铺"${shopName}"匹配全局表"${autoMatchedExt.name}"，点击自动关联`,
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
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-checkbox-label" },
              /*#__PURE__*/ React.createElement("input", {
                type: "checkbox",
                checked: step.config.parseSizeCost || false,
                onChange: (e) => updateStepConfig(step.id, "parseSizeCost", e.target.checked),
              }),
              "启用智能成本解析",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "支持平台+尺码组合成本（如拼多多m3.5l4淘宝5）"
              )
            )
          ),
          step.config.parseSizeCost && /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "平台字段",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "主表中标识所属平台的字段（可选）"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.platformField || "",
                onChange: (val) => updateStepConfig(step.id, "platformField", val),
                options: [
                  { value: "", label: "不指定（使用当前店铺平台）" },
                  ...sourceTableHeaders.map((h) => ({ value: h, label: h }))
                ],
                placeholder: "选择平台字段",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "规格/尺码字段",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "主表中包含商品规格或尺码的字段"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.sizeField || "",
                onChange: (val) => updateStepConfig(step.id, "sizeField", val),
                options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                placeholder: "请选择规格/尺码字段",
              })
            )
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 💡 根据主表关联键从关联表中匹配数据，将关联表中指定列的值填充到当前字段。",
        ),
      );
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
      case "valueNormalize":
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-box" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-title" },
              /*#__PURE__*/ React.createElement("span", { className: "step-info-icon" }, "💡"),
              "复杂运算步骤 - 列值转换配置"
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-content" },
              "此步骤用于将列值转换为可计算的数字。配置方法：",
              /*#__PURE__*/ React.createElement("br", null),
              "1. 选择源字段（要转换的列）",
              /*#__PURE__*/ React.createElement("br", null),
              "2. 添加多条转换规则，按优先级匹配",
              /*#__PURE__*/ React.createElement("br", null),
              "3. 常见模式：「100元」→「100」/「5条」→「5」/「50%」→「0.5」/「三」→「3」"
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
                "\u6E90\u5B57\u6BB5",
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: "\u8BF7\u9009\u62E9\u9700\u8981\u89C4\u8303\u5316\u7684\u5B57\u6BB5",
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
                value: step.config.targetColumn || "normalized_value",
                onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
                placeholder: "normalized_value",
              }),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-bar" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "filter-header-title" },
                /*#__PURE__*/ React.createElement("span", { className: "filter-header-icon" }, "📋"),
                "转换规则列表",
              ),
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-header-count" },
                `${(step.config.rules || []).length} 条规则`,
              ),
            ),
            (step.config.rules || []).map((rule, idx) => /*#__PURE__*/ React.createElement(
              "div",
              {
                key: idx,
                className: "step-info-box",
                style: { marginBottom: 10 },
              },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-content" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "grid-2" },
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "form-item" },
                    /*#__PURE__*/ React.createElement(
                      "label",
                      { className: "form-label" },
                      "匹配方式",
                    ),
                    /*#__PURE__*/ React.createElement(SearchableSelect, {
                      value: rule.matchType || "regex",
                      onChange: (val) => {
                        const rules = [...(step.config.rules || [])];
                        rules[idx] = { ...rules[idx], matchType: val };
                        updateStepConfig(step.id, "rules", rules);
                      },
                      options: [
                        { value: "regex", label: "正则匹配" },
                        { value: "contains", label: "包含文本" },
                        { value: "equals", label: "完全相等" },
                        { value: "prefix", label: "前缀匹配" },
                        { value: "suffix", label: "后缀匹配" },
                        { value: "chineseNumber", label: "中文数字" },
                        { value: "percent", label: "百分比格式" },
                        { value: "currency", label: "货币格式" },
                        { value: "auto", label: "自动识别" },
                      ],
                      placeholder: "\u8BF7\u9009\u62E9\u5339\u914D\u65B9\u5F0F",
                    }),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "form-item" },
                    /*#__PURE__*/ React.createElement(
                      "label",
                      { className: "form-label" },
                      "匹配模式",
                    ),
                    /*#__PURE__*/ React.createElement("input", {
                      type: "text",
                      className: "input",
                      value: rule.pattern || "",
                      onChange: (e) => {
                        const rules = [...(step.config.rules || [])];
                        rules[idx] = { ...rules[idx], pattern: e.target.value };
                        updateStepConfig(step.id, "rules", rules);
                      },
                      placeholder: rule.matchType === "regex" ? "\\d+\\.?\\d*" : rule.matchType === "chineseNumber" ? "" : "输入匹配内容",
                      disabled: ["chineseNumber", "percent", "currency", "auto"].includes(rule.matchType),
                    }),
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
                      "转换方式",
                    ),
                    /*#__PURE__*/ React.createElement(SearchableSelect, {
                      value: rule.convertType || "extractNumber",
                      onChange: (val) => {
                        const rules = [...(step.config.rules || [])];
                        rules[idx] = { ...rules[idx], convertType: val };
                        updateStepConfig(step.id, "rules", rules);
                      },
                      options: [
                        { value: "extractNumber", label: "提取数字" },
                        { value: "multiply", label: "乘以系数" },
                        { value: "divide", label: "除以系数" },
                        { value: "mapTo", label: "映射为固定值" },
                        { value: "chineseToNumber", label: "中文转数字" },
                        { value: "percentToNumber", label: "百分比转数字" },
                        { value: "currencyToNumber", label: "货币转数字" },
                      ],
                      placeholder: "\u8BF7\u9009\u62E9\u8F6C\u6362\u65B9\u5F0F",
                    }),
                  ),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "form-item" },
                    /*#__PURE__*/ React.createElement(
                      "label",
                      { className: "form-label" },
                      "转换参数",
                    ),
                    /*#__PURE__*/ React.createElement("input", {
                      type: "text",
                      className: "input",
                      value: rule.convertParam || "",
                      onChange: (e) => {
                        const rules = [...(step.config.rules || [])];
                        rules[idx] = { ...rules[idx], convertParam: e.target.value };
                        updateStepConfig(step.id, "rules", rules);
                      },
                      placeholder: rule.convertType === "multiply" || rule.convertType === "divide" ? "输入系数" : rule.convertType === "mapTo" ? "输入目标值" : "",
                      disabled: ["extractNumber", "chineseToNumber", "percentToNumber", "currencyToNumber"].includes(rule.convertType),
                    }),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "form-label" },
                    "示例",
                  ),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: rule.example || "",
                    onChange: (e) => {
                      const rules = [...(step.config.rules || [])];
                      rules[idx] = { ...rules[idx], example: e.target.value };
                      updateStepConfig(step.id, "rules", rules);
                    },
                    placeholder: "输入示例（如：100元 → 100）",
                  }),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-tip" },
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "btn btn-sm",
                    onClick: () => {
                      const rules = [...(step.config.rules || [])];
                      rules.splice(idx, 1);
                      updateStepConfig(step.id, "rules", rules);
                    },
                    style: { marginLeft: "auto", marginTop: 8 },
                  },
                  "删除规则",
                ),
              ),
            )),
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "btn btn-primary",
                onClick: () => {
                  const rules = [...(step.config.rules || [])];
                  rules.push({
                    matchType: "auto",
                    pattern: "",
                    convertType: "extractNumber",
                    convertParam: "",
                    example: "",
                  });
                  updateStepConfig(step.id, "rules", rules);
                },
                style: { marginTop: 10, marginBottom: 10 },
              },
              "添加规则",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-desc" },
            /*#__PURE__*/ React.createElement(Icons.Info, null),
            " \u652F\u6301\u591A\u79CD\u683C\u5F0F\u7684\u503C\u8F6C\u6362\uFF0C\u5982\u4E2D\u6587\u6570\u5B57\u3001\u6210\u672C\u683C\u5F0F\u3001\u767E\u5206\u6BD4\u3002\u89C4\u5219\u6309\u987A\u5E8F\u5339\u914D\uFF0C\u9047\u5230\u5339\u914D\u540E\u5C31\u4F7F\u7528\u5BF9\u5E94\u8F6C\u6362\u65B9\u5F0F\uFF0C\u4E0D\u518D\u5339\u914D\u540E\u7EE7\u89C4\u5219\u3002",
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
          const allHeaders = data.length > 0 ? Object.keys(data[0]).filter((k) => !k.startsWith("_")) : [];
          const cfg = step.config || {};
          let relevantHeaders = [];
          const extractExprFields = (expr) => {
            if (!expr) return [];
            const matches = expr.match(/{([^}]+)}/g);
            return matches ? matches.map((m) => m.slice(1, -1)) : [];
          };
          switch (step.type) {
            case "filter":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "virtual":
              relevantHeaders = [cfg.source, cfg.target].filter(Boolean);
              break;
            case "join":
              relevantHeaders = [cfg.key, cfg.fk, cfg.col, cfg.platformField, cfg.sizeField].filter(Boolean);
              break;
            case "aggregate":
              if (cfg.column === "__expr__" && cfg.expr) {
                relevantHeaders = extractExprFields(cfg.expr);
              } else {
                relevantHeaders = [cfg.column].filter(Boolean);
              }
              break;
            case "formula":
              relevantHeaders = extractExprFields(cfg.expr);
              break;
            case "sort":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "source":
            case "limit":
            default:
              relevantHeaders = allHeaders.slice(0, 5);
              break;
          }
          const validHeaders = relevantHeaders.filter((h) => allHeaders.includes(h));
          const displayHeaders = validHeaders.length > 0 ? validHeaders : allHeaders.slice(0, 5);
          const displayRows = data.slice(0, 100);
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-data-table" },
            /*#__PURE__*/ React.createElement(
              "table",
              { className: "debug-table" },
              /*#__PURE__*/ React.createElement(
                "thead",
                null,
                /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  displayHeaders.map((h) => /*#__PURE__*/ React.createElement("th", { key: h, title: h }, h)),
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
                    { key: h },
                    row[h] != null
                      ? typeof row[h] === "number"
                        ? row[h].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                        : String(row[h]).slice(0, 50)
                      : "-",
                  )),
                )),
              ),
            ),
            displayHeaders.length < allHeaders.length && /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-more" },
              `... 共 ${allHeaders.length} 列，仅显示参与计算的 ${displayHeaders.length} 列`,
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
              ": ",
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
                { className: "field-search-box" },
                /*#__PURE__*/ React.createElement(Icons.Search, null),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "field-search-input",
                  placeholder: "搜索字段名称或单元格...",
                  value: fieldSearch,
                  onChange: (e) => setFieldSearch(e.target.value),
                }),
                fieldSearch &&
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "field-search-clear",
                      onClick: () => setFieldSearch(""),
                      title: "清除搜索",
                    },
                    /*#__PURE__*/ React.createElement(Icons.X, null),
                  ),
              ),
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
                { className: "card-header-actions" },
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
                      title: "\u4E0A\u4E00\u4E2A\u5B57\u6BB5",
                    },
                    "\u2039",
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
                      title: "\u4E0B\u4E00\u4E2A\u5B57\u6BB5",
                    },
                    "\u203A",
                  ),
                ),
                /*#__PURE__*/ React.createElement("div", {
                  className: "header-divider",
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
                                              (() => {
                                                const cfg = sr.stepConfig || {};
                                                const prevRows = sr.prevRows || 0;
                                                const currRows = sr.rows?.length || sr.rows || 0;
                                                switch (sr.type) {
                                                  case "filter":
                                                    if (prevRows > 0) {
                                                      const filtered = prevRows - currRows;
                                                      return /*#__PURE__*/ React.createElement(
                                                        "span",
                                                        { className: "debug-step-meta-tag", style: { background: "#fef3c7", borderColor: "#fde68a", color: "#d97706" } },
                                                        /*#__PURE__*/ React.createElement(Icons.Filter, null),
                                                        "\u8FC7\u6EE4 ", filtered, " \u6761",
                                                      );
                                                    }
                                                    return null;
                                                  case "join":
                                                    if (prevRows > 0) {
                                                      const matched = currRows;
                                                      const unmatched = prevRows - currRows;
                                                      return /*#__PURE__*/ React.createElement(
                                                        "span",
                                                        { className: "debug-step-meta-tag", style: { background: "#dbeafe", borderColor: "#bfdbfe", color: "#2563eb" } },
                                                        /*#__PURE__*/ React.createElement(Icons.Link, null),
                                                        "\u5173\u8054 ", matched, " \u6761",
                                                        unmatched > 0 && /*#__PURE__*/ React.createElement("span", { style: { marginLeft: "4px", opacity: 0.7 } }, `(${unmatched}条未匹配)`),
                                                      );
                                                    }
                                                    return null;
                                                  case "virtual":
                                                    return /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-meta-tag", style: { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" } },
                                                      /*#__PURE__*/ React.createElement(Icons.Wand2, null),
                                                      "\u65B0\u589E ", (cfg.target || "").split(",").filter(Boolean).length, " \u5217",
                                                    );
                                                  case "aggregate":
                                                    return /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-meta-tag", style: { background: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" } },
                                                      /*#__PURE__*/ React.createElement(Icons.BarChart3, null),
                                                      cfg.method || "聚合",
                                                    );
                                                  case "formula":
                                                    return /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-meta-tag", style: { background: "#fff7ed", borderColor: "#fed7aa", color: "#ea580c" } },
                                                      /*#__PURE__*/ React.createElement(Icons.Calculator, null),
                                                      "\u8BA1\u7B97\u5B8C\u6210",
                                                    );
                                                  case "sort":
                                                    return /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-meta-tag", style: { background: "#f1f5f9", borderColor: "#cbd5e1", color: "#64748b" } },
                                                      /*#__PURE__*/ React.createElement(Icons.ArrowUpDown, null),
                                                      cfg.direction === "desc" ? "降序" : "升序",
                                                    );
                                                  case "limit":
                                                    return /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-meta-tag", style: { background: "#fef9c3", borderColor: "#fde047", color: "#ca8a04" } },
                                                      /*#__PURE__*/ React.createElement(Icons.GripVertical, null),
                                                      "\u9650\u5236 ", cfg.limit || 10, " \u6761",
                                                    );
                                                  default:
                                                    return null;
                                                }
                                              })(),
                                            ),
                                            (() => {
                                              const cfg = sr.stepConfig || {};
                                              switch (sr.type) {
                                                case "source":
                                                  return cfg.tables && cfg.tables.length > 0 && /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "数据源："),
                                                    cfg.tables.map((t) => t.name || t).join("、"),
                                                  );
                                                case "filter":
                                                  return cfg.column && /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "筛选："),
                                                    `${cfg.column} ${cfg.op || ""} ${cfg.value != null ? String(cfg.value) : ""}`,
                                                  );
                                                case "virtual":
                                                  return /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "虚拟字段："),
                                                    `源字段「${cfg.source || "-"}」→ 规则「${cfg.rule || "-"}」→ 目标「${cfg.target || "-"}」`,
                                                  );
                                                case "join":
                                                  return /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "关联："),
                                                    `${cfg.key || "-"} = ${cfg.fk || "-"}，导入列「${cfg.col || "-"}」`,
                                                  );
                                                case "aggregate":
                                                  return /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "聚合："),
                                                    `${cfg.method || "-"}(${cfg.column || "-"})`,
                                                  );
                                                case "formula":
                                                  return /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "公式："),
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontFamily: "var(--font-mono)", color: "var(--color-primary)", marginLeft: "4px" } }, cfg.expr || "-"),
                                                  );
                                                case "sort":
                                                  return /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "排序："),
                                                    `${cfg.column || "-"} ${cfg.direction || "asc"}`,
                                                  );
                                                case "limit":
                                                  return /*#__PURE__*/ React.createElement("div", { style: { marginBottom: "10px", fontSize: "12px", color: "var(--color-text-secondary)" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontWeight: 600 } }, "限制："),
                                                    `取前 ${cfg.limit || 10} 条`,
                                                  );
                                                default:
                                                  return null;
                                              }
                                            })(),
                                            sr.preview && sr.preview.length > 0 && sr.preview[0]?._formulaDetail && /*#__PURE__*/ React.createElement(
                                              "div",
                                              { className: "debug-step-formula-box", style: { background: "#f8fafc", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "12px", border: "1px solid #e2e8f0" } },
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { style: { fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" } },
                                                /*#__PURE__*/ React.createElement(Icons.Calculator, { size: 14 }),
                                                "\u8BA1\u7B97\u8FC7\u7A0B",
                                              ),
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { style: { marginBottom: "10px" } },
                                                /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#94a3b8", marginBottom: "3px", fontWeight: 500 } }, "1. 公式"),
                                                /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", color: "#1e293b", fontFamily: "var(--font-mono)", background: "#fff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" } },
                                                  sr.preview[0]._formulaDetail.original || "-",
                                                ),
                                              ),
                                              Object.keys(sr.preview[0]._formulaDetail.substitutions).length > 0 && /*#__PURE__*/ React.createElement(
                                                "div",
                                                { style: { marginBottom: "10px" } },
                                                /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: 500 } }, "2. 代入值"),
                                                /*#__PURE__*/ React.createElement(
                                                  "div",
                                                  { style: { display: "flex", flexWrap: "wrap", gap: "8px" } },
                                                  Object.entries(sr.preview[0]._formulaDetail.substitutions).map(([field, info]) => /*#__PURE__*/ React.createElement(
                                                    "div",
                                                    { key: field, style: { background: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" } },
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontSize: "12px", color: "#64748b", fontWeight: 500 } }, field),
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontSize: "11px", color: "#cbd5e1" } }, "="),
                                                    /*#__PURE__*/ React.createElement("span", { style: { fontSize: "12px", fontFamily: "var(--font-mono)", color: "#0ea5e9", fontWeight: 600 } }, typeof info.raw === "number" ? info.raw.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : String(info.raw)),
                                                  )),
                                                ),
                                              ),
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { style: { marginBottom: "10px" } },
                                                /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#94a3b8", marginBottom: "3px", fontWeight: 500 } }, "3. 计算"),
                                                /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", color: "#1e293b", fontFamily: "var(--font-mono)", background: "#fef3c7", padding: "8px 10px", borderRadius: "6px", border: "1px solid #fde68a" } },
                                                  sr.preview[0]._formulaDetail.evaluated || "-",
                                                ),
                                              ),
                                              /*#__PURE__*/ React.createElement(
                                                "div",
                                                { style: { marginTop: "8px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1" } },
                                                /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", color: "#94a3b8", marginBottom: "3px", fontWeight: 500 } }, "4. 结果"),
                                                sr.preview[0]._formulaDetail.error
                                                  ? /*#__PURE__*/ React.createElement("div", { style: { fontSize: "14px", color: "#dc2626", fontFamily: "var(--font-mono)" } }, "✗ ", sr.preview[0]._formulaDetail.error)
                                                  : /*#__PURE__*/ React.createElement("div", { style: { fontSize: "18px", color: "#10b981", fontFamily: "var(--font-mono)", fontWeight: 700 } },
                                                      "✓ ",
                                                      typeof sr.preview[0]._formulaDetail.result === "number"
                                                        ? sr.preview[0]._formulaDetail.result.toLocaleString("zh-CN", { maximumFractionDigits: 4 })
                                                        : String(sr.preview[0]._formulaDetail.result),
                                                    ),
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
                                                (() => {
                                                  const cfg = sr.stepConfig || {};
                                                  const extractExprFields = (expr) => {
                                                    if (!expr) return [];
                                                    const matches = expr.match(/{([^}]+)}/g);
                                                    return matches ? matches.map((m) => m.slice(1, -1)) : [];
                                                  };
                                                  let relevantKeys = [];
                                                  switch (sr.type) {
                                                    case "virtual":
                                                      relevantKeys = [cfg.source, cfg.target].filter(Boolean);
                                                      break;
                                                    case "join":
                                                      relevantKeys = [cfg.key, cfg.fk, cfg.col].filter(Boolean);
                                                      break;
                                                    case "formula":
                                                      relevantKeys = sr.preview[0]?._formulaDetail ? Object.keys(sr.preview[0]._formulaDetail.substitutions || {}) : extractExprFields(cfg.expr);
                                                      break;
                                                    case "filter":
                                                      relevantKeys = [cfg.column].filter(Boolean);
                                                      break;
                                                    case "aggregate":
                                                      if (cfg.column === "__expr__" && cfg.expr) {
                                                        relevantKeys = extractExprFields(cfg.expr);
                                                      } else {
                                                        relevantKeys = [cfg.column].filter(Boolean);
                                                      }
                                                      break;
                                                    default:
                                                      relevantKeys = Object.keys(sr.preview[0] || {}).filter((k) => !k.startsWith("_")).slice(0, 5);
                                                      break;
                                                  }
                                                  if (relevantKeys.length === 0) {
                                                    relevantKeys = Object.keys(sr.preview[0] || {}).filter((k) => !k.startsWith("_")).slice(0, 5);
                                                  }
                                                  const displayCount = Math.min(sr.preview.length, 100);
                                                  return /*#__PURE__*/ React.createElement(
                                                    React.Fragment,
                                                    null,
                                                    sr.preview.slice(0, displayCount).map((row, ri) => /*#__PURE__*/ React.createElement(
                                                      "div",
                                                      { key: ri, className: "debug-step-preview-row" },
                                                      relevantKeys.map((k) => {
                                                        const v = row[k];
                                                        return /*#__PURE__*/ React.createElement(
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
                                                        );
                                                      }),
                                                    )),
                                                    sr.preview.length > 100 && /*#__PURE__*/ React.createElement(
                                                      "span",
                                                      { className: "debug-step-preview-more" },
                                                      `...(\u5171${sr.preview.length}\u6761\uff0c\u663e\u793a\u524d100\u6761)`,
                                                    ),
                                                  );
                                                })(),
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
                              info.description &&
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
                                      info.description,
                                    ),
                                    info.useCase &&
                                      /*#__PURE__*/ React.createElement(
                                        "div",
                                        {
                                          className:
                                            "step-description-usecase",
                                        },
                                        info.useCase,
                                      ),
                                  ),
                                ),
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
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "step-live-preview", style: { margin: "12px 0", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" } },
                                (() => {
                                  const cfg = step.config || {};
                                  const previews = [];
                                  switch (step.type) {
                                    case "source":
                                      if (cfg.tables && cfg.tables.length > 0) {
                                        previews.push({ icon: "", text: `已选择 ${cfg.tables.length} 个数据表` });
                                      } else {
                                        previews.push({ icon: "", text: "请至少选择一个数据表", warn: true });
                                      }
                                      break;
                                    case "filter":
                                      if (cfg.column && cfg.op) {
                                        previews.push({ icon: "", text: `筛选条件: ${cfg.column} ${cfg.op} ${cfg.value != null ? String(cfg.value) : ""}` });
                                      } else {
                                        previews.push({ icon: "", text: "请配置筛选条件", warn: true });
                                      }
                                      break;
                                    case "virtual":
                                      if (cfg.source && cfg.rule && cfg.target) {
                                        previews.push({ icon: "", text: `从「${cfg.source}」提取${cfg.rule} → 生成「${cfg.target}」` });
                                      } else {
                                        previews.push({ icon: "", text: "请配置源字段、规则和目标字段", warn: true });
                                      }
                                      break;
                                    case "join":
                                      if (cfg.key && cfg.fk && cfg.col) {
                                        previews.push({ icon: "", text: `关联: ${cfg.key} = ${cfg.fk}，导入「${cfg.col}」` });
                                        if (cfg.parseSizeCost) {
                                          const sizeInfo = cfg.sizeField ? `，尺码字段: ${cfg.sizeField}` : "";
                                          const platInfo = cfg.platformField ? `，平台字段: ${cfg.platformField}` : "（当前店铺平台）";
                                          previews.push({ icon: "", text: `智能成本解析: 平台${platInfo}${sizeInfo}` });
                                        }
                                      } else {
                                        previews.push({ icon: "", text: "请配置关联键和导入列", warn: true });
                                      }
                                      break;
                                    case "aggregate":
                                      if (cfg.column === "__expr__" && cfg.expr) {
                                        previews.push({ icon: "", text: `聚合: ${cfg.func || "sum"}(${cfg.expr.replace(/{([^}]+)}/g, "【$1】")})` });
                                      } else if (cfg.column) {
                                        previews.push({ icon: "", text: `聚合: ${cfg.func || "sum"}(${cfg.column})` });
                                      } else {
                                        previews.push({ icon: "", text: "请选择聚合列", warn: true });
                                      }
                                      break;
                                    case "formula":
                                      if (cfg.expr) {
                                        previews.push({ icon: "", text: `公式: ${cfg.expr.replace(/{([^}]+)}/g, "【$1】")}` });
                                        if (cfg.format && cfg.format !== "none") {
                                          previews.push({ icon: "", text: `输出格式: ${cfg.format}` });
                                        }
                                      } else {
                                        previews.push({ icon: "", text: "请输入计算公式", warn: true });
                                      }
                                      break;
                                    case "sort":
                                      if (cfg.column) {
                                        previews.push({ icon: "", text: `按 ${cfg.column} ${cfg.direction === "desc" ? "降序" : "升序"} 排列` });
                                      } else {
                                        previews.push({ icon: "", text: "请选择排序列", warn: true });
                                      }
                                      break;
                                    case "limit":
                                      previews.push({ icon: "", text: `限制输出前 ${cfg.limit || 10} 条数据` });
                                      break;
                                  }
                                  if (previews.length === 0) return null;
                                  return /*#__PURE__*/ React.createElement(
                                    React.Fragment,
                                    null,
                                    /*#__PURE__*/ React.createElement(
                                      "div",
                                      { style: { fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                                      /*#__PURE__*/ React.createElement(Icons.Eye, { size: 12 }),
                                      "配置预览",
                                    ),
                                    previews.map((p, pi) => /*#__PURE__*/ React.createElement(
                                      "div",
                                      { key: pi, style: { fontSize: "12px", color: p.warn ? "#d97706" : "#334155", marginBottom: "3px" } },
                                      p.text,
                                    )),
                                  );
                                })(),
                              ),
                              /*#__PURE__*/ React.createElement(
                                "div",
                                { className: "step-debug-panel" },
                                /*#__PURE__*/ React.createElement(
                                  "div",
                                  {
                                    className: "step-debug-title",
                                    onClick: () => {
                                      setDebugStepId(
                                        debugStepId === step.id
                                          ? null
                                          : step.id,
                                      );
                                    },
                                  },
                                  /*#__PURE__*/ React.createElement(
                                    "span",
                                    null,
                                    "\uD83D\uDD0D",
                                  ),
                                  " \u8C03\u8BD5\u9884\u89C8",
                                  /*#__PURE__*/ React.createElement(
                                    "span",
                                    {
                                      className: `step-debug-toggle ${debugStepId === step.id ? "open" : ""}`,
                                    },
                                    /*#__PURE__*/ React.createElement(
                                      Icons.ChevronDown,
                                      null,
                                    ),
                                  ),
                                ),
                                debugStepId === step.id &&
                                  /*#__PURE__*/ React.createElement(
                                    "div",
                                    {
                                      className: "step-debug-content",
                                    },
                                    renderStepDebug(step, idx),
                                  ),
                              ),
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
            if (!hasSource) {
              addRec("source", "首先需要选择数据源", 100);
            } else {
              // 数据列特征识别
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
              // 跨表关联：有款号+尺码+全局成本表
              if (hasSku && (hasSize || hasSpec) && hasCostTable && !hasJoin) {
                addRec("join", "检测到款号与全局成本表，建议关联匹配单件成本", 80);
              }
              // 公式计算：有条数和成本
              if ((hasPieces || hasVirtual) && (hasCost || hasJoin) && !hasFormula && hasAmount) {
                addRec("formula", "建议用公式计算金额（数量×单价）", 75);
              } else if ((hasPieces || hasVirtual) && hasCost && !hasFormula) {
                addRec("formula", "建议用公式计算总成本（数量×单价）", 75);
              }
              // 筛选
              if (hasShop && !hasFilter) {
                addRec("filter", "检测到店铺/来源列，建议按店铺筛选数据", 60);
              } else if (hasRefund && !hasFilter) {
                addRec("filter", "检测到退款列，建议过滤退款订单", 60);
              } else if (!hasFilter && steps.length >= 2) {
                addRec("filter", "建议添加筛选条件过滤数据", 50);
              }
              // 聚合
              if ((hasAmount || hasCost) && !hasAggregate && !hasFormula) {
                addRec("aggregate", "检测到金额列，建议聚合汇总数据", 55);
              } else if ((hasPieces || hasSpec) && !hasAggregate && !hasFormula) {
                addRec("aggregate", "建议聚合统计数量", 50);
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
                      onClick: () => { addStep(rec.type); setShowAddStepModal(false); },
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
