function openJob(jobNumber) {
    const base = window.location.origin;
    window.location.href = `${base}/job.html?job=${jobNumber}`;
}

async function deleteJob(jobNumber) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    await db.materials.where("jobNumber").equals(jobNumber).delete();
    await db.jobs.where("jobNumber").equals(jobNumber).delete();

    loadJobs();
}

async function loadJobs() {
    const jobs = await db.jobs.toArray();
    const list = document.getElementById("jobsList");
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
