
let materialId;
let jobNumber;
let isDirty = false;
let suppressUnsavedWarning = false;
const PHOTO_LIMITS = {
    materials: 4,
    mtr: 8
};
const PHOTO_LABEL_LIMIT = 12;
const photoState = {
    materials: [],
    mtr: []
};
const CAMERA_MAX_DIM = {
    materials: 1920,
    mtr: 2200
};
const cameraState = {
    stream: null,
    category: null,
    mode: "photo",
    rotation: 0,
    contrast: 1
};

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    materialId = params.get("id");
    jobNumber = params.get("job");

    if (!materialId && !jobNumber) {
        alert("Error: Job number or Material ID is missing.");
        history.back();
        return;
    }

    // Autopopulate dates
    document.getElementById("date").valueAsDate = new Date();
    document.getElementById("qcDate").valueAsDate = new Date();
    document.getElementById("qcManagerDate").valueAsDate = new Date();

    if (materialId) {
        document.title = "Edit Receiving Report";
        document.querySelector(".title").textContent = "Edit Receiving Report";
        await loadMaterial();
        document.getElementById("deleteBtn").style.display = "block";
    } else {
        document.title = "New Receiving Report";
        document.querySelector(".title").textContent = "New Receiving Report";
        document.getElementById("jobNumber").value = jobNumber;
    }

    // Event Listeners
    document.getElementById("reportForm").onsubmit = saveReport;
    document.getElementById("deleteBtn").onclick = deleteReport;
    document.getElementById("fittingType").onchange = handleFittingChange;
    document.getElementById("materialsViewBtn").onclick = () => togglePhotoPreview("materials");
    document.getElementById("mtrViewBtn").onclick = () => togglePhotoPreview("mtr");
    document.getElementById("photoModalClose").onclick = closePhotoModal;
    document.getElementById("photoModal").onclick = (event) => {
        if (event.target.id === "photoModal") {
            closePhotoModal();
        }
    };

    document.querySelectorAll("[data-photo-input]").forEach((input) => {
        input.addEventListener("change", handlePhotoInput);
    });
    const materialsCameraBtn = document.getElementById("materialsCameraBtn");
    const mtrCameraBtn = document.getElementById("mtrCameraBtn");
    const capturePhotoBtn = document.getElementById("capturePhotoBtn");
    const exitCameraBtn = document.getElementById("exitCameraBtn");
    const scanRotation = document.getElementById("scanRotation");
    const scanContrast = document.getElementById("scanContrast");
    const modeButtons = document.querySelectorAll(".camera-mode-btn");

    if (materialsCameraBtn) {
        materialsCameraBtn.onclick = () => startCamera("materials");
    }
    if (mtrCameraBtn) {
        mtrCameraBtn.onclick = () => startCamera("mtr");
    }
    if (capturePhotoBtn) {
        capturePhotoBtn.onclick = captureFromCamera;
    }
    if (exitCameraBtn) {
        exitCameraBtn.onclick = closeCameraOverlay;
    }
    if (scanRotation) {
        scanRotation.addEventListener("input", (event) => {
            cameraState.rotation = Number(event.target.value || 0);
        });
    }
    if (scanContrast) {
        scanContrast.addEventListener("input", (event) => {
            cameraState.contrast = Number(event.target.value || 1);
        });
    }
    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => setCameraMode(btn.dataset.mode));
    });

    setupLineLimit("itemDisplayName", 5);
    setupLineLimit("actualMaterialMarking", 5);
    setupDimensionUnits();
    handleFittingChange();
    setupUnsavedWarning();
    window.addEventListener("pagehide", stopCameraStream);
    window.addEventListener("beforeunload", stopCameraStream);
};

async function loadMaterial() {
    const id = Number(materialId);
    const material = await db.materials.get(id);
    if (!material) {
        alert("Material not found.");
        history.back();
        return;
    }

    // Populate form fields with material data
    for (const key in material) {
        const element = document.getElementById(key);
        if (element) {
            if(element.type === 'date') {
                 element.valueAsDate = new Date(material[key]);
            } else if (element.type === 'checkbox') {
                element.checked = material[key];
            } else {
                element.value = material[key];
            }
        }
    }

    // Load photos
    const materialPhotos = await db.photos.where("materialId").equals(id).toArray();
    photoState.materials = [];
    photoState.mtr = [];
    const utils = window.photoUtils;
    for (const photo of materialPhotos) {
        const category = photo.category || "materials";
        if (!photoState[category]) continue;
        const kind = photo.kind || (category === "mtr" ? "mtr-photo" : "photo");
        let dataUrl = photo.imageData || photo.thumbnailDataUrl;
        if (!dataUrl && utils && utils.blobToDataUrl && (photo.thumbnailBlob || photo.fullBlob)) {
            try {
                dataUrl = await utils.blobToDataUrl(photo.thumbnailBlob || photo.fullBlob);
            } catch (error) {
                console.warn("Could not read stored photo", error);
            }
        }
        if (!dataUrl) continue;
        photoState[category].push({
            dataUrl,
            kind,
            pdfDataUrl: photo.pdfDataUrl || null,
            rotation: photo.rotation || 0,
            contrast: photo.contrast || 1
        });
    }
    renderPhotoPreview("materials");
    renderPhotoPreview("mtr");
}

