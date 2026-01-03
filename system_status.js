window.addEventListener("DOMContentLoaded", async () => {
  const appStatus = document.getElementById("app-status").querySelector(".status-indicator");
  const settingsStatus = document.getElementById("settings-status").querySelector(".status-indicator");
  const networkStatus = document.getElementById("network-status").querySelector(".status-indicator");
  const queueStatus = document.getElementById("queue-status").querySelector(".status-indicator");
  const queueDescription = document.getElementById("queue-status").querySelector(".status-description");

  // 1. Check App Status (Service Worker)
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    appStatus.classList.remove("loading");
    appStatus.classList.add("success");
  } else {
    appStatus.classList.remove("loading");
    appStatus.classList.add("error");
  }

  // 2. Check Cloud Settings
  const config = await window.cloudSettings.getFirebaseConfig();
  const pdf = await window.cloudSettings.getPdfEndpoint();
  if (config && pdf) {
    settingsStatus.classList.remove("loading");
    settingsStatus.classList.add("success");
  } else {
    settingsStatus.classList.remove("loading");
    settingsStatus.classList.add("warning");
  }

  // 3. Check Network Status
  const updateNetworkStatus = () => {
    networkStatus.classList.remove("loading", "success", "error");
    if (navigator.onLine) {
      networkStatus.classList.add("success");
    } else {
      networkStatus.classList.add("error");
    }
  };
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();

  // 4. Check Upload Queue
  try {
    const count = await db.uploadQueue.count();
    queueStatus.classList.remove("loading");
    queueStatus.classList.add("info");
    queueStatus.textContent = count;
    queueDescription.textContent = `${count} items are waiting to be uploaded to the cloud.`;
  } catch (e) {
    queueStatus.classList.remove("loading");
    queueStatus.classList.add("error");
    queueDescription.textContent = "Could not read the upload queue.";
  }
});
