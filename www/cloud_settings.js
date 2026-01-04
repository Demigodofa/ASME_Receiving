const cloudSettings = {
  async redeemAccessToken(token) {
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

    this.setFirebaseConfig(JSON.stringify(firebaseConfig));
    if (pdfEndpoint) {
      this.setPdfEndpoint(pdfEndpoint);
    }
    this.setCloudModeEnabled(true);
    return { success: true, message: "Cloud access activated!" };
  },

  isCloudModeEnabled() {
    return localStorage.getItem("asmeCloudModeEnabled") === "true";
  },

  setCloudModeEnabled(enabled) {
    localStorage.setItem("asmeCloudModeEnabled", enabled ? "true" : "false");
  },

  // This returns the RAW text (so app.js can show it in the textarea)
  getFirebaseConfigText() {
    if (window.ASME_RECEIVING_FIREBASE_CONFIG) {
      try {
        return JSON.stringify(window.ASME_RECEIVING_FIREBASE_CONFIG, null, 2);
      } catch {
        return "";
      }
    }
    return localStorage.getItem("asmeFirebaseConfig") || "";
  },

  // This returns the PARSED object (or null if invalid)
  getFirebaseConfig() {
    if (window.ASME_RECEIVING_FIREBASE_CONFIG) {
      return window.ASME_RECEIVING_FIREBASE_CONFIG;
    }

    const stored = localStorage.getItem("asmeFirebaseConfig");
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Invalid Firebase config JSON", error);
      return null;
    }
  },

  setFirebaseConfig(configText) {
    localStorage.setItem("asmeFirebaseConfig", (configText || "").trim());
  },

  getPdfEndpoint() {
    return window.ASME_RECEIVING_PDF_ENDPOINT || localStorage.getItem("asmePdfEndpoint") || "";
  },

  setPdfEndpoint(endpoint) {
    localStorage.setItem("asmePdfEndpoint", (endpoint || "").trim());
  },

  clearAll() {
    localStorage.removeItem("asmeCloudModeEnabled");
    localStorage.removeItem("asmeFirebaseConfig");
    localStorage.removeItem("asmePdfEndpoint");
  },
};

window.cloudSettings = cloudSettings;
