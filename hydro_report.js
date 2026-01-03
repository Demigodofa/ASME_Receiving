let jobNumber;
let hydroReportId;

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    jobNumber = params.get("job");

    if (!jobNumber) {
        alert("Error: Job number missing.");
        window.location.href = "jobs.html";
        return;
    }

    // Autopopulate job number and dates
    document.getElementById("jobNumber").value = jobNumber;
    document.getElementById("qciDate").valueAsDate = new Date();
    document.getElementById("aiDate").valueAsDate = new Date();
    document.getElementById("customerDate").valueAsDate = new Date();

    setDefaultSelections();
    await loadReport();

    document.getElementById("hydroReportForm").onsubmit = saveReport;
};

async function loadReport() {
    const report = await db.hydroReports.where("jobNumber").equals(jobNumber).first();

    if (report) {
        hydroReportId = report.id;
        document.getElementById("itemNumber").value = report.itemNumber || "";
        document.getElementById("customer").value = report.customer || "";
        document.getElementById("itemDescription").value = report.itemDescription || "";
        
        // ASME Codes
        (report.asmeCode || []).forEach(code => {
            const checkbox = document.querySelector(`input[name='asmeCode'][value='${code}']`);
            if(checkbox) checkbox.checked = true;
        });
        document.getElementById("codeOther").value = report.asmeCodeOther || "";

        document.getElementById("calculatedTestPressure").value = report.calculatedTestPressure || "";
        document.getElementById("maxTestPressure").value = report.maxTestPressure || "";
        document.getElementById("testGaugeId").value = report.testGaugeId || "";

        document.querySelector(`input[name='valvesClosed'][value='${report.valvesClosed}']`).checked = true;
        document.querySelector(`input[name='vented'][value='${report.vented}']`).checked = true;
        document.querySelector(`input[name='supported'][value='${report.supported}']`).checked = true;

        document.getElementById("waterMetalTemp").value = report.waterMetalTemp || "";
        document.getElementById("finalInspectionPressure").value = report.finalInspectionPressure || "";
        document.querySelector(`input[name='finalResult'][value='${report.finalResult}']`).checked = true;

        document.getElementById("comments").value = report.comments || "";
        document.getElementById("qci").value = report.qci || "";
        document.getElementById("qciDate").valueAsDate = report.qciDate ? new Date(report.qciDate) : new Date();
        document.getElementById("ai").value = report.ai || "";
        document.getElementById("aiDate").valueAsDate = report.aiDate ? new Date(report.aiDate) : new Date();
        document.getElementById("customerSignature").value = report.customerSignature || "";
        document.getElementById("customerDate").valueAsDate = report.customerDate ? new Date(report.customerDate) : new Date();
        
        // Add delete button if report exists
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete Report";
        deleteBtn.className = "danger-btn";
        deleteBtn.onclick = deleteReport;
        document.getElementById("hydroReportForm").appendChild(deleteBtn);
    }
}

function setDefaultSelections() {
    const valvesClosed = document.getElementById("valvesClosedYes");
    const vented = document.getElementById("ventedYes");
    const supported = document.getElementById("supportedYes");
    const finalResult = document.getElementById("resultAccepted");

    if (valvesClosed) valvesClosed.checked = true;
    if (vented) vented.checked = true;
    if (supported) supported.checked = true;
    if (finalResult) finalResult.checked = true;
}

async function saveReport(event) {
    event.preventDefault();

    const asmeCodes = [];
    document.querySelectorAll("input[name='asmeCode']:checked").forEach(cb => asmeCodes.push(cb.value));

    const reportData = {
        jobNumber: document.getElementById("jobNumber").value,
        itemNumber: document.getElementById("itemNumber").value,
        customer: document.getElementById("customer").value,
        itemDescription: document.getElementById("itemDescription").value,
        asmeCode: asmeCodes,
        asmeCodeOther: document.getElementById("codeOther").value,
        calculatedTestPressure: document.getElementById("calculatedTestPressure").value,
        maxTestPressure: document.getElementById("maxTestPressure").value,
        testGaugeId: document.getElementById("testGaugeId").value,
        valvesClosed: document.querySelector("input[name='valvesClosed']:checked").value,
        vented: document.querySelector("input[name='vented']:checked").value,
        supported: document.querySelector("input[name='supported']:checked").value,
        waterMetalTemp: document.getElementById("waterMetalTemp").value,
        finalInspectionPressure: document.getElementById("finalInspectionPressure").value,
        finalResult: document.querySelector("input[name='finalResult']:checked").value,
        comments: document.getElementById("comments").value,
        qci: document.getElementById("qci").value,
        qciDate: document.getElementById("qciDate").value,
        ai: document.getElementById("ai").value,
        aiDate: document.getElementById("aiDate").value,
        customerSignature: document.getElementById("customerSignature").value,
        customerDate: document.getElementById("customerDate").value
    };

    if (hydroReportId) {
        await db.hydroReports.update(hydroReportId, reportData);
        alert("Hydro Report updated!");
    } else {
        await db.hydroReports.add(reportData);
        alert("Hydro Report saved!");
    }
    window.location.href = `job.html?job=${jobNumber}`;
}

async function deleteReport() {
    if (!confirm("Are you sure you want to delete this report?")) return;
    if (hydroReportId) {
        await db.hydroReports.delete(hydroReportId);
        alert("Hydro Report deleted.");
        window.location.href = `job.html?job=${jobNumber}`;
    }
}
