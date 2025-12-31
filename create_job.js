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

    const cloud = await window.cloudApiReady;
    if (cloud.enabled && window.cloudSettings.isCloudModeEnabled()) {
        await cloud.ensureJobDoc(jobNumber, { description, notes });
    }

    const base = window.location.origin;
    window.location.href = `${base}/job.html?job=${jobNumber}`;
}
