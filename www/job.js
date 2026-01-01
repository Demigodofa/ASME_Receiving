
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

    document.getElementById("jobInfo").innerHTML = `
        <h2>Job #${job.jobNumber}</h2>
        <p>${job.description || ""}</p>
        <p>${job.notes || ""}</p>
    `;
}

async function loadMaterials() {
    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();
    const container = document.getElementById("materialsList");
    container.innerHTML = "";

    for (const m of materials) {
        const div = document.createElement("div");
        div.className = "material-card";
        // Pass both material ID and job number for editing.
        div.onclick = () => editMaterial(m.id, m.jobNumber);

        const photos = await db.photos.where("materialId").equals(m.id).toArray();
        let thumbnailsHTML = '';
        for (let i = 0; i < Math.min(photos.length, 5); i++) {
            thumbnailsHTML += `<img src="${photos[i].imageData}" class="thumbnail" />`;
        }

        div.innerHTML = `
            // Use the new itemDisplayName for the card header.
            <h3>${m.itemDisplayName || 'Untitled Material'}</h3>
            <p>Quantity: ${m.quantity || 'N/A'}</p>
            <div class="thumbnail-container">${thumbnailsHTML}</div>
            <button class="danger-btn" onclick="deleteMaterial(event, '${m.id}')">Delete</button>
        `;

        container.appendChild(div);
    };
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
