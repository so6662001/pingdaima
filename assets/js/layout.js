/* 全局布局：侧边导航 + 顶栏 + 命令面板 + 通知中心 */
(function () {
  'use strict';

  var NAV = [
    {
      group: '工作区', items: [
        { key: 'dashboard', name: '工作台', icon: 'dashboard', href: 'index.html' },
        { key: 'mywork', name: '我的工作', icon: 'inbox', href: 'mywork.html', badge: '9' }
      ]
    },
    {
      group: '需求与客户', items: [
        { key: 'requirement', name: '需求管理', icon: 'bulb', href: 'requirement.html', badge: '12' },
        { key: 'ticket', name: '工单管理', icon: 'inbox', href: 'ticket.html', badge: '23' },
        { key: 'customer', name: '客户跟踪', icon: 'building', href: 'customer.html' }
      ]
    },
    {
      group: '交付管理', items: [
        { key: 'product', name: '产品管理', icon: 'box', href: 'product.html' },
        { key: 'project', name: '项目管理', icon: 'kanban', href: 'project.html' },
        { key: 'agile', name: '敏捷迭代', icon: 'refresh', href: 'agile.html' },
        { key: 'testing', name: '测试管理', icon: 'flask', href: 'testing.html' }
      ]
    },
    {
      group: '工程效能', items: [
        { key: 'devops', name: '代码与 CI', icon: 'branch', href: 'devops.html' },
        { key: 'worklog', name: '智能工时', icon: 'timer', href: 'worklog.html' },
        { key: 'metrics', name: '效能度量', icon: 'chart', href: 'metrics.html' }
      ]
    },
    {
      group: '组织协同', items: [
        { key: 'notify', name: '消息与推送', icon: 'send', href: 'notify.html' },
        { key: 'retro', name: '复盘中心', icon: 'history', href: 'retro.html' },
        { key: 'wiki', name: '知识库', icon: 'book', href: 'wiki.html' },
        { key: 'portal', name: '业务方门户', icon: 'share', href: 'portal.html' },
        { key: 'settings', name: '系统设置', icon: 'settings', href: 'settings.html' }
      ]
    }
  ];

  var SEARCH_INDEX = [
    { t: 'REQ-2041 支付网关多渠道路由能力', d: '需求 · 交易平台 · 来源 TK-3821', href: 'requirement-detail.html', ico: 'bulb' },
    { t: 'REQ-2036 商户后台账单导出优化', d: '需求 · 商户中心', href: 'requirement.html', ico: 'bulb' },
    { t: 'TK-3821 大额账单导出超时，影响门店对账', d: '工单 · 华南连锁商超集团 · P1', href: 'ticket.html', ico: 'inbox' },
    { t: '华南连锁商超集团', d: '客户 · 战略客户 · 在跟需求 6 条', href: 'customer.html', ico: 'building' },
    { t: 'Sprint 26-14 迭代回顾', d: '复盘 · 交易平台组 · 改进项 5 项', href: 'retro.html', ico: 'history' },
    { t: '我的工时（自动采集）', d: '智能工时 · 本周 32.5 小时', href: 'worklog.html', ico: 'timer' },
    { t: 'PRJ-018 支付网关 3.0 重构', d: '项目 · 进行中', href: 'project-detail.html', ico: 'kanban' },
    { t: 'PROD-03 智能风控平台', d: '产品 · V2.8', href: 'product.html', ico: 'box' },
    { t: 'TP-2026-07 支付网关 3.0 回归测试计划', d: '测试计划 · 执行中', href: 'testing.html', ico: 'flask' },
    { t: 'payment-gateway #482 feat: 路由策略引擎', d: 'Pull Request · 待评审', href: 'devops.html', ico: 'pr' },
    { t: 'DORA 四大指标看板', d: '效能度量', href: 'metrics.html', ico: 'chart' },
    { t: '研发流程规范 V4.2', d: '知识库 · 研发中心', href: 'wiki.html', ico: 'book' },
    { t: 'GitHub 集成配置', d: '系统设置 · 集成中心', href: 'settings.html', ico: 'github' }
  ];

  var NOTICES = [
    { ico: 'pr', c: 'purple', t: '<b>陈立</b> 请求你评审 PR #482 <span class="muted">payment-gateway</span>', time: '3 分钟前', unread: true },
    { ico: 'bug', c: 'red', t: '<b>BUG-771</b> 生产环境对账任务超时被升级为 <b>P0</b>', time: '22 分钟前', unread: true },
    { ico: 'zap', c: 'orange', t: '流水线 <b>payment-gateway / release-3.0</b> 构建失败', time: '1 小时前', unread: true },
    { ico: 'bulb', c: 'brand', t: '<b>周雅</b> 提交的需求 REQ-2041 等待你的架构评审', time: '2 小时前', unread: false },
    { ico: 'circleCheck', c: 'green', t: '迭代 <b>Sprint 26-14</b> 已完成验收，交付 38 个故事点', time: '昨天 18:20', unread: false }
  ];

  function mount() {
    var app = document.querySelector('.app');
    if (!app) return;
    var cur = document.body.dataset.nav || 'dashboard';

    /* 侧边栏 */
    var side = document.createElement('aside');
    side.className = 'sidebar';
    var navHtml = NAV.map(function (g) {
      return '<div class="nav-group-title">' + g.group + '</div>' + g.items.map(function (it) {
        return '<a class="nav-item' + (it.key === cur ? ' active' : '') + '" href="' + it.href + '">' +
          icon(it.icon, 16) + '<span class="nav-label">' + it.name + '</span>' +
          (it.badge ? '<span class="nav-badge' + (it.key === 'mywork' ? ' soft' : '') + '">' + it.badge + '</span>' : '') +
          '</a>';
      }).join('');
    }).join('');
    side.innerHTML =
      '<div class="sidebar-brand">' +
      '<div class="brand-mark">DF</div>' +
      '<div class="sidebar-brand-text">DevFlow<small>研发管理平台</small></div>' +
      '</div>' +
      '<nav class="sidebar-nav">' + navHtml + '</nav>' +
      '<div class="sidebar-foot" id="sideCollapse">' + icon('panel', 16) + '<span class="sidebar-foot-text">收起导航</span></div>';
    app.prepend(side);

    /* 顶栏 */
    var main = app.querySelector('.main');
    if (!main) return;
    var crumbs = (document.body.dataset.crumb || '工作台').split('/');
    var crumbHtml = crumbs.map(function (c, i) {
      return (i ? '<span class="sep">' + icon('right', 12) + '</span>' : '') +
        '<span class="' + (i === crumbs.length - 1 ? 'cur' : '') + '">' + c + '</span>';
    }).join('');
    var bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML =
      '<button class="icon-btn" id="navToggle" title="折叠导航">' + icon('list', 17) + '</button>' +
      '<div class="breadcrumb">' + crumbHtml + '</div>' +
      '<div class="topbar-search" id="globalSearch">' + icon('search', 15) +
      '<input placeholder="搜索需求 / 项目 / 文档 / 代码…" readonly><kbd>Ctrl K</kbd></div>' +
      '<div class="vdivider"></div>' +
      '<button class="btn btn-primary btn-sm" id="quickCreate" style="height:29px">' + icon('plus', 14) + '新建</button>' +
      '<button class="icon-btn tip" data-tip="帮助中心" id="helpBtn">' + icon('help', 17) + '</button>' +
      '<button class="icon-btn tip" data-tip="通知" id="bellBtn">' + icon('bell', 17) + '<i class="dot"></i></button>' +
      '<div class="user-chip" id="userChip">' +
      '<span class="avatar" style="background:linear-gradient(135deg,#2b5cff,#7c5cff)">SZ</span>' +
      '<div><div class="u-name">沈知远</div><div class="u-role">研发中心总裁</div></div>' +
      icon('down', 13) + '</div>';
    main.prepend(bar);

    /* 折叠 */
    function toggleCollapse() {
      app.classList.toggle('collapsed');
      localStorage.setItem('df_collapsed', app.classList.contains('collapsed') ? '1' : '0');
      window.dispatchEvent(new Event('resize'));
    }
    document.getElementById('navToggle').onclick = toggleCollapse;
    document.getElementById('sideCollapse').onclick = toggleCollapse;
    if (localStorage.getItem('df_collapsed') === '1') {
      app.classList.add('collapsed');
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
    }

    /* 快捷创建 */
    document.getElementById('quickCreate').onclick = function () {
      UI.menu(this, [
        { label: '新建需求', icon: 'bulb', act: 'req', onClick: function () { location.href = 'requirement.html?new=1'; } },
        { label: '新建工作项', icon: 'kanban', act: 'task', onClick: function () { UI.toast('已打开工作项创建面板'); } },
        { label: '提交缺陷', icon: 'bug', act: 'bug', onClick: function () { location.href = 'testing.html?tab=bug'; } },
        { label: '新建测试用例', icon: 'flask', act: 'case', onClick: function () { location.href = 'testing.html'; } },
        '-',
        { label: '新建项目', icon: 'folder', act: 'prj', onClick: function () { location.href = 'project.html?new=1'; } },
        { label: '新建知识库页面', icon: 'book', act: 'doc', onClick: function () { location.href = 'wiki.html'; } }
      ], 'right');
    };
    document.getElementById('helpBtn').onclick = function () {
      UI.menu(this, [
        { label: '快速上手指南', icon: 'rocket' },
        { label: '研发流程规范', icon: 'book', onClick: function () { location.href = 'wiki.html'; } },
        { label: '快捷键 (Ctrl + /)', icon: 'cpu' },
        '-', { label: '提交产品反馈', icon: 'send' }
      ], 'right');
    };
    document.getElementById('userChip').onclick = function () {
      UI.menu(this, [
        { label: '个人资料', icon: 'user' },
        { label: '我的关注', icon: 'star' },
        { label: '偏好设置', icon: 'sliders', onClick: function () { location.href = 'settings.html'; } },
        '-', { label: '退出登录', icon: 'logout', danger: true, onClick: function () { location.href = 'login.html'; } }
      ], 'right');
    };

    /* 通知中心 */
    document.getElementById('bellBtn').onclick = function (e) {
      e.stopPropagation();
      var old = document.getElementById('noticePop');
      if (old) { old.remove(); return; }
      var pop = document.createElement('div');
      pop.className = 'menu';
      pop.id = 'noticePop';
      pop.style.cssText = 'width:352px;padding:0;right:16px;left:auto;top:' + (56 + window.scrollY) + 'px;position:fixed';
      pop.innerHTML =
        '<div class="flex items-center" style="padding:11px 14px;border-bottom:1px solid var(--ink-100)">' +
        '<b style="font-size:13px">通知中心</b><span class="tag danger" style="margin-left:6px">3 条未读</span>' +
        '<span class="ml-auto fz11" style="color:var(--brand-600);cursor:pointer">全部已读</span></div>' +
        '<div style="max-height:340px;overflow:auto">' + NOTICES.map(function (n) {
          return '<div class="flex gap10" style="padding:10px 14px;border-bottom:1px solid var(--ink-100);cursor:pointer;background:' + (n.unread ? 'var(--brand-50)' : '#fff') + '">' +
            '<span class="tico ' + ({ purple: 'epic', red: 'bug', orange: 'doc', brand: 'req', green: 'story' }[n.c]) + '">' + icon(n.ico, 11) + '</span>' +
            '<div style="flex:1;min-width:0"><div style="font-size:12.5px;line-height:1.55">' + n.t + '</div>' +
            '<div class="muted fz11 mt4">' + n.time + '</div></div></div>';
        }).join('') + '</div>' +
        '<div class="tc" style="padding:9px;font-size:12px;color:var(--brand-600);cursor:pointer">查看全部通知</div>';
      document.body.appendChild(pop);
      setTimeout(function () {
        document.addEventListener('click', function h(ev) {
          if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', h); }
        });
      }, 0);
    };

    /* 命令面板 */
    buildPalette();
    document.getElementById('globalSearch').onclick = openPalette;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    });
  }

  function buildPalette() {
    var m = document.createElement('div');
    m.className = 'modal';
    m.id = 'cmdPalette';
    m.style.cssText = 'width:600px;top:22%;transform:translate(-50%,0) scale(.97)';
    m.innerHTML =
      '<div style="padding:12px 16px;border-bottom:1px solid var(--ink-200);display:flex;align-items:center;gap:10px">' +
      icon('search', 17) + '<input id="cmdInput" placeholder="搜索需求、项目、文档、代码仓库…" style="flex:1;border:none;outline:none;font-size:14px">' +
      '<kbd style="font-size:10px;color:var(--ink-400);border:1px solid var(--ink-200);border-radius:4px;padding:1px 5px">ESC</kbd></div>' +
      '<div id="cmdList" style="max-height:380px;overflow:auto;padding:6px"></div>' +
      '<div style="padding:8px 14px;border-top:1px solid var(--ink-100);font-size:11px;color:var(--ink-400);display:flex;gap:14px">' +
      '<span>↑↓ 选择</span><span>↵ 打开</span><span>支持 ID、标题、负责人搜索</span></div>';
    document.body.appendChild(m);
    renderPalette('');
    m.querySelector('#cmdInput').addEventListener('input', function () { renderPalette(this.value); });
  }
  function renderPalette(q) {
    var list = document.getElementById('cmdList');
    var items = SEARCH_INDEX.filter(function (i) { return !q || (i.t + i.d).toLowerCase().indexOf(q.toLowerCase()) > -1; });
    list.innerHTML = (q ? '' : '<div class="nav-group-title" style="color:var(--ink-400);padding:8px 10px 4px">最近访问</div>') +
      (items.length ? items.map(function (i) {
        return '<a class="menu-item" href="' + i.href + '" style="padding:9px 10px">' + icon(i.ico, 15) +
          '<span style="flex:1"><span style="display:block;color:var(--ink-800)">' + i.t + '</span>' +
          '<span class="muted fz11">' + i.d + '</span></span>' + icon('right', 13) + '</a>';
      }).join('') : '<div class="empty" style="padding:30px">' + icon('search', 36) + '<div class="t">未找到匹配结果</div></div>');
  }
  function openPalette() {
    UI.openModal('cmdPalette');
    setTimeout(function () { document.getElementById('cmdInput').focus(); }, 60);
  }

  document.addEventListener('DOMContentLoaded', mount);
  window.APP_NAV = NAV;
})();
