let jobNumber;
let photos = [];

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    jobNumber = params.get("job");

    document.getElementById("photoInput").onchange = handlePhoto;
    document.getElementById("saveMaterialBtn").onclick = saveMaterial;
};

async function handlePhoto(e) {
    if (photos.length >= 5) {
        alert("Maximum 5 photos.");
        return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const { thumbBlob, thumbDataUrl } = await window.photoUtils.createThumbnail(file);

    photos.push({
        fullBlob: file,
        thumbnailBlob: thumbBlob,
        thumbnailDataUrl: thumbDataUrl,
        filename: file.name
    });

    renderPhotos();
    e.target.value = "";
}

function renderPhotos() {
    const div = document.getElementById("photoPreview");
    div.innerHTML = "";

    photos.forEach((photo, index) => {
        const el = document.createElement("div");
        el.className = "thumb-container";

        el.innerHTML = `
            <img src="${photo.thumbnailDataUrl}" class="thumb">
            <button class="thumb-delete" onclick="deletePhoto(${index})">×</button>
        `;

        div.appendChild(el);
    });
}

function deletePhoto(index) {
    photos.splice(index, 1);
    renderPhotos();
}

async function saveMaterial() {
    const m = {
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
        photoCount: photos.length,
        offloadStatus: "local-only",
        pdfStatus: "not-started"
    };

    const materialId = await db.materials.add(m);
    const now = new Date().toISOString();

    for (const photo of photos) {
        await db.photos.add({
            materialId,
            jobNumber,
            fullBlob: photo.fullBlob,
            thumbnailBlob: photo.thumbnailBlob,
            thumbnailDataUrl: photo.thumbnailDataUrl,
            status: "local",
            createdAt: now
        });
    }

    await syncMaterialToCloud(materialId);

    window.location.href = `job.html?job=${jobNumber}`;
}

async function syncMaterialToCloud(materialId) {
    const cloud = await window.cloudApiReady;
    if (!cloud.enabled || !window.cloudSettings.isCloudModeEnabled()) {
        return;
    }

    const material = await db.materials.get(materialId);
    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();

    await cloud.ensureJobDoc(jobNumber, job || {});

    const cloudItemId = await cloud.upsertItemDoc(material);
    await db.materials.update(materialId, { cloudItemId });

    const photosForMaterial = await db.photos.where("materialId").equals(materialId).toArray();

    for (const photo of photosForMaterial) {
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
