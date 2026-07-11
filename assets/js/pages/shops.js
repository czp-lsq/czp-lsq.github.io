// ShopsPage - 店铺管理页面组件
const ShopsPage = ({ state, currentPlatform }) => {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", note: "" });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const platform = state.platforms.find((p) => p.id === currentPlatform);
  const shops = platform?.shops || [];
  const handleSave = () => {
    if (!formData.name.trim()) {
      addToast("warning", "验证失败", "店铺名称不能为空");
      return;
    }
    const shopData = {
      id: editingShop
        ? editingShop.id
        : `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: formData.name.trim(),
      code: formData.code.trim(),
      note: formData.note.trim(),
      createdAt: editingShop ? editingShop.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    Store.set((s) => ({
      ...s,
      platforms: s.platforms.map((p) => {
        if (p.id !== currentPlatform) return p;
        const existing = p.shops || [];
        if (editingShop) {
          return {
            ...p,
            shops: existing.map((sh) =>
              sh.id === editingShop.id ? shopData : sh,
            ),
          };
        }
        return { ...p, shops: [...existing, shopData] };
      }),
    }));
    addToast(
      "success",
      editingShop ? "更新成功" : "添加成功",
      `店铺「${shopData.name}」已${editingShop ? "更新" : "添加"}`,
    );
    setShowAddModal(false);
    setEditingShop(null);
    setFormData({ name: "", code: "", note: "" });
  };
  const handleDelete = (shop) => {
    setConfirmDialog({
      title: "确认删除店铺",
      message: `确认删除店铺「${shop.name}」？此操作不可撤销。`,
      type: "danger",
      onConfirm: () => {
        Store.set((s) => ({
          ...s,
          platforms: s.platforms.map((p) => {
            if (p.id !== currentPlatform) return p;
            return {
              ...p,
              shops: (p.shops || []).filter((sh) => sh.id !== shop.id),
            };
          }),
        }));
        addToast("success", "删除成功", `店铺「${shop.name}」已删除`);
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const openEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      code: shop.code || "",
      note: shop.note || "",
    });
    setShowAddModal(true);
  };
  const openAdd = () => {
    setEditingShop(null);
    setFormData({ name: "", code: "", note: "" });
    setShowAddModal(true);
  };
  const handleImportFromExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await ExcelUtils.parse(file);
      const sheet = Object.values(result.sheets)[0];
      if (!sheet || !sheet.rows.length) {
        addToast("warning", "导入失败", "文件中未找到数据");
        return;
      }
      const headers = sheet.headers.map((h) => String(h).trim());
      const nameIdx = headers.findIndex((h) => /店铺|名称|name|店名/i.test(h));
      const codeIdx = headers.findIndex((h) => /编号|代码|code|ID/i.test(h));
      const noteIdx = headers.findIndex((h) => /备注|说明|note|描述/i.test(h));
      if (nameIdx === -1) {
        addToast(
          "warning",
          "导入失败",
          "未找到「店铺名称」列，请确保表头包含「店铺名称」或「name」",
        );
        return;
      }
      const imported = [];
      sheet.rows.forEach((row) => {
        const name = row[headers[nameIdx]];
        if (name && String(name).trim()) {
          imported.push({
            id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: String(name).trim(),
            code:
              codeIdx >= 0 ? String(row[headers[codeIdx]] || "").trim() : "",
            note:
              noteIdx >= 0 ? String(row[headers[noteIdx]] || "").trim() : "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });
      if (imported.length === 0) {
        addToast("warning", "导入失败", "未找到有效的店铺数据");
        return;
      }
      Store.set((s) => ({
        ...s,
        platforms: s.platforms.map((p) => {
          if (p.id !== currentPlatform) return p;
          return { ...p, shops: [...(p.shops || []), ...imported] };
        }),
      }));
      addToast("success", "导入成功", `成功导入 ${imported.length} 个店铺`);
      ActivityLogger.add(
        "批量导入店铺",
        `${platform?.name} - ${imported.length}个`,
      );
    } catch (err) {
      addToast("error", "导入失败", err.message);
    }
    e.target.value = "";
  };

  return /*#__PURE__*/ React.createElement(
    "div",
    { className: "shops-page fade-in" },
    /*#__PURE__*/ React.createElement(
      "div",
      { className: "card" },
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "card-header" },
        /*#__PURE__*/ React.createElement(
          "div",
          null,
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card-title" },
            /*#__PURE__*/ React.createElement(Icons.Store, null),
            platform?.name,
            " \u5E97\u94FA\u7BA1\u7406",
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            { className: "card-desc" },
            "\u7BA1\u7406",
            platform?.name,
            "\u4E0B\u7684\u5E97\u94FA\uFF0C\u7528\u4E8E\u6279\u91CF\u8BA1\u7B97\u65F6\u81EA\u52A8\u5206\u53D1\u6570\u636E",
          ),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { style: { display: "flex", gap: 10 } },
          /*#__PURE__*/ React.createElement(
            Button,
            {
              onClick: () =>
                document.getElementById("shop-import-input")?.click(),
            },
            /*#__PURE__*/ React.createElement(Icons.Upload, null),
            "Excel\u5BFC\u5165",
          ),
          /*#__PURE__*/ React.createElement("input", {
            id: "shop-import-input",
            type: "file",
            accept: ".xlsx,.xls",
            onChange: handleImportFromExcel,
            style: { display: "none" },
          }),
          /*#__PURE__*/ React.createElement(
            Button,
            { type: "primary", onClick: openAdd },
            /*#__PURE__*/ React.createElement(Icons.Plus, null),
            "\u6DFB\u52A0\u5E97\u94FA",
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "data-table-container" },
        /*#__PURE__*/ React.createElement(
          "table",
          { className: "table" },
          /*#__PURE__*/ React.createElement(
            "thead",
            null,
            /*#__PURE__*/ React.createElement(
              "tr",
              null,
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 60 } },
                "#",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u5E97\u94FA\u540D\u79F0",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u5E97\u94FA\u7F16\u53F7",
              ),
              /*#__PURE__*/ React.createElement("th", null, "\u5907\u6CE8"),
              /*#__PURE__*/ React.createElement(
                "th",
                null,
                "\u6DFB\u52A0\u65F6\u95F4",
              ),
              /*#__PURE__*/ React.createElement(
                "th",
                { style: { width: 140 } },
                "\u64CD\u4F5C",
              ),
            ),
          ),
          /*#__PURE__*/ React.createElement(
            "tbody",
            null,
            shops.length === 0
              ? /*#__PURE__*/ React.createElement(
                  "tr",
                  null,
                  /*#__PURE__*/ React.createElement(
                    "td",
                    { colSpan: 6 },
                    /*#__PURE__*/ React.createElement(
                      "div",
                      { className: "empty", style: { padding: "40px 20px" } },
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty-icon" },
                        "\uD83C\uDFEA",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty-text" },
                        "\u6682\u65E0\u5E97\u94FA",
                      ),
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "empty-desc" },
                        "\u6DFB\u52A0\u5E97\u94FA\u6216\u4ECEExcel\u5BFC\u5165",
                      ),
                    ),
                  ),
                )
              : shops.map((shop, idx) =>
                  /*#__PURE__*/ React.createElement(
                    "tr",
                    { key: shop.id },
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: { color: "var(--color-text-tertiary)", fontSize: 12 },
                      },
                      idx + 1,
                    ),
                    /*#__PURE__*/ React.createElement(
                  "td",
                  { className: "shop-name-cell" },
                  shop.name,
                ),
                /*#__PURE__*/ React.createElement(
                  "td",
                  { className: "shop-code-cell" },
                  shop.code
                        ? /*#__PURE__*/ React.createElement(
                            Tag,
                            { type: "default" },
                            shop.code,
                          )
                        : /*#__PURE__*/ React.createElement(
                            "span",
                            { style: { color: "var(--color-text-muted)" } },
                            "-",
                          ),
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: {
                          color: "var(--color-text-tertiary)",
                          fontSize: 12,
                          maxWidth: 200,
                        },
                        className: "truncate",
                      },
                      shop.note || "-",
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      {
                        style: { fontSize: 12, color: "var(--color-text-tertiary)" },
                      },
                      new Date(shop.createdAt).toLocaleDateString("zh-CN"),
                    ),
                    /*#__PURE__*/ React.createElement(
                      "td",
                      null,
                      /*#__PURE__*/ React.createElement(
                        "div",
                        { className: "action-btn-group" },
                        /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            className: "action-btn action-edit",
                            onClick: () => openEdit(shop),
                            title: "\u7F16\u8F91\u5E97\u94FA",
                          },
                          /*#__PURE__*/ React.createElement(
                            Icons.Settings,
                            null,
                          ),
                          " \u7F16\u8F91",
                        ),
                        /*#__PURE__*/ React.createElement(
                          "button",
                          {
                            className: "action-btn action-delete",
                            onClick: () => handleDelete(shop),
                            title: "\u5220\u9664\u5E97\u94FA",
                          },
                          /*#__PURE__*/ React.createElement(Icons.Trash, null),
                          " \u5220\u9664",
                        ),
                      ),
                    ),
                  ),
                ),
          ),
        ),
      ),
      /*#__PURE__*/ React.createElement(
        "div",
        { className: "table-footer" },
        /*#__PURE__*/ React.createElement(
          "span",
          null,
          "\u5171 ",
          shops.length,
          " \u4E2A\u5E97\u94FA",
        ),
        /*#__PURE__*/ React.createElement(
          "span",
          null,
          platform?.name,
          "\u5E73\u53F0",
        ),
      ),
    ),
    showAddModal &&
      /*#__PURE__*/ React.createElement(
        Modal,
        {
          title: editingShop ? "编辑店铺" : "添加店铺",
          onClose: () => {
            setShowAddModal(false);
            setEditingShop(null);
          },
          footer: /*#__PURE__*/ React.createElement(
            React.Fragment,
            null,
            /*#__PURE__*/ React.createElement(
              Button,
              {
                onClick: () => {
                  setShowAddModal(false);
                  setEditingShop(null);
                },
              },
              "\u53D6\u6D88",
            ),
            /*#__PURE__*/ React.createElement(
              Button,
              { type: "primary", onClick: handleSave },
              editingShop ? "保存修改" : "添加店铺",
            ),
          ),
        },
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5E97\u94FA\u540D\u79F0 ",
            /*#__PURE__*/ React.createElement(
              "span",
              { style: { color: "var(--color-danger)" } },
              "*",
            ),
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            placeholder:
              "\u5982\uFF1A\u65D7\u8230\u5E97\u3001\u4E13\u8425\u5E97\u7B49",
            value: formData.name,
            onChange: (e) => setFormData({ ...formData, name: e.target.value }),
            autoFocus: true,
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5E97\u94FA\u7F16\u53F7",
          ),
          /*#__PURE__*/ React.createElement("input", {
            type: "text",
            className: "input",
            placeholder:
              "\u5E97\u94FA\u5185\u90E8\u7F16\u53F7\uFF08\u9009\u586B\uFF09",
            value: formData.code,
            onChange: (e) => setFormData({ ...formData, code: e.target.value }),
          }),
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          { className: "form-item" },
          /*#__PURE__*/ React.createElement(
            "label",
            { className: "form-label" },
            "\u5907\u6CE8",
          ),
          /*#__PURE__*/ React.createElement("textarea", {
            className: "input",
            placeholder: "\u5907\u6CE8\u4FE1\u606F\uFF08\u9009\u586B\uFF09",
            value: formData.note,
            onChange: (e) => setFormData({ ...formData, note: e.target.value }),
            rows: 3,
            style: { resize: "vertical" },
          }),
        ),
      ),
    confirmDialog &&
      /*#__PURE__*/ React.createElement(ConfirmModal, {
        title: confirmDialog.title,
        message: confirmDialog.message,
        type: confirmDialog.type,
        onConfirm: confirmDialog.onConfirm,
        onCancel: confirmDialog.onCancel,
      }),
  );
}; // ========== Settings Page ==========
