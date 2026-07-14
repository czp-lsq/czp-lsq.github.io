(function() {
  var renderCrossMatchStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var getTableHeaders = ctx.getTableHeaders;
    var allTables = ctx.allTables;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var getColumnValues = ctx.getColumnValues;
    return (function() {
      var isIntersect = step.type === "intersect";
      var modeOptions = isIntersect
        ? [
            { value: "keepExist", label: "保留存在于对比表的行（交集）" },
            { value: "keepNotExist", label: "保留不存在于对比表的行（差集）" },
          ]
        : [
            { value: "keepIntersection", label: "保留与对比表的交集行" },
            { value: "keepDifference", label: "保留不在对比表的差集行" },
            { value: "mergeWithFilter", label: "合并两表并筛选" },
            { value: "removeDuplicates", label: "当前数据多列去重" },
            { value: "keepDuplicates", label: "当前数据保留重复行" },
            { value: "semiJoin", label: "半连接（筛选后匹配）" },
            { value: "antiJoin", label: "反连接（筛选后不匹配）" },
          ];
      var compareTableHeaders = getTableHeaders(step.config.table);
      var columns = step.config.columns && step.config.columns.length > 0
        ? step.config.columns
        : (step.config.key ? [step.config.key] : [""]);
      var compareColumns = step.config.compareColumns && step.config.compareColumns.length > 0
        ? step.config.compareColumns
        : (step.config.compareKey ? [step.config.compareKey] : [""]);
      var currentMode = step.config.mode || (isIntersect ? "keepExist" : "keepIntersection");
      var needCompareTable = currentMode === "keepIntersection" || currentMode === "keepDifference" || currentMode === "keepExist" || currentMode === "keepNotExist" || currentMode === "mergeWithFilter" || currentMode === "semiJoin" || currentMode === "antiJoin";
      var allTableOptions = [{ value: "", label: "请选择数据表" }].concat(allTables.map(function(t) { return ({ value: t.id, label: t.name }); }));
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, isIntersect ? "对比模式" : "处理模式"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: currentMode,
            onChange: function(val) { return updateStepConfig(step.id, "mode", val); },
            options: modeOptions,
            placeholder: isIntersect ? "请选择对比模式" : "请选择处理模式",
          }),
        ),
        (currentMode === "semiJoin" || currentMode === "antiJoin") && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前数据筛选"),
          /*#__PURE__*/ React.createElement("div", { className: "grid-3", style: { gap: 6 } },
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.selfFilterColumn || "",
              onChange: function(val) { return updateStepConfig(step.id, "selfFilterColumn", val); },
              options: sourceTableHeaders.map(function(h) { return ({ value: h, label: h }); }),
              placeholder: "筛选列",
            }),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.selfFilterOp || "==",
              onChange: function(val) { return updateStepConfig(step.id, "selfFilterOp", val); },
              options: [
                { value: "==", label: "等于" },
                { value: "!=", label: "不等于" },
                { value: ">", label: "大于" },
                { value: "<", label: "小于" },
                { value: ">=", label: "大于等于" },
                { value: "<=", label: "小于等于" },
                { value: "contains", label: "包含" },
                { value: "notEmpty", label: "不为空" },
                { value: "isEmpty", label: "为空" },
              ],
              placeholder: "运算符",
            }),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.selfFilterValue || "",
              onChange: function(val) { return updateStepConfig(step.id, "selfFilterValue", val); },
              options: [{ value: "", label: "请输入值" }].concat(getColumnValues(step.config.selfFilterColumn).map(function(v) { return ({ value: v, label: v }); })),
              placeholder: "选择或输入值",
              allowCreate: true,
              disabled: step.config.selfFilterOp === "isEmpty" || step.config.selfFilterOp === "notEmpty",
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前表匹配列"),
          columns.map(function(col, idx) { return /*#__PURE__*/ React.createElement(
            "div",
            { key: idx, className: "grid-2", style: { marginBottom: 6, gap: 6 } },
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: col,
              onChange: function(val) {
                var newCols = [].concat(columns);
                newCols[idx] = val;
                var filtered = newCols.filter(Boolean);
                updateStepConfig(step.id, "columns", filtered.length ? filtered : [""]);
                if (isIntersect) updateStepConfig(step.id, "key", filtered[0] || "");
              },
              options: sourceTableHeaders.map(function(h) { return ({ value: h, label: h }); }),
              placeholder: "选择匹配列",
            }),
            columns.length > 1 && /*#__PURE__*/ React.createElement("button", {
              className: "btn-icon",
              onClick: function() {
                var newCols = columns.filter(function(_, i) { return i !== idx; });
                updateStepConfig(step.id, "columns", newCols.length ? newCols : [""]);
                if (isIntersect) updateStepConfig(step.id, "key", newCols[0] || "");
              },
              title: "删除此列",
            }, "×"),
          ); }),
          /*#__PURE__*/ React.createElement("button", {
            className: "btn-text",
            onClick: function() { return updateStepConfig(step.id, "columns", [].concat(columns, [""])); },
            style: { marginTop: 4 },
          }, "+ 添加匹配列"),
        ),
        needCompareTable && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比数据表"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.table || "",
              onChange: function(val) {
                updateStepConfig(step.id, "table", val);
                updateStepConfig(step.id, "compareColumns", [""]);
                if (isIntersect) updateStepConfig(step.id, "compareKey", "");
              },
              options: allTableOptions,
              placeholder: "请选择数据表",
            }),
          ),
          step.config.table && /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "对比表匹配列"),
            compareColumns.map(function(col, idx) { return /*#__PURE__*/ React.createElement(
              "div",
              { key: idx, className: "grid-2", style: { marginBottom: 6, gap: 6 } },
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: col,
                onChange: function(val) {
                  var newCols = [].concat(compareColumns);
                  newCols[idx] = val;
                  var filtered = newCols.filter(Boolean);
                  updateStepConfig(step.id, "compareColumns", filtered.length ? filtered : [""]);
                  if (isIntersect) updateStepConfig(step.id, "compareKey", filtered[0] || "");
                },
                options: compareTableHeaders.map(function(h) { return ({ value: h, label: h }); }),
                placeholder: "选择对比列",
              }),
              compareColumns.length > 1 && /*#__PURE__*/ React.createElement("button", {
                className: "btn-icon",
                onClick: function() {
                  var newCols = compareColumns.filter(function(_, i) { return i !== idx; });
                  updateStepConfig(step.id, "compareColumns", newCols.length ? newCols : [""]);
                  if (isIntersect) updateStepConfig(step.id, "compareKey", newCols[0] || "");
                },
                title: "删除此列",
              }, "×"),
            ); }),
            /*#__PURE__*/ React.createElement("button", {
              className: "btn-text",
              onClick: function() { return updateStepConfig(step.id, "compareColumns", [].concat(compareColumns, [""])); },
              style: { marginTop: 4 },
            }, "+ 添加对比列"),
          ),
        ),
        needCompareTable && step.config.table && /*#__PURE__*/ React.createElement(
          "div",
          { className: "intersect-filter-section" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-bar" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-title" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "filter-header-icon" },
                "🔍",
              ),
              "对比表筛选条件",
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "filter-header-hint" },
              "先筛选出对比表中符合条件的行，再进行两表对比",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-3" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "筛选列"),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.filterColumn || "",
                onChange: function(val) { return updateStepConfig(step.id, "filterColumn", val); },
                options: [{ value: "", label: "不筛选" }].concat(compareTableHeaders.map(function(h) { return ({ value: h, label: h }); })),
                placeholder: "请选择列",
              }),
            ),
            step.config.filterColumn && /*#__PURE__*/ React.createElement(
              React.Fragment,
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "条件"),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.filterOp || "==",
                  onChange: function(val) { return updateStepConfig(step.id, "filterOp", val); },
                  options: [
                    { value: "==", label: "等于" },
                    { value: "!=", label: "不等于" },
                    { value: ">", label: "大于" },
                    { value: "<", label: "小于" },
                    { value: ">=", label: "大于等于" },
                    { value: "<=", label: "小于等于" },
                    { value: "contains", label: "包含" },
                    { value: "notContains", label: "不包含" },
                    { value: "isEmpty", label: "为空" },
                    { value: "notEmpty", label: "不为空" },
                  ],
                  placeholder: "请选择条件",
                }),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "筛选值"),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.filterValue || "",
                  onChange: function(val) { return updateStepConfig(step.id, "filterValue", val); },
                  options: [{ value: "", label: "请输入值" }].concat(getColumnValues(step.config.filterColumn, step.config.table).map(function(v) { return ({ value: v, label: v }); })),
                  placeholder: "选择或输入值",
                  allowCreate: true,
                  disabled: step.config.filterOp === "isEmpty" || step.config.filterOp === "notEmpty",
                }),
              ),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          isIntersect
            ? " 将当前表与另一表按指定列进行对比，筛选出匹配或不匹配的行（已合并到交叉匹配能力）"
            : " 按多列与另一表取交集、差集、合并筛选，或对当前数据进行多列去重/保留重复",
        ),
      );
    })();
  };

  var renderSortStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var columnOptionsWithVal = ctx.columnOptionsWithVal;
    var sortDirectionOptions = [
      { value: "asc", label: "升序 ↑（从小到大）" },
      { value: "desc", label: "降序 ↓（从大到小）" },
    ];
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "config-section" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "config-section-header" },
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "config-section-title" },
            /*#__PURE__*/ React.createElement(Icons.Sort, null),
            " 排序设置"
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "排序列",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "按此列排序"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: function(val) { return updateStepConfig(step.id, "column", val); },
              options: columnOptionsWithVal,
              placeholder: "请选择列",
              groupBy: "group",
            })
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "排序方向",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "升序或降序"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.direction || "asc",
              onChange: function(val) { return updateStepConfig(step.id, "direction", val); },
              options: sortDirectionOptions,
              placeholder: "请选择方向",
            })
          )
        )
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        ' 💡 按指定列的值排序，数字按数值排序，文本按字典序排序。选择"当前值"时使用上一步输出的val字段。',
      ),
    );
  };

  var renderLimitStep = /*#__PURE__*/ function(step, ctx) {
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u9650\u5236\u6570\u91CF",
        ),
        /*#__PURE__*/ React.createElement("input", {
          type: "number",
          className: "input",
          value: step.config.count,
          onChange: function(e) {
            return updateStepConfig(step.id, "count", Number(e.target.value));
          },
          min: 1,
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u53EA\u4FDD\u7559\u524DN\u884C\u6570\u636E",
      ),
    );
  };

  var renderLookupStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var Button = ctx.Button;
    var updateStepConfig = ctx.updateStepConfig;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u67E5\u627E\u5217",
        ),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: [{ value: "", label: "默认使用当前值(val)" }].concat((sourceTableHeaders || []).map(function(h) { return ({ value: h, label: h }); })),
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5339\u914D\u6A21\u5F0F",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.mode || "exact",
            onChange: function(val) { return updateStepConfig(step.id, "mode", val); },
            options: [
              { value: "exact", label: "精确匹配" },
              { value: "contains", label: "包含匹配" },
              { value: "regex", label: "正则匹配" },
              { value: "startsWith", label: "开头匹配" },
              { value: "endsWith", label: "结尾匹配" },
            ],
            placeholder: "请选择匹配模式",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u672A\u5339\u914D\u65F6",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.onMiss || "keep",
            onChange: function(val) { return updateStepConfig(step.id, "onMiss", val); },
            options: [
              { value: "keep", label: "保留原值" },
              { value: "default", label: "使用默认值" },
              { value: "empty", label: "置空" },
            ],
            placeholder: "请选择未匹配策略",
          }),
        ),
      ),
      step.config.onMiss === "default" &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u9ED8\u8BA4\u503C",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            value: step.config.defaultValue || "",
            onChange: function(e) {
              return updateStepConfig(step.id, "defaultValue", e.target.value);
            },
            placeholder: "\u672A\u5339\u914D\u65F6\u8FD4\u56DE\u7684\u9ED8\u8BA4\u503C",
          }),
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u6620\u5C04\u89C4\u5219",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          (step.config.pairs || []).map(function(pair, idx) {
            return /*#__PURE__*/ React.createElement(
              "div",
              {
                key: idx,
                style: { display: "flex", gap: 8, alignItems: "center" },
              },
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: pair.from,
                onChange: function(e) {
                  var newPairs = [].concat(step.config.pairs || []);
                  newPairs[idx] = { from: e.target.value, to: pair.to };
                  updateStepConfig(step.id, "pairs", newPairs);
                },
                placeholder: "\u539F\u503C/\u6A21\u5F0F",
                style: { flex: 1 },
              }),
              /*#__PURE__*/ React.createElement(
                "span",
                { style: { color: "var(--color-text-tertiary)" } },
                "\u2192",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: pair.to,
                onChange: function(e) {
                  var newPairs = [].concat(step.config.pairs || []);
                  newPairs[idx] = { from: pair.from, to: e.target.value };
                  updateStepConfig(step.id, "pairs", newPairs);
                },
                placeholder: "\u66FF\u6362\u503C",
                style: { flex: 1 },
              }),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn-link danger",
                  onClick: function() {
                    var newPairs = (step.config.pairs || []).filter(
                      function(_, i) { return i !== idx; },
                    );
                    updateStepConfig(step.id, "pairs", newPairs);
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Trash, null),
              ),
            );
          }),
          /*#__PURE__*/ React.createElement(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: function() {
                var newPairs = [].concat(
                  step.config.pairs || [],
                  [{ from: "", to: "" }],
                );
                updateStepConfig(step.id, "pairs", newPairs);
              },
            },
            /*#__PURE__*/ React.createElement(Icons.Plus, null),
            " \u6DFB\u52A0\u6620\u5C04\u89C4\u5219",
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u6839\u636E\u6620\u5C04\u8868\u67E5\u627E\u5E76\u66FF\u6362\u503C\u3002\u652F\u6301\u7CBE\u786E\u5339\u914D\u3001\u5305\u542B\u5339\u914D\u3001\u6B63\u5219\u5339\u914D\u7B49\u591A\u79CD\u6A21\u5F0F\u3002\u53EF\u7528\u4E8E\u5C06\u6587\u672C\u63CF\u8FF0\uFF08\u5982\u300C\u767D+\u9ED1+\u7070\u300D\u300C6\u6761\u88C5\u300D\uFF09\u8F6C\u6362\u4E3A\u6570\u503C\u3002",
      ),
    );
  };

  var renderKeepDuplicateStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "判断列"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: [{ value: "", label: "当前值 (val)" }].concat(sourceTableHeaders.map(function(h) { return ({ value: h, label: h }); })),
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " 按指定列判断，仅保留出现过多次的重复行（重复行会全部保留）",
      ),
    );
  };

  var renderKeepUniqueStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "判断列"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: [{ value: "", label: "当前值 (val)" }].concat(sourceTableHeaders.map(function(h) { return ({ value: h, label: h }); })),
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " 按指定列判断，仅保留只出现过一次的唯一行",
      ),
    );
  };

  window.RuleSteps = window.RuleSteps || {};
  window.RuleSteps.advancedSteps = {
    renderCrossMatchStep: renderCrossMatchStep,
    renderSortStep: renderSortStep,
    renderLimitStep: renderLimitStep,
    renderLookupStep: renderLookupStep,
    renderKeepDuplicateStep: renderKeepDuplicateStep,
    renderKeepUniqueStep: renderKeepUniqueStep,
  };
})();
