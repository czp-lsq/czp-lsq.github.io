// models/platformModel.js - 平台模型
// 功能：平台数据结构定义、验证、店铺管理

(function() {
  const PlatformModel = {
    DEFAULT_PLATFORMS: [
      { id: 'pdd', name: '拼多多', emoji: '🍊', color: '#e02e24' },
      { id: 'tb', name: '淘宝', emoji: '🛒', color: '#ff5000' },
      { id: 'dy', name: '抖音', emoji: '🎵', color: '#fe2c55' },
      { id: 'jd', name: '京东', emoji: '🛍️', color: '#e1251b' },
      { id: 'ks', name: '快手', emoji: '🎬', color: '#ff4906' },
      { id: 'xhs', name: '小红书', emoji: '📕', color: '#fe2c55' },
    ],

    create(data = {}) {
      return {
        id: data.id || 'plt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: data.name || '',
        emoji: data.emoji || '🏪',
        color: data.color || '#6366f1',
        shops: data.shops || [],
        settings: data.settings || {
          currency: 'CNY',
          taxRate: 0,
          defaultRules: {},
        },
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      };
    },

    createShop(data = {}) {
      return {
        id: data.id || 'shop-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: data.name || '',
        platformId: data.platformId || '',
        shopUrl: data.shopUrl || '',
        contact: data.contact || '',
        note: data.note || '',
        status: data.status || 'active',
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      };
    },

    validate(platform) {
      const errors = [];

      if (!platform || typeof platform !== 'object') {
        errors.push('平台数据不能为空');
        return { valid: false, errors };
      }

      if (!platform.name || typeof platform.name !== 'string') {
        errors.push('平台名称不能为空');
      } else if (platform.name.length > 50) {
        errors.push('平台名称最多50个字符');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    validateShop(shop) {
      const errors = [];

      if (!shop || typeof shop !== 'object') {
        errors.push('店铺数据不能为空');
        return { valid: false, errors };
      }

      if (!shop.name || typeof shop.name !== 'string') {
        errors.push('店铺名称不能为空');
      } else if (shop.name.length > 100) {
        errors.push('店铺名称最多100个字符');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    getDefaultPlatforms() {
      return this.DEFAULT_PLATFORMS.map(p => this.create(p));
    },

    getPlatformById(platforms, id) {
      return platforms.find(p => p.id === id) || null;
    },

    getShopById(platform, shopId) {
      if (!platform || !Array.isArray(platform.shops)) return null;
      return platform.shops.find(s => s.id === shopId) || null;
    },

    addShop(platform, shopData) {
      if (!Array.isArray(platform.shops)) {
        platform.shops = [];
      }
      const shop = this.createShop({
        ...shopData,
        platformId: platform.id,
      });
      platform.shops.push(shop);
      platform.updatedAt = Date.now();
      return shop;
    },

    updateShop(platform, shopId, updates) {
      const shop = this.getShopById(platform, shopId);
      if (!shop) return null;
      Object.assign(shop, updates, {
        id: shopId,
        platformId: platform.id,
        updatedAt: Date.now(),
      });
      platform.updatedAt = Date.now();
      return shop;
    },

    removeShop(platform, shopId) {
      if (!Array.isArray(platform.shops)) return false;
      const index = platform.shops.findIndex(s => s.id === shopId);
      if (index === -1) return false;
      platform.shops.splice(index, 1);
      platform.updatedAt = Date.now();
      return true;
    },

    getShopCount(platform) {
      return Array.isArray(platform.shops) ? platform.shops.length : 0;
    },

    getActiveShopCount(platform) {
      if (!Array.isArray(platform.shops)) return 0;
      return platform.shops.filter(s => s.status === 'active').length;
    },

    getTotalShops(platforms) {
      if (!Array.isArray(platforms)) return 0;
      return platforms.reduce((total, p) => total + this.getShopCount(p), 0);
    },

    setSetting(platform, key, value) {
      if (!platform.settings) platform.settings = {};
      platform.settings[key] = value;
      platform.updatedAt = Date.now();
      return platform;
    },

    toSummary(platform) {
      if (!platform) return null;
      return {
        id: platform.id,
        name: platform.name,
        emoji: platform.emoji,
        color: platform.color,
        shopCount: this.getShopCount(platform),
      };
    },

    getDisplayName(platform) {
      if (!platform) return '';
      return `${platform.emoji || '🏪'} ${platform.name || '未知平台'}`;
    },

    serialize(platform) {
      return JSON.stringify(platform);
    },

    deserialize(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        return this.create(data);
      } catch (e) {
        return null;
      }
    },

    exportPlatform(platform) {
      const exportData = {
        ...platform,
        exportedAt: Date.now(),
        exportVersion: '1.0',
      };
      return JSON.stringify(exportData, null, 2);
    },

    importPlatform(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        if (!data.name) {
          return { success: false, message: '无效的平台格式' };
        }
        const platform = this.create(data);
        platform.id = 'plt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        platform.createdAt = Date.now();
        platform.updatedAt = Date.now();
        return { success: true, platform };
      } catch (e) {
        return { success: false, message: '导入失败：' + e.message };
      }
    },

    searchShops(platforms, keyword) {
      if (!keyword) return [];
      const kw = keyword.toLowerCase();
      const results = [];
      platforms.forEach(platform => {
        if (!Array.isArray(platform.shops)) return;
        platform.shops.forEach(shop => {
          if (
            shop.name.toLowerCase().includes(kw) ||
            (shop.contact && shop.contact.toLowerCase().includes(kw)) ||
            (shop.note && shop.note.toLowerCase().includes(kw))
          ) {
            results.push({
              ...shop,
              platformId: platform.id,
              platformName: platform.name,
              platformEmoji: platform.emoji,
            });
          }
        });
      });
      return results;
    },
  };

  window.PlatformModel = PlatformModel;
})();
