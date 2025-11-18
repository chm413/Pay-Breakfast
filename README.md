# Pay-Breakfast

基于 NestJS + TypeORM 的校园早餐计费、账户和班级批量下单后端样例实现。项目遵循需求文档中的数据模型，提供账户扣款、班级批量下单、线下充值申请审核等核心服务骨架，便于前端或小程序进行 JWT 鉴权后的 API 调用。

## 快速开始

```bash
npm install
npm run start:dev
```

## 部署指南


1. **准备运行环境**：Node.js 18+、MySQL 5.7.43+（兼容 8.x），并创建数据库（默认名 `pay_breakfast`）。
2. **安装依赖**：在项目根目录执行 `npm install`。
3. **配置环境变量**：设置 `DB_HOST`、`DB_PORT`、`DB_USERNAME`、`DB_PASSWORD`、`DB_NAME` 指向生产库（如需修改监听端口可设置 `PORT`）。
4. **编译代码**：执行 `npm run build`，生成 `dist/` 产物。
5. **启动服务**：使用 `npm start` 运行编译后的服务（如需后台常驻可结合 pm2/systemd）。

> 默认开启 TypeORM `synchronize` 方便演示，生产环境建议关闭并使用迁移以避免意外结构变更。

### 编译 / 检查

如需验证 TypeScript 编译（无运行数据库也可执行），运行：

```bash
npm test
```

默认使用 MySQL 连接，可通过环境变量覆盖：

* `DB_HOST` / `DB_PORT`
* `DB_USERNAME` / `DB_PASSWORD`
* `DB_NAME`
* `DB_CHARSET`（可选，默认 `utf8mb4_unicode_ci`，便于在旧版本 MySQL 上兼容 Emoji 等字符）

> TypeORM 已启用 `supportBigNumbers`、`legacySpatialSupport` 和 `dateStrings` 以兼容 MySQL 5.7.43 默认行为，如需调整可通过环境变量覆盖连接参数。

> 当前开启 TypeORM `synchronize` 便于本地启动，生产环境请改为迁移方案。

### 宝塔面板 + PM2 部署示例

在宝塔面板的“添加 Node 项目”中选择 **PM2 项目**，关键字段示例（参考截图）：

| 字段 | 示例值 | 说明 |
| --- | --- | --- |
| Node版本 | 自定义添加 → v22.20.0 | 与本地构建一致的 LTS 版本 |
| 入口文件 | `/www/wwwroot/Pay-Breakfast/dist/main.js` | 先在服务器执行 `npm install && npm run build` 生成 dist |
| 项目名称 | `pay-breakfast-api` | 可自定义 |
| 运行用户 | `www` | 与站点一致即可 |
| 内存上限 | `1024` | 超过自动重启，可按机器规格调整 |
| 启动脚本参数 | `--color`（可留空） | 如需额外 Node 参数可填入 |
| 项目路径 | `/www/wwwroot/Pay-Breakfast` | 包含 `package.json` 的目录 |
| 环境变量 | 一行一个，例如：<br>`PORT=3000`<br>`DB_HOST=127.0.0.1`<br>`DB_PORT=3306`<br>`DB_USERNAME=pay_user`<br>`DB_PASSWORD=pay_pass`<br>`DB_NAME=pay_breakfast`<br>`JWT_SECRET=change_me` | 与后端配置一致 |

* 部署步骤：
  1. 使用宝塔终端或 SSH 将项目代码放到 `项目路径`，执行 `npm install && npm run build`。
  2. 在 PM2 表单填入上表参数并保存，点击“添加/保存”后启动。
  3. 若前面配置了反向代理域名，将域名指向服务器并转发到 `PORT` 端口，即可让前端通过 `VITE_API_BASE_URL` 访问。
  4. 如需日志查看，可在宝塔 PM2 管理中查看 `out`/`error` 日志或使用 `pm2 logs pay-breakfast-api`。

## 核心功能概览

* **账户服务**：
  * `consume()` 与 `recharge()` 确保在事务中更新余额并写入 `transactions` 表，处理透支校验与余额阈值告警。
  * 自动生成 `risk_events` 和站内 `notifications`，示例通过 `x-user-id` 请求头模拟登录用户。
* **班级批量下单**：
  * `POST /class-group-orders` 校验操作人、IP、人数与金额上限，逐项扣费并记录到 `class_group_orders` 与子项表。
  * 支持成功/失败混合的订单状态回执。
* **充值申请审核**：
  * `POST /recharge-requests` 生成线下扫码充值申请。
  * `POST /recharge-requests/:id/review` 审核通过时调用账户充值逻辑，拒绝时仅更新状态与备注。

## 模块组织

* `src/entities/`：完整的表结构映射，覆盖用户、班级、账户、流水、批量订单、充值申请、风控与通知等。
* `src/accounts/`：账户变动与阈值告警服务。
* `src/class-orders/`：班级批量下单控制器与业务逻辑。
* `src/recharge/`：充值申请创建与审核。
* `src/notifications/`：简单通知查询/创建服务。

上述代码主要用于展示业务流程与数据结构，实际接入需补充完善的鉴权、角色控制、错误码包装及更多报表接口。
