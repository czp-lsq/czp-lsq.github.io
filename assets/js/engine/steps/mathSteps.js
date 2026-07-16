const MathSteps = {
  math(step, data) {
    const mathCol = step.config.column || "val";
    const mathOp = step.config.operation || "+";
    const mathVal = Number(step.config.value) || 0;
    return data.map((row) => {
      const val = Number(String(row[mathCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      let result;
      switch (mathOp) {
        case "+":
          result = val + mathVal;
          break;
        case "-":
          result = val - mathVal;
          break;
        case "*":
          result = val * mathVal;
          break;
        case "/":
          result = mathVal !== 0 ? val / mathVal : 0;
          break;
        case "^":
          result = Math.pow(val, mathVal);
          break;
        case "%":
          result = val % mathVal;
          break;
        default:
          result = val;
      }
      return { ...row, val: isNaN(val) ? row[mathCol] : result };
    });
  },
  round(step, data) {
    const roundCol = step.config.column || "val";
    const decimals = step.config.decimals || 2;
    return data.map((row) => {
      const val = Number(String(row[roundCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      return { ...row, val: isNaN(val) ? row[roundCol] : Number(val.toFixed(decimals)) };
    });
  },
  diff(step, data) {
    const diffCol = step.config.column || "val";
    const baseCol = step.config.baseColumn;
    const asPercent = step.config.percent || false;
    return data.map((row) => {
      const val = Number(String(row[diffCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      const base = Number(String(row[baseCol]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      let result = val - base;
      if (asPercent && base !== 0) {
        result = (result / base) * 100;
      }
      return { ...row, val: isNaN(val) || isNaN(base) ? 0 : result };
    });
  },
  ratio(step, data) {
    const numerator = step.config.numerator || "val";
    const denominator = step.config.denominator;
    const ratioAsPercent = step.config.percent || false;
    return data.map((row) => {
      const num = Number(String(row[numerator]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      const den = Number(String(row[denominator]).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, ""));
      let result = den !== 0 ? num / den : 0;
      if (ratioAsPercent) {
        result = result * 100;
      }
      return { ...row, val: isNaN(num) || isNaN(den) ? 0 : result };
    });
  },
  percentOfTotal(step, data) {
    const col = step.config.column || "val";
    const values = data.map((row) =>
      Number(String(row[col] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
    );
    const total = values.reduce((a, b) => a + b, 0);
    const asPercent = step.config.asPercent !== false;
    return data.map((row, idx) => {
      const ratio = total !== 0 ? values[idx] / total : 0;
      return { ...row, val: asPercent ? ratio * 100 : ratio };
    });
  },
  normalize(step, data) {
    const normCol = step.config.column || "val";
    const targetCol = step.config.targetColumn || "normalized";
    const normType = step.config.normType || "minmax";
    const values = data.map((row) =>
      Number(String(row[normCol] ?? row.val).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0
    );
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;
    const meanVal = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, v) => a + Math.pow(v - meanVal, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);
    return data.map((row, idx) => {
      const val = values[idx];
      let normalized = 0;
      switch (normType) {
        case "minmax":
          normalized = range > 0 ? (val - minVal) / range : 0;
          break;
        case "zscore":
          normalized = stddev > 0 ? (val - meanVal) / stddev : 0;
          break;
        case "decimal":
          const maxAbs = Math.max(...values.map(v => Math.abs(v)));
          normalized = maxAbs > 0 ? val / maxAbs : 0;
          break;
        default:
          normalized = val;
      }
      return { ...row, [targetCol]: normalized };
    });
  },
};