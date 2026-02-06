## CoverDesigner 海报封面生成平台

CoverDesigner 是一个基于 **Go 后端 + React/Vite 前端** 的 AI 海报封面生成平台，集成了 **Google Gemini 图像生成服务**，支持一键生成多种尺寸、多种风格的封面图，并提供工作区、历史记录、订单与积分等完整的产品体验。

> 目前主要面向中文用户，前端也内置中英文切换能力（Language 切换）。

---

### 1. 核心功能概览

- **AI 封面生成**
  - 支持上传用户自拍照片 + 可选风格参考图。
  - 支持填写封面大字、背景场景、情绪/表情、自定义风格指令。
  - 每次点击生成固定返回 **3 张不同风格** 的封面图。
  - 支持多种平台与尺寸：
    - YouTube：16:9
    - 小红书：3:4
    - 经典封面：4:3
    - 抖音/TikTok：9:16

- **免费试用与积分系统**
  - 每个用户拥有 **3 次免费生成次数**，优先消耗免费次数。
  - 免费次数用完后，按每次固定积分消耗（当前为 10 积分/次）。
  - 前端会在首页展示剩余免费次数；余额不足会引导到 Pricing 充值页面。

- **工作区（Workspace）**
  - 展示用户已生成且状态为 **已完成** 的封面图。
  - 仅显示图片地址有效、且图片能正常加载的记录。
  - 支持多种尺寸展示、下载原图，以及分页浏览。

- **历史记录（History）**
  - 以表格形式展示所有生成消费记录（包括 pending/completed/failed）。
  - 支持按 **平台**（YouTube/小红书/抖音/经典）和 **状态**（已完成/处理中/失败）筛选。
  - 每页显示 10 条记录，带上下页切换。
  - 显示每条记录的：平台+尺寸、封面标题、背景场景、情绪、状态、消耗积分、生成时间等。

- **设置与订单统计**
  - 用户资料与安全设置。
  - 订单统计：总订单数、已支付/待支付/已取消的笔数与金额。
  - Credits 统计：总购买、已消费、当前剩余积分。

- **多语言支持**
  - 顶部导航支持 **中文 / English** 切换。
  - 当前以中文为主，英文作为基础辅助手段。

---

### 2. 代码结构说明

项目根目录（`ai_poster_generation/auradraw`）的主要结构如下：

```text
  backend/         # Go 后端服务
    config/        # 配置（包含 Gemini API Key、邮件模板等）
    controllers/   # 控制器层（HTTP 入口，如 poster_controller.go）
    middleware/    # Gin 中间件（认证等）
    models/        # GORM 模型与 query 生成代码
    routes/        # 路由注册（routes.go）
    services/      # 业务服务（PosterService、GeminiService、UserService 等）
    utils/         # 工具与日志（zap logger 等）

  frontend/        # 前端（React + Vite + TypeScript）
    index.html     # 前端入口 HTML（标题已改为 CoverDesigner）
    src/
      App.tsx                  # 路由配置（Home / Workspace / History / Pricing / Settings）
      main.tsx                 # React 应用入口
      components/
        layout/
          Navbar.tsx           # 顶部导航 + 语言切换
          Layout.tsx           # 页面框架与 Footer
      pages/
        Home.tsx               # 首页：表单 + 图片生成 + 示例/结果展示
        Workspace.tsx          # 工作区：已完成封面网格 + 分页
        Gallery.tsx            # 历史记录表格（History）
        user/Settings.tsx      # 用户设置与订单/credits 统计
      services/
        api.ts                 # Axios 封装（含 401 拦截处理）
        authService.ts         # 登录注册/用户信息获取
        posterService.ts       # 海报生成与历史接口
        paymentService.ts      # 余额与支付接口
      store/
        useAuthStore.ts        # Zustand 用户状态（含 remaining_free_trials 等）
      assets/
        images/                # 示例图片（YouTube / 小红书/经典 等）

  doc/
    api_docs.md    # 后端 API 文档（品牌名已更新为 CoverDesigner）
    schema.sql     # 数据库 schema 参考
```

