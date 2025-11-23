/* EXPORT JOB ENGINE */
/* ------------------------------------------------------------ */
/* Generates portrait PDFs (no logo), separate Photos folder,   */
/* filenames based on Material Description, ZIP export, and     */
/* navigator.share() fallback. Fully offline.                   */
/* ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", async () => {

    const db = new Dexie("welders_helper_db");
    db.version(1).stores({
        jobs: "++id, jobNumber, description",
        materials: "++id, jobNumber, description, photos"
    });

    const params = new URLSearchParams(window.location.search);
    const jobNumber = params.get("job");

    const exportButton = document.getElementById("exportJobButton");
    if (!exportButton) return;

    exportButton.addEventListener("click", () => exportJob(jobNumber));

    /* ------------------------------------------------------------ */
    /* Build PDF for each Material                                  */
    /* ------------------------------------------------------------ */
    async function generatePDF(material) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

        let y = 40;

        /* ----- Centered Title ----- */
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(18);
        pdf.text("RECEIVING REPORT", pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
        y += 25;

        /* ----- Left Aligned Job + Material ----- */
        pdf.setFontSize(12);
        pdf.setFont("Helvetica", "normal");
        pdf.text(`Job: ${material.jobNumber}`, 40, y);  y += 18;
        pdf.text(`Material: ${material.description}`, 40, y); y += 25;

        /* ----- Centered Section Header ----- */
        function section(label) {
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(13);
            pdf.text(label, pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
            y += 15;
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(11);
        }

        /* ----- Draw Row Helper ----- */
        function row(label, value) {
            pdf.text(`${label}: ${value || ""}`, 40, y);
            y += 15;
        }

        /* -------------------- MATERIAL DETAILS -------------------- */
        section("MATERIAL DETAILS");

        row("Vendor", material.vendor);
        row("PO Number", material.poNumber);
        row("Date Received", material.date);
        row("Product", material.product);
        row("Specification", material.specFormatted);
        row("Grade/Type", material.gradeType);
        row("B16 Dim", material.b16);

        /* -------------------- MEASUREMENTS ------------------------ */
        section("MEASUREMENTS");

        row("T1", material.th1);
        row("T2", material.th2);
        row("T3", material.th3);
        row("T4", material.th4);
        row("Width", material.width);
        row("Length", material.length);
        row("Diameter", material.diameter);
        row("Other", material.other);

        /* -------------------- INSPECTION -------------------------- */
        section("INSPECTION");

        row("Visual Acceptable", material.visual ? "Yes" : "No");
        row("Markings Acceptable", material.markingAcceptable);
        row("MTR / CofC Acceptable", material.mtrAcceptable);

        /* -------------------- MARKINGS ---------------------------- */
        section("MARKINGS");

        pdf.text(`Actual Marking:`, 40, y); y += 15;
        const split = pdf.splitTextToSize(material.actualMarking || "", 500);
        pdf.text(split, 40, y);
        y += split.length * 12 + 10;

        /* -------------------- COMMENTS ---------------------------- */
        section("COMMENTS");

        const comments = pdf.splitTextToSize(material.comments || "", 500);
        pdf.text(comments, 40, y);
        y += comments.length * 12 + 20;

        /* -------------------- STATUS ------------------------------ */
        row("Status", material.status);

        /* -------------------- QC ---------------------------------- */
        y += 10;
        row("QC Initials", material.qcInitials);
        row("QC Date", material.qcDate);

        /* Signature line */
        y += 20;
        pdf.text("Signature: _______________________________", 40, y);

        return pdf;
    }

    /* ------------------------------------------------------------ */
    /* Build ZIP with PDFs + Photos                                 */
    /* ------------------------------------------------------------ */
    async function exportJob(jobNum) {
        const materials = await db.materials.where("jobNumber").equals(jobNum).toArray();
        if (materials.length === 0) {
            alert("No materials found for this job.");
            return;
        }

        const zip = new JSZip();
        const root = zip.folder(`Job_${jobNum}`);
        const photoFolder = root.folder("Photos");

        for (let mat of materials) {
            /* Generate PDF */
            const pdf = await generatePDF(mat);
            const pdfData = pdf.output("arraybuffer");

            const safeName = sanitizeFilename(mat.description || "Material");

            root.file(`${safeName}.pdf`, pdfData);

            if (Array.isArray(mat.photos)) {
                for (let i = 0; i < mat.photos.length; i++) {
                    const ph = mat.photos[i];
                    const blob = ph.blob;

                    const buffer = await blobToArrayBuffer(blob);
                    photoFolder.file(`${safeName}_${i+1}.jpg`, buffer);
                }
            }
        }

        /* Try Web Share API */
        const blobZip = await zip.generateAsync({ type: "blob" });

        if (navigator.canShare && navigator.canShare({ files: [new File([blobZip], `Job_${jobNum}.zip`)] })) {
            const file = new File([blobZip], `Job_${jobNum}.zip`);
            try {
                await navigator.share({
                    title: `Job ${jobNum}`,
                    files: [file]
                });
                return;
            } catch (err) {
                console.log("Share failed, falling back to download:", err);
            }
        }

        /* Fallback — download ZIP */
        const url = URL.createObjectURL(blobZip);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Job_${jobNum}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ------------------------------------------------------------ */
    /* Helpers                                                      */
    /* ------------------------------------------------------------ */
    function sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|]/g, "").trim();
    }

    function blobToArrayBuffer(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(blob);
        });
    }

});
