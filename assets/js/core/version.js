const APP_VERSION = "czp-1.13.0";
const DATA_VERSION = "7.0.0";
const VERSION_KEY = "app_version_seen";
const VERSION_HISTORY_KEY = "app_version_history";
const UPDATE_LOG = [
  { version: "czp-1.13.0", date: "2026-07-13 21:00:00",
    summary: "数据持久化升级与系统稳定性增强",
    changes: [
      { type: "feature", text: "新增 IndexedDB 数据持久化存储，支持大容量数据存储" },
      { type: "feature", text: "数据自动备份机制，保留最近20个历史备份版本" },
      { type: "feature", text: "一键数据导出/导入功能，支持合并和替换两种模式" },
      { type: "feature", text: "localStorage + IndexedDB 双层缓存，提升读取性能" },
      { type: "feature", text: "跨标签页数据同步，多标签页实时同步数据变更" },
      { type: "optimize", text: "数据存储方案重构，为多设备云同步奠定基础" },
    ],
    bugfixes: [
      { text: "修复计算规则页面语法错误导致的页面加载失败问题" },
      { text: "修复数据意外丢失后无法恢复的问题" },
    ],
  },
  { version: "czp-1.12.0", date: "2026-07-13 20:00:00",
    summary: "功能优化与数据持久化增强",
    changes: [
      { type: "feature", text: "计算规则页面空状态布局优化，左右统一显示" },
      { type: "feature", text: "添加计算步骤弹窗新增搜索功能，支持按名称和描述搜索" },
      { type: "feature", text: "添加计算步骤弹窗新增分类筛选标签，快速定位步骤类型" },
      { type: "feature", text: "版本号统一为全局常量管理，确保所有页面版本信息一致" },
      { type: "feature", text: "下拉框组件搜索框样式优化，添加聚焦边框高亮效果" },
      { type: "feature", text: "下拉框选项列表优化，添加选中状态图标和悬停效果" },
      { type: "optimize", text: "页面关闭/刷新前自动保存数据，防止数据丢失" },
      { type: "optimize", text: "定时自动保存机制，每30秒检测并保存变更数据" },
    ],
    bugfixes: [
      { text: "修复更新弹窗不显示的问题" },
      { text: "修复点击更新日志报错的问题" },
      { text: "修复下拉框不显示选中值的bug" },
      { text: "修复页面刷新后上传数据丢失的问题" },
    ],
  },
  { version: "czp-1.11.0", date: "2026-07-13 19:30:00",
    summary: "样式优化与交互体验提升",
    changes: [
      { type: "feature", text: "数据源选取表格样式优化，支持长文件名换行显示" },
      { type: "feature", text: "版本号前缀 v 移除，统一显示为 czp-x.x.x" },
      { type: "feature", text: "账号管理页面操作按钮优化为图标形式，节省空间" },
      { type: "feature", text: "下拉框组件搜索逻辑优化，修复选项索引映射错误" },
      { type: "feature", text: "下拉框展开时显示当前选中值，提升操作体验" },
      { type: "optimize", text: "配置中心上传按钮组布局优化" },
      { type: "optimize", text: "关于系统页面收款码功能删除" },
    ],
    bugfixes: [
      { text: "修复下拉框选项焦点索引与实际选项不匹配的问题" },
      { text: "修复表格名称过长导致的布局错乱问题" },
    ],
  },
  { version: "czp-1.10.0", date: "2026-07-13 19:00:00",
    summary: "功能精简与版本号格式统一",
    changes: [
      { type: "feature", text: "版本号格式统一为 czp-x.x.x（小写）" },
      { type: "feature", text: "删除模板中心页面上传文件夹功能" },
      { type: "feature", text: "优化配置中心上传样表和上传文件夹按钮" },
    ],
    bugfixes: [
      { text: "修复导航栏点击计算规则报错无法显示的bug" },
    ],
  },
  { version: "czp-1.9.0", date: "2026-07-13 18:00:00",
    summary: "系统页面完善与布局优化",
    changes: [
      { type: "feature", text: "关于系统页面信息完善，明确版本号和技术支持信息" },
      { type: "feature", text: "系统设置应用设置和通知设置布局优化为左右两列" },
      { type: "feature", text: "数据管理页面顶部文字信息和导航栏布局优化" },
      { type: "optimize", text: "全局代码检查，修复未显现的bug与错误" },
    ],
    bugfixes: [
      { text: "修复计算步骤数据源选择布局错误" },
      { text: "修复计算步骤选择表格时的bug错误" },
    ],
  },
  { version: "czp-1.8.0", date: "2026-07-13 16:30:00",
    summary: "页面优化与功能完善",
    changes: [
      { type: "feature", text: "计算规则页面前往模板中心功能完善" },
      { type: "feature", text: "系统日志导航栏与内容区布局优化" },
      { type: "feature", text: "更新日志页面布局优化，信息层次清晰" },
      { type: "optimize", text: "页面主题检查，确保全局变量统一" },
    ],
    bugfixes: [
      { text: "修复页面上下滑动空白问题" },
      { text: "修复左侧导航栏与右侧内容区拖动跳动问题" },
    ],
  },
  { version: "czp-1.7.0", date: "2026-07-13 10:00:00",
    summary: "更新提示与检测优化",
    changes: [
      { type: "feature", text: "页面更新检测准确性优化，避免漏提示" },
      { type: "feature", text: "更新提示弹窗样式优化，图标显示完善" },
      { type: "feature", text: "系统设置外观设置模块切换卡片UI优化" },
      { type: "optimize", text: "使用帮助模块各页面布局优化，提高信息密度" },
    ],
    bugfixes: [
      { text: "修复添加步骤后的页面报错问题" },
      { text: "修复计算规则页面未配置模板时的显示问题" },
    ],
  },
  { version: "czp-1.6.0", date: "2026-07-12 16:50:16",
    summary: "更新提示机制与页面优化",
    changes: [
      { type: "feature", text: "页面更新强制弹窗提示，杜绝静默更新" },
      { type: "feature", text: "样本数据管理页面空白间隔优化" },
      { type: "feature", text: "检测更新位置调整" },
    ],
    bugfixes: [
      { text: "修复添加计算步骤页面报错问题" },
    ],
  },
  { version: "czp-1.5.0", date: "2026-07-12 14:15:19",
    summary: "页面布局与导航优化",
    changes: [
      { type: "feature", text: "导航栏分类、布局和顺序重构" },
      { type: "feature", text: "数据管理页面删除重复的最近操作块" },
      { type: "feature", text: "更新日志页面布局优化，信息专业清晰" },
      { type: "optimize", text: "页面流畅度优化，提升专业性" },
    ],
    bugfixes: [],
  },
  { version: "czp-1.4.0", date: "2026-07-12 12:24:54",
    summary: "使用帮助页面重构",
    changes: [
      { type: "feature", text: "使用帮助页面以最新版本重构，信息清晰美观" },
      { type: "feature", text: "更新日志内容根据修改生成，注明精确时间" },
      { type: "optimize", text: "页面线条与样式和谐性优化" },
    ],
    bugfixes: [],
  },
  { version: "czp-1.3.0", date: "2026-07-12 11:41:48",
    summary: "页面优化与主题完善",
    changes: [
      { type: "feature", text: "页面跳动问题优化" },
      { type: "feature", text: "页面主题完善，全局变量设定" },
      { type: "optimize", text: "页面线条与样式和谐性优化" },
    ],
    bugfixes: [],
  },
  { version: "czp-1.2.0", date: "2026-07-12 10:36:11",
    summary: "系统设置与UI优化",
    changes: [
      { type: "feature", text: "系统设置外观设置模块切换卡片UI优化" },
      { type: "feature", text: "系统设置应用设置和通知设置布局优化" },
      { type: "optimize", text: "页面流畅度优化" },
    ],
    bugfixes: [],
  },
  { version: "czp-1.1.0", date: "2026-07-12 10:18:58",
    summary: "初始功能完善",
    changes: [
      { type: "feature", text: "基础功能完善" },
      { type: "optimize", text: "页面布局优化" },
    ],
    bugfixes: [],
  },
  { version: "czp-1.0.0", date: "2026-07-12 08:50:41",
    summary: "系统初始版本",
    changes: [
      { type: "feature", text: "系统基础框架搭建" },
      { type: "feature", text: "核心功能模块开发" },
    ],
    bugfixes: [],
  },
];

if (typeof window !== 'undefined') {
  window.AppVersion = APP_VERSION;
  window.DataVersion = DATA_VERSION;
  window.VersionKey = VERSION_KEY;
  window.VersionHistoryKey = VERSION_HISTORY_KEY;
  window.UpdateLog = UPDATE_LOG;
}
