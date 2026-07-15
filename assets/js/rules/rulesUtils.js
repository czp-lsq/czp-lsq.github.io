// rules/rulesUtils.js - 计算规则页面工具函数
// 包含：CSV导出、剪贴板操作、数据预览等纯工具函数

(function() {
  const copyToClipboard = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  };

  const dataToCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return "";
    const headers = new Set();
    data.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith("_")) headers.add(k);
        });
      }
    });
    const headerArr = Array.from(headers);
    const escapeCSV = (val) => {
      if (val == null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return "\"" + str.replace(/"/g, "\"\"") + "\"";
      }
      return str;
    };
    const lines = [headerArr.join(",")];
    data.forEach((row) => {
      lines.push(headerArr.map((h) => escapeCSV(row[h])).join(","));
    });
    return lines.join("\n");
  };

  const downloadCSV = (data, filename) => {
    const csv = dataToCSV(data);
    if (!csv) return;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categorizeField = (field) => {
    const name = (field.name || "").toLowerCase();
    const semantic = (field.semanticType || "").toLowerCase();
    if (semantic === "shop") return "shop";
    if (semantic === "value") return "value";
    if (semantic === "date" || semantic === "year" || semantic === "month" || semantic === "day") return "date";
    if (semantic === "text") return "text";
    if (name.includes("店铺") || name.includes("店") || name.includes("来源") || name.includes("渠道")) return "shop";
    if (name.includes("金额") || name.includes("价格") || name.includes("成本") || name.includes("费用") ||
        name.includes("收入") || name.includes("利润") || name.includes("销售额") || name.includes("实付") ||
        name.includes("总价") || name.includes("单价") || name.includes("退款") || name.includes("佣金")) return "value";
    if (name.includes("日期") || name.includes("时间") || name.includes("年") || name.includes("月") || name.includes("日") ||
        name.includes("下单") || name.includes("创建") || name.includes("付款")) return "date";
    if (name.includes("数量") || name.includes("件数") || name.includes("条数") || name.includes("订单") ||
        name.includes("销量") || name.includes("库存")) return "quantity";
    if (name.includes("规格") || name.includes("尺码") || name.includes("颜色") || name.includes("款式") ||
        name.includes("sku") || name.includes("款号") || name.includes("商品")) return "product";
    return "other";
  };

  const getFieldCategoryInfo = (cat) => {
    const map = {
      shop: { label: "店铺/来源", color: "var(--color-primary)", icon: "🏪", order: 1 },
      value: { label: "数值/金额", color: "var(--color-success)", icon: "💰", order: 2 },
      date: { label: "日期/时间", color: "var(--color-info)", icon: "📅", order: 3 },
      quantity: { label: "数量/件数", color: "var(--color-warning)", icon: "📦", order: 4 },
      product: { label: "商品/规格", color: "var(--color-accent)", icon: "📋", order: 5 },
      text: { label: "文本/其他", color: "var(--color-text-tertiary)", icon: "📝", order: 6 },
      other: { label: "其他字段", color: "var(--color-text-tertiary)", icon: "📄", order: 99 },
    };
    return map[cat] || map.other;
  };

  const getSemanticIcon = (semantic, type) => {
    const t = (semantic || type || "").toLowerCase();
    if (t.includes("money") || t.includes("price") || t.includes("amount") || t.includes("金额") || t.includes("价格") || t.includes("收入") || t.includes("成本") || t.includes("费用") || t.includes("利润")) return "¥";
    if (t.includes("rate") || t.includes("percent") || t.includes("ratio") || t.includes("率") || t.includes("占比")) return "%";
    if (t.includes("count") || t.includes("qty") || t.includes("数量") || t.includes("件数") || t.includes("订单")) return "#";
    if (t.includes("date") || t.includes("time") || t.includes("日期") || t.includes("时间") || t.includes("年") || t.includes("月") || t.includes("日")) return "📅";
    if (t.includes("text") || t.includes("name") || t.includes("名称") || t.includes("标题") || t.includes("备注")) return "Aa";
    return "·";
  };

  const inferFieldLevel = (field, savedRules) => {
    const steps = savedRules[field.id]?.steps || [];
    if (steps.length === 0) return null;
    const hasJoin = steps.some((s) => s.type === "join");
    const hasVirtual = steps.some((s) => s.type === "virtual");
    const hasFilter = steps.some((s) => s.type === "filter");
    if (hasJoin || hasVirtual) return 2;
    if (hasFilter) return 1;
    return 0;
  };

  window.RulesUtils = {
    copyToClipboard,
    dataToCSV,
    downloadCSV,
    categorizeField,
    getFieldCategoryInfo,
    getSemanticIcon,
    inferFieldLevel,
  };
})();
