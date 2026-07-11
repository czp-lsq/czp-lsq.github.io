// toast - Toast通知系统组件与Hook
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, title, message, duration = 3000) => {
    const id = Utils.uniqueId();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const getIcon = (type) => {
    const props = { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
    if (type === "success") return React.createElement("svg", props, React.createElement("polyline", { points: "20 6 9 17 4 12" }));
    if (type === "error") return React.createElement("svg", props, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" }));
    if (type === "warning") return React.createElement("svg", props, React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }), React.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" }));
    return React.createElement("svg", props, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" }));
  };

  return React.createElement(ToastContext.Provider, { value: { addToast } },
    children,
    React.createElement("div", { className: "toast-container" },
      toasts.map(toast =>
        React.createElement("div", { key: toast.id, className: `toast ${toast.type}` },
          React.createElement("div", { className: "toast-icon" }, getIcon(toast.type)),
          React.createElement("div", { className: "toast-content" },
            React.createElement("div", { className: "toast-title" }, toast.title),
            React.createElement("div", { className: "toast-message" }, toast.message)
          )
        )
      )
    )
  );
};

const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {} };
  return ctx;
};

// 模态框
