const FilterSteps = {
  filter(step, data) {
    if (!step.config.column) return data;
    const multiValues = Array.isArray(step.config.values) && step.config.values.length > 0
      ? step.config.values
      : (step.config.value !== "" && step.config.value != null ? [step.config.value] : []);
    return data.filter((row) => {
      const val = row[step.config.column] ?? row.val;
      let target = step.config.value;
      if (step.config.valueType === "column" && step.config.compareColumn) {
        target = row[step.config.compareColumn];
      }
      const v = val != null ? String(val) : "";
      const t = target != null ? String(target) : "";
      switch (step.config.op) {
        case "==": {
          if (multiValues.length > 0) {
            return multiValues.some((mv) => v === String(mv));
          }
          return v === t;
        }
        case "!=": {
          if (multiValues.length > 0) {
            return !multiValues.some((mv) => v === String(mv));
          }
          return v !== t;
        }
        case ">":
          return Number(val) > Number(target);
        case "<":
          return Number(val) < Number(target);
        case ">=":
          return Number(val) >= Number(target);
        case "<=":
          return Number(val) <= Number(target);
        case "contains":
          return v.includes(t);
        case "notContains":
          return !v.includes(t);
        case "startsWith":
          return v.startsWith(t);
        case "endsWith":
          return v.endsWith(t);
        case "isEmpty":
          return !v;
        case "notEmpty":
          return !!v;
        case "regex": {
          try {
            return new RegExp(t).test(v);
          } catch {
            return true;
          }
        }
        default:
          return true;
      }
    });
  },
  filterEqual(step, data) {
    if (!step.config.column) return data;
    return data.filter((row) => {
      const val = row[step.config.column] ?? row.val;
      const target = step.config.value;
      const v = val != null ? String(val) : "";
      const t = target != null ? String(target) : "";
      return v === t;
    });
  },
  filterContain(step, data) {
    if (!step.config.column) return data;
    return data.filter((row) => {
      const val = row[step.config.column] ?? row.val;
      const target = step.config.value;
      const v = val != null ? String(val) : "";
      const t = target != null ? String(target) : "";
      return v.includes(t);
    });
  },
  filterRange(step, data) {
    if (!step.config.column) return data;
    const minVal = step.config.min !== "" && step.config.min != null ? Number(step.config.min) : -Infinity;
    const maxVal = step.config.max !== "" && step.config.max != null ? Number(step.config.max) : Infinity;
    return data.filter((row) => {
      const val = Number(row[step.config.column] ?? row.val);
      return val >= minVal && val <= maxVal;
    });
  },
  keepDuplicate(step, data) {
    if (!step.config.column) return data;
    const col = step.config.column;
    const countMap = {};
    data.forEach((row) => {
      const key = String(row[col] ?? row.val ?? "");
      countMap[key] = (countMap[key] || 0) + 1;
    });
    return data.filter((row) => {
      const key = String(row[col] ?? row.val ?? "");
      return countMap[key] > 1;
    });
  },
  keepUnique(step, data) {
    if (!step.config.column) return data;
    const col = step.config.column;
    const countMap = {};
    data.forEach((row) => {
      const key = String(row[col] ?? row.val ?? "");
      countMap[key] = (countMap[key] || 0) + 1;
    });
    return data.filter((row) => {
      const key = String(row[col] ?? row.val ?? "");
      return countMap[key] === 1;
    });
  },
  distinct(step, data) {
    const key = step.config.column || "val";
    const seen = new Set();
    return data.filter((row) => {
      const v = row[key];
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
  },
};