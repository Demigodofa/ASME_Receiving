const cloudSettings = {
  isCloudModeEnabled() {
    return localStorage.getItem("asmeCloudModeEnabled") === "true";
  },

  setCloudModeEnabled(enabled) {
    localStorage.setItem("asmeCloudModeEnabled", enabled ? "true" : "false");
  },

  // Store raw text so user can paste exactly what Firebase gives them
  setFirebaseConfig(configText) {
    localStorage.setItem("asmeFirebaseConfig", (configText || "").trim());
  },

  getFirebaseConfigText() {
    return localStorage.getItem("asmeFirebaseConfig") || "";
  },

  // Returns parsed object or null
  getFirebaseConfig() {
    // Optional hard-coded override (if you ever set it on window)
    if (window.ASME_RECEIVING_FIREBASE_CONFIG) return window.ASME_RECEIVING_FIREBASE_CONFIG;

    const raw = this.getFirebaseConfigText();
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Invalid Firebase config JSON", e);
      return null;
    }
  },

  getPdfEndpoint() {
    return window.ASME_RECEIVING_PDF_ENDPOINT || localStorage.getItem("asmePdfEndpoint") || "";
  },

  setPdfEndpoint(endpoint) {
    localStorage.setItem("asmePdfEndpoint", (endpoint || "").trim());
  },
};

window.cloudSettings = cloudSettings;