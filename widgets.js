// AI Academy: the pictures you can poke, one per lesson. Each widget is a function (root, lesson) that draws itself inside root.
// Everything here is a toy: hand-made numbers and scripted results, never a real model, never a network call.
var WIDGETS = {};
(function () {
  'use strict';
  var A = ACADEMY;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return r.querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function exButtons(list) { var h = '<div class="exs">'; list.forEach(function (e, i) { h += '<button type="button" data-ex="' + i + '">' + esc(e.label) + '</button>'; }); return h + '</div>'; }
  function onClick(root, fn) { root.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && root.contains(b)) fn(b.dataset, b); }); }
  // state that should survive a redraw of the lesson (not saved to disk)
  var MEM = {};
  function mem(key, init) { return MEM[key] || (MEM[key] = init); }

  // ---------- the toy tokenizer (also used to count "tokens" in the context window toy) ----------
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
  WIDGETS._tokenize = tokenize;

  WIDGETS.tokens = function (root, L) {
    var BUDGET = 100, st = mem('tokens', { text: L.examples[0].text });
    root.innerHTML = '<textarea class="wtext" id="tk-in" maxlength="600" spellcheck="false" aria-label="Text to cut into tokens"></textarea>' + exButtons(L.examples) +
      '<div class="chips" id="tk-chips" aria-live="polite"></div><div class="stat" id="tk-stat"></div><div class="meter" id="tk-meter"><i></i></div><p class="note" id="tk-budget"></p>';
    function update() {
      var toks = tokenize(st.text), words = st.text.trim() ? st.text.trim().split(/\s+/).length : 0, h = '';
      toks.slice(0, 300).forEach(function (t, i) {
        h += '<span class="tok c' + (i % 6) + '" title="token ' + (i + 1) + '">' + esc(t.replace(/^ /, '·').replace(/\n/g, '↵')) + '<small>' + tid(t) + '</small></span>';
      });
      if (toks.length > 300) h += '<span class="muted"> ... and ' + (toks.length - 300) + ' more</span>';
      $('#tk-chips', root).innerHTML = h || '<span class="muted">Type something above.</span>';
      var cpt = toks.length ? (st.text.length / toks.length) : 0;
      $('#tk-stat', root).innerHTML = '<span><b>' + toks.length + '</b> tokens</span><span><b>' + words + '</b> words</span><span><b>' + st.text.length + '</b> characters</span><span><b>' + (cpt ? cpt.toFixed(1) : '0') + '</b> characters per token</span>';
      var m = $('#tk-meter', root); m.classList.toggle('over', toks.length > BUDGET); $('i', m).style.width = Math.min(100, toks.length / BUDGET * 100) + '%';
      $('#tk-budget', root).textContent = toks.length > BUDGET ? 'Over the ' + BUDGET + '-token toy budget: something has to be trimmed.' : 'Toy context budget: ' + toks.length + ' of ' + BUDGET + ' tokens used.';
    }
    $('#tk-in', root).value = st.text;
    root.addEventListener('input', function (e) { if (e.target.id === 'tk-in') { st.text = e.target.value; update(); } });
    onClick(root, function (d) { if (d.ex) { st.text = L.examples[+d.ex].text; $('#tk-in', root).value = st.text; update(); } });
    update();
  };

  // ---------- Context window: a chat that outgrows its window ----------
  WIDGETS.context = function (root, L) {
    var C = L.chat, st = mem('context', { win: 200, turns: 3, sum: false });
    var cost = function (t) { return tokenize(t).length; };
    root.innerHTML = '<div class="ctl"><label for="cx-win">Window size <b id="cx-winv"></b></label><input type="range" id="cx-win" min="50" max="260" step="10">' +
      '<label for="cx-turns">Chat length <b id="cx-turnsv"></b></label><input type="range" id="cx-turns" min="0" max="' + C.filler.length + '" step="1">' +
      '<label class="check"><input type="checkbox" id="cx-sum"> Summarise the old turns instead of dropping them</label></div>' +
      '<div class="meter" id="cx-meter"><i></i></div><p class="note" id="cx-used"></p><div class="chat" id="cx-chat" aria-live="polite"></div><p class="verdict" id="cx-verdict" role="status"></p>';
    function update() {
      // the conversation so far: the fact, some chatter, then the question
      var msgs = [{ who: 'you', text: C.fact, key: true }].concat(C.filler.slice(0, st.turns)).concat([{ who: 'you', text: C.ask }]);
      var used = cost(C.system), keep = [], i, fits = true;
      for (i = msgs.length - 1; i >= 0; i--) { // newest first: the oldest turns are the ones that fall out
        var c = cost(msgs[i].text);
        if (fits && used + c <= st.win) { used += c; keep[i] = true; } else { fits = false; keep[i] = false; }
      }
      var dropped = msgs.filter(function (m, k) { return !keep[k]; }), sumIn = false;
      if (st.sum && dropped.length) {
        var sc = cost(C.summary);
        while (used + sc > st.win) { var f = keep.indexOf(true); if (f < 0 || f === msgs.length - 1) break; keep[f] = false; used -= cost(msgs[f].text); } // make room for the summary
        if (used + sc <= st.win) { used += sc; sumIn = true; }
      }
      var h = '<div class="msg sys"><span class="who">System instructions (always sent)</span>' + esc(C.system) + '<small>' + cost(C.system) + ' tokens</small></div>';
      if (sumIn) h += '<div class="msg sum"><span class="who">Summary of the dropped turns</span>' + esc(C.summary) + '<small>' + cost(C.summary) + ' tokens</small></div>';
      msgs.forEach(function (m, k) {
        h += '<div class="msg ' + m.who + (keep[k] ? '' : ' out') + '"><span class="who">' + (m.who === 'you' ? 'You' : 'Model') + (keep[k] ? '' : ' · fell out of the window') + '</span>' + esc(m.text) + '<small>' + cost(m.text) + ' tokens</small></div>';
      });
      $('#cx-chat', root).innerHTML = h;
      var sees = keep[0] || sumIn;
      $('#cx-verdict', root).className = 'verdict ' + (sees ? 'ok' : 'bad');
      $('#cx-verdict', root).textContent = sees ? (keep[0] ? 'The codename is still in the window, so the model can answer: ' + C.answer + '.' : 'The original turn is gone, but the summary kept the codename, so the model can answer: ' + C.answer + '.')
        : 'The turn with the codename fell out. The model cannot see it, and it does not know it forgot. It may guess.';
      $('#cx-winv', root).textContent = st.win + ' tokens'; $('#cx-turnsv', root).textContent = (msgs.length) + ' messages';
      var m = $('#cx-meter', root); $('i', m).style.width = Math.min(100, used / st.win * 100) + '%';
      $('#cx-used', root).textContent = used + ' of ' + st.win + ' toy tokens in the window. ' + (dropped.length ? dropped.length + (dropped.length === 1 ? ' message' : ' messages') + ' did not fit.' : 'Everything fits.');
    }
    $('#cx-win', root).value = st.win; $('#cx-turns', root).value = st.turns; $('#cx-sum', root).checked = st.sum;
    root.addEventListener('input', function (e) {
      if (e.target.id === 'cx-win') st.win = +e.target.value; else if (e.target.id === 'cx-turns') st.turns = +e.target.value; else if (e.target.id === 'cx-sum') st.sum = e.target.checked; else return;
      update();
    });
    update();
  };

  // ---------- Next token and temperature: scores, chances, a draw ----------
  function softmax(logits, T) {
    if (T <= 0) { var top = logits.indexOf(Math.max.apply(null, logits)); return logits.map(function (x, i) { return i === top ? 1 : 0; }); } // temperature 0: always the top one
    var m = Math.max.apply(null, logits), e = logits.map(function (x) { return Math.exp((x - m) / T); }), s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (x) { return x / s; });
  }
  function draw(p, rnd) { var r = (rnd || Math.random)(), acc = 0; for (var i = 0; i < p.length; i++) { acc += p[i]; if (r < acc) return i; } return p.length - 1; }
  WIDGETS._softmax = softmax; WIDGETS._draw = draw;
  WIDGETS.nexttoken = function (root, L) {
    var st = mem('nexttoken', { ex: 0, T: 1, picks: [] });
    root.innerHTML = exButtons(L.examples) + '<p class="prompt" id="nt-prompt"></p><div class="ctl"><label for="nt-t">Temperature <b id="nt-tv"></b></label><input type="range" id="nt-t" min="0" max="2" step="0.1"></div>' +
      '<div class="bars" id="nt-bars"></div><div class="row"><button type="button" class="btn primary" data-n="1">Pick one</button><button type="button" class="btn" data-n="20">Pick 20</button><button type="button" class="btn" data-n="0">Clear</button></div>' +
      '<p class="note" id="nt-sum" role="status"></p><div class="picks" id="nt-picks"></div>';
    function update() {
      var E = L.examples[st.ex], p = softmax(E.cands.map(function (c) { return c[1]; }), st.T), tally = E.cands.map(function () { return 0; }), h = '';
      st.picks.forEach(function (i) { tally[i]++; });
      E.cands.forEach(function (c, i) {
        h += '<div class="bar"><span class="w">' + esc(c[0]) + '</span><span class="track"><i style="width:' + (p[i] * 100).toFixed(1) + '%"></i></span><span class="pc">' + (p[i] * 100 < 0.05 && p[i] > 0 ? '&lt;0.1' : (p[i] * 100).toFixed(1)) + '%</span><span class="tl">' + (tally[i] ? '×' + tally[i] : '') + '</span></div>';
      });
      $('#nt-bars', root).innerHTML = h;
      $('#nt-prompt', root).innerHTML = esc(E.text) + ' <span class="gap">' + (st.picks.length ? esc(E.cands[st.picks[st.picks.length - 1]][0]) : '?') + '</span>';
      $('#nt-tv', root).textContent = st.T.toFixed(1) + (st.T === 0 ? ' (always the top one)' : st.T < 0.7 ? ' (careful)' : st.T <= 1.2 ? ' (balanced)' : ' (adventurous)');
      var kinds = tally.filter(function (n) { return n > 0; }).length;
      $('#nt-sum', root).textContent = st.picks.length ? st.picks.length + (st.picks.length === 1 ? ' pick, ' : ' picks, ') + kinds + (kinds === 1 ? ' different word.' : ' different words.') : 'Press Pick to draw the next word from these chances.';
      $('#nt-picks', root).innerHTML = st.picks.slice(-40).map(function (i) { return '<span class="pk">' + esc(E.cands[i][0]) + '</span>'; }).join('');
    }
    $('#nt-t', root).value = st.T;
    root.addEventListener('input', function (e) { if (e.target.id === 'nt-t') { st.T = +e.target.value; update(); } });
    onClick(root, function (d) {
      if (d.ex) { st.ex = +d.ex; st.picks = []; }
      else if (d.n === '0') st.picks = [];
      else if (d.n) { var E = L.examples[st.ex], p = softmax(E.cands.map(function (c) { return c[1]; }), st.T); for (var k = 0; k < +d.n; k++) st.picks.push(draw(p)); }
      else return;
      update();
    });
    update();
  };

  // ---------- Training vs using: a tiny model you train, then freeze ----------
  function words(t) { return (t.toLowerCase().match(/[a-z']+/g) || []); }
  function train(text) { var w = words(text), m = {}; for (var i = 0; i + 1 < w.length; i++) { var a = m[w[i]] || (m[w[i]] = {}); a[w[i + 1]] = (a[w[i + 1]] || 0) + 1; } return { next: m, n: w.length, text: text }; }
  function generate(model, start, n, rnd) {
    var w = words(start).pop(), out = [];
    if (!w || !model.next[w]) return null;
    for (var i = 0; i < n && model.next[w]; i++) { var ks = Object.keys(model.next[w]), tot = 0, r, acc = 0; ks.forEach(function (k) { tot += model.next[w][k]; }); r = (rnd || Math.random)() * tot; for (var j = 0; j < ks.length; j++) { acc += model.next[w][ks[j]]; if (r < acc) break; } w = ks[Math.min(j, ks.length - 1)]; out.push(w); }
    return out;
  }
  WIDGETS._train = train; WIDGETS._generate = generate;
  WIDGETS.training = function (root, L) {
    var st = mem('training', { text: L.examples[0].text, model: null, start: L.starts[0], out: '', uses: 0 });
    root.innerHTML = '<div class="phase"><h4>1 · Train <span class="tag" id="tr-state"></span></h4><textarea class="wtext" id="tr-text" maxlength="900" spellcheck="false" aria-label="Training text"></textarea>' + exButtons(L.examples) +
      '<div class="row"><button type="button" class="btn primary" data-a="train">Train on this text</button></div><div class="weights" id="tr-weights"></div></div>' +
      '<div class="phase"><h4>2 · Use <span class="tag">weights frozen</span></h4><div class="row"><label for="tr-start">Start with the word</label><input type="text" id="tr-start" maxlength="24" autocomplete="off" spellcheck="false">' +
      '<button type="button" class="btn primary" data-a="use">Continue the sentence</button></div><div class="exs" id="tr-starts"></div><p class="prompt" id="tr-out" role="status"></p><p class="note" id="tr-note"></p></div>';
    function update() {
      var M = st.model, stale = M && M.text !== st.text;
      $('#tr-state', root).textContent = !M ? 'not trained yet' : stale ? 'text changed since training' : 'trained on ' + M.n + ' words';
      $('#tr-state', root).className = 'tag' + (M && !stale ? ' go' : '');
      var h = '';
      if (M) {
        var rows = Object.keys(M.next).map(function (k) { var tot = 0; Object.keys(M.next[k]).forEach(function (x) { tot += M.next[k][x]; }); return [k, tot]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
        h = '<p class="note">What it learned: for each word, how often each next word followed. The top rows of ' + Object.keys(M.next).length + ':</p><table class="mini"><tbody>';
        rows.forEach(function (r) { var nx = M.next[r[0]]; h += '<tr><th scope="row">after "' + esc(r[0]) + '"</th><td>' + Object.keys(nx).sort(function (a, b) { return nx[b] - nx[a]; }).slice(0, 4).map(function (k) { return esc(k) + ' ×' + nx[k]; }).join(', ') + '</td></tr>'; });
        h += '</tbody></table>';
      } else h = '<p class="note">Nothing learned yet. Press Train.</p>';
      $('#tr-weights', root).innerHTML = h;
      $('#tr-out', root).innerHTML = st.out;
      $('#tr-note', root).textContent = !M ? 'An untrained model has nothing to say.' : 'Used ' + st.uses + (st.uses === 1 ? ' time' : ' times') + '. Changes to its weights from using it: 0.' + (stale ? ' You changed the text above, but the model has not seen that: it only knows what it was trained on.' : '');
      $('#tr-starts', root).innerHTML = L.starts.map(function (s) { return '<button type="button" data-start="' + esc(s) + '">' + esc(s) + '</button>'; }).join('');
    }
    $('#tr-text', root).value = st.text; $('#tr-start', root).value = st.start;
    root.addEventListener('input', function (e) { if (e.target.id === 'tr-text') { st.text = e.target.value; update(); } else if (e.target.id === 'tr-start') st.start = e.target.value; });
    function use() {
      if (!st.model) { st.out = '<span class="muted">Train it first.</span>'; return; }
      var g = generate(st.model, st.start, 12); st.uses++;
      st.out = g ? '<b>' + esc(words(st.start).pop()) + '</b> ' + esc(g.join(' ')) + ' ...' : '<span class="muted">The word "' + esc(st.start.trim() || '(empty)') + '" was not in its training text, so this toy has nothing to go on. (A real model would not stop: it would produce something plausible anyway. See the next lesson.)</span>';
    }
    root.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'tr-start') { e.preventDefault(); e.stopPropagation(); use(); update(); } });
    onClick(root, function (d) {
      if (d.ex) { st.text = L.examples[+d.ex].text; $('#tr-text', root).value = st.text; }
      else if (d.a === 'train') { st.model = train(st.text); st.uses = 0; st.out = ''; }
      else if (d.start) { st.start = d.start; $('#tr-start', root).value = d.start; use(); }
      else if (d.a === 'use') use();
      else return;
      update();
    });
    update();
  };

  // ---------- Sure and wrong: same confident voice, known or not ----------
  WIDGETS.wrong = function (root, L) {
    var st = mem('wrong', { q: 0, mode: 'always', checked: false, asked: false });
    var modes = [['always', 'Must always answer'], ['idk', 'Allowed to say "I do not know"'], ['doc', 'Given the team page to read']];
    root.innerHTML = '<div class="doc"><span class="who">What this toy "learned" in training (a made-up team page; in the first two modes it is not in the window)</span><span id="wr-doc"></span></div>' +
      '<fieldset class="seg" id="wr-modes"><legend>How it is set up</legend>' + modes.map(function (m) { return '<label><input type="radio" name="wr-mode" value="' + m[0] + '"> ' + esc(m[1]) + '</label>'; }).join('') + '</fieldset>' +
      '<p class="note" style="margin-top:12px">Ask it something:</p><div class="exs" id="wr-qs"></div><div class="chat" id="wr-chat" aria-live="polite"></div>' +
      '<div class="row"><button type="button" class="btn primary" data-a="check" id="wr-check">Check it against the page</button></div><p class="verdict" id="wr-verdict" role="status"></p>' +
      '<div id="wr-score"></div>';
    function answer(q, mode) { // returns [text, kind]: kind is right, invented or abstain
      if (q.known) return [q.truth, 'right'];
      if (mode === 'always') return [q.guess, 'invented'];
      if (mode === 'idk') return ['I do not know. Nothing I have covers that.', 'abstain'];
      return ['The page does not say.', 'abstain'];
    }
    function update() {
      $('#wr-doc', root).textContent = L.doc;
      $$('input[name="wr-mode"]', root).forEach(function (r) { r.checked = r.value === st.mode; });
      $('#wr-qs', root).innerHTML = L.questions.map(function (q, i) { return '<button type="button" data-q="' + i + '"' + (st.asked && i === st.q ? ' class="on"' : '') + '>' + esc(q.q) + '</button>'; }).join('');
      var q = L.questions[st.q], a = answer(q, st.mode);
      $('#wr-chat', root).innerHTML = st.asked ? '<div class="msg you"><span class="who">You</span>' + esc(q.q) + '</div><div class="msg model"><span class="who">Toy model</span>' + esc(a[0]) + '</div>' : '<p class="muted">Pick a question. Notice the tone of each answer before you check it.</p>';
      $('#wr-check', root).hidden = !st.asked || st.checked;
      var v = $('#wr-verdict', root); v.hidden = !(st.asked && st.checked);
      v.className = 'verdict ' + (a[1] === 'invented' ? 'bad' : 'ok');
      v.textContent = a[1] === 'right' ? 'Correct: the page says so.' : a[1] === 'invented' ? 'Invented. The page says nothing about this. The answer only has the right shape, and it sounded exactly as sure as the true ones.' : 'Honest: the page really does not say, and it did not make something up.';
      // the scoreboard: why "always answer" is tempting
      var r = { always: [0, 0, 0], idk: [0, 0, 0], doc: [0, 0, 0] }; // right, invented, abstain
      L.questions.forEach(function (qq) { ['always', 'idk', 'doc'].forEach(function (m) { var k = answer(qq, m)[1]; r[m][k === 'right' ? 0 : k === 'invented' ? 1 : 2]++; }); });
      var h = '<div class="scroll"><table class="mini"><caption>All ' + L.questions.length + ' questions, scored two ways</caption><thead><tr><th scope="col">Set-up</th><th scope="col">Right</th><th scope="col">Invented</th><th scope="col">"Do not know"</th><th scope="col">Score if a wrong answer costs nothing</th><th scope="col">Score if a wrong answer costs a point</th></tr></thead><tbody>';
      modes.forEach(function (m) { var x = r[m[0]]; h += '<tr' + (m[0] === st.mode ? ' class="on"' : '') + '><th scope="row">' + esc(m[1]) + '</th><td>' + x[0] + '</td><td>' + x[1] + '</td><td>' + x[2] + '</td><td>' + x[0] + '</td><td>' + (x[0] - x[1]) + '</td></tr>'; });
      $('#wr-score', root).innerHTML = h + '</tbody></table></div><p class="note">When a wrong answer costs nothing, bluffing never scores below honesty, and a lucky guess would score above it. That is the incentive the lesson talks about.</p>';
    }
    root.addEventListener('change', function (e) { if (e.target.name === 'wr-mode') { st.mode = e.target.value; st.checked = false; update(); } });
    onClick(root, function (d) {
      if (d.q) { st.q = +d.q; st.asked = true; st.checked = false; }
      else if (d.a === 'check') st.checked = true;
      else return;
      update();
    });
    update();
  };
})();
