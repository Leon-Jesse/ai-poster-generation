package services

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/zhifeiji/auradraw/backend/models"
	"github.com/zhifeiji/auradraw/backend/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type PosterService struct {
	GeminiService *GeminiService
}

func NewPosterService() (*PosterService, error) {
	geminiService, err := NewGeminiService()
	if err != nil {
		// Log warning but continue - will fallback to mock if Gemini is not configured
		utils.Logger.Warn("Failed to initialize Gemini service, will use mock generation", zap.Error(err))
		return &PosterService{
			GeminiService: nil,
		}, nil
	}
	return &PosterService{
		GeminiService: geminiService,
	}, nil
}

func (s *PosterService) GeneratePoster(
	userID uint,
	prompt interface{},
	cost int64,
	selfieBase64 *string,
	styleRefBase64 *string,
	advancedStyle *string,
) (*models.Poster, []GeneratedResult, error) {
	promptJSON, _ := json.Marshal(prompt)

	// 1. 检查免费试用次数
	const FreeTrialLimit = 3 // 免费试用次数限制
	var posterCount int64
	models.DB.Model(&models.Poster{}).Where("user_id = ?", userID).Count(&posterCount)
	hasFreeTrial := posterCount < int64(FreeTrialLimit)

	// 2. 如果有免费试用，cost设为0；否则检查余额
	var balance models.UserBalance
	if !hasFreeTrial {
		if err := models.DB.Where("user_id = ?", userID).First(&balance).Error; err != nil {
			return nil, nil, errors.New("user balance not found")
		}

		if balance.Balance < cost {
			return nil, nil, errors.New("insufficient balance")
		}
	} else {
		// 免费试用时，cost设为0
		cost = 0
	}

	var poster models.Poster

	// 3. Transaction: 扣除余额（如果有）& 创建 Poster
	err := models.DB.Transaction(func(tx *gorm.DB) error {
		// 如果不是免费试用，扣除余额
		if !hasFreeTrial {
			if err := tx.Model(&balance).Update("balance", balance.Balance-cost).Error; err != nil {
				return err
			}

			// Record Transaction
			trans := models.Transaction{
				UserID:      int64(userID),
				Type:        "consume",
				Amount:      -cost,
				ReferenceID: 0,
			}
			if err := tx.Create(&trans).Error; err != nil {
				return err
			}
			// Update Reference ID after poster creation
			defer tx.Model(&trans).Update("reference_id", poster.ID)
		}

		// Create Poster
		poster = models.Poster{
			UserID: int64(userID),
			Prompt: string(promptJSON),
			Status: "pending",
			Cost:   cost, // 免费试用时为0
		}
		if err := tx.Create(&poster).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	// 3. 同步调用 Gemini 生成缩略图，直接等待结果返回
	thumbnails := []GeneratedResult{}

	// 从 prompt 中解析参数
	promptMap, ok := prompt.(map[string]interface{})
	if !ok {
		utils.Logger.Error("Invalid prompt data type", zap.Any("prompt", prompt))
	} else if s.GeminiService != nil {
		contextPrompt, _ := promptMap["context_prompt"].(string)
		overlayText, _ := promptMap["overlay_text"].(string)
		emotion, _ := promptMap["emotion"].(string)
		aspectRatio, _ := promptMap["aspect_ratio"].(string)

		// Default values
		if contextPrompt == "" {
			contextPrompt = "豪华办公室"
		}
		if overlayText == "" {
			overlayText = "我靠这个赚了100万"
		}
		if emotion == "" {
			emotion = "震惊"
		}
		if aspectRatio == "" {
			aspectRatio = "16:9"
		}

		geminiReq := GenerateRequest{
			ContextPrompt:   contextPrompt,
			OverlayText:     overlayText,
			Emotion:         emotion,
			AspectRatio:     aspectRatio,
			SelfieBase64:    selfieBase64,
			DesignRefBase64: styleRefBase64,
			AdvancedStyle:   advancedStyle,
		}

		results, err := s.GeminiService.GenerateBeastThumbnails(geminiReq)
		if err == nil && len(results) > 0 {
			thumbnails = results
			// 使用第一张作为主图
			imageURL := results[0].URL
			poster.Status = "completed"
			poster.ImageURL = imageURL
			models.DB.Model(&models.Poster{}).Where("id = ?", poster.ID).Updates(map[string]interface{}{
				"status":    poster.Status,
				"image_url": poster.ImageURL,
			})
			utils.Logger.Info("Poster generated successfully with Gemini", zap.Int64("poster_id", poster.ID))
			return &poster, thumbnails, nil
		}
		utils.Logger.Error("Gemini generation failed, falling back to mock", zap.Error(err))
	}

	// 如果 Gemini 不可用或失败，使用占位图作为退化方案
	time.Sleep(2 * time.Second)
	imgURL := "https://via.placeholder.com/1024x1792.png?text=AI+Generated+Image"
	poster.Status = "completed"
	poster.ImageURL = imgURL
	models.DB.Model(&models.Poster{}).Where("id = ?", poster.ID).Updates(map[string]interface{}{
		"status":    poster.Status,
		"image_url": poster.ImageURL,
	})
	utils.Logger.Info("Poster generated with mock (Gemini not available)", zap.Int64("poster_id", poster.ID))

	return &poster, thumbnails, nil
}

func (s *PosterService) GetPosters(userID uint, page, pageSize int) ([]models.Poster, int64, error) {
	var posters []models.Poster
	var total int64

	offset := (page - 1) * pageSize

	// Only get completed posters with valid image URLs
	db := models.DB.Model(&models.Poster{}).
		Where("user_id = ? AND status = ? AND image_url != '' AND image_url IS NOT NULL", userID, "completed")
	db.Count(&total)

	err := db.Order("created_at desc").Offset(offset).Limit(pageSize).Find(&posters).Error
	return posters, total, err
}

// GetAllPosters gets all posters (for consumption history) regardless of status
func (s *PosterService) GetAllPosters(userID uint, page, pageSize int) ([]models.Poster, int64, error) {
	var posters []models.Poster
	var total int64

	offset := (page - 1) * pageSize

	// Get all posters regardless of status (for consumption history)
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
