package main

import (
	"fmt"

	"github.com/zhifeiji/auradraw/backend/config"
	"github.com/zhifeiji/auradraw/backend/models"
	"github.com/zhifeiji/auradraw/backend/routes"
	"github.com/zhifeiji/auradraw/backend/utils"
	"go.uber.org/zap"
)

func main() {
	// 1. Load Config
	config.LoadConfig()

	// 2. Init Logger
	utils.InitLogger()
	defer utils.SyncLogger()

	// 3. Init DB
	models.InitDB()

	// 4. Setup Router
	r := routes.SetupRouter()

	// 5. Run Server
	addr := config.AppConfig.ServerPort
	utils.Logger.Info(fmt.Sprintf("Server starting on %s", addr))
	if err := r.Run(addr); err != nil {
		utils.Logger.Fatal("Server failed to start", zap.Error(err))
	}
}
