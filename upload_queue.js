const uploadQueue = (() => {
    let processing = false;

    const notifyUpdate = () => {
        window.dispatchEvent(new CustomEvent("uploadqueue:update"));
    };

    const enqueue = async (entry) => {
        const now = new Date().toISOString();
        await db.uploadQueue.add({
            ...entry,
            status: "pending",
            progress: 0,
            attempts: 0,
            createdAt: now,
            updatedAt: now
        });
        notifyUpdate();
        processQueue();
    };

    const enqueueThumbnail = async ({ materialId, photoId, storagePath, itemId }) => {
        await enqueue({
            type: "thumbnail",
            materialId,
            photoId,
            storagePath,
            itemId
        });
    };

    const enqueueFull = async ({ materialId, photoId, storagePath, itemId }) => {
        await enqueue({
            type: "full",
            materialId,
            photoId,
            storagePath,
            itemId
        });
    };

    const enqueuePdf = async ({ materialId, itemId }) => {
        await enqueue({
            type: "pdf",
            materialId,
            itemId
        });
    };

    const updateQueueItem = async (id, patch) => {
        await db.uploadQueue.update(id, {
            ...patch,
            updatedAt: new Date().toISOString()
        });
        notifyUpdate();
    };

    const markFailed = async (item, error) => {
        await updateQueueItem(item.id, {
            status: "failed",
            error: error ? String(error) : "Unknown error",
            progress: 0
        });
    };

    const processQueue = async () => {
        if (processing) return;
        processing = true;

        try {
            let nextItem = await db.uploadQueue.where("status").equals("pending").first();
            while (nextItem) {
                await processQueueItem(nextItem);
                nextItem = await db.uploadQueue.where("status").equals("pending").first();
            }
        } finally {
            processing = false;
        }
    };

    const processQueueItem = async (item) => {
        await updateQueueItem(item.id, { status: "uploading", progress: 0 });

        const cloud = await window.cloudApiReady;
        if (!cloud.enabled) {
            await markFailed(item, "Cloud not configured");
            return;
        }

        try {
            if (item.type === "thumbnail" || item.type === "full") {
                const photo = await db.photos.get(item.photoId);
                if (!photo) {
                    await markFailed(item, "Photo not found");
                    return;
                }

                const blob = await resolvePhotoBlob(photo, item.type);
                if (!blob) {
                    await markFailed(item, "Photo blob missing");
                    return;
                }

                await cloud.uploadFile(item.storagePath, blob, async (progress) => {
                    await updateQueueItem(item.id, { progress: Math.round(progress * 100) });
                });

                if (item.type === "thumbnail") {
                    await db.photos.update(photo.id, {
                        thumbStoragePath: item.storagePath,
                        status: "thumbnail-uploaded"
                    });
                    await updatePhotoStatusIfPossible(cloud, item, "thumbnail-uploaded");
                } else {
                    await db.photos.update(photo.id, {
                        fullStoragePath: item.storagePath,
                        status: "full-uploaded"
                    });
                    await updatePhotoStatusIfPossible(cloud, item, "full-uploaded");
                }
            }

            if (item.type === "pdf") {
                const material = await db.materials.get(item.materialId);
                if (!material) {
                    await markFailed(item, "Material not found");
                    return;
                }

                const pdfStoragePath = await cloud.requestPdfGeneration(material);
                await db.materials.update(material.id, {
                    pdfStatus: "ready",
                    pdfStoragePath
                });

                await cloud.upsertItemDoc({
                    ...material,
                    pdfStatus: "ready",
                    pdfStoragePath
                });
            }

            await updateQueueItem(item.id, { status: "completed", progress: 100 });
        } catch (error) {
            await markFailed(item, error);
        }
    };

    const resolvePhotoBlob = async (photo, type) => {
        if (type === "full") {
            return photo.fullBlob || null;
        }

        if (photo.thumbnailBlob) {
            return photo.thumbnailBlob;
        }

        if (photo.thumbnailDataUrl) {
            const response = await fetch(photo.thumbnailDataUrl);
            return response.blob();
        }

        return null;
    };

    const updatePhotoStatusIfPossible = async (cloud, item, status) => {
        if (!item.itemId || !item.photoId) {
            return;
        }

        const material = await db.materials.get(item.materialId);
        if (!material || !material.cloudItemId) {
            return;
        }

        const photo = await db.photos.get(item.photoId);
        const photoId = photo?.cloudPhotoId;
        if (!photoId) {
            return;
        }

        await cloud.updatePhotoStatus(material, photoId, { status });
    };

    const retry = async (id) => {
        const item = await db.uploadQueue.get(id);
        if (!item) return;

        await updateQueueItem(id, {
            status: "pending",
            error: "",
            attempts: (item.attempts || 0) + 1
        });
        processQueue();
    };

    const getQueueItems = async () => db.uploadQueue.orderBy("createdAt").reverse().toArray();

    const waitForMaterialUploads = async (materialId, type) => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                const entries = await db.uploadQueue
                    .where("materialId").equals(materialId)
                    .and((entry) => entry.type === type)
                    .toArray();

                const failed = entries.find((entry) => entry.status === "failed");
                if (failed) {
                    clearInterval(interval);
                    reject(new Error(failed.error || "Upload failed"));
                    return;
                }

                const pending = entries.filter((entry) => entry.status !== "completed");
                if (pending.length === 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
        });
    };

    return {
        enqueueThumbnail,
        enqueueFull,
        enqueuePdf,
        processQueue,
        retry,
        getQueueItems,
        waitForMaterialUploads
    };
})();

window.uploadQueue = uploadQueue;
