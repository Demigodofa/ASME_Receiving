window.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("homeJobsList");
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");

  if (settingsBtn && closeSettingsBtn && settingsPanel) {
    settingsBtn.addEventListener("click", () => {
      settingsPanel.classList.add("is-open");
    });

    closeSettingsBtn.addEventListener("click", () => {
      settingsPanel.classList.remove("is-open");
    });
  }

  if (!list) return;

  const jobs = await db.jobs.orderBy("createdAt").reverse().toArray();
  list.innerHTML = "";

  if (jobs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "home-job-empty";
    empty.textContent = "No jobs yet. Create your first job to get started.";
    list.appendChild(empty);
    return;
  }

  jobs.forEach((job) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-job-row";
    button.addEventListener("click", () => {
      window.location.href = `job.html?job=${job.jobNumber}`;
    });

    const jobNumber = document.createElement("span");
    jobNumber.className = "home-job-cell home-job-number";
    jobNumber.textContent = `#${job.jobNumber}`;

    const description = document.createElement("span");
    description.className = "home-job-cell home-job-description";
    description.textContent = job.description || "(No description)";

    const notes = document.createElement("span");
    notes.className = "home-job-cell home-job-notes";
    notes.textContent = job.notes || "";

    button.appendChild(jobNumber);
    button.appendChild(description);
    button.appendChild(notes);
    list.appendChild(button);
  });
});
