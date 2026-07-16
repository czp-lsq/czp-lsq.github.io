const RankSteps = {
  rank(step, data) {
    const rankCol = step.config.column || "val";
    const rankDir = step.config.direction || "desc";
    const sorted = [...data].sort((a, b) => {
      const av = Number(String(a[rankCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      const bv = Number(String(b[rankCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      return rankDir === "desc" ? bv - av : av - bv;
    });
    const rankMap = {};
    sorted.forEach((row, idx) => {
      rankMap[row[rankCol]] = idx + 1;
    });
    return data.map((row) => ({ ...row, val: rankMap[row[rankCol]] || 0 }));
  },
  percentRank(step, data) {
    const prCol = step.config.column || "val";
    const targetCol = step.config.targetColumn || "percent_rank";
    const values = data.map((row) => Number(String(row[prCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
    const sorted = [...values].sort((a, b) => a - b);
    return data.map((row, idx) => {
      const val = values[idx];
      const rank = sorted.findIndex(v => v >= val);
      const percent = sorted.length > 1 ? rank / (sorted.length - 1) : 0;
      return { ...row, [targetCol]: percent };
    });
  },
  rankDense(step, data) {
    const rdCol = step.config.column || "val";
    const rdDir = step.config.direction || "desc";
    const targetCol = step.config.targetColumn || "dense_rank";
    const values = data.map((row) => Number(String(row[rdCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0);
    const sortedUnique = [...new Set(values)].sort((a, b) => rdDir === "desc" ? b - a : a - b);
    const rankMap = {};
    sortedUnique.forEach((v, idx) => { rankMap[v] = idx + 1; });
    return data.map((row, idx) => {
      return { ...row, [targetCol]: rankMap[values[idx]] || 0 };
    });
  },
  rankRowNumber(step, data) {
    const rrCol = step.config.column || "val";
    const rrDir = step.config.direction || "desc";
    const targetCol = step.config.targetColumn || "row_number";
    const indexed = data.map((row, idx) => ({ ...row, __idx: idx }));
    indexed.sort((a, b) => {
      const av = Number(String(a[rrCol] ?? a.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      const bv = Number(String(b[rrCol] ?? b.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      if (av !== bv) return rrDir === "desc" ? bv - av : av - bv;
      return a.__idx - b.__idx;
    });
    indexed.forEach((row, idx) => { row[targetCol] = idx + 1; });
    indexed.sort((a, b) => a.__idx - b.__idx);
    return indexed.map(row => { const { __idx, ...rest } = row; return rest; });
  },
  topN(step, data) {
    const count = Number(step.config.count) || 10;
    if (step.config.column) {
      const sorted = [...data].sort((a, b) => {
        const av = Number(a[step.config.column] ?? a.val);
        const bv = Number(b[step.config.column] ?? b.val);
        return step.config.order === "asc" ? av - bv : bv - av;
      });
      return sorted.slice(0, count);
    } else {
      return data.slice(0, count);
    }
  },
};