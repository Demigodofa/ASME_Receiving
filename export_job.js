// ============================================================================
//  export_job.js — ZIP + PDF Export (materials + MTR scans)
// ============================================================================

async function exportJobData(jobNumber) {
    if (!jobNumber) {
        alert("Error: No job number provided for export.");
        return;
    }

    if (typeof JSZip === "undefined" || !window.jspdf || !window.jspdf.jsPDF) {
        alert("Export libraries are missing. Please check your connection and try again.");
        return;
    }

    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();
    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();

    if (!job) {
        alert("Error: Job not found.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const zip = new JSZip();
    const rootFolder = zip.folder(`Job_${jobNumber}`);
    const materialsFolder = rootFolder.folder("Materials");
    const photosFolder = rootFolder.folder("Photos");

    let summary = new jsPDF({ unit: "pt", format: "letter" });

    let y = 50;
    summary.setFont("Helvetica", "bold");
    summary.setFontSize(18);
    summary.text("Receiving Inspection Report", 50, y);
    y += 28;

    summary.setFontSize(14);
    summary.text(`Job Number: ${job.jobNumber}`, 50, y);
    y += 22;

    summary.setFont("Helvetica", "normal");
    if (job.description) {
        summary.text(`Description: ${job.description}`, 50, y);
        y += 20;
    }
    if (job.notes) {
        summary.text(`Notes: ${job.notes}`, 50, y);
        y += 20;
    }

    y += 10;
    summary.setFont("Helvetica", "bold");
    summary.text("Materials Included:", 50, y);
    y += 18;

    summary.setFont("Helvetica", "normal");
    if (materials.length === 0) {
        summary.text("No materials have been added.", 50, y);
    } else {
        materials.forEach((m, i) => {
            const label = m.itemDisplayName || m.description || "(No description)";
            summary.text(`${i + 1}. ${label}`, 50, y);
            y += 16;
        });
    }

    rootFolder.file(
        "Job_Summary.pdf",
        summary.output("blob")
    );

    for (let i = 0; i < materials.length; i++) {
        const m = materials[i];
        const pdf = new jsPDF({ unit: "pt", format: "letter" });

        let y2 = 50;

        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text(`Material Report`, 50, y2);
        y2 += 26;

        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(12);

        const write = (label, value) => {
            if (value !== undefined && value !== null && value !== "") {
                pdf.text(`${label}: ${value}`, 50, y2);
                y2 += 16;
            }
        };

        write("Item", m.itemDisplayName || m.description);
        write("Vendor", m.vendor);
        write("PO Number", m.poNumber);
        write("Date Received", m.date);
        write("Quantity", m.quantity);
        write("Product", m.product);
        write("Specification", formatSpec(m));
        write("Grade/Type/Alloy", m.gradeTypeAlloy || m.grade);
        write("Fitting Type", m.fittingType);
        write("Fitting Spec", m.fittingSpec);

        pdf.text("Dimensions:", 50, y2);
        y2 += 16;
        write("T1", m.th1);
        write("T2", m.th2);
        write("T3", m.th3);
        write("T4", m.th4);
        write("Width", m.width);
        write("Length", m.length);
        write("Diameter", m.diameter);
        write("Other", m.otherDim);

        y2 += 8;

        write("Visual Inspection", m.visualInspectionAcceptable || m.visual);
        write("B16 Dimensions", m.b16DimensionsAcceptable || m.b16dim);
        write("MTR/CofC Acceptable", m.mtrCofCAcceptable || m.mtrAcceptable);
        write("Actual Marking", m.actualMaterialMarking || m.actualMarking);
        write("Comments", m.comments);

        y2 += 20;

        pdf.setFont("Helvetica", "bold");
        pdf.text("QC Verification", 50, y2);
        y2 += 18;

        pdf.setFont("Helvetica", "normal");
        write("QC Initials", m.qcInitials);
        write("QC Date", m.qcDate);
        write("QC Manager", m.qcManagerInitials);
        write("QC Manager Date", m.qcManagerDate);

        const materialPhotos = await db.photos.where("materialId").equals(m.id).toArray();
        const materialImages = materialPhotos.filter((photo) => !photo.category || photo.category === "materials");
        const mtrImages = materialPhotos.filter((photo) => photo.category === "mtr");

        const materialDataUrls = (await Promise.all(materialImages.map(resolvePhotoDataUrl))).filter(Boolean);
        const mtrDataUrls = (await Promise.all(mtrImages.map(resolvePhotoDataUrl))).filter(Boolean);

        if (materialDataUrls.length > 0) {
            y2 += 20;
            pdf.setFont("Helvetica", "bold");
            pdf.text("Photos:", 50, y2);
            y2 += 16;

            let x = 50;
            materialDataUrls.slice(0, 5).forEach((img, pIndex) => {
                try {
                    pdf.addImage(img, "JPEG", x, y2, 150, 120);
                } catch (e) {
                    console.error("Photo skipped:", e);
                }

                addPhotoToZip(photosFolder, `material${i + 1}_photo${pIndex + 1}`, img);

                x += 160;
                if (x > 450) {
                    x = 50;
                    y2 += 130;
                }
            });
        }

        if (mtrDataUrls.length > 0) {
            const mtrPdf = await buildPdfFromImages(mtrDataUrls, jsPDF);
            materialsFolder.file(
                `Material_${i + 1}_MTR.pdf`,
                mtrPdf.output("blob")
            );
            mtrDataUrls.forEach((img, pIndex) => {
                addPhotoToZip(photosFolder, `material${i + 1}_mtr${pIndex + 1}`, img);
            });
        }

        materialsFolder.file(
            `Material_${i + 1}.pdf`,
            pdf.output("blob")
        );
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFileName = `Job_${jobNumber}.zip`;

    const file = new File([zipBlob], zipFileName, { type: "application/zip" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: `Job ${jobNumber} Export`
            });
            return;
        } catch (err) {
            console.warn("Share failed, fallback to download:", err);
        }
    }

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFileName;
    a.click();
    URL.revokeObjectURL(url);
}

async function resolvePhotoDataUrl(photo) {
    const utils = window.photoUtils || {};
    if (photo.thumbnailDataUrl) return photo.thumbnailDataUrl;
    if (photo.imageData) return photo.imageData;
    if (photo.thumbnailBlob && utils.blobToDataUrl) {
        return utils.blobToDataUrl(photo.thumbnailBlob);
    }
    if (photo.fullBlob && utils.blobToDataUrl) {
        return utils.blobToDataUrl(photo.fullBlob);
    }
    if (photo.pdfDataUrl && photo.pdfDataUrl.startsWith("data:application/pdf")) {
        try {
            const pdfImg = await convertFirstPdfPageToImage(photo.pdfDataUrl);
            if (pdfImg) return pdfImg;
        } catch (error) {
            console.warn("Failed to convert PDF photo", error);
        }
    }
    return null;
}

function addPhotoToZip(folder, name, dataUrl) {
    if (!folder || !dataUrl) return;
    const base64 = dataUrl.split(",")[1];
    if (base64) {
        folder.file(`${name}.jpg`, base64, { base64: true });
    }
}

async function buildPdfFromImages(dataUrls, jsPDF) {
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    for (let idx = 0; idx < dataUrls.length; idx++) {
        if (idx > 0) {
            pdf.addPage();
        }
        const image = await loadImage(dataUrls[idx]);
        placeImageOnPage(pdf, dataUrls[idx], image);
    }
    return pdf;
}

function placeImageOnPage(pdf, dataUrl, image) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const maxW = pageW - 60;
    const maxH = pageH - 80;
    const scale = Math.min(maxW / image.width, maxH / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    pdf.addImage(dataUrl, "JPEG", x, y, w, h);
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}

async function convertFirstPdfPageToImage(pdfDataUrl) {
    // Placeholder for future PDF-to-image conversion. For now, skip.
    return null;
}

function formatSpec(material) {
    if (material.specification && material.specificationNumber) {
        return `${material.specification} ${material.specificationNumber}`;
    }
    return material.specification || material.specPrefix || "";
}
