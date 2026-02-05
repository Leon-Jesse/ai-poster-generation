package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/zhifeiji/auradraw/backend/services"
	"github.com/zhifeiji/auradraw/backend/utils"
)

type UserController struct {
	Service services.UserService
}

func (ctrl *UserController) GetMe(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	user, balance, remainingFreeTrials, err := ctrl.Service.GetUserProfile(userID.(uint))
	if err != nil {
		utils.Error(c, 404, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"id":                  user.ID,
		"email":               user.Email,
		"provider":            user.Provider,
		"created_at":          user.CreatedAt,
		"balance":             balance,
		"remaining_free_trials": remainingFreeTrials,
	})
}
