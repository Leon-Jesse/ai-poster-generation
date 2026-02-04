package services

import (
	"errors"

	"github.com/zhifeiji/auradraw/backend/models"
)

type UserService struct{}

func (s *UserService) GetUserProfile(userID uint) (*models.User, int64, error) {
	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		return nil, 0, errors.New("user not found")
	}

	var balance models.UserBalance
	if err := models.DB.Where("user_id = ?", userID).First(&balance).Error; err != nil {
		// Should not happen if data is consistent, but handle gracefully
		return &user, 0, nil
	}

	return &user, balance.Balance, nil
}
