package utils

import (
	"os"
	"path/filepath"

	"github.com/zhifeiji/auradraw/backend/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Initialize with a Nop logger to prevent nil pointer dereference before InitLogger is called
var Logger *zap.Logger = zap.NewNop()

func InitLogger() {
	cfg := config.AppConfig

	// Ensure log directory exists
	if _, err := os.Stat(cfg.LogDir); os.IsNotExist(err) {
		_ = os.MkdirAll(cfg.LogDir, 0755)
	}

	logPath := filepath.Join(cfg.LogDir, cfg.LogFilename)

	// Lumberjack logger for rotation
	hook := lumberjack.Logger{
		Filename:   logPath,
		MaxSize:    cfg.LogMaxSize,    // megabytes
		MaxBackups: cfg.LogMaxBackups, // number of backups
		MaxAge:     cfg.LogMaxAge,     // days
		Compress:   true,              // disabled by default
	}

	// Encoder config (JSON)
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	// Level config
	var level zapcore.Level
	switch cfg.LogLevel {
	case "debug":
		level = zap.DebugLevel
	case "info":
		level = zap.InfoLevel
	case "warn":
		level = zap.WarnLevel
	case "error":
		level = zap.ErrorLevel
	default:
		level = zap.InfoLevel
	}

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(&hook),
		level,
	)

	// Create logger
	Logger = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))
	
	// Replace global zap logger
	zap.ReplaceGlobals(Logger)
}

// Sync flushes buffer, should be called on exit
func SyncLogger() {
	if Logger != nil {
		_ = Logger.Sync()
	}
}
