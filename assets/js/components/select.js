// 拼音转换表 - 常用汉字拼音首字母
const PINYIN_TABLE = {
  a: '阿安啊艾艾爱艾安阿啊哎唉安按艾爱挨艾艾',
  b: '北本边不比巴波百贝布伯博彼彼办邦帮保报杯备本必边比北巴波',
  c: '城从次此成出传车处参陈村查川常创除程村春城车船处存才采川长称初',
  d: '大多地东道达到度对都代德丹定当动得点电都大东道达地',
  e: '尔恩',
  f: '分发方非夫风付法反复费佛范分方飞福发弗凡',
  g: '各给个国高格干公哥戈工关古盖葛甘革更广共桂格戈古盖',
  h: '和合后海好何红回花还黑河黄贺湖洪哈荷胡汉海和合后好何',
  i: '',
  j: '就家结进间江机建交加金杰价解接济经计件级基极吉江集佳甲',
  k: '可开科看卡凯克康坎考柯库扩开克卡科可',
  l: '了来立利林乐拉路理力兰李龙连列拉雷老梁刘路乐利来林',
  m: '们民名么马美米莫毛门明麦满迈孟玛莫米马',
  n: '你那能年南内纳尼诺努宁纽南那能年',
  o: '欧奥',
  p: '平品配普帕皮彭波庞排培普皮平品配',
  q: '去区其气齐且强七切起权青庆全曲渠奇邱乔秦琴钱',
  r: '人如日任热若瑞然荣冉阮阮芮容若人日如',
  s: '是所说时思四司色素苏萨塞孙桑松沙宋石山省苏赛思斯',
  t: '他天太台谭特唐陶提泰汤托滕通塔谭特他天太',
  u: '',
  v: '',
  w: '我无为万王文武威吴韦温沃瓦翁伍魏乌汪威韦吴王文',
  x: '下小行新学向心些现希系西席许谢肖夏徐邢薛习谢西希',
  y: '一要也于与有又已由以元月业玉洋雨因运永杨游袁耶尤叶尹姚云余',
  z: '在这中自之主作张子则整周赵正朱郑宗曾卓詹庄钟翟仲左制在'
};

// 简化的拼音首字母提取函数
const getPinyinFirstLetter = (str) => {
  if (!str) return '';
  const result = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (/[a-zA-Z]/.test(char)) {
      result.push(char.toLowerCase());
      continue;
    }
    if (/[\u4e00-\u9fa5]/.test(char)) {
      for (const [letter, chars] of Object.entries(PINYIN_TABLE)) {
        if (chars.includes(char)) {
          result.push(letter);
          break;
        }
      }
    }
  }
  return result.join('');
};

// 防抖函数
const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

