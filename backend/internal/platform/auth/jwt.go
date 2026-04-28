package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	TokenUse       string `json:"token_use"`
	ActorType      string `json:"actor_type"`
	AccountID      int64  `json:"account_id,omitempty"`
	AdminID        int64  `json:"admin_id,omitempty"`
	OrganisationID int64  `json:"organisation_id,omitempty"`
	MembershipID   int64  `json:"membership_id,omitempty"`
	jwt.RegisteredClaims
}

type TokenManager struct {
	Secret   []byte
	Issuer   string
	Audience string
	TTL      time.Duration
}

func NewTokenManager(secret, issuer, audience string, ttl time.Duration) TokenManager {
	return TokenManager{
		Secret:   []byte(secret),
		Issuer:   issuer,
		Audience: audience,
		TTL:      ttl,
	}
}

func (m TokenManager) AccountToken(accountID, organisationID, membershipID int64) (string, error) {
	return m.sign(Claims{
		TokenUse:       "access",
		ActorType:      "account",
		AccountID:      accountID,
		OrganisationID: organisationID,
		MembershipID:   membershipID,
	})
}

func (m TokenManager) AdminToken(adminID int64) (string, error) {
	return m.sign(Claims{
		TokenUse:  "access",
		ActorType: "admin",
		AdminID:   adminID,
	})
}

func (m TokenManager) AccountRefreshToken(accountID, organisationID, membershipID int64, ttl time.Duration) (string, string, time.Time, error) {
	jti, err := newTokenID()
	if err != nil {
		return "", "", time.Time{}, err
	}
	expiresAt := time.Now().UTC().Add(ttl)
	token, err := m.signWithTTL(Claims{
		TokenUse:       "refresh",
		ActorType:      "account",
		AccountID:      accountID,
		OrganisationID: organisationID,
		MembershipID:   membershipID,
	}, ttl, jti)
	if err != nil {
		return "", "", time.Time{}, err
	}
	return token, jti, expiresAt, nil
}

func (m TokenManager) AdminRefreshToken(adminID int64, ttl time.Duration) (string, string, time.Time, error) {
	jti, err := newTokenID()
	if err != nil {
		return "", "", time.Time{}, err
	}
	expiresAt := time.Now().UTC().Add(ttl)
	token, err := m.signWithTTL(Claims{
		TokenUse:  "refresh",
		ActorType: "admin",
		AdminID:   adminID,
	}, ttl, jti)
	if err != nil {
		return "", "", time.Time{}, err
	}
	return token, jti, expiresAt, nil
}

func (m TokenManager) Parse(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return m.Secret, nil
	}, jwt.WithIssuer(m.Issuer), jwt.WithAudience(m.Audience))
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (m TokenManager) sign(claims Claims) (string, error) {
	return m.signWithTTL(claims, m.TTL, "")
}

func (m TokenManager) signWithTTL(claims Claims, ttl time.Duration, jti string) (string, error) {
	now := time.Now().UTC()
	claims.RegisteredClaims = jwt.RegisteredClaims{
		Issuer:    m.Issuer,
		Audience:  jwt.ClaimStrings{m.Audience},
		ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		IssuedAt:  jwt.NewNumericDate(now),
		NotBefore: jwt.NewNumericDate(now),
		ID:        jti,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.Secret)
}

func newTokenID() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
