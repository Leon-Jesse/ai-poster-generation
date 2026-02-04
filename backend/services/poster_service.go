package services

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/zhifeiji/auradraw/backend/models"
	"gorm.io/gorm"
)

type PosterService struct{}

func (s *PosterService) GeneratePoster(userID uint, prompt interface{}, cost int64) (*models.Poster, error) {
	promptJSON, _ := json.Marshal(prompt)

	// 1. Check Balance
	var balance models.UserBalance
	if err := models.DB.Where("user_id = ?", userID).First(&balance).Error; err != nil {
		return nil, errors.New("user balance not found")
	}

	if balance.Balance < cost {
		return nil, errors.New("insufficient balance")
	}

	var poster models.Poster

	// 2. Transaction: Deduct Balance & Create Poster
	err := models.DB.Transaction(func(tx *gorm.DB) error {
		// Deduct
		if err := tx.Model(&balance).Update("balance", balance.Balance-cost).Error; err != nil {
			return err
		}

		// Record Transaction
		trans := models.Transaction{
			UserID:      int64(userID),
			Type:        "consume",
			Amount:      -cost,
			ReferenceID: 0, // Update later or use 0 for now as we don't have poster ID yet. Ideally use UUID or 2-step.
		}
		if err := tx.Create(&trans).Error; err != nil {
			return err
		}

		// Create Poster
		poster = models.Poster{
			UserID: int64(userID),
			Prompt: string(promptJSON),
			Status: "pending",
			Cost:   cost,
		}
		if err := tx.Create(&poster).Error; err != nil {
			return err
		}

		// Update Reference ID (Optional, strictly speaking transaction should reference poster)
		tx.Model(&trans).Update("reference_id", poster.ID)

		return nil
	})
	if err != nil {
		return nil, err
	}

	// 3. Mock Async Generation
	go func(pID int64) {
		time.Sleep(2 * time.Second) // Simulate processing
		// Mock Result
		imgURL := "https://via.placeholder.com/1024x1792.png?text=AI+Generated+Image"
		models.DB.Model(&models.Poster{}).Where("id = ?", pID).Updates(map[string]interface{}{
			"status":    "completed",
			"image_url": imgURL,
		})
	}(poster.ID)

	return &poster, nil
}

func (s *PosterService) GetPosters(userID uint, page, pageSize int) ([]models.Poster, int64, error) {
	var posters []models.Poster
	var total int64

	offset := (page - 1) * pageSize

	db := models.DB.Model(&models.Poster{}).Where("user_id = ?", userID)
	db.Count(&total)

	err := db.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&posters).Error
	return posters, total, err
}

func (s *PosterService) GetPosterDetail(userID, posterID uint) (*models.Poster, error) {
	var poster models.Poster
	err := models.DB.Where("id = ? AND user_id = ?", posterID, userID).First(&poster).Error
	return &poster, err
}
