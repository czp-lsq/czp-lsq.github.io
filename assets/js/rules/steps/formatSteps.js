(function() {
  var renderRoundStep = /*#__PURE__*/ function(step, ctx) {
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
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "输入列"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: [{ value: "", label: "当前值 (val)" }].concat(sourceTableHeaders.map(function(h) { return ({ value: h, label: h }); })),
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u5C0F\u6570\u4F4D\u6570",
        ),
        /*#__PURE__*/ React.createElement("input", {
          type: "number",
          className: "input",
          value: step.config.decimals,
          onChange: function(e) {
            return updateStepConfig(step.id, "decimals", Number(e.target.value));
          },
          min: 0,
          max: 10,
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u5BF9\u6570\u503C\u8FDB\u884C\u56DB\u820D\u4E94\u5165\uFF0C\u4FDD\u7559\u6307\u5B9A\u5C0F\u6570\u4F4D\u6570",
      ),
    );
  };

  var renderConcatStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var Button = ctx.Button;
    var updateStepConfig = ctx.updateStepConfig;
    var colOptsNoVal = ctx.colOptsNoVal;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u62FC\u63A5\u5B57\u6BB5",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          (step.config.columns || ["", ""]).map(function(col, idx) {
            return /*#__PURE__*/ React.createElement(
              "div",
              { key: idx, style: { display: "flex", gap: 8 } },
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: col,
                onChange: function(val) {
                  var newCols = [].concat(step.config.columns || ["", ""]);
                  newCols[idx] = val;
                  updateStepConfig(step.id, "columns", newCols);
                },
                options: [{ value: "", label: "请选择字段" }].concat(colOptsNoVal),
                placeholder: "请选择字段",
              }),
              idx < (step.config.columns || ["", ""]).length - 1 &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  { style: { color: "var(--color-text-tertiary)", alignSelf: "center" } },
                  "+",
                ),
            );
          }),
          /*#__PURE__*/ React.createElement(
            Button,
            {
              size: "sm",
              onClick: function() {
                var newCols = [].concat(step.config.columns || ["", ""], [""]);
                updateStepConfig(step.id, "columns", newCols);
              },
            },
            /*#__PURE__*/ React.createElement(Icons.Plus, null),
            " \u6DFB\u52A0\u5B57\u6BB5",
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u5206\u9694\u7B26",
        ),
        /*#__PURE__*/ React.createElement("input", {
          type: "text",
          className: "input",
          value: step.config.separator,
          onChange: function(e) {
            return updateStepConfig(step.id, "separator", e.target.value);
          },
          placeholder: "\u5982 - \u6216 /",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u5C06\u591A\u4E2A\u5B57\u6BB5\u6570\u636E\u62FC\u63A5\u6210\u5355\u4E2A\u6587\u672C",
      ),
    );
  };

  var renderSubstringStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var colOpts = ctx.colOpts;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "源字段"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: colOpts,
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
            "\u8D77\u59CB\u4F4D\u7F6E",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "number",
            className: "input",
            value: step.config.start,
            onChange: function(e) {
              return updateStepConfig(step.id, "start", Number(e.target.value));
            },
            min: 0,
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u957F\u5EA6",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "number",
            className: "input",
            value: step.config.length,
            onChange: function(e) {
              return updateStepConfig(step.id, "length", Number(e.target.value));
            },
            min: 1,
          }),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u4ECEText\u5B57\u6BB5\u4E2D\u63D0\u53D6\u6307\u5B9A\u90E8\u5206",
      ),
    );
  };

  var renderDateStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var colOpts = ctx.colOpts;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "日期字段"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: colOpts,
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "操作类型"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.operation || "format",
          onChange: function(val) { return updateStepConfig(step.id, "operation", val); },
          options: [
            { value: "format", label: "格式化日期" },
            { value: "extractYear", label: "提取年份" },
            { value: "extractMonth", label: "提取月份" },
            { value: "extractDay", label: "提取日" },
            { value: "addDays", label: "加减天数" },
          ],
          placeholder: "请选择操作",
        }),
      ),
      step.config.operation === "format" && /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "格式模板"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.format || "yyyy-mm-dd",
          onChange: function(val) { return updateStepConfig(step.id, "format", val); },
          options: [
            { value: "yyyy-mm-dd", label: "2024-01-15" },
            { value: "yyyy/mm/dd", label: "2024/01/15" },
            { value: "yyyy年mm月dd日", label: "2024年01月15日" },
            { value: "yyyy-mm", label: "2024-01" },
            { value: "mm-dd", label: "01-15" },
          ],
          placeholder: "请选择格式",
        }),
      ),
      step.config.operation === "addDays" && /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "\u5929\u6570",
        ),
        /*#__PURE__*/ React.createElement("input", {
          type: "number",
          className: "input",
          value: step.config.days || 0,
          onChange: function(e) {
            return updateStepConfig(step.id, "days", Number(e.target.value));
          },
          placeholder: "\u6B63\u6570\u52A0\u51CF\uFF0C\u8D1F\u6570\u51CF\u5C11",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u65E5\u671F\u6570\u636E\u7684\u683C\u5F0F\u5316\u548C\u7EC4\u4EF6\u63D0\u53D6",
      ),
    );
  };

  var renderMathStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var colOpts = ctx.colOpts;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "输入列"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: colOpts,
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "运算符"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.operation || "+",
            onChange: function(val) { return updateStepConfig(step.id, "operation", val); },
            options: [
              { value: "+", label: "+" },
              { value: "-", label: "-" },
              { value: "*", label: "×" },
              { value: "/", label: "÷" },
              { value: "^", label: "幂次方" },
              { value: "%", label: "余数" },
            ],
            placeholder: "请选择运算符",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "数值"),
          /*#__PURE__*/ React.createElement("input", {
            type: "number",
            className: "input",
            value: step.config.value,
            onChange: function(e) {
              return updateStepConfig(step.id, "value", Number(e.target.value));
            },
          }),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u5BF9\u6570\u503C\u8FDB\u884C\u7B80\u5355\u6570\u5B66\u8FD0\u7B97",
      ),
    );
  };

  var renderRankStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var colOpts = ctx.colOpts;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "排名列"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: colOpts,
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "排名方向"),
        /*#__PURE__*/ React.createElement(SearchableSelect, {
          value: step.config.direction || "desc",
          onChange: function(val) { return updateStepConfig(step.id, "direction", val); },
          options: [
            { value: "desc", label: "降序 (最大为1)" },
            { value: "asc", label: "升序 (最小为1)" },
          ],
          placeholder: "请选择排序方向",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u6839\u636E\u6307\u5B9A\u5217\u8FDB\u884C\u6392\u540D\uFF0C\u8FD4\u56DE\u6392\u540D\u7ED3\u679C",
      ),
    );
  };

  var renderDiffStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var colOpts = ctx.colOpts;
    var colOptsNoVal = ctx.colOptsNoVal;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "当前列"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: colOpts,
            placeholder: "请选择列",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "基准列"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.baseColumn || "",
            onChange: function(val) { return updateStepConfig(step.id, "baseColumn", val); },
            options: [{ value: "", label: "请选择基准列" }].concat(colOptsNoVal),
            placeholder: "请选择基准列",
          }),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "checkbox-label" },
          /*#__PURE__*/ React.createElement("input", {
            type: "checkbox",
            checked: step.config.percent,
            onChange: function(e) {
              return updateStepConfig(step.id, "percent", e.target.checked);
            },
          }),
          " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u8BA1\u7B97\u5F53\u524D\u503C\u4E0E\u57FA\u51C6\u503C\u7684\u5DEE\u503C",
      ),
    );
  };

  var renderRatioStep = /*#__PURE__*/ function(step, ctx) {
    var SearchableSelect = ctx.SearchableSelect;
    var Icons = ctx.Icons;
    var updateStepConfig = ctx.updateStepConfig;
    var colOpts = ctx.colOpts;
    var colOptsNoVal = ctx.colOptsNoVal;
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "分子"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.numerator || "",
            onChange: function(val) { return updateStepConfig(step.id, "numerator", val); },
            options: colOpts,
            placeholder: "请选择分子列",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "分母"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.denominator || "",
            onChange: function(val) { return updateStepConfig(step.id, "denominator", val); },
            options: [{ value: "", label: "请选择分母列" }].concat(colOptsNoVal),
            placeholder: "请选择分母列",
          }),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "checkbox-label" },
          /*#__PURE__*/ React.createElement("input", {
            type: "checkbox",
            checked: step.config.percent,
            onChange: function(e) {
              return updateStepConfig(step.id, "percent", e.target.checked);
            },
          }),
          " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " \u8BA1\u7B97\u5206\u5B50\u4E0E\u5206\u6BCD\u7684\u6BD4\u7387",
      ),
    );
  };

  window.RuleSteps = window.RuleSteps || {};
  window.RuleSteps.formatSteps = {
    renderRoundStep: renderRoundStep,
    renderConcatStep: renderConcatStep,
    renderSubstringStep: renderSubstringStep,
    renderDateStep: renderDateStep,
    renderMathStep: renderMathStep,
    renderRankStep: renderRankStep,
    renderDiffStep: renderDiffStep,
    renderRatioStep: renderRatioStep,
  };
})();
