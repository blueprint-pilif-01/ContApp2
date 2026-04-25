# Backend Reference Pack (from BisericaVertical)

This folder gives the backend developer a practical map of how the borrowed features work in
`D:/JSprojects/bisericavertical/backend`.

## Source of truth files in BisericaVertical

- Auth + permission enforcement:
  - `D:/JSprojects/bisericavertical/backend/middleware/auth.js`
  - `D:/JSprojects/bisericavertical/backend/middleware/permissions.js`
- Feature routes/controllers used as inspiration:
  - `D:/JSprojects/bisericavertical/backend/routes/socialMedia.js`
  - `D:/JSprojects/bisericavertical/backend/controllers/socialMediaController.js`
  - `D:/JSprojects/bisericavertical/backend/routes/messaging.js`
  - `D:/JSprojects/bisericavertical/backend/controllers/messagingController.js`
  - `D:/JSprojects/bisericavertical/backend/routes/users.js`
  - `D:/JSprojects/bisericavertical/backend/controllers/usersController.js`
  - `D:/JSprojects/bisericavertical/backend/routes/permissions.js`
  - `D:/JSprojects/bisericavertical/backend/controllers/permissionsController.js`
- Schema/migrations references:
  - `D:/JSprojects/bisericavertical/backend/scripts/init-database.js`
  - `D:/JSprojects/bisericavertical/backend/config/database.js`

## PDF-related references in BisericaVertical

There is no Puppeteer contract-PDF pipeline in that project. PDF usage is mostly song-file processing:

- `D:/JSprojects/bisericavertical/backend/utils/pdfProcessor.js`
  - Uses `pdf-lib` + `pdf-parse`
  - Extracts text/chords and generates transposed PDF variants
- `D:/JSprojects/bisericavertical/backend/controllers/songFilesController.js`
  - Upload/transposition orchestration for PDF song files
- `D:/JSprojects/bisericavertical/backend/routes/songFiles.js`
  - Endpoints:
    - `POST /api/song-files/:songId/upload-pdf`
    - `POST /api/song-files/:songId/generate-pdf-transpositions`
    - `POST /api/song-files/:songId/transpose-pdf`

For contract PDF generation in ContApp, backend dev should implement a dedicated flow (likely Go),
using this package only as a conceptual reference for file pipelines.
