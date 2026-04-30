package main

import (
	"backend/internal/app"
	"log/slog"
	"os"
)

func main() {
	if err := app.Run(); err != nil {
		slog.Error("api failed", "error", err)
		os.Exit(1)
	}
}
