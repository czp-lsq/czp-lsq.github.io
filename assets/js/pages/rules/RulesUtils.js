window.RulesUtils = {
  validateRule: (rule, field) => {
    if (!rule || !rule.steps || rule.steps.length === 0) {
      return { valid: false, msg: "尚未配置任何步骤" };
    }

    const firstStep = rule.steps[0];
    const semanticType = field?.semanticType || "";

    if (["shop", "year", "month", "day", "date", "text"].includes(semanticType) && firstStep.type === "fill") {
      const cfg = firstStep.config || {};
      if (cfg.fillType === "shop") return { valid: true, msg: "配置完整（店铺名自动填充）" };
      if (cfg.fillType === "date" || cfg.fillType === "dateNow") {
        if (!cfg.dateFormat) return { valid: false, msg: "请选择日期格式" };
        return { valid: true, msg: "配置完整（日期自动填充）" };
      }
      if (cfg.fillType === "auto") {
        if (!semanticType) return { valid: false, msg: "无法识别字段类型，请手动选择填充方式" };
        return { valid: true, msg: "配置完整（自动填充）" };
      }
      if (cfg.fillType === "field") {
        if (!cfg.sourceTable) return { valid: false, msg: "请选择数据源表" };
        if (!cfg.sourceField) return { valid: false, msg: "请选择目标字段" };
        return { valid: true, msg: "配置完整" };
      }
    }

    const dataDependentTypes = ["source", "filter", "aggregate", "join", "group", "union", "limit", "sort", "crossMatch", "keepDuplicate", "keepUnique", "intersect", "lookup", "runningTotal", "percentOfTotal", "movingAverage", "binning", "conditionalTag", "stringExtract", "fillNA", "normalize", "valueNormalize"];
    const needsDataSource = rule.steps.some((s) => dataDependentTypes.includes(s.type));

    const hasFormulaStep = rule.steps.some((s) => s.type === "formula");
    if (hasFormulaStep) {
      const formulaStep = rule.steps.find((s) => s.type === "formula");
      const expr = formulaStep.config?.expr || "";
      const needsDataForFormula = /\{val\}/.test(expr) || (needsDataSource && !/^\s*\{[^}]+\}\s*([+\-*\/]\s*\{[^}]+\}\s*)*$/s.test(expr));
      if (!needsDataForFormula && !needsDataSource) {
        return { valid: true, msg: "配置完整（引用已配置字段计算）" };
      }
    }

    if (!needsDataSource && rule.steps.some((s) => s.type === "constant" || s.type === "text")) {
      return { valid: true, msg: "配置完整（固定值）" };
    }

    const source = rule.steps.find((s) => s.type === "source");
    const hasTable = source ? (source.config.table || (source.config.tables && source.config.tables.length > 0)) : false;

    if (!source && needsDataSource) return { valid: false, msg: "缺少「数据源」步骤" };
    if (source && !hasTable) return { valid: false, msg: "「数据源」步骤未选择数据表" };

    const processTypes = ["filter", "aggregate", "join", "group", "formula", "virtual", "constant", "text", "valueNormalize", "normalize", "runningTotal", "percentOfTotal", "movingAverage", "binning"];
    const hasProcessStep = rule.steps.some((s) => processTypes.includes(s.type));

    if (source && hasTable && !hasProcessStep) return { valid: false, msg: "已选数据源，请添加处理步骤（筛选/虚拟字段/公式等）" };

    return { valid: true, msg: "配置完整" };
  },

  inferFieldLevel: (field, savedRules) => {
    const steps = savedRules[field.id]?.steps || [];
    if (steps.length === 0) return null;
    if (steps.some((s) => s.type === "join" || s.type === "virtual")) return 2;
    if (steps.some((s) => s.type === "filter")) return 1;
    return 0;
  },

  categorizeField: (field) => {
    const name = (field.name || "").toLowerCase();
    const semanticType = field.semanticType || "";

    if (["shop", "year", "month", "day", "date", "text"].includes(semanticType)) return "other";

    const keywordMap = {
      sales: ["销售", "营收", "收入", "销售额", "营业额", "毛利", "销售金额", "实付", "支付", "成交额", "订单金额"],
      cost: ["成本", "费用", "支出", "投入", "花费", "进价", "采购", "运费", "包装", "推广", "广告", "佣金", "服务费"],
      profit: ["利润", "净利", "盈利", "收益", "回报率", "毛利率", "利润率"],
    };

    for (const [category, keywords] of Object.entries(keywordMap)) {
      for (const kw of keywords) {
        if (name.includes(kw.toLowerCase())) return category;
      }
    }

    return "other";
  },

  getFieldCategoryInfo: (cat) => {
    const categories = {
      sales: { name: "销售类", icon: "💰", color: "#10b981", bg: "#d1fae5" },
      cost: { name: "成本类", icon: "📦", color: "#f59e0b", bg: "#fef3c7" },
      profit: { name: "利润类", icon: "📈", color: "#6366f1", bg: "#e0e7ff" },
      other: { name: "其他", icon: "📋", color: "#64748b", bg: "#f1f5f9" },
    };
    return categories[cat] || categories.other;
  },

  generateStepId: () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,

  cloneStep: (step) => ({ ...step, id: window.RulesUtils.generateStepId() }),

  findStepIndex: (steps, stepId) => steps.findIndex((s) => s.id === stepId),

  moveStep: (steps, fromIdx, toIdx) => {
    const newSteps = [...steps];
    const [removed] = newSteps.splice(fromIdx, 1);
    newSteps.splice(toIdx, 0, removed);
    return newSteps;
  },

  removeStep: (steps, stepId) => steps.filter((s) => s.id !== stepId),

  addStepAfter: (steps, afterId, newStep) => {
    const idx = window.RulesUtils.findStepIndex(steps, afterId);
    const newSteps = [...steps];
    newSteps.splice(idx + 1, 0, newStep);
    return newSteps;
  },
};
