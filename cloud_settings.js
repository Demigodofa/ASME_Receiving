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

    // Mock server response.
    const mockServerResponse = {
      success: true,
      config: {
        // This is where the server would return the actual Firebase config
        firebase: { /* ... your firebase config object ... */ }, 
        // And the PDF endpoint
        pdfEndpoint: "https://your-live-pdf-endpoint.com/generate"
      }
    };

    if (mockServerResponse.success) {
      const configStr = JSON.stringify(mockServerResponse.config);
      await storage.set({ key: CONFIG_KEY, value: configStr });
      return { success: true, message: "Cloud access activated!" };
    } else {
      return { success: false, message: "Invalid access token. Please try again." };
    }
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
    const config = await this._getCloudConfig();
    return !!config; // Enabled if a valid config exists
  },

  async getFirebaseConfig() {
    const config = await this._getCloudConfig();
    return config ? config.firebase : null;
  },

  async getPdfEndpoint() {
    const config = await this._getCloudConfig();
    return config ? config.pdfEndpoint : null;
  },

  async clearAll() {
    await storage.remove({ key: CONFIG_KEY });
  },
};

window.cloudSettings = cloudSettings;
