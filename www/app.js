window.addEventListener("load", async () => {
  const toggle = document.getElementById("cloudModeToggle");
  const configInput = document.getElementById("firebaseConfigInput");
  const pdfInput = document.getElementById("pdfEndpointInput");
  const saveBtn = document.getElementById("saveCloudSettingsBtn");
  const statusText = document.getElementById("cloudStatusText");

  if (!toggle || !configInput || !pdfInput || !saveBtn || !statusText) return;

  const cs = window.cloudSettings;

  const setStatus = (msg, isError = false) => {
    statusText.textContent = msg;
    statusText.style.color = isError ? "#b00020" : "";
  };

  if (!cs) {
    setStatus("Cloud settings failed to load (window.cloudSettings missing).", true);
    return;
  }

  // Load saved values into UI
  toggle.checked = cs.isCloudModeEnabled();
  configInput.value = cs.getFirebaseConfigText();
  pdfInput.value = cs.getPdfEndpoint();

  const refreshStatus = async () => {
    const mode = cs.isCloudModeEnabled();
    const config = cs.getFirebaseConfig();

    if (!config) {
      setStatus(mode
        ? "Cloud mode is ON but Firebase config is missing/invalid. Paste valid JSON and click Save."
        : "Cloud mode is OFF. Paste Firebase config JSON and click Save, then enable Cloud mode."
      , mode);
      return;
    }

    if (!mode) {
      setStatus("Firebase config loaded. Cloud mode is OFF.");
      return;
    }

    // Cloud mode ON + config exists -> try to init cloud.js (auth + firebase)
    try {
      const cloud = await window.cloudApiReady;
      if (cloud?.enabled) {
        setStatus(`Cloud mode ON ✅ (uid: ${cloud.uid})`);
      } else {
        setStatus(`Cloud not ready (${cloud?.reason || "unknown"}). Check console.`, true);
      }
    } catch (err) {
      console.error(err);
      setStatus(`Cloud init error: ${err?.message || String(err)}`, true);
    }
  };

  toggle.addEventListener("change", async () => {
    // Don’t allow ON without valid config
    if (toggle.checked && !cs.getFirebaseConfig()) {
      toggle.checked = false;
      cs.setCloudModeEnabled(false);
      setStatus("Paste valid Firebase config JSON and click Save BEFORE enabling cloud mode.", true);
      return;
    }

    cs.setCloudModeEnabled(toggle.checked);
    await refreshStatus();
  });

  saveBtn.addEventListener("click", async () => {
    const raw = configInput.value.trim();

    // Validate JSON before saving
    if (raw) {
      try {
        JSON.parse(raw);
      } catch (e) {
        setStatus("Save failed: Firebase config must be VALID JSON (include { } and quotes).", true);
        return;
      }
      cs.setFirebaseConfig(raw);
    } else {
      cs.setFirebaseConfig("");
    }

    cs.setPdfEndpoint(pdfInput.value.trim());

    // If they left cloud mode ON but config is invalid -> force OFF
    if (toggle.checked && !cs.getFirebaseConfig()) {
      toggle.checked = false;
      cs.setCloudModeEnabled(false);
      setStatus("Cloud mode turned OFF because config is missing/invalid.", true);
      return;
    }

    await refreshStatus();
  });

  await refreshStatus();
});
