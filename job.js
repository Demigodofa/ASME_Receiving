
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

    document.getElementById("generateReportBtn").onclick = () => {
        window.location.href = `hydro_report.html?job=${jobNumber}`;
    };

    document.getElementById("deleteJobBtn").onclick = deleteJob;
};

async function loadJob() {
    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();
    if (!job) return;

    const jobInfo = document.getElementById("jobInfo");
    jobInfo.innerHTML = `
        <h2>Job Details</h2>
        <label for="jobNumberInput">Job Number</label>
        <input type="text" id="jobNumberInput" value="${job.jobNumber}" />
        <label for="jobDescriptionInput">Description</label>
        <input type="text" id="jobDescriptionInput" value="${job.description || ""}" />
        <label for="jobNotesInput">Notes</label>
        <textarea id="jobNotesInput">${job.notes || ""}</textarea>
        <button id="saveJobDetailsBtn" class="primary-btn">Save Job Details</button>
    `;

    document.getElementById("saveJobDetailsBtn").onclick = () => {
        saveJobDetails(job.jobNumber);
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
        let thumbnailsHTML = '';
        for (let i = 0; i < Math.min(photos.length, 5); i++) {
            thumbnailsHTML += `<img src="${photos[i].imageData}" class="thumbnail" />`;
        }

        div.innerHTML = `
            <h3 class="clickable-title">${m.itemDisplayName || "Untitled Material"}</h3>
            <p>Quantity: ${m.quantity || "N/A"}</p>
            <div class="thumbnail-container">${thumbnailsHTML}</div>
            <button class="danger-btn" onclick="deleteMaterial(event, '${m.id}')">Delete</button>
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
        await db.transaction("rw", db.jobs, db.materials, db.photos, async () => {
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

async function deleteMaterial(event, id) {
    event.stopPropagation(); // Prevent the card's onclick from firing
    if (!confirm("Delete this material?")) return;
    await db.photos.where("materialId").equals(Number(id)).delete();
    await db.uploadQueue.where("materialId").equals(Number(id)).delete();
    await db.materials.delete(Number(id));
    loadMaterials();
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