function handleFittingChange() {
    const fittingType = document.getElementById("fittingType").value;
    const b16DimSelect = document.getElementById("b16DimensionsAcceptable");
    const fittingSpecInput = document.getElementById("fittingSpec");
    if (fittingType !== "B16.") {
        b16DimSelect.value = "N/A";
        b16DimSelect.disabled = true;
        fittingSpecInput.value = "N/A";
        fittingSpecInput.disabled = true;
    } else {
        b16DimSelect.disabled = false;
        fittingSpecInput.disabled = false;
        if (fittingSpecInput.value === "N/A") {
            fittingSpecInput.value = "";
        }
    }
}

async function saveReport(event) {
    event.preventDefault();
    suppressUnsavedWarning = true;
    isDirty = false;

    const reportData = {};
    const formElements = document.getElementById("reportForm").elements;
    for(let i=0; i < formElements.length; i++){
        const item = formElements[i];
        if(item.id){
            if(item.type === 'checkbox'){
                reportData[item.id] = item.checked;
            } else {
                 reportData[item.id] = item.value;
            }
        }
    }

    reportData.jobNumber = reportData.jobNumber || jobNumber;

    try {
        if (materialId) {
            // Update existing material
            const id = Number(materialId);
            await db.materials.update(id, reportData);
            await updatePhotos(id, reportData);
            alert("Report updated successfully!");
        } else {
            // Create new material
            const newId = await db.materials.add(reportData);
            await updatePhotos(newId, reportData);
            alert("Report saved successfully!");
            materialId = newId; // Set for potential further edits
        }
        history.back();
    } catch (error) {
        console.error("Failed to save report:", error);
        alert("Error saving report. See console for details.");
    }
}

async function deleteReport() {
    if (!confirm("Are you sure you want to delete this report and all its photos?")) return;

    suppressUnsavedWarning = true;
    isDirty = false;

    try {
        const id = Number(materialId);
        await db.photos.where("materialId").equals(id).delete();
        await db.uploadQueue.where("materialId").equals(id).delete();
        await db.materials.delete(id);
        alert("Report deleted.");
        window.location.href = `job.html?job=${jobNumber}`;
    } catch (error) {
        console.error("Failed to delete report:", error);
        alert("Error deleting report. See console for details.");
    }
}

async function handlePhotoInput(event) {
    const category = event.target.dataset.category;
    if (!category || !photoState[category]) return;

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
        const added = await addPhotoEntryFromFile(file, category);
        if (!added) break;
    }

    event.target.value = ''; // Clear the input
}

async function addPhotoEntryFromFile(file, category) {
    if (photoState[category].length >= PHOTO_LIMITS[category]) {
        alert(`You can only add up to ${PHOTO_LIMITS[category]} ${category === 'materials' ? 'materials' : 'MTR/CofC'} photos.`);
        return false;
    }

    let dataUrl;
    if (category === "materials") {
        dataUrl = await resizeAndCompressImage(file, CAMERA_MAX_DIM.materials, CAMERA_MAX_DIM.materials, 0.9);
    } else {
        dataUrl = await readFileAsDataUrl(file);
    }

    const entry = {
        dataUrl,
        kind: category === "mtr" ? "mtr-photo" : "photo",
        rotation: 0,
        contrast: 1
    };

    await addPhotoToState(category, entry);
    return true;
}

async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function addPhotoToState(category, entry) {
    if (!photoState[category]) return;
    if (photoState[category].length >= PHOTO_LIMITS[category]) {
        alert(`You can only add up to ${PHOTO_LIMITS[category]} ${category === 'materials' ? 'materials' : 'MTR/CofC'} photos.`);
        return;
    }

    photoState[category].push({
        dataUrl: entry.dataUrl,
        kind: entry.kind || (category === "mtr" ? "mtr-photo" : "photo"),
        pdfDataUrl: entry.pdfDataUrl || null,
        rotation: entry.rotation || 0,
        contrast: entry.contrast || 1
    });
    setDirty();
    renderPhotoPreview(category);
    updateCameraCount();
}

