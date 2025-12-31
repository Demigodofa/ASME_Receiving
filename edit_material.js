let materialId;
let jobNumber;
let photos = [];

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    materialId = Number(params.get("id"));

    if (!materialId) {
        alert("Error: No material ID provided.");
        history.back();
        return;
    }

    const material = await db.materials.get(materialId);
    if (!material) {
        alert("Material not found.");
        history.back();
        return;
    }

    jobNumber = material.jobNumber;

    description.value = material.description || "";
    vendor.value = material.vendor || "";
    poNumber.value = material.poNumber || "";
    date.value = material.date || "";
    quantity.value = material.quantity || "";
    specPrefix.value = material.specPrefix || "";
    specCode.value = material.specCode || "";
    grade.value = material.grade || "";
    b16dim.value = material.b16dim || "";
    th1.value = material.th1 || "";
    th2.value = material.th2 || "";
    th3.value = material.th3 || "";
    th4.value = material.th4 || "";
    visual.value = material.visual || "";
    markingAcceptable.value = material.markingAcceptable || "Yes";
    mtrAcceptable.value = material.mtrAcceptable || "Yes";
    actualMarking.value = material.actualMarking || "";
    comments.value = material.comments || "";
    qcInitials.value = material.qcInitials || "";
    qcDate.value = material.qcDate || "";

    await loadPhotos(material);
    updateOffloadStatus(material);

    document.getElementById("photoInput").onchange = handlePhoto;
    document.getElementById("saveMaterialBtn").onclick = saveChanges;
    document.getElementById("startOffloadBtn").onclick = startOffload;
    document.getElementById("freeUpSpaceBtn").onclick = freeUpSpace;
};

async function loadPhotos(material) {
    const storedPhotos = await db.photos.where("materialId").equals(materialId).toArray();

    if (storedPhotos.length > 0) {
        photos = await Promise.all(storedPhotos.map(async (photo) => {
            const preview = await resolvePreview(photo);
            return { ...photo, preview, isNew: false };
        }));
        renderPhotos();
        return;
    }

    if (Array.isArray(material.photos)) {
        photos = material.photos.slice(0, 5).map((dataUrl) => ({
            preview: dataUrl,
            isNew: false
        }));
    }

    renderPhotos();
}

async function resolvePreview(photo) {
    if (photo.thumbnailDataUrl) {
        return photo.thumbnailDataUrl;
    }

    if (photo.thumbnailBlob) {
        return window.photoUtils.blobToDataUrl(photo.thumbnailBlob);
    }

    if (photo.fullBlob) {
        return window.photoUtils.blobToDataUrl(photo.fullBlob);
    }

    return "";
}

