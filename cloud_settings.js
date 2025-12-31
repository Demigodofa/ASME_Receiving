(function () {
    const KEY_ENABLED = "asmeCloudModeEnabled";
    const KEY_CONFIG = "asmeFirebaseConfig";
    const KEY_PDF = "asmePdfEndpoint";
  
    function safeParseJson(text) {
      const trimmed = (text || "").trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return null;
      }
    }
  
    window.cloudSettings = {
      isCloudModeEnabled() {
        return localStorage.getItem(KEY_ENABLED) === "true";
      },
  
      setCloudModeEnabled(enabled) {
        localStorage.setItem(KEY_ENABLED, enabled ? “true” : “false”);
      },
  
      getFirebaseConfig() {
        // Optional: hardcode via global if you ever want.
        if (window.ASME_RECEIVING_FIREBASE_CONFIG) return window.ASME_RECEIVING_FIREBASE_CONFIG;
  
        const stored = localStorage.getItem(KEY_CONFIG);
        if (!stored) return null;
  
        // stored should be JSON string
        const parsed = safeParseJson(stored);
        if (!parsed) {
          console.warn("Invalid Firebase config JSON in localStorage.");
          return null;
        }
        return parsed;
      },
  
      setFirebaseConfig(configText) {
        const parsed = safeParseJson(configText);
        if (!parsed) {
          throw new Error("Firebase config must be valid JSON.");
        }
        localStorage.setItem(KEY_CONFIG, JSON.stringify(parsed));
        return parsed;
      },
  
      getPdfEndpoint() {
        return (window.ASME_RECEIVING_PDF_ENDPOINT || localStorage.getItem(KEY_PDF) || "").trim();
      },
  
      setPdfEndpoint(endpoint) {
        localStorage.setItem(KEY_PDF, (endpoint || "").trim());
      },
  
      clearAll() {
        localStorage.removeItem(KEY_ENABLED);
        localStorage.removeItem(KEY_CONFIG);
        localStorage.removeItem(KEY_PDF);
      },
    };
  })();
  
