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
    // Since you provided your Firebase config, we have "connected" it here.

    console.log(`Activating cloud with token: ${token}`);

    // Real config provided by user
    const mockServerResponse = {
      success: true,
      config: {
        firebase: {
          apiKey: "AIzaSyBMbqSHZkvWZ4eJCKswkQtlpH9Ai7sjzO8",
          authDomain: "asme-receiving.firebaseapp.com",
          projectId: "asme-receiving",
          storageBucket: "asme-receiving.firebasestorage.app",
          messagingSenderId: "293518443128",
          appId: "1:293518443128:web:5641cbd8e082d7ce0fe38d",
          measurementId: "G-7QC63TZ1K3"
        },
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
