# Screen and form spec (native parity guide)

Use this as the reference for wording, fields, and defaults when rebuilding screens natively.

## Landing / Home
- Tiles/links to: Activate Cloud Access, Jobs list, Upload Queue, Settings.
- Shows preview of current jobs on landing; full list in Jobs screen.

## Jobs
- List of saved jobs; row tap opens job detail.
- Create Job flow:
  - Fields: Job Number (required), Description, Notes.
  - On save: store locally; if cloud mode enabled, ensure Firestore job doc exists.

## Job detail
- Compact job summary row; tap to edit metadata (same fields as create).
- Actions: add/edit materials, open hydro report, generate receiving report, start offload, free up space.

## Material / Receiving item entry
- Core fields: item description (175 char / 5 lines max), vendor (30), quantity (20), specification numbers (20), markings (5 lines). Defaults to imperial dimensions.
- Status fields: offload status, pdf status, pdf storage path.
- Photo handling:
  - Local full-res stored; thumbs generated immediately.
  - Buckets: Materials (max 4 photos), MTR/CofC (max 8 photos).
  - Labels: description truncated to 12 chars with numeric suffixes; MTR photos prefixed `MTR_`.
- Actions: Start Offload (upload full), Free Up Space (after pdf ready).

## Upload Queue
- Shows pending, failed, completed uploads.
- Retry failed uploads; reflects cloud mode toggle.

## Cloud access / Settings
- Activate Cloud Access: redeem access code, store Firebase config, enable cloud mode.
- Fields: Firebase Config (JSON), PDF Endpoint, Cloud mode toggle.
- Config stored locally for offline reuse.

## Reports
- Receiving report: warns before navigating away with unsaved changes; obeys field caps above.
- Hydro report:
  - Yes/No and Accepted/Rejected options default to affirmative/accepted for new reports.
  - When job number edits, hydro report stays linked to job.

## Lookup
- Lookup screen title: “Lookup - MaterialGuardian Android”.
