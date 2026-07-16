// StepEditor.js - 步骤编辑器组件模块
// 从 rules.js 提取的 MapValueEditor、AdvancedRuleConfig 和 renderStepConfig

(function() {
// MapValueEditor - 映射值编辑器组件
const MapValueEditor = ({ step, updateStepConfig }) => {
  const pairs = step.config.pairs || [{ from: "", to: "" }];
  const updatePairs = (newPairs) => {
    updateStepConfig(step.id, "pairs", newPairs);
  };
  return React.createElement(
    "div",
    { className: "config-section" },
    React.createElement(
      "div",
      { className: "config-section-header" },
      React.createElement(
        "span",
        { className: "config-section-title" },
        React.createElement(Icons.Edit3, null),
        " 映射值配置"
      )
    ),
    React.createElement(
      "div",
      { className: "form-item" },
      pairs.map((pair, idx) =>
        React.createElement(
          "div",
          { key: idx, className: "grid-2", style: { marginBottom: "8px", alignItems: "center" } },
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
          React.createElement(
            "button",
            {
              className: "action-btn action-delete icon-only",
              onClick: () => {
                if (pairs.length <= 1) return;
                const newPairs = pairs.filter((_, i) => i !== idx);
                updatePairs(newPairs);
              },
              title: "删除",
            },
            React.createElement(Icons.Trash, { size: 14 })
          ),
        )
      ),
      React.createElement(
        Button,
        {
          size: "sm",
          onClick: () => updatePairs([...pairs, { from: "", to: "" }]),
        },
        React.createElement(Icons.Plus, { size: 14 }),
        " 添加映射"
      )
    )
  );
};

// AdvancedRuleConfig - 高级规则配置组件
const AdvancedRuleConfig = ({ step, updateStepConfig }) => {
  const rule = step.config.rule;
  const cfg = step.config || {};

  const renderField = (label, hint, inputEl) =>
    React.createElement(
      "div",
      { className: "form-item" },
      React.createElement(
        "label",
        { className: "form-label" },
        label,
        hint && React.createElement("span", { className: "form-label-hint" }, hint)
      ),
      inputEl
    );

  const renderInput = (key, placeholder, type = "text") =>
    React.createElement("input", {
      type: type,
      className: "input",
      placeholder: placeholder,
      value: cfg[key] || "",
      onChange: (e) => updateStepConfig(step.id, key, e.target.value),
    });

  switch (rule) {
    case "substring":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.FileText, null),
            " 截取子串配置"
          )
        ),
        React.createElement(
          "div",
          { className: "grid-2" },
          renderField("起始位置", "从0开始", renderInput("start", "起始位置", "number")),
          renderField("截取长度", "要截取的字符数", renderInput("length", "长度", "number"))
        )
      );
    case "replace":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Edit3, null),
            " 替换配置"
          )
        ),
        React.createElement(
          "div",
          { className: "grid-2" },
          renderField("查找内容", "要替换的文本", renderInput("from", "查找内容")),
          renderField("替换为", "替换后的文本", renderInput("to", "替换为"))
        )
      );
    case "concat":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Link, null),
            " 拼接配置"
          )
        ),
        React.createElement(
          "div",
          { className: "grid-2" },
          renderField("连接符", "如 - 或 /", renderInput("separator", "连接符")),
          renderField("要拼接的字段", "逗号分隔的字段名", renderInput("columns", "字段1,字段2"))
        )
      );
    case "ifEmpty":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.HelpCircle, null),
            " 空值处理配置"
          )
        ),
        renderField("默认值", "当值为空时使用的默认值", renderInput("defaultValue", "默认值"))
      );
    case "multiply":
    case "divide":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Calculator, null),
            " ",
            rule === "multiply" ? "乘数配置" : "除数配置"
          )
        ),
        renderField(rule === "multiply" ? "乘数" : "除数", "数值", renderInput("value", "数值", "number"))
      );
    case "sumFields":
    case "diffFields":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.Calculator, null),
            " ",
            rule === "sumFields" ? "求和字段配置" : "差值字段配置"
          )
        ),
        renderField("字段列表", "逗号分隔的字段名", renderInput("fields", "字段1,字段2,字段3"))
      );
    case "split":
    case "join":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "config-section-header" },
          React.createElement(
            "span",
            { className: "config-section-title" },
            React.createElement(Icons.FileText, null),
            " ",
            rule === "split" ? "拆分分隔符" : "连接符"
          )
        ),
        renderField("分隔符", "如逗号、空格等", renderInput("separator", "分隔符"))
      );
    case "trim":
    case "upperCase":
    case "lowerCase":
    case "toFixed2":
      return React.createElement(
        "div",
        { className: "config-section" },
        React.createElement(
          "div",
          { className: "step-info-box" },
          React.createElement(
            "div",
            { className: "step-info-title" },
            React.createElement(Icons.Info, null),
            " 无需额外配置"
          ),
          React.createElement(
            "div",
            { className: "step-info-content" },
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
    const {
      state,
      currentPlatform,
      currentRule,
      activeField,
      platform,
      updateStepConfig,
      SearchableSelect,
    } = deps;

const renderStepConfig = (step, currentFieldRef) => {
  const samples = state.samples[currentPlatform] || [];
  const sampleTables = samples.map((s, i) => ({
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
    // 添加前面虚拟字段步骤生成的列
    allSteps.filter((s) => s.type === "virtual").forEach((s) => {
      const targets = (s.config.target || "").split(",").map((t) => t.trim()).filter(Boolean);
      targets.forEach((t) => allHeaders.add(t));
    });
    // 添加前面join步骤导入的列
    allSteps.filter((s) => s.type === "join").forEach((s) => {
      const cfg = s.config || {};
      if (cfg.col) allHeaders.add(cfg.col);
      if (cfg.cols && Array.isArray(cfg.cols)) {
        cfg.cols.forEach((c) => allHeaders.add(c));
      }
    });
    return Array.from(allHeaders);
  })();
  const getColumnValues = (columnName, tableId) => {
    if (!columnName) return [];
    const values = new Set();
    const targetTables = tableId
      ? allTables.filter((t) => t.id === tableId)
      : (sourceTableIds.length > 0
        ? allTables.filter((t) => sourceTableIds.includes(t.id))
        : (sourceTableId ? allTables.filter((t) => t.id === sourceTableId) : allTables));
    targetTables.forEach((table) => {
      const rows = table.rows || [];
      rows.forEach((row) => {
        const val = row[columnName];
        if (val !== undefined && val !== null && val !== "") {
          values.add(String(val));
        }
      });
    });
    return Array.from(values).slice(0, 200);
  };
  const getTableHeaders = (tableId) => {
    if (!tableId) return [];
    const t = allTables.find((t) => t.id === tableId);
    if (!t) return [];
    return t.headers || (t.rows && t.rows.length > 0 ? Object.keys(t.rows[0]) : []);
  };
  const colOpts = [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))];
  const colOptsNoVal = sourceTableHeaders.map((h) => ({ value: h, label: h }));
  const allTableOpts = [{ value: "", label: "请选择数据表" }, ...allTables.map((t) => ({ value: t.id, label: t.name }))];
  switch (step.type) {
    case "fill": {
      const currentField = currentFieldRef || {};
      const detectedType = currentField.semanticType || "auto";
      const detectedDate = (() => {
        for (const s of samples) {
          const d = CalcEngine.extractDateFromFileName(s.fileName);
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
              /*#__PURE__*/ React.createElement(Icons.Fill, null),
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
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.fillType,
              onChange: (val) => updateStepConfig(step.id, "fillType", val),
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
                    onClick: () => updateStepConfig(step.id, "fillType", ft),
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
              /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
              /*#__PURE__*/ React.createElement(
                "span",
                null,
                "\u81EA\u52A8\u586B\u5145\u89C4\u5219",
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
                  "\u5F53\u524D\u5B57\u6BB5\u7C7B\u578B\uFF1A",
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
                  "\u7CFB\u7EDF\u5C06\u81EA\u52A8\uFF1A",
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
              /*#__PURE__*/ React.createElement(Icons.Store, null),
              /*#__PURE__*/ React.createElement(
                "span",
                null,
                "\u5E97\u94FA\u540D\u79F0\u6765\u6E90",
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
                  "\u586B\u5145\u503C\uFF1A",
                ),
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "step-info-value highlight" },
                  "\u81EA\u52A8\u4F7F\u7528\u5F53\u524D\u5904\u7406\u7684\u5E97\u94FA\u540D\u79F0\uFF08\u4ECE\u4E0A\u4F20\u6587\u4EF6\u540D\u4E2D\u8BC6\u522B\uFF09",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-info-tip" },
                "\uD83D\uDCA1 \u6279\u91CF\u8BA1\u7B97\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u4ECE\u6BCF\u4E2A\u6570\u636E\u6587\u4EF6\u4E2D\u8BC6\u522B\u5BF9\u5E94\u7684\u5E97\u94FA\u540D\u5E76\u586B\u5145",
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
                  /*#__PURE__*/ React.createElement(Icons.Clock, null),
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
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: step.config.dateFormat || "yyyy-mm-dd",
                  onChange: (val) => updateStepConfig(step.id, "dateFormat", val),
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
                  /*#__PURE__*/ React.createElement(Icons.Table, null),
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
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: step.config.sourceTable || "",
                    onChange: (val) => {
                      updateStepConfig(step.id, "sourceTable", val);
                      updateStepConfig(step.id, "sourceField", "");
                    },
                    options: sampleTables.map((t) => ({
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
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: step.config.sourceField || "",
                    onChange: (val) => updateStepConfig(step.id, "sourceField", val),
                    options: (sampleTables.find((t) => t.id === step.config.sourceTable)?.headers || []).map((h) => ({
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
          /*#__PURE__*/ React.createElement(Icons.Info, null),
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
              /*#__PURE__*/ React.createElement(Icons.Database, null),
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
            /*#__PURE__*/ React.createElement(SearchableSelect, {
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
                allTables.filter((t) => t.id !== step.config.table).map((t) =>
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
                        updateStepConfig(step.id, "tables", [step.config.table, ...newTables.filter((id) => id !== step.config.table)]);
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
              /*#__PURE__*/ React.createElement(Icons.Column, null),
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
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
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
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          /*#__PURE__*/ React.createElement("span", null, "选择主数据表后，可勾选附加表合并数据；选择列后仅获取该列，不选则获取全部列。"),
        ),
      );
    }
    case "filterEqual":
    case "filterContain":
    case "filter":
      const filterValues = getColumnValues(step.config.column);
      const columnOptions = [
        { value: "val", label: "当前值 (val)" },
        ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
      ];
      const opOptions = [
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
      const valueOptions = filterValues.map((v) => ({ value: v, label: v }));
      const isMultiSelectOp = step.config.op === "==" || step.config.op === "!=";
      const selectedValues = isMultiSelectOp
        ? (Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []))
        : (step.config.value ? [step.config.value] : []);
      const toggleValue = (v) => {
        if (isMultiSelectOp) {
          const current = Array.isArray(step.config.values) ? step.config.values : (step.config.value ? [step.config.value] : []);
          const newValues = current.includes(v)
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
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
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
            "筛选条件",
          ),
          filterValues.length > 0 && /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-count" },
            `该列共 ${filterValues.length} 个不同值`,
          ),
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
              "筛选列",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column,
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: columnOptions,
              placeholder: "请选择列",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "条件",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
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
        (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            isMultiSelectOp ? "筛选值（可多选）" : "筛选值",
            filterValues.length > 0 && /*#__PURE__*/ React.createElement(
              "span",
              { style: { color: "var(--color-text-muted)", fontWeight: 400, fontSize: 12, marginLeft: 6 } },
              `（已选 ${selectedValues.length} 项）`,
            ),
          ),
          !isMultiSelectOp && /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.value || "",
            onChange: (val) => updateStepConfig(step.id, "value", val),
            options: valueOptions,
            placeholder: "选择或输入筛选值",
            allowCreate: true,
          }),
        ),
        filterValues.length > 0 && (step.config.op !== "isEmpty" && step.config.op !== "notEmpty") && /*#__PURE__*/ React.createElement(
          "div",
          { className: "filter-quick-select" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-quick-label" },
            isMultiSelectOp ? "快捷选择（可多选）：" : "快捷选择：",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-value-tags" },
            filterValues.slice(0, 15).map((v) =>
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  key: v,
                  className: `filter-value-tag ${selectedValues.includes(v) ? "active" : ""}`,
                  onClick: () => toggleValue(v),
                },
                v,
              ),
            ),
            filterValues.length > 15 && /*#__PURE__*/ React.createElement(
              "span",
              { className: "filter-value-tag filter-value-more" },
              `+${filterValues.length - 15}`,
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 🎯 ",
          /*#__PURE__*/ React.createElement("strong", null, "筛选"),
          isMultiSelectOp
            ? "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。支持同时选择多个值进行匹配。"
            : "：从数据中挑出符合条件的行，不符合条件的行会被隐藏。下拉列表自动识别列中所有值，与Excel筛选体验一致。",
        ),
      );
    case "filterRange":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "filter-header-bar" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-title" },
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "filter-header-icon" },
              "📊",
            ),
            "范围筛选",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-count" },
            "筛选数值在指定范围内的数据",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "筛选列",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column,
            onChange: (val) => updateStepConfig(step.id, "column", val),
            options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
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
              "最小值",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.min ?? "",
              onChange: (e) =>
                updateStepConfig(step.id, "min", e.target.value),
              placeholder: "输入最小值",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "最大值",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.max ?? "",
              onChange: (e) =>
                updateStepConfig(step.id, "max", e.target.value),
              placeholder: "输入最大值",
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 📊 ",
          /*#__PURE__*/ React.createElement("strong", null, "范围筛选"),
          "：筛选出数值在最小值和最大值之间的数据行，两端都包含。",
        ),
      );
    case "topN":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "filter-header-bar" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-title" },
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "filter-header-icon" },
              "🏆",
            ),
            "前N行筛选",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-count" },
            "只保留排名靠前的行",
          ),
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
              "保留行数",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.count ?? 10,
              onChange: (e) =>
                updateStepConfig(step.id, "count", Number(e.target.value)),
              placeholder: "输入行数",
              min: 1,
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "排序列（可选）",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
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
        step.config.column && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "排序方式",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.order || "desc",
            onChange: (val) => updateStepConfig(step.id, "order", val),
            options: [
              { value: "desc", label: "降序（从大到小）" },
              { value: "asc", label: "升序（从小到大）" },
            ],
            placeholder: "选择排序方式",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 🏆 ",
          /*#__PURE__*/ React.createElement("strong", null, "前N行筛选"),
          "：只保留前N条数据，可指定按某列排序后取前N行。",
        ),
      );
    case "aggregate":
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
        { value: "mode", label: "众数", group: "高级统计" },
        { value: "first", label: "第一个值", group: "位置" },
        { value: "last", label: "最后一个值", group: "位置" },
        { value: "sumAbs", label: "绝对值求和", group: "特殊" },
      ];
      const columnOptionsWithVal = [
        { value: "", label: "当前值 (val)", group: "上一步结果" },
        { value: "__expr__", label: "计算表达式", group: "高级" },
        ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
      ];
      const quickAggFuncs = ["sum", "avg", "count", "max", "min"];
      const showExprInput = step.config.column === "__expr__";
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
              /*#__PURE__*/ React.createElement(Icons.Aggregate, null),
              " 聚合设置"
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
                "聚合列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择要聚合的数据或使用计算表达式"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column,
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: columnOptionsWithVal,
                placeholder: "请选择列",
                groupBy: "group",
              }),
              showExprInput && /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item", style: { marginTop: "10px" } },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "计算表达式",
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "form-label-hint" },
                    "先计算每行的值，再聚合。如: {单价} * {数量}"
                  )
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-control" },
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    value: step.config.expr || "",
                    onChange: (e) => updateStepConfig(step.id, "expr", e.target.value),
                    placeholder: "输入计算表达式，如: {单价} * {数量}",
                    className: "form-input",
                    style: { fontFamily: "var(--font-mono)", letterSpacing: "0.5px" },
                  }),
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { style: { marginTop: "10px" } },
                    /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                      /*#__PURE__*/ React.createElement(Icons.Calculator, { size: 12 }),
                      "运算符",
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" } },
                      [" + ", " - ", " * ", " / ", "(", ")"].map((op) => /*#__PURE__*/ React.createElement(
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
                  /*#__PURE__*/ React.createElement(
                    "div",
                    { style: { marginTop: "6px" } },
                    /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" } },
                      /*#__PURE__*/ React.createElement(Icons.Columns, { size: 12 }),
                      "可用字段（点击插入）",
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { style: { display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "120px", overflowY: "auto", padding: "2px" } },
                      sourceTableHeaders.map((h) => /*#__PURE__*/ React.createElement(
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
                  step.config.expr && /*#__PURE__*/ React.createElement(
                    "div",
                    { style: { marginTop: "10px", padding: "10px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" } },
                    /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "#16a34a", marginBottom: "4px" } }, "公式预览"),
                    /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", fontFamily: "var(--font-mono)", color: "#166534" } },
                      (step.config.expr || "").replace(/{([^}]+)}/g, "【$1】"),
                    ),
                  ),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "聚合函数",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择计算方式"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.func,
                onChange: (val) => updateStepConfig(step.id, "func", val),
                options: aggregateFuncOptions,
                placeholder: "请选择函数",
                groupBy: "group",
              }),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "quick-tags" },
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "quick-tags-label" },
                  "常用："
                ),
                quickAggFuncs.map((f) =>
                  /*#__PURE__*/ React.createElement(
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
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          ' 💡 将多行数据聚合成单个结果值。选择"计算表达式"可先计算如「单价×数量」再聚合求和。',
        ),
      );
    case "formula":
      const getAvailableFields = () => {
        const avail = [];
        avail.push({ key: "val", name: "上一步结果", type: "result", category: "变量" });
        const previewSteps = previewResult?.stepResults;
        if (Array.isArray(previewSteps) && previewSteps.length > 0) {
          const lastResult = previewSteps[previewSteps.length - 1];
          if (lastResult && lastResult.preview && lastResult.preview.length > 0) {
            const sampleRow = lastResult.preview[0];
            Object.keys(sampleRow).forEach((k) => {
              if (k !== "val" && k !== "_groupCount") {
                avail.push({ key: k, name: k, type: "field", category: "字段" });
              }
            });
          }
        }
        if (savedRules && typeof savedRules === "object") {
          Object.keys(savedRules).forEach((fieldId) => {
            const field = fields.find((f) => f.id === fieldId);
            if (
              field &&
              field.id !== (currentFieldRef?.id || activeField?.id) &&
              savedRules[fieldId]?.steps?.length > 0
            ) {
              const chipName = field.name + " (已配置)";
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
      const availFields = getAvailableFields();
      const formulaOperators = [
        { key: "+", name: "加法", type: "operator", category: "运算符", desc: "加法运算" },
        { key: "-", name: "减法", type: "operator", category: "运算符", desc: "减法运算" },
        { key: "*", name: "乘法", type: "operator", category: "运算符", desc: "乘法运算" },
        { key: "/", name: "除法", type: "operator", category: "运算符", desc: "除法运算" },
        { key: "%", name: "取余", type: "operator", category: "运算符", desc: "取余运算" },
        { key: "(", name: "左括号", type: "operator", category: "运算符", desc: "左括号" },
        { key: ")", name: "右括号", type: "operator", category: "运算符", desc: "右括号" },
        { key: " ? : ", name: "三元判断", type: "operator", category: "运算符", desc: "条件 ? 真值 : 假值" },
      ];
      const formulaFunctions = [
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
      const allFormulaOptions = [
        ...availFields.map(f => ({ ...f, insert: `{${f.key}}` })),
        ...formulaOperators,
        ...formulaFunctions,
      ];
      const formatOptions = (CalcEngine.getOutputFormats && typeof CalcEngine.getOutputFormats === "function")
        ? CalcEngine.getOutputFormats()
        : [
            { value: "none", label: "不处理（原始数值）" },
            { value: "round2", label: "保留 2 位小数（四舍五入）" },
            { value: "thousands", label: "千分位格式化（如 1,234.56）" },
            { value: "money", label: "货币格式（¥1,234.56）" },
            { value: "percent", label: "百分比格式（12.34%）" },
          ];
      const currentFormat = step.config.format || "none";
      const insertAtCursor = (insertText) => {
        const expr = step.config.expr || "";
        updateStepConfig(step.id, "expr", expr + insertText);
      };
      const handleOptionSelect = (opt) => {
        if (opt.insert) {
          insertAtCursor(opt.insert);
        } else {
          insertAtCursor(opt.key);
        }
      };
      const filteredOptions = formulaFieldSearch.trim()
        ? allFormulaOptions.filter((opt) => {
            const q = formulaFieldSearch.toLowerCase();
            return (
              (opt.key || "").toLowerCase().includes(q) ||
              (opt.name || "").toLowerCase().includes(q) ||
              (opt.desc || "").toLowerCase().includes(q) ||
              (opt.category || "").toLowerCase().includes(q)
            );
          })
        : allFormulaOptions;
      const filteredGrouped = filteredOptions.reduce((acc, opt) => {
        const cat = opt.category || "其他";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(opt);
        return acc;
      }, {});
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
              /*#__PURE__*/ React.createElement(Icons.Formula, null),
              " 公式编辑"
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "计算公式",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "支持下拉选择或手动输入"
              )
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "formula-editor" },
              /*#__PURE__*/ React.createElement("textarea", {
                className: "input formula-textarea",
                value: step.config.expr || "",
                onChange: (e) =>
                  updateStepConfig(step.id, "expr", e.target.value),
                placeholder: "{val} * 0.7 + {销售额} * 0.3",
                style: { fontFamily: "var(--font-mono)", minHeight: "80px" },
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "formula-dropdown-panel" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "formula-search-box" },
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input formula-search-input",
                  placeholder: "搜索字段、函数、运算符...",
                  value: formulaFieldSearch,
                  onChange: (e) => setFormulaFieldSearch(e.target.value),
                }),
                formulaFieldSearch && /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "formula-search-clear",
                    onClick: () => setFormulaFieldSearch(""),
                  },
                  "✕"
                ),
              ),
              Object.keys(filteredGrouped).length > 0
                ? Object.keys(filteredGrouped).map((cat) => /*#__PURE__*/ React.createElement(
                    "div",
                    { key: cat, className: "formula-dropdown-group" },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "formula-dropdown-group-title" },
                      cat,
                      /*#__PURE__*/ React.createElement(
                        "span",
                        { className: "formula-dropdown-group-count" },
                        filteredGrouped[cat].length
                      )
                    ),
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "formula-dropdown-options" },
                      filteredGrouped[cat].map((opt, i) => /*#__PURE__*/ React.createElement(
                        "button",
                        {
                          key: i,
                          className: `formula-dropdown-option ${opt.type}`,
                          onClick: (e) => { e.preventDefault(); e.stopPropagation(); handleOptionSelect(opt); },
                          title: opt.desc || opt.name,
                        },
                        /*#__PURE__*/ React.createElement(
                          "span",
                          { className: "formula-option-key" },
                          opt.key
                        ),
                        /*#__PURE__*/ React.createElement(
                          "span",
                          { className: "formula-option-name" },
                          opt.name
                        ),
                      ))
                    )
                  ))
                : /*#__PURE__*/ React.createElement(
                    "div",
                    { className: "formula-dropdown-empty" },
                    "未找到匹配项"
                  )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "输出值格式",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "对计算结果进行格式转换"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: currentFormat,
              onChange: (val) => updateStepConfig(step.id, "format", val),
              options: formatOptions,
              placeholder: "请选择输出格式",
            })
          )
        ),
        step.config.expr && /*#__PURE__*/ React.createElement(
          "div",
          { style: { marginTop: "10px", padding: "10px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" } },
          /*#__PURE__*/ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "#0369a1", marginBottom: "4px" } }, "公式预览"),
          /*#__PURE__*/ React.createElement("div", { style: { fontSize: "13px", fontFamily: "var(--font-mono)", color: "#0c4a6e" } },
            (step.config.expr || "").replace(/{([^}]+)}/g, "【$1】"),
          ),
          (() => {
            const expr = step.config.expr || "";
            const fields = expr.match(/{([^}]+)}/g);
            if (!fields) return null;
            return /*#__PURE__*/ React.createElement("div", { style: { marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px" } },
              fields.map((f, i) => /*#__PURE__*/ React.createElement("span", { key: i, style: { fontSize: "11px", padding: "2px 6px", background: "#e0f2fe", borderRadius: "4px", color: "#0369a1" } }, f.slice(1, -1)),
            ),
            /*#__PURE__*/ React.createElement("span", { style: { fontSize: "11px", color: "#7dd3fc" } }, `共${fields.length}个字段`),
            );
          })(),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 💡 使用 ",
          /*#__PURE__*/ React.createElement("code", null, "{字段名}"),
          " 引用字段值，",
          /*#__PURE__*/ React.createElement("code", null, "{val}"),
          " 代表上一步结果。支持所有JavaScript数学函数；计算结果可按所选格式输出。",
        ),
      );
    case "virtual": {
      const virtualRuleOptions = [
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
      const quickVirtualRules = ["copy", "toNumber", "abs", "round", "trim", "parsePieces", "parseSize", "costLookup"];
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-info-box" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-title" },
            /*#__PURE__*/ React.createElement("span", { className: "step-info-icon" }, "💡"),
            "复杂运算步骤 - 虚拟字段转换"
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-content" },
            "虚拟字段用于创建派生数据列。",
            /*#__PURE__*/ React.createElement("br", null),
            "1. 源字段：选择要处理的列（如「商品规格」）",
            /*#__PURE__*/ React.createElement("br", null),
            "2. 目标字段：输出列名（多个用,分隔，可同时生成多个输出）",
            /*#__PURE__*/ React.createElement("br", null),
            "3. 转换规则：选择处理方式",
            /*#__PURE__*/ React.createElement("br", null),
            /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 转数字"), "：去除货币符号和逗号后转数字，支持百分比(50%→0.5)、提取字符串中第一个数字、中文数字识别",
            /*#__PURE__*/ React.createElement("br", null),
            /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 条数识别"), "：从商品规格中自动提取条数，支持「X条装」「X条」「X色各一」「X色各Y条」等模式，也可通过颜色词或+号自动计算",
            /*#__PURE__*/ React.createElement("br", null),
            /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 尺码识别"), "：从商品规格中自动提取尺码（S/M/L/XL/2XL/3XL等）",
            /*#__PURE__*/ React.createElement("br", null),
            /*#__PURE__*/ React.createElement("span", { style: { color: "var(--color-primary)" } }, "• 成本查找"), "：根据款号和尺码从全局成本表中匹配单件成本，支持自动按店铺名匹配成本表"
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
              /*#__PURE__*/ React.createElement(Icons.Transform, null),
              " 字段转换设置"
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
                "源字段",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "选择字段"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
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
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "目标字段（多个用,分隔）",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "支持同一列多个输出"
                )
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.target,
                onChange: (e) =>
                  updateStepConfig(step.id, "target", e.target.value),
                placeholder: "目标字段名（多个用,分隔）",
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "转换规则",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "选择数据处理方式"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.rule,
              onChange: (val) => updateStepConfig(step.id, "rule", val),
              options: virtualRuleOptions,
              placeholder: "请选择转换规则",
              groupBy: "group",
            }),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "quick-tags" },
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "quick-tags-label" },
                "常用："
              ),
              quickVirtualRules.map((r) =>
                /*#__PURE__*/ React.createElement(
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
        /*#__PURE__*/ React.createElement(MapValueEditor, { step: step, updateStepConfig: updateStepConfig }),
        step.config.rule === "costLookup" &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "config-section", style: { marginTop: "12px" } },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "config-section-header" },
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "config-section-title" },
              /*#__PURE__*/ React.createElement(Icons.Database, null),
              " 成本表配置"
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item", style: { marginBottom: "12px" } },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "成本表（全局表）",
              /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "自动按店铺名匹配")
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.costTableId || "",
              onChange: (val) => updateStepConfig(step.id, "costTableId", val),
              options: externalTables.map((t) => ({ value: t.id, label: t.name })),
              placeholder: "请选择全局成本表",
            })
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
                "款号字段",
                /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "数据中的款号列")
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.skuField || "",
                onChange: (val) => updateStepConfig(step.id, "skuField", val),
                options: [
                  { value: "", label: "请选择" },
                  ...sourceTableHeaders.map((h) => ({ value: h, label: h })),
                ],
                placeholder: "选择款号字段",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "尺码字段",
                /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "虚拟字段生成的尺码列")
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
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
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item", style: { marginTop: "8px" } },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "成本表款号列名",
              /*#__PURE__*/ React.createElement("span", { className: "form-label-hint" }, "成本表中的款号列，默认值为 款号")
            ),
            /*#__PURE__*/ React.createElement("input", {
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
        /*#__PURE__*/ React.createElement(AdvancedRuleConfig, { step: step, updateStepConfig: updateStepConfig }),
      );
    }
    case "join": {
      const joinTable = allTables.find((t) => t.id === step.config.table);
      const joinHeaders = joinTable?.headers || [];
      const isExternal = joinTable?.isExternal || false;
      const shopName = platform?.shops?.[0]?.name || "";
      const autoMatchedExt = shopName ? externalTables.find((t) => t.name === shopName || t.sheetKey === shopName) : null;
      const joinTableOptions = [
        ...sampleTables.map((t) => ({ value: t.id, label: t.name, group: "样表数据" })),
        ...externalTables.map((t) => ({ value: t.id, label: t.name, group: "全局数据表" }))
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
              /*#__PURE__*/ React.createElement(Icons.Join, null),
              " 关联表设置"
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "关联数据表",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                isExternal ? "全局数据表" : "选择要关联的数据表"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.table || "",
              onChange: (val) => {
                const tbl = allTables.find((t) => t.id === val);
                updateStepConfig(step.id, "table", val);
                updateStepConfig(step.id, "externalId", tbl?.externalId || "");
                updateStepConfig(step.id, "fk", "");
                updateStepConfig(step.id, "col", "");
              },
              options: joinTableOptions,
              placeholder: "请选择数据表",
              groupBy: "group",
            }),
            autoMatchedExt && !step.config.table && /*#__PURE__*/ React.createElement(
              "div",
              {
                style: { marginTop: "8px", padding: "8px 12px", background: "var(--color-primary-50)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
                onClick: () => {
                  updateStepConfig(step.id, "table", autoMatchedExt.id);
                  updateStepConfig(step.id, "externalId", autoMatchedExt.externalId || "");
                },
              },
              /*#__PURE__*/ React.createElement(Icons.Lightbulb, { size: 14 }),
              `检测到店铺"${shopName}"匹配全局表"${autoMatchedExt.name}"，点击自动关联`,
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
                "主表关联键",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "主表匹配字段"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.key || "",
                onChange: (val) => updateStepConfig(step.id, "key", val),
                options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                placeholder: "请选择字段",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "关联表外键",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "关联表匹配字段"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.fk || "",
                onChange: (val) => updateStepConfig(step.id, "fk", val),
                options: joinHeaders.map((h) => ({ value: h, label: h })),
                placeholder: step.config.table ? "请选择字段" : "先选择关联表",
                disabled: !step.config.table,
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "取关联表列",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "要获取的数据列"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.col || "",
              onChange: (val) => updateStepConfig(step.id, "col", val),
              options: joinHeaders.map((h) => ({ value: h, label: h })),
              placeholder: step.config.table ? "请选择字段" : "先选择关联表",
              disabled: !step.config.table,
            })
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-checkbox-label" },
            /*#__PURE__*/ React.createElement("input", {
              type: "checkbox",
              checked: step.config.parseSizeCost || false,
              onChange: (e) => updateStepConfig(step.id, "parseSizeCost", e.target.checked),
            }),
            "启用智能成本解析",
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "form-label-hint" },
              "自动识别平台，支持平台+尺码组合成本（如拼多多m3.5l4淘宝5），找不到对应尺码时以L码为准"
            )
          )
        ),
        step.config.parseSizeCost && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "规格/尺码字段",
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "form-label-hint" },
              "主表中包含商品规格或尺码的字段"
            )
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.sizeField || "",
            onChange: (val) => updateStepConfig(step.id, "sizeField", val),
            options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
            placeholder: "请选择规格/尺码字段",
          })
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-desc" },
        /*#__PURE__*/ React.createElement(Icons.Info, null),
        " 💡 根据主表关联键从关联表中匹配数据，将关联表中指定列的值填充到当前字段。",
      )
    );
      }
    case "distinct":
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
              /*#__PURE__*/ React.createElement(Icons.Filter, null),
              " 去重设置"
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "去重列",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "按此列去重"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: columnOptionsWithVal,
              placeholder: "请选择列",
              groupBy: "group",
            })
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          ' 💡 去除指定列的重复值，保留第一次出现的行。选择"当前值"时使用上一步输出的val字段。',
        ),
      );
    case "sort":
      const sortDirectionOptions = [
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
                onChange: (val) => updateStepConfig(step.id, "column", val),
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
                onChange: (val) => updateStepConfig(step.id, "direction", val),
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
    case "limit":
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
            onChange: (e) =>
              updateStepConfig(step.id, "count", Number(e.target.value)),
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
    case "condition":
      const conditionOpOptions = [
        { value: "==", label: "等于", group: "比较" },
        { value: "!=", label: "不等于", group: "比较" },
        { value: ">", label: "大于", group: "比较" },
        { value: "<", label: "小于", group: "比较" },
        { value: ">=", label: "大于等于", group: "比较" },
        { value: "<=", label: "小于等于", group: "比较" },
        { value: "contains", label: "包含", group: "文本" },
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
              /*#__PURE__*/ React.createElement(Icons.Condition, null),
              " 条件判断设置"
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
                "判断列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "要判断的字段"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "val",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: [
                  { value: "val", label: "当前值 (val)", group: "上一步结果" },
                  ...sourceTableHeaders.map((h) => ({ value: h, label: h, group: "数据列" }))
                ],
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
                "操作符",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "判断条件"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.op || "==",
                onChange: (val) => updateStepConfig(step.id, "op", val),
                options: conditionOpOptions,
                placeholder: "请选择条件",
                groupBy: "group",
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "对比值",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "与判断列比较的值"
              )
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.value,
              onChange: (e) =>
                updateStepConfig(step.id, "value", e.target.value),
              placeholder: "输入对比值",
            })
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
                "满足条件的值",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "条件成立时返回"
                )
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.trueValue,
                onChange: (e) =>
                  updateStepConfig(step.id, "trueValue", e.target.value),
                placeholder: "默认 1",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "不满足的值",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "条件不成立时返回"
                )
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.falseValue,
                onChange: (e) =>
                  updateStepConfig(step.id, "falseValue", e.target.value),
                placeholder: "默认 0",
              })
            )
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 💡 根据条件返回不同的值，不丢弃数据。例如：如果\"销量大于100\"返回1，否则返回0。",
        ),
      );
    case "group":
      const groupFuncOptions = [
        { value: "sum", label: "求和 (SUM)", group: "基础统计" },
        { value: "avg", label: "平均值 (AVG)", group: "基础统计" },
        { value: "count", label: "计数 (COUNT)", group: "基础统计" },
        { value: "max", label: "最大值 (MAX)", group: "基础统计" },
        { value: "min", label: "最小值 (MIN)", group: "基础统计" },
        { value: "countDistinct", label: "去重计数", group: "高级" },
        { value: "median", label: "中位数", group: "高级" },
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
              /*#__PURE__*/ React.createElement(Icons.Group, null),
              " 分组聚合设置"
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
                "分组列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "按此列分组"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.column || "",
                onChange: (val) => updateStepConfig(step.id, "column", val),
                options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                placeholder: "请选择分组列",
              })
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "聚合列",
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: "form-label-hint" },
                  "要聚合的数值"
                )
              ),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.aggColumn || "",
                onChange: (val) => updateStepConfig(step.id, "aggColumn", val),
                options: columnOptionsWithVal,
                placeholder: "请选择列",
                groupBy: "group",
              })
            )
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "聚合函数",
              /*#__PURE__*/ React.createElement(
                "span",
                { className: "form-label-hint" },
                "计算方式"
              )
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.func || "sum",
              onChange: (val) => updateStepConfig(step.id, "func", val),
              options: groupFuncOptions,
              placeholder: "请选择函数",
              groupBy: "group",
            })
          )
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " 💡 按指定列分组后对另一列进行聚合计算，返回分组后的结果集。",
        ),
      );
    case "lookup":
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
            onChange: (val) => updateStepConfig(step.id, "column", val),
            options: [{ value: "", label: "默认使用当前值(val)" }, ...(sourceTableHeaders || []).map((h) => ({ value: h, label: h }))],
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
              onChange: (val) => updateStepConfig(step.id, "mode", val),
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
              onChange: (val) => updateStepConfig(step.id, "onMiss", val),
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
              onChange: (e) =>
                updateStepConfig(step.id, "defaultValue", e.target.value),
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
            (step.config.pairs || []).map((pair, idx) =>
              /*#__PURE__*/ React.createElement(
                "div",
                {
                  key: idx,
                  style: { display: "flex", gap: 8, alignItems: "center" },
                },
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: pair.from,
                  onChange: (e) => {
                    const newPairs = [...(step.config.pairs || [])];
                    newPairs[idx] = { ...pair, from: e.target.value };
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
                  onChange: (e) => {
                    const newPairs = [...(step.config.pairs || [])];
                    newPairs[idx] = { ...pair, to: e.target.value };
                    updateStepConfig(step.id, "pairs", newPairs);
                  },
                  placeholder: "\u66FF\u6362\u503C",
                  style: { flex: 1 },
                }),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "btn-link danger",
                    onClick: () => {
                      const newPairs = (step.config.pairs || []).filter(
                        (_, i) => i !== idx,
                      );
                      updateStepConfig(step.id, "pairs", newPairs);
                    },
                  },
                  /*#__PURE__*/ React.createElement(Icons.Trash, null),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: () => {
                  const newPairs = [
                    ...(step.config.pairs || []),
                    { from: "", to: "" },
                  ];
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
    case "constant":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5E38\u91CF\u503C",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            value: step.config.value,
            onChange: (e) =>
              updateStepConfig(step.id, "value", e.target.value),
            placeholder: "\u8F93\u5165\u56FA\u5B9A\u503C\uFF0C\u5982 0 \u6216 \u672A\u5339\u914D",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u8F93\u51FA\u4E00\u4E2A\u56FA\u5B9A\u5E38\u91CF\u503C\uFF0C\u53EF\u7528\u4E8E\u9ED8\u8BA4\u503C\u6216\u5360\u4F4D",
        ),
      );
    case "text":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u6587\u672C\u6A21\u677F",
          ),
          /*#__PURE__*/ React.createElement("textarea", {
            className: "textarea",
            value: step.config.value,
            onChange: (e) =>
              updateStepConfig(step.id, "value", e.target.value),
            placeholder: "\u652F\u6301 {val}\u3001{shopName} \u7B49\u53D8\u91CF\u66FF\u6362",
            rows: 3,
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u5BF9\u6587\u672C\u8FDB\u884C\u53D8\u91CF\u66FF\u6362\uFF0C\u53EF\u5F15\u7528\u4E0A\u4E00\u6B65\u7ED3\u679C {val} \u548C\u4E0A\u4E0B\u6587\u53D8\u91CF",
        ),
      );
    case "round":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "输入列"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
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
            onChange: (e) =>
              updateStepConfig(step.id, "decimals", Number(e.target.value)),
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
    case "concat":
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
            (step.config.columns || ["", ""]).map((col, idx) =>
              /*#__PURE__*/ React.createElement(
                "div",
                { key: idx, style: { display: "flex", gap: 8 } },
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: col,
                  onChange: (val) => {
                    const newCols = [...(step.config.columns || ["", ""])];
                    newCols[idx] = val;
                    updateStepConfig(step.id, "columns", newCols);
                  },
                  options: [{ value: "", label: "请选择字段" }, ...colOptsNoVal],
                  placeholder: "请选择字段",
                }),
                idx < (step.config.columns || ["", ""]).length - 1 &&
                  /*#__PURE__*/ React.createElement(
                    "span",
                    { style: { color: "var(--color-text-tertiary)", alignSelf: "center" } },
                    "+",
                  ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                size: "sm",
                onClick: () => {
                  const newCols = [
                    ...(step.config.columns || ["", ""]),
                    "",
                  ];
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
            onChange: (e) =>
              updateStepConfig(step.id, "separator", e.target.value),
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
    case "substring":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "源字段"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
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
              onChange: (e) =>
                updateStepConfig(step.id, "start", Number(e.target.value)),
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
              onChange: (e) =>
                updateStepConfig(step.id, "length", Number(e.target.value)),
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
    case "date":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "日期字段"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
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
            onChange: (val) => updateStepConfig(step.id, "operation", val),
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
            onChange: (val) => updateStepConfig(step.id, "format", val),
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
            onChange: (e) =>
              updateStepConfig(step.id, "days", Number(e.target.value)),
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
    case "math":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "输入列"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
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
              onChange: (val) => updateStepConfig(step.id, "operation", val),
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
              onChange: (e) =>
                updateStepConfig(step.id, "value", Number(e.target.value)),
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
    case "rank":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "排名列"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
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
            onChange: (val) => updateStepConfig(step.id, "direction", val),
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
    case "diff":
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
              onChange: (val) => updateStepConfig(step.id, "column", val),
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
              onChange: (val) => updateStepConfig(step.id, "baseColumn", val),
              options: [{ value: "", label: "请选择基准列" }, ...colOptsNoVal],
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
              onChange: (e) =>
                updateStepConfig(step.id, "percent", e.target.checked),
            }),
            " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u8BA1\u7B97\u5F53\u524D\u503C\u4E0E\u57FA\u51C6\u503C\u7684\u5dee\u503C",
        ),
      );
    case "ratio":
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
              onChange: (val) => updateStepConfig(step.id, "numerator", val),
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
              onChange: (val) => updateStepConfig(step.id, "denominator", val),
              options: [{ value: "", label: "请选择分母列" }, ...colOptsNoVal],
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
              onChange: (e) =>
                updateStepConfig(step.id, "percent", e.target.checked),
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
    case "union":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5408\u5E76\u6570\u636E\u8868",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 8 } },
            (step.config.tables || []).map((tableId, idx) =>
              /*#__PURE__*/ React.createElement(
                "div",
                { key: idx, style: { display: "flex", gap: 8 } },
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: tableId || "",
                  onChange: (val) => {
                    const newTables = [...(step.config.tables || [])];
                    newTables[idx] = val;
                    updateStepConfig(step.id, "tables", newTables);
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
                      updateStepConfig(step.id, "tables", newTables);
                    },
                  },
                  /*#__PURE__*/ React.createElement(Icons.Trash, null),
                ),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                size: "sm",
                onClick: () => {
                  const newTables = [
                    ...(step.config.tables || []),
                    "",
                  ];
                  updateStepConfig(step.id, "tables", newTables);
                },
              },
              /*#__PURE__*/ React.createElement(Icons.Plus, null),
              " \u6DFB\u52A0\u6570\u636E\u8868",
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u5C06\u591A\u4E2A\u6570\u636E\u8868\u7684\u6570\u636E\u8FDB\u884C\u5408\u5E76",
        ),
      );
    case "keepDuplicate":
    case "keepUnique":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement("label", { className: "form-label" }, "判断列"),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
            options: [{ value: "", label: "当前值 (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
            placeholder: "请选择列",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          step.type === "keepDuplicate"
            ? " 按指定列判断，仅保留出现过多次的重复行（重复行会全部保留）"
            : " 按指定列判断，仅保留只出现过一次的唯一行",
        ),
      );
    case "intersect":
    case "crossMatch":
      return (() => {
        // 统一使用 crossMatch 的配置方式：columns/compareColumns 数组
        // 对旧版 intersect 的 key/compareKey 做兼容
        const isIntersect = step.type === "intersect";
        const modeOptions = isIntersect
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
        const compareTableHeaders = getTableHeaders(step.config.table);
        const columns = step.config.columns && step.config.columns.length > 0
          ? step.config.columns
          : (step.config.key ? [step.config.key] : [""]);
        const compareColumns = step.config.compareColumns && step.config.compareColumns.length > 0
          ? step.config.compareColumns
          : (step.config.compareKey ? [step.config.compareKey] : [""]);
        const currentMode = step.config.mode || (isIntersect ? "keepExist" : "keepIntersection");
        const needCompareTable = currentMode === "keepIntersection" || currentMode === "keepDifference" || currentMode === "keepExist" || currentMode === "keepNotExist" || currentMode === "mergeWithFilter" || currentMode === "semiJoin" || currentMode === "antiJoin";
        const allTableOptions = [{ value: "", label: "请选择数据表" }, ...allTables.map((t) => ({ value: t.id, label: t.name }))];
        return /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-config" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement("label", { className: "form-label" }, isIntersect ? "对比模式" : "处理模式"),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: currentMode,
              onChange: (val) => updateStepConfig(step.id, "mode", val),
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
                onChange: (val) => updateStepConfig(step.id, "selfFilterColumn", val),
                options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                placeholder: "筛选列",
              }),
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: step.config.selfFilterOp || "==",
                onChange: (val) => updateStepConfig(step.id, "selfFilterOp", val),
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
                onChange: (val) => updateStepConfig(step.id, "selfFilterValue", val),
                options: [{ value: "", label: "请输入值" }, ...getColumnValues(step.config.selfFilterColumn).map((v) => ({ value: v, label: v }))],
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
            columns.map((col, idx) => /*#__PURE__*/ React.createElement(
              "div",
              { key: idx, className: "grid-2", style: { marginBottom: 6, gap: 6 } },
              /*#__PURE__*/ React.createElement(SearchableSelect, {
                value: col,
                onChange: (val) => {
                  const newCols = [...columns];
                  newCols[idx] = val;
                  const filtered = newCols.filter(Boolean);
                  updateStepConfig(step.id, "columns", filtered.length ? filtered : [""]);
                  if (isIntersect) updateStepConfig(step.id, "key", filtered[0] || "");
                },
                options: sourceTableHeaders.map((h) => ({ value: h, label: h })),
                placeholder: "选择匹配列",
              }),
              columns.length > 1 && /*#__PURE__*/ React.createElement("button", {
                className: "btn-icon",
                onClick: () => {
                  const newCols = columns.filter((_, i) => i !== idx);
                  updateStepConfig(step.id, "columns", newCols.length ? newCols : [""]);
                  if (isIntersect) updateStepConfig(step.id, "key", newCols[0] || "");
                },
                title: "删除此列",
              }, "×"),
            )),
            /*#__PURE__*/ React.createElement("button", {
              className: "btn-text",
              onClick: () => updateStepConfig(step.id, "columns", [...columns, ""]),
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
                onChange: (val) => {
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
              compareColumns.map((col, idx) => /*#__PURE__*/ React.createElement(
                "div",
                { key: idx, className: "grid-2", style: { marginBottom: 6, gap: 6 } },
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: col,
                  onChange: (val) => {
                    const newCols = [...compareColumns];
                    newCols[idx] = val;
                    const filtered = newCols.filter(Boolean);
                    updateStepConfig(step.id, "compareColumns", filtered.length ? filtered : [""]);
                    if (isIntersect) updateStepConfig(step.id, "compareKey", filtered[0] || "");
                  },
                  options: compareTableHeaders.map((h) => ({ value: h, label: h })),
                  placeholder: "选择对比列",
                }),
                compareColumns.length > 1 && /*#__PURE__*/ React.createElement("button", {
                  className: "btn-icon",
                  onClick: () => {
                    const newCols = compareColumns.filter((_, i) => i !== idx);
                    updateStepConfig(step.id, "compareColumns", newCols.length ? newCols : [""]);
                    if (isIntersect) updateStepConfig(step.id, "compareKey", newCols[0] || "");
                  },
                  title: "删除此列",
                }, "×"),
              )),
              /*#__PURE__*/ React.createElement("button", {
                className: "btn-text",
                onClick: () => updateStepConfig(step.id, "compareColumns", [...compareColumns, ""]),
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
                  onChange: (val) => updateStepConfig(step.id, "filterColumn", val),
                  options: [{ value: "", label: "不筛选" }, ...compareTableHeaders.map((h) => ({ value: h, label: h }))],
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
                    onChange: (val) => updateStepConfig(step.id, "filterOp", val),
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
                    onChange: (val) => updateStepConfig(step.id, "filterValue", val),
                    options: [{ value: "", label: "请输入值" }, ...getColumnValues(step.config.filterColumn, step.config.table).map((v) => ({ value: v, label: v }))],
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
    case "runningTotal":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u7D2F\u8BA1\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6392\u5E8F\u5217\uFF08\u53EF\u9009\uFF09",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.orderColumn || "",
              onChange: (val) => updateStepConfig(step.id, "orderColumn", val),
              options: [{ value: "", label: "\u4FDD\u6301\u539F\u987A\u5E8F" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u9009\u62E9\u6392\u5E8F\u5217",
            }),
          ),
        ),
        step.config.orderColumn && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u6392\u5E8F\u65B9\u5F0F",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.direction || "asc",
            onChange: (val) => updateStepConfig(step.id, "direction", val),
            options: [
              { value: "asc", label: "\u5347\u5E8F\uFF08\u4ECE\u5C0F\u5230\u5927\uFF09" },
              { value: "desc", label: "\u964D\u5E8F\uFF08\u4ECE\u5927\u5230\u5C0F\uFF09" },
            ],
            placeholder: "\u9009\u62E9\u6392\u5E8F\u65B9\u5F0F",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u6309\u884C\u987A\u5E8F\u8BA1\u7B97\u7D2F\u8BA1\u503C\uFF0C\u53EF\u9009\u6309\u67D0\u5217\u6392\u5E8F\u540E\u7D2F\u8BA1\u3002",
        ),
      );
    case "percentOfTotal":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u8BA1\u7B97\u5217",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.column || "",
            onChange: (val) => updateStepConfig(step.id, "column", val),
            options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
            placeholder: "\u8BF7\u9009\u62E9\u5217",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "checkbox-label" },
            /*#__PURE__*/ React.createElement("input", {
              type: "checkbox",
              checked: step.config.asPercent !== false,
              onChange: (e) => updateStepConfig(step.id, "asPercent", e.target.checked),
            }),
            " \u663E\u793A\u4E3A\u767E\u5206\u6BD4",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u8BA1\u7B97\u6BCF\u884C\u503C\u5360\u603B\u548C\u7684\u6BD4\u4F8B\uFF0C\u53EF\u9009\u8F6C\u4E3A\u767E\u5206\u6BD4\u3002",
        ),
      );
    case "movingAverage":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8BA1\u7B97\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u7A97\u53E3\u5927\u5C0F",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.windowSize || 3,
              onChange: (e) => updateStepConfig(step.id, "windowSize", parseInt(e.target.value) || 3),
              min: 1,
              max: 100,
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u8F93\u51FA\u5217\u540D",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            value: step.config.targetColumn || "moving_avg",
            onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
            placeholder: "moving_avg",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u6309\u7A97\u53E3\u5927\u5C0E\u8BA1\u7B97\u6EDA\u52A8\u79FB\u52A8\u5E73\u5747\u503C\uFF0C\u7A97\u53E3\u5927\u5C0E\u8868\u793A\u53C2\u8003\u7684\u524D N \u884C\u6570\u636E\u3002",
        ),
      );
    case "binning":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5206\u7BB1\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5206\u7BB1\u65B9\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.binType || "equalWidth",
              onChange: (val) => updateStepConfig(step.id, "binType", val),
              options: [
                { value: "equalWidth", label: "\u7B49\u5BBD\u5206\u7BB1" },
                { value: "custom", label: "\u81EA\u5B9A\u4E49\u5206\u7BB1" },
              ],
              placeholder: "\u8BF7\u9009\u62E9\u5206\u7BB1\u65B9\u5F0F",
            }),
          ),
        ),
        step.config.binType === "equalWidth" && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5206\u7BB1\u6570\u91CF",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.binCount || 5,
                onChange: (e) => updateStepConfig(step.id, "binCount", parseInt(e.target.value) || 5),
                min: 1,
                max: 20,
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u8F93\u51FA\u5217\u540D",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "text",
                className: "input",
                value: step.config.targetColumn || "bin",
                onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
                placeholder: "bin",
              }),
            ),
          ),
        ),
        step.config.binType === "custom" && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u81EA\u5B9A\u4E49\u5206\u7BB1\u533A\u95F4",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "multi-row-config" },
              (step.config.customBins || []).map((bin, idx) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  { key: idx, className: "multi-row-item" },
                  /*#__PURE__*/ React.createElement("input", {
                    type: "number",
                    className: "input input-sm",
                    value: bin.min || "",
                    onChange: (e) => {
                      const bins = [...(step.config.customBins || [])];
                      bins[idx] = { ...bins[idx], min: e.target.value };
                      updateStepConfig(step.id, "customBins", bins);
                    },
                    placeholder: "\u4E0B\u9650",
                  }),
                  /*#__PURE__*/ React.createElement("span", null, "-"),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "number",
                    className: "input input-sm",
                    value: bin.max || "",
                    onChange: (e) => {
                      const bins = [...(step.config.customBins || [])];
                      bins[idx] = { ...bins[idx], max: e.target.value };
                      updateStepConfig(step.id, "customBins", bins);
                    },
                    placeholder: "\u4E0A\u9650",
                  }),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input input-sm",
                    value: bin.label || "",
                    onChange: (e) => {
                      const bins = [...(step.config.customBins || [])];
                      bins[idx] = { ...bins[idx], label: e.target.value };
                      updateStepConfig(step.id, "customBins", bins);
                    },
                    placeholder: "\u533A\u95F4\u540D",
                  }),
                  /*#__PURE__*/ React.createElement(
                    "button",
                    {
                      className: "btn-icon btn-icon-danger",
                      onClick: () => {
                        const bins = (step.config.customBins || []).filter((_, i) => i !== idx);
                        updateStepConfig(step.id, "customBins", bins);
                      },
                    },
                    /*#__PURE__*/ React.createElement(Icons.Trash, null),
                  ),
                )
              ),
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-sm btn-secondary",
                  onClick: () => {
                    const bins = [...(step.config.customBins || []), { min: "", max: "", label: "" }];
                    updateStepConfig(step.id, "customBins", bins);
                  },
                },
                /*#__PURE__*/ React.createElement(Icons.Plus, null),
                " \u6DFB\u52A0\u533A\u95F4",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u51FA\u5217\u540D",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.targetColumn || "bin",
              onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
              placeholder: "bin",
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u5C06\u8FDE\u7EED\u6570\u636E\u5206\u7BB1\u4E3A\u5206\u7C7B\u533A\u95F4\uFF0C\u7B49\u5BBD\u5206\u7BB1\u81EA\u52A8\u8BA1\u7B97\u95F4\u9694\uFF0C\u81EA\u5B9A\u4E49\u5206\u7BB1\u53EF\u6307\u5B9A\u8D77\u6B62\u533A\u95F4\u3002",
        ),
      );
    case "conditionalTag":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u8F93\u51FA\u5217\u540D",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            value: step.config.targetColumn || "tag",
            onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
            placeholder: "tag",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u6807\u8BB0\u6761\u4EF6\u89C4\u5217",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "multi-row-config" },
            (step.config.conditions || []).map((cond, idx) =>
              /*#__PURE__*/ React.createElement(
                "div",
                { key: idx, className: "multi-row-item condition-row" },
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: cond.column || "",
                  onChange: (val) => {
                    const conditions = [...(step.config.conditions || [])];
                    conditions[idx] = { ...conditions[idx], column: val };
                    updateStepConfig(step.id, "conditions", conditions);
                  },
                  options: [{ value: "", label: "val" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
                  placeholder: "\u5217",
                }),
                /*#__PURE__*/ React.createElement(SearchableSelect, {
                  value: cond.op || "==",
                  onChange: (val) => {
                    const conditions = [...(step.config.conditions || [])];
                    conditions[idx] = { ...conditions[idx], op: val };
                    updateStepConfig(step.id, "conditions", conditions);
                  },
                  options: [
                    { value: "==", label: "\u7B49\u4E8E" },
                    { value: "!=" },
                    { value: ">", label: "\u5927\u4E8E" },
                    { value: "<", label: "\u5C0E\u4E8E" },
                    { value: ">=" },
                    { value: "<=" },
                    { value: "contains", label: "\u5305\u542B" },
                    { value: "notContains", label: "\u4E0D\u5305\u542B" },
                    { value: "startsWith", label: "\u5F00\u59CB\u4E3A" },
                    { value: "endsWith", label: "\u7ED3\u5C3E\u4E3A" },
                    { value: "isEmpty", label: "\u4E3A\u7A7A" },
                    { value: "notEmpty", label: "\u4E0D\u4E3A\u7A7A" },
                    { value: "regex", label: "\u6B63\u5219" },
                  ],
                  placeholder: "\u8FD0\u7B97",
                }),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input input-sm",
                  value: cond.value || "",
                  onChange: (e) => {
                    const conditions = [...(step.config.conditions || [])];
                    conditions[idx] = { ...conditions[idx], value: e.target.value };
                    updateStepConfig(step.id, "conditions", conditions);
                  },
                  placeholder: "\u503C",
                }),
                /*#__PURE__*/ React.createElement("span", null, "\u2192"),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input input-sm",
                  value: cond.tag || "",
                  onChange: (e) => {
                    const conditions = [...(step.config.conditions || [])];
                    conditions[idx] = { ...conditions[idx], tag: e.target.value };
                    updateStepConfig(step.id, "conditions", conditions);
                  },
                  placeholder: "\u6807\u8BB1",
                }),
                /*#__PURE__*/ React.createElement(
                  "button",
                  {
                    className: "btn-icon btn-icon-danger",
                    onClick: () => {
                      const conditions = (step.config.conditions || []).filter((_, i) => i !== idx);
                      updateStepConfig(step.id, "conditions", conditions);
                    },
                  },
                  /*#__PURE__*/ React.createElement(Icons.Trash, null),
                ),
              )
            ),
            /*#__PURE__*/ React.createElement(
              "button",
              {
                className: "btn btn-sm btn-secondary",
                onClick: () => {
                  const conditions = [...(step.config.conditions || []), { column: "", op: "==", value: "", tag: "" }];
                  updateStepConfig(step.id, "conditions", conditions);
                },
              },
              /*#__PURE__*/ React.createElement(Icons.Plus, null),
              " \u6DFB\u52A0\u6761\u4EF6",
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u9ED8\u8BA4\u6807\u8BB1",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            value: step.config.defaultTag || "",
            onChange: (e) => updateStepConfig(step.id, "defaultTag", e.target.value),
            placeholder: "\u6240\u6709\u6761\u4EF6\u90FD\u4E0D\u6EE1\u8DB3\u65F6\u7684\u9ED8\u8BA4\u6807\u8BB1",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u6EE1\u8DB3\u6761\u4EF6\u65F6\u6DFB\u52A0\u6807\u8BB1\uFF0C\u8BA1\u7B97\u7ED3\u679C\u4E3A\u65B0\u5217\u3002\u6761\u4EF6\u6309\u987A\u5E8F\u5339\u9145\uFF0C\u6EE1\u8DB3\u7B2C\u4E00\u4E2A\u6761\u4EF6\u5373\u7ED3\u675F\u3002",
        ),
      );
    case "stringExtract":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6E90\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u6E90\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u51FA\u5217\u540D",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.targetColumn || "extracted",
              onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
              placeholder: "extracted",
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u8F6C\u6362\u65B9\u5F0F",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.extractType || "regex",
            onChange: (val) => updateStepConfig(step.id, "extractType", val),
            options: [
              { value: "regex", label: "\u6B63\u5219\u63D0\u53D6" },
              { value: "substring", label: "\u5B50\u4E32\u622A\u53D6" },
              { value: "concat", label: "\u5217\u62FC\u63A5" },
              { value: "split", label: "\u5206\u9694\u63D0\u53D6" },
              { value: "trim", label: "\u524D\u540E\u7A7A\u5228\u9664" },
              { value: "upper", label: "\u8F6C\u5927\u5199" },
              { value: "lower", label: "\u8F6C\u5C0E\u5199" },
            ],
            placeholder: "\u8BF7\u9009\u62E9\u8F6C\u6362\u65B9\u5F0F",
          }),
        ),
        step.config.extractType === "regex" && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6B63\u5219\u8868\u8F93\u5F0F",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.pattern || "",
              onChange: (e) => updateStepConfig(step.id, "pattern", e.target.value),
              placeholder: "\u4F8B\u5982: \\d+",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u63D0\u53D6\u5206\u7EC4\uFF08\u7B2C\u4E00\u4E2A\u5206\u7EC4\u4E3A 0\uFF09",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "number",
              className: "input",
              value: step.config.extractGroup || 0,
              onChange: (e) => updateStepConfig(step.id, "extractGroup", parseInt(e.target.value) || 0),
              min: 0,
            }),
          ),
        ),
        step.config.extractType === "substring" && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u5F00\u59CB\u4F4D\u7F6E",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.start || 0,
                onChange: (e) => updateStepConfig(step.id, "start", parseInt(e.target.value) || 0),
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
                value: step.config.length || 10,
                onChange: (e) => updateStepConfig(step.id, "length", parseInt(e.target.value) || 10),
                min: 1,
              }),
            ),
          ),
        ),
        step.config.extractType === "concat" && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u62FC\u63A5\u5217\uFF08\u7528\u82F1\u6587\u4E0E\u5218\u540D\u5206\u9694\uFF0C\u4F8B\u5982\uFF1A\u5546\u54C1ID,\u89C4\u683C\uFF09",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: (step.config.columns || []).join(","),
              onChange: (e) => updateStepConfig(step.id, "columns", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)),
              placeholder: "\u4F8B\u5982\uFF1A\u5546\u54C1ID,\u89C4\u683C",
            }),
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
              value: step.config.separator || "",
              onChange: (e) => updateStepConfig(step.id, "separator", e.target.value),
              placeholder: "\u4F8B\u5982\uFF1A- \u6216\u7A7A\u4E3A\u76F4\u63A5\u62FC\u63A5",
            }),
          ),
        ),
        step.config.extractType === "split" && /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "grid-2" },
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
                value: step.config.separator || ",",
                onChange: (e) => updateStepConfig(step.id, "separator", e.target.value),
                placeholder: "\u4F8B\u5982\uFF1A,",
              }),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "form-item" },
              /*#__PURE__*/ React.createElement(
                "label",
                { className: "form-label" },
                "\u63D0\u53D6\u4F4D\u7F6E\uFF08\u7B2C\u4E00\u4E2A\u4E3A 0\uFF09",
              ),
              /*#__PURE__*/ React.createElement("input", {
                type: "number",
                className: "input",
                value: step.config.splitIndex || 0,
                onChange: (e) => updateStepConfig(step.id, "splitIndex", parseInt(e.target.value) || 0),
                min: 0,
              }),
            ),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u5BF9\u5B57\u7B26\u4E32\u8FDB\u884C\u63D0\u53D6\u3001\u622A\u53D6\u3001\u62FC\u63A5\u3001\u5206\u9694\u6216\u5176\u4ED6\u64CD\u4F5C\u3002",
        ),
      );
    case "fillNA":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5904\u740E\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u5904\u740E\u65B9\u5F0F",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.fillType || "value",
              onChange: (val) => updateStepConfig(step.id, "fillType", val),
              options: [
                { value: "value", label: "\u6307\u5B9A\u503C" },
                { value: "zero", label: "\u7528\u96F6\u5904\u740E" },
                { value: "empty", label: "\u7528\u7A7A\u5B57\u7B26\u4E32\u5904\u740E" },
                { value: "mean", label: "\u7528\u5E73\u5747\u503C\u5904\u740E" },
                { value: "median", label: "\u7528\u4E2D\u4F4D\u6570\u5904\u740E" },
                { value: "mode", label: "\u7528\u4F17\u6570\u5904\u740E" },
                { value: "forward", label: "\u524D\u5411\u5904\u740E" },
                { value: "backward", label: "\u540E\u5411\u5904\u740E" },
              ],
              placeholder: "\u8BF7\u9009\u62E9\u5904\u740E\u65B9\u5F0F",
            }),
          ),
        ),
        step.config.fillType === "value" && /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5904\u740E\u503C",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            value: step.config.fillValue || "",
            onChange: (e) => updateStepConfig(step.id, "fillValue", e.target.value),
            placeholder: "\u8BF7\u8F93\u5165\u5904\u740E\u503C",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u5BF9\u7A7A\u503C\uFF08null\u3001\u7A7A\u5B57\u7B26\u4E32\u3001NaN\uFF09\u8FDB\u884C\u5904\u740E\uFF0C\u53EF\u6307\u5B9A\u5E38\u91CF\u6216\u4F7F\u7528\u7EDF\u8BA1\u65B9\u5F0F\u5904\u740E\u3002",
        ),
      );
    case "normalize":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "grid-2" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u6807\u51C6\u5316\u5217",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u5217",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u51FA\u5217\u540D",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.targetColumn || "normalized",
              onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
              placeholder: "normalized",
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u6807\u51C6\u5316\u65B9\u5F0F",
          ),
          /*#__PURE__*/ React.createElement(SearchableSelect, {
            value: step.config.normType || "minmax",
            onChange: (val) => updateStepConfig(step.id, "normType", val),
            options: [
              { value: "minmax", label: "\u6700\u5C0E-\u6700\u5927\u6807\u51C6\u5316 (Min-Max)" },
              { value: "zscore", label: "Z-score \u6807\u51C6\u5316" },
              { value: "decimal", label: "\u5C0E\u5C0E\u5B9A\u6807\u5316" },
            ],
            placeholder: "\u8BF7\u9009\u62E9\u6807\u51C6\u5316\u65B9\u5F0F",
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u5BF9\u6570\u636E\u8FDB\u884C\u6807\u51C6\u5316\uFF0C\u7ED3\u679C\u4E3A 0-1 \u4E4B\u95F4\u7684\u6570\u636E\uFF0C\u7528\u4E8E\u4E0D\u540C\u5355\u4F4D\u6570\u636E\u7684\u5BF9\u6BD4\u3002",
        ),
      );
    case "valueNormalize":
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-info-box" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-title" },
            /*#__PURE__*/ React.createElement("span", { className: "step-info-icon" }, "💡"),
            "复杂运算步骤 - 列值转换配置"
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-info-content" },
            "此步骤用于将列值转换为可计算的数字。配置方法：",
            /*#__PURE__*/ React.createElement("br", null),
            "1. 选择源字段（要转换的列）",
            /*#__PURE__*/ React.createElement("br", null),
            "2. 添加多条转换规则，按优先级匹配",
            /*#__PURE__*/ React.createElement("br", null),
            "3. 常见模式：「100元」→「100」/「5条」→「5」/「50%」→「0.5」/「三」→「3」"
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
              "\u6E90\u5B57\u6BB5",
            ),
            /*#__PURE__*/ React.createElement(SearchableSelect, {
              value: step.config.column || "",
              onChange: (val) => updateStepConfig(step.id, "column", val),
              options: [{ value: "", label: "\u5F53\u524D\u503C (val)" }, ...sourceTableHeaders.map((h) => ({ value: h, label: h }))],
              placeholder: "\u8BF7\u9009\u62E9\u9700\u8981\u89C4\u8303\u5316\u7684\u5B57\u6BB5",
            }),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "form-item" },
            /*#__PURE__*/ React.createElement(
              "label",
              { className: "form-label" },
              "\u8F93\u51FA\u5217\u540D",
            ),
            /*#__PURE__*/ React.createElement("input", {
              type: "text",
              className: "input",
              value: step.config.targetColumn || "normalized_value",
              onChange: (e) => updateStepConfig(step.id, "targetColumn", e.target.value),
              placeholder: "normalized_value",
            }),
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "filter-header-bar" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "filter-header-title" },
              /*#__PURE__*/ React.createElement("span", { className: "filter-header-icon" }, "📋"),
              "转换规则列表",
            ),
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "filter-header-count" },
              `${(step.config.rules || []).length} 条规则`,
            ),
          ),
          (step.config.rules || []).map((rule, idx) => /*#__PURE__*/ React.createElement(
            "div",
            {
              key: idx,
              className: "step-info-box",
              style: { marginBottom: 10 },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-content" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "grid-2" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "form-label" },
                    "匹配方式",
                  ),
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: rule.matchType || "regex",
                    onChange: (val) => {
                      const rules = [...(step.config.rules || [])];
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
                    placeholder: "\u8BF7\u9009\u62E9\u5339\u914D\u65B9\u5F0F",
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "form-label" },
                    "匹配模式",
                  ),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: rule.pattern || "",
                    onChange: (e) => {
                      const rules = [...(step.config.rules || [])];
                      rules[idx] = { ...rules[idx], pattern: e.target.value };
                      updateStepConfig(step.id, "rules", rules);
                    },
                    placeholder: rule.matchType === "regex" ? "\\d+\\.?\\d*" : rule.matchType === "chineseNumber" ? "" : "输入匹配内容",
                    disabled: ["chineseNumber", "percent", "currency", "auto"].includes(rule.matchType),
                  }),
                ),
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
                    "转换方式",
                  ),
                  /*#__PURE__*/ React.createElement(SearchableSelect, {
                    value: rule.convertType || "extractNumber",
                    onChange: (val) => {
                      const rules = [...(step.config.rules || [])];
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
                    placeholder: "\u8BF7\u9009\u62E9\u8F6C\u6362\u65B9\u5F0F",
                  }),
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "form-item" },
                  /*#__PURE__*/ React.createElement(
                    "label",
                    { className: "form-label" },
                    "转换参数",
                  ),
                  /*#__PURE__*/ React.createElement("input", {
                    type: "text",
                    className: "input",
                    value: rule.convertParam || "",
                    onChange: (e) => {
                      const rules = [...(step.config.rules || [])];
                      rules[idx] = { ...rules[idx], convertParam: e.target.value };
                      updateStepConfig(step.id, "rules", rules);
                    },
                    placeholder: rule.convertType === "multiply" || rule.convertType === "divide" ? "输入系数" : rule.convertType === "mapTo" ? "输入目标值" : "",
                    disabled: ["extractNumber", "chineseToNumber", "percentToNumber", "currencyToNumber"].includes(rule.convertType),
                  }),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "form-item" },
                /*#__PURE__*/ React.createElement(
                  "label",
                  { className: "form-label" },
                  "示例",
                ),
                /*#__PURE__*/ React.createElement("input", {
                  type: "text",
                  className: "input",
                  value: rule.example || "",
                  onChange: (e) => {
                    const rules = [...(step.config.rules || [])];
                    rules[idx] = { ...rules[idx], example: e.target.value };
                    updateStepConfig(step.id, "rules", rules);
                  },
                  placeholder: "输入示例（如：100元 → 100）",
                }),
              ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-info-tip" },
              /*#__PURE__*/ React.createElement(
                "button",
                {
                  className: "btn btn-sm",
                  onClick: () => {
                    const rules = [...(step.config.rules || [])];
                    rules.splice(idx, 1);
                    updateStepConfig(step.id, "rules", rules);
                  },
                  style: { marginLeft: "auto", marginTop: 8 },
                },
                "删除规则",
              ),
            ),
          )),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: "btn btn-primary",
              onClick: () => {
                const rules = [...(step.config.rules || [])];
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
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u652F\u6301\u591A\u79CD\u683C\u5F0F\u7684\u503C\u8F6C\u6362\uFF0C\u5982\u4E2D\u6587\u6570\u5B57\u3001\u6210\u672C\u683C\u5F0F\u3001\u767E\u5206\u6BD4\u3002\u89C4\u5219\u6309\u987A\u5E8F\u5339\u914D\uFF0C\u9047\u5230\u5339\u914D\u540E\u5C31\u4F7F\u7528\u5BF9\u5E94\u8F6C\u6362\u65B9\u5F0F\uFF0C\u4E0D\u518D\u5339\u914D\u540E\u7EE7\u89C4\u5219\u3002",
        ),
      );
    default:
      return /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-config" },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "step-desc" },
          /*#__PURE__*/ React.createElement(Icons.Info, null),
          " \u6B64\u6B65\u9AA4\u7C7B\u578B\u914D\u7F6E\u5F00\u53D1\u4E2D...",
        ),
      );
  }
};

    return renderStepConfig;
  }

  window.StepEditor = {
    MapValueEditor,
    AdvancedRuleConfig,
    createRenderStepConfig,
  };
})();
