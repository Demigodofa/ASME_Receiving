let materialId;
let jobNumber;
let photos = [];

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    materialId = params.get("id");

    if (!materialId) {
        alert("Error: No material ID provided.");
        history.back();
        return;
    }

    // Load material
    const material = await db.materials.get(Number(materialId));
    if (!material) {
        alert("Material not found.");
        history.back();
        return;
    }

    jobNumber = material.jobNumber;

    // Prefill fields
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

    // Load photos
    photos = Array.isArray(material.photos) ? [...material.photos] : [];
    renderPhotos();

    document.getElementById("photoInput").onchange = handlePhoto;
    document.getElementById("saveMaterialBtn").onclick = saveChanges;
};

function handlePhoto(e) {
    if (photos.length >= 5) {
        alert("Maximum of 5 photos allowed.");
        return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        photos.push(ev.target.result);
        renderPhotos();
    };
    reader.readAsDataURL(file);
}

function renderPhotos() {
    const div = document.getElementById("photoPreview");
    div.innerHTML = "";

    photos.forEach((img, index) => {
        const el = document.createElement("div");
        el.className = "thumb-container";

        el.innerHTML = `
            <img src="${img}" class="thumb">
            <button class="thumb-delete" onclick="deletePhoto(${index})">×</button>
        `;

        div.appendChild(el);
    });
}

function deletePhoto(idx) {
    photos.splice(idx, 1);
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
        photos
    };

    await db.materials.put(updated);

    // Back to job page
    const base = window.location.origin;
    window.location.href = `${base}/job.html?job=${jobNumber}`;
}
