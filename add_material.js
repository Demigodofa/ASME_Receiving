// ===============================
//   GET JOB NUMBER FROM URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const jobNumber = urlParams.get("job");

// Auto-fill job number
document.getElementById("jobNumber").value = jobNumber || "";


// ===============================
//     DEXIE DATABASE SETUP
// ===============================
const db = new Dexie("WeldersHelperDB");
db.version(1).stores({
    jobs: "jobNumber, description",
    materials: "++id, jobNumber"
});


// ===============================================
//   CREATE HIDDEN CAMERA INPUT (NATIVE CAMERA)
// ===============================================
const cameraInput = document.createElement("input");
cameraInput.type = "file";
cameraInput.accept = "image/*";
cameraInput.capture = "environment";
cameraInput.style.display = "none";
document.body.appendChild(cameraInput);


// ===============================================
//   PHOTO STORAGE ARRAY + THUMBNAIL RENDERING
// ===============================================
let photos = [];

function renderThumbnails() {
    const container = document.getElementById("photoPreview");
    if (!container) return;

    container.innerHTML = "";

    photos.forEach((dataUrl, index) => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";
        wrapper.style.margin = "6px";

        const img = document.createElement("img");
        img.src = dataUrl;
        img.style.width = "80px";
        img.style.height = "80px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "6px";
        wrapper.appendChild(img);

        // Delete “X”
        const del = document.createElement("div");
        del.textContent = "×";
        del.style.position = "absolute";
        del.style.top = "-6px";
        del.style.right = "-6px";
        del.style.background = "red";
        del.style.color = "white";
        del.style.borderRadius = "50%";
        del.style.width = "20px";
        del.style.height = "20px";
        del.style.display = "flex";
        del.style.justifyContent = "center";
        del.style.alignItems = "center";
        del.style.cursor = "pointer";

        del.onclick = () => {
            photos.splice(index, 1);
            renderThumbnails();
        };

        wrapper.appendChild(del);
        container.appendChild(wrapper);
    });
}


// ===============================================
//     TAKE PHOTOS BUTTON HANDLER
// ===============================================
const takePhotosBtn = document.getElementById("takePhotos");

if (takePhotosBtn) {
    takePhotosBtn.addEventListener("click", () => {
        if (photos.length >= 5) {
            alert("You already have 5 photos. Delete one to add more.");
            return;
        }
        cameraInput.click();
    });
}


// ===============================================
//     WHEN CAMERA RETURNS A NEW FILE
// ===============================================
cameraInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        photos.push(e.target.result);
        renderThumbnails();
    };
    reader.readAsDataURL(file);
});


// ===============================================
//          SAVE MATERIAL HANDLER
// ===============================================
const saveBtn = document.getElementById("saveMaterial");

saveBtn.addEventListener("click", async () => {

    const material = {
        jobNumber: document.getElementById("jobNumber").value || "",
        description: document.getElementById("description").value || "",
        vendor: document.getElementById("vendor").value || "",
        poNumber: document.getElementById("poNumber").value || "",
        date: document.getElementById("date").value || "",
        quantity: document.getElementById("quantity").value || "",
        product: document.getElementById("product").value || "",
        specPrefix: document.getElementById("specPrefix").value || "",
        specCode: document.getElementById("specCode").value || "",
        gradeType: document.getElementById("gradeType").value || "",
        b16: document.getElementById("b16").value || "",
        th1: document.getElementById("th1").value || "",
        th2: document.getElementById("th2").value || "",
        th3: document.getElementById("th3").value || "",
        th4: document.getElementById("th4").value || "",
        width: document.getElementById("width").value || "",
        length: document.getElementById("length").value || "",
        diameter: document.getElementById("diameter").value || "",
        other: document.getElementById("other").value || "",
        
        // INSPECTION DROPDOWNS
        visual: document.getElementById("visual").value || "",
        b16dim: document.getElementById("b16dim").value || "",
        markingAcceptable: document.getElementById("markingAcceptable").value || "",
        mtrAcceptable: document.getElementById("mtrAcceptable").value || "",

        actualMarking: document.getElementById("actualMarking").value || "",
        comments: document.getElementById("comments").value || "",
        status: document.getElementById("status").value || "",
        qcInitials: document.getElementById("qcInitials").value || "",
        qcDate: document.getElementById("qcDate").value || "",
        photos: photos
    };

    await db.materials.add(material);

    alert("Material Saved.");

    // FIX: Use replace() so BACK button doesn't bounce through the edit/add page again
    window.location.replace(`job.html?job=${jobNumber}`);
});
