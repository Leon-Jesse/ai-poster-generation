package services

import (
	"errors"
	"time"

	"github.com/zhifeiji/auradraw/backend/config"
	"github.com/zhifeiji/auradraw/backend/models"
	"github.com/zhifeiji/auradraw/backend/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AuthService struct{}

func (s *AuthService) SendCode(email string, msgType string) (string, error) {
	// Generate random code
	codeLength := config.AppConfig.VerifyCodeLength
	if codeLength <= 0 {
		codeLength = 6
	}
	code := utils.GenerateRandomCode(codeLength)

	// Generate security token
	token := utils.GenerateMD5Token() // Use MD5 token instead of JWT for verification

	if msgType == "" {
		msgType = string(models.VerifyCodeTypeRegister)
	}

	// Store code in DB
	expireMinutes := config.AppConfig.VerifyCodeExpireMinutes
	if expireMinutes <= 0 {
		expireMinutes = 5
	}
	verifyCode := models.VerifyCode{
		Email:     email,
		Code:      code,
		Type:      msgType,
		Token:     token,
		ExpiredAt: time.Now().Add(time.Duration(expireMinutes) * time.Minute),
	}

	if err := models.DB.Create(&verifyCode).Error; err != nil {
		return "", err
	}

	// Send Email
	data := map[string]string{
		"Code": code,
	}

	err := utils.SendEmail(email, msgType, data)
	if err != nil {
		return "", err
	}

	utils.Logger.Info("Verification code sent",
		zap.String("email", email),
		zap.String("type", msgType),
		zap.String("code", code),
	)
	return token, nil
}

func (s *AuthService) Register(email, password, code, token string) (*models.User, string, error) {
	// 1. Verify code and token
	var verifyCode models.VerifyCode
	// Check Type matches 'register'
	err := models.DB.Where("email = ? AND code = ? AND token = ? AND type = ? AND used_at IS NULL", email, code, token, models.VerifyCodeTypeRegister).First(&verifyCode).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("invalid verification code or token")
		}
		return nil, "", err
	}

	if time.Now().After(verifyCode.ExpiredAt) {
		return nil, "", errors.New("verification code expired")
	}

	// 2. Check if user exists
	var count int64
	models.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
	if count > 0 {
		return nil, "", errors.New("email already registered")
	}

	// 3. Create User, Credential, Balance in Transaction
	var user models.User
	err = models.DB.Transaction(func(tx *gorm.DB) error {
		// Mark code as used
		now := time.Now()
		if err := tx.Model(&verifyCode).Update("used_at", &now).Error; err != nil {
			return err
		}

		// Create User
		user = models.User{
			Email:     email,
			Provider:  "email",
			Status:    "enabled",
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		// Hash Password
		hash, err := utils.HashPassword(password)
		if err != nil {
			return err
		}

		// Create Credential
		cred := models.UserCredential{
			UserID:       user.ID,
			PasswordHash: hash,
		}
		if err := tx.Create(&cred).Error; err != nil {
			return err
		}

		// Create Balance
		initialBalance := config.AppConfig.InitialBalance
		balance := models.UserBalance{
			UserID:  user.ID,
			Balance: initialBalance, // Initial bonus credits
		}
		if err := tx.Create(&balance).Error; err != nil {
			return err
		}

		// If initial balance > 0, record transaction
		if initialBalance > 0 {
			trans := models.Transaction{
				UserID: user.ID,
				Type:   "gift",
				Amount: initialBalance,
				// Description: "System Gift: Initial Balance", // Field not in generated model
				ReferenceID: 0, // No specific reference for system gift or maybe user ID
			}
			if err := tx.Create(&trans).Error; err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, "", err
	}

	// 4. Generate Token
	token, err = utils.GenerateToken(uint(user.ID))
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func (s *AuthService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	var cred models.UserCredential
	if err := models.DB.Where("user_id = ?", userID).First(&cred).Error; err != nil {
		return errors.New("user not found")
	}

	if !utils.CheckPasswordHash(oldPassword, cred.PasswordHash) {
		return errors.New("incorrect old password")
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	cred.PasswordHash = hash
	return models.DB.Save(&cred).Error
}

func (s *AuthService) ResetPassword(email, newPassword, code, token string) error {
	// 1. Verify code and token
	var verifyCode models.VerifyCode
	err := models.DB.Where("email = ? AND code = ? AND token = ? AND type = ? AND used_at IS NULL", email, code, token, models.VerifyCodeTypeResetPassword).First(&verifyCode).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid verification code or token")
		}
		return err
	}

	if time.Now().After(verifyCode.ExpiredAt) {
		return errors.New("verification code expired")
	}

	// 2. Check if user exists
	var user models.User
	if err := models.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return errors.New("user not found")
	}

	// 3. Update Password in Transaction
	err = models.DB.Transaction(func(tx *gorm.DB) error {
		// Mark code as used
		now := time.Now()
		if err := tx.Model(&verifyCode).Update("used_at", &now).Error; err != nil {
			return err
		}

		// Hash New Password
		hash, err := utils.HashPassword(newPassword)
		if err != nil {
			return err
		}

		// Update Credential
		var cred models.UserCredential
		if err := tx.Where("user_id = ?", user.ID).First(&cred).Error; err != nil {
			return err
		}

		cred.PasswordHash = hash
		if err := tx.Save(&cred).Error; err != nil {
			return err
		}

		return nil
	})

	return err
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	var user models.User
	if err := models.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	var cred models.UserCredential
	if err := models.DB.Where("user_id = ?", user.ID).First(&cred).Error; err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	if !utils.CheckPasswordHash(password, cred.PasswordHash) {
		return nil, "", errors.New("invalid email or password")
	}

	token, err := utils.GenerateToken(uint(user.ID))
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}
