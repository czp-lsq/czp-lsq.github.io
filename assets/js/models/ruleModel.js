// models/ruleModel.js - 计算规则模型
// 功能：规则数据结构定义、验证、步骤管理

(function() {
  const RuleModel = {
    STEP_TYPES: {
      SOURCE: 'source',
      TRANSFORM: 'transform',
      FORMAT: 'format',
      ADVANCED: 'advanced',
    },

    CATEGORIES: {
      BASIC: 'basic',
      FINANCE: 'finance',
      MARKETING: 'marketing',
      CUSTOM: 'custom',
    },

    create(data = {}) {
      return {
        id: data.id || 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: data.name || '',
        description: data.description || '',
        category: data.category || this.CATEGORIES.BASIC,
        platform: data.platform || '',
        steps: data.steps || [],
        variables: data.variables || {},
        settings: data.settings || {
          autoSave: true,
          validateOnChange: true,
        },
        version: data.version || '1.0.0',
        author: data.author || '',
        tags: data.tags || [],
        isSystem: data.isSystem || false,
        isFavorite: data.isFavorite || false,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        lastUsedAt: data.lastUsedAt || null,
      };
    },

    createStep(data = {}) {
      return {
        id: data.id || 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        type: data.type || this.STEP_TYPES.TRANSFORM,
        name: data.name || '',
        description: data.description || '',
        config: data.config || {},
        input: data.input || '',
        output: data.output || '',
        enabled: data.enabled !== false,
        order: data.order || 0,
        createdAt: data.createdAt || Date.now(),
      };
    },

    validate(rule) {
      const errors = [];

      if (!rule || typeof rule !== 'object') {
        errors.push('规则数据不能为空');
        return { valid: false, errors };
      }

      if (!rule.name || typeof rule.name !== 'string') {
        errors.push('规则名称不能为空');
      } else if (rule.name.length > 100) {
        errors.push('规则名称最多100个字符');
      }

      if (!Array.isArray(rule.steps)) {
        errors.push('步骤必须是数组');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    validateStep(step) {
      const errors = [];

      if (!step || typeof step !== 'object') {
        errors.push('步骤数据不能为空');
        return { valid: false, errors };
      }

      if (!step.type || !Object.values(this.STEP_TYPES).includes(step.type)) {
        errors.push('无效的步骤类型');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    addStep(rule, stepData, position = null) {
      if (!Array.isArray(rule.steps)) rule.steps = [];
      const step = this.createStep(stepData);
      step.order = rule.steps.length;

      if (position !== null && position >= 0 && position < rule.steps.length) {
        rule.steps.splice(position, 0, step);
        this._reorderSteps(rule);
      } else {
        rule.steps.push(step);
      }

      rule.updatedAt = Date.now();
      return step;
    },

    updateStep(rule, stepId, updates) {
      const step = this.getStepById(rule, stepId);
      if (!step) return null;
      Object.assign(step, updates, { id: stepId });
      rule.updatedAt = Date.now();
      return step;
    },

    removeStep(rule, stepId) {
      if (!Array.isArray(rule.steps)) return false;
      const index = rule.steps.findIndex(s => s.id === stepId);
      if (index === -1) return false;
      rule.steps.splice(index, 1);
      this._reorderSteps(rule);
      rule.updatedAt = Date.now();
      return true;
    },

    duplicateStep(rule, stepId) {
      const step = this.getStepById(rule, stepId);
      if (!step) return null;
      const index = rule.steps.findIndex(s => s.id === stepId);
      const duplicated = {
        ...JSON.parse(JSON.stringify(step)),
        id: 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: step.name + ' (副本)',
        createdAt: Date.now(),
      };
      rule.steps.splice(index + 1, 0, duplicated);
      this._reorderSteps(rule);
      rule.updatedAt = Date.now();
      return duplicated;
    },

    moveStep(rule, stepId, newIndex) {
      if (!Array.isArray(rule.steps)) return false;
      const oldIndex = rule.steps.findIndex(s => s.id === stepId);
      if (oldIndex === -1) return false;
      if (newIndex < 0 || newIndex >= rule.steps.length) return false;

      const [step] = rule.steps.splice(oldIndex, 1);
      rule.steps.splice(newIndex, 0, step);
      this._reorderSteps(rule);
      rule.updatedAt = Date.now();
      return true;
    },

    getStepById(rule, stepId) {
      if (!Array.isArray(rule.steps)) return null;
      return rule.steps.find(s => s.id === stepId) || null;
    },

    getStepsByType(rule, type) {
      if (!Array.isArray(rule.steps)) return [];
      return rule.steps.filter(s => s.type === type && s.enabled !== false);
    },

    getEnabledSteps(rule) {
      if (!Array.isArray(rule.steps)) return [];
      return rule.steps.filter(s => s.enabled !== false);
    },

    toggleStep(rule, stepId) {
      const step = this.getStepById(rule, stepId);
      if (!step) return null;
      step.enabled = !step.enabled;
      rule.updatedAt = Date.now();
      return step;
    },

    _reorderSteps(rule) {
      if (!Array.isArray(rule.steps)) return;
      rule.steps.forEach((step, index) => {
        step.order = index;
      });
    },

    setVariable(rule, key, value) {
      if (!rule.variables) rule.variables = {};
      rule.variables[key] = value;
      rule.updatedAt = Date.now();
      return rule;
    },

    removeVariable(rule, key) {
      if (!rule.variables) return false;
      delete rule.variables[key];
      rule.updatedAt = Date.now();
      return true;
    },

    setSetting(rule, key, value) {
      if (!rule.settings) rule.settings = {};
      rule.settings[key] = value;
      rule.updatedAt = Date.now();
      return rule;
    },

    clone(rule) {
      const cloned = this.create(JSON.parse(JSON.stringify(rule)));
      cloned.id = 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      cloned.name = rule.name + ' (副本)';
      cloned.isSystem = false;
      cloned.createdAt = Date.now();
      cloned.updatedAt = Date.now();
      cloned.usageCount = 0;
      cloned.lastUsedAt = null;
      return cloned;
    },

    incrementUsage(rule) {
      rule.usageCount = (rule.usageCount || 0) + 1;
      rule.lastUsedAt = Date.now();
      return rule;
    },

    toggleFavorite(rule) {
      rule.isFavorite = !rule.isFavorite;
      rule.updatedAt = Date.now();
      return rule;
    },

    toSummary(rule) {
      if (!rule) return null;
      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        platform: rule.platform,
        stepCount: Array.isArray(rule.steps) ? rule.steps.length : 0,
        isSystem: rule.isSystem,
        isFavorite: rule.isFavorite,
        usageCount: rule.usageCount,
        updatedAt: rule.updatedAt,
      };
    },

    getCategoryLabel(category) {
      const labels = {
        [this.CATEGORIES.BASIC]: '基础',
        [this.CATEGORIES.FINANCE]: '财务',
        [this.CATEGORIES.MARKETING]: '营销',
        [this.CATEGORIES.CUSTOM]: '自定义',
      };
      return labels[category] || category;
    },

    getStepTypeLabel(type) {
      const labels = {
        [this.STEP_TYPES.SOURCE]: '数据源',
        [this.STEP_TYPES.TRANSFORM]: '数据转换',
        [this.STEP_TYPES.FORMAT]: '格式化',
        [this.STEP_TYPES.ADVANCED]: '高级',
      };
      return labels[type] || type;
    },

    serialize(rule) {
      return JSON.stringify(rule);
    },

    deserialize(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        return this.create(data);
      } catch (e) {
        return null;
      }
    },

    exportRule(rule) {
      const exportData = {
        ...rule,
        exportedAt: Date.now(),
        exportVersion: '1.0',
      };
      return JSON.stringify(exportData, null, 2);
    },

    importRule(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        if (!data.name) {
          return { success: false, message: '无效的规则格式' };
        }
        const rule = this.create(data);
        rule.id = 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        rule.isSystem = false;
        rule.createdAt = Date.now();
        rule.updatedAt = Date.now();
        rule.usageCount = 0;
        rule.lastUsedAt = null;
        return { success: true, rule };
      } catch (e) {
        return { success: false, message: '导入失败：' + e.message };
      }
    },

    filterRules(rules, filters = {}) {
      return rules.filter(r => {
        if (filters.category && r.category !== filters.category) return false;
        if (filters.platform && r.platform !== filters.platform) return false;
        if (filters.isSystem !== undefined && r.isSystem !== filters.isSystem) return false;
        if (filters.isFavorite && !r.isFavorite) return false;
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase();
          return (
            r.name.toLowerCase().includes(kw) ||
            (r.description && r.description.toLowerCase().includes(kw)) ||
            (r.tags && r.tags.some(tag => tag.toLowerCase().includes(kw)))
          );
        }
        return true;
      });
    },

    sortRules(rules, sortBy = 'updatedAt', ascending = false) {
      return [...rules].sort((a, b) => {
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

  window.RuleModel = RuleModel;
})();
