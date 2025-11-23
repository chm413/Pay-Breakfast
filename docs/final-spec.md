# 鸿铭外卖服务平台（Pay-Breakfast）最终规范

本文档结合当前代码实现，总结后端与前端的架构、数据模型、业务流程、安全策略和部署要点，可直接提供给开发或交付团队作为统一规格说明。

## 1. 角色与权限

- **SUPER_ADMIN**：全局管理年级、班级、用户、商家；审核充值；管理班级账号与风控配置。
- **GRADE_ADMIN**：管理本年级班级/学生，查看年级报表，可按配置审核本年级充值。
- **CLASS_FINANCE**：班主任/班委，使用班级账号批量下单，查看本班统计与余额告警。
- **STUDENT**：个人账户、查看余额与流水、提交充值申请。
- **MERCHANT**（可选）：校内档口或打印店，接收消费记录（账务记账）。

> RBAC 采用 `roles` 与 `user_roles`，接口通过 JWT 及简易守卫校验权限。

## 2. 数据模型（MySQL 5.7.43）

### 2.1 用户与学校基础
- `users`：登录账号、姓名、联系方式、状态。
- `roles`/`user_roles`：角色定义与绑定。
- `grades`、`classes`：年级/班级，班级可关联班主任。
- `students`：学号、年级/班级、座位号、家长电话、绑定 `users`。

### 2.2 账户体系
- `accounts`：`type`=`personal|merchant|system`，余额、信用额度、阈值（提醒/危急）、风险等级、状态等。
- `class_accounts`：不存钱，仅限批量下单；含单次人数与金额上限、允许 IP、备注、启用开关。
- `class_account_operators`：班级账号的授权操作者列表。

### 2.3 交易与订单
- `transactions`：所有加减余额的流水；记录账户、对手方、方向、金额、余额后值、来源、操作者。
- `class_group_orders` / `class_group_order_items`：班级批量下单主表与子项，记录成功/失败、原因、关联交易。

### 2.4 充值与风控
- `recharge_requests`：线下支付后提交审核；状态 pending/approved/rejected，记录凭证、审核人、时间与意见。
- `risk_events`：低余额/危急余额/频繁消费等事件，含级别与提示信息。
- `notifications`：站内消息，含标题、内容、已读标记。
- `dormant_account_reports`（可选）：长期未动账户的统计快照。

## 3. 关键业务流程

### 3.1 鉴权
- JWT（访问/刷新令牌），`Authorization: Bearer <token>`。
- 前端登录请求使用后端公开的 RSA 公钥加密密码；后端私钥解密、校验并签发 JWT。
- 新部署时若缺少 RSA 密钥对，将运行时生成临时密钥并在日志输出公钥；生产应通过环境变量提供固定密钥。

### 3.2 账户消费 `consume()`
1. 校验账户状态，计算新余额并确保不超过透支额度。
2. 事务内更新账户余额并写入 `transactions`。
3. 根据阈值落差写入 `risk_events`、发送通知（学生/班主任）。
4. 可扩展频繁消费风控（计数或金额上限）。

### 3.3 充值审核
- 学生提交充值申请，上传凭证 URL；管理员（SUPER_ADMIN 或符合范围的 GRADE_ADMIN）审核。
- 审核通过：事务内入账（`RECHARGE` 流水）、更新申请状态、通知用户；拒绝则写入意见并通知。

### 3.4 班级批量下单
1. 校验操作者具备 `CLASS_FINANCE` 且在 `class_account_operators` 中授权；可选 IP 校验。
2. 校验单次人数/金额不超过 `class_accounts` 限制。
3. 逐项校验学生归属班级及个人账户存在。
4. 事务内创建 `class_group_orders`，为每个子项调用 `consume()`；记录成功/失败原因。
5. 汇总成功金额与人数，更新订单状态（success / partially_success / created / canceled）。

### 3.5 通知与报表
- 低余额/危急余额触发通知；可扩展家长通知。
- 报表示例：班级消费汇总、学生消费列表、死账统计查询等。

