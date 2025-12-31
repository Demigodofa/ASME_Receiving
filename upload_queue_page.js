window.addEventListener("load", () => {
    renderQueue();
    window.addEventListener("uploadqueue:update", renderQueue);
});

async function renderQueue() {
    const pendingContainer = document.getElementById("queuePending");
    const failedContainer = document.getElementById("queueFailed");
    const completedContainer = document.getElementById("queueCompleted");

    const items = await window.uploadQueue.getQueueItems();

    const pendingItems = items.filter((item) => item.status === "pending" || item.status === "uploading");
    const failedItems = items.filter((item) => item.status === "failed");
    const completedItems = items.filter((item) => item.status === "completed");

    renderItems(pendingContainer, pendingItems, false);
    renderItems(failedContainer, failedItems, true);
    renderItems(completedContainer, completedItems, false);

    window.uploadQueue.processQueue();
}

function renderItems(container, items, showRetry) {
    if (!container) return;

    container.innerHTML = "";

    if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No entries.";
        container.appendChild(empty);
        return;
    }

    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "queue-card";

        const label = document.createElement("div");
        label.className = "queue-label";
        label.textContent = `${item.type.toUpperCase()} • ${item.status}`;

        const meta = document.createElement("div");
        meta.className = "queue-meta";
        meta.textContent = `Material #${item.materialId || "-"}`;

        const progress = document.createElement("div");
        progress.className = "progress-bar";
        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";
        progressFill.style.width = `${item.progress || 0}%`;
        progress.appendChild(progressFill);

        card.appendChild(label);
        card.appendChild(meta);

        if (item.status === "uploading" || item.status === "pending") {
            card.appendChild(progress);
        }

        if (item.status === "failed" && item.error) {
            const error = document.createElement("div");
            error.className = "queue-error";
            error.textContent = item.error;
            card.appendChild(error);
        }

        if (showRetry) {
            const btn = document.createElement("button");
            btn.className = "secondary-btn";
            btn.textContent = "Retry";
            btn.onclick = () => window.uploadQueue.retry(item.id);
            card.appendChild(btn);
        }

        container.appendChild(card);
    });
}
