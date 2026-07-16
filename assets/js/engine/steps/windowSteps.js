const WindowSteps = {
  runningTotal(step, data) {
    const col = step.config.column || "val";
    const orderCol = step.config.orderColumn;
    const dir = step.config.direction || "asc";
    let rows = [...data];
    if (orderCol) {
      rows.sort((a, b) => {
        const av = a[orderCol], bv = b[orderCol];
        const an = Number(av), bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) {
          return dir === "desc" ? bn - an : an - bn;
        }
        return dir === "desc"
          ? String(bv).localeCompare(String(av))
          : String(av).localeCompare(String(bv));
      });
    }
    let sum = 0;
    rows = rows.map((row) => {
      const v = Number(String(row[col] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
      sum += v;
      return { ...row, val: sum };
    });
    return rows;
  },
  movingAverage(step, data) {
    const maCol = step.config.column || "val";
    const windowSize = Number(step.config.windowSize) || 3;
    const targetCol = step.config.targetColumn || "moving_avg";
    const values = data.map((row) =>
      Number(String(row[maCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
    );
    return data.map((row, idx) => {
      let sum = 0;
      let count = 0;
      const startIdx = Math.max(0, idx - windowSize + 1);
      for (let i = startIdx; i <= idx; i++) {
        sum += values[i];
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      return { ...row, [targetCol]: avg };
    });
  },
  cumulativeMax(step, data) {
    const cmCol = step.config.column || "val";
    const orderCol = step.config.orderColumn;
    const dir = step.config.direction || "asc";
    let rows = [...data];
    if (orderCol) {
      rows.sort((a, b) => {
        const av = a[orderCol], bv = b[orderCol];
        const an = Number(av), bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) {
          return dir === "desc" ? bn - an : an - bn;
        }
        return dir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      });
    }
    let maxVal = -Infinity;
    rows = rows.map((row) => {
      const v = Number(String(row[cmCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
      maxVal = Math.max(maxVal, v);
      return { ...row, val: maxVal };
    });
    return rows;
  },
  cumulativeMin(step, data) {
    const cminCol = step.config.column || "val";
    const orderCol = step.config.orderColumn;
    const dir = step.config.direction || "asc";
    let rows = [...data];
    if (orderCol) {
      rows.sort((a, b) => {
        const av = a[orderCol], bv = b[orderCol];
        const an = Number(av), bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) {
          return dir === "desc" ? bn - an : an - bn;
        }
        return dir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      });
    }
    let minVal = Infinity;
    rows = rows.map((row) => {
      const v = Number(String(row[cminCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
      minVal = Math.min(minVal, v);
      return { ...row, val: minVal };
    });
    return rows;
  },
  lag(step, data) {
    const lagCol = step.config.column || "val";
    const lagN = Number(step.config.n) || 1;
    const targetCol = step.config.targetColumn || "lag_value";
    const values = data.map((row) => Number(String(row[lagCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
    return data.map((row, idx) => {
      const lagVal = idx >= lagN ? values[idx - lagN] : null;
      return { ...row, [targetCol]: lagVal };
    });
  },
  lead(step, data) {
    const leadCol = step.config.column || "val";
    const leadN = Number(step.config.n) || 1;
    const targetCol = step.config.targetColumn || "lead_value";
    const values = data.map((row) => Number(String(row[leadCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
    return data.map((row, idx) => {
      const leadVal = idx + leadN < values.length ? values[idx + leadN] : null;
      return { ...row, [targetCol]: leadVal };
    });
  },
  windowSum(step, data) {
    const wsCol = step.config.column || "val";
    const wsWindow = Number(step.config.windowSize) || 3;
    const targetCol = step.config.targetColumn || "window_sum";
    const values = data.map((row) => Number(String(row[wsCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
    return data.map((row, idx) => {
      const start = Math.max(0, idx - wsWindow + 1);
      const sum = values.slice(start, idx + 1).reduce((a, b) => a + b, 0);
      return { ...row, [targetCol]: sum };
    });
  },
  windowAvg(step, data) {
    const waCol = step.config.column || "val";
    const waWindow = Number(step.config.windowSize) || 3;
    const targetCol = step.config.targetColumn || "window_avg";
    const values = data.map((row) => Number(String(row[waCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
    return data.map((row, idx) => {
      const start = Math.max(0, idx - waWindow + 1);
      const slice = values.slice(start, idx + 1);
      const avg = slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
      return { ...row, [targetCol]: avg };
    });
  },
};