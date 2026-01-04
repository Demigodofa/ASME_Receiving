const getStorage = () => {
  // In a real app, you would use Capacitor's SecureStorage for native builds.
  // For this example, we'll use a mock that mimics its async API but uses localStorage.
  // This is NOT secure for production, but allows for a realistic development flow.
  if (window.Capacitor && window.Capacitor.isNative && window.Capacitor.Plugins.SecureStorage) {
    return window.Capacitor.Plugins.SecureStorage;
  }

  console.warn("SecureStorage not available. Falling back to non-persistent localStorage mock.");
  return {
    get: async ({ key }) => ({ value: localStorage.getItem(key) || null }),
    set: async ({ key, value }) => localStorage.setItem(key, value),
    remove: async ({ key }) => localStorage.removeItem(key),
    clear: async () => localStorage.clear(),
  };
};

const storage = getStorage();
const CONFIG_KEY = "asmeCloudConfig";
const MODE_KEY = "asmeCloudModeEnabled";

const cloudSettings = {

  // This function simulates calling your backend to validate a token
  // and get the cloud configuration.
  async redeemAccessToken(token) {
    // ** THIS IS A MOCK **
    // In a real application, you would make an HTTP request to your secure server.
    // e.g., const response = await fetch('https://your-api.com/redeem-token',
    //          { method: 'POST', body: JSON.stringify({ token }) });
    // const data = await response.json();

    console.log(`Simulating redemption for token: ${token}`);

    let firebaseConfig = window.ASME_RECEIVING_FIREBASE_CONFIG || null;
    let pdfEndpoint = window.ASME_RECEIVING_PDF_ENDPOINT || "";

    if (!firebaseConfig) {
      try {
        const parsedToken = JSON.parse(token);
        firebaseConfig = parsedToken.firebase || parsedToken;
        pdfEndpoint = parsedToken.pdfEndpoint || pdfEndpoint;
      } catch (error) {
        return {
          success: false,
          message: "Activation failed: no Firebase config available for this access code.",
        };
      }
    }

    const configStr = JSON.stringify({
      firebase: firebaseConfig,
      pdfEndpoint,
    });
    await storage.set({ key: CONFIG_KEY, value: configStr });
    await storage.set({ key: MODE_KEY, value: "true" });
    return { success: true, message: "Cloud access activated!" };
  },

  async _getCloudConfig() {
    const configStr = await storage.get({ key: CONFIG_KEY });
    if (!configStr.value) return null;

    try {
      return JSON.parse(configStr.value);
    } catch (e) {
      console.error("Failed to parse cloud config", e);
      return null;
    }
  },

  async isCloudModeEnabled() {
    const mode = await storage.get({ key: MODE_KEY });
    if (mode.value === null) {
      const config = await this._getCloudConfig();
      return !!config;
    }
    return mode.value === "true";
  },

  async setCloudModeEnabled(enabled) {
    await storage.set({ key: MODE_KEY, value: enabled ? "true" : "false" });
  },

  async getFirebaseConfig() {
    if (window.ASME_RECEIVING_FIREBASE_CONFIG) {
      return window.ASME_RECEIVING_FIREBASE_CONFIG;
    }

    const config = await this._getCloudConfig();
    return config ? config.firebase : null;
  },

  async getFirebaseConfigText() {
    const config = await this.getFirebaseConfig();
    if (!config) return "";
    try {
      return JSON.stringify(config, null, 2);
    } catch (error) {
      console.warn("Failed to serialize Firebase config", error);
      return "";
    }
  },

  async setFirebaseConfig(configText) {
    const trimmed = (configText || "").trim();
    if (!trimmed) {
      await storage.remove({ key: CONFIG_KEY });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      console.warn("Invalid Firebase config JSON", error);
      return;
    }

    const existing = (await this._getCloudConfig()) || {};
    const configStr = JSON.stringify({
      ...existing,
      firebase: parsed,
    });
    await storage.set({ key: CONFIG_KEY, value: configStr });
  },

  async getPdfEndpoint() {
    if (window.ASME_RECEIVING_PDF_ENDPOINT) {
      return window.ASME_RECEIVING_PDF_ENDPOINT;
    }
    const config = await this._getCloudConfig();
    return config ? config.pdfEndpoint : "";
  },

  async setPdfEndpoint(endpoint) {
    const existing = (await this._getCloudConfig()) || {};
    const configStr = JSON.stringify({
      ...existing,
      pdfEndpoint: (endpoint || "").trim(),
    });
    await storage.set({ key: CONFIG_KEY, value: configStr });
  },

  async clearAll() {
    await storage.remove({ key: CONFIG_KEY });
    await storage.remove({ key: MODE_KEY });
  },
};

window.cloudSettings = cloudSettings;
