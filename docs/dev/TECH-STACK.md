# 技术选型与架构决策

> 本文是选型的唯一依据。AI 开发时**不要自行更换技术栈**；确有必要调整时，先在 [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) 记录理由并等待人工确认。

## 选型

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 后端语言 | **Java 21 (LTS)** | 团队既定 |
| 后端框架 | **Spring Boot 3.3.x** | Web / Validation / Security / Scheduling |
| 持久层 | **MyBatis-Plus 3.5** | 需求池筛选、看板范围过滤、度量聚合都是复杂动态 SQL，MyBatis 的可控性优于全 ORM |
| 数据库 | **MySQL 8.0**（utf8mb4 / InnoDB） | 团队既定 |
| 数据库迁移 | **Flyway** | 版本化 SQL 迁移，禁止手改线上表结构 |
| 缓存与分布式锁 | **Redis 7**（Redisson） | 幂等键、SLA 扫描锁、热点缓存 |
| 消息与异步 | **RabbitMQ 3.13** | Webhook 异步消费、重试（延迟队列）、死信队列 |
| 定时任务 | **Spring Scheduling + ShedLock** | SLA 扫描、任务池超时、阶段延期、工时提醒、漏测周报；多实例只跑一次 |
| 接口文档 | **springdoc-openapi** | 产出 `contracts/openapi.yaml`，前端据此生成类型与客户端 |
| 后端构建 | **Maven 多模块** | 分层清晰，企业环境通用 |
| 后端测试 | **JUnit 5 + AssertJ + Mockito + Testcontainers** | Testcontainers 起真实 MySQL/Redis/RabbitMQ，避免 H2 与 MySQL 行为差异 |
| 前端框架 | **Vue 3（Composition API + `<script setup>`）+ TypeScript** | 团队既定 |
| 前端构建 | **Vite 5** | 逐页还原时需要高频热更 |
| 前端路由/状态 | **Vue Router 4 + Pinia** | Pinia 只放视图偏好与会话，服务端数据交给查询层 |
| 服务端状态 | **@tanstack/vue-query** | 缓存、失效、乐观更新（看板拖拽要用） |
| 前端 UI | **原型 `app.css` 原样使用 + 自研组件** | **不引入 Element Plus / Ant Design Vue**，引入即破坏 100% 还原 |
| 前端测试 | **Vitest + @vue/test-utils** | 组件与工具函数 |
| 端到端与视觉回归 | **Playwright** | `toHaveScreenshot` 直接支撑"应用 vs 原型"逐像素比对 |
| 本地环境 | **Docker Compose** | MySQL + Redis + RabbitMQ 一条命令拉起 |

## 仓库结构

```
contracts/                    语言中立的领域契约（跨语言单一事实来源）
  domain/
    enums.yaml                枚举字典
    state-machines/*.yaml     8 类对象状态机（状态 · 转换 · 守卫 · 动作）
    algorithms.yaml           算法参数（优先级 / 工时 / 漏测 / 容量 / WIP）
    metrics.yaml              指标口径与公式说明
  fixtures/*.json             从原型抽取的种子数据
  openapi.yaml                接口契约（后端产出，前端消费）

backend/                      Maven 多模块
  devflow-common/             通用工具、异常、返回结构
  devflow-domain/             领域模型、状态机引擎、算法、指标计算
    src/main/java/.../generated/   ← 由 contracts 生成，禁止手改
  devflow-infra/              MyBatis Mapper、Redis、RabbitMQ、GitHub/企业微信集成
  devflow-app/                Controller、装配、启动类
  db/migration/               Flyway SQL

frontend/                     Vue 3 + TS + Vite
  src/
    generated/                ← 由 contracts 与 openapi.yaml 生成，禁止手改
    ui/                       设计系统：app.css 原样 + 图标 + 图表 + 交互组件 + 布局
    pages/<page>/             与原型页面一一对应
    api/  stores/  composables/  router/

tools/codegen/                contracts → Java + TS 代码生成器
e2e/                          Playwright 端到端与视觉回归
docs/                         PRD 与开发文档（已存在，不要删改结构）
*.html                        原型页面（只读基线，禁止修改）
```

## 关键决策：跨语言的"单一事实来源"

后端 Java、前端 TypeScript，无法像单语言那样共享一个领域包。因此把**状态机、算法参数、枚举、指标口径**下沉为语言中立的 YAML 契约，由代码生成器同时产出 Java 与 TypeScript：

```
contracts/domain/*.yaml
        │
        ├── tools/codegen ──▶ backend/devflow-domain/.../generated/*.java
        └── tools/codegen ──▶ frontend/src/generated/*.ts
```

约束：

