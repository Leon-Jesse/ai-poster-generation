package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	// Database Configs
	DBHost     string `mapstructure:"DB_HOST"`
	DBPort     string `mapstructure:"DB_PORT"`
	DBUser     string `mapstructure:"DB_USER"`
	DBPassword string `mapstructure:"DB_PASSWORD"`
	DBName     string `mapstructure:"DB_NAME"`

	// Derived DSN
	DatabaseDSN string

	// Server Configs
	ServerPort              string `mapstructure:"PORT"`
	JWTSecret               string `mapstructure:"JWT_SECRET"`
	JWTExpireHours          int    `mapstructure:"JWT_EXPIRE_HOURS"`
	JWTIssuer               string `mapstructure:"JWT_ISSUER"`
	VerifyCodeLength        int    `mapstructure:"VERIFY_CODE_LENGTH"`
	VerifyCodeExpireMinutes int    `mapstructure:"VERIFY_CODE_EXPIRE_MINUTES"`
	OrderExpireMinutes      int    `mapstructure:"ORDER_EXPIRE_MINUTES"`
	InitialBalance          int64  `mapstructure:"INITIAL_BALANCE"`

	// Logger Configs
	LogDir        string `mapstructure:"LOG_DIR"`
	LogFilename   string `mapstructure:"LOG_FILENAME"`
	LogMaxSize    int    `mapstructure:"LOG_MAX_SIZE"`    // MB
	LogMaxBackups int    `mapstructure:"LOG_MAX_BACKUPS"` // Count
	LogMaxAge     int    `mapstructure:"LOG_MAX_AGE"`     // Days
	LogLevel      string `mapstructure:"LOG_LEVEL"`       // debug, info, warn, error

	// SMTP Configs
	SMTPHost     string `mapstructure:"SMTP_HOST"`
	SMTPPort     int    `mapstructure:"SMTP_PORT"`
	SMTPUsername string `mapstructure:"SMTP_USERNAME"`
	SMTPPassword string `mapstructure:"SMTP_PASSWORD"`
	SMTPFrom     string `mapstructure:"SMTP_FROM"`

	// Alipay Configs
	AlipayAppID        string `mapstructure:"ALIPAY_APP_ID"`
	AlipayPrivateKey   string `mapstructure:"ALIPAY_PRIVATE_KEY"`
	AlipayPublicKey    string `mapstructure:"ALIPAY_PUBLIC_KEY"`
	AlipayEncryptKey   string `mapstructure:"ALIPAY_ENCRYPT_KEY"`
	AlipayNotifyURL    string `mapstructure:"ALIPAY_NOTIFY_URL"`
	AlipayReturnURL    string `mapstructure:"ALIPAY_RETURN_URL"`
	AlipayGateway      string `mapstructure:"ALIPAY_GATEWAY"`
	AlipayIsProduction bool   `mapstructure:"ALIPAY_IS_PRODUCTION"`

	// Products
	Products map[int]ProductConfig
}

type ProductConfig struct {
	Amount      int64  `json:"amount"`       // Price in cents
	Credits     int64  `json:"credits"`      // Credits to add
	Subject     string `json:"subject"`      // Order Subject
	ProductCode string `json:"product_code"` // Alipay Product Code
}

var AppConfig *Config

