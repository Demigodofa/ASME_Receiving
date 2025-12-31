import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

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

// Promise helper: waits for auth to produce a user (anonymous is fine)
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

window.cloudApiReady = (async () => {
  // ---- Guardrails ----
  if (!window.cloudSettings) return { enabled: false, reason: "missing-settings" };

  const config = window.cloudSettings.getFirebaseConfig?.();
  if (!config) return { enabled: false, reason: "missing-config" };

  // ---- Firebase init ----
  const app = initializeApp(config);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  // Ensure we always have a uid (anonymous auth)
  let user = auth.currentUser;
  if (!user) {
    // If no user yet, kick off anonymous sign-in, then wait for auth state
    try {
      await signInAnonymously(auth);
    } catch (e) {
      // In case it was already in progress or blocked, still try to wait for a user
      console.warn("Anonymous sign-in attempt failed (will still wait for auth):", e);
    }
    user = await waitForFirebaseUser(auth);
  }

  const uid = user.uid;

  // ---- Path builders (single source of truth) ----
  const jobDocRef = (jobNumber) =>
    doc(firestore, "users", uid, "jobs", String(jobNumber));

  const itemsColRef = (jobNumber) =>
    collection(firestore, "users", uid, "jobs", String(jobNumber), "items");

  const itemDocRef = (jobNumber, itemId) =>
    doc(firestore, "users", uid, "jobs", String(jobNumber), "items", String(itemId));

  const photosColRef = (jobNumber, itemId) =>
    collection(
      firestore,
      "users",
      uid,
      "jobs",
      String(jobNumber),
      "items",
      String(itemId),
      "photos"
    );

  const photoDocRef = (jobNumber, itemId, photoId) =>
    doc(
      firestore,
      "users",
      uid,
      "jobs",
      String(jobNumber),
      "items",
      String(itemId),
      "photos",
      String(photoId)
    );

  const buildPhotoStoragePaths = (jobNumber, itemId, photoId) => {
    const base = `users/${uid}/jobs/${jobNumber}/items/${itemId}/photos/${photoId}`;
    return { thumb: `${base}/thumb.jpg`, full: `${base}/full.jpg` };
  };

  // ---- Payload builder ----
  const buildItemPayload = (material) => ({
    jobNumber: String(material.jobNumber || ""),
    description: material.description || "",
    vendor: material.vendor || "",
    poNumber: material.poNumber || "",
    date: material.date || "",
    quantity: material.quantity || "",
    product: material.product || "",
    specPrefix: material.specPrefix || "",
    specCode: material.specCode || "",
    grade: material.grade || "",
    b16dim: material.b16dim || "",
    th1: material.th1 || "",
    th2: material.th2 || "",
    th3: material.th3 || "",
    th4: material.th4 || "",
    other: material.other || "",
    visual: material.visual || "",
    markingAcceptable: material.markingAcceptable || "",
    mtrAcceptable: material.mtrAcceptable || "",
    actualMarking: material.actualMarking || "",
    comments: material.comments || "",
    qcInitials: material.qcInitials || "",
    qcDate: material.qcDate || "",
    photoCount: Number(material.photoCount || 0),

    // Cloud/offload state
    offloadStatus: material.offloadStatus || "local-only",
    pdfStatus: material.pdfStatus || "not-started",
    pdfStoragePath: material.pdfStoragePath || "",

    // Useful metadata
    uid,
    updatedAt: new Date().toISOString(),
  });

  // ---- Public API ----

  // Create/update job doc under users/<uid>/jobs/<jobNumber>
  const ensureJobDoc = async (jobNumber, jobData = {}) => {
    if (!jobNumber) throw new Error("ensureJobDoc: jobNumber required");

    const ref = jobDocRef(jobNumber);
    await setDoc(
      ref,
      {
        jobNumber: String(jobNumber),
        description: jobData.description || "",
        notes: jobData.notes || "",
        uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // Create/update an item doc under users/<uid>/jobs/<jobNumber>/items/<itemId>
  // If material.cloudItemId is missing, we create one.
  const upsertItemDoc = async (material) => {
    if (!material?.jobNumber) throw new Error("upsertItemDoc: material.jobNumber required");

    // Ensure the job doc exists (nice for browsing later)
    await ensureJobDoc(material.jobNumber, {
      description: material.jobDescription || "",
      notes: material.jobNotes || "",
    });

    if (!material.cloudItemId) {
      const newRef = doc(itemsColRef(material.jobNumber)); // auto-id
      await setDoc(newRef, buildItemPayload(material), { merge: true });
      return newRef.id;
    }

    const ref = itemDocRef(material.jobNumber, material.cloudItemId);
    await setDoc(ref, buildItemPayload(material), { merge: true });
    return material.cloudItemId;
  };

  // Creates a photo doc under the item, returns paths for thumb/full
  const createPhotoDoc = async (material, photo) => {
    if (!material?.jobNumber) throw new Error("createPhotoDoc: material.jobNumber required");
    if (!material?.cloudItemId) throw new Error("createPhotoDoc: material.cloudItemId required");

    const photosRef = photosColRef(material.jobNumber, material.cloudItemId);
    const newPhotoRef = doc(photosRef); // auto-id
    const storagePaths = buildPhotoStoragePaths(
      material.jobNumber,
      material.cloudItemId,
      newPhotoRef.id
    );

    await setDoc(newPhotoRef, {
      thumbStoragePath: storagePaths.thumb,
      fullStoragePath: storagePaths.full,
      status: "thumbnail-pending",
      uid,
      createdAt: new Date().toISOString(),
    });

    return { id: newPhotoRef.id, ...storagePaths };
  };

  const updatePhotoStatus = async (material, photoId, payload) => {
    if (!material?.jobNumber) throw new Error("updatePhotoStatus: material.jobNumber required");
    if (!material?.cloudItemId) throw new Error("updatePhotoStatus: material.cloudItemId required");
    if (!photoId) throw new Error("updatePhotoStatus: photoId required");

    const ref = photoDocRef(material.jobNumber, material.cloudItemId, photoId);
    await updateDoc(ref, payload);
  };

  // Uploads a blob to Storage at the given path
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

  // Requests PDF generation from your backend
  // IMPORTANT: include uid so server can write to the correct user folder safely
  const requestPdfGeneration = async (material) => {
    const endpoint = window.cloudSettings.getPdfEndpoint?.();
    if (!endpoint) throw new Error("PDF endpoint not configured.");
    if (!material?.jobNumber) throw new Error("requestPdfGeneration: material.jobNumber required");
    if (!material?.cloudItemId) throw new Error("requestPdfGeneration: material.cloudItemId required");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        jobNumber: String(material.jobNumber),
        itemId: String(material.cloudItemId),
      }),
    });

    if (!response.ok) throw new Error(`PDF request failed: ${response.status}`);

    const data = await response.json();
    return data.pdfStoragePath || "";
  };

  // Checks if an item exists under the current user/job
  const isItemReady = async (jobNumber, itemId) => {
    const ref = itemDocRef(jobNumber, itemId);
    const snap = await getDoc(ref);
    return snap.exists();
  };

  return {
    enabled: true,

    // identity
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
