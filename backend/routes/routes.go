package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/zhifeiji/auradraw/backend/controllers"
	"github.com/zhifeiji/auradraw/backend/middleware"
	"github.com/zhifeiji/auradraw/backend/services"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Global Middleware
	r.Use(middleware.CORSMiddleware())

	// Init Controllers
	authCtrl := controllers.AuthController{}
	userCtrl := controllers.UserController{}
	posterService, _ := services.NewPosterService() // Error ignored - service will use mock generation if Gemini not configured
	posterCtrl := controllers.PosterController{
		Service: posterService,
	}
	payCtrl := controllers.PaymentController{
		Service: services.NewPaymentService(),
	}

	// Callbacks
	r.POST("/api/callback/alipay", payCtrl.AlipayCallback)

	api := r.Group("/api/v1")
	{
		// Auth Routes (Public)
		auth := api.Group("/auth")
		{
			auth.POST("/send-code", authCtrl.SendCode)
			auth.POST("/register", authCtrl.Register)
			auth.POST("/password/reset", authCtrl.ResetPassword)
			auth.POST("/login", authCtrl.Login)
		}

		// Public Payment Routes
		api.GET("/payment/products", payCtrl.GetProducts)
		// Frontend will call this to verify return params
		api.GET("/payment/return/alipay", payCtrl.AlipayReturn)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth (Protected)
			protected.POST("/auth/password/change", authCtrl.ChangePassword)

			// User
			protected.GET("/users/me", userCtrl.GetMe)

			// Poster
			protected.POST("/posters/generate", posterCtrl.Generate)
			protected.GET("/posters", posterCtrl.List)
			protected.GET("/posters/:id", posterCtrl.GetDetail)

			// Payment
			protected.GET("/account/balance", payCtrl.GetBalance)
			protected.POST("/payment/charge", payCtrl.Charge)
			protected.GET("/orders", payCtrl.GetOrders)
			protected.POST("/orders/:id/cancel", payCtrl.CancelOrder)
		}
	}

	return r
}
