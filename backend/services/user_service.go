package services

import (
	"errors"

	"github.com/zhifeiji/auradraw/backend/models"
)

type UserService struct{}

const (
	FreeTrialLimit = 3 // 免费试用次数限制
)

func (s *UserService) GetUserProfile(userID uint) (*models.User, int64, int, error) {
	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		return nil, 0, 0, errors.New("user not found")
	}

	var balance models.UserBalance
	if err := models.DB.Where("user_id = ?", userID).First(&balance).Error; err != nil {
		// Should not happen if data is consistent, but handle gracefully
		return &user, 0, FreeTrialLimit, nil
	}

	// 计算免费试用剩余次数：统计用户已生成的poster数量
	var posterCount int64
	models.DB.Model(&models.Poster{}).Where("user_id = ?", userID).Count(&posterCount)
	
	remainingFreeTrials := FreeTrialLimit - int(posterCount)
	if remainingFreeTrials < 0 {
		remainingFreeTrials = 0
	}

	return &user, balance.Balance, remainingFreeTrials, nil
}
