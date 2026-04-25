# Ticketing Reference (BV social media tasks)

## Source files

- `D:/JSprojects/bisericavertical/backend/routes/socialMedia.js`
- `D:/JSprojects/bisericavertical/backend/controllers/socialMediaController.js`

## Endpoints in BV

- `GET /api/social-media/tasks`
- `GET /api/social-media/tasks/:id`
- `POST /api/social-media/tasks`
- `PUT /api/social-media/tasks/:id`
- `DELETE /api/social-media/tasks/:id`
- `POST /api/social-media/tasks/:id/claim`
- `POST /api/social-media/tasks/:id/complete`
- `POST /api/social-media/tasks/:id/refuse`
- `POST /api/social-media/tasks/:id/set-status`

## ContApp adaptation

ContApp frontend uses:

- `GET /ticketing/tasks`
- `POST /ticketing/tasks`
- `PUT /ticketing/tasks/:id`
- `POST /ticketing/tasks/:id/claim`
- `POST /ticketing/tasks/:id/complete`
- `POST /ticketing/tasks/:id/refuse`

Model fields expected by UI:

- `id`, `title`, `description`, `status`, `priority`, `owner_id`, `assignee_id`, `due_date`.
