// models/templateModel.js - 模板模型
// 功能：模板数据结构定义、验证、转换

(function() {
  const TemplateModel = {
    TYPES: {
      CALCULATION: 'calculation',
      REPORT: 'report',
      BATCH: 'batch',
    },

    create(data = {}) {
      return {
        id: data.id || 'tpl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: data.name || '',
        description: data.description || '',
        type: data.type || this.TYPES.CALCULATION,
        platform: data.platform || '',
        config: data.config || {
          steps: [],
          rules: {},
          settings: {},
        },
        author: data.author || '',
        version: data.version || '1.0.0',
        tags: data.tags || [],
        isFavorite: data.isFavorite || false,
        isSystem: data.isSystem || false,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        lastUsedAt: data.lastUsedAt || null,
      };
    },

    validate(template) {
      const errors = [];

      if (!template || typeof template !== 'object') {
        errors.push('模板数据不能为空');
        return { valid: false, errors };
      }

      if (!template.name || typeof template.name !== 'string') {
        errors.push('模板名称不能为空');
      } else if (template.name.length > 100) {
        errors.push('模板名称最多100个字符');
      }

      if (!template.type || !Object.values(this.TYPES).includes(template.type)) {
        errors.push('无效的模板类型');
      }

      if (template.config && typeof template.config !== 'object') {
        errors.push('模板配置格式错误');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    clone(template) {
      const cloned = this.create(JSON.parse(JSON.stringify(template)));
      cloned.id = 'tpl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      cloned.name = template.name + ' (副本)';
      cloned.isSystem = false;
      cloned.createdAt = Date.now();
      cloned.updatedAt = Date.now();
      cloned.usageCount = 0;
      cloned.lastUsedAt = null;
      return cloned;
    },

    toSummary(template) {
      if (!template) return null;
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        platform: template.platform,
        isFavorite: template.isFavorite,
        isSystem: template.isSystem,
        usageCount: template.usageCount,
        updatedAt: template.updatedAt,
        lastUsedAt: template.lastUsedAt,
      };
    },

    getTypeLabel(type) {
      const labels = {
        [this.TYPES.CALCULATION]: '计算模板',
        [this.TYPES.REPORT]: '报表模板',
        [this.TYPES.BATCH]: '批量模板',
      };
      return labels[type] || type;
    },

    getTypeIcon(type) {
      const icons = {
        [this.TYPES.CALCULATION]: 'calculator',
        [this.TYPES.REPORT]: 'file-text',
        [this.TYPES.BATCH]: 'layers',
      };
      return icons[type] || 'file';
    },

    addStep(template, step) {
      if (!template.config) template.config = {};
      if (!Array.isArray(template.config.steps)) {
        template.config.steps = [];
      }
      template.config.steps.push({
        id: 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        ...step,
        createdAt: Date.now(),
      });
      template.updatedAt = Date.now();
      return template;
    },

    removeStep(template, stepId) {
      if (!template.config || !Array.isArray(template.config.steps)) {
        return template;
      }
      template.config.steps = template.config.steps.filter(s => s.id !== stepId);
      template.updatedAt = Date.now();
      return template;
    },

    reorderSteps(template, newOrder) {
      if (!template.config || !Array.isArray(template.config.steps)) {
        return template;
      }
      const stepMap = {};
      template.config.steps.forEach(s => { stepMap[s.id] = s; });
      template.config.steps = newOrder
        .map(id => stepMap[id])
        .filter(Boolean);
      template.updatedAt = Date.now();
      return template;
    },

    setRule(template, ruleKey, ruleValue) {
      if (!template.config) template.config = {};
      if (!template.config.rules) template.config.rules = {};
      template.config.rules[ruleKey] = ruleValue;
      template.updatedAt = Date.now();
      return template;
    },

    setSetting(template, key, value) {
      if (!template.config) template.config = {};
      if (!template.config.settings) template.config.settings = {};
      template.config.settings[key] = value;
      template.updatedAt = Date.now();
      return template;
    },

    incrementUsage(template) {
      template.usageCount = (template.usageCount || 0) + 1;
      template.lastUsedAt = Date.now();
      return template;
    },

    toggleFavorite(template) {
      template.isFavorite = !template.isFavorite;
      template.updatedAt = Date.now();
      return template;
    },

    serialize(template) {
      return JSON.stringify(template);
    },

    deserialize(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        return this.create(data);
      } catch (e) {
        return null;
      }
    },

    exportTemplate(template) {
      const exportData = {
        ...template,
        exportedAt: Date.now(),
        exportVersion: '1.0',
      };
      return JSON.stringify(exportData, null, 2);
    },

    importTemplate(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        if (!data.name) {
          return { success: false, message: '无效的模板格式' };
        }
        const template = this.create(data);
        template.id = 'tpl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        template.isSystem = false;
        template.createdAt = Date.now();
        template.updatedAt = Date.now();
        template.usageCount = 0;
        template.lastUsedAt = null;
        return { success: true, template };
      } catch (e) {
        return { success: false, message: '导入失败：' + e.message };
      }
    },

    filterTemplates(templates, filters = {}) {
      return templates.filter(t => {
        if (filters.type && t.type !== filters.type) return false;
        if (filters.platform && t.platform !== filters.platform) return false;
        if (filters.isFavorite && !t.isFavorite) return false;
        if (filters.isSystem !== undefined && t.isSystem !== filters.isSystem) return false;
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase();
          return (
            t.name.toLowerCase().includes(kw) ||
            (t.description && t.description.toLowerCase().includes(kw)) ||
            (t.tags && t.tags.some(tag => tag.toLowerCase().includes(kw)))
          );
        }
        return true;
      });
    },

    sortTemplates(templates, sortBy = 'updatedAt', ascending = false) {
      return [...templates].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    },
  };

  window.TemplateModel = TemplateModel;
})();
