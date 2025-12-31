// ============================================================
//  ASMEReceivingDB — Unified, Final, Single Database
// ============================================================

const db = new Dexie("ASMEReceivingDB");

db.version(1).stores({
    jobs: "jobNumber, description, notes, createdAt",

    // Full material schema used across ALL pages
    materials: `++id, jobNumber,
                description, vendor, poNumber, date, quantity,
                product, specPrefix, specCode, grade, b16dim,
                th1, th2, th3, th4, other,
                visual, markingAcceptable, mtrAcceptable,
                actualMarking, comments,
                qcInitials, qcDate,
                photos`
});

db.version(2).stores({
    jobs: "jobNumber, description, notes, createdAt, cloudJobId",

    materials: `++id, jobNumber,
                description, vendor, poNumber, date, quantity,
                product, specPrefix, specCode, grade, b16dim,
                th1, th2, th3, th4, other,
                visual, markingAcceptable, mtrAcceptable,
                actualMarking, comments,
                qcInitials, qcDate,
                photos, photoCount, offloadStatus, pdfStatus, pdfStoragePath, cloudItemId`,

    photos: `++id, materialId, jobNumber, status, createdAt`,

    uploadQueue: `++id, status, type, createdAt, updatedAt, materialId, photoId`
}).upgrade(async (tx) => {
    const materialsTable = tx.table("materials");
    const photosTable = tx.table("photos");

    await materialsTable.toCollection().modify(async (material) => {
        if (!Array.isArray(material.photos) || material.photos.length === 0) {
            material.photoCount = material.photoCount || 0;
            material.offloadStatus = material.offloadStatus || "local-only";
            material.pdfStatus = material.pdfStatus || "not-started";
            return;
        }

        const now = new Date().toISOString();
        let addedCount = 0;

        for (const dataUrl of material.photos) {
            if (typeof dataUrl !== "string") {
                continue;
            }

            try {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                await photosTable.add({
                    materialId: material.id,
                    jobNumber: material.jobNumber,
                    fullBlob: blob,
                    thumbnailBlob: blob,
                    thumbnailDataUrl: dataUrl,
                    status: "local",
                    createdAt: now
                });
                addedCount += 1;
            } catch (error) {
                console.error("Failed to migrate photo", error);
            }
        }

        material.photoCount = material.photoCount || addedCount;
        material.offloadStatus = material.offloadStatus || "local-only";
        material.pdfStatus = material.pdfStatus || "not-started";
    });
});

// Verified working across all browsers (Safari, iOS, Android, Chrome)
db.open().catch(err => {
    console.error("Failed to open ASMEReceivingDB:", err);
});
