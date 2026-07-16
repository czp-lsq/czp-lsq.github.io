const TextMarker = {
  isTextMarker(str, debugInfo) {
    if (str == null) {
      if (debugInfo) debugInfo.reason = "null value";
      return false;
    }
    const raw = String(str);
    const s = raw.trim();
    if (!s) {
      if (debugInfo) debugInfo.reason = "empty string";
      return false;
    }
    const xc = XMarker.getXCharClass();
    const xRegex = XMarker.getXCharRegex();
    if (!xRegex.test(s)) {
      if (debugInfo) debugInfo.reason = "no X chars found";
      return false;
    }
    const normalized = XMarker.normalizeText(s);
    if (new RegExp("^[" + xc + "]+$").test(normalized) && normalized.length >= 1 && normalized.length <= 20) {
      if (debugInfo) {
        debugInfo.reason = "纯X序列(店铺名占位)";
        debugInfo.match = "shop_name";
      }
      return true;
    }
    const datePattern1 = new RegExp("[" + xc + "]{1,6}\\s*年\\s*[" + xc + "]{1,4}\\s*月\\s*[" + xc + "]{0,4}\\s*日?");
    if (datePattern1.test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X年X月X日)";
        debugInfo.match = "date_full";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,6}\\s*年").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X年)";
        debugInfo.match = "date_year";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,6}\\s*月").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X月)";
        debugInfo.match = "date_month";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,6}\\s*日").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期占位(X日)";
        debugInfo.match = "date_day";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,20}\\s*(店|店铺|门店|商店|商城|专柜|网点|站点|品牌|铺|名称|名字)$").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "X+店铺单位(店铺名)";
        debugInfo.match = "x_shop_unit";
      }
      return true;
    }
    if (new RegExp("(店铺|店铺名|店铺名称|店名|门店|门店名|名称|品牌|商家|商铺|商店|店|铺|名|日期|时间|年月|月份|年度|数据周期|报表周期|数据日期|报表日期|统计周期|统计日期|制表日期|填表日期|周期|期间)\\s*[：:]\\s*[" + xc + "]{1,20}").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "标签+X模式";
        debugInfo.match = "label_x";
      }
      return true;
    }
    if (new RegExp("[（(]\\s*[" + xc + "]+\\s*[）)]").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "括号内X";
        debugInfo.match = "parens_x";
      }
      return true;
    }
    if (/^(某某|待填|占位|填充|示例|空|无|N\/A|n\/a|NA|na|--|—|－|－－)(年|月|日|期|份|店铺|门店|名称|数据|表|单|店|铺)?$/.test(s)) {
      if (debugInfo) {
        debugInfo.reason = "中文占位词";
        debugInfo.match = "zh_placeholder";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,6}\\s*年\\s*[" + xc + "]{1,4}\\s*月?\\s*[～~至\\-—]\\s*[" + xc + "]{1,6}\\s*年\\s*[" + xc + "]{1,4}\\s*月?").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "日期范围";
        debugInfo.match = "date_range";
      }
      return true;
    }
    if (new RegExp("^[¥￥$]\\s*[" + xc + "]{1,12}$").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "金额占位";
        debugInfo.match = "currency_x";
      }
      return true;
    }
    if (new RegExp("[" + xc + "]{1,12}\\s*(元|块|万|万元)$").test(s)) {
      if (debugInfo) {
        debugInfo.reason = "X+金额单位";
        debugInfo.match = "x_currency";
      }
      return true;
    }
    const cleaned = s.replace(/[\s\-_—–·.・，,。、；;：:]/g, "");
    const xCount = XMarker.countXChars(cleaned);
    const xGroups = XMarker.countXGroups(cleaned);
    const hasCommonTerms = /(净利润|利润率|推广费|ROI|提现|充值|发货|收货|订单|退款|退货|数量|金额|费用|成本|收入|支出|利润|占比|比率|总额|合计|小计|平均|累计)/.test(s);
    if (hasCommonTerms && xCount / cleaned.length < 0.2) {
      if (debugInfo) debugInfo.reason = "包含财务术语且X占比低，排除";
      return false;
    }
    if (cleaned.length >= 3 && xCount >= 2 && xGroups >= 1 && xCount / cleaned.length >= 0.5) {
      if (debugInfo) {
        debugInfo.reason = "高X占比(兜底)";
        debugInfo.match = "x_ratio";
      }
      return true;
    }
    if (debugInfo) debugInfo.reason = "no match";
    return false;
  },
};

window.TextMarker = TextMarker;