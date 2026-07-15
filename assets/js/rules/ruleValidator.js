// rules/ruleValidator.js - 规则验证器
// 包含：validateRule（验证规则配置完整性）、辅助工具函数

(function() {
  const DATA_DEPENDENT_TYPES = [
    "source", "filter", "aggregate", "join", "group", "union", "limit", "sort",
    "crossMatch", "keepDuplicate", "keepUnique", "intersect", "lookup",
    "runningTotal", "percentOfTotal", "movingAverage", "binning",
    "conditionalTag", "stringExtract", "fillNA", "normalize", "valueNormalize"
  ];

  const PURE_COMPUTE_TYPES = [
    "formula", "constant", "text", "math", "ratio", "diff", "round",
    "concat", "substring", "date", "condition", "rank"
  ];

  const PROCESS_TYPES = [
    "filter", "aggregate", "join", "group", "formula", "virtual", "constant",
    "text", "valueNormalize", "normalize", "runningTotal", "percentOfTotal",
    "movingAverage", "binning"
  ];

  const FILL_FIELD_TYPES = ["shop", "year", "month", "day", "date", "text"];

  // ==================== 验证规则配置 ====================
  const validateRule = (rule, field) => {
    if (!rule || !rule.steps || rule.steps.length === 0) {
      return { valid: false, msg: "尚未配置任何步骤" };
    }
    const firstStep = rule.steps[0];
    const semanticType = field?.semanticType || "";

    if (FILL_FIELD_TYPES.includes(semanticType) && firstStep.type === "fill") {
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

    const needsDataSource = rule.steps.some((s) => DATA_DEPENDENT_TYPES.includes(s.type));

    const hasFormulaStep = rule.steps.some((s) => s.type === "formula");
    if (hasFormulaStep) {
      const formulaStep = rule.steps.find((s) => s.type === "formula");
      const expr = formulaStep.config?.expr || "";
      const needsDataForFormula = /\{val\}/.test(expr) || (needsDataSource && !/^\s*\{[^}]+\}\s*([+\-*\/]\s*\{[^}]+\}\s*)*$/s.test(expr));
      if (!needsDataForFormula && !needsDataSource) {
        return { valid: true, msg: "配置完整（引用已配置字段计算）" };
      }
    }

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

    const hasProcessStep = rule.steps.some((s) => PROCESS_TYPES.includes(s.type));
    if (source && hasTable && !hasProcessStep) {
      return { valid: false, msg: "已选数据源，请添加处理步骤（筛选/虚拟字段/公式等）" };
    }

    return { valid: true, msg: "配置完整" };
  };

  // ==================== 推断字段层级 ====================
  const inferFieldLevel = (field, savedRules) => {
    const steps = savedRules[field.id]?.steps || [];
    if (steps.length === 0) return null;
    const hasJoin = steps.some((s) => s.type === "join");
    const hasVirtual = steps.some((s) => s.type === "virtual");
    const hasFilter = steps.some((s) => s.type === "filter");
    if (hasJoin || hasVirtual) return 2;
    if (hasFilter) return 1;
    return 0;
  };

  // ==================== 暴露到全局 ====================
  window.RuleValidator = {
    validateRule,
    inferFieldLevel,
    DATA_DEPENDENT_TYPES,
    PURE_COMPUTE_TYPES,
    PROCESS_TYPES,
    FILL_FIELD_TYPES,
  };
})();
