function openJob(jobNumber) {
    const base = window.location.origin;
    window.location.href = `${base}/job.html?job=${jobNumber}`;
}

async function deleteJob(jobNumber) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();
    const materialIds = materials.map((m) => m.id);

    if (materialIds.length > 0) {
        await db.photos.where("materialId").anyOf(materialIds).delete();
        await db.uploadQueue.where("materialId").anyOf(materialIds).delete();
    }

    await db.materials.where("jobNumber").equals(jobNumber).delete();
    await db.jobs.where("jobNumber").equals(jobNumber).delete();

    loadJobs();
}

async function loadJobs() {
    // Try to find the container using both possible IDs (homeJobsList or jobsList)
    const list = document.getElementById("homeJobsList") || document.getElementById("jobsList");
    
    // Safety check: if neither exists, don't crash the app
    if (!list) {
        console.warn("Job list container not found on this page.");
        return;
    }

    const jobs = await db.jobs.toArray();
    list.innerHTML = "";

    jobs.forEach(job => {
        const div = document.createElement("div");
        div.className = "job-card";

        div.innerHTML = `
            <h3>Job #${job.jobNumber}</h3>
            <button class="primary-btn" onclick="openJob('${job.jobNumber}')">OPEN</button>
            <button class="danger-btn" onclick="deleteJob('${job.jobNumber}')">DELETE</button>
        `;

        list.appendChild(div);
    });
}

window.onload = loadJobs;
