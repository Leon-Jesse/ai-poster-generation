# CoverDesigner 后端接口文档 (API Documentation)

本文档定义了 CoverDesigner 系统的后端 API 接口。

## 1. 通用说明 (General)

*   **Base URL**: `/api/v1`
*   **Content-Type**: `application/json` (除非另有说明)
*   **Authentication**: Bearer Token 机制。需要在 Header 中携带 `Authorization: Bearer <token>`。
*   **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
*   **Response Header**: `XLogID: <unique-log-id>`

### 1.1 统一响应格式 (Standard Response)

所有接口（除特殊回调外）均返回如下 JSON 结构：

```json
{
  "code": 0,          // 0 表示成功，非 0 表示错误码
  "message": "success", // 错误描述或提示信息
  "data": { ... }     // 具体的业务数据
}
```

---

## 2. 认证模块 (Auth)

### 2.1 发送验证码
**POST** `/auth/sendcode`

发送邮箱验证码，用于注册或登录。

**Request:**
```json
{
  "email": "user@example.com",
  "type": "register" // register, login, reset_password
}
```

**Response:**
```json
{
  "code": 0,
  "message": "验证码已发送",
  "data": null
}
```

### 2.2 邮箱注册
**POST** `/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "code": "123456" // 邮箱验证码
}
```

**Response:**
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "status": "enabled"
    }
  }
}
```

### 2.3 邮箱登录
**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
  // 或者使用验证码登录: "code": "123456"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

### 2.4 Google 登录
**POST** `/auth/google`

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..." // Google 返回的 ID Token
}
```

**Response:**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "provider": "google"
    }
  }
}

### 2.5 重置密码
**POST** `/auth/password/reset`

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456", // 验证码
  "new_password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "密码重置成功",
  "data": null
}
```

### 2.6 获取当前用户信息
**GET** `/users/me`

**Headers:**
`Authorization: Bearer <token>`

**Response:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "provider": "email",
    "balance": 100, // 当前剩余点数
    "created_at": "2023-10-27T10:00:00Z"
  }
}
```

---

## 3. 海报生成模块 (Poster)

### 3.1 提交生成任务
**POST** `/posters/generate`

**Headers:**
`Authorization: Bearer <token>`

**Request:**
```json
{
  "prompt": "A futuristic city with flying cars, cyberpunk style",
  "style": "cyberpunk", // 风格: realistic, anime, cyberpunk, etc.
  "aspect_ratio": "16:9", // 1:1, 9:16, 16:9
  "reference_image": "https://example.com/ref.jpg" // 可选
}
```

**Response:**
```json
{
  "code": 0,
  "message": "任务已提交",
  "data": {
    "id": 101,
    "status": "pending",
    "cost": 10 // 预扣除点数
  }
}
```

### 3.2 获取生成历史列表
**GET** `/posters`

**Headers:**
`Authorization: Bearer <token>`

**Query Parameters:**
*   `page`: 页码 (默认 1)
*   `page_size`: 每页数量 (默认 20)

**Response:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 50,
    "items": [
      {
        "id": 101,
        "prompt": {
           "text": "A futuristic city...",
           "style": "cyberpunk"
        },
        "status": "completed", // pending, processing, completed, failed
        "image_url": "https://oss.example.com/images/101.jpg",
        "cost": 10,
        "created_at": "2023-10-27T10:05:00Z"
      }
    ]
  }
}
```

### 3.3 获取海报详情
**GET** `/posters/:id`

**Headers:**
`Authorization: Bearer <token>`

**Response:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 101,
    "user_id": 1,
    "prompt": { ... },
    "status": "completed",
    "image_url": "https://oss.example.com/images/101.jpg",
    "cost": 10,
    "created_at": "2023-10-27T10:05:00Z"
  }
}
```

---

## 4. 支付与账户模块 (Payment & Account)

### 4.1 查询余额
**GET** `/account/balance`

**Headers:**
`Authorization: Bearer <token>`

**Response:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "balance": 150
  }
}
```

### 4.2 创建充值订单
**POST** `/payment/charge`

**Headers:**
`Authorization: Bearer <token>`

**Request:**
```json
{
  "amount": 1000, // 金额，单位：分 (10元)
  "payment_method": "alipay" // alipay, wechat
}
```

**Response:**
```json
{
  "code": 0,
  "message": "订单创建成功",
  "data": {
    "order_id": "ORD202310270001",
    "pay_url": "https://openapi.alipay.com/gateway.do?..." // 支付跳转链接或二维码内容
  }
}
```

### 4.3 支付回调 (Webhook)
**POST** `/payment/callback/:method`

**Description:**
第三方支付平台的回调接口，不需要 Auth Header。

*   `:method`: `alipay` 或 `wechat`

**Response:**
`success` (或支付平台要求的特定格式字符串)

### 4.4 查询交易流水
**GET** `/transactions`

**Headers:**
`Authorization: Bearer <token>`

**Query Parameters:**
*   `page`: 1
*   `page_size`: 20

**Response:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 10,
    "items": [
      {
        "id": 501,
        "type": "recharge", // recharge, consume
        "amount": 1000, // +1000 or -10
        "reference_id": 12345, // Order ID or Poster ID
        "created_at": "2023-10-27T09:00:00Z"
      }
    ]
  }
}
```
