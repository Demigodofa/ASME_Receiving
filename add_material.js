/* ADD MATERIAL — FULL LOGIC WITH PHOTOS */
/* ---------------------------------------------------------------------- */
/* Loads job, handles edit mode, soft warnings, Dexie save, photo capture */
/* Fullscreen preview with Retake / Keep / Next, 1/5 counter, thumbnails  */
/* ---------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {

    /* ---------------------------
       Dexie Database Connection
    ---------------------------- */
    const db = new Dexie("welders_helper_db");
    db.version(1).stores({
        jobs: "++id, jobNumber, description",
        materials: "++id, jobNumber, description, photos"
    });

    /* ---------------------------
       Get URL Parameters
    ---------------------------- */
    const params = new URLSearchParams(window.location.search);
    const jobNumber = params.get("job");
    const materialId = params.get("material"); // used for edit mode

    if (jobNumber) {
        document.getElementById("jobNumber").value = jobNumber;
    }

    /* ---------------------------
       Auto-populate Date Fields
    ---------------------------- */
    const today = new Date().toISOString().split("T")[0];
    const dateField = document.getElementById("date");
    const qcDateField = document.getElementById("qcDate");

    if (!dateField.value) dateField.value = today;
    if (!qcDateField.value) qcDateField.value = today;

    /* ---------------------------
       Photo State
    ---------------------------- */
    let photos = []; // array of { blob, timestamp }
    const photoButton = document.getElementById("photoButton");
    const photoPreviewContainer = document.getElementById("photoPreview");

    /* ---------------------------
       Edit Mode: Load Existing Material
    ---------------------------- */
    if (materialId) {
        const mat = await db.materials.get(Number(materialId));
        if (mat) {
            // Load all primitive fields
            for (const key in mat) {
                if (key === "photos") continue;
                const el = document.getElementById(key);
                if (el) el.value = mat[key];
            }

            // Load photos
            if (mat.photos && Array.isArray(mat.photos)) {
                photos = mat.photos;
                renderThumbnails();
                updatePhotoButtonState();
            }
        }
    }

    /* ---------------------------
       Format SA/A → SA-xxx
    ---------------------------- */
    function formatSpec(specPrefix, code) {
        if (!specPrefix) return code;
        if (!code) return "";
        return `${specPrefix}-${code}`;
    }

    /* ---------------------------
       Soft Warning Banner
    ---------------------------- */
    function showSoftWarnings(fields) {
        const banner = document.createElement("div");
        banner.style.background = "#ffdf6f";
        banner.style.padding = "12px";
        banner.style.margin = "10px";
        banner.style.borderRadius = "8px";
        banner.style.fontWeight = "600";
        banner.style.color = "#000";
        banner.style.textAlign = "center";
        banner.style.transition = "opacity 1s ease";

        banner.innerText = `⚠ Suggested review: ${fields.join(", ")}`;

        document.body.prepend(banner);

        setTimeout(() => {
            banner.style.opacity = "0";
            setTimeout(() => banner.remove(), 1000);
        }, 2500);
    }

    /* ---------------------------
       CAMERA INPUT (Native camera only)
    ---------------------------- */
    function openCamera() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";

        input.onchange = (evt) => {
            const file = evt.target.files[0];
            if (file) {
                const blob = file;
                showPhotoPreview(blob);
            }
        };

        input.click();
    }

    /* ---------------------------
       Fullscreen Photo Preview UI
    ---------------------------- */
    function showPhotoPreview(blob) {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "#000";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "99999";
        overlay.style.padding = "10px";

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.style.maxWidth = "100%";
        img.style.maxHeight = "80%";
        img.style.borderRadius = "8px";

        const btnRow = document.createElement("div");
        btnRow.style.display = "flex";
        btnRow.style.gap = "15px";
        btnRow.style.marginTop = "20px";

        const retake = document.createElement("button");
        retake.textContent = "Retake";
        retake.className = "primary-btn";
        retake.onclick = () => {
            overlay.remove();
            openCamera();
        };

        const keep = document.createElement("button");
        keep.textContent = "Keep";
        keep.className = "primary-btn";
        keep.onclick = () => {
            savePhoto(blob);
            overlay.remove();
        };

        const next = document.createElement("button");
        next.textContent = "Next →";
        next.className = "primary-btn";
        next.onclick = () => {
            savePhoto(blob);
            overlay.remove();
            if (photos.length < 5) {
                openCamera();
            }
        };

        btnRow.appendChild(retake);
        btnRow.appendChild(keep);
        if (photos.length < 4) btnRow.appendChild(next);

        const counter = document.createElement("div");
        counter.style.color = "#fff";
        counter.style.fontSize = "20px";
        counter.style.marginTop = "10px";
        counter.textContent = `Photo ${photos.length + 1}/5`;

        overlay.appendChild(img);
        overlay.appendChild(btnRow);
        overlay.appendChild(counter);
        document.body.appendChild(overlay);
    }

    /* ---------------------------
       Save Photo
    ---------------------------- */
    function savePhoto(blob) {
        if (photos.length >= 5) return;

        photos.push({
            blob: blob,
            timestamp: Date.now()
        });

        renderThumbnails();
        updatePhotoButtonState();
    }

    /* ---------------------------
       Thumbnail Renderer
    ---------------------------- */
    function renderThumbnails() {
        photoPreviewContainer.innerHTML = "";

        photos.forEach((item, idx) => {
            const wrap = document.createElement("div");
            wrap.style.position = "relative";
            wrap.style.display = "inline-block";
            wrap.style.margin = "5px";

            const img = document.createElement("img");
            img.src = URL.createObjectURL(item.blob);
            img.style.width = "80px";
            img.style.height = "80px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "6px";
            img.style.border = "2px solid #ccc";

            const del = document.createElement("div");
            del.textContent = "✕";
            del.style.position = "absolute";
            del.style.top = "-6px";
            del.style.right = "-6px";
            del.style.background = "red";
            del.style.color = "white";
            del.style.width = "20px";
            del.style.height = "20px";
            del.style.borderRadius = "50%";
            del.style.display = "flex";
            del.style.alignItems = "center";
            del.style.justifyContent = "center";
            del.style.cursor = "pointer";

            del.onclick = () => {
                if (confirm("Delete this photo?")) {
                    photos.splice(idx, 1);
                    renderThumbnails();
                    updatePhotoButtonState();
                }
            };

            wrap.appendChild(img);
            wrap.appendChild(del);
            photoPreviewContainer.appendChild(wrap);
        });
    }

    /* ---------------------------
       Disable/Enable Photo Button
    ---------------------------- */
    function updatePhotoButtonState() {
        if (photos.length >= 5) {
            photoButton.disabled = true;
            photoButton.textContent = "Maximum Photos Reached (5/5)";
        } else {
            photoButton.disabled = false;
            photoButton.textContent = "Take up to 5 Photos";
        }
    }

    /* ---------------------------
       Hook Camera Button
    ---------------------------- */
    photoButton.addEventListener("click", () => {
        if (photos.length < 5) openCamera();
    });

    /* ---------------------------
       SAVE MATERIAL BUTTON
    ---------------------------- */
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Material";
    saveButton.className = "primary-btn";
    saveButton.style.width = "90%";
    saveButton.style.margin = "20px auto";
    saveButton.style.display = "block";
    document.body.appendChild(saveButton);

    saveButton.addEventListener("click", async () => {

        const material = {
            jobNumber: document.getElementById("jobNumber").value.trim(),
            description: document.getElementById("description").value.trim(),
            vendor: document.getElementById("vendor").value.trim(),
            poNumber: document.getElementById("poNumber").value.trim(),
            date: document.getElementById("date").value,

            quantity: document.getElementById("quantity").value.trim(),
            product: document.getElementById("product").value,
            specPrefix: document.getElementById("specPrefix").value,
            specCode: document.getElementById("specCode").value.trim(),
            gradeType: document.getElementById("gradeType").value.trim(),
            b16: document.getElementById("b16").value,

            th1: document.getElementById("th1").value.trim(),
            th2: document.getElementById("th2").value.trim(),
            th3: document.getElementById("th3").value.trim(),
            th4: document.getElementById("th4").value.trim(),

            width: document.getElementById("width").value.trim(),
            length: document.getElementById("length").value.trim(),
            diameter: document.getElementById("diameter").value.trim(),
            other: document.getElementById("other").value.trim(),

            visual: document.getElementById("visual").checked,
            b16dim: "",

            markingAcceptable: document.getElementById("markingAcceptable").value,
            mtrAcceptable: document.getElementById("mtrAcceptable").value,

            actualMarking: document.getElementById("actualMarking").value.trim(),
            status: document.getElementById("status").value,
            comments: document.getElementById("comments").value.trim(),

            qcInitials: document.getElementById("qcInitials").value.trim(),
            qcDate: document.getElementById("qcDate").value,

            photos: photos
        };

        material.specFormatted = formatSpec(material.specPrefix, material.specCode);

        /* Build soft warnings */
        const softWarnings = [];
        if (!material.description) softWarnings.push("Description");
        if (!material.quantity) softWarnings.push("Quantity");
        if (!material.status) softWarnings.push("Status");
        if (!material.qcInitials) softWarnings.push("QC Initials");

        if (softWarnings.length > 0) {
            showSoftWarnings(softWarnings);
        }

        /* Save */
        if (materialId) {
            material.id = Number(materialId);
            await db.materials.put(material);
        } else {
            await db.materials.add(material);
        }

        /* Redirect */
        window.location.href = `job.html?job=${material.jobNumber}`;
    });

});