## 4. 安全与合规

- **密码传输加密**：前端使用 RSA 公钥加密登录/重置密码相关敏感字段；后端解密后再验证。
- **管理员自动初始化**：首启若不存在 admin，会生成默认管理员并输出随机密码到日志，需及时修改。
- **SMTP 支持**：可配置 SMTP（主机、端口、账号、SSL）发送注册/重置密码邮件；缺省时退回控制台日志模式。
- **WAF/防爆破**：
  - 全局 Helmet 安全头。
  - 关键词过滤（可扩展白/黑名单）。
  - `express-rate-limit` 频率限制；在反向代理环境下通过 `TRUST_PROXY` 开启 `app.set('trust proxy', true)`，并可调整窗口与速率。
  - 可进一步接入 IP 黑名单、验证码、异常 IP 告警等。
- **HTTPS/代理**：建议前置 Nginx/宝塔反代开启 HTTPS，并转发真实 IP 头；若使用 GitHub Pages 前端，需确保后端允许跨域、保持超时与 keep-alive 设置与代理一致。

## 5. 配置与环境变量（示例）

| 变量 | 说明 |
| --- | --- |
| `PORT` | 后端监听端口（默认 3000）。 |
| `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME` | MySQL 5.7.43 连接信息；建议关闭生产环境 TypeORM `synchronize`。 |
| `JWT_SECRET` | JWT 签名密钥。 |
| `RSA_PUBLIC_KEY` / `RSA_PRIVATE_KEY` | RSA 密钥对（PEM）；缺省将生成临时密钥。 |
| `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_SECURE` | 邮件发送配置；未提供则退回日志。 |
| `TRUST_PROXY` | `true` 时启用 `app.set('trust proxy', true)` 以匹配代理 IP，用于 rate-limit。 |
| `REQUEST_TIMEOUT_MS` / `KEEP_ALIVE_TIMEOUT_MS` | HTTP 代理/网关场景下的超时与长连接配置。 |
| `ADMIN_BOOTSTRAP_USER` / `ADMIN_BOOTSTRAP_EMAIL` | 自定义初始管理员账号（可选）。 |

## 6. 前端要点

- 技术栈：React + Vite，基础路径 `./` 便于 GitHub Pages 静态托管。
- 配置：`VITE_API_BASE_URL` 指向后端网关/反代根路径；登录表单使用后端 `/auth/public-key` 获取公钥后进行 RSA 加密提交。
- 页面：登录、仪表盘、个人中心、充值审核、用户管理等，已根据角色调整菜单展示。
- 构建与部署：`npm install && npm run build`（在 `frontend/`）；GitHub Pages 工作流会自动构建 `frontend/dist` 并发布。

## 7. 部署与运维

- **后端**：
  - 构建：`npm install && npm run build`。
  - 运行：`npm start` 或通过 PM2（见 `ecosystem.config.js`）。
  - 生产建议：关闭 TypeORM `synchronize`，开启数据库备份，使用 pm2/系统级守护进程。
- **前端**：
  - GitHub Pages 工作流或自行上传 `frontend/dist` 至静态站点；若自建 Nginx，配置反代 `/api` 指向后端。
- **宝塔/反代**：
  - 启用 HTTPS、设置超时（如 60s）、开启 `trust proxy`。
  - 若遇 502，可调整反代超时、keep-alive，与后端 `REQUEST_TIMEOUT_MS` 保持一致。

## 8. 运维建议与故障排查

- 502/超时：检查反代超时与后端超时、keep-alive、`TRUST_PROXY` 设置。
- 频繁 429：调大 rate-limit 阈值或在可信代理开启 `TRUST_PROXY`。
- 邮件发送失败：核对 SMTP 端口/SSL/账号；日志模式下需手动通知用户。
- 登录失败：确认前端获取公钥是否最新，RSA 密钥是否更新；如重启生成新密钥，需同步前端缓存。
- 余额错误：确保数据库启用事务；消费/充值必须写入 `transactions` 并同步 `accounts.balance`。

