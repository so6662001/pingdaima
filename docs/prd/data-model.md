# 数据模型与 ER 图

> 配套主文档：[PRD.md](../PRD.md)。本文给出全域实体关系概览、五个子域的详细 ER 图、核心表字段字典、枚举字典与索引约束建议。

## 建模原则

1. **工作项统一建模**：用户故事、任务、缺陷、技术债在交付层的行为高度一致（都要进看板、都要流转、都要归集工时），统一落在 `work_item` 表，用 `type` 区分并挂载类型专属属性；需求（`requirement`）因为承载客户、评分、阶段计划等大量专属语义，单独建表。
2. **来源可追溯**：任何需求都能反查来源（工单 / 客户反馈 / 产品规划 / 监管合规 / 数据洞察），用 `req_source` 关联表承载多来源合并（一条需求可由多个工单合并而来）。
3. **状态与配置分离**：状态机定义（`state_machine` / `state` / `transition`）是配置数据，业务表只存当前状态码 + 进入时间，历史流转落在 `state_transition_log`。
4. **度量数据与业务数据分离**：明细表只负责事实记录，度量走 `metric_snapshot` 预聚合，避免报表查询打穿业务库。
5. **软删除与审计**：业务主表统一带 `is_deleted`、`created_by`、`created_at`、`updated_by`、`updated_at`；敏感操作额外写 `audit_log`。

---

## 一、全域实体关系概览

```mermaid
erDiagram
  CUSTOMER ||--o{ TICKET : "提出"
  CUSTOMER ||--o{ REQ_CUSTOMER : "关联诉求"
  TICKET }o--|| TICKET_TYPE : "属于类型"
  TICKET ||--o{ REQ_SOURCE : "转化为"
  REQ_SOURCE }o--|| REQUIREMENT : "汇入"
  REQ_CUSTOMER }o--|| REQUIREMENT : "客户呼声"

  PRODUCT ||--o{ REQUIREMENT : "归属产品线"
  PRODUCT ||--o{ ROADMAP_ITEM : "路线图"
  PRODUCT ||--o{ RELEASE : "发布版本"
  PRODUCT ||--o{ PROJECT : "由项目交付"

  REQUIREMENT ||--o{ REQ_STAGE_PLAN : "阶段计划"
  REQUIREMENT ||--o{ PRIORITY_SCORE : "评分快照"
  REQUIREMENT ||--o{ REVIEW : "评审单"
  REQUIREMENT ||--o{ WORK_ITEM : "拆解为"
  PRIORITY_MODEL ||--o{ PRIORITY_SCORE : "按模型计算"

  PROJECT ||--o{ SPRINT : "包含迭代"
  SPRINT ||--o{ WORK_ITEM : "承载工作项"
  PROJECT ||--o{ CAPACITY_ALLOCATION : "资源排期"
  USER ||--o{ CAPACITY_ALLOCATION : "被排期"
  TEAM ||--o{ USER : "成员归属"

  WORK_ITEM ||--o{ WORK_ITEM : "父子拆解"
  WORK_ITEM ||--o{ STATE_TRANSITION_LOG : "流转历史"
  WORK_ITEM ||--o{ WORKLOG : "归集工时"
  WORK_ITEM ||--o{ PULL_REQUEST : "关联 PR"
  USER ||--o{ WORK_ITEM : "经办"

  REPOSITORY ||--o{ BRANCH : "分支"
  BRANCH ||--o{ COMMIT : "提交"
  BRANCH ||--o{ PULL_REQUEST : "发起"
  PULL_REQUEST ||--o{ PIPELINE_RUN : "触发流水线"
  RELEASE ||--o{ DEPLOYMENT : "部署"

  REQUIREMENT ||--o{ TEST_CASE : "覆盖矩阵"
  TEST_PLAN ||--o{ TEST_RUN : "执行轮次"
  TEST_CASE ||--o{ TEST_RESULT : "执行结果"
  TEST_RUN ||--o{ TEST_RESULT : "包含结果"
  WORK_ITEM ||--o{ ESCAPE_ANALYSIS : "漏测反查"
  TICKET ||--o{ ESCAPE_ANALYSIS : "线上信号"

  RETRO ||--o{ RETRO_FEEDBACK : "反馈"
  RETRO ||--o{ ACTION_ITEM : "行动项"
  ACTION_ITEM }o--|| WORK_ITEM : "生成任务"

  NOTIFY_RULE ||--o{ NOTIFY_LOG : "推送记录"
  USER ||--o{ SUBSCRIPTION : "订阅"
```

