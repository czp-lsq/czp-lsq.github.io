const FieldList = ({
  fields,
  activeField,
  setActiveField,
  savedRules,
  fieldSearch,
  setFieldSearch,
  leftCollapsed,
  setLeftCollapsed,
}) => {
  const categorizedFields = fields.reduce((acc, field) => {
    const cat = window.RulesUtils.categorizeField(field);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(field);
    return acc;
  }, {});

  const categories = ["sales", "cost", "profit", "other"];

  const filteredFields = fields.filter((field) => {
    if (!fieldSearch) return true;
    const search = fieldSearch.toLowerCase();
    return (field.name || "").toLowerCase().includes(search) ||
           (field.semanticType || "").toLowerCase().includes(search);
  });

  const hasRules = (field) => savedRules[field.id]?.steps?.length > 0;
  const getFieldStatus = (field) => {
    if (!hasRules(field)) return "empty";
    const validation = window.RulesUtils.validateRule(savedRules[field.id], field);
    return validation.valid ? "valid" : "invalid";
  };

  const renderFieldItem = (field) => {
    const categoryInfo = window.RulesUtils.getFieldCategoryInfo(window.RulesUtils.categorizeField(field));
    const status = getFieldStatus(field);
    const isActive = activeField?.id === field.id;

    return React.createElement("div", {
      key: field.id,
      className: `field-item ${isActive ? "active" : ""} ${status}`,
      onClick: () => setActiveField(field),
      title: field.name,
    },
      React.createElement("div", { className: "field-item-header" },
        React.createElement("span", { className: "field-category-icon", style: { backgroundColor: categoryInfo.bg, color: categoryInfo.color } },
          categoryInfo.icon
        ),
        React.createElement("span", { className: "field-item-name" }, field.name),
        hasRules(field) && React.createElement("span", { className: `field-item-status ${status}` },
          status === "valid" && React.createElement(Icons.CheckCircle, { size: 12 }),
          status === "invalid" && React.createElement(Icons.AlertCircle, { size: 12 }),
          status === "empty" && null
        )
      ),
      field.semanticType && React.createElement("div", { className: "field-item-type" },
        field.semanticType === "shop" && "🏪 店铺",
        field.semanticType === "year" && "📅 年份",
        field.semanticType === "month" && "📅 月份",
        field.semanticType === "day" && "📅 日期",
        field.semanticType === "date" && "📅 日期",
        field.semanticType === "text" && "📝 文本",
        field.semanticType === "value" && "💰 数值",
        field.semanticType && !["shop", "year", "month", "day", "date", "text", "value"].includes(field.semanticType) &&
          React.createElement("span", null, field.semanticType)
      ),
      hasRules(field) && React.createElement("div", { className: "field-item-steps" },
        `${savedRules[field.id].steps.length} 个步骤`
      )
    );
  };

  if (leftCollapsed) {
    return React.createElement("div", { className: "rules-left rules-left-collapsed" },
      React.createElement("button", {
        className: "left-toggle-btn",
        onClick: () => setLeftCollapsed(false),
        title: "展开字段列表",
      },
        React.createElement(Icons.ChevronRight, { size: 16 })
      ),
      React.createElement("div", { className: "field-category-collapsed" },
        categories.map((cat) => {
          const catFields = categorizedFields[cat] || [];
          const catInfo = window.RulesUtils.getFieldCategoryInfo(cat);
          return React.createElement("div", { key: cat, className: "category-collapsed-item", title: `${catInfo.name}: ${catFields.length}个字段` },
            React.createElement("span", { className: "category-collapsed-icon", style: { backgroundColor: catInfo.bg, color: catInfo.color } },
              catInfo.icon
            ),
            catFields.length > 0 && React.createElement("span", { className: "category-collapsed-count" }, catFields.length)
          );
        })
      ),
      React.createElement("div", { className: "field-count-collapsed" },
        `${fields.length} 字段`
      )
    );
  }

  return React.createElement("div", { className: "rules-left" },
    React.createElement("div", { className: "left-header" },
      React.createElement("div", { className: "left-header-title" },
        React.createElement(Icons.List, { size: 16 }),
        "字段列表"
      ),
      React.createElement("button", {
        className: "left-toggle-btn",
        onClick: () => setLeftCollapsed(true),
        title: "收起字段列表",
      },
        React.createElement(Icons.ChevronLeft, { size: 16 })
      )
    ),
    React.createElement("div", { className: "field-search-box" },
      React.createElement("input", {
        type: "text",
        className: "input field-search-input",
        placeholder: "搜索字段...",
        value: fieldSearch,
        onChange: (e) => setFieldSearch(e.target.value),
      }),
      React.createElement(Icons.Search, { size: 14, className: "field-search-icon" })
    ),
    React.createElement("div", { className: "field-stats-row" },
      React.createElement("span", { className: "field-stat-item" },
        React.createElement(Icons.List, { size: 12 }),
        `共 ${fields.length} 个字段`
      ),
      React.createElement("span", { className: "field-stat-item" },
        React.createElement(Icons.CheckCircle, { size: 12 }),
        `${Object.values(savedRules).filter((r) => r.steps?.length > 0).length} 已配置`
      )
    ),
    React.createElement("div", { className: "field-categories" },
      categories.map((cat) => {
        const catFields = categorizedFields[cat] || [];
        if (catFields.length === 0) return null;
        const catInfo = window.RulesUtils.getFieldCategoryInfo(cat);
        const filteredCatFields = catFields.filter((f) => {
          if (!fieldSearch) return true;
          const search = fieldSearch.toLowerCase();
          return (f.name || "").toLowerCase().includes(search);
        });
        if (filteredCatFields.length === 0) return null;

        return React.createElement("div", { key: cat, className: "field-category" },
          React.createElement("div", { className: "category-header" },
            React.createElement("span", { className: "category-icon", style: { backgroundColor: catInfo.bg, color: catInfo.color } },
              catInfo.icon
            ),
            React.createElement("span", { className: "category-name" }, catInfo.name),
            React.createElement("span", { className: "category-count" }, filteredCatFields.length)
          ),
          React.createElement("div", { className: "category-fields" },
            filteredCatFields.map(renderFieldItem)
          )
        );
      })
    ),
    filteredFields.length === 0 && fields.length > 0 && React.createElement("div", { className: "field-empty-state" },
      React.createElement(Icons.Search, { size: 24, style: { color: "var(--color-text-tertiary)" } }),
      React.createElement("div", { className: "field-empty-title" }, "未找到匹配字段"),
      React.createElement("div", { className: "field-empty-desc" }, "尝试使用其他关键词搜索")
    ),
    fields.length === 0 && React.createElement("div", { className: "field-empty-state" },
      React.createElement(Icons.FileText, { size: 24, style: { color: "var(--color-text-tertiary)" } }),
      React.createElement("div", { className: "field-empty-title" }, "暂无字段"),
      React.createElement("div", { className: "field-empty-desc" }, "请先上传模板文件")
    )
  );
};

window.FieldList = FieldList;
