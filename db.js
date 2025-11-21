// db.js — Dexie IndexedDB setup

// Create database
const db = new Dexie("ASMEReceivingDB");

// Define schema
db.version(1).stores({
    jobs: "jobNumber, description, notes, createdAt",
    materials: "++id, jobNumber, partNumber, description, qty, heat"
});

// Open DB and catch errors
db.open().catch(err => {
    console.error("DB open failed:", err);
});