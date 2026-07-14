// utils/excel.js - Excel 解析与导出工具 (ExcelUtils)
const ExcelUtils = {
  parseExcelBuffer(arrayBuffer) {
    try {
      const wb = XLSX.read(new Uint8Array(arrayBuffer), {
        type: "array",
        cellDates: true,
        cellNF: true,
        cellHTML: false,
      });
    const sheets = {};
    wb.SheetNames.forEach((name) => {
      const ws = wb.Sheets[name];
      const aoaRaw = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: null,
        raw: true,
      });
      const aoaFormatted = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: null,
        raw: false,
      });
      const aoa = aoaRaw.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (cell === null || cell === undefined) {
            return aoaFormatted[rIdx]?.[cIdx] ?? null;
          }
          if (typeof cell === "number") {
            return cell;
          }
          if (typeof cell === "string") {
            const trimmed = cell.trim();
            return trimmed === "" ? null : cell;
          }
          return cell;
        }),
      );
      if (aoa.length > 0) {
        const headerRowIdx = ExcelUtils.detectHeaderRow(aoa);
        const headers = aoa[headerRowIdx].map((h) => {
          if (h == null) return "";
          let str = String(h).trim();
          str = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
          return str;
        });
        const uniqueHeaders = ExcelUtils.deduplicateHeaders(headers);
        const rows = aoa
          .slice(headerRowIdx + 1)
          .map((r) => {
            const obj = {};
            uniqueHeaders.forEach((h, i) => {
              obj[h] = r[i];
            });
            return obj;
          })
          .filter((r) =>
            Object.values(r).some(
              (v) => v !== null && v !== "" && v !== undefined,
            ),
          );
        sheets[name] = {
          headers: uniqueHeaders.filter(Boolean),
          rows,
          aoa,
          worksheet: ws,
          aoaFormatted,
          headerRowIdx,
          rawRowCount: aoa.length - 1,
        };
      }
    });
      return sheets;
    } catch (err) {
      console.error("[ExcelUtils] Parse error:", err);
      throw err;
    }
  },
  detectHeaderRow(aoa) {
    const maxScan = Math.min(aoa.length, 15);
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < maxScan; i++) {
      const row = aoa[i] || [];
      const score = ExcelUtils.scoreRowAsHeader(row, aoa, i);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  },
  scoreRowAsHeader(row, aoa, rowIdx) {
    if (!row || row.length === 0) return -100;
    const nonEmptyCells = row.filter(
      (c) => c !== null && c !== undefined && String(c).trim() !== "",
    );
    if (nonEmptyCells.length < 2) return -50;
    let score = 0;
    const cellStrs = nonEmptyCells.map((c) => String(c).trim());
    const uniqueCount = new Set(cellStrs).size;
    const uniqueRatio = uniqueCount / cellStrs.length;
    score += uniqueRatio * 50;
    if (uniqueRatio < 0.5) return -80;
    const textCells = cellStrs.filter((s) => isNaN(Number(s)) && s.length > 0);
    const textRatio = textCells.length / cellStrs.length;
    score += textRatio * 30;
    const hasTimeKeywords = cellStrs.some((s) =>
      /^(起始时间|结束时间|终止时间|开始时间|起止|起讫|时间范围|查询时间|报表日期|统计日期|开始日期|结束日期|日期|时间段|账期|期间|序号|单号|编号|index|no\.?)$/i.test(
        s,
      ),
    );
    if (hasTimeKeywords) score -= 100;
    const hasMetaKeywords = cellStrs.some((s) =>
      /^(起始时间|结束时间|终止时间|开始时间|查询时间|报表日期|统计日期|店铺账务|账务明细|交易记录|业务描述|查询|明细|汇总|对账|订单明细|交易明细|报表|账单)/.test(
        s,
      ),
    );
    if (hasMetaKeywords && cellStrs.length < 6) score -= 60;
    if (rowIdx > 0) {
      const prevRow = aoa[rowIdx - 1] || [];
      const prevHasTime = prevRow.some(
        (c) =>
          c &&
          (String(c).includes("时间") ||
            String(c).includes("日期") ||
            /^\d{4}[-/.]\d{1,2}/.test(String(c))),
      );
      if (prevHasTime) score -= 40;
    }
    const hasCommonHeaders = cellStrs.some((s) =>
      /^(订单|金额|数量|价格|单价|时间|日期|状态|类型|名称|编号|店铺|商品|买家|卖家|流水|收支|收入|支出|备注|说明|平台|客户|手机|地址|物流|快递|运费|成本|利润|实付|应付|已付|未付|已收|未收|原价|售价|折扣|优惠|积分|余额|退款|退货|换货|完成|订单号|流水号|单号|姓名|电话)$/.test(
        s,
      ),
    );
    if (hasCommonHeaders) score += 20;
    if (cellStrs.length < 3) score -= 10;
    if (cellStrs.length > 30) score -= 5;
    if (rowIdx === 0) score += 5;
    if (rowIdx <= 3) score += 3;
    const dataRowIdx = Math.min(rowIdx + 1, aoa.length - 1);
    if (dataRowIdx !== rowIdx) {
      const dataRow = aoa[dataRowIdx] || [];
      const dataNonEmpty = dataRow.filter(
        (c) => c !== null && c !== undefined && String(c).trim() !== "",
      ).length;
      if (dataNonEmpty >= nonEmptyCells.length * 0.7) score += 10;
    }
    return score;
  },
  deduplicateHeaders(headers) {
    const counts = {};
    return headers.map((h) => {
      if (!h) return "";
      if (counts[h] === undefined) {
        counts[h] = 0;
        return h;
      } else {
        counts[h]++;
        return `${h}_${counts[h]}`;
      }
    });
  },
  async parse(file, onProgress) {
    const isZip = file.name.toLowerCase().endsWith(".zip");
    if (isZip) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 30));
          }
        };
        reader.onload = async (e) => {
          try {
            if (onProgress) onProgress(40);
            const zip = await JSZip.loadAsync(e.target.result);
            const excelFiles = [];
            const csvFiles = [];
            zip.forEach((path, entry) => {
              if (entry.dir) return;
              const lowerPath = path.toLowerCase();
              if (lowerPath.endsWith(".xlsx") || lowerPath.endsWith(".xls")) {
                excelFiles.push({ path, entry, type: "excel" });
              } else if (lowerPath.endsWith(".csv")) {
                csvFiles.push({ path, entry, type: "csv" });
              }
            });
            const allFiles = [...excelFiles, ...csvFiles];
            if (allFiles.length === 0) {
              reject(new Error("压缩包内未找到Excel或CSV文件"));
              return;
            }
            const allSheets = {};
            const totalFiles = allFiles.length;
            for (let i = 0; i < totalFiles; i++) {
              const { path, entry, type } = allFiles[i];
              if (type === "csv") {
                try {
                  const uint8 = new Uint8Array(
                    await entry.async("arraybuffer"),
                  );
                  let csvText;
                  try {
                    let encoding = "utf-8";
                    if (
                      uint8.length >= 3 &&
                      uint8[0] === 0xef &&
                      uint8[1] === 0xbb &&
                      uint8[2] === 0xbf
                    ) {
                      encoding = "utf-8";
                    } else {
                      let hasHighByte = false;
                      const sampleLen = Math.min(uint8.length, 1000);
                      for (let j = 0; j < sampleLen; j++) {
                        if (uint8[j] > 127) {
                          hasHighByte = true;
                          break;
                        }
                      }
                      if (hasHighByte) {
                        try {
                          const gbkDecoder = new TextDecoder("gbk");
                          const testStr = gbkDecoder.decode(
                            uint8.slice(0, Math.min(200, uint8.length)),
                          );
                          const utfDecoder = new TextDecoder("utf-8");
                          const utfStr = utfDecoder.decode(
                            uint8.slice(0, Math.min(200, uint8.length)),
                          );
                          const gbkValid = !utfStr.includes("\uFFFD");
                          const gbkChinese = /[\u4e00-\u9fa5]/.test(testStr);
                          const utfChinese = /[\u4e00-\u9fa5]/.test(utfStr);
                          if (gbkChinese && !utfChinese) {
                            encoding = "gbk";
                          } else if (gbkValid && gbkChinese) {
                            encoding = "gbk";
                          }
                        } catch (encTestErr) {
                          console.warn("Encoding test failed:", encTestErr);
                        }
                      }
                    }
                    const decoder = new TextDecoder(encoding);
                    csvText = decoder.decode(uint8);
                  } catch (encErr) {
                    console.warn("TextDecoder failed, falling back:", encErr);
                    csvText = await entry.async("string");
                  }
                  if (csvText.charCodeAt(0) === 0xfeff) {
                    csvText = csvText.slice(1);
                  }
                  const csvWb = XLSX.read(csvText, {
                    type: "string",
                    raw: true,
                  });
                  csvWb.SheetNames.forEach((name) => {
                    const ws = csvWb.Sheets[name];
                    const aoaRaw = XLSX.utils.sheet_to_json(ws, {
                      header: 1,
                      defval: null,
                      raw: true,
                    });
                    const aoaFormatted = XLSX.utils.sheet_to_json(ws, {
                      header: 1,
                      defval: null,
                      raw: false,
                    });
                    const aoa = aoaRaw.map((row, rIdx) =>
                      row.map((cell, cIdx) => {
                        if (cell === null || cell === undefined)
                          return aoaFormatted[rIdx]?.[cIdx] ?? null;
                        if (typeof cell === "number") return cell;
                        if (typeof cell === "string") {
                          const trimmed = cell.trim();
                          return trimmed === "" ? null : cell;
                        }
                        return cell;
                      }),
                    );
                    const headerRowIdx =
                      aoa.length > 0 ? ExcelUtils.detectHeaderRow(aoa) : 0;
                    const rawHeaders = aoa[headerRowIdx]
                      ? aoa[headerRowIdx].map((h) => {
                          if (h == null) return "";
                          let str = String(h).trim();
                          str = str.replace(
                            /[\u0000-\u001F\u007F-\u009F]/g,
                            "",
                          );
                          return str;
                        })
                      : [];
                    const headers =
                      ExcelUtils.deduplicateHeaders(rawHeaders).filter(Boolean);
                    const rows = aoa
                      .slice(headerRowIdx + 1)
                      .map((r) => {
                        const obj = {};
                        headers.forEach((h, hi) => {
                          obj[h] = r[hi];
                        });
                        return obj;
                      })
                      .filter((r) =>
                        Object.values(r).some(
                          (v) => v !== null && v !== "" && v !== undefined,
                        ),
                      );
                    const uniqueName =
                      totalFiles > 1 ? `${path}::${name}` : name;
                    allSheets[uniqueName] = {
                      headers,
                      rows,
                      aoa,
                      worksheet: ws,
                      aoaFormatted,
                      headerRowIdx,
                      rawRowCount: aoa.length - 1,
                    };
                  });
                } catch (csvErr) {
                  console.warn("CSV parse warning for", path, csvErr);
                }
              } else {
                const buffer = await entry.async("arraybuffer");
                const sheets = ExcelUtils.parseExcelBuffer(buffer);
                Object.entries(sheets).forEach(([name, data]) => {
                  const uniqueName = totalFiles > 1 ? `${path}::${name}` : name;
                  allSheets[uniqueName] = data;
                });
              }
              if (onProgress) {
                onProgress(40 + Math.round(((i + 1) / totalFiles) * 60));
              }
            }
            if (onProgress) onProgress(100);
            resolve({
              fileName: file.name,
              sheets: allSheets,
              fileSize: file.size,
              isZip: true,
              extractedCount: totalFiles,
            });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      reader.onload = (e) => {
        try {
          const sheets = ExcelUtils.parseExcelBuffer(e.target.result);
          resolve({ fileName: file.name, sheets, fileSize: file.size });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },
  exportAOA(sheets) {
    const wb = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([name, aoa]) => {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    return XLSX.write(wb, { bookType: "xlsx", type: "array" });
  },
  download(buffer, name) {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  },
  formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  },
  stripForStorage(result) {
    if (!result || !result.sheets) return;
    Object.keys(result.sheets).forEach((name) => {
      const sheet = result.sheets[name];
      if (sheet) {
        const totalRows = sheet.rows?.length || sheet.aoa?.length - 1 || 0;
        sheet.totalRows = totalRows;
        delete sheet.worksheet;
        delete sheet.aoaFormatted;
      }
    });
  },
};
