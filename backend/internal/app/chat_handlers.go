package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type chatConversationResponse struct {
	ID          int64  `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	UnreadCount int    `json:"unread_count"`
	LastMessage string `json:"last_message"`
	UpdatedAt   string `json:"updated_at"`
}

type chatMessageResponse struct {
	ID             int64  `json:"id"`
	ConversationID int64  `json:"conversation_id"`
	SenderID       *int64 `json:"sender_id"`
	SenderName     string `json:"sender_name"`
	Content        string `json:"content"`
	CreatedAt      string `json:"created_at"`
	IsBot          bool   `json:"is_bot"`
}

type chatMessageRequest struct {
	Content string `json:"content"`
}

type deriveTicketRequest struct {
	Message string `json:"message"`
}

func (a *App) listChatConversations(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	if _, err := a.ensureDefaultChatConversation(r, claims.OrganisationID, claims.MembershipID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not prepare chat conversations")
		return
	}

	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			c.id,
			c.type,
			COALESCE(c.title, 'General') AS title,
			0 AS unread_count,
			COALESCE(last_msg.body, '') AS last_message,
			COALESCE(c.last_message_at, c.updated_at, c.created_at) AS updated_at
		FROM chat_conversations c
		LEFT JOIN LATERAL (
			SELECT body
			FROM chat_messages m
			WHERE m.conversation_id = c.id
				AND m.deleted_at IS NULL
			ORDER BY m.created_at DESC, m.id DESC
			LIMIT 1
		) last_msg ON true
		WHERE c.organisation_id = $1
			AND c.archived_at IS NULL
			AND EXISTS (
				SELECT 1
				FROM chat_participants p
				WHERE p.conversation_id = c.id
					AND p.user_id = $2
					AND p.left_at IS NULL
			)
		ORDER BY COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC, c.id DESC
	`, claims.OrganisationID, claims.MembershipID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list chat conversations")
		return
	}
	defer rows.Close()

	conversations := make([]chatConversationResponse, 0)
	for rows.Next() {
		var conversation chatConversationResponse
		var updatedAt time.Time
		if err := rows.Scan(
			&conversation.ID,
			&conversation.Type,
			&conversation.Title,
			&conversation.UnreadCount,
			&conversation.LastMessage,
			&updatedAt,
		); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan chat conversations")
			return
		}
		conversation.UpdatedAt = updatedAt.Format(time.RFC3339)
		conversations = append(conversations, conversation)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"conversations": conversations})
}

