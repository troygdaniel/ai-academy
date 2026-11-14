// AI Academy: state, spaced repetition, semantic zoom, lessons, the roles tree, quiz, review and the sandbox sheet. No network, no libraries.
// The pictures you can poke live in widgets.js; the words live in content.js.
(function () {
  'use strict';
  var A = ACADEMY, KEY = 'aiacademy.v1';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dayNow() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  // ---------- state: kept in this browser only (localStorage), and Save / Load to a file ----------
  function fresh() { return { v: 1, xp: 0, days: {}, cards: {}, done: {}, goal: 10, read: 22, theme: '', names: [], pos: { space: 'learn', track: 'models', concept: 'tokens', zoom: 0, fam: '', role: '' } }; }
  // Accept a saved object only if it has the right shape; fill anything missing (older files have no names, no roles position).
  function adopt(j) {
    if (!(j && j.v === 1 && j.cards && typeof j.cards === 'object' && j.days && typeof j.days === 'object')) return null;
    var s = Object.assign(fresh(), j), k, c;
    s.pos = Object.assign(fresh().pos, j.pos && typeof j.pos === 'object' ? j.pos : {});
    s.xp = +s.xp || 0; s.goal = [10, 20, 30, 45, 60].indexOf(+s.goal) >= 0 ? +s.goal : 10; s.read = Math.max(16, Math.min(36, +s.read || 22));
    s.theme = s.theme === 'light' || s.theme === 'dark' ? s.theme : '';
    s.names = Array.isArray(s.names) ? s.names.filter(function (n) { return typeof n === 'string'; }).slice(0, 50) : [];
    if (!s.done || typeof s.done !== 'object') s.done = {};
    for (k in s.cards) { c = s.cards[k]; if (!c || typeof c.ef !== 'number' || typeof c.due !== 'number' || typeof c.int !== 'number' || typeof c.rep !== 'number') delete s.cards[k]; }
    for (k in s.days) { c = s.days[k]; if (!c || typeof c.min !== 'number' || typeof c.xp !== 'number') delete s.days[k]; }
    return s;
  }
  function load() {
    try { var s = adopt(JSON.parse(localStorage.getItem(KEY) || 'null')); if (s) return s; } catch (e) { /* private window or blocked storage: start fresh */ }
    return fresh();
  }
  var S = load(), saveT = 0;
  function saveNow() { clearTimeout(saveT); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* the app still works without storage */ } }
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 150); }
  addEventListener('pagehide', saveNow);
  function today() { var k = dayNow(); return S.days[k] || (S.days[k] = { min: 0, xp: 0 }); }
  function addXp(n) { S.xp += n; today().xp += n; save(); }
  function activeDay(d) { var x = S.days[d]; return !!x && (x.min >= 1 || x.xp > 0); }
  function streak() { var d = dayNow(), n = 0; if (!activeDay(d)) d--; while (activeDay(d)) { n++; d--; } return n; }

  // ---------- spaced repetition: SM-2 (Wozniak, 1990; content/SOURCES.md S4) ----------
  // grade q: 0 to 5. Again = 1, Hard = 3, Good = 4, Easy = 5. A miss restarts the card (ease unchanged) and it is due again today.
  // Otherwise: the interval is 1 day, then 6, then the last interval times the ease; then the ease moves by 0.1 - (5-q) * (0.08 + (5-q) * 0.02), never below 1.3.
  function grade(id, q) {
    var c = S.cards[id] || { ef: 2.5, rep: 0, int: 0, due: dayNow(), n: 0 };
    if (q < 3) { c.rep = 0; c.int = 1; }
    else {
      c.rep += 1;
      c.int = c.rep === 1 ? 1 : c.rep === 2 ? 6 : Math.ceil(c.int * c.ef);
      c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    }
    c.due = dayNow() + (q < 3 ? 0 : c.int); c.n++;
    S.cards[id] = c; save();
  }
  // Every quiz, in a lesson or on a roles family, is a "set". Each question in a set becomes a review card.
  var QSETS = {}, QINDEX = {};
  Object.keys(A.lessons).forEach(function (cid) { QSETS[cid] = A.lessons[cid].quiz; });
  if (A.roles) A.roles.families.forEach(function (f) { QSETS['roles.' + f.id] = f.quiz; });
  Object.keys(QSETS).forEach(function (sid) { QSETS[sid].forEach(function (q) { QINDEX[q.id] = q; }); });
  function dueIds() { var d = dayNow(); return Object.keys(S.cards).filter(function (id) { return QINDEX[id] && S.cards[id].due <= d; }).sort(function (a, b) { return S.cards[a].due - S.cards[b].due; }); }
  function setPct(sid) { var qs = QSETS[sid]; if (!qs) return 0; var n = 0; qs.forEach(function (q) { if (S.cards[q.id] && S.cards[q.id].rep >= 1) n++; }); return n / qs.length; }

  // ---------- the curriculum helpers ----------
  function trackOf(id) { return byId(A.tracks, id); }
  function conceptOf(t, id) { return byId(t.concepts, id); }
  function trackIndex(t) { return A.tracks.indexOf(t); }
  function trackPct(t) { var s = 0; t.concepts.forEach(function (c) { s += setPct(c.id); }); return s / t.concepts.length; }
  function readyIn(t) { return t.concepts.filter(function (c) { return A.lessons[c.id]; }); }
  function nextLesson(afterCid) { // the first lesson not yet done, in map order; with afterCid, the one that follows it
    var all = []; A.tracks.forEach(function (t) { readyIn(t).forEach(function (c) { all.push({ t: t, c: c }); }); });
    if (afterCid) { for (var i = 0; i < all.length; i++) if (all[i].c.id === afterCid) return all[i + 1] || null; return null; }
    return all.filter(function (x) { return !S.done[x.c.id]; })[0] || null;
  }
  var RO = A.roles;
  function famOf(id) { return RO && byId(RO.families, id); }
  function roleOf(id) { return RO && byId(RO.nodes, id); }

  function ring(pct, size, cls, label) {
    var c = 2 * Math.PI * 21, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return '<svg class="ring ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 50 50" aria-hidden="true"><circle class="bg" cx="25" cy="25" r="21"/><circle class="fg" cx="25" cy="25" r="21" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' + (label ? '<text x="25" y="26">' + label + '</text>' : '') + '</svg>';
  }
  function sourcesHtml(ids) {
    var h = '<div class="small"><b>Sources</b><br>';
    (ids || []).forEach(function (id) { var s = byId(A.sources, id); if (s) h += s.id + ' · <a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a>: ' + esc(s.note) + '<br>'; });
    return h + 'Checked by search summary only, not by reading each page. What is checked and what is not: content/SOURCES.md</div>';
  }
  function sizeBar() { return '<div class="size"><button type="button" class="btn" data-act="smaller" aria-label="Smaller text">A-</button><button type="button" class="btn" data-act="bigger" aria-label="Bigger text">A+</button><span class="muted" style="font-size:13px">Text size</span></div>'; }
  function spaceTabs() {
    if (!RO) return '';
    return '<div class="tabs" role="group" aria-label="Which map"><button type="button" data-space="learn" aria-pressed="' + (S.pos.space === 'learn') + '">Learning map</button><button type="button" data-space="roles" aria-pressed="' + (S.pos.space === 'roles') + '">Roles family tree</button></div>';
  }

  // ---------- zoom: four stops, in two spaces (the learning map and the roles tree) ----------
  var STOPS = { learn: ['Map', 'Track', 'Concept', 'Detail'], roles: ['Tree', 'Family', 'Role', 'Detail'] };
  var wantFocus = false;
  function go(z, track, concept) {
    if (S.pos.space === 'roles' && RO) {
      var f = famOf(S.pos.fam) || RO.families[0]; S.pos.fam = f.id;
      var r = roleOf(S.pos.role); if (r && r.fam !== f.id && z >= 2) { S.pos.fam = r.fam; }
      if (!r && z >= 2) z = 1;
    } else {
      S.pos.space = 'learn';
      if (track) { S.pos.track = track; var r0 = readyIn(trackOf(track)); S.pos.concept = r0.length ? r0[0].id : ''; }
      if (concept) S.pos.concept = concept;
      var t = trackOf(S.pos.track) || A.tracks[0]; S.pos.track = t.id;
      var cur = conceptOf(t, S.pos.concept);
      if (!cur || !A.lessons[cur.id]) { var rr = readyIn(t); S.pos.concept = rr.length ? rr[0].id : ''; }
      if (z >= 2 && !S.pos.concept) z = 1;
    }
    S.pos.zoom = Math.max(0, Math.min(3, z));
    save(); renderAll();
    if (wantFocus) { var h = $('#L' + S.pos.zoom + ' h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } $('#L' + S.pos.zoom).scrollTop = 0; }
  }
  function goRole(z, fam, role) { S.pos.space = 'roles'; if (fam) S.pos.fam = fam; if (role) { S.pos.role = role; S.pos.fam = roleOf(role).fam; } go(z); }
  function goLesson(x) { S.pos.space = 'learn'; go(2, x.t.id, x.c.id); }
  function canZoomIn() {
    if (S.pos.zoom === 3) return false;
    if (S.pos.zoom === 1) return S.pos.space === 'roles' ? !!roleOf(S.pos.role) && roleOf(S.pos.role).fam === S.pos.fam : !!S.pos.concept;
    return true;
  }
  function zoomBy(d) {
    if (d > 0 && !canZoomIn()) return;
    if (d > 0 && S.pos.space === 'roles' && S.pos.zoom === 0 && roleOf(S.pos.role)) S.pos.fam = roleOf(S.pos.role).fam;
    go(S.pos.zoom + d);
  }
  function applyLayers() {
    for (var i = 0; i < 4; i++) {
      var L = $('#L' + i); L.classList.toggle('is-cur', i === S.pos.zoom); L.classList.toggle('is-out', i < S.pos.zoom); L.inert = i !== S.pos.zoom;
    }
    var names = STOPS[S.pos.space], st = '';
    names.forEach(function (n, i) { st += '<button type="button" data-z="' + i + '" class="' + (i === S.pos.zoom ? 'on' : '') + '" aria-pressed="' + (i === S.pos.zoom) + '">' + n + '</button>'; });
    $('#z-stops').innerHTML = st;
    $('#z-out').disabled = S.pos.zoom === 0; $('#z-in').disabled = !canZoomIn();
    var bits = [names[0]];
    if (S.pos.space === 'roles') {
      var f = famOf(S.pos.fam), r = roleOf(S.pos.role);
      if (S.pos.zoom >= 1 && f) bits.push(f.title); if (S.pos.zoom >= 2 && r) bits.push(r.title);
    } else {
      var t = trackOf(S.pos.track), c = t && conceptOf(t, S.pos.concept);
      if (S.pos.zoom >= 1) bits.push('Track ' + (trackIndex(t) + 1)); if (S.pos.zoom >= 2 && c) bits.push(c.title);
    }
    if (S.pos.zoom >= 3) bits.push('Read more');
    $('#crumb').textContent = bits.join(' › ');
  }

  // ---------- the learning map ----------
  function renderMap() {
    var nx = nextLesson(), due = dueIds().length;
    var h = '<div class="wrap"><div>' + spaceTabs() + '<div class="kicker">The map</div><h1>Start at the bottom, build up</h1><p class="muted">Nine tracks, from first principles to using any tool at work. Tap a track to zoom in. The ring shows how much you know.</p>' +
      '<div class="row">' + (nx ? '<button type="button" class="btn primary" data-act="continue">' + (S.done[A.tracks[0].concepts[0].id] || S.xp ? 'Continue: ' : 'Start: ') + esc(nx.c.title) + '</button>' : '') +
      (due ? '<button type="button" class="btn" data-act="review">Review ' + due + ' due</button>' : '') + (window.WIDGETS && WIDGETS.sandbox ? '<button type="button" class="btn" data-act="sandbox">Prompt sandbox</button>' : '') + '</div></div><div class="map">';
    A.tracks.forEach(function (t, i) {
      var rd = readyIn(t).length, pct = trackPct(t);
      h += '<button type="button" class="card tcard' + (rd ? '' : ' soon') + (S.pos.track === t.id ? ' here' : '') + '" data-track="' + t.id + '">' + ring(pct, 52, '', Math.round(pct * 100) + '%') +
        '<div><div class="n">Track ' + (i + 1) + '</div><h3>' + esc(t.title) + '</h3></div><p>' + esc(t.blurb) + '</p><div class="meta"><span>' + t.concepts.length + ' concepts</span>' +
        (rd ? '<span class="tag go">' + rd + (rd === 1 ? ' lesson' : ' lessons') + ' ready</span>' : '<span class="tag">coming</span>') + (S.pos.track === t.id ? '<span class="tag">you are here</span>' : '') + '</div></button>';
    });
    $('#L0').innerHTML = h + '</div></div>';
  }
  function renderTrack() {
    var t = trackOf(S.pos.track), first = readyIn(t).filter(function (c) { return !S.done[c.id]; })[0] || readyIn(t)[0];
    var h = '<div class="wrap"><div><div class="kicker">Track ' + (trackIndex(t) + 1) + ' of ' + A.tracks.length + '</div><h1>' + esc(t.title) + '</h1><p class="muted">' + esc(t.blurb) + '</p>' +
      (first ? '<p style="margin:0"><button type="button" class="btn primary" data-concept="' + first.id + '">' + (S.done[first.id] ? 'Replay: ' : 'Start: ') + esc(first.title) + '</button></p>' : '<p class="muted" style="margin:0">No lesson in this track yet. Tracks 1 and 2 are ready.</p>') + '</div><div class="path">';
    t.concepts.forEach(function (c, i) {
      var ok = !!A.lessons[c.id], pct = setPct(c.id);
      h += '<button type="button" class="node' + (c.id === S.pos.concept ? ' cur' : '') + '"' + (ok ? ' data-concept="' + c.id + '"' : ' disabled') + '><span class="dot">' + ring(pct, 56, '') + '<span>' + (i + 1) + '</span></span><span><h3>' + esc(c.title) + '</h3><p>' + (ok ? esc(c.idea || '') + (S.done[c.id] ? ' · done' : '') : 'Coming soon') + '</p></span></button>';
    });
    $('#L1').innerHTML = h + '</div></div>';
  }
  function renderConcept() {
    var el = $('#L2'), t = trackOf(S.pos.track), c = conceptOf(t, S.pos.concept), L = c && A.lessons[c.id];
    if (!L) { el.dataset.key = ''; el.innerHTML = '<div class="wrap"><h1>Nothing here yet</h1><p class="muted">Pick a lesson from the track.</p></div>'; return; }
    if (el.dataset.key !== 'learn.' + c.id) { // build once per lesson, so the picture keeps its state while the quiz and chips redraw
      el.dataset.key = 'learn.' + c.id;
      el.innerHTML = '<div class="wrap"><div><div class="kicker">Track ' + (trackIndex(t) + 1) + ' · ' + esc(t.title) + '</div><h1>' + esc(c.title) + '</h1></div>' +
        '<p class="idea">' + esc(L.idea) + '</p>' +
        '<section class="card"><h3>Try it</h3><p class="muted" style="margin:0 0 10px">' + esc(L.tryit) + '</p><div class="widget" id="widget"></div><p class="note">' + esc(L.tryNote) + '</p></section>' +
        '<section class="card quiz" id="quiz" aria-label="Quiz"></section>' +
        '<div class="two"><div class="card"><h3>The Agile lens</h3><p>' + esc(L.agile) + '</p></div><div class="card"><h3>In practice</h3><p>' + esc(L.tools) + '</p></div></div>' +
        '<p><button type="button" class="btn" data-act="detail">Read more, in big type</button></p></div>';
      var host = $('#widget', el);
      if (WIDGETS[L.widget]) WIDGETS[L.widget](host, L, sandboxApi); else host.innerHTML = '<p class="muted">No picture for this one yet.</p>';
    }
    startQuiz(c.id, '#quiz'); renderQuiz();
  }
  function renderDetail() {
    var t = trackOf(S.pos.track), c = conceptOf(t, S.pos.concept), L = c && A.lessons[c.id];
    if (!L) { $('#L3').innerHTML = '<div class="wrap"><h1>Nothing to read yet</h1></div>'; return; }
    var h = '<article class="article">' + sizeBar() + '<div class="kicker">Track ' + (trackIndex(t) + 1) + ' · ' + esc(t.title) + '</div><h1>' + esc(c.title) + '</h1><p>' + esc(L.idea) + '</p>';
    L.read.forEach(function (s) { h += '<h2>' + esc(s.h) + '</h2><p>' + esc(s.p) + '</p>'; });
    h += '<div class="under"><h2>' + esc(L.under.h) + '</h2><p>' + esc(L.under.p) + '</p></div><div class="agile"><h2>The Agile lens</h2><p>' + esc(L.agile) + '</p><h2>In practice</h2><p>' + esc(L.tools) + '</p></div>' + sourcesHtml(L.src);
    var nx = nextLesson(c.id);
    $('#L3').innerHTML = h + '<p style="margin-top:24px"><button type="button" class="btn" data-z="2">Back to the lesson</button>' + (nx ? ' <button type="button" class="btn primary" data-act="nextlesson">Next lesson: ' + esc(nx.c.title) + '</button>' : '') + '</p></article>';
  }

  // ---------- the roles family tree: the same four stops ----------
  var famFilter = '';
  function renderTree() {
    var CW = 196, RH = 86, NW = 172, NH = 56, GX = 34, GY = 46, W = GX + RO.families.length * CW + 8, H = GY + RO.rows * RH + 6;
    function pos(n) { return { x: GX + RO.families.indexOf(famOf(n.fam)) * CW + (CW - NW) / 2, y: GY + n.row * RH + (RH - NH) / 2 }; }
    var svg = '<svg class="edges" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">';
    RO.edges.forEach(function (e) {
      var a = roleOf(e[0]), b = roleOf(e[1]), p = pos(a), q = pos(b), x1 = p.x + NW / 2, y1 = p.y + NH, x2 = q.x + NW / 2, y2 = q.y, my = (y1 + y2) / 2;
      var dim = famFilter && a.fam !== famFilter && b.fam !== famFilter;
      var d = 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2;
      if (a.fam === b.fam && b.row - a.row > 1) { var sx = p.x + NW, bow = sx + 20, ya = p.y + NH / 2, yb = q.y + NH / 2; d = 'M' + sx + ' ' + ya + ' C' + bow + ' ' + ya + ' ' + bow + ' ' + yb + ' ' + sx + ' ' + yb; } // a long hop in one lane bows out to the side, so it does not hide behind the roles between
      svg += '<path class="' + (e[2] === 'grew' ? 'grew' : 'move') + (dim ? ' dim' : '') + '" d="' + d + '"/>';
    });
    svg += '</svg>';
    var nodes = '';
    RO.families.forEach(function (f, i) { nodes += '<button type="button" class="lane' + (famFilter && famFilter !== f.id ? ' dim' : '') + '" data-fam="' + f.id + '" style="left:' + (GX + i * CW + (CW - NW) / 2) + 'px;width:' + NW + 'px" title="Zoom in to this family">' + esc(f.title) + '</button>'; });
    RO.nodes.forEach(function (n) {
      var p = pos(n);
      nodes += '<button type="button" class="rnode' + (n.forecast ? ' fc' : '') + (n.you ? ' you' : '') + (S.pos.role === n.id ? ' here' : '') + (famFilter && famFilter !== n.fam ? ' dim' : '') + '" data-role="' + n.id + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + NW + 'px;height:' + NH + 'px">' + esc(n.title) + (n.forecast ? '<small>forecast</small>' : n.you ? '<small>your role</small>' : '') + '</button>';
    });
    var chips = '<button type="button" data-filter=""' + (famFilter ? '' : ' class="on"') + ' aria-pressed="' + !famFilter + '">All</button>';
    RO.families.forEach(function (f) { chips += '<button type="button" data-filter="' + f.id + '"' + (famFilter === f.id ? ' class="on"' : '') + ' aria-pressed="' + (famFilter === f.id) + '">' + esc(f.title) + '</button>'; });
    $('#L0').innerHTML = '<div class="wrap"><div>' + spaceTabs() + '<div class="kicker">Zoom out</div><h1>A family tree of AI-era roles</h1><p class="muted">' + esc(RO.blurb) + '</p></div>' +
      '<div class="exs" role="group" aria-label="Show one family">' + chips + '</div>' +
      '<div class="card treebox"><div class="tree" style="width:' + W + 'px;height:' + H + 'px"><span class="axis" style="top:' + (GY + 8) + 'px">earlier</span><span class="axis" style="top:' + (H - 30) + 'px">later</span>' + svg + nodes + '</div></div>' +
      '<p class="legend"><span><i class="l grew"></i> grew out of</span><span><i class="l move"></i> influence or a common move</span><span><i class="b fc"></i> forecast, not fact</span><span class="muted">On a small screen, swipe the tree sideways.</span></p>' +
      '<p class="note">' + RO.credit + '</p></div>';
  }
  function renderFamily() {
    var f = famOf(S.pos.fam), ns = RO.nodes.filter(function (n) { return n.fam === f.id; }).sort(function (a, b) { return a.row - b.row; });
    var h = '<div class="wrap"><div><div class="kicker">Roles family ' + (RO.families.indexOf(f) + 1) + ' of ' + RO.families.length + '</div><h1>' + esc(f.title) + '</h1><p class="muted">' + esc(f.blurb) + '</p></div><div class="path">';
    ns.forEach(function (n, i) {
      h += '<button type="button" class="node' + (n.id === S.pos.role ? ' cur' : '') + '" data-role="' + n.id + '"><span class="dot"><span>' + (i + 1) + '</span></span><span><h3>' + esc(n.title) + (n.forecast ? ' <span class="tag">forecast</span>' : '') + '</h3><p>' + esc(n.one) + '</p></span></button>';
    });
    $('#L1').innerHTML = h + '</div><section class="card quiz" id="fquiz" aria-label="Quiz"></section></div>';
    startQuiz('roles.' + f.id, '#fquiz'); renderQuiz();
  }
  function roleLinks(n) {
    var from = [], to = [];
    RO.edges.forEach(function (e) { if (e[1] === n.id) from.push(e); if (e[0] === n.id) to.push(e); });
    function list(es, k) { return es.map(function (e) { var o = roleOf(e[k]); return '<button type="button" class="link" data-role="' + o.id + '">' + esc(o.title) + '</button><span class="muted"> (' + (e[2] === 'grew' ? 'grew out of' : 'influence or common move') + ')</span>'; }).join('<br>'); }
    return '<div class="two"><div class="card"><h3>Where it came from</h3><p>' + (from.length ? list(from, 0) : 'A root of this tree.') + '</p></div><div class="card"><h3>Where it leads</h3><p>' + (to.length ? list(to, 1) : 'Nothing drawn yet. It is still being written.') + '</p></div></div>';
  }
  function renderRole() {
    var n = roleOf(S.pos.role), el = $('#L2'); el.dataset.key = '';
    if (!n) { el.innerHTML = '<div class="wrap"><h1>Pick a role</h1><p class="muted">Choose one from the tree or the family.</p></div>'; return; }
    el.innerHTML = '<div class="wrap"><div><div class="kicker">' + esc(famOf(n.fam).title) + (n.forecast ? ' · forecast, not fact' : '') + '</div><h1>' + esc(n.title) + '</h1></div><p class="idea">' + esc(n.one) + '</p>' + roleLinks(n) +
      '<div class="card"><h3>' + (n.forecast ? 'Why I think so' : 'Where it is heading') + '</h3><p style="margin:0">' + esc(n.heading) + '</p></div>' +
      '<p><button type="button" class="btn primary" data-act="detail">Read more, in big type</button> <button type="button" class="btn" data-z="1">The whole family and its quiz</button></p></div>';
  }
  function renderRoleDetail() {
    var n = roleOf(S.pos.role);
    if (!n) { $('#L3').innerHTML = '<div class="wrap"><h1>Nothing to read yet</h1></div>'; return; }
    var h = '<article class="article">' + sizeBar() + '<div class="kicker">' + esc(famOf(n.fam).title) + (n.forecast ? ' · forecast, not fact' : '') + '</div><h1>' + esc(n.title) + '</h1><p>' + esc(n.one) + '</p>';
    n.read.forEach(function (s) { h += '<h2>' + esc(s.h) + '</h2><p>' + esc(s.p) + '</p>'; });
    h += '<div class="agile"><h2>' + (n.forecast ? 'Why I think so' : 'Where it is heading') + '</h2><p>' + esc(n.heading) + '</p></div>' + sourcesHtml(n.src);
    $('#L3').innerHTML = h + '<p style="margin-top:24px"><button type="button" class="btn" data-z="0">Back to the tree</button></p></article>';
  }

  // ---------- the quiz: one at a time, in a lesson or on a roles family ----------
  var Q = null;
  function startQuiz(sid, box) { if (!Q || Q.sid !== sid) Q = { sid: sid, box: box, i: 0, picked: null, right: 0, res: [], done: false }; }
  function quizLive() { return !!Q && ((S.pos.space === 'learn' && S.pos.zoom === 2 && Q.box === '#quiz') || (S.pos.space === 'roles' && S.pos.zoom === 1 && Q.box === '#fquiz')); }
  function renderQuiz(focus) {
    var box = Q && $(Q.box); if (!box) return;
    var qs = QSETS[Q.sid], n = qs.length, dots = '';
    for (var i = 0; i < n; i++) dots += '<i class="' + (Q.res[i] === true ? 'ok' : Q.res[i] === false ? 'bad' : i === Q.i && !Q.done ? 'on' : '') + '"></i>';
    if (Q.done) {
      var nx = S.pos.space === 'learn' ? nextLesson(Q.sid) : null;
      box.innerHTML = '<div class="done"><div class="dots">' + dots + '</div><h3 tabindex="-1">' + Q.right + ' of ' + n + ' right</h3><p class="muted" style="margin:0">' + (Q.gain ? '+' + Q.gain + ' XP. ' : '') + (Q.added ? Q.added + ' cards joined your review queue.' : 'Your review cards keep their schedule.') + '</p>' +
        '<div class="row" style="justify-content:center">' + (nx ? '<button type="button" class="btn primary" data-act="nextlesson">Next lesson: ' + esc(nx.c.title) + '</button>' : '') +
        (S.pos.space === 'learn' ? '<button type="button" class="btn' + (nx ? '' : ' primary') + '" data-act="detail">Read more</button><button type="button" class="btn" data-z="1">Back to the track</button>' : '<button type="button" class="btn" data-z="0">Back to the tree</button>') +
        '<button type="button" class="btn" data-act="replay">Replay the quiz</button></div></div>';
      if (focus) $('h3', box).focus({ preventScroll: true });
      return;
    }
    var q = qs[Q.i], o = '';
    q.opts.forEach(function (t, i) {
      var cls = Q.picked === null ? '' : i === q.a ? ' right' : i === Q.picked ? ' wrong' : '';
      o += '<button type="button" class="opt' + cls + '" data-opt="' + i + '"' + (Q.picked === null ? '' : ' disabled') + '><kbd>' + (i + 1) + '</kbd><span>' + esc(t) + (Q.picked === null ? '' : i === q.a ? ' <b class="mark">✓ correct</b>' : i === Q.picked ? ' <b class="mark">✗ your pick</b>' : '') + '</span></button>';
    });
    box.innerHTML = '<div class="dots">' + dots + '</div><p class="q" tabindex="-1">' + esc(q.q) + '</p><div class="opts">' + o + '</div>' +
      (Q.picked === null ? '' : '<p class="why" role="status"><b>' + (Q.picked === q.a ? 'Right. ' : 'Not quite. ') + '</b>' + esc(q.why) + '</p><p style="margin:12px 0 0"><button type="button" class="btn primary" data-act="next">' + (Q.i + 1 < n ? 'Next question' : 'Finish') + '</button></p>');
    if (focus) { var f = Q.picked === null ? $('.q', box) : $('[data-act="next"]', box); if (f) f.focus({ preventScroll: Q.picked !== null }); }
  }
  function pick(i) {
    if (!Q || Q.done || Q.picked !== null) return;
    var q = QSETS[Q.sid][Q.i]; if (i >= q.opts.length) return;
    var ok = i === q.a; Q.picked = i; Q.res[Q.i] = ok; if (ok) Q.right++;
    if (!S.cards[q.id]) { grade(q.id, ok ? 4 : 1); var g = ok ? 5 : 1; addXp(g); Q.gain = (Q.gain || 0) + g; Q.added = (Q.added || 0) + 1; } // only the first sight of a question makes a card and earns XP
    renderQuiz(true); renderChips();
  }
  function nextQ() {
    if (!Q || Q.picked === null) return;
    Q.picked = null; Q.i++;
    if (Q.i >= QSETS[Q.sid].length) { Q.done = true; if (!S.done[Q.sid]) { S.done[Q.sid] = true; addXp(20); Q.gain = (Q.gain || 0) + 20; } save(); renderAll(); }
    renderQuiz(true);
  }

  // ---------- chips, menu ----------
  function renderChips() {
    var n = streak(), lvl = 1 + Math.floor(S.xp / 100), min = Math.floor(today().min), goal = S.goal, due = dueIds().length;
    $('#c-streak').innerHTML = n ? '<b>' + n + '</b> day streak' : 'No streak yet';
    $('#c-level').innerHTML = ring((S.xp % 100) / 100, 22, 'lvl') + 'Level <b>' + lvl + '</b>';
    $('#c-goal').innerHTML = ring(Math.min(1, today().min / goal), 22, 'goal') + '<b>' + min + '</b> / ' + goal + ' min<span class="hide-sm"> today</span>';
    $('#c-review').innerHTML = 'Review' + (due ? ' <span class="badge">' + due + '</span>' : '');
  }
  var resetArmed = false, menuMsg = '';
  function renderMenu() {
    var g = ''; [10, 20, 30, 45, 60].forEach(function (m) { g += '<option value="' + m + '"' + (m === S.goal ? ' selected' : '') + '>' + m + ' minutes</option>'; });
    $('#menu').innerHTML = '<h3>Go to</h3><div class="row"><button type="button" class="btn" data-m="map">Learning map</button>' + (RO ? '<button type="button" class="btn" data-m="roles">Roles tree</button>' : '') + (WIDGETS.sandbox ? '<button type="button" class="btn" data-m="sandbox">Prompt sandbox</button>' : '') + '</div>' +
      '<h3>Daily goal</h3><div class="row"><select id="m-goal" aria-label="Daily goal">' + g + '</select></div>' +
      '<h3>Look</h3><div class="row"><button type="button" class="btn" data-m="theme">Theme: ' + (S.theme || 'auto') + '</button></div>' +
      '<h3>Your progress</h3><p class="muted" style="margin:0;font-size:13px">Kept in this browser only. Save a copy to a file to move it or keep it safe.</p>' +
      '<div class="row"><button type="button" class="btn" data-m="save">Save to file</button><button type="button" class="btn" data-m="load">Load from file</button></div>' +
      '<div class="row"><button type="button" class="btn warn" data-m="reset">' + (resetArmed ? 'Press again to erase it all' : 'Reset progress') + '</button></div>' + (menuMsg ? '<p class="muted" style="margin:0;font-size:13px" role="status" id="m-msg">' + esc(menuMsg) + '</p>' : '') +
      '<h3>Keys</h3><p class="keys"><kbd>-</kbd> <kbd>+</kbd> zoom out and in · <kbd>1</kbd> to <kbd>4</kbd> answer · <kbd>Enter</kbd> next · <kbd>R</kbd> review · <kbd>M</kbd> map · <kbd>T</kbd> roles tree · <kbd>S</kbd> sandbox · <kbd>Esc</kbd> close</p>' +
      '<input type="file" id="m-file" accept="application/json,.json" hidden>';
  }
  function applyTheme() { if (S.theme) document.documentElement.setAttribute('data-theme', S.theme); else document.documentElement.removeAttribute('data-theme'); }
  function applyRead() { document.documentElement.style.setProperty('--read', S.read + 'px'); }

  // ---------- sheets: review and the sandbox open over the page, hold the keyboard, and give focus back when they close ----------
  var sheetBack = null;
  function openSheet(id) {
    closeMenu(); sheetBack = document.activeElement;
    ['#bar', '#stage', '#zoombar'].forEach(function (s) { $(s).inert = true; });
    var el = $(id); el.hidden = false; el.scrollTop = 0; return el;
  }
  function closeSheet(id) {
    $(id).hidden = true; ['#bar', '#zoombar'].forEach(function (s) { $(s).inert = false; }); $('#stage').inert = false; applyLayers();
    if (sheetBack && document.contains(sheetBack)) sheetBack.focus({ preventScroll: true }); sheetBack = null;
  }
  function sheetOpen() { return R || !$('#sandbox').hidden; }

  var R = null;
  function openReview() { if (sheetOpen()) return; var ids = dueIds(); R = { ids: ids, i: 0, picked: null, gain: 0, shown: ids.length }; openSheet('#review'); renderReview(true); }
  function closeReview() { R = null; closeSheet('#review'); renderAll(); }
  function renderReview(focus) {
    var box = $('#review'); if (!R) return;
    if (R.i >= R.ids.length) {
      var next = Infinity; Object.keys(S.cards).forEach(function (id) { if (QINDEX[id] && S.cards[id].due > dayNow()) next = Math.min(next, S.cards[id].due - dayNow()); });
      box.innerHTML = '<div class="sheet"><div class="card done"><h2 id="rv-title" tabindex="-1">' + (R.shown ? 'Review done' : 'Nothing due') + '</h2><p class="muted" style="margin:0">' + (R.shown ? '+' + R.gain + ' XP. ' : '') + (next < Infinity ? 'Next card is due in ' + next + (next === 1 ? ' day.' : ' days.') : 'Finish a lesson to make review cards.') + '</p><button type="button" class="btn primary" data-r="close">Close</button></div></div>';
      $('[data-r="close"]', box).focus(); return;
    }
    var id = R.ids[R.i], q = QINDEX[id], o = '';
    q.opts.forEach(function (t, i) { var cls = R.picked === null ? '' : i === q.a ? ' right' : i === R.picked ? ' wrong' : ''; o += '<button type="button" class="opt' + cls + '" data-ropt="' + i + '"' + (R.picked === null ? '' : ' disabled') + '><kbd>' + (i + 1) + '</kbd><span>' + esc(t) + (R.picked === null ? '' : i === q.a ? ' <b class="mark">✓ correct</b>' : i === R.picked ? ' <b class="mark">✗ your pick</b>' : '') + '</span></button>'; });
    var tail = '';
    if (R.picked !== null) {
      var ok = R.picked === q.a;
      tail = '<p class="why" role="status"><b>' + (ok ? 'Right. ' : 'Not quite. ') + '</b>' + esc(q.why) + '</p>' +
        (ok ? '<p class="muted" style="margin:6px 0">How did that feel?</p><div class="grades"><button type="button" class="btn" data-g="3"><kbd>1</kbd> Hard<small>sooner</small></button><button type="button" class="btn primary" data-g="4"><kbd>2</kbd> Good<small>as planned</small></button><button type="button" class="btn" data-g="5"><kbd>3</kbd> Easy<small>later</small></button></div>'
          : '<p style="margin:12px 0 0"><button type="button" class="btn primary" data-g="1">Got it, next</button></p>');
    }
    box.innerHTML = '<div class="sheet"><div class="sheethead"><h2 class="kicker" id="rv-title">Review · card ' + (R.i + 1) + ' of ' + R.ids.length + '</h2><button type="button" class="btn" data-r="close">Close</button></div><div class="card"><p class="q" tabindex="-1">' + esc(q.q) + '</p><div class="opts">' + o + '</div>' + tail + '</div></div>';
    if (focus) { var f = R.picked === null ? $('.q', box) : $('[data-g="4"]', box) || $('[data-g="1"]', box); if (f) f.focus(); }
  }
  function rpick(i) { if (R && R.picked === null && R.i < R.ids.length && i < QINDEX[R.ids[R.i]].opts.length) { R.picked = i; renderReview(true); } }
  function rgrade(g) { if (!R || R.picked === null) return; var id = R.ids[R.i]; grade(id, g); addXp(2); R.gain += 2; R.i++; R.picked = null; renderReview(true); renderChips(); }

  // The sandbox keeps the names you list (to warn about them) in this browser. They are left out of the Save file.
  var sandboxApi = { names: function () { return S.names; }, setNames: function (list) { S.names = list.slice(0, 50); save(); }, open: function (text) { openSandbox(text); } };
  function openSandbox(text) {
    if (sheetOpen() || !WIDGETS.sandbox) return;
    var el = openSheet('#sandbox');
    el.innerHTML = '<div class="sheet wide"><div class="sheethead"><h2 id="sb-title" tabindex="-1">Prompt sandbox</h2><button type="button" class="btn" data-sb="close">Close</button></div>' +
      '<p class="muted" style="margin:0">Draft a prompt and score it against the rubric before you use it anywhere. Nothing you type here is sent, saved or run through a model.</p><div class="card"><div class="widget" id="sb-host"></div></div></div>';
    WIDGETS.sandbox($('#sb-host', el), { full: true, text: typeof text === 'string' ? text : undefined, examples: (A.lessons.judge || {}).examples || [] }, sandboxApi);
    $('#sb-title', el).focus();
  }
  function closeSandbox() { $('#sandbox').innerHTML = ''; closeSheet('#sandbox'); }

  // ---------- wiring ----------
  function renderAll() {
    if (S.pos.space === 'roles' && RO) { renderTree(); renderFamily(); renderRole(); renderRoleDetail(); }
    else { renderMap(); renderTrack(); renderConcept(); renderDetail(); }
    applyLayers(); renderChips();
  }
  function typing(e) { var t = e.target || {}; return /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '') && !/^(checkbox|radio|range)$/.test(t.type || ''); }
  function act(fn) { wantFocus = true; try { fn(); } finally { wantFocus = false; } }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) { if (!e.target.closest('#menu')) closeMenu(); return; }
    var d = b.dataset;
    if (b.closest('.widget')) return; // widgets handle their own buttons
    if (d.space) return act(function () { S.pos.space = d.space; go(0); });
    if (d.track) return act(function () { go(1, d.track); });
    if (d.concept) return act(function () { go(2, null, d.concept); });
    if (d.fam) return act(function () { goRole(1, d.fam); });
    if (d.role) return act(function () { goRole(2, null, d.role); });
    if (d.filter !== undefined) { famFilter = d.filter; renderTree(); var fb = $('#L0 [data-filter="' + famFilter + '"]'); if (fb) fb.focus(); return; }
    if (d.z) return act(function () { go(+d.z); });
    if (d.opt) return pick(+d.opt);
    if (d.ropt) return rpick(+d.ropt);
    if (d.g) return rgrade(+d.g);
    if (d.r === 'close') return closeReview();
    if (d.sb === 'close') return closeSandbox();
    if (d.act === 'next') return nextQ();
    if (d.act === 'detail') return act(function () { go(3); });
    if (d.act === 'replay') { var sid = Q.sid, box = Q.box; Q = null; startQuiz(sid, box); return renderQuiz(true); }
    if (d.act === 'continue') { var nx = nextLesson(); if (nx) act(function () { goLesson(nx); }); return; }
    if (d.act === 'nextlesson') { var n2 = nextLesson(S.pos.concept); if (n2) act(function () { goLesson(n2); }); return; }
    if (d.act === 'review') return openReview();
    if (d.act === 'sandbox') return openSandbox();
    if (d.act === 'bigger' || d.act === 'smaller') { S.read = Math.max(16, Math.min(36, S.read + (d.act === 'bigger' ? 2 : -2))); applyRead(); return save(); }
    if (d.m) return menuAct(d.m);
    if (b.id === 'z-in') return zoomBy(1);
    if (b.id === 'z-out') return zoomBy(-1);
    if (b.id === 'c-review') return openReview();
    if (b.id === 'c-menu') return toggleMenu();
  });
  function toggleMenu() { var m = $('#menu'); if (m.hidden) { renderMenu(); m.hidden = false; var f = $('button, select', m); if (f) f.focus(); } else return closeMenu(true); $('#c-menu').setAttribute('aria-expanded', 'true'); }
  function closeMenu(refocus) { var m = $('#menu'); if (!m.hidden) { m.hidden = true; $('#c-menu').setAttribute('aria-expanded', 'false'); if (refocus) $('#c-menu').focus(); } }
  function menuAct(a) {
    menuMsg = '';
    if (a === 'map') { closeMenu(); return act(function () { S.pos.space = 'learn'; go(0); }); }
    if (a === 'roles') { closeMenu(); return act(function () { S.pos.space = 'roles'; go(0); }); }
    if (a === 'sandbox') { closeMenu(); return openSandbox(); }
    if (a === 'theme') { S.theme = S.theme === '' ? 'light' : S.theme === 'light' ? 'dark' : ''; applyTheme(); save(); }
    else if (a === 'save') {
      var out = Object.assign({}, S, { names: [], saved: new Date().toISOString() }); // the names you listed for the sandbox stay out of the file
      var blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }), x = document.createElement('a');
      x.href = URL.createObjectURL(blob); x.download = 'ai-academy-progress.json'; document.body.appendChild(x); x.click(); x.remove(); setTimeout(function () { URL.revokeObjectURL(x.href); }, 2000); menuMsg = 'Saved ai-academy-progress.json to your downloads.';
    } else if (a === 'load') { $('#m-file').click(); return; }
    else if (a === 'reset') { if (!resetArmed) { resetArmed = true; renderMenu(); $('[data-m="reset"]').focus(); setTimeout(function () { resetArmed = false; if (!$('#menu').hidden && $('[data-m="reset"]')) { var had = document.activeElement === $('[data-m="reset"]'); renderMenu(); if (had) $('[data-m="reset"]').focus(); } }, 4000); return; } resetArmed = false; S = fresh(); try { localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ } Q = null; applyTheme(); applyRead(); $('#L2').dataset.key = ''; renderAll(); menuMsg = 'Progress erased.'; }
    renderMenu(); var again = $('[data-m="' + a + '"]'); if (again) again.focus();
  }
  document.addEventListener('change', function (e) {
    if (e.target.id === 'm-goal') { S.goal = +e.target.value; save(); renderChips(); }
    if (e.target.id === 'm-file' && e.target.files[0]) {
      var rd = new FileReader();
      rd.onload = function () {
        try { var s = adopt(JSON.parse(rd.result)); if (!s) throw new Error('not a progress file'); s.names = S.names; S = s; saveNow(); Q = null; applyTheme(); applyRead(); $('#L2').dataset.key = ''; go(S.pos.zoom); menuMsg = 'Progress loaded.'; }
        catch (err) { menuMsg = 'That file is not an AI Academy progress file. Nothing was changed.'; }
        renderMenu(); var lb = $('[data-m="load"]'); if (lb) lb.focus();
      };
      rd.readAsText(e.target.files[0]);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (R) closeReview(); else if (!$('#sandbox').hidden) closeSandbox(); else closeMenu(true); return; }
    if (typing(e)) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key, sheet = sheetOpen();
    if (R) {
      if (/^[1-4]$/.test(k)) { if (R.i >= R.ids.length) return; var q = QINDEX[R.ids[R.i]]; if (R.picked === null) rpick(+k - 1); else if (R.picked === q.a && +k <= 3) rgrade([3, 4, 5][+k - 1]); }
      else if (k === 'Enter' && !/^BUTTON$/.test(e.target.tagName) && R.picked !== null && R.i < R.ids.length) rgrade(R.picked === QINDEX[R.ids[R.i]].a ? 4 : 1);
      return;
    }
    if (sheet) return;
    if (k === '-' || k === '_') act(function () { zoomBy(-1); });
    else if (k === '+' || k === '=') act(function () { zoomBy(1); });
    else if (/^[1-4]$/.test(k)) { if (quizLive()) pick(+k - 1); }
    else if (k === 'Enter' && !/^(BUTTON|A)$/.test(e.target.tagName)) { if (quizLive()) nextQ(); }
    else if (k === 'r') openReview();
    else if (k === 's') { if (WIDGETS.sandbox) { e.preventDefault(); openSandbox(); } }
    else if (k === 'm') { closeMenu(); act(function () { S.pos.space = 'learn'; go(0); }); }
    else if (k === 't' && RO) { closeMenu(); act(function () { S.pos.space = 'roles'; go(0); }); }
  });
  var wheelAt = 0;
  document.addEventListener('wheel', function (e) { // Ctrl + wheel, and the pinch on a trackpad (which arrives as Ctrl + wheel)
    if (!e.ctrlKey || sheetOpen()) return; e.preventDefault();
    if (Date.now() - wheelAt < 450) return; wheelAt = Date.now(); zoomBy(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  var pinch = 0;
  document.addEventListener('touchstart', function (e) { pinch = e.touches.length === 2 ? Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) : 0; }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 2 || !pinch || sheetOpen()) return;
    var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (d / pinch > 1.3) { pinch = 0; zoomBy(1); } else if (d / pinch < 0.77) { pinch = 0; zoomBy(-1); }
  }, { passive: true });

  // minutes studied today: counts only while the page is visible and you touched it in the last minute
  var lastInput = Date.now();
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true }); });
  setInterval(function () { if (document.visibilityState === 'visible' && Date.now() - lastInput < 60000) { today().min += 5 / 60; save(); renderChips(); } }, 5000);

  applyTheme(); applyRead();
  go(S.pos.zoom);
  window.ACADEMY_DEBUG = { state: function () { return S; }, tokenize: WIDGETS._tokenize, grade: grade, go: go, dueIds: dueIds, dayNow: dayNow, adopt: adopt };
})();
