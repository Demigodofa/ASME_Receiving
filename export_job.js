const db = new Dexie("ASMEReceivingDB");
db.version(1).stores({
    jobs: "jobNumber, description, notes, createdAt",
    materials: "++id, jobNumber"
});

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("exportJob");
    if (btn) btn.onclick = exportJob;
});

function base64ToBin(b64) {
    const raw = atob(b64.split(",")[1]);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
}

async function generatePDF(mat) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "letter" });

    let y = 40;
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("RECEIVING REPORT", pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
    y += 30;

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(12);

    function row(label, val) {
        pdf.text(`${label}: ${val || ""}`, 40, y);
        y += 16;
    }

    row("Description", mat.description);
    row("Vendor", mat.vendor);
    row("PO Number", mat.poNumber);
    row("Date", mat.date);
    row("Quantity", mat.quantity);
    row("Product", mat.product);
    row("Spec", `${mat.specPrefix} ${mat.specCode}`);
    row("Grade", mat.grade);
    row("B16 Dim", mat.b16dim);

    row("Thickness", mat.th1);
    row("Width", mat.th2);
    row("Length", mat.th3);
    row("Diameter", mat.th4);
    row("Other", mat.other);

    row("Visual", mat.visual);
    row("Marking Acceptable", mat.markingAcceptable);
    row("MTR Acceptable", mat.mtrAcceptable);

    pdf.text("Actual Marking:", 40, y);
    y += 16;
    const markText = pdf.splitTextToSize(mat.actualMarking || "", 500);
    pdf.text(markText, 40, y);
    y += markText.length * 14 + 10;

    pdf.text("Comments:", 40, y);
    y += 16;
    const commentText = pdf.splitTextToSize(mat.comments || "", 500);
    pdf.text(commentText, 40, y);
    y += commentText.length * 14 + 20;

    row("QC Initials", mat.qcInitials);
    row("QC Date", mat.qcDate);

    if (mat.photos?.length) {
        y += 20;
        const imgW = 160, imgH = 120, gap = 20;
        let x = 40;

        mat.photos.forEach((p, i) => {
            pdf.addImage(p, "JPEG", x, y, imgW, imgH);
            x += imgW + gap;
            if ((i + 1) % 3 === 0) {
                x = 40;
                y += imgH + gap;
            }
        });
    }

    return pdf.output("arraybuffer");
}

async function exportJob() {
    const jobNum = new URLSearchParams(location.search).get("job");
    const job = await db.jobs.get(jobNum);
    const mats = await db.materials.where("jobNumber").equals(jobNum).toArray();

    if (!mats.length) {
        alert("No materials found.");
        return;
    }

    const zip = new JSZip();
    const root = zip.folder(`Job_${jobNum}`);
    const matFolder = root.folder("Materials");
    const photoFolder = root.folder("Photos");

    for (const m of mats) {
        const pdf = await generatePDF(m);
        matFolder.file(`Material_${m.id}.pdf`, pdf);

        if (m.photos?.length) {
            m.photos.forEach((p, idx) => {
                photoFolder.file(`Material_${m.id}_${idx + 1}.jpg`, base64ToBin(p));
            });
        }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const filename = `Job_${jobNum}.zip`;
    const file = new File([blob], filename, { type: "application/zip" });

    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ title: filename, files: [file] });
            return;
        } catch (err) {}
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
