# Agent Notes

## Cloud workflow touchpoints

- Client cloud integration lives in `cloud.js` (Firebase/Firestore/Storage) and `upload_queue.js` (queue processing).
- Local IndexedDB schema is defined in `db.js` and includes `materials`, `photos`, and `uploadQueue`.
- Cloud mode settings are stored in local storage and managed by `cloud_settings.js`.
- Receiving report photo buckets live in `receiving_report.js` and save `photos` with `category` and `label` metadata for materials vs. MTR/CofC.

## Keeping documentation in sync

When changing cloud workflows, update:

- `README.md` for user-facing setup and workflow details.
- `service_worker.js` cache list for any new static assets.