---

## 二、子域 ER 图

### 2.1 客户与工单域

```mermaid
erDiagram
  CUSTOMER {
    bigint id PK
    string code "客户编码"
    string name "客户名称"
    string level "等级 战略/KA/普通"
    int weight_factor "权重系数 3/2/1"
    string industry "行业"
    bigint owner_id FK "客户经理"
    string health "健康度 健康/关注/风险"
    date signed_at "签约日期"
    decimal arr "年度经常性收入"
  }
  CONTACT {
    bigint id PK
    bigint customer_id FK
    string name
    string title "职务"
    string phone
    string wecom_id "企业微信外部联系人 ID"
  }
  TICKET_TYPE {
    bigint id PK
    string code "incident/feature_req/consult/..."
    string name
    json extra_fields "专属字段定义"
    string default_priority
    int response_sla_min "响应时限(分钟)"
    int resolve_sla_min "解决时限(分钟)"
    bigint default_group_id FK "默认处理组"
    json convertible_to "可转换目标"
    boolean enabled
  }
  TICKET {
    bigint id PK
    string code "TK-3821"
    string title
    text description
    bigint customer_id FK
    bigint contact_id FK
    bigint type_id FK
    string channel "客服热线/企业微信/客户经理/开放平台/邮件/官网客服"
    string priority "P0-P3"
    string status "新建待受理/处理中/待客户确认/待转需求/待验证/已解决"
    bigint assignee_id FK
    datetime responded_at "首次响应时间"
    datetime sla_due_at "解决时限截止"
    boolean sla_paused "时钟是否暂停"
    int escalation_level "升级层级"
    json extra_values "专属字段取值"
    datetime created_at
  }
  TICKET_COMMENT {
    bigint id PK
    bigint ticket_id FK
    bigint author_id FK
    text content
    boolean visible_to_customer "是否对客可见"
    datetime created_at
  }
  TRIAGE_RESULT {
    bigint id PK
    bigint ticket_id FK
    string verdict "需求/缺陷/重复/咨询/不予处理/待补充"
    bigint merged_into_ticket_id FK "重复时合并目标"
    decimal similarity "相似度"
    bigint target_id "生成的需求或缺陷 ID"
    bigint operator_id FK
    text reason
    datetime created_at
  }

  CUSTOMER ||--o{ CONTACT : "联系人"
  CUSTOMER ||--o{ TICKET : "提出工单"
  TICKET_TYPE ||--o{ TICKET : "决定字段与 SLA"
  TICKET ||--o{ TICKET_COMMENT : "沟通记录"
  TICKET ||--o| TRIAGE_RESULT : "分诊结论"
```

### 2.2 产品与需求域

