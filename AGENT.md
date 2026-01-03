# Agent Notes

## Cloud workflow touchpoints

- Client cloud integration lives in `cloud.js` (Firebase/Firestore/Storage) and `upload_queue.js` (queue processing).
- Local IndexedDB schema is defined in `db.js` and includes `materials`, `photos`, and `uploadQueue`.
- Cloud mode settings are stored in local storage and managed by `cloud_settings.js`.
- Job creation UI wiring lives in `create_job.js` (save handler and navigation).
- Job details UI (compact summary/edit form and hydro report status) is rendered in `job.js` with styling in `style.css`.
- The home screen job list is rendered in `home.js` with styles in `style.css`.
- Lint and test scripts are defined in `package.json` with config in `eslint.config.js` and smoke tests in `__tests__/`.
- Receiving report photo buckets live in `receiving_report.js` and save `photos` with `category` and `label` metadata for materials vs. MTR/CofC.
- Job renumbering updates related materials, photos, and hydro reports in `job.js`.
- Shared page centering/layout for fixed-header screens lives in `style.css` under `.page-content` and uses `box-sizing: border-box` to prevent padded layouts from overflowing.

## Keeping documentation in sync

When changing cloud workflows, update:

- `README.md` for user-facing setup and workflow details.
- `service_worker.js` cache list for any new static assets.
