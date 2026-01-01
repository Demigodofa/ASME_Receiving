# ASME Receiving

A lightweight, offline-first receiving inspection app with optional cloud mode for offloading photos and PDF generation.

## Cloud Mode + Offload Workflow

### Firestore schema

- `jobs/{jobId}`
- `items/{itemId}` with form fields, `photoCount`, `offloadStatus`, `pdfStatus`, `pdfStoragePath`
- `items/{itemId}/photos/{photoId}` with `thumbStoragePath`, `fullStoragePath`, `status`

### Cloud mode setup

1. Open the home screen (`app.html`).
2. Paste your Firebase config JSON into **Firebase Config (JSON)**.
3. Provide your PDF generation endpoint in **PDF Endpoint**.
4. Enable **Cloud mode**.

The config and endpoint are stored in local storage so the app can run offline between sessions.

### Photo handling

- Full-resolution images are stored locally in IndexedDB.
- Thumbnails are generated immediately and uploaded in cloud mode.
- The UI shows up to five thumbnails per item.

### Offload

- Use **Start Offload** in the Edit Material page to upload full-resolution photos.
- PDF generation is triggered after photo uploads complete.
- When the PDF status reads `ready`, select **Free Up Space** to remove local originals safely.

### Upload queue

Visit **Upload Queue** from the home screen to monitor pending, failed, and completed uploads. Failed uploads can be retried.

## Local data model (IndexedDB)

- `jobs` for job metadata
- `materials` for form data and cloud state fields
- `photos` for local blobs and cloud storage paths
- `uploadQueue` for thumbnail/full/PDF uploads

## Service worker caching

Static assets are cached in the service worker (`service_worker.js`). If you add new static assets, update the cache list.
