package models

// VerifyCodeType defines the type of verification code
type VerifyCodeType string

const (
	VerifyCodeTypeRegister      VerifyCodeType = "register"
	VerifyCodeTypeLogin         VerifyCodeType = "login"
	VerifyCodeTypeResetPassword VerifyCodeType = "reset_password"
)

// OrderStatus defines the status of an order
type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusExpired   OrderStatus = "expired"
)

// Validate checks if the verify code type is valid
func (t VerifyCodeType) Validate() bool {
	switch t {
	case VerifyCodeTypeRegister, VerifyCodeTypeLogin, VerifyCodeTypeResetPassword:
		return true
	}
	return false
}
