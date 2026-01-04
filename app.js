window.addEventListener("load", async () => {
  const cs = window.cloudSettings;

  if (!cs) {
    console.warn("Cloud settings module not loaded.");
    return;
  }

  // Pure logic: Check and refresh cloud status in the background
  const refreshStatus = async () => {
    const isEnabled = await cs.isCloudModeEnabled();
    const config = await cs.getFirebaseConfig();

    if (!isEnabled || !config) return;

    try {
      // Initialize/Check the Firebase connection
      const cloud = await window.cloudApiReady;
      if (cloud?.enabled && cloud?.uid) {
        console.log("Cloud sync active for user:", cloud.uid);
      }
    } catch (err) {
      console.warn("Background cloud sync check failed:", err);
    }
  };

  // --- Settings Page Wiring (Logic only, no style changes) ---
  const toggle = document.getElementById("cloudModeToggle");
  const saveBtn = document.getElementById("saveCloudSettingsBtn");
  
  if (toggle && saveBtn) {
    toggle.checked = await cs.isCloudModeEnabled();
    
    toggle.addEventListener("change", async () => {
      await cs.setCloudModeEnabled(toggle.checked);
      await refreshStatus();
    });

    saveBtn.addEventListener("click", async () => {
      const configInput = document.getElementById("firebaseConfigInput");
      const pdfInput = document.getElementById("pdfEndpointInput");
      
      if (configInput) {
        await cs.setFirebaseConfig(configInput.value);
      }
      if (pdfInput) {
        await cs.setPdfEndpoint(pdfInput.value);
      }
      await refreshStatus();
    });
  }

  // Initial background check
  await refreshStatus();
});
