const cloudSettings = {
    isCloudModeEnabled() {
        return localStorage.getItem("asmeCloudModeEnabled") === "true";
    },
    setCloudModeEnabled(enabled) {
        localStorage.setItem("asmeCloudModeEnabled", enabled ? "true" : "false");
    },
    getFirebaseConfig() {
        if (window.ASME_RECEIVING_FIREBASE_CONFIG) {
            return window.ASME_RECEIVING_FIREBASE_CONFIG;
        }

        const stored = localStorage.getItem("asmeFirebaseConfig");
        if (!stored) {
            return null;
        }

        try {
            return JSON.parse(stored);
        } catch (error) {
            console.warn("Invalid Firebase config JSON", error);
            return null;
        }
    },
    setFirebaseConfig(configText) {
        localStorage.setItem("asmeFirebaseConfig", configText.trim());
    },
    getPdfEndpoint() {
        return window.ASME_RECEIVING_PDF_ENDPOINT || localStorage.getItem("asmePdfEndpoint") || "";
    },
    setPdfEndpoint(endpoint) {
        localStorage.setItem("asmePdfEndpoint", endpoint.trim());
    }
};

window.cloudSettings = cloudSettings;
