// rules/components/ruleEditors.js - 规则配置编辑器组件
// 包含：MapValueEditor（映射值编辑器）、AdvancedRuleConfig（高级规则配置）

(function() {
  const { useEffect, useState, useMemo, useCallback, useRef } = React;

  // ==================== MapValueEditor - 映射值编辑器组件 ====================
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

  // ==================== AdvancedRuleConfig - 高级规则配置组件 ====================
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

  // ==================== 暴露到全局 ====================
  window.RuleEditors = {
    MapValueEditor,
    AdvancedRuleConfig,
  };
})();
