
// ========================================
// ASME RECEIVING - IndexedDB Engine
// ========================================

let db;

// Open (or create) the database
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("ASME_Receiving_DB", 1);

        request.onerror = (e) => reject("DB open error: " + e.target.error);

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            db = e.target.result;

            // Jobs store (key: jobNumber)
            if (!db.objectStoreNames.contains("jobs")) {
                const jobsStore = db.createObjectStore("jobs", {
                    keyPath: "jobNumber"
                });
                jobsStore.createIndex("jobNumber", "jobNumber", { unique: true });
            }

            // Materials store (key: autoIncrement)
            if (!db.objectStoreNames.contains("materials")) {
                const matStore = db.createObjectStore("materials", {
                    keyPath: "id",
                    autoIncrement: true
                });
                matStore.createIndex("jobNumber", "jobNumber", { unique: false });
            }
        };
    });
}

// Run operations in a transaction
function tx(storeName, mode = "readonly") {
    return db.transaction(storeName, mode).objectStore(storeName);
}

// ========================================
// JOB FUNCTIONS
// ========================================

// Add or update job
async function saveJob(job) {
    await openDB();
    return new Promise((resolve, reject) => {
        const request = tx("jobs", "readwrite").put(job);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// Get single job
async function getJob(jobNumber) {
    await openDB();
    return new Promise((resolve, reject) => {
        const request = tx("jobs").get(jobNumber);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get all jobs
async function getAllJobs() {
    await openDB();
    return new Promise((resolve, reject) => {
        const request = tx("jobs").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ========================================
// MATERIAL FUNCTIONS
// ========================================

// Add material linked to jobNumber
async function saveMaterial(material) {
    await openDB();
    return new Promise((resolve, reject) => {
        const request = tx("materials", "readwrite").put(material);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// Get all materials for a jobNumber
async function getMaterials(jobNumber) {
    await openDB();
    return new Promise((resolve, reject) => {
        const store = tx("materials").index("jobNumber");
        const request = store.getAll(jobNumber);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete material
async function deleteMaterial(id) {
    await openDB();
    return new Promise((resolve, reject) => {
        const request = tx("materials", "readwrite").delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}
