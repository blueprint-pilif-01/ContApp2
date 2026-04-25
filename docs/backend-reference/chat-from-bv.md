# Messaging Reference (BV messaging)

## Source files

- `D:/JSprojects/bisericavertical/backend/routes/messaging.js`
- `D:/JSprojects/bisericavertical/backend/controllers/messagingController.js`

## Relevant BV endpoints

- `GET /api/messaging/conversations`
- `POST /api/messaging/conversations/direct`
- `POST /api/messaging/conversations/group`
- `GET /api/messaging/:conversationId/messages`
- `POST /api/messaging/:conversationId/messages`
- `POST /api/messaging/:conversationId/typing`
- `PUT /api/messaging/:conversationId/read`
- `GET /api/messaging/unread-count`

## ContApp adaptation

Frontend currently expects:

- `GET /chat/conversations`
- `GET /chat/conversations/:id/messages`
- `POST /chat/conversations/:id/messages`
- `POST /chat/derive-task` (bot-specific, new)

Expected message payload:

- `id`, `conversation_id`, `sender_id`, `sender_name`, `content`, `created_at`, `is_bot`.
