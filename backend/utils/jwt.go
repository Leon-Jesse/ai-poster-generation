package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/zhifeiji/auradraw/backend/config"
)

func getSecret() []byte {
	// Ensure config is loaded before calling this, or handle gracefully
	if config.AppConfig == nil {
		return []byte("fallback_secret_for_safety")
	}
	return []byte(config.AppConfig.JWTSecret)
}

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint) (string, error) {
	expireHours := config.AppConfig.JWTExpireHours
	if expireHours <= 0 {
		expireHours = 24
	}
	issuer := config.AppConfig.JWTIssuer
	if issuer == "" {
		issuer = "auradraw"
	}

	expirationTime := time.Now().Add(time.Duration(expireHours) * time.Hour)
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    issuer,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getSecret())
}

func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return getSecret(), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
