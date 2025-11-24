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

// Verified working across all browsers (Safari, iOS, Android, Chrome)
db.open().catch(err => {
    console.error("Failed to open ASMEReceivingDB:", err);
});
