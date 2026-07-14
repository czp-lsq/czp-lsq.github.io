// components/Table.js - 表格组件
(function() {
  const { useState, useMemo } = React;

  const Table = ({
    columns = [],
    dataSource = [],
    rowKey = "id",
    loading = false,
    pagination,
    onChange,
    bordered = false,
    size = "default",
    scroll,
    className = "",
    style,
    onRow,
    rowClassName,
    emptyText = "暂无数据",
  }) => {
    const [sortedInfo, setSortedInfo] = useState(null);
    const [filteredInfo, setFilteredInfo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);

    const displayData = useMemo(() => {
      let data = [...dataSource];

      if (sortedInfo && sortedInfo.order) {
        data.sort((a, b) => {
          const aVal = a[sortedInfo.columnKey];
          const bVal = b[sortedInfo.columnKey];
          if (aVal < bVal) return sortedInfo.order === "ascend" ? -1 : 1;
          if (aVal > bVal) return sortedInfo.order === "ascend" ? 1 : -1;
          return 0;
        });
      }

      if (pagination !== false) {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        data = data.slice(start, end);
      }

      return data;
    }, [dataSource, sortedInfo, currentPage, pageSize, pagination]);

    const handleSort = (column) => {
      if (!column.sorter) return;

      let newOrder = null;
      if (!sortedInfo || sortedInfo.columnKey !== column.key) {
        newOrder = "ascend";
      } else if (sortedInfo.order === "ascend") {
        newOrder = "descend";
      }

      setSortedInfo(
        newOrder
          ? { columnKey: column.key, order: newOrder }
          : null
      );

      if (onChange) {
        onChange(
          { current: currentPage, pageSize },
          {},
          { columnKey: column.key, order: newOrder }
        );
      }
    };

    const total = dataSource.length;
    const totalPages = Math.ceil(total / pageSize);

    const handlePageChange = (page) => {
      setCurrentPage(page);
      if (pagination?.onChange) {
        pagination.onChange(page, pageSize);
      }
      if (onChange) {
        onChange(
          { current: page, pageSize },
          {},
          sortedInfo
        );
      }
    };

    const renderCell = (column, record, rowIndex) => {
      if (column.render) {
        return column.render(record[column.dataIndex], record, rowIndex);
      }
      return record[column.dataIndex];
    };

    return /*#__PURE__*/ React.createElement(
      "div",
      {
        className: `table-wrapper ${size !== "default" ? `table-${size}` : ""} ${bordered ? "table-bordered" : ""} ${className}`,
        style: style,
      },
      loading &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "table-loading" },
          /*#__PURE__*/ React.createElement("span", { className: "spinner" })
        ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          className: "table-scroll",
          style: scroll
            ? {
                maxHeight: scroll.y,
                overflowX: scroll.x ? "auto" : undefined,
              }
            : null,
        },
        /*#__PURE__*/ React.createElement(
          "table",
          { className: "table" },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              columns.map((col) =>
                /*#__PURE__*/ React.createElement(
                  "th",
                  {
                    key: col.key || col.dataIndex,
                    style: col.width ? { width: col.width } : null,
                    className: col.sorter ? "table-cell-sortable" : "",
                    onClick: () => handleSort(col),
                  },
                  col.title,
                  col.sorter && /*#__PURE__*/ React.createElement(
                    "span",
                    { className: "table-sorter" },
                    sortedInfo?.columnKey === col.key && sortedInfo.order === "ascend" ? " ↑" :
                    sortedInfo?.columnKey === col.key && sortedInfo.order === "descend" ? " ↓" : " ⇅"
                  )
                )
              )
            )
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            displayData.length === 0
              ? /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "td",
                    {
                      colSpan: columns.length,
                      className: "table-empty",
                    },
                    emptyText
                  )
                )
              : displayData.map((record, rowIndex) =>
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    {
                      key: record[rowKey] || rowIndex,
                      className: rowClassName
                        ? typeof rowClassName === "function"
                          ? rowClassName(record, rowIndex)
                          : rowClassName
                        : "",
                      onClick: onRow ? () => onRow(record, rowIndex) : null,
                    },
                    columns.map((col) =>
                      /*#__PURE__*/ React.createElement(
                        "td",
                        { key: col.key || col.dataIndex },
                        renderCell(col, record, rowIndex)
                      )
                    )
                  )
                )
          )
        )
      ),
      pagination !== false && total > 0 &&
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "table-pagination" },
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "table-pagination-total" },
            `共 ${total} 条`
          ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: "btn btn-default btn-sm",
              disabled: currentPage === 1,
              onClick: () => handlePageChange(currentPage - 1),
            },
            "上一页"
          ),
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "table-pagination-pages" },
            `${currentPage} / ${totalPages || 1}`
          ),
          /*#__PURE__*/ React.createElement(
            "button",
            {
              className: "btn btn-default btn-sm",
              disabled: currentPage >= totalPages,
              onClick: () => handlePageChange(currentPage + 1),
            },
            "下一页"
          )
        )
    );
  };

  if (!window.Components) window.Components = {};
  window.Components.Table = Table;
  window.Table = Table;
})();
