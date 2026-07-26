# DevFlow 研发管理平台 · AI 开发总纲

> 本文件是 AI 编码助手在本仓库工作的最高指令。`.cursor/rules/` 下的规则是本文件的细化，两者冲突时以本文件为准。

## 触发词

| 用户说 | 你要做的事 |
| --- | --- |
| **开始开发** | 执行下方「启动协议」，从 `docs/dev/TASKS.md` 第一个未完成任务开始，连续完成当前批次的全部任务 |
| **继续开发** | 跳过环境自检，直接从第一个未完成任务继续 |
| **验收 M<n>** | 对第 n 批次执行 `docs/dev/BUILD-PLAN.md` 中该批次的全部验收项，输出通过/失败清单 |
| **还原度校验 <页面>** | 对指定页面执行视觉回归对比，输出差异比例与差异区域 |

## 仓库当前状态

目前仓库里只有两样东西：**24 个 HTML 高保真原型**（根目录）与**完整 PRD 文档**（`docs/`）。应用代码一行还没写，`backend/`、`frontend/`、`contracts/` 都还不存在——第一个任务 T-0001 就是把它们建起来。

## 启动协议（用户说「开始开发」时执行）

1. **读取事实来源**（必须真的读，不许凭印象）
   - `docs/PRD.md` 的目录与第五章功能需求总表
   - `docs/dev/BUILD-PLAN.md` 找到当前批次
   - `docs/dev/TASKS.md` 找到第一个未勾选任务
2. **环境自检**：JDK 21、Maven 3.9+、Node ≥ 20、pnpm、Docker（MySQL 8 / Redis 7 / RocketMQ / XXL-Job Admin）。缺什么装什么，不要问用户。
3. **建立待办清单**：用 todo 工具把本批次任务逐条登记。
4. **逐任务执行**，每个任务走完整闭环：
   实现 → 自检（`make verify` + 任务指定的校验）→ 更新 `docs/dev/TASKS.md` 打勾并记录 commit → **单独提交一个 commit**（禁止多任务合并提交）
5. **批次完成后**：跑该批次的全部验收项，输出结果摘要，然后**继续下一批次**，直到全部完成或遇到硬阻塞。
6. **遇到歧义不要停下来问**：按「事实来源优先级」自行决策，把疑问追加到 `docs/dev/OPEN-QUESTIONS.md`，代码里留 `// TODO(open-question: Q<n>)`，继续往下做。

## 事实来源优先级

```
1. docs/PRD.md 与 docs/prd/*.md   → 业务逻辑、状态机、字段、算法、指标口径、权限
2. 仓库根目录 24 个 .html 原型      → 界面结构、样式、交互行为、文案
3. docs/dev/*.md                  → 技术选型、任务拆分、还原清单
4. 你的经验                        → 仅用于填补上述三者都没规定的技术细节
```

**冲突处理**：界面以原型为准，逻辑以 PRD 为准。若原型的交互与 PRD 的规则矛盾（例如原型允许某个流转而 PRD 的守卫条件禁止），**以 PRD 为准**，并在 `docs/dev/OPEN-QUESTIONS.md` 记录该矛盾。

## 十条铁律

