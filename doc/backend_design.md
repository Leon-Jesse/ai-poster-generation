# 后端技术方案设计 (Backend Technical Design)

## 1. 技术栈 (Tech Stack)
- **Language**: Go 1.21+
- **Framework**: Gin (Web Framework)
- **Database**: MySQL 8.0 (Storage)
- **ORM**: GORM (Data Access)
- **Authentication**: JWT (JSON Web Tokens)
- **Configuration**: Viper (Optional, or standard `os.Getenv`)

## 2. 系统架构 (System Architecture)
采用标准的分层架构 (Layered Architecture)，确保职责分离。

```
backend/
├── config/         # 配置管理 (DB连接串, API Key等)
├── controllers/    # 控制器层：处理HTTP请求，参数校验，响应格式化
├── services/       # 服务层：核心业务逻辑，事务控制
├── models/         # 模型层：数据库表结构定义 (GORM structs)
├── routes/         # 路由层：定义API路径与Handler的映射
├── middleware/     # 中间件：JWT认证, CORS, 请求日志, 错误处理
├── utils/          # 工具类：加密, Token生成, 通用响应封装
└── main.go         # 程序入口
```

## 3. 数据库设计 (Database Schema)

### 3.1 用户基础表 (user)
| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary Key, Auto Increment |
| email | varchar(64) | Unique, Index |
| provider | varchar(16) | 注册来源 (email, google) |
| status | varchar(16) | enabled, disabled |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 3.2 用户凭证表 (user_credential)
| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary Key, Auto Increment |
| user_id | bigint unsigned | FK -> user.id |
| password | varchar(32) | Encrypted Password |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 3.3 用户余额表 (user_balance)
| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary Key, Auto Increment |
| user_id | bigint unsigned | FK -> user.id |
| balance | bigint | 剩余点数 (Credits) |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 3.4 海报生成记录表 (poster)
| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary Key, Auto Increment |
| user_id | bigint unsigned | FK -> user.id |
| prompt | json | 用户输入信息 (包含prompt, style等所有参数) |
| status | varchar(16) | pending, processing, completed, failed |
| image_url | varchar(256) | 生成结果URL (OSS/S3地址) |
| cost | bigint | 消耗额度 (Credits) |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 3.5 充值订单表 (order)
| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary Key, Auto Increment |
| order_id | varchar(32) | 业务订单号 (Unique) |
| user_id | bigint unsigned | FK -> user.id |
| amount | bigint | 充值金额 (人民币分) |
| credits | bigint | 对应增加的额度 (Credits) |
| payment_method | varchar(16) | alipay, wechat |
| status | varchar(16) | pending, paid, cancelled |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 3.6 交易流水表 (transaction)
| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary Key, Auto Increment |
| user_id | bigint unsigned | FK -> user.id |
| type | varchar(16) | recharge (充值), consume (消费) |
| amount | bigint | 变动额度 (+/- Credits) |
| reference_id | bigint unsigned | 关联ID (Order表 ID 或 Poster表 ID) |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

## 4. 核心接口设计 (Core API Design)

### 4.1 用户模块 (Auth)
- `POST /api/v1/auth/register` - 邮箱注册
- `POST /api/v1/auth/login` - 邮箱登录
- `POST /api/v1/auth/google` - Google OAuth登录
- `POST /api/v1/auth/password/reset` - 密码重置

### 4.2 海报模块 (Poster)
- `POST /api/v1/posters/generate` - 提交生成任务
- `GET /api/v1/posters` - 获取生成历史列表
- `GET /api/v1/posters/:id` - 获取单张详情

### 4.3 支付与账户 (Payment & Account)
- `GET /api/v1/account/balance` - 查询余额
- `POST /api/v1/payment/charge` - 创建充值订单
- `POST /api/v1/payment/callback/:method` - 支付回调 (支付宝/微信)
- `GET /api/v1/transactions` - 查询交易流水

## 5. 关键业务流程 (Key Business Flows)

### 5.1 支付流程 (State Machine)
1. 用户发起充值 -> 创建 Order (Status: `pending`)
2. 调用支付接口 -> 返回支付链接/二维码
3. 用户支付成功 -> 支付平台回调
4. **事务处理**:
    - 验证签名与金额
    - 更新 Order Status -> `paid`
    - 更新 User Balance (`balance` + `credits`)
    - 插入 Transaction 记录 (`type`: `recharge`)
5. 返回响应

### 5.2 海报生成流程
1. 用户请求生成 -> Controller 校验参数
2. Service 检查余额 -> 余额不足返回错误
3. **事务处理 (预扣费模式)**:
    - 扣除 User Balance
    - 插入 Transaction (`type`: `consume`)
    - 创建 Poster 记录 (`status`: `processing`)
4. 异步调用 AI API (Midjourney/StableDiffusion)
5. **回调/轮询处理**:
    - 成功: 更新 Poster (`status`: `completed`, `image_url`: url)
    - 失败: 更新 Poster (`status`: `failed`), **回滚余额** (插入退款 Transaction)
