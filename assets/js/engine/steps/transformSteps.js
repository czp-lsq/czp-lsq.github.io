const TransformSteps = {
  virtual(step, data, chineseToNumber) {
    if (!step.config.source || !step.config.target) return data;
    return data.map((row) => {
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
          const s = String(src || "").trim();
          if (!s) { result = 1; break; }
          const pureNum = /^\d+$/.exec(s);
          if (pureNum) { result = Number(pureNum[0]); break; }
          const pattern1 = /(\d+|[一二三四五六七八九十]+)\s*条装/;
          const m1 = s.match(pattern1);
          if (m1) {
            const num = Number(m1[1]) || chineseToNumber(m1[1]);
            result = num || 1;
            break;
          }
          const pattern1b = /(\d+|[一二三四五六七八九十]+)\s*包装/;
          const m1b = s.match(pattern1b);
          if (m1b) {
            const num = Number(m1b[1]) || chineseToNumber(m1b[1]);
            result = num || 1;
            break;
          }
          const pattern1c = /(\d+|[一二三四五六七八九十]+)\s*条\s*[/\\每]\s*[包袋盒件]/;
          const m1c = s.match(pattern1c);
          if (m1c) {
            const num = Number(m1c[1]) || chineseToNumber(m1c[1]);
            result = num || 1;
            break;
          }
          const pattern2 = /(\d+)\s*条/;
          const m2 = s.match(pattern2);
          if (m2) {
            result = Number(m2[1]) || 1;
            break;
          }
          const pattern2b = /([一二三四五六七八九十]+)\s*条/;
          const m2b = s.match(pattern2b);
          if (m2b) {
            result = chineseToNumber(m2b[1]) || 1;
            break;
          }
          const pattern3a = /(\d+|[一二三四五六七八九十]+)\s*色各\s*(\d+|[一二三四五六七八九十]+)\s*条/;
          const m3a = s.match(pattern3a);
          if (m3a) {
            const colors = Number(m3a[1]) || chineseToNumber(m3a[1]) || 1;
            const pieces = Number(m3a[2]) || chineseToNumber(m3a[2]) || 1;
            result = colors * pieces;
            break;
          }
          const pattern3b = /(\d+|[一二三四五六七八九十]+)\s*色各一/;
          const m3b = s.match(pattern3b);
          if (m3b) {
            const num = Number(m3b[1]) || chineseToNumber(m3b[1]);
            result = num || 1;
            break;
          }
          const pattern3c = /(\d+)\s*条\s*[*xX×]\s*(\d+)/;
          const m3c = s.match(pattern3c);
          if (m3c) {
            result = Number(m3c[1]) * Number(m3c[2]);
            break;
          }
          const plusCount = (s.match(/\+/g) || []).length;
          if (plusCount > 0) {
            result = plusCount + 1;
            break;
          }
          const separators = /[,，、\/\\|]+/;
          if (separators.test(s)) {
            const parts = s.split(separators).filter((p) => p.trim());
            if (parts.length > 1) {
              result = parts.length;
              break;
            }
          }
          const pieceUnitPattern = /(\d+)\s*[件个双套]/;
          const mUnit = s.match(pieceUnitPattern);
          if (mUnit) {
            result = Number(mUnit[1]) || 1;
            break;
          }
          const qtyPrefixPattern = /(?:数量|qty|x|×|\*)\s*(\d+)/i;
          const mQty = s.match(qtyPrefixPattern);
          if (mQty) {
            result = Number(mQty[1]) || 1;
            break;
          }
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
          if (matchedColors.size >= 2 && matchedColors.size <= 12) {
            result = matchedColors.size;
            break;
          }
          if (colorCount > 0 && colorCount <= 12) {
            result = colorCount;
            break;
          }
          result = 1;
          break;
        }
        case "splitPlus": {
          const s = String(src || "");
          result = (s.match(/\+/g) || []).length + 1;
          break;
        }
        case "parseSize": {
          const s = String(src || "").trim();
          if (!s) { result = ""; break; }
          const pattern1 = /\b(X{0,2}S|X{0,3}L|\d{0,2}X{0,2}[SL]|M)\s*(码|号|斤)/i;
          const m1 = s.match(pattern1);
          if (m1) {
            result = m1[1].toUpperCase();
            break;
          }
          const pattern2 = /[^A-Za-z0-9](X{0,2}S|X{0,3}L|\d{0,2}X{0,2}[SL]|M)(?![A-Za-z0-9])/i;
          const m2 = s.match(pattern2);
          if (m2) {
            result = m2[1].toUpperCase();
            break;
          }
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
          const cfg = step.config || {};
          const skuVal = row[cfg.skuField || "款号"] || "";
          const sizeVal = row[cfg.sizeField || "尺码"] || "";
          result = 0;
          if (!skuVal || !sizeVal) break;
          let targetTableId = cfg.costTableId;
          if (!targetTableId && cfg.context && cfg.context.shopName) {
            const autoMatch = (cfg.context.externals || []).find((e) =>
              e.sheetKey === cfg.context.shopName || e.name === cfg.context.shopName
            );
            if (autoMatch) targetTableId = autoMatch.id || autoMatch.sheetKey;
          }
          if (!targetTableId) break;
          const ext = (cfg.context?.externals || []).find((e) =>
            e.id === targetTableId || e.sheetKey === targetTableId
          );
          if (!ext) break;
          const costRows = ext.allData || ext.data || [];
          const costHeaders = ext.headers || (costRows.length > 0 ? Object.keys(costRows[0]) : []);
          const sizeToCol = {};
          const sizeToCost = {};
          for (const header of costHeaders) {
            if (!header) continue;
            const h = String(header).trim();
            if (/^(款号|SKU|id|ID|编号)$/i.test(h)) continue;
            const ma = h.match(/^([X\d]*[SLM])(?:码|号|斤)(\d+\.?\d*)$/i);
            if (ma) {
              const size = ma[1].toUpperCase();
              sizeToCol[size] = h;
              sizeToCost[size] = parseFloat(ma[2]);
              continue;
            }
            const mb = h.match(/^([A-Z\d]+)(\d+\.?\d*)$/i);
            if (mb) {
              const letters = mb[1];
              const costVal = parseFloat(mb[2]);
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
          const skuColName = cfg.skuCol || "款号";
          const matchedRow = costRows.find((r) => String(r[skuColName] || "").trim() === String(skuVal).trim());
          if (matchedRow) {
            const targetSize = String(sizeVal).trim().toUpperCase();
            if (sizeToCost[targetSize] !== undefined) {
              result = sizeToCost[targetSize];
            } else {
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
          const pctMatch = s.match(/(\d+\.?\d*)\s*%/);
          if (pctMatch) {
            result = Number(pctMatch[1]) / 100;
            break;
          }
          const numMatch = s.match(/-?\d+\.?\d*/);
          if (numMatch) {
            result = Number(numMatch[0]);
            break;
          }
          const cnNum = chineseToNumber(s);
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
        case "percent":
          result = (Number(src) || 0) / 100;
          break;
        case "substring": {
          const s = String(src ?? "");
          const start = Number(step.config.start) || 0;
          const len = step.config.length
            ? Number(step.config.length)
            : undefined;
          result = len !== undefined ? s.substr(start, len) : s.substr(start);
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
          result = (step.config.prefix || "") + s + (step.config.suffix || "");
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
      const multi = { ...row };
      targetNames.forEach((name) => {
        multi[name] = result;
      });
      return multi;
    });
  },
  concat(step, data) {
    const columns = step.config.columns || [];
    const separator = step.config.separator || "";
    return data.map((row) => {
      const values = columns.map((col) => row[col] ?? "").filter((v) => v !== "");
      return { ...row, val: values.join(separator) };
    });
  },
  substring(step, data) {
    const subCol = step.config.column || "val";
    const start = step.config.start || 0;
    const length = step.config.length || 10;
    return data.map((row) => {
      const val = String(row[subCol] ?? "");
      return { ...row, val: val.substring(start, start + length) };
    });
  },
  trim(step, data) {
    const tCol = step.config.column || "val";
    const tChars = step.config.chars;
    const targetCol = step.config.targetColumn || "trimmed";
    return data.map((row) => {
      const src = String(row[tCol] ?? row.val ?? "");
      let result = src.trim();
      if (tChars) {
        const regex = new RegExp(`^[${tChars}]+|[${tChars}]+$`, "g");
        result = src.replace(regex, "");
      }
      return { ...row, [targetCol]: result };
    });
  },
  upperCase(step, data) {
    const ucCol = step.config.column || "val";
    const targetCol = step.config.targetColumn || "upper";
    return data.map((row) => {
      const src = String(row[ucCol] ?? row.val ?? "");
      return { ...row, [targetCol]: src.toUpperCase() };
    });
  },
  lowerCase(step, data) {
    const lcCol = step.config.column || "val";
    const targetCol = step.config.targetColumn || "lower";
    return data.map((row) => {
      const src = String(row[lcCol] ?? row.val ?? "");
      return { ...row, [targetCol]: src.toLowerCase() };
    });
  },
  regexReplace(step, data) {
    const rrCol = step.config.column || "val";
    const rrPattern = step.config.pattern || "";
    const rrReplacement = step.config.replacement || "";
    const targetCol = step.config.targetColumn || "replaced";
    return data.map((row) => {
      const src = String(row[rrCol] ?? row.val ?? "");
      let result = src;
      try {
        const regex = new RegExp(rrPattern, "g");
        result = src.replace(regex, rrReplacement);
      } catch {}
      return { ...row, [targetCol]: result };
    });
  },
  stringExtract(step, data) {
    const seCol = step.config.column || "val";
    const targetCol = step.config.targetColumn || "extracted";
    const extractType = step.config.extractType || "regex";
    return data.map((row) => {
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
  },
};