```mermaid
erDiagram
  PRODUCT {
    bigint id PK
    string code
    string name "产品线名称"
    bigint owner_id FK "产品负责人"
    string stage "孵化/成长/成熟/维护"
    string north_star_metric "北极星指标"
    boolean portal_visible "是否对外可见"
  }
  PRODUCT_MODULE {
    bigint id PK
    bigint product_id FK
    string name "能力模块"
    bigint repo_id FK "主要代码仓库"
    bigint owner_id FK
  }
  REQUIREMENT {
    bigint id PK
    string code "REQ-2041"
    string title
    text background "业务背景"
    text benefit "预期收益"
    json acceptance_criteria "验收标准列表"
    bigint product_id FK
    bigint module_id FK
    string type "功能需求/体验优化/技术需求/合规需求"
    string channel "工单/客户反馈/产品规划/监管合规/数据洞察/竞品对标"
    string status "待评审/评审中/待排期/开发中/联调中/测试中/待发布/已发布/已挂起/已驳回"
    datetime status_entered_at "进入当前状态时间"
    string priority "P0-P3"
    int value_score "业务价值 0-100"
    int urgency_score "紧迫性 0-100"
    decimal effort_days "预估人日"
    decimal priority_score "优先级得分"
    bigint model_version_id FK "计分所用模型版本"
    bigint owner_id FK "需求负责人"
    bigint target_release_id FK "目标版本"
    boolean portal_visible "是否对外可见"
    string archive_reason "归档原因"
  }
  REQ_SOURCE {
    bigint id PK
    bigint requirement_id FK
    string source_type "ticket/feedback/plan/compliance/insight"
    bigint source_id "来源单据 ID"
    string source_code "来源单号 TK-3821"
    datetime linked_at
  }
  REQ_CUSTOMER {
    bigint id PK
    bigint requirement_id FK
    bigint customer_id FK
    int voice_count "呼声次数"
    decimal weighted_voice "加权呼声 = 次数 × 等级系数"
    date promised_date "对客承诺日期"
    string promise_status "未承诺/已承诺/已交付/已延期"
  }
  REQ_STAGE_PLAN {
    bigint id PK
    bigint requirement_id FK
    string stage "设计/编码/联调/测试/发布"
    bigint owner_id FK
    date planned_start
    date planned_end
    date actual_start
    date actual_end
    int progress_pct
    boolean delayed "是否延期"
  }
  PRIORITY_MODEL {
    bigint id PK
    string name
    string algorithm "weighted/rice/wsjf/sum/custom"
    json factors "因素与权重定义"
    text expression "自定义表达式"
    int version
    boolean active
    bigint created_by FK
    datetime effective_at
  }
  PRIORITY_SCORE {
    bigint id PK
    bigint requirement_id FK
    bigint model_id FK
    json factor_values "各因素得分快照"
    decimal score
    int rank_in_pool "池内排名"
    datetime computed_at
  }
  REVIEW {
    bigint id PK
    bigint requirement_id FK
    string node "提出/初审/价值评审/架构评审/排期评审/验收/复盘"
    string result "通过/驳回/补充材料/待评审"
    bigint reviewer_id FK
    int sla_hours
    datetime due_at
    text comment
    datetime reviewed_at
  }
  ROADMAP_ITEM {
    bigint id PK
    bigint product_id FK
    bigint requirement_id FK
    string bucket "now/next/later"
    string milestone
    date planned_date
    boolean portal_visible
    boolean from_customer "是否用户提交的特性"
  }

  PRODUCT ||--o{ PRODUCT_MODULE : "包含模块"
  PRODUCT ||--o{ REQUIREMENT : "归属"
  PRODUCT ||--o{ ROADMAP_ITEM : "路线图条目"
  REQUIREMENT ||--o{ REQ_SOURCE : "来源"
  REQUIREMENT ||--o{ REQ_CUSTOMER : "客户呼声"
  REQUIREMENT ||--o{ REQ_STAGE_PLAN : "五阶段计划"
  REQUIREMENT ||--o{ PRIORITY_SCORE : "评分快照"
  REQUIREMENT ||--o{ REVIEW : "评审节点"
  PRIORITY_MODEL ||--o{ PRIORITY_SCORE : "计算依据"
```

### 2.3 项目与交付域

