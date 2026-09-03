/* ==========================================================
   英超戰報 — app.js
   由 data.js 的資料渲染整個頁面；積分榜、近況、射手榜都在這裡計算。
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };

  /* ---------- 譯名（港 / 台） ---------- */
  var lang = 'hk';
  try { if (localStorage.getItem('epl-names') === 'tw') lang = 'tw'; } catch (e) { /* ignore */ }

  /* 未在 TEAMS 定義的球隊（例如日後升班馬）以縮寫顯示，不會令頁面出錯 */
  function team(abbr) {
    return TEAMS[abbr] || { en: abbr, hk: abbr, tw: abbr, c1: '#4a4560', c2: '#9a93b5', ct: '#ffffff' };
  }
  function T(abbr, short) {
    var t = team(abbr);
    if (short) return lang === 'hk' ? (t.shk || t.hk) : (t.stw || t.tw);
    return lang === 'hk' ? t.hk : t.tw;
  }
  function V(name) {
    var v = VENUES[name];
    return v ? (lang === 'hk' ? v.hk : v.tw) : name;
  }
  function crest(abbr, cls) {
    var t = team(abbr);
    return '<span class="crest ' + (cls || '') + '" style="--c1:' + t.c1 + ';--c2:' + t.c2 + ';--ct:' + t.ct + '" title="' + esc(T(abbr)) + '">' + abbr + '</span>';
  }
  function teamName(abbr) {
    return '<span class="full">' + esc(T(abbr)) + '</span><span class="short">' + esc(T(abbr, true)) + '</span>';
  }
  function tokens(s) {
    return s
      .replace(/\{\{V:([^}]+)\}\}/g, function (_, v) { return esc(V(v)); })
      .replace(/\{\{([A-Z]{3})\}\}/g, function (_, a) { return '<span class="nw">' + esc(T(a)) + '</span>'; });
  }

  var CATS = {
    match: { label: '賽事', cls: 'cat-match' },
    transfer: { label: '轉會', cls: 'cat-transfer' },
    feature: { label: '專題', cls: 'cat-feature' },
    league: { label: '聯賽', cls: 'cat-league' }
  };
  function tagHtml(cat) {
    var c = CATS[cat] || CATS.feature;
    return '<span class="tag ' + c.cls + '">' + c.label + '</span>';
  }

  /* ---------- 時間（一律換算為香港時間） ---------- */
  var WD = ['日', '一', '二', '三', '四', '五', '六'];
  var WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Hong_Kong', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
  });
  function hkParts(iso) {
    var p = {};
    fmt.formatToParts(new Date(iso)).forEach(function (x) { p[x.type] = x.value; });
    var wd = WD_EN.indexOf(p.weekday);
    return { y: p.year, m: +p.month, d: +p.day, hh: p.hour === '24' ? '00' : p.hour, mm: p.minute, wd: WD[wd < 0 ? 0 : wd] };
  }
  function fmtDay(iso) { var p = hkParts(iso); return p.m + '月' + p.d + '日（星期' + p.wd + '）'; }
  function fmtTime(iso) { var p = hkParts(iso); return p.hh + ':' + p.mm; }
  function fmtFull(iso) { return fmtDay(iso) + ' ' + fmtTime(iso); }
  function dayKey(iso) { var p = hkParts(iso); return p.y + '-' + p.m + '-' + p.d; }
  function byKick(a, b) { return new Date(a.kickoff) - new Date(b.kickoff); }

  /* ---------- 計算積分榜 ---------- */
  function computeTable() {
    var rows = {};
    function row(a) {
      if (!rows[a]) rows[a] = { abbr: a, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
      return rows[a];
    }
    Object.keys(TEAMS).forEach(row);
    RESULTS.slice().sort(byKick).forEach(function (m) {
      var h = row(m.home), a = row(m.away);
      h.p++; a.p++;
      h.gf += m.hs; h.ga += m.as; a.gf += m.as; a.ga += m.hs;
      if (m.hs > m.as) { h.w++; a.l++; h.pts += 3; h.form.push('W'); a.form.push('L'); }
      else if (m.hs < m.as) { a.w++; h.l++; a.pts += 3; a.form.push('W'); h.form.push('L'); }
      else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('D'); a.form.push('D'); }
    });
    return Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (x, y) {
      return (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || team(x.abbr).en.localeCompare(team(y.abbr).en);
    });
  }

  function computeScorers() {
    var map = {};
    RESULTS.forEach(function (m) {
      m.goals.forEach(function (g) {
        if (g.og) return;
        var k = g.p + '|' + g.t;
        if (!map[k]) map[k] = { n: g.p, t: g.t, v: 0 };
        map[k].v++;
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return (b.v - a.v) || a.n.localeCompare(b.n); })
      .slice(0, 10);
  }

  /* ---------- 首頁頭條 ---------- */
  var PITCH_SVG = '<svg class="pitch" viewBox="0 0 400 600" fill="none" stroke="#fff" stroke-width="3">' +
    '<rect x="20" y="20" width="360" height="560" rx="4"/><line x1="20" y1="300" x2="380" y2="300"/>' +
    '<circle cx="200" cy="300" r="60"/><circle cx="200" cy="300" r="4" fill="#fff"/>' +
    '<rect x="80" y="20" width="240" height="110"/><rect x="140" y="20" width="120" height="40"/>' +
    '<rect x="80" y="470" width="240" height="110"/><rect x="140" y="540" width="120" height="40"/>' +
    '<path d="M150 130 A60 60 0 0 0 250 130"/><path d="M150 470 A60 60 0 0 1 250 470"/></svg>';

  function renderFeature() {
    var n = NEWS[0];
    var el = $('#feature');
    el.innerHTML = PITCH_SVG +
      (n.teams ? '<div class="big-crests">' + n.teams.map(function (a) { return crest(a); }).join('') + '</div>' : '') +
      (n.score ? '<div class="score-big">' + n.score + '</div>' : '') +
      '<div class="kicker">' + tagHtml(n.cat) + '<span class="num" style="color:var(--muted);font-size:13px;letter-spacing:.15em">' + n.date + '</span></div>' +
      '<h1>' + tokens(n.title) + '</h1><p>' + tokens(n.summary) + '</p>' +
      '<span class="cta">閱讀全文 →</span>';
    el.onclick = function () { openNews(0); };
  }

  /* ---------- 焦點戰 + 倒數 ---------- */
  var cdTimer = null;
  function renderNext() {
    var now = Date.now();
    var list = FIXTURES.slice().sort(byKick);
    var future = list.filter(function (f) { return new Date(f.kickoff).getTime() > now; });
    var nm = null;
    for (var i = 0; i < future.length; i++) { if (future[i].featured) { nm = future[i]; break; } }
    if (!nm) nm = future[0] || list[list.length - 1];
    if (!nm) { $('#nextMatch').innerHTML = '<p>暫無賽程</p>'; return; }
    $('#nextMatch').innerHTML =
      '<div class="num" style="color:var(--muted-2);letter-spacing:.15em;font-size:13px">第' + nm.gw + '輪 · ' + esc(V(nm.venue)) + '</div>' +
      '<div class="teams"><div class="team">' + crest(nm.home, 'lg') + '<span>' + esc(T(nm.home)) + '</span></div>' +
      '<div class="vs">VS</div>' +
      '<div class="team">' + crest(nm.away, 'lg') + '<span>' + esc(T(nm.away)) + '</span></div></div>' +
      '<div class="when">香港時間 <strong>' + fmtFull(nm.kickoff) + '</strong></div>' +
      '<div class="countdown" id="countdown"></div>';
    startCountdown(new Date(nm.kickoff).getTime());
  }
  function startCountdown(target) {
    if (cdTimer) clearInterval(cdTimer);
    var box = $('#countdown');
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        box.innerHTML = '<div style="min-width:160px"><b style="font-size:18px">賽事進行中 / 已完場</b></div>';
        clearInterval(cdTimer); return;
      }
      var d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      box.innerHTML =
        '<div><b>' + d + '</b><small>日</small></div>' +
        '<div><b>' + pad(h) + '</b><small>時</small></div>' +
        '<div><b>' + pad(m) + '</b><small>分</small></div>' +
        '<div><b>' + pad(s) + '</b><small>秒</small></div>';
    }
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* ---------- 迷你積分榜 ---------- */
  function renderMini(table) {
    $('#miniTable').innerHTML = table.slice(0, 5).map(function (r, i) {
      return '<tr><td class="pos">' + (i + 1) + '</td><td><div class="tm">' + crest(r.abbr) + esc(T(r.abbr, true)) + '</div></td>' +
        '<td class="pl">' + r.p + '場</td><td class="pts">' + r.pts + '</td></tr>';
    }).join('');
  }

  /* ---------- 賽果跑馬燈 ---------- */
  function renderTicker() {
    var items = RESULTS.slice().sort(byKick).reverse().slice(0, 20).map(function (m) {
      return '<span class="tick"><span class="gw">GW' + m.gw + '</span>' + crest(m.home) + '<span>' + esc(T(m.home, true)) + '</span>' +
        '<b>' + m.hs + ' - ' + m.as + '</b><span>' + esc(T(m.away, true)) + '</span>' + crest(m.away) + '</span>';
    }).join('');
    $('#ticker').innerHTML = items + items;
  }

  /* ---------- 新聞 ---------- */
  function coverHtml(n) {
    var teams = n.teams || [];
    var c1 = teams[0] ? TEAMS[teams[0]].c1 : '#3d0d7a';
    var c2 = teams[1] ? TEAMS[teams[1]].c1 : (teams[0] ? '#1d0a3f' : '#e90052');
    var bg = 'background:linear-gradient(120deg,' + c1 + 'cc 0%,' + c1 + '55 45%,' + c2 + '55 55%,' + c2 + 'cc 100%),#1a1033;';
    var inner = '';
    if (teams.length === 2 && n.score) {
      inner = crest(teams[0]) + '<span class="score">' + n.score + '</span>' + crest(teams[1]);
    } else if (teams.length) {
      inner = teams.map(function (a) { return crest(a); }).join('');
    } else {
      inner = '<span class="glyph">' + (n.glyph || '⚽') + '</span>';
    }
    return '<div class="cover" style="' + bg + '">' + inner + '</div>';
  }
  function renderNews() {
    $('#newsGrid').innerHTML = NEWS.slice(1).map(function (n, i) {
      return '<article class="news-card reveal" data-i="' + (i + 1) + '">' + coverHtml(n) +
        '<div class="body"><div>' + tagHtml(n.cat) + '</div><h3>' + tokens(n.title) + '</h3><p>' + tokens(n.summary) + '</p>' +
        '<div class="meta"><span class="num">' + n.date + '</span><span class="read">閱讀全文 →</span></div></div></article>';
    }).join('');
    $$('.news-card').forEach(function (c) { c.onclick = function () { openNews(+c.dataset.i); }; });
    observeReveal();
  }
  function openNews(i) {
    var n = NEWS[i];
    $('#modalBody').innerHTML = tagHtml(n.cat) + '<h2>' + tokens(n.title) + '</h2>' +
      '<div class="meta num">' + n.date + ' · 英超戰報</div>' +
      '<div class="content">' + n.body.map(function (p) { return '<p>' + tokens(p) + '</p>'; }).join('') + '</div>';
    $('#modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeNews() {
    $('#modal').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- 完整積分榜 ---------- */
  function renderTable(table) {
    var n = table.length;
    $('#standingsBody').innerHTML = table.map(function (r, i) {
      var pos = i + 1;
      var zone = pos <= 4 ? 'z-ucl' : pos === 5 ? 'z-uel' : pos > n - 3 ? 'z-rel' : '';
      var gd = r.gf - r.ga;
      var form = r.form.slice(-5).map(function (f) { return '<i class="' + f + '">' + f + '</i>'; }).join('');
      return '<tr class="' + zone + '"><td class="pos">' + pos + '</td>' +
        '<td class="team left"><div class="tm">' + crest(r.abbr) + '<span class="full">' + esc(T(r.abbr)) + '</span><span class="short">' + esc(T(r.abbr, true)) + '</span></div></td>' +
        '<td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td>' +
        '<td class="opt">' + r.gf + '</td><td class="opt">' + r.ga + '</td>' +
        '<td class="gd ' + (gd > 0 ? 'pos-gd' : gd < 0 ? 'neg-gd' : '') + '">' + (gd > 0 ? '+' + gd : gd) + '</td>' +
        '<td class="pts">' + r.pts + '</td>' +
        '<td class="opt"><span class="form">' + form + '</span></td></tr>';
    }).join('');
  }

  /* ---------- 賽果與賽程 ---------- */
  var activeTab = null;
  function uniqGw(list) {
    var s = {}; list.forEach(function (m) { s[m.gw] = 1; });
    return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
  }
  function renderResults() {
    var rg = uniqGw(RESULTS), fg = uniqGw(FIXTURES);
    if (!activeTab) activeTab = rg.length ? 'r' + rg[rg.length - 1] : (fg.length ? 'f' + fg[0] : null);
    if (!activeTab) { $('#matchdays').innerHTML = '<p class="tz-note">暫無賽事資料。</p>'; return; }
    var kind = activeTab.charAt(0), gw = +activeTab.slice(1);
    /* 按鈕列只顯示最近 4 輪賽果與最近 4 輪賽程，其餘用下拉選單 */
    var rShow = rg.slice(-4), fShow = fg.slice(0, 4);
    if (kind === 'r' && rShow.indexOf(gw) < 0) rShow = [gw].concat(rShow.slice(1));
    if (kind === 'f' && fShow.indexOf(gw) < 0) fShow = fShow.slice(0, 3).concat([gw]);
    $('#resultTabs').innerHTML = rShow.map(function (g) {
      return '<button data-tab="r' + g + '" class="' + (activeTab === 'r' + g ? 'on' : '') + '">第' + g + '輪</button>';
    }).join('');
    $('#fixtureTabs').innerHTML = fShow.map(function (g) {
      return '<button data-tab="f' + g + '" class="fix ' + (activeTab === 'f' + g ? 'on' : '') + '">第' + g + '輪</button>';
    }).join('');
    $('#resultTabs').parentNode.style.display = rg.length ? '' : 'none';
    $('#fixtureTabs').parentNode.style.display = fg.length ? '' : 'none';
    $$('#resultTabs button, #fixtureTabs button').forEach(function (b) {
      b.onclick = function () { activeTab = b.dataset.tab; renderResults(); };
    });
    var sel = $('#gwSelect');
    sel.innerHTML = '<option value="">所有輪次…</option>' +
      rg.map(function (g) { return '<option value="r' + g + '">第' + g + '輪 賽果</option>'; }).join('') +
      fg.map(function (g) { return '<option value="f' + g + '">第' + g + '輪 賽程</option>'; }).join('');
    sel.value = activeTab;
    sel.onchange = function () { if (sel.value) { activeTab = sel.value; renderResults(); } };
    var src = kind === 'r' ? RESULTS : FIXTURES;
    var list = src.filter(function (m) { return m.gw === gw; }).sort(byKick);
    var groups = [];
    list.forEach(function (m) {
      var k = dayKey(m.kickoff), g = null;
      for (var i = 0; i < groups.length; i++) if (groups[i].k === k) g = groups[i];
      if (!g) { g = { k: k, label: fmtDay(m.kickoff), items: [] }; groups.push(g); }
      g.items.push(m);
    });
    $('#matchdays').innerHTML = groups.map(function (g) {
      return '<div class="matchday-title">' + g.label + '</div><div class="match-grid">' +
        g.items.map(kind === 'r' ? matchCard : fixtureCard).join('') + '</div>';
    }).join('');
    $('#resultsTitle').textContent = kind === 'r' ? '第' + gw + '輪賽果' : '第' + gw + '輪賽程';
  }
  function credited(m, g) { return g.og ? (g.t === m.home ? m.away : m.home) : g.t; }
  function goalLine(g) {
    return '<div>' + esc(g.p) + (g.og ? '<span class="og">（烏龍）</span>' : '') + (g.pen ? '（12碼）' : '') + '<em>' + g.min + '\'</em></div>';
  }
  function matchCard(m) {
    var hw = m.hs > m.as, aw = m.as > m.hs;
    var hg = m.goals.filter(function (g) { return credited(m, g) === m.home; }).map(goalLine).join('');
    var ag = m.goals.filter(function (g) { return credited(m, g) === m.away; }).map(goalLine).join('');
    return '<article class="match"><div class="top"><span>' + fmtFull(m.kickoff) + '</span><span class="status ft">完場</span></div>' +
      '<div class="row"><div class="side-team home ' + (hw ? 'winner' : aw ? 'loser' : '') + '">' + crest(m.home) + teamName(m.home) + '</div>' +
      '<div class="score">' + m.hs + ' - ' + m.as + '</div>' +
      '<div class="side-team away ' + (aw ? 'winner' : hw ? 'loser' : '') + '">' + crest(m.away) + teamName(m.away) + '</div></div>' +
      (m.goals.length ? '<div class="scorers"><div>' + hg + '</div><div>' + ag + '</div></div>' : '') +
      '<div class="venue">' + esc(V(m.venue)) + (m.att ? ' · 入場人數 ' + m.att.toLocaleString() : '') + '</div></article>';
  }
  function fixtureCard(m) {
    var status = m.live ? '<span class="status live">進行中' + (m.clock ? ' ' + esc(m.clock).replace(/'00$/, "'") : '') + '</span>' : '<span class="status up">未開賽</span>';
    var middle = m.live ? '<div class="score">' + m.hs + ' - ' + m.as + '</div>' : '<div class="score kick">' + fmtTime(m.kickoff) + '</div>';
    return '<article class="match"><div class="top"><span>' + (m.live ? fmtFull(m.kickoff) : fmtDay(m.kickoff)) + '</span>' + status + '</div>' +
      '<div class="row"><div class="side-team home">' + crest(m.home) + teamName(m.home) + '</div>' +
      middle +
      '<div class="side-team away">' + crest(m.away) + teamName(m.away) + '</div></div>' +
      '<div class="venue">' + esc(V(m.venue)) + (m.featured ? ' · <span style="color:var(--gold)">焦點戰</span>' : '') + '</div></article>';
  }

  /* ---------- 數據 ---------- */
  function rankList(list, cls) {
    var max = list.length ? list[0].v : 1;
    return '<ol class="rank-list">' + list.map(function (x, i) {
      var rank = i + 1;
      for (var j = 0; j < i; j++) if (list[j].v === x.v) { rank = j + 1; break; }
      return '<li><span class="r">' + rank + '</span><div class="who">' + crest(x.t) +
        '<div><div class="nm">' + esc(x.n) + '</div><div class="club">' + esc(T(x.t)) + '</div></div></div>' +
        '<div class="v"><span class="bar"><i style="width:' + Math.round(x.v / max * 100) + '%"></i></span><b>' + x.v + '</b></div></li>';
    }).join('') + '</ol>';
  }
  function renderStats() {
    $('#scorers').innerHTML = rankList(computeScorers());
    $('#assists').innerHTML = rankList(ASSISTS.slice().sort(function (a, b) { return (b.v - a.v) || a.n.localeCompare(b.n); }));

    var goals = 0, maxAtt = null, hatTricks = 0, cleanSheets = 0;
    RESULTS.forEach(function (m) {
      goals += m.hs + m.as;
      if (m.att && (!maxAtt || m.att > maxAtt.att)) maxAtt = m;
      if (m.hs === 0) cleanSheets++;
      if (m.as === 0) cleanSheets++;
      var cnt = {};
      m.goals.forEach(function (g) { if (!g.og) { cnt[g.p] = (cnt[g.p] || 0) + 1; if (cnt[g.p] === 3) hatTricks++; } });
    });
    $('#facts').innerHTML =
      '<div class="fact"><b>' + RESULTS.length + '</b><span>已完成賽事</span></div>' +
      '<div class="fact"><b>' + goals + '</b><span>總入球 · 平均每場 ' + (goals / RESULTS.length).toFixed(1) + ' 球</span></div>' +
      '<div class="fact"><b>' + cleanSheets + '</b><span>零失球場次</span></div>' +
      (maxAtt ? '<div class="fact"><b>' + maxAtt.att.toLocaleString() + '</b><span>最高入場人數 · ' + esc(T(maxAtt.home, true)) + ' 對 ' + esc(T(maxAtt.away, true)) + '</span></div>' : '') +
      (hatTricks ? '' : '');
  }

  /* ---------- 其他 UI ---------- */
  var io = null;
  function observeReveal() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(function (e) { e.classList.add('in'); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
    }
    $$('.reveal:not(.in)').forEach(function (e) { io.observe(e); });
    /* 保險：無論觀察器是否觸發，1.5 秒後一律顯示 */
    setTimeout(function () { $$('.reveal:not(.in)').forEach(function (e) { e.classList.add('in'); }); }, 1500);
  }
  function navSpy() {
    var links = $$('.nav a');
    var secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function (s) { obs.observe(s); });
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  function renderAll() {
    var table = computeTable();
    renderFeature();
    renderNext();
    renderMini(table);
    renderTicker();
    renderNews();
    renderTable(table);
    renderResults();
    renderStats();
    $$('[data-lang]').forEach(function (b) { b.classList.toggle('on', b.dataset.lang === lang); });
  }

  function init() {
    $('#seasonLabel').textContent = SEASON.label;
    var live = (typeof LIVE !== 'undefined' && LIVE) ? LIVE : null;
    $('#updatedAt').textContent = live ? live.updated + '（自動更新）' : SEASON.updated;
    var gws = uniqGw(RESULTS), lastGw = gws.length ? gws[gws.length - 1] : 0;
    var pending = FIXTURES.some(function (f) { return f.gw === lastGw; });
    $('#roundLabel').textContent = lastGw ? '第' + lastGw + '輪' + (pending ? '進行中' : '完結') : '賽季即將開始';
    $('#year').textContent = new Date().getFullYear();

    renderAll();
    navSpy();
    observeReveal();

    $$('[data-lang]').forEach(function (b) {
      b.onclick = function () {
        if (lang === b.dataset.lang) return;
        lang = b.dataset.lang;
        try { localStorage.setItem('epl-names', lang); } catch (e) { /* ignore */ }
        renderAll();
        $$('.reveal').forEach(function (e) { e.classList.add('in'); });
        toast(lang === 'hk' ? '已切換為港式譯名' : '已切換為台式譯名');
      };
    });

    $('#modalClose').onclick = closeNews;
    $('#modal').onclick = function (e) { if (e.target === this) closeNews(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNews(); });

    $('#burger').onclick = function () { $('#nav').classList.toggle('open'); };
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { $('#nav').classList.remove('open'); }); });

    $('#fixturesLink').addEventListener('click', function () {
      var fg = uniqGw(FIXTURES);
      if (fg.length) { activeTab = 'f' + fg[0]; renderResults(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
