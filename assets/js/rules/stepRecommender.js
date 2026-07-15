// rules/stepRecommender.js - 计算步骤智能推荐引擎
// 基于已有步骤、数据列特征、字段语义类型，智能推荐下一步计算步骤

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

  const FILL_FIELD_TYPES = ["shop", "year", "month", "day", "date", "text"];

  const analyzeHeaders = (samples, sourceTableIds, externals, steps) => {
    const headers = new Set();
    
    samples.forEach((s) => {
      const sheet = s.sheets[Object.keys(s.sheets)[0]];
      (sheet?.headers || []).forEach((h) => headers.add(h));
    });

    if (sourceTableIds && sourceTableIds.length > 0) {
      sourceTableIds.forEach((tid) => {
        const t = samples.find((s) => s.id === tid);
        const sheet = t?.sheets[Object.keys(t?.sheets || {})[0]];
        (sheet?.headers || []).forEach((h) => headers.add(h));
      });
    }

    (externals || []).forEach((e) => {
      (e.headers || []).forEach((h) => headers.add(h));
    });

    const virtualStep = steps?.find((s) => s.type === "virtual");
    if (virtualStep) {
      (virtualStep.config.target || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => headers.add(t));
    }

    const headerArr = Array.from(headers).map((h) => h.toLowerCase());
    return {
      headers: headerArr,
      hasCol: (keys) => headerArr.some((h) => keys.some((k) => h.includes(k))),
    };
  };

  const generateRecommendations = (options) => {
    const {
      steps = [],
      semanticType = "",
      samples = [],
      sourceTableIds = [],
      externals = [],
    } = options;

    const recommendations = [];
    const addRec = (type, reason, priority = 0) => {
      if (!recommendations.some((r) => r.type === type)) {
        recommendations.push({ type, reason, priority });
      }
    };

    const hasSource = steps.some((s) => s.type === "source");
    const hasFilter = steps.some((s) => s.type === "filter");
    const hasVirtual = steps.some((s) => s.type === "virtual");
    const hasJoin = steps.some((s) => s.type === "join");
    const hasFormula = steps.some((s) => s.type === "formula");
    const hasAggregate = steps.some((s) => s.type === "aggregate");
    const hasSort = steps.some((s) => s.type === "sort");
    const hasLimit = steps.some((s) => s.type === "limit");
    const hasFill = steps.some((s) => s.type === "fill");

    const needsDataSource = steps.some((s) => DATA_DEPENDENT_TYPES.includes(s.type));
    const hasPureCompute = steps.some((s) => PURE_COMPUTE_TYPES.includes(s.type));
    const isFillField = FILL_FIELD_TYPES.includes(semanticType);
    const isValueField = semanticType === "value";
    const hasCostTable = externals.length > 0;

    const { hasCol } = analyzeHeaders(samples, sourceTableIds, externals, steps);

    const hasSpec = hasCol(["规格", "型号", "商品规格", "款式"]);
    const hasSku = hasCol(["款号", "sku", "商品编码", "货号"]);
    const hasSize = hasCol(["尺码", "size", "码数"]);
    const hasPieces = hasCol(["条数", "件数", "数量", "购买数量"]);
    const hasCost = hasCol(["成本", "cost", "单价", "价格"]);
    const hasAmount = hasCol(["金额", "销售额", "实付", "总价", "收入"]);
    const hasShop = hasCol(["店铺", "来源", "渠道", "门店"]);
    const hasDate = hasCol(["日期", "时间", "下单", "创建"]);
    const hasRefund = hasCol(["退款", "退货", "售后"]);

    if (isFillField) {
      if (!hasFill) {
        const fieldTypeLabel = semanticType === "shop" 
          ? "店铺名" 
          : semanticType.includes("date") || semanticType === "year" || semanticType === "month" || semanticType === "day"
            ? "日期"
            : "文本";
        addRec("fill", `该字段为${fieldTypeLabel}占位符，建议添加填充步骤`, 100);
      }
    } else if (!needsDataSource && !hasPureCompute) {
      addRec("source", "首先需要选择数据源", 100);
    }

    if ((hasSource || needsDataSource) && !isFillField) {
      if (hasSpec && !hasVirtual) {
        addRec("virtual", "检测到规格列，建议提取条数和尺码", 90);
      } else if (!hasSize && hasSpec && hasVirtual) {
        addRec("virtual", "建议添加尺码识别虚拟字段", 85);
      } else if (!hasPieces && hasSpec && hasVirtual) {
        addRec("virtual", "建议添加条数识别虚拟字段", 85);
      }

      if (hasSku && (hasSize || hasSpec) && hasCostTable && !hasJoin) {
        addRec("join", "检测到款号与全局成本表，建议关联匹配单件成本", 80);
      }

      if (isValueField && (hasPieces || hasVirtual) && (hasCost || hasJoin) && !hasFormula) {
        addRec("formula", "建议用公式计算金额（数量×单价）", 75);
      }

      if (isValueField && (hasAmount || hasCost || hasPieces) && !hasAggregate && !hasFormula) {
        addRec("aggregate", `检测到${hasAmount || hasCost ? "金额" : "数量"}列，建议聚合汇总数据`, 70);
      }

      if (hasShop && !hasFilter) {
        addRec("filter", "检测到店铺/来源列，建议按店铺筛选数据", 60);
      } else if (hasRefund && !hasFilter) {
        addRec("filter", "检测到退款列，建议过滤退款订单", 60);
      } else if (!hasFilter && steps.length >= 2 && isValueField) {
        addRec("filter", "建议添加筛选条件过滤数据", 50);
      }

      if (hasDate && !hasSort) {
        addRec("sort", "检测到日期列，建议按时间排序", 45);
      }

      if (!hasLimit && steps.length >= 3) {
        addRec("limit", "步骤较多，建议限制输出条数便于预览", 30);
      }
    }

    recommendations.sort((a, b) => b.priority - a.priority);
    return recommendations;
  };

  window.StepRecommender = {
    generateRecommendations,
    analyzeHeaders,
    DATA_DEPENDENT_TYPES,
    PURE_COMPUTE_TYPES,
  };
})();
