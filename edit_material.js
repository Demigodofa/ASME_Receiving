// ===============================================
//   DB SETUP
// ===============================================
const db = new Dexie("ASMEReceivingDB");
db.version(1).stores({
    jobs: "jobNumber, description, notes, createdAt",
    materials: "++id, jobNumber, description, vendor, poNumber, date, quantity, product, specPrefix, specCode, grade, b16dim, th1, th2, th3, th4, other, visual, markingAcceptable, mtrAcceptable, actualMarking, comments, qcInitials, qcDate, photos"
});

// ===============================================
//   GET MATERIAL ID
// ===============================================
const params = new URLSearchParams(window.location.search);
const materialId = parseInt(params.get("id"));
let currentPhotos = [];

document.addEventListener("DOMContentLoaded", loadMaterial);


// ===============================================
//   LOAD MATERIAL
// ===============================================
async function loadMaterial() {
    const m = await db.materials.get(materialId);

    if (!m) return alert("Material not found.");

    document.getElementById("materialId").value = m.id;

    description.value = m.description;
    vendor.value = m.vendor;
    poNumber.value = m.poNumber;
    date.value = m.date;
    quantity.value = m.quantity;

    product.value = m.product;
    specPrefix.value = m.specPrefix;
    specCode.value = m.specCode;
    grade.value = m.grade;
    b16dim.value = m.b16dim;

    th1.value = m.th1;
    th2.value = m.th2;
    th3.value = m.th3;
    th4.value = m.th4;
    other.value = m.other;

    visual.value = m.visual;
    markingAcceptable.value = m.markingAcceptable;
    mtrAcceptable.value = m.mtrAcceptable;

    actualMarking.value = m.actualMarking;
    comments.value = m.comments;

    qcInitials.value = m.qcInitials;
    qcDate.value = m.qcDate;

    currentPhotos = Array.isArray(m.photos) ? [...m.photos] : [];
    renderPhotos();
}


// ===============================================
//   PHOTO HANDLING
// ===============================================
let editFileInput = document.createElement("input");
editFileInput.type = "file";
editFileInput.accept = "image/*";
editFileInput.capture = "environment";
editFileInput.style.display = "none";
document.body.appendChild(editFileInput);

document.getElementById("takePhotos").onclick = () => {
    if (currentPhotos.length >= 5) {
        alert("Max photos reached.");
        return;
    }
    editFileInput.click();
};

editFileInput.addEventListener("change", () => {
    const file = editFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        currentPhotos.push(e.target.result);
        renderPhotos();
    };
    reader.readAsDataURL(file);
});

function renderPhotos() {
    const area = document.getElementById("photoPreview");
    area.innerHTML = "";

    currentPhotos.forEach((src, idx) => {
        const wrap = document.createElement("div");
        wrap.style.position = "relative";

        const img = document.createElement("img");
        img.src = src;
        img.className = "photo-thumb";

        const del = document.createElement("div");
        del.className = "photo-delete";
        del.textContent = "×";
        del.onclick = () => {
            currentPhotos.splice(idx, 1);
            renderPhotos();
        };

        wrap.appendChild(img);
        wrap.appendChild(del);
        area.appendChild(wrap);
    });
}


// ===============================================
//   SAVE CHANGES
// ===============================================
document.getElementById("saveChanges").onclick = async () => {

    await db.materials.update(materialId, {
        description: description.value,
        vendor: vendor.value,
        poNumber: poNumber.value,
        date: date.value,
        quantity: quantity.value,

        product: product.value,
        specPrefix: specPrefix.value,
        specCode: specCode.value,
        grade: grade.value,
        b16dim: b16dim.value,

        th1: th1.value,
        th2: th2.value,
        th3: th3.value,
        th4: th4.value,
        other: other.value,

        visual: visual.value,
        markingAcceptable: markingAcceptable.value,
        mtrAcceptable: mtrAcceptable.value,

        actualMarking: actualMarking.value,
        comments: comments.value,

        qcInitials: qcInitials.value,
        qcDate: qcDate.value,

        photos: currentPhotos
    });

    const m = await db.materials.get(materialId);
    window.location.replace(`job.html?job=${m.jobNumber}`);
};
