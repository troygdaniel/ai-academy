// AI Academy: more pictures you can poke, for the tracks added after the first three. Same rules as widgets.js:
// every one is a toy with hand-made numbers and scripted results, never a real model, never a network call.
// widgets.js must load first (it defines WIDGETS); this file adds to it.
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return r.querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function onClick(root, fn) { root.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && root.contains(b)) fn(b.dataset, b); }); }
  // state that should survive a redraw of the lesson (not saved to disk)
  var MEM = {};
  function mem(key, init) { return MEM[key] || (MEM[key] = init); }
  // ---------- aidlc2 ----------
WIDGETS.plandials = function (root, L) {
  var st = mem('plandials', { job: L.jobs[0].id, plan: 'feature', depth: 1, tests: 1 });
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  var LEVEL = { best: 'Right size.', ok: 'Workable.', light: 'Too light.', heavy: 'Heavier than needed.' };
  function radios(name, attr, items, legend, first) {
    return '<fieldset class="seg"' + (first ? '' : ' style="margin-top:10px"') + '><legend>' + esc(legend) + '</legend>' + items.map(function (x, i) {
      var v = x.id !== undefined ? x.id : i;
      return '<label><input type="radio" name="' + name + '" data-' + attr + '="' + v + '"> ' + esc(x.label) + '</label>';
    }).join('') + '</fieldset>';
  }
  root.innerHTML = '<p class="note" style="margin:0 0 6px">Pick a job:</p><div class="exs" id="pd-jobs">' +
    L.jobs.map(function (j, i) { return '<button type="button" data-job="' + j.id + '" aria-pressed="false">' + esc(j.label) + '</button>'; }).join('') + '</div>' +
    '<p class="prompt" id="pd-job" style="font-size:16px"></p>' +
    radios('pd-plan', 'plan', L.plans, 'Plan: which stages run', true) +
    '<div class="stat" id="pd-stat"></div><div class="meter" id="pd-meter"><i></i></div>' +
    '<p class="note" id="pd-keeps"></p><p class="verdict" id="pd-fit" role="status"></p>' +
    radios('pd-depth', 'depth', L.depths, 'Depth: how detailed each stage\'s documents are') +
    radios('pd-tests', 'tests', L.tests, 'Test strategy: how many tests are written') +
    '<p class="note" id="pd-docs"></p><p class="verdict" id="pd-dials" role="status"></p>';
  function update() {
    var job = byId(L.jobs, st.job), plan = byId(L.plans, st.plan), f = job.fit[plan.id], bad, issues = [];
    $$('#pd-jobs button', root).forEach(function (b) { var on = b.dataset.job === st.job; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    $$('input[name="pd-plan"]', root).forEach(function (r) { r.checked = r.dataset.plan === st.plan; });
    $$('input[name="pd-depth"]', root).forEach(function (r) { r.checked = +r.dataset.depth === st.depth; });
    $$('input[name="pd-tests"]', root).forEach(function (r) { r.checked = +r.dataset.tests === st.tests; });
    $('#pd-job', root).textContent = job.text;
    $('#pd-stat', root).innerHTML = '<span><b>' + plan.stages + '</b> of 30 stages after setup</span><span>up to <b>' + plan.stages + '</b> approval gates</span>';
    var m = $('#pd-meter', root); $('i', m).style.width = Math.round(plan.stages / 30 * 100) + '%'; m.classList.toggle('over', f[0] === 'heavy');
    $('#pd-keeps', root).textContent = 'Keeps: ' + plan.keeps + ' Leaves out: ' + plan.skips;
    $('#pd-docs', root).textContent = 'With these dials, each document is ' + L.depths[st.depth].docs + ', and the test set is ' + L.tests[st.tests].what + '.';
    bad = f[0] === 'light' || f[0] === 'heavy';
    $('#pd-fit', root).className = 'verdict ' + (bad ? 'bad' : 'ok');
    $('#pd-fit', root).textContent = LEVEL[f[0]] + ' ' + f[1];
    if (st.depth < job.d[0] || st.tests < job.t[0]) issues.push('Thinner than this job needs. ' + job.thin);
    if (st.depth > job.d[1] || st.tests > job.t[1]) issues.push('More than this job needs. ' + job.heavy);
    $('#pd-dials', root).className = 'verdict ' + (issues.length ? 'bad' : 'ok');
    $('#pd-dials', root).textContent = issues.length ? issues.join(' ') : 'Depth and tests suit this job.';
  }
  root.addEventListener('change', function (e) {
    var d = e.target.dataset;
    if (d.plan) st.plan = d.plan; else if (d.depth !== undefined) st.depth = +d.depth; else if (d.tests !== undefined) st.tests = +d.tests; else return;
    update();
  });
  onClick(root, function (d) { if (!d.job) return; st.job = d.job; update(); $('[data-job="' + st.job + '"]', root).focus(); });
  update();
};

WIDGETS.ruleloop = function (root, L) {
  var st = mem('ruleloop', { on: true, pick: null, phase: 'idle', msg: '', cls: '', team: [], project: [], audit: [] });
  function cor(id) { return L.corrections.filter(function (c) { return c.id === id; })[0]; }
  function stored(line) { return line + ' (learned today)'; }
  function kept(line) { return st.team.concat(st.project).indexOf(stored(line)) >= 0; }
  function logRow(file, how) { st.audit.push('RULE_LEARNED, ' + file + ', ' + how); }
  root.innerHTML = '<label class="check"><input type="checkbox" id="rl-on"> Learnings are on (a lighter plan can switch them off)</label>' +
    '<p class="note" style="margin:10px 0 0">You are in the middle of a stage. Make a correction:</p><div class="exs" id="rl-pick">' +
    L.corrections.map(function (c) { return '<button type="button" data-c="' + c.id + '" aria-pressed="false">' + esc(c.label) + '</button>'; }).join('') + '</div>' +
    '<p class="prompt" id="rl-text" style="font-size:16px"></p><div id="rl-ask"></div><p class="verdict" id="rl-msg" role="status" hidden></p>' +
    '<div class="two" style="margin-top:12px"><div class="doc"><span class="who">org.md</span><span id="rl-org"></span></div><div class="doc"><span class="who">team.md</span><span id="rl-team"></span></div><div class="doc"><span class="who">project.md</span><span id="rl-project"></span></div></div>' +
    '<div class="doc"><span class="who">Audit trail (only ever grows)</span><span id="rl-audit"></span></div>' +
    '<p class="note" id="rl-next" role="status"></p><div class="row"><button type="button" class="btn" data-a="reset">Reset the files</button></div>';
  function list(arr, empty) { return arr.length ? arr.map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') : '<span class="muted">' + empty + '</span>'; }
  function say(cls, msg) { st.cls = cls; st.msg = msg; }
  function begin(id) {
    var c = cor(id); st.pick = id; st.phase = 'done';
    if (!st.on) { say('', 'Learnings are off, so nothing is asked and nothing is kept. The next run starts from the same rules.'); return; }
    if (c.kind === 'oneoff') { say('', 'Not asked. A one-off fix, such as a typo or a wrong name, would not hold next time, so the loop does not offer it. Nothing is kept.'); return; }
    if (c.kind === 'shortcut') {
      if (kept(c.line)) { say('', 'That is already in the rules, so there is nothing new to keep.'); return; }
      st.project.push(stored(c.line)); logRow('project.md', 'you asked to keep it');
      say('ok', 'Kept without a question, in project.md, because you said so. The agent tells you in one line where it went, so you can move or remove it.'); return;
    }
    if (c.kind === 'asked' && kept(c.line)) { say('', 'That is already in the rules, so there is nothing new to keep.'); return; }
    st.phase = c.kind; say('', '');
  }
  function answer(a) {
    var c = cor(st.pick); if (!c) return;
    if (c.kind === 'asked') {
      if (a === 'project') { st.project.push(stored(c.line)); logRow('project.md', 'you chose yes, for this project'); say('ok', 'Saved to project.md. It applies from the next stage, and in later work on this project.'); }
      else if (a === 'team') { st.team.push(stored(c.line)); logRow('team.md', 'you chose yes, for the team'); say('ok', 'Saved to team.md, so it also reaches the team\'s other projects. That is a wider choice, so it is not the default.'); }
      else say('', 'Not kept. The correction stands for this stage only.');
    } else if (c.kind === 'conflict') {
      if (a === 'revise') { st.project.push(stored(c.revised)); logRow('project.md', 'revised after a clash with org.md'); say('ok', 'Revised to fit the organisation rule, then saved to project.md.'); }
      else if (a === 'skip') say('', 'Skipped. Nothing is saved.');
      else say('', 'Passed to whoever owns the organisation rules. The loop never writes at organisation level.');
    }
    st.phase = 'done';
  }
  function update() {
    var c = st.pick ? cor(st.pick) : null, ask = '';
    $('#rl-on', root).checked = st.on;
    $$('#rl-pick button', root).forEach(function (b) { var on = b.dataset.c === st.pick; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    $('#rl-text', root).textContent = c ? c.text : '';
    if (st.phase === 'asked') ask = '<div class="msg sys"><span class="who">The agent, before the approval gate</span>You asked me to do this differently. Keep that for next time?</div><div class="row" id="rl-opts"><button type="button" class="btn" data-a="project">Yes, for this project</button><button type="button" class="btn" data-a="team">Yes, for the team</button><button type="button" class="btn" data-a="no">No</button></div>';
    if (st.phase === 'conflict') ask = '<div class="msg sys"><span class="who">The agent, checking before it saves</span>That clashes with an organisation rule: "' + esc(c.clash) + '" Revise it, skip it, or pass it to the owner of the org rules?</div><div class="row" id="rl-opts"><button type="button" class="btn" data-a="revise">Revise it</button><button type="button" class="btn" data-a="skip">Skip it</button><button type="button" class="btn" data-a="pass">Pass it on</button></div>';
    $('#rl-ask', root).innerHTML = ask;
    var m = $('#rl-msg', root); m.hidden = !st.msg; m.className = 'verdict' + (st.cls ? ' ' + st.cls : ''); m.textContent = st.msg;
    $('#rl-org', root).innerHTML = list(L.org, 'empty');
    $('#rl-team', root).innerHTML = list(st.team, 'empty');
    $('#rl-project', root).innerHTML = list(st.project, 'empty');
    $('#rl-audit', root).innerHTML = list(st.audit, 'nothing yet');
    var n = L.org.length + st.team.length + st.project.length;
    $('#rl-next', root).textContent = 'The next stage reads ' + n + ' rule' + (n === 1 ? '' : 's') + ' (org ' + L.org.length + ', team ' + st.team.length + ', project ' + st.project.length + '). Every layer applies. Nothing is dropped or overridden.';
  }
  root.addEventListener('change', function (e) {
    if (e.target.id !== 'rl-on') return;
    st.on = e.target.checked; st.pick = null; st.phase = 'idle'; say('', ''); update(); $('#rl-on', root).focus();
  });
  onClick(root, function (d) {
    var f;
    if (d.c) { begin(d.c); update(); f = $('#rl-opts button', root) || $('[data-c="' + d.c + '"]', root); f.focus(); }
    else if (d.a === 'reset') { st.pick = null; st.phase = 'idle'; say('', ''); st.team = []; st.project = []; st.audit = []; update(); $('[data-a="reset"]', root).focus(); }
    else if (d.a) { answer(d.a); update(); $('[data-c="' + st.pick + '"]', root).focus(); }
  });
  update();
};

WIDGETS.unitboard = function (root, L) {
  var st = mem('unitboard', { s: {}, who: {}, rework: 0, msg: L.start, cls: '' });
  L.units.forEach(function (u) { if (!st.s[u.id]) st.s[u.id] = 'open'; });
  function unit(id) { return L.units.filter(function (u) { return u.id === id; })[0]; }
  function waiting(u) { return u.needs.filter(function (n) { return st.s[n] !== 'landed'; }); }
  var LABEL = { open: 'open to claim', claimed: 'being built', published: 'published, waiting for the lead', pinned: 'pinned, waiting for the merge gate', approved: 'approved, ready to land', landed: 'landed on main' };
  root.innerHTML = '<div id="ub-board"></div><div class="stat" id="ub-stat"></div><p class="verdict" id="ub-msg" role="status"></p>' +
    '<div class="row"><button type="button" class="btn" data-act="push">A team tries to push straight to main</button><button type="button" class="btn" data-act="reset">Reset the board</button></div>';
  function btn(act, u, label, extra) { return '<button type="button" class="btn' + (extra || '') + '" data-act="' + act + '" data-u="' + u.id + '">' + esc(label) + '</button>'; }
  function update() {
    var landed = 0;
    $('#ub-board', root).innerHTML = L.units.map(function (u) {
      var s = st.s[u.id], w = waiting(u), blocked = s === 'open' && w.length, h = '', note = '';
      if (s === 'landed') landed++;
      if (blocked) note = 'Blocked until ' + w.map(function (n) { return unit(n).name; }).join(', ') + ' has landed.';
      else if (u.needs.length) note = 'Needs ' + u.needs.map(function (n) { return unit(n).name; }).join(', ') + ', which has landed.';
      else note = 'Needs nothing else.';
      if (s === 'open' && !blocked) h = L.teams.map(function (t) { return '<button type="button" class="btn" data-act="claim" data-u="' + u.id + '" data-t="' + esc(t) + '">' + esc(t) + ' claims it</button>'; }).join('');
      else if (s === 'claimed') h = btn('publish', u, 'The team publishes a candidate');
      else if (s === 'published') h = btn('pin', u, 'Lead: pin this exact candidate');
      else if (s === 'pinned') h = btn('approve', u, 'Lead: approve the merge gate', ' primary') + btn('reject', u, 'Lead: request changes');
      else if (s === 'approved') h = btn('land', u, 'Lead: land it on main', ' primary');
      return '<div class="phase"><h4>' + esc(u.name) + ' <span class="tag' + (s === 'landed' ? ' go' : '') + '">' + (blocked ? 'blocked' : LABEL[s]) + (st.who[u.id] && s !== 'open' && s !== 'landed' ? ', ' + esc(st.who[u.id]) : '') + '</span></h4><p class="note" style="margin:0 0 6px">' + esc(note) + '</p><div class="row" style="margin:0">' + h + '</div></div>';
    }).join('');
    $('#ub-stat', root).innerHTML = '<span><b>' + landed + '</b> of ' + L.units.length + ' landed</span><span><b>' + st.rework + '</b> change request' + (st.rework === 1 ? '' : 's') + '</span>';
    var m = $('#ub-msg', root); m.className = 'verdict' + (st.cls ? ' ' + st.cls : ''); m.textContent = st.msg;
  }
  function say(cls, msg) { st.cls = cls; st.msg = msg; }
  onClick(root, function (d) {
    var u = d.u ? unit(d.u) : null, a = d.act;
    if (!a) return;
    if (a === 'reset') { L.units.forEach(function (x) { st.s[x.id] = 'open'; }); st.who = {}; st.rework = 0; say('', L.start); }
    else if (a === 'push') say('bad', 'In the workshop recipe teams never push main. They publish a candidate, and only the lead lands it, after a person has approved the merge gate.');
    else if (a === 'claim') { st.s[u.id] = 'claimed'; st.who[u.id] = d.t; say('ok', d.t + ' claimed ' + u.name + '. Only one team can hold a claim on a unit.'); }
    else if (a === 'publish') { st.s[u.id] = 'published'; say('', st.who[u.id] + ' published a candidate for ' + u.name + '. It is not on main yet.'); }
    else if (a === 'pin') { st.s[u.id] = 'pinned'; say('', 'The lead pinned that exact candidate and looked at its evidence. If the candidate changes after this, the gate refuses and the lead must pin again.'); }
    else if (a === 'approve') { st.s[u.id] = 'approved'; say('ok', 'A person approved the merge gate for ' + u.name + '. Now the lead can land it.'); }
    else if (a === 'reject') { st.s[u.id] = 'claimed'; st.rework++; say('bad', 'The lead asked for changes. ' + u.name + ' stays out of main, and ' + st.who[u.id] + ' fixes it and publishes again.'); }
    else if (a === 'land') {
      st.s[u.id] = 'landed';
      var opened = L.units.filter(function (x) { return x.needs.indexOf(u.id) >= 0 && st.s[x.id] === 'open' && !waiting(x).length; });
      var all = L.units.every(function (x) { return st.s[x.id] === 'landed'; });
      say('ok', u.name + ' landed on main.' + (opened.length ? ' ' + opened.map(function (x) { return x.name; }).join(', ') + (opened.length > 1 ? ' are' : ' is') + ' now open to claim.' : '') + (all ? ' All units have landed. Main now runs build and test, then the CI pipeline, and the group reads the combined audit trail.' : ''));
    }
    update();
    var f = (d.u && $('[data-u="' + d.u + '"][data-act]', root)) || $('[data-act="reset"]', root);
    if (a === 'push' || a === 'reset') f = $('[data-act="' + a + '"]', root);
    f.focus();
  });
  update();
};

  // ---------- tools ----------
  // ---------- Track 8, Tools in practice: a tool card, shared by the four pictures ----------
  function t8Card(card) {
    return '<div class="card" style="margin-top:14px"><h3>Tool card: ' + esc(card.name) + '</h3>' + card.rows.map(function (r) {
      return '<p style="margin:0 0 6px"><b>' + esc(r[0]) + ':</b> ' + esc(r[1]) + (r[2] ? ' <span class="tag">' + esc(r[2]) + '</span>' : '') + '</p>';
    }).join('') + '</div>';
  }

  // ---------- Track 8: what an in-editor assistant sees decides what it suggests; you decide whether to accept ----------
  WIDGETS._suggestOutcome = function (open) { return !open.helpers ? 'missing' : !open.tests ? 'partial' : 'good'; };
  WIDGETS.suggestcontext = function (root, L) {
    var st = mem('t8:suggest', { open: {}, decision: '' });
    function suggestion() { var out = []; if (st.open.tests) out.push(L.lines.empty); out.push(st.open.helpers ? L.lines.helper : L.lines.guess); return out; }
    root.innerHTML = '<fieldset class="seg"><legend>Other files open in tabs, besides the one you are typing in</legend>' + L.files.map(function (f) {
      return '<label><input type="checkbox" data-file="' + f.id + '"> <code>' + esc(f.name) + '</code>: ' + esc(f.what) + '</label>';
    }).join('') + '</fieldset>' +
      '<div class="pre" id="sc-editor" aria-label="The file you are typing in"></div>' +
      '<div class="row"><button type="button" class="btn primary" data-a="accept">Accept it (like pressing Tab)</button><button type="button" class="btn" data-a="dismiss">Dismiss it (like pressing Escape)</button></div>' +
      '<p class="verdict" id="sc-verdict" role="status"></p><div id="sc-card"></div>';
    $('#sc-card', root).innerHTML = t8Card(L.card);
    function update() {
      var s = suggestion(), dec = st.decision, key = WIDGETS._suggestOutcome(st.open), cls = '', msg, body = '';
      $$('input[data-file]', root).forEach(function (c) { c.checked = !!st.open[c.dataset.file]; });
      if (dec !== 'dismiss') body = s.map(function (t) { return '  ' + esc(t); }).join('\n');
      if (dec === '') body = '<span style="opacity:.55;font-style:italic">' + body + '</span>';
      $('#sc-editor', root).innerHTML = esc(L.code.head) + '\n' + (body ? body + '\n' : '') + esc(L.code.tail);
      if (dec === '') { var names = [L.code.file].concat(L.files.filter(function (f) { return st.open[f.id]; }).map(function (f) { return f.name; })); msg = 'The assistant saw: ' + names.join(', ') + '. The dimmed lines are only a suggestion. Nothing is in your file until you accept.'; }
      else if (dec === 'dismiss') msg = L.dismissed;
      else { cls = key === 'good' ? 'ok' : 'bad'; msg = L.after[key]; }
      $('#sc-verdict', root).className = 'verdict' + (cls ? ' ' + cls : ''); $('#sc-verdict', root).textContent = msg;
    }
    root.addEventListener('change', function (e) { var id = e.target.dataset.file; if (!id) return; st.open[id] = e.target.checked; st.decision = ''; update(); $('[data-file="' + id + '"]', root).focus(); });
    onClick(root, function (d) { if (!d.a) return; st.decision = d.a; update(); $('[data-a="' + d.a + '"]', root).focus(); });
    update();
  };

  // ---------- Track 8: the approval dial of a terminal agent, and what each level lets it do ----------
  function t8DialOutcome(L, rowId, levelId, sandbox, how) {
    var li = L.levels.map(function (l) { return l.id; }).indexOf(levelId), row = L.rows.filter(function (r) { return r.id === rowId; })[0];
    if (rowId === 'forbid') return how === 'rule' ? 'blocked' : t8DialOutcome(L, 'edit', levelId, sandbox, how);
    if (sandbox && row.sandboxOut) return row.sandboxOut;
    return row.out[li];
  }
  WIDGETS._dial = function (L, levelId, sandbox, how) { return L.rows.map(function (r) { return t8DialOutcome(L, r.id, levelId, sandbox, how); }); };
  WIDGETS.approvaldial = function (root, L) {
    var st = mem('t8:dial', { level: 'ask', sandbox: false, how: 'sentence' });
    var WORD = { runs: '✓ Alone', asks: '? Asks you', checked: '◇ A model', blocked: '✗ Cannot' };
    root.innerHTML = '<fieldset class="seg"><legend>Approval level (the small tag is the name Claude Code\'s docs used when I read them)</legend>' + L.levels.map(function (l) {
      return '<label><input type="radio" name="ad-level" data-level="' + l.id + '"> ' + esc(l.name) + ' <span class="tag">' + esc(l.tag) + '</span></label>';
    }).join('') + '</fieldset>' +
      '<label class="check" style="margin-top:10px"><input type="checkbox" id="ad-sandbox"> Operating-system sandbox on, with retries outside it switched off (limits what a running shell command can reach)</label>' +
      '<fieldset class="seg" style="margin-top:10px"><legend>How you told it never to touch one file</legend>' +
      '<label><input type="radio" name="ad-how" data-how="sentence"> A sentence in its instruction file</label><label><input type="radio" name="ad-how" data-how="rule"> A deny rule in its settings</label></fieldset>' +
      '<div class="scroll"><table class="mini"><caption>What the agent does, level by level</caption><thead id="ad-head"></thead><tbody id="ad-body"></tbody></table></div>' +
      '<p class="note">' + esc(L.key) + '</p><p class="verdict" id="ad-verdict" role="status"></p><ul class="warns" id="ad-notes"></ul><div id="ad-card"></div>';
    $('#ad-card', root).innerHTML = t8Card(L.card);
    function update() {
      var lv = L.levels.filter(function (l) { return l.id === st.level; })[0], li = L.levels.indexOf(lv), count = { runs: 0, asks: 0, checked: 0, blocked: 0 }, notes = [];
      $$('input[data-level]', root).forEach(function (r) { r.checked = r.dataset.level === st.level; });
      $$('input[data-how]', root).forEach(function (r) { r.checked = r.dataset.how === st.how; });
      $('#ad-sandbox', root).checked = st.sandbox;
      $('#ad-head', root).innerHTML = '<tr><th scope="col">What the agent tries</th>' + L.levels.map(function (l, i) { return '<th scope="col"' + (i === li ? ' aria-current="true"' : '') + '>' + (i === li ? '▶ ' : '') + esc(l.short) + '</th>'; }).join('') + '</tr>';
      $('#ad-body', root).innerHTML = L.rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r.text) + '</th>' + L.levels.map(function (l, i) {
          var o = t8DialOutcome(L, r.id, l.id, st.sandbox, st.how); if (i === li) count[o]++;
          return '<td>' + (i === li ? '<b>' + WORD[o] + '</b>' : WORD[o]) + '</td>';
        }).join('') + '</tr>';
      }).join('');
      L.rows.forEach(function (r) {
        var n = r.id === 'forbid' ? (st.how === 'rule' ? L.notes.rule : L.notes.sentence) : (st.sandbox && r.sandboxOut ? '' : ((r.notes && r.notes[lv.id]) || ''));
        if (n) notes.push('<li><b>' + esc(r.text) + ':</b> ' + esc(n) + '</li>');
      });
      if (st.sandbox) notes.push('<li><b>Sandbox on:</b> ' + esc(L.notes.sandbox) + '</li>');
      $('#ad-notes', root).innerHTML = notes.join('');
      $('#ad-verdict', root).className = 'verdict' + (lv.cls ? ' ' + lv.cls : '');
      $('#ad-verdict', root).textContent = 'At this level: ' + count.runs + ' it does alone, ' + count.asks + ' it asks you, ' + count.checked + ' a second model decides, ' + count.blocked + ' cannot happen. ' + lv.why;
    }
    root.addEventListener('change', function (e) {
      var d = e.target.dataset, sel;
      if (d.level) { st.level = d.level; sel = '[data-level="' + d.level + '"]'; }
      else if (d.how) { st.how = d.how; sel = '[data-how="' + d.how + '"]'; }
      else if (e.target.id === 'ad-sandbox') { st.sandbox = e.target.checked; sel = '#ad-sandbox'; }
      else return;
      update(); $(sel, root).focus();
    });
    update();
  };

  // ---------- Track 8: hand a ticket to an agent that works alone; the approval moves to the end ----------
  WIDGETS._ticketOutcome = function (on) { return on.overgrant ? 'overgrant' : !on.check ? 'nocheck' : !on.small ? 'big' : !on.context ? 'guess' : 'good'; };
  WIDGETS.ticketrun = function (root, L) {
    var st = mem('t8:ticket', { on: {}, run: false, review: true });
    root.innerHTML = '<p class="note" style="margin:0">The ticket you hand over:</p><p class="prompt" id="tr-ticket" style="font-size:16px"></p>' +
      '<fieldset class="seg"><legend>Add to the ticket</legend>' + L.ingredients.map(function (g) { return '<label><input type="checkbox" data-ing="' + g.id + '"> ' + esc(g.label) + '</label>'; }).join('') + '</fieldset>' +
      '<label class="check" style="margin-top:10px"><input type="checkbox" id="tr-review"> A person reads the pull request before it merges</label>' +
      '<div class="row"><button type="button" class="btn primary" id="tr-go" data-a="go">Hand it off</button></div>' +
      '<ol class="trace" id="tr-log" aria-live="polite"></ol><p class="verdict" id="tr-verdict" role="status"></p><p class="verdict" id="tr-gate" role="status"></p><div id="tr-card"></div>';
    $('#tr-card', root).innerHTML = t8Card(L.card);
    function line(t) { return '<li class="app"><span class="who">The agent, alone in its sandbox</span>' + esc(t) + '</li>'; }
    function update() {
      var on = st.on, key = WIDGETS._ticketOutcome(on), s = L.steps, h = '', r = L.results[key];
      $$('input[data-ing]', root).forEach(function (c) { c.checked = !!on[c.dataset.ing]; });
      $('#tr-review', root).checked = st.review;
      $('#tr-ticket', root).textContent = [L.ticket].concat(L.ingredients.filter(function (g) { return on[g.id]; }).map(function (g) { return g.add; })).join(' ');
      if (st.run) {
        h = line(s.start) + line(on.context ? s.context.yes : s.context.no) + line(on.small ? s.size.yes : s.size.no) + line(on.check ? s.check.yes : s.check.no) + (on.overgrant ? line(s.overgrant) : '') + line(s.end);
        $('#tr-verdict', root).className = 'verdict' + (r[0] ? ' ' + r[0] : ''); $('#tr-verdict', root).textContent = r[1];
      } else { $('#tr-verdict', root).className = 'verdict'; $('#tr-verdict', root).textContent = 'Tick what the ticket contains, then hand it off and read the run.'; }
      $('#tr-log', root).innerHTML = h;
      $('#tr-gate', root).className = 'verdict ' + (st.review ? 'ok' : 'bad'); $('#tr-gate', root).textContent = st.review ? L.gate.on : L.gate.off;
    }
    root.addEventListener('change', function (e) {
      var id = e.target.dataset.ing, sel;
      if (id) { st.on[id] = e.target.checked; st.run = false; sel = '[data-ing="' + id + '"]'; }
      else if (e.target.id === 'tr-review') { st.review = e.target.checked; sel = '#tr-review'; }
      else return;
      update(); $(sel, root).focus();
    });
    onClick(root, function (d) { if (d.a !== 'go') return; st.run = true; update(); $('#tr-go', root).focus(); });
    update();
  };

  // ---------- Track 8: fill in a tool card for any tool; see what is still unanswered ----------
  WIDGETS._cardRead = function (L, a) {
    var out = { answered: 0, unanswered: [], autonomy: '', flags: [] }, n = function (id) { return a[id] === 'u' || a[id] === undefined ? -1 : +a[id]; };
    L.questions.forEach(function (q) { if (n(q.id) < 0) out.unanswered.push(q.id); else out.answered++; });
    if (n('approves') >= 0) out.autonomy = L.autonomy[n('approves')];
    if (n('approves') === L.nothingIndex && n('changes') >= 2) out.flags.push('nobody');
    if (n('reads') >= 3 && n('changes') >= 3) out.flags.push('wide');
    if (n('data') === L.trainIndex) out.flags.push('data');
    return out;
  };
  WIDGETS.toolcard = function (root, L) {
    var st = mem('t8:card', { name: '', a: {} });
    function val(id) { return st.a[id] === undefined ? 'u' : String(st.a[id]); }
    root.innerHTML = '<p class="note" style="margin:0 0 6px">Start from a kind of tool, or from nothing:</p><div class="exs" id="tc-presets">' +
      L.presets.map(function (p) { return '<button type="button" data-preset="' + p.id + '">' + esc(p.label) + '</button>'; }).join('') + '<button type="button" data-preset="clear">Clear the card</button></div>' +
      '<p class="note">' + esc(L.presetNote) + '</p>' +
      '<label class="lab" for="tc-name">Name of the tool, or the feature</label><input type="text" id="tc-name" maxlength="40" autocomplete="off" placeholder="for example: my coding assistant" style="width:100%;max-width:420px">' +
      '<div class="sbgrid">' + L.questions.map(function (q, qi) {
        return '<fieldset class="seg"><legend>' + (qi + 1) + '. ' + esc(q.label) + '</legend>' + q.opts.map(function (o, i) {
          return '<label><input type="radio" name="tc-' + q.id + '" data-q="' + q.id + '" data-v="' + i + '"> ' + esc(o) + '</label>';
        }).join('') + '<label><input type="radio" name="tc-' + q.id + '" data-q="' + q.id + '" data-v="u"> Do not know yet</label></fieldset>';
      }).join('') + '</div><div id="tc-out" aria-live="polite" style="margin-top:14px"></div>';
    function sync() {
      $$('input[data-q]', root).forEach(function (r) { r.checked = r.dataset.v === val(r.dataset.q); });
      if ($('#tc-name', root).value !== st.name) $('#tc-name', root).value = st.name;
    }
    function draw() {
      var rd = WIDGETS._cardRead(L, st.a), h = '';
      h += '<div class="two"><div class="card"><h3>Tool card</h3><p style="margin:0 0 8px"><b>' + esc(st.name || 'A tool, not named yet') + '</b></p>' + L.questions.map(function (q) {
        var v = val(q.id);
        return '<p style="margin:0 0 6px"><b>' + esc(q.short) + ':</b> ' + (v === 'u' ? '<span class="tag">not answered</span>' : esc(q.opts[+v])) + '</p>';
      }).join('') + '</div><div class="card"><h3>Still unanswered (' + rd.unanswered.length + ' of ' + L.questions.length + ')</h3>' +
        (rd.unanswered.length ? '<ul class="warns">' + rd.unanswered.map(function (id) { var q = L.questions.filter(function (x) { return x.id === id; })[0]; return '<li><b>' + esc(q.label) + '</b> ' + esc(q.look) + '</li>'; }).join('') + '</ul>'
          : '<p>' + esc(L.allDone) + '</p>') + '</div></div>';
      h += '<p class="verdict" id="tc-auto">' + (rd.autonomy ? 'How much it does alone: ' + esc(rd.autonomy) + '.' : 'How much it does alone: not known yet. Answer the approval question.') + '</p>';
      rd.flags.forEach(function (f) { h += '<p class="verdict bad" data-flag="' + f + '">' + esc(L.flags[f]) + '</p>'; });
      $('#tc-out', root).innerHTML = h;
    }
    function update() { sync(); draw(); }
    root.addEventListener('change', function (e) { var d = e.target.dataset; if (!d.q) return; st.a[d.q] = d.v; draw(); });
    root.addEventListener('input', function (e) { if (e.target.id !== 'tc-name') return; st.name = e.target.value; draw(); });
    onClick(root, function (d) {
      if (d.preset === undefined) return;
      if (d.preset === 'clear') { st.a = {}; st.name = ''; }
      else { var p = L.presets.filter(function (x) { return x.id === d.preset; })[0]; st.a = {}; L.questions.forEach(function (q, i) { st.a[q.id] = String(p.a[i]); }); st.name = p.name; }
      update(); $('[data-preset="' + d.preset + '"]', root).focus();
    });
    update();
  };

  // ---------- grounding ----------
  // ---------- Track 4: embeddings as a hand-made map ----------
  WIDGETS._near = function (L, id, k) {
    var a = L.points.filter(function (p) { return p.id === id; })[0];
    return L.points.map(function (p, i) { return { p: p, d: Math.hypot(a.x - p.x, a.y - p.y), i: i }; })
      .filter(function (o) { return o.p.id !== id; })
      .sort(function (u, v) { return u.d - v.d || u.i - v.i; }).slice(0, k);
  };
  WIDGETS._sharedWords = function (L, id) {
    function words(t) { return (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return L.stop.indexOf(w) < 0; }); }
    var a = L.points.filter(function (p) { return p.id === id; })[0], aw = words(a.text), out = [];
    L.points.forEach(function (p) {
      if (p.id === id) return;
      var common = words(p.text).filter(function (w) { return aw.indexOf(w) >= 0; });
      if (common.length) out.push({ p: p, words: common, d: Math.hypot(a.x - p.x, a.y - p.y) });
    });
    return out;
  };
  WIDGETS.embedmap = function (root, L) {
    var st = mem('embedmap', { sel: 'refund', k: 2 }), M = L.map;
    function pt(id) { return L.points.filter(function (p) { return p.id === id; })[0]; }
    root.innerHTML = '<div class="ctl"><label for="em-k">Neighbours to show <b id="em-kv"></b></label><input type="range" id="em-k" min="1" max="4" step="1"></div>' +
      '<div id="em-map" role="group" aria-label="Map of phrases. Each phrase is a button." style="position:relative;aspect-ratio:' + M.w + '/' + M.h + ';border:1px solid var(--line);border-radius:12px;background:var(--bg);margin:6px 0 10px"></div>' +
      '<div class="two" id="em-out"></div><p class="verdict" id="em-verdict" role="status"></p><p class="note" id="em-vec"></p>';
    function update() {
      var s = pt(st.sel), near = WIDGETS._near(L, st.sel, st.k), shared = WIDGETS._sharedWords(L, st.sel);
      var mates = L.points.filter(function (p) { return p.g === s.g; }).length - 1;
      var h = '<svg viewBox="0 0 ' + M.w + ' ' + M.h + '" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%">';
      near.forEach(function (n) { h += '<line x1="' + s.x + '" y1="' + s.y + '" x2="' + n.p.x + '" y2="' + n.p.y + '" style="stroke:var(--info);stroke-width:2;vector-effect:non-scaling-stroke"></line>'; });
      h += '</svg>';
      L.points.forEach(function (p) {
        var isSel = p.id === st.sel, isNear = near.some(function (n) { return n.p.id === p.id; });
        h += '<button type="button" data-p="' + p.id + '" aria-pressed="' + isSel + '" style="position:absolute;left:' + (p.x / M.w * 100) + '%;top:' + (p.y / M.h * 100) + '%;transform:translate(-50%,-50%);white-space:nowrap;font-size:12px;line-height:1.3;padding:3px 9px;border-radius:999px;color:var(--text);' +
          'border:1px solid ' + (isSel ? 'var(--info)' : isNear ? 'var(--ok)' : 'var(--line)') + ';background:' + (isSel ? 'color-mix(in srgb, var(--info) 16%, var(--surface))' : isNear ? 'color-mix(in srgb, var(--ok) 18%, var(--surface))' : 'var(--chip)') + (isSel ? ';font-weight:700' : '') + '">' + esc(p.text) + '</button>';
      });
      $('#em-map', root).innerHTML = h;
      $('#em-kv', root).textContent = String(st.k);
      function tag(p) { var same = p.g === s.g; return '<span class="tag' + (same ? ' go' : '') + '">' + (same ? 'same topic' : 'different topic') + '</span>'; }
      $('#em-out', root).innerHTML =
        '<div class="card"><h3>Nearest ' + st.k + ' on the map</h3><ol style="margin:0;padding-left:20px">' + near.map(function (n) {
          return '<li style="margin:3px 0">' + esc(n.p.text) + ' <small style="color:var(--muted)">' + n.d.toFixed(1) + ' units</small> ' + tag(n.p) + '</li>';
        }).join('') + '</ol></div>' +
        '<div class="card"><h3>Phrases that share a word with it</h3>' + (shared.length ? '<ul style="margin:0;padding-left:20px">' + shared.map(function (x) {
          return '<li style="margin:3px 0">' + esc(x.p.text) + ' (shares "' + esc(x.words.join('", "')) + '") <small style="color:var(--muted)">' + x.d.toFixed(1) + ' units away</small> ' + tag(x.p) + '</li>';
        }).join('') + '</ul>' : '<p>None. A keyword match would find nothing else here.</p>') + '</div>';
      var far = shared.filter(function (x) { return x.p.g !== s.g; })[0], strangers = near.filter(function (n) { return n.p.g !== s.g; }), cls, msg;
      if (far) {
        cls = 'ok'; msg = '"' + s.text + '" shares the word "' + far.words[0] + '" with "' + far.p.text + '", but they sit ' + far.d.toFixed(1) + ' units apart, in different topics. A keyword match would link them. The map keeps them apart because they mean different things.';
      } else if (strangers.length) {
        var mateMax = Math.max.apply(null, near.filter(function (n) { return n.p.g === s.g; }).map(function (n) { return n.d; }).concat([0]));
        cls = 'bad'; msg = 'You asked for ' + st.k + ' neighbours, but only ' + mates + ' other ' + (mates === 1 ? 'phrase shares' : 'phrases share') + ' this topic. The extra ' + (strangers.length === 1 ? 'one, "' : 'ones, "') + strangers.map(function (n) { return n.p.text; }).join('", "') + '", ' + (strangers.length === 1 ? 'is a stranger' : 'are strangers') + ', ' + strangers[0].d.toFixed(1) + ' units away against ' + mateMax.toFixed(1) + ' for the farthest same-topic neighbour. There is always a "nearest". It does not mean "close".';
      } else {
        cls = 'ok'; msg = (st.k === 1 ? 'The nearest phrase is' : 'All ' + st.k + ' neighbours are') + ' in the same topic' + (shared.length === 0 ? ', and none of them shares a word with "' + s.text + '". The map places them by meaning, not by spelling.' : '.');
      }
      $('#em-verdict', root).className = 'verdict ' + cls; $('#em-verdict', root).textContent = msg;
      $('#em-vec', root).textContent = '"' + s.text + '" is the point (' + s.x + ', ' + s.y + '): two numbers, placed by hand. A real embedding is a list of hundreds or thousands of numbers (G4, G5), made by a trained model, so no picture can show it.';
    }
    $('#em-k', root).value = st.k;
    root.addEventListener('input', function (e) { if (e.target.id !== 'em-k') return; st.k = +e.target.value; update(); });
    onClick(root, function (d) { if (!d.p) return; st.sel = d.p; update(); $('[data-p="' + st.sel + '"]', root).focus(); });
    update();
  };

  // ---------- Track 4: keyword search, search by meaning, and both ----------
  WIDGETS._searchRun = function (L, qid, cut) {
    var q = L.queries.filter(function (x) { return x.id === qid; })[0];
    function toks(t) { return t.toLowerCase().match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || []; }
    var qt = toks(q.text).filter(function (w) { return L.stop.indexOf(w) < 0; }).filter(function (w, i, a) { return a.indexOf(w) === i; }), kw = [];
    L.docs.forEach(function (d, i) {
      var dt = toks(d.text), hit = qt.filter(function (w) { return dt.indexOf(w) >= 0; });
      if (hit.length) kw.push({ id: d.id, n: hit.length, words: hit, i: i });
    });
    kw.sort(function (a, b) { return b.n - a.n || a.i - b.i; }); kw = kw.slice(0, 3);
    var sem = L.docs.map(function (d, i) { return { id: d.id, s: q.sc[d.id], i: i }; })
      .filter(function (o) { return !cut || o.s >= L.cut; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; }).slice(0, 3), pool = [];
    [0, 1].forEach(function (r) { [kw, sem].forEach(function (list) { if (list[r] && pool.indexOf(list[r].id) < 0) pool.push(list[r].id); }); });
    return { q: q, kw: kw, sem: sem, pool: pool };
  };
  WIDGETS.searchcompare = function (root, L) {
    var st = mem('searchcompare', { q: 'q1', pool: false, cut: false });
    function doc(id) { return L.docs.filter(function (d) { return d.id === id; })[0]; }
    root.innerHTML = '<div class="doc"><span class="who">The eight pages being searched</span><ul style="margin:4px 0 0;padding-left:18px;font-size:var(--fs-md)">' + L.docs.map(function (d) { return '<li><b>' + d.id + '</b> ' + esc(d.text) + '</li>'; }).join('') + '</ul></div>' +
      '<p class="note" style="margin:10px 0 0">Ask:</p><div class="exs" id="sc-q"></div>' +
      '<div class="ctl"><label class="check"><input type="checkbox" id="sc-pool"> Also show a pool: the top two from each list, merged</label>' +
      '<label class="check"><input type="checkbox" id="sc-cut"> Drop meaning matches that score under ' + L.cut.toFixed(2) + ' (a minimum score)</label></div>' +
      '<div class="two" id="sc-out"></div>';
    function judge(ids, q, pool) {
      if (q.right === null) return ids.length ? ['bad', 'Something came back, but no page answers this question. A system will present it as if one did.'] : ['ok', 'Nothing came back, which is right: no page answers this question.'];
      if (!ids.length) return ['bad', 'Nothing came back, but page ' + q.right + ' answers this question.'];
      if (pool) return ids.indexOf(q.right) >= 0 ? ['ok', 'The right page made it into the pool, alongside ' + (ids.length - 1) + ' other' + (ids.length === 2 ? '' : 's') + ' that the next step must sort out.'] : ['bad', 'The right page is not in the pool.'];
      if (ids[0] === q.right) return ['ok', 'The right page is first.'];
      return ids.indexOf(q.right) >= 0 ? ['bad', 'The right page is in the list, but not first, so the top result is wrong.'] : ['bad', 'The right page is not in the list.'];
    }
    function card(id, title, rowsHtml, because, j) {
      return '<div class="card" id="' + id + '"><h3>' + title + '</h3>' + (rowsHtml || '<p class="note" style="margin:0">Nothing came back.</p>') + '<p class="note">' + esc(because) + '</p><p class="verdict ' + j[0] + '" id="' + id + '-v" role="status">' + esc(j[1]) + '</p></div>';
    }
    function update() {
      var r = WIDGETS._searchRun(L, st.q, st.cut), q = r.q;
      function rows(list, extra) {
        return list.length ? '<ol style="margin:0;padding-left:20px">' + list.map(function (o) { return '<li style="margin:4px 0"><b>' + o.id + '</b> ' + esc(doc(o.id).text) + (o.id === q.right ? ' <span class="tag go">the answer</span>' : '') + ' <small style="color:var(--muted)">' + extra(o) + '</small></li>'; }).join('') + '</ol>' : '';
      }
      $('#sc-q', root).innerHTML = L.queries.map(function (x) { return '<button type="button" data-q="' + x.id + '"' + (x.id === st.q ? ' class="on"' : '') + '>' + esc(x.text) + '</button>'; }).join('');
      $('#sc-pool', root).checked = st.pool; $('#sc-cut', root).checked = st.cut;
      var semBecause = st.cut && q.semCut ? q.semCut : q.sem;
      var h = card('sc-kw', 'Keyword search', rows(r.kw, function (o) { return 'matched: ' + esc(o.words.join(', ')); }), q.kw, judge(r.kw.map(function (o) { return o.id; }), q)) +
        card('sc-sem', 'Search by meaning', rows(r.sem, function (o) { return 'similarity ' + o.s.toFixed(2) + ' (scripted)'; }), semBecause, judge(r.sem.map(function (o) { return o.id; }), q));
      if (st.pool) h += card('sc-pl', 'Both: a pool', rows(r.pool.map(function (id) { return { id: id }; }), function () { return ''; }), 'The pool takes the top two from each list and merges duplicates. It catches what either list found, and it carries both lists\' noise. A real system then ranks the pool, often with a reranker (G7).', judge(r.pool, q, true));
      $('#sc-out', root).innerHTML = h;
    }
    root.addEventListener('change', function (e) {
      if (e.target.id === 'sc-pool') st.pool = e.target.checked; else if (e.target.id === 'sc-cut') st.cut = e.target.checked; else return;
      update(); $('#' + e.target.id, root).focus();
    });
    onClick(root, function (d) { if (!d.q) return; st.q = d.q; update(); $('[data-q="' + st.q + '"]', root).focus(); });
    update();
  };

  // ---------- Track 4: RAG, retrieve then answer, with the settings and the cost ----------
  var RAG_ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  WIDGETS._ragRun = function (L, qid, sizeId, k, rule) {
    var q = L.questions.filter(function (x) { return x.id === qid; })[0], size = L.sizes.filter(function (x) { return x.id === sizeId; })[0], chunks = [];
    for (var i = 0; i < L.sents.length; i += size.per) {
      var ss = L.sents.slice(i, i + size.per), rel = ss.map(function (s) { return q.rel[s.id]; });
      var mx = Math.max.apply(null, rel), mean = rel.reduce(function (a, b) { return a + b; }, 0) / rel.length; // a stand-in for what an embedding model would score
      chunks.push({ n: chunks.length + 1, sents: ss, score: 0.7 * mx + 0.3 * mean, t: ss.reduce(function (a, s) { return a + s.t; }, 0) });
    }
    var order = chunks.slice().sort(function (a, b) { return b.score - a.score || a.n - b.n; }).map(function (c) { return c.n; });
    var kk = Math.min(k, chunks.length), sent = order.slice(0, kk), covered = [], extra = 0;
    chunks.forEach(function (c) { if (sent.indexOf(c.n) >= 0) c.sents.forEach(function (s) { covered.push(s.id); if (q.needs.indexOf(s.id) < 0) extra += s.t; }); });
    var key = q.needs.filter(function (n) { return covered.indexOf(n) >= 0; }).join('+');
    var tokens = L.sys.t + (rule ? L.rule.t : 0) + sent.reduce(function (a, n) { return a + chunks[n - 1].t; }, 0) + q.t;
    return { q: q, size: size, chunks: chunks, order: order, sent: sent, k: kk, covered: covered, extra: extra, key: key, tokens: tokens, out: q.out[key][rule ? 'on' : 'off'] };
  };
  WIDGETS.ragpipe = function (root, L) {
    var st = mem('ragpipe', { q: 'cancel', size: 'small', k: 1, rule: true });
    function sentText(id) { return L.sents.filter(function (s) { return s.id === id; })[0].text; }
    var allTokens = L.sents.reduce(function (a, s) { return a + s.t; }, 0);
    root.innerHTML = '<p class="note" style="margin:0 0 4px">Ask:</p><div class="exs" id="rg-q"></div>' +
      '<fieldset class="seg" id="rg-size" style="margin:8px 0"><legend>Chunk size</legend>' + L.sizes.map(function (z) { return '<label><input type="radio" name="rg-size" data-size="' + z.id + '"> ' + esc(z.label) + '</label>'; }).join('') + '</fieldset>' +
      '<div class="ctl"><label for="rg-k">Chunks sent to the model <b id="rg-kv"></b></label><input type="range" id="rg-k" min="1" max="4" step="1">' +
      '<label class="check"><input type="checkbox" id="rg-rule"> Instruction: answer only from the chunks, and say when they do not say</label></div>' +
      '<h4>1. The handbook, cut into chunks and ranked for this question</h4><div class="chat" id="rg-chunks"></div><p class="note">Bold: a sentence this question needs. Shaded: sent to the model.</p>' +
      '<h4 style="margin-top:14px">2. What lands in the window</h4><div class="chat" id="rg-window"></div><div class="meter" id="rg-meter"><i></i></div><p class="note" id="rg-cost" role="status"></p>' +
      '<h4 style="margin-top:14px">3. The answer</h4><div class="chat" id="rg-answer" aria-live="polite"></div><p class="verdict" id="rg-verdict" role="status"></p>' +
      '<p class="note">Even with the right chunk in the window, the model still has to read it correctly. Check important answers against the chunk.</p>';
    function reason(r) {
      var q = r.q;
      if (!q.needs.length) return 'No sentence in the handbook answers this, so there is nothing right to find. What the model does with the weak chunks depends on the instruction.';
      var missing = q.needs.filter(function (n) { return r.covered.indexOf(n) < 0; });
      if (!missing.length) return 'Every fact the answer needs is in the window.' + (r.extra ? ' ' + r.extra + ' of the ' + r.tokens + ' tokens were text the question did not need.' : '');
      function chunkOf(id) { return r.chunks.filter(function (c) { return c.sents.some(function (s) { return s.id === id; }); })[0]; }
      var msg = missing.map(function (id) { var c = chunkOf(id); return 'Missing: "' + sentText(id) + '" sits in chunk ' + c.n + ', which ranked ' + RAG_ORD[r.order.indexOf(c.n) + 1] + '. You sent ' + r.k + '.'; }).join(' ');
      var chunkIds = q.needs.map(function (id) { return chunkOf(id).n; });
      return msg + (chunkIds.some(function (n) { return n !== chunkIds[0]; }) ? ' The facts the answer needs were split across chunks by the cut.' : '');
    }
    function update() {
      var r = WIDGETS._ragRun(L, st.q, st.size, st.k, st.rule), base = WIDGETS._ragRun(L, st.q, 'small', 1, false), q = r.q, full = L.sys.t + L.rule.t + allTokens + q.t;
      $('#rg-q', root).innerHTML = L.questions.map(function (x) { return '<button type="button" data-q="' + x.id + '"' + (x.id === st.q ? ' class="on"' : '') + '>' + esc(x.text) + '</button>'; }).join('');
      $$('[data-size]', root).forEach(function (el) { el.checked = el.dataset.size === st.size; });
      $('#rg-k', root).value = st.k; $('#rg-rule', root).checked = st.rule;
      $('#rg-kv', root).textContent = st.k + (st.k > r.chunks.length ? ' (only ' + r.chunks.length + ' chunk' + (r.chunks.length === 1 ? '' : 's') + ' exist' + (r.chunks.length === 1 ? 's' : '') + ' at this size)' : '');
      $('#rg-chunks', root).innerHTML = r.chunks.map(function (c) {
        var isSent = r.sent.indexOf(c.n) >= 0;
        return '<div class="' + (isSent ? 'msg sum' : 'doc') + '" data-chunk="' + c.n + '" style="max-width:100%"><span class="who">Chunk ' + c.n + ' · ranked ' + RAG_ORD[r.order.indexOf(c.n) + 1] + ' · score ' + c.score.toFixed(2) + ' · ' + (isSent ? 'sent' : 'not sent') + ' · ' + c.t + ' tokens</span>' +
          c.sents.map(function (s) { return q.needs.indexOf(s.id) >= 0 ? '<b>' + esc(s.text) + '</b>' : esc(s.text); }).join(' ') + '</div>';
      }).join('');
      var w = '<div class="msg sys"><span class="who">System instructions</span>' + esc(L.sys.text) + '<small>' + L.sys.t + ' tokens</small></div>';
      if (st.rule) w += '<div class="msg sys"><span class="who">Rule</span>' + esc(L.rule.text) + '<small>' + L.rule.t + ' tokens</small></div>';
      r.sent.forEach(function (n, i) { var c = r.chunks[n - 1]; w += '<div class="msg sum" style="max-width:100%"><span class="who">Chunk ' + n + ' (ranked ' + RAG_ORD[i + 1] + ')</span>' + esc(c.sents.map(function (s) { return s.text; }).join(' ')) + '<small>' + c.t + ' tokens</small></div>'; });
      w += '<div class="msg you"><span class="who">Question</span>' + esc(q.text) + '<small>' + q.t + ' tokens</small></div>';
      $('#rg-window', root).innerHTML = w;
      $('i', $('#rg-meter', root)).style.width = Math.min(100, r.tokens / full * 100) + '%';
      $('#rg-cost', root).textContent = r.tokens + ' toy tokens go in for this one question (the whole handbook plus every instruction would be ' + full + '). Asked 1,000 times, that is ' + String(r.tokens * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' tokens, ' + (r.tokens / base.tokens).toFixed(1) + ' times the cheapest setting (one small chunk, no rule).';
      var o = r.out, cls = o[1];
      $('#rg-answer', root).innerHTML = '<div class="msg model"><span class="who">Answer</span>' + esc(o[0]) + '</div>';
      $('#rg-verdict', root).className = 'verdict' + (cls ? ' ' + cls : '');
      $('#rg-verdict', root).textContent = (cls === 'ok' ? 'Good. ' : cls === 'bad' ? 'Wrong, and it sounds sure. ' : 'Not enough to answer fully. ') + reason(r);
    }
    root.addEventListener('change', function (e) {
      var t = e.target, sel;
      if (t.dataset.size) { st.size = t.dataset.size; sel = '[data-size="' + st.size + '"]'; } else if (t.id === 'rg-rule') { st.rule = t.checked; sel = '#rg-rule'; } else return;
      update(); $(sel, root).focus();
    });
    root.addEventListener('input', function (e) { if (e.target.id !== 'rg-k') return; st.k = +e.target.value; update(); });
    onClick(root, function (d) { if (!d.q) return; st.q = d.q; update(); $('[data-q="' + st.q + '"]', root).focus(); });
    update();
  };

  // ---------- Track 4: citations, is the claim really in the chunk it points at? ----------
  WIDGETS.citecheck = function (root, L) {
    var st = mem('citecheck', { a: {} }), labels = { yes: 'Supported', part: 'Partly supported', no: 'Not supported, or nothing to check' };
    root.innerHTML = '<p class="prompt" style="font-size:16px">Question: ' + esc(L.question) + '</p><p class="note" style="margin:0 0 4px">The answer, one claim at a time. A mark such as [2] points at a source chunk.</p><div id="ct-body"></div><p class="note" id="ct-score" role="status"></p><p class="verdict" id="ct-sum" role="status" style="display:none"></p>';
    function chunk(n) { return L.chunks.filter(function (c) { return c.n === n; })[0]; }
    function update() {
      var done = 0, right = 0;
      $('#ct-body', root).innerHTML = L.claims.map(function (c, i) {
        var pick = st.a[c.id], fb = '', ch = c.cite ? chunk(c.cite) : null;
        if (pick) { done++; if (pick === c.a) right++; fb = '<p class="verdict ' + (pick === c.a ? 'ok' : 'bad') + '">' + (pick === c.a ? '' : 'I judged this one "' + labels[c.a].toLowerCase() + '". ') + esc(c.why) + '</p>'; }
        return '<fieldset class="seg" style="margin-top:10px"><legend>Claim ' + (i + 1) + ' of ' + L.claims.length + '</legend><p style="margin:0;font-size:16px">' + esc(c.text) + ' <b>' + (ch ? '[' + c.cite + ']' : '(no citation)') + '</b></p>' +
          (ch ? '<div class="doc"><span class="who">Source [' + ch.n + ']: ' + esc(ch.title) + '</span>' + esc(ch.text) + '</div>' : '<p class="note" style="margin:0">No citation, so there is no source to open.</p>') +
          Object.keys(labels).map(function (v) { return '<label><input type="radio" name="ct-' + c.id + '" data-claim="' + c.id + '" data-v="' + v + '"' + (pick === v ? ' checked' : '') + '> ' + labels[v] + '</label>'; }).join('') + fb + '</fieldset>';
      }).join('');
      $('#ct-score', root).textContent = done ? right + ' of ' + done + ' match my judgment so far, out of ' + L.claims.length + '. These are judgments: a different answer with a reason is fine.' : 'Decide each claim, then read why.';
      var sum = $('#ct-sum', root);
      if (done === L.claims.length) {
        var pointers = L.claims.filter(function (c) { return c.cite && chunk(c.cite); }).length, full = L.claims.filter(function (c) { return c.a === 'yes'; }).length;
        sum.style.display = ''; sum.className = 'verdict';
        sum.textContent = 'Claims with a pointer to a real chunk: ' + pointers + ' of ' + L.claims.length + '. Claims that chunk fully supports: ' + full + ' of ' + L.claims.length + '. A check that only looks for valid pointers would pass ' + pointers + ' of them. A pointer is where checking starts.';
      } else { sum.style.display = 'none'; sum.textContent = ''; }
    }
    root.addEventListener('change', function (e) {
      var d = e.target.dataset; if (!d.claim) return;
      st.a[d.claim] = d.v; update(); $('[data-claim="' + d.claim + '"][data-v="' + d.v + '"]', root).focus();
    });
    update();
  };

  // ---------- evals ----------
  // ---------- Track 5: choose test cases, tune on some, hold some back ----------
  function tcFaults(list) { var s = {}; list.forEach(function (c) { c.catches.forEach(function (f) { s[f] = true; }); }); return s; }
  function tcCompute(L, pick, tuned) {
    var set = L.cases.filter(function (c) { return pick[c.id] === 'tune' || pick[c.id] === 'hold'; });
    var tune = set.filter(function (c) { return pick[c.id] === 'tune'; }), hold = set.filter(function (c) { return pick[c.id] === 'hold'; });
    var seen = tcFaults(set), fixed = tuned ? tcFaults(tune) : {};
    return {
      setN: set.length, tuneN: tune.length, holdN: hold.length, seen: seen, seenN: Object.keys(seen).length, fixed: fixed,
      failing: set.filter(function (c) { return c.catches.length > 0; }).length,
      holdPass: hold.filter(function (c) { return c.catches.every(function (f) { return fixed[f]; }); }).length,
      left: L.faults.filter(function (f) { return !fixed[f.id]; }).map(function (f) { return f.id; }),
      unseen: L.faults.filter(function (f) { return !seen[f.id]; }).map(function (f) { return f.id; })
    };
  }
  WIDGETS._testcover = tcCompute;
  WIDGETS.testcover = function (root, L) {
    var st = mem('testcover', { pick: {}, tuned: false });
    var MODES = [['out', 'Leave out'], ['tune', 'Tune on it'], ['hold', 'Hold back']];
    root.innerHTML = '<p class="prompt" style="font-size:16px">' + esc(L.assistant) + ' Its prompt has ' + L.faults.length + ' faults today, and you cannot see them yet. Choose the cases for your test set.</p>' +
      '<div id="tc-cases"></div>' +
      '<div class="row" style="margin-top:12px"><button type="button" class="btn primary" id="tc-tune" data-a="tune">Tune the prompt until my tune-on cases pass</button><button type="button" class="btn" id="tc-undo" data-a="undo">Undo the tuning</button></div>' +
      '<p class="note" id="tc-count" role="status"></p><ul class="rubric" id="tc-faults"></ul><p class="verdict" id="tc-verdict" role="status"></p>';
    function name(id) { return L.faults.filter(function (f) { return f.id === id; })[0].text; }
    function update() {
      var r = tcCompute(L, st.pick, st.tuned), v = $('#tc-verdict', root), n = L.faults.length, msg, cls = '';
      $('#tc-cases', root).innerHTML = L.cases.map(function (c) {
        var m = st.pick[c.id] || 'out';
        return '<fieldset class="seg" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px 18px"><legend><span class="tag">' + esc(c.kind) + '</span> ' + esc(c.text) + '</legend>' +
          MODES.map(function (o) { return '<label><input type="radio" name="tc-' + c.id + '" data-cid="' + c.id + '" data-m="' + o[0] + '"' + (m === o[0] ? ' checked' : '') + '> ' + o[1] + '</label>'; }).join('') + '</fieldset>';
      }).join('');
      $('#tc-tune', root).disabled = st.tuned; $('#tc-undo', root).disabled = !st.tuned;
      $('#tc-count', root).textContent = !r.setN ? 'No cases chosen yet.' : !st.tuned
        ? r.setN + ' case' + (r.setN === 1 ? '' : 's') + ' in your set. The prompt fails ' + r.failing + ' of them today. Faults your set would show: ' + r.seenN + ' of ' + n + '.'
        : (r.tuneN ? 'Tune-on cases passing: ' + r.tuneN + ' of ' + r.tuneN + '. ' : 'No tune-on cases, so nothing was changed. ') + 'Held-back cases passing: ' + r.holdPass + ' of ' + r.holdN + '.';
      $('#tc-faults', root).innerHTML = L.faults.map(function (f) {
        var seen = r.seen[f.id], fx = r.fixed[f.id], label, cls2;
        if (st.tuned) { label = fx ? 'Fixed' : 'Still there'; cls2 = fx ? 'ok' : 'no'; } else { label = seen ? 'Would be caught' : 'Not caught'; cls2 = seen ? 'ok' : 'no'; }
        return '<li class="' + cls2 + '"><b>' + label + '</b><span>' + esc(f.text) + (st.tuned && !fx && seen ? ' (a held-back case shows it)' : '') + '</span></li>';
      }).join('');
      if (!r.setN) msg = 'Choose at least one case. Mark it "Tune on it" to use it for fixing, or "Hold back" to keep it for checking.';
      else if (!st.tuned) {
        if (r.seenN === 0) { cls = 'bad'; msg = 'Every case in your set passes today, and the prompt still has ' + n + ' faults. A green run from easy cases says nothing about the awkward ones.'; }
        else if (r.seenN < n) msg = 'Your set would show ' + r.seenN + ' of ' + n + ' faults. No case shows: ' + r.unseen.map(name).join('; ') + '. Two cases for the same fault count once.';
        else { cls = 'ok'; msg = 'Every fault has a case that shows it. Two cases for the same fault count once, so spread them out.'; }
      } else if (!r.tuneN) msg = 'Nothing to tune on, so nothing changed. Mark at least one case "Tune on it".';
      else if (!r.holdN) { cls = 'bad'; msg = 'All your cases pass, but you cannot tell whether the prompt got better or only got better at these cases. ' + r.unseen.length + ' fault' + (r.unseen.length === 1 ? '' : 's') + ' no case shows ' + (r.unseen.length === 1 ? 'is' : 'are') + ' still there. Hold some cases back.'; }
      else if (r.holdPass < r.holdN) { cls = 'ok'; msg = 'A held-back case still fails. That is the set doing its job: it shows a fault your tuning cases never revealed. ' + (r.unseen.length ? r.unseen.length + ' more fault' + (r.unseen.length === 1 ? '' : 's') + ' no case shows ' + (r.unseen.length === 1 ? 'is' : 'are') + ' still there.' : ''); }
      else if (r.unseen.length) msg = 'The held-back cases pass, which is good news, but only for faults a tuning case already showed. ' + r.unseen.length + ' fault' + (r.unseen.length === 1 ? '' : 's') + ' no case shows ' + (r.unseen.length === 1 ? 'is' : 'are') + ' still in the prompt.';
      else { cls = 'ok'; msg = 'Every fault is fixed, and the held-back cases agree.'; }
      v.className = 'verdict' + (cls ? ' ' + cls : ''); v.textContent = msg;
    }
    root.addEventListener('change', function (e) {
      var d = e.target.dataset; if (!d.cid) return;
      if (d.m === 'out') delete st.pick[d.cid]; else st.pick[d.cid] = d.m;
      update(); $('[data-cid="' + d.cid + '"][data-m="' + d.m + '"]', root).focus();
    });
    onClick(root, function (d) {
      if (d.a === 'tune') { st.tuned = true; update(); $('#tc-undo', root).focus(); }
      else if (d.a === 'undo') { st.tuned = false; update(); $('#tc-tune', root).focus(); }
    });
    update();
  };

  // ---------- Track 5: two scorers, a vague criterion, and the checks that make them agree ----------
  var RA_DIMS = ['invented', 'owners', 'long'];
  function raBad(d, s) { return d === 'invented' ? !!s.invented : d === 'owners' ? !s.owners : !!s.long; }
  function raWhy(d) { return d === 'invented' ? 'an invented item' : d === 'owners' ? 'an action with no owner' : 'too long'; }
  function raMark(on, scorer, s) { // a scorer applies every check written down, plus the one thing they care about anyway
    var why = []; RA_DIMS.forEach(function (d) { if ((on[d] || scorer.taste === d) && raBad(d, s)) why.push(raWhy(d)); });
    return { pass: !why.length, why: why };
  }
  function raCompute(L, on) {
    var rows = L.samples.map(function (s) {
      var a = raMark(on, L.scorers[0], s), b = raMark(on, L.scorers[1], s), why = RA_DIMS.filter(function (d) { return raBad(d, s); }).map(raWhy);
      return { s: s, a: a, b: b, truth: { pass: !why.length, why: why }, agree: a.pass === b.pass };
    });
    return { rows: rows, agree: rows.filter(function (r) { return r.agree; }).length, right: rows.filter(function (r) { return r.agree && r.a.pass === r.truth.pass; }).length };
  }
  WIDGETS._rubricAgree = raCompute;
  WIDGETS.rubricagree = function (root, L) {
    var st = mem('rubricagree', { on: {} });
    root.innerHTML = '<p class="prompt" style="font-size:16px" id="ra-crit"></p>' +
      '<fieldset class="seg"><legend>Tighten the criterion: write in a check</legend>' + L.checks.map(function (c) { return '<label><input type="checkbox" data-chk="' + c.id + '"> ' + esc(c.text) + '</label>'; }).join('') + '</fieldset>' +
      '<p class="note" style="margin-top:10px">When the criterion is vague, ' + L.scorers.map(function (s) { return esc(s.name) + ' ' + esc(s.note); }).join(' and ') + '. Neither was told to look for invented items.</p>' +
      '<p class="big" id="ra-score" role="status"></p><div class="scroll"><table class="mini"><caption>Six summaries of the same meeting, scored two ways</caption><thead><tr><th scope="col">Summary</th><th scope="col">Scorer A</th><th scope="col">Scorer B</th><th scope="col">Same verdict?</th><th scope="col">Should be</th></tr></thead><tbody id="ra-rows"></tbody></table></div>' +
      '<p class="verdict" id="ra-verdict" role="status"></p>';
    function cell(m) { return (m.pass ? 'Pass' : 'Fail: ' + m.why.join(', ')); }
    function update() {
      var r = raCompute(L, st.on), v = $('#ra-verdict', root), n = L.samples.length, cls = '', msg, written = L.checks.filter(function (c) { return st.on[c.id]; });
      $$('input[data-chk]', root).forEach(function (i) { i.checked = !!st.on[i.dataset.chk]; });
      $('#ra-crit', root).textContent = 'Criterion: ' + [L.criterion].concat(written.map(function (c) { return c.text; })).join(' ');
      $('#ra-score', root).innerHTML = '<b>' + r.agree + '</b> of ' + n + ' scored the same by both. Both right: <b>' + r.right + '</b> of ' + n;
      $('#ra-rows', root).innerHTML = r.rows.map(function (x) {
        return '<tr><th scope="row" style="font-weight:400">' + esc(x.s.text) + '</th><td>' + esc(cell(x.a)) + '</td><td>' + esc(cell(x.b)) + '</td><td>' + (x.agree ? 'Yes' : 'No') + '</td><td>' + esc(cell(x.truth)) + '</td></tr>';
      }).join('');
      if (r.agree === n && r.right === n) { cls = 'ok'; msg = 'Same verdict on every summary, for the same reasons, and right every time. Each check is something you can point to.'; }
      else if (r.agree === n) { cls = 'bad'; msg = 'They agree on all ' + n + ' now, and both are wrong on ' + (n - r.right) + '. Nobody wrote the check that would catch it. Agreement is not the same as right.'; }
      else if (!written.length) { cls = 'bad'; msg = 'They split on ' + (n - r.agree) + ' of ' + n + '. Each reader fills "helpful" with their own taste: A with length, B with names. Neither noticed the invented item.'; }
      else msg = 'Better: they now split on ' + (n - r.agree) + ' of ' + n + '. Look at the rows where they differ: which thing is each one still judging by taste?';
      v.className = 'verdict' + (cls ? ' ' + cls : ''); v.textContent = msg;
    }
    root.addEventListener('change', function (e) {
      var id = e.target.dataset.chk; if (!id) return;
      st.on[id] = e.target.checked; update(); $('[data-chk="' + id + '"]', root).focus();
    });
    update();
  };

  // ---------- Track 5: a judge that leans, and what a fix does ----------
  function jbOther(x) { return x === 'a' ? 'b' : 'a'; }
  function jbLean(demo, c) { return demo.rule === 'first' ? c.first : demo.rule === 'longer' ? (c.a.w >= c.b.w ? 'a' : 'b') : (c.a.own ? 'a' : 'b'); }
  function jbPick(demo, c, mode) { // 'a', 'b' or 'tie'
    var lean = jbLean(demo, c);
    if (demo.rule === 'first') {
      var w = c.close ? lean : c.better, s = c.close ? jbOther(lean) : c.better;
      return mode === 'written' ? w : mode === 'swapped' ? s : (w === s ? w : 'tie');
    }
    if (mode === 'plain') return c.close ? lean : c.better;
    return c.hard ? jbOther(c.better) : c.better;
  }
  function jbScore(demo, mode) {
    var r = { right: 0, wrong: 0, tie: 0, total: demo.cases.length };
    demo.cases.forEach(function (c) { var p = jbPick(demo, c, mode); if (p === 'tie') r.tie++; else if (p === c.better) r.right++; else r.wrong++; });
    return r;
  }
  WIDGETS._judgeBias = function (L, demoId, mode) { return jbScore(L.demos.filter(function (d) { return d.id === demoId; })[0], mode); };
  WIDGETS.judgebias = function (root, L) {
    var st = mem('judgebias', { d: 0, mode: {} });
    root.innerHTML = '<div class="exs" id="jb-tabs"></div><p class="note" id="jb-intro"></p><fieldset class="seg"><legend>How the judge is run</legend><div id="jb-modes"></div></fieldset>' +
      '<p class="big" id="jb-score" role="status"></p><div class="scroll"><table class="mini"><caption id="jb-cap"></caption><thead><tr><th scope="col">Question</th><th scope="col">Answer 1</th><th scope="col">Answer 2</th><th scope="col">People prefer</th><th scope="col">Judge says</th></tr></thead><tbody id="jb-rows"></tbody></table></div>' +
      '<p class="verdict" id="jb-verdict" role="status"></p>';
    function demo() { return L.demos[st.d]; }
    function modeOf(d) { return st.mode[d.id] || d.modes[0].id; }
    function ans(x) { return esc(x.t) + (x.w ? ' <span class="muted">(' + x.w + ' words)</span>' : '') + (x.m ? ' <span class="muted">(' + esc(x.m) + ')</span>' : ''); }
    function update() {
      var d = demo(), mid = modeOf(d), M = d.modes.filter(function (m) { return m.id === mid; })[0], r = jbScore(d, mid), other = '';
      if (d.rule === 'first') other = jbScore(d, mid === 'swapped' ? 'written' : 'swapped').wrong;
      $('#jb-tabs', root).innerHTML = L.demos.map(function (x, i) { return '<button type="button" data-d="' + i + '"' + (i === st.d ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(x.title) + '</button>'; }).join('');
      $('#jb-intro', root).textContent = d.intro;
      $('#jb-modes', root).innerHTML = d.modes.map(function (m) { return '<label><input type="radio" name="jb-mode" data-mode="' + m.id + '"' + (m.id === mid ? ' checked' : '') + '> ' + esc(m.label) + '</label>'; }).join('');
      $('#jb-score', root).innerHTML = 'The judge agrees with people on <b>' + r.right + '</b> of ' + r.total + (r.wrong ? ', is wrong on ' + r.wrong : '') + (r.tie ? ', undecided on ' + r.tie : '');
      $('#jb-cap', root).textContent = d.rule === 'first' ? 'Six pairs. In the written order, the answer shown first is listed first.' : 'Six pairs of answers to the same question.';
      $('#jb-rows', root).innerHTML = d.cases.map(function (c) {
        var p = jbPick(d, c, mid), one = c.a, two = c.b, say, mark;
        if (d.rule === 'first' && mid === 'swapped') { one = c[jbOther(c.first)]; two = c[c.first]; } else if (d.rule === 'first') { one = c[c.first]; two = c[jbOther(c.first)]; }
        if (p === 'tie') { mark = 'Undecided'; say = 'Undecided: the verdict changed when the order did. A person decides.'; }
        else { mark = p === c.better ? 'Agrees' : 'Wrong'; say = mark + ': ' + c[p].t; }
        return '<tr><th scope="row" style="font-weight:400">' + esc(c.q) + '</th><td>' + ans(one) + '</td><td>' + ans(two) + '</td><td>' + esc(c[c.better].t) + '</td><td>' + esc(say) + '</td></tr>';
      }).join('');
      var v = $('#jb-verdict', root);
      v.className = 'verdict ' + M.tone;
      v.textContent = M.say.replace('{right}', r.right).replace('{wrong}', r.wrong).replace('{tie}', r.tie).replace('{total}', r.total).replace(/\{other\}/g, other);
    }
    root.addEventListener('change', function (e) {
      var m = e.target.dataset.mode; if (!m) return;
      st.mode[demo().id] = m; update(); $('[data-mode="' + m + '"]', root).focus();
    });
    onClick(root, function (d) { if (d.d === undefined) return; st.d = +d.d; update(); $('[data-d="' + st.d + '"]', root).focus(); });
    update();
  };

  // ---------- Track 5: a gate for shipping a change: baseline, pass bar, must-hold cases, reruns ----------
  function sgCompute(L, st) {
    function now(c) { return st.rerun && !c.cand && c.rp >= 2 ? true : c.cand; }
    function before(c) { return st.accepted ? now(c) : c.base; }
    var rows = L.cases.map(function (c) { var b = before(c), n = now(c); return { c: c, b: b, n: n, kind: n && !b ? 'fixed' : !n && b ? 'broke' : !n ? 'still' : 'same' }; });
    var total = rows.length, passNow = rows.filter(function (r) { return r.n; }).length, passBefore = rows.filter(function (r) { return r.b; }).length, rate = passNow / total * 100;
    var broke = rows.filter(function (r) { return r.kind === 'broke'; }), brokeMust = broke.filter(function (r) { return r.c.must; });
    var why = []; if (rate < st.bar) why.push('bar'); if (st.baseline && st.must && brokeMust.length) why.push('must');
    return { rows: rows, total: total, passNow: passNow, passBefore: passBefore, rate: rate, fixed: rows.filter(function (r) { return r.kind === 'fixed'; }).length, broke: broke.length, brokeMust: brokeMust.length, still: rows.filter(function (r) { return r.kind === 'still'; }).length, why: why, decision: why.length ? 'hold' : 'ship' };
  }
  WIDGETS._shipgate = sgCompute;
  WIDGETS.shipgate = function (root, L) {
    var st = mem('shipgate', { bar: 60, must: false, rerun: false, baseline: true, accepted: false, lost: [] });
    root.innerHTML = '<fieldset class="seg"><legend>Rules for shipping this version</legend>' +
      '<label><input type="checkbox" id="sg-baseline"> Keep a baseline: the results of the last version we accepted</label>' +
      '<div class="ctl"><label for="sg-bar">Pass bar: at least <b id="sg-barv"></b> of cases pass</label><input type="range" id="sg-bar" min="40" max="100" step="5"></div>' +
      '<label><input type="checkbox" id="sg-must"> No must-hold case that passed before may fail now</label>' +
      '<label><input type="checkbox" id="sg-rerun"> Rerun a failing case three times, and count it as a pass if it passes at least two</label></fieldset>' +
      '<p class="big" id="sg-decision" role="status"></p><p class="note" id="sg-numbers"></p>' +
      '<div class="scroll"><table class="mini"><caption>Twelve cases, run on the baseline and on this version</caption><thead id="sg-head"></thead><tbody id="sg-rows"></tbody></table></div>' +
      '<div class="row" style="margin-top:10px"><button type="button" class="btn" id="sg-accept" data-a="accept">Accept this version as the new baseline</button><button type="button" class="btn" id="sg-reset" data-a="reset">Back to the first baseline</button></div>' +
      '<p class="verdict" id="sg-verdict" role="status"></p>';
    function title(r) { return '"' + r.c.text + '"'; }
    function update() {
      var g = sgCompute(L, st), v = $('#sg-verdict', root), cls = '', msg, mustRows = g.rows.filter(function (r) { return r.kind === 'broke' && r.c.must; });
      $('#sg-baseline', root).checked = st.baseline; $('#sg-must', root).checked = st.must && st.baseline; $('#sg-must', root).disabled = !st.baseline; $('#sg-rerun', root).checked = st.rerun;
      $('#sg-bar', root).value = st.bar; $('#sg-barv', root).textContent = st.bar + '%';
      $('#sg-decision', root).innerHTML = 'Decision: <b>' + (g.decision === 'ship' ? 'Ship' : 'Hold') + '</b>';
      $('#sg-numbers', root).textContent = (st.baseline ? 'Baseline: ' + g.passBefore + ' of ' + g.total + ' pass. ' : 'No baseline kept. ') + 'This version: ' + g.passNow + ' of ' + g.total + ' (' + Math.round(g.rate) + '%).' + (st.baseline ? ' Fixed ' + g.fixed + ', broke ' + g.broke + ', still failing ' + g.still + '.' : '');
      $('#sg-head', root).innerHTML = '<tr><th scope="col">Case</th><th scope="col">Must hold?</th>' + (st.baseline ? '<th scope="col">Baseline</th>' : '') + '<th scope="col">This version</th>' + (st.baseline ? '<th scope="col">Change</th>' : '') + '</tr>';
      $('#sg-rows', root).innerHTML = g.rows.map(function (r) {
        var label = { fixed: 'Fixed', broke: 'Broke', still: 'Still failing', same: 'Same' }[r.kind], extra = '';
        if (st.rerun && !r.c.cand && r.c.rp !== undefined && !st.accepted) extra = ' (' + r.c.rp + ' of 3 reruns pass)';
        return '<tr' + (r.kind === 'broke' ? ' class="on"' : '') + '><th scope="row" style="font-weight:400">' + esc(r.c.text) + '</th><td>' + (r.c.must ? 'Yes' : 'No') + '</td>' + (st.baseline ? '<td>' + (r.b ? 'Pass' : 'Fail') + '</td>' : '') + '<td>' + (r.n ? 'Pass' : 'Fail') + esc(extra) + '</td>' + (st.baseline ? '<td>' + label + '</td>' : '') + '</tr>';
      }).join('');
      $('#sg-accept', root).disabled = g.decision !== 'ship' || st.accepted; $('#sg-reset', root).disabled = !st.accepted;
      if (st.accepted) {
        cls = st.lost.length ? 'bad' : 'ok';
        msg = st.lost.length ? 'The baseline is now this version, including ' + st.lost.map(function (t) { return '"' + t + '"'; }).join(' and ') + ', which broke. It is part of normal now, so no later run will flag it. Accepting a version accepts everything in it.' : 'The baseline is now this version. Nothing in it was known to be broken.';
      } else if (!st.baseline) {
        cls = g.decision === 'ship' ? 'bad' : ''; msg = g.decision === 'ship' ? 'Shipped on the total alone. Without a baseline the gate cannot tell which cases got worse. (The picture knows that ' + g.broke + ' cases that passed before now fail.)' : 'Held on the total alone. Without a baseline you cannot say whether this version is better or worse than the last one.';
      } else if (g.decision === 'ship') {
        if (g.brokeMust) { cls = 'bad'; msg = 'The rules say ship, but ' + mustRows.map(title).join(' and ') + ' passed before and fails now. The total went up, so a bar on the total let a break through. Turn on the must-hold rule.'; }
        else if (g.broke) { msg = 'Ship, with a trade made in the open: ' + g.fixed + ' cases got better and ' + g.broke + ' got worse, none of them must-hold.'; }
        else { cls = 'ok'; msg = 'Ship. Nothing that passed before fails now.'; }
      } else if (g.why.indexOf('must') >= 0) {
        cls = 'ok'; msg = 'Held, for the right reason: ' + mustRows.map(title).join(' and ') + ' passed before and now ' + (mustRows.length > 1 ? 'fail' : 'fails') + '.';
        if (st.rerun) msg += ' It failed all three reruns, so it is real, not noise.';
        else if (mustRows.some(function (r) { return r.c.rp >= 2; })) msg += ' One of them passes two of three reruns, so it may be noise. Turn on the rerun rule to check.';
      } else {
        msg = 'Held, but only because the total (' + Math.round(g.rate) + '%) is under the bar.' + (g.brokeMust ? ' Lower the bar and it ships with a must-hold case broken. A total on its own is the wrong thing to guard.' : '');
      }
      v.className = 'verdict' + (cls ? ' ' + cls : ''); v.textContent = msg;
    }
    root.addEventListener('change', function (e) {
      var id = e.target.id, sel = '#' + id;
      if (id === 'sg-baseline') st.baseline = e.target.checked; else if (id === 'sg-must') st.must = e.target.checked; else if (id === 'sg-rerun') st.rerun = e.target.checked; else return;
      if (st.accepted) { st.accepted = false; st.lost = []; }
      update(); $(sel, root).focus();
    });
    root.addEventListener('input', function (e) { if (e.target.id !== 'sg-bar') return; st.bar = +e.target.value; if (st.accepted) { st.accepted = false; st.lost = []; } update(); });
    onClick(root, function (d) {
      if (d.a === 'accept') { var g = sgCompute(L, st); st.lost = g.rows.filter(function (r) { return r.kind === 'broke' && r.c.must; }).map(function (r) { return r.c.text; }); st.accepted = true; update(); $('#sg-reset', root).focus(); }
      else if (d.a === 'reset') { st.accepted = false; st.lost = []; update(); $('#sg-accept', root).focus(); }
    });
    update();
  };

  // ---------- cost ----------
// Track 7, Cost and operations. Four toys with made-up numbers. Prices are in toy coins and seconds are toy seconds: not any vendor's.
(function () {
function fmtN(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function r2(x) { return Math.round(x * 100) / 100; }

// ---------- Tokens as cost: a chat, a chat about a document, an agent run ----------
// Every call sends the whole conversation again, so the input of call i is everything before it plus what is new.
function costRun(L, kind, n, docIdx, sizeIdx) {
  var k = L.kinds.filter(function (x) { return x.id === kind; })[0], size = L.sizes[k.group].opts[sizeIdx].tokens, docT = L.docs[docIdx].tokens;
  var rows = [], prev = 0, sumIn = 0, sumOut = 0, sumResent = 0, coins = 0, i, inT, outT, c;
  for (i = 1; i <= n; i++) {
    if (kind === 'agent') { inT = L.sys + L.task + docT + (i - 1) * (L.agentOut + size); outT = i === n ? L.final : L.agentOut; }
    else { inT = L.sys + docT + L.user + (i - 1) * (L.user + size); outT = size; }
    c = inT / 1000 * L.price.inp + outT / 1000 * L.price.out;
    rows.push({ i: i, inT: inT, outT: outT, resent: prev, fresh: inT - prev, coins: c });
    sumIn += inT; sumOut += outT; sumResent += prev; coins += c; prev = inT;
  }
  return { rows: rows, sumIn: sumIn, sumOut: sumOut, sumResent: sumResent, coins: coins };
}
WIDGETS._costRun = costRun;
WIDGETS.costcalc = function (root, L) {
  var st = mem('costcalc', { kind: 'chat', n: 10, doc: 0, size: 0 });
  function kind() { return L.kinds.filter(function (x) { return x.id === st.kind; })[0]; }
  root.innerHTML = '<div class="exs" id="cc-kind"></div>' +
    '<div class="ctl"><label for="cc-n"><span id="cc-nlab"></span> <b id="cc-nv"></b></label><input type="range" id="cc-n" min="1" max="20" step="1"></div>' +
    '<div class="two"><fieldset class="seg" id="cc-doc"></fieldset><fieldset class="seg" id="cc-size"></fieldset></div>' +
    '<p class="legend" style="margin-top:12px"><span><span class="b" style="background:var(--run);border-style:solid;border-color:var(--run)"></span>Earlier text, sent again</span><span><span class="b" style="background:var(--info);border-style:solid;border-color:var(--info)"></span>New input</span><span><span class="b" style="background:var(--ok);border-style:solid;border-color:var(--ok)"></span>The model writes (output)</span></p>' +
    '<div class="bars" id="cc-bars"></div><div class="bars" id="cc-cmp"></div><p class="verdict" id="cc-total" role="status"></p><p class="note" id="cc-note"></p>';
  function drawOpts() {
    var g = kind().group, sz = L.sizes[g];
    $('#cc-doc', root).innerHTML = '<legend>' + esc(L.docLegend) + '</legend>' + L.docs.map(function (d, i) { return '<label><input type="radio" name="cc-doc" data-doc="' + i + '"' + (st.doc === i ? ' checked' : '') + '> ' + esc(d.label) + '</label>'; }).join('');
    $('#cc-size', root).innerHTML = '<legend>' + esc(sz.legend) + '</legend>' + sz.opts.map(function (o, i) { return '<label><input type="radio" name="cc-size" data-size="' + i + '"' + (st.size === i ? ' checked' : '') + '> ' + esc(o.label) + '</label>'; }).join('');
  }
  function seg(coins, max, col, tip) { return '<i style="width:' + (coins / max * 100).toFixed(2) + '%;background:var(' + col + ');border-radius:0" title="' + esc(tip) + '"></i>'; }
  function update() {
    var k = kind(), r = costRun(L, st.kind, st.n, st.doc, st.size), one = costRun(L, st.kind, 1, st.doc, st.size), max = Math.max.apply(null, r.rows.map(function (x) { return x.coins; })), unit = k.unit.toLowerCase();
    $('#cc-kind', root).innerHTML = L.kinds.map(function (x) { return '<button type="button" data-kind="' + x.id + '" aria-pressed="' + (x.id === st.kind) + '"' + (x.id === st.kind ? ' class="on"' : '') + '>' + esc(x.label) + '</button>'; }).join('');
    $('#cc-nlab', root).textContent = k.unitLab; $('#cc-nv', root).textContent = String(st.n);
    $('#cc-bars', root).innerHTML = r.rows.map(function (x) {
      return '<div class="bar" data-row="' + x.i + '"><span class="w">' + esc(k.unit) + ' ' + x.i + '</span><span class="track" style="display:flex">' +
        seg(x.resent / 1000 * L.price.inp, max, '--run', 'Earlier text sent again: ' + fmtN(x.resent) + ' tokens') + seg(x.fresh / 1000 * L.price.inp, max, '--info', 'New input: ' + fmtN(x.fresh) + ' tokens') + seg(x.outT / 1000 * L.price.out, max, '--ok', 'Written by the model: ' + fmtN(x.outT) + ' tokens') +
        '</span><span class="pc">' + r2(x.coins).toFixed(2) + '</span><span></span></div>';
    }).join('');
    $('#cc-cmp', root).innerHTML = '<div class="bar"><span class="w">One answer</span><span class="track"><i style="width:' + (one.coins / r.coins * 100).toFixed(2) + '%"></i></span><span class="pc">' + r2(one.coins).toFixed(2) + '</span><span></span></div>' +
      '<div class="bar"><span class="w">This run</span><span class="track"><i style="width:100%"></i></span><span class="pc">' + r2(r.coins).toFixed(2) + '</span><span></span></div>';
    $('#cc-total', root).textContent = st.n === 1 ? 'One ' + unit + ' costs ' + r2(r.coins).toFixed(2) + ' coins. Nothing has been sent again yet. Slide the number up.' :
      'Total: ' + r2(r.coins).toFixed(2) + ' coins for ' + st.n + ' ' + unit + 's. One answer on its own costs ' + r2(one.coins).toFixed(2) + ', so the whole run costs about ' + (r.coins / one.coins).toFixed(1) + ' times as much.';
    $('#cc-note', root).textContent = 'Tokens sent in over the run: ' + fmtN(r.sumIn) + ', of which ' + fmtN(r.sumResent) + ' (' + Math.round(r.sumResent / r.sumIn * 100) + '%) were earlier text sent again. Tokens the model wrote: ' + fmtN(r.sumOut) + '. Input costs ' + L.price.inp + ' coin and output ' + L.price.out + ' coins per 1,000 tokens in this toy, so ' + Math.round(r.sumOut / 1000 * L.price.out / r.coins * 100) + '% of the bill is the model writing.';
  }
  $('#cc-n', root).value = st.n;
  root.addEventListener('input', function (e) { if (e.target.id === 'cc-n') { st.n = +e.target.value; update(); } });
  root.addEventListener('change', function (e) {
    var d = e.target.dataset; if (d.doc !== undefined) st.doc = +d.doc; else if (d.size !== undefined) st.size = +d.size; else return;
    update();
  });
  onClick(root, function (d) {
    if (!d.kind) return;
    var k = L.kinds.filter(function (x) { return x.id === d.kind; })[0]; st.kind = k.id; st.n = k.n; st.doc = k.doc; st.size = 0;
    $('#cc-n', root).value = st.n; drawOpts(); update(); $('[data-kind="' + st.kind + '"]', root).focus();
  });
  drawOpts(); update();
};

// ---------- Latency: first word and last word on a timeline ----------
// A fixed set-up, a read time that grows with the prompt, a write time that grows with the answer, and one more hop for each earlier call in a row.
function latencyRun(L, inIdx, outIdx, calls, stream) {
  var s = L.speed, inT = L.inputs[inIdx].tokens, outT = L.outputs[outIdx].tokens;
  var read = s.readPer1k * inT / 1000, hop = s.setup + read + s.perToken * s.hopTokens, before = (calls - 1) * hop, write = s.perToken * outT;
  var last = before + s.setup + read + write, firstTok = before + s.setup + read + s.perToken;
  return { before: r2(before), setup: s.setup, read: r2(read), write: r2(write), hop: r2(hop), first: r2(stream ? firstTok : last), last: r2(last) };
}
WIDGETS._latencyRun = latencyRun;
WIDGETS.timeline = function (root, L) {
  var st = mem('timeline', { inp: 0, out: 1, calls: 1, stream: false });
  root.innerHTML = '<div class="two"><fieldset class="seg"><legend>How big is the prompt?</legend>' + L.inputs.map(function (o, i) { return '<label><input type="radio" name="tl-in" data-in="' + i + '"> ' + esc(o.label) + '</label>'; }).join('') + '</fieldset>' +
    '<fieldset class="seg"><legend>How long is the answer?</legend>' + L.outputs.map(function (o, i) { return '<label><input type="radio" name="tl-out" data-out="' + i + '"> ' + esc(o.label) + '</label>'; }).join('') + '</fieldset></div>' +
    '<div class="ctl" style="margin-top:12px"><label for="tl-calls">Calls in a row <b id="tl-callsv"></b></label><input type="range" id="tl-calls" min="1" max="6" step="1">' +
    '<label class="check"><input type="checkbox" id="tl-stream"> Streaming on: show the answer as it is written</label></div>' +
    '<p class="big" id="tl-out" role="status"></p>' +
    '<p class="legend"><span><span class="b" style="background:var(--muted);border-style:solid;border-color:var(--muted)"></span>Earlier calls in a row</span><span><span class="b" style="background:var(--info);border-style:solid;border-color:var(--info)"></span>Set-up</span><span><span class="b" style="background:var(--run);border-style:solid;border-color:var(--run)"></span>Reading the prompt</span><span><span class="b" style="background:var(--ok);border-style:solid;border-color:var(--ok)"></span>Writing the answer</span></p>' +
    '<div class="bars" id="tl-bars"></div><p class="note" id="tl-scale"></p><p class="verdict" id="tl-note"></p>';
  function seg(sec, col, tip) { return sec > 0 ? '<i style="width:' + (sec / L.scale * 100).toFixed(2) + '%;background:var(' + col + ');border-radius:0" title="' + esc(tip) + '"></i>' : ''; }
  function update() {
    var r = latencyRun(L, st.inp, st.out, st.calls, st.stream), parts = [['earlier calls in a row', r.before], ['set-up', r.setup], ['reading the prompt', r.read], ['writing the answer', r.write]], top = parts[0], total = r.before + r.setup + r.read + r.write;
    parts.forEach(function (p) { if (p[1] > top[1]) top = p; });
    $$('input[name="tl-in"]', root).forEach(function (x) { x.checked = +x.dataset.in === st.inp; }); $$('input[name="tl-out"]', root).forEach(function (x) { x.checked = +x.dataset.out === st.out; });
    $('#tl-stream', root).checked = st.stream; $('#tl-callsv', root).textContent = String(st.calls);
    $('#tl-out', root).innerHTML = '<b>' + r.first.toFixed(1) + ' s</b> to the first word, <b>' + r.last.toFixed(1) + ' s</b> to the last';
    $('#tl-bars', root).innerHTML = '<div class="bar"><span class="w">Model</span><span class="track" style="display:flex">' + seg(r.before, '--muted', 'Earlier calls in a row: ' + r.before.toFixed(1) + ' s') + seg(r.setup, '--info', 'Set-up: ' + r.setup.toFixed(1) + ' s') + seg(r.read, '--run', 'Reading the prompt: ' + r.read.toFixed(1) + ' s') + seg(r.write, '--ok', 'Writing the answer: ' + r.write.toFixed(1) + ' s') + '</span><span></span><span></span></div>' +
      '<div class="bar"><span class="w">You see</span><span class="track" style="display:flex"><i style="width:' + (r.first / L.scale * 100).toFixed(2) + '%;background:none;border-radius:0" title="Nothing yet: ' + r.first.toFixed(1) + ' s"></i>' + (r.last > r.first ? '<i style="width:' + ((r.last - r.first) / L.scale * 100).toFixed(2) + '%;background:var(--ok);border-radius:0" title="Words arriving"></i>' : '<i style="width:1.2%;background:var(--ok);border-radius:0" title="Everything at once"></i>') + '</span><span></span><span></span></div>';
    $('#tl-scale', root).textContent = 'The full width is ' + L.scale + ' toy seconds. In the second row, blank space means you are looking at nothing and green means words on the screen.';
    $('#tl-note', root).textContent = 'Most of the wait (' + Math.round(top[1] / total * 100) + '%) is ' + top[0] + '. ' + (st.stream ? 'With streaming on, you can start reading at ' + r.first.toFixed(1) + ' s, while the model keeps writing until ' + r.last.toFixed(1) + ' s.' : 'With streaming off, the first word and the last word arrive together: ' + r.last.toFixed(1) + ' s of nothing, then everything at once.');
  }
  $('#tl-calls', root).value = st.calls;
  root.addEventListener('input', function (e) { if (e.target.id === 'tl-calls') { st.calls = +e.target.value; update(); } });
  root.addEventListener('change', function (e) {
    var t = e.target, d = t.dataset; if (d.in !== undefined) st.inp = +d.in; else if (d.out !== undefined) st.out = +d.out; else if (t.id === 'tl-stream') st.stream = t.checked; else return;
    update();
  });
  update();
};

// ---------- Caching: the same start is reused until something near the top changes ----------
function cacheRun(L, edited, datePos, gapIdx) {
  var order = L.parts.map(function (p) { return { id: p.id, label: p.label, tokens: p.tokens, changed: !!edited[p.id], user: true }; });
  var date = { id: 'date', label: L.dateLine.label, tokens: L.dateLine.tokens, changed: true }, q = { id: 'question', label: L.question.label, tokens: L.question.tokens, changed: true };
  if (datePos === 'start') order.unshift(date); else if (datePos === 'end') order.push(date);
  order.push(q);
  var expired = L.gaps[gapIdx].min > L.lifetime, live = !expired, firstChange = -1, hit = 0, total = 0;
  order.forEach(function (p, i) {
    if (live && p.changed) { live = false; firstChange = i; }
    p.state = live ? 'reused' : (expired ? 'expired' : 'again');
    total += p.tokens; if (live) hit += p.tokens;
  });
  var m = L.mult, sp = L.speed, miss = total - hit, cost1 = total / 1000 * m.write, cost2 = hit / 1000 * m.read + miss / 1000, base = total / 1000;
  return { parts: order, hit: hit, miss: miss, total: total, expired: expired, firstChange: firstChange, cost1: r2(cost1), cost2: r2(cost2), base: r2(base), withC: r2(cost1 + cost2), withoutC: r2(2 * base), time2: r2(hit / 1000 * sp.reused + miss / 1000 * sp.fresh), baseTime: r2(total / 1000 * sp.fresh) };
}
WIDGETS._cacheRun = cacheRun;
WIDGETS.prefixcache = function (root, L) {
  var st = mem('prefixcache', { edited: {}, date: 'end', gap: 0 });
  root.innerHTML = '<div class="two"><fieldset class="seg"><legend>Where does the date and time line go?</legend>' + L.datePlaces.map(function (o) { return '<label><input type="radio" name="pc-date" data-date="' + o.id + '"> ' + esc(o.label) + '</label>'; }).join('') + '</fieldset>' +
    '<fieldset class="seg"><legend>When does the second request come?</legend>' + L.gaps.map(function (o, i) { return '<label><input type="radio" name="pc-gap" data-gap="' + i + '"> ' + esc(o.label) + '</label>'; }).join('') + '</fieldset></div>' +
    '<table class="mini" id="pc-table"><caption>The prompt, from the top down. The first request is sent first and saved. Tick what you changed before the second.</caption><thead><tr><th scope="col">Part of the prompt</th><th scope="col">Tokens</th><th scope="col">Changed for request two?</th><th scope="col">Request two</th></tr></thead><tbody id="pc-rows"></tbody></table>' +
    '<p class="verdict" id="pc-verdict" role="status"></p><p class="note" id="pc-num"></p>';
  function update() {
    var r = cacheRun(L, st.edited, st.date, st.gap), pct = Math.round(r.hit / r.total * 100), first = r.parts[r.firstChange], worse = r.withC > r.withoutC, msg;
    $$('input[name="pc-date"]', root).forEach(function (x) { x.checked = x.dataset.date === st.date; }); $$('input[name="pc-gap"]', root).forEach(function (x) { x.checked = +x.dataset.gap === st.gap; });
    $('#pc-rows', root).innerHTML = r.parts.map(function (p) {
      var edit = p.user ? '<label><input type="checkbox" data-edit="' + p.id + '"' + (st.edited[p.id] ? ' checked' : '') + ' aria-label="Changed: ' + esc(p.label) + '"> changed</label>' : '<span class="muted">always new</span>';
      var tag = p.state === 'reused' ? '<span class="tag go">reused</span>' : p.state === 'expired' ? '<span class="tag">expired, read again</span>' : '<span class="tag">read again</span>';
      return '<tr' + (p.state === 'reused' ? ' class="on"' : '') + ' data-part="' + p.id + '"><th scope="row">' + esc(p.label) + '</th><td>' + fmtN(p.tokens) + '</td><td>' + edit + '</td><td>' + tag + '</td></tr>';
    }).join('');
    if (r.expired) msg = 'The saved copy was gone. In this toy a copy lives ' + L.lifetime + ' minutes, and the second request came after ' + L.gaps[st.gap].min + '. Everything is read again.';
    else if (first.user) msg = 'The first change is "' + first.label + '". That part and everything under it is read again, even the parts you did not touch.' + (r.firstChange === 0 ? ' It is the very top of the prompt, so nothing at all is reused.' : '');
    else if (r.firstChange === 0) msg = 'The date and time line sits at the very top and is new every time, so nothing below it can ever be reused.';
    else msg = 'Only the new text at the end is read again. The long, stable start was reused.';
    if (worse) msg += ' Over these two requests you paid extra to save the first copy and got too little back, so caching costs more than not caching.';
    $('#pc-verdict', root).className = 'verdict ' + (pct >= 80 ? 'ok' : 'bad'); $('#pc-verdict', root).textContent = msg;
    $('#pc-num', root).textContent = 'Reused ' + fmtN(r.hit) + ' of ' + fmtN(r.total) + ' tokens (' + pct + '%). Request two costs ' + r.cost2.toFixed(2) + ' coins instead of ' + r.base.toFixed(2) + ', and reading takes ' + r.time2.toFixed(2) + ' s instead of ' + r.baseTime.toFixed(2) + ' s. Over both requests: ' + r.withC.toFixed(2) + ' coins with caching, ' + r.withoutC.toFixed(2) + ' without. Saving the first copy costs ' + Math.round((L.mult.write - 1) * 100) + '% extra and a reused token ' + Math.round(L.mult.read * 100) + '% of normal in this toy.';
  }
  root.addEventListener('change', function (e) {
    var d = e.target.dataset, sel;
    if (d.edit) { st.edited[d.edit] = e.target.checked; sel = '[data-edit="' + d.edit + '"]'; } else if (d.date) { st.date = d.date; sel = '[data-date="' + d.date + '"]'; } else if (d.gap !== undefined) { st.gap = +d.gap; sel = '[data-gap="' + d.gap + '"]'; } else return;
    update(); var b = $(sel, root); if (b) b.focus();
  });
  update();
};

// ---------- Choosing a model size: assign a size to each job, then test ----------
function routeRun(L, assign) {
  var cost = 0, vol = 0, secs = 0, passN = 0, failing = [], fixable = [];
  L.tasks.forEach(function (t) {
    var a = t.r[assign[t.id]], ok = a[0] >= L.bar;
    cost += t.vol * a[1]; secs += t.vol * a[2]; vol += t.vol;
    if (ok) passN++; else { failing.push(t.id); if (['s', 'm', 'l'].some(function (z) { return t.r[z][0] >= L.bar; })) fixable.push(t.id); }
  });
  return { cost: Math.round(cost), secs: r2(secs / vol), passN: passN, failing: failing, fixable: fixable };
}
function routeBest(L) {
  var out = {};
  L.tasks.forEach(function (t) { out[t.id] = ['s', 'm', 'l'].filter(function (z) { return t.r[z][0] >= L.bar; })[0] || 'l'; });
  return out;
}
WIDGETS._routeRun = routeRun; WIDGETS._routeBest = routeBest;
WIDGETS.router = function (root, L) {
  var st = mem('router', { a: {}, tested: false });
  L.tasks.forEach(function (t) { if (!st.a[t.id]) st.a[t.id] = 'l'; });
  function allOf(z) { var o = {}; L.tasks.forEach(function (t) { o[t.id] = z; }); return o; }
  root.innerHTML = '<p class="note" style="margin:0 0 8px">Your bar: at least ' + L.bar + ' of ' + L.of + ' test cases right for a job. (Made up. Set your own.)</p>' +
    '<div class="row" style="margin:0 0 10px"><button type="button" class="btn" data-a="large">Everything on Large</button><button type="button" class="btn" data-a="small">Everything on Small</button><button type="button" class="btn primary" data-a="test">Run my test set</button><button type="button" class="btn" data-a="best">Use the cheapest mix that passes</button></div>' +
    '<div id="rt-body"></div><div class="stat" id="rt-stat"></div><p class="verdict" id="rt-verdict" role="status"></p><p class="note" id="rt-note"></p>';
  function update() {
    var r = routeRun(L, st.a), big = routeRun(L, allOf('l')), best = routeRun(L, routeBest(L));
    $('#rt-body', root).innerHTML = L.tasks.map(function (t) {
      var a = t.r[st.a[t.id]], pass = a[0] >= L.bar, line = 'Cost per request ' + a[1] + ' coins · wait ' + a[2] + ' s' + (st.tested ? ' · ' : ''), tag = '';
      if (st.tested) tag = pass ? '<span class="tag go">passes: ' + a[0] + ' of ' + L.of + '</span> ' : '<span class="tag">below your bar: ' + a[0] + ' of ' + L.of + '</span> ';
      return '<fieldset class="seg" style="margin-top:8px"><legend>' + esc(t.text) + ' · ' + fmtN(t.vol) + ' requests a month</legend><div class="row" style="margin:0">' + L.sizes.map(function (z) {
        return '<label><input type="radio" name="rt-' + t.id + '" data-task="' + t.id + '" data-size="' + z.id + '"' + (st.a[t.id] === z.id ? ' checked' : '') + '> ' + z.label + (st.tested ? ': ' + t.r[z.id][0] + ' of ' + L.of : '') + '</label>';
      }).join('') + '</div><p class="note" style="margin:4px 0 0">' + line + tag + (st.tested ? esc(t.why) : '') + '</p></fieldset>';
    }).join('');
    $('#rt-stat', root).innerHTML = '<span>Monthly cost <b>' + fmtN(r.cost) + '</b> coins (' + Math.round(r.cost / big.cost * 100) + '% of everything on Large)</span><span>Average wait <b>' + r.secs.toFixed(1) + '</b> s</span><span>Passing your bar <b>' + (st.tested ? r.passN + ' of ' + L.tasks.length : 'not tested') + '</b></span>';
    var v = $('#rt-verdict', root), names = function (ids) { return ids.map(function (id) { return L.tasks.filter(function (t) { return t.id === id; })[0].short; }).join(', '); }, stuck = r.failing.filter(function (id) { return r.fixable.indexOf(id) < 0; });
    if (!st.tested) { v.className = 'verdict'; v.textContent = 'You can see cost and wait, but not quality. A cheaper mix is only a saving if it still passes on your own cases. Run your test set before you trust any of this.'; }
    else if (r.fixable.length) { v.className = 'verdict bad'; v.textContent = r.fixable.length + (r.fixable.length === 1 ? ' job is' : ' jobs are') + ' wrong too often at the size you chose: ' + names(r.fixable) + '. A bigger size passes for ' + (r.fixable.length === 1 ? 'it' : 'each') + '.'; }
    else { v.className = 'verdict ok'; v.textContent = 'Every job that can pass your bar does pass.' + (stuck.length ? ' ' + names(stuck) + ' fails on every size: a bigger size is not the fix there. Narrow the job, add a check, or keep a person on it.' : ''); }
    $('#rt-note', root).textContent = st.tested ? 'For comparison, the cheapest mix that passes your bar costs ' + fmtN(best.cost) + ' coins a month (' + Math.round(best.cost / big.cost * 100) + '% of everything on Large), with an average wait of ' + best.secs.toFixed(1) + ' s.' : 'Everything on Large costs ' + fmtN(big.cost) + ' coins a month in this toy.';
    $('[data-a="best"]', root).disabled = !st.tested;
  }
  root.addEventListener('change', function (e) {
    var d = e.target.dataset; if (!d.task || !d.size) return;
    st.a[d.task] = d.size; update(); $('[data-task="' + d.task + '"][data-size="' + d.size + '"]', root).focus();
  });
  onClick(root, function (d) {
    if (d.a === 'large') st.a = allOf('l'); else if (d.a === 'small') st.a = allOf('s'); else if (d.a === 'test') st.tested = true; else if (d.a === 'best') st.a = routeBest(L); else return;
    update(); $('[data-a="' + d.a + '"]', root).focus();
  });
  update();
};
})();

  // @@WIDGETS (new pictures are added above this line)
})();
