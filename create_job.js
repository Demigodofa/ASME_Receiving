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

    window.location.href = `job.html?job=${encodeURIComponent(jobNumber)}`;
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
