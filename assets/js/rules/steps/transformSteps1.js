(function() {
  var e = React.createElement;

  var renderFilterStep = /*#__PURE__*/ function(step, ctx) {
    var updateStepConfig = ctx.updateStepConfig;
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var getColumnValues = ctx.getColumnValues;

    if (step.type === "filterEqual" || step.type === "filterContain" || step.type === "filter") {
      var filterValues = getColumnValues(step.config.column);
      var columnOptions = [
        { value: "val", label: "当前值 (val)" },
        ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
      ];
      var opOptions = [
        { value: "==", label: "等于" },
        { value: "!=", label: "不等于" },
        { value: ">", label: "大于" },
        { value: "<", label: "小于" },
        { value: ">=", label: "大于等于" },
        { value: "<=", label: "小于等于" },
        { value: "contains", label: "包含" },
        { value: "notContains", label: "不包含" },
        { value: "startsWith", label: "开头是" },
        { value: "endsWith", label: "结尾是" },
        { value: "isEmpty", label: "为空" },
        { value: "notEmpty", label: "不为空" },
        { value: "regex", label: "正则匹配" },
      ];
      var valueOptions = filterValues.map((v) => ({ value: v, label: v }));
      var isMultiSelectOp = step.config.op === "==" || step.config.op === "!=";
      var selectedValues = isMultiSelectOp
        ? (Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []))
        : (step.config.value ? [step.config.value] : []);
      var toggleValue = (v) => {
        if (isMultiSelectOp) {
          var current = Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []);
          var newValues = current.includes(v)
            ? current.filter((item) => item !== v)
            : [...current, v];
          updateStepConfig(step.id, "values", newValues);
          if (newValues.length === 0) {
            updateStepConfig(step.id, "value", "");
          } else if (newValues.length === 1) {
            updateStepConfig(step.id, "value", newValues[0]);
          }
        } else {
          updateStepConfig(step.id, "value", step.config.value === v ? "" : v);
          updateStepConfig(step.id, "values", []);
        }
      };
      return /*#__PURE__*/ e(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ e(
          "div",
          { className: "filter-header-bar" },
          /*#__PURE__*/ e(
            "div",
            { className: "filter-header-title" },
            /*#__PURE__*/ e(
              "span",
              { className: "filter-header-icon" },
              "🔍",
            ),
            "筛选条件",
          ),
          filterValues.length > 0 && /*#__PURE__*/ e(
            "div",
            { className: "filter-header-count" },
            `该列共 ${filterValues.length} 个不同值`,
          ),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "筛选列",
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.column,
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: columnOptions,
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "条件",
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.op,
              onChange: (val) => {
                updateStepConfig(step.id, "op", val);
                if (val !== "==" && val !== "!=") {
                  updateStepConfig(step.id, "values", []);
                }
              },
              options: opOptions,
              placeholder: "请选择条件",
            }),
          ),
        ),
        (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            isMultiSelectOp ? "筛选值（可多选）" : "筛选值",
            filterValues.length > 0 && /*#__PURE__*/ e(
              "span",
              { style: { color: "var(--color-text-muted)", fontWeight: 400, fontSize: 12, marginLeft: 6 } },
              `（已选 ${selectedValues.length} 项）`,
            ),
          ),
          !isMultiSelectOp && /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.value || "",
            onChange: (val) => updateStepConfig(step.id, "value", val),
            options: valueOptions,
            placeholder: "选择或输入筛选值",
            allowCreate: true,
          }),
        ),
        filterValues.length > 0 && (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && /*#__PURE__*/ e(
          "div",
          { className: "filter-quick-select" },
          /*#__PURE__*/ e(
            "div",
            { className: "filter-quick-label" },
            isMultiSelectOp ? "快捷选择（可多选）：" : "快捷选择：",
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "filter-value-tags" },
            filterValues.slice(0, 15).map((v) =>
              /*#__PURE__*/ e(
                "span",
                {
                  key: v,
                  className: `filter-value-tag ${selectedValues.includes(v) ? "active" : ""}`,
                  onClick: () => toggleValue(v),
                },
                v,
              ),
            ),
            filterValues.length > 15 && /*#__PURE__*/ e(
              "span",
              { className: "filter-value-tag filter-value-more" },
              `+${filterValues.length - 15}`,
            ),
          ),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ e(Icons.Info, null),
          " 🎯 ",
          /*#__PURE__*/ e("strong", null, "筛选"),
          isMultiSelectOp
            ? "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。支持同时选择多个值进行匹配。"
            : "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。下拉列表自动识别列中所有值，与Excel筛选体验一致。",
        ),
      );
    }

    if (step.type === "filterRange") {
      return /*#__PURE__*/ e(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ e(
          "div",
          { className: "filter-header-bar" },
          /*#__PURE__*/ e(
            "div",
            { className: "filter-header-title" },
            /*#__PURE__*/ e(
              "span",
              { className: "filter-header-icon" },
              "📊",
            ),
            "范围筛选",
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "filter-header-count" },
            "筛选数值在指定范围内的数据",
          ),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "筛选列",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column,
            onChange: (val) => updateStepConfig(step.id, "column", val),
            options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
            placeholder: "请选择列",
          }),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "最小值",
            ),
            /*#__PURE__*/ e("input", {
              type: "number",
              className: "input",
              value: step.config.min ?? "",
              onChange: (e) =>
                updateStepConfig(step.id, "min", e.target.value),
              placeholder: "输入最小值",
            }),
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "最大值",
            ),
            /*#__PURE__*/ e("input", {
              type: "number",
              className: "input",
              value: step.config.max ?? "",
              onChange: (e) =>
                updateStepConfig(step.id, "max", e.target.value),
              placeholder: "输入最大值",
            }),
          ),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ e(Icons.Info, null),
          " 📊 ",
          /*#__PURE__*/ e("strong", null, "范围筛选"),
          "：筛选出数值在最小值和最大值之间的数据行，两端都包含。",
        ),
      );
    }

    if (step.type === "topN") {
      return /*#__PURE__*/ e(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ e(
          "div",
          { className: "filter-header-bar" },
          /*#__PURE__*/ e(
            "div",
            { className: "filter-header-title" },
            /*#__PURE__*/ e(
              "span",
              { className: "filter-header-icon" },
              "🏆",
            ),
            "前N行筛选",
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "filter-header-count" },
            "只保留排名靠前的行",
          ),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "保留行数",
            ),
            /*#__PURE__*/ e("input", {
              type: "number",
              className: "input",
              value: step.config.count ?? 10,
              onChange: (e) =>
                updateStepConfig(step.id, "count", Number(e.target.value)),
              placeholder: "输入行数",
              min: 1,
            }),
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "排序列（可选）",
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [
                { value: "", label: "保持原顺序" },
                ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
              ],
              placeholder: "选择排序列",
            }),
          ),
        ),
        step.config.column && /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "排序方式",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.order || "desc",
            onChange: (val) => updateStepConfig(step.id, "order", val),
            options: [
              { value: "desc", label: "降序（从大到小）" },
              { value: "asc", label: "升序（从小到大）" },
            ],
            placeholder: "选择排序方式",
          }),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ e(Icons.Info, null),
          " 🏆 ",
          /*#__PURE__*/ e("strong", null, "前N行筛选"),
          "：只保留前N条数据，可指定按某列排序后取前N行。",
        ),
      );
    }

    return null;
  };

  var renderAggregateStep = /*#__PURE__*/ function(step, ctx) {
    var updateStepConfig = ctx.updateStepConfig;
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var sourceTableHeaders = ctx.sourceTableHeaders;

    var aggregateFuncOptions = [
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
      { value: "mode", label: "众数", group: "高级统计" },
      { value: "first", label: "第一个值", group: "位置" },
      { value: "last", label: "最后一个值", group: "位置" },
      { value: "sumAbs", label: "绝对值求和", group: "特殊" },
    ];
    var columnOptionsWithVal = [
      { value: "", label: "当前值 (val)", group: "上一步结果" },
      { value: "__expr__", label: "计算表达式", group: "高级" },
      ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
    ];
    var quickAggFuncs = ["sum", "avg", "count", "max", "min"];
    var showExprInput = step.config.column === "__expr__";
    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "config-section" },
        /*#__PURE__*/ e(
          "div",
          { className: "config-section-header" },
          /*#__PURE__*/ e(
            "span",
            { className: "config-section-title" },
            /*#__PURE__*/ e(Icons.Aggregate, null),
            " 聚合设置"
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "聚合列",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "选择要聚合的数据或使用计算表达式"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.column,
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: columnOptionsWithVal,
              placeholder: "请选择列",
              groupBy: "group",
            }),
            showExprInput && /*#__PURE__*/ e(
              "div",
              { className: "form-item", style: { marginTop: "10px" } },
              /*#__PURE__*/ e(
                "label",
                { className: "form-label" },
                "计算表达式",
                /*#__PURE__*/ e(
                  "span",
                  { className: "form-label-hint" },
                  "先计算每行的值，再聚合。如: {单价} * {数量}"
                )
              ),
              /*#__PURE__*/ e(
                "div",
                { className: "form-control" },
                /*#__PURE__*/ e("input", {
                  type: "text",
                  value: step.config.expr || "",
                  onChange: (e) => updateStepConfig(step.id, "expr", e.target.value),
                  placeholder: "输入计算表达式，如: {单价} * {数量}",
                  className: "form-input",
                  style: { fontFamily: "var(--font-mono)", letterSpacing: "0.5px" },
                }),
                /*#__PURE__*/ e(
                  "div",
                  { style: { marginTop: "10px" } },
                  /*#__PURE__*/ e("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                    /*#__PURE__*/ e(Icons.Calculator, { size: 12 }),
                    "运算符",
                  ),
                  /*#__PURE__*/ e(
                    "div",
                    { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" } },
                    [" + ", " - ", " * ", " / ", "(", ")"].map((op) => /*#__PURE__*/ e(
                      "button",
                      {
                        key: op,
                        type: "button",
                        className: "quick-tag",
                        style: { cursor: "pointer", minWidth: "32px", textAlign: "center", padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 },
                        onClick: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateStepConfig(step.id, "expr", (step.config.expr || "") + op);
                        },
                      },
                      op.trim(),
                    )),
                  ),
                ),
                /*#__PURE__*/ e(
                  "div",
                  { style: { marginTop: "6px" } },
                  /*#__PURE__*/ e("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                    /*#__PURE__*/ e(Icons.Columns, { size: 12 }),
                    "可用字段（点击插入）",
                  ),
                  /*#__PURE__*/ e(
                    "div",
                    { style: { display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "120px", overflowY: "auto", padding: "2px" } },
                    sourceTableHeaders.map((h) => /*#__PURE__*/ e(
                      "button",
                      {
                        key: h,
                        type: "button",
                        className: "quick-tag",
                        style: { cursor: "pointer", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                        title: h,
                        onClick: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateStepConfig(step.id, "expr", (step.config.expr || "") + `{${h}}`);
                        },
                      },
                      h,
                    )),
                  ),
                ),
                step.config.expr && /*#__PURE__*/ e(
                  "div",
                  { style: { marginTop: "10px", padding: "10px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" } },
                  /*#__PURE__*/ e("div", { style: { fontSize: "11px", fontWeight: 600, color: "#16a34a", marginBottom: "4px" } }, "公式预览"),
                  /*#__PURE__*/ e("div", { style: { fontSize: "13px", fontFamily: "var(--font-mono)", color: "#166534" } },
                    (step.config.expr || "").replace(/{([^}]+)}/g, "【$1】"),
                  ),
                ),
              ),
            ),
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "聚合函数",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "选择计算方式"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.func,
              onChange: (val) => updateStepConfig(step.id, "func", val),
              options: aggregateFuncOptions,
              placeholder: "请选择函数",
              groupBy: "group",
            }),
            /*#__PURE__*/ e(
              "div",
              { className: "quick-tags" },
              /*#__PURE__*/ e(
                "span",
                { className: "quick-tags-label" },
                "常用："
              ),
              quickAggFuncs.map((f) =>
                /*#__PURE__*/ e(
                  "span",
                  {
                    key: f,
                    className: `quick-tag ${step.config.func === f ? "active" : ""}`,
                    onClick: () => updateStepConfig(step.id, "func", f),
                  },
                  aggregateFuncOptions.find((o) => o.value === f)?.label.split("(")[0].trim()
                )
              )
            )
          )
        )
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        ' 💡 将多行数据聚合成单个结果值。选择"计算表达式"可先计算如「单价×数量」再聚合求和。',
      ),
    );
  };

  var renderFormulaStep = /*#__PURE__*/ function(step, ctx) {
    var updateStepConfig = ctx.updateStepConfig;
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var previewResult = ctx.previewResult;
    var savedRules = ctx.savedRules;
    var fields = ctx.fields;
    var currentFieldRef = ctx.currentFieldRef;
    var activeField = ctx.activeField;
    var CalcEngine = ctx.CalcEngine;
    var formulaFieldSearch = ctx.formulaFieldSearch;
    var setFormulaFieldSearch = ctx.setFormulaFieldSearch;

    var getAvailableFields = () => {
      var avail = [];
      avail.push({ key: "val", name: "上一步结果", type: "result", category: "变量" });
      var previewSteps = previewResult?.stepResults;
      if (Array.isArray(previewSteps) && previewSteps.length > 0) {
        var lastResult = previewSteps[previewSteps.length - 1];
        if (lastResult && lastResult.preview && lastResult.preview.length > 0) {
          var sampleRow = lastResult.preview[0];
          Object.keys(sampleRow).forEach((k) => {
            if (k !== "val" && k !== "_groupCount") {
              avail.push({ key: k, name: k, type: "field", category: "字段" });
            }
          });
        }
      }
      if (savedRules && typeof savedRules === "object") {
        Object.keys(savedRules).forEach((fieldId) => {
          var field = fields.find((f) => f.id === fieldId);
          if (
            field &&
            field.id !== (currentFieldRef?.id || activeField?.id) &&
            savedRules[fieldId]?.steps?.length > 0
          ) {
            var chipName = field.name + " (已配置)";
            if (!avail.some((a) => a.key === field.name)) {
              avail.push({ key: field.name, name: chipName, type: "computed", category: "已配置字段" });
            }
          }
        });
      }
      if (Array.isArray(sourceTableHeaders) && sourceTableHeaders.length > 0) {
        sourceTableHeaders.forEach((h) => {
          if (!avail.some((a) => a.key === h)) {
            avail.push({ key: h, name: h + " (源表字段)", type: "field", category: "字段" });
          }
        });
      }
      return avail;
    };
    var availFields = getAvailableFields();
    var formulaOperators = [
      { key: "+", name: "加法", type: "operator", category: "运算符", desc: "加法运算" },
      { key: "-", name: "减法", type: "operator", category: "运算符", desc: "减法运算" },
      { key: "*", name: "乘法", type: "operator", category: "运算符", desc: "乘法运算" },
      { key: "/", name: "除法", type: "operator", category: "运算符", desc: "除法运算" },
      { key: "%", name: "取余", type: "operator", category: "运算符", desc: "取余运算" },
      { key: "(", name: "左括号", type: "operator", category: "运算符", desc: "左括号" },
      { key: ")", name: "右括号", type: "operator", category: "运算符", desc: "右括号" },
      { key: " ? : ", name: "三元判断", type: "operator", category: "运算符", desc: "条件 ? 真值 : 假值" },
    ];
    var formulaFunctions = [
      { key: "Math.abs(", name: "绝对值", type: "function", category: "数学函数", desc: "Math.abs(val)" },
      { key: "Math.round(", name: "四舍五入", type: "function", category: "数学函数", desc: "Math.round(val)" },
      { key: "Math.floor(", name: "向下取整", type: "function", category: "数学函数", desc: "Math.floor(val)" },
      { key: "Math.ceil(", name: "向上取整", type: "function", category: "数学函数", desc: "Math.ceil(val)" },
      { key: "Math.max(", name: "最大值", type: "function", category: "数学函数", desc: "Math.max(a, b, ...)" },
      { key: "Math.min(", name: "最小值", type: "function", category: "数学函数", desc: "Math.min(a, b, ...)" },
      { key: "Math.pow(", name: "幂运算", type: "function", category: "数学函数", desc: "Math.pow(base, exp)" },
      { key: "Math.sqrt(", name: "平方根", type: "function", category: "数学函数", desc: "Math.sqrt(val)" },
      { key: "Math.log(", name: "自然对数", type: "function", category: "数学函数", desc: "Math.log(val)" },
      { key: "Math.exp(", name: "指数", type: "function", category: "数学函数", desc: "Math.exp(val)" },
    ];
    var allFormulaOptions = [
      ...availFields.map(f => ({ ...f, insert: `{${f.key}}` })),
      ...formulaOperators,
      ...formulaFunctions,
    ];
    var formatOptions = (CalcEngine.getOutputFormats && typeof CalcEngine.getOutputFormats === "function")
      ? CalcEngine.getOutputFormats()
      : [
          { value: "none", label: "不处理（原始数值）" },
          { value: "round2", label: "保留 2 位小数（四舍五入）" },
          { value: "thousands", label: "千分位格式化（如 1,234.56）" },
          { value: "money", label: "货币格式（¥1,234.56）" },
          { value: "percent", label: "百分比格式（12.34%）" },
        ];
    var currentFormat = step.config.format || "none";
    var insertAtCursor = (insertText) => {
      var expr = step.config.expr || "";
      updateStepConfig(step.id, "expr", expr + insertText);
    };
    var handleOptionSelect = (opt) => {
      if (opt.insert) {
        insertAtCursor(opt.insert);
      } else {
        insertAtCursor(opt.key);
      }
    };
    var filteredOptions = formulaFieldSearch.trim()
      ? allFormulaOptions.filter((opt) => {
          var q = formulaFieldSearch.toLowerCase();
          return (
            (opt.key || "").toLowerCase().includes(q) ||
            (opt.name || "").toLowerCase().includes(q) ||
            (opt.desc || "").toLowerCase().includes(q) ||
            (opt.category || "").toLowerCase().includes(q)
          );
        })
      : allFormulaOptions;
    var filteredGrouped = filteredOptions.reduce((acc, opt) => {
      var cat = opt.category || "其他";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(opt);
      return acc;
    }, {});
    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "config-section" },
        /*#__PURE__*/ e(
          "div",
          { className: "config-section-header" },
          /*#__PURE__*/ e(
            "span",
            { className: "config-section-title" },
            /*#__PURE__*/ e(Icons.Formula, null),
            " 公式编辑"
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "计算公式",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              "支持下拉选择或手动输入"
            )
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "formula-editor" },
            /*#__PURE__*/ e("textarea", {
              className: "input formula-textarea",
              value: step.config.expr || "",
              onChange: (e) =>
                updateStepConfig(step.id, "expr", e.target.value),
              placeholder: "{val} * 0.7 + {销售额} * 0.3",
              style: { fontFamily: "var(--font-mono)", minHeight: "80px" },
            }),
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "formula-dropdown-panel" },
            /*#__PURE__*/ e(
              "div",
              { className: "formula-search-box" },
              /*#__PURE__*/ e("input", {
                type: "text",
                className: "input formula-search-input",
                placeholder: "搜索字段、函数、运算符...",
                value: formulaFieldSearch,
                onChange: (e) => setFormulaFieldSearch(e.target.value),
              }),
              formulaFieldSearch && /*#__PURE__*/ e(
                "button",
                {
                  className: "formula-search-clear",
                  onClick: () => setFormulaFieldSearch(""),
                },
                "✕"
              ),
            ),
            Object.keys(filteredGrouped).length > 0
              ? Object.keys(filteredGrouped).map((cat) => /*#__PURE__*/ e(
                  "div",
                  { key: cat, className: "formula-dropdown-group" },
                  /*#__PURE__*/ e(
                    "div",
                    { className: "formula-dropdown-group-title" },
                    cat,
                    /*#__PURE__*/ e(
                      "span",
                      { className: "formula-dropdown-group-count" },
                      filteredGrouped[cat].length
                    )
                  ),
                  /*#__PURE__*/ e(
                    "div",
                    { className: "formula-dropdown-options" },
                    filteredGrouped[cat].map((opt, i) => /*#__PURE__*/ e(
                      "button",
                      {
                        key: i,
                        className: `formula-dropdown-option ${opt.type}`,
                        onClick: (e) => { e.preventDefault(); e.stopPropagation(); handleOptionSelect(opt); },
                        title: opt.desc || opt.name,
                      },
                      /*#__PURE__*/ e(
                        "span",
                        { className: "formula-option-key" },
                        opt.key
                      ),
                      /*#__PURE__*/ e(
                        "span",
                        { className: "formula-option-name" },
                        opt.name
                      ),
                    ))
                  )
                ))
              : /*#__PURE__*/ e(
                  "div",
                  { className: "formula-dropdown-empty" },
                  "未找到匹配项"
                )
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "输出值格式",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              "对计算结果进行格式转换"
            )
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: currentFormat,
            onChange: (val) => updateStepConfig(step.id, "format", val),
            options: formatOptions,
            placeholder: "请选择输出格式",
          })
        )
      ),
      step.config.expr && /*#__PURE__*/ e(
        "div",
        { style: { marginTop: "10px", padding: "10px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" } },
        /*#__PURE__*/ e("div", { style: { fontSize: "11px", fontWeight: 600, color: "#0369a1", marginBottom: "4px" } }, "公式预览"),
        /*#__PURE__*/ e("div", { style: { fontSize: "13px", fontFamily: "var(--font-mono)", color: "#0c4a6e" } },
          (step.config.expr || "").replace(/{([^}]+)}/g, "【$1】"),
        ),
        (() => {
          var expr = step.config.expr || "";
          var fieldsArr = expr.match(/{([^}]+)}/g);
          if (!fieldsArr) return null;
          return /*#__PURE__*/ e("div", { style: { marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px" } },
            fieldsArr.map((f, i) => /*#__PURE__*/ e("span", { key: i, style: { fontSize: "11px", padding: "2px 6px", background: "#e0f2fe", borderRadius: "4px", color: "#0369a1" } }, f.slice(1, -1)),
          ),
          /*#__PURE__*/ e("span", { style: { fontSize: "11px", color: "#7dd3fc" } }, `共${fieldsArr.length}个字段`),
          );
        })(),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 💡 使用 ",
        /*#__PURE__*/ e("code", null, "{字段名}"),
        " 引用字段值，",
        /*#__PURE__*/ e("code", null, "{val}"),
        " 代表上一步结果。支持所有JavaScript数学函数；计算结果可按所选格式输出。",
      ),
    );
  };

  var renderVirtualStep = /*#__PURE__*/ function(step, ctx) {
    var updateStepConfig = ctx.updateStepConfig;
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var MapValueEditor = ctx.MapValueEditor;
    var externalTables = ctx.externalTables;
    var AdvancedRuleConfig = ctx.AdvancedRuleConfig;

    var virtualRuleOptions = [
      { value: "copy", label: "复制", group: "基础" },
      { value: "toNumber", label: "转数字", group: "类型转换" },
      { value: "toString", label: "转文本", group: "类型转换" },
      { value: "trim", label: "去除空格", group: "文本处理" },
      { value: "parseQty", label: "提取数量", group: "文本处理" },
      { value: "parsePieces", label: "条数识别（商品规格）", group: "文本处理" },
      { value: "parseSize", label: "尺码识别（商品规格）", group: "文本处理" },
      { value: "costLookup", label: "成本查找（全局表）", group: "高级" },
      { value: "splitPlus", label: "按+号拆分计数", group: "文本处理" },
      { value: "abs", label: "绝对值", group: "数值计算" },
      { value: "round", label: "四舍五入", group: "数值计算" },
      { value: "floor", label: "向下取整", group: "数值计算" },
      { value: "ceil", label: "向上取整", group: "数值计算" },
      { value: "toFixed2", label: "保留2位小数", group: "数值计算" },
      { value: "percent", label: "百分比转小数", group: "数值计算" },
      { value: "parsePercent", label: "解析百分比", group: "数值计算" },
      { value: "formatMoney", label: "格式化金额", group: "数值计算" },
      { value: "toLowerCase", label: "转小写", group: "文本处理" },
      { value: "toUpperCase", label: "转大写", group: "文本处理" },
      { value: "length", label: "字符串长度", group: "文本处理" },
      { value: "substring", label: "截取子串", group: "文本处理" },
      { value: "replace", label: "替换", group: "文本处理" },
      { value: "concat", label: "拼接前后缀", group: "文本处理" },
      { value: "ifEmpty", label: "空值替换", group: "高级" },
      { value: "chineseToNumber", label: "中文数字转数字", group: "高级" },
      { value: "mapValue", label: "映射替换", group: "高级" },
      { value: "multiply", label: "乘代数", group: "数学运算" },
      { value: "divide", label: "除代数", group: "数学运算" },
      { value: "sumFields", label: "字段之和", group: "数学运算" },
      { value: "diffFields", label: "字段之差", group: "数学运算" },
    ];
    var quickVirtualRules = ["copy", "toNumber", "abs", "round", "trim", "parsePieces", "parseSize", "costLookup"];
    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "step-info-box" },
        /*#__PURE__*/ e(
          "div",
          { className: "step-info-title" },
          /*#__PURE__*/ e("span", { className: "step-info-icon" }, "💡"),
          "复杂运算步骤 - 虚拟字段转换"
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "step-info-content" },
          "虚拟字段用于创建派生数据列。",
          /*#__PURE__*/ e("br", null),
          "1. 源字段：选择要处理的列（如「商品规格」）",
          /*#__PURE__*/ e("br", null),
          "2. 目标字段：输出列名（多个用,分隔，可同时生成多个输出）",
          /*#__PURE__*/ e("br", null),
          "3. 转换规则：选择处理方式",
          /*#__PURE__*/ e("br", null),
          /*#__PURE__*/ e("span", { style: { color: "var(--color-primary)" } }, "• 转数字"), "：去除货币符号和逗号后转数字，支持百分比(50%→0.5)、提取字符串中第一个数字、中文数字识别",
          /*#__PURE__*/ e("br", null),
          /*#__PURE__*/ e("span", { style: { color: "var(--color-primary)" } }, "• 条数识别"), "：从商品规格中自动提取条数，支持「X条装」「X条」「X色各一」「X色各Y条」等模式，也可通过颜色词或+号自动计算",
          /*#__PURE__*/ e("br", null),
          /*#__PURE__*/ e("span", { style: { color: "var(--color-primary)" } }, "• 尺码识别"), "：从商品规格中自动提取尺码（S/M/L/XL/2XL/3XL等）",
          /*#__PURE__*/ e("br", null),
          /*#__PURE__*/ e("span", { style: { color: "var(--color-primary)" } }, "• 成本查找"), "：根据款号和尺码从全局成本表中匹配单件成本，支持自动按店铺名匹配成本表"
        )
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "config-section" },
        /*#__PURE__*/ e(
          "div",
          { className: "config-section-header" },
          /*#__PURE__*/ e(
            "span",
            { className: "config-section-title" },
            /*#__PURE__*/ e(Icons.Transform, null),
            " 字段转换设置"
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "源字段",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "选择字段"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.source,
              onChange: (val) =>
                updateStepConfig(step.id, "source", val),
              options: [
                { value: "val", label: "当前值 (val)" },
                ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
              ],
              placeholder: "请选择源字段",
            })
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "目标字段（多个用,分隔）",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "支持同一列多个输出"
              )
            ),
            /*#__PURE__*/ e("input", {
              type: "text",
              className: "input",
              value: step.config.target,
              onChange: (e) =>
                updateStepConfig(step.id, "target", e.target.value),
              placeholder: "目标字段名（多个用,分隔）",
            })
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "转换规则",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              "选择数据处理方式"
            )
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.rule,
            onChange: (val) => updateStepConfig(step.id, "rule", val),
            options: virtualRuleOptions,
            placeholder: "请选择转换规则",
            groupBy: "group",
          }),
          /*#__PURE__*/ e(
            "div",
            { className: "quick-tags" },
            /*#__PURE__*/ e(
              "span",
              { className: "quick-tags-label" },
              "常用："
            ),
            quickVirtualRules.map((r) =>
              /*#__PURE__*/ e(
                "span",
                {
                  key: r,
                  className: `quick-tag ${step.config.rule === r ? "active" : ""}`,
                  onClick: () => updateStepConfig(step.id, "rule", r),
                },
                virtualRuleOptions.find((o) => o.value === r)?.label
              )
            )
          )
        )
      ),
      step.config.rule === "mapValue" &&
      /*#__PURE__*/ e(MapValueEditor, { step: step, updateStepConfig: updateStepConfig }),
      step.config.rule === "costLookup" &&
      /*#__PURE__*/ e(
        "div",
        { className: "config-section", style: { marginTop: "12px" } },
        /*#__PURE__*/ e(
          "div",
          { className: "config-section-header" },
          /*#__PURE__*/ e(
            "span",
            { className: "config-section-title" },
            /*#__PURE__*/ e(Icons.Database, null),
            " 成本表配置"
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item", style: { marginBottom: "12px" } },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "成本表（全局表）",
            /*#__PURE__*/ e("span", { className: "form-label-hint" }, "自动按店铺名匹配")
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.costTableId || "",
            onChange: (val) => updateStepConfig(step.id, "costTableId", val),
            options: externalTables.map((t) => ({ value: t.id, label: t.name })),
            placeholder: "请选择全局成本表",
          })
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "款号字段",
              /*#__PURE__*/ e("span", { className: "form-label-hint" }, "数据中的款号列")
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.skuField || "",
              onChange: (val) => updateStepConfig(step.id, "skuField", val),
              options: [
                { value: "", label: "请选择" },
                ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
              ],
              placeholder: "选择款号字段",
            })
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "尺码字段",
              /*#__PURE__*/ e("span", { className: "form-label-hint" }, "虚拟字段生成的尺码列")
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.sizeField || "",
              onChange: (val) => updateStepConfig(step.id, "sizeField", val),
              options: [
                { value: "", label: "请选择" },
                ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
              ],
              placeholder: "选择尺码字段",
            })
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item", style: { marginTop: "8px" } },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "成本表款号列名",
            /*#__PURE__*/ e("span", { className: "form-label-hint" }, "成本表中的款号列，默认值为 款号")
          ),
          /*#__PURE__*/ e("input", {
            type: "text",
            className: "input",
            value: step.config.skuCol || "款号",
            onChange: (e) => updateStepConfig(step.id, "skuCol", e.target.value),
            placeholder: "款号",
          })
        )
      ),
      [
        "substring",
        "replace",
        "concat",
        "ifEmpty",
        "multiply",
        "divide",
        "sumFields",
        "diffFields",
        "concat",
        "mapValue",
        "split",
        "join",
        "trim",
        "upperCase",
        "lowerCase",
        "toFixed2",
      ].includes(step.config.rule) &&
      /*#__PURE__*/ e(AdvancedRuleConfig, { step: step, updateStepConfig: updateStepConfig }),
    );
  };

  window.RuleSteps = window.RuleSteps || {};
  window.RuleSteps.transformSteps1 = {
    renderFilterStep: renderFilterStep,
    renderAggregateStep: renderAggregateStep,
    renderFormulaStep: renderFormulaStep,
    renderVirtualStep: renderVirtualStep,
  };
})();
