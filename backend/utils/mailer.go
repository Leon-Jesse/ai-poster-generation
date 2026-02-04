package utils

import (
	"bytes"
	"html/template"
	"sync"

	"github.com/spf13/viper"
	"github.com/zhifeiji/auradraw/backend/config"
	"go.uber.org/zap"
	"gopkg.in/gomail.v2"
)

type EmailTemplate struct {
	Subject string `mapstructure:"subject"`
	Body    string `mapstructure:"body"`
}

var (
	emailTemplates map[string]EmailTemplate
	templateOnce   sync.Once
)

func LoadEmailTemplates() {
	templateOnce.Do(func() {
		v := viper.New()
		v.SetConfigFile("config/email_templates.yaml")
		v.AddConfigPath(".")
		v.AddConfigPath("./backend") // For running from root

		if err := v.ReadInConfig(); err != nil {
			Logger.Error("Failed to read email templates", zap.Error(err))
			return
		}

		if err := v.UnmarshalKey("templates", &emailTemplates); err != nil {
			Logger.Error("Failed to unmarshal email templates", zap.Error(err))
		}
	})
}

func SendEmail(to, templateName string, data interface{}) error {
	// Ensure templates are loaded
	LoadEmailTemplates()

	tmpl, ok := emailTemplates[templateName]
	if !ok {
		Logger.Error("Email template not found", zap.String("template", templateName))
		return nil // Or return error
	}

	// Parse body template
	t, err := template.New("email").Parse(tmpl.Body)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		return err
	}

	cfg := config.AppConfig
	m := gomail.NewMessage()
	m.SetHeader("From", cfg.SMTPFrom)
	m.SetHeader("To", to)
	m.SetHeader("Subject", tmpl.Subject)
	m.SetBody("text/html", body.String())

	d := gomail.NewDialer(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUsername, cfg.SMTPPassword)

	// Send email
	if err := d.DialAndSend(m); err != nil {
		Logger.Error("Failed to send email", 
			zap.String("to", to), 
			zap.String("template", templateName), 
			zap.Error(err),
		)
		return err
	}

	Logger.Info("Email sent successfully", 
		zap.String("to", to), 
		zap.String("template", templateName),
	)
	return nil
}
