window.addEventListener("load", () => {
  const toggle = document.getElementById("cloudModeToggle");
  const configInput = document.getElementById("firebaseConfigInput");
  const pdfInput = document.getElementById("pdfEndpointInput");
  const saveBtn = document.getElementById("saveCloudSettingsBtn");
  const statusText = document.getElementById("cloudStatusText");

  if (!toggle || !configInput || !pdfInput || !saveBtn || !statusText) return;

  // Load current settings
  toggle.checked = cloudSettings.isCloudModeEnabled();
  configInput.value = cloudSettings.getFirebaseConfigText();
  pdfInput.value = cloudSettings.getPdfEndpoint();

  const setStatus = (msg) => {
    statusText.textContent = msg;
  };

  const refreshStatus = async () => {
    const mode = cloudSettings.isCloudModeEnabled();
    const configObj = cloudSettings.getFirebaseConfig();

    if (!configObj) {
      setStatus("Paste Firebase config JSON, click Save Cloud Settings, then enable cloud mode.");
      return;
    }

    if (!mode) {
      setStatus("Cloud mode is OFF. Flip the toggle ON to enable uploads.");
      return;
    }

    // At this point: config exists AND mode is ON
    // cloud.js should have created window.cloudApiReady (a Promise)
    if (!window.cloudApiReady) {
      setStatus("Cloud mode ON, but cloud.js is not loaded. (Check script tags + console errors.)");
      return;
    }

    try {
      const cloud = await window.cloudApiReady;

      if (!cloud || cloud.enabled !== true) {
        const reason = cloud?.reason ? ` (${cloud.reason})` : "";
        setStatus(`Cloud not ready${reason}. Check console.`);
        return;
      }

      setStatus(`Cloud mode ON ✅ (uid: ${cloud.uid})`);
    } catch (err) {
      console.error(err);
      setStatus(`Cloud init failed ❌ See console: ${err?.message || err}`);
    }
  };

  toggle.addEventListener("change", () => {
    cloudSettings.setCloudModeEnabled(toggle.checked);
    refreshStatus();
  });

  saveBtn.addEventListener("click", () => {
    cloudSettings.setFirebaseConfig(configInput.value);
    cloudSettings.setPdfEndpoint(pdfInput.value);
    refreshStatus();
  });

  refreshStatus();
});