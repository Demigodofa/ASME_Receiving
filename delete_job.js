const db = new Dexie("ASMEReceivingDB");
db.version(1).stores({
    jobs: "jobNumber, description, notes, createdAt",
    materials: "++id, jobNumber"
});

async function deleteJob(jobNum) {
    const jobToDelete = jobNum || new URLSearchParams(location.search).get("job");

    const ok = confirm("Are you sure you want to delete this job?");
    if (!ok) return;

    const mats = await db.materials.where("jobNumber").equals(jobToDelete).toArray();
    for (let m of mats) {
        await db.materials.delete(m.id);
    }

    await db.jobs.delete(jobToDelete);

    if (!jobNum)
        window.location.replace("jobs.html");
    else
        location.reload();
}
