// AI Academy: state, spaced repetition, semantic zoom, the toy tokenizer, quiz and review. No network, no libraries.
(function () {
  'use strict';
  var A = ACADEMY, KEY = 'aiacademy.v1';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dayNow() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); }

  // ---------- state: kept in this browser only (localStorage), and Save / Load to a file ----------
  function fresh() { return { v: 1, xp: 0, days: {}, cards: {}, done: {}, goal: 10, read: 22, theme: '', pos: { track: 'models', concept: 'tokens', zoom: 0 } }; }
  function load() {
    try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.v === 1 && j.cards && j.days) return Object.assign(fresh(), j); } catch (e) { /* private window or blocked storage: start fresh */ }
    return fresh();
  }
  var S = load(), saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* the app still works without storage */ } }, 150); }
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
  var QINDEX = {};
  Object.keys(A.lessons).forEach(function (cid) { A.lessons[cid].quiz.forEach(function (q) { QINDEX[q.id] = q; q.concept = cid; }); });
  function dueIds() { var d = dayNow(); return Object.keys(S.cards).filter(function (id) { return QINDEX[id] && S.cards[id].due <= d; }).sort(function (a, b) { return S.cards[a].due - S.cards[b].due; }); }

  // ---------- the curriculum helpers ----------
  function trackOf(id) { return A.tracks.filter(function (t) { return t.id === id; })[0]; }
  function conceptOf(t, id) { return t.concepts.filter(function (c) { return c.id === id; })[0]; }
  function trackIndex(t) { return A.tracks.indexOf(t); }
  function conceptPct(cid) { var L = A.lessons[cid]; if (!L) return 0; var n = 0; L.quiz.forEach(function (q) { if (S.cards[q.id] && S.cards[q.id].rep >= 1) n++; }); return n / L.quiz.length; }
  function trackPct(t) { var s = 0; t.concepts.forEach(function (c) { s += conceptPct(c.id); }); return s / t.concepts.length; }
  function readyIn(t) { return t.concepts.filter(function (c) { return A.lessons[c.id]; }); }

  function ring(pct, size, cls, label) {
    var c = 2 * Math.PI * 21, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return '<svg class="ring ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 50 50" aria-hidden="true"><circle class="bg" cx="25" cy="25" r="21"/><circle class="fg" cx="25" cy="25" r="21" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' + (label ? '<text x="25" y="26">' + label + '</text>' : '') + '</svg>';
  }

  // ---------- the toy tokenizer ----------
  var PIECES = {};
  (function () {
    function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
    A.vocab.words.forEach(function (w) { [w, cap(w)].forEach(function (x) { PIECES[x] = 1; PIECES[' ' + x] = 1; }); });
    A.vocab.suffix.forEach(function (x) { PIECES[x] = 1; });
    A.vocab.prefix.forEach(function (x) { PIECES[x] = 1; PIECES[' ' + x] = 1; });
  })();
  function matchAt(t, i) { for (var n = Math.min(16, t.length - i); n >= 1; n--) { var s = t.substr(i, n); if (PIECES[s]) return s; } return null; }
  function tokenize(t) {
    var out = [], i = 0;
    while (i < t.length) {
      var m = matchAt(t, i);
      if (m) { out.push(m); i += m.length; continue; }
      if (t.charAt(i) === ' ' && i + 1 < t.length && t.charAt(i + 1) !== ' ') { // a space joins the piece after it, as in real tokenizers
        var m2 = matchAt(t, i + 1) || String.fromCodePoint(t.codePointAt(i + 1));
        out.push(' ' + m2); i += 1 + m2.length; continue;
      }
      var cp = String.fromCodePoint(t.codePointAt(i)); out.push(cp); i += cp.length;
    }
    return out;
  }
  function tid(s) { var h = 2166136261; for (var k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return 100 + ((h >>> 0) % 49900); } // made-up, stable
  var BUDGET = 100, tkText = A.lessons.tokens.examples[0].text;
  function tkUpdate() {
    var chips = $('#tk-chips'); if (!chips) return;
    var toks = tokenize(tkText), words = tkText.trim() ? tkText.trim().split(/\s+/).length : 0, h = '';
    toks.slice(0, 300).forEach(function (t, i) {
      h += '<span class="tok c' + (i % 6) + '" title="token ' + (i + 1) + '">' + esc(t.replace(/^ /, '·').replace(/\n/g, '↵')) + '<small>' + tid(t) + '</small></span>';
    });
    if (toks.length > 300) h += '<span class="muted"> ... and ' + (toks.length - 300) + ' more</span>';
    chips.innerHTML = h || '<span class="muted">Type something above.</span>';
    var cpt = toks.length ? (tkText.length / toks.length) : 0;
    $('#tk-stat').innerHTML = '<span><b>' + toks.length + '</b> tokens</span><span><b>' + words + '</b> words</span><span><b>' + tkText.length + '</b> characters</span><span><b>' + (cpt ? cpt.toFixed(1) : '0') + '</b> characters per token</span>';
    var m = $('#tk-meter'); m.classList.toggle('over', toks.length > BUDGET); $('i', m).style.width = Math.min(100, toks.length / BUDGET * 100) + '%';
    $('#tk-budget').textContent = toks.length > BUDGET ? 'Over the ' + BUDGET + '-token toy budget: something has to be trimmed.' : 'Toy context budget: ' + toks.length + ' of ' + BUDGET + ' tokens used.';
  }

  // ---------- zoom ----------
  var STOPS = ['Map', 'Track', 'Concept', 'Detail'];
  function go(z, track, concept) {
    if (track) { S.pos.track = track; var t0 = trackOf(track), r0 = readyIn(t0); S.pos.concept = r0.length ? r0[0].id : ''; }
    if (concept) S.pos.concept = concept;
    var t = trackOf(S.pos.track) || A.tracks[0]; S.pos.track = t.id;
    var cur = conceptOf(t, S.pos.concept);
    if (!cur || !A.lessons[cur.id]) { var r = readyIn(t); S.pos.concept = r.length ? r[0].id : ''; }
    if (z >= 2 && !S.pos.concept) z = 1;
    S.pos.zoom = Math.max(0, Math.min(3, z));
    save(); renderAll();
  }
  function zoomBy(d) { go(S.pos.zoom + d); }
  function applyLayers() {
    for (var i = 0; i < 4; i++) {
      var L = $('#L' + i); L.classList.toggle('is-cur', i === S.pos.zoom); L.classList.toggle('is-out', i < S.pos.zoom); L.inert = i !== S.pos.zoom;
    }
    var st = ''; STOPS.forEach(function (n, i) { st += '<button type="button" data-z="' + i + '" class="' + (i === S.pos.zoom ? 'on' : '') + '" aria-pressed="' + (i === S.pos.zoom) + '">' + n + '</button>'; });
    $('#z-stops').innerHTML = st;
    $('#z-out').disabled = S.pos.zoom === 0; $('#z-in').disabled = S.pos.zoom === 3 || (S.pos.zoom === 1 && !S.pos.concept);
    var t = trackOf(S.pos.track), c = t && conceptOf(t, S.pos.concept), bits = ['Map'];
    if (S.pos.zoom >= 1) bits.push('Track ' + (trackIndex(t) + 1)); if (S.pos.zoom >= 2 && c) bits.push(c.title); if (S.pos.zoom >= 3) bits.push('Read more');
    $('#crumb').textContent = bits.join(' › ');
  }

  // ---------- layers ----------
  function renderMap() {
    var h = '<div class="wrap"><div><div class="kicker">The map</div><h1>Start at the bottom, build up</h1><p class="muted">Nine tracks, from first principles to using any tool at work. Tap a track to zoom in. The ring shows how much you know.</p></div><div class="map">';
    A.tracks.forEach(function (t, i) {
      var rd = readyIn(t).length, pct = trackPct(t);
      h += '<button type="button" class="card tcard' + (rd ? '' : ' soon') + (S.pos.track === t.id ? ' here' : '') + '" data-track="' + t.id + '">' + ring(pct, 52, '', Math.round(pct * 100) + '%') +
        '<div><div class="n">Track ' + (i + 1) + '</div><h3>' + esc(t.title) + '</h3></div><p>' + esc(t.blurb) + '</p><div class="meta"><span>' + t.concepts.length + ' concepts</span>' +
        (rd ? '<span class="tag go">' + rd + ' lesson ready</span>' : '<span class="tag">coming</span>') + (S.pos.track === t.id ? '<span class="tag">you are here</span>' : '') + '</div></button>';
    });
    $('#L0').innerHTML = h + '</div></div>';
  }
  function renderTrack() {
    var t = trackOf(S.pos.track), h = '<div class="wrap"><div><div class="kicker">Track ' + (trackIndex(t) + 1) + ' of ' + A.tracks.length + '</div><h1>' + esc(t.title) + '</h1><p class="muted">' + esc(t.blurb) + '</p></div><div class="path">';
    t.concepts.forEach(function (c, i) {
      var ok = !!A.lessons[c.id], pct = conceptPct(c.id);
      h += '<button type="button" class="node' + (c.id === S.pos.concept ? ' cur' : '') + '"' + (ok ? ' data-concept="' + c.id + '"' : ' disabled') + '><span class="dot">' + ring(pct, 56, '') + '<span>' + (i + 1) + '</span></span><span><h3>' + esc(c.title) + '</h3><p>' + (ok ? esc(c.idea || '') + (S.done[c.id] ? ' · done' : '') : 'Coming soon') + '</p></span></button>';
    });
    var first = readyIn(t)[0];
    var go1 = first ? '<p style="margin:0"><button type="button" class="btn primary" data-concept="' + first.id + '">' + (S.done[first.id] ? 'Replay: ' : 'Start: ') + esc(first.title) + '</button></p>' : '<p class="muted" style="margin:0">No lesson in this track yet. Track 1 has one.</p>';
    h = h.replace('</p></div><div class="path">', '</p>' + go1 + '</div><div class="path">');
    $('#L1').innerHTML = h + '</div></div>';
  }
  var Q = null;
  function renderConcept() {
    var t = trackOf(S.pos.track), c = conceptOf(t, S.pos.concept), L = c && A.lessons[c.id];
    if (!L) { $('#L2').innerHTML = '<div class="wrap"><p class="muted">Pick a lesson from the track.</p></div>'; return; }
    if (!Q || Q.cid !== c.id) Q = { cid: c.id, i: 0, picked: null, right: 0, res: [], done: false, first: !S.done[c.id] };
    var ex = ''; L.examples.forEach(function (e, i) { ex += '<button type="button" data-ex="' + i + '">' + esc(e.label) + '</button>'; });
    $('#L2').innerHTML = '<div class="wrap"><div><div class="kicker">Track ' + (trackIndex(t) + 1) + ' · ' + esc(t.title) + '</div><h1>' + esc(c.title) + '</h1></div>' +
      '<p class="idea">' + esc(L.idea) + '</p>' +
      '<section class="card"><h3>Try it</h3><p class="muted" style="margin:0 0 10px">' + esc(L.tryit) + '</p><textarea id="tk-in" maxlength="600" spellcheck="false" aria-label="Text to cut into tokens"></textarea><div class="exs">' + ex + '</div>' +
      '<div class="chips" id="tk-chips" aria-live="polite"></div><div class="stat" id="tk-stat"></div><div class="meter" id="tk-meter"><i></i></div><p class="note" id="tk-budget"></p><p class="note">' + esc(L.tryNote) + '</p></section>' +
      '<section class="card" id="quiz"></section>' +
      '<div class="two"><div class="card"><h3>The Agile lens</h3><p>' + esc(L.agile) + '</p></div><div class="card"><h3>In practice</h3><p>' + esc(L.tools) + '</p></div></div>' +
      '<p><button type="button" class="btn" data-act="detail">Read more, in big type</button></p></div>';
    $('#tk-in').value = tkText; tkUpdate(); renderQuiz();
  }
  function renderQuiz() {
    var box = $('#quiz'); if (!box || !Q) return;
    var L = A.lessons[Q.cid], n = L.quiz.length, dots = '';
    for (var i = 0; i < n; i++) dots += '<i class="' + (Q.res[i] === true ? 'ok' : Q.res[i] === false ? 'bad' : i === Q.i && !Q.done ? 'on' : '') + '"></i>';
    if (Q.done) {
      box.innerHTML = '<div class="done"><div class="dots">' + dots + '</div><h3>' + Q.right + ' of ' + n + ' right</h3><p class="muted" style="margin:0">' + (Q.gain ? '+' + Q.gain + ' XP. ' : '') + (Q.added ? Q.added + ' cards joined your review queue.' : 'Your review cards keep their schedule.') + '</p>' +
        '<div class="row" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button type="button" class="btn primary" data-act="detail">Read more</button><button type="button" class="btn" data-act="track">Back to the track</button><button type="button" class="btn" data-act="replay">Replay the quiz</button></div></div>';
      return;
    }
    var q = L.quiz[Q.i], o = '';
    q.opts.forEach(function (t, i) {
      var cls = Q.picked === null ? '' : i === q.a ? ' right' : i === Q.picked ? ' wrong' : '';
      o += '<button type="button" class="opt' + cls + '" data-opt="' + i + '"' + (Q.picked === null ? '' : ' disabled') + '><kbd>' + (i + 1) + '</kbd><span>' + esc(t) + '</span></button>';
    });
    box.innerHTML = '<div class="dots">' + dots + '</div><p class="q">' + esc(q.q) + '</p><div class="opts">' + o + '</div>' +
      (Q.picked === null ? '' : '<p class="why" role="status"><b>' + (Q.picked === q.a ? 'Right. ' : 'Not quite. ') + '</b>' + esc(q.why) + '</p><p style="margin:12px 0 0"><button type="button" class="btn primary" data-act="next">' + (Q.i + 1 < n ? 'Next question' : 'Finish') + '</button></p>');
  }
  function pick(i) {
    if (!Q || Q.done || Q.picked !== null) return;
    var L = A.lessons[Q.cid], q = L.quiz[Q.i], ok = i === q.a; Q.picked = i; Q.res[Q.i] = ok; if (ok) Q.right++;
    if (!S.cards[q.id]) { grade(q.id, ok ? 4 : 1); var g = ok ? 5 : 1; addXp(g); Q.gain = (Q.gain || 0) + g; Q.added = (Q.added || 0) + 1; } // only the first sight of a question makes a card and earns XP
    renderQuiz(); renderChips();
  }
  function nextQ() {
    if (!Q || Q.picked === null) return;
    var L = A.lessons[Q.cid]; Q.picked = null; Q.i++;
    if (Q.i >= L.quiz.length) { Q.done = true; if (!S.done[Q.cid]) { S.done[Q.cid] = true; addXp(20); Q.gain = (Q.gain || 0) + 20; } save(); renderAll(); }
    else renderQuiz();
  }
  function renderDetail() {
    var t = trackOf(S.pos.track), c = conceptOf(t, S.pos.concept), L = c && A.lessons[c.id];
    if (!L) { $('#L3').innerHTML = '<div class="wrap"><p class="muted">Nothing to read yet.</p></div>'; return; }
    var h = '<article class="article"><div class="size"><button type="button" class="btn" data-act="smaller" aria-label="Smaller text">A-</button><button type="button" class="btn" data-act="bigger" aria-label="Bigger text">A+</button><span class="muted" style="font-size:13px">Text size</span></div>' +
      '<div class="kicker">Track ' + (trackIndex(t) + 1) + ' · ' + esc(t.title) + '</div><h1>' + esc(c.title) + '</h1><p>' + esc(L.idea) + '</p>';
    L.read.forEach(function (s) { h += '<h2>' + esc(s.h) + '</h2><p>' + esc(s.p) + '</p>'; });
    h += '<div class="under"><h2>' + esc(L.under.h) + '</h2><p>' + esc(L.under.p) + '</p></div><div class="agile"><h2>The Agile lens</h2><p>' + esc(L.agile) + '</p><h2>In practice</h2><p>' + esc(L.tools) + '</p></div><div class="small"><b>Sources</b><br>';
    A.sources.forEach(function (s) { h += s.id + ' · <a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a>: ' + esc(s.note) + '<br>'; });
    $('#L3').innerHTML = h + 'What is checked and what is not: content/SOURCES.md</div></article>';
  }

  // ---------- chips, menu ----------
  function renderChips() {
    var n = streak(), lvl = 1 + Math.floor(S.xp / 100), min = Math.floor(today().min), goal = S.goal, due = dueIds().length;
    $('#c-streak').innerHTML = n ? '<b>' + n + '</b> day streak' : 'No streak yet';
    $('#c-level').innerHTML = ring((S.xp % 100) / 100, 22, 'lvl') + 'Level <b>' + lvl + '</b>';
    $('#c-goal').innerHTML = ring(Math.min(1, today().min / goal), 22, 'goal') + '<b>' + min + '</b> / ' + goal + ' min today';
    $('#c-review').innerHTML = 'Review' + (due ? ' <span class="badge">' + due + '</span>' : '');
  }
  var resetArmed = false, menuMsg = '';
  function renderMenu() {
    var g = ''; [10, 20, 30, 45, 60].forEach(function (m) { g += '<option value="' + m + '"' + (m === S.goal ? ' selected' : '') + '>' + m + ' minutes</option>'; });
    $('#menu').innerHTML = '<h3>Daily goal</h3><div class="row"><select id="m-goal" aria-label="Daily goal">' + g + '</select></div>' +
      '<h3>Look</h3><div class="row"><button type="button" class="btn" data-m="theme">Theme: ' + (S.theme || 'auto') + '</button></div>' +
      '<h3>Your progress</h3><p class="muted" style="margin:0;font-size:13px">Kept in this browser only. Save a copy to a file to move it or keep it safe.</p>' +
      '<div class="row"><button type="button" class="btn" data-m="save">Save to file</button><button type="button" class="btn" data-m="load">Load from file</button></div>' +
      '<div class="row"><button type="button" class="btn warn" data-m="reset">' + (resetArmed ? 'Press again to erase it all' : 'Reset progress') + '</button></div>' + (menuMsg ? '<p class="muted" style="margin:0;font-size:13px" role="status">' + esc(menuMsg) + '</p>' : '') +
      '<input type="file" id="m-file" accept="application/json,.json" hidden>';
  }
  function applyTheme() { if (S.theme) document.documentElement.setAttribute('data-theme', S.theme); else document.documentElement.removeAttribute('data-theme'); }
  function applyRead() { document.documentElement.style.setProperty('--read', S.read + 'px'); }

  // ---------- review ----------
  var R = null;
  function openReview() {
    var ids = dueIds(); R = { ids: ids, i: 0, picked: null, gain: 0, shown: ids.length };
    $('#review').hidden = false; renderReview();
  }
  function closeReview() { R = null; $('#review').hidden = true; renderChips(); }
  function renderReview() {
    var box = $('#review'); if (!R) return;
    if (R.i >= R.ids.length) {
      var next = Infinity; Object.keys(S.cards).forEach(function (id) { if (QINDEX[id] && S.cards[id].due > dayNow()) next = Math.min(next, S.cards[id].due - dayNow()); });
      box.innerHTML = '<div class="sheet"><div class="card done"><h3>' + (R.shown ? 'Review done' : 'Nothing due') + '</h3><p class="muted" style="margin:0">' + (R.shown ? '+' + R.gain + ' XP. ' : '') + (next < Infinity ? 'Next card is due in ' + next + (next === 1 ? ' day.' : ' days.') : 'Finish a lesson to make review cards.') + '</p><button type="button" class="btn primary" data-r="close">Close</button></div></div>';
      return;
    }
    var id = R.ids[R.i], q = QINDEX[id], o = '';
    q.opts.forEach(function (t, i) { var cls = R.picked === null ? '' : i === q.a ? ' right' : i === R.picked ? ' wrong' : ''; o += '<button type="button" class="opt' + cls + '" data-ropt="' + i + '"' + (R.picked === null ? '' : ' disabled') + '><kbd>' + (i + 1) + '</kbd><span>' + esc(t) + '</span></button>'; });
    var tail = '';
    if (R.picked !== null) {
      var ok = R.picked === q.a;
      tail = '<p class="why" role="status"><b>' + (ok ? 'Right. ' : 'Not quite. ') + '</b>' + esc(q.why) + '</p>' +
        (ok ? '<p class="muted" style="margin:6px 0">How did that feel?</p><div class="grades"><button type="button" class="btn" data-g="3">Hard<small>sooner</small></button><button type="button" class="btn primary" data-g="4">Good<small>as planned</small></button><button type="button" class="btn" data-g="5">Easy<small>later</small></button></div>'
          : '<p style="margin:12px 0 0"><button type="button" class="btn primary" data-g="1">Got it, next</button></p>');
    }
    box.innerHTML = '<div class="sheet"><div style="display:flex;justify-content:space-between;align-items:center"><div class="kicker">Review · card ' + (R.i + 1) + ' of ' + R.ids.length + '</div><button type="button" class="btn" data-r="close">Close</button></div><div class="card"><p class="q">' + esc(q.q) + '</p><div class="opts">' + o + '</div>' + tail + '</div></div>';
  }
  function rpick(i) { if (R && R.picked === null && R.i < R.ids.length) { R.picked = i; renderReview(); } }
  function rgrade(g) { var id = R.ids[R.i]; grade(id, g); addXp(2); R.gain += 2; R.i++; R.picked = null; renderReview(); renderChips(); }

  // ---------- wiring ----------
  function renderAll() { renderMap(); renderTrack(); renderConcept(); renderDetail(); applyLayers(); renderChips(); }
  function typing(e) { return /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || ''); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) { if (!e.target.closest('#menu')) closeMenu(); return; }
    var d = b.dataset;
    if (d.track) return go(1, d.track);
    if (d.concept) return go(2, null, d.concept);
    if (d.z) return go(+d.z);
    if (d.ex) { tkText = A.lessons.tokens.examples[+d.ex].text; var ta = $('#tk-in'); if (ta) ta.value = tkText; return tkUpdate(); }
    if (d.opt) return pick(+d.opt);
    if (d.ropt) return rpick(+d.ropt);
    if (d.g) return rgrade(+d.g);
    if (d.r === 'close') return closeReview();
    if (d.act === 'next') return nextQ();
    if (d.act === 'detail') return go(3);
    if (d.act === 'track') return go(1);
    if (d.act === 'replay') { Q = null; return renderConcept(); }
    if (d.act === 'bigger' || d.act === 'smaller') { S.read = Math.max(16, Math.min(36, S.read + (d.act === 'bigger' ? 2 : -2))); applyRead(); return save(); }
    if (d.m) return menuAct(d.m);
    if (b.id === 'z-in') return zoomBy(1);
    if (b.id === 'z-out') return zoomBy(-1);
    if (b.id === 'c-review') return openReview();
    if (b.id === 'c-menu') return toggleMenu();
  });
  function toggleMenu() { var m = $('#menu'); if (m.hidden) { renderMenu(); m.hidden = false; } else m.hidden = true; $('#c-menu').setAttribute('aria-expanded', String(!m.hidden)); }
  function closeMenu() { var m = $('#menu'); if (!m.hidden) { m.hidden = true; $('#c-menu').setAttribute('aria-expanded', 'false'); } }
  function menuAct(a) {
    menuMsg = '';
    if (a === 'theme') { S.theme = S.theme === '' ? 'light' : S.theme === 'light' ? 'dark' : ''; applyTheme(); save(); }
    else if (a === 'save') {
      var blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), x = document.createElement('a');
      x.href = URL.createObjectURL(blob); x.download = 'ai-academy-progress.json'; document.body.appendChild(x); x.click(); x.remove(); setTimeout(function () { URL.revokeObjectURL(x.href); }, 2000); menuMsg = 'Saved ai-academy-progress.json to your downloads.';
    } else if (a === 'load') { $('#m-file').click(); return; }
    else if (a === 'reset') { if (!resetArmed) { resetArmed = true; renderMenu(); setTimeout(function () { resetArmed = false; if (!$('#menu').hidden) renderMenu(); }, 4000); return; } resetArmed = false; S = fresh(); try { localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ } Q = null; applyTheme(); applyRead(); renderAll(); menuMsg = 'Progress erased.'; }
    renderMenu();
  }
  document.addEventListener('change', function (e) {
    if (e.target.id === 'm-goal') { S.goal = +e.target.value; save(); renderChips(); }
    if (e.target.id === 'm-file' && e.target.files[0]) {
      var rd = new FileReader();
      rd.onload = function () { try { var j = JSON.parse(rd.result); if (!(j && j.v === 1 && j.cards && j.days)) throw new Error('not a progress file'); S = Object.assign(fresh(), j); save(); Q = null; applyTheme(); applyRead(); renderAll(); menuMsg = 'Progress loaded.'; } catch (err) { menuMsg = 'That file is not an AI Academy progress file.'; } renderMenu(); };
      rd.readAsText(e.target.files[0]);
    }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'tk-in') { tkText = e.target.value; tkUpdate(); } });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (R) closeReview(); else closeMenu(); return; }
    if (typing(e)) return;
    if (e.key === '-' || e.key === '_') { if (!R) zoomBy(-1); }
    else if (e.key === '+' || e.key === '=') { if (!R) zoomBy(1); }
    else if (/^[1-4]$/.test(e.key)) { if (R) rpick(+e.key - 1); else if (S.pos.zoom === 2) pick(+e.key - 1); }
    else if (e.key === 'Enter' && !/^BUTTON$/.test(e.target.tagName)) { if (R && R.picked !== null && R.i < R.ids.length) { var q = QINDEX[R.ids[R.i]]; rgrade(R.picked === q.a ? 4 : 1); } else if (!R && S.pos.zoom === 2) nextQ(); }
  });
  var wheelAt = 0;
  document.addEventListener('wheel', function (e) { // Ctrl + wheel, and the pinch on a trackpad (which arrives as Ctrl + wheel)
    if (!e.ctrlKey || R) return; e.preventDefault();
    if (Date.now() - wheelAt < 450) return; wheelAt = Date.now(); zoomBy(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  var pinch = 0;
  document.addEventListener('touchstart', function (e) { pinch = e.touches.length === 2 ? Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) : 0; }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 2 || !pinch || R) return;
    var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (d / pinch > 1.3) { pinch = 0; zoomBy(1); } else if (d / pinch < 0.77) { pinch = 0; zoomBy(-1); }
  }, { passive: true });

  // minutes studied today: counts only while the page is visible and you touched it in the last minute
  var lastInput = Date.now();
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true }); });
  setInterval(function () { if (document.visibilityState === 'visible' && Date.now() - lastInput < 60000) { today().min += 5 / 60; save(); renderChips(); } }, 5000);

  applyTheme(); applyRead();
  go(S.pos.zoom);
  window.ACADEMY_DEBUG = { state: function () { return S; }, tokenize: tokenize, grade: grade, go: go, dueIds: dueIds, dayNow: dayNow };
})();
