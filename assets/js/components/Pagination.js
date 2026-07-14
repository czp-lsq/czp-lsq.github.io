// components/Pagination.js - 分页组件
(function() {
  const { useState, useMemo } = React;

  const Pagination = ({
    current: currentProp,
    defaultCurrent = 1,
    pageSize: pageSizeProp,
    defaultPageSize = 10,
    total = 0,
    onChange,
    showSizeChanger = false,
    showQuickJumper = false,
    showTotal = false,
    pageSizeOptions = [10, 20, 50, 100],
    className = "",
    style,
  }) => {
    const [current, setCurrent] = useState(defaultCurrent);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [jumpValue, setJumpValue] = useState("");

    const actualCurrent = currentProp !== undefined ? currentProp : current;
    const actualPageSize = pageSizeProp !== undefined ? pageSizeProp : pageSize;

    const totalPages = useMemo(() => {
      return Math.ceil(total / actualPageSize);
    }, [total, actualPageSize]);

    const pageNumbers = useMemo(() => {
      const pages = [];
      const showPages = 7;
      const half = Math.floor(showPages / 2);

      let start = Math.max(1, actualCurrent - half);
      let end = Math.min(totalPages, start + showPages - 1);

      if (end - start + 1 < showPages) {
        start = Math.max(1, end - showPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    }, [actualCurrent, totalPages]);

    const handleChange = (page) => {
      if (page < 1 || page > totalPages || page === actualCurrent) return;
      if (currentProp === undefined) {
        setCurrent(page);
      }
      if (onChange) {
        onChange(page, actualPageSize);
      }
    };

    const handlePageSizeChange = (e) => {
      const newSize = parseInt(e.target.value);
      if (pageSizeProp === undefined) {
        setPageSize(newSize);
      }
      const newPage = Math.min(actualCurrent, Math.ceil(total / newSize));
      if (currentProp === undefined) {
        setCurrent(newPage);
      }
      if (onChange) {
        onChange(newPage, newSize);
      }
    };

    const handleJumpChange = (e) => {
      setJumpValue(e.target.value.replace(/[^\d]/g, ""));
    };

    const handleJump = () => {
      const page = parseInt(jumpValue);
      if (page && page >= 1 && page <= totalPages) {
        handleChange(page);
      }
      setJumpValue("");
    };

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `pagination ${className}`,
        style: style,
      },
      showTotal &&
        /*#__PURE__*/ React.createElement(
          "span",
          { className: "pagination-total" },
          `共 ${total} 条`
        ),
      /*#__PURE__*/ React.createElement(
        "button",
        {
          className: "pagination-item pagination-prev",
          disabled: actualCurrent === 1,
          onClick: () => handleChange(actualCurrent - 1),
        },
        "<"
      ),
      pageNumbers[0] > 1 &&
        /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: `pagination-item ${1 === actualCurrent ? "pagination-item-active" : ""}`,
              onClick: () => handleChange(1),
            },
            "1"
          ),
          pageNumbers[0] > 2 &&
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "pagination-jump-prev" },
              "..."
            )
        ),
      pageNumbers.map((page) =>
        /*#__PURE__*/ React.createElement(
          "button",
          {
            key: page,
            className: `pagination-item ${page === actualCurrent ? "pagination-item-active" : ""}`,
            onClick: () => handleChange(page),
          },
          page
        )
      ),
      pageNumbers[pageNumbers.length - 1] < totalPages &&
        /*#__PURE__*/ React.createElement(
          React.Fragment,
          null,
          pageNumbers[pageNumbers.length - 1] < totalPages - 1 &&
            /*#__PURE__*/ React.createElement(
              "span",
              { className: "pagination-jump-next" },
              "..."
            ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: `pagination-item ${totalPages === actualCurrent ? "pagination-item-active" : ""}`,
              onClick: () => handleChange(totalPages),
            },
            totalPages
          )
        ),
      /*#__PURE__*/ React.createElement(
        "button",
        {
          className: "pagination-item pagination-next",
          disabled: actualCurrent >= totalPages,
          onClick: () => handleChange(actualCurrent + 1),
        },
        ">"
      ),
      showSizeChanger &&
        /*#__PURE__*/ React.createElement(
          "span",
          { className: "pagination-size-changer" },
          /*#__PURE__*/ React.createElement(
            "select",
            {
              value: actualPageSize,
              onChange: handlePageSizeChange,
              className: "pagination-size-select",
            },
            pageSizeOptions.map((size) =>
              /*#__PURE__*/ React.createElement(
                "option",
                { key: size, value: size },
                `${size} 条/页`
              )
            )
          )
        ),
      showQuickJumper &&
        /*#__PURE__*/ React.createElement(
          "span",
          { className: "pagination-quick-jumper" },
          "跳至",
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            value: jumpValue,
            onChange: handleJumpChange,
            onKeyDown: (e) => {
              if (e.key === "Enter") handleJump();
            },
            className: "pagination-jump-input",
          }),
          "页"
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Pagination = Pagination;
  window.Pagination = Pagination;
})();
