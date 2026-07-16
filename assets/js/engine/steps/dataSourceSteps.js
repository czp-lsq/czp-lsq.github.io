const DataSourceSteps = {
  fill(step, data, dataDate, context) {
    const cfg = step.config || {};
    let fillValue = "";
    if (cfg.fillType === "manual") {
      fillValue = String(cfg.value ?? "");
    } else if (cfg.fillType === "date" || cfg.fillType === "dateNow") {
      let targetDate;
      if (cfg.fillType === "dateNow") {
        const now = new Date();
        targetDate = {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        };
      } else {
        targetDate = dataDate;
      }
      const y = targetDate.year;
      const m = String(targetDate.month).padStart(2, "0");
      const d = targetDate.day
        ? String(targetDate.day).padStart(2, "0")
        : "01";
      switch (cfg.dateFormat) {
        case "yyyy":
          fillValue = String(y);
          break;
        case "mm":
          fillValue = m;
          break;
        case "dd":
          fillValue = d;
          break;
        case "yyyy-mm":
          fillValue = `${y}年${m}月`;
          break;
        case "yyyy-mm-dd":
          fillValue = `${y}年${m}月${d}日`;
          break;
        case "mm-dd":
          fillValue = `${m}月${d}日`;
          break;
        case "quarter":
          fillValue = `第${Math.ceil(Number(m) / 3)}季度`;
          break;
        case "yyyy-quarter":
          fillValue = `${y}年第${Math.ceil(Number(m) / 3)}季度`;
          break;
        case "week": {
          const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
          const start = new Date(dateObj.getFullYear(), 0, 1);
          const diff = dateObj - start;
          const oneWeek = 1000 * 60 * 60 * 24 * 7;
          const weekNum = Math.ceil(diff / oneWeek);
          fillValue = `第${weekNum}周`;
          break;
        }
        default:
          fillValue = `${y}年${m}月`;
      }
    } else if (cfg.fillType === "field" && cfg.sourceField) {
      if (data.length > 0) {
        fillValue = String(
          data[0][cfg.sourceField] ?? data[0].val ?? "",
        );
      }
    } else if (cfg.fillType === "shop") {
      fillValue = String(cfg.value || context.shopName || "");
    } else if (cfg.fillType === "auto") {
      const y = dataDate.year;
      const m = String(dataDate.month).padStart(2, "0");
      const d = dataDate.day
        ? String(dataDate.day).padStart(2, "0")
        : "01";
      const getQuarter = (month) => Math.ceil(month / 3);
      const getWeekOfYear = (date) => {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.ceil(diff / oneWeek);
      };
      switch (context.fieldSemanticType) {
        case "shop":
          fillValue = String(cfg.value || context.shopName || "");
          break;
        case "year":
          fillValue = String(y);
          break;
        case "month":
          fillValue = m;
          break;
        case "day":
          fillValue = d;
          break;
        case "date":
          fillValue = `${y}年${m}月`;
          break;
        case "quarter":
          fillValue = `第${getQuarter(dataDate.month)}季度`;
          break;
        case "week":
          const dateObj = new Date(y, dataDate.month - 1, dataDate.day || 1);
          fillValue = `第${getWeekOfYear(dateObj)}周`;
          break;
        default:
          fillValue = String(cfg.value ?? "");
      }
    } else {
      fillValue = String(cfg.value ?? "");
    }
    return [{ val: fillValue }];
  },
  source(step, tables) {
    const selectedTables = step.config.tables || [];
    if (selectedTables.length > 0) {
      let allRows = [];
      selectedTables.forEach((tableId) => {
        const table = tables.find((t) => t.id === tableId);
        if (table) {
          if (step.config.column) {
            allRows = [...allRows, ...table.rows.map((r) => ({ val: r[step.config.column] }))];
          } else {
            allRows = [...allRows, ...table.rows.map((r) => ({ ...r }))];
          }
        }
      });
      return allRows;
    } else {
      const table = tables.find((t) => t.id === step.config.table);
      if (table) {
        if (step.config.column) {
          return table.rows.map((r) => ({ val: r[step.config.column] }));
        } else {
          return table.rows.map((r) => ({ ...r }));
        }
      }
    }
    return [];
  },
  union(step, data, tables) {
    const unionTables = step.config.tables || [];
    let allData = [...data];
    unionTables.forEach((tableId) => {
      const table = tables.find((t) => t.id === tableId);
      if (table && table.rows) {
        allData = [...allData, ...table.rows];
      }
    });
    return allData;
  },
};