async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

async function createThumbnail(file, maxSize = 320) {
    const dataUrl = await fileToDataUrl(file);
    const image = new Image();

    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = dataUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const thumbDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const response = await fetch(thumbDataUrl);
    const thumbBlob = await response.blob();

    return { thumbBlob, thumbDataUrl };
}

window.photoUtils = {
    fileToDataUrl,
    blobToDataUrl,
    createThumbnail
};
