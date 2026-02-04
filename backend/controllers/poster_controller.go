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
	Service services.PosterService
}

func (ctrl *PosterController) Generate(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		Prompt      string `json:"prompt" binding:"required"`
		Style       string `json:"style"`
		AspectRatio string `json:"aspect_ratio"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	// Calculate cost (Mock logic)
	cost := int64(10) // Fixed cost 10 credits

	// Pack prompt data
	promptData := map[string]string{
		"text":         req.Prompt,
		"style":        req.Style,
		"aspect_ratio": req.AspectRatio,
	}

	poster, err := ctrl.Service.GeneratePoster(userID.(uint), promptData, cost)
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	// Return parsed prompt as JSON object, not string
	var promptObj interface{}
	_ = json.Unmarshal([]byte(poster.Prompt), &promptObj)

	utils.Success(c, gin.H{
		"id":     poster.ID,
		"status": poster.Status,
		"cost":   poster.Cost,
		"prompt": promptObj,
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