## 9. 增量需求：早餐商品、用户管理、下单与注册改造（A–F）

以下为在现有 NestJS + TypeORM 后端、React + Vite 前端基础上的增量规范，可直接交给模型实现。

### A. 早餐种类/价格管理（Admin 专用）

**数据表**

- `breakfast_categories`：`id`, `name`(唯一), `sort_order`(默认0), `enabled`(TINYINT, 默认1), `created_at`, `updated_at`。
- `breakfast_products`：`id`, `category_id`(FK), `name`, `price`(DECIMAL10,2), `unit`(默认`份`), `enabled`(默认1), `remark`(可空), `created_at`, `updated_at`。

> 价格仅存当前值；`enabled=0` 表示下架但保留历史引用。

**Admin 接口**（仅 ADMIN/MANAGER）：

- `GET /admin/categories`
- `POST /admin/categories` `{ name, sortOrder?, enabled? }`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`（可软删或置 `enabled=0`）
- `GET /admin/products?categoryId=&enabled=`
- `POST /admin/products` `{ categoryId, name, price, unit?, enabled?, remark? }`
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`（软删/下架）

**前端页面**

- 新增菜单：早餐分类管理、早餐商品管理。表格支持新增/编辑/禁用，商品表可按分类过滤并显示名称/分类/价格/单位/状态/备注/操作。

### B. 用户管理增强：手动创建 + 敏感信息分级

**手动创建用户接口** `POST /admin/users`

请求体：`{ username, realName, email, role: ADMIN|MANAGER|MEMBER, initialBalance, creditLimit, classOrDorm }`

规则：

1. 仅 ADMIN/MANAGER 可调用；`username` 唯一。
2. 创建 `users` + 绑定角色 + 创建个人账户（余额=initialBalance，透支=creditLimit）。
3. 返回随机初始密码（8–12 位）或允许自定义；可选发送通知/邮件告知。

**敏感字段分级**

- 敏感字段：邮箱、手机号、余额、透支额度、风险/欠款详情、还款凭证链接等。
- `GET /admin/users`：有权限返回全部字段；无权限返回 `403 { code: "NO_PERMISSION", message: "无权查看敏感信息" }`。
- `GET /users/me`/`GET /members/:id`：普通成员只能看到自己的敏感字段，查看他人时自动裁剪。

**前端显示规则**

- 无 admin/manager 权限则隐藏“用户管理”菜单；若直接访问路由，显示红色警告条“你没有权限查看此页面，已记录本次访问。”并在接口返回 403 时保持警告。

### C. 注册流程：邮箱验证码 + 注册

**新表** `email_verification_codes`：`id`, `email`, `code`(6–8 位), `purpose`(REGISTER/RESET_PWD), `expires_at`, `created_at`，索引 `email+purpose`、`expires_at`。

**接口**

1. `POST /auth/register/request-code` `{ email }`
   - 若 email 已注册 → 返回 `EMAIL_EXISTS`。
   - 限流：同一 email 60 秒 1 次，同一 IP 每小时 N 次。
   - 生成 code 写表并发邮件。
2. `POST /auth/register` `{ email, code, username, password, realName }`
   - 校验验证码存在、未过期、purpose=REGISTER；通过后作废验证码。
   - 创建用户与个人账户（默认余额 0，透支可用系统默认 30）。
   - 返回登录 token。

**前端注册 UI**

- 步骤：输入邮箱→获取验证码（倒计时）；填写验证码+用户名+密码+姓名完成注册；验证码错误/过期提示重发。

### D. 示例/种子数据缩减

- 默认商品示例 3–5 个（如肉包4、菜包3、豆浆2.5）。
- 默认用户：1 个 admin，2 个 member，余额 10/20，透支不超 30；避免上百用户或上千金额。

### E. 下单模型与页面改造

**数据表**

