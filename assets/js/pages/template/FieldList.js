const FieldList = ({ fields, selectedField, onSelectField }) => {
  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "card" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "card-header" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "card-title", style: { fontSize: 14 } },
        /*#__PURE__*/ React.createElement(Icons.Layers, null),
        "\u8BC6\u522B\u5230\u7684\u5B57\u6BB5",
      ),
    ),
    /*#__PURE__*/ React.createElement(
      "ul",
      { className: "field-list" },
      fields.map((field) =>
        /*#__PURE__*/ React.createElement(
          "li",
          {
            key: field.id,
            className: `field-item ${selectedField?.id === field.id ? "active" : ""}`,
            onClick: () => onSelectField(field),
          },
          /*#__PURE__*/ React.createElement("span", {
            className: `field-dot ${field.type === "number" ? "done" : ""}`,
          }),
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "field-name" },
            field.name,
          ),
          field.semanticType === "shop" &&
            /*#__PURE__*/ React.createElement(
              Tag,
              { type: "info", style: { marginLeft: 4, fontSize: 10 } },
              "\u5E97\u94FA",
            ),
          field.semanticType === "date" &&
            /*#__PURE__*/ React.createElement(
              Tag,
              { type: "success", style: { marginLeft: 4, fontSize: 10 } },
              "\u65E5\u671F",
            ),
          field.groupCount > 1 &&
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontSize: 10,
                  color: "var(--color-primary)",
                  background: "var(--color-primary-50)",
                  padding: "1px 5px",
                  borderRadius: 4,
                  marginLeft: 4,
                },
              },
              field.groupIndex + 1,
              "/",
              field.groupCount,
            ),
          /*#__PURE__*/ React.createElement(
            "span",
            { className: "field-cell" },
            field.cell,
          ),
        ),
      ),
    ),
  );
};