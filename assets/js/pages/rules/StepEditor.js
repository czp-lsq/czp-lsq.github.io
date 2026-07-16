const MapValueEditor = ({ step, updateStepConfig }) => {
  const pairs = step.config.pairs || [{ from: "", to: "" }];
  const updatePairs = (newPairs) => updateStepConfig(step.id, "pairs", newPairs);

  return React.createElement(
    "div",
    { className: "config-section" },
    React.createElement("div", { className: "config-section-header" },
      React.createElement("span", { className: "config-section-title" },
        React.createElement(Icons.Edit3, null),
        " 映射值配置"
      )
    ),
    React.createElement("div", { className: "form-item" },
      pairs.map((pair, idx) => React.createElement("div", { key: idx, className: "grid-2", style: { marginBottom: "8px", alignItems: "center" } },
        React.createElement("input", {
          type: "text",
          className: "input",
          placeholder: "原始值",
          value: pair.from,
          onChange: (e) => {
            const newPairs = [...pairs];
            newPairs[idx] = { ...pair, from: e.target.value };
            updatePairs(newPairs);
          },
        }),
        React.createElement("span", { style: { color: "var(--color-text-tertiary)", fontSize: 12, textAlign: "center" } }, "→"),
        React.createElement("input", {
          type: "text",
          className: "input",
          placeholder: "替换为",
          value: pair.to,
          onChange: (e) => {
            const newPairs = [...pairs];
            newPairs[idx] = { ...pair, to: e.target.value };
            updatePairs(newPairs);
          },
        }),
        React.createElement("button", {
          className: "action-btn action-delete icon-only",
          onClick: () => {
            if (pairs.length <= 1) return;
            updatePairs(pairs.filter((_, i) => i !== idx));
          },
          title: "删除",
        }, React.createElement(Icons.Trash, { size: 14 }))
      )),
      React.createElement(Button, {
        size: "sm",
        onClick: () => updatePairs([...pairs, { from: "", to: "" }]),
      }, React.createElement(Icons.Plus, { size: 14 }), " 添加映射")
    )
  );
};

const AdvancedRuleConfig = ({ step, updateStepConfig }) => {
  const rule = step.config.rule;
  const cfg = step.config || {};

  const renderField = (label, hint, inputEl) => React.createElement("div", { className: "form-item" },
    React.createElement("label", { className: "form-label" }, label, hint && React.createElement("span", { className: "form-label-hint" }, hint)),
    inputEl
  );

  const renderInput = (key, placeholder, type = "text") => React.createElement("input", {
    type: type,
    className: "input",
    placeholder: placeholder,
    value: cfg[key] || "",
    onChange: (e) => updateStepConfig(step.id, key, e.target.value),
  });

  switch (rule) {
    case "substring":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.FileText, null), " 截取子串配置")
        ),
        React.createElement("div", { className: "grid-2" },
          renderField("起始位置", "从0开始", renderInput("start", "起始位置", "number")),
          renderField("截取长度", "要截取的字符数", renderInput("length", "长度", "number"))
        )
      );
    case "replace":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Edit3, null), " 替换配置")
        ),
        React.createElement("div", { className: "grid-2" },
          renderField("查找内容", "要替换的文本", renderInput("from", "查找内容")),
          renderField("替换为", "替换后的文本", renderInput("to", "替换为"))
        )
      );
    case "concat":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Link, null), " 拼接配置")
        ),
        React.createElement("div", { className: "grid-2" },
          renderField("连接符", "如 - 或 /", renderInput("separator", "连接符")),
          renderField("要拼接的字段", "逗号分隔的字段名", renderInput("columns", "字段1,字段2"))
        )
      );
    case "ifEmpty":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.HelpCircle, null), " 空值处理配置")
        ),
        renderField("默认值", "当值为空时使用的默认值", renderInput("defaultValue", "默认值"))
      );
    case "multiply":
    case "divide":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Calculator, null), " ", rule === "multiply" ? "乘数配置" : "除数配置")
        ),
        renderField(rule === "multiply" ? "乘数" : "除数", "数值", renderInput("value", "数值", "number"))
      );
    case "sumFields":
    case "diffFields":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Calculator, null), " ", rule === "sumFields" ? "求和字段配置" : "差值字段配置")
        ),
        renderField("字段列表", "逗号分隔的字段名", renderInput("fields", "字段1,字段2,字段3"))
      );
    case "split":
    case "join":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "config-section-header" },
          React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.FileText, null), " ", rule === "split" ? "拆分分隔符" : "连接符")
        ),
        renderField("分隔符", "如逗号、空格等", renderInput("separator", "分隔符"))
      );
    case "trim":
    case "upperCase":
    case "lowerCase":
    case "toFixed2":
      return React.createElement("div", { className: "config-section" },
        React.createElement("div", { className: "step-info-box" },
          React.createElement("div", { className: "step-info-title" }, React.createElement(Icons.Info, null), " 无需额外配置"),
          React.createElement("div", { className: "step-info-content" },
            rule === "trim" && "自动去除字符串首尾空格",
            rule === "upperCase" && "自动将文本转为大写",
            rule === "lowerCase" && "自动将文本转为小写",
            rule === "toFixed2" && "自动保留2位小数"
          )
        )
      );
    default:
      return null;
  }
};

