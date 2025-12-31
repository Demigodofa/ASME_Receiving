const db = new Dexie("ASMEReceivingDB");
db.version(2).stores({
    jobs: "jobNumber, description, notes, createdAt, cloudJobId",
    materials: "++id, jobNumber",
    photos: "++id, materialId, jobNumber, status, createdAt",
    uploadQueue: "++id, status, type, createdAt, updatedAt, materialId, photoId"
});

async function deleteJob(jobNum) {
    const jobToDelete = jobNum || new URLSearchParams(location.search).get("job");

    const ok = confirm("Are you sure you want to delete this job?");
    if (!ok) return;

    const mats = await db.materials.where("jobNumber").equals(jobToDelete).toArray();
    const materialIds = mats.map((m) => m.id);

    if (materialIds.length > 0) {
        await db.photos.where("materialId").anyOf(materialIds).delete();
        await db.uploadQueue.where("materialId").anyOf(materialIds).delete();
    }

    await db.materials.where("jobNumber").equals(jobToDelete).delete();
    await db.jobs.delete(jobToDelete);

    if (!jobNum) {
        window.location.replace("jobs.html");
    } else {
        location.reload();
    }
}
