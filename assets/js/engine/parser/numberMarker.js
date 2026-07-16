const NumberMarker = {
  isNumberMarker(str, debugInfo) {
    if (str == null) return false;
    const s = String(str).trim();
    if (!s) return false;
    if (/^0$/.test(s)) {
      if (debugInfo) debugInfo.match = "zero";
      return true;
    }
    if (/^0\.0+$/.test(s)) {
      if (debugInfo) debugInfo.match = "decimal_zero";
      return true;
    }
    if (/^[¥￥$€£]?\s*0(\.0+)?$/.test(s)) {
      if (debugInfo) debugInfo.match = "currency_zero";
      return true;
    }
    if (/^0(\.0+)?%?$/.test(s)) {
      if (debugInfo) debugInfo.match = "percent_zero";
      return true;
    }
    if (/^[-—–─―一_－‒—―─˗‑‑⁃−—―]+$/.test(s)) {
      if (debugInfo) debugInfo.match = "dash";
      return true;
    }
    if (/^[（(]\s*(待[填]?|占位|空|无|--|—|－)\s*[）)]$/.test(s)) {
      if (debugInfo) debugInfo.match = "parens_placeholder";
      return true;
    }
    if (/^[\/／\\＼]$/.test(s)) {
      if (debugInfo) debugInfo.match = "slash";
      return true;
    }
    if (/^0[,，]?0*\.?0*$/.test(s)) {
      if (debugInfo) debugInfo.match = "formatted_zero";
      return true;
    }
    if (/^0(\.0+)?%$/.test(s)) {
      if (debugInfo) debugInfo.match = "percent";
      return true;
    }
    if (/^[¥￥$€£]\s*0(\.0+)?$/.test(s)) {
      if (debugInfo) debugInfo.match = "currency";
      return true;
    }
    if (/^\s*[0零〇○]+\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "chinese_zero";
      return true;
    }
    if (/^\s*(暂无|空值|空|无|NULL|null|Null|none|None|N\/A|n\/a|NA|na)\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "null_keyword";
      return true;
    }
    if (/^\s*0\.00\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "zero_decimal";
      return true;
    }
    if (/^\s*￥\s*0\.00\s*$/.test(s)) {
      if (debugInfo) debugInfo.match = "rmb_zero";
      return true;
    }
    return false;
  },
};

window.NumberMarker = NumberMarker;