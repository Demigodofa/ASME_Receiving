// create_job.js
// FINAL VERSION — Works with unified ASMEReceivingDB

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("saveJobBtn").addEventListener("click", saveJob);
});

async function saveJob() {
    const jobNumber = document.getElementById("jobNumber").value.trim();
    const description = document.getElementById("description").value.trim();
    const notes = document.getElementById("notes").value.trim();

    if (!jobNumber) {
        alert("Job Number is required.");
        return;
    }

    // Write job to unified DB
    await db.jobs.put({
        jobNumber,
        description,
        notes,
        createdAt: new Date().toISOString()
    });

    // Redirect to job details
    window.location.href = `job.html?job=${jobNumber}`;
}
