(function() {
  var e = React.createElement;

  var renderJoinStep = /*#__PURE__*/ function(step, ctx) {
    var allTables = ctx.allTables;
    var sampleTables = ctx.sampleTables;
    var externalTables = ctx.externalTables;
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var platform = ctx.platform;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    var joinTable = allTables.find(function(t) { return t.id === step.config.table; });
    var joinHeaders = joinTable?.headers || [];
    var isExternal = joinTable?.isExternal || false;
    var shopName = platform?.shops?.[0]?.name || "";
    var autoMatchedExt = shopName ? externalTables.find(function(t) { return t.name === shopName || t.sheetKey === shopName; }) : null;
    var joinTableOptions = [
      ...sampleTables.map(function(t) { return { value: t.id, label: t.name, group: "样表数据" }; }),
      ...externalTables.map(function(t) { return { value: t.id, label: t.name, group: "全局数据表" }; })
    ];
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
            /*#__PURE__*/ e(Icons.Join, null),
            " 关联表设置"
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "关联数据表",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              isExternal ? "全局数据表" : "选择要关联的数据表"
            )
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.table || "",
            onChange: function(val) {
              var tbl = allTables.find(function(t) { return t.id === val; });
              updateStepConfig(step.id, "table", val);
              updateStepConfig(step.id, "externalId", tbl?.externalId || "");
              updateStepConfig(step.id, "fk", "");
              updateStepConfig(step.id, "col", "");
            },
            options: joinTableOptions,
            placeholder: "请选择数据表",
            groupBy: "group",
          }),
          autoMatchedExt && !step.config.table && /*#__PURE__*/ e(
            "div",
            {
              style: { marginTop: "8px", padding: "8px 12px", background: "var(--color-primary-50)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
              onClick: function() {
                updateStepConfig(step.id, "table", autoMatchedExt.id);
                updateStepConfig(step.id, "externalId", autoMatchedExt.externalId || "");
              },
            },
            /*#__PURE__*/ e(Icons.Lightbulb, { size: 14 }),
            "检测到店铺\"" + shopName + "\"匹配全局表\"" + autoMatchedExt.name + "\"，点击自动关联",
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
              "主表关联键",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "主表匹配字段"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.key || "",
              onChange: function(val) { return updateStepConfig(step.id, "key", val); },
              options: sourceTableHeaders.map(function(h) { return { value: h, label: h }; }),
              placeholder: "请选择字段",
            })
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "关联表外键",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "关联表匹配字段"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.fk || "",
              onChange: function(val) { return updateStepConfig(step.id, "fk", val); },
              options: joinHeaders.map(function(h) { return { value: h, label: h }; }),
              placeholder: step.config.table ? "请选择字段" : "先选择关联表",
              disabled: !step.config.table,
            })
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "取关联表列",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              "要获取的数据列"
            )
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.col || "",
            onChange: function(val) { return updateStepConfig(step.id, "col", val); },
            options: joinHeaders.map(function(h) { return { value: h, label: h }; }),
            placeholder: step.config.table ? "请选择字段" : "先选择关联表",
            disabled: !step.config.table,
          })
        )
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-checkbox-label" },
          /*#__PURE__*/ e("input", {
            type: "checkbox",
            checked: step.config.parseSizeCost || false,
            onChange: function(x) { return updateStepConfig(step.id, "parseSizeCost", x.target.checked); },
          }),
          "启用智能成本解析",
          /*#__PURE__*/ e(
            "span",
            { className: "form-label-hint" },
            "自动识别平台，支持平台+尺码组合成本（如拼多多m3.5l4淘宝5），找不到对应尺码时以L码为准"
          )
        )
      ),
      step.config.parseSizeCost && /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "规格/尺码字段",
          /*#__PURE__*/ e(
            "span",
            { className: "form-label-hint" },
            "主表中包含商品规格或尺码的字段"
          )
        ),
        /*#__PURE__*/ e(SearchableSelect, {
          value: step.config.sizeField || "",
          onChange: function(val) { return updateStepConfig(step.id, "sizeField", val); },
          options: sourceTableHeaders.map(function(h) { return { value: h, label: h }; }),
          placeholder: "请选择规格/尺码字段",
        })
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 💡 根据主表关联键从关联表中匹配数据，将关联表中指定列的值填充到当前字段。",
      )
    );
  };

  var renderDistinctStep = /*#__PURE__*/ function(step, ctx) {
    var columnOptionsWithVal = ctx.columnOptionsWithVal;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

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
            /*#__PURE__*/ e(Icons.Filter, null),
            " 去重设置"
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "去重列",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              "按此列去重"
            )
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: columnOptionsWithVal,
            placeholder: "请选择列",
            groupBy: "group",
          })
        )
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        ' 💡 去除指定列的重复值，保留第一次出现的行。选择"当前值"时使用上一步输出的val字段。',
      ),
    );
  };

  var renderConditionStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    var conditionOpOptions = [
      { value: "==", label: "等于", group: "比较" },
      { value: "!=", label: "不等于", group: "比较" },
      { value: ">", label: "大于", group: "比较" },
      { value: "<", label: "小于", group: "比较" },
      { value: ">=", label: "大于等于", group: "比较" },
      { value: "<=", label: "小于等于", group: "比较" },
      { value: "contains", label: "包含", group: "文本" },
    ];
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
            /*#__PURE__*/ e(Icons.Condition, null),
            " 条件判断设置"
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
              "判断列",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "要判断的字段"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.column || "val",
              onChange: function(val) { return updateStepConfig(step.id, "column", val); },
              options: [
                { value: "val", label: "当前值 (val)", group: "上一步结果" },
                ...sourceTableHeaders.map(function(h) { return { value: h, label: h, group: "数据列" }; })
              ],
              placeholder: "请选择列",
              groupBy: "group",
            })
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "操作符",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "判断条件"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.op || "==",
              onChange: function(val) { return updateStepConfig(step.id, "op", val); },
              options: conditionOpOptions,
              placeholder: "请选择条件",
              groupBy: "group",
            })
          )
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "对比值",
            /*#__PURE__*/ e(
              "span",
              { className: "form-label-hint" },
              "与判断列比较的值"
            )
          ),
          /*#__PURE__*/ e("input", {
            type: "text",
            className: "input",
            value: step.config.value,
            onChange: function(x) {
              return updateStepConfig(step.id, "value", x.target.value);
            },
            placeholder: "输入对比值",
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
              "满足条件的值",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "条件成立时返回"
              )
            ),
            /*#__PURE__*/ e("input", {
              type: "text",
              className: "input",
              value: step.config.trueValue,
              onChange: function(x) {
                return updateStepConfig(step.id, "trueValue", x.target.value);
              },
              placeholder: "默认 1",
            })
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ e(
              "label",
              { className: "form-label" },
              "不满足的值",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "条件不成立时返回"
              )
            ),
            /*#__PURE__*/ e("input", {
              type: "text",
              className: "input",
              value: step.config.falseValue,
              onChange: function(x) {
                return updateStepConfig(step.id, "falseValue", x.target.value);
              },
              placeholder: "默认 0",
            })
          )
        )
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 💡 根据条件返回不同的值，不丢弃数据。例如：如果\"销量大于100\"返回1，否则返回0。",
      ),
    );
  };

  var renderGroupStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var columnOptionsWithVal = ctx.columnOptionsWithVal;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    var groupFuncOptions = [
      { value: "sum", label: "求和 (SUM)", group: "基础统计" },
      { value: "avg", label: "平均值 (AVG)", group: "基础统计" },
      { value: "count", label: "计数 (COUNT)", group: "基础统计" },
      { value: "max", label: "最大值 (MAX)", group: "基础统计" },
      { value: "min", label: "最小值 (MIN)", group: "基础统计" },
      { value: "countDistinct", label: "去重计数", group: "高级" },
      { value: "median", label: "中位数", group: "高级" },
    ];
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
            /*#__PURE__*/ e(Icons.Group, null),
            " 分组聚合设置"
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
              "分组列",
              /*#__PURE__*/ e(
                "span",
                { className: "form-label-hint" },
                "按此列分组"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.column || "",
              onChange: function(val) { return updateStepConfig(step.id, "column", val); },
              options: sourceTableHeaders.map(function(h) { return { value: h, label: h }; }),
              placeholder: "请选择分组列",
            })
          ),
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
                "要聚合的数值"
              )
            ),
            /*#__PURE__*/ e(SearchableSelect, {
              value: step.config.aggColumn || "",
              onChange: function(val) { return updateStepConfig(step.id, "aggColumn", val); },
              options: columnOptionsWithVal,
              placeholder: "请选择列",
              groupBy: "group",
            })
          )
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
              "计算方式"
            )
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.func || "sum",
            onChange: function(val) { return updateStepConfig(step.id, "func", val); },
            options: groupFuncOptions,
            placeholder: "请选择函数",
            groupBy: "group",
          })
        )
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 💡 按指定列分组后对另一列进行聚合计算，返回分组后的结果集。",
      ),
    );
  };

  var renderConstantStep = /*#__PURE__*/ function(step, ctx) {
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "常量值",
        ),
        /*#__PURE__*/ e("input", {
          type: "text",
          className: "input",
          value: step.config.value,
          onChange: function(x) {
            return updateStepConfig(step.id, "value", x.target.value);
          },
          placeholder: "输入固定值，如 0 或 未匹配",
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 输出一个固定常量值，可用于默认值或占位",
      ),
    );
  };

  var renderTextStep = /*#__PURE__*/ function(step, ctx) {
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "文本模板",
        ),
        /*#__PURE__*/ e("textarea", {
          className: "textarea",
          value: step.config.value,
          onChange: function(x) {
            return updateStepConfig(step.id, "value", x.target.value);
          },
          placeholder: "支持 {val}、{shopName} 等变量替换",
          rows: 3,
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 对文本进行变量替换，可引用上一步结果 {val} 和上下文变量",
      ),
    );
  };

  var renderRunningTotalStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "累计列",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
            placeholder: "请选择列",
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
            value: step.config.orderColumn || "",
            onChange: function(val) { return updateStepConfig(step.id, "orderColumn", val); },
            options: [{ value: "", label: "保持原顺序" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
            placeholder: "选择排序列",
          }),
        ),
      ),
      step.config.orderColumn && /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "排序方式",
        ),
        /*#__PURE__*/ e(SearchableSelect, {
          value: step.config.direction || "asc",
          onChange: function(val) { return updateStepConfig(step.id, "direction", val); },
          options: [
            { value: "asc", label: "升序（从小到大）" },
            { value: "desc", label: "降序（从大到小）" },
          ],
          placeholder: "选择排序方式",
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 按行顺序计算累计值，可选按某列排序后累计。",
      ),
    );
  };

  var renderPercentOfTotalStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "计算列",
        ),
        /*#__PURE__*/ e(SearchableSelect, {
          value: step.config.column || "",
          onChange: function(val) { return updateStepConfig(step.id, "column", val); },
          options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
          placeholder: "请选择列",
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "checkbox-label" },
          /*#__PURE__*/ e("input", {
            type: "checkbox",
            checked: step.config.asPercent !== false,
            onChange: function(x) { return updateStepConfig(step.id, "asPercent", x.target.checked); },
          }),
          " 显示为百分比",
        ),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 计算每行值占总和的比例，可选转为百分比。",
      ),
    );
  };

  var renderMovingAverageStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "计算列",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
            placeholder: "请选择列",
          }),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "窗口大小",
          ),
          /*#__PURE__*/ e("input", {
            type: "number",
            className: "input",
            value: step.config.windowSize || 3,
            onChange: function(x) { return updateStepConfig(step.id, "windowSize", parseInt(x.target.value) || 3); },
            min: 1,
            max: 100,
          }),
        ),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "输出列名",
        ),
        /*#__PURE__*/ e("input", {
          type: "text",
          className: "input",
          value: step.config.targetColumn || "moving_avg",
          onChange: function(x) { return updateStepConfig(step.id, "targetColumn", x.target.value); },
          placeholder: "moving_avg",
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 按窗口大小计算滚动移动平均值，窗口大小表示参考的前 N 行数据。",
      ),
    );
  };

  var renderFillNAStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "处理列",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
            placeholder: "请选择列",
          }),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "处理方式",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.fillType || "value",
            onChange: function(val) { return updateStepConfig(step.id, "fillType", val); },
            options: [
              { value: "value", label: "指定值" },
              { value: "zero", label: "用零处理" },
              { value: "empty", label: "用空字符串处理" },
              { value: "mean", label: "用平均值处理" },
              { value: "median", label: "用中位数处理" },
              { value: "mode", label: "用众数处理" },
              { value: "forward", label: "前向处理" },
              { value: "backward", label: "后向处理" },
            ],
            placeholder: "请选择处理方式",
          }),
        ),
      ),
      step.config.fillType === "value" && /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "处理值",
        ),
        /*#__PURE__*/ e("input", {
          type: "text",
          className: "input",
          value: step.config.fillValue || "",
          onChange: function(x) { return updateStepConfig(step.id, "fillValue", x.target.value); },
          placeholder: "请输入处理值",
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 对空值（null、空字符串、NaN）进行处理，可指定常量或使用统计方式处理。",
      ),
    );
  };

  var renderNormalizeStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

    return /*#__PURE__*/ e(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ e(
        "div",
        { className: "grid-2" },
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "标准化列",
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
            placeholder: "请选择列",
          }),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "输出列名",
          ),
          /*#__PURE__*/ e("input", {
            type: "text",
            className: "input",
            value: step.config.targetColumn || "normalized",
            onChange: function(x) { return updateStepConfig(step.id, "targetColumn", x.target.value); },
            placeholder: "normalized",
          }),
        ),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "label",
          { className: "form-label" },
          "标准化方式",
        ),
        /*#__PURE__*/ e(SearchableSelect, {
          value: step.config.normType || "minmax",
          onChange: function(val) { return updateStepConfig(step.id, "normType", val); },
          options: [
            { value: "minmax", label: "最小-最大标准化 (Min-Max)" },
            { value: "zscore", label: "Z-score 标准化" },
            { value: "decimal", label: "小数定标标准化" },
          ],
          placeholder: "请选择标准化方式",
        }),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 对数据进行标准化，结果为 0-1 之间的数据，用于不同单位数据的对比。",
      ),
    );
  };

  var renderValueNormalizeStep = /*#__PURE__*/ function(step, ctx) {
    var sourceTableHeaders = ctx.sourceTableHeaders;
    var updateStepConfig = ctx.updateStepConfig;
    var Icons = ctx.Icons;
    var SearchableSelect = ctx.SearchableSelect;

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
          "复杂运算步骤 - 列值转换配置"
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "step-info-content" },
          "此步骤用于将列值转换为可计算的数字。配置方法：",
          /*#__PURE__*/ e("br", null),
          "1. 选择源字段（要转换的列）",
          /*#__PURE__*/ e("br", null),
          "2. 添加多条转换规则，按优先级匹配",
          /*#__PURE__*/ e("br", null),
          "3. 常见模式：「100元」→「100」/「5条」→「5」/「50%」→「0.5」/「三」→「3」"
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
          ),
          /*#__PURE__*/ e(SearchableSelect, {
            value: step.config.column || "",
            onChange: function(val) { return updateStepConfig(step.id, "column", val); },
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map(function(h) { return { value: h, label: h }; })],
            placeholder: "请选择需要规范化的字段",
          }),
        ),
        /*#__PURE__*/ e(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ e(
            "label",
            { className: "form-label" },
            "输出列名",
          ),
          /*#__PURE__*/ e("input", {
            type: "text",
            className: "input",
            value: step.config.targetColumn || "normalized_value",
            onChange: function(x) { return updateStepConfig(step.id, "targetColumn", x.target.value); },
            placeholder: "normalized_value",
          }),
        ),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ e(
          "div",
          { className: "filter-header-bar" },
          /*#__PURE__*/ e(
            "div",
            { className: "filter-header-title" },
            /*#__PURE__*/ e("span", { className: "filter-header-icon" }, "📋"),
            "转换规则列表",
          ),
          /*#__PURE__*/ e(
            "span",
            { className: "filter-header-count" },
            (step.config.rules || []).length + " 条规则",
          ),
        ),
        (step.config.rules || []).map(function(rule, idx) { return /*#__PURE__*/ e(
          "div",
          {
            key: idx,
            className: "step-info-box",
            style: { marginBottom: 10 },
          },
          /*#__PURE__*/ e(
            "div",
            { className: "step-info-content" },
            /*#__PURE__*/ e(
              "div",
              { className: "grid-2" },
              /*#__PURE__*/ e(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ e(
                  "label",
                  { className: "form-label" },
                  "匹配方式",
                ),
                /*#__PURE__*/ e(SearchableSelect, {
                  value: rule.matchType || "regex",
                  onChange: function(val) {
                    var rules = [...(step.config.rules || [])];
                    rules[idx] = { ...rules[idx], matchType: val };
                    updateStepConfig(step.id, "rules", rules);
                  },
                  options: [
                    { value: "regex", label: "正则匹配" },
                    { value: "contains", label: "包含文本" },
                    { value: "equals", label: "完全相等" },
                    { value: "prefix", label: "前缀匹配" },
                    { value: "suffix", label: "后缀匹配" },
                    { value: "chineseNumber", label: "中文数字" },
                    { value: "percent", label: "百分比格式" },
                    { value: "currency", label: "货币格式" },
                    { value: "auto", label: "自动识别" },
                  ],
                  placeholder: "请选择匹配方式",
                }),
              ),
              /*#__PURE__*/ e(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ e(
                  "label",
                  { className: "form-label" },
                  "匹配模式",
                ),
                /*#__PURE__*/ e("input", {
                  type: "text",
                  className: "input",
                  value: rule.pattern || "",
                  onChange: function(x) {
                    var rules = [...(step.config.rules || [])];
                    rules[idx] = { ...rules[idx], pattern: x.target.value };
                    updateStepConfig(step.id, "rules", rules);
                  },
                  placeholder: rule.matchType === "regex" ? "\\d+\\.?\\d*" : rule.matchType === "chineseNumber" ? "" : "输入匹配内容",
                  disabled: ["chineseNumber", "percent", "currency", "auto"].includes(rule.matchType),
                }),
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
                  "转换方式",
                ),
                /*#__PURE__*/ e(SearchableSelect, {
                  value: rule.convertType || "extractNumber",
                  onChange: function(val) {
                    var rules = [...(step.config.rules || [])];
                    rules[idx] = { ...rules[idx], convertType: val };
                    updateStepConfig(step.id, "rules", rules);
                  },
                  options: [
                    { value: "extractNumber", label: "提取数字" },
                    { value: "multiply", label: "乘以系数" },
                    { value: "divide", label: "除以系数" },
                    { value: "mapTo", label: "映射为固定值" },
                    { value: "chineseToNumber", label: "中文转数字" },
                    { value: "percentToNumber", label: "百分比转数字" },
                    { value: "currencyToNumber", label: "货币转数字" },
                  ],
                  placeholder: "请选择转换方式",
                }),
              ),
              /*#__PURE__*/ e(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ e(
                  "label",
                  { className: "form-label" },
                  "转换参数",
                ),
                /*#__PURE__*/ e("input", {
                  type: "text",
                  className: "input",
                  value: rule.convertParam || "",
                  onChange: function(x) {
                    var rules = [...(step.config.rules || [])];
                    rules[idx] = { ...rules[idx], convertParam: x.target.value };
                    updateStepConfig(step.id, "rules", rules);
                  },
                  placeholder: rule.convertType === "multiply" || rule.convertType === "divide" ? "输入系数" : rule.convertType === "mapTo" ? "输入目标值" : "",
                  disabled: ["extractNumber", "chineseToNumber", "percentToNumber", "currencyToNumber"].includes(rule.convertType),
                }),
              ),
            ),
            /*#__PURE__*/ e(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ e(
                "label",
                { className: "form-label" },
                "示例",
              ),
              /*#__PURE__*/ e("input", {
                type: "text",
                className: "input",
                value: rule.example || "",
                onChange: function(x) {
                  var rules = [...(step.config.rules || [])];
                  rules[idx] = { ...rules[idx], example: x.target.value };
                  updateStepConfig(step.id, "rules", rules);
                },
                placeholder: "输入示例（如：100元 → 100）",
              }),
            ),
          ),
          /*#__PURE__*/ e(
            "div",
            { className: "step-info-tip" },
            /*#__PURE__*/ e(
              "button",
              {
                className: "btn btn-sm",
                onClick: function() {
                  var rules = [...(step.config.rules || [])];
                  rules.splice(idx, 1);
                  updateStepConfig(step.id, "rules", rules);
                },
                style: { marginLeft: "auto", marginTop: 8 },
              },
              "删除规则",
            ),
          ),
        ); }),
        /*#__PURE__*/ e(
          "button",
          {
            className: "btn btn-primary",
            onClick: function() {
              var rules = [...(step.config.rules || [])];
              rules.push({
                matchType: "auto",
                pattern: "",
                convertType: "extractNumber",
                convertParam: "",
                example: "",
              });
              updateStepConfig(step.id, "rules", rules);
            },
            style: { marginTop: 10, marginBottom: 10 },
          },
          "添加规则",
        ),
      ),
      /*#__PURE__*/ e(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ e(Icons.Info, null),
        " 支持多种格式的值转换，如中文数字、成本格式、百分比。规则按顺序匹配，遇到匹配后就使用对应转换方式，不再匹配后续规则。",
      ),
    );
  };

  window.RuleSteps = window.RuleSteps || {};
  window.RuleSteps.transformSteps2 = {
    renderJoinStep: renderJoinStep,
    renderDistinctStep: renderDistinctStep,
    renderConditionStep: renderConditionStep,
    renderGroupStep: renderGroupStep,
    renderConstantStep: renderConstantStep,
    renderTextStep: renderTextStep,
    renderRunningTotalStep: renderRunningTotalStep,
    renderPercentOfTotalStep: renderPercentOfTotalStep,
    renderMovingAverageStep: renderMovingAverageStep,
    renderFillNAStep: renderFillNAStep,
    renderNormalizeStep: renderNormalizeStep,
    renderValueNormalizeStep: renderValueNormalizeStep,
  };
})();
