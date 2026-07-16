const TABLE_TYPE_PATTERNS = [
  { type: "订单", keywords: ["订单", "交易", "成交"], icon: "📋", color: "var(--color-primary)", desc: "订单交易数据" },
  { type: "退款", keywords: ["退款", "退货"], icon: "🔄", color: "var(--color-warning)", desc: "退款退货数据" },
  { type: "推广", keywords: ["推广", "广告", "投放"], icon: "📢", color: "var(--color-success)", desc: "广告推广数据" },
  { type: "账务", keywords: ["账务", "账单", "结算"], icon: "💰", color: "var(--color-info)", desc: "账务结算数据" },
  { type: "成本", keywords: ["成本", "费用", "支出"], icon: "🧾", color: "var(--color-danger)", desc: "成本费用数据" },
  { type: "商品", keywords: ["商品", "库存"], icon: "📦", color: "var(--color-accent)", desc: "商品库存数据" },
  { type: "利润", keywords: ["利润", "收益"], icon: "📈", color: "var(--color-success)", desc: "利润收益数据" },
  { type: "报表", keywords: ["报表", "统计"], icon: "📊", color: "var(--color-primary)", desc: "统计报表数据" },
];

const DataUtils = {
  detectTableType(fileName, fileData) {
    const text = (fileName + " " + Object.keys(fileData.sheets || {}).join(" ")).toLowerCase();
    for (const pattern of TABLE_TYPE_PATTERNS) {
      if (pattern.keywords.some(k => text.includes(k.toLowerCase()))) {
        return pattern;
      }
    }
    return { type: "其他", keywords: [], icon: "📄", color: "var(--color-text-tertiary)", desc: "其他数据" };
  },

  extractDateFromFileName(fileName) {
    const fullMatch = fileName.match(/(\d{4})[-_.年](\d{1,2})[-_.月]?(\d{1,2})/);
    if (fullMatch) {
      const [, year, month, day] = fullMatch;
      return {
        date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        month: Number(month),
        monthLabel: `${Number(month)}月`,
        yearMonthLabel: `${year}-${Number(month)}月`,
      };
    }
    const yearMonthMatch = fileName.match(/(\d{4})[-_.年](\d{1,2})/);
    if (yearMonthMatch) {
      const [, year, month] = yearMonthMatch;
      return {
        date: `${year}-${month.padStart(2, "0")}-01`,
        month: Number(month),
        monthLabel: `${Number(month)}月`,
        yearMonthLabel: `${year}-${Number(month)}月`,
      };
    }
    const cnMonthMatch = fileName.match(/(\d{1,2})月份?/);
    if (cnMonthMatch) {
      const m = Number(cnMonthMatch[1]);
      const yearMatch = fileName.match(/(\d{4})/);
      const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      return {
        date: `${year}-${String(m).padStart(2, "0")}-01`,
        month: m,
        monthLabel: `${m}月`,
        yearMonthLabel: `${year}-${m}月`,
      };
    }
    return null;
  },

  extractMonthFromData(fileData) {
    const sheets = fileData?.sheets || {};
    const sheetNames = Object.keys(sheets);
    if (sheetNames.length === 0) return null;
    const firstSheet = sheets[sheetNames[0]];
    const rows = firstSheet?.rows || [];
    const headers = firstSheet?.headers || [];
    if (rows.length === 0) return null;

    const dateColPatterns = [
      /日期/, /时间/, /创建时间/, /下单时间/, /订单时间/, /成交时间/,
      /月份/, /周期/, /数据周期/, /月份/, /年月/
    ];
    let dateColIdx = -1;
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] || "");
      if (dateColPatterns.some((p) => p.test(h))) {
        dateColIdx = i;
        break;
      }
    }
    if (dateColIdx >= 0) {
      const firstVal = String(rows[0][dateColIdx] || "");
      const m1 = firstVal.match(/(\d{4})[-_/年]?(\d{1,2})[-_/]?\d{0,2}/);
      if (m1) return Number(m1[2]);
      const m2 = firstVal.match(/(\d{1,2})月/);
      if (m2) return Number(m2[1]);
      const d = new Date(firstVal);
      if (!isNaN(d.getTime())) {
        return d.getMonth() + 1;
      }
    }
    return null;
  },

  extractKeywordFromHeaders(fileData) {
    const sheets = fileData?.sheets || {};
    const sheetNames = Object.keys(sheets);
    if (sheetNames.length === 0) return null;
    const firstSheet = sheets[sheetNames[0]];
    const headers = (firstSheet?.headers || []).map((h) => String(h || "").toLowerCase());

    const keywordMap = [
      { keywords: ["订单号", "订单状态", "订单编号", "订单时间", "成交时间"], result: "订单" },
      { keywords: ["退款", "售后", "退货", "退款金额", "退款状态"], result: "退款" },
      { keywords: ["推广", "广告", "花费", "投放", "曝光", "点击", "推广费"], result: "推广" },
      { keywords: ["账单", "账务", "结算", "账单金额", "应结金额", "到账"], result: "账务" },
      { keywords: ["成本", "费用", "支出", "成本价", "单价"], result: "成本" },
      { keywords: ["商品", "sku", "商品id", "商品规格", "spu"], result: "商品" },
      { keywords: ["利润", "毛利", "净利", "利润率", "收益"], result: "利润" },
      { keywords: ["资金", "流水", "收支", "打款", "提现"], result: "资金" },
    ];
    for (const item of keywordMap) {
      if (item.keywords.some((k) => headers.some((h) => h.includes(k)))) {
        return item.result;
      }
    }
    return null;
  },

  extractTableKeyword(fileName, fileData) {
    const fromHeaders = this.extractKeywordFromHeaders(fileData);
    if (fromHeaders) return fromHeaders;

    const cleanName = fileName.replace(/\.[^.]+$/, "").trim();
    const detailMatch = cleanName.match(/^([^\s_\-\.]+?)(明细|详情|清单|统计|报表|记录|流水)/);
    if (detailMatch) {
      return detailMatch[1] + detailMatch[2];
    }
    for (const pattern of TABLE_TYPE_PATTERNS) {
      for (const keyword of pattern.keywords) {
        if (cleanName.toLowerCase().includes(keyword.toLowerCase())) {
          return keyword;
        }
      }
    }
    const short = cleanName.replace(/[\d_\-\.年月日期\s]/g, "").substring(0, 4);
    return short || "数据";
  },

  generateTableName(fileName, fileData) {
    const dateInfo = this.extractDateFromFileName(fileName);
    const keyword = this.extractTableKeyword(fileName, fileData);
    const monthFromData = this.extractMonthFromData(fileData);
    const month = monthFromData || (dateInfo ? dateInfo.month : null);

    if (keyword && month) {
      return `${keyword}${month}月明细`;
    }
    if (keyword) {
      return `${keyword}明细`;
    }
    if (month) {
      return `${month}月明细`;
    }
    return fileName.replace(/\.[^.]+$/, "").substring(0, 20) + "明细";
  },
};

