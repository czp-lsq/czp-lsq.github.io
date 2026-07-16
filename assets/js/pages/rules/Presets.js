// Presets.js - 预设规则相关功能模块
(function() {
  const Presets = {};

  Presets.recommendPreset = function(field, currentPlatform) {
    if (!field) return null;
    const fieldName = typeof field === "string" ? field : field.name;
    if (!fieldName) return null;
    const n = fieldName.toLowerCase();
    const semanticType = (typeof field === "object" && field.semanticType) || "";
    const allPresets = CalcEngine.getPresetTemplates();
    const list = [
      ...(allPresets[currentPlatform] || []),
      ...(allPresets.all || []),
    ];
    const score = list.map((p) => {
      let s = 0;
      const pn = p.name.toLowerCase();
      const pd = (p.desc || "").toLowerCase();
      if (
        n.includes("销售") ||
        n.includes("收入") ||
        n.includes("实收") ||
        n.includes("gmv") ||
        n.includes("营业额")
      ) {
        if (p.category === "sales") s += 12;
        if (pd.includes("销售") || pd.includes("收入")) s += 4;
      }
      if (
        n.includes("成本") ||
        n.includes("扣点") ||
        n.includes("费用") ||
        n.includes("退款") ||
        n.includes("推广") ||
        n.includes("佣金")
      ) {
        if (p.category === "cost") s += 12;
        if (pd.includes("成本") || pd.includes("费用")) s += 4;
      }
      if (
        n.includes("利润") ||
        n.includes("净利") ||
        n.includes("roi") ||
        n.includes("毛利")
      ) {
        if (p.category === "profit") s += 12;
        if (pd.includes("利润")) s += 4;
      }
      if (["shop", "year", "month", "day", "date", "text"].includes(semanticType)) {
        s -= 20;
      }
      const pnTail = pn.split("·").pop().toLowerCase();
      if (pn.includes(n) || n.includes(pnTail) || pnTail.includes(n)) s += 8;
      const pKeywords = [p.category, p.name, p.desc].filter(Boolean).join(" ");
      const fieldKeywords = n.split(/[^\u4e00-\u9fa5a-z0-9]+/);
      fieldKeywords.forEach((kw) => {
        if (kw.length >= 2 && pKeywords.toLowerCase().includes(kw)) s += 2;
      });
      return { p, s };
    });
    score.sort((a, b) => b.s - a.s);
    return score[0]?.s > 0 ? score[0].p : null;
  };

  Presets.applyPreset = function(preset, activeField, currentPlatform, addToast) {
    if (!activeField) return;
    Store.set((s) => {
      const platformRules = s.rules[currentPlatform] || {};
      const fieldRule = platformRules[activeField.id] || {};
      return {
        ...s,
        rules: {
          ...s.rules,
          [currentPlatform]: {
            ...platformRules,
            [activeField.id]: {
              ...fieldRule,
              steps: preset.steps.map((st, i) => ({
                ...st,
                id: `step_${Date.now()}_${i}`,
              })),
            },
          },
        },
      };
    });
    addToast("success", "套用模板", `已应用「${preset.name}」模板`);
  };

  Presets.renderPresetGrid = function(activeField, presetCategory, setPresetCategory, currentPlatform, getCategoryInfo, addToast) {
    const allPresets = CalcEngine.getPresetTemplates();
    const platformPresets = allPresets[presetCategory] || allPresets.all || [];
    const categoryKeys = ["all", "pdd", "taobao", "douyin"];
    const platformNames = {
      all: "通用",
      pdd: "拼多多",
      taobao: "淘宝",
      douyin: "抖音",
    };
    const recommend = activeField ? Presets.recommendPreset(activeField, currentPlatform) : null;
    return /*#__PURE__*/ React.createElement(
      React.Fragment,
      null,
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preset-tabs" },
        categoryKeys.map((key) => {
          const count = (allPresets[key] || []).length;
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              key: key,
              className: `preset-tab ${presetCategory === key ? "active" : ""}`,
              onClick: () => setPresetCategory(key),
            },
            platformNames[key],
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "preset-tab-count" },
              count,
            ),
          );
        }),
      ),
      recommend &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "preset-recommend" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "preset-recommend-tag" },
            /*#__PURE__*/ React.createElement(Icons.Sparkles, null),
            " 智能推荐",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "preset-recommend-content" },
            /*#__PURE__*/ React.createElement(
              "div",
              null,
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "preset-recommend-name" },
                recommend.name,
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "preset-recommend-desc" },
                recommend.desc,
              ),
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              {
                type: "primary",
                size: "sm",
                onClick: () => Presets.applyPreset(recommend, activeField, currentPlatform, addToast),
              },
              "一键应用",
            ),
          ),
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "preset-grid" },
        platformPresets.map((preset) => {
          const catInfo = getCategoryInfo(preset.category);
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              key: preset.id,
              className: "preset-card",
              onClick: () => Presets.applyPreset(preset, activeField, currentPlatform, addToast),
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-header" },
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  className: "preset-card-category",
                  style: { color: catInfo.color },
                },
                catInfo.icon,
                " ",
                catInfo.name,
              ),
              preset.level !== undefined &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  { className: `preset-card-level level-${preset.level}` },
                  "L",
                  preset.level,
                ),
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-title" },
              preset.name,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-desc" },
              preset.desc,
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "preset-card-steps" },
              preset.steps.length,
              " 个步骤",
            ),
          );
        }),
        platformPresets.length === 0 &&
          /*#__PURE__*/ React.createElement(
            "div",
            {
              className: "empty",
              style: { gridColumn: "1 / -1", padding: "30px 20px" },
            },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "empty-icon" },
              "📋",
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "empty-text" },
              "该分类暂无模板",
            ),
          ),
      ),
    );
  };

  window.Presets = Presets;
})();
