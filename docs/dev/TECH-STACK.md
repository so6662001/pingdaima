# 技术选型与架构决策

> 本文是选型的唯一依据。AI 开发时**不要自行更换技术栈**；确有必要更换时，先在 [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) 记录理由并等待人工确认。

## 选型

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 仓库形态 | pnpm workspaces 单仓 | 前后端共享领域定义（状态机、算法、指标口径、枚举），这是 PRD 一致性的关键 |
| 前端 | React 18 + TypeScript + Vite | 原型是命令式 DOM 拼接，React 迁移映射直观；Vite 启动快，利于逐页还原时的高频回看 |
| 前端状态 | TanStack Query（服务端状态）+ Zustand（视图偏好） | 看板/需求池这类页面以服务端数据为主，视图偏好（范围、泳道、密度）需跨页面持久化 |
| 样式 | 原型 `app.css` 原样迁入 | 100% 还原的硬前提。任何"用 Tailwind 重写一遍"的做法都会导致像素级差异 |
| 图表 | 原型自研 SVG 引擎移植 | 原型的 CFD、周期时间散点（含分位线）、雷达、热力图都是定制视觉，换库必然不一致 |
| 后端 | NestJS + TypeScript | 模块化分层与依赖注入契合按领域拆分；与前端同语言，共享包无需二次定义 |
| ORM / 库 | Prisma + PostgreSQL 16 | ER 模型关系复杂（软删除、复合唯一、大量外键），Prisma 的 schema 与 ER 图接近一一对应 |
| 队列 / 定时 | BullMQ + Redis 7 | Webhook 异步消费、幂等去重、指数退避重试、死信队列、repeatable job（SLA 扫描、周报） |
| 测试 | Vitest + Supertest + Playwright | Playwright 的 `toHaveScreenshot` 直接支撑"应用 vs 原型"的视觉回归 |
| 部署 | Docker Compose（开发）/ 容器编排（生产） | 本地一条命令拉起 Postgres + Redis + 应用 |

## 架构分层

```
apps/web  ──HTTP──▶ apps/api ──▶ PostgreSQL
    │                   │
    │                   ├──▶ Redis / BullMQ ──▶ 定时任务与事件消费
    │                   ├──▶ GitHub App（Webhook 入 / API 出）
    │                   └──▶ 企业微信（应用消息 / 群机器人）
    └──────────┬────────┘
        packages/shared（类型 · 枚举 · 状态机 · 算法 · 指标 · fixtures）
        packages/ui（app.css · 图标 · 图表 · 交互组件 · 布局）
```

## 关键约定

1. **领域定义单点**：状态机、算法、指标口径、枚举只在 `packages/shared/src/domain` 定义一次，前后端共用。前端不得重复实现业务计算。
2. **业务计算在后端**：优先级得分、工时推算、指标聚合、漏测判定全部后端完成，前端只做展示格式化。
3. **预聚合读写分离**：度量查询走 `metric_snapshot`，不扫明细表。
4. **事件驱动优先**：状态流转优先由 GitHub / CI / 测试事件触发，人工流转是兜底。
5. **配置化优先**：工作项类型、状态机、字段、自动化规则、推送规则、WIP 上限均为配置数据，新增不发版。

## 环境变量（M0 建立 `.env.example` 时按此清单）

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `REDIS_URL` | Redis 连接串 |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | 登录令牌 |
| `GITHUB_APP_ID` / `GITHUB_PRIVATE_KEY` / `GITHUB_WEBHOOK_SECRET` | GitHub App |
| `WECOM_CORP_ID` / `WECOM_AGENT_ID` / `WECOM_SECRET` / `WECOM_BOT_WEBHOOK` | 企业微信 |
| `PORTAL_BASE_URL` | 业务方门户外链 |
| `FEATURE_AUTO_TRANSITION` / `FEATURE_AUTO_WORKLOG` / `FEATURE_AUTO_ESCAPE` | 三个自动化灰度开关（PRD 10.1） |

密钥一律不入库不入日志；本地用 `.env`，生产用密钥管理服务。

## 如果团队要换栈

只有两处会伤及"100% 还原"，换栈时必须保留：

1. `app.css` 原样使用（不论用什么框架渲染）
2. 图表与图标从原型移植（不换第三方库）

其余（NestJS → Spring Boot、Prisma → MyBatis、React → Vue）都可替换，替换后需同步更新 `.cursor/rules/10-frontend.mdc` 与 `11-backend.mdc`。
