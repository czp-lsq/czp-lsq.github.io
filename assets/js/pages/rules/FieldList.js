const FieldList = ({
  fields,
  activeField,
  setActiveField,
  savedRules,
  fieldSearch,
  setFieldSearch,
  fieldFilter,
  setFieldFilter,
  leftCollapsed,
  setLeftCollapsed,
  validateRule,
  categorizeField,
  getFieldCategoryInfo,
  getSemanticIcon,
}) => {
  const categorizedFields = fields.reduce((acc, field) => {
    const cat = categorizeField(field);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(field);
    return acc;
  }, {});

  const categories = ["sales", "cost", "profit", "other"];

  const filteredFields = fields.filter((field) => {
    const matchSearch = !fieldSearch ||
      (field.name || "").toLowerCase().includes(fieldSearch.toLowerCase()) ||
      (field.cell || "").toLowerCase().includes(fieldSearch.toLowerCase());
    if (!matchSearch) return false;
    const steps = savedRules[field.id]?.steps || [];
    const hasConfig = steps.length > 0;
    const validation = validateRule(savedRules[field.id], field);
    switch (fieldFilter) {
      case "done": return hasConfig && validation.valid;
      case "pending": return !hasConfig;
      case "warning": return hasConfig && !validation.valid;
      default: return true;
    }
  });

  const hasRules = (field) => savedRules[field.id]?.steps?.length > 0;
  const getFieldStatus = (field) => {
    if (!hasRules(field)) return "empty";
    const validation = validateRule(savedRules[field.id], field);
    return validation.valid ? "valid" : "invalid";
  };

  const renderFieldItem = (field) => {
    const categoryInfo = getFieldCategoryInfo(categorizeField(field));
    const status = getFieldStatus(field);
    const isActive = activeField?.id === field.id;

    return React.createElement("li", {
      key: field.id,
      className: `rules-page__field-item ${isActive ? "rules-page__field-item--active" : ""} rules-page__field-item--${status}`,
      onClick: () => setActiveField(field),
      title: field.name,
    },
      React.createElement("span", { className: "rules-page__field-item-icon", style: { backgroundColor: categoryInfo.bg, color: categoryInfo.color } },
        getSemanticIcon(field.semanticType, field.type)
      ),
      React.createElement("div", { className: "rules-page__field-item-content" },
        React.createElement("span", { className: "rules-page__field-item-name" }, field.name),
        field.semanticType && React.createElement("span", { className: "rules-page__field-item-type" }, field.semanticType),
        hasRules(field) && React.createElement("span", { className: "rules-page__field-item-badge" },
          `${savedRules[field.id].steps.length} 步`
        )
      )
    );
  };

  if (leftCollapsed) {
    return React.createElement("div", { className: "rules-page__sidebar-collapsed" },
      React.createElement("button", {
        className: "rules-page__sidebar-expand-btn",
        onClick: () => setLeftCollapsed(false),
        title: "展开字段列表",
      },
        React.createElement(Icons.ChevronRight, { size: 16 })
      ),
      React.createElement("div", { className: "rules-page__sidebar-collapsed-categories" },
        categories.map((cat) => {
          const catFields = categorizedFields[cat] || [];
          const catInfo = getFieldCategoryInfo(cat);
          return React.createElement("div", { key: cat, className: "rules-page__sidebar-collapsed-item", title: `${catInfo.name}: ${catFields.length}个字段` },
            React.createElement("span", { className: "rules-page__sidebar-collapsed-icon", style: { backgroundColor: catInfo.bg, color: catInfo.color } },
              catInfo.icon
            ),
            catFields.length > 0 && React.createElement("span", { className: "rules-page__sidebar-collapsed-count" }, catFields.length)
          );
        })
      ),
      React.createElement("div", { className: "rules-page__sidebar-collapsed-total" },
        `${fields.length} 字段`
      )
    );
  }

  return React.createElement("div", { className: "rules-page__sidebar" },
    React.createElement("div", { className: "rules-page__sidebar-header" },
      React.createElement("div", { className: "rules-page__sidebar-title" },
        React.createElement(Icons.List, { size: 16 }),
        React.createElement("span", null, "字段列表"),
        React.createElement("span", { className: "rules-page__sidebar-count" }, fields.length)
      ),
      React.createElement("button", {
        className: "rules-page__sidebar-collapse-btn",
        onClick: () => setLeftCollapsed(true),
        title: "收起字段列表",
      },
        React.createElement(Icons.ChevronLeft, { size: 16 })
      )
    ),
    React.createElement("div", { className: "rules-page__sidebar-search" },
      React.createElement(Icons.Search, { size: 14, className: "rules-page__sidebar-search-icon" }),
      React.createElement("input", {
        type: "text",
        className: "rules-page__sidebar-search-input",
        placeholder: "搜索字段...",
        value: fieldSearch,
        onChange: (e) => setFieldSearch(e.target.value),
      })
    ),
    React.createElement("div", { className: "rules-page__sidebar-stats" },
      React.createElement("span", { className: "rules-page__sidebar-stat" },
        React.createElement(Icons.List, { size: 12 }),
        `共 ${fields.length} 个字段`
      ),
      React.createElement("span", { className: "rules-page__sidebar-stat" },
        React.createElement(Icons.CheckCircle, { size: 12 }),
        `${Object.values(savedRules).filter((r) => r.steps?.length > 0).length} 已配置`
      )
    ),
    React.createElement("div", { className: "rules-page__sidebar-content" },
      categories.map((cat) => {
        const catFields = categorizedFields[cat] || [];
        if (catFields.length === 0) return null;
        const catInfo = getFieldCategoryInfo(cat);
        const filteredCatFields = catFields.filter((f) => {
          if (!fieldSearch) return true;
          const search = fieldSearch.toLowerCase();
          return (f.name || "").toLowerCase().includes(search);
        });
        if (filteredCatFields.length === 0) return null;

        return React.createElement("div", { key: cat, className: "rules-page__field-group" },
          React.createElement("div", { className: "rules-page__field-group-header" },
            React.createElement("span", { className: "rules-page__field-group-icon", style: { backgroundColor: catInfo.bg, color: catInfo.color } },
              catInfo.icon
            ),
            React.createElement("span", { className: "rules-page__field-group-name" }, catInfo.name),
            React.createElement("span", { className: "rules-page__field-group-count" }, filteredCatFields.length)
          ),
          React.createElement("ul", { className: "rules-page__field-list" },
            filteredCatFields.sort((a, b) => {
              const statusA = getFieldStatus(a);
              const statusB = getFieldStatus(b);
              const statusOrder = { valid: 0, invalid: 1, empty: 2 };
              if (statusOrder[statusA] !== statusOrder[statusB]) {
                return statusOrder[statusA] - statusOrder[statusB];
              }
              return (a.name || "").localeCompare(b.name || "", "zh-CN");
            }).map(renderFieldItem)
          )
        );
      })
    ),
    filteredFields.length === 0 && fields.length > 0 && React.createElement("div", { className: "rules-page__sidebar-empty" },
      React.createElement(Icons.Search, { size: 24, style: { color: "var(--color-text-tertiary)" } }),
      React.createElement("div", { className: "rules-page__sidebar-empty-title" }, "未找到匹配字段"),
      React.createElement("div", { className: "rules-page__sidebar-empty-desc" }, "尝试使用其他关键词搜索")
    ),
    fields.length === 0 && React.createElement("div", { className: "rules-page__sidebar-empty" },
      React.createElement(Icons.FileText, { size: 24, style: { color: "var(--color-text-tertiary)" } }),
      React.createElement("div", { className: "rules-page__sidebar-empty-title" }, "暂无字段"),
      React.createElement("div", { className: "rules-page__sidebar-empty-desc" }, "请先上传模板文件")
    )
  );
};

window.FieldList = FieldList;
