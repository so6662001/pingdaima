# 提示词速查

> 日常只需要说「**开始开发**」。下面这些是需要精细控制时可直接复制的提示词。
>
> 触发词与执行协议定义在 [`AGENTS.md`](../../AGENTS.md)，Cursor 会自动加载；`.cursor/commands/` 里的同名命令可用 `/开始开发` 这样调用。

## 一、日常四句

| 场景 | 说这句 |
| --- | --- |
| 启动开发 | `开始开发` |
| 中断后继续 | `继续开发` |
| 验收某批次 | `验收 M3` |
| 校验某页还原度 | `还原度校验 board` |

## 二、精细控制

### 只做某个任务

```
只做 T-0304 优先级模型这一个任务，做完就停。
按 docs/dev/BUILD-PLAN.md 里该任务的输入与验收执行，
五种算法必须逐一对照 docs/PRD.md 第 5.2 节验算，参数取自 contracts/domain/algorithms.yaml，
每种算法写一组手工可验算的 JUnit 单测，把测试输出贴给我。
```

### 只还原某一页

```
只还原 requirement.html 这一页，做到 100% 一致。
先把原型页面的内联 script 读完，把数据结构抽成 fixtures；
DOM 结构与 class 名一字不改；
八个页签、四种看板分组、三种排期视图、五种优先级算法切换全部真实生效；
最后跑 make parity PAGE=requirement，差异要 ≤ 1%，把差异比例告诉我。
```

### 补一个字段 / 改一条规则

```
需求对象要增加「预计收益金额」字段。
按顺序改：先更新 docs/prd/data-model.md 的 requirement 表与字段口径，
再加 Flyway 迁移脚本，再改 contracts 里相关枚举/契约并 make codegen，
再改后端领域对象、Mapper 与 DTO，重新产出 openapi 并生成前端类型，
最后改前端表单与详情页展示。改完跑 make verify。
```

### 修一个还原缺陷

```
board 页面的卡片停留天数徽标颜色不对，原型是 ≤2 绿 / 3-4 黄 / >4 红。
定位到组件后修复，补一个单测覆盖 2、3、4、5 四个边界值，
再跑该页视觉回归确认差异下降。
```

### 排查逻辑与 PRD 不符

```
检查当前实现的工时推算是否严格符合 docs/PRD.md 第 5.4 节：
逐个核对聚类窗口 90 分钟、最小计时 25 分钟、基准当量 180 行/时、
编码系数 0.8、单日上限 10 小时、评审 20 分钟/次、CI 重跑 15 分钟/次、
取整 0.5 小时、可调 ±30% 这九个参数，
列一张表说明「PRD 值 / 代码实际值 / 是否一致」，不一致的直接修。
```

### 全量体检

```
做一次全量体检并出报告：
1. make verify（lint + codegen 无 diff + 单测 + check-prd）
2. make e2e 与 make parity
3. 对照 docs/dev/TASKS.md 核对已勾选任务是否真的满足 DoD 六条
4. 列出所有 TODO(open-question) 与未闭环项
把真实命令输出贴出来，不要凭代码推断结论。
```

## 三、写给自己的检查清单

让 AI 声称"做完了"之后，问这三句最容易发现问题：

```
把你实际运行过的命令和输出贴出来。
```

```
这个任务对应的用户故事验收标准有几条？逐条说明在哪里实现、怎么验证的。
```

```
这一页有哪些元素是你没有还原的？对照 docs/dev/UI-PARITY.md 该页清单逐条回答。
```

## 四、常见跑偏与纠正话术

| 跑偏表现 | 纠正话术 |
| --- | --- |
| 引入了 Element Plus / 重写样式 | `违反 .cursor/rules/00-core.mdc：app.css 必须原样使用、禁止引入组件库。回滚样式改动，改回原型 class。` |
| 换了 ECharts 画图 | `图表必须移植原型 assets/js/charts.js，不许用第三方库。CFD 与周期时间散点的分位线是定制视觉，换库还原不了。` |
| 状态直接 update | `所有状态变更必须走 StateMachineEngine.transition，补齐守卫校验与 state_transition_log。` |
| 阈值散落在业务代码 | `把这些参数写进 contracts/domain/algorithms.yaml，make codegen 后从生成物引用，加 @prd 注解，跑 make check-prd。` |
| 页面"差不多了" | `对照 docs/dev/UI-PARITY.md 该页清单逐条自查，再跑视觉回归，差异 ≤ 1% 才算完成。` |
| 说完成但没验证 | `把 make verify 与 make parity 的真实输出贴出来，没跑过就不算完成。` |
| 遇事就来问我 | `按 AGENTS.md 的规定：不要停下来问，按 PRD 优先决策，记到 OPEN-QUESTIONS.md 后继续。` |
