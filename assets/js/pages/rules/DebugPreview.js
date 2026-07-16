// DebugPreview.js - 调试预览相关函数
window.DebugPreview = {
  copyToClipboard: (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  },

  dataToCSV: (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return "";
    const headers = new Set();
    data.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith("_")) headers.add(k);
        });
      }
    });
    const headerArr = Array.from(headers);
    const escapeCSV = (val) => {
      if (val == null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return "\"" + str.replace(/"/g, "\"\"") + "\"";
      }
      return str;
    };
    const lines = [headerArr.join(",")];
    data.forEach((row) => {
      lines.push(headerArr.map((h) => escapeCSV(row[h])).join(","));
    });
    return lines.join("\n");
  },

  downloadCSV: (data, filename) => {
    const csv = window.DebugPreview.dataToCSV(data);
    if (!csv) return;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getPreviewData: (step, stepIdx, currentRule, activeField, state, currentPlatform, template, platform) => {
    try {
      const allSteps = currentRule?.steps || [];
      const prevSteps = allSteps.slice(0, stepIdx);
      const activeFieldId = activeField?.id;
      const samples = state.samples || {};
      const fieldSamples = activeFieldId ? samples[activeFieldId] || [] : [];
      const sampleTables = (state.samples[currentPlatform] || []).map((s, i) => ({
        id: s.id || `sample_${i}`,
        name: s.alias || s.fileName,
        originalName: s.fileName,
        headers: s.sheets[Object.keys(s.sheets)[0]]?.headers || [],
        rows: s.sheets[Object.keys(s.sheets)[0]]?.rows || [],
        source: "sample",
      }));
      const externalTables = (state.externals || []).map((e) => ({
        id: e.id || e.sheetKey,
        name: e.name || e.sheetKey,
        headers: e.headers || (e.allData && e.allData.length > 0 ? Object.keys(e.allData[0]) : []),
        rows: e.allData || e.rows || [],
        source: "external",
        externalId: e.id || e.sheetKey,
      }));
      const tables = [...sampleTables, ...externalTables];
      let inputData = null;
      let outputData = null;
      try {
        if (typeof CalcEngine?.runSteps === "function") {
          const ctx = {
            fieldId: activeFieldId,
            platform: currentPlatform,
            samples: fieldSamples,
            template,
            tables,
            externals: state.externals || [],
            shopName: platform?.shops?.[0]?.name || "",
          };
          const resIn = CalcEngine.runSteps(prevSteps, ctx);
          inputData = resIn?.data ?? resIn?.result ?? resIn;
          const resOut = CalcEngine.runSteps(allSteps.slice(0, stepIdx + 1), ctx);
          outputData = resOut?.data ?? resOut?.result ?? resOut;
        }
      } catch (e) {}
      return { inputData, outputData };
    } catch (e) {
      return { inputData: null, outputData: null };
    }
  },

  renderDataTable: (data, maxRows) => {
    const mRows = maxRows || 100;
    if (!data) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "暂无数据",
      );
    }
    if (!Array.isArray(data)) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "数据格式不支持预览",
      );
    }
    if (data.length === 0) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "空数组（0行）",
      );
    }
    const headerSet = new Set();
    data.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith("_")) headerSet.add(k);
        });
      }
    });
    const allHeaders = Array.from(headerSet);
    if (allHeaders.length === 0) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        "无可见列",
      );
    }
    const displayRows = data.slice(0, mRows);
    return /*#__PURE__*/ React.createElement(
      "div",
      { style: { width: "100%" } },
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "6px", maxHeight: "300px", overflowY: "auto" } },
        /*#__PURE__*/ React.createElement(
          "table",
          { style: { width: "100%", borderCollapse: "collapse", fontSize: "12px" } },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              allHeaders.map((h) => /*#__PURE__*/ React.createElement(
                "th",
                {
                  key: h,
                  title: h,
                  style: {
                    padding: "8px 10px",
                    textAlign: "left",
                    background: "var(--color-bg-tertiary)",
                    borderBottom: "1px solid var(--color-border)",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  },
                },
                h,
              )),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            displayRows.map((row, ri) => /*#__PURE__*/ React.createElement(
              "tr",
              {
                key: ri,
                style: {
                  background: ri % 2 === 0 ? "var(--color-bg-primary)" : "var(--color-bg-secondary)",
                },
              },
              allHeaders.map((h) => /*#__PURE__*/ React.createElement(
                "td",
                {
                  key: h,
                  style: {
                    padding: "6px 10px",
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                  title: row[h] != null ? String(row[h]) : "",
                },
                row[h] != null
                  ? (typeof row[h] === "number"
                    ? row[h].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                    : String(row[h]))
                  : "-",
              )),
            )),
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { style: { marginTop: "6px", fontSize: "11px", color: "var(--color-text-tertiary)", display: "flex", justifyContent: "space-between" } },
        /*#__PURE__*/ React.createElement("span", null, "共 " + data.length + " 行，显示前 " + Math.min(mRows, data.length) + " 行"),
        /*#__PURE__*/ React.createElement("span", null, allHeaders.length + " 列"),
      ),
    );
  },

  // 调试预览：模拟执行当前步骤，展示输入/输出
  renderStepDebug: (step, stepIdx, currentRule, activeField, state, currentPlatform, template, platform) => {
    try {
      // 收集前面步骤作为前置上下文
      const allSteps = currentRule?.steps || [];
      const prevSteps = allSteps.slice(0, stepIdx);

      // 获取当前字段的样例数据作为输入
      const activeFieldId = activeField?.id;
      const samples = state.samples || {};
      const fieldSamples = activeFieldId ? samples[activeFieldId] || [] : [];

      // 构建数据表，包含样本表和全局表
      const sampleTables = (state.samples[currentPlatform] || []).map((s, i) => ({
        id: s.id || `sample_${i}`,
        name: s.alias || s.fileName,
        originalName: s.fileName,
        headers: s.sheets[Object.keys(s.sheets)[0]]?.headers || [],
        rows: s.sheets[Object.keys(s.sheets)[0]]?.rows || [],
        source: "sample",
      }));
      const externalTables = (state.externals || []).map((e) => ({
        id: e.id || e.sheetKey,
        name: e.name || e.sheetKey,
        headers: e.headers || (e.allData && e.allData.length > 0 ? Object.keys(e.allData[0]) : []),
        rows: e.allData || e.rows || [],
        source: "external",
        externalId: e.id || e.sheetKey,
      }));
      const tables = [...sampleTables, ...externalTables];

      // 尝试执行前面所有步骤，获取当前步骤的输入数据
      let inputData = null;
      let executeError = null;
      try {
        if (typeof CalcEngine?.runSteps === "function") {
          const ctx = {
            fieldId: activeFieldId,
            platform: currentPlatform,
            samples: fieldSamples,
            template,
            tables,
            externals: state.externals || [],
            shopName: platform?.shops?.[0]?.name || "",
          };
          const res = CalcEngine.runSteps(prevSteps, ctx);
          inputData = res?.data ?? res?.result ?? res;
        }
      } catch (e) {
        executeError = e.message || String(e);
      }

      // 当前步骤执行
      let outputData = null;
      let currentError = null;
      try {
        if (typeof CalcEngine?.runSteps === "function") {
          const ctx = {
            fieldId: activeFieldId,
            platform: currentPlatform,
            samples: fieldSamples,
            template,
            tables,
            externals: state.externals || [],
            shopName: platform?.shops?.[0]?.name || "",
          };
          const res = CalcEngine.runSteps(allSteps.slice(0, stepIdx + 1), ctx);
          outputData = res?.data ?? res?.result ?? res;
        }
      } catch (e) {
        currentError = e.message || String(e);
      }

      const renderDataPreview = (data) => {
        if (!data) return null;
        if (Array.isArray(data)) {
          if (data.length === 0) {
            return /*#__PURE__*/ React.createElement("span", { className: "debug-empty" }, "空数组");
          }
          // 从所有行收集列名，避免首行缺失列导致显示不完整
          const headerSet = new Set();
          data.forEach((row) => {
            if (row && typeof row === "object") {
              Object.keys(row).forEach((k) => {
                if (!k.startsWith("_")) headerSet.add(k);
              });
            }
          });
          const allHeaders = Array.from(headerSet);
          if (allHeaders.length === 0) {
            return /*#__PURE__*/ React.createElement("span", { className: "debug-empty" }, "无可见列");
          }
          const cfg = step.config || {};
          let relevantHeaders = [];
          const extractExprFields = (expr) => {
            if (!expr) return [];
            const matches = expr.match(/{([^}]+)}/g);
            return matches ? matches.map((m) => m.slice(1, -1)) : [];
          };
          switch (step.type) {
            case "filter":
            case "filterEqual":
            case "filterContain":
            case "filterRange":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "virtual":
              relevantHeaders = [cfg.source, cfg.target].filter(Boolean);
              break;
            case "join":
              relevantHeaders = [cfg.key, cfg.fk, cfg.col, cfg.sizeField].filter(Boolean);
              break;
            case "aggregate":
            case "group":
              if (cfg.column === "__expr__" && cfg.expr) {
                relevantHeaders = extractExprFields(cfg.expr);
              } else {
                relevantHeaders = [cfg.column, cfg.aggColumn, cfg.groupBy].filter(Boolean);
              }
              break;
            case "formula":
            case "math":
            case "ratio":
            case "diff":
              relevantHeaders = extractExprFields(cfg.expr);
              break;
            case "sort":
            case "topN":
            case "runningTotal":
            case "movingAverage":
            case "percentOfTotal":
            case "normalize":
            case "fillNA":
            case "binning":
            case "conditionalTag":
            case "stringExtract":
            case "round":
            case "date":
            case "rank":
            case "valueNormalize":
              relevantHeaders = [cfg.column, cfg.targetColumn, cfg.orderColumn].filter(Boolean);
              break;
            case "concat":
              relevantHeaders = (cfg.columns || []).filter(Boolean);
              break;
            case "substring":
            case "lookup":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "condition":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "crossMatch":
            case "intersect":
              relevantHeaders = [...(cfg.columns || []), ...(cfg.compareColumns || []), cfg.key, cfg.compareKey].filter(Boolean);
              break;
            case "keepDuplicate":
            case "keepUnique":
              relevantHeaders = [cfg.column].filter(Boolean);
              break;
            case "union":
              relevantHeaders = (cfg.tables || []).map((t) => (typeof t === "string" ? t : t.id)).filter(Boolean);
              break;
            case "source":
            case "limit":
            case "constant":
            case "text":
            case "fill":
            default:
              relevantHeaders = [];
              break;
          }
          const validRelevant = relevantHeaders.filter((h) => allHeaders.includes(h));
          // 单列数据使用卡片式展示，避免表格过宽
          if (allHeaders.length === 1) {
            const key = allHeaders[0];
            return /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-single-column" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "debug-single-column-header" },
                /*#__PURE__*/ React.createElement(Icons.Column, { size: 14 }),
                key,
              ),
              data.slice(0, 50).map((row, ri) => /*#__PURE__*/ React.createElement(
                "div",
                { key: ri, className: "debug-single-column-row" },
                /*#__PURE__*/ React.createElement("span", { className: "debug-single-column-index" }, ri + 1),
                /*#__PURE__*/ React.createElement("span", { className: "debug-single-column-value" },
                  row[key] != null
                    ? typeof row[key] === "number"
                      ? row[key].toLocaleString("zh-CN", { maximumFractionDigits: 4 })
                      : String(row[key]).slice(0, 80)
                    : "-",
                ),
              )),
              data.length > 50 && /*#__PURE__*/ React.createElement(
                "div",
                { className: "debug-table-more" },
                `... 共 ${data.length} 行，显示前50行`,
              ),
            );
          }
          // 多列数据：优先高亮相关列，但展示所有列，支持横向滚动
          const displayHeaders = validRelevant.length > 0
            ? Array.from(new Set([...validRelevant, ...allHeaders]))
            : allHeaders;
          const displayRows = data.slice(0, 100);
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-data-table" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-scroll" },
              /*#__PURE__*/ React.createElement(
                "table",
                { className: "debug-table" },
                /*#__PURE__*/ React.createElement(
                  "thead",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    null,
                    displayHeaders.map((h) => /*#__PURE__*/ React.createElement(
                      "th",
                      {
                        key: h,
                        title: h,
                        className: validRelevant.includes(h) ? "debug-col-relevant" : "",
                      },
                      h,
                    )),
                  ),
                ),
                /*#__PURE__*/ React.createElement(
                  "tbody",
                  null,
                  displayRows.map((row, ri) => /*#__PURE__*/ React.createElement(
                    "tr",
                    { key: ri },
                    displayHeaders.map((h) => /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        key: h,
                        className: validRelevant.includes(h) ? "debug-col-relevant" : "",
                      },
                      row[h] != null
                        ? typeof row[h] === "number"
                          ? row[h].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                          : String(row[h]).slice(0, 50)
                        : "-",
                    )),
                  )),
                ),
              ),
            ),
            validRelevant.length > 0 && validRelevant.length < allHeaders.length && /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-more" },
              `💡 高亮列：${validRelevant.join("、")}（共 ${allHeaders.length} 列，可横向滚动查看全部）`,
            ),
            data.length > 100 && /*#__PURE__*/ React.createElement(
              "div",
              { className: "debug-table-more" },
              `... 共 ${data.length} 行，显示前100行`,
            ),
          );
        }
        if (typeof data === "object") {
          const entries = Object.entries(data).filter(([k]) => !k.startsWith("_"));
          if (entries.length === 0) {
            return /*#__PURE__*/ React.createElement("span", { className: "debug-empty" }, "空对象");
          }
          return /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-data-object" },
            entries.map(([key, val]) => /*#__PURE__*/ React.createElement(
              "div",
              { key: key, className: "debug-object-row" },
              /*#__PURE__*/ React.createElement("span", { className: "debug-object-key" }, key),
              /*#__PURE__*/ React.createElement("span", { className: "debug-object-value" },
                typeof val === "number"
                  ? val.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                  : typeof val === "object"
                    ? JSON.stringify(val).slice(0, 50)
                    : String(val).slice(0, 50),
              ),
            )),
          );
        }
        return /*#__PURE__*/ React.createElement("span", null,
          typeof data === "number"
            ? data.toLocaleString("zh-CN", { maximumFractionDigits: 4 })
            : String(data),
        );
      };

      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "debug-section" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-row" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-label" },
            "📥 输入数据",
            inputData && Array.isArray(inputData) && /*#__PURE__*/ React.createElement(
              "span",
              { className: "debug-count" },
              `(${inputData.length} 行)`,
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-value" },
            inputData
              ? renderDataPreview(inputData)
              : executeError
                ? /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-error" },
                    "执行失败: ",
                    executeError,
                  )
                : /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-empty" },
                    "暂无输入数据（请先在「样例数据」中配置字段样例）",
                  ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-arrow" },
          "↓",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-row" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-label" },
            "📤 输出结果",
            outputData && Array.isArray(outputData) && /*#__PURE__*/ React.createElement(
              "span",
              { className: "debug-count" },
              `(${outputData.length} 行)`,
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "debug-value" },
            outputData
              ? renderDataPreview(outputData)
              : currentError
                ? /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-error" },
                    "执行失败: ",
                    currentError,
                  )
                : /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "debug-empty" },
                    "暂无输出",
                  ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "debug-tip" },
          "💡 提示：调试预览仅用于验证步骤逻辑。实际计算时会基于真实数据源执行。",
        ),
      );
    } catch (e) {
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "debug-error" },
        "调试面板加载失败: ",
        e.message,
      );
    }
  },
};
