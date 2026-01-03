window.addEventListener("DOMContentLoaded", async () => {
  const listContainer = document.getElementById("queueList");
  if (!listContainer) return;

  async function renderQueue() {
    listContainer.innerHTML = "";
    const queue = await db.uploadQueue.toArray();

    if (queue.length === 0) {
      listContainer.innerHTML = `<div class="home-job-empty">The upload queue is empty.</div>`;
      return;
    }

    queue.forEach(item => {
      const div = document.createElement("div");
      div.className = "queue-item";

      const statusClass = item.error ? "failed" : "pending";
      const statusText = item.error ? "Failed" : "Pending";

      div.innerHTML = `
        <div class="queue-item-header">
          <span class="queue-item-title">${item.type}: ${item.key}</span>
          <span class="queue-item-status ${statusClass}">${statusText}</span>
        </div>
        <div class="queue-item-details">
          Added: ${new Date(item.timestamp).toLocaleString()}
        </div>
        ${item.error ? `<div class="queue-item-error"><strong>Error:</strong> ${item.error}</div>` : ''}
        <div class="queue-item-actions">
          <button class="queue-action-btn retry-btn" data-id="${item.id}">Retry</button>
          <button class="queue-action-btn cancel-btn" data-id="${item.id}">Cancel</button>
        </div>
      `;

      listContainer.appendChild(div);
    });

    listContainer.querySelectorAll(".retry-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        // Here you would trigger a re-process of the specific queue item
        // For now, we'll just clear the error for demonstration
        await db.uploadQueue.update(id, { error: null });
        renderQueue();
        // In a real implementation, you would call your queue processing logic here
        // e.g., window.uploadQueue.processQueue(); 
      });
    });

    listContainer.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        await db.uploadQueue.delete(id);
        renderQueue();
      });
    });
  }

  renderQueue();
});
