const MergedCell = {
  findMergedCells(worksheet) {
    const merges = [];
    if (!worksheet || !worksheet["!merges"]) return merges;
    worksheet["!merges"].forEach((m) => {
      merges.push({
        sRow: m.s.r,
        sCol: m.s.c,
        eRow: m.e.r,
        eCol: m.e.c,
        value: null,
      });
    });
    return merges;
  },
  getCellValue(aoa, row, col, mergedCells) {
    if (!aoa[row]) return null;
    for (const m of mergedCells) {
      if (row >= m.sRow && row <= m.eRow && col >= m.sCol && col <= m.eCol) {
        return aoa[m.sRow]?.[m.sCol] ?? null;
      }
    }
    return aoa[row][col] ?? null;
  },
  isMergedCell(row, col, mergedCells) {
    for (const m of mergedCells) {
      if (row >= m.sRow && row <= m.eRow && col >= m.sCol && col <= m.eCol) {
        return m;
      }
    }
    return null;
  },
};

window.MergedCell = MergedCell;