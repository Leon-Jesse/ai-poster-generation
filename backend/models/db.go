package models

import (
	"log"
	
	"github.com/zhifeiji/auradraw/backend/config"
	"github.com/zhifeiji/auradraw/backend/utils"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"moul.io/zapgorm2"
)

var DB *gorm.DB

func InitDB() {
	var err error
	dsn := config.AppConfig.DatabaseDSN
	
	// Use zap logger for GORM
	logger := zapgorm2.New(utils.Logger)
	logger.SetAsDefault() // optional: configure gorm to use this logger

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger,
	})

	if err != nil {
		utils.Logger.Fatal("Failed to connect to database", 
			// zap.Error(err), // You can add zap.Error if you import zap in this file
		)
		// Or use log.Fatalf if you want standard exit
		log.Fatalf("Failed to connect to database: %v", err)
	}

	utils.Logger.Info("Database connection established")
}