---

### 3. 后端服务说明

#### 3.1 技术栈

- 语言：Go
- Web 框架：Gin
- ORM：GORM
- 日志：zap
- 数据库：MySQL（参考 `doc/schema.sql`）
- AI 服务：Google Gemini（`google.golang.org/genai`）

#### 3.2 关键服务

- `services.GeminiService`
  - 封装与 Gemini 图像生成 API 的交互。
  - `GenerateBeastThumbnails(req GenerateRequest) ([]GeneratedResult, error)`
    - 根据不同风格（`styleDirections`）生成多张缩略图，每次调用返回 3 张。

- `services.PosterService`
  - 负责创建海报记录、计费/免费试用逻辑以及调用 `GeminiService`。
  - `GeneratePoster`：
    - 计算用户已生成次数，判断是否还在免费试用范围内。
    - 若超出免费次数，则检查 `UserBalance` 是否足够。
    - 创建 `Poster` 记录（初始状态 pending），调用 `GeminiService` 同步生成图片。
    - 生成成功后更新 `status=completed`、写入 `image_url`，并返回所有 `thumbnails`。
  - `GetPosters` / `GetAllPosters`：
    - `GetPosters`：仅返回已完成且有有效图片地址的记录（用于 Workspace）。
    - `GetAllPosters`：返回所有状态的记录（用于 History/消费明细）。

- `controllers.PosterController`
  - `POST /api/v1/posters/generate`
    - 接收前端传入的：
      - `platform`（youtube/xiaohongshu/douyin/classic43）
      - `title_text`、`background_text`、`emotion`
      - `selfie_base64`、`style_ref_base64`
      - `advanced_style`
    - 根据 platform 推导 `aspect_ratio`，调用 `PosterService.GeneratePoster`。
    - 返回：
      - `id`, `status`, `cost`, `prompt`，`image_url`（首张图），`thumbnails`（多张）。
  - `GET /api/v1/posters`：工作区列表（已完成）。
  - `GET /api/v1/posters/history`：消费历史（所有状态）。

- `services.UserService`
  - `GetUserProfile` 返回用户、余额、剩余免费次数。
  - 免费次数计算依据已完成且有有效 `image_url` 的 `Poster` 数量。

#### 3.3 配置

配置结构定义在 `backend/config/config.go`，其中：

- `GEMINI_API_KEY`：Gemini API Key（必须配置才能启用真实生成）。
- 其他如数据库、支付宝等配置可参见 `config.go` 与部署脚本。

运行前需保证：

```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
# 以及数据库、支付等其它环境变量
```

---

### 4. 前端说明

#### 4.1 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand（状态管理）
- Axios（HTTP 客户端）

#### 4.2 关键页面

- `Home.tsx`
  - 多步表单：选择平台、填写内容、选择表情（含自定义）、上传照片与风格图、可选高级风格指令。
  - 点击「开始生成封面图」：
    - 调用 `/posters/generate`。
    - 展示加载动画「正在生成 3 张封面图…」。
    - 成功后根据平台在下方对应区域展示 3 张生成图片，并支持下载。

- `Workspace.tsx`
  - 使用 `posterService.list` 获取已完成的 `Posters`。
  - 只渲染：
    - `status === "completed"` 且 `image_url` 非空。
    - `image_url` 为 `http(s)` 或 `data:image`，且图片加载成功。
  - 按网格展示，支持下载和分页。

- `Gallery.tsx`（History）
  - 使用 `posterService.getHistory` 获取消费记录。
  - 顶部有统计信息（当前页消耗、不同状态的数量与积分）。
  - 支持按平台/状态筛选；每页 10 条。

- `Navbar.tsx`
  - 左侧品牌：`CoverDesigner`。
  - 中部导航：Workspace / History / Pricing。
  - 右侧：Language（语言切换）、余额、邮箱、Settings/Logout 或 Login/Register。
  - 语言切换通过 `localStorage("coverdesigner_lang")` 记住。