```mermaid
erDiagram
  PROJECT {
    bigint id PK
    string code "PRJ-018"
    string name
    bigint product_id FK
    bigint pm_id FK "项目经理"
    bigint tech_lead_id FK
    string status "待启动/进行中/已完成/已暂停"
    string health "健康/关注/风险"
    date start_date
    date end_date
    decimal budget "预算(万元)"
    decimal cost_used "已消耗"
  }
  SPRINT {
    bigint id PK
    bigint project_id FK
    string name "Sprint 26-14"
    date start_date
    date end_date
    text goal "迭代目标"
    int committed_points "承诺点数"
    int completed_points "完成点数"
    string status "规划中/进行中/已结束"
  }
  WORK_ITEM {
    bigint id PK
    string code "STORY-3313 / TASK-5541 / BUG-770"
    string type "epic/story/task/bug/debt"
    string title
    text description
    bigint requirement_id FK "所属需求"
    bigint project_id FK
    bigint sprint_id FK
    bigint parent_id FK "父工作项"
    string status "按类型状态机取值"
    datetime status_entered_at
    string priority "P0-P3"
    int story_points
    decimal estimate_hours
    bigint assignee_id FK
    bigint team_id FK
    json skill_tags "技能标签"
    boolean claimable "是否允许自助认领"
    boolean blocked
    text blocked_reason
    datetime blocked_at
    string env "发现环境(缺陷)"
    string root_cause "根因分类(缺陷)"
    datetime due_at "SLA 截止(缺陷)"
  }
  WORK_ITEM_LINK {
    bigint id PK
    bigint from_item_id FK
    bigint to_item_id FK
    string link_type "blocks/depends_on/duplicates/relates_to"
  }
  BOARD {
    bigint id PK
    string name
    string board_type "sprint/req/bug/release/mine"
    string scope_type "all/product/project/team"
    bigint scope_id "范围对象 ID"
    json swimlane_config
  }
  BOARD_COLUMN {
    bigint id PK
    bigint board_id FK
    string name
    string mapped_status "对应状态"
    int wip_limit "0 表示不限"
    int aging_threshold_days "停留预警天数"
    json entry_criteria "准入 Ready"
    json exit_criteria "准出 Done"
    int sort_order
  }
  CAPACITY_ALLOCATION {
    bigint id PK
    bigint user_id FK
    bigint project_id FK
    date week_start "按周排期"
    decimal baseline_hours "基准容量"
    decimal deduct_hours "请假/公休/会议/值班扣减"
    decimal allocated_pct "分配比例"
    boolean conflict "是否跨项目冲突"
  }
  STATE_TRANSITION_LOG {
    bigint id PK
    string entity_type "requirement/work_item/ticket/..."
    bigint entity_id
    string from_status
    string to_status
    string trigger_type "人工/系统/事件"
    bigint operator_id FK
    string event_source "github.pull_request.merged 等"
    int duration_sec "在上一状态停留时长"
    text reason "强制流转或回退原因"
    datetime created_at
  }

  PROJECT ||--o{ SPRINT : "迭代"
  PROJECT ||--o{ WORK_ITEM : "工作项"
  SPRINT ||--o{ WORK_ITEM : "本迭代承载"
  WORK_ITEM ||--o{ WORK_ITEM_LINK : "关系"
  WORK_ITEM ||--o{ STATE_TRANSITION_LOG : "流转历史"
  BOARD ||--o{ BOARD_COLUMN : "列定义"
  PROJECT ||--o{ CAPACITY_ALLOCATION : "资源排期"
```

### 2.4 代码、测试与发布域

