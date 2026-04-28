package models

import (
	"encoding/json"
	"time"
)

type JSONB = json.RawMessage

type SoftDelete struct {
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type Timestamps struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
