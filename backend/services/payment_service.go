package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"time"

	"github.com/smartwalle/alipay/v3"
	"github.com/zhifeiji/auradraw/backend/config"
	"github.com/zhifeiji/auradraw/backend/models"
)

type PaymentService struct {
	Client *alipay.Client
}

func NewPaymentService() *PaymentService {
	var client *alipay.Client
	var err error

	if config.AppConfig.AlipayAppID != "" {
		var opts []alipay.OptionFunc
		if config.AppConfig.AlipayGateway != "" {
			opts = append(opts, alipay.WithSandboxGateway(config.AppConfig.AlipayGateway))
		}

		client, err = alipay.New(config.AppConfig.AlipayAppID, config.AppConfig.AlipayPrivateKey, config.AppConfig.AlipayIsProduction, opts...)
		if err != nil {
			log.Println("Error initializing Alipay client:", err)
		} else {
			if config.AppConfig.AlipayPublicKey != "" {
				err = client.LoadAliPayPublicKey(config.AppConfig.AlipayPublicKey)
				if err != nil {
					log.Println("Error loading Alipay public key:", err)
				}
			}
		}

		if config.AppConfig.AlipayEncryptKey != "" {
			err = client.SetEncryptKey(config.AppConfig.AlipayEncryptKey)
			if err != nil {
				log.Println("Error setting Alipay encrypt key:", err)
			}
		}
	}

	return &PaymentService{
		Client: client,
	}
}

func (s *PaymentService) GetBalance(userID uint) (int64, error) {
	var balance models.UserBalance
	if err := models.DB.Where("user_id = ?", userID).First(&balance).Error; err != nil {
		return 0, nil
	}
	return balance.Balance, nil
}

func (s *PaymentService) CreateChargeOrder(userID uint, productID int, method string) (*models.Order, string, error) {
	// 1. Get Product Config
	product, ok := config.AppConfig.Products[productID]
	if !ok {
		return nil, "", fmt.Errorf("invalid product id")
	}

	// 2. Create Order
	orderID := fmt.Sprintf("ORD%d%d", userID, time.Now().UnixNano())

	expireMinutes := config.AppConfig.OrderExpireMinutes
	if expireMinutes <= 0 {
		expireMinutes = 15 // Default 15 minutes
	}
	expireAt := time.Now().Add(time.Duration(expireMinutes) * time.Minute)

	productInfoBytes, err := json.Marshal(product)
	if err != nil {
		return nil, "", err
	}
	order := models.Order{
		OrderID:       orderID,
		UserID:        int64(userID),
		Amount:        product.Amount,
		Credits:       product.Credits,
		PaymentMethod: method,
		Status:        string(models.OrderStatusPending),
		ProductInfo:   string(productInfoBytes), // Record Product Info as JSON
		ExpireAt:      expireAt,
	}

	if err := models.DB.Create(&order).Error; err != nil {
		return nil, "", err
	}

	// 3. Generate Pay URL
	var payURL string
	if method == "alipay" {
		if s.Client == nil {
			return nil, "", fmt.Errorf("alipay not configured")
		}

		p := alipay.TradePagePay{}
		p.NotifyURL = config.AppConfig.AlipayNotifyURL
		p.ReturnURL = config.AppConfig.AlipayReturnURL
		p.Subject = product.Subject
		p.OutTradeNo = orderID
		p.TotalAmount = fmt.Sprintf("%.2f", float64(product.Amount)/100.0) // Amount is in cents to Yuan
		p.ProductCode = product.ProductCode
		// Use time.Local for formatting if needed, but time.Now() is already local.
		// However, if server is not in CST, we might need to adjust.
		// Assuming server is in CST or Alipay accepts offset?
		// Alipay docs say: yyyy-MM-dd HH:mm:ss
		// Let's force load Asia/Shanghai location to be safe.
		loc, _ := time.LoadLocation("Asia/Shanghai")
		if loc != nil {
			p.TimeExpire = expireAt.In(loc).Format("2006-01-02 15:04:05")
		} else {
			p.TimeExpire = expireAt.Format("2006-01-02 15:04:05")
		}

		// For sandbox environment, use JSON format if needed, but SDK handles it.
		// However, error INVALID_PARAMETER usually means something is wrong with params.
		// Common issue: TotalAmount format, ProductCode validity.
		// In sandbox, "FAST_INSTANT_TRADE_PAY" is valid.
		// Check if Amount is 0.00?
		// Ensure amount is at least 0.01.

		u, err := s.Client.TradePagePay(p)
		if err != nil {
			return nil, "", err
		}
		payURL = u.String()
	} else {
		// Mock Pay URL
		payURL = fmt.Sprintf("https://mock-pay.com/pay?order_id=%s", orderID)
	}

	// Update PayURL in Order
	if err := models.DB.Model(&order).Update("pay_url", payURL).Error; err != nil {
		return nil, "", err
	}
	order.PayURL = payURL

	return &order, payURL, nil
}