```mermaid
erDiagram
  REPOSITORY {
    bigint id PK
    string full_name "org/repo"
    bigint product_id FK
    string default_branch
    bigint github_installation_id "GitHub App 安装 ID"
  }
  BRANCH {
    bigint id PK
    bigint repo_id FK
    string name "feature/REQ-2041-smart-router"
    bigint work_item_id FK "按命名约定解析"
    datetime created_at
  }
  COMMIT {
    bigint id PK
    bigint repo_id FK
    string sha
    bigint author_id FK
    text message
    int additions
    int deletions
    decimal code_equivalent "代码当量"
    bigint work_item_id FK "按提交信息编号解析"
    datetime committed_at
  }
  PULL_REQUEST {
    bigint id PK
    bigint repo_id FK
    int number "#482"
    string title
    bigint author_id FK
    bigint work_item_id FK
    string state "open/merged/closed"
    int review_required
    int review_approved
    int first_review_wait_min "首次评审等待"
    datetime merged_at
  }
  PIPELINE_RUN {
    bigint id PK
    bigint repo_id FK
    bigint pr_id FK
    string workflow "CI/CD 工作流名"
    string conclusion "success/failure/cancelled"
    int duration_sec
    int retry_count
    datetime started_at
  }
  RELEASE {
    bigint id PK
    string version "V3.0"
    bigint product_id FK
    string status "版本规划中/开发中/测试中/发布评审/灰度中/已发布/已回滚"
    date planned_date
    int readiness_pct "发布就绪度"
    json gate_result "门禁项结果"
    bigint owner_id FK
  }
  DEPLOYMENT {
    bigint id PK
    bigint release_id FK
    string env "dev/test/staging/prod"
    string result "success/failed/rolled_back"
    int duration_sec
    bigint operator_id FK
    datetime deployed_at
  }
  TEST_CASE {
    bigint id PK
    string code "TC-9101"
    string title
    bigint module_id FK
    bigint requirement_id FK "覆盖需求"
    string case_type "功能/接口/性能/安全/兼容"
    string status "草稿/评审中/已生效/已自动化/已废弃"
    boolean automated
    bigint author_id FK
    bigint source_defect_id FK "补测来源缺陷"
  }
  TEST_PLAN {
    bigint id PK
    string name
    bigint release_id FK
    bigint sprint_id FK
    string scope "全量回归/增量/冒烟"
    date start_date
    date end_date
    bigint owner_id FK
  }
  TEST_RUN {
    bigint id PK
    bigint plan_id FK
    string env
    int total_cases
    int passed
    int failed
    int blocked
    datetime executed_at
  }
  TEST_RESULT {
    bigint id PK
    bigint run_id FK
    bigint case_id FK
    string result "pass/fail/blocked/skipped"
    bigint defect_id FK "失败关联缺陷"
    text remark
  }
  ESCAPE_ANALYSIS {
    bigint id PK
    bigint ticket_id FK "线上信号来源"
    bigint defect_id FK "生产缺陷"
    bigint requirement_id FK
    bigint module_id FK
    string verdict "用例缺失/执行遗漏/用例失效/环境差异/需求遗漏/外部因素"
    string responsible_stage "测试设计/测试执行/测试环境/需求分析/运维供应商"
    text root_cause
    json supplement_cases "生成的补测用例"
    int similar_ticket_count "同类工单数"
    int exposure_days "上线到被发现的天数"
    string status "待处理/补测中/已补测/已闭环"
    boolean reviewed "测试经理是否已复核"
  }

  REPOSITORY ||--o{ BRANCH : "分支"
  REPOSITORY ||--o{ COMMIT : "提交"
  BRANCH ||--o{ PULL_REQUEST : "PR"
  PULL_REQUEST ||--o{ PIPELINE_RUN : "流水线"
  RELEASE ||--o{ DEPLOYMENT : "部署记录"
  TEST_PLAN ||--o{ TEST_RUN : "执行轮次"
  TEST_RUN ||--o{ TEST_RESULT : "结果明细"
  TEST_CASE ||--o{ TEST_RESULT : "被执行"
  ESCAPE_ANALYSIS }o--|| TEST_CASE : "补测用例"
```

### 2.5 工时、效能与协同域

