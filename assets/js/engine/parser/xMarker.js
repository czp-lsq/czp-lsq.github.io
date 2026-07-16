const XMarker = {
  getAllXChars() {
    return [
      "x", "X", "×", "✕", "✖", "✗", "✘", "ｘ", "Ｘ", "⨯", "╳",
      "χ", "Χ", "х", "Х", "❌", "❎", "*", "＊", "✳", "✴", "❋",
      "❊", "✧", "✦", "⋇", "⋆", "∗", "⚹",
    ];
  },
  getXCharRegex() {
    const xChars = this.getAllXChars();
    const escaped = xChars.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
    return new RegExp("[" + escaped + "]", "g");
  },
  getXCharClass() {
    const xChars = this.getAllXChars();
    return xChars.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
  },
  countXChars(str) {
    const xRegex = this.getXCharRegex();
    const matches = str.match(xRegex);
    return matches ? matches.length : 0;
  },
  countXGroups(str) {
    if (str == null) return 0;
    const s = String(str).trim();
    if (!s) return 0;
    const xc = this.getXCharClass();
    const xRegex = new RegExp("[" + xc + "]+", "g");
    const matches = s.match(xRegex);
    return matches ? matches.length : 0;
  },
  extractXGroupContexts(str) {
    if (str == null) return [];
    const s = String(str).trim();
    if (!s) return [];
    const xc = this.getXCharClass();
    const groupRegex = new RegExp("[" + xc + "]+", "g");
    const contexts = [];
    const isPureX = new RegExp("^[" + xc + "]+$").test(this.normalizeText(s));
    let match;
    while ((match = groupRegex.exec(s)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const groupText = match[0];
      let afterText = s.substring(end);
      const nextXPos = afterText.search(new RegExp("[" + xc + "]"));
      if (nextXPos > 0) {
        afterText = afterText.substring(0, nextXPos).trim();
      } else if (nextXPos === 0) {
        afterText = "";
      } else {
        afterText = afterText.trim();
      }
      let beforeText = s.substring(0, start);
      const prevXMatch = beforeText.match(new RegExp("[" + xc + "][^" + xc + "]*$", "g"));
      if (prevXMatch && prevXMatch.length > 0) {
        const lastPrev = prevXMatch[prevXMatch.length - 1];
        const cutIdx = beforeText.lastIndexOf(lastPrev) + 1;
        beforeText = beforeText.substring(cutIdx).trim();
      }
      beforeText = beforeText.replace(new RegExp("[" + xc + "]+", "g"), "").trim();
      const cleanBeforeText = beforeText.replace(/[：:，,。、；;！!？?\s]+$/, "");
      let semanticLabel = "";
      let semanticType = "unknown";
      const dateUnits = ["年", "月", "日", "号", "季度", "周", "星期"];
      const shopUnits = ["店铺", "店", "门店", "商店", "商城", "专柜", "网点", "站点", "品牌", "铺", "名称", "名字"];
      if (isPureX) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else if (afterText && dateUnits.some((u) => afterText.startsWith(u))) {
        semanticType = "date";
        for (const unit of dateUnits) {
          if (afterText.startsWith(unit)) {
            semanticLabel = unit;
            if (unit === "年") semanticType = "year";
            else if (unit === "月") semanticType = "month";
            else if (unit === "日" || unit === "号") semanticType = "day";
            else if (unit === "季度") semanticType = "quarter";
            else if (unit === "周" || unit === "星期") semanticType = "week";
            break;
          }
        }
      } else if (beforeText && dateUnits.some((u) => cleanBeforeText.endsWith(u))) {
        semanticType = "date";
        for (const unit of dateUnits) {
          if (cleanBeforeText.endsWith(unit)) {
            semanticLabel = unit;
            if (unit === "年") semanticType = "year";
            else if (unit === "月") semanticType = "month";
            else if (unit === "日" || unit === "号") semanticType = "day";
            else if (unit === "季度") semanticType = "quarter";
            else if (unit === "周" || unit === "星期") semanticType = "week";
            break;
          }
        }
      } else if (afterText && shopUnits.some((u) => afterText.startsWith(u))) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else if (beforeText && shopUnits.some((u) =>
        cleanBeforeText.endsWith(u) ||
        beforeText.endsWith(u + "：") ||
        beforeText.endsWith(u + ":")
      )) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else if (groupText.length >= 2) {
        semanticType = "shop";
        semanticLabel = "店铺名";
      } else {
        semanticLabel = afterText || beforeText || `第${contexts.length + 1}处`;
      }
      contexts.push({
        groupIndex: contexts.length,
        groupText,
        before: beforeText,
        after: afterText,
        semanticLabel,
        semanticType,
        xCount: groupText.length,
      });
    }
    return contexts;
  },
  normalizeText(str) {
    if (str == null) return "";
    return String(str).replace(/\s/g, "").trim();
  },
};

window.XMarker = XMarker;