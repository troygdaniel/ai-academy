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

  // ---------- the prompt rubric and the real-data check (used by the sandbox and by two lessons) ----------
  // Plain pattern matching. It finds whether a part seems to be present, never whether it is good. No model, no network.
  var RUBRIC = [
    { id: 'role', label: 'Role', hint: 'Say who the model should be: "You are a ... writing for ...".',
      re: /\b(you are|you're|act as|acting as|take the role|in the role of|your role|as an? (?:experienced |senior |expert |sceptical |skeptical |careful )?[a-z]+ (?:coach|manager|engineer|reviewer|analyst|editor|writer|tester|developer|master|owner|teacher|lead))\b/i },
    { id: 'task', label: 'Task', hint: 'Start a sentence with one clear verb: summarise, list, draft, compare, review.',
      re: /(?:^|[.!?:\n]\s*|\bplease\s+|\byour task is to\s+|\bi need you to\s+|\bthen\s+)(write|draft|summari[sz]e|list|explain|review|compare|classify|extract|rewrite|translate|create|generate|analy[sz]e|plan|suggest|identify|describe|check|find|turn|convert|give|propose|outline|rank|sort|group|estimate|critique|answer|label|tag|produce)\b/i },
    { id: 'context', label: 'Context', hint: 'Say who it is for and why: "This is for ... because ...".',
      re: /\b(context|background|audience|the reader|situation|because|so that|the goal|purpose|we are|our team|this is for|it is for|is for an?|for an? [a-z]+ who|who (?:missed|was not|were not|has not|have not))\b/i },
    { id: 'format', label: 'Format', hint: 'Name the shape: bullets, a table with these columns, JSON with these keys, a template.',
      re: /\b(table|bullets?|bullet points?|numbered list|list of|json|markdown|headings?|columns?|paragraphs?|format|template|csv|sections?|one line|one sentence)\b/i },
    { id: 'constraints', label: 'Constraints', hint: 'Add limits and what to do when unsure: "under 80 words", "do not ...", "if it is not in the notes, say so".',
      re: /\b(no more than|at most|at least|under \d+|fewer than|maximum|limit|only|do not|don't|never|avoid|must|exactly|keep it|\d+\s+(?:words?|sentences?|bullets?|lines?|items?|points?|paragraphs?)|if you (?:are not sure|do not know|don't know)|say so|plain (?:english|language))\b/i },
    { id: 'example', label: 'Example', hint: 'Show one or two samples of what good looks like.',
      re: /\b(for example|e\.g\.|examples?\b[^.\n]{0,24}:|like this|such as|here is (?:an|one) example)|<examples?>|\binput:[\s\S]*\boutput:/i }
  ];
  function scorePrompt(text) {
    var parts = RUBRIC.map(function (r) { var m = r.re.exec(text); return { id: r.id, label: r.label, ok: !!m, found: m ? m[0].replace(/^[\s.!?:]+/, '').trim() : '', hint: r.hint }; });
    return { parts: parts, n: parts.filter(function (p) { return p.ok; }).length, words: (text.trim().match(/\S+/g) || []).length };
  }
  var NOT_NAMES = ('Scrum Master Agile Coach Product Owner Project Manager Team Sprint Review Retrospective Planning Definition Done Ready Daily Standup Kanban Board Release Train User Story Stories Acceptance Criteria Help Needed Changes Context Format Example Constraints Role Task Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December The This That These Those You Your Please Summarise Summarize Write Draft List Keep Use Give Not Do If It We Our An And For With Then When Each North South East West New Chief Senior Junior Vice President Head Director Service Desk Change Request Risk Register Steering Committee Business Sponsor Quality Assurance Machine Learning Artificial Intelligence Large Language Model Models Mr Mrs Ms Miss Mx Dr Prof').split(' ');
  var STOP = {}; NOT_NAMES.forEach(function (w) { STOP[w] = 1; });
  function scanData(text, names) {
    var out = [], seen = {}, m, re;
    function add(kind, match, msg) { var k = kind + '|' + match.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push({ kind: kind, match: match, msg: msg }); } }
    re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g; while ((m = re.exec(text))) add('email', m[0], 'looks like an email address');
    re = /\d(?:[ -]?\d){6,}/g; while ((m = re.exec(text))) add('digits', m[0], 'a long run of digits: an account, card, phone or ID number?');
    (names || []).forEach(function (n) {
      n = n.trim(); if (n.length < 2) return;
      var r = new RegExp('(^|[^A-Za-z])(' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Za-z])', 'i'), mm = r.exec(text);
      if (mm) add('listed', mm[2], 'a name on your watch list');
    });
    re = /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g; while ((m = re.exec(text))) add('name', m[0], 'a title and a name');
    re = /\b([A-Z][a-z]{1,})\s+([A-Z][a-z]{1,})\b/g;
    while ((m = re.exec(text))) {
      var before = text.slice(0, m.index).replace(/[\s"'(\[]+$/, ''), startOfSentence = before === '' || /[.!?:\n]$/.test(before) || /\n\s*$/.test(text.slice(0, m.index));
      var third = /^\s+[A-Z][a-z]+/.test(text.slice(m.index + m[0].length));
      if (startOfSentence && third && !STOP[m[2]]) { re.lastIndex = m.index + m[1].length; continue; } // "Ask Priya Natarajan": the first word is only capitalised because it starts the sentence
      if (STOP[m[1]] && STOP[m[2]]) continue;                       // "Scrum Master", "Help Needed"
      if (startOfSentence && (STOP[m[1]] || STOP[m[2]])) { re.lastIndex = m.index + m[1].length; continue; } // "Summarise Monday ..." is not a name
      if (STOP[m[2]]) continue;                                     // "Heron Team"
      if (STOP[m[1]]) { re.lastIndex = m.index + m[1].length; continue; } // "The Jo Sample": try again from the second word
      add('maybe', m[0], 'two capitalised words: might be a person or a company');
    }
    return out;
  }
  WIDGETS._score = scorePrompt; WIDGETS._scan = scanData;
  function rubricHtml(sc, compact) {
    var h = '<ul class="rubric">';
    sc.parts.forEach(function (p) { h += '<li class="' + (p.ok ? 'ok' : 'no') + '"><b>' + (p.ok ? '✓' : '○') + ' ' + p.label + '</b>' + (compact ? '' : '<span>' + (p.ok ? 'found: "' + esc(p.found.slice(0, 40)) + '"' : esc(p.hint)) + '</span>') + '</li>'; });
    return h + '</ul>';
  }

  // opts.full: the big sandbox sheet (adds the names watch list). In a lesson it is the same thing, smaller.
  WIDGETS.sandbox = function (root, L, api) {
    var st = L.full ? { text: L.text !== undefined ? L.text : '' } : mem('sandbox', { text: L.examples[0].text });
    var names = api && api.names ? api.names() : [];
    root.innerHTML = '<label class="lab" for="sb-text">Your prompt</label><textarea class="wtext tall" id="sb-text" maxlength="4000" spellcheck="false" placeholder="Write or paste a prompt. Use made-up data."></textarea>' + exButtons(L.examples) +
      '<div class="sbgrid"><div><h4 id="sb-score"></h4><div id="sb-rubric"></div></div><div><h4>Real data check</h4><div id="sb-warn" role="status"></div>' +
      '<label class="lab" for="sb-names">Names to watch for (people, clients, projects), separated by commas</label><input type="text" id="sb-names" autocomplete="off" spellcheck="false" placeholder="for example: Heron, Jo Sample"><p class="note">Kept in this browser only, and left out of the Save file.</p></div></div>' +
      (L.full ? '<p class="note">This sandbox never calls a model. It scores the prompt by pattern matching, in your browser. A high score means the parts seem to be present, not that the prompt is right. The prompt is not saved. The names you list are kept in this browser only, and are left out of the Save file.</p>' : '<div class="row"><button type="button" class="btn" data-a="full">Open the full sandbox</button></div>');
    function update() {
      var sc = scorePrompt(st.text), w = scanData(st.text, names), h;
      $('#sb-score', root).textContent = 'Rubric: ' + sc.n + ' of 6 parts found';
      $('#sb-rubric', root).innerHTML = rubricHtml(sc) + (sc.words && sc.words < 6 ? '<p class="note">Very short. Fine for a tiny job; otherwise the model will fill the gaps with guesses.</p>' : '');
      if (!st.text.trim()) h = '<p class="muted" style="margin:0">Nothing to check yet.</p>';
      else if (!w.length) h = '<p class="verdict ok">No obvious real data found. This is a simple pattern check, so still read it through yourself.</p>';
      else { h = '<p class="verdict bad" id="sb-alarm">' + w.length + (w.length === 1 ? ' thing looks' : ' things look') + ' like real data. Replace with made-up values before using this prompt anywhere.</p><ul class="warns">'; w.forEach(function (x) { h += '<li><code>' + esc(x.match) + '</code> ' + esc(x.msg) + '</li>'; }); h += '</ul>'; }
      $('#sb-warn', root).innerHTML = h;
    }
    $('#sb-text', root).value = st.text; $('#sb-names', root).value = names.join(', ');
    root.addEventListener('input', function (e) {
      if (e.target.id === 'sb-text') st.text = e.target.value;
      else if (e.target.id === 'sb-names') { names = e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); if (api && api.setNames) api.setNames(names); }
      else return;
      update();
    });
    onClick(root, function (d) {
      if (d.ex) { st.text = L.examples[+d.ex].text; $('#sb-text', root).value = st.text; update(); }
      else if (d.a === 'full' && api && api.open) api.open(st.text);
    });
    update();
  };

  // ---------- The parts of a prompt: switch parts on and off ----------
  WIDGETS.parts = function (root, L, api) {
    var st = mem('parts', { on: { task: true } });
    root.innerHTML = '<div class="toggles" id="pt-toggles"></div><pre class="pre" id="pt-prompt" aria-live="polite"></pre><h4 id="pt-score"></h4><div id="pt-rubric"></div><ul class="warns" id="pt-miss"></ul><div class="row"><button type="button" class="btn" data-a="full">Open this prompt in the sandbox</button></div>';
    function text() { return L.parts.filter(function (p) { return st.on[p.id]; }).map(function (p) { return p.text; }).concat([L.material]).join('\n\n'); }
    function update() {
      $('#pt-toggles', root).innerHTML = L.parts.map(function (p) { return '<label class="check"><input type="checkbox" data-part="' + p.id + '"' + (st.on[p.id] ? ' checked' : '') + '> ' + esc(p.label) + '</label>'; }).join('');
      var t = text(), sc = scorePrompt(t);
      $('#pt-prompt', root).textContent = t;
      $('#pt-score', root).textContent = 'Rubric: ' + sc.n + ' of 6 parts found';
      $('#pt-rubric', root).innerHTML = rubricHtml(sc, true);
      $('#pt-miss', root).innerHTML = L.parts.filter(function (p) { return !st.on[p.id]; }).map(function (p) { return '<li>' + esc(p.without) + '</li>'; }).join('') || '<li>All six parts are in. Now it is a brief.</li>';
    }
    root.addEventListener('change', function (e) { var id = e.target.dataset.part; if (id) { st.on[id] = e.target.checked; update(); var again = $('[data-part="' + id + '"]', root); if (again) again.focus(); } });
    onClick(root, function (d) { if (d.a === 'full' && api && api.open) api.open(text()); });
    update();
  };

  // ---------- Show, do not tell: adjectives versus examples ----------
  WIDGETS.narrow = function (root, L) {
    var st = mem('narrow', { tell: {}, show: {} });
    root.innerHTML = '<p class="prompt" style="font-size:16px">' + esc(L.task) + '</p><div class="sbgrid"><fieldset class="seg"><legend>Tell: add adjectives</legend><div id="nw-tells"></div></fieldset><fieldset class="seg"><legend>Show: add examples</legend><div id="nw-shows"></div></fieldset></div>' +
      '<h4 id="nw-count" role="status" style="margin:14px 0 6px"></h4><ul class="cands" id="nw-cands"></ul><p class="note" id="nw-note"></p>';
    function update() {
      var dead = {}, why = {}, nShow = 0;
      L.tells.forEach(function (t, i) { if (st.tell[i]) t.kills.forEach(function (k) { dead[k] = 1; why[k] = why[k] || t.label; }); });
      L.shows.forEach(function (s, i) { if (st.show[i]) { nShow++; s.kills.forEach(function (k) { dead[k] = 1; why[k] = s.label; }); } });
      if (nShow === L.shows.length) L.bothKill.forEach(function (k) { dead[k] = 1; why[k] = 'the two examples together'; });
      $('#nw-tells', root).innerHTML = L.tells.map(function (t, i) { return '<label><input type="checkbox" data-tell="' + i + '"' + (st.tell[i] ? ' checked' : '') + '> ' + esc(t.label) + '</label>'; }).join('');
      $('#nw-shows', root).innerHTML = L.shows.map(function (s, i) { return '<label><input type="checkbox" data-show="' + i + '"' + (st.show[i] ? ' checked' : '') + '> <span><b>' + esc(s.label) + '</b><br><span class="muted" style="font-size:13px">' + esc(s.text) + '</span></span></label>'; }).join('');
      var left = L.cands.filter(function (c) { return !dead[c.id]; }).length;
      $('#nw-count', root).textContent = left + ' of ' + L.cands.length + (left === 1 ? ' readings still fits' : ' readings still fit');
      $('#nw-cands', root).innerHTML = L.cands.map(function (c) { return '<li class="' + (dead[c.id] ? 'out' : '') + '"><span>' + esc(c.text) + '</span>' + (dead[c.id] ? '<small>ruled out by ' + esc(why[c.id]) + '</small>' : '') + '</li>'; }).join('');
      $('#nw-note', root).textContent = left === 1 ? 'One reading left. Two varied examples did what three adjectives could not.' : nShow === 1 ? 'One example fixed the layout. But is "(medium)" part of the pattern, or just what that one ticket happened to be? The model cannot tell. Add the second example.' : nShow === 0 && left < L.cands.length ? 'Adjectives trimmed a little. Most readings are still "short" and "professional".' : nShow === 0 ? 'Every one of these is a fair reading of the request.' : '';
    }
    root.addEventListener('change', function (e) {
      var d = e.target.dataset, sel;
      if (d.tell !== undefined) { st.tell[d.tell] = e.target.checked; sel = '[data-tell="' + d.tell + '"]'; } else if (d.show !== undefined) { st.show[d.show] = e.target.checked; sel = '[data-show="' + d.show + '"]'; } else return;
      update(); $(sel, root).focus();
    });
    update();
  };

  // ---------- Give it a role: one question, four voices ----------
  WIDGETS.rolepick = function (root, L) {
    var st = mem('rolepick', { i: 0 });
    root.innerHTML = '<div class="exs" id="rp-tabs"></div><div class="chat" aria-live="polite" id="rp-chat"></div><p class="note" id="rp-shift"></p><p class="note">Look at what did not change: the idea of a shortcut now and a cost later is the same in all four. The role moved the voice, not the facts.</p>';
    function update() {
      var v = L.variants[st.i];
      $('#rp-tabs', root).innerHTML = L.variants.map(function (x, i) { return '<button type="button" data-v="' + i + '"' + (i === st.i ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(x.label) + '</button>'; }).join('');
      $('#rp-chat', root).innerHTML = '<div class="msg you"><span class="who">Prompt</span>' + (st.i ? esc(v.who) + ' ' : '') + esc(L.question) + '</div><div class="msg model"><span class="who">Answer (written by hand)</span>' + esc(v.text) + '</div>';
      $('#rp-shift', root).textContent = 'What the role did: ' + v.shift;
    }
    onClick(root, function (d) { if (d.v) { st.i = +d.v; update(); $('[data-v="' + st.i + '"]', root).focus(); } });
    update();
  };

  // ---------- Ask for a format: same content, five shapes ----------
  WIDGETS.formatpick = function (root, L) {
    var st = mem('formatpick', { i: 0 });
    root.innerHTML = '<div class="exs" id="fp-tabs"></div><p class="prompt" style="font-size:15px" id="fp-ask"></p><div id="fp-out" aria-live="polite"></div><ul class="rubric" id="fp-checks"></ul>';
    function update() {
      var f = L.formats[st.i], out, parsed = null, err = '';
      $('#fp-tabs', root).innerHTML = L.formats.map(function (x, i) { return '<button type="button" data-f="' + i + '"' + (i === st.i ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(x.label) + '</button>'; }).join('');
      $('#fp-ask', root).textContent = 'You ask: ' + f.ask;
      if (f.table) { out = '<div class="scroll"><table class="mini"><thead><tr>' + f.table[0].map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + f.table.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
      else out = '<pre class="pre">' + esc(f.out) + '</pre>';
      $('#fp-out', root).innerHTML = out;
      if (!f.table) { try { parsed = JSON.parse(f.out); } catch (e) { err = e.message; } }
      var isJson = /^json/.test(f.id), ok = parsed !== null;
      $('#fp-checks', root).innerHTML = [[f.skim, 'A person can skim it in five seconds'], [f.compare, 'A person can compare the risks side by side'], [ok, 'A program can read it' + (ok ? ': parsed ' + parsed.length + ' items' : isJson ? ': the parser stopped (' + esc(err.slice(0, 60)) + ')' : '')]]
        .map(function (c) { return '<li class="' + (c[0] ? 'ok' : 'no') + '"><b>' + (c[0] ? '✓' : '✗') + '</b><span>' + c[1] + '</span></li>'; }).join('');
    }
    onClick(root, function (d) { if (d.f) { st.i = +d.f; update(); $('[data-f="' + st.i + '"]', root).focus(); } });
    update();
  };

  // ---------- Iterate like a sprint: one change, rerun the test cases ----------
  WIDGETS.iterate = function (root, L) {
    var st = mem('iterate', { on: {}, log: [] });
    function passes(on) { return L.cases.map(function (c) { var broke = c.breaks.some(function (b) { return on[b]; }); return { ok: !broke && c.need.every(function (n) { return on[n]; }), broke: broke }; }); }
    function count(on) { return passes(on).filter(function (p) { return p.ok; }).length; }
    root.innerHTML = '<fieldset class="seg"><legend>Changes you can make</legend><div id="it-fixes"></div></fieldset><pre class="pre" id="it-prompt"></pre><h4 id="it-count" role="status" style="margin:12px 0 6px"></h4><ul class="rubric" id="it-cases"></ul><ol class="log" id="it-log" aria-label="Version history"></ol>';
    function update() {
      $('#it-fixes', root).innerHTML = L.fixes.map(function (f) { return '<label><input type="checkbox" data-fix="' + f.id + '"' + (st.on[f.id] ? ' checked' : '') + '> ' + esc(f.label) + '</label>'; }).join('');
      $('#it-prompt', root).textContent = [L.base].concat(L.fixes.filter(function (f) { return st.on[f.id]; }).map(function (f) { return f.add; })).join(' ');
      var ps = passes(st.on), n = count(st.on);
      $('#it-count', root).textContent = 'Version ' + (st.log.length + 1) + ': ' + n + ' of ' + L.cases.length + ' test cases pass';
      $('#it-cases', root).innerHTML = L.cases.map(function (c, i) { return '<li class="' + (ps[i].ok ? 'ok' : 'no') + '"><b>' + (ps[i].ok ? '✓' : '✗') + '</b><span>' + esc(c.label) + (ps[i].broke ? ' <em>' + esc(c.broke) + '</em>' : '') + '</span></li>'; }).join('');
      $('#it-log', root).innerHTML = st.log.slice(-6).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
    }
    root.addEventListener('change', function (e) {
      var id = e.target.dataset.fix; if (!id) return;
      var before = count(st.on), f = L.fixes.filter(function (x) { return x.id === id; })[0]; st.on[id] = e.target.checked;
      var after = count(st.on);
      st.log.push('v' + (st.log.length + 2) + ': ' + (e.target.checked ? 'added' : 'removed') + ' "' + f.label + '": ' + before + ' → ' + after + ' passing' + (after < before ? '. A regression: roll it back.' : after > before ? '. Keep it.' : '. No change.'));
      update(); $('[data-fix="' + id + '"]', root).focus();
    });
    update();
  };
})();
