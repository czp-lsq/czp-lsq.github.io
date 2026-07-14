// rules/stepMeta.js - 计算规则步骤元数据
// 包含：validateStep, getStepHint, summarizeStep, getCategoryInfo
// 提取自 pages/rules.js 以实现代码分层

(function() {
  // 步骤类型视觉配置
  const getStepTypeInfo = function(type) {
    const types = {
      source: {
        name: "数据源",
        icon: "📊",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "data",
        description: "指定从哪个外部数据表获取数据，是计算流程的起点",
        useCase: "适用：从订单表/退款表/广告表等数据源拉取原始数据",
      },
      fill: {
        name: "填充占位符",
        icon: "🪄",
        color: "var(--color-success)",
        bg: "var(--color-success-50)",
        category: "data",
        description: "将数据源的值填入模板的占位符单元格",
        useCase: "适用：将利润表中的{{营业额}}占位符替换为具体数值",
      },
      filter: {
        name: "过滤",
        icon: "🔍",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "transform",
        description: "按条件过滤数据行，只保留符合条件的记录",
        useCase: "适用：只统计已付款订单、排除退款单、按时间范围筛选",
      },
      aggregate: {
        name: "聚合",
        icon: "🧮",
        color: "var(--color-warning)",
        bg: "var(--color-warning-50)",
        category: "transform",
        description: "对数据进行求和、求平均、计数等聚合运算",
        useCase: "适用：求总营业额、计算平均订单金额、统计订单数量",
      },
      formula: {
        name: "公式计算",
        icon: "➗",
        color: "var(--color-warning)",
        bg: "var(--color-warning-50)",
        category: "transform",
        description: "使用数学公式对数据进行自定义计算",
        useCase: "适用：销售额×利润率=利润、复杂的多步运算",
      },
      virtual: {
        name: "虚拟字段",
        icon: "✨",
        color: "var(--color-accent)",
        bg: "var(--color-accent-50)",
        category: "transform",
        description: "创建临时计算字段供后续步骤引用",
        useCase: "适用：提取金额、计算小计、准备中间变量",
      },
      join: {
        name: "跨表关联",
        icon: "🔗",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "按关联键将多个数据表合并为一个",
        useCase: "适用：关联订单表与商品表、关联广告表与销售额",
      },
      condition: {
        name: "条件判断",
        icon: "🔀",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "transform",
        description: "根据条件返回不同值，类似Excel的IF函数",
        useCase: "适用：根据销售额区间分级、布尔判断、开关逻辑",
      },
      group: {
        name: "分组聚合",
        icon: "🗂️",
        color: "var(--color-warning)",
        bg: "var(--color-warning-50)",
        category: "transform",
        description: "按某个字段分组后对每组分别聚合",
        useCase: "适用：按店铺分组求和、按月份统计、按商品分类汇总",
      },
      round: {
        name: "四舍五入",
        icon: "🔢",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "对数值进行四舍五入，保留指定小数位",
        useCase: "适用：金额保留2位小数、百分比保留整数",
      },
      concat: {
        name: "字符串拼接",
        icon: "🧷",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "将多个文本字段拼接成一个字符串",
        useCase: "适用：拼接店铺全称、合并地址、生成唯一标识",
      },
      substring: {
        name: "字符串截取",
        icon: "✂️",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "从字符串中截取指定位置的部分内容",
        useCase: "适用：提取订单号后4位、获取手机号段",
      },
      date: {
        name: "日期处理",
        icon: "📅",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "对日期进行格式化或转换",
        useCase: "适用：日期格式化、提取年月、计算日期差",
      },
      math: {
        name: "数学运算",
        icon: "➕",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "执行加减乘除等基本数学运算",
        useCase: "适用：单价×数量=总价、计算差额",
      },
      rank: {
        name: "排名",
        icon: "🏆",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "对数据按某个字段排名",
        useCase: "适用：店铺销售排名、商品热度Top10",
      },
      diff: {
        name: "差值",
        icon: "➖",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "计算两列数据之差",
        useCase: "适用：销售额-成本=利润、本期-上期=增量",
      },
      ratio: {
        name: "比率",
        icon: "📊",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
        category: "format",
        description: "计算两个数值的比率",
        useCase: "适用：利润率、增长率、完成率",
      },
      union: {
        name: "合并",
        icon: "🔄",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "合并多个数据源的行数据",
        useCase: "适用：合并多个月份订单、合并多个店铺数据",
      },
      keepDuplicate: {
        name: "保留重复",
        icon: "♊",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "只保留出现重复的记录",
        useCase: "适用：找出重复下单的客户、检测异常数据",
      },
      keepUnique: {
        name: "保留唯一",
        icon: "🦄",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "只保留不重复的记录",
        useCase: "适用：筛选独立客户、获取唯一列表",
      },
      intersect: {
        name: "对比筛选",
        icon: "🪞",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "对比两个数据集的交集或差集",
        useCase: "适用：找出新增客户、对比新旧订单",
      },
      limit: {
        name: "限制行数",
        icon: "✋",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "限制数据只取前N行或跳过前N行",
        useCase: "适用：只取前10名、分页展示",
      },
      lookup: {
        name: "查找替换",
        icon: "🔎",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "在数据中查找并替换指定值",
        useCase: "适用：批量替换店铺名、统一分类名称",
      },
      sort: {
        name: "排序",
        icon: "🔢",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "按指定字段升序或降序排列",
        useCase: "适用：按时间排序、按金额大小排序",
      },
      crossMatch: {
        name: "交叉匹配",
        icon: "✖️",
        color: "var(--color-info)",
        bg: "var(--color-info-50)",
        category: "advanced",
        description: "交叉匹配两个数据集",
        useCase: "适用：找出两表共有/独有的数据",
      },
      runningTotal: {
        name: "累计",
        icon: "📈",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "按行累加计算累计值",
        useCase: "适用：累计销售额、累计订单数、库存结余",
      },
      percentOfTotal: {
        name: "占比",
        icon: "%",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "计算每行占总和的百分比",
        useCase: "适用：各店铺销售占比、各商品利润占比",
      },
      movingAverage: {
        name: "移动平均",
        icon: "〰️",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "按滑动窗口计算移动平均值",
        useCase: "适用：7日移动平均销售额、平滑波动数据",
      },
      binning: {
        name: "分箱",
        icon: "📦",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "将连续值分组到离散区间",
        useCase: "适用：金额分档(0-100/100-500/500+)、年龄段分组",
      },
      conditionalTag: {
        name: "条件标记",
        icon: "🏷️",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "根据条件给数据打标签",
        useCase: "适用：高/中/低价值客户标记、风险等级标记",
      },
      stringExtract: {
        name: "字符串提取",
        icon: "🪡",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "使用正则或分隔符提取字符串片段",
        useCase: "适用：从地址提取省份、从文本提取数字",
      },
      fillNA: {
        name: "空值填充",
        icon: "🧯",
        color: "var(--color-warning)",
        bg: "var(--color-warning-50)",
        category: "transform",
        description: "将空值替换为指定值",
        useCase: "适用：缺失数据填充0或平均值",
      },
      normalize: {
        name: "数据标准化",
        icon: "📐",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "将数据缩放到统一范围",
        useCase: "适用：Min-Max归一化、Z-Score标准化",
      },
      valueNormalize: {
        name: "值规范化",
        icon: "🔢",
        color: "var(--color-success)",
        bg: "var(--color-success-50)",
        category: "transform",
        description: "识别并转换多种格式的值为标准数字，支持正则匹配和映射规则",
        useCase: "适用：将'100元'/'一百'/'¥99.9'等多种格式转换为纯数字",
      },
      constant: {
        name: "常量",
        icon: "🔢",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "定义一个固定常量值",
        useCase: "适用：税率、固定费率、汇率",
      },
      text: {
        name: "文本",
        icon: "📝",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        category: "transform",
        description: "直接使用固定文本值",
        useCase: "适用：固定标签、说明文字、注释",
      },
      distinct: {
        name: "去重",
        icon: "🆔",
        color: "var(--color-primary)",
        bg: "var(--color-primary-50)",
        description: "去除重复的行数据",
        useCase: "适用：获取唯一客户列表、唯一商品列表",
        category: "transform",
      },
    };
    return (
      types[type] || {
        name: type,
        icon: "⚙️",
        color: "var(--color-text-tertiary)",
        bg: "var(--color-bg-tertiary)",
      }
    );
  };

  // 步骤类型分类（用于添加步骤弹窗分组）
  const STEP_TYPE_CATEGORIES = {
    data: {
      label: "数据源",
      types: ["source", "fill", "union"],
    },
    transform: {
      label: "转换处理",
      types: ["filter", "virtual", "aggregate", "formula", "join", "condition", "group", "runningTotal", "percentOfTotal", "movingAverage", "binning", "conditionalTag", "stringExtract", "fillNA", "normalize", "valueNormalize", "constant", "text", "distinct"],
    },
    format: {
      label: "格式化",
      types: ["round", "concat", "substring", "date", "math", "rank", "diff", "ratio"],
    },
    advanced: {
      label: "高级操作",
      types: ["keepDuplicate", "keepUnique", "intersect", "limit", "lookup", "sort", "crossMatch"],
    },
  };

  // 校验步骤
  const validateStep = function(step, rule, field) {
    if (!step) return { valid: true, message: "" };
    const cfg = step.config || {};
    const semanticType = (field && field.semanticType) || "";
    switch (step.type) {
      case "fill":
        if (cfg.fillType === "field") {
          if (!cfg.sourceTable) return { valid: false, message: "请选择数据源表" };
          if (!cfg.sourceField) return { valid: false, message: "请选择目标字段" };
        }
        if (cfg.fillType === "auto" && !semanticType) {
          return { valid: false, message: "无法识别字段类型，请手动选择填充方式" };
        }
        if (cfg.fillType === "shop") {
          return { valid: true, message: "配置完整（店铺名自动填充）" };
        }
        if (cfg.fillType === "date" || cfg.fillType === "dateNow") {
          if (!cfg.dateFormat) return { valid: false, message: "请选择日期格式" };
          return { valid: true, message: "配置完整（日期自动填充）" };
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
          if (cfg.value === undefined || cfg.value === "" || cfg.value === null) {
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
        if (!cfg.pairs || cfg.pairs.length === 0) return { valid: false, message: "请添加查找替换对" };
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
      case "movingAverage":
        if (!cfg.column) return { valid: false, message: "请选择计算列" };
        if (!cfg.windowSize || cfg.windowSize < 1) return { valid: false, message: "请设置窗口大小" };
        return { valid: true, message: "配置完整" };
      case "binning":
        if (!cfg.column) return { valid: false, message: "请选择分箱列" };
        if (!cfg.binCount || cfg.binCount < 1) return { valid: false, message: "请设置分箱数量" };
        return { valid: true, message: "配置完整" };
      case "conditionalTag":
        if (!cfg.conditions || cfg.conditions.length === 0) return { valid: false, message: "请添加条件规则" };
        return { valid: true, message: "配置完整" };
      case "stringExtract":
        if (!cfg.column) return { valid: false, message: "请选择源字段" };
        if (cfg.extractType === "regex" && !cfg.pattern) return { valid: false, message: "请输入正则表达式" };
        return { valid: true, message: "配置完整" };
      case "fillNA":
        if (!cfg.column) return { valid: false, message: "请选择填充列" };
        if (cfg.fillType === "value" && !cfg.fillValue) return { valid: false, message: "请输入填充值" };
        return { valid: true, message: "配置完整" };
      case "normalize":
        if (!cfg.column) return { valid: false, message: "请选择标准化列" };
        return { valid: true, message: "配置完整" };
      case "valueNormalize":
        if (!cfg.column) return { valid: false, message: "请选择需要规范化的字段" };
        if (!cfg.rules || cfg.rules.length === 0) return { valid: false, message: "请添加至少一条转换规则" };
        return { valid: true, message: "配置完整" };
      default:
        return { valid: true, message: "配置完整" };
    }
  };

  // 获取步骤提示
  const getStepHint = function(step, rule, field) {
    if (!step) return null;
    const hints = [];
    const semanticType = (field && field.semanticType) || "";
    const stepIdx = (rule && rule.steps ? rule.steps.findIndex((s) => s.id === step.id) : -1) ?? -1;
    if (stepIdx === 0 && step.type === "source") {
      if (semanticType === "shop" || semanticType === "year" || semanticType === "month") {
        hints.push({ type: "info", text: "💡 该字段为占位符，建议使用「填充占位符」步骤，无需数据源" });
      }
    }
    if (stepIdx === 0 && step.type === "fill" && (semanticType === "value" || !semanticType)) {
      if (field && field.type === "value") {
        hints.push({ type: "warning", text: "💡 数值字段建议从「数据源」步骤开始配置" });
      }
    }
    if (step.type === "source" && stepIdx > 0 && rule && rule.steps && rule.steps[0] && rule.steps[0].type === "source") {
      hints.push({ type: "warning", text: "⚠ 已有数据源步骤，第二个数据源通常需要「跨表关联」配合使用" });
    }
    if (step.type === "aggregate" && stepIdx > 0) {
      const prevHasData = rule && rule.steps
        ? rule.steps.slice(0, stepIdx).some((s) => s.type === "source" || s.type === "fill")
        : false;
      if (!prevHasData) {
        hints.push({ type: "error", text: "❌ 聚合步骤前需要有数据源步骤" });
      }
    }
    return hints;
  };

  // 类别信息
  const getCategoryInfo = function(cat) {
    const map = {
      sales: { name: "销售类", icon: "💰", color: "var(--color-success)" },
      cost: { name: "成本类", icon: "🧾", color: "var(--color-warning)" },
      profit: { name: "利润类", icon: "📈", color: "var(--color-primary)" },
    };
    return map[cat] || { name: cat, icon: "📦", color: "var(--color-text-tertiary)" };
  };

  // 摘要步骤
  const summarizeStep = function(step) {
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
        return c.column && c.op ? `${c.column} ${c.op} ${c.value || ""}` : "未配置";
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
        return c.source && c.target ? `${c.source} → ${c.target} (${rn})` : "未配置";
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
      case "date": {
        const dateOps = { format: "格式化", extractYear: "提取年", extractMonth: "提取月", extractDay: "提取日", addDays: "增减天数" };
        return `日期: ${c.column || "val"} (${dateOps[c.operation] || c.operation})`;
      }
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
      case "movingAverage":
        return `移动平均: ${c.column || "val"} → ${c.targetColumn || "moving_avg"} (窗口:${c.windowSize || 3})`;
      case "binning":
        return `分箱: ${c.column || "val"} → ${c.targetColumn || "bin"} (${c.binType === "equalWidth" ? `等宽${c.binCount || 5}箱` : "自定义区间"})`;
      case "conditionalTag":
        return `条件标记: ${(c.conditions || []).length}条规则 → ${c.targetColumn || "tag"}`;
      case "stringExtract": {
        const extractNames = { regex: "正则提取", substring: "截取", concat: "拼接", split: "分割", trim: "去空格", upper: "转大写", lower: "转小写" };
        return `字符串: ${c.column || "val"} (${extractNames[c.extractType] || c.extractType}) → ${c.targetColumn || "extracted"}`;
      }
      case "fillNA": {
        const fillNames = { value: "指定值", zero: "零值", empty: "空字符串", mean: "平均值", median: "中位数", mode: "众数", forward: "前向填充", backward: "后向填充" };
        return `空值填充: ${c.column || "val"} (${fillNames[c.fillType] || c.fillType}${c.fillType === "value" ? `:${c.fillValue}` : ""})`;
      }
      case "normalize": {
        const normNames = { minmax: "最小最大", zscore: "Z-score", decimal: "小数定标" };
        return `标准化: ${c.column || "val"} → ${c.targetColumn || "normalized"} (${normNames[c.normType] || c.normType})`;
      }
      case "valueNormalize": {
        return `值规范化: ${c.column || "val"} → ${c.targetColumn || "normalized"} (${(c.rules || []).length}条规则)`;
      }
      default:
        return "";
    }
  };

  // 暴露到全局
  window.RulesStepMeta = {
    getStepTypeInfo,
    STEP_TYPE_CATEGORIES,
    validateStep,
    getStepHint,
    getCategoryInfo,
    summarizeStep,
  };
})();
