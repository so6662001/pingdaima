# 任务进度板

> AI 每完成一个任务，在此勾选并填入 commit 短 SHA。**这是判断"下一个该做什么"的唯一依据**，不要凭记忆。
>
> 任务定义见 [`BUILD-PLAN.md`](BUILD-PLAN.md)。完成的定义（DoD 六条）见 [`AGENTS.md`](../../AGENTS.md#完成的定义dod)。

| 状态 | 含义 |
| --- | --- |
| `[ ]` | 未开始 |
| `[~]` | 进行中（只允许同时有一个） |
| `[x]` | 已完成（DoD 六条全满足，且已提交） |

---

## M0 工程基座、领域契约与设计系统迁移

- [ ] T-0001 仓库骨架与构建（Maven 多模块 + Vue 3 + Docker Compose + Makefile + CI）　`commit:`
- [ ] T-0002 领域契约与代码生成（contracts YAML → Java/TS）　`commit:`
- [ ] T-0003 设计系统迁移（app.css / 图标 / 图表 / 组件 / 布局）　`commit:`
- [ ] T-0004 抽取原型数据为 fixtures（JSON）　`commit:`
- [ ] T-0005 校验脚本与 CI 接线　`commit:`

## M1 数据库、状态机引擎、认证鉴权

- [ ] T-0101 MySQL 表结构与 Flyway 迁移　`commit:`
- [ ] T-0102 领域模型与 MyBatis 层　`commit:`
- [ ] T-0103 状态机引擎与流转日志　`commit:`
- [ ] T-0104 种子数据（读 fixtures）　`commit:`
- [ ] T-0105 认证与鉴权（RBAC + 数据范围 + 越权 404）　`commit:`

## M2 工单与客户

- [ ] T-0201 工单主流程与类型配置　`commit:`
- [ ] T-0202 SLA 时钟与升级　`commit:`
- [ ] T-0203 工单池分诊　`commit:`
- [ ] T-0204 工单转需求与缺陷　`commit:`
- [ ] T-0205 客户域（360 / 呼声加权 / 承诺）　`commit:`
- [ ] T-0206 页面还原 ticket + customer　`commit:`

## M3 需求池与优先级

- [ ] T-0301 需求主数据与来源合流　`commit:`
- [ ] T-0302 富化、去重合并、归档复活　`commit:`
- [ ] T-0303 DoR 就绪度检查　`commit:`
- [ ] T-0304 优先级模型（五算法 / 版本化 / 快照）　`commit:`
- [ ] T-0305 评审流程 7 节点与价值评审会　`commit:`
- [ ] T-0306 阶段计划与延期判定　`commit:`
- [ ] T-0307 拆解与推送项目　`commit:`
- [ ] T-0308 页面还原 requirement　`commit:`
- [ ] T-0309 页面还原 requirement-detail　`commit:`

## M4 项目与迭代

- [ ] T-0401 项目与迭代主数据　`commit:`
- [ ] T-0402 多版本迭代规划与容量校验　`commit:`
- [ ] T-0403 资源排期与容量　`commit:`
- [ ] T-0404 任务池与自助认领　`commit:`
- [ ] T-0405 页面还原 project + project-detail　`commit:`
- [ ] T-0406 页面还原 agile　`commit:`

## M5 研发看板

- [ ] T-0501 看板配置（列 / WIP / 策略 / 字段 / 自动化）　`commit:`
- [ ] T-0502 五类看板数据服务与范围选择　`commit:`
- [ ] T-0503 拖拽流转与 WIP 判定　`commit:`
- [ ] T-0504 看板度量（CFD / 散点 / 停留 / 诊断）　`commit:`
- [ ] T-0505 页面还原 board（重点）　`commit:`
- [ ] T-0506 页面还原 mywork　`commit:`
- [ ] T-0507 页面还原 index 工作台　`commit:`

## M6 代码与持续交付

- [ ] T-0601 GitHub 集成与 Webhook 网关　`commit:`
- [ ] T-0602 关联与 12 条自动流转规则　`commit:`
- [ ] T-0603 部署与回滚　`commit:`
- [ ] T-0604 页面还原 devops　`commit:`

## M7 测试与质量

- [ ] T-0701 用例库与覆盖矩阵　`commit:`
- [ ] T-0702 测试计划与执行　`commit:`
- [ ] T-0703 缺陷生命周期与 SLA　`commit:`
- [ ] T-0704 质量门禁与豁免　`commit:`
- [ ] T-0705 漏测反查六步与六类判定　`commit:`
- [ ] T-0706 页面还原 testing　`commit:`

## M8 产品与发布

- [ ] T-0801 产品与能力模块　`commit:`
- [ ] T-0802 多视角路线图与对外同步　`commit:`
- [ ] T-0803 版本发布与就绪度　`commit:`
- [ ] T-0804 页面还原 product + product-detail　`commit:`

## M9 智能工时与成本

- [ ] T-0901 四类来源采集与开关　`commit:`
- [ ] T-0902 工时推算与归集　`commit:`
- [ ] T-0903 成员确认与调整　`commit:`
- [ ] T-0904 成本核算与未归集治理　`commit:`
- [ ] T-0905 页面还原 worklog　`commit:`

## M10 度量与人效

- [ ] T-1001 指标预聚合与快照　`commit:`
- [ ] T-1002 DORA 与四层指标实现　`commit:`
- [ ] T-1003 人效画像与产品贡献　`commit:`
- [ ] T-1004 页面还原 metrics + people　`commit:`

## M11 复盘与知识库

- [ ] T-1101 复盘主流程与投票　`commit:`
- [ ] T-1102 行动项 SMART 与闭环　`commit:`
- [ ] T-1103 页面还原 retro + retro-detail　`commit:`
- [ ] T-1104 页面还原 wiki　`commit:`

## M12 消息与业务方门户

- [ ] T-1201 企业微信集成　`commit:`
- [ ] T-1202 24 条推送规则引擎　`commit:`
- [ ] T-1203 推送效果统计　`commit:`
- [ ] T-1204 页面还原 notify　`commit:`
- [ ] T-1205 业务方门户与字段隔离　`commit:`

## M13 系统设置与整体收尾

- [ ] T-1301 系统设置全部配置项　`commit:`
- [ ] T-1302 登录与身份　`commit:`
- [ ] T-1303 全量视觉回归与端到端串场　`commit:`
- [ ] T-1304 非功能验收　`commit:`
- [ ] T-1305 交付文档　`commit:`

---

## 页面还原进度（24 页）

还原要点见 [`UI-PARITY.md`](UI-PARITY.md)。每页达标后勾选并记录最后一次 `make parity` 的差异比例。

- [ ] `index.html` → `/`　差异:
- [ ] `login.html` → `/login`　差异:
- [ ] `mywork.html` → `/mywork`　差异:
- [ ] `board.html` → `/board`　差异:
- [ ] `requirement.html` → `/requirement`　差异:
- [ ] `requirement-detail.html` → `/requirement/:code`　差异:
- [ ] `ticket.html` → `/ticket`　差异:
- [ ] `customer.html` → `/customer`　差异:
- [ ] `product.html` → `/product`　差异:
- [ ] `product-detail.html` → `/product/:code`　差异:
- [ ] `project.html` → `/project`　差异:
- [ ] `project-detail.html` → `/project/:code`　差异:
- [ ] `agile.html` → `/agile`　差异:
- [ ] `testing.html` → `/testing`　差异:
- [ ] `devops.html` → `/devops`　差异:
- [ ] `worklog.html` → `/worklog`　差异:
- [ ] `people.html` → `/people`　差异:
- [ ] `metrics.html` → `/metrics`　差异:
- [ ] `retro.html` → `/retro`　差异:
- [ ] `retro-detail.html` → `/retro/:id`　差异:
- [ ] `notify.html` → `/notify`　差异:
- [ ] `wiki.html` → `/wiki`　差异:
- [ ] `portal.html` → `/portal`　差异:
- [ ] `settings.html` → `/settings`　差异:
