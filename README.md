# ASME Receiving

A lightweight, offline-first receiving inspection app with optional cloud mode for offloading photos and PDF generation.

## Cloud Mode + Offload Workflow

### Firestore schema

- `jobs/{jobId}`
- `items/{itemId}` with form fields, `photoCount`, `offloadStatus`, `pdfStatus`, `pdfStoragePath`
- `items/{itemId}/photos/{photoId}` with `thumbStoragePath`, `fullStoragePath`, `status`

### Cloud mode setup

1. Open the app entry point (`app.html`), which routes through `index.html` (splash) to `home.html`.
2. Paste your Firebase config JSON into **Firebase Config (JSON)**.
3. Provide your PDF generation endpoint in **PDF Endpoint**.
4. Enable **Cloud mode**.

The config and endpoint are stored in local storage so the app can run offline between sessions.

### Photo handling

- Full-resolution images are stored locally in IndexedDB.
- Thumbnails are generated immediately and uploaded in cloud mode.
- The UI shows up to five thumbnails per item.
- Receiving reports split photos into Materials (max 4) and MTR/CofC (max 8) buckets.
- Photo labels use a truncated item description (12 characters) with numeric suffixes (e.g., `ELBOW_1`), while MTR/CofC uses an `MTR_` prefix (e.g., `MTR_ELBOW_1`) to keep cloud storage paths consistent.

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

## Receiving report UI limits

- Item descriptions are capped at five lines (175 characters total).
- Vendor (30 chars), quantity (20 chars), and specification numbers (20 chars) are length-limited.
- Actual material markings are limited to five lines.
- Dimensions include imperial/metric selectors, defaulting to imperial.

## Hydro report defaults

- Hydro report yes/no and accepted/rejected options default to the affirmative/accepted choice on new reports.
- When a job number is edited, the hydro report record is updated to keep it connected to the job.

## Job creation flow

- The **Save Job** action on `create_job.html` stores the job in IndexedDB and routes to `job.html` for adding receiving reports and materials.
- The home screen lists saved jobs and links directly to their job details for editing and reporting.
- The job details screen shows a compact job summary row; select it to edit job metadata, and use the hydro report action/status under Job Details to open or generate the report.

## UI layout conventions

- Screens with the fixed header use the `.page-content` wrapper in `style.css` to keep content centered and padded on larger displays.
- The shared `.page-content`, `.container`, and `.content` wrappers use `box-sizing: border-box` so padded layouts do not overflow on narrow screens.

## Development checks

- `npm run lint` for ESLint.
- `npm test` for Jest.

## Service worker caching

Static assets are cached in the service worker (`service_worker.js`). If you add new static assets, update the cache list.
