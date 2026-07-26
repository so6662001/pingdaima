/* 通用交互组件：Toast / 抽屉 / 弹窗 / 标签页 / 下拉菜单 / 看板拖拽 */
(function () {
  'use strict';

  var UI = {};

  /* ---------- Toast ---------- */
  UI.toast = function (msg, type) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast ' + (type === 'error' ? 'err' : 'ok');
    el.innerHTML = icon(type === 'error' ? 'alert' : 'circleCheck', 15) + '<span>' + msg + '</span>';
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(function () { el.remove(); }, 260);
    }, 2200);
  };

  /* ---------- 遮罩 ---------- */
  function mask() {
    var m = document.querySelector('.mask');
    if (!m) {
      m = document.createElement('div');
      m.className = 'mask';
      document.body.appendChild(m);
      m.addEventListener('click', function () { UI.closeAll(); });
    }
    return m;
  }

  /* ---------- 抽屉 ---------- */
  UI.openDrawer = function (id) {
    var d = typeof id === 'string' ? document.getElementById(id) : id;
    if (!d) return;
    mask().classList.add('show');
    d.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  UI.openModal = function (id) {
    var d = typeof id === 'string' ? document.getElementById(id) : id;
    if (!d) return;
    mask().classList.add('show');
    d.classList.add('show');
  };
  UI.closeAll = function () {
    document.querySelectorAll('.drawer.show, .modal.show').forEach(function (e) { e.classList.remove('show'); });
    var m = document.querySelector('.mask');
    if (m) m.classList.remove('show');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { UI.closeAll(); UI.closeMenus(); }
  });

  /* ---------- 下拉菜单 ---------- */
  UI.closeMenus = function () {
    document.querySelectorAll('.menu[data-pop]').forEach(function (m) { m.remove(); });
  };
  UI.menu = function (anchor, items, align) {
    UI.closeMenus();
    var m = document.createElement('div');
    m.className = 'menu';
    m.setAttribute('data-pop', '1');
    m.innerHTML = items.map(function (it) {
      if (it === '-') return '<div class="menu-sep"></div>';
      return '<div class="menu-item' + (it.danger ? ' danger' : '') + '" data-act="' + (it.act || '') + '">' +
        (it.icon ? icon(it.icon, 14) : '') + '<span>' + it.label + '</span>' +
        (it.right ? '<span class="ml-auto muted fz11">' + it.right + '</span>' : '') + '</div>';
    }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var top = r.bottom + 6;
    var left = align === 'right' ? r.right - m.offsetWidth : r.left;
    if (top + m.offsetHeight > window.innerHeight - 10) top = r.top - m.offsetHeight - 6;
    m.style.top = (top + window.scrollY) + 'px';
    m.style.left = (Math.max(8, left) + window.scrollX) + 'px';
    m.addEventListener('click', function (e) {
      var it = e.target.closest('.menu-item');
      if (!it) return;
      var found = items.filter(function (x) { return x !== '-' && (x.act || '') === it.dataset.act; })[0];
      UI.closeMenus();
      if (found && found.onClick) found.onClick();
      else UI.toast('已执行：' + (found ? found.label : ''));
    });
    setTimeout(function () {
      document.addEventListener('click', function h(ev) {
        if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('click', h); }
      });
    }, 0);
  };

  /* ---------- 标签页 ---------- */
  UI.initTabs = function (root) {
    (root || document).querySelectorAll('.tabs').forEach(function (tabs) {
      tabs.addEventListener('click', function (e) {
        var t = e.target.closest('.tab');
        if (!t || !t.dataset.tab) return;
        tabs.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var scope = tabs.dataset.scope ? document.querySelector(tabs.dataset.scope) : document;
        scope.querySelectorAll('.tab-pane[data-pane]').forEach(function (p) {
          if (p.closest('.tab-pane') !== p && p.parentElement.closest('.tab-pane')) return;
          p.classList.toggle('active', p.dataset.pane === t.dataset.tab);
        });
        window.dispatchEvent(new CustomEvent('tabchange', { detail: t.dataset.tab }));
      });
    });
  };

  /* ---------- 通用开关 / 勾选 / 过滤按钮 ---------- */
  UI.initToggles = function (root) {
    var r = root || document;
    r.addEventListener('click', function (e) {
      var sw = e.target.closest('.switch');
      if (sw) { sw.classList.toggle('on'); return; }
      var cb = e.target.closest('.checkbox');
      if (cb) { cb.classList.toggle('checked'); e.stopPropagation(); return; }
      var pill = e.target.closest('.pills .pill');
      if (pill) {
        pill.parentElement.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
      }
      var seg = e.target.closest('.btn-group button');
      if (seg) {
        seg.parentElement.querySelectorAll('button').forEach(function (p) { p.classList.remove('active'); });
        seg.classList.add('active');
      }
    });
  };

  /* ---------- 看板拖拽 ---------- */
  UI.initKanban = function (root) {
    var scope = root || document;
    var dragging = null;
    scope.querySelectorAll('.kcard').forEach(function (c) { c.setAttribute('draggable', 'true'); });
    scope.addEventListener('dragstart', function (e) {
      var c = e.target.closest('.kcard');
      if (!c) return;
      dragging = c;
      c.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    scope.addEventListener('dragend', function () {
      if (dragging) dragging.classList.remove('dragging');
      scope.querySelectorAll('.board-col').forEach(function (c) { c.classList.remove('drop'); });
      dragging = null;
      UI.refreshBoardCounts(scope);
    });
    scope.querySelectorAll('.board-col').forEach(function (col) {
      col.addEventListener('dragover', function (e) {
        if (!dragging) return;
        e.preventDefault();
        col.classList.add('drop');
        var body = col.querySelector('.board-col-body');
        var after = null;
        body.querySelectorAll('.kcard:not(.dragging)').forEach(function (c) {
          var box = c.getBoundingClientRect();
          if (e.clientY > box.top + box.height / 2) after = c;
        });
        if (after) after.after(dragging); else body.prepend(dragging);
      });
      col.addEventListener('dragleave', function (e) {
        if (!col.contains(e.relatedTarget)) col.classList.remove('drop');
      });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.classList.remove('drop');
        UI.toast('已移动到「' + col.querySelector('.name').textContent + '」');
      });
    });
  };
  UI.refreshBoardCounts = function (root) {
    (root || document).querySelectorAll('.board-col').forEach(function (col) {
      var n = col.querySelectorAll('.kcard').length;
      var c = col.querySelector('.cnt');
      if (c) c.textContent = n;
    });
  };

  /* ---------- 工具函数 ---------- */
  UI.avatar = function (name, cls) {
    var colors = ['#2b5cff', '#7c5cff', '#15a86b', '#f59e0b', '#e5484d', '#0fb5ba', '#e93d82', '#0ea5e9', '#6366f1', '#0891b2'];
    var s = 0;
    for (var i = 0; i < name.length; i++) s += name.charCodeAt(i);
    var txt = /[A-Za-z]/.test(name[0]) ? name.slice(0, 2).toUpperCase() : name.slice(-2);
    return '<span class="avatar ' + (cls || '') + '" style="background:' + colors[s % colors.length] + '" title="' + name + '">' + txt + '</span>';
  };
  UI.avatarGroup = function (names, max) {
    max = max || 4;
    var shown = names.slice(0, max);
    var html = '<span class="avatar-group">' + shown.map(function (n) { return UI.avatar(n, 'sm'); }).join('');
    if (names.length > max) html += '<span class="avatar-more">+' + (names.length - max) + '</span>';
    return html + '</span>';
  };
  UI.priority = function (p) {
    var map = { P0: ['pri-p0', '最高'], P1: ['pri-p1', '高'], P2: ['pri-p2', '中'], P3: ['pri-p3', '低'] };
    var m = map[p] || map.P2;
    return '<span class="pri ' + m[0] + '">' + icon('flag', 11) + p + '</span>';
  };
  UI.bar = function (pct, color, cls) {
    return '<div class="bar ' + (cls || '') + '"><i class="' + (color || '') + '" style="width:' + pct + '%"></i></div>';
  };
  UI.fmt = function (n) { return n.toLocaleString('en-US'); };
  /** 将 <span data-icon="name" data-size="16"></span> 占位符替换为内联 SVG */
  UI.hydrateIcons = function (root) {
    var scope = root || document;
    // 替换 outerHTML 会改变文档结构，循环直到没有剩余占位符
    for (var pass = 0; pass < 3; pass++) {
      var list = scope.querySelectorAll('[data-icon]');
      if (!list.length) break;
      list.forEach(function (s) {
        if (!s.parentNode) return;
        s.outerHTML = icon(s.dataset.icon, +(s.dataset.size || 15));
      });
    }
  };

  window.UI = UI;

  document.addEventListener('DOMContentLoaded', function () {
    UI.hydrateIcons();
    UI.initTabs();
    UI.initToggles();
    UI.initKanban();
    UI.refreshBoardCounts();
    // 支持 #tab=xxx 深链直接打开指定标签页
    var h = location.hash.match(/tab=([\w-]+)/);
    if (h) {
      var t = document.querySelector('.tab[data-tab="' + h[1] + '"]');
      if (t) t.click();
    }
    // 通用触发器：data-drawer / data-modal / data-close / data-toast
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-drawer]');
      if (t) { UI.openDrawer(t.dataset.drawer); return; }
      var m = e.target.closest('[data-modal]');
      if (m) { UI.openModal(m.dataset.modal); return; }
      var c = e.target.closest('[data-close]');
      if (c) { UI.closeAll(); return; }
      var tt = e.target.closest('[data-toast]');
      if (tt) { UI.toast(tt.dataset.toast); }
    });
  });
})();
