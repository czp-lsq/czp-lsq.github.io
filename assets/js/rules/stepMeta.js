// rules/stepMeta.js - 计算规则步骤元数据
// 包含：getStepTypeInfo, STEP_TYPE_CATEGORIES, validateStep, getStepHint, summarizeStep, getCategoryInfo, getStepConfigFields, getStepPresets

(function() {
  // ==================== 步骤类型详细元信息 ====================
  const STEP_TYPE_DETAILS = {
    // ========== 数据源类 (Source) ==========
    source: {
      name: "数据源",
      icon: "📊",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "source",
      description: "从外部数据表获取原始数据，是计算流程的起点",
      useCase: "适用场景：从订单表、退款表、广告表等数据源拉取原始数据",
      detailedDesc: "指定从哪个或哪些数据表获取数据。可以选择单个表，也可以选择多个表进行后续处理。数据源步骤必须作为计算流程的第一步。",
      configFields: [
        { key: "tables", label: "数据表格", type: "multi-select", required: true, hint: "选择一个或多个数据表作为数据源" },
        { key: "table", label: "单表选择", type: "select", required: false, hint: "选择单个数据表（兼容旧配置）" },
        { key: "column", label: "指定列", type: "text", required: false, hint: "只取指定列，留空取全部列" },
      ],
      examples: [
        { title: "获取订单数据", desc: "选择「订单表」获取所有订单记录" },
        { title: "多表合并", desc: "同时选择「1月订单」「2月订单」进行后续合并" },
      ],
      notes: [
        "数据源步骤必须是计算流程的第一个步骤",
        "选择多个表时，后续通常需要配合「合并」步骤",
        "如果表结构不同，建议使用「虚拟字段」统一字段名",
      ],
      relatedSteps: ["fill", "union", "virtual"],
      presets: [
        { name: "全部数据", config: {} },
        { name: "指定列", config: { column: "字段名" } },
      ],
    },
    fill: {
      name: "填充数据",
      icon: "🪄",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "source",
      description: "填充默认值、固定值或占位符数据",
      useCase: "适用场景：填充店铺名、日期、固定常量、数据字段映射",
      detailedDesc: "将指定的值填入目标字段。支持多种填充方式：自动识别、手动输入、日期填充、店铺名填充、从数据字段取值等。",
      configFields: [
        { key: "fillType", label: "填充类型", type: "select", required: true, hint: "选择填充方式", options: ["auto", "manual", "date", "dateNow", "field", "shop"] },
        { key: "value", label: "填充值", type: "text", required: false, hint: "手动填充时的值" },
        { key: "dateFormat", label: "日期格式", type: "select", required: false, hint: "日期填充时的格式", options: ["yyyy-mm", "yyyy-mm-dd", "yyyy年mm月", "mm月dd日"] },
        { key: "sourceTable", label: "来源表", type: "select", required: false, hint: "数据字段填充时的来源表" },
        { key: "sourceField", label: "来源字段", type: "select", required: false, hint: "数据字段填充时的来源字段" },
      ],
      examples: [
        { title: "填充店铺名", desc: "fillType=shop，自动填入当前店铺名称" },
        { title: "填充月份", desc: "fillType=date, dateFormat=yyyy-mm，填入报表周期月份" },
        { title: "填充固定值", desc: "fillType=manual, value=100，填入固定数值100" },
      ],
      notes: [
        "填充步骤通常用于补充数据源中没有的字段",
        "日期填充支持周期日期和当前日期两种模式",
        "数据字段填充需要先有数据源步骤",
      ],
      relatedSteps: ["source", "constant", "virtual"],
      presets: [
        { name: "店铺名", config: { fillType: "shop" } },
        { name: "当前月份", config: { fillType: "dateNow", dateFormat: "yyyy-mm" } },
        { name: "固定数值", config: { fillType: "manual", value: "0" } },
      ],
    },
    union: {
      name: "数据合并",
      icon: "🔄",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "source",
      description: "将多个数据表的行数据合并追加在一起",
      useCase: "适用场景：合并多个月份订单、合并多个店铺数据、合并不同平台数据",
      detailedDesc: "将多个数据表按行合并（UNION ALL），所有表需要有相同的字段结构。如果字段名不同，建议先用「虚拟字段」或「重命名」统一。",
      configFields: [
        { key: "tables", label: "合并的表", type: "multi-select", required: true, hint: "选择要合并的多个数据表" },
      ],
      examples: [
        { title: "合并多月订单", desc: "合并1月、2月、3月订单表，得到季度订单" },
        { title: "合并多店铺", desc: "合并天猫、京东、拼多多三个店铺的销售数据" },
      ],
      notes: [
        "合并的表需要有相同或相似的字段结构",
        "字段名不一致时，建议先用「虚拟字段」统一字段",
        "合并后数据行数 = 各表行数之和",
      ],
      relatedSteps: ["source", "virtual", "join"],
      presets: [
        { name: "合并两表", config: { tables: [] } },
      ],
    },
    constant: {
      name: "常量值",
      icon: "🔢",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "source",
      description: "定义一个固定的常量值",
      useCase: "适用场景：税率、固定费率、汇率、折扣率等固定数值",
      detailedDesc: "创建一个固定不变的常量值，供后续步骤引用。常用于税率、折扣率、汇率等需要统一管理的参数。",
      configFields: [
        { key: "value", label: "常量值", type: "text", required: true, hint: "常量的具体数值或文本" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出的字段名" },
      ],
      examples: [
        { title: "税率", desc: "value=0.13，13%的增值税率" },
        { title: "汇率", desc: "value=7.2，美元兑人民币汇率" },
      ],
      notes: [
        "常量值在整个计算过程中保持不变",
        "需要修改时只需改一处，所有引用处自动更新",
      ],
      relatedSteps: ["fill", "formula", "virtual"],
      presets: [
        { name: "税率13%", config: { value: "0.13" } },
        { name: "汇率7.2", config: { value: "7.2" } },
      ],
    },
    text: {
      name: "文本值",
      icon: "📝",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "source",
      description: "直接使用固定文本值",
      useCase: "适用场景：固定标签、说明文字、注释、分类标识",
      detailedDesc: "创建一个固定的文本值，常用于添加标签、分类标识、说明文字等。",
      configFields: [
        { key: "value", label: "文本内容", type: "text", required: true, hint: "文本的具体内容" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出的字段名" },
      ],
      examples: [
        { title: "分类标签", desc: 'value="高价值客户"' },
        { title: "状态标记", desc: 'value="已审核"' },
      ],
      notes: [
        "文本值可以与其他字段拼接使用",
        "常用于打标签、分类标记",
      ],
      relatedSteps: ["constant", "concat", "conditionalTag"],
      presets: [
        { name: "标签文本", config: { value: "标签" } },
      ],
    },

    // ========== 数据筛选类 (Filter) ==========
    filter: {
      name: "行筛选",
      icon: "🔍",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      category: "filter",
      description: "根据条件筛选数据行，只保留符合条件的记录",
      useCase: "适用场景：只统计已付款订单、排除退款单、按时间范围筛选、按店铺筛选",
      detailedDesc: "按指定条件过滤数据行，支持等于、不等于、大于、小于、包含、不包含、为空、不为空等多种比较方式。",
      configFields: [
        { key: "column", label: "筛选字段", type: "select", required: true, hint: "选择要筛选的字段" },
        { key: "op", label: "比较方式", type: "select", required: true, hint: "选择比较运算符", options: ["==", "!=", ">", "<", ">=", "<=", "contains", "notContains", "empty", "notEmpty"] },
        { key: "value", label: "比较值", type: "text", required: false, hint: "用于比较的值，为空/不为空时不需要" },
      ],
      examples: [
        { title: "筛选已付款", desc: 'column="订单状态", op="==", value="已付款"' },
        { title: "排除退款", desc: 'column="退款状态", op="!=", value="已退款"' },
        { title: "金额大于100", desc: 'column="订单金额", op=">", value="100"' },
      ],
      notes: [
        "多个筛选条件需要使用多个筛选步骤串联",
        "日期筛选建议先确保日期格式正确",
        "文本比较区分大小写",
      ],
      relatedSteps: ["distinct", "limit", "sort"],
      presets: [
        { name: "等于", config: { op: "==" } },
        { name: "不等于", config: { op: "!=" } },
        { name: "大于", config: { op: ">" } },
        { name: "包含", config: { op: "contains" } },
        { name: "非空", config: { op: "notEmpty" } },
      ],
    },
    distinct: {
      name: "去重",
      icon: "🆔",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      category: "filter",
      description: "去除重复的数据行",
      useCase: "适用场景：获取唯一客户列表、唯一商品列表、去除重复订单",
      detailedDesc: "根据指定字段去除重复的数据行，只保留唯一值。可以按单个字段去重，也可以按全部字段去重。",
      configFields: [
        { key: "column", label: "去重字段", type: "select", required: false, hint: "按指定字段去重，留空按全部字段去重" },
      ],
      examples: [
        { title: "唯一客户", desc: 'column="客户ID"，获取所有不重复的客户' },
        { title: "唯一商品", desc: 'column="商品编码"，获取所有不重复的商品' },
      ],
      notes: [
        "不指定字段时，按整行所有字段去重",
        "去重后数据行数会减少",
        "保留第一条出现的记录",
      ],
      relatedSteps: ["filter", "keepUnique", "keepDuplicate"],
      presets: [
        { name: "整行去重", config: {} },
        { name: "按字段去重", config: { column: "字段名" } },
      ],
    },
    limit: {
      name: "限制行数",
      icon: "✋",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      category: "filter",
      description: "只取前N行或跳过前N行",
      useCase: "适用场景：只取前10名、分页展示、抽样查看、限制输出数量",
      detailedDesc: "限制输出的数据行数，可以只取前N行，也可以跳过前N行后取N行。常用于分页或只看Top N数据。",
      configFields: [
        { key: "count", label: "行数", type: "number", required: true, hint: "要取的行数" },
        { key: "offset", label: "偏移量", type: "number", required: false, hint: "跳过的行数，从0开始" },
      ],
      examples: [
        { title: "前10名", desc: "count=10，取前10条数据" },
        { title: "第2页", desc: "count=20, offset=20，跳过前20条取20条" },
      ],
      notes: [
        "通常与排序步骤配合使用，先排序再取前N",
        "偏移量从0开始计算",
      ],
      relatedSteps: ["sort", "rank", "sample"],
      presets: [
        { name: "前10条", config: { count: "10" } },
        { name: "前100条", config: { count: "100" } },
      ],
    },
    keepDuplicate: {
      name: "保留重复",
      icon: "♊",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      category: "filter",
      description: "只保留出现重复的记录",
      useCase: "适用场景：找出重复下单的客户、检测异常数据、查找重复记录",
      detailedDesc: "根据指定字段，只保留出现了2次或以上的重复记录，用于数据质量检查或异常检测。",
      configFields: [
        { key: "column", label: "检测字段", type: "select", required: true, hint: "按哪个字段检测重复" },
      ],
      examples: [
        { title: "重复客户", desc: 'column="客户ID"，找出多次下单的客户' },
        { title: "重复订单号", desc: 'column="订单号"，检查是否有重复订单' },
      ],
      notes: [
        "保留所有重复的行，不只是多余的那一条",
        "常用于数据质量检测",
      ],
      relatedSteps: ["distinct", "keepUnique", "filter"],
      presets: [
        { name: "检测重复", config: { column: "字段名" } },
      ],
    },
    keepUnique: {
      name: "保留唯一",
      icon: "🦄",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      category: "filter",
      description: "只保留不重复的记录（仅出现一次的）",
      useCase: "适用场景：筛选独立客户、获取唯一列表、去重后只保留独有的",
      detailedDesc: "根据指定字段，只保留只出现过一次的记录。与去重不同，去重保留每条一条，而保留唯一会去掉所有出现过重复的记录。",
      configFields: [
        { key: "column", label: "检测字段", type: "select", required: true, hint: "按哪个字段检测唯一性" },
      ],
      examples: [
        { title: "仅下单一次的客户", desc: 'column="客户ID"，只保留只买过一次的客户' },
      ],
      notes: [
        "与去重（distinct）不同：去重保留每条一条，保留唯一会去掉所有重复的",
        "例如：A出现3次，B出现1次，去重后保留A和B各1条；保留唯一只保留B",
      ],
      relatedSteps: ["distinct", "keepDuplicate", "filter"],
      presets: [
        { name: "保留唯一值", config: { column: "字段名" } },
      ],
    },
    condition: {
      name: "条件判断",
      icon: "🔀",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      category: "filter",
      description: "根据条件返回不同值，类似Excel的IF函数",
      useCase: "适用场景：根据销售额区间分级、布尔判断、开关逻辑、分类打标",
      detailedDesc: "判断指定字段是否满足条件，满足则返回一个值，不满足则返回另一个值。常用于数据分级、分类打标。",
      configFields: [
        { key: "column", label: "判断字段", type: "select", required: true, hint: "要判断的字段" },
        { key: "op", label: "比较方式", type: "select", required: false, hint: "比较运算符", options: ["==", "!=", ">", "<", ">=", "<=", "contains"] },
        { key: "value", label: "比较值", type: "text", required: false, hint: "用于比较的值" },
        { key: "trueValue", label: "满足时返回", type: "text", required: false, hint: "条件满足时的值" },
        { key: "falseValue", label: "不满足时返回", type: "text", required: false, hint: "条件不满足时的值" },
      ],
      examples: [
        { title: "高低价值客户", desc: 'column="消费金额", op=">", value="1000", trueValue="高价值", falseValue="普通"' },
        { title: "是否达标", desc: 'column="销售额", op=">=", value="目标", trueValue="达标", falseValue="未达标"' },
      ],
      notes: [
        "只支持简单的单条件判断",
        "复杂多条件建议使用「条件标记」步骤",
      ],
      relatedSteps: ["conditionalTag", "filter", "formula"],
      presets: [
        { name: "简单IF", config: { op: "==" } },
        { name: "大于判断", config: { op: ">" } },
      ],
    },

    // ========== 字段处理类 (Field) ==========
    virtual: {
      name: "虚拟字段",
      icon: "✨",
      color: "var(--color-accent)",
      bg: "var(--color-accent-50)",
      category: "field",
      description: "创建临时计算字段供后续步骤引用",
      useCase: "适用场景：提取金额、计算小计、准备中间变量、字段类型转换",
      detailedDesc: "基于现有字段创建新的计算字段，支持复制、类型转换、字符串处理、数学运算等多种规则。创建的虚拟字段可以在后续步骤中引用。",
      configFields: [
        { key: "source", label: "源字段", type: "select", required: true, hint: "来源字段名" },
        { key: "target", label: "目标字段", type: "text", required: true, hint: "新字段名" },
        { key: "rule", label: "转换规则", type: "select", required: false, hint: "字段转换规则", options: ["copy", "toNumber", "toString", "trim", "parseQty", "splitPlus", "abs", "round", "floor", "ceil", "toFixed2", "percent", "parsePercent", "formatMoney", "toLowerCase", "toUpperCase", "length", "substring", "replace", "concat", "ifEmpty", "chineseToNumber", "mapValue", "multiply", "divide", "sumFields", "diffFields"] },
      ],
      examples: [
        { title: "转数字", desc: 'rule="toNumber"，将文本型数字转为数值' },
        { title: "去空格", desc: 'rule="trim"，去除字符串首尾空格' },
        { title: "保留2位小数", desc: 'rule="toFixed2"，四舍五入保留2位小数' },
      ],
      notes: [
        "虚拟字段不会影响原始数据，只在后续步骤中可用",
        "建议目标字段使用有意义的命名，便于后续引用",
      ],
      relatedSteps: ["formula", "select", "rename"],
      presets: [
        { name: "复制字段", config: { rule: "copy" } },
        { name: "转数字", config: { rule: "toNumber" } },
        { name: "转文本", config: { rule: "toString" } },
        { name: "去空格", config: { rule: "trim" } },
        { name: "保留2位小数", config: { rule: "toFixed2" } },
      ],
    },
    formula: {
      name: "公式计算",
      icon: "➗",
      color: "var(--color-warning)",
      bg: "var(--color-warning-50)",
      category: "field",
      description: "使用数学公式进行自定义计算",
      useCase: "适用场景：销售额×利润率=利润、复杂的多步运算、多字段混合计算",
      detailedDesc: "使用数学表达式对数据进行计算，支持加减乘除、括号、函数等。可以引用多个字段进行复杂计算。",
      configFields: [
        { key: "expr", label: "计算公式", type: "text", required: true, hint: '数学表达式，如 "金额 * 数量 * 0.85"' },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出结果的字段名" },
      ],
      examples: [
        { title: "计算利润", desc: 'expr="销售额 - 成本"' },
        { title: "计算折扣价", desc: 'expr="原价 * 折扣率"' },
        { title: "计算增长率", desc: 'expr="(本期 - 上期) / 上期 * 100"' },
      ],
      notes: [
        "支持 +、-、*、/、%、() 等运算符",
        "字段名中含有特殊字符时需要用引号包裹",
        "除数不能为0，否则结果为0或报错",
      ],
      relatedSteps: ["virtual", "aggregate", "math"],
      presets: [
        { name: "两数相加", config: { expr: "字段A + 字段B" } },
        { name: "两数相乘", config: { expr: "字段A * 字段B" } },
        { name: "百分比", config: { expr: "部分 / 总计 * 100" } },
      ],
    },
    aggregate: {
      name: "聚合统计",
      icon: "🧮",
      color: "var(--color-warning)",
      bg: "var(--color-warning-50)",
      category: "field",
      description: "对数据进行求和、求平均、计数等聚合运算",
      useCase: "适用场景：求总营业额、计算平均订单金额、统计订单数量、求最大最小值",
      detailedDesc: "对整列数据进行聚合计算，返回单个聚合结果。支持求和、平均、计数、最大值、最小值等多种聚合函数。",
      configFields: [
        { key: "func", label: "聚合函数", type: "select", required: true, hint: "聚合方式", options: ["sum", "avg", "count", "max", "min", "first", "last"] },
        { key: "column", label: "计算列", type: "select", required: false, hint: "要聚合的字段，count时不需要" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出结果的字段名" },
      ],
      examples: [
        { title: "总销售额", desc: 'func="sum", column="销售额"' },
        { title: "订单数量", desc: 'func="count"' },
        { title: "平均客单价", desc: 'func="avg", column="订单金额"' },
      ],
      notes: [
        "聚合后数据只有一行（聚合结果）",
        "需要分组聚合时使用「分组聚合」步骤",
        "count函数不需要指定列",
      ],
      relatedSteps: ["group", "formula", "runningTotal"],
      presets: [
        { name: "求和", config: { func: "sum" } },
        { name: "计数", config: { func: "count" } },
        { name: "平均值", config: { func: "avg" } },
        { name: "最大值", config: { func: "max" } },
        { name: "最小值", config: { func: "min" } },
      ],
    },
    group: {
      name: "分组聚合",
      icon: "🗂️",
      color: "var(--color-warning)",
      bg: "var(--color-warning-50)",
      category: "field",
      description: "按某个字段分组后对每组分别聚合",
      useCase: "适用场景：按店铺分组求和、按月份统计、按商品分类汇总、按地区统计",
      detailedDesc: "按指定字段进行分组，然后对每个分组内的数据分别进行聚合计算。类似Excel的数据透视表功能。",
      configFields: [
        { key: "column", label: "分组字段", type: "select", required: true, hint: "按哪个字段分组" },
        { key: "func", label: "聚合函数", type: "select", required: false, hint: "聚合方式", options: ["sum", "avg", "count", "max", "min"] },
        { key: "aggColumn", label: "聚合列", type: "select", required: false, hint: "要聚合的字段" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出结果的字段名" },
      ],
      examples: [
        { title: "按店铺汇总销售额", desc: 'column="店铺", func="sum", aggColumn="销售额"' },
        { title: "按月统计订单数", desc: 'column="月份", func="count"' },
        { title: "各品类平均单价", desc: 'column="品类", func="avg", aggColumn="单价"' },
      ],
      notes: [
        "分组后数据行数 = 分组的个数",
        "可以按多个字段分组（使用多个分组步骤串联）",
        "聚合结果列名可以自定义",
      ],
      relatedSteps: ["aggregate", "pivot", "sort"],
      presets: [
        { name: "分组求和", config: { func: "sum" } },
        { name: "分组计数", config: { func: "count" } },
        { name: "分组平均", config: { func: "avg" } },
      ],
    },
    select: {
      name: "选择列",
      icon: "📋",
      color: "var(--color-accent)",
      bg: "var(--color-accent-50)",
      category: "field",
      description: "选择/重排/保留指定的字段列",
      useCase: "适用场景：只保留需要的字段、调整字段顺序、删除不需要的列",
      detailedDesc: "只保留指定的字段列，并可调整字段顺序。用于精简数据、去除无关字段、调整输出顺序。",
      configFields: [
        { key: "columns", label: "保留的列", type: "multi-select", required: true, hint: "选择要保留的字段，按选择顺序排列" },
      ],
      examples: [
        { title: "只保留关键列", desc: 'columns=["订单号", "金额", "日期"]' },
      ],
      notes: [
        "未选择的字段会被移除",
        "字段顺序按选择顺序排列",
      ],
      relatedSteps: ["rename", "virtual", "distinct"],
      presets: [
        { name: "保留指定列", config: { columns: [] } },
      ],
    },
    rename: {
      name: "重命名字段",
      icon: "🏷️",
      color: "var(--color-accent)",
      bg: "var(--color-accent-50)",
      category: "field",
      description: "修改字段的名称",
      useCase: "适用场景：统一字段名、字段重命名、英文转中文",
      detailedDesc: "将指定字段重命名为新的名称。常用于统一不同表的字段名、将英文字段改为中文、使字段名更具可读性。",
      configFields: [
        { key: "column", label: "原字段名", type: "select", required: true, hint: "要重命名的字段" },
        { key: "newName", label: "新字段名", type: "text", required: true, hint: "新的字段名称" },
      ],
      examples: [
        { title: "英转中", desc: 'column="order_id", newName="订单号"' },
        { title: "统一命名", desc: 'column="销售额", newName="金额"' },
      ],
      notes: [
        "重命名后原字段名不再可用",
        "确保新字段名不与现有字段重复",
      ],
      relatedSteps: ["virtual", "select", "concat"],
      presets: [
        { name: "重命名字段", config: {} },
      ],
    },

    // ========== 数据转换类 (Transform) ==========
    round: {
      name: "数值取整",
      icon: "🔢",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "对数值进行四舍五入/向上/向下取整",
      useCase: "适用场景：金额保留2位小数、百分比保留整数、数量取整",
      detailedDesc: "对数值进行取整操作，支持四舍五入、向上取整、向下取整，可指定保留小数位数。",
      configFields: [
        { key: "column", label: "输入列", type: "select", required: true, hint: "要取整的数值字段" },
        { key: "decimals", label: "小数位数", type: "number", required: false, hint: "保留的小数位数，默认2位" },
        { key: "mode", label: "取整方式", type: "select", required: false, hint: "取整方式", options: ["round", "floor", "ceil"] },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名，留空覆盖原字段" },
      ],
      examples: [
        { title: "金额保留2位小数", desc: 'decimals=2, mode="round"' },
        { title: "向上取整", desc: 'mode="ceil", decimals=0，计算运费时常用' },
      ],
      notes: [
        "round：四舍五入，floor：向下取整，ceil：向上取整",
        "负数小数位会报错",
      ],
      relatedSteps: ["math", "formula", "virtual"],
      presets: [
        { name: "四舍五入2位", config: { decimals: "2", mode: "round" } },
        { name: "向下取整", config: { mode: "floor", decimals: "0" } },
        { name: "向上取整", config: { mode: "ceil", decimals: "0" } },
      ],
    },
    concat: {
      name: "字符串拼接",
      icon: "🧷",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "将多个文本字段拼接成一个字符串",
      useCase: "适用场景：拼接店铺全称、合并地址、生成唯一标识、组合名称",
      detailedDesc: "将多个字段的值按顺序拼接成一个字符串，可以指定分隔符。常用于生成组合键、完整地址、全称等。",
      configFields: [
        { key: "columns", label: "拼接字段", type: "multi-select", required: true, hint: "要拼接的字段列表，按顺序排列" },
        { key: "separator", label: "分隔符", type: "text", required: false, hint: "字段之间的分隔符，如 - 或 /" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "拼接完整姓名", desc: 'columns=["姓", "名"]' },
        { title: "生成订单编号", desc: 'columns=["前缀", "日期", "序号"], separator="-"' },
      ],
      notes: [
        "字段值为null或undefined时会转为空字符串",
        "分隔符可以是任意字符串，包括特殊字符",
      ],
      relatedSteps: ["substring", "replace", "virtual"],
      presets: [
        { name: "直接拼接", config: {} },
        { name: "用-连接", config: { separator: "-" } },
        { name: "用/连接", config: { separator: "/" } },
      ],
    },
    substring: {
      name: "字符串截取",
      icon: "✂️",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "从字符串中截取指定位置的部分内容",
      useCase: "适用场景：提取订单号后4位、获取手机号段、截取日期中的年月",
      detailedDesc: "从字符串的指定位置开始，截取指定长度的子串。位置从0开始计数。",
      configFields: [
        { key: "column", label: "源字段", type: "select", required: true, hint: "要截取的文本字段" },
        { key: "start", label: "起始位置", type: "number", required: false, hint: "从0开始的起始索引，默认0" },
        { key: "length", label: "截取长度", type: "number", required: false, hint: "要截取的字符数，默认到结尾" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "取前4位", desc: "start=0, length=4" },
        { title: "取后4位", desc: "start=-4，从倒数第4位开始" },
        { title: "提取年月", desc: 'column="日期", start=0, length=7，从"2024-01-15"提取"2024-01"' },
      ],
      notes: [
        "起始位置从0开始计数",
        "起始位置为负数时从末尾倒数",
        "超出字符串长度时返回到结尾",
      ],
      relatedSteps: ["concat", "replace", "stringExtract"],
      presets: [
        { name: "前10字符", config: { start: "0", length: "10" } },
        { name: "后4字符", config: { start: "-4" } },
      ],
    },
    lookup: {
      name: "查找替换",
      icon: "🔎",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "在数据中查找并替换指定值",
      useCase: "适用场景：批量替换店铺名、统一分类名称、修正错误数据、状态码转文字",
      detailedDesc: "根据映射关系，将字段中的值批量替换为新值。支持多对查找替换规则。",
      configFields: [
        { key: "column", label: "替换字段", type: "select", required: true, hint: "要进行替换的字段" },
        { key: "pairs", label: "替换映射", type: "pairs", required: true, hint: "查找值和替换值的映射对" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名，留空覆盖原字段" },
      ],
      examples: [
        { title: "店铺名统一", desc: '"天猫旗舰店"→"天猫", "京东自营"→"京东"' },
        { title: "状态码转文字", desc: '"1"→"已付款", "2"→"已发货", "3"→"已完成"' },
      ],
      notes: [
        "完全匹配才会替换",
        "可以添加多对替换规则",
        "没有匹配的值保持不变",
      ],
      relatedSteps: ["replace", "valueNormalize", "virtual"],
      presets: [
        { name: "简单替换", config: { pairs: [{ from: "", to: "" }] } },
      ],
    },
    date: {
      name: "日期转换",
      icon: "📅",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "对日期进行格式化或转换",
      useCase: "适用场景：日期格式化、提取年月、计算日期差、增减天数",
      detailedDesc: "对日期字段进行各种处理，包括格式转换、提取年/月/日、日期加减、计算日期间隔等。",
      configFields: [
        { key: "column", label: "日期字段", type: "select", required: true, hint: "要处理的日期字段" },
        { key: "operation", label: "操作类型", type: "select", required: false, hint: "日期操作类型", options: ["format", "extractYear", "extractMonth", "extractDay", "addDays"] },
        { key: "format", label: "输出格式", type: "text", required: false, hint: "格式化时的输出格式，如yyyy-mm-dd" },
        { key: "days", label: "天数", type: "number", required: false, hint: "增减天数时的天数" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "格式化日期", desc: 'operation="format", format="yyyy年mm月dd日"' },
        { title: "提取月份", desc: 'operation="extractMonth"' },
        { title: "日期加7天", desc: 'operation="addDays", days=7' },
      ],
      notes: [
        "支持的格式占位符：yyyy(年), mm(月), dd(日), HH(时), MM(分), SS(秒)",
        "日期格式不标准时可能解析失败",
      ],
      relatedSteps: ["math", "fill", "stringExtract"],
      presets: [
        { name: "格式化为yyyy-mm", config: { operation: "format", format: "yyyy-mm" } },
        { name: "提取年份", config: { operation: "extractYear" } },
        { name: "提取月份", config: { operation: "extractMonth" } },
      ],
    },
    math: {
      name: "数学运算",
      icon: "➕",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "执行加减乘除等基本数学运算",
      useCase: "适用场景：单价×数量=总价、计算差额、折扣计算、百分比计算",
      detailedDesc: "对字段执行简单的数学运算，支持加、减、乘、除等操作。复杂运算建议使用「公式计算」步骤。",
      configFields: [
        { key: "column", label: "输入列", type: "select", required: true, hint: "要运算的数值字段" },
        { key: "operation", label: "运算符", type: "select", required: false, hint: "运算类型", options: ["+", "-", "*", "/", "%"] },
        { key: "value", label: "运算值", type: "number", required: false, hint: "参与运算的数值" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名，留空覆盖原字段" },
      ],
      examples: [
        { title: "涨价10%", desc: 'operation="*", value=1.1' },
        { title: "打8折", desc: 'operation="*", value=0.8' },
        { title: "减100", desc: 'operation="-", value=100' },
      ],
      notes: [
        "除数为0时结果为0或报错",
        "复杂多字段运算建议使用「公式计算」",
      ],
      relatedSteps: ["formula", "round", "virtual"],
      presets: [
        { name: "加固定值", config: { operation: "+" } },
        { name: "乘倍数", config: { operation: "*" } },
        { name: "打8折", config: { operation: "*", value: "0.8" } },
      ],
    },
    stringExtract: {
      name: "字符串提取",
      icon: "🪡",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "使用正则或分隔符提取字符串片段",
      useCase: "适用场景：从地址提取省份、从文本提取数字、按分隔符拆分提取",
      detailedDesc: "从文本中提取指定的部分内容，支持正则表达式、按分隔符拆分、截取等多种提取方式。",
      configFields: [
        { key: "column", label: "源字段", type: "select", required: true, hint: "要提取的文本字段" },
        { key: "extractType", label: "提取方式", type: "select", required: false, hint: "提取方式", options: ["regex", "substring", "concat", "split", "trim", "upper", "lower"] },
        { key: "pattern", label: "正则表达式", type: "text", required: false, hint: "正则提取时的表达式" },
        { key: "separator", label: "分隔符", type: "text", required: false, hint: "按分隔符拆分时的分隔符" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "提取数字", desc: 'extractType="regex", pattern="\\d+"' },
        { title: "提取省份", desc: 'extractType="regex", pattern="^(.*?)省"' },
      ],
      notes: [
        "正则表达式需要符合JavaScript正则语法",
        "提取不到时返回空字符串",
      ],
      relatedSteps: ["substring", "concat", "replace"],
      presets: [
        { name: "提取数字", config: { extractType: "regex", pattern: "\\d+" } },
        { name: "按逗号拆分", config: { extractType: "split", separator: "," } },
      ],
    },
    fillNA: {
      name: "空值填充",
      icon: "🧯",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "将空值替换为指定值",
      useCase: "适用场景：缺失数据填充0、填充平均值、填充前一个值",
      detailedDesc: "将字段中的空值（null、undefined、空字符串）替换为指定的值。支持固定值、零值、平均值、中位数、前后填充等多种方式。",
      configFields: [
        { key: "column", label: "填充列", type: "select", required: true, hint: "要填充空值的字段" },
        { key: "fillType", label: "填充方式", type: "select", required: false, hint: "填充方式", options: ["value", "zero", "empty", "mean", "median", "mode", "forward", "backward"] },
        { key: "fillValue", label: "填充值", type: "text", required: false, hint: "固定值填充时的值" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名，留空覆盖原字段" },
      ],
      examples: [
        { title: "空值填0", desc: 'fillType="zero"' },
        { title: "空值填平均值", desc: 'fillType="mean"' },
        { title: "前向填充", desc: 'fillType="forward"，用上一个非空值填充' },
      ],
      notes: [
        "空值包括 null、undefined、空字符串",
        "平均值/中位数/众数填充需要字段为数值类型",
        "前后填充要求数据有顺序",
      ],
      relatedSteps: ["virtual", "valueNormalize", "lookup"],
      presets: [
        { name: "空值填0", config: { fillType: "zero" } },
        { name: "空值填空字符串", config: { fillType: "empty" } },
        { name: "固定值填充", config: { fillType: "value" } },
      ],
    },
    valueNormalize: {
      name: "值规范化",
      icon: "🔢",
      color: "var(--color-success)",
      bg: "var(--color-success-50)",
      category: "transform",
      description: "识别并转换多种格式的值为标准数字",
      useCase: "适用场景：将'100元'/'一百'/'¥99.9'等多种格式转换为纯数字",
      detailedDesc: "智能识别并转换各种格式的数值文本为标准数字。支持货币符号、中文数字、百分比、千分位等多种格式。",
      configFields: [
        { key: "column", label: "源字段", type: "select", required: true, hint: "需要规范化的字段" },
        { key: "rules", label: "转换规则", type: "array", required: true, hint: "转换规则列表" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "金额文本转数字", desc: '"¥1,234.56元" → 1234.56' },
        { title: "百分比转小数", desc: '"85%" → 0.85' },
      ],
      notes: [
        "支持多种货币符号自动识别",
        "支持中文数字（一到十、百、千、万等）",
        "转换失败时返回0或原值",
      ],
      relatedSteps: ["virtual", "fillNA", "math"],
      presets: [
        { name: "金额提取", config: {} },
      ],
    },
    binning: {
      name: "数据分箱",
      icon: "📦",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "将连续值分组到离散区间",
      useCase: "适用场景：金额分档(0-100/100-500/500+)、年龄段分组、分数评级",
      detailedDesc: "将连续的数值按区间分组，转换成离散的分类值。支持等宽分箱和自定义区间分箱。",
      configFields: [
        { key: "column", label: "分箱列", type: "select", required: true, hint: "要分箱的数值字段" },
        { key: "binType", label: "分箱方式", type: "select", required: false, hint: "分箱方式", options: ["equalWidth", "custom"] },
        { key: "binCount", label: "分箱数量", type: "number", required: false, hint: "等宽分箱时的箱数" },
        { key: "breaks", label: "分箱边界", type: "array", required: false, hint: "自定义分箱的边界值" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "金额分3档", desc: 'binType="equalWidth", binCount=3' },
        { title: "自定义年龄段", desc: 'breaks=[0, 18, 30, 45, 60, 100]' },
      ],
      notes: [
        "等宽分箱会自动计算最小值和最大值",
        "自定义分箱的边界值需要从小到大排列",
      ],
      relatedSteps: ["conditionalTag", "group", "formula"],
      presets: [
        { name: "等宽5箱", config: { binType: "equalWidth", binCount: "5" } },
      ],
    },
    conditionalTag: {
      name: "条件标记",
      icon: "🏷️",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "根据条件给数据打标签",
      useCase: "适用场景：高/中/低价值客户标记、风险等级标记、状态分类",
      detailedDesc: "根据多个条件规则，为数据打上不同的标签。支持多条件组合，按顺序匹配，第一个匹配的规则生效。",
      configFields: [
        { key: "conditions", label: "条件规则", type: "conditions", required: true, hint: "条件和标签的映射列表" },
        { key: "defaultTag", label: "默认标签", type: "text", required: false, hint: "都不满足时的默认标签" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "客户分层", desc: '消费>1000→"高价值", 消费>500→"中价值", 其他→"普通"' },
        { title: "风险等级", desc: '逾期>90天→"高风险", 逾期>30天→"中风险", 其他→"低风险"' },
      ],
      notes: [
        "条件按顺序匹配，第一个满足的条件生效",
        "最后建议设置默认标签",
      ],
      relatedSteps: ["condition", "filter", "binning"],
      presets: [
        { name: "三级分类", config: { conditions: [] } },
      ],
    },
    normalize: {
      name: "数据标准化",
      icon: "📐",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      category: "transform",
      description: "将数据缩放到统一范围",
      useCase: "适用场景：Min-Max归一化、Z-Score标准化、数据对比分析",
      detailedDesc: "将数值数据缩放到统一的尺度，消除量纲影响，便于不同指标之间的比较和加权计算。",
      configFields: [
        { key: "column", label: "标准化列", type: "select", required: true, hint: "要标准化的数值字段" },
        { key: "normType", label: "标准化方式", type: "select", required: false, hint: "标准化方法", options: ["minmax", "zscore", "decimal"] },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "0-1归一化", desc: 'normType="minmax"，将数据缩放到[0,1]区间' },
        { title: "Z-score标准化", desc: 'normType="zscore"，均值为0，标准差为1' },
      ],
      notes: [
        "Min-Max：将数据线性缩放到[0,1]",
        "Z-Score：标准化为均值0标准差1的正态分布",
        "数据有极端值时慎用Min-Max",
      ],
      relatedSteps: ["formula", "math", "aggregate"],
      presets: [
        { name: "0-1归一化", config: { normType: "minmax" } },
        { name: "Z-Score标准化", config: { normType: "zscore" } },
      ],
    },

    // ========== 高级操作类 (Advanced) ==========
    join: {
      name: "关联查询",
      icon: "🔗",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "按关联键将两个数据表合并为一个（类似SQL JOIN）",
      useCase: "适用场景：关联订单表与商品表、关联广告表与销售额、补充维度信息",
      detailedDesc: "根据关联键，将当前数据与另一个表进行关联，把另一个表的字段补充到当前数据中。支持左连接、内连接等多种关联方式。",
      configFields: [
        { key: "table", label: "关联表", type: "select", required: true, hint: "要关联的另一个数据表" },
        { key: "key", label: "主表关联键", type: "select", required: true, hint: "当前数据的关联字段" },
        { key: "fk", label: "从表关联键", type: "select", required: true, hint: "关联表的关联字段" },
        { key: "col", label: "目标列", type: "select", required: true, hint: "要从关联表获取的字段" },
        { key: "joinType", label: "关联类型", type: "select", required: false, hint: "关联方式", options: ["left", "inner", "right", "full"] },
      ],
      examples: [
        { title: "订单关联商品", desc: '订单表.商品ID = 商品表.商品ID，获取商品名称和分类' },
        { title: "广告关联销售", desc: '广告表.日期 = 销售表.日期，对比广告投入与产出' },
      ],
      notes: [
        "左连接(left)：保留主表所有行，未匹配的关联字段为空",
        "内连接(inner)：只保留两边都匹配的行",
        "关联键类型需要一致（都是数字或都是文本）",
      ],
      relatedSteps: ["crossMatch", "union", "lookup"],
      presets: [
        { name: "左连接", config: { joinType: "left" } },
        { name: "内连接", config: { joinType: "inner" } },
      ],
    },
    crossMatch: {
      name: "交叉匹配",
      icon: "✖️",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "交叉匹配两个数据集，支持交集/差集/半连接/反连接等多种模式",
      useCase: "适用场景：找出两表共有/独有的数据、用另一个表筛选、对比新旧数据",
      detailedDesc: "对比两个数据集，根据匹配模式返回不同的结果。支持交集、差集、存在筛选、不存在筛选、半连接、反连接等多种模式。",
      configFields: [
        { key: "mode", label: "匹配模式", type: "select", required: true, hint: "匹配方式", options: ["keepIntersection", "keepDifference", "keepExist", "keepNotExist", "mergeWithFilter", "semiJoin", "antiJoin", "removeDuplicates", "keepDuplicates"] },
        { key: "table", label: "对比表", type: "select", required: false, hint: "对比的另一个数据表" },
        { key: "columns", label: "匹配列", type: "multi-select", required: true, hint: "当前数据的匹配字段" },
        { key: "compareColumns", label: "对比表匹配列", type: "multi-select", required: false, hint: "对比表的匹配字段" },
      ],
      examples: [
        { title: "找共同客户", desc: 'mode="keepIntersection"，找出两个表都有的客户' },
        { title: "新增客户", desc: 'mode="keepDifference"，找出只在新表中有客户' },
        { title: "半连接筛选", desc: 'mode="semiJoin"，用另一个表的条件筛选当前数据' },
      ],
      notes: [
        "交集(keepIntersection)：返回两边都有的数据",
        "差集(keepDifference)：返回只在当前表中有的数据",
        "半连接(semiJoin)：只保留在对比表中能匹配到的行",
        "反连接(antiJoin)：只保留在对比表中匹配不到的行",
      ],
      relatedSteps: ["join", "union", "filter"],
      presets: [
        { name: "交集", config: { mode: "keepIntersection" } },
        { name: "差集", config: { mode: "keepDifference" } },
        { name: "半连接", config: { mode: "semiJoin" } },
        { name: "反连接", config: { mode: "antiJoin" } },
      ],
    },
    intersect: {
      name: "对比筛选（兼容）",
      icon: "🪞",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "对比两个数据集的交集或差集（已合并到交叉匹配能力，保留以兼容旧配置）",
      useCase: "适用场景：找出新增客户、对比新旧订单",
      detailedDesc: "对比两个数据集的交集或差集。此步骤已合并到「交叉匹配」的能力中，保留仅为兼容旧配置，新配置建议使用「交叉匹配」。",
      configFields: [
        { key: "mode", label: "模式", type: "select", required: false, hint: "对比模式" },
        { key: "table", label: "对比表", type: "select", required: false, hint: "对比的数据表" },
        { key: "key", label: "匹配键", type: "select", required: false, hint: "当前表匹配字段" },
        { key: "compareKey", label: "对比表匹配键", type: "select", required: false, hint: "对比表匹配字段" },
      ],
      examples: [
        { title: "找共同记录", desc: "交集模式，找出两边都有的数据" },
      ],
      notes: [
        "此步骤为兼容旧配置保留",
        "新配置建议使用功能更强大的「交叉匹配」步骤",
      ],
      relatedSteps: ["crossMatch", "join", "filter"],
      presets: [],
    },
    sort: {
      name: "排序",
      icon: "🔢",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "按指定字段升序或降序排列",
      useCase: "适用场景：按时间排序、按金额大小排序、按排名排序",
      detailedDesc: "按指定字段对数据进行排序，支持升序和降序。排序后可以配合「限制行数」取Top N。",
      configFields: [
        { key: "column", label: "排序字段", type: "select", required: true, hint: "按哪个字段排序" },
        { key: "direction", label: "排序方向", type: "select", required: false, hint: "升序或降序", options: ["asc", "desc"] },
      ],
      examples: [
        { title: "按金额从高到低", desc: 'column="金额", direction="desc"' },
        { title: "按日期从早到晚", desc: 'column="日期", direction="asc"' },
      ],
      notes: [
        "升序(asc)：从小到大，降序(desc)：从大到小",
        "多字段排序需要使用多个排序步骤串联",
        "文本排序按字典序",
      ],
      relatedSteps: ["limit", "rank", "group"],
      presets: [
        { name: "降序", config: { direction: "desc" } },
        { name: "升序", config: { direction: "asc" } },
      ],
    },
    rank: {
      name: "排名",
      icon: "🏆",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "对数据按某个字段生成排名序号",
      useCase: "适用场景：店铺销售排名、商品热度Top10、学生成绩排名",
      detailedDesc: "根据指定字段的值生成排名序号。支持普通排名、密集排名、行号等多种排名方式。",
      configFields: [
        { key: "column", label: "排名列", type: "select", required: true, hint: "按哪个字段排名" },
        { key: "direction", label: "排名方向", type: "select", required: false, hint: "排名方向", options: ["desc", "asc"] },
        { key: "rankType", label: "排名类型", type: "select", required: false, hint: "排名方式", options: ["rank", "denseRank", "rowNumber"] },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出排名字段名" },
      ],
      examples: [
        { title: "销售额排名", desc: 'column="销售额", direction="desc"' },
        { title: "成本排名", desc: 'column="成本", direction="asc"，成本越低排名越靠前' },
      ],
      notes: [
        "rank：标准排名，并列会跳号（1,1,3）",
        "denseRank：密集排名，并列不跳号（1,1,2）",
        "rowNumber：行号，即使值相同也连续编号（1,2,3）",
      ],
      relatedSteps: ["sort", "limit", "group"],
      presets: [
        { name: "标准排名", config: { rankType: "rank", direction: "desc" } },
        { name: "密集排名", config: { rankType: "denseRank", direction: "desc" } },
        { name: "行号", config: { rankType: "rowNumber" } },
      ],
    },
    runningTotal: {
      name: "累计计算",
      icon: "📈",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "按行累加计算累计值",
      useCase: "适用场景：累计销售额、累计订单数、库存结余、流水账",
      detailedDesc: "按顺序对数据进行累加计算，生成累计值。常用于累计销售额、累计用户数等需要看趋势累计的场景。",
      configFields: [
        { key: "column", label: "累计列", type: "select", required: true, hint: "要累计的数值字段" },
        { key: "orderColumn", label: "排序列", type: "select", required: false, hint: "按哪个字段排序后累计" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "累计销售额", desc: 'column="销售额", orderColumn="日期"' },
        { title: "累计订单数", desc: 'column="订单数"' },
      ],
      notes: [
        "累计依赖数据的顺序，建议先排序再累计",
        "如果有分组需求，建议先分组再累计",
      ],
      relatedSteps: ["sort", "percentOfTotal", "movingAverage"],
      presets: [
        { name: "累计求和", config: {} },
      ],
    },
    percentOfTotal: {
      name: "占比计算",
      icon: "📊",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "计算每行占总和的百分比",
      useCase: "适用场景：各店铺销售占比、各商品利润占比、各渠道流量占比",
      detailedDesc: "计算每行数据的指定字段值占该列总和的百分比。用于分析结构构成、各部分占比。",
      configFields: [
        { key: "column", label: "计算列", type: "select", required: true, hint: "要计算占比的字段" },
        { key: "asPercent", label: "百分比格式", type: "boolean", required: false, hint: "是否以百分比形式显示" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "各店铺销售占比", desc: 'column="销售额"，计算每个店铺占总销售额的比例' },
        { title: "各品类利润占比", desc: 'column="利润"，计算各品类利润占总利润的比例' },
      ],
      notes: [
        "总和为0时占比为0，避免除零错误",
        "可以选择输出小数(0.12)或百分比(12%)",
      ],
      relatedSteps: ["aggregate", "group", "formula"],
      presets: [
        { name: "占比（小数）", config: { asPercent: false } },
        { name: "占比（百分比）", config: { asPercent: true } },
      ],
    },
    movingAverage: {
      name: "移动平均",
      icon: "〰️",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "按滑动窗口计算移动平均值",
      useCase: "适用场景：7日移动平均销售额、平滑波动数据、趋势分析",
      detailedDesc: "按指定的窗口大小计算移动平均值，用于平滑数据波动、观察长期趋势。窗口可以向前、向后或居中。",
      configFields: [
        { key: "column", label: "计算列", type: "select", required: true, hint: "要计算移动平均的字段" },
        { key: "windowSize", label: "窗口大小", type: "number", required: true, hint: "滑动窗口的大小" },
        { key: "targetColumn", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "7日移动平均", desc: "windowSize=7，计算最近7天的平均值" },
        { title: "30日移动平均", desc: "windowSize=30，月均趋势线" },
      ],
      notes: [
        "窗口越大，曲线越平滑，但滞后性越强",
        "前N-1行数据窗口不足，可能用部分数据计算或返回空",
        "数据需要先排序",
      ],
      relatedSteps: ["runningTotal", "sort", "formula"],
      presets: [
        { name: "7日移动平均", config: { windowSize: "7" } },
        { name: "30日移动平均", config: { windowSize: "30" } },
      ],
    },
    diff: {
      name: "差值计算",
      icon: "➖",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "计算两列数据之差",
      useCase: "适用场景：销售额-成本=利润、本期-上期=增量、预算-实际=差额",
      detailedDesc: "计算两个数值字段的差值。可以选择以百分比形式显示差异率。",
      configFields: [
        { key: "column", label: "当前列", type: "select", required: true, hint: "被减数字段" },
        { key: "baseColumn", label: "基准列", type: "select", required: true, hint: "减数字段" },
        { key: "percent", label: "百分比", type: "boolean", required: false, hint: "是否计算百分比差值" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "利润", desc: 'column="收入", baseColumn="成本"' },
        { title: "增长率", desc: 'column="本期", baseColumn="上期", percent=true' },
      ],
      notes: [
        "结果 = 当前列 - 基准列",
        "百分比模式下，结果 = (当前列 - 基准列) / 基准列 * 100%",
        "基准列为0时百分比结果为0",
      ],
      relatedSteps: ["ratio", "formula", "math"],
      presets: [
        { name: "绝对差值", config: { percent: false } },
        { name: "百分比差值", config: { percent: true } },
      ],
    },
    ratio: {
      name: "比率计算",
      icon: "📊",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      category: "advanced",
      description: "计算两个数值的比率",
      useCase: "适用场景：利润率、增长率、完成率、转化率",
      detailedDesc: "计算两个数值的比率（分子/分母）。可以选择以百分比形式显示。",
      configFields: [
        { key: "numerator", label: "分子", type: "select", required: true, hint: "分子字段" },
        { key: "denominator", label: "分母", type: "select", required: true, hint: "分母字段" },
        { key: "percent", label: "百分比", type: "boolean", required: false, hint: "是否乘以100以百分比显示" },
        { key: "target", label: "目标字段", type: "text", required: false, hint: "输出字段名" },
      ],
      examples: [
        { title: "利润率", desc: 'numerator="利润", denominator="销售额"' },
        { title: "完成率", desc: 'numerator="实际", denominator="目标", percent=true' },
      ],
      notes: [
        "结果 = 分子 / 分母",
        "分母为0时结果为0，避免除零错误",
        "百分比模式下结果乘以100",
      ],
      relatedSteps: ["diff", "formula", "percentOfTotal"],
      presets: [
        { name: "比率（小数）", config: { percent: false } },
        { name: "比率（百分比）", config: { percent: true } },
      ],
    },
  };

  // ==================== 步骤分类系统 ====================
  const STEP_TYPE_CATEGORIES = {
    source: {
      label: "数据源",
      shortLabel: "Source",
      icon: "📥",
      color: "var(--color-primary)",
      bg: "var(--color-primary-50)",
      description: "数据从哪里来 - 获取和准备原始数据",
      detailedDesc: "用于获取原始数据、填充默认值、合并多表数据。这是计算流程的起点，所有计算都从数据源开始。",
      types: ["source", "fill", "constant", "text", "union"],
    },
    filter: {
      label: "数据筛选",
      shortLabel: "Filter",
      icon: "🔍",
      color: "var(--color-info)",
      bg: "var(--color-info-50)",
      description: "保留哪些数据 - 过滤和筛选数据范围",
      detailedDesc: "用于筛选数据行、去重、限制行数、条件判断。帮助你从大量数据中快速找到需要的部分。",
      types: ["filter", "distinct", "condition", "limit", "keepDuplicate", "keepUnique"],
    },
    field: {
      label: "字段处理",
      shortLabel: "Field",
      icon: "📋",
      color: "var(--color-accent)",
      bg: "var(--color-accent-50)",
      description: "字段怎么变 - 选择、计算、聚合字段",
      detailedDesc: "用于字段级别的操作，包括选择列、重命名、创建计算字段、公式计算、分组聚合等。",
      types: ["virtual", "formula", "aggregate", "group", "select", "rename"],
    },
    transform: {
      label: "数据转换",
      shortLabel: "Transform",
      icon: "🔄",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      description: "数据怎么转 - 格式转换和数据清洗",
      detailedDesc: "用于数据格式转换和清洗，包括数值取整、字符串处理、日期转换、空值填充、数据标准化等。",
      types: ["round", "concat", "substring", "lookup", "date", "math", "stringExtract", "fillNA", "valueNormalize", "binning", "conditionalTag", "normalize"],
    },
    advanced: {
      label: "高级操作",
      shortLabel: "Advanced",
      icon: "⚡",
      color: "var(--color-warning)",
      bg: "var(--color-warning-50)",
      description: "复杂操作 - 关联、排序、排名、窗口函数",
      detailedDesc: "用于复杂的数据操作，包括多表关联、排序、排名、累计计算、移动平均、交叉匹配等高级功能。",
      types: ["join", "crossMatch", "intersect", "sort", "rank", "runningTotal", "percentOfTotal", "movingAverage", "diff", "ratio"],
    },
    output: {
      label: "输出处理",
      shortLabel: "Output",
      icon: "📤",
      color: "var(--color-success)",
      bg: "var(--color-success-50)",
      description: "最终输出 - 结果展示和导出",
      detailedDesc: "用于控制数据的最终输出格式和展示方式。",
      types: [],
    },
  };

  // ==================== 获取步骤类型信息 ====================
  const getStepTypeInfo = function(type) {
    const detail = STEP_TYPE_DETAILS[type];
    if (detail) {
      return {
        name: detail.name,
        icon: detail.icon,
        color: detail.color,
        bg: detail.bg,
        category: detail.category,
        description: detail.description,
        useCase: detail.useCase,
        detailedDesc: detail.detailedDesc,
        desc: detail.description,
      };
    }
    return {
      name: type,
      icon: "⚙️",
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
      description: "",
      useCase: "",
      detailedDesc: "",
      desc: "",
    };
  };

  // ==================== 获取步骤详细配置字段 ====================
  const getStepConfigFields = function(type) {
    const detail = STEP_TYPE_DETAILS[type];
    return detail ? detail.configFields || [] : [];
  };

  // ==================== 获取步骤使用示例 ====================
  const getStepExamples = function(type) {
    const detail = STEP_TYPE_DETAILS[type];
    return detail ? detail.examples || [] : [];
  };

  // ==================== 获取步骤注意事项 ====================
  const getStepNotes = function(type) {
    const detail = STEP_TYPE_DETAILS[type];
    return detail ? detail.notes || [] : [];
  };

  // ==================== 获取相关步骤 ====================
  const getRelatedSteps = function(type) {
    const detail = STEP_TYPE_DETAILS[type];
    return detail ? detail.relatedSteps || [] : [];
  };

  // ==================== 获取步骤预设 ====================
  const getStepPresets = function(type) {
    const detail = STEP_TYPE_DETAILS[type];
    return detail ? detail.presets || [] : [];
  };

  // ==================== 获取分类信息 ====================
  const getCategoryInfo = function(cat) {
    const category = STEP_TYPE_CATEGORIES[cat];
    if (category) {
      return {
        name: category.label,
        icon: category.icon,
        color: category.color,
        bg: category.bg,
        description: category.description,
        detailedDesc: category.detailedDesc,
      };
    }
    const map = {
      sales: { name: "销售类", icon: "💰", color: "var(--color-success)" },
      cost: { name: "成本类", icon: "🧾", color: "var(--color-warning)" },
      profit: { name: "利润类", icon: "📈", color: "var(--color-primary)" },
    };
    return map[cat] || { name: cat, icon: "📦", color: "var(--color-text-tertiary)" };
  };

  // ==================== 校验步骤 ====================
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
      case "intersect": {
        const matchColumns = cfg.columns && cfg.columns.length > 0
          ? cfg.columns
          : (cfg.key ? [cfg.key] : []);
        const cmpColumns = cfg.compareColumns && cfg.compareColumns.length > 0
          ? cfg.compareColumns
          : (cfg.compareKey ? [cfg.compareKey] : []);
        if (!matchColumns || matchColumns.length === 0) return { valid: false, message: "请填写匹配列" };
        if (cfg.mode === "keepIntersection" || cfg.mode === "keepDifference" || cfg.mode === "keepExist" || cfg.mode === "keepNotExist" || cfg.mode === "mergeWithFilter" || cfg.mode === "semiJoin" || cfg.mode === "antiJoin") {
          if (!cfg.table) return { valid: false, message: "请选择对比表" };
          if (!cmpColumns || cmpColumns.length === 0) return { valid: false, message: "请填写对比表匹配列" };
        }
        if ((cfg.mode === "semiJoin" || cfg.mode === "antiJoin") && cfg.selfFilterColumn && (cfg.selfFilterValue === undefined || cfg.selfFilterValue === "") && cfg.selfFilterOp !== "isEmpty" && cfg.selfFilterOp !== "notEmpty") {
          return { valid: false, message: "请填写当前数据筛选值" };
        }
        return { valid: true, message: "配置完整" };
      }
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

  // ==================== 获取步骤提示 ====================
  const getStepHint = function(step, rule, field) {
    if (!step) return null;
    const hints = [];
    const semanticType = (field && field.semanticType) || "";
    const stepIdx = (rule && rule.steps ? rule.steps.findIndex((s) => s.id === step.id) : -1) ?? -1;
    if (stepIdx === 0 && step.type === "source") {
      if (semanticType === "shop" || semanticType === "year" || semanticType === "month") {
        hints.push({ type: "info", text: "💡 该字段为占位符，建议使用「填充数据」步骤，无需数据源" });
      }
    }
    if (stepIdx === 0 && step.type === "fill" && (semanticType === "value" || !semanticType)) {
      if (field && field.type === "value") {
        hints.push({ type: "warning", text: "💡 数值字段建议从「数据源」步骤开始配置" });
      }
    }
    if (step.type === "source" && stepIdx > 0 && rule && rule.steps && rule.steps[0] && rule.steps[0].type === "source") {
      hints.push({ type: "warning", text: "⚠ 已有数据源步骤，第二个数据源通常需要「关联查询」配合使用" });
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

  // ==================== 摘要步骤 ====================
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
      case "crossMatch": {
        const modeNames = {
          keepIntersection: "交集",
          keepDifference: "差集",
          keepExist: "存在于对比表",
          keepNotExist: "不存在于对比表",
          mergeWithFilter: "合并筛选",
          semiJoin: "半连接",
          antiJoin: "反连接",
          removeDuplicates: "去重",
          keepDuplicates: "保留重复",
        };
        const matchCols = c.columns && c.columns.length > 0 ? c.columns : (c.key ? [c.key] : []);
        return `${modeNames[c.mode] || c.mode}: ${matchCols.join(",")}${c.table ? ` / ${c.table}` : ""}`;
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

  // ==================== 暴露到全局 ====================
  window.RulesStepMeta = {
    getStepTypeInfo,
    STEP_TYPE_CATEGORIES,
    STEP_TYPE_DETAILS,
    validateStep,
    getStepHint,
    getCategoryInfo,
    summarizeStep,
    getStepConfigFields,
    getStepExamples,
    getStepNotes,
    getRelatedSteps,
    getStepPresets,
  };
})();
