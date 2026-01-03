const getStorage = () => {
  // Check if Capacitor is available and if we're on a native platform
  if (window.Capacitor && window.Capacitor.isNative && window.Capacitor.Plugins.SecureStorage) {
    return window.Capacitor.Plugins.SecureStorage;
  }

  // Fallback to a simple in-memory map for web/testing environments
  console.warn("SecureStorage not available. Falling back to non-persistent in-memory storage.");
  const webStorage = new Map();
  return {
    get: async ({ key }) => ({ value: webStorage.get(key) || null }),
    set: async ({ key, value }) => webStorage.set(key, value),
    remove: async ({ key }) => webStorage.delete(key),
    clear: async () => webStorage.clear(), // For completeness
  };
};

const storage = getStorage();

const cloudSettings = {
  async isCloudModeEnabled() {
    const result = await storage.get({ key: "asmeCloudModeEnabled" });
    return result.value === "true";
  },

  async setCloudModeEnabled(enabled) {
    await storage.set({ key: "asmeCloudModeEnabled", value: enabled ? "true" : "false" });
  },

  // This returns the RAW text (so app.js can show it in the textarea)
  async getFirebaseConfigText() {
    if (window.ASME_RECEIVING_FIREBASE_CONFIG) {
      try {
        return JSON.stringify(window.ASME_RECEIVING_FIREBASE_CONFIG, null, 2);
      } catch {
        return "";
      }
    }
    const result = await storage.get({ key: "asmeFirebaseConfig" });
    return result.value || "";
  },

  // This returns the PARSED object (or null if invalid)
  async getFirebaseConfig() {
    if (window.ASME_RECEIVING_FIREBASE_CONFIG) {
      return window.ASME_RECEIVING_FIREBASE_CONFIG;
    }

    const stored = await this.getFirebaseConfigText(); // Use the class method to get text
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Invalid Firebase config JSON", error);
      return null;
    }
  },

  async setFirebaseConfig(configText) {
    await storage.set({ key: "asmeFirebaseConfig", value: (configText || "").trim() });
  },

  async getPdfEndpoint() {
    if (window.ASME_RECEIVING_PDF_ENDPOINT) {
        return window.ASME_RECEIVING_PDF_ENDPOINT;
    }
    const result = await storage.get({ key: "asmePdfEndpoint" });
    return result.value || "";
  },

  async setPdfEndpoint(endpoint) {
    await storage.set({ key: "asmePdfEndpoint", value: (endpoint || "").trim() });
  },

  async clearAll() {
    await storage.remove({ key: "asmeCloudModeEnabled" });
    await storage.remove({ key: "asmeFirebaseConfig" });
    await storage.remove({ key: "asmePdfEndpoint" });
  },
};

window.cloudSettings = cloudSettings;
