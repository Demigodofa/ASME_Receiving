// ============================================================
//  ASMEReceivingDB — Unified, Final, Single Database
// ============================================================

const db = new Dexie("ASMEReceivingDB");

db.version(1).stores({
    jobs: "jobNumber, description, notes, createdAt",
    materials: `++id, jobNumber, description, vendor, poNumber, date, quantity, product, specPrefix, specCode, grade, b16dim, th1, th2, th3, th4, other, visual, markingAcceptable, mtrAcceptable, actualMarking, comments, qcInitials, qcDate, photos`
});

db.version(2).stores({
    jobs: "jobNumber, description, notes, createdAt, cloudJobId",
    materials: `++id, jobNumber, description, vendor, poNumber, date, quantity, product, specPrefix, specCode, grade, b116dim, th1, th2, th3, th4, other, visual, markingAcceptable, mtrAcceptable, actualMarking, comments, qcInitials, qcDate, photos, photoCount, offloadStatus, pdfStatus, pdfStoragePath, cloudItemId`,
    photos: `++id, materialId, jobNumber, status, createdAt`,
    uploadQueue: `++id, status, type, createdAt, updatedAt, materialId, photoId`
}).upgrade(async (tx) => {
    // Migration logic for photos from old format to new table
});

db.version(3).stores({
    hydroTests: "++id, jobNumber, pressure, duration, inspector, notes, createdAt"
});

db.version(4).stores({
    hydroReports: "++id, jobNumber",
    hydroTests: null
});

// Version 5: Overhauls the materials table for the new detailed receiving report.
// This replaces the old materials schema entirely.
db.version(5).stores({
    materials: `++id, 
                jobNumber, 
                itemDisplayName, 
                vendor, 
                poNumber, 
                date, 
                quantity, 
                product, 
                specification, 
                specificationNumber, 
                gradeTypeAlloy, 
                fittingType, 
                fittingSpec, 
                th1, th2, th3, th4, 
                width, 
                length, 
                diameter, 
                otherDim, 
                visualInspectionAcceptable, 
                b16DimensionsAcceptable, 
                actualMaterialMarking, 
                markingAcceptableToCode, 
                mtrCofCAcceptable, 
                resultAccept, 
                resultReject, 
                comments, 
                qcInitials, 
                qcDate, 
                qcManagerInitials, 
                qcManagerDate, 
                photoCount, 
                offloadStatus, 
                pdfStatus, 
                pdfStoragePath, 
                cloudItemId`
});

// Version 6: restore full schema (jobs, photos, upload queue, hydro reports) alongside materials.
db.version(6).stores({
    jobs: "jobNumber, description, notes, createdAt, cloudJobId",
    materials: `++id, 
                jobNumber, 
                itemDisplayName, 
                vendor, 
                poNumber, 
                date, 
                quantity, 
                product, 
                specification, 
                specificationNumber, 
                gradeTypeAlloy, 
                fittingType, 
                fittingSpec, 
                th1, th2, th3, th4, 
                width, 
                length, 
                diameter, 
                otherDim, 
                visualInspectionAcceptable, 
                b16DimensionsAcceptable, 
                actualMaterialMarking, 
                markingAcceptableToCode, 
                mtrCofCAcceptable, 
                resultAccept, 
                resultReject, 
                comments, 
                qcInitials, 
                qcDate, 
                qcManagerInitials, 
                qcManagerDate, 
                photoCount, 
                offloadStatus, 
                pdfStatus, 
                pdfStoragePath, 
                cloudItemId`,
    photos: `++id, materialId, jobNumber, status, createdAt, category, label, sequence`,
    uploadQueue: `++id, status, type, createdAt, updatedAt, materialId, photoId`,
    hydroReports: "++id, jobNumber"
});


// Open the database
db.open().catch(err => {
    console.error("Failed to open ASMEReceivingDB:", err);
});
