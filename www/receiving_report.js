let materialId;
let jobNumber;
let photos = [];

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
    document.getElementById("photoInput").onchange = handlePhotoInput;
    document.getElementById("fittingType").onchange = handleFittingChange;
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
    photos = materialPhotos.map(p => p.imageData);
    renderPhotoPreview();
    handleFittingChange(); // To set initial state of B16 select
}

function handleFittingChange() {
    const fittingType = document.getElementById("fittingType").value;
    const b16DimSelect = document.getElementById("b16DimensionsAcceptable");
    if (fittingType !== "B16.") {
        b16DimSelect.value = "N/A";
        b16DimSelect.disabled = true;
    } else {
        b16DimSelect.disabled = false;
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
            await updatePhotos(id);
            alert("Report updated successfully!");
        } else {
            // Create new material
            const newId = await db.materials.add(reportData);
            await updatePhotos(newId);
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
    const files = event.target.files;
    if (!files.length) return;

    for (const file of files) {
        if (photos.length >= 5) {
            alert("You can only add up to 5 photos.");
            break;
        }
        const dataUrl = await resizeAndCompressImage(file, 800, 600, 0.7);
        photos.push(dataUrl);
    }
    renderPhotoPreview();
}

function renderPhotoPreview() {
    const previewContainer = document.getElementById("photoPreview");
    previewContainer.innerHTML = "";
    photos.forEach((photo, index) => {
        const imgContainer = document.createElement("div");
        imgContainer.className = "photo-preview-item";
        const img = document.createElement("img");
        img.src = photo;
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.className = "delete-photo-btn";
        deleteBtn.onclick = () => {
            photos.splice(index, 1);
            renderPhotoPreview();
        };
        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        previewContainer.appendChild(imgContainer);
    });
}

async function updatePhotos(materialId) {
  const id = Number(materialId);
  // First, remove all existing photos for this material from DB
  await db.photos.where('materialId').equals(id).delete();

  // Then, add the current photos from the `photos` array
  for (const photoDataUrl of photos) {
    await db.photos.add({
      materialId: id,
      jobNumber: jobNumber,
      imageData: photoDataUrl,
      status: 'local',
      createdAt: new Date().toISOString()
    });
  }
}