- `orders`：`id`, `order_type`(PERSONAL/BATCH), `creator_user_id`, `target_user_id`(PERSONAL=自己，BATCH 可空), `remark`(每单备注), `total_amount`, `status`(created/partially_success/success/canceled), `created_at`, `updated_at`。
- `order_items`：`id`, `order_id`, `personal_account_id`, `product_id`, `quantity`, `unit_price`（锁价）, `amount`, `item_remark`(可空), `transaction_id`(成功时), `status`(pending/success/failed), `fail_reason`, `created_at`, `updated_at`。

> 单价在下单时锁定；订单备注与单品备注分离。

**个人下单 `POST /orders`**

- 请求：`{ items: [{ productId, quantity, itemRemark? }...], remark }`。
- 仅登录用户给自己下单；逐项扣个人账户。全部失败→`canceled`，部分失败→`partially_success`，全部成功→`success`；返回成功/失败原因。

**批量下单 `POST /admin/batch-orders`**

- 请求：`{ targets: [{ userId, items: [...] }...], remark }`。
- 仅 admin/manager；逐用户扣款并标记失败原因。可沿用现有“单次最多 N 人、总额上限 M”安全限制。

**前端页面**

- 个人下单：商品列表来自 `/products`（仅 enabled=1），支持数量、单品备注、整单备注，提交后展示成功/失败条目。
- 批量下单：左侧选人、右侧选商品，可复制上一人组合，展示成功/失败及总金额；支持每单备注。

### F. 权限不足时的统一警告

- 敏感页面（用户管理、还款审核、批量下单、商品管理）若检测无权限：菜单隐藏；强行访问时显示警告条并在接口返回 403 后保持，后端返回 `{ code: "NO_PERMISSION", message: "你无权访问该资源" }`，并可记录操作日志。

## 10. 增量补丁：订餐需求、模板复用、提醒与多账本

以下为在现有 Pay-Breakfast 基础上追加的增量改造，按表结构、接口、前端表现与业务规则列出，直接叠加即可。

### 1) 订餐需求申报与一键转订单

**新表 `order_requests`**（如已有同名表，补齐字段）：

- `id` BIGINT PK
- `ledger_id` BIGINT NOT NULL
- `user_id` BIGINT NOT NULL
- `request_date` DATE NOT NULL
- `items_json` TEXT NOT NULL（JSON 数组：`[{ productId, quantity, itemRemark? }]`）
- `remark` VARCHAR(255) NULL
- `status` ENUM('PENDING','ACCEPTED','REJECTED','CANCELED') DEFAULT 'PENDING'
- `created_at`, `updated_at`
- 索引：`(ledger_id, request_date, status)`

**接口**

- 成员提交：`POST /api/order-requests`，成员只能提交自己的，默认每人每天最多 3 条（可配置）。
- 管理端查看：`GET /api/admin/order-requests?date=YYYY-MM-DD&status=PENDING`。
- 单条转订单：`POST /api/admin/order-requests/:id/convert-to-order`，读取 `items_json` 走批量下单逻辑，成功则置 `ACCEPTED`，失败返回原因保留 `PENDING`。
- 批量转订单：`POST /api/admin/order-requests/batch-convert` `{ date, requestIds[], remark }`，将选定需求合并生成一笔 BATCH 订单。

**前端**

- 成员端新增“我要订早餐”页：选择商品/数量/备注后提交需求。
- 管理端新增“今日订餐队列”页：列表勾选并一键生成订单。

### 2) 订单模板/复用

- `GET /api/orders/last`：成员复用自己最近一笔成功个人订单的 items。
- `GET /api/admin/orders/template?date=YYYY-MM-DD`：管理员获取某日订单的聚合模板（按 productId 汇总）。
- 前端：个人下单页“复用上次”；批量下单页“复用某天”。

### 3) 对账提示助手

