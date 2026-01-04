import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  updateDoc,
  getDoc,
  serverTimestamp,
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

// Wait for auth to produce a user (anonymous is fine)
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

async function initializeNativeFirebase(config) {
  const capacitor = window.Capacitor;
  const isNative = typeof capacitor?.isNativePlatform === "function"
    ? capacitor.isNativePlatform()
    : Boolean(capacitor?.isNative);

  if (!isNative) return { status: "skipped", reason: "not-native" };

  const nativePlugin = capacitor?.Plugins?.FirebaseNative;
  if (!nativePlugin?.initialize) return { status: "skipped", reason: "missing-plugin" };

  if (!config?.apiKey || !config?.appId || !config?.projectId) {
    return { status: "skipped", reason: "missing-config" };
  }

  try {
    const res = await nativePlugin.initialize({ config });
    return res || { status: "initialized" };
  } catch (err) {
    console.warn("Native Firebase init failed:", err);
    return { status: "error", error: err?.message || String(err) };
  }
}

window.cloudApiReady = (async () => {
  // --- guardrails ---
  if (!window.cloudSettings) return { enabled: false, reason: "missing-settings" };

  const config = await window.cloudSettings.getFirebaseConfig?.();
  if (!config) return { enabled: false, reason: "missing-config" };

  const nativeInit = await initializeNativeFirebase(config);
  if (nativeInit?.status === "error") {
    console.warn("Proceeding with web Firebase SDK after native init failure:", nativeInit);
  }

  // --- init ---
  const app = initializeApp(config);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  // --- ensure anonymous auth (so request.auth.uid exists) ---
  let user = auth.currentUser;
  if (!user) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      // If it was already happening, no big deal—still wait for user
      console.warn("Anonymous sign-in attempt failed (waiting for auth anyway):", e);
    }
    user = await waitForFirebaseUser(auth);
  }
  const uid = user.uid;

  // -------------------------
  // Firestore path helpers
  // -------------------------
  const jobRef = (jobNumber) =>
    doc(db, "users", uid, "jobs", String(jobNumber));

  const itemsCol = (jobNumber) =>
    collection(db, "users", uid, "jobs", String(jobNumber), "items");

  const itemRef = (jobNumber, itemId) =>
    doc(db, "users", uid, "jobs", String(jobNumber), "items", String(itemId));

  const photosCol = (jobNumber, itemId) =>
    collection(db, "users", uid, "jobs", String(jobNumber), "items", String(itemId), "photos");

  const photoRef = (jobNumber, itemId, photoId) =>
    doc(db, "users", uid, "jobs", String(jobNumber), "items", String(itemId), "photos", String(photoId));

  // Tiny index so we can find a jobNumber for an itemId later without scanning
  const itemIndexRef = (itemId) =>
    doc(db, "users", uid, "itemIndex", String(itemId));

  // -------------------------
  // Storage path helpers
  // -------------------------
  const sanitizePathLabel = (value, fallback) => {
    const cleaned = String(value || "")
      .trim()
      .replace(/[^a-z0-9_-]+/gi, "_")
      .replace(/^_+|_+$/g, "");
    return cleaned || fallback;
  };

  const buildPhotoStoragePaths = (jobNumber, itemId, photoId, options = {}) => {
    const categoryFolder = options.category === "mtr" ? "mtr-cofc" : "materials";
    const label = sanitizePathLabel(options.label, String(photoId));
    const base = `users/${uid}/jobs/${String(jobNumber)}/items/${String(itemId)}/photos/${categoryFolder}/${label}`;
    return {
      thumb: `${base}/thumb.jpg`,
      full: `${base}/full.jpg`,
    };
  };

  const buildPdfStoragePath = (jobNumber, itemId) => {
    return `users/${uid}/jobs/${String(jobNumber)}/items/${String(itemId)}/report.pdf`;
  };

  // -------------------------
  // Payload builders
  // -------------------------
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

    uid,
    updatedAt: serverTimestamp(),
  });

  // -------------------------
  // Public API
  // -------------------------
  const ensureJobDoc = async (jobNumber, jobData = {}) => {
    if (!jobNumber) throw new Error("ensureJobDoc: jobNumber required");

    await setDoc(
      jobRef(jobNumber),
      {
        jobNumber: String(jobNumber),
        description: jobData.description || "",
        notes: jobData.notes || "",
        uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const upsertItemDoc = async (material) => {
    if (!material?.jobNumber) throw new Error("upsertItemDoc: material.jobNumber required");

    // keep job doc alive
    await ensureJobDoc(material.jobNumber, {
      description: material.jobDescription || "",
      notes: material.jobNotes || "",
    });

    // create item if missing
    if (!material.cloudItemId) {
      const newItemRef = doc(itemsCol(material.jobNumber)); // auto-id
      await setDoc(newItemRef, buildItemPayload(material), { merge: true });

      // index: itemId -> jobNumber
      await setDoc(itemIndexRef(newItemRef.id), {
        jobNumber: String(material.jobNumber),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return newItemRef.id;
    }

    // update item
    await setDoc(itemRef(material.jobNumber, material.cloudItemId), buildItemPayload(material), { merge: true });

    // index update
    await setDoc(itemIndexRef(material.cloudItemId), {
      jobNumber: String(material.jobNumber),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return material.cloudItemId;
  };

  const createPhotoDoc = async (material, photoMeta = {}) => {
    if (!material?.jobNumber) throw new Error("createPhotoDoc: material.jobNumber required");
    if (!material?.cloudItemId) throw new Error("createPhotoDoc: material.cloudItemId required");

    const newPhotoRef = doc(photosCol(material.jobNumber, material.cloudItemId));
    const paths = buildPhotoStoragePaths(material.jobNumber, material.cloudItemId, newPhotoRef.id, {
      category: photoMeta.category,
      label: photoMeta.label,
    });

    await setDoc(newPhotoRef, {
      thumbStoragePath: paths.thumb,
      fullStoragePath: paths.full,
      status: "thumbnail-pending",
      uid,
      createdAt: serverTimestamp(),
    });

    return { id: newPhotoRef.id, ...paths };
  };

  const updatePhotoStatus = async (material, photoId, payload) => {
    if (!material?.jobNumber) throw new Error("updatePhotoStatus: material.jobNumber required");
    if (!material?.cloudItemId) throw new Error("updatePhotoStatus: material.cloudItemId required");
    if (!photoId) throw new Error("updatePhotoStatus: photoId required");

    await updateDoc(photoRef(material.jobNumber, material.cloudItemId, photoId), payload);
  };

  const uploadFile = async (path, blob, onProgress) => {
    if (!path) throw new Error("uploadFile: path required");
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);

      task.on(
        "state_changed",
        (snap) => {
          if (onProgress) {
            const p = snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0;
            onProgress(p);
          }
        },
        reject,
        () => resolve()
      );
    });
  };

  // Lets old callers do isItemReady(itemId) by looking up the index
  const isItemReady = async (itemIdOrJobNumber, maybeItemId) => {
    // New style: isItemReady(jobNumber, itemId)
    if (maybeItemId) {
      const snap = await getDoc(itemRef(itemIdOrJobNumber, maybeItemId));
      return snap.exists();
    }

    // Old style: isItemReady(itemId)
    const itemId = itemIdOrJobNumber;
    const idxSnap = await getDoc(itemIndexRef(itemId));
    if (!idxSnap.exists()) return false;

    const { jobNumber } = idxSnap.data();
    if (!jobNumber) return false;

    const snap = await getDoc(itemRef(jobNumber, itemId));
    return snap.exists();
  };

  const requestPdfGeneration = async (material) => {
    const endpoint = await window.cloudSettings.getPdfEndpoint?.();
    if (!endpoint) throw new Error("PDF endpoint not configured.");
    if (!material?.jobNumber) throw new Error("requestPdfGeneration: material.jobNumber required");
    if (!material?.cloudItemId) throw new Error("requestPdfGeneration: material.cloudItemId required");

    // where the PDF SHOULD end up in Storage
    const pdfPath = buildPdfStoragePath(material.jobNumber, material.cloudItemId);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        jobNumber: String(material.jobNumber),
        itemId: String(material.cloudItemId),
        pdfStoragePath: pdfPath,
      }),
    });

    if (!res.ok) throw new Error(`PDF request failed: ${res.status}`);

    const data = await res.json().catch(() => ({}));
    return data.pdfStoragePath || pdfPath;
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
    buildPdfStoragePath,
  };
})();
