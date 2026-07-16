window.DateUtils = {
  extractDateFromFileName(fileName) {
    if (!fileName) return null;
    const name = fileName.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf('.') || fileName.length);
    const baseName = fileName.substring(0, fileName.lastIndexOf('.') || fileName.length);
    const patterns = [
      { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true, desc: "年月日格式" },
      { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false, desc: "年月格式" },
      { regex: /(\d{4})[\-_\/\.](\d{1,2})[\-_\/\.](\d{1,2})/, hasDay: true, desc: "斜杠分隔格式" },
      { regex: /(\d{4})[\-_年\.](\d{1,2})/, hasDay: false, desc: "年-月数字格式" },
    ];
    for (const p of patterns) {
      const match = baseName.match(p.regex);
      if (match) {
        let year = parseInt(match[1], 10);
        const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
        const day = p.hasDay && match[3]
          ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
          : null;
        const currentYear = new Date().getFullYear();
        if (year >= 2000 && year <= currentYear + 5 && month >= 1 && month <= 12) {
          return { year, month, day };
        }
      }
    }
    const numPatterns = [
      { regex: /(\d{4})(\d{2})(\d{2})/, hasDay: true, desc: "8位数字日期" },
      { regex: /(\d{4})(\d{2})/, hasDay: false, desc: "6位数字年月" },
    ];
    for (const p of numPatterns) {
      const match = baseName.match(p.regex);
      if (match) {
        let year = parseInt(match[1], 10);
        const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
        const day = p.hasDay && match[3]
          ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
          : null;
        const currentYear = new Date().getFullYear();
        if (year >= 2000 && year <= currentYear + 5 && month >= 1 && month <= 12) {
          const prevChar = match.index > 0 ? baseName[match.index - 1] : '';
          const nextChar = match.index + match[0].length < baseName.length 
            ? baseName[match.index + match[0].length] 
            : '';
          if (!/[0-9]/.test(prevChar) && !/[0-9]/.test(nextChar)) {
            return { year, month, day };
          }
        }
      }
    }
    const shortYearPatterns = [
      { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true, desc: "短年份年月日" },
      { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false, desc: "短年份年月" },
    ];
    for (const p of shortYearPatterns) {
      const match = baseName.match(p.regex);
      if (match) {
        let year = parseInt(match[1], 10);
        year += year < 50 ? 2000 : 1900;
        const month = Math.min(12, Math.max(1, parseInt(match[2], 10)));
        const day = p.hasDay && match[3]
          ? Math.min(31, Math.max(1, parseInt(match[3], 10)))
          : null;
        const currentYear = new Date().getFullYear();
        if (year >= 2000 && year <= currentYear + 5 && month >= 1 && month <= 12) {
          return { year, month, day };
        }
      }
    }
    return null;
  },
  extractDateFromData(tables) {
    const currentYear = new Date().getFullYear();
    const isValidDate = (year, month, day) => {
      if (year < 2000 || year > currentYear + 5) return false;
      if (month < 1 || month > 12) return false;
      if (day !== null && (day < 1 || day > 31)) return false;
      return true;
    };
    const dateCandidates = [];
    const monthCounts = {};
    for (const table of tables) {
      if (table.rows && table.rows.length > 0) {
        for (const row of table.rows) {
          for (const val of Object.values(row)) {
            let year = null, month = null, day = null;
            if (val instanceof Date && !isNaN(val)) {
              year = val.getFullYear();
              month = val.getMonth() + 1;
              day = val.getDate();
            } else {
              const str = String(val || "").trim();
              if (str.length < 6 || str.length > 30) continue;
              const datePatterns = [
                { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true },
                { regex: /(\d{4})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false },
                { regex: /(\d{4})[\-_\/\.](\d{1,2})[\-_\/\.](\d{1,2})/, hasDay: true },
                { regex: /^(\d{4})(\d{2})(\d{2})$/, hasDay: true },
                { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月\.](\d{1,2})[\-_日]?/, hasDay: true, shortYear: true },
                { regex: /(\d{2})[\-_年\.](\d{1,2})[\-_月]?/, hasDay: false, shortYear: true },
              ];
              for (const p of datePatterns) {
                const match = str.match(p.regex);
                if (match) {
                  year = parseInt(match[1], 10);
                  if (p.shortYear) {
                    year += year < 50 ? 2000 : 1900;
                  }
                  month = parseInt(match[2], 10);
                  day = p.hasDay && match[3] ? parseInt(match[3], 10) : null;
                  break;
                }
              }
            }
            if (year !== null && isValidDate(year, month, day)) {
              dateCandidates.push({ year, month, day });
              monthCounts[month] = (monthCounts[month] || 0) + 1;
            }
          }
        }
      }
    }
    if (dateCandidates.length === 0) return null;
    let mostFreqMonth = null;
    let maxCount = 0;
    for (const [m, cnt] of Object.entries(monthCounts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        mostFreqMonth = parseInt(m, 10);
      }
    }
    const finalYear = dateCandidates[0].year;
    const finalDay = dateCandidates[0].day;
    return { year: finalYear, month: mostFreqMonth || dateCandidates[0].month, day: finalDay };
  },
};