function renderPhotoPreview(category) {
    const previewContainer = document.getElementById(`${category}PhotoPreview`);
    if (!previewContainer) return;
    previewContainer.innerHTML = "";
    photoState[category].forEach((photo, index) => {
        const imgContainer = document.createElement("div");
        imgContainer.className = "photo-preview-item";
        if (photo.kind === "mtr-scan") {
            const pill = document.createElement("span");
            pill.className = "photo-type-pill";
            pill.textContent = "SCAN";
            imgContainer.appendChild(pill);
        } else if (photo.kind === "mtr-photo") {
            const pill = document.createElement("span");
            pill.className = "photo-type-pill";
            pill.textContent = "PHOTO";
            imgContainer.appendChild(pill);
        }
        const img = document.createElement("img");
        img.src = photo.dataUrl;
        img.alt = `${category} photo ${index + 1}`;
        img.onclick = () => openPhotoModal(photo.dataUrl);
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.className = "delete-photo-btn";
        deleteBtn.onclick = () => {
            photoState[category].splice(index, 1);
            setDirty();
            renderPhotoPreview(category);
        };
        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        previewContainer.appendChild(imgContainer);
    });
    updatePhotoCount(category);
    updateCameraCount();
}

async function updatePhotos(materialId, reportData) {
    const id = Number(materialId);
    const description = reportData.itemDisplayName || "";
    // First, remove all existing photos for this material from DB
    await db.photos.where("materialId").equals(id).delete();

    // Then, add the current photos from the photoState buckets
    for (const category of Object.keys(photoState)) {
        const bucket = photoState[category];
        for (let index = 0; index < bucket.length; index += 1) {
            const label = buildPhotoLabel(category, description, index + 1);
            const entry = bucket[index];
            await db.photos.add({
                materialId: id,
                jobNumber: jobNumber,
                imageData: entry.dataUrl,
                thumbnailDataUrl: entry.dataUrl,
                status: "local",
                category,
                label,
                sequence: index + 1,
                createdAt: new Date().toISOString(),
                kind: entry.kind || (category === "mtr" ? "mtr-photo" : "photo"),
                pdfDataUrl: entry.pdfDataUrl || null,
                rotation: entry.rotation || 0,
                contrast: entry.contrast || 1
            });
        }
    }
}

function buildPhotoLabel(category, description, index) {
    const cleaned = (description || "")
        .trim()
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");
    const short = cleaned.slice(0, PHOTO_LABEL_LIMIT) || "ITEM";
    const prefix = category === "mtr" ? `MTR_${short}` : short;
    return `${prefix}_${index}`;
}

function updatePhotoCount(category) {
    const countEl = document.getElementById(`${category}PhotoCount`);
    if (!countEl) return;
    countEl.textContent = `${photoState[category].length}/${PHOTO_LIMITS[category]}`;
}

function updateCameraCount() {
    const countEl = document.getElementById("cameraCount");
    if (!countEl || !cameraState.category) return;
    const current = photoState[cameraState.category]?.length || 0;
    countEl.textContent = `${current}/${PHOTO_LIMITS[cameraState.category]}`;
}

async function startCamera(category) {
    cameraState.category = category;
    if (category !== "mtr") {
        cameraState.mode = "photo";
    }
    stopCameraStream();
    syncCameraModeUI();
    resetScanAdjustments();
    updateCameraCount();

    const overlay = document.getElementById("cameraOverlay");
    const video = document.getElementById("cameraVideo");
    if (!overlay || !video) return;

    overlay.classList.remove("is-hidden");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        closeCameraOverlay();
        const fallback = document.getElementById(`${category}CameraInput`);
        if (fallback) fallback.click();
        return;
    }

    try {
        cameraState.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        });
        video.srcObject = cameraState.stream;
        await video.play();
    } catch (error) {
        console.error("Unable to access camera", error);
        closeCameraOverlay();
        const fallback = document.getElementById(`${category}CameraInput`);
        if (fallback) fallback.click();
    }
}

function syncCameraModeUI() {
    const modeRow = document.getElementById("cameraModeRow");
    const scanAdjustments = document.getElementById("scanAdjustments");
    const shouldShowMode = cameraState.category === "mtr";
    if (modeRow) {
        modeRow.classList.toggle("is-hidden", !shouldShowMode);
    }
    if (scanAdjustments) {
        scanAdjustments.classList.toggle("is-hidden", !(shouldShowMode && cameraState.mode === "scan"));
    }
    document.querySelectorAll(".camera-mode-btn").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.mode === cameraState.mode);
    });
}

function setCameraMode(mode) {
    if (cameraState.category !== "mtr") return;
    cameraState.mode = mode === "scan" ? "scan" : "photo";
    syncCameraModeUI();
}

function resetScanAdjustments() {
    cameraState.rotation = 0;
    cameraState.contrast = 1;
    const rotationEl = document.getElementById("scanRotation");
    const contrastEl = document.getElementById("scanContrast");
    if (rotationEl) rotationEl.value = "0";
    if (contrastEl) contrastEl.value = "1";
}

