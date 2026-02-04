package main

import (
	"log"

	"github.com/zhifeiji/auradraw/backend/config"
	"gorm.io/driver/mysql"
	"gorm.io/gen"
	"gorm.io/gorm"
)

func main() {
	// 1. Load Config
	config.LoadConfig()

	// 2. Connect DB
	dsn := config.AppConfig.DatabaseDSN
	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// 3. Configure Gen
	g := gen.NewGenerator(gen.Config{
		OutPath:      "./models/query", // Output query code
		ModelPkgPath: "./models",       // Output model code
		Mode:         gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface,
	})

	// 4. Use DB
	g.UseDB(db)

	// 5. Generate all tables
	// You can also specify tables: g.GenerateModel("user")
	g.ApplyBasic(g.GenerateAllTable()...)

	// 6. Execute
	g.Execute()
}
