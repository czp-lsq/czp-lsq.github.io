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

  getPreviewData: (step, stepIdx, currentRule, activeField, state, currentPlatform) => {
    try {
      const allSteps = currentRule?.steps || [];
      const prevSteps = allSteps.slice(0, stepIdx);
      const activeFieldId = activeField?.id;
      const fieldSamples = activeFieldId ? (state.samples[activeFieldId] || []) : [];

      const sampleTables = (state.samples[currentPlatform] || []).map((s, i) => ({
        id: s.id || `sample_${i}`,
        name: s.alias || s.fileName,
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
      }));
      const tables = [...sampleTables, ...externalTables];

      let inputData = null;
      let outputData = null;

      if (typeof CalcEngine?.runSteps === "function") {
        const ctx = {
          fieldId: activeFieldId,
          platform: currentPlatform,
          samples: fieldSamples,
          tables,
          externals: state.externals || [],
          shopName: state.platform?.shops?.[0]?.name || "",
        };
        try {
          const resIn = CalcEngine.runSteps(prevSteps, ctx);
          inputData = resIn?.data ?? resIn?.result ?? resIn;
        } catch (e) {}

        try {
          const resOut = CalcEngine.runSteps(allSteps.slice(0, stepIdx + 1), ctx);
          outputData = resOut?.data ?? resOut?.result ?? resOut;
        } catch (e) {}
      }

      return { inputData, outputData };
    } catch (e) {
      return { inputData: null, outputData: null };
    }
  },

  renderDataTable: (data, maxRows) => {
    const mRows = maxRows || 100;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return React.createElement("div", { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } },
        data ? "空数组（0行）" : "暂无数据"
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
      return React.createElement("div", { style: { padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" } }, "无可见列");
    }

    const displayRows = data.slice(0, mRows);
    return React.createElement("div", { style: { width: "100%" } },
      React.createElement("div", { style: { overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "6px", maxHeight: "300px", overflowY: "auto" } },
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "12px" } },
          React.createElement("thead", null,
            React.createElement("tr", null,
              allHeaders.map((h) => React.createElement("th", {
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
              }, h))
            )
          ),
          React.createElement("tbody", null,
            displayRows.map((row, ri) => React.createElement("tr", {
              key: ri,
              style: { background: ri % 2 === 0 ? "var(--color-bg-primary)" : "var(--color-bg-secondary)" },
            },
              allHeaders.map((h) => React.createElement("td", {
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
                  : "-"
              ))
            ))
          )
        )
      ),
      React.createElement("div", { style: { marginTop: "6px", fontSize: "11px", color: "var(--color-text-tertiary)", display: "flex", justifyContent: "space-between" } },
        React.createElement("span", null, `共 ${data.length} 行，显示前 ${Math.min(mRows, data.length)} 行`),
        React.createElement("span", null, `${allHeaders.length} 列`)
      )
    );
  },

  renderStepDebug: (step, stepIdx, currentRule, activeField, state, currentPlatform) => {
    try {
      const allSteps = currentRule?.steps || [];
      const prevSteps = allSteps.slice(0, stepIdx);
      const activeFieldId = activeField?.id;
      const fieldSamples = activeFieldId ? (state.samples[activeFieldId] || []) : [];

      const sampleTables = (state.samples[currentPlatform] || []).map((s, i) => ({
        id: s.id || `sample_${i}`,
        name: s.alias || s.fileName,
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
      }));
      const tables = [...sampleTables, ...externalTables];

      let inputData = null;
      let outputData = null;
      let executeError = null;

      if (typeof CalcEngine?.runSteps === "function") {
        const ctx = {
          fieldId: activeFieldId,
          platform: currentPlatform,
          samples: fieldSamples,
          tables,
          externals: state.externals || [],
          shopName: state.platform?.shops?.[0]?.name || "",
        };
        try {
          const res = CalcEngine.runSteps(prevSteps, ctx);
          inputData = res?.data ?? res?.result ?? res;
        } catch (e) {
          executeError = e.message || String(e);
        }

        try {
          const res = CalcEngine.runSteps(allSteps.slice(0, stepIdx + 1), ctx);
          outputData = res?.data ?? res?.result ?? res;
        } catch (e) {
          executeError = e.message || String(e);
        }
      }

      const renderDataPreview = (data) => {
        if (!data) return React.createElement("span", { className: "debug-empty" }, "暂无数据");
        if (Array.isArray(data)) {
          if (data.length === 0) return React.createElement("span", { className: "debug-empty" }, "空数组");

          const headerSet = new Set();
          data.forEach((row) => {
            if (row && typeof row === "object") {
              Object.keys(row).forEach((k) => {
                if (!k.startsWith("_")) headerSet.add(k);
              });
            }
          });
          const allHeaders = Array.from(headerSet);
          if (allHeaders.length === 0) return React.createElement("span", { className: "debug-empty" }, "无可见列");

          if (allHeaders.length === 1) {
            const key = allHeaders[0];
            return React.createElement("div", { className: "debug-single-column" },
              React.createElement("div", { className: "debug-single-column-header" }, React.createElement(Icons.Column, { size: 14 }), key),
              data.slice(0, 50).map((row, ri) => React.createElement("div", { key: ri, className: "debug-single-column-row" },
                React.createElement("span", { className: "debug-single-column-index" }, ri + 1),
                React.createElement("span", { className: "debug-single-column-value" },
                  row[key] != null
                    ? (typeof row[key] === "number"
                      ? row[key].toLocaleString("zh-CN", { maximumFractionDigits: 4 })
                      : String(row[key]).slice(0, 80))
                    : "-"
                )
              )),
              data.length > 50 && React.createElement("div", { className: "debug-table-more" }, `... 共 ${data.length} 行，显示前50行`)
            );
          }

          const displayHeaders = allHeaders;
          const displayRows = data.slice(0, 100);
          return React.createElement("div", { className: "debug-data-table" },
            React.createElement("div", { className: "debug-table-scroll" },
              React.createElement("table", { className: "debug-table" },
                React.createElement("thead", null,
                  React.createElement("tr", null,
                    displayHeaders.map((h) => React.createElement("th", { key: h, title: h }, h))
                  )
                ),
                React.createElement("tbody", null,
                  displayRows.map((row, ri) => React.createElement("tr", { key: ri },
                    displayHeaders.map((h) => React.createElement("td", { key: h },
                      row[h] != null
                        ? (typeof row[h] === "number"
                          ? row[h].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                          : String(row[h]).slice(0, 50))
                        : "-"
                    ))
                  ))
                )
              )
            ),
            data.length > 100 && React.createElement("div", { className: "debug-table-more" }, `... 共 ${data.length} 行，显示前100行`)
          );
        }

        if (typeof data === "object") {
          const entries = Object.entries(data).filter(([k]) => !k.startsWith("_"));
          if (entries.length === 0) return React.createElement("span", { className: "debug-empty" }, "空对象");
          return React.createElement("div", { className: "debug-data-object" },
            entries.map(([key, val]) => React.createElement("div", { key: key, className: "debug-object-row" },
              React.createElement("span", { className: "debug-object-key" }, key),
              React.createElement("span", { className: "debug-object-value" },
                typeof val === "number"
                  ? val.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                  : typeof val === "object"
                    ? JSON.stringify(val).slice(0, 50)
                    : String(val).slice(0, 50)
              )
            ))
          );
        }

        return React.createElement("span", null,
          typeof data === "number"
            ? data.toLocaleString("zh-CN", { maximumFractionDigits: 4 })
            : String(data)
        );
      };

      return React.createElement("div", { className: "debug-section" },
        React.createElement("div", { className: "debug-row" },
          React.createElement("div", { className: "debug-label" },
            "📥 输入数据",
            inputData && Array.isArray(inputData) && React.createElement("span", { className: "debug-count" }, `(${inputData.length} 行)`)
          ),
          React.createElement("div", { className: "debug-value" },
            inputData ? renderDataPreview(inputData) :
            executeError ? React.createElement("span", { className: "debug-error" }, `执行失败: ${executeError}`) :
            React.createElement("span", { className: "debug-empty" }, "暂无输入数据（请先在「样例数据」中配置字段样例）")
          )
        ),
        React.createElement("div", { className: "debug-arrow" }, "↓"),
        React.createElement("div", { className: "debug-row" },
          React.createElement("div", { className: "debug-label" },
            "📤 输出结果",
            outputData && Array.isArray(outputData) && React.createElement("span", { className: "debug-count" }, `(${outputData.length} 行)`)
          ),
          React.createElement("div", { className: "debug-value" },
            outputData ? renderDataPreview(outputData) :
            executeError ? React.createElement("span", { className: "debug-error" }, `执行失败: ${executeError}`) :
            React.createElement("span", { className: "debug-empty" }, "暂无输出")
          )
        ),
        React.createElement("div", { className: "debug-tip" },
          "💡 提示：调试预览仅用于验证步骤逻辑。实际计算时会基于真实数据源执行。"
        )
      );
    } catch (e) {
      return React.createElement("div", { className: "debug-error" }, `调试面板加载失败: ${e.message}`);
    }
  },
};
