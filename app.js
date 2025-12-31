window.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("cloudModeToggle");
    const cfgInput = document.getElementById("firebaseConfigInput");
    const pdfInput = document.getElementById("pdfEndpointInput");
    const saveBtn = document.getElementById("saveCloudSettingsBtn");
    const statusText = document.getElementById("cloudStatusText");
  
    if (!toggle || !cfgInput || !pdfInput || !saveBtn || !statusText) return;
  
    function setStatus(msg, isError = false) {
      statusText.textContent = msg || "";
      statusText.style.color = isError ? "crimson" : "";
    }
  
    function loadUIFromStorage() {
      toggle.checked = window.cloudSettings.isCloudModeEnabled();
  
      const cfg = window.cloudSettings.getFirebaseConfig();
      cfgInput.value = cfg ? JSON.stringify(cfg) : (localStorage.getItem("asmeFirebaseConfig") || "");
  
      pdfInput.value = window.cloudSettings.getPdfEndpoint() || "";
    }
  
    async function updateCloudStatus() {
      const enabled = window.cloudSettings.isCloudModeEnabled();
      const cfg = window.cloudSettings.getFirebaseConfig();
  
      if (!cfg) {
        setStatus("Cloud config missing. Paste Firebase config JSON and hit Save.", true);
        return;
      }
  
      if (!enabled) {
        setStatus("Cloud mode is OFF.");
        return;
      }
  
      setStatus("Cloud mode is ON. Signing in anonymously…");
  
      try {
        // cloud.js defines this promise
        const cloud = await window.cloudApiReady;
  
        if (!cloud || cloud.enabled === false) {
          setStatus(`Cloud not ready: ${cloud?.reason || "unknown"}`, true);
          return;
        }
  
        setStatus(`Cloud mode ON ✅ (uid: ${cloud.uid})`);
      } catch (e) {
        console.error(e);
        setStatus(`Cloud init failed: ${e?.message || e}`, true);
      }
    }
  
    // Toggle handler
    toggle.addEventListener("change", async () => {
      const turningOn = toggle.checked;
  
      // If turning on, require config to exist
      if (turningOn && !window.cloudSettings.getFirebaseConfig()) {
        toggle.checked = false;
        window.cloudSettings.setCloudModeEnabled(false);
        setStatus("Paste Firebase config JSON first, then hit Save.", true);
        return;
      }
  
      window.cloudSettings.setCloudModeEnabled(turningOn);
      await updateCloudStatus();
    });
  
    // Save handler
    saveBtn.addEventListener("click", async () => {
      try {
        if (cfgInput.value.trim()) {
          window.cloudSettings.setFirebaseConfig(cfgInput.value);
        }
  
        window.cloudSettings.setPdfEndpoint(pdfInput.value);
  
        setStatus("Saved cloud settings ✅");
        await updateCloudStatus();
      } catch (e) {
        console.error(e);
        setStatus(`Save failed: ${e?.message || e}`, true);
      }
    });
  
    // Init
    loadUIFromStorage();
    updateCloudStatus();
  });
  
