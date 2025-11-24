// edit_material.js — FINAL VERSION
// Loads material → allows editing → updates unified DB

let materialId = null;
let jobNumber = null;
let photos = [];

// ------------------------------------------------------------
// Initialization
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    materialId = Number(params.get("id"));

    if (!materialId) {
        alert("Missing material ID.");
        window.location.href = "jobs.html";
        return;
    }

    await loadMaterial();

    document.getElementById("photoInput").addEventListener("change", handlePhotoAdd);
    document.getElementById("saveMaterialBtn").addEventListener("click", saveMaterial);
});

// ------------------------------------------------------------
// Load Material Into Form
// ------------------------------------------------------------
async function loadMaterial() {
    const mat = await db.materials.get(materialId);

    if (!mat) {
        alert("Material not found.");
        window.location.href = "jobs.html";
        return;
    }

    jobNumber = mat.jobNumber;

    // Fill fields
    setVal("description", mat.description);
    setVal("vendor", mat.vendor);
    setVal("poNumber", mat.poNumber);
    setVal("date", mat.date);
    setVal("quantity", mat.quantity);
    setVal("product", mat.product);
    setVal("specPrefix", mat.specPrefix);
    setVal("specCode", mat.specCode);
    setVal("grade", mat.grade);
    setVal("b16dim", mat.b16dim);
    setVal("th1", mat.th1);
    setVal("th2", mat.th2);
    setVal("th3", mat.th3);
    setVal("th4", mat.th4);
    setVal("other", mat.other);
    setVal("visual", mat.visual);
    setVal("markingAcceptable", mat.markingAcceptable);
    setVal("mtrAcceptable", mat.mtrAcceptable);
    setVal("actualMarking", mat.actualMarking);
    setVal("comments", mat.comments);
    setVal("qcInitials", mat.qcInitials);
    setVal("qcDate", mat.qcDate);

    // Load photos
    photos = Array.isArray(mat.photos) ? mat.photos : [];
    refreshPhotoPreview();
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
}

// ------------------------------------------------------------
// Add New Photo
// ------------------------------------------------------------
async function handlePhotoAdd(event) {
    if (photos.length >= 5) {
        alert("Maximum of 5 photos allowed.");
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const base64 = await resizeAndConvert(file);
    photos.push(base64);
    refreshPhotoPreview();
}

// (Same resize method used in add_material.js)
function resizeAndConvert(file) {
    return new Promise(resolve => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = e => {
            img.onload = () => {
                const maxSize = 1280;
                let width = img.width;
                let height = img.height;

                if (width > height && width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });
}

// ------------------------------------------------------------
// Refresh Photo Preview Grid
// ------------------------------------------------------------
function refreshPhotoPreview() {
    const container = document.getElementById("photoPreview");
    container.innerHTML = "";

    photos.forEach((src, index) => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";

        const img = document.createElement("img");
        img.src = src;
        img.className = "photo-thumb";

        const del = document.createElement("div");
        del.className = "photo-delete";
        del.textContent = "×";
        del.onclick = () => {
            photos.splice(index, 1);
            refreshPhotoPreview();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(del);
        container.appendChild(wrapper);
    });
}

// ------------------------------------------------------------
// Save Changes Back to DB
// ------------------------------------------------------------
async function saveMaterial() {

    const updated = {
        description: val("description"),
        vendor: val("vendor"),
        poNumber: val("poNumber"),
        date: val("date"),
        quantity: val("quantity"),
        product: val("product"),
        specPrefix: val("specPrefix"),
        specCode: val("specCode"),
        grade: val("grade"),
        b16dim: val("b16dim"),
        th1: val("th1"),
        th2: val("th2"),
        th3: val("th3"),
        th4: val("th4"),
        other: val("other"),
        visual: val("visual"),
        markingAcceptable: val("markingAcceptable"),
        mtrAcceptable: val("mtrAcceptable"),
        actualMarking: val("actualMarking"),
        comments: val("comments"),
        qcInitials: val("qcInitials"),
        qcDate: val("qcDate"),
        photos
    };

    await db.materials.update(materialId, updated);

    window.location.href = `job.html?job=${jobNumber}`;
}

function val(id) {
    return document.getElementById(id).value.trim();
}