async function captureFromCamera() {
    const category = cameraState.category;
    if (!category) return;

    if (photoState[category].length >= PHOTO_LIMITS[category]) {
        alert(`You can only add up to ${PHOTO_LIMITS[category]} ${category === 'materials' ? 'materials' : 'MTR/CofC'} photos.`);
        return;
    }

    const video = document.getElementById("cameraVideo");
    if (!video || !video.videoWidth) {
        alert("Camera is not ready yet. Please wait a second and try again.");
        return;
    }

    const maxDim = CAMERA_MAX_DIM[category];
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const rotation = cameraState.mode === "scan" ? Number(cameraState.rotation || 0) : 0;
    const contrast = cameraState.mode === "scan" ? Number(cameraState.contrast || 1) : 1;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.filter = `contrast(${contrast})`;
    ctx.drawImage(video, -width / 2, -height / 2, width, height);
    ctx.restore();

    const quality = cameraState.mode === "scan" ? 0.92 : 0.9;
    const dataUrl = canvas.toDataURL("image/jpeg", quality);

    if (category === "mtr" && cameraState.mode === "scan") {
        const pdfDataUrl = await buildScanPdf(dataUrl);
        await addPhotoToState(category, {
            dataUrl,
            kind: "mtr-scan",
            pdfDataUrl,
            rotation,
            contrast
        });
    } else {
        await addPhotoToState(category, {
            dataUrl,
            kind: category === "mtr" ? "mtr-photo" : "photo",
            rotation,
            contrast
        });
    }

    updateCameraCount();
}

async function buildScanPdf(dataUrl) {
    if (!window.jspdf || !window.jspdf.jsPDF) return null;

    const image = await loadImage(dataUrl);
    const { jsPDF } = window.jspdf;
    const orientation = image.width >= image.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "pt", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const scale = Math.min(pageW / image.width, pageH / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    pdf.addImage(dataUrl, "JPEG", x, y, w, h);
    return pdf.output("datauristring");
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function closeCameraOverlay() {
    const overlay = document.getElementById("cameraOverlay");
    if (overlay) {
        overlay.classList.add("is-hidden");
    }
    cameraState.category = null;
    stopCameraStream();
}

function stopCameraStream() {
    if (cameraState.stream) {
        cameraState.stream.getTracks().forEach((track) => track.stop());
        cameraState.stream = null;
    }
    const video = document.getElementById("cameraVideo");
    if (video) {
        video.srcObject = null;
    }
}

function togglePhotoPreview(category) {
    const preview = document.getElementById(`${category}PhotoPreview`);
    const button = document.getElementById(`${category}ViewBtn`);
    if (!preview || !button) return;
    preview.classList.toggle("is-hidden");
    button.textContent = preview.classList.contains("is-hidden")
        ? "View/Edit Photos"
        : "Hide Photos";
}

function openPhotoModal(dataUrl) {
    const modal = document.getElementById("photoModal");
    const image = document.getElementById("photoModalImage");
    if (!modal || !image) return;
    image.src = dataUrl;
    modal.classList.remove("is-hidden");
}

function closePhotoModal() {
    const modal = document.getElementById("photoModal");
    const image = document.getElementById("photoModalImage");
    if (!modal || !image) return;
    modal.classList.add("is-hidden");
    image.src = "";
}

function setupLineLimit(id, maxLines) {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener("input", () => {
        const lines = field.value.split("\n");
        if (lines.length > maxLines) {
            field.value = lines.slice(0, maxLines).join("\n");
        }
    });
}

function setupDimensionUnits() {
    const imperial = document.getElementById("dimensionsImperial");
    const metric = document.getElementById("dimensionsMetric");
    if (!imperial || !metric) return;

    const handleChange = (event) => {
        if (event.target === imperial && imperial.checked) {
            metric.checked = false;
        } else if (event.target === metric && metric.checked) {
            imperial.checked = false;
        } else if (!imperial.checked && !metric.checked) {
            event.target.checked = true;
        }
    };

    imperial.addEventListener("change", handleChange);
    metric.addEventListener("change", handleChange);
}

function setDirty() {
    isDirty = true;
}

function setupUnsavedWarning() {
    const form = document.getElementById("reportForm");
    if (!form) return;

    form.addEventListener("input", setDirty);
    form.addEventListener("change", setDirty);

    window.addEventListener("beforeunload", (event) => {
        if (!isDirty || suppressUnsavedWarning) return;
        event.preventDefault();
        event.returnValue = "";
    });

    window.history.pushState({ receivingGuard: true }, "");
    window.addEventListener("popstate", () => {
        if (!isDirty || suppressUnsavedWarning) {
            return;
        }

        const leave = confirm("You have unsaved changes. Leave this report without saving?");
        if (leave) {
            suppressUnsavedWarning = true;
            history.back();
        } else {
            window.history.pushState({ receivingGuard: true }, "");
        }
    });
}