func (a *App) listChatMessages(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	conversationID, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if !a.chatConversationVisible(r, claims.OrganisationID, claims.MembershipID, conversationID) {
		httpx.JSON(w, http.StatusOK, map[string]any{"messages": []chatMessageResponse{}})
		return
	}

	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			m.id,
			m.conversation_id,
			m.sender_user_id,
			COALESCE(NULLIF(trim(a.first_name || ' ' || a.last_name), ''), a.email, 'System') AS sender_name,
			m.body,
			m.created_at,
			m.kind = 'bot' AS is_bot
		FROM chat_messages m
		LEFT JOIN organisation_memberships om ON om.id = m.sender_user_id
		LEFT JOIN accounts a ON a.id = om.account_id
		WHERE m.organisation_id = $1
			AND m.conversation_id = $2
			AND m.deleted_at IS NULL
		ORDER BY m.created_at ASC, m.id ASC
	`, claims.OrganisationID, conversationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list chat messages")
		return
	}
	defer rows.Close()

	messages := make([]chatMessageResponse, 0)
	for rows.Next() {
		msg, err := scanChatMessage(rows)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan chat messages")
			return
		}
		messages = append(messages, msg)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"messages": messages})
}

func (a *App) createChatMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	conversationID, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if !a.chatConversationVisible(r, claims.OrganisationID, claims.MembershipID, conversationID) {
		httpx.Error(w, http.StatusNotFound, "conversation not found")
		return
	}

	var input chatMessageRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	content := strings.TrimSpace(input.Content)
	if content == "" {
		httpx.Error(w, http.StatusBadRequest, "message content is required")
		return
	}

	var msg chatMessageResponse
	var createdAt time.Time
	if err := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO chat_messages (
			organisation_id,
			conversation_id,
			sender_user_id,
			kind,
			body
		)
		VALUES ($1, $2, $3, 'user', $4)
		RETURNING id, conversation_id, sender_user_id, body, created_at, false
	`, claims.OrganisationID, conversationID, claims.MembershipID, content).Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.SenderID,
		&msg.Content,
		&createdAt,
		&msg.IsBot,
	); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create chat message")
		return
	}

	_, _ = a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE chat_conversations
		SET last_message_at = $3, updated_at = $3
		WHERE organisation_id = $1
			AND id = $2
	`, claims.OrganisationID, conversationID, createdAt)

	msg.SenderName = a.chatSenderName(r, claims.MembershipID)
	msg.CreatedAt = createdAt.Format(time.RFC3339)
	httpx.JSON(w, http.StatusCreated, msg)
}

func (a *App) deriveTicketFromChat(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input deriveTicketRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	message := strings.TrimSpace(input.Message)
	if message == "" {
		httpx.Error(w, http.StatusBadRequest, "message is required")
		return
	}

	title := deriveTicketTitle(message)
	sourceType := "chat"
	dueAt := time.Now().UTC().Add(3 * 24 * time.Hour)
	task := models.TicketingTask{
		OrganisationID: claims.OrganisationID,
		CreatedByID:    claims.MembershipID,
		AssigneeUserID: &claims.MembershipID,
		Title:          title,
		Description:    &message,
		Status:         "todo",
		Priority:       "normal",
		SourceType:     &sourceType,
		DueAt:          &dueAt,
	}
	if err := a.Repo.CreateTicketingTask(r.Context(), &task); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create ticket from chat")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{
		"ticket": map[string]any{
			"id":    task.ID,
			"title": task.Title,
		},
		"confirmation": "Am creat ticketul #" + strconv.FormatInt(task.ID, 10) + ".",
	})
}

func (a *App) ensureDefaultChatConversation(r *http.Request, organisationID, membershipID int64) (int64, error) {
	var id int64
	err := a.Repo.Connection().QueryRowContext(r.Context(), `
		SELECT id
		FROM chat_conversations
		WHERE organisation_id = $1
			AND type = 'group'
			AND COALESCE(title, '') = 'General'
			AND archived_at IS NULL
		ORDER BY id ASC
		LIMIT 1
	`, organisationID).Scan(&id)
	if err == nil {
		_, _ = a.Repo.Connection().ExecContext(r.Context(), `
			INSERT INTO chat_participants (conversation_id, user_id, role)
			VALUES ($1, $2, 'member')
			ON CONFLICT (conversation_id, user_id) DO UPDATE
			SET left_at = NULL
		`, id, membershipID)
		return id, nil
	}
	if err != sql.ErrNoRows {
		return 0, err
	}

	err = a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO chat_conversations (
			organisation_id,
			type,
			title,
			created_by_id
		)
		VALUES ($1, 'group', 'General', $2)
		RETURNING id
	`, organisationID, membershipID).Scan(&id)
	if err != nil {
		return 0, err
	}
	_, err = a.Repo.Connection().ExecContext(r.Context(), `
		INSERT INTO chat_participants (conversation_id, user_id, role)
		VALUES ($1, $2, 'owner')
		ON CONFLICT (conversation_id, user_id) DO NOTHING
	`, id, membershipID)
	return id, err
}

func (a *App) chatConversationVisible(r *http.Request, organisationID, membershipID, conversationID int64) bool {
	var exists bool
	err := a.Repo.Connection().QueryRowContext(r.Context(), `
		SELECT EXISTS (
			SELECT 1
			FROM chat_conversations c
			JOIN chat_participants p ON p.conversation_id = c.id
			WHERE c.id = $1
				AND c.organisation_id = $2
				AND c.archived_at IS NULL
				AND p.user_id = $3
				AND p.left_at IS NULL
		)
	`, conversationID, organisationID, membershipID).Scan(&exists)
	return err == nil && exists
}

func (a *App) chatSenderName(r *http.Request, membershipID int64) string {
	var name string
	err := a.Repo.Connection().QueryRowContext(r.Context(), `
		SELECT COALESCE(NULLIF(trim(a.first_name || ' ' || a.last_name), ''), a.email, 'User')
		FROM organisation_memberships om
		JOIN accounts a ON a.id = om.account_id
		WHERE om.id = $1
	`, membershipID).Scan(&name)
	if err != nil || strings.TrimSpace(name) == "" {
		return "User"
	}
	return name
}

type chatMessageScanner interface {
	Scan(dest ...any) error
}

func scanChatMessage(row chatMessageScanner) (chatMessageResponse, error) {
	var msg chatMessageResponse
	var createdAt time.Time
	if err := row.Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.SenderID,
		&msg.SenderName,
		&msg.Content,
		&createdAt,
		&msg.IsBot,
	); err != nil {
		return msg, err
	}
	msg.CreatedAt = createdAt.Format(time.RFC3339)
	return msg, nil
}

func deriveTicketTitle(message string) string {
	title := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(message), "@bot"))
	title = strings.TrimSpace(strings.TrimPrefix(title, ":"))
	if title == "" {
		return "Ticket din chat"
	}
	for _, sep := range []string{".", "\n", "!", "?"} {
		if idx := strings.Index(title, sep); idx > 0 {
			title = strings.TrimSpace(title[:idx])
		}
	}
	if len(title) > 80 {
		title = strings.TrimSpace(title[:80])
	}
	if title == "" {
		return "Ticket din chat"
	}
	return title
}