- 后端：`GET /api/admin/repayment-applications/:id/hints` 返回 `possibleMatches[]`（金额/时间接近的成员）、`duplicateTradeNo`、`riskTip`。
- 前端：审核弹窗展示黄色提示卡，辅助人工判断。

### 4) 欠款上限与自动提醒/禁单

- 下单前统一校验：`balance - orderTotal >= -credit_limit`，否则整单拒绝 `DEBT_LIMIT_EXCEEDED`。
- 新配置：`AUTO_BLOCK_ON_DANGER_DEBT`（默认 true）、`DANGER_DEBT_THRESHOLD`（默认=credit_limit）。当余额 < -阈值时写风险事件，且可禁止新订单。
- 欠款越过提醒/危急阈值时给成员发送通知；欠款列表 danger 优先置顶。

### 5) 还款审核一键全额通过

- 若已支持部分通过，增加“默认全额通过”行为：审核面板提供“一键全额通过”按钮；不改金额直接通过时等价于全额通过。

### 6) 退款/冲正权限强化

- 仅 OWNER 可对任意交易冲正；MANAGER 仅能冲正“自己创建订单产生的交易”。
- 前端：交易详情增加“冲正/退款”按钮，必填 reason。

### 7) 周/月报表 + 导出 + 欠款群消息

- 报表接口：`GET /api/admin/reports/summary?from=&to=` 增补 `byPayMethod[]`、`byProduct[]`、`topMembers[]`。
- 导出：`GET /api/admin/reports/summary/export?from=&to=&format=csv` 返回 CSV 流。
- 欠款群消息：`GET /api/admin/reports/debt-message-template?minDebt=5` 返回可复制文本 `template`。
- 前端：报表页增加“导出 CSV”“生成群消息”。

### 8) 临时特价 / 今日限量

- 下单锁价至 `order_items.unit_price`；管理端保留“特价规则管理”。
- 新表 `product_daily_limits`（如未有）：下单/批量下单前检查限量，超限返回 `limitWarning` 但不强制阻止；前端弹窗确认后可带 `force=true` 重试。
- 接口补丁：`POST /api/orders?force=true`，`POST /api/admin/batch-orders` 支持 body `force=true`。

### 9) 协管（Manager）分级权限

- MANAGER 允许：批量下单/转订餐需求/查看报表/欠款列表、审核还款（可开关）。
- 禁止：商品价格管理（除非 OWNER 授权）、用户删除/冻结、冲正非本人订单、查看非必要敏感字段（如凭证原图）。
- 实现：Guard 中增加角色+所属校验；前端仅隐藏入口但不能依赖前端。

### 10) 多 Owner / 多账本支持

- 所有业务表补充 `ledger_id`（默认 1），查询需 `WHERE ledger_id = currentLedgerId`。
- 登录后返回 ledger 列表；若仅一个自动选中并在请求头带 `X-Ledger-Id`。
- 新接口：`GET /api/ledgers/me`（我加入的账本）、`POST /api/ledgers`（OWNER 创建）、`POST /api/ledgers/:id/invite`（邀请成员）。

### 11) 未处理订餐需求自动提醒

- 定时任务（nestjs/cron）：每日 07:30 检查当天 `PENDING` 的 `order_requests`，若数量 >0 则给 OWNER 写通知“今日有 X 条订餐需求未生成订单”。

### 12) 成员端欠款原因解释

- 新接口：`GET /api/accounts/me/debt-causes?limit=5`，返回最近导致当前欠款的 `order_items`；前端在余额卡片下展示“当前欠款来源”。

### 13) 批量下单异常快捷处理

- 批量下单返回新增：`failedUsers: [{ userId, reason }]` 与 `suggestedAction: "REMOVE_FAILED_AND_RETRY"`。
- 前端弹窗列出失败名单，并提供“仅对余额够的人下单”按钮，自动移除失败目标再提交一次。

### 14) 精简种子数据

- 演示/seed 数据控制在小规模：商品 3–5 个，成员 2–3 个，余额/欠款在 ±30 以内，避免大体量样例。

