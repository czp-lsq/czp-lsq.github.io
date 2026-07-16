const OtherSteps = {
  join(step, data, tables, externals) {
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
      return data.map((row) => {
        const keyVal = row[step.config.key];
        const joined = lookup[keyVal];
        if (joined) {
          let colVal = joined[step.config.col];
          if (step.config.parseSizeCost) {
            const platformVal = step.config.platformField
              ? row[step.config.platformField]
              : "";
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
    return data;
  },
  crossMatch(step, data, tables, applyRowFilter) {
    const cfg = step.config || {};
    const columns = cfg.columns && cfg.columns.length > 0
      ? cfg.columns
      : (cfg.key ? [cfg.key] : ["val"]);
    const compareColumns = cfg.compareColumns && cfg.compareColumns.length > 0
      ? cfg.compareColumns
      : (cfg.compareKey ? [cfg.compareKey] : columns);
    const mode = cfg.mode || "keepIntersection";
    const makeKey = (row, cols) => cols.map((c) => String(row[c] ?? row.val ?? "")).join("||");
    if (mode === "removeDuplicates") {
      const seen = new Set();
      return data.filter((row) => {
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
      return data.filter((row) => countMap[makeKey(row, columns)] > 1);
    } else if (mode === "mergeWithFilter") {
      const cmpTable = tables.find((t) => t.id === cfg.table);
      let cmpRows = cmpTable ? cmpTable.rows : [];
      if (cfg.filterColumn && cmpRows.length > 0) {
        const filterCol = cfg.filterColumn;
        const filterOp = cfg.filterOp || "==";
        const filterVal = cfg.filterValue;
        cmpRows = cmpRows.filter((row) => applyRowFilter(row, filterCol, filterOp, filterVal, false));
      }
      return [...data, ...cmpRows];
    } else if (mode === "semiJoin" || mode === "antiJoin") {
      if (cfg.selfFilterColumn) {
        const sfCol = cfg.selfFilterColumn;
        const sfOp = cfg.selfFilterOp || "==";
        const sfVal = cfg.selfFilterValue;
        data = data.filter((row) => applyRowFilter(row, sfCol, sfOp, sfVal, true));
      }
      const cmpTable = tables.find((t) => t.id === cfg.table);
      let cmpRows = cmpTable ? cmpTable.rows : [];
      if (cfg.filterColumn && cmpRows.length > 0) {
        const filterCol = cfg.filterColumn;
        const filterOp = cfg.filterOp || "==";
        const filterVal = cfg.filterValue;
        cmpRows = cmpRows.filter((row) => applyRowFilter(row, filterCol, filterOp, filterVal, false));
      }
      const cmpSet = new Set(cmpRows.map((r) => makeKey(r, compareColumns)));
      if (mode === "semiJoin") {
        return data.filter((row) => cmpSet.has(makeKey(row, columns)));
      } else {
        return data.filter((row) => !cmpSet.has(makeKey(row, columns)));
      }
    } else {
      const cmpTable = tables.find((t) => t.id === cfg.table);
      let cmpRows = cmpTable ? cmpTable.rows : [];
      if (cfg.filterColumn && cmpRows.length > 0) {
        const filterCol = cfg.filterColumn;
        const filterOp = cfg.filterOp || "==";
        const filterVal = cfg.filterValue;
        cmpRows = cmpRows.filter((row) => applyRowFilter(row, filterCol, filterOp, filterVal, false));
      }
      const cmpSet = new Set(cmpRows.map((r) => makeKey(r, compareColumns)));
      if (mode === "keepIntersection" || mode === "keepExist") {
        return data.filter((row) => cmpSet.has(makeKey(row, columns)));
      } else if (mode === "keepDifference" || mode === "keepNotExist") {
        return data.filter((row) => !cmpSet.has(makeKey(row, columns)));
      }
    }
    return data;
  },
  intersect(step, data, tables, applyRowFilter) {
    return OtherSteps.crossMatch({ ...step, type: "crossMatch" }, data, tables, applyRowFilter);
  },
  formula(step, data, context, applyOutputFormat) {
    if (!step.config.expr) return data;
    let row = data[0] || {};
    if (data.length === 0 && context.savedFieldValues) {
      row = { ...context.savedFieldValues };
      data = [row];
    }
    if (data.length === 0) return data;
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
    const unresolvedRefs = expr.match(/\{[^}]+\}/g);
    if (unresolvedRefs) {
      unresolvedRefs.forEach((ref) => {
        console.warn(`[Formula] 未定义字段引用 ${ref}，已替换为0`);
      });
      expr = expr.replace(/\{[^}]+\}/g, "0");
    }
    let rawVal, formulaError;
    try {
      rawVal = Function(`"use strict"; const Math = globalThis.Math; return (${expr})`)();
    } catch (e) {
      console.error("Formula error:", e);
      formulaError = e.message;
    }
    if (formulaError) {
      return [{ val: 0, error: formulaError, _formulaDetail: { original: originalExpr, substitutions, evaluated: expr, error: formulaError } }];
    } else {
      const formattedVal = applyOutputFormat(rawVal, step.config.format);
      return [{ val: formattedVal, _raw: Number(rawVal) || 0, _format: step.config.format || "none", _formulaDetail: { original: originalExpr, substitutions, evaluated: expr, result: Number(rawVal) || 0 } }];
    }
  },
  constant(step) {
    const val = step.config.value;
    const numVal = Number(val);
    return [{ val: isNaN(numVal) ? val : numVal }];
  },
  text(step, data, context) {
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
    return [{ val: result }];
  },
  sort(step, data) {
    const key = step.config.column || "val";
    const dir = step.config.direction || "asc";
    return [...data].sort((a, b) => {
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
  },
  limit(step, data) {
    const n = Number(step.config.count) || 100;
    return data.slice(0, n);
  },
  lookup(step, data) {
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
    return data.map((row) => {
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
  },
  condition(step, data) {
    return data.map((row) => {
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
  },
  binning(step, data) {
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
    return data.map((row, idx) => {
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
  },
  conditionalTag(step, data) {
    const conditions = step.config.conditions || [];
    const targetCol = step.config.targetColumn || "tag";
    const defaultTag = step.config.defaultTag || "";
    return data.map((row) => {
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
  },
  fillNA(step, data) {
    const fillCol = step.config.column || "val";
    const fillType = step.config.fillType || "value";
    const fillValue = step.config.fillValue || "";
    let result = data.map((row) => {
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
        default:
          newValue = fillValue;
      }
      return { ...row, [fillCol]: newValue };
    });
    if (fillType === "forward" || fillType === "backward") {
      let lastValid = null;
      if (fillType === "forward") {
        for (let i = 0; i < result.length; i++) {
          const currentVal = result[i][fillCol] ?? result[i].val;
          const isEmpty = currentVal === null || currentVal === undefined || currentVal === "" ||
                          (typeof currentVal === "number" && isNaN(currentVal));
          if (!isEmpty) {
            lastValid = currentVal;
          } else if (lastValid !== null) {
            result[i] = { ...result[i], [fillCol]: lastValid };
          }
        }
      } else {
        for (let i = result.length - 1; i >= 0; i--) {
          const currentVal = result[i][fillCol] ?? result[i].val;
          const isEmpty = currentVal === null || currentVal === undefined || currentVal === "" ||
                          (typeof currentVal === "number" && isNaN(currentVal));
          if (!isEmpty) {
            lastValid = currentVal;
          } else if (lastValid !== null) {
            result[i] = { ...result[i], [fillCol]: lastValid };
          }
        }
      }
    }
    return result;
  },
  valueNormalize(step, data) {
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
    return data.map((row) => {
      const value = row[col] ?? row.val;
      for (const rule of rules) {
        if (matchRule(value, rule)) {
          const converted = convertValue(value, rule);
          return { ...row, [targetCol]: converted };
        }
      }
      return { ...row, [targetCol]: value };
    });
  },
  jsonExtract(step, data) {
    const jeCol = step.config.column || "val";
    const jePath = step.config.path || "";
    const targetCol = step.config.targetColumn || "json_value";
    return data.map((row) => {
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
  },
};