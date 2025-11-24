let jobNumber;
let photos = [];

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    jobNumber = params.get("job");

    document.getElementById("photoInput").onchange = handlePhoto;
    document.getElementById("saveMaterialBtn").onclick = saveMaterial;
};

function handlePhoto(e) {
    if (photos.length >= 5) {
        alert("Maximum 5 photos.");
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
        photos
    };

    await db.materials.add(m);

    window.location.href = `job.html?job=${jobNumber}`;
}
