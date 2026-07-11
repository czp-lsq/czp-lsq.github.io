// modal - 模态框组件集合
const Modal = ({ title, children, onClose, footer, width, large, type = "default" }) => {
  const portalContainerRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);

  useEffect(() => {
    if (!portalContainerRef.current) {
      portalContainerRef.current = document.createElement('div');
      document.body.appendChild(portalContainerRef.current);
    }
    setContainerReady(true);

    const handleKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      try {
        if (portalContainerRef.current && document.body.contains(portalContainerRef.current)) {
          document.body.removeChild(portalContainerRef.current);
        }
      } catch (e) {}
      portalContainerRef.current = null;
      setContainerReady(false);
    };
  }, [onClose]);

  if (!containerReady || !portalContainerRef.current) return null;

  return ReactDOM.createPortal(
    React.createElement("div", {
      className: "modal-mask",
      onClick: (e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }
    },
      React.createElement("div", {
        className: `modal ${large ? 'modal-large' : ''} modal-${type}`,
        style: { maxWidth: width || (large ? "860px" : "540px") },
        onClick: (e) => e.stopPropagation()
      },
        React.createElement("div", { className: "modal-header" },
          React.createElement("div", { className: "modal-title" }, title),
          React.createElement("button", {
            className: "modal-close",
            onClick: () => onClose && onClose()
          },
            React.createElement(Icons.X, null)
          )
        ),
        React.createElement("div", { className: "modal-body" }, children),
        footer && React.createElement("div", { className: "modal-footer" }, footer)
      )
    ),
    portalContainerRef.current
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel, type = "warning" }) => {
  return React.createElement(Modal, {
    title: title || "确认操作",
    type: type,
    onClose: onCancel,
    footer: React.createElement(React.Fragment, null,
      React.createElement("button", { className: "btn btn-default", onClick: onCancel }, "取消"),
      React.createElement("button", { className: type === "danger" ? "btn btn-danger" : "btn btn-primary", onClick: onConfirm }, "确认")
    )
  },
    React.createElement("p", { style: { color: "var(--color-text-secondary)", lineHeight: 1.7 } }, message)
  );
};

const AlertModal = ({ title, message, onConfirm, type = "info" }) => {
  return React.createElement(Modal, {
    title: title,
    type: type,
    onClose: onConfirm,
    footer: React.createElement("button", { className: "btn btn-primary", onClick: onConfirm }, "我知道了")
  },
    React.createElement("p", { style: { color: "var(--color-text-secondary)", lineHeight: 1.7, whiteSpace: "pre-line" } }, message)
  );
};