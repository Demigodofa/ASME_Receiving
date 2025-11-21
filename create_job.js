// ========== CREATE JOB (Original App Behavior) ==========
// Uses Dexie DB ('ASMEReceivingDB') from db.js

document.addEventListener("DOMContentLoaded", () => {

    const jobInput = document.getElementById("jobNumber");
    const descInput = document.getElementById("description");
    const notesInput = document.getElementById("notes");
    const saveBtn = document.getElementById("saveJobBtn");
    const backBtn = document.getElementById("backBtn");

    // ---- Save Job ----
    saveBtn.addEventListener("click", async () => {
        const jobNum = jobInput.value.trim();
        const desc = descInput.value.trim();
        const notes = notesInput.value.trim();

        if (!jobNum) {
            // Original behavior: do nothing if job number is blank
            return;
        }

        // Silent overwrite if job already exists
        await db.jobs.put({
            jobNumber: jobNum,
            description: desc,
            notes: notes,
            created: Date.now()
        });

        // Navigate back to job list (original flow)
        window.location.href = "jobs.html";
    });

    // ---- Back Button ----
    backBtn.addEventListener("click", () => {
        window.location.href = "app.html";
    });
});