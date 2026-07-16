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
      className: `field-item ${isActive ? "active" : ""} status-${status}`,
      onClick: () => setActiveField(field),
      title: field.name,
    },
      React.createElement("span", { className: "field-item-icon", style: { backgroundColor: categoryInfo.bg, color: categoryInfo.color } },
        categoryInfo.icon
      ),
      React.createElement("div", { className: "field-item-cell" },
        React.createElement("span", { className: "field-item-name" }, field.name),
        field.semanticType && React.createElement("span", { className: "field-item-meta" }, field.semanticType),
        hasRules(field) && React.createElement("span", { className: "field-item-badge" },
          `${savedRules[field.id].steps.length} 步`
        )
      )
    );
  };

  if (leftCollapsed) {
    return React.createElement("div", { className: "rules-sidebar collapsed" },
      React.createElement("button", {
        className: "sidebar-expand",
        onClick: () => setLeftCollapsed(false),
        title: "展开字段列表",
      },
        React.createElement(Icons.ChevronRight, { size: 16 })
      ),
      React.createElement("div", { className: "sidebar-inner" },
        React.createElement("div", { className: "field-category-collapsed" },
          categories.map((cat) => {
            const catFields = categorizedFields[cat] || [];
            const catInfo = getFieldCategoryInfo(cat);
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
      )
    );
  }

  return React.createElement("div", { className: "rules-sidebar" },
    React.createElement("div", { className: "sidebar-inner" },
      React.createElement("div", { className: "sidebar-header" },
        React.createElement("div", { className: "sidebar-title" },
          React.createElement(Icons.List, { size: 16 }),
          React.createElement("span", null, "字段列表"),
          React.createElement("span", { className: "sidebar-count" }, fields.length)
        ),
        React.createElement("button", {
          className: "sidebar-collapse",
          onClick: () => setLeftCollapsed(true),
          title: "收起字段列表",
        },
          React.createElement(Icons.ChevronLeft, { size: 16 })
        )
      ),
      React.createElement("div", { className: "sidebar-search" },
        React.createElement(Icons.Search, { size: 14, className: "field-search-icon" }),
        React.createElement("input", {
          type: "text",
          className: "sidebar-search-input",
          placeholder: "搜索字段...",
          value: fieldSearch,
          onChange: (e) => setFieldSearch(e.target.value),
        })
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
      React.createElement("div", { className: "field-groups" },
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

          return React.createElement("div", { key: cat, className: "field-group" },
            React.createElement("div", { className: "field-group-header" },
              React.createElement("span", { className: "category-icon", style: { backgroundColor: catInfo.bg, color: catInfo.color } },
                catInfo.icon
              ),
              React.createElement("span", { className: "category-name" }, catInfo.name),
              React.createElement("span", { className: "field-group-count" }, filteredCatFields.length)
            ),
            React.createElement("ul", { className: "field-items" },
              filteredCatFields.map(renderFieldItem)
            )
          );
        })
      ),
      filteredFields.length === 0 && fields.length > 0 && React.createElement("div", { className: "sidebar-empty" },
        React.createElement(Icons.Search, { size: 24, style: { color: "var(--color-text-tertiary)" } }),
        React.createElement("div", { className: "sidebar-empty-title" }, "未找到匹配字段"),
        React.createElement("div", { className: "sidebar-empty-desc" }, "尝试使用其他关键词搜索")
      ),
      fields.length === 0 && React.createElement("div", { className: "sidebar-empty" },
        React.createElement(Icons.FileText, { size: 24, style: { color: "var(--color-text-tertiary)" } }),
        React.createElement("div", { className: "sidebar-empty-title" }, "暂无字段"),
        React.createElement("div", { className: "sidebar-empty-desc" }, "请先上传模板文件")
      )
    )
  );
};

window.FieldList = FieldList;