async function handlePhoto(e) {
    if (photos.length >= 5) {
        alert("Maximum of 5 photos allowed.");
        return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const { thumbBlob, thumbDataUrl } = await window.photoUtils.createThumbnail(file);

    photos.push({
        fullBlob: file,
        thumbnailBlob: thumbBlob,
        thumbnailDataUrl: thumbDataUrl,
        preview: thumbDataUrl,
        isNew: true
    });

    renderPhotos();
    e.target.value = "";
}

function renderPhotos() {
    const div = document.getElementById("photoPreview");
    div.innerHTML = "";

    photos.slice(0, 5).forEach((photo, index) => {
        const el = document.createElement("div");
        el.className = "thumb-container";

        el.innerHTML = `
            <img src="${photo.preview}" class="thumb">
            <button class="thumb-delete" onclick="deletePhoto(${index})">×</button>
        `;

        div.appendChild(el);
    });
}

async function deletePhoto(idx) {
    const removed = photos.splice(idx, 1)[0];
    if (removed?.id) {
        await db.photos.delete(removed.id);

        const cloud = await window.cloudApiReady;
        const material = await db.materials.get(materialId);
        if (cloud.enabled && material?.cloudItemId && removed.cloudPhotoId) {
            await cloud.updatePhotoStatus(material, removed.cloudPhotoId, { status: "deleted" });
        }
    }

    renderPhotos();
}

async function saveChanges() {
    const updated = {
        id: Number(materialId),
        jobNumber,
        description: description.value,
        vendor: vendor.value,
        poNumber: poNumber.value,
        date: date.value,
        quantity: quantity.value,
        specPrefix: specPrefix.value,
        specCode: specCode.value,
        grade: grade.value,
        b16dim: b16dim.value,
        th1: th1.value,
        th2: th2.value,
        th3: th3.value,
        th4: th4.value,
        visual: visual.value,
        markingAcceptable: markingAcceptable.value,
        mtrAcceptable: mtrAcceptable.value,
        actualMarking: actualMarking.value,
        comments: comments.value,
        qcInitials: qcInitials.value,
        qcDate: qcDate.value,
        photoCount: photos.length
    };

    await db.materials.put(updated);

    for (const photo of photos.filter((p) => p.isNew)) {
        const photoId = await db.photos.add({
            materialId,
            jobNumber,
            fullBlob: photo.fullBlob,
            thumbnailBlob: photo.thumbnailBlob,
            thumbnailDataUrl: photo.thumbnailDataUrl,
            status: "local",
            createdAt: new Date().toISOString()
        });
        photo.id = photoId;
        photo.isNew = false;
    }

    await syncEditsToCloud();

    const base = window.location.origin;
    window.location.href = `${base}/job.html?job=${jobNumber}`;
}

async function syncEditsToCloud() {
    const cloud = await window.cloudApiReady;
    if (!cloud.enabled || !window.cloudSettings.isCloudModeEnabled()) {
        return;
    }

    const material = await db.materials.get(materialId);
    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();

    await cloud.ensureJobDoc(jobNumber, job || {});

    const cloudItemId = await cloud.upsertItemDoc(material);
    await db.materials.update(materialId, { cloudItemId });

    const photoRecords = await db.photos.where("materialId").equals(materialId).toArray();

    for (const photo of photoRecords) {
        if (photo.cloudPhotoId) {
            continue;
        }

        const { id: cloudPhotoId, thumb, full } = await cloud.createPhotoDoc({
            ...material,
            cloudItemId
        }, photo);

        await db.photos.update(photo.id, {
            cloudPhotoId,
            thumbStoragePath: thumb,
            fullStoragePath: full,
            status: "thumbnail-pending"
        });

        await window.uploadQueue.enqueueThumbnail({
            materialId,
            photoId: photo.id,
            storagePath: thumb,
            itemId: cloudItemId
        });
    }
}

async function startOffload() {
    const cloud = await window.cloudApiReady;
    if (!cloud.enabled || !window.cloudSettings.isCloudModeEnabled()) {
        alert("Cloud mode is disabled or not configured.");
        return;
    }

    const material = await db.materials.get(materialId);
    if (!material) {
        return;
    }

    if (!material.cloudItemId) {
        const cloudItemId = await cloud.upsertItemDoc(material);
        await db.materials.update(materialId, { cloudItemId });
        material.cloudItemId = cloudItemId;
    }

    await db.materials.update(materialId, { offloadStatus: "uploading" });
    await cloud.upsertItemDoc({ ...material, offloadStatus: "uploading" });

    const photoRecords = await db.photos.where("materialId").equals(materialId).toArray();

    for (const photo of photoRecords) {
        let storagePath = photo.fullStoragePath;
        let cloudPhotoId = photo.cloudPhotoId;

        if (!cloudPhotoId) {
            const result = await cloud.createPhotoDoc({
                ...material,
                cloudItemId: material.cloudItemId
            }, photo);
            cloudPhotoId = result.id;
            storagePath = result.full;

            await db.photos.update(photo.id, {
                cloudPhotoId,
                thumbStoragePath: result.thumb,
                fullStoragePath: result.full
            });
        }

        if (!storagePath) {
            const paths = cloud.buildPhotoStoragePaths(material.jobNumber, material.cloudItemId, cloudPhotoId);
            storagePath = paths.full;
            await db.photos.update(photo.id, { fullStoragePath: storagePath });
        }

        await window.uploadQueue.enqueueFull({
            materialId,
            photoId: photo.id,
            storagePath,
            itemId: material.cloudItemId
        });
    }

    try {
        await window.uploadQueue.waitForMaterialUploads(materialId, "full");

        await db.materials.update(materialId, { pdfStatus: "generating" });
        await cloud.upsertItemDoc({ ...material, pdfStatus: "generating" });

        await window.uploadQueue.enqueuePdf({ materialId, itemId: material.cloudItemId });
        await window.uploadQueue.waitForMaterialUploads(materialId, "pdf");

        await db.materials.update(materialId, { offloadStatus: "complete" });
        await cloud.upsertItemDoc({ ...material, offloadStatus: "complete" });
    } catch (error) {
        await db.materials.update(materialId, { offloadStatus: "failed" });
        await cloud.upsertItemDoc({ ...material, offloadStatus: "failed" });
        alert(`Offload failed: ${error.message}`);
    }

    updateOffloadStatus(await db.materials.get(materialId));
}

async function freeUpSpace() {
    const material = await db.materials.get(materialId);
    if (!material) return;

    if (material.pdfStatus !== "ready") {
        alert("PDF is not ready yet.");
        return;
    }

    const photoRecords = await db.photos.where("materialId").equals(materialId).toArray();
    for (const photo of photoRecords) {
        await db.photos.update(photo.id, {
            fullBlob: null,
            status: "cloud-only"
        });
    }

    await db.materials.update(materialId, { offloadStatus: "cloud-only" });

    const cloud = await window.cloudApiReady;
    if (cloud.enabled && material.cloudItemId) {
        await cloud.upsertItemDoc({ ...material, offloadStatus: "cloud-only" });
    }

    updateOffloadStatus(await db.materials.get(materialId));
}

function updateOffloadStatus(material) {
    const offloadText = document.getElementById("offloadStatusText");
    const pdfText = document.getElementById("pdfStatusText");
    const freeBtn = document.getElementById("freeUpSpaceBtn");

    if (!material || !offloadText || !pdfText || !freeBtn) {
        return;
    }

    offloadText.textContent = material.offloadStatus || "local-only";
    pdfText.textContent = material.pdfStatus || "not-started";

    freeBtn.disabled = !(material.offloadStatus === "complete" && material.pdfStatus === "ready");
}