func LoadConfig() {
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./backend") // For running from root

	// Default values
	viper.SetDefault("DB_HOST", "127.0.0.1")
	viper.SetDefault("DB_PORT", "3306")
	viper.SetDefault("DB_USER", "root")
	viper.SetDefault("DB_PASSWORD", "")
	viper.SetDefault("DB_NAME", "auradraw")
	viper.SetDefault("PORT", ":8080")
	viper.SetDefault("JWT_SECRET", "your_super_secret_key_change_in_production")
	viper.SetDefault("JWT_EXPIRE_HOURS", 24)
	viper.SetDefault("JWT_ISSUER", "auradraw")
	viper.SetDefault("VERIFY_CODE_LENGTH", 6)
	viper.SetDefault("VERIFY_CODE_EXPIRE_MINUTES", 5)
	viper.SetDefault("ORDER_EXPIRE_MINUTES", 15)
	viper.SetDefault("INITIAL_BALANCE", 0)

	// Logger Defaults
	viper.SetDefault("LOG_DIR", "logs")
	viper.SetDefault("LOG_FILENAME", "app.log")
	viper.SetDefault("LOG_MAX_SIZE", 100) // 100 MB
	viper.SetDefault("LOG_MAX_BACKUPS", 3)
	viper.SetDefault("LOG_MAX_AGE", 28) // 28 Days
	viper.SetDefault("LOG_LEVEL", "info")

	// SMTP Defaults
	viper.SetDefault("SMTP_HOST", "smtp.example.com")
	viper.SetDefault("SMTP_PORT", 587)
	viper.SetDefault("SMTP_USERNAME", "user@example.com")
	viper.SetDefault("SMTP_PASSWORD", "password")
	viper.SetDefault("SMTP_FROM", "auradraw@example.com")

	// Alipay Defaults
	viper.SetDefault("ALIPAY_APP_ID", "your_app_id")
	viper.SetDefault("ALIPAY_PRIVATE_KEY", "your_private_key")
	viper.SetDefault("ALIPAY_PUBLIC_KEY", "your_public_key")
	viper.SetDefault("ALIPAY_ENCRYPT_KEY", "")
	viper.SetDefault("ALIPAY_NOTIFY_URL", "https://auradraw.aqlicai.tech/api/callback/alipay")
	viper.SetDefault("ALIPAY_RETURN_URL", "http://localhost:5173/payment/success")
	viper.SetDefault("ALIPAY_GATEWAY", "")
	viper.SetDefault("ALIPAY_IS_PRODUCTION", true)

	// Read from env file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("No .env file found, using defaults or system environment variables")
		} else {
			log.Fatalf("Fatal error config file: %v", err)
		}
	}

	// Read from system environment variables (override config file)
	viper.AutomaticEnv()

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}

	// Construct DSN with Asia/Shanghai timezone
	// Format: user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	// loc=Asia%2FShanghai URL encoded
	AppConfig.DatabaseDSN = fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Asia%%2FShanghai",
		AppConfig.DBUser,
		AppConfig.DBPassword,
		AppConfig.DBHost,
		AppConfig.DBPort,
		AppConfig.DBName,
	)

	// Initialize Products
	loadProductConfig()
}

func loadProductConfig() {
	v := viper.New()
	v.SetConfigFile("config/product.yaml")
	v.AddConfigPath("config")
	v.AddConfigPath("./backend/config")

	if err := v.ReadInConfig(); err != nil {
		log.Printf("Failed to read product config: %v, using default products", err)
		AppConfig.Products = map[int]ProductConfig{
			3: {Amount: 1000, Credits: 100, Subject: "100 Credits - Starter Plan", ProductCode: "FAST_INSTANT_TRADE_PAY"},
			4: {Amount: 5000, Credits: 500, Subject: "500 Credits - Pro Plan", ProductCode: "FAST_INSTANT_TRADE_PAY"},
			5: {Amount: 10000, Credits: 1000, Subject: "1000 Credits - Enterprise Plan", ProductCode: "FAST_INSTANT_TRADE_PAY"},
		}
		return
	}

	var productList struct {
		Products []struct {
			ID          int    `mapstructure:"id"`
			Amount      int64  `mapstructure:"amount"`
			Credits     int64  `mapstructure:"credits"`
			Subject     string `mapstructure:"subject"`
			ProductCode string `mapstructure:"product_code"`
		} `mapstructure:"products"`
	}

	if err := v.Unmarshal(&productList); err != nil {
		log.Fatalf("Unable to decode product config: %v", err)
	}

	AppConfig.Products = make(map[int]ProductConfig)
	for _, p := range productList.Products {
		AppConfig.Products[p.ID] = ProductConfig{
			Amount:      p.Amount,
			Credits:     p.Credits,
			Subject:     p.Subject,
			ProductCode: p.ProductCode,
		}
	}
}