---

### 5. 安全配置与敏感信息管理

**⚠️ 重要：请勿将包含真实密钥的 `.env` 文件提交到 Git 仓库！**

#### 5.1 环境变量配置

项目使用环境变量管理敏感配置（API Key、数据库密码、支付密钥等）。

**首次配置步骤：**

1. **复制示例文件**：

```bash
# 后端配置
cp backend/.env.example backend/.env

# 前端配置（可选，通常不需要修改）
cp frontend/.env.example frontend/.env
```

2. **编辑 `backend/.env`**，填入你的真实配置值：

```bash
# 必须配置的关键项：
GEMINI_API_KEY="your_real_gemini_api_key"           # Gemini API Key
DB_PASSWORD="your_database_password"                 # 数据库密码
JWT_SECRET="your_jwt_secret_key"                     # JWT 密钥（生产环境必须修改）
SMTP_PASSWORD="your_email_password"                  # 邮件服务密码
ALIPAY_PRIVATE_KEY="your_alipay_private_key"        # 支付宝私钥
ALIPAY_ENCRYPT_KEY="your_alipay_encrypt_key"        # 支付宝加密密钥
```

3. **验证 `.gitignore`**：

确保 `.gitignore` 已包含以下规则（项目已配置）：

```gitignore
.env
.env.*
*.env
backend/.env
frontend/.env
```

**如果 `.env` 文件已经被提交到 Git：**

1. **立即轮换所有已泄露的密钥**（Gemini API Key、支付宝密钥、邮箱密码等）。
2. **从 Git 历史中移除敏感文件**（使用 `git filter-repo` 或联系仓库管理员）。
3. **确保 `.gitignore` 已更新**，避免未来再次提交。

#### 5.2 生产环境部署建议

- 使用环境变量注入工具（如 Kubernetes Secrets、Docker Secrets、AWS Secrets Manager）。
- 不要在代码仓库中硬编码任何密钥。
- 定期轮换 API Key 和密码。
- 使用不同的密钥用于开发、测试、生产环境。

---

### 6. 服务启动流程

以下命令请在 `auradraw` 目录下执行（或根据你的实际项目根目录调整）：

#### 6.1 启动 MySQL 数据库

**方式1：使用 Docker Compose（推荐）**

1. 进入 `doc` 目录，使用 Docker Compose 启动 MySQL：

```bash
cd doc
# 设置 MySQL root 密码（可选，默认使用 changeme_in_production）
export MYSQL_ROOT_PASSWORD="your_mysql_password"
docker-compose up -d
```

2. 等待 MySQL 容器启动完成（约 10-30 秒），检查状态：

```bash
docker-compose ps
# 或
docker ps | grep mysql
```

3. **登录 MySQL 并初始化数据库表**：

```bash
# 方式1：使用 docker exec 直接执行 SQL 文件（推荐）
cd /path/to/ai_poster_generation/auradraw/doc
docker exec -i local-mysql8 mysql -uroot -p${MYSQL_ROOT_PASSWORD:-changeme_in_production} < schema.sql

# 方式2：交互式登录 MySQL
docker exec -it local-mysql8 mysql -uroot -p${MYSQL_ROOT_PASSWORD:-changeme_in_production}

# 在 MySQL 命令行中执行：
mysql> CREATE DATABASE IF NOT EXISTS auradraw DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> USE auradraw;
mysql> SOURCE /path/to/your/project/doc/schema.sql;
# 或者直接复制 schema.sql 的内容粘贴执行
```

4. 验证表是否创建成功：

```bash
docker exec -it local-mysql8 mysql -uroot -p${MYSQL_ROOT_PASSWORD:-changeme_in_production} -e "USE auradraw; SHOW TABLES;"
```

应该看到以下表：
- `user`
- `user_credential`
- `user_balance`
- `poster`
- `order`
- `transaction`
- `verify_code`

**方式2：使用本地 MySQL**

如果你已安装 MySQL，可以直接执行：

