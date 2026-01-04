function openJob(jobNumber) {
    window.location.href = `job.html?job=${jobNumber}`;
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
    const list = document.getElementById("jobsList");
    if (!list) return;

    const jobs = await db.jobs.toArray();
    list.innerHTML = "";

    if (jobs.length === 0) {
        const empty = document.createElement("p");
        empty.className = "home-job-empty";
        empty.textContent = "No jobs saved yet.";
        list.appendChild(empty);
        return;
    }

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

async function loadHomeJobs() {
    const list = document.getElementById("homeJobsList");
    if (!list) return;

    const jobs = await db.jobs.orderBy("createdAt").reverse().toArray();
    list.innerHTML = "";

    if (jobs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "home-job-empty";
        empty.textContent = "No jobs yet. Create one to start tracking materials.";
        list.appendChild(empty);
        return;
    }

    jobs.forEach((job) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "home-job-row";
        row.addEventListener("click", () => openJob(job.jobNumber));

        const description = job.description?.trim() || "No description";
        const notes = job.notes?.trim() || "No notes";

        row.innerHTML = `
            <span class="home-job-cell home-job-number">Job #${job.jobNumber}</span>
            <span class="home-job-cell home-job-description">${description}</span>
            <span class="home-job-cell home-job-notes">${notes}</span>
        `;

        list.appendChild(row);
    });
}

window.addEventListener("load", () => {
    loadJobs();
    loadHomeJobs();
});
