const EngineUtils = {
  chineseToNumber(text) {
    const map = {
      "零": 0, "〇": 0, "O": 0, "o": 0,
      "一": 1, "壹": 1, "幺": 1,
      "二": 2, "贰": 2, "两": 2,
      "三": 3, "叁": 3,
      "四": 4, "肆": 4,
      "五": 5, "伍": 5,
      "六": 6, "陆": 6,
      "七": 7, "柒": 7,
      "八": 8, "捌": 8,
      "九": 9, "玖": 9,
      "十": 10, "拾": 10,
      "百": 100, "佰": 100,
      "千": 1000, "仟": 1000,
      "万": 10000, "萬": 10000,
      "亿": 100000000, "億": 100000000,
    };
    if (!text) return NaN;
    let num = 0, temp = 0, result = 0;
    let valid = false;
    for (const char of String(text)) {
      const n = map[char];
      if (n !== undefined) {
        valid = true;
        if (n >= 100000000) {
          result = (result + temp) * n;
          temp = 0;
        } else if (n >= 10000) {
          result = (result + temp) * n;
          temp = 0;
        } else if (n >= 1000) {
          temp = (temp || 1) * n;
        } else if (n >= 100) {
          temp = (temp || 1) * n;
        } else if (n >= 10) {
          temp = (temp || 1) * n;
        } else {
          temp = temp + n;
        }
      }
    }
    return valid ? result + temp : NaN;
  },
  applyRowFilter(row, col, op, val, useValFallback = false) {
    const cellVal = useValFallback ? (row[col] ?? row.val) : row[col];
    const v = cellVal != null ? String(cellVal) : "";
    const t = val != null ? String(val) : "";
    switch (op) {
      case "==":
        return v === t;
      case "!=":
        return v !== t;
      case ">":
        return Number(cellVal) > Number(val);
      case "<":
        return Number(cellVal) < Number(val);
      case ">=":
        return Number(cellVal) >= Number(val);
      case "<=":
        return Number(cellVal) <= Number(val);
      case "contains":
        return v.includes(t);
      case "notContains":
        return !v.includes(t);
      case "startsWith":
        return v.startsWith(t);
      case "endsWith":
        return v.endsWith(t);
      case "isEmpty":
        return v.trim() === "";
      case "notEmpty":
        return v.trim() !== "";
      case "regex":
        try {
          return new RegExp(t).test(v);
        } catch {
          return true;
        }
      default:
        return true;
    }
  },
  parseNumber(val) {
    if (val === null || val === undefined) return 0;
    const str = String(val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "");
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  },
  formatValue(value, format) {
    if (value === null || value === undefined) return value;
    if (!format || format === "none") return value;
    const n = Number(value);
    switch (format) {
      case "round2":
        return Math.round((isNaN(n) ? 0 : n) * 100) / 100;
      case "floor2":
        return Math.floor((isNaN(n) ? 0 : n) * 100) / 100;
      case "ceil2":
        return Math.ceil((isNaN(n) ? 0 : n) * 100) / 100;
      case "round0":
        return Math.round(isNaN(n) ? 0 : n);
      case "thousands": {
        const v = isNaN(n) ? 0 : n;
        return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      case "money": {
        const v = isNaN(n) ? 0 : n;
        return "¥" + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      case "percent": {
        const v = isNaN(n) ? 0 : n;
        const ratio = Math.abs(v) <= 1 ? v * 100 : v;
        return ratio.toFixed(2) + "%";
      }
      case "toNumber":
        return isNaN(n) ? 0 : n;
      case "toString":
        return String(value);
      default:
        return value;
    }
  },
};