function createRenderStepConfig(deps) {
  const { state, currentPlatform, currentRule, activeField, updateStepConfig, formulaFieldSearch, setFormulaFieldSearch, getStepTypeInfo } = deps;
  const SearchableSelect = window.SearchableSelect || ((props) => {
    const { value, onChange, options, placeholder, disabled, allowCreate, className = "", size = "default" } = props;
    const opts = (options || []).map((o) => typeof o === "object" ? { value: o.value, label: o.label || o.value } : { value: o, label: String(o) });
    const selectedOpt = opts.find((o) => String(o.value) === String(value));
    const displayValue = selectedOpt ? selectedOpt.label : value;
    return React.createElement("div", { className: `searchable-select ${className} ${disabled ? "disabled" : ""} size-${size}` },
      React.createElement("div", { className: "searchable-select-trigger", onClick: () => !disabled && document.querySelector(`[data-select-id="${props.key}"]`)?.focus() },
        React.createElement("span", { className: `searchable-select-value ${!value ? "placeholder" : ""}` }, displayValue || placeholder),
        React.createElement("span", { className: "searchable-select-arrow" },
          React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("polyline", { points: "6 9 12 15 18 9" })
          )
        )
      ),
      React.createElement("select", { className: "select", value: value || "", onChange: (e) => onChange && onChange(e.target.value), disabled: disabled, "data-select-id": props.key, style: { display: 'none' } },
        placeholder && React.createElement("option", { value: "" }, placeholder),
        opts.map((o) => React.createElement("option", { key: o.value, value: o.value }, o.label)),
        allowCreate && React.createElement("option", { value: "__create__" }, "输入自定义值")
      ),
      allowCreate && !disabled && React.createElement("input", { type: "text", className: "input", placeholder: "或输入自定义值", style: { marginTop: 4, fontSize: 12, padding: "4px 8px" }, onChange: (e) => onChange && onChange(e.target.value) })
    );
  });

  return (step, currentFieldRef) => {
    const samples = state.samples[currentPlatform] || [];
    const sampleTables = samples.map((s, i) => ({
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
    const allTables = [...sampleTables, ...externalTables];
    const sourceStep = currentRule?.steps?.find((s) => s.type === "source");
    const sourceTableId = sourceStep?.config?.table;
    const sourceTableIds = sourceStep?.config?.tables || [];

    const sourceTableHeaders = (() => {
      const allHeaders = new Set();
      if (sourceTableIds.length > 0) {
        sourceTableIds.forEach((tid) => {
          const table = allTables.find((t) => t.id === tid);
          table?.headers?.forEach((h) => allHeaders.add(h));
        });
      } else {
        const table = allTables.find((t) => t.id === sourceTableId);
        table?.headers?.forEach((h) => allHeaders.add(h));
      }
      const allSteps = currentRule?.steps || [];
      allSteps.filter((s) => s.type === "virtual").forEach((s) => {
        const targets = (s.config.target || "").split(",").map((t) => t.trim()).filter(Boolean);
        targets.forEach((t) => allHeaders.add(t));
      });
      allSteps.filter((s) => s.type === "join").forEach((s) => {
        const cfg = s.config || {};
        if (cfg.col) allHeaders.add(cfg.col);
        if (cfg.cols && Array.isArray(cfg.cols)) cfg.cols.forEach((c) => allHeaders.add(c));
      });
      return Array.from(allHeaders);
    })();

    const colOpts = [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))];
    const colOptsNoVal = sourceTableHeaders.map((h) => ({ value: h, label: h }));
    const allTableOpts = [{ value: "", label: "请选择数据表" }, ...allTables.map((t) => ({ value: t.id, label: t.name }))];

    const renderFieldSelect = (value, onChange, allowVal = true) => React.createElement(SearchableSelect, {
      value,
      onChange,
      options: allowVal ? colOpts : colOptsNoVal,
      placeholder: "请选择列",
    });

    const renderTableSelect = (value, onChange, disabled = false) => React.createElement(SearchableSelect, {
      value,
      onChange,
      options: allTableOpts,
      placeholder: "请选择数据表",
      disabled,
    });

    switch (step.type) {
      case "fill": {
        const currentField = currentFieldRef || {};
        const detectedType = currentField.semanticType || "auto";
        const fillTypeOptions = [
          { value: "auto", label: "🤖 自动识别（根据占位符类型）", group: "智能" },
          { value: "shop", label: "🏪 店铺名（从当前店铺）", group: "常用" },
          { value: "date", label: "📅 日期（数据周期日期）", group: "常用" },
          { value: "dateNow", label: "📆 日期（当前系统日期）", group: "常用" },
          { value: "field", label: "📊 从数据字段取值", group: "高级" },
        ];
        const dateFormatOptions = [
          { value: "yyyy", label: "仅年 (2024)" },
          { value: "mm", label: "仅月 (03)" },
          { value: "dd", label: "仅日 (15)" },
          { value: "yyyy-mm", label: "年月 (2024年03月)" },
          { value: "yyyy-mm-dd", label: "年月日 (2024年03月15日)" },
          { value: "mm-dd", label: "月日 (03月15日)" },
        ];

        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Fill, null), " 基本设置")
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "填充方式",
                React.createElement("span", { className: "form-label-hint" }, "选择数据填充来源")
              ),
              React.createElement(SearchableSelect, {
                value: step.config.fillType,
                onChange: (val) => updateStepConfig(step.id, "fillType", val),
                options: fillTypeOptions,
                placeholder: "请选择填充方式",
                groupBy: "group",
              })
            )
          ),
          step.config.fillType === "auto" && React.createElement("div", { className: "step-info-box" },
            React.createElement("div", { className: "step-info-title" }, React.createElement(Icons.Sparkles, null), " 自动填充规则"),
            React.createElement("div", { className: "step-info-content" },
              React.createElement("div", { className: "step-info-row" },
                React.createElement("span", { className: "step-info-label" }, "当前字段类型："),
                React.createElement("span", { className: "step-info-value" },
                  detectedType === "shop" && "🏪 店铺名占位符",
                  detectedType === "year" && "📅 年份占位符",
                  detectedType === "month" && "📅 月份占位符",
                  detectedType === "day" && "📅 日期占位符",
                  detectedType === "date" && "📅 日期占位符",
                  detectedType === "text" && "📝 文本占位符",
                  ![..."shop year month day date text value".split(" ")].includes(detectedType) && "❓ 未知类型（请手动选择填充方式）"
                )
              )
            )
          ),
          (step.config.fillType === "date" || step.config.fillType === "dateNow") && React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Clock, null),
                step.config.fillType === "date" ? " 数据周期日期设置" : " 系统日期设置"
              )
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "日期格式",
                React.createElement("span", { className: "form-label-hint" }, "选择输出格式")
              ),
              React.createElement(SearchableSelect, {
                value: step.config.dateFormat || "yyyy-mm-dd",
                onChange: (val) => updateStepConfig(step.id, "dateFormat", val),
                options: dateFormatOptions,
                placeholder: "请选择日期格式",
              })
            )
          ),
          step.config.fillType === "field" && React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Table, null), " 数据字段取值设置")
            ),
            React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "数据表",
                  React.createElement("span", { className: "form-label-hint" }, "选择数据来源")
                ),
                React.createElement(SearchableSelect, {
                  value: step.config.sourceTable || "",
                  onChange: (val) => {
                    updateStepConfig(step.id, "sourceTable", val);
                    updateStepConfig(step.id, "sourceField", "");
                  },
                  options: sampleTables.map((t) => ({ value: t.id, label: t.name, group: t.source === "sample" ? "样表数据" : "外部数据" })),
                  placeholder: "请选择数据表",
                  groupBy: "group",
                })
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "取值字段",
                  React.createElement("span", { className: "form-label-hint" }, "选择填充字段")
                ),
                React.createElement(SearchableSelect, {
                  value: step.config.sourceField || "",
                  onChange: (val) => updateStepConfig(step.id, "sourceField", val),
                  options: (sampleTables.find((t) => t.id === step.config.sourceTable)?.headers || []).map((h) => ({ value: h, label: h })),
                  placeholder: step.config.sourceTable ? "请选择字段" : "先选择数据表",
                  disabled: !step.config.sourceTable,
                })
              )
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null),
            step.config.fillType === "auto" ? "🤖 系统将根据字段的占位符类型自动选择最合适的填充方式" :
            step.config.fillType === "shop" ? "🏪 自动使用当前处理的店铺名（从文件名识别）" :
            step.config.fillType === "date" ? "📅 使用数据周期日期（从文件名/内容识别），按指定格式填充" :
            step.config.fillType === "dateNow" ? "📆 使用当前系统日期，按指定格式填充" :
            "📊 从指定数据表的指定字段中提取值进行填充"
          )
        );
      }

      case "source": {
        const selectedTables = step.config.tables || [];
        const firstSelectedTableHeaders = selectedTables.length > 0
          ? allTables.find((t) => t.id === selectedTables[0])?.headers || []
          : [];
        const tableOpts = [
          { value: "", label: "请选择数据表", group: "" },
          ...sampleTables.map((t) => ({ value: t.id, label: t.name, group: "样表数据" })),
          ...externalTables.map((t) => ({ value: t.id, label: t.name, group: "外部数据" })),
        ];

        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Database, null), " 数据源配置"),
              selectedTables.length > 0 && React.createElement("span", { className: "config-section-badge" }, `已选 ${selectedTables.length} 个表`)
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "主数据表",
                React.createElement("span", { className: "form-label-hint" }, "选择要计算的数据来源（显示为备注名称）")
              ),
              React.createElement(SearchableSelect, {
                value: step.config.table || "",
                onChange: (val) => {
                  updateStepConfig(step.id, "table", val);
                  updateStepConfig(step.id, "tables", val ? [val] : []);
                  updateStepConfig(step.id, "column", "");
                },
                options: tableOpts,
                placeholder: "请选择数据表",
                groupBy: "group",
              })
            ),
            step.config.table && React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "附加数据表（可选）",
                React.createElement("span", { className: "form-label-hint" }, "多表将自动合并，主表列优先")
              ),
              React.createElement("div", { className: "table-select-grid" },
                React.createElement("div", { className: "table-select-items table-select-items-grid" },
                  allTables.filter((t) => t.id !== step.config.table).map((t) => React.createElement("label", {
                    key: t.id,
                    className: `table-select-item ${selectedTables.includes(t.id) ? "selected" : ""}`,
                  },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: selectedTables.includes(t.id),
                      onChange: (e) => {
                        const newTables = e.target.checked
                          ? [...selectedTables, t.id]
                          : selectedTables.filter((id) => id !== t.id);
                        updateStepConfig(step.id, "tables", [step.config.table, ...newTables.filter((id) => id !== step.config.table)]);
                      },
                    }),
                    React.createElement("div", { className: "table-select-item-info" },
                      React.createElement("span", { className: "table-select-item-name" }, t.name)
                    )
                  ))
                )
              )
            )
          ),
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Column, null), " 列选择（可选）")
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "筛选列",
                React.createElement("span", { className: "form-label-hint" }, "不选则获取全部列")
              ),
              React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [{ value: "", label: "全部列" }, ...firstSelectedTableHeaders.map((h) => ({ value: h, label: h }))],
                placeholder: selectedTables.length > 0 ? "选择列" : "请先选择数据表",
                disabled: selectedTables.length === 0,
              })
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null),
            React.createElement("span", null, "选择主数据表后，可勾选附加表合并数据；选择列后仅获取该列，不选则获取全部列。")
          )
        );
      }

      case "filterEqual":
      case "filterContain":
      case "filter": {
        const filterValues = (() => {
          if (!step.config.column) return [];
          const values = new Set();
          const targetTables = sourceTableIds.length > 0
            ? allTables.filter((t) => sourceTableIds.includes(t.id))
            : (sourceTableId ? allTables.filter((t) => t.id === sourceTableId) : allTables);
          targetTables.forEach((table) => {
            (table.rows || []).forEach((row) => {
              const val = row[step.config.column];
              if (val !== undefined && val !== null && val !== "") values.add(String(val));
            });
          });
          return Array.from(values).slice(0, 200);
        })();
        const columnOptions = [{ value: "val", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))];
        const opOptions = [
          { value: "==", label: "等于" }, { value: "!=", label: "不等于" },
          { value: ">", label: "大于" }, { value: "<", label: "小于" },
          { value: ">=", label: "大于等于" }, { value: "<=", label: "小于等于" },
          { value: "contains", label: "包含" }, { value: "notContains", label: "不包含" },
          { value: "startsWith", label: "开头是" }, { value: "endsWith", label: "结尾是" },
          { value: "isEmpty", label: "为空" }, { value: "notEmpty", label: "不为空" },
          { value: "regex", label: "正则匹配" },
        ];
        const isMultiSelectOp = step.config.op === "==" || step.config.op === "!=";
        const selectedValues = isMultiSelectOp
          ? (Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []))
          : (step.config.value ? [step.config.value] : []);

        const toggleValue = (v) => {
          if (isMultiSelectOp) {
            const current = Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []);
            const newValues = current.includes(v) ? current.filter((item) => item !== v) : [...current, v];
            updateStepConfig(step.id, "values", newValues);
            if (newValues.length === 0) updateStepConfig(step.id, "value", "");
            else if (newValues.length === 1) updateStepConfig(step.id, "value", newValues[0]);
          } else {
            updateStepConfig(step.id, "value", step.config.value === v ? "" : v);
            updateStepConfig(step.id, "values", []);
          }
        };

        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "filter-header-bar" },
            React.createElement("div", { className: "filter-header-title" },
              React.createElement("span", { className: "filter-header-icon" }, "🔍"), "筛选条件"
            ),
            filterValues.length > 0 && React.createElement("div", { className: "filter-header-count" }, `该列共 ${filterValues.length} 个不同值`)
          ),
          React.createElement("div", { className: "grid-2" },
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "筛选列"),
              React.createElement(SearchableSelect, { value: step.config.column, onChange: (val) => updateStepConfig(step.id, "column", val), options: columnOptions, placeholder: "请选择列" })
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "条件"),
              React.createElement(SearchableSelect, {
                value: step.config.op,
                onChange: (val) => {
                  updateStepConfig(step.id, "op", val);
                  if (val !== "==" && val !== "!=") updateStepConfig(step.id, "values", []);
                },
                options: opOptions,
                placeholder: "请选择条件",
              })
            )
          ),
          (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && React.createElement("div", { className: "form-item" },
            React.createElement("label", { className: "form-label" }, isMultiSelectOp ? "筛选值（可多选）" : "筛选值"),
            !isMultiSelectOp && React.createElement(SearchableSelect, {
              value: step.config.value || "",
              onChange: (val) => updateStepConfig(step.id, "value", val),
              options: filterValues.map((v) => ({ value: v, label: v })),
              placeholder: "选择或输入筛选值",
              allowCreate: true,
            })
          ),
          filterValues.length > 0 && (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && React.createElement("div", { className: "filter-quick-select" },
            React.createElement("div", { className: "filter-quick-label" }, isMultiSelectOp ? "快捷选择（可多选）：" : "快捷选择："),
            React.createElement("div", { className: "filter-value-tags" },
              filterValues.slice(0, 15).map((v) => React.createElement("span", {
                key: v,
                className: `filter-value-tag ${selectedValues.includes(v) ? "active" : ""}`,
                onClick: () => toggleValue(v),
              }, v)),
              filterValues.length > 15 && React.createElement("span", { className: "filter-value-tag filter-value-more" }, `+${filterValues.length - 15}`)
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 🎯 ", React.createElement("strong", null, "筛选"),
            isMultiSelectOp ? "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。支持同时选择多个值进行匹配。" :
            "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。下拉列表自动识别列中所有值，与Excel筛选体验一致。"
          )
        );
      }

      case "filterRange":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "filter-header-bar" },
            React.createElement("div", { className: "filter-header-title" }, React.createElement("span", { className: "filter-header-icon" }, "📊"), "范围筛选"),
            React.createElement("div", { className: "filter-header-count" }, "筛选数值在指定范围内的数据")
          ),
          React.createElement("div", { className: "form-item" },
            React.createElement("label", { className: "form-label" }, "筛选列"),
            React.createElement(SearchableSelect, { value: step.config.column, onChange: (val) => updateStepConfig(step.id, "column", val), options: sourceTableHeaders.map((h) => ({ value: h, label: h })), placeholder: "请选择列" })
          ),
          React.createElement("div", { className: "grid-2" },
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "最小值"),
              React.createElement("input", { type: "number", className: "input", value: step.config.min ?? "", onChange: (e) => updateStepConfig(step.id, "min", e.target.value), placeholder: "输入最小值" })
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "最大值"),
              React.createElement("input", { type: "number", className: "input", value: step.config.max ?? "", onChange: (e) => updateStepConfig(step.id, "max", e.target.value), placeholder: "输入最大值" })
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 📊 ", React.createElement("strong", null, "范围筛选"), "：筛选出数值在最小值和最大值之间的数据行，两端都包含。"
          )
        );

      case "topN":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "filter-header-bar" },
            React.createElement("div", { className: "filter-header-title" }, React.createElement("span", { className: "filter-header-icon" }, "🏆"), "前N行筛选"),
            React.createElement("div", { className: "filter-header-count" }, "只保留排名靠前的行")
          ),
          React.createElement("div", { className: "grid-2" },
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "保留行数"),
              React.createElement("input", { type: "number", className: "input", value: step.config.count ?? 10, onChange: (e) => updateStepConfig(step.id, "count", Number(e.target.value)), placeholder: "输入行数", min: 1 })
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "排序列（可选）"),
              React.createElement(SearchableSelect, { value: step.config.column || "", onChange: (val) => updateStepConfig(step.id, "column", val), options: [{ value: "", label: "保持原顺序" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))], placeholder: "选择排序列" })
            )
          ),
          step.config.column && React.createElement("div", { className: "form-item" },
            React.createElement("label", { className: "form-label" }, "排序方式"),
            React.createElement(SearchableSelect, { value: step.config.order || "desc", onChange: (val) => updateStepConfig(step.id, "order", val), options: [{ value: "desc", label: "降序（从大到小）" }, { value: "asc", label: "升序（从小到大）" }], placeholder: "选择排序方式" })
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 🏆 ", React.createElement("strong", null, "前N行筛选"), "：只保留前N条数据，可指定按某列排序后取前N行。"
          )
        );

      case "aggregate": {
        const aggregateFuncOptions = [
          { value: "sum", label: "求和 (SUM)", group: "基础统计" },
          { value: "avg", label: "平均值 (AVG)", group: "基础统计" },
          { value: "count", label: "计数 (COUNT)", group: "基础统计" },
          { value: "max", label: "最大值 (MAX)", group: "基础统计" },
          { value: "min", label: "最小值 (MIN)", group: "基础统计" },
          { value: "countDistinct", label: "去重计数", group: "高级统计" },
          { value: "median", label: "中位数", group: "高级统计" },
          { value: "product", label: "乘积", group: "高级统计" },
          { value: "stddev", label: "标准差", group: "高级统计" },
          { value: "variance", label: "方差", group: "高级统计" },
        ];
        const columnOptionsWithVal = [
          { value: "", label: "当前值 (val)", group: "上一步结果" },
          { value: "__expr__", label: "计算表达式", group: "高级" },
          ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
        ];
        const showExprInput = step.config.column === "__expr__";

        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Aggregate, null), " 聚合设置")
            ),
            React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "聚合列",
                  React.createElement("span", { className: "form-label-hint" }, "选择要聚合的数据或使用计算表达式")
                ),
                React.createElement(SearchableSelect, {
                  value: step.config.column,
                  onChange: (val) => updateStepConfig(step.id, "column", val),
                  options: columnOptionsWithVal,
                  placeholder: "请选择列",
                  groupBy: "group",
                }),
                showExprInput && React.createElement("div", { className: "form-item", style: { marginTop: "10px" } },
                  React.createElement("label", { className: "form-label" }, "计算表达式",
                    React.createElement("span", { className: "form-label-hint" }, "使用 {字段名} 引用数据列")
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: step.config.expr || "",
                    onChange: (e) => updateStepConfig(step.id, "expr", e.target.value),
                    placeholder: "例如: {金额} * {数量}",
                  })
                )
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "聚合函数",
                  React.createElement("span", { className: "form-label-hint" }, "选择统计方式")
                ),
                React.createElement(SearchableSelect, {
                  value: step.config.func || "sum",
                  onChange: (val) => updateStepConfig(step.id, "func", val),
                  options: aggregateFuncOptions,
                  placeholder: "请选择函数",
                  groupBy: "group",
                })
              )
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 📊 ", React.createElement("strong", null, "聚合"), "：对数据进行汇总计算，如求和、平均值、计数等。"
          )
        );
      }

      case "formula":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Calculator, null), " 公式设置")
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "公式表达式",
                React.createElement("span", { className: "form-label-hint" }, "使用 {字段名} 引用数据列，支持 + - * / 运算")
              ),
              React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.expr || "",
                onChange: (e) => updateStepConfig(step.id, "expr", e.target.value),
                placeholder: "例如: {收入} - {成本} - {费用}",
              })
            ),
            sourceTableHeaders.length > 0 && React.createElement("div", { className: "form-item" },
              React.createElement("span", { className: "form-label" }, "可用字段"),
              React.createElement("div", { className: "form-tags" },
                sourceTableHeaders.map((h) => React.createElement("span", { key: h, className: "form-tag", onClick: () => {
                  const currentExpr = step.config.expr || "";
                  const newExpr = currentExpr ? `${currentExpr} + {${h}}` : `{${h}}`;
                  updateStepConfig(step.id, "expr", newExpr);
                }}, h))
              )
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 📝 ", React.createElement("strong", null, "公式计算"), "：使用自定义公式进行数学运算，支持加减乘除和括号。"
          )
        );

      case "constant":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.FileText, null), " 常量值设置")
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "常量值"),
              React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.value ?? "",
                onChange: (e) => updateStepConfig(step.id, "value", Number(e.target.value)),
                placeholder: "输入常量值",
              })
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 📌 ", React.createElement("strong", null, "常量值"), "：使用固定数值作为计算结果，不依赖输入数据。"
          )
        );

      case "text":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.FileText, null), " 文本设置")
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "文本内容"),
              React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.text || "",
                onChange: (e) => updateStepConfig(step.id, "text", e.target.value),
                placeholder: "输入文本内容",
              })
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 📝 ", React.createElement("strong", null, "文本"), "：输出固定文本内容。"
          )
        );

      case "virtual":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Sparkles, null), " 虚拟字段设置")
            ),
            React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "源字段"),
                renderFieldSelect(step.config.source, (val) => updateStepConfig(step.id, "source", val))
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "目标字段名"),
                React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: step.config.target || "",
                  onChange: (e) => updateStepConfig(step.id, "target", e.target.value),
                  placeholder: "新字段名",
                })
              )
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "处理规则"),
              React.createElement(SearchableSelect, {
                value: step.config.rule || "",
                onChange: (val) => updateStepConfig(step.id, "rule", val),
                options: [
                  { value: "substring", label: "截取子串" },
                  { value: "replace", label: "文本替换" },
                  { value: "concat", label: "字符串拼接" },
                  { value: "ifEmpty", label: "空值处理" },
                  { value: "multiply", label: "乘法" },
                  { value: "divide", label: "除法" },
                  { value: "sumFields", label: "字段求和" },
                  { value: "diffFields", label: "字段差值" },
                  { value: "split", label: "拆分" },
                  { value: "join", label: "连接" },
                  { value: "trim", label: "去除空格" },
                  { value: "upperCase", label: "转大写" },
                  { value: "lowerCase", label: "转小写" },
                  { value: "toFixed2", label: "保留2位小数" },
                ],
                placeholder: "选择处理规则",
              })
            ),
            step.config.rule && React.createElement(AdvancedRuleConfig, { step, updateStepConfig })
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " ✨ ", React.createElement("strong", null, "虚拟字段"), "：从现有字段派生新字段，如截取、替换、计算等。"
          )
        );

      case "lookup":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Search, null), " 查找替换设置")
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "查找字段"),
              renderFieldSelect(step.config.column, (val) => updateStepConfig(step.id, "column", val))
            ),
            React.createElement(MapValueEditor, { step, updateStepConfig })
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 🔍 ", React.createElement("strong", null, "查找替换"), "：按映射表将字段值替换为新值。"
          )
        );

      case "join": {
        const targetTableHeaders = step.config.targetTable
          ? (allTables.find((t) => t.id === step.config.targetTable)?.headers || [])
          : [];
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Layers, null), " 跨表关联设置")
            ),
            React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "关联表"),
                React.createElement(SearchableSelect, {
                  value: step.config.targetTable || "",
                  onChange: (val) => {
                    updateStepConfig(step.id, "targetTable", val);
                    updateStepConfig(step.id, "fk", "");
                    updateStepConfig(step.id, "col", "");
                  },
                  options: externalTables.map((t) => ({ value: t.id, label: t.name })),
                  placeholder: "选择外部数据表",
                })
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "本表关联键"),
                renderFieldSelect(step.config.key, (val) => updateStepConfig(step.id, "key", val))
              )
            ),
            step.config.targetTable && React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "关联表键"),
                React.createElement(SearchableSelect, {
                  value: step.config.fk || "",
                  onChange: (val) => updateStepConfig(step.id, "fk", val),
                  options: targetTableHeaders.map((h) => ({ value: h, label: h })),
                  placeholder: "选择关联键",
                })
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "导入字段"),
                React.createElement(SearchableSelect, {
                  value: step.config.col || "",
                  onChange: (val) => updateStepConfig(step.id, "col", val),
                  options: targetTableHeaders.filter((h) => h !== step.config.fk).map((h) => ({ value: h, label: h })),
                  placeholder: "选择要导入的字段",
                })
              )
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 🔗 ", React.createElement("strong", null, "跨表关联"), "：通过关联键从外部数据表导入字段值。"
          )
        );
      }

      case "group": {
        const groupByOptions = sourceTableHeaders.map((h) => ({ value: h, label: h }));
        const aggFuncOptions = [
          { value: "sum", label: "求和" },
          { value: "avg", label: "平均值" },
          { value: "count", label: "计数" },
          { value: "max", label: "最大值" },
          { value: "min", label: "最小值" },
        ];

        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Calculator, null), " 分组聚合设置")
            ),
            React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "分组字段"),
                React.createElement(SearchableSelect, {
                  value: step.config.groupBy || "",
                  onChange: (val) => updateStepConfig(step.id, "groupBy", val),
                  options: groupByOptions,
                  placeholder: "选择分组字段",
                })
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "聚合列"),
                renderFieldSelect(step.config.column, (val) => updateStepConfig(step.id, "column", val))
              )
            ),
            React.createElement("div", { className: "form-item" },
              React.createElement("label", { className: "form-label" }, "聚合函数"),
              React.createElement(SearchableSelect, {
                value: step.config.func || "sum",
                onChange: (val) => updateStepConfig(step.id, "func", val),
                options: aggFuncOptions,
                placeholder: "选择聚合方式",
              })
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " 📊 ", React.createElement("strong", null, "分组聚合"), "：按指定字段分组后进行聚合计算。"
          )
        );
      }

      case "sort":
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "config-section" },
            React.createElement("div", { className: "config-section-header" },
              React.createElement("span", { className: "config-section-title" }, React.createElement(Icons.Layers, null), " 排序设置")
            ),
            React.createElement("div", { className: "grid-2" },
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "排序列"),
                renderFieldSelect(step.config.column, (val) => updateStepConfig(step.id, "column", val))
              ),
              React.createElement("div", { className: "form-item" },
                React.createElement("label", { className: "form-label" }, "排序方式"),
                React.createElement(SearchableSelect, {
                  value: step.config.order || "desc",
                  onChange: (val) => updateStepConfig(step.id, "order", val),
                  options: [{ value: "desc", label: "降序" }, { value: "asc", label: "升序" }],
                  placeholder: "选择排序方式",
                })
              )
            )
          ),
          React.createElement("div", { className: "step-desc" },
            React.createElement(Icons.Info, null), " ↕️ ", React.createElement("strong", null, "排序"), "：按指定列对数据进行升序或降序排列。"
          )
        );

      default:
        return React.createElement("div", { className: "step-config" },
          React.createElement("div", { className: "step-info-box" },
            React.createElement("div", { className: "step-info-title" }, React.createElement(Icons.Info, null), " 暂未实现配置"),
            React.createElement("div", { className: "step-info-content" }, `步骤类型「${step.type}」的配置界面尚未实现，请使用预设模板或联系管理员。`)
          )
        );
    }
  };
}

window.StepEditor = { MapValueEditor, AdvancedRuleConfig, createRenderStepConfig };
