package config

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

type Config struct {
	AppEnv                   string
	HTTPAddr                 string
	APIBasePath              string
	DatabaseURL              string
	MigrationsDir            string
	JWTSecret                string
	JWTIssuer                string
	JWTAudience              string
	AccessTokenTTL           time.Duration
	RefreshTokenTTL          time.Duration
	AccountRefreshCookieName string
	AdminRefreshCookieName   string
	RefreshCookiePath        string
	RefreshCookieDomain      string
	RefreshCookieSecure      bool
	CORSAllowedOrigins       map[string]struct{}
}

func Load() (Config, error) {
	_ = loadDotEnv(".env")

	accessTTL, err := getDuration("APP_ACCESS_TOKEN_TTL", 15*time.Minute)
	if err != nil {
		return Config{}, fmt.Errorf("invalid APP_ACCESS_TOKEN_TTL: %w", err)
	}
	refreshTTL, err := getDuration("APP_REFRESH_TOKEN_TTL", 24*time.Hour)
	if err != nil {
		return Config{}, fmt.Errorf("invalid APP_REFRESH_TOKEN_TTL: %w", err)
	}

	return Config{
		AppEnv:                   getEnv("APP_ENV", "local"),
		HTTPAddr:                 getEnv("APP_HTTP_ADDR", ":8080"),
		APIBasePath:              getEnv("APP_API_BASE_PATH", "/api/v1"),
		DatabaseURL:              getEnv("DATABASE_URL", "postgres://app_user:pwd1@localhost:5433/contapp2?sslmode=disable"),
		MigrationsDir:            getEnv("APP_MIGRATIONS_DIR", "./migrations"),
		JWTSecret:                getEnv("APP_JWT_SECRET", "dev-insecure-change-me"),
		JWTIssuer:                getEnv("APP_JWT_ISSUER", "contapp"),
		JWTAudience:              getEnv("APP_JWT_AUDIENCE", "contapp-api"),
		AccessTokenTTL:           accessTTL,
		RefreshTokenTTL:          refreshTTL,
		AccountRefreshCookieName: getEnv("APP_ACCOUNT_REFRESH_COOKIE_NAME", "account_refresh_token"),
		AdminRefreshCookieName:   getEnv("APP_ADMIN_REFRESH_COOKIE_NAME", "admin_refresh_token"),
		RefreshCookiePath:        getEnv("APP_REFRESH_COOKIE_PATH", "/api/v1/auth"),
		RefreshCookieDomain:      getEnv("APP_REFRESH_COOKIE_DOMAIN", ""),
		RefreshCookieSecure:      getBool("APP_REFRESH_COOKIE_SECURE", false),
		CORSAllowedOrigins:       getCSVSet("APP_CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"}),
	}, nil
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) (time.Duration, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback, nil
	}
	return time.ParseDuration(raw)
}

func getBool(key string, fallback bool) bool {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	switch strings.ToLower(raw) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}

func getCSVSet(key string, fallback []string) map[string]struct{} {
	raw := strings.TrimSpace(os.Getenv(key))
	values := fallback
	if raw != "" {
		values = strings.Split(raw, ",")
	}

	out := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			out[value] = struct{}{}
		}
	}
	return out
}

func loadDotEnv(path string) error {
	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer file.Close()

	reader := bufio.NewReader(file)
	for {
		line, err := reader.ReadString('\n')
		if err != nil && err != io.EOF {
			return err
		}

		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "#") {
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
				if key != "" {
					if _, exists := os.LookupEnv(key); !exists {
						_ = os.Setenv(key, value)
					}
				}
			}
		}

		if err == io.EOF {
			break
		}
	}
	return nil
}
