import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, setDoc, collection, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

window.cloudApiReady = (async () => {
    if (!window.cloudSettings) {
        return { enabled: false, reason: "missing-settings" };
    }

    const config = window.cloudSettings.getFirebaseConfig();
    if (!config) {
        return { enabled: false, reason: "missing-config" };
    }

    const app = initializeApp(config);
    const firestore = getFirestore(app);
    const storage = getStorage(app);

    const ensureJobDoc = async (jobNumber, jobData) => {
        const jobRef = doc(firestore, "jobs", jobNumber);
        await setDoc(jobRef, {
            jobNumber,
            description: jobData.description || "",
            notes: jobData.notes || "",
            updatedAt: new Date().toISOString()
        }, { merge: true });
    };

    const upsertItemDoc = async (material) => {
        if (!material.cloudItemId) {
            const newRef = doc(collection(firestore, "items"));
            await setDoc(newRef, buildItemPayload(material));
            return newRef.id;
        }

        const itemRef = doc(firestore, "items", material.cloudItemId);
        await setDoc(itemRef, buildItemPayload(material), { merge: true });
        return material.cloudItemId;
    };

    const buildItemPayload = (material) => ({
        jobNumber: material.jobNumber,
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
        photoCount: material.photoCount || 0,
        offloadStatus: material.offloadStatus || "local-only",
        pdfStatus: material.pdfStatus || "not-started",
        pdfStoragePath: material.pdfStoragePath || "",
        updatedAt: new Date().toISOString()
    });

    const createPhotoDoc = async (material, photo) => {
        const photosRef = collection(firestore, "items", material.cloudItemId, "photos");
        const photoRef = doc(photosRef);
        const storagePaths = buildPhotoStoragePaths(material.jobNumber, material.cloudItemId, photoRef.id);

        await setDoc(photoRef, {
            thumbStoragePath: storagePaths.thumb,
            fullStoragePath: storagePaths.full,
            status: "thumbnail-pending",
            createdAt: new Date().toISOString()
        });

        return { id: photoRef.id, ...storagePaths };
    };

    const updatePhotoStatus = async (material, photoId, payload) => {
        const photoRef = doc(firestore, "items", material.cloudItemId, "photos", photoId);
        await updateDoc(photoRef, payload);
    };

    const uploadFile = async (path, blob, onProgress) => {
        const storageRef = ref(storage, path);
        return new Promise((resolve, reject) => {
            const task = uploadBytesResumable(storageRef, blob);
            task.on("state_changed", (snapshot) => {
                if (onProgress) {
                    const progress = snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
                    onProgress(progress);
                }
            }, reject, () => resolve());
        });
    };

    const requestPdfGeneration = async (material) => {
        const endpoint = window.cloudSettings.getPdfEndpoint();
        if (!endpoint) {
            throw new Error("PDF endpoint not configured.");
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobNumber: material.jobNumber,
                itemId: material.cloudItemId
            })
        });

        if (!response.ok) {
            throw new Error(`PDF request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.pdfStoragePath || "";
    };

    const buildPhotoStoragePaths = (jobNumber, itemId, photoId) => {
        const base = `jobs/${jobNumber}/items/${itemId}/photos/${photoId}`;
        return {
            thumb: `${base}/thumb.jpg`,
            full: `${base}/full.jpg`
        };
    };

    const isItemReady = async (itemId) => {
        const itemRef = doc(firestore, "items", itemId);
        const snap = await getDoc(itemRef);
        return snap.exists();
    };

    return {
        enabled: true,
        ensureJobDoc,
        upsertItemDoc,
        createPhotoDoc,
        updatePhotoStatus,
        uploadFile,
        requestPdfGeneration,
        buildPhotoStoragePaths,
        isItemReady
    };
})();
