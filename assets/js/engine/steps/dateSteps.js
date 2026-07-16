const DateSteps = {
  date(step, data) {
    const dateCol = step.config.column || "val";
    const op = step.config.operation || "format";
    const format = step.config.format || "yyyy-mm-dd";
    return data.map((row) => {
      const val = row[dateCol];
      let d;
      if (val instanceof Date) {
        d = val;
      } else {
        const str = String(val || "");
        const match = str.match(/(\d{4})[\-_年\.\/](\d{1,2})[\-_月\.\/](\d{1,2})/);
        if (match) {
          d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        } else {
          d = new Date();
        }
      }
      let result;
      switch (op) {
        case "extractYear":
          result = d.getFullYear();
          break;
        case "extractMonth":
          result = d.getMonth() + 1;
          break;
        case "extractDay":
          result = d.getDate();
          break;
        case "addDays":
          const days = step.config.days || 0;
          d.setDate(d.getDate() + days);
          result = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          break;
        case "format":
        default:
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          result = format.replace("yyyy", y).replace("mm", m).replace("dd", day);
          break;
      }
      return { ...row, val: result };
    });
  },
  dateDiff(step, data) {
    const date1Col = step.config.date1Column || "val";
    const date2Col = step.config.date2Column;
    const diffUnit = step.config.unit || "days";
    const targetCol = step.config.targetColumn || "date_diff";
    return data.map((row) => {
      const parseDate = (val) => {
        if (val instanceof Date) return val;
        const str = String(val || "");
        const match = str.match(/(\d{4})[\-_年\.\/](\d{1,2})[\-_月\.\/](\d{1,2})/);
        if (match) {
          return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }
        return new Date();
      };
      const d1 = parseDate(row[date1Col]);
      const d2 = parseDate(row[date2Col]);
      const diffMs = d1 - d2;
      let result = 0;
      switch (diffUnit) {
        case "days": result = Math.floor(diffMs / (1000 * 60 * 60 * 24)); break;
        case "weeks": result = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)); break;
        case "months": result = (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth()); break;
        case "years": result = d1.getFullYear() - d2.getFullYear(); break;
        default: result = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
      return { ...row, [targetCol]: result };
    });
  },
  dateAdd(step, data) {
    const daCol = step.config.column || "val";
    const daUnit = step.config.unit || "days";
    const daValue = Number(step.config.value) || 0;
    const targetCol = step.config.targetColumn || "date_added";
    return data.map((row) => {
      const val = row[daCol] ?? row.val;
      let d;
      if (val instanceof Date) {
        d = new Date(val);
      } else {
        const str = String(val || "");
        const match = str.match(/(\d{4})[\-_年\.\/](\d{1,2})[\-_月\.\/](\d{1,2})/);
        if (match) {
          d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        } else {
          d = new Date();
        }
      }
      switch (daUnit) {
        case "days": d.setDate(d.getDate() + daValue); break;
        case "weeks": d.setDate(d.getDate() + daValue * 7); break;
        case "months": d.setMonth(d.getMonth() + daValue); break;
        case "years": d.setFullYear(d.getFullYear() + daValue); break;
        case "hours": d.setHours(d.getHours() + daValue); break;
        case "minutes": d.setMinutes(d.getMinutes() + daValue); break;
      }
      return { ...row, [targetCol]: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` };
    });
  },
};