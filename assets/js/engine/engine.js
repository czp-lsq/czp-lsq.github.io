// engine/engine.js - 计算引擎 (CalcEngine) 与预设模板
const CalcEngine = {
  extractDateFromFileName(fileName) {
    if (!fileName) return null;
    const name = fileName.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf('.') || fileName.length);
    const baseName = fileName.substring(0, fileName.lastIndexOf('.') || fileName.length);
    const patterns = [
      { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true, desc: "年月日格式" },
      { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false, desc: "年月格式" },
      { regex: /(\d{4})[\-_\/\.](\d{1,2})[\-_\/\.](\d{1,2})/, hasDay: true, desc: "斜杠分隔格式" },
      { regex: /(\d{4})[\-_年\.](\d{1,2})/, hasDay: false, desc: "年-月数字格式" },
    ];
    for (const p of patterns) {
      const match = baseName.match(p.regex);
      if (match) {
        let year = parseInt(match[1], 10);
        const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
        const day = p.hasDay && match[3]
          ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
          : null;
        const currentYear = new Date().getFullYear();
        if (year >= 2000 && year <= currentYear + 5 && month >= 1 && month <= 12) {
          return { year, month, day };
        }
      }
    }
    const numPatterns = [
      { regex: /(\d{4})(\d{2})(\d{2})/, hasDay: true, desc: "8位数字日期" },
      { regex: /(\d{4})(\d{2})/, hasDay: false, desc: "6位数字年月" },
    ];
    for (const p of numPatterns) {
      const match = baseName.match(p.regex);
      if (match) {
        let year = parseInt(match[1], 10);
        const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
        const day = p.hasDay && match[3]
          ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
          : null;
        const currentYear = new Date().getFullYear();
        if (year >= 2000 && year <= currentYear + 5 && month >= 1 && month <= 12) {
          const prevChar = match.index > 0 ? baseName[match.index - 1] : '';
          const nextChar = match.index + match[0].length < baseName.length 
            ? baseName[match.index + match[0].length] 
            : '';
          if (!/[0-9]/.test(prevChar) && !/[0-9]/.test(nextChar)) {
            return { year, month, day };
          }
        }
      }
    }
    const shortYearPatterns = [
      { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true, desc: "短年份年月日" },
      { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false, desc: "短年份年月" },
    ];
    for (const p of shortYearPatterns) {
      const match = baseName.match(p.regex);
      if (match) {
        let year = parseInt(match[1], 10);
        year += year < 50 ? 2000 : 1900;
        const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
        const day = p.hasDay && match[3]
          ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
          : null;
        const currentYear = new Date().getFullYear();
        if (year >= 2000 && year <= currentYear + 5 && month >= 1 && month <= 12) {
          return { year, month, day };
        }
      }
    }
    return null;
  },
  extractDateFromData(tables) {
    const currentYear = new Date().getFullYear();
    const isValidDate = (year, month, day) => {
      if (year < 2000 || year > currentYear + 5) return false;
      if (month < 1 || month > 12) return false;
      if (day !== null && (day < 1 || day > 31)) return false;
      return true;
    };
    for (const table of tables) {
      if (table.rows && table.rows.length > 0) {
        for (const row of table.rows.slice(0, 50)) {
          for (const val of Object.values(row)) {
            if (val instanceof Date && !isNaN(val)) {
              const year = val.getFullYear();
              const month = val.getMonth() + 1;
              const day = val.getDate();
              if (isValidDate(year, month, day)) {
                return { year, month, day };
              }
            }
            const str = String(val || "").trim();
            if (str.length < 6 || str.length > 30) continue;
            const datePatterns = [
              { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true },
              { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false },
              { regex: /(\d{4})[\-_\/\.](\d{1,2})[\-_\/\.](\d{1,2})/, hasDay: true },
              { regex: /^(\d{4})(\d{2})(\d{2})$/, hasDay: true },
              { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true, shortYear: true },
              { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false, shortYear: true },
            ];
            for (const p of datePatterns) {
              const match = str.match(p.regex);
              if (match) {
                let year = parseInt(match[1], 10);
                if (p.shortYear) {
                  year += year < 50 ? 2000 : 1900;
                }
                const month = parseInt(match[2], 10);
                const day = p.hasDay && match[3]
                  ? parseInt(match[3], 10)
                  : null;
                if (isValidDate(year, month, day)) {
                  return { year, month, day };
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
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
    // 辅助函数：中文数字转阿拉伯数字（移出switch避免TDZ错误）
    const _chineseToNumber = (() => {
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
      return (text) => {
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
      };
    })();
    for (let stepIdx = 0; stepIdx < rule.steps.length; stepIdx++) {
      const step = rule.steps[stepIdx];
      try {
        switch (step.type) {
          case "fill": {
            const cfg = step.config || {};
            let fillValue = "";
            if (cfg.fillType === "manual") {
              fillValue = String(cfg.value ?? "");
            } else if (cfg.fillType === "date" || cfg.fillType === "dateNow") {
              let targetDate;
              if (cfg.fillType === "dateNow") {
                const now = new Date();
                targetDate = {
                  year: now.getFullYear(),
                  month: now.getMonth() + 1,
                  day: now.getDate(),
                };
              } else {
                targetDate = dataDate;
              }
              const y = targetDate.year;
              const m = String(targetDate.month).padStart(2, "0");
              const d = targetDate.day
                ? String(targetDate.day).padStart(2, "0")
                : "01";
              switch (cfg.dateFormat) {
                case "yyyy":
                  fillValue = String(y);
                  break;
                case "mm":
                  fillValue = m;
                  break;
                case "dd":
                  fillValue = d;
                  break;
                case "yyyy-mm":
                  fillValue = `${y}年${m}月`;
                  break;
                case "yyyy-mm-dd":
                  fillValue = `${y}年${m}月${d}日`;
                  break;
                case "mm-dd":
                  fillValue = `${m}月${d}日`;
                  break;
                case "quarter":
                  fillValue = `第${Math.ceil(Number(m) / 3)}季度`;
                  break;
                case "yyyy-quarter":
                  fillValue = `${y}年第${Math.ceil(Number(m) / 3)}季度`;
                  break;
                case "week": {
                  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
                  const start = new Date(dateObj.getFullYear(), 0, 1);
                  const diff = dateObj - start;
                  const oneWeek = 1000 * 60 * 60 * 24 * 7;
                  const weekNum = Math.ceil(diff / oneWeek);
                  fillValue = `第${weekNum}周`;
                  break;
                }
                default:
                  fillValue = `${y}年${m}月`;
              }
            } else if (cfg.fillType === "field" && cfg.sourceField) {
              if (data.length > 0) {
                fillValue = String(
                  data[0][cfg.sourceField] ?? data[0].val ?? "",
                );
              }
            } else if (cfg.fillType === "shop") {
              fillValue = String(cfg.value || context.shopName || "");
            } else if (cfg.fillType === "auto") {
              const y = dataDate.year;
              const m = String(dataDate.month).padStart(2, "0");
              const d = dataDate.day
                ? String(dataDate.day).padStart(2, "0")
                : "01";
              const getQuarter = (month) => Math.ceil(month / 3);
              const getWeekOfYear = (date) => {
                const start = new Date(date.getFullYear(), 0, 1);
                const diff = date - start;
                const oneWeek = 1000 * 60 * 60 * 24 * 7;
                return Math.ceil(diff / oneWeek);
              };
              switch (context.fieldSemanticType) {
                case "shop":
                  fillValue = String(cfg.value || context.shopName || "");
                  break;
                case "year":
                  fillValue = String(y);
                  break;
                case "month":
                  fillValue = m;
                  break;
                case "day":
                  fillValue = d;
                  break;
                case "date":
                  fillValue = `${y}年${m}月`;
                  break;
                case "quarter":
                  fillValue = `第${getQuarter(dataDate.month)}季度`;
                  break;
                case "week":
                  const dateObj = new Date(y, dataDate.month - 1, dataDate.day || 1);
                  fillValue = `第${getWeekOfYear(dateObj)}周`;
                  break;
                default:
                  fillValue = String(cfg.value ?? "");
              }
            } else {
              fillValue = String(cfg.value ?? "");
            }
            data = [{ val: fillValue }];
            break;
          }
          case "source": {
            const selectedTables = step.config.tables || [];
            if (selectedTables.length > 0) {
              let allRows = [];
              selectedTables.forEach((tableId) => {
                const table = tables.find((t) => t.id === tableId);
                if (table) {
                  if (step.config.column) {
                    allRows = [...allRows, ...table.rows.map((r) => ({ val: r[step.config.column] }))];
                  } else {
                    allRows = [...allRows, ...table.rows.map((r) => ({ ...r }))];
                  }
                }
              });
              data = allRows;
            } else {
              const table = tables.find((t) => t.id === step.config.table);
              if (table) {
                if (step.config.column) {
                  data = table.rows.map((r) => ({ val: r[step.config.column] }));
                } else {
                  data = table.rows.map((r) => ({ ...r }));
                }
              }
            }
            break;
          }
          case "filter": {
            if (!step.config.column) break;
            const multiValues = Array.isArray(step.config.values) && step.config.values.length > 0
              ? step.config.values
              : (step.config.value !== "" && step.config.value != null ? [step.config.value] : []);
            data = data.filter((row) => {
              const val = row[step.config.column] ?? row.val;
              let target = step.config.value;
              if (step.config.valueType === "column" && step.config.compareColumn) {
                target = row[step.config.compareColumn];
              }
              const v = val != null ? String(val) : "";
              const t = target != null ? String(target) : "";
              switch (step.config.op) {
                case "==": {
                  if (multiValues.length > 0) {
                    return multiValues.some((mv) => v === String(mv));
                  }
                  return v === t;
                }
                case "!=": {
                  if (multiValues.length > 0) {
                    return !multiValues.some((mv) => v === String(mv));
                  }
                  return v !== t;
                }
                case ">":
                  return Number(val) > Number(target);
                case "<":
                  return Number(val) < Number(target);
                case ">=":
                  return Number(val) >= Number(target);
                case "<=":
                  return Number(val) <= Number(target);
                case "contains":
                  return v.includes(t);
                case "notContains":
                  return !v.includes(t);
                case "startsWith":
                  return v.startsWith(t);
                case "endsWith":
                  return v.endsWith(t);
                case "isEmpty":
                  return !v;
                case "notEmpty":
                  return !!v;
                case "regex": {
                  try {
                    return new RegExp(t).test(v);
                  } catch {
                    return true;
                  }
                }
                default:
                  return true;
              }
            });
            break;
          }
          case "filterEqual":
          case "filterContain": {
            if (!step.config.column) break;
            const fOp = step.type === "filterEqual" ? "==" : "contains";
            data = data.filter((row) => {
              const val = row[step.config.column] ?? row.val;
              const target = step.config.value;
              const v = val != null ? String(val) : "";
              const t = target != null ? String(target) : "";
              switch (fOp) {
                case "==":
                  return v === t;
                case "contains":
                  return v.includes(t);
                default:
                  return true;
              }
            });
            break;
          }
          case "filterRange": {
            if (!step.config.column) break;
            const minVal = step.config.min !== "" && step.config.min != null ? Number(step.config.min) : -Infinity;
            const maxVal = step.config.max !== "" && step.config.max != null ? Number(step.config.max) : Infinity;
            data = data.filter((row) => {
              const val = Number(row[step.config.column] ?? row.val);
              return val >= minVal && val <= maxVal;
            });
            break;
          }
          case "topN": {
            const count = Number(step.config.count) || 10;
            if (step.config.column) {
              const sorted = [...data].sort((a, b) => {
                const av = Number(a[step.config.column] ?? a.val);
                const bv = Number(b[step.config.column] ?? b.val);
                return step.config.order === "asc" ? av - bv : bv - av;
              });
              data = sorted.slice(0, count);
            } else {
              data = data.slice(0, count);
            }
            break;
          }
          case "virtual": {
            if (!step.config.source || !step.config.target) break;
            data = data.map((row) => {
              const src = row[step.config.source] ?? row.val;
              let result = src;
              switch (step.config.rule) {
                case "copy":
                  result = src;
                  break;
                case "parseQty": {
                  let qty = 1;
                  const s = String(src || "");
                  const patterns = [
                    /×(\d+)/g,
                    /\*(\d+)/g,
                    /[Xx](\d+)/g,
                    /(\d+)件/g,
                    /(\d+)条/g,
                    /(\d+)个/g,
                    /(\d+)套/g,
                    /(\d+)份/g,
                    /(\d+)盒/g,
                    /(\d+)瓶/g,
                    /(\d+)袋/g,
                    /\((\d+)\)/g,
                    /（(\d+)）/g,
                  ];
                  for (const pat of patterns) {
                    const m = s.match(pat);
                    if (m) {
                      const n = s.match(/(\d+)/);
                      qty = n ? Number(n[1]) : 1;
                      break;
                    }
                  }
                  result = qty;
                  break;
                }
                case "parsePieces": {
                  // 条数识别：从商品规格中识别每包的条数
                  const s = String(src || "").trim();
                  if (!s) { result = 1; break; }
                  // 模式0: 纯数字直接返回
                  const pureNum = /^\d+$/.exec(s);
                  if (pureNum) { result = Number(pureNum[0]); break; }
                  // 模式1: X条装（优先级最高）
                  const pattern1 = /(\d+|[一二三四五六七八九十]+)\s*条装/;
                  const m1 = s.match(pattern1);
                  if (m1) {
                    const num = Number(m1[1]) || _chineseToNumber(m1[1]);
                    result = num || 1;
                    break;
                  }
                  // 模式1b: X包装（如 5包装、十包装）
                  const pattern1b = /(\d+|[一二三四五六七八九十]+)\s*包装/;
                  const m1b = s.match(pattern1b);
                  if (m1b) {
                    const num = Number(m1b[1]) || _chineseToNumber(m1b[1]);
                    result = num || 1;
                    break;
                  }
                  // 模式1c: X条/包、X条\包、X条每包
                  const pattern1c = /(\d+|[一二三四五六七八九十]+)\s*条\s*[/\\每]\s*[包袋盒件]/;
                  const m1c = s.match(pattern1c);
                  if (m1c) {
                    const num = Number(m1c[1]) || _chineseToNumber(m1c[1]);
                    result = num || 1;
                    break;
                  }
                  // 模式2: X条（数字+条 或 中文数字+条）
                  const pattern2 = /(\d+)\s*条/;
                  const m2 = s.match(pattern2);
                  if (m2) {
                    result = Number(m2[1]) || 1;
                    break;
                  }
                  // 模式2b: 中文数字+条
                  const pattern2b = /([一二三四五六七八九十]+)\s*条/;
                  const m2b = s.match(pattern2b);
                  if (m2b) {
                    result = _chineseToNumber(m2b[1]) || 1;
                    break;
                  }
                  // 模式3: X色各Y条（如 5色各2条 → 10条）
                  const pattern3a = /(\d+|[一二三四五六七八九十]+)\s*色各\s*(\d+|[一二三四五六七八九十]+)\s*条/;
                  const m3a = s.match(pattern3a);
                  if (m3a) {
                    const colors = Number(m3a[1]) || _chineseToNumber(m3a[1]) || 1;
                    const pieces = Number(m3a[2]) || _chineseToNumber(m3a[2]) || 1;
                    result = colors * pieces;
                    break;
                  }
                  // 模式3b: X色各一（如 6色各一、三色各一、5色各一条）
                  const pattern3b = /(\d+|[一二三四五六七八九十]+)\s*色各一/;
                  const m3b = s.match(pattern3b);
                  if (m3b) {
                    const num = Number(m3b[1]) || _chineseToNumber(m3b[1]);
                    result = num || 1;
                    break;
                  }
                  // 模式3c: X条*Y（如 3条*2 → 6条，表示组合装）
                  const pattern3c = /(\d+)\s*条\s*[*xX×]\s*(\d+)/;
                  const m3c = s.match(pattern3c);
                  if (m3c) {
                    result = Number(m3c[1]) * Number(m3c[2]);
                    break;
                  }
                  // 模式4: 加号分隔（条数 = 加号数量 + 1）
                  const plusCount = (s.match(/\+/g) || []).length;
                  if (plusCount > 0) {
                    result = plusCount + 1;
                    break;
                  }
                  // 模式4b: 顿号/逗号分隔的颜色（如 黑+白+灰、黑,白,灰）
                  const separators = /[,，、\/\\|]+/;
                  if (separators.test(s)) {
                    const parts = s.split(separators).filter((p) => p.trim());
                    if (parts.length > 1) {
                      // 如果包含颜色词或尺码词，按件数算
                      result = parts.length;
                      break;
                    }
                  }
                  // 模式5: 件数单位（件/个/双/套）
                  const pieceUnitPattern = /(\d+)\s*[件个双套]/;
                  const mUnit = s.match(pieceUnitPattern);
                  if (mUnit) {
                    result = Number(mUnit[1]) || 1;
                    break;
                  }
                  // 模式5b: 数量前缀（数量:5、x5、*5）
                  const qtyPrefixPattern = /(?:数量|qty|x|×|\*)\s*(\d+)/i;
                  const mQty = s.match(qtyPrefixPattern);
                  if (mQty) {
                    result = Number(mQty[1]) || 1;
                    break;
                  }
                  // 模式6: 颜色词模式（兜底模式）
                  const colorWords = ["黑","白","灰","粉","红","蓝","绿","黄","紫","肤","杏","咖","米","棕","橙","藏","青","驼","酒","玫","天","墨","浅","深","草","豆","裸","玫","藕","香","奶","姜","铁","银","金","驼","烟","雾","冰","水","花","素","净","撞","渐","混","杂","纯","亮","暗","荧","哑","珠","丝","绒","棉","麻","绸","缎","纱","蕾丝","牛仔","针织","毛呢","皮革","羽绒"];
                  let colorCount = 0;
                  const matchedColors = new Set();
                  for (const color of colorWords) {
                    const regex = new RegExp(color, "g");
                    const matches = s.match(regex);
                    if (matches) {
                      matchedColors.add(color);
                      colorCount += matches.length;
                    }
                  }
                  // 如果颜色词分散出现且不重复太多，取颜色种类数
                  if (matchedColors.size >= 2 && matchedColors.size <= 12) {
                    result = matchedColors.size;
                    break;
                  }
                  if (colorCount > 0 && colorCount <= 12) {
                    result = colorCount;
                    break;
                  }
                  // 默认返回1
                  result = 1;
                  break;
                }
                case "splitPlus": {
                  const s = String(src || "");
                  result = (s.match(/\+/g) || []).length + 1;
                  break;
                }
                case "parseSize": {
                  // 尺码识别：从商品规格中识别尺码（S/M/L/XL/2XL/3XL等）
                  const s = String(src || "").trim();
                  if (!s) { result = ""; break; }
                  // 模式1: 标准尺码+后缀 如 "XL码", "2XL号", "M斤"
                  const pattern1 = /\b(X{0,2}S|X{0,3}L|\d{0,2}X{0,2}[SL]|M)\s*(码|号|斤)/i;
                  const m1 = s.match(pattern1);
                  if (m1) {
                    result = m1[1].toUpperCase();
                    break;
                  }
                  // 模式2: 纯尺码 如 "XL", "2XL", "M"（前后无中文字符或数字）
                  const pattern2 = /[^A-Za-z0-9](X{0,2}S|X{0,3}L|\d{0,2}X{0,2}[SL]|M)(?![A-Za-z0-9])/i;
                  const m2 = s.match(pattern2);
                  if (m2) {
                    result = m2[1].toUpperCase();
                    break;
                  }
                  // 模式3: 尺码在开头或结尾
                  const pattern3 = /^(X{0,2}S|X{0,3}L|\d{0,2}X{0,2}[SL]|M)\b/i;
                  const m3 = s.match(pattern3);
                  if (m3) {
                    result = m3[1].toUpperCase();
                    break;
                  }
                  result = "";
                  break;
                }
                case "costLookup": {
                  // 成本查找：从全局成本表中匹配单件成本
                  // config: { costTableId, skuField, sizeField, skuCol }
                  const cfg = step.config || {};
                  const skuVal = row[cfg.skuField || "款号"] || "";
                  const sizeVal = row[cfg.sizeField || "尺码"] || "";
                  result = 0;
                  if (!skuVal || !sizeVal) {
                    result = 0;
                    break;
                  }
                  // 自动匹配成本表：优先使用配置的costTableId，否则按店铺名匹配
                  let targetTableId = cfg.costTableId;
                  if (!targetTableId && context.shopName) {
                    const autoMatch = externals.find((e) =>
                      e.sheetKey === context.shopName || e.name === context.shopName
                    );
                    if (autoMatch) targetTableId = autoMatch.id || autoMatch.sheetKey;
                  }
                  if (!targetTableId) {
                    result = 0;
                    break;
                  }
                  const ext = externals.find((e) =>
                    e.id === targetTableId || e.sheetKey === targetTableId
                  );
                  if (!ext) { result = 0; break; }
                  const costRows = ext.allData || ext.data || [];
                  const costHeaders = ext.headers || (costRows.length > 0 ? Object.keys(costRows[0]) : []);
                  // 解析成本表列名，建立尺码→列名映射
                  const sizeToCol = {};
                  const sizeToCost = {};
                  for (const header of costHeaders) {
                    if (!header) continue;
                    const h = String(header).trim();
                    // 跳过款号列
                    if (/^(款号|SKU|id|ID|编号)$/i.test(h)) continue;
                    // 模式A: 尺码码成本 如 "L码3.4", "XL码3.5", "2XL码3.6"
                    const ma = h.match(/^([X\d]*[SLM])(?:码|号|斤)(\d+\.?\d*)$/i);
                    if (ma) {
                      const size = ma[1].toUpperCase();
                      sizeToCol[size] = h;
                      sizeToCost[size] = parseFloat(ma[2]);
                      continue;
                    }
                    // 模式B: 字母+数字 如 "XL2.55", "ML2.45", "S3.2", "2XL3.6"
                    const mb = h.match(/^([A-Z\d]+)(\d+\.?\d*)$/i);
                    if (mb) {
                      const letters = mb[1];
                      const costVal = parseFloat(mb[2]);
                      // 拆分连续尺码
                      const sizes = [];
                      let cur = "";
                      for (const ch of letters) {
                        if (ch === "X" || ch === "x") {
                          cur += ch;
                        } else if (/\d/.test(ch)) {
                          cur += ch;
                        } else if (/[SLM]/i.test(ch)) {
                          cur += ch;
                          sizes.push(cur.toUpperCase());
                          cur = "";
                        }
                      }
                      for (const sz of sizes) {
                        sizeToCol[sz] = h;
                        sizeToCost[sz] = costVal;
                      }
                    }
                  }
                  // 在成本表中查找匹配行
                  const skuColName = cfg.skuCol || "款号";
                  const matchedRow = costRows.find((r) => String(r[skuColName] || "").trim() === String(skuVal).trim());
                  if (matchedRow) {
                    const targetSize = String(sizeVal).trim().toUpperCase();
                    // 优先使用预解析的成本值
                    if (sizeToCost[targetSize] !== undefined) {
                      result = sizeToCost[targetSize];
                    } else {
                      // 回退：直接在行中查找包含尺码的列
                      for (const [colName, colVal] of Object.entries(matchedRow)) {
                        if (String(colName).toUpperCase().includes(targetSize)) {
                          const n = Number(String(colVal).replace(/[¥￥$€£,，]/g, ""));
                          if (!isNaN(n)) { result = n; break; }
                        }
                      }
                    }
                  }
                  break;
                }
                case "toNumber": {
                  const s = String(src || "").trim();
                  let n = Number(s.replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
                  if (!isNaN(n)) {
                    result = n;
                    break;
                  }
                  // 尝试提取百分比
                  const pctMatch = s.match(/(\d+\.?\d*)\s*%/);
                  if (pctMatch) {
                    result = Number(pctMatch[1]) / 100;
                    break;
                  }
                  // 尝试提取第一个数字（支持小数、负数）
                  const numMatch = s.match(/-?\d+\.?\d*/);
                  if (numMatch) {
                    result = Number(numMatch[0]);
                    break;
                  }
                  // 尝试中文数字
                  const cnNum = _chineseToNumber(s);
                  if (!isNaN(cnNum)) {
                    result = cnNum;
                    break;
                  }
                  result = 0;
                  break;
                }
                case "toString":
                  result = String(src ?? "");
                  break;
                case "trim":
                  result = String(src ?? "").trim();
                  break;
                case "abs":
                  result = Math.abs(Number(src) || 0);
                  break;
                case "round":
                  result = Math.round(Number(src) || 0);
                  break;
                case "floor":
                  result = Math.floor(Number(src) || 0);
                  break;
                case "ceil":
                  result = Math.ceil(Number(src) || 0);
                  break;
                case "toFixed2":
                  result = Number((Number(src) || 0).toFixed(2));
                  break;
                case "percent": {
                  result = (Number(src) || 0) / 100;
                  break;
                }
                case "substring": {
                  const s = String(src ?? "");
                  const start = Number(step.config.start) || 0;
                  const len = step.config.length
                    ? Number(step.config.length)
                    : undefined;
                  result =
                    len !== undefined ? s.substr(start, len) : s.substr(start);
                  break;
                }
                case "replace": {
                  const s = String(src ?? "");
                  try {
                    result = s.replace(
                      new RegExp(step.config.pattern || "", "g"),
                      step.config.replacement || "",
                    );
                  } catch {
                    result = s;
                  }
                  break;
                }
                case "concat": {
                  const s = String(src ?? "");
                  result =
                    (step.config.prefix || "") + s + (step.config.suffix || "");
                  break;
                }
                case "toLowerCase":
                  result = String(src ?? "").toLowerCase();
                  break;
                case "toUpperCase":
                  result = String(src ?? "").toUpperCase();
                  break;
                case "length":
                  result = String(src ?? "").length;
                  break;
                case "formatMoney": {
                  const n = Number(src) || 0;
                  result = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  break;
                }
                case "parsePercent": {
                  const s = String(src || "").replace("%", "");
                  result = Number(s) / 100 || 0;
                  break;
                }
                case "ifEmpty": {
                  const s = String(src ?? "");
                  result = s || (step.config.defaultValue ?? "");
                  break;
                }
                case "chineseToNumber": {
                  const s = String(src || "").trim();
                  const chineseNumMap = {
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
                  let resultNum = 0;
                  let tempNum = 0;
                  let valid = false;
                  for (const char of s) {
                    const num = chineseNumMap[char];
                    if (num !== undefined) {
                      valid = true;
                      if (num >= 100000000) {
                        resultNum = (resultNum + tempNum) * num;
                        tempNum = 0;
                      } else if (num >= 10000) {
                        resultNum = (resultNum + tempNum) * num;
                        tempNum = 0;
                      } else if (num >= 1000) {
                        tempNum = (tempNum || 1) * num;
                      } else if (num >= 100) {
                        tempNum = (tempNum || 1) * num;
                      } else if (num >= 10) {
                        tempNum = (tempNum || 1) * num;
                      } else {
                        tempNum = tempNum + num;
                      }
                    }
                  }
                  resultNum = resultNum + tempNum;
                  if (valid && resultNum > 0) {
                    result = resultNum;
                  } else {
                    const parsed = Number(s.replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
                    result = isNaN(parsed) ? 0 : parsed;
                  }
                  break;
                }
                case "mapValue": {
                  const map = step.config.valueMap || {};
                  const key = String(src ?? "");
                  result = map[key] !== undefined ? map[key] : (step.config.defaultValue ?? src);
                  break;
                }
                case "multiply": {
                  const factor = Number(step.config.factor) || 1;
                  const n = Number(String(src ?? "").replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
                  result = isNaN(n) ? 0 : n * factor;
                  break;
                }
                case "divide": {
                  const divisor = Number(step.config.divisor) || 1;
                  const n = Number(String(src ?? "").replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
                  result = isNaN(n) || divisor === 0 ? 0 : n / divisor;
                  break;
                }
                case "sumFields": {
                  const fields = step.config.fields || [];
                  let sum = 0;
                  fields.forEach((field) => {
                    const val = row[field];
                    const n = Number(String(val ?? "").replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
                    sum += isNaN(n) ? 0 : n;
                  });
                  result = sum;
                  break;
                }
                case "diffFields": {
                  const fields = step.config.fields || [];
                  let diff = 0;
                  fields.forEach((field, idx) => {
                    const val = row[field];
                    const n = Number(String(val ?? "").replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
                    const num = isNaN(n) ? 0 : n;
                    diff = idx === 0 ? num : diff - num;
                  });
                  result = diff;
                  break;
                }
                default:
                  result = src;
              }
              // 支持 target 为多个字段名（逗号分隔）
              const targetNames = String(step.config.target || "")
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean);
              if (targetNames.length === 0) {
                return { ...row, _result: result };
              }
              if (targetNames.length === 1) {
                return { ...row, [targetNames[0]]: result };
              }
              // 多个目标字段：所有目标字段使用同一个结果
              const multi = { ...row };
              targetNames.forEach((name) => {
                multi[name] = result;
              });
              return multi;
            });
            break;
          }
          case "join": {
            let joinRows = null;
            const joinTable = tables.find((t) => t.id === step.config.table);
            if (joinTable) {
              joinRows = joinTable.rows;
            } else if (step.config.externalId) {
              const ext = externals.find(
                (e) =>
                  e.id === step.config.externalId ||
                  e.sheetKey === step.config.externalId,
              );
              if (ext) joinRows = ext.allData || ext.data || [];
            }
            if (
              joinRows &&
              step.config.key &&
              step.config.fk &&
              step.config.col
            ) {
              const lookup = {};
              joinRows.forEach((r) => {
                lookup[r[step.config.fk]] = r;
              });
              const parsePlatformSizeCost = (costStr, platformName) => {
                if (!costStr) return { unified: null, sizes: {} };
                const s = String(costStr).trim();
                const platformKeywords = {
                  pdd: ["拼多多", "pdd", "PDD", "拼", "多多"],
                  taobao: ["淘宝", "tb", "TB", "淘", "天猫", "tmall", "TMALL"],
                  douyin: ["抖音", "dy", "DY", "抖", "抖店"],
                };
                let targetPlatform = null;
                if (platformName) {
                  const pn = String(platformName).toLowerCase();
                  if (platformKeywords[pn]) {
                    targetPlatform = pn;
                  } else {
                    for (const [plat, keywords] of Object.entries(platformKeywords)) {
                      if (keywords.some((kw) => pn.includes(kw.toLowerCase()))) {
                        targetPlatform = plat;
                        break;
                      }
                    }
                  }
                }
                const result = { unified: null, sizes: {} };
                const extractSizeCostPairs = (segment) => {
                  const pairs = {};
                  const seg = segment.toLowerCase().trim();
                  const sizePattern = /(xs|s|m|l|xl|xxl|2xl|3xl|4xl|5xl|x{1,3}l|x{0,3}s)(\d+\.?\d*)/gi;
                  let match;
                  const found = new Set();
                  while ((match = sizePattern.exec(seg)) !== null) {
                    const size = match[1].toLowerCase();
                    const cost = parseFloat(match[2]);
                    if (!isNaN(cost) && !found.has(size)) {
                      pairs[size] = cost;
                      found.add(size);
                    }
                  }
                  if (Object.keys(pairs).length === 0) {
                    const numMatch = seg.match(/^(\d+\.?\d*)$/);
                    if (numMatch) {
                      return { unified: parseFloat(numMatch[1]) };
                    }
                  }
                  return { sizes: pairs };
                };
                let platformSegments = [];
                const tempStr = s;
                const allKeywords = [];
                for (const [plat, keywords] of Object.entries(platformKeywords)) {
                  keywords.forEach((kw) => {
                    allKeywords.push({ kw: kw.toLowerCase(), plat });
                  });
                }
                allKeywords.sort((a, b) => b.kw.length - a.kw.length);
                const positions = [];
                const lowerStr = tempStr.toLowerCase();
                allKeywords.forEach(({ kw, plat }) => {
                  let idx = 0;
                  while ((idx = lowerStr.indexOf(kw, idx)) !== -1) {
                    const isChineseKw = /[\u4e00-\u9fa5]/.test(kw);
                    let beforeOk = true;
                    let afterOk = true;
                    if (idx > 0) {
                      const beforeChar = lowerStr.charAt(idx - 1);
                      if (isChineseKw) {
                        beforeOk = !/[\u4e00-\u9fa5]/.test(beforeChar);
                      } else {
                        beforeOk = /[\d\s（）()【】\[\],，、/\\-_\u4e00-\u9fa5]/.test(beforeChar);
                      }
                    }
                    if (idx + kw.length < lowerStr.length) {
                      const afterChar = lowerStr.charAt(idx + kw.length);
                      if (isChineseKw) {
                        afterOk = !/[\u4e00-\u9fa5]/.test(afterChar);
                      } else {
                        afterOk = /[\d\s（）()【】\[\],，、/\\-_\u4e00-\u9fa5]/.test(afterChar);
                      }
                    }
                    if (beforeOk && afterOk) {
                      positions.push({ start: idx, end: idx + kw.length, plat, kw });
                    }
                    idx += kw.length;
                  }
                });
                positions.sort((a, b) => a.start - b.start);
                const merged = [];
                positions.forEach((pos) => {
                  if (merged.length === 0 || pos.start >= merged[merged.length - 1].end) {
                    merged.push(pos);
                  }
                });
                let hasPlatformPrefix = merged.length > 0;
                if (merged.length > 0) {
                  for (let i = 0; i < merged.length; i++) {
                    const segStart = merged[i].end;
                    const segEnd = i + 1 < merged.length ? merged[i + 1].start : tempStr.length;
                    const segment = tempStr.substring(segStart, segEnd).trim();
                    if (segment) {
                      platformSegments.push({ plat: merged[i].plat, segment });
                    }
                  }
                  const beforeFirst = tempStr.substring(0, merged[0].start).trim();
                  if (beforeFirst) {
                    platformSegments.unshift({ plat: null, segment: beforeFirst });
                  }
                } else {
                  platformSegments.push({ plat: null, segment: tempStr });
                }
                if (!hasPlatformPrefix && targetPlatform) {
                  const parsed = extractSizeCostPairs(tempStr);
                  if (parsed.unified !== undefined) {
                    result.unified = parsed.unified;
                  }
                  result.sizes = { ...result.sizes, ...parsed.sizes };
                } else {
                  for (const { plat, segment } of platformSegments) {
                    const parsed = extractSizeCostPairs(segment);
                    if (targetPlatform && plat === targetPlatform) {
                      if (parsed.unified !== undefined) {
                        result.unified = parsed.unified;
                      }
                      result.sizes = { ...result.sizes, ...parsed.sizes };
                    } else if (!plat && !targetPlatform) {
                      if (parsed.unified !== undefined) {
                        result.unified = parsed.unified;
                      }
                      result.sizes = { ...result.sizes, ...parsed.sizes };
                    } else if (!targetPlatform && plat) {
                      if (parsed.unified !== undefined) {
                        result.unified = parsed.unified;
                      }
                      result.sizes = { ...result.sizes, ...parsed.sizes };
                    }
                  }
                }
                return result;
              };
              const extractSizeFromSpec = (specStr) => {
                if (!specStr) return "";
                const s = String(specStr);
                const sizePatterns = [
                  /(?:尺码|尺寸|规格|size)\s*[:：]?\s*(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|X{1,3}S|X{0,3}L|\d{1,2}X{0,2}[SL])/i,
                  /(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|X{1,3}S|X{0,3}L|\d{1,2}X{0,2}[SL])\s*(码|号|斤|cm|CM)/i,
                  /(?:^|[^A-Za-z])(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|X{1,3}S|X{0,3}L|\d{1,2}X{0,2}[SL])(?=[^A-Za-z]|$)/i,
                ];
                for (const pat of sizePatterns) {
                  const m = s.match(pat);
                  if (m) {
                    return m[1].toLowerCase();
                  }
                }
                return "";
              };
              data = data.map((row) => {
                const keyVal = row[step.config.key];
                const joined = lookup[keyVal];
                if (joined) {
                  let colVal = joined[step.config.col];
                  if (step.config.parseSizeCost) {
                    const platformVal = step.config.platformField
                      ? row[step.config.platformField]
                      : (context.shopName || context.platform || "");
                    const sizeFieldVal = step.config.sizeField
                      ? row[step.config.sizeField]
                      : "";
                    const parsed = parsePlatformSizeCost(colVal, platformVal);
                    const sizeStr = extractSizeFromSpec(sizeFieldVal);
                    let matchedCost = 0;
                    if (sizeStr && parsed.sizes[sizeStr] !== undefined) {
                      matchedCost = parsed.sizes[sizeStr];
                    } else if (sizeStr && parsed.sizes["l"] !== undefined) {
                      matchedCost = parsed.sizes["l"];
                    } else if (!sizeStr && parsed.unified !== null) {
                      matchedCost = parsed.unified;
                    } else if (Object.keys(parsed.sizes).length > 0) {
                      matchedCost = parsed.sizes["l"] !== undefined
                        ? parsed.sizes["l"]
                        : Object.values(parsed.sizes)[0];
                    } else if (parsed.unified !== null) {
                      matchedCost = parsed.unified;
                    }
                    colVal = matchedCost;
                  }
                  return { ...row, [step.config.col]: colVal };
                }
                return row;
              });
            }
            break;
          }
          case "keepDuplicate": {
            if (!step.config.column) break;
            const col = step.config.column;
            const countMap = {};
            data.forEach((row) => {
              const key = String(row[col] ?? row.val ?? "");
              countMap[key] = (countMap[key] || 0) + 1;
            });
            data = data.filter((row) => {
              const key = String(row[col] ?? row.val ?? "");
              return countMap[key] > 1;
            });
            break;
          }
          case "keepUnique": {
            if (!step.config.column) break;
            const col = step.config.column;
            const countMap = {};
            data.forEach((row) => {
              const key = String(row[col] ?? row.val ?? "");
              countMap[key] = (countMap[key] || 0) + 1;
            });
            data = data.filter((row) => {
              const key = String(row[col] ?? row.val ?? "");
              return countMap[key] === 1;
            });
            break;
          }
          case "intersect": {
            let compareRows = null;
            const cmpTable = tables.find((t) => t.id === step.config.table);
            if (cmpTable) {
              compareRows = cmpTable.rows;
            }
            if (!compareRows || !step.config.key || !step.config.compareKey) break;
            const compareSet = new Set(
              compareRows.map((r) => String(r[step.config.compareKey] ?? ""))
            );
            if (step.config.mode === "keepExist") {
              data = data.filter((row) =>
                compareSet.has(String(row[step.config.key] ?? ""))
              );
            } else if (step.config.mode === "keepNotExist") {
              data = data.filter(
                (row) => !compareSet.has(String(row[step.config.key] ?? ""))
              );
            }
            break;
          }
          case "aggregate": {
            if (data.length === 0) {
              data = [{ val: 0 }];
              break;
            }
            const values = data.map((r) => {
              if (step.config.column === "__expr__" && step.config.expr) {
                let expr = step.config.expr;
                const collectSub = (k, rawVal) => {
                  const v = Number(String(rawVal).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
                  return v;
                };
                expr = expr.replace(/{([^}]+)}/g, (m, k) => {
                  const v = r[k] ?? r.val ?? 0;
                  return collectSub(k, v);
                });
                const unparsed = expr.match(/{[^}]+}/g);
                if (unparsed && unparsed.length > 0) {
                  unparsed.forEach((u) => {
                    expr = expr.replace(u, "0");
                  });
                }
                try {
                  const result = new Function("return " + expr)();
                  const n = Number(result);
                  return isNaN(n) ? 0 : n;
                } catch (e) {
                  return 0;
                }
              }
              const v = step.config.column ? r[step.config.column] : r.val;
              const n = Number(
                String(v)
                  .replace(/[,，]/g, "")
                  .replace(/[¥￥$€£]/g, ""),
              );
              return isNaN(n) ? 0 : n;
            });
            let result = 0;
            switch (step.config.func) {
              case "sum":
                result = values.reduce((a, b) => a + b, 0);
                break;
              case "avg":
                result = values.reduce((a, b) => a + b, 0) / values.length;
                break;
              case "count":
                result = data.length;
                break;
              case "countDistinct": {
                const key = step.config.column || "val";
                result = new Set(data.map((r) => r[key])).size;
                break;
              }
              case "max":
                result = Math.max(...values);
                break;
              case "min":
                result = Math.min(...values);
                break;
              case "median": {
                const sorted = [...values].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                result =
                  sorted.length % 2 !== 0
                    ? sorted[mid]
                    : (sorted[mid - 1] + sorted[mid]) / 2;
                break;
              }
              case "product":
                result = values.reduce((a, b) => a * b, 1);
                break;
              case "first":
                result = values[0] || 0;
                break;
              case "last":
                result = values[values.length - 1] || 0;
                break;
              case "sumAbs":
                result = values.reduce((a, b) => a + Math.abs(b), 0);
                break;
              case "stddev": {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
                const avgSquareDiff =
                  squareDiffs.reduce((a, b) => a + b, 0) / values.length;
                result = Math.sqrt(avgSquareDiff);
                break;
              }
              case "mode": {
                const freq = {};
                values.forEach((v) => {
                  freq[v] = (freq[v] || 0) + 1;
                });
                let maxFreq = 0;
                let modeVal = 0;
                Object.entries(freq).forEach(([v, f]) => {
                  if (f > maxFreq) {
                    maxFreq = f;
                    modeVal = Number(v);
                  }
                });
                result = modeVal;
                break;
              }
              case "variance": {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
                result = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
                break;
              }
              default:
                result = values.reduce((a, b) => a + b, 0);
            }
            data = [{ val: result }];
            break;
          }
          case "formula": {
            if (!step.config.expr) break;
            // 如果data为空，但存在已配置字段值，创建虚拟数据行
            let row = data[0] || {};
            if (data.length === 0 && context.savedFieldValues) {
              row = { ...context.savedFieldValues };
              data = [row];
            }
            if (data.length === 0) break;
            const originalExpr = step.config.expr;
            let expr = originalExpr;
            const substitutions = {};
            const collectSub = (k, rawVal) => {
              const v = Number(String(rawVal).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
              substitutions[k] = { raw: rawVal, value: v };
              return v;
            };
            Object.keys(row).forEach((k) => {
              const v = collectSub(k, row[k]);
              const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              expr = expr.replace(new RegExp(`\\$\\{${safeKey}\\}`, "g"), v);
            });
            Object.keys(row).forEach((k) => {
              const v = collectSub(k, row[k]);
              const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              expr = expr.replace(new RegExp(`\\{${safeKey}\\}`, "g"), v);
            });
            if (context.savedFieldValues) {
              Object.keys(context.savedFieldValues).forEach((k) => {
                const v = collectSub(k, context.savedFieldValues[k]);
                const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                expr = expr.replace(new RegExp(`\\{${safeKey}\\}`, "g"), v);
                expr = expr.replace(new RegExp(`\\$\\{${safeKey}\\}`, "g"), v);
              });
            }
            // 将未解析的字段引用替换为0，避免ReferenceError
            const unresolvedRefs = expr.match(/\{[^}]+\}/g);
            if (unresolvedRefs) {
              unresolvedRefs.forEach((ref) => {
                console.warn(`[Formula] 未定义字段引用 ${ref}，已替换为0`);
              });
              expr = expr.replace(/\{[^}]+\}/g, "0");
            }
            let rawVal, formulaError;
            try {
              rawVal = Function(`"use strict"; const Math = window.Math; return (${expr})`)();
            } catch (e) {
              console.error("Formula error:", e);
              formulaError = e.message;
            }
            if (formulaError) {
              data = [{ val: 0, error: formulaError, _formulaDetail: { original: originalExpr, substitutions, evaluated: expr, error: formulaError } }];
            } else {
              const formattedVal = this._applyOutputFormat(rawVal, step.config.format);
              data = [{ val: formattedVal, _raw: Number(rawVal) || 0, _format: step.config.format || "none", _formulaDetail: { original: originalExpr, substitutions, evaluated: expr, result: Number(rawVal) || 0 } }];
            }
            break;
          }
          case "constant": {
            const val = step.config.value;
            const numVal = Number(val);
            data = [{ val: isNaN(numVal) ? val : numVal }];
            break;
          }
          case "text": {
            let result = step.config.value || "";
            Object.keys(context).forEach((k) => {
              result = result.replace(
                new RegExp(`\\{${k}\\}`, "g"),
                context[k] || "",
              );
            });
            if (data.length > 0) {
              const row = data[0];
              Object.keys(row).forEach((k) => {
                result = result.replace(
                  new RegExp(`\\{${k}\\}`, "g"),
                  row[k] ?? "",
                );
              });
            }
            data = [{ val: result }];
            break;
          }
          case "distinct": {
            const key = step.config.column || "val";
            const seen = new Set();
            data = data.filter((row) => {
              const v = row[key];
              if (seen.has(v)) return false;
              seen.add(v);
              return true;
            });
            break;
          }
          case "sort": {
            const key = step.config.column || "val";
            const dir = step.config.direction || "asc";
            data = [...data].sort((a, b) => {
              const av = a[key],
                bv = b[key];
              const an = Number(av),
                bn = Number(bv);
              if (!isNaN(an) && !isNaN(bn)) {
                return dir === "desc" ? bn - an : an - bn;
              }
              return dir === "desc"
                ? String(bv).localeCompare(String(av))
                : String(av).localeCompare(String(bv));
            });
            break;
          }
          case "limit": {
            const n = Number(step.config.count) || 100;
            data = data.slice(0, n);
            break;
          }
          case "lookup": {
            const pairs = step.config.pairs || [];
            const key = step.config.column || "val";
            const mode = step.config.mode || "exact";
            const onMiss = step.config.onMiss || "keep";
            const defaultValue = step.config.defaultValue !== undefined ? step.config.defaultValue : "";

            const findMatch = (val) => {
              const strVal = val != null ? String(val) : "";
              for (const pair of pairs) {
                const from = pair.from != null ? String(pair.from) : "";
                if (!from) continue;
                switch (mode) {
                  case "exact":
                    if (strVal === from) return pair.to;
                    break;
                  case "contains":
                    if (strVal.includes(from)) return pair.to;
                    break;
                  case "startsWith":
                    if (strVal.startsWith(from)) return pair.to;
                    break;
                  case "endsWith":
                    if (strVal.endsWith(from)) return pair.to;
                    break;
                  case "regex":
                    try {
                      const regex = new RegExp(from);
                      if (regex.test(strVal)) return pair.to;
                    } catch (e) {}
                    break;
                }
              }
              return null;
            };

            data = data.map((row) => {
              const match = findMatch(row[key]);
              let newValue;
              if (match !== null) {
                newValue = match;
              } else {
                switch (onMiss) {
                  case "keep":
                    newValue = row[key];
                    break;
                  case "default":
                    newValue = defaultValue;
                    break;
                  case "empty":
                    newValue = "";
                    break;
                  default:
                    newValue = row[key];
                }
              }
              return { ...row, [key]: newValue };
            });
            break;
          }
          case "condition": {
            data = data.map((row) => {
              const col = step.config.column || "val";
              const val = row[col];
              let match = false;
              const target = step.config.value;
              const v = val != null ? String(val) : "";
              const t = String(target ?? "");
              switch (step.config.op) {
                case "==":
                  match = v === t;
                  break;
                case "!=":
                  match = v !== t;
                  break;
                case ">":
                  match = Number(val) > Number(target);
                  break;
                case "<":
                  match = Number(val) < Number(target);
                  break;
                case ">=":
                  match = Number(val) >= Number(target);
                  break;
                case "<=":
                  match = Number(val) <= Number(target);
                  break;
                case "contains":
                  match = v.includes(t);
                  break;
                default:
                  match = true;
              }
              return {
                ...row,
                [step.config.resultCol || "condition_result"]: match
                  ? (step.config.trueValue ?? 1)
                  : (step.config.falseValue ?? 0),
              };
            });
            break;
          }
          case "group": {
            const key = step.config.column;
            if (!key) break;
            const groups = {};
            data.forEach((row) => {
              const gk = row[key];
              if (!groups[gk]) groups[gk] = [];
              groups[gk].push(row);
            });
            const func = step.config.func || "sum";
            const aggCol = step.config.aggColumn || "val";
            data = Object.entries(groups).map(([gk, rows]) => {
              const values = rows.map((r) => {
                const n = Number(
                  String(r[aggCol])
                    .replace(/[,，]/g, "")
                    .replace(/[¥￥$€£]/g, ""),
                );
                return isNaN(n) ? 0 : n;
              });
              let result = 0;
              switch (func) {
                case "sum":
                  result = values.reduce((a, b) => a + b, 0);
                  break;
                case "avg":
                  result = values.reduce((a, b) => a + b, 0) / values.length;
                  break;
                case "count":
                  result = rows.length;
                  break;
                case "max":
                  result = Math.max(...values);
                  break;
                case "min":
                  result = Math.min(...values);
                  break;
                default:
                  result = values.reduce((a, b) => a + b, 0);
              }
              return { [key]: gk, [aggCol]: result, _groupCount: rows.length };
            });
            break;
          }
          case "round": {
            const roundCol = step.config.column || "val";
            const decimals = step.config.decimals || 2;
            data = data.map((row) => {
              const val = Number(String(row[roundCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              return { ...row, val: isNaN(val) ? row[roundCol] : Number(val.toFixed(decimals)) };
            });
            break;
          }
          case "concat": {
            const columns = step.config.columns || [];
            const separator = step.config.separator || "";
            data = data.map((row) => {
              const values = columns.map((col) => row[col] ?? "").filter((v) => v !== "");
              return { ...row, val: values.join(separator) };
            });
            break;
          }
          case "substring": {
            const subCol = step.config.column || "val";
            const start = step.config.start || 0;
            const length = step.config.length || 10;
            data = data.map((row) => {
              const val = String(row[subCol] ?? "");
              return { ...row, val: val.substring(start, start + length) };
            });
            break;
          }
          case "date": {
            const dateCol = step.config.column || "val";
            const op = step.config.operation || "format";
            const format = step.config.format || "yyyy-mm-dd";
            data = data.map((row) => {
              const val = row[dateCol];
              let d;
              if (val instanceof Date) {
                d = val;
              } else {
                const str = String(val || "");
                const match = str.match(/(\d{4})[\-_年\.\/](\d{1,2})[\-_月\.\/](\d{1,2})/);
                if (match) {
                  d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
                } else {
                  d = new Date();
                }
              }
              let result;
              switch (op) {
                case "extractYear":
                  result = d.getFullYear();
                  break;
                case "extractMonth":
                  result = d.getMonth() + 1;
                  break;
                case "extractDay":
                  result = d.getDate();
                  break;
                case "addDays":
                  const days = step.config.days || 0;
                  d.setDate(d.getDate() + days);
                  result = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  break;
                case "format":
                default:
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  result = format.replace("yyyy", y).replace("mm", m).replace("dd", day);
                  break;
              }
              return { ...row, val: result };
            });
            break;
          }
          case "math": {
            const mathCol = step.config.column || "val";
            const mathOp = step.config.operation || "+";
            const mathVal = Number(step.config.value) || 0;
            data = data.map((row) => {
              const val = Number(String(row[mathCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              let result;
              switch (mathOp) {
                case "+":
                  result = val + mathVal;
                  break;
                case "-":
                  result = val - mathVal;
                  break;
                case "*":
                  result = val * mathVal;
                  break;
                case "/":
                  result = mathVal !== 0 ? val / mathVal : 0;
                  break;
                case "^":
                  result = Math.pow(val, mathVal);
                  break;
                case "%":
                  result = val % mathVal;
                  break;
                default:
                  result = val;
              }
              return { ...row, val: isNaN(val) ? row[mathCol] : result };
            });
            break;
          }
          case "rank": {
            const rankCol = step.config.column || "val";
            const rankDir = step.config.direction || "desc";
            const sorted = [...data].sort((a, b) => {
              const av = Number(String(a[rankCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              const bv = Number(String(b[rankCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              return rankDir === "desc" ? bv - av : av - bv;
            });
            const rankMap = {};
            sorted.forEach((row, idx) => {
              rankMap[row[rankCol]] = idx + 1;
            });
            data = data.map((row) => ({ ...row, val: rankMap[row[rankCol]] || 0 }));
            break;
          }
          case "diff": {
            const diffCol = step.config.column || "val";
            const baseCol = step.config.baseColumn;
            const asPercent = step.config.percent || false;
            data = data.map((row) => {
              const val = Number(String(row[diffCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              const base = Number(String(row[baseCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              let result = val - base;
              if (asPercent && base !== 0) {
                result = (result / base) * 100;
              }
              return { ...row, val: isNaN(val) || isNaN(base) ? 0 : result };
            });
            break;
          }
          case "ratio": {
            const numerator = step.config.numerator || "val";
            const denominator = step.config.denominator;
            const ratioAsPercent = step.config.percent || false;
            data = data.map((row) => {
              const num = Number(String(row[numerator]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              const den = Number(String(row[denominator]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              let result = den !== 0 ? num / den : 0;
              if (ratioAsPercent) {
                result = result * 100;
              }
              return { ...row, val: isNaN(num) || isNaN(den) ? 0 : result };
            });
            break;
          }
          case "union": {
            const unionTables = step.config.tables || [];
            let allData = [...data];
            unionTables.forEach((tableId) => {
              const table = tables.find((t) => t.id === tableId);
              if (table && table.rows) {
                allData = [...allData, ...table.rows];
              }
            });
            data = allData;
            break;
          }
          case "crossMatch": {
            const mode = step.config.mode || "keepIntersection";
            const columns = step.config.columns || ["val"];
            const makeKey = (row, cols) => cols.map((c) => String(row[c] ?? row.val ?? "")).join("||");
            if (mode === "removeDuplicates") {
              const seen = new Set();
              data = data.filter((row) => {
                const key = makeKey(row, columns);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            } else if (mode === "keepDuplicates") {
              const countMap = {};
              data.forEach((row) => {
                const key = makeKey(row, columns);
                countMap[key] = (countMap[key] || 0) + 1;
              });
              data = data.filter((row) => countMap[makeKey(row, columns)] > 1);
            } else {
              const cmpTable = tables.find((t) => t.id === step.config.table);
              const cmpRows = cmpTable ? cmpTable.rows : [];
              const cmpColumns = step.config.compareColumns && step.config.compareColumns.length > 0
                ? step.config.compareColumns
                : columns;
              const cmpSet = new Set(cmpRows.map((r) => makeKey(r, cmpColumns)));
              if (mode === "keepIntersection") {
                data = data.filter((row) => cmpSet.has(makeKey(row, columns)));
              } else if (mode === "keepDifference") {
                data = data.filter((row) => !cmpSet.has(makeKey(row, columns)));
              }
            }
            break;
          }
          case "runningTotal": {
            const col = step.config.column || "val";
            const orderCol = step.config.orderColumn;
            const dir = step.config.direction || "asc";
            let rows = [...data];
            if (orderCol) {
              rows.sort((a, b) => {
                const av = a[orderCol], bv = b[orderCol];
                const an = Number(av), bn = Number(bv);
                if (!isNaN(an) && !isNaN(bn)) {
                  return dir === "desc" ? bn - an : an - bn;
                }
                return dir === "desc"
                  ? String(bv).localeCompare(String(av))
                  : String(av).localeCompare(String(bv));
              });
            }
            let sum = 0;
            rows = rows.map((row) => {
              const v = Number(String(row[col] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
              sum += v;
              return { ...row, val: sum };
            });
            data = rows;
            break;
          }
          case "percentOfTotal": {
            const col = step.config.column || "val";
            const values = data.map((row) =>
              Number(String(row[col] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
            );
            const total = values.reduce((a, b) => a + b, 0);
            const asPercent = step.config.asPercent !== false;
            data = data.map((row, idx) => {
              const ratio = total !== 0 ? values[idx] / total : 0;
              return { ...row, val: asPercent ? ratio * 100 : ratio };
            });
            break;
          }
          case "movingAverage": {
            const maCol = step.config.column || "val";
            const windowSize = Number(step.config.windowSize) || 3;
            const targetCol = step.config.targetColumn || "moving_avg";
            const values = data.map((row) =>
              Number(String(row[maCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
            );
            data = data.map((row, idx) => {
              let sum = 0;
              let count = 0;
              const startIdx = Math.max(0, idx - windowSize + 1);
              for (let i = startIdx; i <= idx; i++) {
                sum += values[i];
                count++;
              }
              const avg = count > 0 ? sum / count : 0;
              return { ...row, [targetCol]: avg };
            });
            break;
          }
          case "binning": {
            const binCol = step.config.column || "val";
            const targetCol = step.config.targetColumn || "bin";
            const binType = step.config.binType || "equalWidth";
            const binCount = Number(step.config.binCount) || 5;
            const binLabels = step.config.binLabels || [];
            const customBins = step.config.customBins || [];
            const values = data.map((row) =>
              Number(String(row[binCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
            );
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const range = maxVal - minVal;
            const binWidth = range > 0 ? range / binCount : 1;
            data = data.map((row, idx) => {
              const val = values[idx];
              let binIndex = 0;
              let binLabel = "";
              if (binType === "equalWidth") {
                binIndex = range > 0 ? Math.min(Math.floor((val - minVal) / binWidth), binCount - 1) : 0;
                binLabel = binLabels[binIndex] || `区间${binIndex + 1}`;
              } else if (binType === "custom") {
                for (let i = 0; i < customBins.length; i++) {
                  const bin = customBins[i];
                  if (val >= (bin.min !== undefined ? Number(bin.min) : -Infinity) &&
                      val <= (bin.max !== undefined ? Number(bin.max) : Infinity)) {
                    binIndex = i;
                    binLabel = bin.label || `区间${i + 1}`;
                    break;
                  }
                }
                if (!binLabel) {
                  binLabel = "未分类";
                }
              }
              return { ...row, [targetCol]: binLabel };
            });
            break;
          }
          case "conditionalTag": {
            const conditions = step.config.conditions || [];
            const targetCol = step.config.targetColumn || "tag";
            const defaultTag = step.config.defaultTag || "";
            data = data.map((row) => {
              let matchedTag = defaultTag;
              for (const cond of conditions) {
                const col = cond.column || "val";
                const val = row[col] ?? row.val;
                const target = cond.value;
                const v = val != null ? String(val) : "";
                const t = target != null ? String(target) : "";
                let match = false;
                switch (cond.op) {
                  case "==": match = v === t; break;
                  case "!=": match = v !== t; break;
                  case ">": match = Number(val) > Number(target); break;
                  case "<": match = Number(val) < Number(target); break;
                  case ">=": match = Number(val) >= Number(target); break;
                  case "<=": match = Number(val) <= Number(target); break;
                  case "contains": match = v.includes(t); break;
                  case "notContains": match = !v.includes(t); break;
                  case "startsWith": match = v.startsWith(t); break;
                  case "endsWith": match = v.endsWith(t); break;
                  case "isEmpty": match = !v; break;
                  case "notEmpty": match = !!v; break;
                  case "regex": {
                    try { match = new RegExp(t).test(v); } catch { match = false; }
                    break;
                  }
                  default: match = false;
                }
                if (match) {
                  matchedTag = cond.tag || "";
                  break;
                }
              }
              return { ...row, [targetCol]: matchedTag };
            });
            break;
          }
          case "stringExtract": {
            const seCol = step.config.column || "val";
            const targetCol = step.config.targetColumn || "extracted";
            const extractType = step.config.extractType || "regex";
            data = data.map((row) => {
              const src = String(row[seCol] ?? row.val ?? "");
              let result = "";
              switch (extractType) {
                case "regex": {
                  try {
                    const regex = new RegExp(step.config.pattern || "");
                    const match = src.match(regex);
                    result = match ? (step.config.extractGroup ? match[Number(step.config.extractGroup)] : match[0]) : "";
                  } catch { result = ""; }
                  break;
                }
                case "substring": {
                  const start = Number(step.config.start) || 0;
                  const length = Number(step.config.length) || src.length;
                  result = src.substring(start, start + length);
                  break;
                }
                case "concat": {
                  const columns = step.config.columns || [];
                  const separator = step.config.separator || "";
                  const parts = columns.map(c => String(row[c] ?? ""));
                  result = parts.join(separator);
                  break;
                }
                case "split": {
                  const sep = step.config.separator || ",";
                  const index = Number(step.config.splitIndex) || 0;
                  const parts = src.split(sep);
                  result = parts[index] || "";
                  break;
                }
                case "trim":
                  result = src.trim();
                  break;
                case "upper":
                  result = src.toUpperCase();
                  break;
                case "lower":
                  result = src.toLowerCase();
                  break;
                default:
                  result = src;
              }
              return { ...row, [targetCol]: result };
            });
            break;
          }
          case "fillNA": {
            const fillCol = step.config.column || "val";
            const fillType = step.config.fillType || "value";
            const fillValue = step.config.fillValue || "";
            data = data.map((row) => {
              const currentVal = row[fillCol] ?? row.val;
              const isEmpty = currentVal === null || currentVal === undefined || currentVal === "" || 
                              (typeof currentVal === "number" && isNaN(currentVal));
              if (!isEmpty) return row;
              let newValue = currentVal;
              switch (fillType) {
                case "value":
                  newValue = fillValue;
                  break;
                case "zero":
                  newValue = 0;
                  break;
                case "empty":
                  newValue = "";
                  break;
                case "mean": {
                  const values = data.map(r => Number(r[fillCol] ?? r.val)).filter(v => !isNaN(v) && v !== null);
                  newValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                  break;
                }
                case "median": {
                  const values = data.map(r => Number(r[fillCol] ?? r.val)).filter(v => !isNaN(v) && v !== null);
                  if (values.length > 0) {
                    const sorted = [...values].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    newValue = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                  } else {
                    newValue = 0;
                  }
                  break;
                }
                case "mode": {
                  const freq = {};
                  data.forEach(r => {
                    const v = r[fillCol] ?? r.val;
                    if (v !== null && v !== undefined && v !== "" && !isNaN(Number(v))) {
                      const key = String(v);
                      freq[key] = (freq[key] || 0) + 1;
                    }
                  });
                  let maxFreq = 0;
                  let modeVal = fillValue;
                  Object.entries(freq).forEach(([k, f]) => {
                    if (f > maxFreq) { maxFreq = f; modeVal = k; }
                  });
                  newValue = modeVal;
                  break;
                }
                case "forward": {
                  // 前向填充 - 需要在循环外处理
                  break;
                }
                case "backward": {
                  // 后向填充 - 需要在循环外处理
                  break;
                }
                default:
                  newValue = fillValue;
              }
              return { ...row, [fillCol]: newValue };
            });
            // 处理前向/后向填充
            if (fillType === "forward" || fillType === "backward") {
              let lastValid = null;
              if (fillType === "forward") {
                for (let i = 0; i < data.length; i++) {
                  const currentVal = data[i][fillCol] ?? data[i].val;
                  const isEmpty = currentVal === null || currentVal === undefined || currentVal === "" ||
                                  (typeof currentVal === "number" && isNaN(currentVal));
                  if (!isEmpty) {
                    lastValid = currentVal;
                  } else if (lastValid !== null) {
                    data[i] = { ...data[i], [fillCol]: lastValid };
                  }
                }
              } else {
                for (let i = data.length - 1; i >= 0; i--) {
                  const currentVal = data[i][fillCol] ?? data[i].val;
                  const isEmpty = currentVal === null || currentVal === undefined || currentVal === "" ||
                                  (typeof currentVal === "number" && isNaN(currentVal));
                  if (!isEmpty) {
                    lastValid = currentVal;
                  } else if (lastValid !== null) {
                    data[i] = { ...data[i], [fillCol]: lastValid };
                  }
                }
              }
            }
            break;
          }
          case "normalize": {
            const normCol = step.config.column || "val";
            const targetCol = step.config.targetColumn || "normalized";
            const normType = step.config.normType || "minmax";
            const values = data.map((row) =>
              Number(String(row[normCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
            );
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const range = maxVal - minVal;
            const meanVal = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, v) => a + Math.pow(v - meanVal, 2), 0) / values.length;
            const stddev = Math.sqrt(variance);
            data = data.map((row, idx) => {
              const val = values[idx];
              let normalized = 0;
              switch (normType) {
                case "minmax":
                  normalized = range > 0 ? (val - minVal) / range : 0;
                  break;
                case "zscore":
                  normalized = stddev > 0 ? (val - meanVal) / stddev : 0;
                  break;
                case "decimal":
                  const maxAbs = Math.max(...values.map(v => Math.abs(v)));
                  normalized = maxAbs > 0 ? val / maxAbs : 0;
                  break;
                default:
                  normalized = val;
              }
              return { ...row, [targetCol]: normalized };
            });
            break;
          }
          case "valueNormalize": {
            const col = step.config.column || "val";
            const targetCol = step.config.targetColumn || "normalized_value";
            const rules = step.config.rules || [];
            const chineseNumMap = {
              '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
              '十': 10, '百': 100, '千': 1000, '万': 10000, '亿': 100000000,
              '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9,
              '拾': 10, '佰': 100, '仟': 1000, '萬': 10000, '億': 100000000
            };
            const chineseToNumber = (text) => {
              if (!text) return NaN;
              let num = 0, unit = 1, lastUnit = 1;
              const chars = String(text).split('');
              for (let i = chars.length - 1; i >= 0; i--) {
                const char = chars[i];
                if (chineseNumMap[char] !== undefined) {
                  if (chineseNumMap[char] >= 10) {
                    unit = chineseNumMap[char];
                    lastUnit = unit;
                  } else {
                    num += chineseNumMap[char] * unit;
                  }
                }
              }
              return num || NaN;
            };
            const matchRule = (value, rule) => {
              const text = String(value);
              switch (rule.matchType) {
                case "regex":
                  return new RegExp(rule.pattern || "\\d+\\.?\\d*").test(text);
                case "contains":
                  return text.includes(rule.pattern || "");
                case "equals":
                  return text === rule.pattern;
                case "prefix":
                  return text.startsWith(rule.pattern || "");
                case "suffix":
                  return text.endsWith(rule.pattern || "");
                case "chineseNumber":
                  return /[\u4e00-\u9fa5]/.test(text);
                case "percent":
                  return /\%/.test(text);
                case "currency":
                  return /[¥￥$€£]/.test(text) || /元|美元|欧元|英镑/.test(text);
                case "auto":
                  return /\d+/.test(text) || /[\u4e00-\u9fa5]/.test(text);
                default:
                  return true;
              }
            };
            const convertValue = (value, rule) => {
              let text = String(value);
              let num = NaN;
              switch (rule.convertType) {
                case "extractNumber":
                  const match = text.match(/(-?\d+\.?\d*)/);
                  num = match ? Number(match[1]) : NaN;
                  break;
                case "multiply":
                  num = Number(text.replace(/[^\d.-]/g, "")) * Number(rule.convertParam || 1);
                  break;
                case "divide":
                  num = Number(text.replace(/[^\d.-]/g, "")) / Number(rule.convertParam || 1);
                  break;
                case "mapTo":
                  num = Number(rule.convertParam);
                  break;
                case "chineseToNumber":
                  num = chineseToNumber(text);
                  break;
                case "percentToNumber":
                  num = Number(text.replace(/[\%％]/g, "")) / 100;
                  break;
                case "currencyToNumber":
                  num = Number(text.replace(/[¥￥$€£元美元欧元英镑,，]/g, ""));
                  break;
                default:
                  num = Number(text);
              }
              return isNaN(num) ? value : num;
            };
            data = data.map((row) => {
              const value = row[col] ?? row.val;
              for (const rule of rules) {
                if (matchRule(value, rule)) {
                  const converted = convertValue(value, rule);
                  return { ...row, [targetCol]: converted };
                }
              }
              return { ...row, [targetCol]: value };
            });
            break;
          }
          case "cumulativeMax": {
            const cmCol = step.config.column || "val";
            const orderCol = step.config.orderColumn;
            const dir = step.config.direction || "asc";
            let rows = [...data];
            if (orderCol) {
              rows.sort((a, b) => {
                const av = a[orderCol], bv = b[orderCol];
                const an = Number(av), bn = Number(bv);
                if (!isNaN(an) && !isNaN(bn)) {
                  return dir === "desc" ? bn - an : an - bn;
                }
                return dir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
              });
            }
            let maxVal = -Infinity;
            rows = rows.map((row) => {
              const v = Number(String(row[cmCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
              maxVal = Math.max(maxVal, v);
              return { ...row, val: maxVal };
            });
            data = rows;
            break;
          }
          case "cumulativeMin": {
            const cminCol = step.config.column || "val";
            const orderCol = step.config.orderColumn;
            const dir = step.config.direction || "asc";
            let rows = [...data];
            if (orderCol) {
              rows.sort((a, b) => {
                const av = a[orderCol], bv = b[orderCol];
                const an = Number(av), bn = Number(bv);
                if (!isNaN(an) && !isNaN(bn)) {
                  return dir === "desc" ? bn - an : an - bn;
                }
                return dir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
              });
            }
            let minVal = Infinity;
            rows = rows.map((row) => {
              const v = Number(String(row[cminCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
              minVal = Math.min(minVal, v);
              return { ...row, val: minVal };
            });
            data = rows;
            break;
          }
          case "lag": {
            const lagCol = step.config.column || "val";
            const lagN = Number(step.config.n) || 1;
            const targetCol = step.config.targetColumn || "lag_value";
            const values = data.map((row) => Number(String(row[lagCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
            data = data.map((row, idx) => {
              const lagVal = idx >= lagN ? values[idx - lagN] : null;
              return { ...row, [targetCol]: lagVal };
            });
            break;
          }
          case "lead": {
            const leadCol = step.config.column || "val";
            const leadN = Number(step.config.n) || 1;
            const targetCol = step.config.targetColumn || "lead_value";
            const values = data.map((row) => Number(String(row[leadCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
            data = data.map((row, idx) => {
              const leadVal = idx + leadN < values.length ? values[idx + leadN] : null;
              return { ...row, [targetCol]: leadVal };
            });
            break;
          }
          case "percentRank": {
            const prCol = step.config.column || "val";
            const targetCol = step.config.targetColumn || "percent_rank";
            const values = data.map((row) => Number(String(row[prCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
            const sorted = [...values].sort((a, b) => a - b);
            data = data.map((row, idx) => {
              const val = values[idx];
              const rank = sorted.findIndex(v => v >= val);
              const percent = sorted.length > 1 ? rank / (sorted.length - 1) : 0;
              return { ...row, [targetCol]: percent };
            });
            break;
          }
          case "rankDense": {
            const rdCol = step.config.column || "val";
            const rdDir = step.config.direction || "desc";
            const targetCol = step.config.targetColumn || "dense_rank";
            const values = data.map((row) => Number(String(row[rdCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
            const sortedUnique = [...new Set(values)].sort((a, b) => rdDir === "desc" ? b - a : a - b);
            const rankMap = {};
            sortedUnique.forEach((v, idx) => { rankMap[v] = idx + 1; });
            data = data.map((row, idx) => {
              return { ...row, [targetCol]: rankMap[values[idx]] || 0 };
            });
            break;
          }
          case "rankRowNumber": {
            const rrCol = step.config.column || "val";
            const rrDir = step.config.direction || "desc";
            const targetCol = step.config.targetColumn || "row_number";
            const indexed = data.map((row, idx) => ({ ...row, __idx: idx }));
            indexed.sort((a, b) => {
              const av = Number(String(a[rrCol] ?? a.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              const bv = Number(String(b[rrCol] ?? b.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
              if (av !== bv) return rrDir === "desc" ? bv - av : av - bv;
              return a.__idx - b.__idx;
            });
            indexed.forEach((row, idx) => { row[targetCol] = idx + 1; });
            indexed.sort((a, b) => a.__idx - b.__idx);
            data = indexed.map(row => { const { __idx, ...rest } = row; return rest; });
            break;
          }
          case "windowSum": {
            const wsCol = step.config.column || "val";
            const wsWindow = Number(step.config.windowSize) || 3;
            const targetCol = step.config.targetColumn || "window_sum";
            const values = data.map((row) => Number(String(row[wsCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
            data = data.map((row, idx) => {
              const start = Math.max(0, idx - wsWindow + 1);
              const sum = values.slice(start, idx + 1).reduce((a, b) => a + b, 0);
              return { ...row, [targetCol]: sum };
            });
            break;
          }
          case "windowAvg": {
            const waCol = step.config.column || "val";
            const waWindow = Number(step.config.windowSize) || 3;
            const targetCol = step.config.targetColumn || "window_avg";
            const values = data.map((row) => Number(String(row[waCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
            data = data.map((row, idx) => {
              const start = Math.max(0, idx - waWindow + 1);
              const slice = values.slice(start, idx + 1);
              const avg = slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
              return { ...row, [targetCol]: avg };
            });
            break;
          }
          case "jsonExtract": {
            const jeCol = step.config.column || "val";
            const jePath = step.config.path || "";
            const targetCol = step.config.targetColumn || "json_value";
            data = data.map((row) => {
              const jsonStr = String(row[jeCol] ?? row.val ?? "");
              let result = "";
              try {
                const obj = JSON.parse(jsonStr);
                if (jePath) {
                  const parts = jePath.split(".");
                  let current = obj;
                  for (const part of parts) {
                    if (current && typeof current === "object") {
                      current = current[part];
                    } else {
                      current = undefined;
                      break;
                    }
                  }
                  result = current !== undefined ? String(current) : "";
                } else {
                  result = jsonStr;
                }
              } catch {
                result = "";
              }
              return { ...row, [targetCol]: result };
            });
            break;
          }
          case "regexReplace": {
            const rrCol = step.config.column || "val";
            const rrPattern = step.config.pattern || "";
            const rrReplacement = step.config.replacement || "";
            const targetCol = step.config.targetColumn || "replaced";
            data = data.map((row) => {
              const src = String(row[rrCol] ?? row.val ?? "");
              let result = src;
              try {
                const regex = new RegExp(rrPattern, "g");
                result = src.replace(regex, rrReplacement);
              } catch {}
              return { ...row, [targetCol]: result };
            });
            break;
          }
          case "trim": {
            const tCol = step.config.column || "val";
            const tChars = step.config.chars;
            const targetCol = step.config.targetColumn || "trimmed";
            data = data.map((row) => {
              const src = String(row[tCol] ?? row.val ?? "");
              let result = src.trim();
              if (tChars) {
                const regex = new RegExp(`^[${tChars}]+|[${tChars}]+$`, "g");
                result = src.replace(regex, "");
              }
              return { ...row, [targetCol]: result };
            });
            break;
          }
          case "upperCase": {
            const ucCol = step.config.column || "val";
            const targetCol = step.config.targetColumn || "upper";
            data = data.map((row) => {
              const src = String(row[ucCol] ?? row.val ?? "");
              return { ...row, [targetCol]: src.toUpperCase() };
            });
            break;
          }
          case "lowerCase": {
            const lcCol = step.config.column || "val";
            const targetCol = step.config.targetColumn || "lower";
            data = data.map((row) => {
              const src = String(row[lcCol] ?? row.val ?? "");
              return { ...row, [targetCol]: src.toLowerCase() };
            });
            break;
          }
          case "dateDiff": {
            const date1Col = step.config.date1Column || "val";
            const date2Col = step.config.date2Column;
            const diffUnit = step.config.unit || "days";
            const targetCol = step.config.targetColumn || "date_diff";
            data = data.map((row) => {
              const parseDate = (val) => {
                if (val instanceof Date) return val;
                const str = String(val || "");
                const match = str.match(/(\d{4})[\-_年\.\/](\d{1,2})[\-_月\.\/](\d{1,2})/);
                if (match) {
                  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
                }
                return new Date();
              };
              const d1 = parseDate(row[date1Col]);
              const d2 = parseDate(row[date2Col]);
              const diffMs = d1 - d2;
              let result = 0;
              switch (diffUnit) {
                case "days": result = Math.floor(diffMs / (1000 * 60 * 60 * 24)); break;
                case "weeks": result = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)); break;
                case "months": result = (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth()); break;
                case "years": result = d1.getFullYear() - d2.getFullYear(); break;
                default: result = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              }
              return { ...row, [targetCol]: result };
            });
            break;
          }
          case "dateAdd": {
            const daCol = step.config.column || "val";
            const daUnit = step.config.unit || "days";
            const daValue = Number(step.config.value) || 0;
            const targetCol = step.config.targetColumn || "date_added";
            data = data.map((row) => {
              const val = row[daCol] ?? row.val;
              let d;
              if (val instanceof Date) {
                d = new Date(val);
              } else {
                const str = String(val || "");
                const match = str.match(/(\d{4})[\-_年\.\/](\d{1,2})[\-_月\.\/](\d{1,2})/);
                if (match) {
                  d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
                } else {
                  d = new Date();
                }
              }
              switch (daUnit) {
                case "days": d.setDate(d.getDate() + daValue); break;
                case "weeks": d.setDate(d.getDate() + daValue * 7); break;
                case "months": d.setMonth(d.getMonth() + daValue); break;
                case "years": d.setFullYear(d.getFullYear() + daValue); break;
                case "hours": d.setHours(d.getHours() + daValue); break;
                case "minutes": d.setMinutes(d.getMinutes() + daValue); break;
              }
              return { ...row, [targetCol]: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` };
            });
            break;
          }
        }
        stepResults.push({
          step: stepIdx,
          type: step.type,
          stepConfig: step.config,
          rows: data.length,
          prevRows: stepIdx > 0 ? (stepResults[stepIdx - 1]?.rows || 0) : 0,
          preview: data.slice(0, 5),
        });
      } catch (e) {
        console.error(`Step ${stepIdx} error:`, e);
        stepResults.push({
          step: stepIdx,
          type: step.type,
          stepConfig: step.config,
          error: e.message,
          rows: data.length,
          preview: data.slice(0, 3),
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
  // 调试预览用的步骤执行器
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
  // 对公式/聚合等步骤的输出值进行格式转换
  _applyOutputFormat(value, format) {
    if (value === null || value === undefined) return value;
    if (!format || format === "none") {
      // 不处理；保持原样（数字或字符串均可）
      return value;
    }
    // 非数字且要求数值类格式时，先尝试转换
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
        // 若传入的是 0~1 的小数，按 0.x 输出 0%~100%；若已 >1，按 v 输出
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
  // 公共：根据已配置的 format 格式化单个值（供其它调用方使用）
  formatValue(value, format) {
    return this._applyOutputFormat(value, format);
  },
  // 公共：获取所有支持的输出格式（供UI使用）
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
}; // ========== Common Components ==========
