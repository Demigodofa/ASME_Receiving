window.addEventListener("load", async () => {
    const toggle = document.getElementById("cloudModeToggle");
    const configInput = document.getElementById("firebaseConfigInput");
    const pdfInput = document.getElementById("pdfEndpointInput");
    const saveBtn = document.getElementById("saveCloudSettingsBtn");
    const statusText = document.getElementById("cloudStatusText");

    if (!toggle || !configInput || !pdfInput || !saveBtn || !statusText) return;

    toggle.checked = cloudSettings.isCloudModeEnabled();
    configInput.value = localStorage.getItem("asmeFirebaseConfig") || "";
    pdfInput.value = cloudSettings.getPdfEndpoint();

    const refreshStatus = async () => {
        const config = cloudSettings.getFirebaseConfig();
        const mode = cloudSettings.isCloudModeEnabled();
        statusText.textContent = config
            ? `Cloud config loaded. Mode: ${mode ? "On" : "Off"}`
            : "Cloud config missing. Mode disabled.";
    };

    toggle.addEventListener("change", () => {
        cloudSettings.setCloudModeEnabled(toggle.checked);
        refreshStatus();
    });

    saveBtn.addEventListener("click", () => {
        if (configInput.value.trim()) {
            cloudSettings.setFirebaseConfig(configInput.value.trim());
        }

        cloudSettings.setPdfEndpoint(pdfInput.value.trim());
        refreshStatus();
    });

    refreshStatus();
});