// 虚拟滚动组件
const VirtualList = ({ items, itemHeight, containerHeight, renderItem, onSelect, selectedIndex }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef(null);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const targetTop = selectedIndex * itemHeight;
      const currentScrollTop = listRef.current.scrollTop;
      const viewHeight = containerHeight;
      
      if (targetTop < currentScrollTop || targetTop >= currentScrollTop + viewHeight - itemHeight) {
        listRef.current.scrollTop = targetTop - Math.floor(viewHeight / 2) + itemHeight;
      }
    }
  }, [selectedIndex, itemHeight, containerHeight]);
  
  return React.createElement(
    'div',
    {
      ref: listRef,
      className: 'virtual-list-container',
      style: { height: containerHeight, overflow: 'auto' },
      onScroll: handleScroll,
    },
    React.createElement(
      'div',
      { style: { height: totalHeight, position: 'relative' } },
      React.createElement(
        'div',
        { style: { position: 'absolute', top: offsetY, width: '100%' } },
        visibleItems.map((item, idx) => {
          const actualIndex = startIndex + idx;
          return renderItem(item, actualIndex);
        })
      )
    )
  );
};

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "请选择",
  className = "",
  size = "default",
  disabled = false,
  allowCreate = false,
  groups = null,
  groupBy = null,
  virtualScroll = false,
  virtualScrollThreshold = 100,
  debounceDelay = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [focusedGroupIndex, setFocusedGroupIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionsRef = useRef(null);
  const dropdownContainerRef = useRef(null);

  const safeOptions = Array.isArray(options) ? options : [];
  const safeGroups = Array.isArray(groups) ? groups : null;

  const debouncedSearch = useMemo(
    () => debounce((query) => setDebouncedQuery(query), debounceDelay),
    [debounceDelay]
  );
  
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const processedGroups = useMemo(() => {
    if (safeGroups) return safeGroups;
    if (groupBy && safeOptions.length > 0) {
      const groupMap = {};
      safeOptions.forEach((opt) => {
        const groupVal = typeof opt === "object" ? opt[groupBy] : "";
        const groupLabel = groupVal || "未分类";
        if (!groupMap[groupLabel]) {
          groupMap[groupLabel] = [];
        }
        groupMap[groupLabel].push(opt);
      });
      return Object.keys(groupMap).map((key) => ({
        id: key,
        label: key,
        options: groupMap[key],
      }));
    }
    return null;
  }, [safeGroups, groupBy, safeOptions]);

  const filterOptions = (opts, query) => {
    if (!Array.isArray(opts)) return [];
    if (!query || !query.trim()) return opts;
    const q = query.toLowerCase();
    return opts.filter((opt) => {
      const label = typeof opt === "object" ? (opt.label || opt.value || "") : String(opt);
      if (!label) return false;
      if (label.toLowerCase().includes(q)) return true;
      const pinyin = getPinyinFirstLetter(label);
      if (pinyin && pinyin.includes(q)) return true;
      const fullPinyin = label.split('').map(c => {
        for (const [letter, chars] of Object.entries(PINYIN_TABLE)) {
          if (chars.includes(c)) return letter;
        }
        return c.toLowerCase();
      }).join('');
      if (fullPinyin && fullPinyin.includes(q)) return true;
      return false;
    });
  };

  const processedOptions = useMemo(() => {
    const useGroups = processedGroups || safeGroups;
    let selectableIdx = -1;
    if (useGroups) {
      const result = [];
      useGroups.forEach((group, groupIdx) => {
        result.push({
          type: 'group-header',
          id: group.id,
          label: group.label,
          groupIndex: groupIdx,
        });
        const groupOptions = Array.isArray(group.options) ? group.options : [];
        const filtered = filterOptions(groupOptions, debouncedQuery);
        filtered.forEach((opt) => {
          selectableIdx++;
          result.push({
            ...opt,
            type: 'option',
            groupId: group.id,
            groupIndex: groupIdx,
            selectableIndex: selectableIdx,
          });
        });
      });
      return result;
    } else {
      return filterOptions(safeOptions, debouncedQuery).map((opt, idx) => {
        selectableIdx++;
        return {
          ...opt,
          type: 'option',
          index: idx,
          selectableIndex: selectableIdx,
        };
      });
    }
  }, [processedGroups, safeGroups, safeOptions, debouncedQuery]);

  const selectableOptions = useMemo(() => {
    return processedOptions.filter(item => item.type === 'option');
  }, [processedOptions]);

  const enableVirtualScroll = virtualScroll || selectableOptions.length > virtualScrollThreshold;

  const displayValue = useMemo(() => {
    if (value === "" || value == null) return "";

    const findOption = (opts) => {
      if (!Array.isArray(opts)) return null;
      for (const o of opts) {
        const optValue = typeof o === "object" ? o.value : o;
        if (optValue === value) {
          return o;
        }
      }
      return null;
    };

    let opt = findOption(safeOptions);

    if (!opt && safeGroups) {
      for (const group of safeGroups) {
        if (group && Array.isArray(group.options)) {
          opt = findOption(group.options);
          if (opt) break;
        }
      }
    }

    if (!opt && processedGroups) {
      for (const group of processedGroups) {
        if (group && Array.isArray(group.options)) {
          opt = findOption(group.options);
          if (opt) break;
        }
      }
    }

    return opt ? (typeof opt === "object" ? opt.label : opt) : value;
  }, [value, safeOptions, safeGroups, processedGroups]);

  const updateDropdownPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchQuery("");
        setDebouncedQuery("");
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const getDropdownContent = () => {
    if (!isOpen) return null;
    const pos = dropdownPos || { top: 0, left: 0, width: 0 };
    return React.createElement(
      "div",
      {
        ref: dropdownContainerRef,
        className: "searchable-select-dropdown searchable-select-dropdown-portal",
        style: {
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 9999,
        },
      },
      value && displayValue && React.createElement(
        "div",
        { className: "searchable-select-current" },
        React.createElement("span", { className: "searchable-select-current-label" }, "当前选择"),
        React.createElement("span", { className: "searchable-select-current-value" }, displayValue)
      ),
      React.createElement(
        "div",
        { className: "searchable-select-search" },
        React.createElement(
          "svg",
          {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: "search-icon",
          },
          React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
          React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
        ),
        React.createElement("input", {
          ref: inputRef,
          type: "text",
          className: "search-input",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: "搜索选项（支持拼音）...",
        }),
        searchQuery && React.createElement(
          "span",
          {
            className: "search-clear",
            onClick: () => {
              setSearchQuery("");
              setDebouncedQuery("");
              setSelectedIndex(-1);
            },
          },
          "×"
        ),
      ),
      React.createElement(
        "div",
        { 
          className: "searchable-select-options", 
          ref: optionsRef,
          style: enableVirtualScroll ? {} : { maxHeight: '320px', overflow: 'auto' }
        },
        selectableOptions.length === 0 ? React.createElement(
          "div",
          { className: "searchable-select-empty" },
          allowCreate ? "无匹配项，按回车创建" : "无匹配项",
        ) : enableVirtualScroll ? React.createElement(
          VirtualList,
          {
            items: processedOptions,
            itemHeight: 36,
            containerHeight: getListHeight(),
            renderItem: renderOption,
            onSelect: handleSelect,
            selectedIndex: selectedIndex,
          }
        ) : processedOptions.map((item, idx) => renderOption(item, idx)),
      ),
      selectableOptions.length > 0 && React.createElement(
        "div",
        { className: "searchable-select-hint" },
        React.createElement("span", null, "↑↓ 导航 | Enter 选择 | Esc 关闭"),
      ),
    );
  };

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const selectableCount = selectableOptions.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectableCount > 0) {
          setSelectedIndex((prev) => {
            const next = prev < selectableCount - 1 ? prev + 1 : 0;
            return next;
          });
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (selectableCount > 0) {
          setSelectedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : selectableCount - 1;
            return next;
          });
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < selectableCount) {
          const selectedOpt = selectableOptions[selectedIndex];
          const optValue = typeof selectedOpt === "object" ? selectedOpt.value : selectedOpt;
          handleSelect(optValue);
        } else if (allowCreate && searchQuery.trim()) {
          const exists = safeOptions.some(
            (o) => (typeof o === "object" ? o.value : o) === searchQuery.trim(),
          );
          if (!exists) {
            handleSelect(searchQuery.trim());
          }
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        setDebouncedQuery("");
        setSelectedIndex(-1);
        break;
        
      case 'Tab':
        setIsOpen(false);
        break;
        
      default:
        break;
    }
  };

  const renderOption = (item, index) => {
    if (item.type === 'group-header') {
      return React.createElement(
        'div',
        {
          key: `group-${item.id}`,
          className: 'searchable-select-group-header',
        },
        item.label
      );
    }
    
    const optValue = typeof item === "object" ? item.value : item;
    const optLabel = typeof item === "object" ? (item.label || item.value) : String(item);
    const isSelected = optValue === value;
    const isFocused = item.selectableIndex === selectedIndex;
    
    return React.createElement(
      'div',
      {
        key: optValue,
        className: `searchable-select-option ${isSelected ? "selected" : ""} ${isFocused ? "focused" : ""}`,
        onClick: () => handleSelect(optValue),
        onMouseEnter: () => setSelectedIndex(index),
        'data-value': optValue,
      },
      React.createElement("span", { className: "option-label" }, optLabel),
      isSelected && React.createElement(
        "span",
        { className: "check-icon" },
        "✓"
      )
    );
  };

  const getListHeight = () => {
    const maxHeight = 320;
    const useGroups = processedGroups || safeGroups;
    const estimatedHeight = enableVirtualScroll ? maxHeight : Math.min(selectableOptions.length * 36 + (useGroups && useGroups.length > 0 ? useGroups.length * 32 : 0), maxHeight);
    return Math.max(120, estimatedHeight);
  };

  const dropdownContent = getDropdownContent();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      {
        className: `searchable-select ${className} ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} size-${size}`,
        ref: containerRef,
      },
      React.createElement(
        "div",
        {
          className: "searchable-select-trigger",
          onClick: () => !disabled && setIsOpen(!isOpen),
        },
        React.createElement(
          "span",
          { className: `searchable-select-value ${!value ? "placeholder" : ""}` },
          displayValue || placeholder,
        ),
        React.createElement(
          "span",
          { className: "searchable-select-arrow" },
          React.createElement(
            "svg",
            {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            },
            React.createElement("polyline", { points: "6 9 12 15 18 9" }),
          ),
        ),
      ),
    ),
    dropdownContent && typeof ReactDOM !== "undefined" && ReactDOM.createPortal
      ? ReactDOM.createPortal(dropdownContent, document.body)
      : dropdownContent,
  );
};

window.SearchableSelect = SearchableSelect;