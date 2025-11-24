// job.js — FINAL VERSION
// Loads job details + material list + add/edit/delete

let jobNumber = null;

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    jobNumber = params.get("job");

    if (!jobNumber) {
        alert("Error: No job number provided.");
        window.location.href = "jobs.html";
        return;
    }

    loadJob();
    loadMaterials();
});

// ------------------------------------------------------------
// Load Job Information
// ------------------------------------------------------------
async function loadJob() {
    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();

    if (!job) {
        alert("Job not found.");
        window.location.href = "jobs.html";
        return;
    }

    document.getElementById("jobNumberDisplay").textContent =
        `Job #${job.jobNumber}`;

    document.getElementById("jobDescription").textContent =
        job.description || "";
}

// ------------------------------------------------------------
// Load Materials for This Job
// ------------------------------------------------------------
async function loadMaterials() {
    const mats = await db.materials.where("jobNumber").equals(jobNumber).toArray();
    const list = document.getElementById("materialsList");

    list.innerHTML = "";

    if (mats.length === 0) {
        list.innerHTML = `<p>No materials added yet.</p>`;
        return;
    }

    mats.forEach(mat => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <h3>${mat.description || "Material"}</h3>
            <p><strong>Vendor:</strong> ${mat.vendor || "—"}</p>
            <p><strong>Spec:</strong> ${mat.specPrefix || ""} ${mat.specCode || ""}</p>

            <div class="job-btn-row">
                <button class="primary-btn"
                    onclick="editMaterial(${mat.id})">Edit</button>

                <button class="danger-btn"
                    onclick="deleteMaterial(${mat.id})">Delete</button>
            </div>
        `;

        list.appendChild(div);
    });
}

// ------------------------------------------------------------
// Navigation
// ------------------------------------------------------------

function addMaterial() {
    window.location.href = `add_material.html?job=${jobNumber}`;
}

function editMaterial(id) {
    window.location.href = `edit_material.html?id=${id}`;
}

// ------------------------------------------------------------
// Delete Material
// ------------------------------------------------------------

async function deleteMaterial(id) {
    if (!confirm("Delete this material?")) return;

    await db.materials.delete(id);
    loadMaterials();
}

// ------------------------------------------------------------
// Export Job (handled in export_job.js)
// ------------------------------------------------------------

function exportJob() {
    exportJobData(jobNumber);
}
