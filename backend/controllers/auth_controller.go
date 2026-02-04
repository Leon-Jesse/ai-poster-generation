package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/zhifeiji/auradraw/backend/services"
	"github.com/zhifeiji/auradraw/backend/utils"
)

type AuthController struct {
	Service services.AuthService
}

func (ctrl *AuthController) SendCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Type  string `json:"type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	token, err := ctrl.Service.SendCode(req.Email, req.Type)
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"token": token,
	})
}

func (ctrl *AuthController) Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Code     string `json:"code" binding:"required"`
		Token    string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	user, token, err := ctrl.Service.Register(req.Email, req.Password, req.Code, req.Token)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"user":  user,
		"token": token,
	})
}

func (ctrl *AuthController) ChangePassword(c *gin.Context) {
	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.Error(c, 401, "unauthorized")
		return
	}

	if err := ctrl.Service.ChangePassword(userID.(uint), req.OldPassword, req.NewPassword); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, nil)
}

func (ctrl *AuthController) ResetPassword(c *gin.Context) {
	var req struct {
		Email       string `json:"email" binding:"required,email"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
		Code        string `json:"code" binding:"required"`
		Token       string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	if err := ctrl.Service.ResetPassword(req.Email, req.NewPassword, req.Code, req.Token); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, nil)
}

func (ctrl *AuthController) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	user, token, err := ctrl.Service.Login(req.Email, req.Password)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"user":  user,
		"token": token,
	})
}
