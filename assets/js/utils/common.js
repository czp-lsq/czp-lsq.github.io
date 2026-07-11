// utils/common.js - 通用工具函数库 (Utils)
const Utils = {
  // 数字格式化
  formatNumber: (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return Number(num).toLocaleString("zh-CN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },
  // 货币格式化
  formatCurrency: (num) => {
    if (num === null || num === undefined || isNaN(num)) return "¥0.00";
    return "¥" + Number(num).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  // 日期格式化
  formatDate: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN");
  },
  // 中文数字转阿拉伯数字
  chineseToNumber: (str) => {
    if (!str) return 0;
    const num = String(str).trim();
    if (/^\d+\.?\d*$/.test(num)) return Number(num);
    const map = { "零": 0, "〇": 0, "一": 1, "壹": 1, "幺": 1, "二": 2, "贰": 2, "两": 2, "三": 3, "叁": 3, "四": 4, "肆": 4, "五": 5, "伍": 5, "六": 6, "陆": 6, "七": 7, "柒": 7, "八": 8, "捌": 8, "九": 9, "玖": 9, "十": 10, "拾": 10, "百": 100, "佰": 100, "千": 1000, "仟": 1000, "万": 10000, "萬": 10000, "亿": 100000000, "億": 100000000 };
    let result = 0, temp = 0;
    for (const ch of num) {
      const n = map[ch];
      if (n !== undefined) {
        if (n >= 10000) { result = (result + temp) * n; temp = 0; }
        else if (n >= 10) { temp = (temp || 1) * n; }
        else { temp = temp + n; }
      }
    }
    return result + temp || 0;
  },
  // 防抖
  debounce: (fn, delay) => {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },
  // 节流
  throttle: (fn, delay) => {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= delay) { last = now; fn.apply(this, args); }
    };
  },
  // 深拷贝
  deepClone: (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(item => Utils.deepClone(item));
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = Utils.deepClone(obj[key]);
      }
    }
    return cloned;
  },
  // 生成唯一ID
  uniqueId: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
  // 提取文件扩展名
  getFileExtension: (filename) => {
    if (!filename) return "";
    const idx = filename.lastIndexOf(".");
    return idx > 0 ? filename.slice(idx + 1).toLowerCase() : "";
  },
  // 格式化文件大小
  formatFileSize: (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
  // Excel数据转AOA
  excelToAOA: (workbook) => {
    const result = {};
    workbook.SheetNames.forEach(name => {
      const sheet = workbook.Sheets[name];
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
      result[name] = aoa;
    });
    return result;
  },
  // AOA转Excel
  aoaToExcel: (aoa) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    return wb;
  },
  // 下载Excel
  downloadExcel: (wb, filename) => {
    XLSX.writeFile(wb, filename);
  },
  // 检测X标记（用于模板）
  isXMarker: (ch) => ["x", "X", "×", "✗", "*", "＿"].includes(ch),
  // 检测是否为数字
  isNumber: (val) => {
    if (typeof val === "number") return !isNaN(val);
    if (typeof val !== "string") return false;
    return !isNaN(parseFloat(val)) && isFinite(val);
  }
};
