// core/icons.js - SVG 图标库 (Icons)
const Icons = {
  Home: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
    React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })
  ),
  Layout: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
    React.createElement("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
    React.createElement("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
  ),
  FileText: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    React.createElement("polyline", { points: "14 2 14 8 20 8" })
  ),
  Edit3: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M12 20h9" }),
    React.createElement("path", { d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" })
  ),
  Calculator: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }),
    React.createElement("line", { x1: "8", y1: "6", x2: "16", y2: "6" }),
    React.createElement("line", { x1: "16", y1: "14", x2: "16", y2: "18" }),
    React.createElement("line", { x1: "8", y1: "10", x2: "8", y2: "10" }),
    React.createElement("line", { x1: "12", y1: "10", x2: "12", y2: "10" }),
    React.createElement("line", { x1: "16", y1: "10", x2: "16", y2: "10" }),
    React.createElement("line", { x1: "8", y1: "14", x2: "8", y2: "14" }),
    React.createElement("line", { x1: "12", y1: "14", x2: "12", y2: "14" }),
    React.createElement("line", { x1: "8", y1: "18", x2: "8", y2: "18" }),
    React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "18" })
  ),
  Layers: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }),
    React.createElement("polyline", { points: "2 17 12 22 22 17" }),
    React.createElement("polyline", { points: "2 12 12 17 22 12" })
  ),
  Database: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }),
    React.createElement("path", { d: "M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" }),
    React.createElement("path", { d: "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" })
  ),
  Settings: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "3" }),
    React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })
  ),
  Plus: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
  ),
  Trash: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "3 6 5 6 21 6" }),
    React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
  ),
  Upload: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
    React.createElement("polyline", { points: "17 8 12 3 7 8" }),
    React.createElement("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
  ),
  Download: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
    React.createElement("polyline", { points: "7 10 12 15 17 10" }),
    React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
  ),
  Save: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }),
    React.createElement("polyline", { points: "17 21 17 13 7 13 7 21" }),
    React.createElement("polyline", { points: "7 3 7 8 15 8" })
  ),
  X: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ),
  Check: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "20 6 9 17 4 12" })
  ),
  Info: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
    React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
  ),
  AlertCircle: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
    React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
  ),
  AlertTriangle: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
    React.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
    React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ),
  CheckCircle: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
    React.createElement("polyline", { points: "22 4 12 14.01 9 11.01" })
  ),
  XCircle: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
    React.createElement("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
  ),
  Inbox: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }),
    React.createElement("path", { d: "M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" })
  ),
  ChevronUp: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "18 15 12 9 6 15" })
  ),
  ChevronDown: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "6 9 12 15 18 9" })
  ),
  ChevronRight: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "9 18 15 12 9 6" })
  ),
  ChevronLeft: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "15 18 9 12 15 6" })
  ),
  Play: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polygon", { points: "5 3 19 12 5 21 5 3" })
  ),
  Store: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M3 9l1-5h16l1 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" }),
    React.createElement("path", { d: "M3 9h18" })
  ),
  Eye: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
    React.createElement("circle", { cx: "12", cy: "12", r: "3" })
  ),
  Edit: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
    React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
  ),
  Copy: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
    React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
  ),
  Search: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
    React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ),
  Refresh: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "23 4 23 10 17 10" }),
    React.createElement("polyline", { points: "1 20 1 14 7 14" }),
    React.createElement("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })
  ),
  FileSpreadsheet: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    React.createElement("polyline", { points: "14 2 14 8 20 8" }),
    React.createElement("line", { x1: "8", y1: "13", x2: "16", y2: "13" }),
    React.createElement("line", { x1: "8", y1: "17", x2: "16", y2: "17" })
  ),
  Zap: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })
  ),
  Users: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: "9", cy: "7", r: "4" }),
    React.createElement("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
    React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
  ),
  TrendingUp: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }),
    React.createElement("polyline", { points: "17 6 23 6 23 12" })
  ),
  Filter: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" })
  ),
  Clock: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("polyline", { points: "12 6 12 12 16 14" })
  ),
  History: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
    React.createElement("polyline", { points: "3 3 3 8 8 8" }),
    React.createElement("polyline", { points: "12 7 12 12 16 14" })
  ),
  Bug: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "8", y: "6", width: "8", height: "14", rx: "4" }),
    React.createElement("path", { d: "M19 7l-3 2M5 7l3 2M19 13h-3M5 13h3M19 19l-3-2M5 19l3-2M12 4v2" })
  ),
  Menu: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12" }),
    React.createElement("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
    React.createElement("line", { x1: "3", y1: "18", x2: "21", y2: "18" })
  ),
  ArrowRight: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
    React.createElement("polyline", { points: "12 5 19 12 12 19" })
  ),
  Sparkles: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" })
  ),
  HardDrive: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "22", y1: "12", x2: "2", y2: "12" }),
    React.createElement("path", { d: "M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" })
  ),
  Pencil: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" })
  ),
  EyeOff: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }),
    React.createElement("line", { x1: "1", y1: "1", x2: "23", y2: "23" })
  ),
  MoveUp: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "18 8 18 2 12 2 12 8" }),
    React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "22" })
  ),
  MoveDown: () => React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "6 16 6 22 12 22 12 16" }),
    React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "22" })
  ),
  HelpCircle: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ),
  Warning: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
    React.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
    React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ),
  BarChart3: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M18 20V10" }),
    React.createElement("path", { d: "M12 20V4" }),
    React.createElement("path", { d: "M6 20v-6" })
  ),
  Bell: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
    React.createElement("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
  ),
  Lock: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
    React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
  ),
  LogOut: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
    React.createElement("polyline", { points: "16 17 21 12 16 7" }),
    React.createElement("line", { x1: "21", y1: "12", x2: "9", y2: "12" })
  ),
  User: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: "12", cy: "7", r: "4" })
  ),
  ArrowUpDown: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M12 19V5" }),
    React.createElement("polyline", { points: "5 12 12 5 19 12" }),
    React.createElement("path", { d: "M12 5v14" }),
    React.createElement("polyline", { points: "5 12 12 19 19 12" })
  ),
  PieChart: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
    React.createElement("path", { d: "M3 3v5h5" }),
    React.createElement("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }),
    React.createElement("path", { d: "M16 21h5v-5" })
  ),
  Sun: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "5" }),
    React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }),
    React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }),
    React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }),
    React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }),
    React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }),
    React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }),
    React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }),
    React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })
  ),
  Moon: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
  ),
  Type: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "4 7 4 4 20 4 20 7" }),
    React.createElement("line", { x1: "9", y1: "20", x2: "15", y2: "20" }),
    React.createElement("line", { x1: "12", y1: "4", x2: "12", y2: "20" })
  ),
  Hash: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "4", y1: "9", x2: "20", y2: "9" }),
    React.createElement("line", { x1: "4", y1: "15", x2: "20", y2: "15" }),
    React.createElement("line", { x1: "10", y1: "3", x2: "8", y2: "21" }),
    React.createElement("line", { x1: "16", y1: "3", x2: "14", y2: "21" })
  ),
  Table: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
    React.createElement("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
    React.createElement("line", { x1: "3", y1: "15", x2: "21", y2: "15" }),
    React.createElement("line", { x1: "12", y1: "3", x2: "12", y2: "21" })
  ),
  GitBranch: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "6", y1: "3", x2: "6", y2: "15" }),
    React.createElement("circle", { cx: "18", cy: "6", r: "3" }),
    React.createElement("circle", { cx: "6", cy: "18", r: "3" }),
    React.createElement("path", { d: "M18 9a9 9 0 0 1-9 9" })
  ),
  Link: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
    React.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })
  ),
  Sigma: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M18 7V5H6v2l6 6-6 6v2h12v-2" })
  ),
  FunctionSquare: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
    React.createElement("path", { d: "M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" }),
    React.createElement("path", { d: "M9 11h6" })
  ),
  Server: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "2", y: "2", width: "20", height: "8", rx: "2", ry: "2" }),
    React.createElement("rect", { x: "2", y: "14", width: "20", height: "8", rx: "2", ry: "2" }),
    React.createElement("line", { x1: "6", y1: "6", x2: "6.01", y2: "6" }),
    React.createElement("line", { x1: "6", y1: "18", x2: "6.01", y2: "18" })
  ),
  Trash2: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "3 6 5 6 21 6" }),
    React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
    React.createElement("line", { x1: "10", y1: "11", x2: "10", y2: "17" }),
    React.createElement("line", { x1: "14", y1: "11", x2: "14", y2: "17" })
  ),
  RefreshCw: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "23 4 23 10 17 10" }),
    React.createElement("polyline", { points: "1 20 1 14 7 14" }),
    React.createElement("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })
  ),
  HardDrive: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "22", y1: "12", x2: "2", y2: "12" }),
    React.createElement("path", { d: "M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }),
    React.createElement("line", { x1: "6", y1: "16", x2: "6.01", y2: "16" }),
    React.createElement("line", { x1: "10", y1: "16", x2: "10.01", y2: "16" })
  ),
  ChevronDown: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "6 9 12 15 18 9" })
  ),
  ChevronRight: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "9 18 15 12 9 6" })
  ),
  Plus: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
  ),
  Minus: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
  ),
  XCircle: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
    React.createElement("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
  ),
  Inbox: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }),
    React.createElement("path", { d: "M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" })
  ),
  FolderOpen: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M6 14l1.5-3.5c.5-1.2 1.5-2 2.8-2h8.2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2z" }),
    React.createElement("path", { d: "M2 10V7a2 2 0 0 1 2-2h4.5l2 2H20a2 2 0 0 1 2 2" })
  ),
  Folder: () => React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })
  ),
  Map: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" }),
    React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "18" }),
    React.createElement("line", { x1: "16", y1: "6", x2: "16", y2: "22" })
  ),
  GitMerge: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "18", cy: "18", r: "3" }),
    React.createElement("circle", { cx: "6", cy: "6", r: "3" }),
    React.createElement("path", { d: "M6 21V9a9 9 0 0 0 9 9h3" })
  ),
  Filter: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" })
  ),
};
