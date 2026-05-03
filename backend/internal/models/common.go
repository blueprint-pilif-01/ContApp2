package models

import (
	"encoding/json"
	"time"
)

type JSONB = json.RawMessage

type SoftDelete struct {
	DeletedAt *time.Time
}

type Timestamps struct {
	CreatedAt time.Time
	UpdatedAt time.Time
}
