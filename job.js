
let jobNumber;

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    jobNumber = params.get("job");

    if (!jobNumber) {
        alert("Error: Job number missing.");
        window.location.href = "jobs.html";
        return;
    }

    loadJob();
    loadMaterials();

    document.getElementById("addMaterialBtn").onclick = () => {
        // Navigate to the new universal receiving report page for adding.
        window.location.href = `receiving_report.html?job=${jobNumber}`;
    };

    document.getElementById("exportJobBtn").onclick = () => {
        exportJobData(jobNumber);
    };

    document.getElementById("deleteJobBtn").onclick = deleteJob;
};

async function loadJob() {
    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();
    if (!job) return;

    const report = await db.hydroReports.where("jobNumber").equals(jobNumber).first();
    const hasReport = Boolean(report);
    const jobInfo = document.getElementById("jobInfo");
    const jobDescription = job.description ? job.description : "No description";
    jobInfo.innerHTML = `
        <h2>Job Details</h2>
        <button id="jobDetailsToggle" class="job-details-summary" type="button" aria-expanded="false">
            <span class="job-details-number">Job #${job.jobNumber}</span>
            <span class="job-details-description">${jobDescription}</span>
            <span class="job-details-edit">Edit</span>
        </button>
        <div class="job-details-actions">
            <button id="generateReportBtn" class="secondary-btn">
                ${hasReport ? "Open Hydro Report" : "Generate Hydro Report"}
            </button>
            <span id="hydroReportStatus" class="status-pill ${hasReport ? "status-pill--success" : "status-pill--muted"}">
                ${hasReport ? "✓ Hydro report generated" : "Hydro report not generated"}
            </span>
        </div>
        <div id="jobDetailsForm" class="job-details-form is-hidden">
            <h3 class="job-details-edit-title">Edit Job Details</h3>
            <label for="jobNumberInput">Job Number</label>
            <input type="text" id="jobNumberInput" value="${job.jobNumber}" />
            <label for="jobDescriptionInput">Description</label>
            <input type="text" id="jobDescriptionInput" value="${job.description || ""}" />
            <label for="jobNotesInput">Notes</label>
            <textarea id="jobNotesInput">${job.notes || ""}</textarea>
            <div class="job-details-form-actions">
                <button id="saveJobDetailsBtn" class="primary-btn" type="button">Save Job Details</button>
                <button id="cancelJobDetailsBtn" class="secondary-btn" type="button">Cancel</button>
            </div>
        </div>
    `;

    const jobDetailsForm = document.getElementById("jobDetailsForm");
    const jobDetailsToggle = document.getElementById("jobDetailsToggle");
    const cancelJobDetailsBtn = document.getElementById("cancelJobDetailsBtn");

    jobDetailsToggle.onclick = () => {
        const isOpen = !jobDetailsForm.classList.contains("is-hidden");
        jobDetailsForm.classList.toggle("is-hidden", isOpen);
        jobDetailsToggle.setAttribute("aria-expanded", String(!isOpen));
    };

    cancelJobDetailsBtn.onclick = () => {
        jobDetailsForm.classList.add("is-hidden");
        jobDetailsToggle.setAttribute("aria-expanded", "false");
    };

    document.getElementById("saveJobDetailsBtn").onclick = () => {
        saveJobDetails(job.jobNumber);
    };

    document.getElementById("generateReportBtn").onclick = () => {
        window.location.href = `hydro_report.html?job=${jobNumber}`;
    };
}

async function loadMaterials() {
    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();
    const container = document.getElementById("materialsList");
    container.innerHTML = "";

    for (const m of materials) {
        const div = document.createElement("div");
        div.className = "material-card material-card-clickable";
        // Pass both material ID and job number for editing.
        div.onclick = () => editMaterial(m.id, m.jobNumber);

        const photos = await db.photos.where("materialId").equals(m.id).toArray();
        const materialPhotos = photos.filter((photo) => !photo.category || photo.category === "materials");
        let thumbnailsHTML = '';
        for (let i = 0; i < Math.min(materialPhotos.length, 5); i++) {
            thumbnailsHTML += `<img src="${materialPhotos[i].imageData}" class="thumbnail" />`;
        }

        div.innerHTML = `
            <h3 class="clickable-title">${m.itemDisplayName || "Untitled Material"}</h3>
            <p>Quantity: ${m.quantity || "N/A"}</p>
            <div class="thumbnail-container">${thumbnailsHTML}</div>
        `;

        container.appendChild(div);
    };
}

async function saveJobDetails(originalJobNumber) {
    const jobNumberInput = document.getElementById("jobNumberInput");
    const descriptionInput = document.getElementById("jobDescriptionInput");
    const notesInput = document.getElementById("jobNotesInput");

    if (!jobNumberInput || !descriptionInput || !notesInput) return;

    const updatedJobNumber = jobNumberInput.value.trim();
    const updatedDescription = descriptionInput.value.trim();
    const updatedNotes = notesInput.value.trim();

    if (!updatedJobNumber) {
        alert("Job Number is required.");
        return;
    }

    if (updatedJobNumber !== originalJobNumber) {
        const existingJob = await db.jobs.get(updatedJobNumber);
        if (existingJob) {
            alert(`Job #${updatedJobNumber} already exists.`);
            return;
        }
    }

    const existing = await db.jobs.get(originalJobNumber);
    if (!existing) return;

    const nextCloudJobId = existing.cloudJobId === originalJobNumber
        ? updatedJobNumber
        : existing.cloudJobId;

    try {
        await db.transaction("rw", db.jobs, db.materials, db.photos, db.hydroReports, async () => {
            if (updatedJobNumber === originalJobNumber) {
                await db.jobs.update(originalJobNumber, {
                    description: updatedDescription,
                    notes: updatedNotes,
                    cloudJobId: nextCloudJobId,
                });
                return;
            }

            await db.jobs.delete(originalJobNumber);
            await db.jobs.put({
                jobNumber: updatedJobNumber,
                description: updatedDescription,
                notes: updatedNotes,
                createdAt: existing.createdAt,
                cloudJobId: nextCloudJobId || updatedJobNumber,
            });

            await db.materials
                .where("jobNumber")
                .equals(originalJobNumber)
                .modify({ jobNumber: updatedJobNumber });

            await db.photos
                .where("jobNumber")
                .equals(originalJobNumber)
                .modify({ jobNumber: updatedJobNumber });

            await db.hydroReports
                .where("jobNumber")
                .equals(originalJobNumber)
                .modify({ jobNumber: updatedJobNumber });
        });

        jobNumber = updatedJobNumber;
        window.history.replaceState({}, "", `job.html?job=${updatedJobNumber}`);
        await loadJob();
        await loadMaterials();
    } catch (error) {
        console.error("Failed to save job details", error);
        alert("Failed to save job details. Please try again.");
    }
}

function editMaterial(id, jobNum) {
    // Navigate to the new universal receiving report page for editing.
    window.location.href = `receiving_report.html?id=${id}&job=${jobNum}`;
}

async function deleteJob() {
    if (!confirm(`Delete Job #${jobNumber}? This removes ALL materials.`)) return;

    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();
    const materialIds = materials.map((m) => m.id);
    if (materialIds.length > 0) {
        await db.photos.where("materialId").anyOf(materialIds).delete();
        await db.uploadQueue.where("materialId").anyOf(materialIds).delete();
    }

    await db.materials.where("jobNumber").equals(jobNumber).delete();
    await db.jobs.where("jobNumber").equals(jobNumber).delete();

    window.location.href = "jobs.html";
}