1. 改规则**只改 YAML**，然后 `make codegen` 重新生成。生成物带 `DO NOT EDIT` 头，CI 校验"重新生成后无 diff"。
2. YAML 里每条规则带 `prd:` 字段指向 PRD 章节锚点，`make check-prd` 校验其有效性。
3. 生成的只是**数据与常量**（状态表、转换表、权重、阈值、枚举），业务逻辑仍各自手写；但两边必须消费同一份数据，不许硬编码。
4. 接口契约由后端 springdoc 产出 `contracts/openapi.yaml`，前端生成请求类型；接口变更必须先改后端注解再重新生成，禁止前端手写接口类型。

## 架构分层

```
frontend (Vue 3) ──HTTP/JSON──▶ devflow-app (Controller)
                                      │
                                devflow-domain（状态机 · 算法 · 指标）
                                      │
                                devflow-infra
                                 ├── MySQL 8（MyBatis-Plus + Flyway）
                                 ├── Redis 7（幂等 · 锁 · 缓存）
                                 ├── RabbitMQ（Webhook 异步 · 重试 · 死信）
                                 ├── GitHub App（Webhook 入 / REST 出）
                                 └── 企业微信（应用消息 / 群机器人）
```

依赖方向严格单向：`app → domain → common`，`infra` 实现 `domain` 定义的端口接口。**领域层不依赖 Spring 与 MyBatis**，保证算法与状态机可独立单测。

## 关键约定

1. **业务计算在后端**：优先级得分、工时推算、指标聚合、漏测判定全部后端完成，前端只做展示格式化。
2. **预聚合读写分离**：度量查询走 `metric_snapshot` 表，不扫明细表。
3. **事件驱动优先**：状态流转优先由 GitHub / CI / 测试事件触发，人工流转是兜底。
4. **配置化优先**：工作项类型、状态机、字段、自动化规则、推送规则、WIP 上限均为配置数据，新增不发版。
5. **MySQL 具体约定**：字符集 `utf8mb4_0900_ai_ci`；金额用 `DECIMAL(18,4)`；时间用 `DATETIME(3)` 且统一存 UTC；JSON 字段用原生 `JSON` 类型；软删除 `is_deleted TINYINT(1)`；主键 `BIGINT UNSIGNED AUTO_INCREMENT`；所有外键关系在应用层维护（不建物理外键，便于分库与归档）。

## 统一命令（根 `Makefile`，T-0001 建立）

一个仓库两套工具链，统一用 make 收口：

| 命令 | 作用 |
| --- | --- |
| `make up` / `make down` | 起停 MySQL + Redis + RabbitMQ |
| `make dev` | 同时起后端（`mvn spring-boot:run`）与前端（`pnpm dev`） |
| `make build` | 全量构建 |
| `make test` | 后端 `mvn test` + 前端 `pnpm test` |
| `make lint` | Checkstyle/Spotless + ESLint/Prettier |
| `make codegen` | contracts → Java/TS 生成，并校验无 diff |
| `make migrate` / `make seed` | Flyway 迁移 / 灌入原型一致的种子数据 |
| `make e2e` / `make parity` | Playwright 端到端 / 视觉回归 |
| `make check-prd` | 校验代码中 `@prd` 注解指向的章节真实存在 |
| `make verify` | 上面全部串跑，提交前必过 |

## 环境变量（T-0001 建立 `.env.example`）

| 变量 | 用途 |
| --- | --- |
| `MYSQL_URL` / `MYSQL_USER` / `MYSQL_PASSWORD` | MySQL 连接 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis |
| `RABBITMQ_HOST` / `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | RabbitMQ |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | 登录令牌 |
| `GITHUB_APP_ID` / `GITHUB_PRIVATE_KEY` / `GITHUB_WEBHOOK_SECRET` | GitHub App |
| `WECOM_CORP_ID` / `WECOM_AGENT_ID` / `WECOM_SECRET` / `WECOM_BOT_WEBHOOK` | 企业微信 |
| `PORTAL_BASE_URL` | 业务方门户外链 |
| `FEATURE_AUTO_TRANSITION` / `FEATURE_AUTO_WORKLOG` / `FEATURE_AUTO_ESCAPE` | 三个自动化灰度开关（PRD 10.1） |

密钥一律不入库不入日志；本地用 `.env`，生产用密钥管理服务。

## 不可动摇的两条

不论后续如何调整技术细节，以下两条是"100% 还原"的前提，任何时候都不能改：

1. 原型 `assets/css/app.css` **原样使用**，不重写、不换 CSS 方案
2. 图表与图标从原型 `assets/js/charts.js`、`icons.js` **移植**，不换第三方库
