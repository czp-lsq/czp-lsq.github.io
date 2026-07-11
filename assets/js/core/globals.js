// core/globals.js - 全局变量、React Hooks 解构、错误边界与 Toast 上下文
const { useState, useEffect, useRef, useCallback, useMemo, Component, memo, createContext, useContext } = React;

// 错误边界组件
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return React.createElement("div", { className: "error-boundary", style: { padding: "40px", textAlign: "center" } },
        React.createElement("div", { style: { fontSize: "48px", marginBottom: "16px" } }, "⚠️"),
        React.createElement("h2", { style: { color: "var(--color-danger)", marginBottom: "12px" } }, "页面出现错误"),
        React.createElement("p", { style: { color: "var(--color-text-tertiary)", marginBottom: "16px" } }, this.state.error?.message || "发生了未知错误"),
        React.createElement("button", {
          className: "btn btn-primary",
          onClick: () => { this.setState({ hasError: false, error: null }); window.location.reload(); }
        }, "刷新页面")
      );
    }
    return this.props.children;
  }
}

// Toast 上下文
const ToastContext = React.createContext(null);