```mermaid
erDiagram
  USER {
    bigint id PK
    string name
    string email
    string wecom_userid "企业微信 UserID"
    string github_login
    bigint team_id FK
    string title "岗位"
    string platform_role "超管/空间管理/项目管理/成员/访客"
    decimal hourly_cost "小时成本(用于核算)"
    boolean active
  }
  TEAM {
    bigint id PK
    string name "交易平台组"
    bigint leader_id FK
    string team_type "研发/测试/产品/SRE"
  }
  WORKLOG {
    bigint id PK
    bigint user_id FK
    date work_date
    bigint work_item_id FK
    bigint requirement_id FK "归集到需求"
    bigint project_id FK
    decimal coding_hours "编码工时"
    decimal review_hours "评审工时"
    decimal debug_hours "联调排障"
    decimal meeting_hours "会议工时"
    decimal estimated_hours "系统推算合计"
    decimal confirmed_hours "成员确认后"
    decimal adjust_pct "调整幅度"
    string adjust_reason
    string status "待确认/已确认/已锁定"
    boolean allocated "是否成功归集"
  }
  WORKLOG_SOURCE {
    bigint id PK
    bigint worklog_id FK
    string source_type "commit/pr_review/ci_retry/calendar"
    bigint source_id
    decimal contributed_hours
    json calc_detail "推算明细"
  }
  METRIC_SNAPSHOT {
    bigint id PK
    string metric_code "dora_deploy_freq 等"
    string scope_type "org/product/project/team/user"
    bigint scope_id
    date stat_date
    string period "day/week/month/sprint"
    decimal value
    json breakdown "维度拆解"
    datetime computed_at
  }
  RETRO {
    bigint id PK
    string title
    string retro_type "迭代回顾/版本复盘/故障复盘/项目复盘"
    bigint scope_id "关联迭代/版本/故障/项目"
    bigint facilitator_id FK "主持人"
    string template "四象限/SSC/帆船"
    string stage "创建/收集反馈/投票/讨论/形成行动项/发布纪要/闭环跟踪"
    date held_at
    text summary "结论纪要"
  }
  RETRO_FEEDBACK {
    bigint id PK
    bigint retro_id FK
    bigint author_id FK "匿名时不展示"
    boolean anonymous
    string quadrant "做得好/待改进/困惑/建议"
    text content
    int votes
  }
  ACTION_ITEM {
    bigint id PK
    bigint retro_id FK
    string title
    text measurable "可衡量的验收信号"
    bigint owner_id FK
    date due_date
    string category "流程/协作/工程/基础设施"
    string status "待细化/已立项/进行中/已闭环/已延期/已放弃"
    bigint work_item_id FK "生成的任务"
    int progress_pct
  }
  NOTIFY_RULE {
    bigint id PK
    string name
    string category "需求/迭代/代码/CI/缺陷/工单/客户/工时/复盘/测试/汇总"
    string trigger_condition "WHEN 表达式"
    json audience "WHO 接收对象"
    string channel "应用消息/群机器人/两者"
    string timing "实时/定时/周期"
    bigint template_id FK
    boolean enabled
  }
  NOTIFY_TEMPLATE {
    bigint id PK
    string name
    string card_type "文本卡片/图文/模板卡片"
    text content_template "变量占位"
    json actions "按钮动作"
  }
  NOTIFY_LOG {
    bigint id PK
    bigint rule_id FK
    bigint receiver_id FK
    string entity_type
    bigint entity_id
    string send_status "成功/失败/限流"
    boolean read
    boolean clicked
    datetime sent_at
  }
  SUBSCRIPTION {
    bigint id PK
    bigint user_id FK
    string category
    boolean enabled
    string quiet_hours "免打扰时段"
  }
  AUDIT_LOG {
    bigint id PK
    bigint operator_id FK
    string action "权限变更/数据导出/门禁豁免/强制流转"
    string entity_type
    bigint entity_id
    json before_value
    json after_value
    string ip
    datetime created_at
  }

  TEAM ||--o{ USER : "成员"
  USER ||--o{ WORKLOG : "工时"
  WORKLOG ||--o{ WORKLOG_SOURCE : "推算来源"
  RETRO ||--o{ RETRO_FEEDBACK : "反馈"
  RETRO ||--o{ ACTION_ITEM : "行动项"
  NOTIFY_RULE ||--o{ NOTIFY_LOG : "发送记录"
  NOTIFY_TEMPLATE ||--o{ NOTIFY_RULE : "使用模板"
  USER ||--o{ SUBSCRIPTION : "订阅设置"
  USER ||--o{ AUDIT_LOG : "操作留痕"
```

