// modal - 模态框组件集合
const Modal = ({ title, children, onClose, footer, width, large, type = "default" }) => {
  const portalContainerRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!portalContainerRef.current) {
      portalContainerRef.current = document.createElement('div');
      document.body.appendChild(portalContainerRef.current);
    }
    setContainerReady(true);
    document.body.style.overflow = "hidden";

    const handleKey = (e) => { if (e.key === "Escape" && onCloseRef.current) onCloseRef.current(); };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      try {
        if (portalContainerRef.current && document.body.contains(portalContainerRef.current)) {
          document.body.removeChild(portalContainerRef.current);
        }
      } catch (e) {}
      portalContainerRef.current = null;
      setContainerReady(false);
    };
  }, []);

  if (!containerReady || !portalContainerRef.current) return null;

  return ReactDOM.createPortal(
    React.createElement("div", {
      className: "modal-mask",
      onClick: (e) => {
        if (e.target === e.currentTarget && onCloseRef.current) onCloseRef.current();
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
            onClick: () => onCloseRef.current && onCloseRef.current()
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

const ConfirmModal = ({ title, message, onConfirm, onCancel, type = "warning", confirmText = "确认", cancelText = "取消" }) => {
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
    onCancelRef.current = onCancel;
  });

  // 键盘操作支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (onConfirmRef.current) onConfirmRef.current();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (onCancelRef.current) onCancelRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // 自动聚焦确认按钮
    setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return React.createElement(Modal, {
    title: title || "确认操作",
    type: type,
    onClose: onCancel,
    footer: React.createElement(React.Fragment, null,
      React.createElement("button", { 
        className: "btn btn-default", 
        onClick: onCancel 
      }, cancelText),
      React.createElement("button", { 
        ref: confirmBtnRef,
        className: type === "danger" ? "btn btn-danger" : "btn btn-primary", 
        onClick: onConfirm 
      }, confirmText)
    )
  },
    React.createElement("p", { style: { color: "var(--color-text-secondary)", lineHeight: 1.7 } }, message)
  );
};

const AlertModal = ({ title, message, onConfirm, type = "info", confirmText = "我知道了" }) => {
  const onConfirmRef = useRef(onConfirm);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  });

  // 键盘操作支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        if (onConfirmRef.current) onConfirmRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // 自动聚焦确认按钮
    setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return React.createElement(Modal, {
    title: title,
    type: type,
    onClose: onConfirm,
    footer: React.createElement("button", { 
      ref: confirmBtnRef,
      className: "btn btn-primary", 
      onClick: onConfirm 
    }, confirmText)
  },
    React.createElement("p", { style: { color: "var(--color-text-secondary)", lineHeight: 1.7, whiteSpace: "pre-line" } }, message)
  );
};