1. **不许臆造**。状态名、字段名、枚举值、算法参数、指标公式，只能来自 PRD。写代码时如果发现 PRD 里没有这个字段，说明你在自己发明，停下来查文档。
2. **不许简化 UI**。"意思到了"等于没做。原型里有的元素、间距、色彩、徽标、空状态、悬浮提示，一个都不能少。
3. **样式原样迁移**。`assets/css/app.css` 整体复制到 `frontend/src/ui/styles/`，禁止重写、禁止改类名、禁止引入 Element Plus 等组件库重新实现。
4. **图表与图标原样移植**。`assets/js/charts.js`、`assets/js/icons.js` 移植为 TS 模块与 Vue 组件，禁止替换为 ECharts、Ant Design Icons 等第三方库。
5. **算法参数集中管理**。90 分钟聚类窗口、180 行基准当量、0.78 相似度阈值这类数值，全部定义在 `contracts/domain/*.yaml`，由 `make codegen` 生成 Java 与 TS 两份常量；每条规则带 `@prd` 注解指向 PRD 出处。禁止在 Java 或 TS 里硬编码，禁止手改 `generated/`。
6. **状态流转必须走状态机**。任何状态变更都必须经过 `StateMachineEngine.transition()` 校验守卫条件，禁止在业务代码里直接更新 status 字段。
7. **每个任务一个 commit**。commit message 首行格式：`<type>(<scope>): <任务号> <一句话>`，正文说明对应的 US 编号与验收结论。
8. **不许声称完成而不验证**。说"已完成"之前必须实际跑过 lint、typecheck、单测与相关校验脚本，并把输出贴在总结里。
9. **不许留假实现**。禁止 `return []`、`// TODO 实现`、假数据直接返回给前端这类占位。做不完就不要勾选任务。
10. **文档同步**。改了字段、状态、算法，同步更新 `docs/` 对应章节，并在 commit 里说明。

## 技术栈（已定，不要更换）

后端 **Java 21 + Spring Boot 3.3 + Spring Data JPA + MySQL 8**，前端 **Vue 3 + TypeScript + Vite**，
Redis 7 + RocketMQ 5 + XXL-Job + Flyway + Playwright。完整理由与版本见 `docs/dev/TECH-STACK.md`。

因为后端 Java、前端 TS 不能共享一个领域包，**状态机 / 算法参数 / 枚举 / 指标口径统一写在 `contracts/*.yaml`**，
由 `make codegen` 生成两边代码——这是保证"逻辑与算法符合 PRD"的核心机制，见 `.cursor/rules/13-contracts.mdc`。

## 仓库结构（M0 建立后）

```
contracts/             语言中立的领域契约（YAML）+ fixtures + openapi.yaml
backend/               Maven 多模块：common / domain / infra / app + db/migration（Flyway）
frontend/              Vue 3 + TS + Vite（页面与原型 1:1）
tools/codegen/         contracts → Java + TS 代码生成器
e2e/                   Playwright 端到端与视觉回归
docs/                  PRD 与开发文档（已存在，不要删改结构）
Makefile               统一命令入口（收口 Maven 与 pnpm 两套工具链）
*.html                 原型页面（**只读基线，禁止修改、禁止删除**）
```

## 常用命令（统一走 make）

```bash
make up          # 起 MySQL + Redis + RocketMQ + XXL-Job Admin
make dev         # 后端 mvn spring-boot:run + 前端 pnpm dev
make codegen     # contracts → Java/TS 生成，并校验重新生成后无 diff
make migrate     # Flyway 迁移
make seed        # 灌入与原型完全一致的种子数据
make test        # 后端 mvn test + 前端 pnpm test
make lint        # Spotless/Checkstyle + ESLint/Prettier
make check-prd   # 校验代码中的 @prd 注解指向的章节真实存在
make e2e         # Playwright 端到端
make parity      # 视觉回归（应用 vs 原型），单页用 make parity PAGE=board
make verify      # 上面全部串跑，提交前必过
```

## 完成的定义（DoD）

一个任务只有同时满足以下六条才能勾选：

- [ ] **功能**：对应用户故事的全部验收标准（Given/When/Then）可演示
- [ ] **还原**：涉及的页面视觉回归差异 ≤ 1%，且差异经确认为合理
- [ ] **逻辑**：涉及的状态转换有单测覆盖，含非法转换被拒的用例
- [ ] **算法/指标**：用 PRD 中的公式与参数写了单测，含边界值
- [ ] **权限**：涉及的接口有越权测试，越权返回 404
- [ ] **记录**：`docs/dev/TASKS.md` 已勾选并写明 commit 短 SHA