---

## 三、核心表字段字典（补充说明）

字段类型与含义已在上方 ER 图中标注，此处只补充**计算字段**与**易误解字段**的口径。

### requirement

| 字段 | 口径说明 |
| --- | --- |
| `value_score` / `urgency_score` | 0-100 整数。价值来自人工打分并用收益量化自动校验；紧迫性由承诺日期与合规窗口自动推算后允许人工修正 |
| `priority_score` | 由当前生效的 `priority_model` 计算，写入时同时落 `PRIORITY_SCORE` 快照，模型升级不影响历史可复现性 |
| `effort_days` | 研发评估的人日，作为优先级算法的除数；未评估时按同类需求中位数临时填充并标记"待评估" |
| `status_entered_at` | 用于停留超时提醒与前置时间分解，状态每次变更都刷新 |
| `portal_visible` | 控制是否在业务方门户可见，默认 false，需产品负责人显式开启 |

### work_item

| 字段 | 口径说明 |
| --- | --- |
| `story_points` | 仅 `story` 与部分 `task` 使用；缺陷默认不计入迭代承诺点数（见主文档开放问题 Q4） |
| `blocked` / `blocked_at` | 阻塞是独立标记而非状态，卡片可以"在开发中且被阻塞"；阻塞时长单独统计并计入非增值时间 |
| `claimable` | 任务池自助认领开关，按工作项类型默认值：story/task/bug/debt 可认领，epic/requirement 不可 |
| `skill_tags` | 用于任务池的技能匹配推送，软校验（不阻断非匹配人员认领） |

### worklog

| 字段 | 口径说明 |
| --- | --- |
| `estimated_hours` | 系统推算结果，等于编码 + 评审 + 联调 + 会议，按 0.5 小时取整 |
| `confirmed_hours` | 成员确认值，允许相对推算值 ±30% 调整，超出需填 `adjust_reason` |
| `allocated` | 是否成功按编号归集到需求/项目；未归集的进入治理看板由负责人认领 |
| 成本换算 | 人力成本 = `confirmed_hours` × `user.hourly_cost`，团队级公开、个人级受限 |

### escape_analysis

| 字段 | 口径说明 |
| --- | --- |
| `verdict` | 六类判定之一，由反查规则自动给出，测试经理每周复核 |
| `responsible_stage` | 只到环节与团队，不落到个人（见主文档开放问题 Q5） |
| `exposure_days` | 版本发布日到线上问题首次上报日的自然日差，衡量问题暴露速度 |
| `similar_ticket_count` | 聚类到同一问题的工单数量，用于评估客户影响面 |

---

## 四、枚举字典

| 枚举组 | 取值 |
| --- | --- |
| 优先级 `priority` | P0 / P1 / P2 / P3 |
| 客户等级 `customer.level` | 战略（系数 3）/ KA（系数 2）/ 普通（系数 1） |
| 需求来源 `requirement.channel` | 工单 / 客户反馈 / 产品规划 / 监管合规 / 数据洞察 / 竞品对标 |
| 需求类型 `requirement.type` | 功能需求 / 体验优化 / 技术需求 / 合规需求 |
| 工作项类型 `work_item.type` | epic / story / task / bug / debt（测试用例独立表） |
| 工单渠道 `ticket.channel` | 客服热线 / 企业微信 / 客户经理 / 开放平台 / 邮件 / 官网客服 |
| 分诊结论 `triage.verdict` | 需求 / 缺陷 / 重复 / 咨询 / 不予处理 / 待补充信息 |
| 环境 `env` | dev / test / staging(预发) / prod(生产) |
| 项目健康度 `project.health` | 健康 / 关注 / 风险 / 已完成 / 未开始 |
| 漏测判定 `escape.verdict` | 用例缺失 / 执行遗漏 / 用例失效 / 环境差异 / 需求遗漏 / 外部因素 |
| 推送渠道 `notify.channel` | 应用消息 / 群机器人 / 两者 / 电话（仅 P0） |
| 平台角色 `user.platform_role` | 超管 / 空间管理 / 项目管理 / 成员 / 访客 |