func (s *PaymentService) HandleAlipayCallback(req url.Values) error {
	if s.Client == nil {
		return fmt.Errorf("alipay not configured")
	}

	// Verify Signature
	err := s.Client.VerifySign(req)
	if err != nil {
		return fmt.Errorf("invalid signature: %v", err)
	}

	// Check status
	status := req.Get("trade_status")
	if status != "TRADE_SUCCESS" && status != "TRADE_FINISHED" {
		return nil
	}

	outTradeNo := req.Get("out_trade_no")

	// Transaction
	tx := models.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var order models.Order
	if err := tx.Where("order_id = ?", outTradeNo).First(&order).Error; err != nil {
		tx.Rollback()
		return err
	}

	if order.Status == string(models.OrderStatusPaid) {
		tx.Rollback()
		return nil
	}

	// Update Order Status
	now := time.Now()
	updates := map[string]interface{}{
		"status":  string(models.OrderStatusPaid),
		"paid_at": now,
	}
	if err := tx.Model(&order).Updates(updates).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Add Balance
	var balance models.UserBalance
	if err := tx.Where("user_id = ?", order.UserID).First(&balance).Error; err != nil {
		// Create if not exists
		balance = models.UserBalance{UserID: order.UserID, Balance: order.Credits}
		if err := tx.Create(&balance).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else {
		if err := tx.Model(&balance).Update("balance", balance.Balance+order.Credits).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (s *PaymentService) GetUserOrders(userID uint) ([]models.Order, error) {
	var orders []models.Order
	if err := models.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&orders).Error; err != nil {
		return nil, err
	}

	// Check for expired orders and update status (in-memory or db?)
	// Let's update in DB if expired and still pending.
	// Actually, for query performance, maybe just update status in response struct?
	// But requirements say "return interface status as expired".
	// It's better to lazy update DB or just return calculated status.
	// Let's return modified orders with updated status if expired.
	// Also, if we want to persist the "cancelled" (expired) state, we can do it here.

	now := time.Now()
	for i, order := range orders {
		if order.Status == string(models.OrderStatusPending) && !order.ExpireAt.IsZero() && now.After(order.ExpireAt) {
			// Update status to 'expired' for display
			// Optionally update DB
			// models.DB.Model(&order).Update("status", "cancelled") // Or new status "expired"
			// Let's keep it simple and just show as cancelled or expired in frontend?
			// User said "interface status should be expired".
			// Let's use "cancelled" or introduce "expired".
			// Existing statuses: pending, paid, cancelled.
			// Let's map expired to cancelled or just modify the returned struct field.
			orders[i].Status = string(models.OrderStatusExpired)

			// Optional: Async update DB to 'cancelled' or 'expired'
			go func(o models.Order) {
				models.DB.Model(&o).Update("status", string(models.OrderStatusCancelled))
			}(order)
		}
	}

	return orders, nil
}

func (s *PaymentService) CancelOrder(userID uint, orderID string) error {
	var order models.Order
	if err := models.DB.Where("order_id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		return err
	}

	if order.Status != string(models.OrderStatusPending) {
		return fmt.Errorf("order cannot be cancelled")
	}

	return models.DB.Model(&order).Update("status", string(models.OrderStatusCancelled)).Error
}

func (s *PaymentService) HandleAlipayReturn(req url.Values) error {
	if s.Client == nil {
		return fmt.Errorf("alipay not configured")
	}

	// Verify Signature
	err := s.Client.VerifySign(req)
	if err != nil {
		return fmt.Errorf("invalid signature: %v", err)
	}

	outTradeNo := req.Get("out_trade_no")
	// tradeNo := req.Get("trade_no")

	// Transaction
	tx := models.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var order models.Order
	if err := tx.Where("order_id = ?", outTradeNo).First(&order).Error; err != nil {
		tx.Rollback()
		return err
	}

	if order.Status == string(models.OrderStatusPaid) {
		tx.Rollback()
		return nil
	}

	// Query Alipay for status to be sure (Return URL params might not be enough or trusted for status update without query, but VerifySign helps)
	// But standard practice: Return URL is for UX. Notify URL is for status update.
	// However, if we want to update status synchronously for UX, we can query.
	// Or trust the signed return parameters if they contain success status?
	// Return parameters usually don't have trade_status.
	// So we should query.

	p := alipay.TradeQuery{}
	p.OutTradeNo = outTradeNo
	rsp, err := s.Client.TradeQuery(context.Background(), p)
	if err != nil {
		tx.Rollback()
		return err
	}

	if rsp.TradeStatus != "TRADE_SUCCESS" && rsp.TradeStatus != "TRADE_FINISHED" {
		tx.Rollback()
		return fmt.Errorf("trade not success: %s", rsp.TradeStatus)
	}

	// Update Order Status
	now := time.Now()
	updates := map[string]interface{}{
		"status":  string(models.OrderStatusPaid),
		"paid_at": now,
	}
	if err := tx.Model(&order).Updates(updates).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Add Balance
	var balance models.UserBalance
	if err := tx.Where("user_id = ?", order.UserID).First(&balance).Error; err != nil {
		// Create if not exists
		balance = models.UserBalance{UserID: order.UserID, Balance: order.Credits}
		if err := tx.Create(&balance).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else {
		if err := tx.Model(&balance).Update("balance", balance.Balance+order.Credits).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}
