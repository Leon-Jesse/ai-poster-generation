package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/zhifeiji/auradraw/backend/config"
	"github.com/zhifeiji/auradraw/backend/services"
	"github.com/zhifeiji/auradraw/backend/utils"
)

type PaymentController struct {
	Service *services.PaymentService
}

func (ctrl *PaymentController) GetProducts(c *gin.Context) {
	utils.Success(c, config.AppConfig.Products)
}

func (ctrl *PaymentController) GetBalance(c *gin.Context) {
	userID, _ := c.Get("userID")
	balance, err := ctrl.Service.GetBalance(userID.(uint))
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	utils.Success(c, gin.H{"balance": balance})
}

func (ctrl *PaymentController) Charge(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req struct {
		ProductID int    `json:"product_id" binding:"required"`
		Method    string `json:"payment_method" binding:"required,oneof=alipay wechat"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorWithStatus(c, http.StatusBadRequest, 400, err.Error())
		return
	}

	order, payURL, err := ctrl.Service.CreateChargeOrder(userID.(uint), req.ProductID, req.Method)
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"order_id": order.OrderID,
		"pay_url":  payURL,
	})
}

func (ctrl *PaymentController) AlipayCallback(c *gin.Context) {
	c.Request.ParseForm()
	req := c.Request.PostForm

	err := ctrl.Service.HandleAlipayCallback(req)
	if err != nil {
		// Log error
		// utils.Error(c, 500, err.Error()) // Do not return JSON error to Alipay
		c.String(http.StatusOK, "fail")
		return
	}

	c.String(http.StatusOK, "success")
}

func (ctrl *PaymentController) AlipayReturn(c *gin.Context) {
	req := c.Request.URL.Query()

	err := ctrl.Service.HandleAlipayReturn(req)
	if err != nil {
		// Log error
		// Redirect to error page or return JSON
		utils.Error(c, 500, err.Error())
		return
	}

	// Redirect to frontend success page
	// c.Redirect(http.StatusFound, "http://localhost:5173/payment/success")
	// Since this API is called by frontend (via URL parameters), we can just return success JSON and let frontend handle redirection/display.
	// Wait, standard flow: Alipay redirects User's browser to Backend Return URL -> Backend processes -> Backend redirects to Frontend Success Page.
	// OR: Alipay redirects User's browser to Frontend Return URL -> Frontend calls Backend API with params -> Backend processes -> Frontend displays success.
	// The user input says: "前端需要处理支付返回请求，路径/payment/success... 需要校验请求参数的签名（由后端来校验？）"
	// So Frontend receives the redirect. Frontend calls Backend API.

	utils.Success(c, gin.H{"status": "paid"})
}

func (ctrl *PaymentController) GetOrders(c *gin.Context) {
	userID, _ := c.Get("userID")
	orders, err := ctrl.Service.GetUserOrders(userID.(uint))
	if err != nil {
		utils.Error(c, 500, err.Error())
		return
	}

	utils.Success(c, orders)
}

func (ctrl *PaymentController) CancelOrder(c *gin.Context) {
	userID, _ := c.Get("userID")
	orderID := c.Param("id")

	if err := ctrl.Service.CancelOrder(userID.(uint), orderID); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, nil)
}