各对象的**状态枚举**见 [状态机设计](state-machines.md)，此处不重复。

---

## 五、关键约束与索引建议

### 唯一约束

| 表 | 约束 |
| --- | --- |
| `requirement` | `code` 唯一 |
| `work_item` | `code` 唯一 |
| `ticket` | `code` 唯一 |
| `req_source` | (`requirement_id`, `source_type`, `source_id`) 唯一，防止重复关联 |
| `req_customer` | (`requirement_id`, `customer_id`) 唯一 |
| `worklog` | (`user_id`, `work_date`, `work_item_id`) 唯一，保证一人一天一工作项一条 |
| `test_result` | (`run_id`, `case_id`) 唯一 |
| `capacity_allocation` | (`user_id`, `project_id`, `week_start`) 唯一 |

### 索引

| 表 | 索引 | 支撑场景 |
| --- | --- | --- |
| `work_item` | (`project_id`, `sprint_id`, `status`) | 看板按项目/迭代/列查询 |
| `work_item` | (`assignee_id`, `status`) | 我的工作、个人负载 |
| `work_item` | (`requirement_id`) | 需求进度汇总 |
| `requirement` | (`product_id`, `status`, `priority_score` desc) | 需求池排序与筛选 |
| `ticket` | (`status`, `sla_due_at`) | SLA 预警扫描 |
| `state_transition_log` | (`entity_type`, `entity_id`, `created_at`) | 流转轨迹与停留时长计算 |
| `commit` | (`work_item_id`, `committed_at`) | 工时推算与研发上下文 |
| `metric_snapshot` | (`metric_code`, `scope_type`, `scope_id`, `stat_date`) | 度量看板查询 |
| `notify_log` | (`rule_id`, `sent_at`) | 推送效果统计 |

### 基础设施表

除业务实体外，还有四张支撑表（不在业务 ER 图中，但同样由 Flyway 建表）：

| 表 | 用途 | 关键字段 |
| --- | --- | --- |
| `state_transition_log` | 状态流转历史与停留时长（已在 2.3 节 ER 图中） | entity_type / entity_id / from_status / to_status / trigger_type / duration_sec |
| `audit_log` | 敏感操作留痕（已在 2.5 节 ER 图中） | operator_id / action / before_value / after_value / ip |
| `metric_snapshot` | 指标预聚合（已在 2.5 节 ER 图中） | metric_code / scope_type / scope_id / stat_date / period / value |
| `outbox_event` | **本地消息表**：领域事件与业务数据同事务落库，再由定时任务投递到消息队列，避免"事务提交成功但消息发送失败"导致自动化静默失效 | id / event_id(唯一) / topic / tag / shard_key(实体 ID，用于顺序消费选队列) / payload(JSON) / status(待发送/已发送/失败) / retry_count / next_retry_at / created_at / sent_at |

`outbox_event` 的约束：`event_id` 唯一；索引 `(status, next_retry_at)` 支撑定时扫描；已发送记录保留 7 天后归档清理。

### 完整性与一致性规则

1. `work_item.requirement_id` 非空时，其 `project_id` 必须与需求排期的项目一致（跨项目拆解需显式确认）。
2. 需求进入"开发中"要求至少存在一个子工作项；子工作项全部完成时需求不自动完成，仍需人工确认（避免技术完成 ≠ 业务完成）。
3. `sprint.committed_points` 在迭代开始后冻结；后续插入的工作项计入"范围变更"而不修改承诺基线。
4. 删除采用软删除；被引用的主数据（客户、产品、用户）禁止物理删除，只能停用。
5. 归档需求保留全部关联关系，复活时不重建 ID，保证历史链路连续。
