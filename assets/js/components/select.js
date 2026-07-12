const { useState, useRef, useEffect } = React;

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "请选择",
  className = "",
  size = "default",
  disabled = false,
  allowCreate = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const label = typeof opt === "object" ? (opt.label || opt.value || "") : String(opt);
    return label.toLowerCase().includes(q);
  });

  const displayValue = (() => {
    if (value === "" || value == null) return "";
    const opt = options.find(
      (o) => (typeof o === "object" ? o.value : o) === value,
    );
    return opt ? (typeof opt === "object" ? opt.label : opt) : value;
  })();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && allowCreate && searchQuery.trim()) {
      const exists = options.some(
        (o) => (typeof o === "object" ? o.value : o) === searchQuery.trim(),
      );
      if (!exists) {
        handleSelect(searchQuery.trim());
      }
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return /*#__PURE__*/ React.createElement(
    "div",
    {
      className: `searchable-select ${className} ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} size-${size}`,
      ref: containerRef,
    },
    /*#__PURE__*/ React.createElement(
      "div",
      {
        className: "searchable-select-trigger",
        onClick: () => !disabled && setIsOpen(!isOpen),
      },
      /*#__PURE__*/ React.createElement(
        "span",
        { className: `searchable-select-value ${!value ? "placeholder" : ""}` },
        displayValue || placeholder,
      ),
      /*#__PURE__*/ React.createElement(
        "span",
        { className: "searchable-select-arrow" },
        /*#__PURE__*/ React.createElement(
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
          /*#__PURE__*/ React.createElement("polyline", { points: "6 9 12 15 18 9" }),
        ),
      ),
    ),
    isOpen && /*#__PURE__*/ React.createElement(
      "div",
      { className: "searchable-select-dropdown" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "searchable-select-search" },
        /*#__PURE__*/ React.createElement(
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
          /*#__PURE__*/ React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
          /*#__PURE__*/ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
        ),
        /*#__PURE__*/ React.createElement("input", {
          ref: inputRef,
          type: "text",
          className: "search-input",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: "搜索...",
        }),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "searchable-select-options" },
        filteredOptions.length === 0 ? /*#__PURE__*/ React.createElement(
          "div",
          { className: "searchable-select-empty" },
          allowCreate ? "无匹配项，按回车创建" : "无匹配项",
        ) : filteredOptions.map((opt) => {
          const optValue = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? (opt.label || opt.value) : String(opt);
          const isSelected = optValue === value;
          return /*#__PURE__*/ React.createElement(
            "div",
            {
              key: optValue,
              className: `searchable-select-option ${isSelected ? "selected" : ""}`,
              onClick: () => handleSelect(optValue),
            },
            /*#__PURE__*/ React.createElement("span", null, optLabel),
            isSelected && /*#__PURE__*/ React.createElement(
              "span",
              { className: "check-icon" },
              "✓",
            ),
          );
        }),
      ),
    ),
  );
};

window.SearchableSelect = SearchableSelect;
