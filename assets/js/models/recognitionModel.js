// models/recognitionModel.js - 识别模型
// 功能：数据识别、字段映射、智能匹配

(function() {
  const RecognitionModel = {
    FIELD_TYPES: {
      TEXT: 'text',
      NUMBER: 'number',
      DATE: 'date',
      CURRENCY: 'currency',
      PERCENTAGE: 'percentage',
      BOOLEAN: 'boolean',
    },

    create(data = {}) {
      return {
        id: data.id || 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: data.name || '',
        description: data.description || '',
        platform: data.platform || '',
        fields: data.fields || [],
        patterns: data.patterns || [],
        rules: data.rules || {
          headerRow: 1,
          dataStartRow: 2,
          encoding: 'auto',
          delimiter: ',',
        },
        version: data.version || '1.0.0',
        accuracy: data.accuracy || 0,
        usageCount: data.usageCount || 0,
        isSystem: data.isSystem || false,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      };
    },

    createField(data = {}) {
      return {
        id: data.id || 'fld-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: data.name || '',
        label: data.label || '',
        type: data.type || this.FIELD_TYPES.TEXT,
        required: data.required || false,
        aliases: data.aliases || [],
        patterns: data.patterns || [],
        defaultValue: data.defaultValue !== undefined ? data.defaultValue : null,
        validators: data.validators || [],
        transform: data.transform || null,
        order: data.order || 0,
      };
    },

    validate(model) {
      const errors = [];

      if (!model || typeof model !== 'object') {
        errors.push('识别模型数据不能为空');
        return { valid: false, errors };
      }

      if (!model.name || typeof model.name !== 'string') {
        errors.push('模型名称不能为空');
      }

      if (!Array.isArray(model.fields)) {
        errors.push('字段必须是数组');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    validateField(field) {
      const errors = [];

      if (!field || typeof field !== 'object') {
        errors.push('字段数据不能为空');
        return { valid: false, errors };
      }

      if (!field.name || typeof field.name !== 'string') {
        errors.push('字段名称不能为空');
      }

      if (!field.type || !Object.values(this.FIELD_TYPES).includes(field.type)) {
        errors.push('无效的字段类型');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    addField(model, fieldData, position = null) {
      if (!Array.isArray(model.fields)) model.fields = [];
      const field = this.createField(fieldData);
      field.order = model.fields.length;

      if (position !== null && position >= 0 && position < model.fields.length) {
        model.fields.splice(position, 0, field);
        this._reorderFields(model);
      } else {
        model.fields.push(field);
      }

      model.updatedAt = Date.now();
      return field;
    },

    updateField(model, fieldId, updates) {
      const field = this.getFieldById(model, fieldId);
      if (!field) return null;
      Object.assign(field, updates, { id: fieldId });
      model.updatedAt = Date.now();
      return field;
    },

    removeField(model, fieldId) {
      if (!Array.isArray(model.fields)) return false;
      const index = model.fields.findIndex(f => f.id === fieldId);
      if (index === -1) return false;
      model.fields.splice(index, 1);
      this._reorderFields(model);
      model.updatedAt = Date.now();
      return true;
    },

    getFieldById(model, fieldId) {
      if (!Array.isArray(model.fields)) return null;
      return model.fields.find(f => f.id === fieldId) || null;
    },

    getFieldByName(model, name) {
      if (!Array.isArray(model.fields)) return null;
      return model.fields.find(f => f.name === name) || null;
    },

    _reorderFields(model) {
      if (!Array.isArray(model.fields)) return;
      model.fields.forEach((field, index) => {
        field.order = index;
      });
    },

    addAlias(model, fieldId, alias) {
      const field = this.getFieldById(model, fieldId);
      if (!field) return false;
      if (!Array.isArray(field.aliases)) field.aliases = [];
      if (!field.aliases.includes(alias)) {
        field.aliases.push(alias);
        model.updatedAt = Date.now();
      }
      return true;
    },

    removeAlias(model, fieldId, alias) {
      const field = this.getFieldById(model, fieldId);
      if (!field || !Array.isArray(field.aliases)) return false;
      const index = field.aliases.indexOf(alias);
      if (index === -1) return false;
      field.aliases.splice(index, 1);
      model.updatedAt = Date.now();
      return true;
    },

    recognizeHeaders(model, headers) {
      if (!Array.isArray(headers) || !Array.isArray(model.fields)) {
        return {};
      }

      const mapping = {};
      const usedFields = new Set();

      headers.forEach((header, index) => {
        const headerLower = String(header).toLowerCase().trim();
        let matched = null;
        let matchScore = 0;

        model.fields.forEach(field => {
          if (usedFields.has(field.id)) return;

          let score = 0;
          if (field.name.toLowerCase() === headerLower) {
            score = 100;
          } else if (field.label && field.label.toLowerCase() === headerLower) {
            score = 90;
          } else if (Array.isArray(field.aliases)) {
            field.aliases.forEach(alias => {
              if (alias.toLowerCase() === headerLower) {
                score = Math.max(score, 80);
              } else if (alias.toLowerCase().includes(headerLower) || headerLower.includes(alias.toLowerCase())) {
                score = Math.max(score, 60);
              }
            });
          }

          if (score > matchScore) {
            matchScore = score;
            matched = field;
          }
        });

        if (matched && matchScore >= 50) {
          mapping[index] = {
            field: matched.name,
            fieldId: matched.id,
            confidence: matchScore,
            header: header,
          };
          usedFields.add(matched.id);
        }
      });

      return mapping;
    },

    transformValue(value, field) {
      if (value === null || value === undefined) {
        return field.defaultValue !== undefined ? field.defaultValue : null;
      }

      let result = value;

      switch (field.type) {
        case this.FIELD_TYPES.NUMBER:
        case this.FIELD_TYPES.CURRENCY:
          result = this._parseNumber(value);
          break;
        case this.FIELD_TYPES.PERCENTAGE:
          result = this._parsePercentage(value);
          break;
        case this.FIELD_TYPES.DATE:
          result = this._parseDate(value);
          break;
        case this.FIELD_TYPES.BOOLEAN:
          result = this._parseBoolean(value);
          break;
        default:
          result = String(value).trim();
      }

      if (field.transform && typeof field.transform === 'function') {
        try {
          result = field.transform(result);
        } catch (e) {}
      }

      return result;
    },

    _parseNumber(value) {
      if (typeof value === 'number') return value;
      if (typeof value !== 'string') return 0;
      const cleaned = value.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    },

    _parsePercentage(value) {
      if (typeof value === 'number') return value;
      if (typeof value !== 'string') return 0;
      const hasPercent = value.includes('%');
      const num = this._parseNumber(value);
      return hasPercent ? num / 100 : num;
    },

    _parseDate(value) {
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    },

    _parseBoolean(value) {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return ['true', 'yes', '是', '1', 'y'].includes(lower);
      }
      return false;
    },

    validateValue(value, field) {
      const errors = [];

      if (field.required && (value === null || value === undefined || value === '')) {
        errors.push(`${field.label || field.name} 是必填项`);
        return { valid: false, errors };
      }

      if (value === null || value === undefined || value === '') {
        return { valid: true, errors: [] };
      }

      if (Array.isArray(field.validators)) {
        field.validators.forEach(validator => {
          try {
            if (typeof validator === 'function') {
              const result = validator(value);
              if (result !== true) {
                errors.push(typeof result === 'string' ? result : '验证失败');
              }
            }
          } catch (e) {
            errors.push('验证异常：' + e.message);
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    processRow(model, row, headerMapping) {
      const result = {};
      const errors = [];

      model.fields.forEach(field => {
        let value = null;
        let found = false;

        Object.entries(headerMapping).forEach(([colIndex, mapping]) => {
          if (mapping.fieldId === field.id) {
            value = row[parseInt(colIndex)];
            found = true;
          }
        });

        if (!found && field.defaultValue !== undefined) {
          value = field.defaultValue;
        }

        const transformed = this.transformValue(value, field);
        const validation = this.validateValue(transformed, field);

        if (!validation.valid) {
          errors.push(...validation.errors);
        }

        result[field.name] = transformed;
      });

      return { data: result, errors, valid: errors.length === 0 };
    },

    processSheet(model, rows, headerMapping) {
      const results = [];
      const allErrors = [];

      rows.forEach((row, rowIndex) => {
        const result = this.processRow(model, row, headerMapping);
        results.push({
          rowIndex,
          ...result,
        });
        if (result.errors.length > 0) {
          allErrors.push({
            row: rowIndex + 1,
            errors: result.errors,
          });
        }
      });

      return {
        results,
        totalRows: rows.length,
        validRows: results.filter(r => r.valid).length,
        errorCount: allErrors.length,
        errors: allErrors,
      };
    },

    calculateAccuracy(model, sampleData) {
      if (!Array.isArray(sampleData) || sampleData.length === 0) {
        return 0;
      }

      let totalFields = 0;
      let correctFields = 0;

      sampleData.forEach(sample => {
        model.fields.forEach(field => {
          totalFields++;
          if (sample.actual && sample.actual[field.name] === sample.expected?.[field.name]) {
            correctFields++;
          }
        });
      });

      return totalFields > 0 ? correctFields / totalFields : 0;
    },

    clone(model) {
      const cloned = this.create(JSON.parse(JSON.stringify(model)));
      cloned.id = 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      cloned.name = model.name + ' (副本)';
      cloned.isSystem = false;
      cloned.createdAt = Date.now();
      cloned.updatedAt = Date.now();
      cloned.accuracy = 0;
      cloned.usageCount = 0;
      return cloned;
    },

    toSummary(model) {
      if (!model) return null;
      return {
        id: model.id,
        name: model.name,
        description: model.description,
        platform: model.platform,
        fieldCount: Array.isArray(model.fields) ? model.fields.length : 0,
        accuracy: model.accuracy,
        usageCount: model.usageCount,
        isSystem: model.isSystem,
        updatedAt: model.updatedAt,
      };
    },

    getFieldTypeLabel(type) {
      const labels = {
        [this.FIELD_TYPES.TEXT]: '文本',
        [this.FIELD_TYPES.NUMBER]: '数字',
        [this.FIELD_TYPES.DATE]: '日期',
        [this.FIELD_TYPES.CURRENCY]: '货币',
        [this.FIELD_TYPES.PERCENTAGE]: '百分比',
        [this.FIELD_TYPES.BOOLEAN]: '布尔值',
      };
      return labels[type] || type;
    },

    serialize(model) {
      return JSON.stringify(model);
    },

    deserialize(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        return this.create(data);
      } catch (e) {
        return null;
      }
    },
  };

  window.RecognitionModel = RecognitionModel;
})();
