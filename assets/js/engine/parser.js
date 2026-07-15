// engine/parser.js - Excel 模板解析器 (TemplateParser)
﻿const TemplateParser = {
  colLetters(num) {
    let result = "";
    let n = num;
    while (n >= 0) {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  },
  normalizeText(str) {
    if (str == null) return "";
    return String(str).replace(/\s/g, "").trim();
  },
  getAllXChars() {
    return [
      "x",
      "X",
      "×",
      "✕",
      "✖",
      "✗",
      "✘",
      "ｘ",
      "Ｘ",
      "⨯",
      "╳",
      "χ",
      "Χ",
      "х",
      "Х",
      "❌",
      "❎",
      "✕",
      "✖",
      "×",
      "x",
      "X",
      "*",
      "＊",
      "✳",
      "✴",
      "❋",
      "❊",
      "✧",
      "✦",
      "⋇",
      "⋆",
      "∗",
      "⚹",
    ];
  },
  getXCharRegex() {
    const xChars = this.getAllXChars();
    const escaped = xChars
      .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("");
    return new RegExp("[" + escaped + "]", "g");
  },
  getXCharClass() {
    const xChars = this.getAllXChars();
    return xChars.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
  },
  countXChars(str) {
    const xRegex = this.getXCharRegex();
    const matches = str.match(xRegex);
    return matches ? matches.length : 0;
  },
  countXGroups(str) {
    if (str == null) return 0;
    const s = String(str).trim();
    if (!s) return 0;
    const xc = this.getXCharClass();
    const xRegex = new RegExp("[" + xc + "]+", "g");
    const matches = s.match(xRegex);
    return matches ? matches.length : 0;
  },
  extractXGroupContexts(str) {
    if (str == null) return [];
    const s = String(str).trim();
    if (!s) return [];
    const xc = this.getXCharClass();
    const groupRegex = new RegExp("[" + xc + "]+", "g");
    const contexts = [];
    const isPureX = new RegExp("^[" + xc + "]+$").test(this.normalizeText(s));
    let hasDateUnit = false;
    let match;
    while ((match = groupRegex.exec(s)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const groupText = match[0];
      let afterText = s.substring(end);
      const nextXPos = afterText.search(new RegExp("[" + xc + "]"));
      if (nextXPos > 0) {
        afterText = afterText.substring(0, nextXPos).trim();
      } else if (nextXPos === 0) {
        afterText = "";
      } else {
        afterText = afterText.trim();
      }
      let beforeText = s.substring(0, start);
      const prevXMatch = beforeText.match(
        new RegExp("[" + xc + "][^" + xc + "]*$", "g"),
      );
      if (prevXMatch && prevXMatch.length > 0) {
        const lastPrev = prevXMatch[prevXMatch.length - 1];
        const cutIdx = beforeText.lastIndexOf(lastPrev) + 1;
        beforeText = beforeText.substring(cutIdx).trim();
      }
      beforeText = beforeText
        .replace(new RegExp("[" + xc + "]+", "g"), "")
        .trim();
      const cleanBeforeText = beforeText.replace(/[：:，,。、；;！!？?\s]+$/, "");
      let semanticLabel = "";
      let semanticType = "unknown";
      const dateUnits = ["年", "月", "日", "号", "季度", "周", "星期"];
      const shopUnits = [
        "店铺",
        "店",
        "门店",
        "商店",
        "商城",
        "专柜",
        "网点",
        "站点",
        "品牌",
        "铺",
        "名称",
        "名字",
      ];
      if (isPureX) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else if (afterText && dateUnits.some((u) => afterText.startsWith(u))) {
        hasDateUnit = true;
        semanticType = "date";
        for (const unit of dateUnits) {
          if (afterText.startsWith(unit)) {
            semanticLabel = unit;
            if (unit === "年") semanticType = "year";
            else if (unit === "月") semanticType = "month";
            else if (unit === "日" || unit === "号") semanticType = "day";
            else if (unit === "季度") semanticType = "quarter";
            else if (unit === "周" || unit === "星期") semanticType = "week";
            break;
          }
        }
      } else if (
        beforeText &&
        dateUnits.some((u) => cleanBeforeText.endsWith(u))
      ) {
        hasDateUnit = true;
        semanticType = "date";
        for (const unit of dateUnits) {
          if (cleanBeforeText.endsWith(unit)) {
            semanticLabel = unit;
            if (unit === "年") semanticType = "year";
            else if (unit === "月") semanticType = "month";
            else if (unit === "日" || unit === "号") semanticType = "day";
            else if (unit === "季度") semanticType = "quarter";
            else if (unit === "周" || unit === "星期") semanticType = "week";
            break;
          }
        }
      } else if (
        afterText &&
        shopUnits.some((u) => afterText.startsWith(u))
      ) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else if (
        beforeText &&
        shopUnits.some((u) => {
          const unit = u;
          return (
            cleanBeforeText.endsWith(unit) ||
            beforeText.endsWith(unit + "：") ||
            beforeText.endsWith(unit + ":")
          );
        })
      ) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else if (groupText.length >= 2) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else {
        semanticLabel =
          afterText || beforeText || `第${contexts.length + 1}处`;
      }
      contexts.push({
        groupIndex: contexts.length,
        groupText,
        before: beforeText,
        after: afterText,
        semanticLabel,
        semanticType,
        xCount: groupText.length,
      });
    }
    return contexts;
  },
  isTextMarker(str, debugInfo) {
    if (str == null) {
      if (debugInfo) debugInfo.reason = "null value";
      return false;
    }
    const raw = String(str);
    const s = raw.trim();
    if (!s) {
      if (debugInfo) debugInfo.reason = "empty string";
      return false;
    }
    const normalized = this.normalizeText(s);
    const xc = this.getXCharClass();
    const xRegex = this.getXCharRegex();
    if (!xRegex.test(s)) {
      if (debugInfo) debugInfo.reason = "no X chars found";
      return false;
    } // 核心规则1：纯X序列 = 店铺名占位（如 xxxx, xx, xxxxxx）
    if (
      new RegExp("^[" + xc + "]+$").test(normalized) &&
      normalized.length >= 1 &&
      normalized.length <= 20
    ) {
      if (debugInfo) {
        debugInfo.reason = "纯X序列(店铺名占位)";
        debugInfo.match = "shop_name";
      }
      return true;
    } // 核心规则2：X+日期单位 组合 = 日期占位
    // 支持格式：xx年xx月xx日, xx年xx月, xxxx年xx月, xx年xx月xx日
    const datePattern1 = new RegExp(
      "[" +
        xc +
        "]{1,6}\\s*年\\s*[" +
        xc +
        "]{1,4}\\s*月\\s*[" +
        xc +
        "]{0,4}\\s*日?",
    );
    if (datePattern1.test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X年X月X日)";
        debugInfo.match = "date_full";
      }
      return true;
    } // 单独年份: xx年, xxxx年
    if (new RegExp("[" + xc + "]{1,6}\\s*年").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X年)";
        debugInfo.match = "date_year";
      }
      return true;
    } // 单独月份: xx月
    if (new RegExp("[" + xc + "]{1,6}\\s*月").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X月)";
        debugInfo.match = "date_month";
      }
      return true;
    } // 单独日期: xx日
    if (new RegExp("[" + xc + "]{1,6}\\s*日").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X日)";
        debugInfo.match = "date_day";
      }
      return true;
    } // 店铺名占位：xxxx店铺, xxx店, xxxx名称
    if (
      new RegExp(
        "[" +
          xc +
          "]{1,20}\\s*(店|店铺|门店|商店|商城|专柜|网点|站点|品牌|铺|名称|名字)$",
      ).test(s)
    ) {
      if (debugInfo) {
        debugInfo.reason = "X+店铺单位(店铺名)";
        debugInfo.match = "x_shop_unit";
      }
      return true;
    } // 标签+X模式：如 "店铺名：xxxx" "日期：xx年xx月"
    if (
      new RegExp(
        "(店铺|店铺名|店铺名称|店名|门店|门店名|名称|品牌|商家|商铺|商店|店|铺|名|日期|时间|年月|月份|年度|数据周期|报表周期|数据日期|报表日期|统计周期|统计日期|制表日期|填表日期|周期|期间)\\s*[：:]\\s*[" +
          xc +
          "]{1,20}",
      ).test(s)
    ) {
      if (debugInfo) {
        debugInfo.reason = "标签+X模式";
        debugInfo.match = "label_x";
      }
      return true;
    } // 括号内的X
    if (new RegExp("[（(]\\s*[" + xc + "]+\\s*[）)]").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "括号内X";
        debugInfo.match = "parens_x";
      }
      return true;
    } // 中文占位词
    if (
      /^(某某|待填|占位|填充|示例|空|无|N\/A|n\/a|NA|na|--|—|－|－－)(年|月|日|期|份|店铺|门店|名称|数据|表|单|店|铺)?$/.test(
        s,
      )
    ) {
      if (debugInfo) {
        debugInfo.reason = "中文占位词";
        debugInfo.match = "zh_placeholder";
      }
      return true;
    } // 日期范围：xx年xx月 ~ xx年xx月
    if (
      new RegExp(
        "[" +
          xc +
          "]{1,6}\\s*年\\s*[" +
          xc +
          "]{1,4}\\s*月?\\s*[～~至\\-—]\\s*[" +
          xc +
          "]{1,6}\\s*年\\s*[" +
          xc +
          "]{1,4}\\s*月?",
      ).test(s)
    ) {
      if (debugInfo) {
        debugInfo.reason = "日期范围";
        debugInfo.match = "date_range";
      }
      return true;
    } // 金额占位：¥xxxx 或 xxxx元
    if (new RegExp("^[¥￥$]\\s*[" + xc + "]{1,12}$").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "金额占位";
        debugInfo.match = "currency_x";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,12}\\s*(元|块|万|万元)$").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "X+金额单位";
        debugInfo.match = "x_currency";
      }
      return true;
    } // 高X占比（兜底）- 提高识别率
    const cleaned = s.replace(/[\s\-_—–·.・，,。、；;：:]/g, "");
    const xCount = this.countXChars(cleaned);
    if (cleaned.length >= 2 && xCount >= 1 && xCount / cleaned.length >= 0.3) {
      if (debugInfo) {
        debugInfo.reason = "高X占比(兜底)";
        debugInfo.match = "x_ratio";
      }
      return true;
    }
    if (debugInfo) debugInfo.reason = "no match";
    return false;
  },
  isNumberMarker(str, debugInfo) {
    if (str == null) return false;
    const s = String(str).trim();
    if (!s) return false;
    if (/^0$/.test(s)) {
      if (debugInfo) debugInfo.match = "zero";
      return true;
    }
    if (/^0\.0+$/.test(s)) {
      if (debugInfo) debugInfo.match = "decimal_zero";
      return true;
    }
    if (/^[¥￥$€£]?\s*0(\.0+)?$/.test(s)) {
      if (debugInfo) debugInfo.match = "currency_zero";
      return true;
    }
    if (/^0(\.0+)?%?$/.test(s)) {
      if (debugInfo) debugInfo.match = "percent_zero";
      return true;
    }
    if (/^[-—–─―一_－‒—―─˗‑‑⁃−—―]+$/.test(s)) {
      if (debugInfo) debugInfo.match = "dash";
      return true;
    }
    if (/^[（(]\s*(待[填]?|占位|空|无|--|—|－)\s*[）)]$/.test(s)) {
      if (debugInfo) debugInfo.match = "parens_placeholder";
      return true;
    }
    if (/^[\/／\\＼]$/.test(s)) {
      if (debugInfo) debugInfo.match = "slash";
      return true;
    }
    if (/^0[,，]?0*\.?0*$/.test(s)) {
      if (debugInfo) debugInfo.match = "formatted_zero";
      return true;
    }
    if (/^0(\.0+)?%$/.test(s)) {
      if (debugInfo) debugInfo.match = "percent";
      return true;
    }
    if (/^[¥￥$€£]\s*0(\.0+)?$/.test(s)) {
      if (debugInfo) debugInfo.match = "currency";
      return true;
    }
    if (/^\s*[0零〇○]+\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "chinese_zero";
      return true;
    }
    if (
      /^\s*(暂无|空值|空|无|NULL|null|Null|none|None|N\/A|n\/a|NA|na)\s*$/.test(
        s,
      )
    ) {
      if (debugInfo) debugInfo.match = "null_keyword";
      return true;
    }
    if (/^\s*0\.00\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "zero_decimal";
      return true;
    }
    if (/^\s*￥\s*0\.00\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "rmb_zero";
      return true;
    }
    return false;
  },
  isMarker(val) {
    return this.isTextMarker(val) || this.isNumberMarker(val);
  },
  findMergedCells(worksheet) {
    const merges = [];
    if (!worksheet || !worksheet["!merges"]) return merges;
    worksheet["!merges"].forEach((m) => {
      merges.push({
        sRow: m.s.r,
        sCol: m.s.c,
        eRow: m.e.r,
        eCol: m.e.c,
        value: null,
      });
    });
    return merges;
  },
  getCellValue(aoa, row, col, mergedCells) {
    if (!aoa[row]) return null;
    for (const m of mergedCells) {
      if (row >= m.sRow && row <= m.eRow && col >= m.sCol && col <= m.eCol) {
        return aoa[m.sRow]?.[m.sCol] ?? null;
      }
    }
    return aoa[row][col] ?? null;
  },
  isMergedCell(row, col, mergedCells) {
    for (const m of mergedCells) {
      if (row >= m.sRow && row <= m.eRow && col >= m.sCol && col <= m.eCol) {
        return m;
      }
    }
    return null;
  },
  findFields(aoa, worksheet) {
    const fields = [];
    const usedCells = new Set();
    const mergedCells = this.findMergedCells(worksheet || {});
    const debugInfo = [];
    if (!aoa || aoa.length === 0) return { fields, debugInfo, mergedCells };
    for (let rowIdx = 0; rowIdx < aoa.length; rowIdx++) {
      const row = aoa[rowIdx];
      if (!row) continue;
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const key = `${rowIdx}_${colIdx}`;
        if (usedCells.has(key)) continue;
        const cell = this.getCellValue(aoa, rowIdx, colIdx, mergedCells);
        const cellDebug = { row: rowIdx, col: colIdx, value: cell, reason: "" };
        let type = null;
        let markerMatch = "";
        const cellDebugObj = { reason: "", match: "" };
        if (this.isTextMarker(cell, cellDebugObj)) {
          type = "text";
          markerMatch = cellDebugObj.match;
        } else if (this.isNumberMarker(cell, cellDebugObj)) {
          type = "number";
          markerMatch = cellDebugObj.match;
        }
        if (type) {
          usedCells.add(key);
          const mergeInfo = this.isMergedCell(rowIdx, colIdx, mergedCells);
          if (mergeInfo) {
            for (let r = mergeInfo.sRow; r <= mergeInfo.eRow; r++) {
              for (let c = mergeInfo.sCol; c <= mergeInfo.eCol; c++) {
                usedCells.add(`${r}_${c}`);
              }
            }
          }
          const baseName = `\u5B57\u6BB5_${this.colLetters(colIdx)}${rowIdx + 1}`;
          if (type === "text") {
            const xc = this.getXCharClass();
            const normalized = this.normalizeText(cell);
            const isPureX = new RegExp("^[" + xc + "]+$").test(normalized);
            const datePattern1 = new RegExp(
              "[" +
                xc +
                "]{1,6}\\s*年\\s*[" +
                xc +
                "]{1,4}\\s*月\\s*[" +
                xc +
                "]{0,4}\\s*日?",
            );
            const datePattern2 = new RegExp(
              "[" + xc + "]{1,6}\\s*年\\s*[" + xc + "]{1,4}\\s*月?",
            );
            const datePattern3 = new RegExp("[" + xc + "]{1,6}\\s*年");
            const datePattern4 = new RegExp("[" + xc + "]{1,4}\\s*月");
            const datePattern5 = new RegExp("[" + xc + "]{1,4}\\s*日");
            const datePattern6 = new RegExp("[" + xc + "]{1,4}\\s*季度");
            const datePattern7 = new RegExp("第[" + xc + "]{1,4}\\s*季度");
            const datePattern8 = new RegExp("[" + xc + "]{1,4}\\s*周");
            const datePattern9 = new RegExp(
              "(日期|时间|年月|月份|年度|季度|周次|数据周期|报表周期|数据日期|报表日期|统计周期|统计日期|制表日期|填表日期|周期|期间|期)\\s*[：:]\\s*[" +
                xc +
                "]",
            );
            const isDatePattern =
              datePattern1.test(cell) ||
              datePattern2.test(cell) ||
              datePattern3.test(cell) ||
              datePattern4.test(cell) ||
              datePattern5.test(cell) ||
              datePattern6.test(cell) ||
              datePattern7.test(cell) ||
              datePattern8.test(cell) ||
              datePattern9.test(cell);
            if (isDatePattern) {
              let semanticType = "date";
              if (datePattern6.test(cell) || datePattern7.test(cell)) {
                semanticType = "quarter";
              } else if (datePattern8.test(cell) && !datePattern3.test(cell)) {
                semanticType = "week";
              } else if (datePattern3.test(cell) && !datePattern2.test(cell)) {
                semanticType = "year";
              } else if (/月/.test(cell) && !/年/.test(cell)) {
                semanticType = "month";
              } else if (/日/.test(cell) && !/年/.test(cell) && !/月/.test(cell)) {
                semanticType = "day";
              } else {
                semanticType = "date";
              }
              fields.push({
                id: `f_${rowIdx}_${colIdx}`,
                name: baseName,
                cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                row: rowIdx,
                col: colIdx,
                type,
                originalValue: cell,
                markerMatch,
                groupIndex: 0,
                groupCount: 1,
                semanticType,
                isMerged: !!mergeInfo,
                mergeInfo: mergeInfo
                  ? {
                      startRow: mergeInfo.sRow,
                      startCol: mergeInfo.sCol,
                      endRow: mergeInfo.eRow,
                      endCol: mergeInfo.eCol,
                    }
                  : null,
              });
              debugInfo.push({
                row: rowIdx,
                col: colIdx,
                cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                value: cell,
                type,
                match: "date_full",
                fieldName: baseName,
                isMerged: !!mergeInfo,
              });
            } else if (isPureX) {
              fields.push({
                id: `f_${rowIdx}_${colIdx}`,
                name: baseName,
                cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                row: rowIdx,
                col: colIdx,
                type,
                originalValue: cell,
                markerMatch,
                groupIndex: 0,
                groupCount: 1,
                semanticType: "shop",
                isMerged: !!mergeInfo,
                mergeInfo: mergeInfo
                  ? {
                      startRow: mergeInfo.sRow,
                      startCol: mergeInfo.sCol,
                      endRow: mergeInfo.eRow,
                      endCol: mergeInfo.eCol,
                    }
                  : null,
              });
              debugInfo.push({
                row: rowIdx,
                col: colIdx,
                cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                value: cell,
                type,
                match: "shop_name",
                fieldName: baseName,
                isMerged: !!mergeInfo,
              });
            } else {
              const groupCount = this.countXGroups(cell);
              if (groupCount > 1) {
                const contexts = this.extractXGroupContexts(cell);
                contexts.forEach((ctx, gi) => {
                  const suffix =
                    ctx.semanticLabel ||
                    ctx.after ||
                    ctx.before ||
                    `第${gi + 1}处`;
                  const fieldName = baseName + "_" + suffix.replace(/[：:]/g, "");
                  fields.push({
                    id: `f_${rowIdx}_${colIdx}_g${gi}`,
                    name: fieldName,
                    cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                    row: rowIdx,
                    col: colIdx,
                    type,
                    originalValue: cell,
                    markerMatch,
                    groupIndex: gi,
                    groupCount,
                    groupContext: ctx,
                    semanticType: ctx.semanticType || "unknown",
                    isMerged: !!mergeInfo,
                    mergeInfo: mergeInfo
                      ? {
                          startRow: mergeInfo.sRow,
                          startCol: mergeInfo.sCol,
                          endRow: mergeInfo.eRow,
                          endCol: mergeInfo.eCol,
                        }
                      : null,
                  });
                  debugInfo.push({
                    row: rowIdx,
                    col: colIdx,
                    cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                    value: cell,
                    type,
                    match: markerMatch,
                    fieldName,
                    groupIndex: gi,
                    groupCount,
                    groupContext: ctx,
                    isMerged: !!mergeInfo,
                  });
                });
              } else {
                const ctx = this.extractXGroupContexts(cell)[0] || {};
                fields.push({
                  id: `f_${rowIdx}_${colIdx}`,
                  name: baseName,
                  cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                  row: rowIdx,
                  col: colIdx,
                  type,
                  originalValue: cell,
                  markerMatch,
                  groupIndex: 0,
                  groupCount: 1,
                  semanticType: ctx.semanticType || "shop",
                  isMerged: !!mergeInfo,
                  mergeInfo: mergeInfo
                    ? {
                        startRow: mergeInfo.sRow,
                        startCol: mergeInfo.sCol,
                        endRow: mergeInfo.eRow,
                        endCol: mergeInfo.eCol,
                      }
                    : null,
                });
                debugInfo.push({
                  row: rowIdx,
                  col: colIdx,
                  cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
                  value: cell,
                  type,
                  match: markerMatch,
                  fieldName: baseName,
                  isMerged: !!mergeInfo,
                });
              }
            }
          } else {
            fields.push({
              id: `f_${rowIdx}_${colIdx}`,
              name: baseName,
              cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
              row: rowIdx,
              col: colIdx,
              type,
              originalValue: cell,
              markerMatch,
              isMerged: !!mergeInfo,
              mergeInfo: mergeInfo
                ? {
                    startRow: mergeInfo.sRow,
                    startCol: mergeInfo.sCol,
                    endRow: mergeInfo.eRow,
                    endCol: mergeInfo.eCol,
                  }
                : null,
            });
            debugInfo.push({
              row: rowIdx,
              col: colIdx,
              cell: `${this.colLetters(colIdx)}${rowIdx + 1}`,
              value: cell,
              type,
              match: markerMatch,
              fieldName: baseName,
              isMerged: !!mergeInfo,
            });
          }
        }
      }
    }
    return {
      fields: fields.sort((a, b) => a.row - b.row || a.col - b.col),
      debugInfo,
      mergedCells,
    };
  },
}; // ========== Calculation Engine (Enhanced v7) ==========
