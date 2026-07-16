const FieldConfig = ({ selectedField, onFieldNameChange }) => {
  if (!selectedField) {
    return /*#__PURE__*/ React.createElement(
      "div",
      { className: "empty", style: { padding: "40px 20px" } },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "empty-icon" },
        "\uD83D\uDC46",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "empty-text" },
        "\u9009\u62E9\u5DE6\u4FA7\u5B57\u6BB5\u67E5\u770B\u8BE6\u60C5",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "empty-desc" },
        "\u70B9\u51FB\u5B57\u6BB5\u53EF\u7F16\u8F91\u540D\u79F0\u548C\u67E5\u770B\u5C5E\u6027",
      ),
    );
  }
  return /*#__PURE__*/ React.createElement(
    "div",
    { style: { width: "100%", textAlign: "left", flex: "none" } },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "form-item" },
      /*#__PURE__*/ React.createElement(
        "label",
        { className: "form-label" },
        "\u5B57\u6BB5\u540D\u79F0",
      ),
      /*#__PURE__*/ React.createElement("input", {
        type: "text",
        className: "input",
        value: selectedField.name,
        onChange: (e) => {
          onFieldNameChange(selectedField.id, e.target.value);
        },
      }),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "form-item" },
      /*#__PURE__*/ React.createElement(
        "label",
        { className: "form-label" },
        "\u5355\u5143\u683C\u4F4D\u7F6E",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            padding: "10px 14px",
            background: "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          },
        },
        selectedField.cell,
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "form-item" },
      /*#__PURE__*/ React.createElement(
        "label",
        { className: "form-label" },
        "\u5B57\u6BB5\u7C7B\u578B",
      ),
      /*#__PURE__*/ React.createElement(
        Tag,
        {
          type:
            selectedField.type === "text"
              ? "primary"
              : "success",
        },
        selectedField.type === "text"
          ? "文本填充"
          : "数值填充",
      ),
      selectedField.semanticType === "shop" &&
        /*#__PURE__*/ React.createElement(
          Tag,
          { type: "info", style: { marginLeft: 4, fontSize: 10 } },
          "\u5E97\u94FA\u540D",
        ),
      selectedField.semanticType === "date" &&
        /*#__PURE__*/ React.createElement(
          Tag,
          { type: "success", style: { marginLeft: 4, fontSize: 10 } },
          "\u65E5\u671F",
        ),
      selectedField.groupCount > 1 &&
        /*#__PURE__*/ React.createElement(
          "span",
          {
            style: {
              marginLeft: 8,
              fontSize: 12,
              color: "var(--color-primary)",
            },
          },
          "\u5206\u7EC4: \u7B2C",
          selectedField.groupIndex + 1,
          "\u5904 / \u5171",
          selectedField.groupCount,
          "\u5904",
        ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "form-item" },
      /*#__PURE__*/ React.createElement(
        "label",
        { className: "form-label" },
        "\u539F\u59CB\u503C",
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        {
          style: {
            padding: "10px 14px",
            background: "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          },
        },
        selectedField.originalValue || "(空)",
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "form-item" },
      /*#__PURE__*/ React.createElement(
        "label",
        { className: "form-label" },
        "\u5339\u914D\u6A21\u5F0F",
      ),
      /*#__PURE__*/ React.createElement(
        Tag,
        { type: "info" },
        selectedField.markerMatch,
      ),
    ),
  );
};