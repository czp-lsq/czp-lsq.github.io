const AggregateSteps = {
  aggregate(step, data) {
    if (data.length === 0) {
      return [{ val: 0 }];
    }
    const values = data.map((r) => {
      if (step.config.column === "__expr__" && step.config.expr) {
        let expr = step.config.expr;
        const collectSub = (k, rawVal) => {
          const v = Number(String(rawVal).replace(/[,，]/g, "").replace(/[¥￥$€£]/g, "")) || 0;
          return v;
        };
        expr = expr.replace(/{([^}]+)}/g, (m, k) => {
          const v = r[k] ?? r.val ?? 0;
          return collectSub(k, v);
        });
        const unparsed = expr.match(/{[^}]+}/g);
        if (unparsed && unparsed.length > 0) {
          unparsed.forEach((u) => {
            expr = expr.replace(u, "0");
          });
        }
        try {
          const result = new Function("return " + expr)();
          const n = Number(result);
          return isNaN(n) ? 0 : n;
        } catch (e) {
          return 0;
        }
      }
      const v = step.config.column ? r[step.config.column] : r.val;
      const n = Number(
        String(v)
          .replace(/[,，]/g, "")
          .replace(/[¥￥$€£]/g, ""),
      );
      return isNaN(n) ? 0 : n;
    });
    let result = 0;
    switch (step.config.func) {
      case "sum":
        result = values.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case "count":
        result = data.length;
        break;
      case "countDistinct": {
        const key = step.config.column || "val";
        result = new Set(data.map((r) => r[key])).size;
        break;
      }
      case "max":
        result = Math.max(...values);
        break;
      case "min":
        result = Math.min(...values);
        break;
      case "median": {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        result =
          sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        break;
      }
      case "product":
        result = values.reduce((a, b) => a * b, 1);
        break;
      case "first":
        result = values[0] || 0;
        break;
      case "last":
        result = values[values.length - 1] || 0;
        break;
      case "sumAbs":
        result = values.reduce((a, b) => a + Math.abs(b), 0);
        break;
      case "stddev": {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
        const avgSquareDiff =
          squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        result = Math.sqrt(avgSquareDiff);
        break;
      }
      case "mode": {
        const freq = {};
        values.forEach((v) => {
          freq[v] = (freq[v] || 0) + 1;
        });
        let maxFreq = 0;
        let modeVal = 0;
        Object.entries(freq).forEach(([v, f]) => {
          if (f > maxFreq) {
            maxFreq = f;
            modeVal = Number(v);
          }
        });
        result = modeVal;
        break;
      }
      case "variance": {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
        result = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        break;
      }
      default:
        result = values.reduce((a, b) => a + b, 0);
    }
    return [{ val: result }];
  },
  group(step, data) {
    const key = step.config.column;
    if (!key) return data;
    const groups = {};
    data.forEach((row) => {
      const gk = row[key];
      if (!groups[gk]) groups[gk] = [];
      groups[gk].push(row);
    });
    const func = step.config.func || "sum";
    const aggCol = step.config.aggColumn || "val";
    return Object.entries(groups).map(([gk, rows]) => {
      const values = rows.map((r) => {
        const n = Number(
          String(r[aggCol])
            .replace(/[,，]/g, "")
            .replace(/[¥￥$€£]/g, ""),
        );
        return isNaN(n) ? 0 : n;
      });
      let result = 0;
      switch (func) {
        case "sum":
          result = values.reduce((a, b) => a + b, 0);
          break;
        case "avg":
          result = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case "count":
          result = rows.length;
          break;
        case "max":
          result = Math.max(...values);
          break;
        case "min":
          result = Math.min(...values);
          break;
        default:
          result = values.reduce((a, b) => a + b, 0);
      }
      return { [key]: gk, [aggCol]: result, _groupCount: rows.length };
    });
  },
};