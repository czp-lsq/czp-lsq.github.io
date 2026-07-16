const STEP_TYPES = {
  source: { name: "数据源", desc: "选择要计算的数据表", icon: Icons.Database, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "input" },
  fill: { name: "填充占位符", desc: "自动填充日期、店铺名等", icon: Icons.Edit3, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "input" },
  constant: { name: "常量值", desc: "使用固定数值", icon: Icons.FileText, color: "var(--color-text-tertiary)", bg: "var(--color-bg-tertiary)", category: "input" },
  filter: { name: "筛选", desc: "按条件筛选数据行", icon: Icons.Filter, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  filterEqual: { name: "等于筛选", desc: "筛选出等于指定值的行", icon: Icons.Filter, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  filterContain: { name: "包含筛选", desc: "筛选出包含指定文本的行", icon: Icons.Search, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  filterRange: { name: "范围筛选", desc: "筛选数值在指定范围内的行", icon: Icons.BarChart3, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  topN: { name: "前N行筛选", desc: "只保留前N条数据", icon: Icons.FileText, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  distinct: { name: "去重", desc: "移除重复数据行", icon: Icons.Filter, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  condition: { name: "条件判断", desc: "根据条件返回不同值", icon: Icons.Sparkles, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "filter" },
  limit: { name: "限制", desc: "限制输出数据行数", icon: Icons.FileText, color: "var(--color-text-tertiary)", bg: "var(--color-bg-tertiary)", category: "filter" },
  virtual: { name: "虚拟字段", desc: "转换、提取、计算字段值", icon: Icons.Sparkles, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "transform" },
  lookup: { name: "查找替换", desc: "按映射表替换值", icon: Icons.Search, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "transform" },
  sort: { name: "排序", desc: "按列升序或降序排列", icon: Icons.Layers, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "transform" },
  text: { name: "文本处理", desc: "拼接、截取、格式化文本", icon: Icons.FileText, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "transform" },
  round: { name: "四舍五入", desc: "保留指定小数位数", icon: Icons.Sparkles, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "transform" },
  concat: { name: "字符串拼接", desc: "将多个字段合并为文本", icon: Icons.FileText, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "transform" },
  substring: { name: "字符串截取", desc: "提取字符串的指定部分", icon: Icons.FileText, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "transform" },
  date: { name: "日期处理", desc: "格式化、提取日期组件", icon: Icons.Clock, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "transform" },
  math: { name: "数学运算", desc: "加减乘除、幂次方等运算", icon: Icons.Calculator, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  aggregate: { name: "聚合", desc: "求和、平均、最大最小值等", icon: Icons.Calculator, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  group: { name: "分组聚合", desc: "按列分组后聚合计算", icon: Icons.Calculator, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  formula: { name: "公式计算", desc: "自定义数学公式计算", icon: Icons.Calculator, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "compute" },
  rank: { name: "排名计算", desc: "计算数据行的排名", icon: Icons.BarChart3, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "compute" },
  diff: { name: "差值计算", desc: "计算与基准值的差异", icon: Icons.ArrowUpDown, color: "var(--color-danger)", bg: "var(--color-danger-bg)", category: "compute" },
  ratio: { name: "比率计算", desc: "计算两个值的比率", icon: Icons.PieChart, color: "var(--color-accent)", bg: "var(--color-info-bg)", category: "compute" },
  join: { name: "跨表关联", desc: "关联全局数据表获取数据", icon: Icons.Layers, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "join" },
  union: { name: "数据合并", desc: "合并多个数据表", icon: Icons.Layers, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "join" },
  keepDuplicate: { name: "保留重复行", desc: "按列筛选出重复的数据行", icon: Icons.Filter, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "filter" },
  keepUnique: { name: "保留唯一行", desc: "按列筛选出不重复的数据行", icon: Icons.Filter, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "filter" },
  intersect: { name: "两表对比筛选", desc: "与另一表对比，保留匹配/不匹配的行", icon: Icons.Layers, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "join" },
  crossMatch: { name: "跨表重复/交集", desc: "按多列与另一表取交集、差集，或多列去重/保留重复", icon: Icons.Layers, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "join" },
  runningTotal: { name: "累计求和", desc: "按顺序计算累计值", icon: Icons.BarChart3, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  percentOfTotal: { name: "占比计算", desc: "计算每个值占总值的百分比或比例", icon: Icons.PieChart, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "compute" },
  movingAverage: { name: "移动平均", desc: "按窗口大小计算移动平均值", icon: Icons.BarChart3, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "compute" },
  binning: { name: "数据分箱", desc: "将连续值按区间分组", icon: Icons.Grid, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "transform" },
  conditionalTag: { name: "条件标记", desc: "根据条件添加标签列", icon: Icons.Tag, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "transform" },
  stringExtract: { name: "字符串提取", desc: "正则提取、截取、拼接等", icon: Icons.FileText, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "transform" },
  fillNA: { name: "空值填充", desc: "支持多种填充策略", icon: Icons.Droplet, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "transform" },
  normalize: { name: "数据标准化", desc: "最小最大标准化、Z-score", icon: Icons.Minimize2, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "compute" },
  cumulativeMax: { name: "累计最大", desc: "按顺序计算累计最大值", icon: Icons.Maximize2, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  cumulativeMin: { name: "累计最小", desc: "按顺序计算累计最小值", icon: Icons.Minimize2, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "compute" },
  lag: { name: "滞后值", desc: "获取前N行的值", icon: Icons.ArrowLeft, color: "var(--color-danger)", bg: "var(--color-danger-bg)", category: "compute" },
  lead: { name: "领先值", desc: "获取后N行的值", icon: Icons.ArrowRight, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  percentRank: { name: "百分比排名", desc: "计算值在数据集中的百分比位置", icon: Icons.PieChart, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "compute" },
  rankDense: { name: "稠密排名", desc: "无间隔排名，相同值相同排名", icon: Icons.BarChart3, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "compute" },
  rankRowNumber: { name: "行号排名", desc: "连续行号，相同值不同排名", icon: Icons.List, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "compute" },
  windowSum: { name: "窗口求和", desc: "在滑动窗口内求和", icon: Icons.Calculator, color: "var(--color-success)", bg: "var(--color-success-bg)", category: "compute" },
  windowAvg: { name: "窗口平均", desc: "在滑动窗口内计算平均值", icon: Icons.Calculator, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "compute" },
  jsonExtract: { name: "JSON提取", desc: "从JSON字符串中提取字段", icon: Icons.Braces, color: "var(--color-accent)", bg: "var(--color-accent-100)", category: "transform" },
  regexReplace: { name: "正则替换", desc: "使用正则表达式替换文本", icon: Icons.Search, color: "var(--color-warning)", bg: "var(--color-warning-bg)", category: "transform" },
  trim: { name: "去除空格", desc: "去除字符串首尾空格或指定字符", icon: Icons.FileText, color: "var(--color-info)", bg: "var(--color-info-bg)", category: "transform" },
  upperCase: { name: "转大写", desc: "将字符串转换为大写", icon: Icons.FileText, color: "var(--color-text-tertiary)", bg: "var(--color-bg-tertiary)", category: "transform" },
  lowerCase: { name: "转小写", desc: "将字符串转换为小写", icon: Icons.FileText, color: "var(--color-text-tertiary)", bg: "var(--color-bg-tertiary)", category: "transform" },
  dateDiff: { name: "日期差值", desc: "计算两个日期之间的天数/月数/年数", icon: Icons.Clock, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "compute" },
  dateAdd: { name: "日期增减", desc: "对日期进行加减操作", icon: Icons.Clock, color: "var(--color-primary)", bg: "var(--color-primary-50)", category: "transform" },
};

const STEP_PREVIEWS = {
  source: { scenario: "选择数据来源", example: "从已上传的「账务明细」中读取本月数据", config: "数据表：账务2月明细 → 全部列" },
  fill: { scenario: "自动填充占位符", example: "店铺列、日期列无需手动填写", config: "填充方式：店铺名 / 日期 / 文本" },
  constant: { scenario: "使用固定数值", example: "税率固定 0.06", config: "常量值：6" },
  filter: { scenario: "按条件筛选", example: "仅保留「已付款」订单", config: "列：状态  运算：等于  值：已付款" },
  filterEqual: { scenario: "精确匹配", example: "仅保留店铺A的记录", config: "列：店铺 = 「店铺A」" },
  filterContain: { scenario: "模糊匹配", example: "保留所有「推广」相关记录", config: "列：渠道  包含：「推广」" },
  filterRange: { scenario: "区间筛选", example: "金额在 100~1000 之间", config: "列：金额  范围：100 ~ 1000" },
  topN: { scenario: "保留前N行", example: "取销售额前10的店铺", config: "按销售额降序 → 取10条" },
  distinct: { scenario: "去重", example: "每个店铺仅保留第一条", config: "按店铺去重" },
  condition: { scenario: "条件判断返回不同值", example: "金额>0 显示「收入」否则「退款」", config: "IF(金额>0, 收入, 退款)" },
  limit: { scenario: "限制行数", example: "只显示前100条用于预览", config: "限制：100 行" },
  virtual: { scenario: "提取/转换字段值", example: "从「尺码:XL/XXL」中提取「XL」", config: "目标列：尺码  规则：正则" },
  lookup: { scenario: "按映射表替换", example: "把店铺A→门店1，店铺B→门店2", config: "原值 → 目标值 映射表" },
  sort: { scenario: "排序", example: "按日期升序排列", config: "列：日期  顺序：升序" },
  text: { scenario: "文本处理", example: "拼接店铺+月份生成标识", config: "文本函数 / 拼接表达式" },
  round: { scenario: "四舍五入", example: "金额保留2位小数", config: "列：金额 → 保留2位" },
  concat: { scenario: "字符串拼接", example: "店铺 + \"_\" + 月份", config: "字段1 + 字符 + 字段2" },
  substring: { scenario: "字符串截取", example: "取订单号前6位", config: "列：订单号  起始：0  长度：6" },
  date: { scenario: "日期格式化", example: "提取日期的「月」", config: "列：日期 → 提取月份" },
  math: { scenario: "数学运算", example: "金额 = 数量 × 单价", config: "表达式：{数量} * {单价}" },
  aggregate: { scenario: "聚合统计", example: "求所有金额的总和", config: "列：金额 → 求和" },
  group: { scenario: "分组聚合", example: "按店铺汇总金额", config: "分组：店铺  聚合：金额求和" },
  formula: { scenario: "自定义公式", example: "利润 = 收入 - 成本 - 费用", config: "{收入} - {成本} - {费用}" },
  rank: { scenario: "排名", example: "店铺按销售额排名", config: "列：销售额 → 降序" },
  diff: { scenario: "差值计算", example: "本月 - 上月 = 增长", config: "基准列：上月销售额" },
  ratio: { scenario: "比率", example: "利润 / 收入 = 利润率", config: "分子：{利润}  分母：{收入}" },
  join: { scenario: "关联全局表", example: "通过款号关联成本表", config: "本表：款号  外部表：成本表 → 匹配" },
  union: { scenario: "合并多表", example: "把1月和2月订单合并", config: "源表1 + 源表2" },
  keepDuplicate: { scenario: "保留重复行", example: "找出出现多次的款号", config: "列：款号 → 保留重复" },
  keepUnique: { scenario: "保留唯一行", example: "移除重复的款号", config: "列：款号 → 保留唯一" },
  intersect: { scenario: "两表对比", example: "保留两表都有的订单", config: "匹配列：订单号" },
  crossMatch: { scenario: "跨表匹配", example: "找出同时出现的商品", config: "本表：款号  外部表：款号" },
  runningTotal: { scenario: "累计求和", example: "每日销售额累加", config: "列：金额 → 累计" },
  percentOfTotal: { scenario: "占比", example: "每个店铺占总销售的比例", config: "列：金额 → 占总 %" },
  movingAverage: { scenario: "移动平均", example: "最近7天销售额均值", config: "窗口：7天" },
  binning: { scenario: "数据分箱", example: "金额分箱：0-100/100-500/500+", config: "区间列表 + 标签" },
  conditionalTag: { scenario: "条件标记", example: "金额>1000 标记「高客单」", config: "条件 + 标签" },
  stringExtract: { scenario: "字符串提取", example: "从规格中提取尺码", config: "正则：/尺码:(\\w+)/" },
  fillNA: { scenario: "空值填充", example: "空金额填0", config: "列：金额 → 填0" },
  normalize: { scenario: "数据标准化", example: "金额缩放到 0~1", config: "方式：min-max / z-score" },
  regexReplace: { scenario: "正则替换", example: "去掉手机号中的横线", config: "正则：/-/g  替换：''" },
  trim: { scenario: "去除空格", example: "清理用户输入的首尾空格", config: "列：备注 → trim" },
};

const getStepTypeInfo = (type) => {
  const info = STEP_TYPES[type];
  if (!info) {
    return {
      name: type,
      icon: Icons.Settings,
      color: "var(--color-text-tertiary)",
      bg: "var(--color-bg-tertiary)",
    };
  }
  return {
    ...info,
    icon: React.createElement(info.icon, null),
  };
};

const getStepTypePreview = (type) => {
  return STEP_PREVIEWS[type] || { scenario: type, example: "配置此步骤", config: "暂无预览" };
};

const getCategorySteps = (category) => {
  return Object.entries(STEP_TYPES)
    .filter(([_, info]) => info.category === category)
    .map(([type, info]) => ({ type, ...info }));
};

const getStepCategories = () => [
  { id: "input", name: "数据输入", icon: Icons.Database },
  { id: "filter", name: "数据筛选", icon: Icons.Filter },
  { id: "transform", name: "数据转换", icon: Icons.Sparkles },
  { id: "compute", name: "计算分析", icon: Icons.Calculator },
  { id: "join", name: "跨表关联", icon: Icons.Layers },
];

window.StepTypes = {
  getStepTypeInfo,
  getStepTypePreview,
  getCategorySteps,
  getStepCategories,
};
