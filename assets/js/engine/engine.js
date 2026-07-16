// engine/engine.js - 计算引擎主入口 (CalcEngine)
const CalcEngine = {
  extractDateFromFileName: (fileName) => window.DateUtils.extractDateFromFileName(fileName),
  extractDateFromData: (tables) => window.DateUtils.extractDateFromData(tables),
  exec(rule, tables, context = {}) {
    if (!rule || !rule.steps || rule.steps.length === 0) return null;
    let data = [];
    const stepResults = [];
    const externals = context.externals || [];
    let dataDate = null;
    const fileName = context.fileName || context.originalName || "";
    if (fileName) {
      dataDate = this.extractDateFromFileName(fileName);
    }
    if (!dataDate && tables && tables.length > 0) {
      dataDate = this.extractDateFromData(tables);
    }
    if (!dataDate) {
      const now = new Date();
      dataDate = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };
    }
    const _chineseToNumber = EngineUtils.chineseToNumber.bind(EngineUtils);
    const _applyRowFilter = EngineUtils.applyRowFilter.bind(EngineUtils);
    const _applyOutputFormat = EngineUtils.formatValue.bind(EngineUtils);
    for (let stepIdx = 0; stepIdx < rule.steps.length; stepIdx++) {
      const step = rule.steps[stepIdx];
      try {
        switch (step.type) {
          case "fill":
            data = DataSourceSteps.fill(step, data, dataDate, context);
            break;
          case "source":
            data = DataSourceSteps.source(step, tables);
            break;
          case "union":
            data = DataSourceSteps.union(step, data, tables);
            break;
          case "filter":
            data = FilterSteps.filter(step, data);
            break;
          case "filterEqual":
            data = FilterSteps.filterEqual(step, data);
            break;
          case "filterContain":
            data = FilterSteps.filterContain(step, data);
            break;
          case "filterRange":
            data = FilterSteps.filterRange(step, data);
            break;
          case "keepDuplicate":
            data = FilterSteps.keepDuplicate(step, data);
            break;
          case "keepUnique":
            data = FilterSteps.keepUnique(step, data);
            break;
          case "distinct":
            data = FilterSteps.distinct(step, data);
            break;
          case "virtual":
            step.config.context = context;
            data = TransformSteps.virtual(step, data, _chineseToNumber);
            break;
          case "concat":
            data = TransformSteps.concat(step, data);
            break;
          case "substring":
            data = TransformSteps.substring(step, data);
            break;
          case "trim":
            data = TransformSteps.trim(step, data);
            break;
          case "upperCase":
            data = TransformSteps.upperCase(step, data);
            break;
          case "lowerCase":
            data = TransformSteps.lowerCase(step, data);
            break;
          case "regexReplace":
            data = TransformSteps.regexReplace(step, data);
            break;
          case "stringExtract":
            data = TransformSteps.stringExtract(step, data);
            break;
          case "aggregate":
            data = AggregateSteps.aggregate(step, data);
            break;
          case "group":
            data = AggregateSteps.group(step, data);
            break;
          case "date":
            data = DateSteps.date(step, data);
            break;
          case "dateDiff":
            data = DateSteps.dateDiff(step, data);
            break;
          case "dateAdd":
            data = DateSteps.dateAdd(step, data);
            break;
          case "math":
            data = MathSteps.math(step, data);
            break;
          case "round":
            data = MathSteps.round(step, data);
            break;
          case "diff":
            data = MathSteps.diff(step, data);
            break;
          case "ratio":
            data = MathSteps.ratio(step, data);
            break;
          case "percentOfTotal":
            data = MathSteps.percentOfTotal(step, data);
            break;
          case "normalize":
            data = MathSteps.normalize(step, data);
            break;
          case "runningTotal":
            data = WindowSteps.runningTotal(step, data);
            break;
          case "movingAverage":
            data = WindowSteps.movingAverage(step, data);
            break;
          case "cumulativeMax":
            data = WindowSteps.cumulativeMax(step, data);
            break;
          case "cumulativeMin":
            data = WindowSteps.cumulativeMin(step, data);
            break;
          case "lag":
            data = WindowSteps.lag(step, data);
            break;
          case "lead":
            data = WindowSteps.lead(step, data);
            break;
          case "windowSum":
            data = WindowSteps.windowSum(step, data);
            break;
          case "windowAvg":
            data = WindowSteps.windowAvg(step, data);
            break;
          case "rank":
            data = RankSteps.rank(step, data);
            break;
          case "percentRank":
            data = RankSteps.percentRank(step, data);
            break;
          case "rankDense":
            data = RankSteps.rankDense(step, data);
            break;
          case "rankRowNumber":
            data = RankSteps.rankRowNumber(step, data);
            break;
          case "topN":
            data = RankSteps.topN(step, data);
            break;
          case "join":
            data = OtherSteps.join(step, data, tables, externals);
            break;
          case "crossMatch":
            data = OtherSteps.crossMatch(step, data, tables, _applyRowFilter);
            break;
          case "intersect":
            data = OtherSteps.intersect(step, data, tables, _applyRowFilter);
            break;
          case "formula":
            data = OtherSteps.formula(step, data, context, _applyOutputFormat);
            break;
          case "constant":
            data = OtherSteps.constant(step);
            break;
          case "text":
            data = OtherSteps.text(step, data, context);
            break;
          case "sort":
            data = OtherSteps.sort(step, data);
            break;
          case "limit":
            data = OtherSteps.limit(step, data);
            break;
          case "lookup":
            data = OtherSteps.lookup(step, data);
            break;
          case "condition":
            data = OtherSteps.condition(step, data);
            break;
          case "binning":
            data = OtherSteps.binning(step, data);
            break;
          case "conditionalTag":
            data = OtherSteps.conditionalTag(step, data);
            break;
          case "fillNA":
            data = OtherSteps.fillNA(step, data);
            break;
          case "valueNormalize":
            data = OtherSteps.valueNormalize(step, data);
            break;
          case "jsonExtract":
            data = OtherSteps.jsonExtract(step, data);
            break;
        }
        stepResults.push({
          step: stepIdx,
          type: step.type,
          stepConfig: step.config,
          rows: data.length,
          prevRows: stepIdx > 0 ? (stepResults[stepIdx - 1]?.rows || 0) : 0,
          columns: (() => {
            const colSet = new Set();
            data.slice(0, 20).forEach((row) => {
              if (row && typeof row === "object") Object.keys(row).forEach((k) => { if (!k.startsWith("_")) colSet.add(k); });
            });
            return Array.from(colSet);
          })(),
          preview: data.slice(0, 5),
          stats: {
            inputRows: stepIdx > 0 ? (stepResults[stepIdx - 1]?.rows || 0) : 0,
            outputRows: data.length,
            change: data.length - (stepIdx > 0 ? (stepResults[stepIdx - 1]?.rows || 0) : 0),
          },
        });
      } catch (e) {
        console.error(`Step ${stepIdx} error:`, e);
        const inputRows = stepIdx > 0 ? (stepResults[stepIdx - 1]?.rows || 0) : 0;
        stepResults.push({
          step: stepIdx,
          type: step.type,
          stepConfig: step.config,
          error: e.message,
          rows: data.length,
          prevRows: inputRows,
          columns: (() => {
            const colSet = new Set();
            data.slice(0, 20).forEach((row) => {
              if (row && typeof row === "object") Object.keys(row).forEach((k) => { if (!k.startsWith("_")) colSet.add(k); });
            });
            return Array.from(colSet);
          })(),
          preview: data.slice(0, 3),
          stats: {
            inputRows: inputRows,
            outputRows: data.length,
            change: data.length - inputRows,
          },
        });
      }
    }
    if (data.length > 0) {
      return {
        value: data[0].val !== undefined ? data[0].val : data[0],
        data,
        stepResults,
        error: data[0]?.error,
      };
    }
    return { value: null, data: [], stepResults };
  },
  runSteps(steps, context = {}) {
    if (!steps || steps.length === 0) return null;
    const mockRule = { steps: steps };
    return this.exec(mockRule, context.tables || [], context);
  },
  getPresetTemplates() {
    return {};
  },
  getFormulaHints() {
    return [
      { key: "{val}", desc: "上一步的计算结果" },
      { key: " + ", desc: "加法运算" },
      { key: " - ", desc: "减法运算" },
      { key: " * ", desc: "乘法运算" },
      { key: " / ", desc: "除法运算" },
      { key: " % ", desc: "取余运算" },
      { key: "Math.abs()", desc: "绝对值" },
      { key: "Math.round()", desc: "四舍五入" },
      { key: "Math.floor()", desc: "向下取整" },
      { key: "Math.ceil()", desc: "向上取整" },
      { key: "Math.max()", desc: "最大值" },
      { key: "Math.min()", desc: "最小值" },
      { key: "Math.pow()", desc: "幂运算" },
      { key: "Math.sqrt()", desc: "平方根" },
      { key: "Math.log()", desc: "自然对数" },
      { key: "Math.exp()", desc: "e的指数" },
      { key: "Math.sin()", desc: "正弦函数" },
      { key: "Math.cos()", desc: "余弦函数" },
      { key: "toFixed(2)", desc: "保留2位小数" },
      { key: " ? : ", desc: "三元条件判断（条件 ? 真值 : 假值）" },
    ];
  },
  _applyOutputFormat(value, format) {
    return EngineUtils.formatValue(value, format);
  },
  formatValue(value, format) {
    return EngineUtils.formatValue(value, format);
  },
  getOutputFormats() {
    return [
      { value: "none", label: "不处理（原始数值）", group: "基础" },
      { value: "round2", label: "保留 2 位小数（四舍五入）", group: "小数处理" },
      { value: "floor2", label: "保留 2 位小数（向下取整）", group: "小数处理" },
      { value: "ceil2", label: "保留 2 位小数（向上取整）", group: "小数处理" },
      { value: "round0", label: "取整（四舍五入）", group: "小数处理" },
      { value: "thousands", label: "千分位格式化（如 1,234.56）", group: "展示格式" },
      { value: "money", label: "货币格式（¥1,234.56）", group: "展示格式" },
      { value: "percent", label: "百分比格式（12.34%）", group: "展示格式" },
      { value: "toNumber", label: "强制转为数字", group: "类型转换" },
      { value: "toString", label: "强制转为文本", group: "类型转换" },
    ];
  },
};

window.CalcEngine = CalcEngine;