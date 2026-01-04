
let materialId;
let jobNumber;
const PHOTO_LIMITS = {
    materials: 4,
    mtr: 8
};
const PHOTO_LABEL_LIMIT = 12;
const photoState = {
    materials: [],
    mtr: []
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

    setupLineLimit("itemDisplayName", 5);
    setupLineLimit("actualMaterialMarking", 5);
    setupDimensionUnits();
    handleFittingChange();
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
    materialPhotos.forEach((photo) => {
        const category = photo.category || "materials";
        if (!photoState[category]) return;
        photoState[category].push({ dataUrl: photo.imageData });
    });
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

    const files = event.target.files;
    if (!files.length) return;

    for (const file of files) {
        if (photoState[category].length >= PHOTO_LIMITS[category]) {
            alert(`You can only add up to ${PHOTO_LIMITS[category]} ${category === 'materials' ? 'materials' : 'MTR/CofC'} photos.`);
            break;
        }

        let dataUrl;
        if (category === 'materials') {
            // High-quality resizing for materials photos to ensure markings are readable
            dataUrl = await resizeAndCompressImage(file, 1920, 1920, 0.9);
        } else {
            // For MTRs, we will use the original image data for now to prepare for scanning
            dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        photoState[category].push({ dataUrl });
    }

    event.target.value = ''; // Clear the input
    renderPhotoPreview(category);
}

function renderPhotoPreview(category) {
    const previewContainer = document.getElementById(`${category}PhotoPreview`);
    if (!previewContainer) return;
    previewContainer.innerHTML = "";
    photoState[category].forEach((photo, index) => {
        const imgContainer = document.createElement("div");
        imgContainer.className = "photo-preview-item";
        const img = document.createElement("img");
        img.src = photo.dataUrl;
        img.alt = `${category} photo ${index + 1}`;
        img.onclick = () => openPhotoModal(photo.dataUrl);
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.className = "delete-photo-btn";
        deleteBtn.onclick = () => {
            photoState[category].splice(index, 1);
            renderPhotoPreview(category);
        };
        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        previewContainer.appendChild(imgContainer);
    });
    updatePhotoCount(category);
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
            await db.photos.add({
                materialId: id,
                jobNumber: jobNumber,
                imageData: bucket[index].dataUrl,
                status: "local",
                category,
                label,
                sequence: index + 1,
                createdAt: new Date().toISOString()
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
