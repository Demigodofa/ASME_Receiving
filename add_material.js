// add_material.js — FINAL VERSION
// Full 5-photo system + unified DB write

let jobNumber = null;
let photos = [];

// ------------------------------------------------------------
// Initialization
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    jobNumber = params.get("job");

    if (!jobNumber) {
        alert("Missing job number.");
        window.location.href = "jobs.html";
        return;
    }

    document.getElementById("photoInput").addEventListener("change", handlePhoto);
    document.getElementById("saveMaterialBtn").addEventListener("click", saveMaterial);
});

// ------------------------------------------------------------
// Handle Photo Upload (Camera)
// ------------------------------------------------------------
async function handlePhoto(event) {
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

// ------------------------------------------------------------
// Resize + Convert to Base64 (Performance & storage safe)
// ------------------------------------------------------------
function resizeAndConvert(file) {
    return new Promise(resolve => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = e => {
            img.onload = () => {
                // Resize to max 1280px per side
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
// Photo Preview Grid
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
// Save Material to Unified DB
// ------------------------------------------------------------
async function saveMaterial() {

    const material = {
        jobNumber,
        description: document.getElementById("description").value.trim(),
        vendor: document.getElementById("vendor").value.trim(),
        poNumber: document.getElementById("poNumber").value.trim(),
        date: document.getElementById("date").value,
        quantity: document.getElementById("quantity").value,
        product: document.getElementById("product").value.trim(),
        specPrefix: document.getElementById("specPrefix").value.trim(),
        specCode: document.getElementById("specCode").value.trim(),
        grade: document.getElementById("grade").value.trim(),
        b16dim: document.getElementById("b16dim").value.trim(),
        th1: document.getElementById("th1").value.trim(),
        th2: document.getElementById("th2").value.trim(),
        th3: document.getElementById("th3").value.trim(),
        th4: document.getElementById("th4").value.trim(),
        other: document.getElementById("other").value.trim(),
        visual: document.getElementById("visual").value,
        markingAcceptable: document.getElementById("markingAcceptable").value,
        mtrAcceptable: document.getElementById("mtrAcceptable").value,
        actualMarking: document.getElementById("actualMarking").value.trim(),
        comments: document.getElementById("comments").value.trim(),
        qcInitials: document.getElementById("qcInitials").value.trim(),
        qcDate: document.getElementById("qcDate").value,
        photos
    };

    await db.materials.add(material);

    window.location.href = `job.html?job=${jobNumber}`;
}
