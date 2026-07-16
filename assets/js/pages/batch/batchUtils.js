const BatchUtils = {
  TABLE_TYPE_PATTERNS: [
    { type: "订单", keywords: ["订单", "交易", "成交"], icon: "📋", color: "var(--color-primary)", desc: "订单交易数据" },
    { type: "退款", keywords: ["退款", "退货"], icon: "🔄", color: "var(--color-warning)", desc: "退款退货数据" },
    { type: "推广", keywords: ["推广", "广告", "投放"], icon: "📢", color: "var(--color-success)", desc: "广告推广数据" },
    { type: "账务", keywords: ["账务", "账单", "结算"], icon: "💰", color: "var(--color-info)", desc: "账务结算数据" },
    { type: "成本", keywords: ["成本", "费用", "支出"], icon: "🧾", color: "var(--color-danger)", desc: "成本费用数据" },
    { type: "商品", keywords: ["商品", "库存"], icon: "📦", color: "var(--color-accent)", desc: "商品库存数据" },
    { type: "利润", keywords: ["利润", "收益"], icon: "📈", color: "var(--color-success)", desc: "利润收益数据" },
    { type: "报表", keywords: ["报表", "统计"], icon: "📊", color: "var(--color-primary)", desc: "统计报表数据" },
  ],

  detectTableType(fileName, fileData) {
    const text = (fileName + " " + Object.keys(fileData.sheets || {}).join(" ")).toLowerCase();
    for (const pattern of this.TABLE_TYPE_PATTERNS) {
      if (pattern.keywords.some(k => text.includes(k.toLowerCase()))) {
        return pattern;
      }
    }
    return { type: "其他", keywords: [], icon: "📄", color: "var(--color-text-tertiary)", desc: "其他数据" };
  },

  extractDateFromFileName(fileName) {
    const fullMatch = fileName.match(/(\d{4})[-_.年](\d{1,2})[-_.月]?(\d{1,2})/);
    if (fullMatch) {
      const [, year, month, day] = fullMatch;
      return {
        date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        year: Number(year),
        month: Number(month),
        monthLabel: `${Number(month)}月份`,
        yearMonthLabel: `${year}-${Number(month)}月份`,
      };
    }
    const yearMonthMatch = fileName.match(/(\d{4})[-_.年](\d{1,2})/);
    if (yearMonthMatch) {
      const [, year, month] = yearMonthMatch;
      return {
        date: `${year}-${month.padStart(2, "0")}-01`,
        year: Number(year),
        month: Number(month),
        monthLabel: `${Number(month)}月份`,
        yearMonthLabel: `${year}-${Number(month)}月份`,
      };
    }
    const cnMonthMatch = fileName.match(/(\d{1,2})月份/);
    if (cnMonthMatch) {
      const m = Number(cnMonthMatch[1]);
      const yearMatch = fileName.match(/(\d{4})/);
      const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      return {
        date: `${year}-${String(m).padStart(2, "0")}-01`,
        year,
        month: m,
        monthLabel: `${m}月份`,
        yearMonthLabel: `${year}-${m}月份`,
      };
    }
    return null;
  },

  extractTableKeyword(fileName) {
    const cleanName = fileName.replace(/\.[^.]+$/, "").trim();
    const detailMatch = cleanName.match(/^([^\s_\-\.]+?)(明细|详情|清单|统计|报表|记录|流水)/);
    if (detailMatch) {
      return detailMatch[1] + detailMatch[2];
    }
    for (const pattern of this.TABLE_TYPE_PATTERNS) {
      for (const keyword of pattern.keywords) {
        if (cleanName.toLowerCase().includes(keyword.toLowerCase())) {
          return keyword;
        }
      }
    }
    const short = cleanName.replace(/[\d_\-\.年月日期\s]/g, "").substring(0, 4);
    return short || "数据";
  },

  generateTableName(fileName, fileData, shop) {
    const tableType = this.detectTableType(fileName, fileData);
    const dateInfo = this.extractDateFromFileName(fileName);
    const keyword = this.extractTableKeyword(fileName);
    const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[\s_\-\.]+/g, "");
    let nameParts = [];

    if (shop) {
      nameParts.push(shop.name);
    }

    let mainPart = keyword;
    if (dateInfo) {
      mainPart = `${keyword} - ${dateInfo.monthLabel}`;
    }
    nameParts.push(tableType.icon + " " + mainPart);

    if (nameParts.length === 0) {
      nameParts.push(baseName.substring(0, 20));
    }

    return nameParts.join(" - ");
  },

  generateUniqueTableName(fileName, fileData, shop, existingNames = []) {
    let baseName = this.generateTableName(fileName, fileData, shop);
    let finalName = baseName;
    let counter = 1;
    
    while (existingNames.includes(finalName)) {
      finalName = `${baseName} (${counter})`;
      counter++;
    }
    
    return finalName;
  },

  detectShop(fileName, fileData, shops) {
    const baseName = fileName.replace(/\.[^.]+$/, "").toLowerCase();
    const normalizedBaseName = baseName
      .replace(/[\s_\-\.]+/g, "")
      .replace(/利润表|利润|报表|明细|账单|订单|销售|数据/g, "");
    for (const shop of shops) {
      const shopName = shop.name.toLowerCase();
      const normalizedShopName = shopName.replace(/[\s_\-\.]+/g, "");
      if (normalizedBaseName.includes(normalizedShopName) || normalizedShopName.includes(normalizedBaseName)) {
        return shop;
      }
      if (baseName === normalizedShopName || normalizedShopName === normalizedBaseName) {
        return shop;
      }
      const shortShopName = normalizedShopName.replace(/(旗舰店|专卖店|专营店|官方店|店铺|店)$/, "");
      if (shortShopName.length >= 2 && normalizedBaseName.includes(shortShopName)) {
        return shop;
      }
    }
    const sheetNames = Object.keys(fileData.sheets || {});
    for (const sheetName of sheetNames) {
      const lowerSheet = sheetName.toLowerCase();
      for (const shop of shops) {
        if (lowerSheet.includes(shop.name.toLowerCase())) {
          return shop;
        }
      }
    }
    const firstSheet = Object.values(fileData.sheets || {})[0];
    if (firstSheet?.rows) {
      for (let i = 0; i < Math.min(10, firstSheet.rows.length); i++) {
        const row = firstSheet.rows[i];
        const rowText = Object.values(row)
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        for (const shop of shops) {
          if (rowText.includes(shop.name.toLowerCase())) {
            return shop;
          }
        }
      }
    }
    if (firstSheet?.headers) {
      const headerText = firstSheet.headers.join(" ").toLowerCase();
      for (const shop of shops) {
        if (headerText.includes(shop.name.toLowerCase())) {
          return shop;
        }
      }
    }
    return null;
  },

  autoMatchTablesToRules(batchFiles, rules) {
    const matchedGroups = {};
    const allRules = rules || {};
    
    batchFiles.forEach((file) => {
      if (file.status !== "matched" || !file.detectedShop) return;

      const shopId = file.detectedShop.id;
      const tableType = this.detectTableType(file.fileName, file.data);
      const dateInfo = this.extractDateFromFileName(file.fileName);
      const date = dateInfo?.date || null;
      Object.values(allRules).forEach((rule) => {
        const sourceStep = (rule.steps || []).find(s => s.type === "source");
        if (!sourceStep?.config?.table) return;
        
        const ruleShopId = sourceStep.config.table.split("_")[0];
        if (ruleShopId === shopId) {
          if (!matchedGroups[ruleShopId]) matchedGroups[ruleShopId] = {};
          if (!matchedGroups[ruleShopId][rule.id]) {
            matchedGroups[ruleShopId][rule.id] = {
              rule,
              files: [],
              tableType: tableType.type,
            };
          }
          matchedGroups[ruleShopId][rule.id].files.push({
            ...file,
            date,
            tableType: tableType.type,
          });
        }
      });
    });
    
    return matchedGroups;
  },

  groupFilesByShop(batchFiles) {
    const groups = {};
    const unmatched = [];
    batchFiles.forEach((f) => {
      if (f.status === "error") {
        if (!groups._error) groups._error = [];
        groups._error.push(f);
      } else if (f.detectedShop) {
        if (!groups[f.detectedShop.id]) groups[f.detectedShop.id] = [];
        groups[f.detectedShop.id].push(f);
      } else {
        unmatched.push(f);
      }
    });
    if (unmatched.length > 0) groups._unmatched = unmatched;
    return groups;
  },

  getMissingSampleTables(rules, samples) {
    const usedTables = new Set();
    const allRules = rules || {};
    Object.values(allRules).forEach((rule) => {
      (rule.steps || []).forEach((step) => {
        if (step.config?.table) {
          usedTables.add(step.config.table);
        }
      });
    });
    const missing = [];
    usedTables.forEach((tableId) => {
      const sampleExists = samples.some(
        (s) =>
          s.id === tableId ||
          (tableId.startsWith("sample_") &&
            samples[parseInt(tableId.replace("sample_", ""))]),
      );
      if (!sampleExists) {
        const sampleInfo = samples.find((s) => s.id === tableId);
        missing.push(
          sampleInfo ? sampleInfo.alias || sampleInfo.fileName : tableId,
        );
      }
    });
    return missing;
  },
};