```bash
mysql -uroot -p < doc/schema.sql
```

#### 6.2 启动后端

1. 确保已安装 Go（1.21+ 建议），且 MySQL 已启动并完成表初始化。
2. **配置环境变量**：

```bash
# 方式1：使用 .env 文件（推荐，开发环境）
# 确保已创建 backend/.env 并填入配置（参考 backend/.env.example）

# 方式2：直接设置环境变量（生产环境推荐）
export GEMINI_API_KEY="your_gemini_api_key"
export DB_PASSWORD="your_database_password"
# 其他配置参见 backend/config/config.go
```

4. 在 `backend` 目录下编译并启动：

```bash
cd backend
go mod tidy
go build ./...
# 根据项目提供的脚本启动（示例）
make build          # 若有 Makefile
cd build_dist && ./start.sh start  # 或直接运行编译出的二进制
```

> 注意：项目中部分 GORM query 生成代码（如 `models/query/gen.go`）可能在未完全配置时编译报错，如遇此类问题可先按现有 README/脚本的方式运行已打包好的服务，或者根据实际需要修复生成代码。

#### 6.3 启动前端（开发模式）

1. 进入前端目录：

```bash
cd frontend
npm install   # 或 pnpm/yarn
```

2. 确保 `vite.config.ts` 中的代理指向后端地址（当前为 `http://localhost:8081`）。

3. 启动开发服务器：

```bash
npm run dev
```

4. 浏览器访问：

```text
http://localhost:5173
```

#### 6.4 使用 Docker 启动前端（可选）

项目中提供了 `frontend/docker-compose.yml` 和 `nginx.conf` 用于在容器中运行前端，同时通过 `host.docker.internal` 访问本机运行的后端：

```bash
cd frontend
docker-compose up --build -d
```

前端将通过 Nginx 暴露在 `http://localhost:5173`（映射到容器内的 80 端口），所有 `/api` 请求会被反向代理到 `http://host.docker.internal:8081/api/`。

**注意**：
- Mac/Windows 系统自带 `host.docker.internal` 支持，可直接使用。
- Linux 系统需要在 `docker-compose.yml` 中添加 `extra_hosts` 配置（项目已配置）。

---

### 7. 接口测试（Postman/Thunder Client）

建议按以下顺序测试：

1. **用户注册 / 登录**
   - `POST /api/v1/auth/sendcode`
   - `POST /api/v1/auth/register` 或 `POST /api/v1/auth/login`
   - 记录返回的 `token`。

2. **获取当前用户信息**
   - `GET /api/v1/users/me`
   - Headers：`Authorization: Bearer <token>`
   - 确认 `balance`、`remaining_free_trials` 正常返回。

3. **生成封面图**
   - `POST /api/v1/posters/generate`
   - Headers：`Authorization: Bearer <token>`
   - Body（JSON 示例）：

```json
{
  "platform": "youtube",
  "title_text": "我靠这个赚了100万",
  "background_text": "豪华办公室 金色财富主题",
  "emotion": "震惊",
  "selfie_base64": "data:image/png;base64,......",
  "style_ref_base64": null,
  "advanced_style": "蓝金配色，更戏剧化"
}
```

4. **查看工作区与历史**
   - `GET /api/v1/posters?page=1&page_size=12`
   - `GET /api/v1/posters/history?page=1&page_size=10`

---

### 8. 命名与品牌约定

- 新品牌名称统一使用：**CoverDesigner**。

---

### 9. 后续可优化方向（建议）

- 接入更多模型或不同质量/速度档位（例如快速草图 vs 高质量图）。
- 增加队列与异步任务支持，在高并发场景下更稳定。
- 完善多语言国际化（使用 i18n 库统一管理文案）。
- 为 Workspace/History 增加更多筛选条件（按时间范围、积分区间等）。

如需进一步扩展某一部分（例如支付对接、运营后台、或者更详细的 API 文档），可以在此 README 基础上继续拆分到 `docs/` 子目录。

