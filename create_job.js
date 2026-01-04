async function saveJob() {
    const jobNumber = document.getElementById("jobNumber").value.trim();
    const description = document.getElementById("description").value.trim();
    const notes = document.getElementById("notes").value.trim();

    if (!jobNumber) {
        alert("Job Number is required.");
        return;
    }

    await db.jobs.put({
        jobNumber,
        description,
        notes,
        createdAt: new Date().toISOString(),
        cloudJobId: jobNumber
    });

    let cloud = null;
    try {
        cloud = await window.cloudApiReady;
    } catch (error) {
        console.warn("Cloud init failed, saving locally only.", error);
    }

    const cloudEnabled = await window.cloudSettings.isCloudModeEnabled();
    if (cloud?.enabled && cloudEnabled) {
        await cloud.ensureJobDoc(jobNumber, { description, notes });
    }

    // 2. Attempt Cloud Sync in the background (Don't wait for it to finish)
    (async () => {
        try {
            if (window.cloudSettings && await window.cloudSettings.isCloudModeEnabled()) {
                const cloud = await window.cloudApiReady;
                if (cloud && cloud.enabled) {
                    await cloud.ensureJobDoc(jobNumber, { description, notes });
                    console.log("Cloud sync successful.");
                }
            }
        } catch (cloudErr) {
            console.warn("Cloud sync failed (will retry later):", cloudErr);
        }
    })();

    // 3. Redirect to the job page immediately
    const base = window.location.origin;
    window.location.href = `${base}/job.html?job=${jobNumber}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("saveJobBtn");
    if (saveButton) {
        saveButton.addEventListener("click", () => {
            saveJob().catch((error) => {
                console.error("Save job handler error:", error);
            });
        });
    }
});
