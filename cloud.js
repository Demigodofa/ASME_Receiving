// cloud.js (DROP-IN)

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// ---- Helpers ----
function waitForFirebaseUser(auth) {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
        }
      },
      (err) => {
        unsub();
        reject(err);
      }
    );
  });
}

async function ensureAnonUser(auth) {
  if (auth.currentUser) return auth.currentUser;

  // kick off anon sign-in (idempotent enough for our use)
  try {
    await signInAnonymously(auth);
  } catch (e) {
    // Sometimes sign-in is already in-flight or blocked briefly; we still wait.
    console.warn("Anonymous sign-in attempt failed (will still wait for auth):", e);
  }

  const user = await waitForFirebaseUser(auth);
  return user;
}

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function asNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

window.cloudApiReady = (async () => {
  // ---- Guardrails ----
  if (!window.cloudSettings) return { enabled: false, reason: "missing-settings" };

  // Optional: obey your Cloud Mode toggle if you’re using it.
  // If you want cloud APIs available even when disabled, delete these 2 lines.
  if (window.cloudSettings.isCloudModeEnabled && !window.cloudSettings.isCloudModeEnabled()) {
    return { enabled: false, reason: "cloud-mode-disabled" };
  }

  const config = window.cloudSettings.getFirebaseConfig?.();
  if (!config) return { enabled: false, reason: "missing-config" };

  // ---- Firebase init (avoid double-init) ----
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  // Ensure we have a uid (anonymous auth)
  const user = await ensureAnonUser(auth);
  const uid = user.uid;

  // ---- Firestore path builders (single source of truth) ----
  const jobDocRef = (jobNumber) =>
    doc(firestore, "users", uid, "jobs", asStr(jobNumber));

  const itemsColRef = (jobNumber) =>
    collection(firestore, "users", uid, "jobs", asStr(jobNumber), "items");

  const itemDocRef = (jobNumber, itemId) =>
    doc(firestore, "users", uid, "jobs", asStr(jobNumber), "items", asStr(itemId));

  const photosColRef = (jobNumber, itemId) =>
    collection(
      firestore,
      "users",
      uid,
      "jobs",
      asStr(jobNumber),
      "items",
      asStr(itemId),
      "photos"
    );

  const photoDocRef = (jobNumber, itemId, photoId) =>
    doc(
      firestore,
      "users",
      uid,
      "jobs",
      asStr(jobNumber),
      "items",
      asStr(itemId),
      "photos",
      asStr(photoId)
    );

  // ---- Storage path builders ----
  // IMPORTANT: everything under users/<uid>/... so rules can be simple + secure
  const buildPhotoStoragePaths = (jobNumber, itemId, photoId) => {
    const base = `users/${uid}/jobs/${asStr(jobNumber)}/items/${asStr(itemId)}/photos/${asStr(photoId)}`;
    return {
      thumb: `${base}/thumb.jpg`,
      full: `${base}/full.jpg`,
    };
  };

  // (Optional) If you later store PDFs in Storage:
  const buildPdfStoragePath = (jobNumber, itemId) => {
    return `users/${uid}/jobs/${asStr(jobNumber)}/items/${asStr(itemId)}/report.pdf`;
  };

  // ---- Payload builders ----
  const buildItemPayload = (material) => ({
    jobNumber: asStr(material?.jobNumber),
    description: material?.description || "",
    vendor: material?.vendor || "",
    poNumber: material?.poNumber || "",
    date: material?.date || "",
    quantity: material?.quantity || "",
    product: material?.product || "",
    specPrefix: material?.specPrefix || "",
    specCode: material?.specCode || "",
    grade: material?.grade || "",
    b16dim: material?.b16dim || "",
    th1: material?.th1 || "",
    th2: material?.th2 || "",
    th3: material?.th3 || "",
    th4: material?.th4 || "",
    other: material?.other || "",
    visual: material?.visual || "",
    markingAcceptable: material?.markingAcceptable || "",
    mtrAcceptable: material?.mtrAcceptable || "",
    actualMarking: material?.actualMarking || "",
    comments: material?.comments || "",
    qcInitials: material?.qcInitials || "",
    qcDate: material?.qcDate || "",

    photoCount: asNum(material?.photoCount, 0),

    offloadStatus: material?.offloadStatus || "local-only",
    pdfStatus: material?.pdfStatus || "not-started",
    pdfStoragePath: material?.pdfStoragePath || "",

    uid,
    updatedAt: new Date().toISOString(),
  });

  // ---- Public API ----
  const ensureJobDoc = async (jobNumber, jobData = {}) => {
    if (!jobNumber) throw new Error("ensureJobDoc: jobNumber required");

    await setDoc(
      jobDocRef(jobNumber),
      {
        jobNumber: asStr(jobNumber),
        description: jobData.description || "",
        notes: jobData.notes || "",
        uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  const upsertItemDoc = async (material) => {
    const jobNumber = material?.jobNumber;
    if (!jobNumber) throw new Error("upsertItemDoc: material.jobNumber required");

    // ensure job exists for browsing later
    await ensureJobDoc(jobNumber, {
      description: material?.jobDescription || "",
      notes: material?.jobNotes || "",
    });

    if (!material.cloudItemId) {
      const newRef = doc(itemsColRef(jobNumber)); // auto-id
      await setDoc(newRef, buildItemPayload(material), { merge: true });
      return newRef.id;
    }

    const ref = itemDocRef(jobNumber, material.cloudItemId);
    await setDoc(ref, buildItemPayload(material), { merge: true });
    return material.cloudItemId;
  };

  const createPhotoDoc = async (material) => {
    const jobNumber = material?.jobNumber;
    const itemId = material?.cloudItemId;
    if (!jobNumber) throw new Error("createPhotoDoc: material.jobNumber required");
    if (!itemId) throw new Error("createPhotoDoc: material.cloudItemId required");

    const newPhotoRef = doc(photosColRef(jobNumber, itemId)); // auto-id
    const paths = buildPhotoStoragePaths(jobNumber, itemId, newPhotoRef.id);

    await setDoc(newPhotoRef, {
      thumbStoragePath: paths.thumb,
      fullStoragePath: paths.full,
      status: "thumbnail-pending",
      uid,
      createdAt: new Date().toISOString(),
    });

    return { id: newPhotoRef.id, ...paths };
  };

  const updatePhotoStatus = async (material, photoId, payload) => {
    const jobNumber = material?.jobNumber;
    const itemId = material?.cloudItemId;
    if (!jobNumber) throw new Error("updatePhotoStatus: material.jobNumber required");
    if (!itemId) throw new Error("updatePhotoStatus: material.cloudItemId required");
    if (!photoId) throw new Error("updatePhotoStatus: photoId required");

    await updateDoc(photoDocRef(jobNumber, itemId, photoId), payload);
  };

  const uploadFile = async (path, blob, onProgress) => {
    if (!path) throw new Error("uploadFile: path required");
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);

      task.on(
        "state_changed",
        (snapshot) => {
          if (onProgress) {
            const progress = snapshot.totalBytes
              ? snapshot.bytesTransferred / snapshot.totalBytes
              : 0;
            onProgress(progress);
          }
        },
        reject,
        () => resolve()
      );
    });
  };

  const requestPdfGeneration = async (material) => {
    const endpoint = window.cloudSettings.getPdfEndpoint?.();
    if (!endpoint) throw new Error("PDF endpoint not configured.");

    const jobNumber = material?.jobNumber;
    const itemId = material?.cloudItemId;
    if (!jobNumber) throw new Error("requestPdfGeneration: material.jobNumber required");
    if (!itemId) throw new Error("requestPdfGeneration: material.cloudItemId required");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        jobNumber: asStr(jobNumber),
        itemId: asStr(itemId),
        // handy if your server wants to know where to write:
        suggestedPdfPath: buildPdfStoragePath(jobNumber, itemId),
      }),
    });

    if (!response.ok) throw new Error(`PDF request failed: ${response.status}`);

    const data = await response.json();
    return data.pdfStoragePath || "";
  };

  // NOTE: this version matches your “everything is under job” structure
  const isItemReady = async (jobNumber, itemId) => {
    const snap = await getDoc(itemDocRef(jobNumber, itemId));
    return snap.exists();
  };

  return {
    enabled: true,
    uid,

    // firestore
    ensureJobDoc,
    upsertItemDoc,
    createPhotoDoc,
    updatePhotoStatus,
    isItemReady,

    // storage
    uploadFile,
    buildPhotoStoragePaths,

    // pdf
    requestPdfGeneration,
  };
})();
