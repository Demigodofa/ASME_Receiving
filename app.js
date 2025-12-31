window.addEventListener("load", () => {
  const toggle = document.getElementById("cloudModeToggle");
  const configInput = document.getElementById("firebaseConfigInput");
  const pdfInput = document.getElementById("pdfEndpointInput");
  const saveBtn = document.getElementById("saveCloudSettingsBtn");
  const statusText = document.getElementById("cloudStatusText");

  if (!toggle || !configInput || !pdfInput || !saveBtn || !statusText) return;

  // Load saved UI state
  toggle.checked = cloudSettings.isCloudModeEnabled();
  configInput.value = localStorage.getItem("asmeFirebaseConfig") || "";
  pdfInput.value = cloudSettings.getPdfEndpoint();

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function validateConfigText(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return { ok: false, reason: "missing" };

    try {
      const obj = JSON.parse(trimmed);
      const required = ["apiKey", "authDomain", "projectId", "storageBucket", "appId"];
      const missing = required.filter((k) => !obj?.[k]);
      if (missing.length) return { ok: false, reason: `missing keys: ${missing.join(", ")}` };
      return { ok: true, config: obj };
    } catch (e) {
      return { ok: false, reason: "invalid JSON" };
    }
  }

  async function refreshStatus() {
    const enabled = cloudSettings.isCloudModeEnabled();
    const cfg = cloudSettings.getFirebaseConfig();

    if (!enabled) {
      setStatus("Cloud mode OFF (local-only).");
      return;
    }

    if (!cfg) {
      setStatus("Cloud mode ON, but Firebase config is missing/invalid. Paste it and click Save Cloud Settings.");
      return;
    }

    if (!window.cloudApiReady) {
      setStatus("Cloud mode ON, config OK, but cloud.js is not loaded. (Check <script type='module' src='cloud.js'>)");
      return;
    }

    setStatus("Cloud mode ON… signing in anonymously…");

    try {
      const cloud = await window.cloudApiReady;
      if (!cloud?.enabled) {
        setStatus(`Cloud disabled: ${cloud?.reason || "unknown-reason"}`);
        return;
      }
      setStatus(`Cloud mode ON ✅ (uid: ${cloud.uid})`);
    } catch (err) {
      console.error(err);
      setStatus(`Cloud error ❌ Check console. (${err?.message || err})`);
    }
  }

  toggle.addEventListener("change", () => {
    cloudSettings.setCloudModeEnabled(toggle.checked);
    refreshStatus();
  });

  saveBtn.addEventListener("click", () => {
    const cfgCheck = validateConfigText(configInput.value);
    if (!cfgCheck.ok) {
      // Save anyway so you can fix it, but tell you what's wrong
      cloudSettings.setFirebaseConfig(configInput.value);
      cloudSettings.setPdfEndpoint(pdfInput.value);
      setStatus(`Config saved, but ${cfgCheck.reason}. Fix JSON then Save again.`);
      return;
    }

    cloudSettings.setFirebaseConfig(configInput.value);
    cloudSettings.setPdfEndpoint(pdfInput.value);
    setStatus("Settings saved ✅");
    refreshStatus();
  });

  refreshStatus();
});

  
