const FieldFinder = {
  colLetters(num) {
    let result = "";
    let n = num;
    while (n >= 0) {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  },
  isMarker(val) {
    return TextMarker.isTextMarker(val) || NumberMarker.isNumberMarker(val);
  },
  extractLabelFromContext(aoa, rowIdx, colIdx, mergedCells) {
    const maxSearchRows = 5;
    const maxSearchCols = 5;
    let label = "";
    const xc = XMarker.getXCharClass();
    const xPattern = new RegExp("[" + xc + "]");
    const numberPattern = /^\d+(\.\d+)?$/;

    for (let c = colIdx - 1; c >= Math.max(0, colIdx - maxSearchCols); c--) {
      const cell = MergedCell.getCellValue(aoa, rowIdx, c, mergedCells);
      if (cell == null || String(cell).trim() === "") continue;
      if (xPattern.test(String(cell))) continue;
      label = String(cell).trim();
      label = label.replace(/[：:，,。、；;！!？?\s]+$/g, "");
      if (label.length > 0 && label.length <= 30 && !numberPattern.test(label)) {
        return label;
      }
    }

    for (let r = rowIdx - 1; r >= Math.max(0, rowIdx - maxSearchRows); r--) {
      for (let c = Math.max(0, colIdx - maxSearchCols); c <= colIdx; c++) {
        if (r === rowIdx && c === colIdx) continue;
        const cell = MergedCell.getCellValue(aoa, r, c, mergedCells);
        if (cell == null || String(cell).trim() === "") continue;
        if (xPattern.test(String(cell))) continue;
        label = String(cell).trim();
        label = label.replace(/[：:，,。、；;！!？?\s]+$/g, "");
        if (label.length > 0 && label.length <= 30 && !numberPattern.test(label)) {
          return label;
        }
      }
    }

    return "";
  },
  findFields(aoa, worksheet) {
    const fields = [];
    const usedCells = new Set();
    const mergedCells = MergedCell.findMergedCells(worksheet || {});
    const debugInfo = [];
    const nameCountMap = new Map();
    if (!aoa || aoa.length === 0) return { fields, debugInfo, mergedCells };
    for (let rowIdx = 0; rowIdx < aoa.length; rowIdx++) {
      const row = aoa[rowIdx];
      if (!row) continue;
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const key = `${rowIdx}_${colIdx}`;
        if (usedCells.has(key)) continue;
        const cell = MergedCell.getCellValue(aoa, rowIdx, colIdx, mergedCells);
        let type = null;
        let markerMatch = "";
        const cellDebugObj = { reason: "", match: "" };
        if (TextMarker.isTextMarker(cell, cellDebugObj)) {
          type = "text";
          markerMatch = cellDebugObj.match;
        } else if (NumberMarker.isNumberMarker(cell, cellDebugObj)) {
          type = "number";
          markerMatch = cellDebugObj.match;
        }
        if (type) {
          usedCells.add(key);
          const mergeInfo = MergedCell.isMergedCell(rowIdx, colIdx, mergedCells);
          if (mergeInfo) {
            for (let r = mergeInfo.sRow; r <= mergeInfo.eRow; r++) {
              for (let c = mergeInfo.sCol; c <= mergeInfo.eCol; c++) {
                usedCells.add(`${r}_${c}`);
              }
            }
          }
          let fieldName = "";
          const cellPos = `${this.colLetters(colIdx)}${rowIdx + 1}`;
          if (type === "text") {
            const xc = XMarker.getXCharClass();
            const normalized = XMarker.normalizeText(cell);
            const isPureX = new RegExp("^[" + xc + "]+$").test(normalized);
            const datePattern1 = new RegExp("[" + xc + "]{1,6}\\s*年\\s*[" + xc + "]{1,4}\\s*月\\s*[" + xc + "]{0,4}\\s*日?");
            const datePattern2 = new RegExp("[" + xc + "]{1,6}\\s*年\\s*[" + xc + "]{1,4}\\s*月?");
            const datePattern3 = new RegExp("[" + xc + "]{1,6}\\s*年");
            const datePattern4 = new RegExp("[" + xc + "]{1,4}\\s*月");
            const datePattern5 = new RegExp("[" + xc + "]{1,4}\\s*日");
            const datePattern6 = new RegExp("[" + xc + "]{1,4}\\s*季度");
            const datePattern7 = new RegExp("第[" + xc + "]{1,4}\\s*季度");
            const datePattern8 = new RegExp("[" + xc + "]{1,4}\\s*周");
            const datePattern9 = new RegExp("(日期|时间|年月|月份|年度|季度|周次|数据周期|报表周期|数据日期|报表日期|统计周期|统计日期|制表日期|填表日期|周期|期间|期)\\s*[：:]\\s*[" + xc + "]");
            const isDatePattern = datePattern1.test(cell) || datePattern2.test(cell) || datePattern3.test(cell) ||
              datePattern4.test(cell) || datePattern5.test(cell) || datePattern6.test(cell) ||
              datePattern7.test(cell) || datePattern8.test(cell) || datePattern9.test(cell);
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
              const semanticNames = {
                date: "日期",
                year: "年份",
                month: "月份",
                day: "日期",
                quarter: "季度",
                week: "周次",
              };
              fieldName = semanticNames[semanticType] || "日期";
              fields.push({
                id: `f_${rowIdx}_${colIdx}`,
                name: fieldName,
                cell: cellPos,
                row: rowIdx,
                col: colIdx,
                type,
                originalValue: cell,
                markerMatch,
                groupIndex: 0,
                groupCount: 1,
                semanticType,
                isMerged: !!mergeInfo,
                mergeInfo: mergeInfo ? {
                  startRow: mergeInfo.sRow,
                  startCol: mergeInfo.sCol,
                  endRow: mergeInfo.eRow,
                  endCol: mergeInfo.eCol,
                } : null,
              });
              debugInfo.push({
                row: rowIdx,
                col: colIdx,
                cell: cellPos,
                value: cell,
                type,
                match: "date_full",
                fieldName,
                isMerged: !!mergeInfo,
              });
            } else if (isPureX) {
              fieldName = "店铺名";
              fields.push({
                id: `f_${rowIdx}_${colIdx}`,
                name: fieldName,
                cell: cellPos,
                row: rowIdx,
                col: colIdx,
                type,
                originalValue: cell,
                markerMatch,
                groupIndex: 0,
                groupCount: 1,
                semanticType: "shop",
                isMerged: !!mergeInfo,
                mergeInfo: mergeInfo ? {
                  startRow: mergeInfo.sRow,
                  startCol: mergeInfo.sCol,
                  endRow: mergeInfo.eRow,
                  endCol: mergeInfo.eCol,
                } : null,
              });
              debugInfo.push({
                row: rowIdx,
                col: colIdx,
                cell: cellPos,
                value: cell,
                type,
                match: "shop_name",
                fieldName,
                isMerged: !!mergeInfo,
              });
            } else {
              const groupCount = XMarker.countXGroups(cell);
              if (groupCount > 1) {
                const contexts = XMarker.extractXGroupContexts(cell);
                contexts.forEach((ctx, gi) => {
                  let suffix = ctx.semanticLabel || ctx.after || ctx.before || `第${gi + 1}处`;
                  suffix = suffix.replace(/[：:]/g, "");
                  if (suffix === cellPos) {
                    suffix = `第${gi + 1}处`;
                  }
                  if (ctx.semanticType === "shop") {
                    fieldName = `店铺名_${suffix}`;
                  } else if (ctx.semanticType === "date") {
                    fieldName = `日期_${suffix}`;
                  } else {
                    fieldName = suffix;
                  }
                  const existingCount = nameCountMap.get(fieldName) || 0;
                  if (existingCount > 0) {
                    fieldName = `${fieldName}_${existingCount + 1}`;
                  }
                  nameCountMap.set(fieldName, (nameCountMap.get(fieldName) || 0) + 1);
                  fields.push({
                    id: `f_${rowIdx}_${colIdx}_g${gi}`,
                    name: fieldName,
                    cell: cellPos,
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
                    mergeInfo: mergeInfo ? {
                      startRow: mergeInfo.sRow,
                      startCol: mergeInfo.sCol,
                      endRow: mergeInfo.eRow,
                      endCol: mergeInfo.eCol,
                    } : null,
                  });
                  debugInfo.push({
                    row: rowIdx,
                    col: colIdx,
                    cell: cellPos,
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
                const ctx = XMarker.extractXGroupContexts(cell)[0] || {};
                if (ctx.semanticType === "shop") {
                  fieldName = "店铺名";
                } else if (ctx.semanticType === "date") {
                  fieldName = "日期";
                } else {
                  const contextLabel = ctx.semanticLabel || ctx.after || ctx.before || "";
                  if (contextLabel && contextLabel !== cellPos) {
                    fieldName = contextLabel.replace(/[：:]/g, "");
                  } else {
                    const labelFromContext = this.extractLabelFromContext(aoa, rowIdx, colIdx, mergedCells);
                    if (labelFromContext) {
                      fieldName = labelFromContext;
                    } else {
                      fieldName = `字段_${cellPos}`;
                    }
                  }
                }
                const existingCount = nameCountMap.get(fieldName) || 0;
                if (existingCount > 0) {
                  fieldName = `${fieldName}_${existingCount + 1}`;
                }
                nameCountMap.set(fieldName, (nameCountMap.get(fieldName) || 0) + 1);
                fields.push({
                  id: `f_${rowIdx}_${colIdx}`,
                  name: fieldName,
                  cell: cellPos,
                  row: rowIdx,
                  col: colIdx,
                  type,
                  originalValue: cell,
                  markerMatch,
                  groupIndex: 0,
                  groupCount: 1,
                  semanticType: ctx.semanticType || "shop",
                  isMerged: !!mergeInfo,
                  mergeInfo: mergeInfo ? {
                    startRow: mergeInfo.sRow,
                    startCol: mergeInfo.sCol,
                    endRow: mergeInfo.eRow,
                    endCol: mergeInfo.eCol,
                  } : null,
                });
                debugInfo.push({
                  row: rowIdx,
                  col: colIdx,
                  cell: cellPos,
                  value: cell,
                  type,
                  match: markerMatch,
                  fieldName,
                  isMerged: !!mergeInfo,
                });
              }
            }
          } else {
            const labelFromContext = this.extractLabelFromContext(aoa, rowIdx, colIdx, mergedCells);
            if (labelFromContext) {
              fieldName = labelFromContext;
            } else {
              fieldName = `数值_${cellPos}`;
            }
            const existingCount = nameCountMap.get(fieldName) || 0;
            if (existingCount > 0) {
              fieldName = `${fieldName}_${existingCount + 1}`;
            }
            nameCountMap.set(fieldName, (nameCountMap.get(fieldName) || 0) + 1);
            fields.push({
              id: `f_${rowIdx}_${colIdx}`,
              name: fieldName,
              cell: cellPos,
              row: rowIdx,
              col: colIdx,
              type,
              originalValue: cell,
              markerMatch,
              isMerged: !!mergeInfo,
              mergeInfo: mergeInfo ? {
                startRow: mergeInfo.sRow,
                startCol: mergeInfo.sCol,
                endRow: mergeInfo.eRow,
                endCol: mergeInfo.eCol,
              } : null,
            });
            debugInfo.push({
              row: rowIdx,
              col: colIdx,
              cell: cellPos,
              value: cell,
              type,
              match: markerMatch,
              fieldName,
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
};

window.FieldFinder = FieldFinder;