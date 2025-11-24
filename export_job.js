// ============================================================================
//  export_job.js — TOTAL CLEAN REWRITE
//  Fully Offline ZIP + PDF Export System (iOS + Android Compatible)
// ============================================================================

async function exportJobData(jobNumber) {
    if (!jobNumber) {
        alert("Error: No job number provided for export.");
        return;
    }

    // Load job and materials
    const job = await db.jobs.where("jobNumber").equals(jobNumber).first();
    const materials = await db.materials.where("jobNumber").equals(jobNumber).toArray();

    if (!job) {
        alert("Error: Job not found.");
        return;
    }

    // Load JSZip and jsPDF
    const zip = new JSZip();
    const { jsPDF } = window.jspdf;

    // Root folder structure
    const rootFolder = zip.folder(`Job_${jobNumber}`);
    const materialsFolder = rootFolder.folder("Materials");
    const photosFolder = rootFolder.folder("Photos");

    // ========================================================================
    // 1. CREATE JOB SUMMARY PDF
    // ========================================================================
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
            summary.text(`${i + 1}. ${m.description || "(No description)"}`, 50, y);
            y += 16;
        });
    }

    rootFolder.file(
        "Job_Summary.pdf",
        summary.output("blob")
    );

    // ========================================================================
    // 2. MATERIAL PDFS
    // ========================================================================
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

        write("Description", m.description);
        write("Vendor", m.vendor);
        write("PO Number", m.poNumber);
        write("Date Received", m.date);
        write("Quantity", m.quantity);
        write("Spec Prefix", m.specPrefix);
        write("Spec Code", m.specCode);
        write("Grade", m.grade);
        write("B16 Dimensions", m.b16dim);

        pdf.text("Thicknesses:", 50, y2);
        y2 += 16;

        write("T1", m.th1);
        write("T2", m.th2);
        write("T3", m.th3);
        write("T4", m.th4);

        y2 += 8;

        write("Visual Inspection", m.visual);
        write("Marking Acceptable", m.markingAcceptable);
        write("MTR Acceptable", m.mtrAcceptable);

        y2 += 8;

        write("Actual Marking", m.actualMarking);
        write("Comments", m.comments);

        y2 += 20;

        pdf.setFont("Helvetica", "bold");
        pdf.text("QC Verification", 50, y2);
        y2 += 18;

        pdf.setFont("Helvetica", "normal");
        write("QC Initials", m.qcInitials);
        write("QC Date", m.qcDate);

        // -- Insert photos (thumbnails) -------------------------------------
        if (Array.isArray(m.photos) && m.photos.length > 0) {
            y2 += 20;
            pdf.setFont("Helvetica", "bold");
            pdf.text("Photos:", 50, y2);
            y2 += 16;

            let x = 50;

            m.photos.forEach((img, pIndex) => {
                try {
                    pdf.addImage(img, "JPEG", x, y2, 150, 120);
                } catch (e) {
                    console.error("Photo skipped:", e);
                }

                // Save raw photo to ZIP
                const base64 = img.split(",")[1];
                if (base64) {
                    photosFolder.file(
                        `material${i + 1}_photo${pIndex + 1}.jpg`,
                        base64,
                        { base64: true }
                    );
                }

                x += 160;
                if (x > 450) {
                    x = 50;
                    y2 += 130;
                }
            });
        }

        materialsFolder.file(
            `Material_${i + 1}.pdf`,
            pdf.output("blob")
        );
    }

    // ========================================================================
    // 3. GENERATE ZIP + SHARE
    // ========================================================================
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFileName = `Job_${jobNumber}.zip`;

    const file = new File([zipBlob], zipFileName, { type: "application/zip" });

    // Native share sheet support
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

    // Browser download fallback
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
