const SecureStorage = (() => {
  const STORAGE_KEY = "profit_calc_system_v10";
  const ENCRYPTION_KEY = "profit_calc_secure_key";
  
  const generateKey = () => {
    let key = localStorage.getItem(ENCRYPTION_KEY);
    if (!key) {
      key = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(ENCRYPTION_KEY, key);
    }
    return key;
  };
  
  const textToBytes = (text) => {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  };
  
  const bytesToText = (bytes) => {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  };
  
  const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };
  
  const bytesToHex = (bytes) => {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const encrypt = async (text) => {
    const key = generateKey();
    const keyBytes = hexToBytes(key);
    const textBytes = textToBytes(text);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      encodedKey,
      textBytes
    );
    
    return {
      iv: bytesToHex(iv),
      data: bytesToHex(new Uint8Array(ciphertext))
    };
  };
  
  const decrypt = async (encrypted) => {
    const key = generateKey();
    const keyBytes = hexToBytes(key);
    const iv = hexToBytes(encrypted.iv);
    const data = hexToBytes(encrypted.data);
    
    const encodedKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      encodedKey,
      data
    );
    
    return bytesToText(new Uint8Array(plaintext));
  };
  
  return {
    async save(data) {
      try {
        const text = JSON.stringify(data);
        const encrypted = await encrypt(text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ encrypted: true, ...encrypted }));
        return true;
      } catch (e) {
        console.error("Encryption failed, falling back to plain storage:", e);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ encrypted: false, data }));
        return false;
      }
    },
    
    async load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        
        const parsed = JSON.parse(saved);
        if (parsed.encrypted) {
          const text = await decrypt(parsed);
          return JSON.parse(text);
        }
        return parsed.data || parsed;
      } catch (e) {
        console.error("Decryption failed:", e);
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          return saved ? JSON.parse(saved) : null;
        } catch (e2) {
          return null;
        }
      }
    },
    
    remove() {
      localStorage.removeItem(STORAGE_KEY);
    },
    
    async exportData() {
      const data = await this.load();
      if (!data) return null;
      
      const exportObj = {
        version: data._version || '1.0.0',
        exportedAt: new Date().toISOString(),
        data: data,
        format: 'profit-calc-export'
      };
      
      try {
        const text = JSON.stringify(exportObj, null, 2);
        const encrypted = await encrypt(text);
        return JSON.stringify({ 
          encrypted: true, 
          format: 'profit-calc-encrypted',
          ...encrypted 
        }, null, 2);
      } catch (e) {
        console.error("Export encryption failed:", e);
        return JSON.stringify(exportObj, null, 2);
      }
    },
    
    async importData(content) {
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new Error("无效的文件格式");
      }
      
      if (parsed.encrypted && parsed.format === 'profit-calc-encrypted') {
        const text = await decrypt(parsed);
        parsed = JSON.parse(text);
      }
      
      if (parsed.format !== 'profit-calc-export') {
        if (parsed.platforms) {
          parsed.format = 'profit-calc-export';
          parsed.version = parsed._version || '1.0.0';
          parsed.exportedAt = new Date().toISOString();
        } else {
          throw new Error("无效的配置文件格式");
        }
      }
      
      if (!parsed.data || !parsed.data.platforms) {
        throw new Error("配置文件中缺少必要的数据");
      }
      
      await this.save(parsed.data);
      return parsed;
    },
    
    getStorageUsage() {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += new Blob([value]).size;
      }
      return total;
    }
  };
})();