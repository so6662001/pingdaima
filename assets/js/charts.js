/* 轻量 SVG 图表引擎（折线/面积/柱状/堆叠/环形/仪表/雷达/热力/迷你图） */
(function () {
  'use strict';

  var PALETTE = ['#2b5cff', '#15a86b', '#f59e0b', '#7c5cff', '#e5484d', '#0fb5ba', '#e93d82', '#0ea5e9'];
  var uid = 0;
  var registry = [];

  function el(target) { return typeof target === 'string' ? document.querySelector(target) : target; }
  function w(node, fallback) { return node.clientWidth || fallback || 600; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function niceMax(v) {
    if (v <= 0) return 10;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / p;
    var f = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : n <= 8 ? 8 : 10;
    return f * p;
  }
  function fmtNum(n) {
    if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(n * 100) / 100;
  }
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }
  function linePath(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('');
  }

  var Charts = {};

  /* ---------------- 折线 / 面积 ---------------- */
  Charts.line = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.line);
    o = o || {};
    var H = o.height || 220, W = w(node);
    var pl = o.padLeft == null ? 40 : o.padLeft, pr = 14, pt = 14, pb = 26;
    var iw = W - pl - pr, ih = H - pt - pb;
    var labels = o.labels || [];
    var series = o.series || [];
    var max = o.yMax || niceMax(Math.max.apply(null, series.reduce(function (a, s) { return a.concat(s.data); }, [1])) * 1.12);
    var min = o.yMin || 0;
    var n = labels.length;
    var xs = function (i) { return pl + (n <= 1 ? iw / 2 : iw * i / (n - 1)); };
    var ys = function (v) { return pt + ih - ih * (v - min) / (max - min); };
    var id = 'cg' + (++uid);
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '"><defs>';
    series.forEach(function (se, k) {
      var c = se.color || PALETTE[k % PALETTE.length];
      s += '<linearGradient id="' + id + '_' + k + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + c + '" stop-opacity=".26"/>' +
        '<stop offset="100%" stop-color="' + c + '" stop-opacity="0"/></linearGradient>';
    });
    s += '</defs>';
    // 网格 + Y 轴
    var steps = o.ySteps || 4;
    for (var g = 0; g <= steps; g++) {
      var v = min + (max - min) * g / steps, y = ys(v);
      s += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="#eef2f7" stroke-width="1"/>';
      s += '<text x="' + (pl - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#8c9ab1">' + (o.yFmt ? o.yFmt(v) : fmtNum(v)) + '</text>';
    }
    // X 轴标签
    var every = Math.ceil(n / (o.xTicks || 8));
    labels.forEach(function (l, i) {
      if (i % every && i !== n - 1) return;
      s += '<text x="' + xs(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10" fill="#8c9ab1">' + esc(l) + '</text>';
    });
    if (o.markX != null) {
      s += '<line x1="' + xs(o.markX) + '" y1="' + pt + '" x2="' + xs(o.markX) + '" y2="' + (pt + ih) + '" stroke="#e5484d" stroke-width="1" stroke-dasharray="3 3"/>';
    }
    // 数据
    series.forEach(function (se, k) {
      var c = se.color || PALETTE[k % PALETTE.length];
      var pts = se.data.map(function (v, i) { return [xs(i), ys(v)]; });
      var d = o.smooth === false ? linePath(pts) : smoothPath(pts);
      if (se.area) {
        s += '<path d="' + d + 'L' + xs(n - 1) + ',' + (pt + ih) + 'L' + xs(0) + ',' + (pt + ih) + 'Z" fill="url(#' + id + '_' + k + ')"/>';
      }
      s += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (se.width || 2) + '"' +
        (se.dashed ? ' stroke-dasharray="5 4"' : '') + ' stroke-linejoin="round" stroke-linecap="round"/>';
      if (se.dots !== false) {
        pts.forEach(function (p, i) {
          s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n > 20 ? 0 : 2.6) + '" fill="#fff" stroke="' + c + '" stroke-width="1.6"/>' +
            '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="9" fill="transparent"><title>' + esc(labels[i]) + ' · ' + esc(se.name || '') + '：' + se.data[i] + (o.unit || '') + '</title></circle>';
        });
      }
    });
    s += '</svg>';
    node.innerHTML = s;
  };

  /* ---------------- 柱状 / 堆叠柱 ---------------- */
  Charts.bar = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.bar);
    o = o || {};
    var H = o.height || 220, W = w(node);
    var pl = o.padLeft == null ? 40 : o.padLeft, pr = 14, pt = 14, pb = 26;
    var iw = W - pl - pr, ih = H - pt - pb;
    var labels = o.labels || [], series = o.series || [];
    var totals = labels.map(function (_, i) {
      return o.stacked ? series.reduce(function (a, s) { return a + (s.data[i] || 0); }, 0)
        : Math.max.apply(null, series.map(function (s) { return s.data[i] || 0; }));
    });
    var max = o.yMax || niceMax(Math.max.apply(null, totals.concat([1])) * 1.15);
    var n = labels.length;
    var band = iw / n;
    var gw = Math.min(o.barWidth || 26, band * 0.62);
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '">';
    var steps = o.ySteps || 4;
    for (var g = 0; g <= steps; g++) {
      var v = max * g / steps, y = pt + ih - ih * g / steps;
      s += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="#eef2f7"/>';
      s += '<text x="' + (pl - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#8c9ab1">' + (o.yFmt ? o.yFmt(v) : fmtNum(v)) + '</text>';
    }
    labels.forEach(function (l, i) {
      var cx = pl + band * i + band / 2;
      s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10" fill="#8c9ab1">' + esc(l) + '</text>';
      if (o.stacked) {
        var acc = 0;
        series.forEach(function (se, k) {
          var val = se.data[i] || 0;
          if (!val) return;
          var h = ih * val / max;
          var y0 = pt + ih - ih * acc / max - h;
          acc += val;
          var c = se.color || PALETTE[k % PALETTE.length];
          var top = k === series.length - 1;
          s += '<rect x="' + (cx - gw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + gw.toFixed(1) + '" height="' + Math.max(h, 0).toFixed(1) +
            '" fill="' + c + '" rx="' + (top ? 3 : 0) + '"><title>' + esc(l) + ' · ' + esc(se.name || '') + '：' + val + (o.unit || '') + '</title></rect>';
        });
      } else {
        var each = gw / series.length;
        series.forEach(function (se, k) {
          var val = se.data[i] || 0;
          var h = ih * val / max;
          var c = se.color || PALETTE[k % PALETTE.length];
          s += '<rect x="' + (cx - gw / 2 + each * k).toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + (each - 2).toFixed(1) +
            '" height="' + Math.max(h, 0).toFixed(1) + '" fill="' + c + '" rx="3"><title>' + esc(l) + ' · ' + esc(se.name || '') + '：' + val + (o.unit || '') + '</title></rect>';
        });
      }
    });
    if (o.lineSeries) {
      var lp = o.lineSeries.data.map(function (v, i) { return [pl + band * i + band / 2, pt + ih - ih * v / (o.lineMax || max)]; });
      s += '<path d="' + smoothPath(lp) + '" fill="none" stroke="' + (o.lineSeries.color || '#f59e0b') + '" stroke-width="2"/>';
      lp.forEach(function (p, i) {
        s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="#fff" stroke="' + (o.lineSeries.color || '#f59e0b') + '" stroke-width="1.8"><title>' + esc(o.lineSeries.name) + '：' + o.lineSeries.data[i] + '</title></circle>';
      });
    }
    s += '</svg>';
    node.innerHTML = s;
  };

  /* ---------------- 横向条形 ---------------- */
  Charts.hbar = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.hbar);
    var items = o.data || [];
    var max = o.max || Math.max.apply(null, items.map(function (d) { return d.value; }).concat([1]));
    var html = '<div style="display:flex;flex-direction:column;gap:' + (o.gap || 11) + 'px">';
    items.forEach(function (d, i) {
      var c = d.color || PALETTE[i % PALETTE.length];
      html += '<div>' +
        '<div class="flex items-center" style="font-size:12px;margin-bottom:4px">' +
        '<span class="dim ellipsis" style="max-width:70%">' + esc(d.name) + '</span>' +
        '<span class="ml-auto strong" style="font-variant-numeric:tabular-nums">' + d.value + (o.unit || '') + '</span></div>' +
        '<div class="bar" style="height:' + (o.thickness || 7) + 'px"><i style="width:' + (d.value / max * 100).toFixed(1) + '%;background:' + c + '"></i></div>' +
        '</div>';
    });
    node.innerHTML = html + '</div>';
  };

  /* ---------------- 环形图 ---------------- */
  Charts.donut = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.donut);
    var size = o.size || 160, th = o.thickness || 20;
    var data = o.data || [];
    var total = data.reduce(function (a, d) { return a + d.value; }, 0) || 1;
    var r = size / 2 - th / 2 - 2, cx = size / 2, cy = size / 2;
    var s = '<svg class="chart" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" style="width:' + size + 'px">';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#eef2f7" stroke-width="' + th + '"/>';
    var acc = 0;
    var C = 2 * Math.PI * r;
    data.forEach(function (d, i) {
      var frac = d.value / total;
      var c = d.color || PALETTE[i % PALETTE.length];
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="' + th +
        '" stroke-dasharray="' + (C * frac - 1.5).toFixed(2) + ' ' + (C * (1 - frac) + 1.5).toFixed(2) + '"' +
        ' stroke-dashoffset="' + (-C * acc).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" stroke-linecap="' + (o.round ? 'round' : 'butt') + '">' +
        '<title>' + esc(d.name) + '：' + d.value + '（' + (frac * 100).toFixed(1) + '%）</title></circle>';
      acc += frac;
    });
    if (o.center) {
      s += '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" font-size="' + (o.centerSize || 22) + '" font-weight="650" fill="#10182b">' + esc(o.center.value) + '</text>';
      s += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="11" fill="#8c9ab1">' + esc(o.center.label) + '</text>';
    }
    s += '</svg>';
    var legend = '';
    if (o.legend !== false) {
      legend = '<div style="flex:1;display:flex;flex-direction:column;gap:7px;min-width:0">' + data.map(function (d, i) {
        var c = d.color || PALETTE[i % PALETTE.length];
        return '<div class="flex items-center gap8" style="font-size:12px">' +
          '<i style="width:8px;height:8px;border-radius:2px;background:' + c + '"></i>' +
          '<span class="dim ellipsis">' + esc(d.name) + '</span>' +
          '<span class="ml-auto strong">' + d.value + '</span>' +
          '<span class="muted" style="width:42px;text-align:right">' + (d.value / total * 100).toFixed(0) + '%</span></div>';
      }).join('') + '</div>';
    }
    node.innerHTML = '<div class="flex items-center gap16" style="justify-content:' + (o.legend === false ? 'center' : 'flex-start') + '">' + s + legend + '</div>';
  };

  /* ---------------- 仪表盘 ---------------- */
  Charts.gauge = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.gauge);
    var size = o.size || 150, th = o.thickness || 13;
    var val = o.value, max = o.max || 100;
    var r = size / 2 - th / 2 - 2, cx = size / 2, cy = size / 2 + 8;
    function pt(a) { var rad = (a - 180) * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; }
    function arc(a0, a1, color, width) {
      var p0 = pt(a0), p1 = pt(a1);
      var large = a1 - a0 > 180 ? 1 : 0;
      return '<path d="M' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) +
        '" fill="none" stroke="' + color + '" stroke-width="' + (width || th) + '" stroke-linecap="round"/>';
    }
    var ratio = Math.max(0, Math.min(1, val / max));
    var s = '<svg class="chart" viewBox="0 0 ' + size + ' ' + (size * 0.72) + '" height="' + (size * 0.72) + '" style="width:' + size + 'px;margin:0 auto">';
    s += arc(0, 180, '#eef2f7');
    s += arc(0, Math.max(ratio * 180, 0.6), o.color || '#2b5cff');
    s += '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" font-size="24" font-weight="650" fill="#10182b">' + (o.text != null ? o.text : val) + '</text>';
    s += '<text x="' + cx + '" y="' + (cy + 10) + '" text-anchor="middle" font-size="11" fill="#8c9ab1">' + esc(o.label || '') + '</text>';
    s += '</svg>';
    node.innerHTML = s;
  };

  /* ---------------- 雷达图 ---------------- */
  Charts.radar = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.radar);
    var size = o.size || 240, cx = size / 2, cy = size / 2, r = size / 2 - 34;
    var axes = o.axes || [], series = o.series || [];
    var n = axes.length, max = o.max || 100;
    function pt(i, v) {
      var a = -Math.PI / 2 + 2 * Math.PI * i / n;
      var rr = r * v / max;
      return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    }
    var s = '<svg class="chart" viewBox="0 0 ' + size + ' ' + size + '" height="' + size + '" style="width:' + size + 'px;margin:0 auto">';
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var p = axes.map(function (_, i) { return pt(i, max * f).map(function (x) { return x.toFixed(1); }).join(','); }).join(' ');
      s += '<polygon points="' + p + '" fill="' + (f === 1 ? '#f8fafc' : 'none') + '" stroke="#e5eaf2" stroke-width="1"/>';
    });
    axes.forEach(function (a, i) {
      var p = pt(i, max);
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#e5eaf2"/>';
      var lp = pt(i, max * 1.22);
      s += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3).toFixed(1) + '" text-anchor="middle" font-size="10.5" fill="#64748b">' + esc(a) + '</text>';
    });
    series.forEach(function (se, k) {
      var c = se.color || PALETTE[k % PALETTE.length];
      var p = se.data.map(function (v, i) { return pt(i, v).map(function (x) { return x.toFixed(1); }).join(','); }).join(' ');
      s += '<polygon points="' + p + '" fill="' + c + '" fill-opacity=".14" stroke="' + c + '" stroke-width="2" stroke-linejoin="round"/>';
      se.data.forEach(function (v, i) {
        var q = pt(i, v);
        s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3" fill="#fff" stroke="' + c + '" stroke-width="1.8"><title>' + esc(axes[i]) + '：' + v + '</title></circle>';
      });
    });
    s += '</svg>';
    node.innerHTML = s;
  };

  /* ---------------- 迷你折线 ---------------- */
  Charts.spark = function (data, o) {
    o = o || {};
    var W = o.width || 90, H = o.height || 30, c = o.color || '#2b5cff';
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data);
    var rng = max - min || 1;
    var pts = data.map(function (v, i) { return [i * W / (data.length - 1), H - 3 - (H - 8) * (v - min) / rng]; });
    var id = 'sp' + (++uid);
    var s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + c + '" stop-opacity=".3"/><stop offset="100%" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs>';
    if (o.area !== false) s += '<path d="' + smoothPath(pts) + 'L' + W + ',' + H + 'L0,' + H + 'Z" fill="url(#' + id + ')"/>';
    s += '<path d="' + smoothPath(pts) + '" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/></svg>';
    return s;
  };

  /* ---------------- 堆叠面积（累积流图） ---------------- */
  Charts.stackedArea = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.stackedArea);
    var H = o.height || 240, W = w(node);
    var pl = 40, pr = 14, pt = 14, pb = 26;
    var iw = W - pl - pr, ih = H - pt - pb;
    var labels = o.labels || [], series = o.series || [];
    var n = labels.length;
    var totals = labels.map(function (_, i) { return series.reduce(function (a, s) { return a + (s.data[i] || 0); }, 0); });
    var max = o.yMax || niceMax(Math.max.apply(null, totals.concat([1])) * 1.1);
    var xs = function (i) { return pl + iw * i / (n - 1); };
    var ys = function (v) { return pt + ih - ih * v / max; };
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '">';
    for (var g = 0; g <= 4; g++) {
      var y = pt + ih - ih * g / 4;
      s += '<line x1="' + pl + '" y1="' + y + '" x2="' + (W - pr) + '" y2="' + y + '" stroke="#eef2f7"/>' +
        '<text x="' + (pl - 7) + '" y="' + (y + 3.5) + '" text-anchor="end" font-size="10" fill="#8c9ab1">' + fmtNum(max * g / 4) + '</text>';
    }
    var every = Math.ceil(n / 8);
    labels.forEach(function (l, i) {
      if (i % every && i !== n - 1) return;
      s += '<text x="' + xs(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10" fill="#8c9ab1">' + esc(l) + '</text>';
    });
    var acc = labels.map(function () { return 0; });
    series.forEach(function (se, k) {
      var c = se.color || PALETTE[k % PALETTE.length];
      var upper = [], lower = [];
      labels.forEach(function (_, i) {
        lower.push([xs(i), ys(acc[i])]);
        acc[i] += se.data[i] || 0;
        upper.push([xs(i), ys(acc[i])]);
      });
      var d = smoothPath(upper) + 'L' + lower.slice().reverse().map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L') + 'Z';
      s += '<path d="' + d + '" fill="' + c + '" fill-opacity=".82" stroke="' + c + '" stroke-width="1"><title>' + esc(se.name) + '</title></path>';
    });
    s += '</svg>';
    node.innerHTML = s;
  };

  /* ---------------- 热力图（活跃度日历） ---------------- */
  Charts.heatmap = function (target, o) {
    var node = el(target); if (!node) return;
    register(node, o, Charts.heatmap);
    var weeks = o.weeks || 26, cell = o.cell || 11, gap = 3;
    var colors = o.colors || ['#eef2f7', '#c9dbff', '#8eb0ff', '#4d82ff', '#1d47e6'];
    var W = weeks * (cell + gap), H = 7 * (cell + gap) + 16;
    var data = o.data || [];
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '" preserveAspectRatio="xMinYMin meet">';
    for (var i = 0; i < weeks * 7; i++) {
      var v = data[i] == null ? Math.floor(Math.random() * 5) : data[i];
      var x = Math.floor(i / 7) * (cell + gap), y = (i % 7) * (cell + gap) + 14;
      s += '<rect x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="2.5" fill="' + colors[Math.min(v, 4)] + '"><title>' + (o.tip ? o.tip(i, v) : v + ' 次提交') + '</title></rect>';
    }
    (o.monthLabels || []).forEach(function (m) {
      s += '<text x="' + (m.week * (cell + gap)) + '" y="8" font-size="9.5" fill="#8c9ab1">' + esc(m.label) + '</text>';
    });
    s += '</svg>';
    node.innerHTML = s;
  };

  /* ---------------- 燃尽图 ---------------- */
  Charts.burndown = function (target, o) {
    var total = o.total, days = o.days, actual = o.actual;
    var ideal = days.map(function (_, i) { return +(total - total * i / (days.length - 1)).toFixed(1); });
    Charts.line(target, {
      height: o.height || 230,
      labels: days,
      unit: ' 点',
      series: [
        { name: '理想剩余', data: ideal, color: '#b3bfd0', dashed: true, dots: false },
        { name: '实际剩余', data: actual, color: '#2b5cff', area: true },
        o.scope ? { name: '范围变更', data: o.scope, color: '#f59e0b', dots: false, width: 1.5 } : null
      ].filter(Boolean)
    });
  };

  /* ---------------- 响应式 ---------------- */
  function register(node, o, fn) {
    var found = registry.filter(function (r) { return r.node === node; })[0];
    if (found) { found.o = o; found.fn = fn; }
    else registry.push({ node: node, o: o, fn: fn });
  }
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      registry.forEach(function (r) { if (document.body.contains(r.node)) r.fn(r.node, r.o); });
    }, 180);
  });

  Charts.palette = PALETTE;
  window.Charts = Charts;
})();
