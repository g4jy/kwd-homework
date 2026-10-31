/* charts.js — 작은 SVG 차트 (외부 라이브러리 없음). 선(추이) · 도넛(분포) · 히트맵(시간대) · 산점도(난이도 사분면) · 가로 막대 · 스파크라인
 * 색은 app.css 의 --s1..--s4(범주), --seq0..5(크기) 토큰. 마우스를 올리면 값이 보임. 범례는 2개 이상일 때만.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }
  function div(cls, kids) { var d = document.createElement('div'); d.className = cls || ''; (kids || []).forEach(function (k) { if (k) d.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); }); return d; }
  var tip = null;
  function showTip(html, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
    tip.innerHTML = html; tip.style.display = 'block';
    var w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 12)) + 'px'; tip.style.top = (y - 36) + 'px';
  }
  function hideTip() { if (tip) tip.style.display = 'none'; }
  function esc(t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function legend(items) {
    if (items.length < 2) return null;
    return div('legend', items.map(function (it) { var sp = document.createElement('span'); var i = document.createElement('i'); i.style.background = it.color; sp.appendChild(i); sp.appendChild(document.createTextNode(it.label)); return sp; }));
  }
  var C = {};
  C.SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];

  /** 선 차트: {labels, series:[{name, values, color}], yMin, yMax, yFmt, height, width(놓을 자리), extra(점마다 덧붙일 말)}
   * 가로 간격은 26–56px 사이: 점이 적으면 차트를 좁게(늘어지지 않게), 많으면 가로 스크롤 + [−][+] 확대·축소. 글자는 늘 같은 크기(px) */
  var SP_MIN = 26, SP_MAX = 56;
  C.line = function (o) {
    var direct = o.series.length > 1 && o.series.length <= 4, zoom = o._zoom || 1;
    var H = o.height || 200, L = 44, R = direct ? 104 : 16, T = 10, B = 24, n = o.labels.length, avail = Math.max(280, o.width || 560);
    var sp0 = n > 1 ? Math.max(SP_MIN, Math.min(SP_MAX, (avail - L - R) / (n - 1))) : 0, sp = sp0 * zoom;
    var W = n > 1 ? Math.round(L + R + sp * (n - 1)) : Math.min(avail, 320), scroll = W > avail + 1;
    var all = []; o.series.forEach(function (se) { se.values.forEach(function (v) { if (v !== null && v !== undefined) all.push(v); }); });
    var y0 = o.yMin !== undefined ? o.yMin : Math.min.apply(null, all.concat([0])), y1 = o.yMax !== undefined ? o.yMax : Math.max.apply(null, all.concat([1]));
    if (y1 === y0) y1 = y0 + 1;
    var fmt = o.yFmt || function (v) { return String(Math.round(v * 100) / 100); };
    var X = function (i) { return L + (n <= 1 ? (W - L - R) / 2 : i * sp); }, Y = function (v) { return T + (H - T - B) * (1 - (v - y0) / (y1 - y0)); };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fixed', role: 'img', 'aria-label': o.title || 'line chart' });
    var ticks = o.yTicks || [0, 1, 2, 3, 4].map(function (g) { return y0 + (y1 - y0) * g / 4; });
    ticks.forEach(function (v) {
      svg.appendChild(s('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: 'var(--grid)', 'stroke-width': 1 }));
      svg.appendChild(s('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end' }, [fmt(v)]));
    });
    var step = Math.max(1, Math.ceil(44 / Math.max(1, sp)));   // 이름표가 겹치지 않게 (최소 44px 간격)
    o.labels.forEach(function (lb, i) { if ((i % step === 0 && (n - 1 - i >= step || i === n - 1)) || i === n - 1) svg.appendChild(s('text', { x: X(i), y: H - 8, 'text-anchor': 'middle' }, [lb])); });   // 마지막 이름표와 겹치는 것은 뺌
    var ends = [];
    o.series.forEach(function (se, k) {
      var col = se.color || C.SERIES[k % 4], d = '', pen = false;
      se.values.forEach(function (v, i) { if (v === null || v === undefined) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; pen = true; });
      svg.appendChild(s('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      se.values.forEach(function (v, i) { if (v !== null && v !== undefined) svg.appendChild(s('circle', { cx: X(i), cy: Y(v), r: 3, fill: col, stroke: 'var(--surface)', 'stroke-width': 1.5 })); });
      var lastI = -1; se.values.forEach(function (v, i) { if (v !== null && v !== undefined) lastI = i; });
      var npts = se.values.filter(function (v) { return v !== null && v !== undefined; }).length;
      if (lastI >= 0 && direct && npts >= 2) ends.push({ x: X(lastI) + 7, y: Y(se.values[lastI]) + 4, name: se.name });
    });
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var e = 1; e < ends.length; e++) if (ends[e].y - ends[e - 1].y < 13) ends[e].y = ends[e - 1].y + 13;
    ends.forEach(function (x) { svg.appendChild(s('text', { x: x.x, y: x.y, class: 'lbl' }, [x.name])); });
    var cross = s('line', { y1: T, y2: H - B, stroke: 'var(--axis)', 'stroke-width': 1, visibility: 'hidden' });
    svg.appendChild(cross);
    var hit = s('rect', { x: L - sp / 2, y: T, width: W - L - R + sp, height: H - T - B, fill: 'transparent' });
    hit.addEventListener('pointermove', function (ev) {
      var r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width, i = n <= 1 ? 0 : Math.round((px - L) / sp);
      i = Math.max(0, Math.min(n - 1, i));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
      showTip('<b>' + esc(o.labels[i]) + '</b>' + (o.extra && o.extra[i] ? ' · ' + esc(o.extra[i]) : '') + '<br>' + o.series.map(function (se) { var v = se.values[i]; return esc(se.name) + ': ' + (v === null || v === undefined ? '—' : esc(fmt(v))); }).join('<br>'), ev.clientX, ev.clientY);
    });
    hit.addEventListener('pointerleave', function () { cross.setAttribute('visibility', 'hidden'); hideTip(); });
    svg.appendChild(hit);
    var box = div('chart-scroll' + (scroll ? ' on' : ''), [svg]);
    var tools = null;
    if (scroll || zoom !== 1 || n > 20) {   // 점이 많을 때만 확대·축소
      var zb = function (label, z, act) { var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'zbtn'; bt.textContent = label; bt.setAttribute('data-act', act); bt.setAttribute('aria-label', act === 'zoom-in' ? '확대' : '축소');
        bt.disabled = z < 0.45 || z > 4.1 || (z < 1 && sp0 * z < 10); bt.onclick = function () { var nw = C.line(Object.assign({}, o, { _zoom: z })); wrap.parentNode.replaceChild(nw, wrap); }; return bt; };
      tools = div('ztools', [zb('−', zoom / 1.5, 'zoom-out'), zb('+', zoom * 1.5, 'zoom-in'), scroll ? div('tiny', ['← 옆으로 밀어서 보기']) : null]);
    }
    var wrap = div('chart', [legend(o.series.map(function (se, k) { return { label: se.name, color: se.color || C.SERIES[k % 4] }; })), tools, box]);
    if (scroll) setTimeout(function () { box.scrollLeft = box.scrollWidth; }, 0);   // 최근 쪽이 먼저 보이게
    return wrap;
  };

  /** 도넛: {parts:[{label, value, color}], center} */
  C.donut = function (o) {
    var total = o.parts.reduce(function (a, p) { return a + p.value; }, 0) || 1, R0 = 56, R1 = 34, cx = 70, cy = 70, a = -Math.PI / 2;
    var svg = s('svg', { viewBox: '0 0 140 140', role: 'img', 'aria-label': o.title || 'share', width: o.size || 150, height: o.size || 150, style: 'flex:none' });
    o.parts.forEach(function (p, k) {
      if (!p.value) return;
      var a2 = a + 2 * Math.PI * p.value / total, large = a2 - a > Math.PI ? 1 : 0, gap = o.parts.length > 1 ? 0.012 : 0;
      var p1 = [cx + R0 * Math.cos(a + gap), cy + R0 * Math.sin(a + gap)], p2 = [cx + R0 * Math.cos(a2 - gap), cy + R0 * Math.sin(a2 - gap)];
      var p3 = [cx + R1 * Math.cos(a2 - gap), cy + R1 * Math.sin(a2 - gap)], p4 = [cx + R1 * Math.cos(a + gap), cy + R1 * Math.sin(a + gap)];
      var d = p.value === total ? 'M' + (cx - R0) + ' ' + cy + 'a' + R0 + ' ' + R0 + ' 0 1 0 ' + 2 * R0 + ' 0a' + R0 + ' ' + R0 + ' 0 1 0 ' + (-2 * R0) + ' 0M' + (cx - R1) + ' ' + cy + 'a' + R1 + ' ' + R1 + ' 0 1 1 ' + 2 * R1 + ' 0a' + R1 + ' ' + R1 + ' 0 1 1 ' + (-2 * R1) + ' 0'
        : 'M' + p1 + 'A' + R0 + ' ' + R0 + ' 0 ' + large + ' 1 ' + p2 + 'L' + p3 + 'A' + R1 + ' ' + R1 + ' 0 ' + large + ' 0 ' + p4 + 'Z';
      var path = s('path', { d: d, fill: p.color || C.SERIES[k % 4], 'fill-rule': 'evenodd' });
      path.addEventListener('pointermove', function (e) { showTip(esc(p.label) + ': ' + p.value + ' (' + Math.round(p.value / total * 100) + '%)', e.clientX, e.clientY); });
      path.addEventListener('pointerleave', hideTip);
      svg.appendChild(path);
      a = a2;
    });
    if (o.center) svg.appendChild(s('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', style: 'font-size:15px;font-weight:700;fill:var(--ink)' }, [o.center]));
    var leg = div('', o.parts.map(function (p, k) {
      var r = div('row small', []); var i = document.createElement('i');
      i.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:3px;background:' + (p.color || C.SERIES[k % 4]);
      r.appendChild(i); r.appendChild(document.createTextNode(p.label + ' · ' + p.value + ' (' + Math.round(p.value / total * 100) + '%)')); return r;
    }));
    var box = div('row', [svg, leg]); box.style.gap = '14px'; box.style.alignItems = 'center'; box.style.flexWrap = 'wrap';
    return box;
  };

  /** 히트맵: {matrix: rows × cols, rows:[label], cols:[label], fmt} — 한 색(파랑) 밝음→진함 */
  C.heat = function (o) {
    var rows = o.matrix.length, cols = o.matrix[0].length, L = 24, T = 4, Wt = Math.max(300, o.width || 520), cw = Math.min(30, (Wt - L - 4) / cols), ch = Math.min(22, Math.max(14, cw * 0.8)), W = L + cols * cw + 4, H = T + rows * ch + 18;
    var max = 0; o.matrix.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.title || 'heatmap', style: 'max-width:' + W + 'px' });
    o.matrix.forEach(function (r, i) {
      svg.appendChild(s('text', { x: L - 5, y: T + i * ch + ch / 2 + 4, 'text-anchor': 'end' }, [o.rows[i]]));
      r.forEach(function (v, j) {
        var lvl = v === 0 ? 0 : Math.min(5, 1 + Math.floor(v / Math.max(1, max) * 4.999));
        var rect = s('rect', { x: L + j * cw + 1, y: T + i * ch + 1, width: cw - 2, height: ch - 2, rx: 3, fill: 'var(--seq' + lvl + ')' });
        rect.addEventListener('pointermove', function (e) { showTip(esc(o.rows[i]) + ' ' + o.cols[j] + ' · ' + (o.fmt ? o.fmt(v) : v), e.clientX, e.clientY); });
        rect.addEventListener('pointerleave', hideTip);
        svg.appendChild(rect);
      });
    });
    o.cols.forEach(function (c, j) { if (j % 3 === 0) svg.appendChild(s('text', { x: L + j * cw + cw / 2, y: H - 3, 'text-anchor': 'middle' }, [c])); });
    return div('chart', [svg]);
  };

  /** 요일 × 시각 (가로 = 요일 월–일, 세로 = 시각). byDow[0=일..6][0..23]. 기록 있는 시간대 앞뒤만 보여 줌 */
  C.heatDow = function (o) {
    var order = [1, 2, 3, 4, 5, 6, 0], names = ['일', '월', '화', '수', '목', '금', '토'], max = 0, lo = 24, hi = -1;
    o.byDow.forEach(function (r) { r.forEach(function (v, h) { if (v > max) max = v; if (v) { lo = Math.min(lo, h); hi = Math.max(hi, h); } }); });
    if (hi < 0) { lo = 8; hi = 22; }
    lo = Math.max(0, lo - 1); hi = Math.min(23, hi + 1); if (hi - lo < 7) { hi = Math.min(23, lo + 7); lo = Math.max(0, hi - 7); }
    var L = 38, T = 20, cw = Math.max(30, Math.min(46, ((o.width || 340) - L) / 7)), ch = 17, rows = hi - lo + 1, W = L + 7 * cw, H = T + rows * ch + 2;
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fixed', role: 'img', 'aria-label': o.title || '요일별 시각별 제출' });
    order.forEach(function (dw, j) { svg.appendChild(s('text', { x: L + j * cw + cw / 2, y: 13, 'text-anchor': 'middle', class: dw === 0 || dw === 6 ? 'lbl' : null }, [names[dw]])); });
    for (var h = lo; h <= hi; h++) {
      var y = T + (h - lo) * ch;
      if ((h - lo) % 2 === 0) svg.appendChild(s('text', { x: L - 6, y: y + ch / 2 + 4, 'text-anchor': 'end' }, [h + '시']));
      order.forEach(function (dw, j) {
        var v = o.byDow[dw][h], lvl = v === 0 ? 0 : Math.min(5, 1 + Math.floor(v / Math.max(1, max) * 4.999));
        var rect = s('rect', { x: L + j * cw + 1, y: y + 1, width: cw - 2, height: ch - 2, rx: 3, fill: 'var(--seq' + lvl + ')' });
        (function (hh) { rect.addEventListener('pointermove', function (e) { showTip(names[dw] + ' ' + hh + '시 · ' + (o.fmt ? o.fmt(v) : v), e.clientX, e.clientY); }); })(h);
        rect.addEventListener('pointerleave', hideTip);
        svg.appendChild(rect);
      });
    }
    return div('chart', [div('chart-scroll', [svg])]);
  };

  /** 산점도(사분면): {points:[{x,y,label}], xLabel, yLabel, xMid, yMid, xMin,xMax,yMin,yMax, quad:{tl,tr,bl,br}} — 점을 이어 주별 이동 */
  C.quadrant = function (o) {
    var W = Math.max(300, Math.min(420, o.width || 360)), H = Math.round(W * 0.66), L = 16, R = 12, T = 22, B = 34;
    var X = function (v) { return L + (W - L - R) * (v - o.xMin) / (o.xMax - o.xMin); }, Y = function (v) { return T + (H - T - B) * (1 - (v - o.yMin) / (o.yMax - o.yMin)); };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fixed', role: 'img', 'aria-label': 'accuracy vs speed' });
    svg.appendChild(s('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'none', stroke: 'var(--grid)' }));
    svg.appendChild(s('line', { x1: X(o.xMid), x2: X(o.xMid), y1: T, y2: H - B, stroke: 'var(--axis)', 'stroke-dasharray': '3 3' }));
    svg.appendChild(s('line', { x1: L, x2: W - R, y1: Y(o.yMid), y2: Y(o.yMid), stroke: 'var(--axis)', 'stroke-dasharray': '3 3' }));
    var q = o.quad || {};
    [[q.tl, L + 6, T + 14, 'start'], [q.tr, W - R - 6, T + 14, 'end'], [q.bl, L + 6, H - B - 6, 'start'], [q.br, W - R - 6, H - B - 6, 'end']].forEach(function (x) {
      if (x[0]) svg.appendChild(s('text', { x: x[1], y: x[2], 'text-anchor': x[3], class: 'lbl' }, [x[0]]));
    });
    svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, [o.xLabel]));
    svg.appendChild(s('text', { x: L, y: 12, 'text-anchor': 'start' }, ['↑ ' + o.yLabel]));
    var pts = o.points.filter(function (p) { return p.x !== null && p.y !== null; }).map(function (p) { return { x: Math.max(o.xMin, Math.min(o.xMax, p.x)), y: Math.max(o.yMin, Math.min(o.yMax, p.y)), label: p.label }; });
    if (pts.length > 1) svg.appendChild(s('path', { d: pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1); }).join(' '), fill: 'none', stroke: 'var(--s1)', 'stroke-width': 1.5, 'stroke-opacity': 0.5 }));
    pts.forEach(function (p, i) {
      var last = i === pts.length - 1;
      var c = s('circle', { cx: X(p.x), cy: Y(p.y), r: last ? 7 : 4, fill: last ? 'var(--s2)' : 'var(--s1)', stroke: 'var(--surface)', 'stroke-width': 2 });
      c.addEventListener('pointermove', function (e) { showTip(esc(p.label) + ' · 정확도 ' + Math.round(p.y * 100) + '% · 속도 ×' + p.x.toFixed(2), e.clientX, e.clientY); });
      c.addEventListener('pointerleave', hideTip);
      svg.appendChild(c);
      if (last) svg.appendChild(s('text', { x: X(p.x) + 10, y: Y(p.y) + 4, class: 'lbl' }, ['이번 주']));
    });
    return div('chart', [svg]);
  };

  /** 가로 막대(HTML): rows [{label, value(0..1), note, color}] */
  C.bars = function (rows, o) {
    o = o || {};
    return div(o.wide ? 'bars-wide' : '', rows.map(function (r) {
      var tr = document.createElement('span'); tr.className = 'track'; var i = document.createElement('i');
      i.style.width = Math.round(Math.max(0, Math.min(1, r.value || 0)) * 100) + '%'; if (r.color) i.style.background = r.color; tr.appendChild(i);
      var a = document.createElement('span'); a.textContent = r.label; var b = document.createElement('span'); b.className = 'tiny'; b.textContent = r.note || '';
      var row = div('bar-row', [a, tr, b]); row.title = r.title || ''; return row;
    }));
  };

  /** 스파크라인 */
  C.spark = function (vals, o) {
    o = o || {}; var W = o.w || 64, H = o.h || 18, v = vals.filter(function (x) { return x !== null; });
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'aria-hidden': 'true' });
    if (v.length < 2) return svg;
    var mn = o.min !== undefined ? o.min : Math.min.apply(null, v), mx = o.max !== undefined ? o.max : Math.max.apply(null, v); if (mx === mn) mx = mn + 1;
    var d = v.map(function (x, i) { return (i ? 'L' : 'M') + (i * (W - 4) / (v.length - 1) + 2).toFixed(1) + ' ' + (H - 2 - (H - 4) * (x - mn) / (mx - mn)).toFixed(1); }).join(' ');
    svg.appendChild(s('path', { d: d, fill: 'none', stroke: 'var(--s1)', 'stroke-width': 1.6 }));
    return svg;
  };
  window.Charts = C;
})();
