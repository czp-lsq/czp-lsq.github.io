(function() {
  var renderSourceStep = /*#__PURE__*/ function(step, ctx) {
    const selectedTables = step.config.tables || [];
    const firstSelectedTableHeaders = selectedTables.length > 0
      ? ctx.allTables.find((t) => t.id === selectedTables[0])?.headers || []
      : [];
    const tableOpts = [
      { value: "", label: "请选择数据表", group: "" },
      ...ctx.sampleTables.map((t) => ({ value: t.id, label: t.name, group: "样表数据" })),
      ...ctx.externalTables.map((t) => ({ value: t.id, label: t.name, group: "外部数据" })),
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
            /*#__PURE__*/ React.createElement(ctx.Icons.Database, null),
            " 数据源配置"
          ),
          selectedTables.length > 0 && /*#__PURE__*/ React.createElement(
            "span",
            { className: "config-section-badge" },
            `已选 ${selectedTables.length} 个表`
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "主数据表",
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "form-label-hint" },
              "选择要计算的数据来源（显示为备注名称）"
            )
          ),
          /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
            value: step.config.table || "",
            onChange: (val) => {
              ctx.updateStepConfig(step.id, "table", val);
              ctx.updateStepConfig(step.id, "tables", val ? [val] : []);
              ctx.updateStepConfig(step.id, "column", "");
            },
            options: tableOpts,
            placeholder: "请选择数据表",
            groupBy: "group",
          })
        ),
        step.config.table && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "附加数据表（可选）",
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "form-label-hint" },
              "多表将自动合并，主表列优先"
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "table-select-grid" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "table-select-items table-select-items-grid" },
              ctx.allTables.filter((t) => t.id !== step.config.table).map((t) =>
                /*#__PURE__*/ React.createElement(
                  "label",
                  {
                    key: t.id,
                    className: `table-select-item ${selectedTables.includes(t.id) ? "selected" : ""}`
                  },
                  /*#__PURE__*/ React.createElement("input", {
                    type: "checkbox",
                    checked: selectedTables.includes(t.id),
                    onChange: (e) => {
                      const newTables = e.target.checked
                        ? [...selectedTables, t.id]
                        : selectedTables.filter((id) => id !== t.id);
                      ctx.updateStepConfig(step.id, "tables", [step.config.table, ...newTables.filter((id) => id !== step.config.table)]);
                    },
                  }),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "table-select-item-info" },
                    /*#__PURE__*/ React.createElement(
                      "span",
                      { className: "table-select-item-name" },
                      t.name
                    )
                  )
                )
              )
            )
          )
        )
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "config-section" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "config-section-header" },
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "config-section-title" },
            /*#__PURE__*/ React.createElement(ctx.Icons.Column, null),
            " 列选择（可选）"
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "筛选列",
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "form-label-hint" },
              "不选则获取全部列"
            )
          ),
          /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => ctx.updateStepConfig(step.id, "column", val),
            options: [
              { value: "", label: "全部列" },
              ...firstSelectedTableHeaders.map((h) => ({ value: h, label: h }))
            ],
            placeholder: selectedTables.length > 0 ? "选择列" : "请先选择数据表",
            disabled: selectedTables.length === 0,
          })
        )
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(ctx.Icons.Info, null),
        /*#__PURE__*/ React.createElement("span", null, "选择主数据表后，可勾选附加表合并数据；选择列后仅获取该列，不选则获取全部列。"),
      ),
    );
  };

  var renderFillStep = /*#__PURE__*/ function(step, ctx) {
    const currentField = ctx.currentFieldRef || {};
    const detectedType = currentField.semanticType || "auto";
    const detectedDate = (() => {
      for (const s of ctx.samples) {
        const d = ctx.CalcEngine.extractDateFromFileName(s.fileName);
        if (d) return d;
      }
      return null;
    })();
    const nowDate = new Date();
    const formatDetectedDate = (d) => {
      if (!d) return "未识别到日期";
      const m = String(d.month).padStart(2, "0");
      const day = d.day ? String(d.day).padStart(2, "0") : null;
      return day ? `${d.year}年${m}月${day}日` : `${d.year}年${m}月`;
    };
    const formatNowDate = () => {
      const y = nowDate.getFullYear();
      const m = String(nowDate.getMonth() + 1).padStart(2, "0");
      const d = String(nowDate.getDate()).padStart(2, "0");
      return `${y}年${m}月${d}日`;
    };
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
    const quickFillTypes = ["shop", "date", "dateNow"];
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
            /*#__PURE__*/ React.createElement(ctx.Icons.Fill, null),
            " 基本设置"
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "填充方式",
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "form-label-hint" },
              "选择数据填充来源"
            )
          ),
          /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
            value: step.config.fillType,
            onChange: (val) => ctx.updateStepConfig(step.id, "fillType", val),
            options: fillTypeOptions,
            placeholder: "请选择填充方式",
            groupBy: "group",
          }),
          quickFillTypes.length > 0 && /*#__PURE__*/ React.createElement(
            "div",
            { className: "quick-tags" },
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "quick-tags-label" },
              "常用："
            ),
            quickFillTypes.map((ft) =>
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  key: ft,
                  className: `quick-tag ${step.config.fillType === ft ? "active" : ""}`,
                  onClick: () => ctx.updateStepConfig(step.id, "fillType", ft),
                },
                fillTypeOptions.find((o) => o.value === ft)?.label.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "").slice(0, 4)
              )
            )
          )
        )
      ),
      step.config.fillType === "auto" &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-info-box" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-title" },
            /*#__PURE__*/ React.createElement(ctx.Icons.Sparkles, null),
            /*#__PURE__*/ React.createElement(
              "span",
              null,
              "自动填充规则",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-content" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-row" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "step-info-label" },
                "当前字段类型：",
              ),
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "step-info-value" },
                detectedType === "shop" && "🏪 店铺名占位符",
                detectedType === "year" && "📅 年份占位符",
                detectedType === "month" && "📅 月份占位符",
                detectedType === "day" && "📅 日期占位符",
                detectedType === "date" && "📅 日期占位符",
                detectedType === "text" && "📝 文本占位符",
                detectedType === "value" && "💰 数值占位符",
                ![
                  "shop",
                  "year",
                  "month",
                  "day",
                  "date",
                  "text",
                  "value",
                ].includes(detectedType) &&
                  "❓ 未知类型（请手动选择填充方式）",
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-row" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "step-info-label" },
                "系统将自动：",
              ),
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "step-info-value" },
                detectedType === "shop" && "填充当前店铺名称",
                (detectedType === "year" ||
                  detectedType === "month" ||
                  detectedType === "day" ||
                  detectedType === "date") &&
                  "填充当前处理日期",
                detectedType === "text" && "从数据表中提取文本值",
                !["shop", "year", "month", "day", "date", "text"].includes(
                  detectedType,
                ) && "需手动选择填充方式",
              ),
            ),
          ),
        ),
      step.config.fillType === "shop" &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-info-box" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-title" },
            /*#__PURE__*/ React.createElement(ctx.Icons.Store, null),
            /*#__PURE__*/ React.createElement(
              "span",
              null,
              "店铺名称来源",
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-content" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-row" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "step-info-label" },
                "填充值：",
              ),
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "step-info-value highlight" },
                "自动使用当前处理的店铺名称（从上传文件名中识别）",
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-tip" },
              "💡 批量计算时，系统会自动从每个数据文件中识别对应的店铺名并填充",
            ),
          ),
        ),
      (step.config.fillType === "date" ||
        step.config.fillType === "dateNow") &&
        /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(ctx.Icons.Clock, null),
                step.config.fillType === "date" ? " 数据周期日期设置" : " 系统日期设置"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-preview-box" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-preview-row" },
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "step-preview-label" },
                  "预览填充值："
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "step-preview-value highlight" },
                  step.config.fillType === "date"
                    ? formatDetectedDate(detectedDate)
                    : formatNowDate()
                )
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "日期格式",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择输出格式"
                )
              ),
              /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
                value: step.config.dateFormat || "yyyy-mm-dd",
                onChange: (val) => ctx.updateStepConfig(step.id, "dateFormat", val),
                options: dateFormatOptions,
                placeholder: "请选择日期格式",
              })
            ),
            step.config.fillType === "date" && /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-tip-box" },
              detectedDate
                ? `💡 已识别数据周期：${formatDetectedDate(detectedDate)}`
                : "💡 未识别到日期，请确保文件名包含日期信息"
            ),
            step.config.fillType === "dateNow" && /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-tip-box" },
              "💡 使用操作系统当前日期"
            )
          ),
        ),
      step.config.fillType === "field" &&
        /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "config-section-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "config-section-title" },
                /*#__PURE__*/ React.createElement(ctx.Icons.Table, null),
                " 数据字段取值设置"
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
                  "数据表",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "选择数据来源"
                  )
                ),
                /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
                  value: step.config.sourceTable || "",
                  onChange: (val) => {
                    ctx.updateStepConfig(step.id, "sourceTable", val);
                    ctx.updateStepConfig(step.id, "sourceField", "");
                  },
                  options: ctx.sampleTables.map((t) => ({
                    value: t.id,
                    label: t.name,
                    group: t.source === "sample" ? "样表数据" : "外部数据"
                  })),
                  placeholder: "请选择数据表",
                  groupBy: "group",
                })
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "取值字段",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "选择填充字段"
                  )
                ),
                /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
                  value: step.config.sourceField || "",
                  onChange: (val) => ctx.updateStepConfig(step.id, "sourceField", val),
                  options: (ctx.sampleTables.find((t) => t.id === step.config.sourceTable)?.headers || []).map((h) => ({
                    value: h,
                    label: h
                  })),
                  placeholder: step.config.sourceTable ? "请选择字段" : "先选择数据表",
                  disabled: !step.config.sourceTable,
                })
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-tip-box" },
              "💡 从指定数据表的指定字段提取值进行填充"
            )
          ),
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(ctx.Icons.Info, null),
        step.config.fillType === "auto"
          ? "🤖 系统将根据字段的占位符类型自动选择最合适的填充方式"
          : step.config.fillType === "shop"
            ? "🏪 自动使用当前处理的店铺名（从文件名识别）"
            : step.config.fillType === "date"
              ? "📅 使用数据周期日期（从文件名/内容识别），按指定格式填充"
              : step.config.fillType === "dateNow"
                ? "📆 使用当前系统日期，按指定格式填充"
                : "📊 从指定数据表的指定字段中提取值进行填充",
      ),
    );
  };

  var renderUnionStep = /*#__PURE__*/ function(step, ctx) {
    const allTableOpts = [{ value: "", label: "请选择数据表" }, ...ctx.allTables.map((t) => ({ value: t.id, label: t.name }))];
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-config" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "form-item" },
        /*#__PURE__*/ React.createElement(
          "label",
          { className: "form-label" },
          "合并数据表",
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          (step.config.tables || []).map((tableId, idx) =>
            /*#__PURE__*/ React.createElement(
              "div",
              { key: idx, style: { display: "flex", gap: 8 } },
              /*#__PURE__*/ React.createElement(ctx.SearchableSelect, {
                value: tableId || "",
                onChange: (val) => {
                  const newTables = [...(step.config.tables || [])];
                  newTables[idx] = val;
                  ctx.updateStepConfig(step.id, "tables", newTables);
                },
                options: allTableOpts,
                placeholder: "请选择数据表",
              }),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn-link danger",
                  onClick: () => {
                    const newTables = (step.config.tables || []).filter(
                      (_, i) => i !== idx,
                    );
                    ctx.updateStepConfig(step.id, "tables", newTables);
                  },
                },
                /*#__PURE__*/ React.createElement(ctx.Icons.Trash, null),
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            ctx.Button,
            {
              size: "sm",
              onClick: () => {
                const newTables = [
                  ...(step.config.tables || []),
                  "",
                ];
                ctx.updateStepConfig(step.id, "tables", newTables);
              },
            },
            /*#__PURE__*/ React.createElement(ctx.Icons.Plus, null),
            " 添加数据表",
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(ctx.Icons.Info, null),
        " 将多个数据表的数据进行合并",
      ),
    );
  };

  window.RuleSteps = window.RuleSteps || {};
  window.RuleSteps.sourceSteps = {
    renderSourceStep: renderSourceStep,
    renderFillStep: renderFillStep,
    renderUnionStep: renderUnionStep,
  };
})();
