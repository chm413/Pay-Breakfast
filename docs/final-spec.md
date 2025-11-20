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

