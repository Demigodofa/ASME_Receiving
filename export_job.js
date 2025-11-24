// ============================================================================
//  export_job.js — FINAL VERSION
//  Generates ZIP with PDFs + Photos, fully offline
// ============================================================================

async function exportJobData(jobNumber) {
    if (!jobNumber) {
        alert("Missing job number.");
        return;
    }

    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();
    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();

    if (!job) {
        alert("Job not found.");
        return;
    }

    // Load libraries
    const zip = new JSZip();
    const { jsPDF } = window.jspdf;

    // Root folder
    const rootFolder = zip.folder(`Job_${jobNumber}`);

    // Materials + Photos folders
    const matFolder = rootFolder.folder("Materials");
    const photoFolder = rootFolder.folder("Photos");

    // ------------------------------------------------------------
    // 1. CREATE JOB SUMMARY PDF
    // ------------------------------------------------------------
    const summary = new jsPDF({ unit: "pt", format: "letter" });

    let y = 40;

    summary.setFont("Helvetica", "bold");
    summary.setFontSize(18);
    summary.text(`Receiving Inspection Report`, 50, y);
    y += 30;

    summary.setFontSize(14);
    summary.text(`Job Number: ${job.jobNumber}`, 50, y);
    y += 22;

    summary.setFont("Helvetica", "normal");
    summary.text(`Description: ${job.description || ""}`, 50, y);
    y += 22;

    summary.text(`Notes: ${job.notes || ""}`, 50, y);
    y += 30;

    summary.setFont("Helvetica", "bold");
    summary.text("Materials:", 50, y);
    y += 22;

    summary.setFont("Helvetica", "normal");

    if (materials.length === 0) {
        summary.text("No materials added.", 50, y);
    } else {
        materials.forEach((m, index) => {
            summary.text(`${index + 1}. ${m.description || "(No description)"}`, 50, y);
            y += 18;
        });
    }

    const summaryPDF = summary.output("blob");
    rootFolder.file("Job_Summary.pdf", summaryPDF);

    // ------------------------------------------------------------
    // 2. CREATE MATERIAL PDFs
    // ------------------------------------------------------------
    for (let i = 0; i < materials.length; i++) {
        const m = materials[i];
        const pdf = new jsPDF({ unit: "pt", format: "letter" });

        let y2 = 40;

        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text(`Material Report — ${m.description || "Material"}`, 50, y2);
        y2 += 30;

        pdf.setFontSize(12);
        pdf.setFont("Helvetica", "normal");

        pdf.text(`Vendor: ${m.vendor || ""}`, 50, y2); y2 += 18;
        pdf.text(`PO Number: ${m.poNumber || ""}`, 50, y2); y2 += 18;
        pdf.text(`Date Received: ${m.date || ""}`, 50, y2); y2 += 18;
        pdf.text(`Quantity: ${m.quantity || ""}`, 50, y2); y2 += 18;

        y2 += 10;

        pdf.text(`Spec: ${m.specPrefix || ""} ${m.specCode || ""}`, 50, y2); y2 += 18;
        pdf.text(`Grade: ${m.grade || ""}`, 50, y2); y2 += 18;
        pdf.text(`B16 Dim: ${m.b16dim || ""}`, 50, y2); y2 += 18;

        y2 += 10;

        pdf.text(`Thicknesses:`, 50, y2); y2 += 18;
        pdf.text(`T1: ${m.th1 || ""}`, 70, y2); y2 += 18;
        pdf.text(`T2: ${m.th2 || ""}`, 70, y2); y2 += 18;
        pdf.text(`T3: ${m.th3 || ""}`, 70, y2); y2 += 18;
        pdf.text(`T4: ${m.th4 || ""}`, 70, y2); y2 += 18;

        y2 += 10;

        pdf.text(`Visual: ${m.visual || ""}`, 50, y2); y2 += 18;
        pdf.text(`Marking Acceptable: ${m.markingAcceptable || ""}`, 50, y2); y2 += 18;
        pdf.text(`MTR Acceptable: ${m.mtrAcceptable || ""}`, 50, y2); y2 += 18;

        y2 += 10;

        pdf.text(`Actual Marking: ${m.actualMarking || ""}`, 50, y2); y2 += 18;
        pdf.text(`Comments: ${m.comments || ""}`, 50, y2); y2 += 30;

        // QC Block
        pdf.setFont("Helvetica", "bold");
        pdf.text("QC Verification", 50, y2);
        y2 += 22;

        pdf.setFont("Helvetica", "normal");
        pdf.text(`QC Initials: ${m.qcInitials || ""}`, 50, y2); y2 += 18;
        pdf.text(`QC Date: ${m.qcDate || ""}`, 50, y2); y2 += 30;

        // Insert photos
        if (Array.isArray(m.photos) && m.photos.length > 0) {
            pdf.setFont("Helvetica", "bold");
            pdf.text("Photos:", 50, y2);
            y2 += 25;

            let x = 50;

            for (let p = 0; p < m.photos.length; p++) {
                const img = m.photos[p];

                pdf.addImage(img, "JPEG", x, y2, 150, 120);
                x += 160;

                if (x > 450) {
                    x = 50;
                    y2 += 130;
                }

                // Save raw photo to ZIP
                const base64 = img.split(",")[1];
                photoFolder.file(`mat${i + 1}_photo${p + 1}.jpg`, base64, { base64: true });
            }
        }

        const materialPDF = pdf.output("blob");
        matFolder.file(`Material_${i + 1}.pdf`, materialPDF);
    }

    // ------------------------------------------------------------
    // 3. GENERATE ZIP + SHARE
    // ------------------------------------------------------------
    const zipBlob = await zip.generateAsync({ type: "blob" });

    const zipName = `Job_${jobNumber}.zip`;

    // Native share sheet (Android + iOS)
    if (navigator.canShare && navigator.canShare({ files: [new File([zipBlob], zipName)] })) {
        const file = new File([zipBlob], zipName, { type: "application/zip" });
        await navigator.share({ files: [file] });
        return;
    }

    // Fallback (browser download)
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipName;
    a.click();
    URL.revokeObjectURL(url);
}
