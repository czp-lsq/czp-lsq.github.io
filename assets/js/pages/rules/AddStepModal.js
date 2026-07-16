window.AddStepModal = ({
  showAddStepModal,
  setShowAddStepModal,
  stepSearchKeyword,
  setStepSearchKeyword,
  stepCategory,
  setStepCategory,
  hoveredStepType,
  setHoveredStepType,
  addStep,
  getStepTypeInfo,
  getStepTypePreview,
  currentRule,
  state,
  activeField,
  currentPlatform,
}) => {
  if (!showAddStepModal) return null;
  return /*#__PURE__*/ React.createElement(
    Modal,
    {
      title: "\u6DFB\u52A0\u8BA1\u7B97\u6B65\u9AA4",
      width: "900px",
      onClose: () => { setShowAddStepModal(false); setHoveredStepType(null); },
      footer: /*#__PURE__*/ React.createElement(
        Button,
        { onClick: () => setShowAddStepModal(false) },
        "\u53D6\u6D88",
      ),
    },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "step-type-modal" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-type-search" },
        /*#__PURE__*/ React.createElement(Icons.Search, null),
        /*#__PURE__*/ React.createElement(
          "input",
          {
            type: "text",
            className: "step-type-search-input",
            placeholder: "搜索计算步骤类型...",
            value: stepSearchKeyword,
            onChange: (e) => setStepSearchKeyword(e.target.value),
          },
        ),
      ),
      (() => {
        // 智能推荐步骤 - 基于已有步骤和数据列特征
        const steps = currentRule?.steps || [];
        const hasSource = steps.some((s) => s.type === "source");
        const hasFilter = steps.some((s) => s.type === "filter");
        const hasVirtual = steps.some((s) => s.type === "virtual");
        const hasJoin = steps.some((s) => s.type === "join");
        const hasFormula = steps.some((s) => s.type === "formula");
        const hasAggregate = steps.some((s) => s.type === "aggregate");
        const hasSort = steps.some((s) => s.type === "sort");
        const hasLimit = steps.some((s) => s.type === "limit");
        // 收集所有可用列名（样本表 + 已选源表 + 虚拟字段生成列）
        const samples = state.samples[currentPlatform] || [];
        const sampleHeaders = new Set();
        samples.forEach((s) => {
          const sheet = s.sheets[Object.keys(s.sheets)[0]];
          (sheet?.headers || []).forEach((h) => sampleHeaders.add(h));
        });
        const sourceStep = steps.find((s) => s.type === "source");
        const sourceTableIds = sourceStep?.config?.tables || [];
        const sourceHeaders = new Set(sampleHeaders);
        if (sourceTableIds.length > 0) {
          sourceTableIds.forEach((tid) => {
            const t = samples.find((s) => s.id === tid);
            const sheet = t?.sheets[Object.keys(t?.sheets || {})[0]];
            (sheet?.headers || []).forEach((h) => sourceHeaders.add(h));
          });
        }
        // 加入虚拟字段生成的列
        steps.filter((s) => s.type === "virtual").forEach((s) => {
          (s.config.target || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => sourceHeaders.add(t));
        });
        const headers = Array.from(sourceHeaders).map((h) => h.toLowerCase());
        const hasCol = (keys) => headers.some((h) => keys.some((k) => h.includes(k)));
        const externals = state.externals || [];
        const hasCostTable = externals.length > 0;
        const recommendations = [];
        const addRec = (type, reason, priority = 0) => {
          if (!recommendations.some((r) => r.type === type)) {
            recommendations.push({ type, reason, priority });
          }
        };
        // 根据字段语义判断是否需要数据源
        const semanticType = activeField?.semanticType || "";
        const isFillField = ["shop", "year", "month", "day", "date", "text"].includes(semanticType);
        const isValueField = semanticType === "value";
        // 判断当前规则是否依赖外部数据（公式/常量/文本等纯计算不依赖）
        const dataDependentTypes = ["source", "filter", "aggregate", "join", "group", "union", "limit", "sort", "crossMatch", "keepDuplicate", "keepUnique", "intersect", "lookup", "runningTotal", "percentOfTotal", "movingAverage", "binning", "conditionalTag", "stringExtract", "fillNA", "normalize", "valueNormalize"];
        const needsDataSource = steps.some((s) => dataDependentTypes.includes(s.type));
        const hasPureCompute = steps.some((s) => ["formula", "constant", "text", "math", "ratio", "diff", "round", "concat", "substring", "date", "condition", "rank"].includes(s.type));
        if (isFillField) {
          // 填充类型字段优先推荐填充步骤，不提示选择数据源
          const hasFill = steps.some((s) => s.type === "fill");
          if (!hasFill) {
            addRec("fill", `该字段为${semanticType === "shop" ? "店铺名" : semanticType.includes("date") || semanticType === "year" || semanticType === "month" || semanticType === "day" ? "日期" : "文本"}占位符，建议添加填充步骤`, 100);
          }
        } else if (!needsDataSource && !hasPureCompute) {
          // 数值字段且尚未配置任何计算步骤时，才提示选择数据源
          addRec("source", "首先需要选择数据源", 100);
        }
        // 数据列特征识别（仅对需要数据操作的字段推荐）
        if ((hasSource || needsDataSource) && !isFillField) {
          // 合并已选源表和外部表的列，提升识别准确性
          const sourceStep = steps.find((s) => s.type === "source");
          const sourceTableIds = sourceStep?.config?.tables || [];
          sourceTableIds.forEach((tid) => {
            const t = samples.find((s) => s.id === tid);
            const sheet = t?.sheets[Object.keys(t?.sheets || {})[0]];
            (sheet?.headers || []).forEach((h) => sourceHeaders.add(h));
          });
          (state.externals || []).forEach((e) => {
            (e.headers || []).forEach((h) => sourceHeaders.add(h));
          });
          const headers = Array.from(sourceHeaders).map((h) => h.toLowerCase());
          const hasCol = (keys) => headers.some((h) => keys.some((k) => h.includes(k)));
          const hasSpec = hasCol(["规格", "型号", "商品规格", "款式"]);
          const hasSku = hasCol(["款号", "sku", "商品编码", "货号"]);
          const hasSize = hasCol(["尺码", "size", "码数"]);
          const hasPieces = hasCol(["条数", "件数", "数量", "购买数量"]);
          const hasCost = hasCol(["成本", "cost", "单价", "价格"]);
          const hasAmount = hasCol(["金额", "销售额", "实付", "总价", "收入"]);
          const hasShop = hasCol(["店铺", "来源", "渠道", "门店"]);
          const hasDate = hasCol(["日期", "时间", "下单", "创建"]);
          const hasRefund = hasCol(["退款", "退货", "售后"]);
          // 虚拟字段：有规格列且未提取条数/尺码
          if (hasSpec && !hasVirtual) {
            addRec("virtual", "检测到规格列，建议提取条数和尺码", 90);
          } else if (!hasSize && hasSpec && hasVirtual) {
            addRec("virtual", "建议添加尺码识别虚拟字段", 85);
          } else if (!hasPieces && hasSpec && hasVirtual) {
            addRec("virtual", "建议添加条数识别虚拟字段", 85);
          }
          // 跨表关联：有款号+尺码/规格+全局成本表
          if (hasSku && (hasSize || hasSpec) && hasCostTable && !hasJoin) {
            addRec("join", "检测到款号与全局成本表，建议关联匹配单件成本", 80);
          }
          // 公式计算：有条数和成本，且目标是数值字段
          if (isValueField && (hasPieces || hasVirtual) && (hasCost || hasJoin) && !hasFormula) {
            addRec("formula", "建议用公式计算金额（数量×单价）", 75);
          }
          // 聚合：数值字段且检测到金额/数量列，且前面没有公式
          if (isValueField && (hasAmount || hasCost || hasPieces) && !hasAggregate && !hasFormula) {
            addRec("aggregate", `检测到${hasAmount || hasCost ? "金额" : "数量"}列，建议聚合汇总数据`, 70);
          }
          // 筛选
          if (hasShop && !hasFilter) {
            addRec("filter", "检测到店铺/来源列，建议按店铺筛选数据", 60);
          } else if (hasRefund && !hasFilter) {
            addRec("filter", "检测到退款列，建议过滤退款订单", 60);
          } else if (!hasFilter && steps.length >= 2 && isValueField) {
            addRec("filter", "建议添加筛选条件过滤数据", 50);
          }
          // 排序
          if (hasDate && !hasSort) {
            addRec("sort", "检测到日期列，建议按时间排序", 45);
          }
          // 限制
          if (!hasLimit && steps.length >= 3) {
            addRec("limit", "步骤较多，建议限制输出条数便于预览", 30);
          }
        }
        if (recommendations.length === 0) return null;
        recommendations.sort((a, b) => b.priority - a.priority);
        return /*#__PURE__*/ React.createElement(
          "div",
          { style: { marginBottom: "16px", padding: "12px 16px", background: "var(--color-primary-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-primary-100)" } },
          /*#__PURE__*/ React.createElement(
            "div",
            { style: { fontSize: "13px", fontWeight: 700, color: "var(--color-primary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" } },
            /*#__PURE__*/ React.createElement(Icons.Lightbulb, { size: 16 }),
            "智能推荐",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
            recommendations.slice(0, 3).map((rec) => {
              const info = getStepTypeInfo(rec.type);
              return /*#__PURE__*/ React.createElement(
                "button",
                {
                  key: rec.type,
                  className: "quick-tag",
                  style: { cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", flexShrink: 0 },
                  onClick: () => { addStep(rec.type); setShowAddStepModal(false); setHoveredStepType(null); },
                },
                /*#__PURE__*/ React.createElement("span", { style: { fontSize: "14px", display: "inline-flex", flexShrink: 0 } }, info.icon),
                /*#__PURE__*/ React.createElement("span", { style: { whiteSpace: "nowrap" } }, info.name),
                /*#__PURE__*/ React.createElement("span", { style: { fontSize: "11px", color: "var(--color-text-tertiary)", marginLeft: "4px", whiteSpace: "nowrap" } }, rec.reason),
              );
            }),
          ),
        );
      })(),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "step-type-categories" },
        [
          { id: "all", name: "全部", icon: Icons.LayoutGrid },
          { id: "input", name: "数据输入", icon: Icons.FileText },
          { id: "filter", name: "数据筛选", icon: Icons.Filter },
          { id: "transform", name: "数据转换", icon: Icons.ArrowRightLeft },
          { id: "compute", name: "计算聚合", icon: Icons.Calculator },
          { id: "join", name: "跨表关联", icon: Icons.Link },
        ].map((cat) => /*#__PURE__*/ React.createElement(
          "button",
          {
            key: cat.id,
            className: "step-type-category-tab" + (stepCategory === cat.id ? " active" : ""),
            onClick: () => setStepCategory(cat.id),
          },
          /*#__PURE__*/ React.createElement(cat.icon, { size: 14 }),
          cat.name,
        )),
      ),
      [
        {
          id: "input",
          title: "\uD83D\uDCE5 \u6570\u636E\u8F93\u5165",
          desc: "\u5B9A\u4E49\u6570\u636E\u6765\u6E90\u548C\u57FA\u7840\u586B\u5145",
          types: ["source", "fill", "constant"],
          color: "var(--color-primary)",
        },
        {
          id: "filter",
          title: "\uD83D\uDD0D \u6570\u636E\u7B5B\u9009",
          desc: "\u8FC7\u6EE4\u3001\u53BB\u91CD\u3001\u9650\u5236\u6570\u636E\u8303\u56F4",
          types: ["filter", "filterEqual", "filterContain", "filterRange", "topN", "distinct", "condition", "limit", "keepDuplicate", "keepUnique"],
          color: "var(--color-warning)",
        },
        {
          id: "transform",
          title: "\uD83D\uDD04 \u6570\u636E\u8F6C\u6362",
          desc: "\u8F6C\u6362\u3001\u66FF\u6362\u3001\u6392\u5E8F\u3001\u65E5\u671F\u5904\u7406\u3001\u7A7A\u503C\u5904\u7406",
          types: ["virtual", "lookup", "sort", "text", "round", "concat", "substring", "date", "stringExtract", "fillNA", "binning", "conditionalTag", "jsonExtract", "regexReplace", "trim", "upperCase", "lowerCase", "dateAdd"],
          color: "var(--color-info)",
        },
        {
          id: "compute",
          title: "\uD83E\uDDEA \u8BA1\u7B97\u805A\u5408",
          desc: "\u6C42\u548C\u3001\u5E73\u5747\u3001\u516C\u5F0F\u3001\u6392\u540D\u3001\u6BD4\u7387\u3001\u7D2F\u8BA1\u3001\u5360\u6BD4",
          types: ["aggregate", "group", "formula", "math", "rank", "diff", "ratio", "runningTotal", "percentOfTotal", "movingAverage", "normalize", "cumulativeMax", "cumulativeMin", "lag", "lead", "percentRank", "rankDense", "rankRowNumber", "windowSum", "windowAvg", "dateDiff"],
          color: "var(--color-success)",
        },
        {
          id: "join",
          title: "\uD83D\uDD17 \u8DE8\u8868\u5173\u8054",
          desc: "\u5173\u8054\u5168\u5C40\u6570\u636E\u8868\u3001\u5408\u5E76\u6570\u636E\u3001\u8DE8\u8868\u4EA4\u96C6/\u53BB\u91CD",
          types: ["join", "union", "crossMatch", "intersect"],
          color: "var(--color-accent)",
        },
      ].filter((group) => stepCategory === "all" || group.id === stepCategory).map((group) => {
        const filteredTypes = group.types.filter((type) => {
          const info = getStepTypeInfo(type);
          return info.name.toLowerCase().includes(stepSearchKeyword.toLowerCase()) ||
            info.desc.toLowerCase().includes(stepSearchKeyword.toLowerCase());
        });
        if (filteredTypes.length === 0) return null;
        return /*#__PURE__*/ React.createElement(
          "div",
          { key: group.id, className: "step-type-group" },
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-type-group-header" },
            /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-type-group-info" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-group-title-row" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "step-type-group-dot",
                    style: { background: group.color },
                  },
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-group-title" },
                  group.title,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "step-type-group-count",
                    style: { color: group.color, background: group.color + "15" },
                  },
                  filteredTypes.length + " 种",
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-group-desc" },
                group.desc,
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "step-type-grid" },
            filteredTypes.map((type) => {
              const info = getStepTypeInfo(type);
              return /*#__PURE__*/ React.createElement(
                "button",
                {
                  key: type,
                  className: `step-type-card ${hoveredStepType === type ? "previewing" : ""}`,
                  onClick: () => { addStep(type); setHoveredStepType(null); },
                  onMouseEnter: () => setHoveredStepType(type),
                  onMouseLeave: () => setHoveredStepType((cur) => (cur === type ? null : cur)),
                  onFocus: () => setHoveredStepType(type),
                  onBlur: () => setHoveredStepType((cur) => (cur === type ? null : cur)),
                  title: info.desc,
                },
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "step-type-card-icon",
                    style: { color: info.color, background: info.bg },
                  },
                  info.icon,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-card-name" },
                  info.name,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-card-desc" },
                  info.desc,
                ),
              );
            }),
          ),
          hoveredStepType && (() => {
            const pInfo = getStepTypeInfo(hoveredStepType);
            const pPrev = getStepTypePreview(hoveredStepType);
            return /*#__PURE__*/ React.createElement(
              "div",
              { className: "step-type-preview-panel" },
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-preview-header" },
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-preview-icon", style: { color: pInfo.color, background: pInfo.bg } },
                  pInfo.icon,
                ),
                /*#__PURE__*/ React.createElement(
                  "div",
                  { className: "step-type-preview-titles" },
                  /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-name" }, pInfo.name),
                  /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-desc" }, pInfo.desc),
                ),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-preview-section" },
                /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-label" }, "💡 适用场景"),
                /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-value" }, pPrev.scenario),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-preview-section" },
                /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-label" }, "📌 典型示例"),
                /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-example" }, pPrev.example),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-preview-section" },
                /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-label" }, "⚙️ 配置要点"),
                /*#__PURE__*/ React.createElement("div", { className: "step-type-preview-value" }, pPrev.config),
              ),
              /*#__PURE__*/ React.createElement(
                "div",
                { className: "step-type-preview-footer" },
                "点击卡片即可添加此步骤",
              ),
            );
          })(),
        );
      }),
    ),
  );
};
