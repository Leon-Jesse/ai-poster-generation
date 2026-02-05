package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/zhifeiji/auradraw/backend/services"
	"github.com/zhifeiji/auradraw/backend/utils"
)

type PosterController struct {
	Service *services.PosterService
}

func (ctrl *PosterController) Generate(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		// Legacy fields (for backward compatibility)
		Prompt      string `json:"prompt"`
		Style       string `json:"style"`
		AspectRatio string `json:"aspect_ratio"`

		// New Gemini fields
		Platform      string  `json:"platform"`        // youtube, xiaohongshu, douyin
		TitleText     string  `json:"title_text"`      // 封面大字
		BackgroundText string `json:"background_text"` // 背景场景
		Emotion        string  `json:"emotion"`        // 表情
		SelfieBase64   *string `json:"selfie_base64"`  // 用户照片 base64 (可选)
		StyleRefBase64 *string `json:"style_ref_base64"` // 风格参考图 base64 (可选)
		AdvancedStyle  *string `json:"advanced_style"`   // 自定义风格指令 (可选)
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	// Use new fields if provided, otherwise fallback to legacy fields
	aspectRatio := req.AspectRatio
	if aspectRatio == "" {
		// Map platform to aspect ratio
		switch req.Platform {
		case "youtube":
			aspectRatio = "16:9"
		case "xiaohongshu":
			aspectRatio = "3:4"
		case "classic43":
			aspectRatio = "4:3"
		case "douyin":
			aspectRatio = "9:16"
		default:
			aspectRatio = "16:9" // default
		}
	}

	contextPrompt := req.BackgroundText
	if contextPrompt == "" && req.Prompt != "" {
		contextPrompt = req.Prompt // fallback to legacy prompt
	}
	if contextPrompt == "" {
		contextPrompt = "豪华办公室" // default
	}

	overlayText := req.TitleText
	if overlayText == "" {
		overlayText = "我靠这个赚了100万" // default
	}

	emotion := req.Emotion
	if emotion == "" {
		emotion = "震惊" // default
	}

	// Calculate cost (Fixed cost 10 credits per generation)
	cost := int64(10)

	// Pack prompt data for storage
	promptData := map[string]interface{}{
		"platform":        req.Platform,
		"context_prompt":  contextPrompt,
		"overlay_text":    overlayText,
		"emotion":         emotion,
		"aspect_ratio":    aspectRatio,
		"has_selfie":      req.SelfieBase64 != nil && *req.SelfieBase64 != "",
		"has_style_ref":   req.StyleRefBase64 != nil && *req.StyleRefBase64 != "",
		"has_advanced":    req.AdvancedStyle != nil && *req.AdvancedStyle != "",
	}

	// Store image data separately if provided (for Gemini service)
	var selfieBase64, styleRefBase64 *string
	if req.SelfieBase64 != nil && *req.SelfieBase64 != "" {
		selfieBase64 = req.SelfieBase64
	}
	if req.StyleRefBase64 != nil && *req.StyleRefBase64 != "" {
		styleRefBase64 = req.StyleRefBase64
	}

	poster, thumbnails, err := ctrl.Service.GeneratePoster(userID.(uint), promptData, cost, selfieBase64, styleRefBase64, req.AdvancedStyle)
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	// Return parsed prompt as JSON object, not string
	var promptObj interface{}
	_ = json.Unmarshal([]byte(poster.Prompt), &promptObj)

	utils.Success(c, gin.H{
		"id":         poster.ID,
		"status":     poster.Status,
		"cost":       poster.Cost,
		"prompt":     promptObj,
		"image_url":  poster.ImageURL,
		"thumbnails": thumbnails,
	})
}

func (ctrl *PosterController) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	posters, total, err := ctrl.Service.GetPosters(userID.(uint), page, pageSize)
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"total": total,
		"items": posters,
	})
}

func (ctrl *PosterController) GetDetail(c *gin.Context) {
	userID, _ := c.Get("userID")
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	poster, err := ctrl.Service.GetPosterDetail(userID.(uint), uint(id))
	if err != nil {
		utils.Error(c, 404, "poster not found")
		return
	}

	utils.Success(c, poster)
}
