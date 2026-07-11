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
    for (const table of tables) {
      if (table.rows && table.rows.length > 0) {
        for (const row of table.rows.slice(0, 100)) {
          for (const val of Object.values(row)) {
            if (val instanceof Date) {
              return {
                year: val.getFullYear(),
                month: val.getMonth() + 1,
                day: val.getDate(),
              };
            }
            const str = String(val || "");
            const datePatterns = [
              { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true },
              { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false },
              { regex: /(\d{4})[\-_\/\.](\d{1,2})[\-_\/\.](\d{1,2})/, hasDay: true },
              { regex: /(\d{4})(\d{2})(\d{2})/, hasDay: true },
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
                const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
                const day = p.hasDay && match[3]
                  ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
                  : null;
                if (year >= 2000 && year <= 2100) {
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
            data = data.filter((row) => {
              const val = row[step.config.column] ?? row.val;
              const target = step.config.value;
              const v = val != null ? String(val) : "";
              const t = String(target ?? "");
              switch (step.config.op) {
                case "==":
                  return v === t;
                case "!=":
                  return v !== t;
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
                case "splitPlus": {
                  const s = String(src || "");
                  result = (s.match(/\+/g) || []).length + 1;
                  break;
                }
                case "toNumber": {
                  const n = Number(
                    String(src)
                      .replace(/[,，]/g, "")
                      .replace(/[¥￥$€£]/g, ""),
                  );
                  result = isNaN(n) ? 0 : n;
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
              return { ...row, [step.config.target]: result };
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
              data = data.map((row) => {
                const keyVal = row[step.config.key];
                const joined = lookup[keyVal];
                if (joined) {
                  return { ...row, [step.config.col]: joined[step.config.col] };
                }
                return row;
              });
            }
            break;
          }
          case "aggregate": {
            if (data.length === 0) {
              data = [{ val: 0 }];
              break;
            }
            const values = data.map((r) => {
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
            if (!step.config.expr || data.length === 0) break;
            const row = data[0];
            let expr = step.config.expr;
            Object.keys(row).forEach((k) => {
              const v =
                Number(
                  String(row[k])
                    .replace(/[,，]/g, "")
                    .replace(/[¥￥$€£]/g, ""),
                ) || 0;
              const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              expr = expr.replace(new RegExp(`\\$\\{${safeKey}\\}`, "g"), v);
            });
            Object.keys(row).forEach((k) => {
              const v =
                Number(
                  String(row[k])
                    .replace(/[,，]/g, "")
                    .replace(/[¥￥$€£]/g, ""),
                ) || 0;
              const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              expr = expr.replace(new RegExp(`\\{${safeKey}\\}`, "g"), v);
            });
            if (context.savedFieldValues) {
              Object.keys(context.savedFieldValues).forEach((k) => {
                const v =
                  Number(
                    String(context.savedFieldValues[k])
                      .replace(/[,，]/g, "")
                      .replace(/[¥￥$€£]/g, ""),
                  ) || 0;
                const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                expr = expr.replace(new RegExp(`\\{${safeKey}\\}`, "g"), v);
                expr = expr.replace(new RegExp(`\\$\\{${safeKey}\\}`, "g"), v);
              });
            }
            try {
              const val = Function(`"use strict"; 
                                        const Math = window.Math;
                                        return (${expr})
                                    `)();
              data = [{ val: Number(val) || 0 }];
            } catch (e) {
              console.error("Formula error:", e);
              data = [{ val: 0, error: e.message }];
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
            const lookupMap = {};
            (step.config.pairs || []).forEach((p) => {
              lookupMap[p.from] = p.to;
            });
            const key = step.config.column || "val";
            data = data.map((row) => ({
              ...row,
              [key]:
                lookupMap[row[key]] !== undefined
                  ? lookupMap[row[key]]
                  : row[key],
            }));
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
        }
        stepResults.push({
          step: stepIdx,
          type: step.type,
          rows: data.length,
          preview: data.slice(0, 5),
        });
      } catch (e) {
        console.error(`Step ${stepIdx} error:`, e);
        stepResults.push({
          step: stepIdx,
          type: step.type,
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
  getPresetTemplates() {
    return {
      all: [
        {
          id: "profit_simple",
          category: "profit",
          platform: "all",
          name: "简易利润计算",
          desc: "销售额 - 成本 - 费用 = 利润",
          level: 0,
          steps: [
            { type: "source", config: { table: "", column: "销售额" } },
            { type: "aggregate", config: { func: "sum" } },
            { type: "formula", config: { expr: "{val} * 0.7" } },
          ],
        },
        {
          id: "roi_calc",
          category: "profit",
          platform: "all",
          name: "ROI投资回报率",
          desc: "(收益 - 成本) / 成本 × 100%",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "成交额" } },
            { type: "aggregate", config: { func: "sum" } },
            {
              type: "formula",
              config: { expr: "({val} - 1000) / 1000 * 100" },
            },
          ],
        },
        {
          id: "avg_order",
          category: "sales",
          platform: "all",
          name: "客单价计算",
          desc: "总销售额 / 订单数",
          level: 0,
          steps: [
            { type: "source", config: { table: "", column: "订单金额" } },
            { type: "aggregate", config: { func: "avg" } },
          ],
        },
        {
          id: "conversion_rate",
          category: "sales",
          platform: "all",
          name: "转化率计算",
          desc: "成交订单数 / 访客数 × 100%",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "访客数" } },
            { type: "aggregate", config: { func: "sum" } },
            { type: "formula", config: { expr: "{val} / 1000 * 100" } },
          ],
        },
        {
          id: "sum_filtered",
          category: "cost",
          platform: "all",
          name: "求和（排除退款）",
          desc: "排除已退款订单后对金额求和",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "订单金额" } },
            {
              type: "filter",
              config: { column: "val", op: "!=", value: "退款成功" },
            },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
        {
          id: "cost_calc",
          category: "cost",
          platform: "all",
          name: "商品成本×数量",
          desc: "从成本表关联单价，再乘以解析数量",
          level: 2,
          steps: [
            { type: "source", config: { table: "", column: "商品id" } },
            {
              type: "join",
              config: {
                table: "",
                key: "商品id",
                fk: "商品ID",
                col: "成本单价",
              },
            },
            {
              type: "virtual",
              config: {
                source: "商品规格",
                target: "解析数量",
                rule: "parseQty",
              },
            },
            { type: "formula", config: { expr: "{val} * {解析数量}" } },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
      ],
      pdd: [
        {
          id: "pdd_revenue",
          category: "sales",
          platform: "pdd",
          name: "拼多多·销售收入",
          desc: "汇总订单实收金额（排除退款）",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "商家实收金额" } },
            {
              type: "filter",
              config: { column: "售后状态", op: "!=", value: "退款成功" },
            },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
        {
          id: "pdd_cost",
          category: "cost",
          platform: "pdd",
          name: "拼多多·商品成本",
          desc: "从产品成本表关联单价 × 解析数量",
          level: 2,
          steps: [
            { type: "source", config: { table: "", column: "商品id" } },
            {
              type: "join",
              config: {
                table: "",
                key: "商品id",
                fk: "商品ID",
                col: "成本单价",
              },
            },
            {
              type: "virtual",
              config: {
                source: "商品规格",
                target: "解析数量",
                rule: "parseQty",
              },
            },
            { type: "formula", config: { expr: "{val} * {解析数量}" } },
            {
              type: "filter",
              config: { column: "售后状态", op: "!=", value: "退款成功" },
            },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
        {
          id: "pdd_commission",
          category: "cost",
          platform: "pdd",
          name: "拼多多·平台扣点",
          desc: "订单金额 × 平台扣点比例",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "商家实收金额" } },
            { type: "aggregate", config: { func: "sum" } },
            { type: "formula", config: { expr: "{val} * 0.006" } },
          ],
        },
        {
          id: "pdd_profit",
          category: "profit",
          platform: "pdd",
          name: "拼多多·净利润",
          desc: "销售收入 - 商品成本 - 平台扣点",
          level: 2,
          steps: [
            { type: "source", config: { table: "", column: "商家实收金额" } },
            { type: "aggregate", config: { func: "sum" } },
            { type: "formula", config: { expr: "{val} * 0.7" } },
          ],
        },
      ],
      taobao: [
        {
          id: "tb_revenue",
          category: "sales",
          platform: "taobao",
          name: "淘宝·销售收入",
          desc: "汇总订单实付金额（排除退款）",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "用户实付金额" } },
            {
              type: "filter",
              config: { column: "订单状态", op: "!=", value: "退款成功" },
            },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
        {
          id: "tb_commission",
          category: "cost",
          platform: "taobao",
          name: "淘宝·技术服务费",
          desc: "订单金额 × 佣金比例",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "用户实付金额" } },
            { type: "aggregate", config: { func: "sum" } },
            { type: "formula", config: { expr: "{val} * 0.05" } },
          ],
        },
      ],
      douyin: [
        {
          id: "dy_revenue",
          category: "sales",
          platform: "douyin",
          name: "抖音·GMV汇总",
          desc: "汇总订单支付金额",
          level: 0,
          steps: [
            { type: "source", config: { table: "", column: "订单支付金额" } },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
        {
          id: "dy_refund",
          category: "cost",
          platform: "douyin",
          name: "抖音·退款金额",
          desc: "汇总退款成功订单金额",
          level: 1,
          steps: [
            { type: "source", config: { table: "", column: "订单支付金额" } },
            {
              type: "filter",
              config: { column: "售后状态", op: "==", value: "退款成功" },
            },
            { type: "aggregate", config: { func: "sum" } },
          ],
        },
      ],
    };
  },
  getFormulaHints() {
    return [
      { key: "val", desc: "上一步的计算结果" },
      { key: "+", desc: "加法运算" },
      { key: "-", desc: "减法运算" },
      { key: "*", desc: "乘法运算" },
      { key: "/", desc: "除法运算" },
      { key: "Math.abs()", desc: "绝对值" },
      { key: "Math.round()", desc: "四舍五入" },
      { key: "Math.floor()", desc: "向下取整" },
      { key: "Math.ceil()", desc: "向上取整" },
      { key: "Math.max()", desc: "最大值" },
      { key: "Math.min()", desc: "最小值" },
      { key: "Math.pow()", desc: "幂运算" },
      { key: "Math.sqrt()", desc: "平方根" },
      { key: "toFixed(2)", desc: "保留2位小数" },
    ];
  },
}; // ========== Common Components ==========
