// AI Academy checks, run in a real browser (headless Chromium through Playwright).
//   node tests/run.js
// The app itself needs nothing installed. Only this script needs Node and Playwright.
// It opens index.html from disk (file://), exactly as a double-click would, and fails if the page asks for anything over the network.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..'), URL = 'file://' + path.join(ROOT, 'index.html');

let pass = 0, fail = 0; const failures = [];
function ok(cond, name, extra) { if (cond) pass++; else { fail++; failures.push(name + (extra !== undefined ? '  [' + extra + ']' : '')); console.log('  FAIL  ' + name + (extra !== undefined ? '  [' + extra + ']' : '')); } }
function eq(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), name, 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
function section(s) { console.log('\n' + s); }

async function open(browser, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1100, height: 850 }, acceptDownloads: true }, opts || {}));
  const page = await ctx.newPage(); page.errors = []; page.net = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith('file://') && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) page.net.push(r.url()); });
  await page.goto(URL);
  return page;
}
const D = (page, fn, arg) => page.evaluate(fn, arg);
const goLesson = (page, t, c) => page.evaluate(([t, c]) => { const s = ACADEMY_DEBUG.state(); s.pos.space = 'learn'; ACADEMY_DEBUG.go(2, t, c); }, [t, c]);
const text = (page, sel) => page.locator(sel).innerText();
const setRange = (page, sel, v) => page.locator(sel).evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);

(async () => {
  const browser = await chromium.launch();

  // ------------------------------------------------------------------ static rules
  section('Static rules: offline, no secrets, nothing company-specific');
  const files = ['index.html', 'style.css', 'content.js', 'widgets.js', 'widgets-extra.js', 'app.js'];
  const src = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  ok(!/<(script|link|img|iframe)[^>]+(src|href)="(https?:)?\/\//i.test(src['index.html']), 'index.html loads nothing from the network');
  ok(!/@import|url\(\s*['"]?https?:/i.test(src['style.css']), 'style.css loads nothing from the network');
  for (const f of ['content.js', 'widgets.js', 'widgets-extra.js', 'app.js']) ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts)\b\s*\(/.test(src[f]) && !/new\s+(XMLHttpRequest|WebSocket|EventSource)/.test(src[f]), f + ' makes no network calls');
  const all = fs.readdirSync(ROOT).filter(f => /\.(js|html|css|md)$/.test(f)).map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + fs.readFileSync(path.join(ROOT, 'content/SOURCES.md'), 'utf8');
  ok(!/\bRBC\b|Royal Bank/i.test(all), 'no employer or bank is named anywhere');
  ok(!/(api[_-]?key|secret|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}/i.test(all) && !/sk-[A-Za-z0-9]{20,}/.test(all), 'no key or secret in the repo files');

  // ------------------------------------------------------------------ content shape
  section('Content: every lesson has the full shape and a source for each id');
  let page = await open(browser);
  const shape = await D(page, () => {
    const A = ACADEMY, out = { lessons: Object.keys(A.lessons), bad: [], ids: [], tracks: A.tracks.map(t => t.concepts.filter(c => A.lessons[c.id]).length) };
    const has = id => A.sources.some(s => s.id === id);
    for (const [id, L] of Object.entries(A.lessons)) {
      if (!(L.idea && L.tryit && L.tryNote && L.agile && L.tools && L.under && L.under.p && L.read.length >= 3)) out.bad.push(id + ': missing a part');
      if (L.quiz.length !== 4) out.bad.push(id + ': not four questions');
      L.quiz.forEach(q => { out.ids.push(q.id); if (!(q.opts.length === 4 && q.a >= 0 && q.a < 4 && q.why)) out.bad.push(q.id + ': bad question'); });
      if (!WIDGETS[L.widget]) out.bad.push(id + ': no widget');
      if (!L.src.length || !L.src.every(has)) out.bad.push(id + ': source missing');
      const words = [L.idea, L.agile, L.tools, L.under.p].concat(L.read.map(r => r.p)).join(' ').split(/\s+/).length; if (words > 900) out.bad.push(id + ': too long for ten minutes (' + words + ' words)');
    }
    const R = A.roles; R.nodes.forEach(n => { if (!(n.one && n.heading && n.read.length >= 2 && n.src.every(has))) out.bad.push('role ' + n.id); });
    R.families.forEach(f => f.quiz.forEach(q => { out.ids.push(q.id); if (!(q.opts.length === 4 && q.a >= 0 && q.a < 4 && q.why)) out.bad.push(q.id); }));
    out.dupe = out.ids.length !== new Set(out.ids).size; out.roles = R.nodes.length; out.forecast = R.nodes.filter(n => n.forecast).length;
    return out;
  });
  eq(shape.bad, [], 'all lessons, roles and questions are well formed');
  ok(shape.lessons.length >= 22, 'at least twenty-two lessons', shape.lessons.length);
  eq(shape.tracks.slice(0, 3), [5, 6, 5], 'track 1 has five lessons, track 2 has six, track 3 has five');
  ok(shape.tracks[8] >= 6, 'track 9 (Agile x AI, AI-DLC) has at least six lessons', shape.tracks[8]);
  ok(!shape.dupe, 'question ids are unique');
  const md = fs.readFileSync(path.join(ROOT, 'content/SOURCES.md'), 'utf8');
  const srcIds = await D(page, () => ACADEMY.sources.map(s => s.id));
  ok(srcIds.every(id => new RegExp('\\| ' + id + ' \\|').test(md)), 'every source id used in the app is listed in content/SOURCES.md', srcIds.filter(id => !new RegExp('\\| ' + id + ' \\|').test(md)).join(','));

  // ------------------------------------------------------------------ map and zoom
  section('Map and zoom');
  eq(await page.locator('#L0 .tcard').count(), 9, 'the map shows nine tracks');
  ok(/5 lessons ready/.test(await text(page, '#L0 .tcard >> nth=0')) && /6 lessons ready/.test(await text(page, '#L0 .tcard >> nth=1')), 'tracks 1 and 2 are marked ready');
  await page.click('#L0 .tcard >> nth=0');
  eq(await D(page, () => ACADEMY_DEBUG.state().pos.zoom), 1, 'tapping a track zooms to Track');
  eq(await page.locator('#L1 .node:not([disabled])').count(), 5, 'track 1 lists five open lessons');
  await page.keyboard.press('+'); await page.keyboard.press('+');
  eq(await D(page, () => ACADEMY_DEBUG.state().pos.zoom), 3, 'the + key zooms in to Detail');
  ok((await text(page, '#L3')).includes('Under the hood') && (await text(page, '#L3')).includes('Sources'), 'Detail shows the layer underneath and the sources');
  eq(await D(page, () => document.activeElement.tagName), 'H1', 'after a zoom, keyboard focus lands on the heading');
  const fs0 = await D(page, () => parseFloat(getComputedStyle(document.querySelector('#L3 .article')).fontSize));
  await page.click('#L3 [data-act="bigger"]');
  ok(await D(page, () => parseFloat(getComputedStyle(document.querySelector('#L3 .article')).fontSize)) > fs0 && fs0 >= 20, 'Read more is in big type and A+ makes it bigger');
  await page.keyboard.press('-'); await page.keyboard.press('-'); await page.keyboard.press('-');
  eq(await D(page, () => ACADEMY_DEBUG.state().pos.zoom), 0, 'the - key zooms back out to the Map');
  eq(await D(page, () => [...document.querySelectorAll('.layer')].map(l => l.inert)), [false, true, true, true], 'layers you are not on are inert, so Tab cannot wander into them');

  // ------------------------------------------------------------------ the pictures you can poke
  section('Track 1 pictures');
  await goLesson(page, 'models', 'tokens');
  await page.fill('#tk-in', 'We plan the sprint.');
  ok(await page.locator('#tk-chips .tok').count() >= 4, 'tokens: typing makes token chips');
  await page.click('#widget [data-ex="1"]');
  ok(await page.locator('#tk-chips .tok').count() > 5, 'tokens: a rare word splits into many pieces');

  await goLesson(page, 'models', 'context');
  ok((await page.locator('#cx-verdict').getAttribute('class')).includes('ok'), 'context: at the start the codename is still in the window');
  await setRange(page, '#cx-turns', 9); await setRange(page, '#cx-win', 80);
  ok((await page.locator('#cx-verdict').getAttribute('class')).includes('bad') && await page.locator('#cx-chat .msg.out').count() > 0, 'context: a long chat in a small window drops the oldest turns and the codename');
  ok(await D(page, () => !document.querySelector('#cx-chat .msg:last-child').classList.contains('out')), 'context: the newest message always stays');
  await setRange(page, '#cx-win', 140); await page.check('#cx-sum');
  ok((await page.locator('#cx-verdict').getAttribute('class')).includes('ok') && await page.locator('#cx-chat .msg.sum').count() === 1, 'context: a summary of the dropped turns brings the codename back');
  ok(await D(page, () => { const m = /(\d+) of (\d+) toy tokens/.exec(document.querySelector('#cx-used').textContent); return +m[1] <= +m[2]; }), 'context: what is kept never exceeds the window');

  await goLesson(page, 'models', 'nexttoken');
  const sm = await D(page, () => { const l = [3.2, 2.4, 1.5, 1.3, 0.4, -1.5], s = T => WIDGETS._softmax(l, T); const sum = a => a.reduce((x, y) => x + y, 0); return { s1: sum(s(1)), s0: s(0), top05: s(0.5)[0], top1: s(1)[0], top2: s(2)[0], exact: Math.abs(s(1)[0] - Math.exp(3.2) / sum(l.map(Math.exp))) }; });
  ok(Math.abs(sm.s1 - 1) < 1e-9 && sm.exact < 1e-9, 'next token: softmax matches the formula and sums to 1');
  eq(sm.s0, [1, 0, 0, 0, 0, 0], 'next token: temperature 0 always takes the top one');
  ok(sm.top05 > sm.top1 && sm.top1 > sm.top2, 'next token: lower temperature sharpens, higher flattens');
  await setRange(page, '#nt-t', 0); await page.click('#widget [data-n="20"]');
  ok(/20 picks, 1 different word/.test(await text(page, '#nt-sum')), 'next token: twenty picks at temperature 0 give one word');
  await page.click('#widget [data-n="0"]'); await setRange(page, '#nt-t', 2);
  await D(page, () => { let i = 0; Math.random = () => ((i++ * 0.37) % 1); }); // a fixed sequence, so the check is repeatable
  await page.click('#widget [data-n="20"]');
  ok(+/(\d+) different/.exec(await text(page, '#nt-sum'))[1] >= 3, 'next token: twenty picks at temperature 2 give several different words');

  await goLesson(page, 'models', 'training');
  await page.click('#widget [data-start="team"]');
  ok(/Train it first/.test(await text(page, '#tr-out')), 'training: an untrained model has nothing to say');
  await page.click('#widget [data-a="train"]');
  ok(/trained on \d+ words/.test(await text(page, '#tr-state')) && await page.locator('#tr-weights tr').count() >= 3, 'training: Train fills the table of what followed what');
  await page.click('#widget [data-start="team"]');
  ok(/^team \w+/.test(await text(page, '#tr-out')), 'training: using it continues the sentence from what it learned');
  await page.click('#widget [data-start="cook"]');
  ok(/not in its training text/.test(await text(page, '#tr-out')), 'training: a word it never saw is outside what it knows');
  const before = await D(page, () => document.querySelector('#tr-weights').innerHTML);
  await page.fill('#tr-text', 'The cook chops the onions.'); await page.click('#widget [data-start="cook"]');
  ok(before === await D(page, () => document.querySelector('#tr-weights').innerHTML) && /text changed since training/.test(await text(page, '#tr-state')) && /Changes to its weights from using it: 0/.test(await text(page, '#tr-note')), 'training: using it, or editing the text, does not change the weights until you retrain');
  await page.click('#widget [data-a="train"]'); await page.click('#widget [data-start="cook"]');
  ok(/^cook \w+/.test(await text(page, '#tr-out')), 'training: after retraining it knows the new word');

  await goLesson(page, 'models', 'wrong');
  await page.click('#widget [data-q="1"]');
  ok(/42 points/.test(await text(page, '#wr-chat')), 'sure and wrong: made to always answer, it invents a number in a confident voice');
  await page.click('#wr-check');
  ok(/Invented/.test(await text(page, '#wr-verdict')), 'sure and wrong: checking against the page shows it was invented');
  await page.check('#widget input[value="idk"]'); await page.click('#widget [data-q="1"]');
  ok(/do not know/.test(await text(page, '#wr-chat')), 'sure and wrong: allowed to abstain, it says it does not know');
  eq(await D(page, () => [...document.querySelectorAll('#wr-score tbody tr')].map(r => [...r.querySelectorAll('td')].slice(3).map(td => +td.textContent))), [[3, 0], [3, 3], [3, 3]], 'sure and wrong: bluffing scores the same when wrong answers are free, and worse when they cost');

  section('Track 2 pictures');
  await goLesson(page, 'prompting', 'parts');
  ok(/1 of 6/.test(await text(page, '#pt-score')), 'parts: with only the task, the rubric finds one part');
  for (const id of ['role', 'context', 'format', 'constraints', 'example']) await page.check('#widget [data-part="' + id + '"]');
  ok(/6 of 6/.test(await text(page, '#pt-score')) && (await text(page, '#pt-prompt')).startsWith('You are'), 'parts: with all six on, the rubric finds six and the prompt reads as a brief');
  const single = await D(page, () => ACADEMY.lessons.parts.parts.map(p => WIDGETS._score(p.text + '\n\n' + ACADEMY.lessons.parts.material).parts.filter(x => x.ok).map(x => x.id).join()));
  eq(single, ['role', 'task', 'context', 'format', 'constraints', 'example'], 'parts: each part on its own ticks only its own rubric line');

  await goLesson(page, 'prompting', 'examples');
  ok(/7 of 7/.test(await text(page, '#nw-count')), 'show, do not tell: seven readings fit the bare request');
  for (const i of [0, 1, 2]) await page.check('#widget [data-tell="' + i + '"]');
  ok(/5 of 7/.test(await text(page, '#nw-count')), 'show, do not tell: three adjectives still leave five readings');
  await page.check('#widget [data-show="0"]');
  ok(/2 of 7/.test(await text(page, '#nw-count')), 'show, do not tell: one example leaves two (it may copy "medium")');
  await page.check('#widget [data-show="1"]');
  ok(/1 of 7/.test(await text(page, '#nw-count')) && /\(high\)/.test(await text(page, '#nw-cands li:not(.out)')), 'show, do not tell: two varied examples leave one');

  await goLesson(page, 'prompting', 'roles');
  const r0 = await text(page, '#rp-chat'); await page.click('#widget [data-v="2"]');
  ok(r0 !== await text(page, '#rp-chat') && /loan/.test(await text(page, '#rp-chat')), 'roles: a different role gives a different voice');

  await goLesson(page, 'prompting', 'format');
  await page.click('#widget [data-f="3"]');
  ok(/parser stopped/.test(await text(page, '#fp-checks')), 'format: JSON asked for loosely comes wrapped in chat and does not parse');
  await page.click('#widget [data-f="4"]');
  ok(/parsed 3 items/.test(await text(page, '#fp-checks')), 'format: JSON asked for precisely parses');
  await page.click('#widget [data-f="2"]');
  eq(await page.locator('#fp-out table tbody tr').count(), 3, 'format: the table has three rows');

  await goLesson(page, 'prompting', 'iterate');
  ok(/0 of 4/.test(await text(page, '#it-count')), 'iterate: the first draft passes no test case');
  for (const id of ['who', 'list', 'none']) await page.check('#widget [data-fix="' + id + '"]');
  ok(/4 of 4/.test(await text(page, '#it-count')), 'iterate: three targeted changes pass all four');
  await page.check('#widget [data-fix="creative"]');
  ok(/2 of 4/.test(await text(page, '#it-count')) && /regression/i.test(await text(page, '#it-log')), 'iterate: "be creative" breaks two cases and the log calls it a regression');

  section('Track 3 pictures');
  await goLesson(page, 'agents', 'tooluse');
  ok(/tool request/.test(await text(page, '#tu-trace')) && /7,006,652/.test(await text(page, '#tu-trace')) && (await page.locator('#tu-verdict').getAttribute('class')).includes('ok'), 'tool use: with the calculator on, the model asks, the app runs the sum, and the answer is right');
  eq(await D(page, () => [WIDGETS._calc('1234 * 5678'), WIDGETS._calc('2 + 2'), WIDGETS._calc('alert(1)')]), ['7006652', '4', 'error'], 'tool use: the calculator really calculates, and runs nothing else');
  await page.uncheck('#widget [data-tool="calc"]');
  ok(/7,006,552/.test(await text(page, '#tu-trace')) && !/tool request/.test(await text(page, '#tu-trace')) && (await page.locator('#tu-verdict').getAttribute('class')).includes('bad'), 'tool use: without it, the model answers from memory, close and wrong');
  await page.click('#widget [data-q="1"]');
  ok(/In review/.test(await text(page, '#tu-trace')), 'tool use: the ticket lookup returns the real status');
  await page.uncheck('#widget [data-tool="ticket"]');
  ok(/In progress/.test(await text(page, '#tu-trace')) && /Invented/.test(await text(page, '#tu-verdict')), 'tool use: without the lookup, the status is invented');
  await page.check('#widget [data-tool="ticket"]'); await page.check('#widget [data-tool="calc"]'); await page.click('#widget [data-q="2"]');
  ok(!/tool request/.test(await text(page, '#tu-trace')) && /No tool was needed/.test(await text(page, '#tu-verdict')), 'tool use: a haiku needs no tool, so none is called');

  await goLesson(page, 'agents', 'loop');
  await page.click('#widget [data-a="step"]'); await page.click('#widget [data-a="step"]');
  eq(await page.locator('#lp-trace li').count(), 2, 'agent loop: each press adds one think, act, observe step');
  const w2 = await D(page, () => +/about (\d+) of/.exec(document.querySelector('#lp-used').textContent)[1]);
  await page.click('#widget [data-a="run"]');
  ok(await page.locator('#lp-trace li').count() === 7 && /All 12 tests passed/.test(await text(page, '#lp-trace')) && (await page.locator('#lp-verdict').getAttribute('class')).includes('ok'), 'agent loop: run to the end finishes in seven steps with the tests passing');
  ok(await D(page, () => +/about (\d+) of/.exec(document.querySelector('#lp-used').textContent)[1]) > w2, 'agent loop: the window grows with every step');
  await page.click('#widget [data-a="reset"]'); await setRange(page, '#lp-max', 4); await page.click('#widget [data-a="run"]');
  ok(await page.locator('#lp-trace li').count() === 4 && /half-done/.test(await text(page, '#lp-verdict')) && await page.locator('#widget [data-a="step"]').isDisabled(), 'agent loop: a step limit of four stops it with a half-done change');
  await page.click('#widget [data-a="reset"]'); await setRange(page, '#lp-max', 2); await page.click('#widget [data-a="run"]');
  ok(/Nothing has been changed yet/.test(await text(page, '#lp-verdict')), 'agent loop: stopped before any edit, nothing is left half done');

  await goLesson(page, 'agents', 'planning');
  ok((await page.locator('#pl-order').getAttribute('class')).includes('bad') && (await page.locator('#pl-gate').getAttribute('class')).includes('bad'), 'planning: the starting order is broken and the deploy has no approval');
  const moveTo = async (label, target) => { for (let k = 0; k < 6; k++) { const i = await D(page, l => [...document.querySelectorAll('#pl-list .txt')].findIndex(x => x.textContent === l), label); if (i === target) return; await page.click('#widget [data-' + (i > target ? 'up' : 'down') + '="' + i + '"]'); } };
  await moveTo('Read the existing reports code', 0); await moveTo('Deploy to the live site', 4); await moveTo('Run the tests', 3);
  ok((await page.locator('#pl-order').getAttribute('class')).includes('ok'), 'planning: with read first, tests after the code, and deploy last, the order works');
  eq(await D(page, () => [WIDGETS._planProblems(['read', 'code', 'write', 'test', 'deploy']), WIDGETS._planProblems(['read', 'write', 'code', 'test', 'deploy']), WIDGETS._planProblems(['read', 'test', 'write', 'code', 'deploy'])]), [0, 0, 2], 'planning: more than one order is valid, and tests before code is not');
  await page.check('#widget [data-gate="deploy"]');
  ok((await page.locator('#pl-gate').getAttribute('class')).includes('ok'), 'planning: a person approving the deploy is enough');
  for (const id of ['read', 'write', 'code']) await page.check('#widget [data-gate="' + id + '"]');
  ok(/bottleneck/.test(await text(page, '#pl-gate')), 'planning: approvals on everything make you the bottleneck');
  ok(await D(page, () => !!document.activeElement.dataset.gate), 'planning: focus stays on the control you used');

  await goLesson(page, 'agents', 'memory');
  await page.click('#widget [data-a="new"]');
  ok(/We release on Thursdays/.test(await text(page, '#widget .msg.sum')) && !/British/.test(await text(page, '#widget .msg.sum')), 'memory: the new session starts with only what was saved');
  await page.click('#widget [data-ask="day"]');
  ok(/Thursdays/.test(await text(page, '#widget .msg.model')) && (await page.locator('#mm-verdict').getAttribute('class')).includes('ok'), 'memory: a saved fact is answered from the notes');
  await page.click('#widget [data-ask="spell"]');
  ok(/do not have that/.test(await text(page, '#widget .msg.model')), 'memory: an unsaved fact is gone');
  await page.check('#widget [data-change]'); await page.click('#widget [data-ask="day"]');
  ok(/Thursdays/.test(await text(page, '#widget .msg.model')) && /Stale/.test(await text(page, '#mm-verdict')), 'memory: when the facts change and the notes do not, the answer is stale');
  await page.click('#widget [data-a="back"]'); await page.check('#widget [data-save="secret"]');
  ok(await page.locator('#mm-secret').isVisible(), 'memory: saving a password to the notes raises a warning');

  await goLesson(page, 'agents', 'agentfail');
  ok(/36%/.test(await text(page, '#ch-out')), 'where agents fail: 95% a step over 20 steps is about 36%');
  eq(await D(page, () => [WIDGETS._chain(0.95, 20, false), WIDGETS._chain(1, 40, false), WIDGETS._chain(0.9, 1, true)].map(x => +x.toFixed(4))), [0.3585, 1, 0.99], 'where agents fail: the sum is p to the power n, and a retry turns 90% into 99%');
  eq(await page.locator('#ch-dots i.ok').count(), 36, 'where agents fail: 36 of the 100 dots are good runs');
  await page.check('#ch-check');
  ok(/95%/.test(await text(page, '#ch-out')), 'where agents fail: a check and one retry on each step lifts 36% to about 95%');
  await setRange(page, '#ch-n', 1); await page.uncheck('#ch-check');
  ok(/95%/.test(await text(page, '#ch-out')), 'where agents fail: one step is just the single-step rate');

  // ------------------------------------------------------------------ track 9: AI-DLC
  section('Track 9: AI-DLC');
  await goLesson(page, 'agile', 'aidlc');
  eq(await page.locator('#tm-pick button').count(), 6, 'AI-DLC terms: six classic words to pick from');
  await page.click('#widget [data-t="0"]');
  ok(/Bolt/.test(await text(page, '#tm-card')) && /AWS says/.test(await text(page, '#tm-card')), 'AI-DLC terms: a sprint becomes a bolt, marked as what AWS says');
  await page.click('#widget [data-t="3"]');
  ok(/Mob Elaboration/.test(await text(page, '#tm-card')) && /My mapping/.test(await text(page, '#tm-card')), 'AI-DLC terms: the refinement pairing is marked as my mapping, not AWS');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.t === '3'), 'AI-DLC terms: focus stays on the word you picked');

  await goLesson(page, 'agile', 'aigates');
  ok((await page.locator('#gt-verdict').getAttribute('class')).includes('ok') && /record/i.test(await text(page, '#gt-trace')), 'gates on: the AI asks, builds what was needed and keeps a record');
  await page.uncheck('#gt-on');
  ok((await page.locator('#gt-verdict').getAttribute('class')).includes('bad') && /printable/.test(await text(page, '#gt-trace')), 'gates off: the AI guesses a printable page and the calendar need is missed');
  await page.check('#widget [data-need="pdf"]');
  ok(!(await page.locator('#gt-verdict').getAttribute('class')).includes('bad') && /luck/.test(await text(page, '#gt-verdict')), 'gates off: a matching guess is called luck, with no record');

  await goLesson(page, 'agile', 'aiphases');
  await page.check('#widget [data-card="i1"][data-b="draft"]');
  ok(/1 of 1/.test(await text(page, '#wd-score')), 'phases: a match with my sorting is counted');
  await page.check('#widget [data-card="i2"][data-b="ai"]');
  ok(/1 of 2/.test(await text(page, '#wd-score')) && /A person decides/.test(await text(page, '#wd-body')), 'phases: a different choice is shown my sorting and the reason');
  await page.click('#widget [data-p="2"]');
  ok(/Operations/.test(await text(page, '#wd-score')) && await page.locator('#wd-body fieldset').count() === 4, 'phases: the Operations tab shows its own four tasks');
  eq(await D(page, () => { const L = ACADEMY.lessons.aiphases, ids = [], b = L.buckets.map(x => x.id); let bad = 0; L.phases.forEach(p => p.cards.forEach(c => { ids.push(c.id); if (b.indexOf(c.to) < 0) bad++; })); return [ids.length, new Set(ids).size, bad]; }), [12, 12, 0], 'phases: twelve tasks, unique ids, each sorted into a real bucket');

  await goLesson(page, 'agile', 'airollout');
  ok((await page.locator('#pl-order').getAttribute('class')).includes('bad') && (await page.locator('#pl-gate').getAttribute('class')).includes('bad'), 'rollout: the starting order is broken and widening has no approval');
  ok(/reaches many people/.test(await text(page, '#pl-gate')), 'rollout: the warning uses its own reason, not the deploy one');
  await page.check('#widget [data-gate="widen"]');
  ok((await page.locator('#pl-gate').getAttribute('class')).includes('ok') && /before the rollout widens/.test(await text(page, '#pl-gate')), 'rollout: a person approving the widening is enough');
  eq(await D(page, () => [WIDGETS._planProblems(['pilot', 'rules', 'setup', 'week', 'retro', 'widen']), WIDGETS._planProblems(['pilot', 'setup', 'rules', 'week', 'retro', 'widen']), WIDGETS._planProblems(['widen', 'week', 'pilot', 'retro', 'setup', 'rules'])]), [0, 1, 3], 'rollout: only the right order has no problems');
  await goLesson(page, 'agents', 'planning');
  ok(/Read the existing reports code|Write the export code/.test(await text(page, '#pl-list')) && !/willing team/.test(await text(page, '#pl-list')), 'rollout and planning keep separate memory of their own steps');

  await goLesson(page, 'agile', 'aievidence');
  await page.check('#widget [data-claim="e1"][data-v="said"]');
  await page.check('#widget [data-claim="e2"][data-v="said"]');
  ok(/1 of 2 right/.test(await text(page, '#cl-score')) && /no study or figures/.test(await text(page, '#cl-body')), 'evidence: marking an unsourced claim as said is wrong, and the reason is shown');
  eq(await D(page, () => ACADEMY.lessons.aievidence.claims.map(c => c.said).filter(Boolean).length), 4, 'evidence: four of the eight statements are said in the sources and four are not');

  await goLesson(page, 'agile', 'airehearse');
  ok(await page.locator('#rh-show').isDisabled(), 'rehearse: the sample answer is locked until you write something');
  await page.fill('#rh-in', 'AI-DLC is a method that makes AI the engine of each step, with people validating.');
  ok(await page.locator('#rh-show').isEnabled(), 'rehearse: writing a sentence unlocks it');
  await page.click('#rh-show');
  ok(/sample answer/i.test(await text(page, '#rh-sample')), 'rehearse: the sample shows after your own answer');
  await page.click('#widget [data-q="1"]');
  ok(await page.locator('#rh-show').isDisabled() && (await page.inputValue('#rh-in')) === '', 'rehearse: the next question starts empty and locked');
  await page.click('#widget [data-q="0"]');
  ok((await page.inputValue('#rh-in')).startsWith('AI-DLC is a method'), 'rehearse: your answer is kept while you move between questions');
  ok(await D(page, () => !/AI-DLC is a method/.test(JSON.stringify(ACADEMY_DEBUG.state()))), 'rehearse: what you write is not saved in your progress');

  // ---------- aidlc2 ----------
section('Track 9, second reading: stages and plans, rules and the audit trail, the facilitator and workshop mode');
await goLesson(page, 'agile', 'aistages');
eq(await D(page, () => { const L = ACADEMY.lessons.aistages; return [L.jobs.map(j => Object.keys(j.fit).length), L.jobs.map(j => Object.values(j.fit).filter(f => f[0] === 'best').length), L.plans.map(p => p.stages)]; }), [[6, 6, 6, 6, 6, 6], [1, 1, 1, 1, 1, 1], [5, 6, 7, 20, 30, 30]], 'stages: six jobs, each judged for all six plans with one right size, and the stage counts the docs gave');
ok((await page.locator('#pd-fit').getAttribute('class')).includes('bad') && /Heavier than needed/.test(await text(page, '#pd-fit')) && /30/.test(await text(page, '#pd-stat')), 'stages: a one-file fix on the feature plan is called heavier than needed, with 30 stops');
await page.check('#widget [data-plan="bugfix"]');
ok((await page.locator('#pd-fit').getAttribute('class')).includes('ok') && /Right size/.test(await text(page, '#pd-fit')) && /\b6\b/.test(await text(page, '#pd-stat')), 'stages: the bugfix plan is the right size for a known bug, with 6 stops');
eq(await page.locator('#pd-meter i').evaluate(e => e.style.width), '20%', 'stages: the bar shows 6 of 30 stages');
await page.check('#widget [data-depth="2"]');
ok((await page.locator('#pd-dials').getAttribute('class')).includes('bad') && /More than this job needs/.test(await text(page, '#pd-dials')) && /\b6\b/.test(await text(page, '#pd-stat')), 'stages: comprehensive depth for a small fix is too much, and it does not change the plan or its 6 stops');
await page.check('#widget [data-depth="0"]'); await page.check('#widget [data-tests="2"]');
ok((await page.locator('#pd-dials').getAttribute('class')).includes('ok') && /suit this job/.test(await text(page, '#pd-dials')), 'stages: minimal depth with comprehensive tests suits a critical bugfix, as the docs allow');
await page.click('#widget [data-job="reg"]');
ok(await D(page, () => document.activeElement.dataset.job === 'reg'), 'stages: focus stays on the job you picked');
ok((await page.locator('#pd-fit').getAttribute('class')).includes('bad') && /Too light/.test(await text(page, '#pd-fit')), 'stages: the bugfix plan is too light for a regulated service');
await page.check('#widget [data-plan="enterprise"]');
ok(/Right size/.test(await text(page, '#pd-fit')) && (await page.locator('#pd-dials').getAttribute('class')).includes('bad') && /Thinner than this job needs/.test(await text(page, '#pd-dials')), 'stages: enterprise is the right plan, but minimal depth is still too thin for audit work');
await page.check('#widget [data-depth="2"]');
ok((await page.locator('#pd-dials').getAttribute('class')).includes('ok'), 'stages: comprehensive depth fixes it');

await goLesson(page, 'agile', 'airules');
ok(/reads 1 rule /.test(await text(page, '#rl-next')) && /personal data/.test(await text(page, '#rl-org')), 'rules: the organisation rule is there from the start');
await page.click('#widget [data-c="typo"]');
ok(/Not asked/.test(await text(page, '#rl-msg')) && (await page.locator('#rl-opts').count()) === 0 && /nothing yet/.test(await text(page, '#rl-audit')), 'rules: a one-off typo is not offered as a rule, and nothing is kept');
await page.click('#widget [data-c="sku"]');
eq(await page.locator('#rl-opts button').count(), 3, 'rules: a correction that would hold next time is asked about, with three choices');
ok(/empty/.test(await text(page, '#rl-project')), 'rules: nothing is saved until you answer');
await page.click('#widget [data-a="project"]');
ok(/SKU/.test(await text(page, '#rl-project')) && /RULE_LEARNED, project\.md/.test(await text(page, '#rl-audit')) && /reads 2 rules/.test(await text(page, '#rl-next')), 'rules: yes for this project writes to project.md, adds an audit row, and the next stage reads two rules');
await page.click('#widget [data-c="sku"]');
ok(/already in the rules/.test(await text(page, '#rl-msg')) && /reads 2 rules/.test(await text(page, '#rl-next')), 'rules: the same lesson is not saved twice');
await page.click('#widget [data-c="logs"]');
ok(/never write personal data to logs/i.test(await text(page, '#rl-ask')) && /reads 2 rules/.test(await text(page, '#rl-next')), 'rules: a correction that clashes with an organisation rule quotes the rule and saves nothing yet');
await page.click('#widget [data-a="skip"]');
ok(/reads 2 rules/.test(await text(page, '#rl-next')), 'rules: skipping a clashing correction keeps nothing');
await page.click('#widget [data-c="logs"]'); await page.click('#widget [data-a="revise"]');
ok(/request ids/.test(await text(page, '#rl-project')) && /reads 3 rules/.test(await text(page, '#rl-next')), 'rules: a revised correction is saved to project.md');
await page.click('#widget [data-c="say"]');
ok(/without a question/.test(await text(page, '#rl-msg')) && /fixtures/.test(await text(page, '#rl-project')) && /reads 4 rules/.test(await text(page, '#rl-next')), 'rules: saying "keep this" saves it without a question');
await page.uncheck('#rl-on'); await page.click('#widget [data-c="sku"]');
ok(/Learnings are off/.test(await text(page, '#rl-msg')) && /reads 4 rules/.test(await text(page, '#rl-next')), 'rules: with learnings off nothing is asked and nothing is kept');
await page.click('#widget [data-a="reset"]');
ok(/reads 1 rule /.test(await text(page, '#rl-next')) && /nothing yet/.test(await text(page, '#rl-audit')), 'rules: reset empties the files and the audit trail');
await page.check('#rl-on'); await page.click('#widget [data-c="sku"]'); await page.click('#widget [data-a="team"]');
ok(/SKU/.test(await text(page, '#rl-team')) && /empty/.test(await text(page, '#rl-project')), 'rules: yes for the team writes to team.md, not project.md');

await goLesson(page, 'agile', 'aifacilitate');
ok(/0 of 3 landed/.test(await text(page, '#ub-stat')) && /Blocked until rider-preferences has landed/.test(await text(page, '#ub-board')) && (await page.locator('#widget [data-act="claim"][data-u="mail"]').count()) === 0, 'workshop: a unit that needs another is blocked, with no claim button');
eq(await page.locator('#widget [data-act="claim"][data-u="prefs"]').count(), 2, 'workshop: a free unit can be claimed by either team');
await page.click('#widget [data-act="push"]');
ok((await page.locator('#ub-msg').getAttribute('class')).includes('bad') && /never push main/.test(await text(page, '#ub-msg')), 'workshop: pushing straight to main is not how the recipe works');
await page.click('#widget [data-act="claim"][data-u="prefs"][data-t="Team 2"]');
ok(/Team 2/.test(await text(page, '#ub-board')) && (await page.locator('#widget [data-act="pin"]').count()) === 0 && (await page.locator('#widget [data-act="claim"][data-u="prefs"]').count()) === 0, 'workshop: a claimed unit has one owner, and the lead has nothing to do until it is published');
await page.click('#widget [data-act="publish"][data-u="prefs"]'); await page.click('#widget [data-act="pin"][data-u="prefs"]');
eq(await page.locator('#widget [data-act="approve"], #widget [data-act="reject"]').count(), 2, 'workshop: after pinning, the lead can approve the merge gate or ask for changes');
await page.click('#widget [data-act="reject"][data-u="prefs"]');
ok(/1 change request\b/.test(await text(page, '#ub-stat')) && (await page.locator('#widget [data-act="publish"][data-u="prefs"]').count()) === 1 && /0 of 3 landed/.test(await text(page, '#ub-stat')), 'workshop: asking for changes sends the unit back to its team and nothing lands');
await page.click('#widget [data-act="publish"][data-u="prefs"]'); await page.click('#widget [data-act="pin"][data-u="prefs"]'); await page.click('#widget [data-act="approve"][data-u="prefs"]');
ok((await page.locator('#widget [data-act="land"][data-u="prefs"]').count()) === 1 && /0 of 3 landed/.test(await text(page, '#ub-stat')), 'workshop: an approved unit still has to be landed by the lead');
await page.click('#widget [data-act="land"][data-u="prefs"]');
ok(/1 of 3 landed/.test(await text(page, '#ub-stat')) && /reminder-email is now open/.test(await text(page, '#ub-msg')) && (await page.locator('#widget [data-act="claim"][data-u="mail"]').count()) === 2, 'workshop: landing the unit it depends on opens the blocked one');
for (const id of ['core', 'mail']) {
  await page.click('#widget [data-act="claim"][data-u="' + id + '"][data-t="Team 1"]');
  for (const a of ['publish', 'pin', 'approve', 'land']) await page.click('#widget [data-act="' + a + '"][data-u="' + id + '"]');
}
ok(/3 of 3 landed/.test(await text(page, '#ub-stat')) && /build and test/.test(await text(page, '#ub-msg')), 'workshop: when every unit has landed, main moves on to build and test');
await page.click('#widget [data-act="reset"]');
ok(/0 of 3 landed/.test(await text(page, '#ub-stat')), 'workshop: reset clears the board');

for (const c of ['aistages', 'airules', 'aifacilitate']) {
  await goLesson(page, 'agile', c);
  ok(await page.locator('#widget').isVisible() && await page.locator('#quiz').isVisible(), 'lesson draws its picture and quiz: ' + c);
  await page.locator('#quiz [data-opt="0"]').click();
}
eq(page.errors, [], 'no script errors in the three new Track 9 lessons');

  // ---------- tools ----------
  section('Track 8: Tools in practice');
  eq(shape.tracks[7], 4, 'track 8 (Tools in practice) has four lessons');
  await goLesson(page, 'tools', 'copilot');
  ok(/formatTimeRange/.test(await text(page, '#sc-editor')) && !/No slot/.test(await text(page, '#sc-editor')), 'in-editor: with no other file open, the suggestion guesses a helper name');
  ok(!/\b(ok|bad)\b/.test(await page.locator('#sc-verdict').getAttribute('class')) && /Nothing is in your file until you accept/.test(await text(page, '#sc-verdict')), 'in-editor: a suggestion is only dimmed text until you accept it');
  await page.click('#widget [data-a="accept"]');
  ok((await page.locator('#sc-verdict').getAttribute('class')).includes('bad') && /does not exist/.test(await text(page, '#sc-verdict')), 'in-editor: accepting the guessed helper is called out as a function that does not exist');
  await page.check('#widget [data-file="helpers"]');
  ok(!/\b(ok|bad)\b/.test(await page.locator('#sc-verdict').getAttribute('class')) && /formatSlot/.test(await text(page, '#sc-editor')) && !/formatTimeRange/.test(await text(page, '#sc-editor')), 'in-editor: opening the helpers file changes the suggestion and clears the old decision');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.file === 'helpers'), 'in-editor: focus stays on the file you toggled');
  await page.click('#widget [data-a="accept"]');
  ok((await page.locator('#sc-verdict').getAttribute('class')).includes('bad') && /One test fails/.test(await text(page, '#sc-verdict')), 'in-editor: right helper but without the tests open, the empty case is missed');
  await page.check('#widget [data-file="tests"]');
  ok(/No slot/.test(await text(page, '#sc-editor')), 'in-editor: opening the tests file adds the empty-case line');
  await page.click('#widget [data-a="accept"]');
  ok((await page.locator('#sc-verdict').getAttribute('class')).includes('ok') && /still had to read it/.test(await text(page, '#sc-verdict')), 'in-editor: helpers and tests open give the right suggestion, and the verdict still says to read it');
  const edBefore = await text(page, '#sc-editor');
  await page.check('#widget [data-file="styles"]');
  eq(await text(page, '#sc-editor'), edBefore, 'in-editor: an unrelated open file changes nothing');
  await page.click('#widget [data-a="dismiss"]');
  ok(!/formatSlot/.test(await text(page, '#sc-editor')) && /unchanged/.test(await text(page, '#sc-verdict')), 'in-editor: dismissing leaves the file as it was');
  eq(await D(page, () => [{}, { helpers: true }, { helpers: true, tests: true }].map(WIDGETS._suggestOutcome)), ['missing', 'partial', 'good'], 'in-editor: the outcome rule is missing, partial, good');
  ok(/Tool card: in-editor suggestions/.test(await text(page, '#widget')) && await page.locator('#widget .tag').count() === 1, 'in-editor: the tool card shows, with one row marked partly answered');

  await goLesson(page, 'tools', 'claude');
  eq(await page.locator('#ad-body tr').count(), 7, 'dial: seven actions are listed');
  const t8dial = (l, s, h) => D(page, ([l, s, h]) => WIDGETS._dial(ACADEMY.lessons.claude, l, s, h), [l, s, h]);
  eq(await t8dial('ask', false, 'sentence'), ['runs', 'asks', 'runs', 'asks', 'asks', 'asks', 'asks'], 'dial: asking first, only reads and read-only commands go ahead');
  eq(await t8dial('edits', false, 'sentence'), ['runs', 'runs', 'runs', 'asks', 'asks', 'asks', 'runs'], 'dial: edits flow in the folder, other commands still ask');
  eq(await t8dial('plan', false, 'rule'), ['runs', 'blocked', 'runs', 'asks', 'asks', 'asks', 'blocked'], 'dial: plan first blocks edits');
  eq(await t8dial('auto', false, 'sentence'), ['runs', 'checked', 'checked', 'checked', 'checked', 'checked', 'checked'], 'dial: the second model decides for everything but a plain read');
  eq(await t8dial('nobody', false, 'sentence'), ['runs', 'blocked', 'runs', 'blocked', 'blocked', 'blocked', 'blocked'], 'dial: where nobody can be asked, what would ask is refused');
  eq(await t8dial('all', false, 'sentence'), ['runs', 'runs', 'runs', 'runs', 'runs', 'runs', 'runs'], 'dial: asking nothing runs everything, even the file you only asked it to leave alone');
  eq(await t8dial('all', true, 'rule'), ['runs', 'runs', 'runs', 'runs', 'blocked', 'blocked', 'blocked'], 'dial: a sandbox and a deny rule still hold when nothing is asked');
  ok(/2 it does alone, 5 it asks you/.test(await text(page, '#ad-verdict')) && (await page.locator('#ad-verdict').getAttribute('class')).includes('ok'), 'dial: the strictest level starts selected and counts what it asks');
  await page.check('#widget [data-level="plan"]');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.level === 'plan') && /Plan first/.test(await text(page, '#ad-head th[aria-current]')), 'dial: focus and the highlighted column follow the level you pick');
  await page.check('#widget [data-level="all"]');
  ok((await page.locator('#ad-verdict').getAttribute('class')).includes('bad') && /isolated containers/.test(await text(page, '#ad-verdict')), 'dial: asking nothing is flagged and sent to isolated containers');
  await page.check('#widget [data-how="rule"]');
  ok(/6 it does alone, 0 it asks you, 0 a second model decides, 1 cannot happen/.test(await text(page, '#ad-verdict')) && /deny rule is checked first/.test(await text(page, '#ad-notes')), 'dial: a deny rule holds even at the ask-nothing level');
  await page.check('#ad-sandbox');
  ok(/4 it does alone/.test(await text(page, '#ad-verdict')) && /Sandbox on/.test(await text(page, '#ad-notes')), 'dial: the sandbox blocks writes outside the folder and calls out, whatever was approved');
  ok(/Tool card: a terminal agent/.test(await text(page, '#widget')), 'dial: the tool card shows');

  await goLesson(page, 'tools', 'devin');
  eq(await D(page, () => [{}, { check: true }, { check: true, small: true }, { check: true, small: true, context: true }, { overgrant: true }, { check: true, small: true, context: true, overgrant: true }].map(WIDGETS._ticketOutcome)), ['nocheck', 'big', 'guess', 'good', 'overgrant', 'overgrant'], 'ticket: the outcome rule puts a leaked credential first, then the missing check, size and context');
  ok(await page.locator('#tr-log li').count() === 0, 'ticket: nothing runs until you hand it off');
  await page.click('#tr-go');
  ok((await page.locator('#tr-verdict').getAttribute('class')).includes('bad') && /nothing shows it/.test(await text(page, '#tr-verdict')) && /no test to run/.test(await text(page, '#tr-log')), 'ticket: a vague ticket gets "Done" with nothing to test it against');
  await page.check('#widget [data-ing="check"]');
  ok(await page.locator('#tr-log li').count() === 0, 'ticket: changing the ticket clears the old run');
  ok(/Done when the new test/.test(await text(page, '#tr-ticket')), 'ticket: the ticket text grows as you tick');
  await page.click('#tr-go');
  ok((await page.locator('#tr-verdict').getAttribute('class')).includes('bad') && /31 files/.test(await text(page, '#tr-verdict')), 'ticket: a check but no slicing gives a large change');
  await page.check('#widget [data-ing="small"]');
  await page.click('#tr-go');
  ok(!/\b(ok|bad)\b/.test(await page.locator('#tr-verdict').getAttribute('class')) && /guessed/.test(await text(page, '#tr-verdict')), 'ticket: a check and a small slice, without the context, passes on a guess');
  await page.check('#widget [data-ing="context"]');
  await page.click('#tr-go');
  ok((await page.locator('#tr-verdict').getAttribute('class')).includes('ok') && /shape that works/.test(await text(page, '#tr-verdict')), 'ticket: a check, a small slice and the context give a reviewable pull request');
  await page.check('#widget [data-ing="overgrant"]');
  await page.click('#tr-go');
  ok((await page.locator('#tr-verdict').getAttribute('class')).includes('bad') && /least access/.test(await text(page, '#tr-verdict')) && /production database password/.test(await text(page, '#tr-log')), 'ticket: a credential in the sandbox gets used, and the walls do not help');
  ok((await page.locator('#tr-gate').getAttribute('class')).includes('ok') && /moved from every step to one/.test(await text(page, '#tr-gate')), 'ticket: with a review, the approval has moved to the end');
  await page.uncheck('#tr-review');
  ok((await page.locator('#tr-gate').getAttribute('class')).includes('bad') && /gone/.test(await text(page, '#tr-gate')), 'ticket: without a review, the approval has gone');
  ok(await D(page, () => document.activeElement && document.activeElement.id === 'tr-review'), 'ticket: focus stays on the review box');

  await goLesson(page, 'tools', 'yours');
  ok(/6 of 6/i.test(await text(page, '#tc-out')) && /not known yet/.test(await text(page, '#tc-auto')), 'card: an empty card has six questions unanswered');
  await page.click('#widget [data-preset="editor"]');
  ok(/\(1 of 6\)/i.test(await text(page, '#tc-out')) && /Where does my text go/.test(await text(page, '#tc-out .card:nth-child(2)')) && /It suggests, and you decide each one/.test(await text(page, '#tc-auto')) && await page.locator('#tc-out [data-flag]').count() === 0, 'card: the in-editor card leaves only the data question open, and raises no flag');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.preset === 'editor'), 'card: focus stays on the starting card you picked');
  await page.click('#widget [data-preset="terminal"]');
  ok(/It acts, and you approve each step/.test(await text(page, '#tc-auto')) && await page.locator('#tc-out [data-flag="wide"]').count() === 1, 'card: the terminal card reads and changes widely, so it raises the lethal-trifecta flag');
  await page.click('#widget [data-preset="ticket"]');
  ok(/It works alone, and you approve the result/.test(await text(page, '#tc-auto')) && await page.locator('#tc-out [data-flag="nobody"]').count() === 0, 'card: the ticket card works alone but is approved at the end');
  await page.check('#widget [data-q="approves"][data-v="5"]');
  ok(await page.locator('#tc-out [data-flag="nobody"]').count() === 1 && /nobody approves/.test(await text(page, '#tc-auto')), 'card: nobody approving, with real files reachable, raises a flag');
  await page.check('#widget [data-q="data"][data-v="3"]');
  ok(await page.locator('#tc-out [data-flag="data"]').count() === 1 && /\(0 of 6\)/i.test(await text(page, '#tc-out')) && /All six are answered/.test(await text(page, '#tc-out')), 'card: answering all six clears the unanswered list, and a data answer can raise its own flag');
  await page.fill('#tc-name', 'Name of my own made-up tool');
  ok(/Name of my own made-up tool/.test(await text(page, '#tc-out')) && await D(page, () => !/made-up tool/.test(JSON.stringify(ACADEMY_DEBUG.state()))), 'card: the name appears on the card and is not saved in your progress');
  await page.click('#widget [data-preset="clear"]');
  ok(/\(6 of 6\)/i.test(await text(page, '#tc-out')) && (await page.inputValue('#tc-name')) === '', 'card: clearing empties the card and the name');
  eq(await D(page, () => { const L = ACADEMY.lessons.yours, all = { runs: '0', reads: '0', changes: '0', approves: '0', memory: '0', data: '0' }; return [WIDGETS._cardRead(L, {}).answered, WIDGETS._cardRead(L, all).unanswered.length, WIDGETS._cardRead(L, all).autonomy, WIDGETS._cardRead(L, { reads: '4', changes: '4' }).flags]; }), [0, 0, 'It suggests, and you decide each one', ['wide']], 'card: the read-out counts answers, maps approval to autonomy and flags wide reach');

  // ---------- grounding ----------
  // ------------------------------------------------------------------ track 4: grounding
  section('Track 4: Grounding');
  eq(await D(page, () => ['embed', 'search', 'rag', 'cite'].map(id => ACADEMY.lessons[id].quiz.map(q => q.a).slice().sort().join(''))), ['0123', '0123', '0123', '0123'], 'grounding: every lesson puts the right answer in each of the four positions once');
  eq(await D(page, () => ACADEMY.tracks.filter(t => t.id === 'grounding')[0].concepts.filter(c => ACADEMY.lessons[c.id]).length), 4, 'grounding: all four concepts have a lesson');

  await goLesson(page, 'grounding', 'embed');
  eq(await D(page, () => WIDGETS._near(ACADEMY.lessons.embed, 'refund', 2).map(o => o.p.id)), ['cancel', 'money'], 'embeddings: the two nearest to "refund request" are "cancel my plan" and "money back please"');
  ok((await page.locator('#em-verdict').getAttribute('class')).includes('ok') && /none of them shares a word/.test(await text(page, '#em-verdict')), 'embeddings: same-topic neighbours that share no word are called out as placed by meaning');
  eq(await D(page, () => { const L = ACADEMY.lessons.embed, size = {}; L.points.forEach(p => size[p.g] = (size[p.g] || 0) + 1); return L.points.filter(p => WIDGETS._near(L, p.id, size[p.g] - 1).some(o => o.p.g !== p.g)).map(p => p.id); }), [], 'embeddings: for every phrase, its nearest neighbours (as many as its topic has) are all in its own topic');
  await page.click('#widget [data-p="river"]');
  ok((await page.locator('#em-verdict').getAttribute('class')).includes('ok') && /shares the word "bank"/.test(await text(page, '#em-verdict')) && /64\.6 units/.test(await text(page, '#em-verdict')), 'embeddings: "river bank flooded" shares "bank" with "my bank balance" yet sits 64.6 units away');
  ok(/my bank balance/.test(await text(page, '#em-out')) && /different topic/.test(await text(page, '#em-out')), 'embeddings: the keyword card lists the shared-word phrase and marks it as a different topic');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.p === 'river'), 'embeddings: focus stays on the phrase you picked');
  await page.click('#widget [data-p="refund"]');
  await setRange(page, '#em-k', 4);
  ok((await page.locator('#em-verdict').getAttribute('class')).includes('bad') && /sprint planning/.test(await text(page, '#em-verdict')) && /stranger/.test(await text(page, '#em-verdict')), 'embeddings: asking for four neighbours of a three-phrase topic brings in a stranger, and says so');
  eq(await page.locator('#em-map [data-p]').count(), 16, 'embeddings: sixteen phrases on the map');
  ok(/two numbers/.test(await text(page, '#em-vec')) && /hundreds or thousands/.test(await text(page, '#em-vec')), 'embeddings: the toy says it has two numbers and a real one has hundreds or thousands');
  await setRange(page, '#em-k', 2);

  await goLesson(page, 'grounding', 'search');
  const sr = (q, cut) => D(page, a => { const r = WIDGETS._searchRun(ACADEMY.lessons.search, a[0], a[1]); return [r.kw.map(o => o.id), r.sem.map(o => o.id), r.pool]; }, [q, cut]);
  eq(await sr('q2', false), [['D1', 'D7'], ['D2', 'D7', 'D1'], ['D1', 'D2', 'D7']], 'search: "I cannot get into my account" finds the wrong pages by keyword and the password page by meaning');
  eq(await sr('q4', false), [['D3', 'D4', 'D8'], ['D4', 'D8', 'D3'], ['D3', 'D4', 'D8']], 'search: "call off my pickup" ties three pages by keyword, and meaning puts the cancelling page first');
  eq(await sr('q3', false), [['D3'], ['D8', 'D6', 'D4'], ['D3', 'D8', 'D6']], 'search: the exact code is found by keyword and buried by meaning');
  eq(await sr('q3', true), [['D3'], [], ['D3']], 'search: with a minimum score, meaning drops the code question altogether');
  eq(await sr('q5', true), [[], [], []], 'search: with a minimum score, a question no page answers returns nothing');
  await D(page, () => { document.querySelector('#sc-cut').checked = false; });
  await page.click('#widget [data-q="q2"]');
  ok((await page.locator('#sc-kw-v').getAttribute('class')).includes('bad') && (await page.locator('#sc-sem-v').getAttribute('class')).includes('ok'), 'search: on the locked-out question keywords fail and meaning wins');
  await page.click('#widget [data-q="q3"]');
  ok((await page.locator('#sc-kw-v').getAttribute('class')).includes('ok') && (await page.locator('#sc-sem-v').getAttribute('class')).includes('bad'), 'search: on the exact code keywords win and meaning fails');
  await page.check('#sc-cut');
  ok(/Nothing came back, but page D3 answers/.test(await text(page, '#sc-sem-v')) && /under the cut-off|under the cut/.test(await text(page, '#sc-sem')), 'search: the minimum score hides the right page too on a code, and the card says why');
  await page.click('#widget [data-q="q5"]');
  ok((await page.locator('#sc-kw-v').getAttribute('class')).includes('ok') && (await page.locator('#sc-sem-v').getAttribute('class')).includes('ok'), 'search: with the minimum score on, "nothing found" is the right result for a question no page answers');
  await page.uncheck('#sc-cut');
  ok((await page.locator('#sc-sem-v').getAttribute('class')).includes('bad') && /no page answers/.test(await text(page, '#sc-sem-v')), 'search: without it, meaning search presents a weak match as if it answered');
  await page.click('#widget [data-q="q4"]');
  eq(await page.locator('#sc-pl').count(), 0, 'search: the pool is hidden until you ask for it');
  await page.check('#sc-pool');
  ok((await page.locator('#sc-pl-v').getAttribute('class')).includes('ok') && (await page.locator('#sc-pl li').count()) === 3, 'search: the pool for "call off my pickup" holds three pages and includes the right one');
  ok(await D(page, () => document.activeElement && document.activeElement.id === 'sc-pool'), 'search: focus stays on the checkbox you used');
  await page.uncheck('#sc-pool');

  await goLesson(page, 'grounding', 'rag');
  const rr = (q, size, k, rule) => D(page, a => { const r = WIDGETS._ragRun(ACADEMY.lessons.rag, a[0], a[1], a[2], a[3]); return { order: r.order, sent: r.sent, key: r.key, tokens: r.tokens, ans: r.out[0], cls: r.out[1] }; }, [q, size, k, rule]);
  eq((await rr('cancel', 'small', 1, true)).order, [2, 3, 4, 5, 1, 6, 7, 8], 'RAG: for the cancel question the sentence about cancelling ranks first and the fee sentence second');
  let r1 = await rr('cancel', 'small', 1, true), r2 = await rr('cancel', 'small', 2, true);
  eq([r1.key, r1.tokens, r2.key, r2.tokens], ['S2', 63, 'S2+S3', 77], 'RAG: one small chunk gets half the facts for 63 toy tokens, two get both for 77');
  eq([(await rr('cancel', 'medium', 1, true)).order, (await rr('cancel', 'medium', 1, true)).key], [[2, 1, 3, 4], 'S3'], 'RAG: two-sentence chunks split the free period from the fee, and the fee chunk ranks first');
  eq([(await rr('cancel', 'large', 1, true)).key, (await rr('cancel', 'large', 1, true)).tokens], ['S2+S3', 101], 'RAG: one four-sentence chunk holds both facts, for 101 toy tokens');
  eq([(await rr('refund', 'small', 1, true)).tokens, (await rr('refund', 'large', 1, true)).tokens, (await rr('refund', 'small', 1, false)).tokens], [46, 69, 29], 'RAG: the refund question costs 46 tokens with one small chunk, 69 with a large one, and 17 fewer without the rule');
  eq([(await rr('airport', 'small', 1, false)).cls, (await rr('airport', 'small', 1, true)).cls, (await rr('cancel', 'small', 1, false)).ans], ['bad', 'ok', 'Yes, cancelling is free.'], 'RAG: with no rule the model invents an airport answer and half-answers the cancel question with confidence');
  await D(page, () => { const s = document.querySelector('#rg-k'); s.value = 1; s.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#widget [data-q="cancel"]');
  ok(/Missing/.test(await text(page, '#rg-verdict')) && !(await page.locator('#rg-verdict').getAttribute('class')).includes('ok') && /cannot say|do not say/.test(await text(page, '#rg-answer')), 'RAG: small chunks, one sent: the answer is incomplete, says what is missing, and admits the gap');
  await page.uncheck('#rg-rule');
  ok((await page.locator('#rg-verdict').getAttribute('class')).includes('bad') && /Yes, cancelling is free/.test(await text(page, '#rg-answer')), 'RAG: switch the rule off and the same missing fact becomes a confident wrong answer');
  await page.check('#rg-rule');
  await setRange(page, '#rg-k', 2);
  ok((await page.locator('#rg-verdict').getAttribute('class')).includes('ok') && /half the fare/.test(await text(page, '#rg-answer')), 'RAG: send two chunks and the answer is complete');
  ok(/77 toy tokens/.test(await text(page, '#rg-cost')) && /1\.7 times/.test(await text(page, '#rg-cost')) && /77,000/.test(await text(page, '#rg-cost')), 'RAG: the cost line shows 77 tokens, 1.7 times the cheapest setting, and the 1,000-question total');
  await setRange(page, '#rg-k', 1);
  await page.check('#widget [data-size="medium"]');
  ok(/split across chunks/.test(await text(page, '#rg-verdict')) && (await page.locator('#rg-chunks .msg.sum').count()) === 1, 'RAG: two-sentence chunks, one sent: the needed facts were split by the cut, and the verdict says so');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.size === 'medium'), 'RAG: focus stays on the chunk size you picked');
  await page.check('#widget [data-size="large"]');
  ok((await page.locator('#rg-verdict').getAttribute('class')).includes('ok') && /did not need/.test(await text(page, '#rg-verdict')), 'RAG: one large chunk is complete but carries text the question did not need');
  await setRange(page, '#rg-k', 3);
  ok(/only 2 chunks exist/.test(await text(page, '#rg-kv')), 'RAG: asking for more chunks than exist is flagged');
  await setRange(page, '#rg-k', 1); await page.check('#widget [data-size="small"]');

  await goLesson(page, 'grounding', 'cite');
  eq(await D(page, () => { const c = ACADEMY.lessons.cite.claims, n = {}; c.forEach(x => n[x.a] = (n[x.a] || 0) + 1); return [n.yes, n.part, n.no, c.every(x => x.cite === null || ACADEMY.lessons.cite.chunks.some(k => k.n === x.cite))]; }), [2, 1, 4, true], 'citations: two claims supported, one stretched, four not, and every pointer leads to a real chunk');
  eq(await page.locator('#widget fieldset').count(), 7, 'citations: seven claims to judge');
  eq(await page.locator('#widget fieldset >> nth=6').locator('.doc').count(), 0, 'citations: the uncited claim has no source to open');
  await page.check('#widget [data-claim="c2"][data-v="yes"]');
  ok(/half the fare/.test(await text(page, '#ct-body')) && (await page.locator('#ct-body .verdict.bad').count()) === 1, 'citations: calling the wrong-number claim supported is wrong, and the reason points at the chunk');
  await page.check('#widget [data-claim="c1"][data-v="yes"]');
  ok(/1 of 2 match/.test(await text(page, '#ct-score')) && (await page.locator('#ct-body .verdict.ok').count()) === 1, 'citations: a match with my judgment is counted');
  ok(await D(page, () => document.activeElement && document.activeElement.dataset.claim === 'c1'), 'citations: focus stays on the choice you made');
  ok(await page.locator('#ct-sum').isHidden(), 'citations: the summary waits until every claim is judged');
  for (const [id, v] of Object.entries(await D(page, () => Object.fromEntries(ACADEMY.lessons.cite.claims.map(c => [c.id, c.a]))))) await page.check('#widget [data-claim="' + id + '"][data-v="' + v + '"]');
  ok(await page.locator('#ct-sum').isVisible() && /pointer to a real chunk: 6 of 7/.test(await text(page, '#ct-sum')) && /fully supports: 2 of 7/.test(await text(page, '#ct-sum')), 'citations: six of seven claims have a valid pointer but only two are fully supported');

  // ---------- evals ----------
  section('Track 5: Evals and quality');
  {
    const prevPage = page; page = await open(browser);
    const cls = async sel => (await page.locator(sel).getAttribute('class')) || '';
    const pick = (id, m) => page.check('#widget [data-cid="' + id + '"][data-m="' + m + '"]');

    // test sets: coverage, then tuning and holding back
    await goLesson(page, 'evals', 'testset');
    for (const id of ['c1', 'c2', 'c3']) await pick(id, 'tune');
    ok(/0 of 6/.test(await text(page, '#tc-count')) && (await cls('#tc-verdict')).includes('bad') && /green/.test(await text(page, '#tc-verdict')), 'test set: three easy cases pass today and would show 0 of 6 faults, called false comfort');
    await pick('c4', 'tune'); await pick('c5', 'tune');
    ok(/1 of 6/.test(await text(page, '#tc-count')), 'test set: two cases for the same fault count as one fault');
    ok(await D(page, () => document.activeElement.dataset.cid === 'c5' && document.activeElement.dataset.m === 'tune'), 'test set: focus stays on the choice you made');
    for (const id of ['c1', 'c2', 'c3', 'c5']) await pick(id, 'out');
    for (const id of ['c6', 'c7', 'c8', 'c9', 'c10']) await pick(id, 'tune');
    ok(/6 of 6/.test(await text(page, '#tc-count')) && (await cls('#tc-verdict')).includes('ok'), 'test set: one case per fault would show all six');
    eq(await D(page, () => { const L = ACADEMY.lessons.testset, r = WIDGETS._testcover(L, { c4: 'tune', c5: 'hold', c6: 'hold' }, true); return [r.tuneN, r.holdN, r.holdPass, r.left.length, r.unseen.length]; }), [1, 2, 1, 5, 4], 'test set: tuning on one fault fixes it; a held-back case on the same fault passes and one on another fault fails');
    await page.click('#tc-tune');
    ok(/Tune-on cases passing: 6 of 6/.test(await text(page, '#tc-count')) && /cannot tell/.test(await text(page, '#tc-verdict')) && (await cls('#tc-verdict')).includes('bad'), 'test set: tuning with nothing held back passes everything and says you cannot tell');
    await pick('c10', 'hold'); await pick('c9', 'hold');
    ok(/Held-back cases passing: 0 of 2/.test(await text(page, '#tc-count')) && /still fails/.test(await text(page, '#tc-verdict')), 'test set: held-back cases show faults the tuning never revealed');
    ok(await D(page, () => document.querySelector('#tc-faults li.no span').textContent.includes('held-back case shows it')), 'test set: a fault only a held-back case shows is labelled so');
    await page.click('#tc-undo');
    ok(/Would be caught/.test(await text(page, '#tc-faults')) && await page.locator('#tc-tune').isEnabled(), 'test set: undoing the tuning returns to coverage');

    // rubrics: two scorers and a vague criterion
    await goLesson(page, 'evals', 'rubric');
    ok(/3\s*of 6 scored the same/.test(await text(page, '#ra-score')) && /Both right:\s*2/.test(await text(page, '#ra-score')) && (await cls('#ra-verdict')).includes('bad'), 'rubric: with a vague criterion the scorers split on three of six');
    eq(await D(page, () => [{}, { owners: true }, { long: true }, { owners: true, long: true }, { invented: true, owners: true, long: true }].map(on => { const r = WIDGETS._rubricAgree(ACADEMY.lessons.rubric, on); return [r.agree, r.right]; })), [[3, 2], [4, 3], [5, 4], [6, 5], [6, 6]], 'rubric: each written check removes disagreement; agreement without the invented-item check is still wrong once');
    await page.check('#widget [data-chk="owners"]'); await page.check('#widget [data-chk="long"]');
    ok(/6\s*of 6 scored the same/.test(await text(page, '#ra-score')) && /both are wrong on 1/.test(await text(page, '#ra-verdict')) && (await cls('#ra-verdict')).includes('bad'), 'rubric: agreeing on all six while both miss the invented item is called out');
    ok(await D(page, () => document.activeElement.dataset.chk === 'long'), 'rubric: focus stays on the check you toggled');
    await page.check('#widget [data-chk="invented"]');
    ok(/6\s*of 6 scored the same/.test(await text(page, '#ra-score')) && /Both right:\s*6/.test(await text(page, '#ra-score')) && (await cls('#ra-verdict')).includes('ok'), 'rubric: with all three checks written, both scorers are right on all six');
    ok(/Criterion: The summary is helpful\. No decision/.test(await text(page, '#ra-crit')), 'rubric: the written checks are added to the criterion text');
    await page.uncheck('#widget [data-chk="owners"]'); await page.uncheck('#widget [data-chk="long"]'); await page.uncheck('#widget [data-chk="invented"]');

    // judges: order, length and own style
    await goLesson(page, 'evals', 'judges');
    ok(/on 4 of 6/.test(await text(page, '#jb-score')) && (await cls('#jb-verdict')).includes('bad'), 'judges: run once in the written order, the judge agrees with people on 4 of 6');
    await page.check('#widget [data-mode="swapped"]');
    ok(/on 5 of 6/.test(await text(page, '#jb-score')), 'judges: the same judge and answers with the order swapped score 5 of 6');
    await page.check('#widget [data-mode="both"]');
    ok(/on 3 of 6/.test(await text(page, '#jb-score')) && /undecided on 3/.test(await text(page, '#jb-score')) && (await cls('#jb-verdict')).includes('ok') && (await page.locator('#jb-rows td', { hasText: 'Wrong' }).count()) === 0, 'judges: running both orders keeps 3 clear wins, none wrong, and marks 3 undecided');
    eq(await D(page, () => ['order:written', 'order:swapped', 'order:both', 'length:plain', 'length:fixed', 'style:plain', 'style:fixed'].map(k => { const p = k.split(':'), r = WIDGETS._judgeBias(ACADEMY.lessons.judges, p[0], p[1]); return [r.right, r.wrong, r.tie]; })), [[4, 2, 0], [5, 1, 0], [3, 0, 3], [4, 2, 0], [5, 1, 0], [4, 2, 0], [5, 1, 0]], 'judges: the scripted verdicts give 4, 5 and 3 for order, and 4 then 5 for length and for own style');
    await page.click('#widget [data-d="1"]');
    ok(/longer one/.test(await text(page, '#jb-verdict')) && /on 4 of 6/.test(await text(page, '#jb-score')), 'judges: the length tab leans toward the longer answer');
    ok(await D(page, () => document.activeElement.dataset.d === '1'), 'judges: focus stays on the tab you picked');
    await page.check('#widget [data-mode="fixed"]');
    ok(/on 5 of 6/.test(await text(page, '#jb-score')) && /still wrong/.test(await text(page, '#jb-verdict')), 'judges: the length fix helps, and one close call is still wrong');
    await page.click('#widget [data-d="2"]');
    ok(/same model family/.test(await text(page, '#jb-modes')) && /own style/.test(await text(page, '#jb-rows')), 'judges: the own-style tab labels which answer is the judge\'s own');
    await page.click('#widget [data-d="0"]');
    ok(await page.locator('#widget [data-mode="both"]').isChecked(), 'judges: each tab remembers how you ran its judge');

    // regressions: baseline, pass bar, must-hold rule, reruns, accepting a baseline
    await goLesson(page, 'evals', 'regress');
    ok(/Ship/.test(await text(page, '#sg-decision')) && (await cls('#sg-verdict')).includes('bad') && /let a break through/.test(await text(page, '#sg-verdict')), 'regress: a bar on the total alone ships a version that breaks a must-hold case');
    eq(await D(page, () => { const L = ACADEMY.lessons.regress, a = WIDGETS._shipgate(L, { bar: 60, must: false, rerun: false, baseline: true, accepted: false }), b = WIDGETS._shipgate(L, { bar: 60, must: true, rerun: true, baseline: true, accepted: false }); return [a.passBefore, a.passNow, a.fixed, a.broke, a.brokeMust, a.still, b.passNow, b.broke, b.brokeMust, b.decision]; }), [7, 8, 3, 2, 2, 2, 9, 1, 1, 'hold'], 'regress: seven passed before, eight now, three fixed and two broke; a rerun clears one break as noise');
    await page.check('#sg-must');
    ok(/Hold/.test(await text(page, '#sg-decision')) && (await cls('#sg-verdict')).includes('ok') && /may be noise/.test(await text(page, '#sg-verdict')), 'regress: the must-hold rule holds the version and flags the one that may be noise');
    await page.check('#sg-rerun');
    ok(/Hold/.test(await text(page, '#sg-decision')) && /all three reruns/.test(await text(page, '#sg-verdict')) && /9 of 12/.test(await text(page, '#sg-numbers')), 'regress: with reruns on, the flaky case counts as a pass and the real break is confirmed');
    await page.uncheck('#sg-must'); await page.uncheck('#sg-rerun');
    await page.locator('#sg-bar').evaluate(el => { el.value = 70; el.dispatchEvent(new Event('input', { bubbles: true })); });
    ok(/Hold/.test(await text(page, '#sg-decision')) && /under the bar/.test(await text(page, '#sg-verdict')), 'regress: a bar of 70% holds a version that scores 67%, but only because of the total');
    await page.locator('#sg-bar').evaluate(el => { el.value = 60; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('#sg-accept');
    ok(/no later run will flag it/.test(await text(page, '#sg-verdict')) && await page.locator('#sg-reset').isEnabled() && (await page.locator('#sg-rows td', { hasText: 'Broke' }).count()) === 0, 'regress: accepting a version with a break makes the break part of the baseline');
    await page.click('#sg-reset');
    await page.uncheck('#sg-baseline');
    ok(await page.locator('#sg-must').isDisabled() && /without a baseline|Without a baseline/.test(await text(page, '#sg-verdict')) && (await page.locator('#sg-head th').count()) === 3, 'regress: with no baseline the must-hold rule is unavailable and the before columns disappear');

    await page.close(); page = prevPage;
  }

  // ---------- cost ----------
section('Track 7: Cost and operations');
{
await goLesson(page, 'cost', 'tokcost');
const cr = (kind, n, doc, size) => D(page, a => { const x = WIDGETS._costRun(ACADEMY.lessons.tokcost, a[0], a[1], a[2], a[3]); return [x.sumIn, x.sumOut, x.sumResent, +x.coins.toFixed(2)]; }, [kind, n, doc, size]);
eq(await cr('chat', 10, 0, 0), [15250, 1500, 12600, 22.75], 'cost: ten short turns send 15,250 tokens in (12,600 of them earlier text sent again) and cost 22.75 toy coins');
eq(await cr('doc', 10, 2, 0), [95250, 1500, 84600, 102.75], 'cost: the same chat with a long document attached costs 102.75, most of it the document sent again');
eq(await cr('chat', 1, 0, 1), [400, 600, 0, 3.4], 'cost: one turn sends nothing again, and 600 tokens out cost more than 400 in');
eq(await cr('agent', 8, 0, 0), [13000, 1350, 10150, 19.75], 'cost: an eight-step agent run re-sends the window every step and costs 19.75, against 1.9 for one answer');
ok((await cr('chat', 20, 0, 0))[3] > 2 * (await cr('chat', 10, 0, 0))[3], 'cost: twice the turns costs more than twice as much');
eq(await D(page, () => { const L = ACADEMY.lessons.tokcost, x = WIDGETS._costRun(L, 'chat', 10, 0, 0); return x.sumIn - x.sumResent === x.rows[9].inT; }), true, 'cost: the new input over a run adds up to the size of the last call');
ok(/22\.75 coins for 10 turns/.test(await text(page, '#cc-total')) && await page.locator('#cc-bars .bar').count() === 10, 'cost: the page starts on a ten-turn chat with ten bars and the total in words');
await page.click('#widget [data-kind="doc"]');
ok(/102\.75 coins/.test(await text(page, '#cc-total')) && /83%|89%|88%|87%|86%|85%|84%|90%/.test(await text(page, '#cc-note')) && await D(page, () => document.activeElement.dataset.kind === 'doc'), 'cost: switching to a chat about a document shows the higher total, and focus stays on the button');
await page.click('#widget [data-kind="agent"]');
ok(/19\.75 coins for 8 steps/.test(await text(page, '#cc-total')) && await page.locator('#cc-bars .bar').count() === 8, 'cost: the agent run starts at eight steps');
await setRange(page, '#cc-n', 1);
ok(/Nothing has been sent again/.test(await text(page, '#cc-total')), 'cost: with one step nothing is sent again');

await goLesson(page, 'cost', 'latency');
const lr = (i, o, c, s) => D(page, a => { const x = WIDGETS._latencyRun(ACADEMY.lessons.latency, a[0], a[1], a[2], a[3]); return [x.first, x.last]; }, [i, o, c, s]);
eq(await lr(0, 1, 1, false), [8.6, 8.6], 'latency: with streaming off the first word and the last word arrive together');
eq(await lr(0, 1, 1, true), [0.62, 8.6], 'latency: streaming moves the first word to 0.62 s and leaves the last word at 8.6 s');
const base = (await lr(0, 1, 1, true))[1], longOut = (await lr(0, 2, 1, true))[1], longIn = (await lr(1, 1, 1, true))[1];
ok(Math.abs(longOut - base - 8) < 0.01 && Math.abs(longIn - base - 0.9) < 0.01, 'latency: doubling the answer adds 8 s to the last word, while a ten times longer prompt adds under a second');
eq(await lr(0, 1, 4, true), [3.6 + 0.62, 8.6 + 3.6].map(x => +x.toFixed(2)), 'latency: four calls in a row add three more waits before the answer starts, even with streaming');
ok(/8\.6 s<\/b>|8\.6 s/.test(await text(page, '#tl-out')) && /93%/.test(await text(page, '#tl-note')) && /writing the answer/.test(await text(page, '#tl-note')), 'latency: most of the default wait is the model writing the answer');
await page.check('#tl-stream');
ok(/0\.6 s/.test(await text(page, '#tl-out')) && /start reading at 0\.6 s/.test(await text(page, '#tl-note')) && await D(page, () => document.activeElement.id === 'tl-stream'), 'latency: switching streaming on shows the early first word, and focus stays on the box');
await page.check('#widget [data-out="0"]'); await page.check('#widget [data-in="1"]');
ok(/1\.5 s/.test(await text(page, '#tl-out')) && /57%/.test(await text(page, '#tl-note')) && /writing the answer/.test(await text(page, '#tl-note')), 'latency: a ten times longer prompt delays the first word by about a second, and even with a short answer the writing is still the biggest part');

await goLesson(page, 'cost', 'cache');
const cc = (ed, d, g) => D(page, a => { const x = WIDGETS._cacheRun(ACADEMY.lessons.cache, a[0], a[1], a[2]); return [x.hit, x.total, x.withC, x.withoutC]; }, [ed, d, g]);
eq(await cc({}, 'end', 0), [8500, 8620, 14.75, 17.24], 'caching: with the date line near the end, 8,500 of 8,620 tokens are reused and caching saves money');
eq((await cc({}, 'start', 0)).slice(0, 1), [0], 'caching: a date line at the very top means nothing is reused');
const bad = await cc({}, 'start', 0); ok(bad[2] > bad[3], 'caching: nothing reused costs more than no caching, because saving the first copy has a premium');
eq([(await cc({ instr: true }, 'end', 0))[0], (await cc({ chat: true }, 'end', 0))[0], (await cc({ ref: true }, 'end', 0))[0]], [0, 7000, 1000], 'caching: a small edit at the top loses everything below it, and the same edit lower down loses less');
eq((await cc({}, 'end', 1))[0], 0, 'caching: a wait longer than the lifetime loses the saved copy');
ok((await page.locator('#pc-verdict').getAttribute('class')).includes('ok') && /Only the new text at the end/.test(await text(page, '#pc-verdict')) && await page.locator('#pc-rows .tag.go').count() === 4, 'caching: the starting picture shows four reused parts and a good verdict');
await page.check('#widget [data-edit="instr"]');
ok((await page.locator('#pc-verdict').getAttribute('class')).includes('bad') && /Standing instructions/.test(await text(page, '#pc-verdict')) && await page.locator('#pc-rows .tag.go').count() === 0 && await D(page, () => document.activeElement.dataset.edit === 'instr'), 'caching: ticking a change to the standing instructions turns every part to read again, and focus stays');
await page.uncheck('#widget [data-edit="instr"]'); await page.check('#widget [data-date="start"]');
ok(/costs more than not caching/.test(await text(page, '#pc-verdict')) && /0%/.test(await text(page, '#pc-num')), 'caching: the date line at the top says so, in plain words');
await page.check('#widget [data-date="end"]'); await page.check('#widget [data-gap="1"]');
ok(/gone/.test(await text(page, '#pc-verdict')) && /expired/.test(await text(page, '#pc-rows')), 'caching: a late second request finds the saved copy expired');

await goLesson(page, 'cost', 'size');
const L4 = () => D(page, () => { const L = ACADEMY.lessons.size, all = z => Object.fromEntries(L.tasks.map(t => [t.id, z])), best = WIDGETS._routeBest(L), p = x => { const r = WIDGETS._routeRun(L, x); return [r.cost, +r.secs.toFixed(2), r.passN, r.failing, r.fixable]; }; return { large: p(all('l')), small: p(all('s')), best: p(best), bestMix: L.tasks.map(t => best[t.id]).join('') }; });
const rr = await L4();
eq(rr.large.slice(0, 3), [68520, 3.89, 7], 'model size: everything on Large costs 68,520 coins and passes seven of the eight jobs');
eq(rr.small.slice(0, 3), [5660, 0.95, 4], 'model size: everything on Small is far cheaper and passes only four of eight');
eq([rr.best[0], rr.best[2], rr.bestMix], [27320, 7, 'sssmllls'], 'model size: the cheapest mix that passes costs 27,320 (40% of Large) and keeps Large where nothing else passes');
eq([rr.large[3], rr.large[4]], [['t7'], []], 'model size: the code-fix job fails on every size, so a bigger size is not the fix');
ok(/not tested/.test(await text(page, '#rt-stat')) && /You can see cost and wait, but not quality/.test(await text(page, '#rt-verdict')) && !/ of 20/.test(await text(page, '#rt-body')), 'model size: before the test, cost and wait show and quality is hidden');
await page.click('#widget [data-a="test"]');
ok(/7 of 8/.test(await text(page, '#rt-stat')) && /of 20/.test(await text(page, '#rt-body')) && /Code fixes fails on every size/.test(await text(page, '#rt-verdict')) && (await page.locator('#rt-verdict').getAttribute('class')).includes('ok'), 'model size: running the test set shows each score, and names the job that fails everywhere');
await page.click('#widget [data-a="small"]');
ok((await page.locator('#rt-verdict').getAttribute('class')).includes('bad') && /Meeting actions/.test(await text(page, '#rt-verdict')) && /4 of 8/.test(await text(page, '#rt-stat')), 'model size: everything on Small is flagged, with the jobs that need a bigger size');
await page.click('#widget [data-a="best"]');
ok(/27,320/.test(await text(page, '#rt-stat')) && (await page.locator('#rt-verdict').getAttribute('class')).includes('ok') && await D(page, () => document.activeElement.dataset.a === 'best'), 'model size: the cheapest passing mix is applied, and focus stays on the button');
await page.check('#widget [data-task="t4"][data-size="s"]');
ok((await page.locator('#rt-verdict').getAttribute('class')).includes('bad') && /Meeting actions/.test(await text(page, '#rt-verdict')) && await D(page, () => document.activeElement.dataset.task === 't4' && document.activeElement.dataset.size === 's'), 'model size: moving one job down to a size that misses the bar is flagged, and focus stays');
}

  // ---------- risk ----------
  section('Track 6: Risk and governance');
  const riskShape = await D(page, () => {
    const t = ACADEMY.tracks.find(x => x.id === 'risk'), L = t.concepts.filter(c => ACADEMY.lessons[c.id]).map(c => ACADEMY.lessons[c.id]);
    const pos = [0, 0, 0, 0]; L.forEach(l => l.quiz.forEach(q => pos[q.a]++));
    const body = JSON.stringify(L);
    return { n: L.length, widgets: L.map(l => l.widget), pos, names: /ChatGPT|Copilot|Gemini|Claude|OpenAI|Anthropic|Avianca|Air Canada|Moffatt|Levidow|Schwartz|LoDuca/.test(body), dash: /—|–/.test(body) };
  });
  eq(riskShape.n, 6, 'track 6 has six lessons: data leakage, IP, hallucination risk, bias, injection design, people in the loop');
  eq(riskShape.widgets, ['datasort', 'authorship', 'checkmatch', 'groupgap', 'breaktrifecta', 'reviewdesign'], 'track 6: each lesson has its own picture');
  eq(riskShape.pos, [6, 6, 6, 6], 'track 6: the right answers sit evenly in all four places');
  ok(!riskShape.names && !riskShape.dash, 'track 6: no tool, company, court party or lawyer is named in a lesson, and no dashes');

  // data leakage: a ladder of tools, eight pieces of data
  await goLesson(page, 'risk', 'leak');
  eq(await page.locator('#ds-body fieldset').count(), 8, 'data leakage: eight pieces of data to sort');
  eq(await D(page, () => { const n = {}; ACADEMY.lessons.leak.cards.forEach(c => { n[c.to] = (n[c.to] || 0) + 1; }); return [n.open, n.approved, n.inside, n.none]; }), [2, 2, 2, 2], 'data leakage: two pieces of data belong in each rung of the ladder');
  const dsVerdict = i => page.locator('#ds-body fieldset').nth(i).locator('.verdict');
  await page.check('#widget [data-card="c1"][data-b="open"]');
  ok((await dsVerdict(0).getAttribute('class')).includes('ok') && /1 of 1/.test(await text(page, '#ds-score')), 'data leakage: public text in an open tool matches my sorting');
  await page.check('#widget [data-card="c8"][data-b="open"]');
  ok((await dsVerdict(7).getAttribute('class')).includes('bad') && /1 of 2/.test(await text(page, '#ds-score')) && /1 goes further than I would/.test(await text(page, '#ds-score')), 'data leakage: keys in an open tool is flagged as going further than I would');
  await page.check('#widget [data-card="c2"][data-b="inside"]');
  const stricter = await dsVerdict(1).getAttribute('class');
  ok(!stricter.includes('ok') && !stricter.includes('bad') && /stricter than I would need/.test(await text(page, '#ds-body fieldset:nth-of-type(2)')), 'data leakage: a stricter choice is called safe but more than needed, not wrong');
  ok(/1 of 3/.test(await text(page, '#ds-score')) && await D(page, () => document.activeElement.dataset.card === 'c2'), 'data leakage: only exact matches count, and focus stays on the choice you made');

  // IP: what could the person claim?
  await goLesson(page, 'risk', 'ip');
  eq(await D(page, () => { const n = {}; ACADEMY.lessons.ip.cards.forEach(c => { n[c.to] = (n[c.to] || 0) + 1; }); return [n.none, n.part, n.all]; }), [2, 3, 1], 'IP: two cases give nothing, three give the person\'s own part, one gives the whole work');
  await page.check('#widget [data-card="a1"][data-b="none"]');
  ok((await page.locator('#au-body fieldset').nth(0).locator('.verdict').getAttribute('class')).includes('ok'), 'IP: a re-run prompt with the best image kept gives nothing in the generated part');
  await page.check('#widget [data-card="a6"][data-b="part"]');
  ok((await page.locator('#au-body fieldset').nth(5).locator('.verdict').getAttribute('class')).includes('bad') && /The whole work/.test(await text(page, '#au-body fieldset:nth-of-type(6)')) && /1 of 2/.test(await text(page, '#au-score')), 'IP: a different choice is shown my sorting and the reason');

  // hallucination risk: match a check to the job
  await goLesson(page, 'risk', 'halluc');
  eq(await D(page, () => [WIDGETS._cleanSample(20, 3, 5), WIDGETS._cleanSample(20, 3, 18), WIDGETS._cleanSample(20, 0, 5)].map(x => +x.toFixed(3))), [0.399, 0, 1], 'hallucination risk: a sample of 5 from 20 misses all 3 wrong items about 40 times in 100, and certainly misses none if it covers 18');
  ok((await page.locator('#cm-verdict').getAttribute('class')).includes('ok'), 'hallucination risk: using your own notes as they are fits the job');
  await page.click('#widget [data-s="team"]');
  ok((await page.locator('#cm-verdict').getAttribute('class')).includes('bad') && /Too light/.test(await text(page, '#cm-verdict')) && /3 wrong claims/.test(await text(page, '#cm-stat')), 'hallucination risk: trusting a team summary is too light, and 3 wrong claims go through');
  await page.check('#widget [data-c="sample"]');
  ok((await page.locator('#cm-verdict').getAttribute('class')).includes('ok') && /1\.2 wrong claims/.test(await text(page, '#cm-stat')) && /5 minutes/.test(await text(page, '#cm-stat')) && /40 times in 100/.test(await text(page, '#cm-note')), 'hallucination risk: a sample fits a team summary, with 1.2 wrong claims expected through and the 40-in-100 miss shown');
  ok(await page.locator('#widget [data-c="outcome"]').isDisabled(), 'hallucination risk: there is nothing to run for a text summary');
  await page.click('#widget [data-s="customer"]');
  ok((await page.locator('#cm-verdict').getAttribute('class')).includes('bad') && /held to what it said/.test(await text(page, '#cm-verdict')), 'hallucination risk: a sample is too light for answers published to customers');
  await page.check('#widget [data-c="signoff"]');
  ok((await page.locator('#cm-verdict').getAttribute('class')).includes('ok') && /30 minutes/.test(await text(page, '#cm-stat')), 'hallucination risk: every claim plus a second person fits customer answers and takes 30 minutes');
  await page.click('#widget [data-s="code"]'); await page.check('#widget [data-c="outcome"]');
  ok((await page.locator('#cm-verdict').getAttribute('class')).includes('ok') && /6 minutes/.test(await text(page, '#cm-stat')), 'hallucination risk: running the code change fits and takes 6 minutes');
  await page.check('#widget [data-c="all"]');
  ok(/40 minutes/.test(await text(page, '#cm-stat')) && /6 minutes, not 40/.test(await text(page, '#cm-verdict')), 'hallucination risk: reading every line also fits but is slower than running it');
  await page.click('#widget [data-s="own"]');
  const heavy = await page.locator('#cm-verdict').getAttribute('class');
  ok(!heavy.includes('ok') && !heavy.includes('bad') && /More than this job needs/.test(await text(page, '#cm-verdict')), 'hallucination risk: checking every item of your own notes is more than the job needs');
  await page.click('#widget [data-s="code"]'); await page.check('#widget [data-c="outcome"]'); await page.click('#widget [data-s="team"]');
  ok(await page.isChecked('#widget [data-c="all"]') && await D(page, () => document.activeElement.dataset.s === 'team'), 'hallucination risk: when a choice stops being possible it falls back to checking every item, and focus stays on the job');

  // bias: results by group
  await goLesson(page, 'risk', 'bias');
  eq(await D(page, () => [WIDGETS._overall(95, 72, 10), WIDGETS._overall(95, 72, 50)].map(x => +x.toFixed(1))), [92.7, 83.5], 'bias: the overall score is a weighted average of the groups');
  ok(/92\.7%/.test(await text(page, '#gg-note')) && /72%/.test(await text(page, '#gg-note')), 'bias: with group B at 10% of the test the overall score looks fine and hides a 23-point gap');
  eq(await D(page, () => [...document.querySelectorAll('#gg-bars .bar i')].map(i => i.style.width)), ['92.7%', '95%', '72%'], 'bias: three bars: overall, group A and group B');
  await setRange(page, '#gg-share', 50);
  ok(/83\.5%/.test(await text(page, '#gg-note')), 'bias: with group B at half of the test the same tool scores 83.5% overall');
  ok((await page.locator('#gg-verdict').getAttribute('class')).includes('bad') && /0\.60/.test(await text(page, '#gg-ratio')), 'bias: 24 of 100 against 40 of 100 is 0.60 of the other group\'s rate, under four-fifths');
  await setRange(page, '#gg-b', 31);
  ok((await page.locator('#gg-verdict').getAttribute('class')).includes('bad'), 'bias: 31 against 40 is 0.78, still under four-fifths');
  await setRange(page, '#gg-b', 32);
  ok((await page.locator('#gg-verdict').getAttribute('class')).includes('ok') && /0\.80/.test(await text(page, '#gg-ratio')) && /not proof of fairness/.test(await text(page, '#gg-verdict')), 'bias: 32 against 40 is exactly 0.80, not flagged, and the lesson says that is not proof of fairness');

  // injection design: break the trifecta
  await goLesson(page, 'risk', 'inject');
  eq(await D(page, () => WIDGETS._legs([{ id: 'a', leg: 'private' }, { id: 'b', leg: 'untrusted' }, { id: 'c', leg: 'outward' }, { id: 'd', leg: 'outward' }], { c: 'approval', d: 'off' })), { private: 'open', untrusted: 'open', outward: 'guarded' }, 'injection design: a leg is open, guarded by approval, or closed');
  ok((await page.locator('#bt-verdict').getAttribute('class')).includes('bad') && /trifecta is complete/.test(await text(page, '#bt-verdict')), 'injection design: with every ability on, the trifecta is complete');
  await page.check('#widget [data-ab="send"][data-v="off"]');
  ok((await page.locator('#bt-verdict').getAttribute('class')).includes('ok') && /broken/.test(await text(page, '#bt-verdict')) && /Way to send things out: closed/.test(await text(page, '#bt-legs')), 'injection design: switching off sending breaks it and the email helper still does its job');
  await page.check('#widget [data-ab="send"][data-v="approval"]');
  const guarded = await page.locator('#bt-verdict').getAttribute('class');
  ok(!guarded.includes('ok') && !guarded.includes('bad') && /You can close/.test(await text(page, '#bt-verdict')) && /a person approves/.test(await text(page, '#bt-legs')), 'injection design: approval on sending only guards a leg, and the picture says a leg could be closed instead');
  await page.click('#widget [data-s="coder"]');
  ok((await page.locator('#bt-verdict').getAttribute('class')).includes('bad'), 'injection design: the coding helper starts with all three legs open');
  await page.check('#widget [data-ab="net"][data-v="off"]');
  ok((await page.locator('#bt-verdict').getAttribute('class')).includes('ok') && /Least privilege/.test(await text(page, '#bt-verdict')), 'injection design: closing the way out is the answer for the coding helper, and unused keys are still flagged');
  await page.check('#widget [data-ab="net"][data-v="on"]'); await page.check('#widget [data-ab="issues"][data-v="off"]');
  ok(/something the job needs/.test(await text(page, '#bt-verdict')) && !(await page.locator('#bt-verdict').getAttribute('class')).includes('ok'), 'injection design: closing a leg by switching off what the job needs is not a pass');
  await page.check('#widget [data-ab="issues"][data-v="on"]');
  await page.click('#widget [data-s="booking"]'); await page.check('#widget [data-ab="confirm"][data-v="approval"]');
  ok(/Also switch off/.test(await text(page, '#bt-verdict')) && !(await page.locator('#bt-verdict').getAttribute('class')).includes('ok'), 'injection design: where all three legs are needed, approval alone is not enough while extras are on');
  await page.check('#widget [data-ab="cards"][data-v="off"]'); await page.check('#widget [data-ab="pages"][data-v="off"]');
  ok((await page.locator('#bt-verdict').getAttribute('class')).includes('ok') && /honest best/.test(await text(page, '#bt-verdict')) && await D(page, () => document.activeElement.dataset.ab === 'pages'), 'injection design: approval plus nothing extra is the honest best for the booking helper, and focus stays put');

  // people in the loop: design a review
  await goLesson(page, 'risk', 'human');
  eq(await D(page, () => { const A = ACADEMY.lessons.human.actions; return [A.length, A.filter(a => a.wrong).length, A.filter(a => a.wrong && (a.out || !a.undo)).length, A.filter(a => a.out || !a.undo).length]; }), [20, 5, 3, 7], 'review: twenty actions, five wrong, three of those costly, seven that go outside or cannot be undone');
  eq(await D(page, () => {
    const L = ACADEMY.lessons.human, f = (r, s) => { const x = WIDGETS._review(L, r, s); return [x.asked, x.caught, x.costlyMissed, x.rows.map(y => y.outcome)]; };
    return [f('none', 'bare'), f('all', 'bare'), f('all', 'plain'), f('all', 'evidence'), f('risky', 'bare'), f('risky', 'plain'), f('risky', 'evidence')];
  }), [
    [0, 0, 3, ['unasked', 'unasked', 'unasked', 'unasked', 'unasked']],
    [20, 0, 3, ['unseen', 'skimmed', 'skimmed', 'skimmed', 'skimmed']],
    [20, 1, 3, ['caught', 'skimmed', 'skimmed', 'skimmed', 'skimmed']],
    [20, 1, 3, ['caught', 'skimmed', 'skimmed', 'skimmed', 'skimmed']],
    [7, 0, 3, ['unasked', 'unseen', 'unseen', 'unasked', 'unseen']],
    [7, 1, 2, ['unasked', 'unseen', 'caught', 'unasked', 'unseen']],
    [7, 3, 0, ['unasked', 'caught', 'caught', 'unasked', 'caught']]
  ], 'review: nobody asked, ask about everything, or ask about the risky seven, each with three screens, gives the scripted catches');
  ok((await page.locator('#rv-verdict').getAttribute('class')).includes('bad') && /skim/.test(await text(page, '#rv-verdict')) && await page.locator('#rv-queue .pk').count() === 20, 'review: asking about everything with a bare "Approve?" catches nothing, and 20 prompts are too many to read');
  await page.check('#widget [data-rule="risky"]'); await page.check('#widget [data-show="plain"]');
  ok(/screen did not show the problem/.test(await text(page, '#rv-verdict')) && /2 costly mistakes/.test(await text(page, '#rv-verdict')), 'review: with plain words only, the subtle wrong actions still go out');
  await page.check('#widget [data-show="evidence"]');
  ok((await page.locator('#rv-verdict').getAttribute('class')).includes('ok') && /Every costly mistake was caught/.test(await text(page, '#rv-verdict')) && await page.locator('#rv-queue .pk').count() === 7 && /based on/.test(await text(page, '#rv-queue')), 'review: asking only about the risky seven and showing the evidence catches all three costly mistakes');
  await page.check('#widget [data-rule="none"]');
  ok(/Nobody is asked/.test(await text(page, '#rv-queue')) && (await page.locator('#rv-verdict').getAttribute('class')).includes('bad') && await D(page, () => document.activeElement.dataset.rule === 'none'), 'review: with nobody asked, everything goes out, and focus stays on the choice');

  // @@TRACK-TESTS (new tracks add their checks above this line)

  // ------------------------------------------------------------------ sandbox
  section('Prompt sandbox');
  await goLesson(page, 'prompting', 'judge');
  ok(/1 of 6/.test(await text(page, '#L2 #sb-score')), 'judge lesson: the weak example scores one');
  await page.click('#L2 #widget [data-ex="2"]');
  ok(/6 of 6/.test(await text(page, '#L2 #sb-score')) && /No obvious real data/.test(await text(page, '#L2 #sb-warn')), 'judge lesson: the strong example scores six and raises no data warning');
  await page.keyboard.press('Escape'); await D(page, () => document.activeElement.blur());
  await page.keyboard.press('s');
  ok(await page.locator('#sandbox').isVisible() && await D(page, () => document.activeElement.id === 'sb-title'), 'the S key opens the sandbox and moves focus into it');
  ok(await D(page, () => document.querySelector('#stage').inert && document.querySelector('#bar').inert), 'while the sandbox is open the page behind is inert');
  await page.fill('#sandbox #sb-text', 'Email jo.sample@example.com about card 4000 1234 5678 9010. Dr Sample and Priya Natarajan are copied. Project Kestrel is late.');
  const warns = await page.locator('#sandbox #sb-warn li').allInnerTexts();
  ok(warns.some(w => /jo\.sample@example\.com/.test(w)), 'sandbox warns on an email address');
  ok(warns.some(w => /4000 1234 5678 9010/.test(w)), 'sandbox warns on a long run of digits');
  ok(warns.some(w => /Dr Sample/.test(w)) && warns.some(w => /Priya Natarajan/.test(w)), 'sandbox warns on a title with a name and on two capitalised words');
  ok(!warns.some(w => /kestrel/i.test(w) && /watch list/.test(w)), 'before it is listed, the project name is not on the watch list');
  await page.fill('#sandbox #sb-names', 'Kestrel, Heron');
  ok((await page.locator('#sandbox #sb-warn li').allInnerTexts()).some(w => /Kestrel/.test(w) && /watch list/.test(w)), 'a name you list is flagged');
  eq(await D(page, () => ACADEMY_DEBUG.state().names), ['Kestrel', 'Heron'], 'the watch list is kept in the browser');
  await page.fill('#sandbox #sb-text', 'You are a Scrum Master. Summarise the Sprint Review notes for the Product Owner in three bullets, under 60 words.');
  ok(/No obvious real data/.test(await text(page, '#sandbox #sb-warn')), 'ordinary agile words (Scrum Master, Sprint Review, Product Owner) are not mistaken for names');
  ok(/[45] of 6/.test(await text(page, '#sandbox #sb-score')), 'that prompt scores well on the rubric');
  ok(await D(page, () => !/Summarise the Sprint Review/.test(JSON.stringify(ACADEMY_DEBUG.state())) && !/Summarise the Sprint Review/.test(localStorage.getItem('aiacademy.v1') || '')), 'what you type in the sandbox is not stored');
  await page.keyboard.press('Escape');
  ok(await page.locator('#sandbox').isHidden() && await D(page, () => !document.querySelector('#stage').inert), 'Esc closes the sandbox and the page is live again');
  const scan = await D(page, () => ({ clean: WIDGETS._scan('The Team met on Monday. Help Needed: none.', []).length, short: WIDGETS._scan('Ticket 12345 and build 2026.', []).length, phone: WIDGETS._scan('call 555-010-9999', []).length }));
  eq(scan, { clean: 0, short: 0, phone: 1 }, 'the data check ignores short numbers and plain headings, and catches a phone-length number');
  await page.close();

  // ------------------------------------------------------------------ quiz, XP, cards by keyboard
  section('A lesson quiz by keyboard, XP, review cards');
  page = await open(browser);
  await goLesson(page, 'models', 'tokens');
  const answers = await D(page, () => ACADEMY.lessons.tokens.quiz.map(q => q.a));
  await page.keyboard.press(String(answers[0] + 1));
  ok(await page.locator('#quiz .opt.right').count() === 1 && /Right/.test(await text(page, '#quiz .why')), 'pressing a number answers; the right option is marked with a tick and words, not colour alone');
  ok(/✓ correct/.test(await text(page, '#quiz .opt.right')), 'the correct option carries a text mark');
  eq(await D(page, () => document.activeElement.dataset.act), 'next', 'focus moves to Next question');
  await page.keyboard.press('Enter');
  await page.keyboard.press(String(((answers[1] + 1) % 4) + 1)); // a wrong one on purpose
  ok(/Not quite/.test(await text(page, '#quiz .why')) && /✗ your pick/.test(await text(page, '#quiz .opt.wrong')), 'a wrong answer is shown as wrong, with the reason');
  await page.keyboard.press('Enter');
  await page.keyboard.press(String(answers[2] + 1)); await page.keyboard.press('Enter');
  await page.keyboard.press(String(answers[3] + 1)); await page.keyboard.press('Enter');
  ok(/3 of 4 right/.test(await text(page, '#quiz')), 'the quiz ends with the score');
  let st = await D(page, () => ACADEMY_DEBUG.state());
  eq(st.xp, 5 + 1 + 5 + 5 + 20, 'XP: 5 per right answer, 1 for a miss, 20 for finishing');
  eq(Object.keys(st.cards).length, 4, 'four review cards were made');
  eq([st.cards['tokens.q1'].int, st.cards['tokens.q1'].rep, st.cards['tokens.q2'].rep], [1, 1, 0], 'a right answer is due tomorrow; the missed one restarts');
  eq(await D(page, () => ACADEMY_DEBUG.dueIds()), ['tokens.q2'], 'the missed card is due again today');
  ok(/Next lesson: The context window/.test(await text(page, '#quiz')), 'the finish screen offers the next lesson');
  await page.click('#quiz [data-act="nextlesson"]');
  eq(await D(page, () => ACADEMY_DEBUG.state().pos.concept), 'context', 'Next lesson chains on');
  ok(/1\s*day streak/.test(await text(page, '#c-streak')) && /Level\s*1/.test(await text(page, '#c-level')), 'streak and level chips update', await text(page, '#c-streak') + ' | ' + await text(page, '#c-level'));
  await page.click('#quiz [data-opt="0"]'); await page.click('#quiz [data-act="next"]');
  const xpBefore = await D(page, () => ACADEMY_DEBUG.state().xp);
  await goLesson(page, 'models', 'tokens'); await page.keyboard.press(String(answers[0] + 1));
  eq(await D(page, () => ACADEMY_DEBUG.state().xp), xpBefore, 'replaying a question you have seen earns no XP and keeps the card schedule');

  // ------------------------------------------------------------------ SM-2
  section('Spaced repetition (SM-2) intervals');
  const sm2 = await D(page, () => {
    const g = ACADEMY_DEBUG.grade, S = ACADEMY_DEBUG.state(), t = ACADEMY_DEBUG.dayNow(), out = {};
    const run = (id, qs) => qs.map(q => { g(id, q); const c = S.cards[id]; return [c.int, +c.ef.toFixed(2), c.rep, c.due - t]; });
    out.good = run('t.good', [4, 4, 4, 4]);
    out.easy = run('t.easy', [5, 5, 5]);
    out.hard = run('t.hard', [3, 3, 3]);
    out.lapse = run('t.lapse', [4, 4, 4, 1, 4, 4]);
    out.floor = run('t.floor', Array(12).fill(3)).pop()[1];
    ['t.good', 't.easy', 't.hard', 't.lapse', 't.floor'].forEach(id => delete S.cards[id]);
    return out;
  });
  eq(sm2.good, [[1, 2.5, 1, 1], [6, 2.5, 2, 6], [15, 2.5, 3, 15], [38, 2.5, 4, 38]], 'Good x4: 1 day, 6 days, then x2.5 (15, 38); ease stays 2.5');
  eq(sm2.easy, [[1, 2.6, 1, 1], [6, 2.7, 2, 6], [17, 2.8, 3, 17]], 'Easy: ease rises 0.1 each time; third interval is 6 x 2.7 rounded up');
  eq(sm2.hard, [[1, 2.36, 1, 1], [6, 2.22, 2, 6], [14, 2.08, 3, 14]], 'Hard: ease falls 0.14 each time; third interval is 6 x 2.22 rounded up');
  eq(sm2.lapse.slice(3), [[1, 2.5, 0, 0], [1, 2.5, 1, 1], [6, 2.5, 2, 6]], 'Again: the card restarts, is due today, and the ease is unchanged');
  eq(sm2.floor, 1.3, 'the ease never drops below 1.3');

  section('Review session');
  await D(page, () => { const S = ACADEMY_DEBUG.state(), t = ACADEMY_DEBUG.dayNow(); Object.keys(S.cards).forEach(id => { S.cards[id].due = t; }); ACADEMY_DEBUG.go(0); });
  const dueN = await D(page, () => ACADEMY_DEBUG.dueIds().length);
  ok(new RegExp('Review\\s*' + dueN).test(await text(page, '#c-review')), 'the Review chip counts the due cards');
  await D(page, () => document.activeElement.blur()); await page.keyboard.press('r');
  ok(await page.locator('#review').isVisible() && /card 1 of/i.test(await text(page, '#review')), 'the R key opens the review');
  const first = await D(page, () => { const id = ACADEMY_DEBUG.dueIds()[0]; const all = Object.values(ACADEMY.lessons).flatMap(l => l.quiz); return { id, a: all.find(q => q.id === id).a, rep: ACADEMY_DEBUG.state().cards[id].rep }; });
  await page.keyboard.press(String(first.a + 1));
  ok(/How did that feel/.test(await text(page, '#review')), 'a right answer asks Hard, Good or Easy');
  await page.keyboard.press('2');
  const after = await D(page, id => { const c = ACADEMY_DEBUG.state().cards[id]; return { rep: c.rep, ahead: c.due - ACADEMY_DEBUG.dayNow() }; }, first.id);
  ok(after.rep === first.rep + 1 && after.ahead >= 1, 'Good moves the card forward and into the future');
  ok(/card 2 of/i.test(await text(page, '#review')), 'the next card comes up');
  const second = await D(page, () => { const id = ACADEMY_DEBUG.dueIds()[0]; const all = Object.values(ACADEMY.lessons).flatMap(l => l.quiz); return { id, a: all.find(q => q.id === id).a }; });
  await page.keyboard.press(String(((second.a + 1) % 4) + 1)); await page.keyboard.press('Enter');
  eq(await D(page, id => { const c = ACADEMY_DEBUG.state().cards[id]; return [c.rep, c.due - ACADEMY_DEBUG.dayNow()]; }, second.id), [0, 0], 'a miss in review restarts the card and keeps it due today');
  await page.keyboard.press('Escape');
  ok(await page.locator('#review').isHidden(), 'Esc closes the review');
  await D(page, () => { const S = ACADEMY_DEBUG.state(), t = ACADEMY_DEBUG.dayNow(); S.days = {}; S.days[t] = { min: 3, xp: 5 }; S.days[t - 1] = { min: 12, xp: 0 }; S.days[t - 2] = { min: 0, xp: 9 }; S.days[t - 4] = { min: 9, xp: 9 }; ACADEMY_DEBUG.go(0); });
  ok(/3\s*day streak/.test(await text(page, '#c-streak')), 'streak counts back over consecutive active days and stops at a gap');
  ok(/3\s*\/ 10 min/.test(await text(page, '#c-goal')), 'the goal chip shows minutes studied today against the goal');

  // ------------------------------------------------------------------ roles tree
  section('Roles family tree');
  await D(page, () => document.activeElement.blur()); await page.keyboard.press('t');
  eq(await page.locator('#L0 .rnode').count(), 17, 'the T key opens the tree with seventeen roles');
  eq(await page.locator('#L0 .rnode.you').count(), 3, 'Project Manager, Scrum Master and Agile Coach are marked as yours');
  ok(await page.locator('#L0 .rnode.fc').count() >= 1 && /forecast/.test(await text(page, '#L0 .rnode.fc >> nth=0')), 'forecast roles are labelled as forecasts');
  ok(/Ian Miell/.test(await text(page, '#L0')) && await page.locator('#L0 a[href*="ianmiell.github.io"]').count() === 1, 'the tree credits Ian Miell with a link');
  eq(await text(page, '#z-stops'), 'Tree\nFamily\nRole\nDetail', 'the zoom stops read Tree, Family, Role, Detail');
  await page.click('#L0 [data-filter="ops"]');
  ok(await page.locator('#L0 .rnode.dim').count() === 13, 'a family filter dims the other families');
  await page.click('#L0 [data-filter=""]');
  await page.click('#L0 [data-role="sm"]');
  ok(/Scrum Master/.test(await text(page, '#L2 h1')) && /Where it came from/i.test(await text(page, '#L2')), 'tapping a role zooms to it and shows where it came from and leads');
  await page.keyboard.press('+');
  ok(/What AI changes/.test(await text(page, '#L3')) && /R9/.test(await text(page, '#L3')) && await D(page, () => parseFloat(getComputedStyle(document.querySelector('#L3 .article')).fontSize) >= 20), 'zooming in again opens the big-type Read more with its source');
  await page.keyboard.press('-'); await page.keyboard.press('-');
  ok(/Delivery and agile/.test(await text(page, '#L1 h1')) && await page.locator('#L1 .node').count() === 5, 'zooming out shows the family and its five roles');
  const fa = await D(page, () => ACADEMY.roles.families[0].quiz.map(q => q.a));
  for (const a of fa) { await page.keyboard.press(String(a + 1)); await page.keyboard.press('Enter'); }
  ok(/3 of 3 right/.test(await text(page, '#fquiz')), 'the family quiz works by keyboard');
  ok(await D(page, () => !!ACADEMY_DEBUG.state().cards['roles.delivery.q1']), 'roles questions become review cards');
  await page.keyboard.press('m');
  eq(await D(page, () => ACADEMY_DEBUG.state().pos.space), 'learn', 'the M key returns to the learning map');

  // ------------------------------------------------------------------ save and load
  section('Save and Load to a file');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-'));
  await page.click('#c-menu');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#menu [data-m="save"]')]);
  const saved = path.join(tmp, 'progress.json'); await dl.saveAs(saved);
  const file = JSON.parse(fs.readFileSync(saved, 'utf8'));
  eq(dl.suggestedFilename(), 'ai-academy-progress.json', 'Save downloads ai-academy-progress.json');
  ok(file.v === 1 && Object.keys(file.cards).length >= 7 && file.xp > 0 && file.done.tokens === true, 'the file holds the cards, XP and finished lessons');
  eq(file.names, [], 'the sandbox watch list is left out of the file');
  const want = await D(page, () => { const s = ACADEMY_DEBUG.state(); return [s.xp, Object.keys(s.cards).sort(), s.done, s.days]; });
  await page.click('#menu [data-m="reset"]'); await page.click('#menu [data-m="reset"]');
  eq(await D(page, () => { const s = ACADEMY_DEBUG.state(); return [s.xp, Object.keys(s.cards).length]; }), [0, 0], 'Reset (pressed twice) erases progress');
  await page.setInputFiles('#m-file', saved);
  await page.waitForFunction(() => /Progress loaded/.test(document.querySelector('#menu').textContent));
  eq(await D(page, () => { const s = ACADEMY_DEBUG.state(); return [s.xp, Object.keys(s.cards).sort(), s.done, s.days]; }), want, 'Load brings everything back exactly');
  await page.waitForTimeout(50);
  ok(await D(page, () => JSON.parse(localStorage.getItem('aiacademy.v1')).xp > 0), 'loaded progress is written to the browser store straight away');
  const bad = path.join(tmp, 'bad.json'); fs.writeFileSync(bad, '{"hello": "world"}');
  await page.setInputFiles('#m-file', bad);
  await page.waitForFunction(() => /not an AI Academy progress file/.test(document.querySelector('#menu').textContent));
  eq(await D(page, () => ACADEMY_DEBUG.state().xp), want[0], 'a file that is not a progress file is refused and nothing changes');
  const junk = path.join(tmp, 'junk.json'); fs.writeFileSync(junk, 'not json at all');
  await page.setInputFiles('#m-file', junk);
  await page.waitForFunction(() => /not an AI Academy progress file/.test(document.querySelector('#menu').textContent));
  const t0 = await D(page, () => ACADEMY_DEBUG.dayNow());
  const legacy = path.join(tmp, 'legacy.json'); // the shape the first prototype saved: no names, no roles position
  fs.writeFileSync(legacy, JSON.stringify({ v: 1, xp: 36, days: { [t0]: { min: 4, xp: 36 } }, cards: { 'tokens.q1': { ef: 2.5, rep: 1, int: 1, due: t0 + 1, n: 1 }, 'gone.q9': { ef: 2.5, rep: 1, int: 1, due: t0, n: 1 }, 'broken': { ef: 'x' } }, done: { tokens: true }, goal: 20, read: 24, theme: 'dark', pos: { track: 'models', concept: 'tokens', zoom: 2 } }));
  await page.setInputFiles('#m-file', legacy);
  await page.waitForFunction(() => ACADEMY_DEBUG.state().xp === 36);
  const lg = await D(page, () => { const s = ACADEMY_DEBUG.state(); return [s.goal, s.read, s.theme, s.pos.space, s.pos.zoom, !!s.cards['tokens.q1'], !!s.cards.broken, ACADEMY_DEBUG.dueIds(), document.documentElement.dataset.theme]; });
  eq(lg, [20, 24, 'dark', 'learn', 2, true, false, [], 'dark'], 'a file from the first prototype still loads; a damaged card is dropped and a card for a question that no longer exists is ignored');
  await page.reload();
  eq(await D(page, () => [ACADEMY_DEBUG.state().xp, ACADEMY_DEBUG.state().pos.zoom]), [36, 2], 'progress and position survive a reload');
  eq(page.errors, [], 'no script errors on the desktop run');
  eq(page.net, [], 'the page asked for nothing over the network');
  await page.close();

  // ------------------------------------------------------------------ every lesson opens
  section('Every lesson opens and runs without errors (desktop)');
  page = await open(browser);
  await D(page, () => ACADEMY_DEBUG.go(1, 'models'));
  const everyLesson = await D(page, () => ACADEMY.tracks.flatMap(t => t.concepts.filter(c => ACADEMY.lessons[c.id]).map(c => [t.id, c.id])));
  for (const [t, c] of everyLesson) {
    await goLesson(page, t, c);
    if (c === 'aiphases') await page.locator('#widget [data-card="i2"][data-b="ai"]').check();
    if (c === 'aievidence') await page.locator('#widget [data-claim="e2"][data-v="said"]').check();
    if (c === 'airehearse') { await page.fill('#rh-in', 'A sentence of my own, long enough to unlock the sample answer.'); await page.locator('#rh-show').click(); }
    if (c === 'training') await page.click('#widget [data-a="train"]');
    if (c === 'format') await page.click('#widget [data-f="2"]');
    if (c === 'judge') await page.click('#widget [data-ex="3"]');
    if (c === 'loop') await page.click('#widget [data-a="run"]');
    if (c === 'memory') { await page.check('#widget [data-save="secret"]'); await page.click('#widget [data-a="new"]'); await page.click('#widget [data-ask="secret"]'); }
    ok(await page.locator('#widget').isVisible() && await page.locator('#quiz').isVisible(), 'lesson draws its picture and quiz: ' + c);
    await page.locator('#quiz [data-opt="0"]').click();
  }
  await D(page, () => ACADEMY_DEBUG.go(3)); ok(await page.locator('.layer.is-cur').isVisible(), 'read more opens');
  await D(page, () => { const s = ACADEMY_DEBUG.state(); s.pos.space = 'roles'; ACADEMY_DEBUG.go(0); });
  await page.locator('#L0 [data-role="context"]').click(); await D(page, () => ACADEMY_DEBUG.go(3)); await D(page, () => ACADEMY_DEBUG.go(1));
  ok(await page.locator('.layer.is-cur').isVisible(), 'a role, its read more and its family open');
  await page.locator('#c-review').click(); ok(await page.locator('#review').isVisible(), 'the review sheet opens');
  await page.locator('#review [data-r="close"]').click();
  await page.locator('#c-menu').click(); await page.locator('#menu [data-m="sandbox"]').click(); await page.locator('#sandbox [data-ex="3"]').click();
  ok(await page.locator('#sandbox #sb-alarm').isVisible(), 'the sandbox sheet shows its warnings');
  eq(page.errors, [], 'no script errors across every lesson, role and sheet');
  await page.close();

  // ------------------------------------------------------------------ light and dark
  section('Light and dark: text contrast');
  const contrast = () => {
    const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const probe = document.createElement('div'); document.body.appendChild(probe);
    const col = v => { probe.style.color = 'var(' + v + ')'; return getComputedStyle(probe).color; };
    const out = {}; for (const bg of ['--bg', '--surface', '--chip']) for (const fg of ['--text', '--muted', '--ok', '--err', '--info']) out[fg + ' on ' + bg] = +cr(col(fg), col(bg)).toFixed(2);
    out['button text'] = +cr(col('--on-accent'), col('--accent')).toFixed(2); probe.remove();
    return { out, scheme: getComputedStyle(document.documentElement).colorScheme, bg: getComputedStyle(document.body).backgroundColor };
  };
  for (const scheme of ['light', 'dark']) {
    page = await open(browser, { colorScheme: scheme });
    const c = await D(page, contrast);
    const low = Object.entries(c.out).filter(([k, v]) => v < 4.5);
    eq(low, [], scheme + ' (following the system): every text colour has at least 4.5:1 contrast');
    ok(c.scheme.includes(scheme), scheme + ': the page follows the system setting');
    await page.close();
  }
  page = await open(browser, { colorScheme: 'light' });
  await page.click('#c-menu'); await page.click('#menu [data-m="theme"]'); await page.click('#menu [data-m="theme"]');
  let c2 = await D(page, contrast);
  ok(await D(page, () => document.documentElement.dataset.theme === 'dark') && c2.scheme.includes('dark') && Object.values(c2.out).every(v => v >= 4.5), 'the Theme button forces dark on a light system, with good contrast');
  ok(await D(page, () => document.activeElement.dataset.m === 'theme'), 'the Theme button keeps keyboard focus after it is pressed');
  await page.close();
  page = await open(browser, { colorScheme: 'dark' });
  await page.click('#c-menu'); await page.click('#menu [data-m="theme"]');
  c2 = await D(page, contrast);
  ok(c2.scheme.includes('light') && Object.values(c2.out).every(v => v >= 4.5), 'the Theme button forces light on a dark system, with good contrast');
  await page.close();

  // ------------------------------------------------------------------ reduced motion and keyboard
  section('Reduced motion');
  page = await open(browser, { reducedMotion: 'reduce' });
  await goLesson(page, 'models', 'tokens');
  const rm = await D(page, () => { const dur = el => Math.max(...getComputedStyle(el).transitionDuration.split(',').map(parseFloat)); const tok = document.querySelector('.tok'); return { layer: dur(document.querySelector('.layer.is-cur')), hidden: getComputedStyle(document.querySelector('#L0')).transform, ring: dur(document.querySelector('.ring .fg')), anim: parseFloat(getComputedStyle(tok).animationDuration) }; });
  ok(rm.layer < 0.01 && rm.ring < 0.01 && rm.anim < 0.01 && rm.hidden === 'none', 'with reduced motion on, zoom, rings and chips do not animate or scale', JSON.stringify(rm));
  await page.close();
  page = await open(browser);
  ok(await D(page, () => Math.max(...getComputedStyle(document.querySelector('.layer.is-cur')).transitionDuration.split(',').map(parseFloat)) > 0.2), 'without it, the zoom is animated');

  section('Keyboard only');
  await page.keyboard.press('Tab');
  const seen = []; for (let i = 0; i < 12; i++) { seen.push(await D(page, () => { const a = document.activeElement; return a.id || a.dataset.space || a.dataset.act || a.dataset.track || a.tagName; })); await page.keyboard.press('Tab'); }
  ok(seen.includes('c-review') && seen.includes('c-menu') && seen.includes('learn') && seen.includes('continue') && seen.includes('models'), 'Tab reaches the top bar, the map switch, Continue and the tracks, in order', seen.join(' '));
  ok(await D(page, () => { const a = document.activeElement, s = getComputedStyle(a); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; }), 'the focused control has a visible outline');
  await page.focus('#c-menu'); await page.keyboard.press('Enter');
  ok(await page.locator('#menu').isVisible() && await D(page, () => document.querySelector('#menu').contains(document.activeElement)), 'Enter on Menu opens it and moves focus inside');
  await page.keyboard.press('Escape');
  ok(await page.locator('#menu').isHidden() && await D(page, () => document.activeElement.id === 'c-menu'), 'Esc closes the menu and returns focus to the Menu button');
  await page.focus('#L0 [data-act="continue"]'); await page.keyboard.press('Enter');
  eq(await D(page, () => [ACADEMY_DEBUG.state().pos.zoom, ACADEMY_DEBUG.state().pos.concept]), [2, 'tokens'], 'Enter on Start opens the first lesson');
  await page.focus('#tk-in'); await page.keyboard.type('1 + 2 - 3');
  eq(await D(page, () => [ACADEMY_DEBUG.state().pos.zoom, Object.keys(ACADEMY_DEBUG.state().cards).length, document.querySelector('#tk-in').value.endsWith('1 + 2 - 3')]), [2, 0, true], 'typing digits, + and - in a text box types; it does not answer the quiz or zoom');
  await page.focus('#c-review'); await page.keyboard.press('Enter');
  ok(/Nothing due/.test(await text(page, '#review')) && await D(page, () => document.querySelector('#review').contains(document.activeElement)), 'the review sheet opens with focus inside, even when nothing is due');
  await page.keyboard.press('Enter');
  ok(await page.locator('#review').isHidden() && await D(page, () => document.activeElement.id === 'c-review'), 'closing it returns focus to where you were');
  await goLesson(page, 'models', 'context');
  await page.focus('#cx-win'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  ok(/180 tokens/.test(await text(page, '#cx-winv')), 'sliders work with the arrow keys');
  eq(page.errors, [], 'no script errors on the keyboard run');
  eq(page.net, [], 'still nothing over the network');
  await page.close();

  // ------------------------------------------------------------------ keyboard: arrows, roving tabindex, Esc, ?, focus
  section('Keyboard: arrows, one tab stop per list, Esc goes up, the keys sheet');
  page = await open(browser);
  const at = () => D(page, () => { const a = document.activeElement, d = a.dataset || {}; return d.track || d.concept || d.role || d.fam || d.z || d.opt || d.ropt || d.g || d.m || d.filter || d.space || d.act || a.id || a.tagName; });
  const zoom = () => D(page, () => ACADEMY_DEBUG.state().pos.zoom);
  const press = async (...keys) => { for (const k of keys) await page.keyboard.press(k); };
  eq(await D(page, () => [...document.querySelectorAll('#L0 .tcard')].filter(b => b.tabIndex === 0).map(b => b.dataset.track)), ['models'], 'the Map is one tab stop: only the track you are at can be tabbed to');
  eq(await D(page, () => ['.tabs', '.acts', '#z-stops'].map(g => [...document.querySelectorAll(g + ' button')].filter(b => b.tabIndex === 0).length)), [1, 1, 1], 'the map switch, the action row and the zoom stops are one tab stop each');
  let stops = 0; await page.keyboard.press('Tab'); while (await at() !== 'z-keys' && stops < 30) { stops++; await page.keyboard.press('Tab'); }
  ok(stops <= 10, 'Tab crosses the whole Map in a few stops, not one per tile', stops + ' stops');
  await page.keyboard.press('m');
  eq(await at(), 'models', 'M lands the keyboard on the track you are at');
  await press('ArrowRight'); const k1 = await at(); await press('ArrowDown'); const k2 = await at(); await press('ArrowLeft'); const k3 = await at(); await press('ArrowUp');
  eq([k1, k2, k3, await at()], ['prompting', 'evals', 'grounding', 'models'], 'arrow keys walk the 3 by 3 map in all four directions');
  await press('End'); const kEnd = await at(); await press('Home');
  eq([kEnd, await at()], ['agile', 'models'], 'End and Home jump to the last and first track');
  await press('ArrowLeft'); eq([await at(), await zoom()], ['models', 0], 'an arrow at the edge stays put');
  await press('Enter');
  eq([await zoom(), await at()], [1, 'tokens'], 'Enter opens the track and lands on its current lesson');
  eq(await D(page, () => document.activeElement.classList.contains('node')), true, 'focus is on the lesson in the path, not on a heading');
  await press('ArrowDown', 'ArrowDown'); eq(await at(), 'nexttoken', 'arrow keys move between lessons');
  await press('ArrowUp', 'Enter');
  eq([await zoom(), await D(page, () => ACADEMY_DEBUG.state().pos.concept), await at()], [2, 'context', 'H1'], 'Enter opens the lesson and focus lands on its heading');
  await press('Escape');
  eq([await zoom(), await at()], [1, 'context'], 'Esc goes up one level and focus returns to the lesson you were in');
  await press('Escape');
  eq([await zoom(), await at()], [0, 'models'], 'Esc again goes up to the Map, on the track you were in');
  await press('Escape'); eq(await zoom(), 0, 'Esc on the Map does nothing');
  await press('Enter'); eq([await zoom(), await at()], [1, 'context'], 'coming back into the same track keeps your lesson');

  await page.focus('#z-stops [data-z="1"]'); await press('ArrowRight', 'ArrowRight');
  eq([await at(), await zoom()], ['3', 1], 'arrow keys move along the zoom stops without zooming');
  await press('Enter'); eq([await zoom(), await at()], [3, 'H1'], 'Enter on a zoom stop goes there');
  await press('Escape', 'Escape'); eq(await zoom(), 1, 'Esc steps back out through Concept to Track');
  ok(await page.locator('#zoombar kbd').count() >= 5 && /Esc/.test(await text(page, '#zoombar')) && await page.locator('#c-review kbd').count() === 1, 'the zoom bar and the Review button show their keys');
  await press('m'); ok(/C/.test(await text(page, '#L0 [data-act="continue"] kbd')) && /M/.test(await text(page, '#L0 [data-space="learn"] kbd')), 'buttons on the Map show their keys');
  eq(await D(page, () => document.querySelector('#L0 [data-act="continue"]').getAttribute('aria-keyshortcuts')), 'C', 'and say so to a screen reader, while the hint itself is hidden from it');
  await press('c'); eq([await zoom(), await D(page, () => ACADEMY_DEBUG.state().pos.concept)], [2, 'tokens'], 'C continues with the next lesson');

  // the lesson rail and the quiz options
  await page.focus('#lrail [aria-current]'); await press('ArrowRight'); eq(await at(), 'context', 'the lesson rail: arrows move between the lessons of the track');
  await press('ArrowLeft');
  await page.focus('#quiz .q'); await press('ArrowDown'); eq(await at(), '0', 'from the question, an arrow steps into the answers');
  await press('ArrowDown', 'ArrowDown'); eq(await at(), '2', 'arrow keys move between the answers');
  eq(await D(page, () => [...document.querySelectorAll('#quiz .opt')].filter(b => b.tabIndex === 0).length), 1, 'the answers are one tab stop');
  await press('Enter');
  ok(await D(page, () => document.querySelector('#quiz .opt[data-opt="2"]').classList.contains('right') || document.querySelector('#quiz .opt[data-opt="2"]').classList.contains('wrong')), 'Enter picks the answer that has focus');
  eq(await at(), 'next', 'and focus moves on to Next question');

  // typing is never interrupted
  await page.focus('#tk-in'); await page.keyboard.type('?mtrsc'); await press('ArrowLeft', 'ArrowUp', 'Escape');
  eq([await zoom(), await at(), await page.locator('#keys').isHidden(), await D(page, () => document.querySelector('#tk-in').value.endsWith('?mtrsc')), await D(page, () => ACADEMY_DEBUG.state().pos.space)], [2, 'tk-in', true, true, 'learn'], 'in a text box, letters, ?, arrows and Esc belong to the text box');

  // checkboxes in a set are one stop
  await goLesson(page, 'prompting', 'parts');
  eq(await D(page, () => [...document.querySelectorAll('#pt-toggles input')].filter(b => b.tabIndex === 0).length), 1, 'a set of checkboxes is one tab stop');
  await page.focus('#pt-toggles [data-part="role"]'); await press('ArrowRight', 'Space');
  eq(await D(page, () => [document.activeElement.dataset.part, document.activeElement.checked]), ['task', false], 'arrows move along the checkboxes, Space switches the one in focus, and focus stays on it');
  await goLesson(page, 'agents', 'planning');
  await page.focus('#pl-list [data-down="0"]'); await press('ArrowDown');
  eq(await D(page, () => Object.keys(document.activeElement.dataset)[0] + document.activeElement.dataset.down), 'down1', 'in the plan, the down arrow goes to the same button on the next step');

  // the keys sheet
  await D(page, () => document.activeElement.blur()); await page.keyboard.press('?');
  ok(await page.locator('#keys').isVisible() && await D(page, () => document.querySelector('#keys').contains(document.activeElement)), 'the ? key opens the keys sheet with focus inside');
  ok(await D(page, () => document.querySelector('#stage').inert && document.querySelector('#zoombar').inert), 'the page behind the keys sheet is inert');
  ok((await page.locator('#keys dt:not(.h)').count()) >= 14 && /Hard, Good, Easy/.test(await text(page, '#keys')), 'it lists every shortcut');
  await press('Tab', 'Tab'); ok(await D(page, () => document.querySelector('#keys').contains(document.activeElement)), 'Tab stays inside the keys sheet');
  await press('m'); eq([await page.locator('#keys').isVisible(), await zoom()], [true, 2], 'other shortcuts are off while it is open');
  await press('Escape'); ok(await page.locator('#keys').isHidden(), 'Esc closes it');
  await page.focus('#z-keys'); await press('Enter'); ok(await page.locator('#keys').isVisible(), 'the keys button in the zoom bar opens it too');
  await page.keyboard.press('?'); eq([await page.locator('#keys').isHidden(), await at()], [true, 'z-keys'], '? closes it again and focus returns to the button that opened it');

  // dialogs trap focus and give it back
  await D(page, () => { const S = ACADEMY_DEBUG.state(), t = ACADEMY_DEBUG.dayNow(); ACADEMY.lessons.tokens.quiz.forEach(q => { S.cards[q.id] = { ef: 2.5, rep: 1, int: 1, due: t, n: 1 }; }); S.pos.space = 'learn'; ACADEMY_DEBUG.go(0); });
  await page.focus('#L0 [data-act="review"]'); await press('Enter');
  ok(await page.locator('#review').isVisible(), 'Enter on Review opens the review');
  const inReview = () => D(page, () => document.querySelector('#review').contains(document.activeElement));
  let trapped = true; for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); trapped = trapped && await inReview(); }
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Shift+Tab'); trapped = trapped && await inReview(); }
  ok(trapped, 'Tab and Shift+Tab go round inside the review and never leave it');
  await page.focus('#review [data-r="close"]'); await press('ArrowDown'); eq(await at(), '0', 'in a review, an arrow steps into the answers');
  const ra = await D(page, () => { const id = ACADEMY_DEBUG.dueIds()[0]; return ACADEMY.lessons.tokens.quiz.find(q => q.id === id).a; });
  for (let i = 0; i < ra; i++) await press('ArrowDown');
  await press('Enter');
  eq(await at(), '4', 'after a right answer focus lands on Good');
  await press('ArrowLeft'); const g1 = await at(); await press('ArrowRight', 'ArrowRight'); eq([g1, await at()], ['3', '5'], 'arrow keys move between Hard, Good and Easy');
  ok(await page.locator('#review .grades kbd').count() === 3 && /Esc/.test(await text(page, '#review [data-r="close"]')), 'the grade buttons and Close show their keys');
  await press('Enter'); ok(/card 2 of/i.test(await text(page, '#review')), 'Enter on a grade moves to the next card');
  await press('Escape');
  eq([await page.locator('#review').isHidden(), await at()], [true, 'review'], 'Esc closes the review and focus returns to the Review button on the Map, even though the Map was redrawn');
  await press('s');
  const inSb = () => D(page, () => document.querySelector('#sandbox').contains(document.activeElement));
  let sbTrap = true; for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); sbTrap = sbTrap && await inSb(); }
  ok(sbTrap, 'Tab goes round inside the sandbox');
  await page.focus('#sb-text'); await page.keyboard.type('a ? b'); ok(await page.locator('#keys').isHidden() && (await page.inputValue('#sb-text')).endsWith('a ? b'), 'typing ? in the sandbox types a question mark');
  await page.focus('#sandbox [data-ex="0"]'); await press('ArrowRight'); eq(await D(page, () => document.activeElement.dataset.ex), '1', 'the example chips are one row to walk with the arrows');
  ok(await page.locator('#sb-segs i').count() === 6, 'the rubric score is also drawn as six cells');
  await press('Escape'); eq([await page.locator('#sandbox').isHidden(), await at()], [true, 'review'], 'Esc closes the sandbox and focus goes back to where it was');

  // the menu
  await page.focus('#c-menu'); await press('Enter'); eq(await at(), 'map', 'the Menu opens on its first button');
  await press('ArrowRight'); const m1 = await at(); await press('ArrowDown'); const m2 = await at(); await press('ArrowDown'); eq([m1, m2, await at()], ['roles', 'sandbox', 'theme'], 'arrow keys move around the Menu');
  await page.focus('#menu input[name="m-goal"][value="10"]'); await press('ArrowRight');
  eq(await D(page, () => ACADEMY_DEBUG.state().goal), 20, 'the daily goal is a set of radio buttons: an arrow changes it');
  ok(/\/ 20 min/.test(await text(page, '#c-goal')) && await page.locator('#menu').isVisible(), 'the goal chip follows and the Menu stays open');
  await page.focus('#menu [data-m="keys"]'); await press('Tab');
  ok(await page.locator('#menu').isHidden(), 'tabbing out of the Menu closes it');
  await page.focus('#c-menu'); await press('Enter'); await page.focus('#menu [data-m="keys"]'); await press('Enter');
  ok(await page.locator('#keys').isVisible(), 'the Menu opens the keys sheet');
  await press('Escape'); eq(await at(), 'c-menu', 'and closing it returns focus to the Menu button');

  // the roles tree
  await press('t');
  ok(await D(page, () => document.querySelector('.tree').contains(document.activeElement)), 'T lands the keyboard in the tree');
  await page.focus('#L0 [data-role="pm"]'); await press('ArrowDown'); const t1 = await at(); await press('ArrowRight'); const t2 = await at(); await press('ArrowDown', 'ArrowRight'); const t3 = await at(); await press('ArrowUp'); const t4 = await at();
  eq([t1, t2, t3, t4], ['sm', 'sre', 'ds', 'analyst'], 'arrow keys walk the tree: down a family, across to the next one, and up');
  ok(/Analyst and statistician/.test(await text(page, '#peek')) && await page.locator('#L0 .tree path.hot').count() >= 1, 'the side panel follows the role in focus and its arrows light up');
  await press('ArrowUp'); eq(await at(), 'data', 'up from the top role reaches the family heading');
  eq(await D(page, () => [...document.querySelectorAll('#L0 .tree button')].filter(b => b.tabIndex === 0).length), 1, 'the whole tree is one tab stop');
  await press('ArrowDown', 'Enter'); eq([await zoom(), await D(page, () => ACADEMY_DEBUG.state().pos.role)], [2, 'analyst'], 'Enter opens the role');
  await press('Escape'); eq([await zoom(), await at()], [1, 'analyst'], 'Esc goes up to the family, on that role');
  await press('Escape'); eq([await zoom(), await at()], [0, 'analyst'], 'and up again to the tree, on that role');
  await page.focus('#L0 [data-filter=""]'); await press('ArrowRight', 'Enter');
  eq([await at(), await page.locator('#L0 .rnode.dim').count()], ['delivery', 12], 'the family filter: arrows move, Enter picks, focus stays');
  await page.focus('#L0 [data-space="roles"]'); await press('ArrowLeft', 'Enter');
  eq([await D(page, () => ACADEMY_DEBUG.state().pos.space), await at()], ['learn', 'learn'], 'the map switch: arrow and Enter flip the map, and focus stays on the switch');
  eq(page.errors, [], 'no script errors on the new keyboard run');
  eq(page.net, [], 'and nothing over the network');
  await page.close();

  page = await open(browser, { reducedMotion: 'reduce' });
  await page.keyboard.press('m'); await page.keyboard.press('Enter');
  eq(await D(page, () => [ACADEMY_DEBUG.state().pos.zoom, document.activeElement.dataset.concept]), [1, 'tokens'], 'with reduced motion on, focus still lands after a zoom (the layer shows at once)');
  await page.close();
  for (const scheme of ['light', 'dark']) {
    page = await open(browser, { colorScheme: scheme });
    await page.keyboard.press('m');
    const ringC = await D(page, () => {
      const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const s = getComputedStyle(document.activeElement), probe = document.createElement('div'); document.body.appendChild(probe);
      const col = v => { probe.style.color = 'var(' + v + ')'; return getComputedStyle(probe).color; };
      const out = { w: parseFloat(s.outlineWidth), ring: +cr(s.outlineColor, getComputedStyle(document.body).backgroundColor).toFixed(2), badge: +cr(col('--on-run'), col('--run-solid')).toFixed(2), on: document.activeElement.matches(':focus-visible') }; probe.remove(); return out;
    });
    ok(ringC.on && ringC.w >= 2 && ringC.ring >= 3 && ringC.badge >= 4.5, scheme + ': the focus ring is 2px with at least 3:1 against the page, and the due badge has 4.5:1', JSON.stringify(ringC));
    await page.close();
  }

  // ------------------------------------------------------------------ find, theme key, toasts, reading rail, zoom origin
  section('Find, the theme key, small moments, the reading rail');
  page = await open(browser);
  const at2 = () => D(page, () => { const a = document.activeElement; return a.id || a.tagName; });
  const pos = () => D(page, () => { const p = ACADEMY_DEBUG.state().pos; return [p.space, p.zoom, p.space === 'roles' ? p.role : p.concept]; });
  await page.keyboard.press('m'); await page.keyboard.press('/');
  ok(await page.locator('#find').isVisible() && await at2() === 'fd-in', 'the / key opens Find with the cursor in its box');
  ok(await page.locator('#fd-list li').count() === 8 && /Continue: Tokens/.test(await text(page, '#fd-list li >> nth=0')), 'before you type, it offers the actions, Continue first');
  await page.keyboard.type('temp');
  ok(/Next token and temperature/.test(await text(page, '#fd-list li[aria-selected="true"]')), 'typing narrows the list: "temp" finds the temperature lesson');
  await page.keyboard.press('Enter');
  eq([await page.locator('#find').isHidden(), await pos(), await at2()], [true, ['learn', 2, 'nexttoken'], 'H1'], 'Enter goes to the lesson, closes Find and lands on the heading');
  await page.keyboard.press('/'); await page.keyboard.type('m?t d');
  eq([await page.inputValue('#fd-in'), await pos(), await page.locator('#keys').isHidden()], ['m?t d', ['learn', 2, 'nexttoken'], true], 'in Find, letters and ? are typing, not shortcuts');
  ok(/Nothing matches/.test(await text(page, '#fd-list')), 'no match says so');
  await page.fill('#fd-in', 'engineer'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  eq(await D(page, () => [...document.querySelectorAll('#fd-list li')].findIndex(l => l.getAttribute('aria-selected') === 'true')), 1, 'arrow keys move the selection in the list');
  eq(await D(page, () => document.querySelector('#fd-in').getAttribute('aria-activedescendant')), 'fd-1', 'and a screen reader is told which one');
  await page.keyboard.press('Tab'); eq(await at2(), 'fd-in', 'Tab stays in Find');
  await page.keyboard.press('Escape');
  eq([await page.locator('#find').isHidden(), await pos(), await at2()], [true, ['learn', 2, 'nexttoken'], 'H1'], 'Esc closes Find, changes nothing and gives focus back');
  await page.keyboard.press('/'); await page.keyboard.type('scrum'); await page.keyboard.press('Enter');
  eq(await pos(), ['roles', 2, 'sm'], 'Find reaches roles too');
  await page.click('#c-find'); await page.fill('#fd-in', 'agents fail'); await page.click('#fd-list li >> nth=0');
  eq(await pos(), ['learn', 2, 'agentfail'], 'the Find button opens it, several words narrow it, and a click on a result works');
  await page.focus('#ch-p'); await page.keyboard.press('/');
  ok(await page.locator('#find').isVisible(), 'on a slider, / still opens Find'); await page.keyboard.press('Escape');
  await goLesson(page, 'models', 'tokens'); await page.focus('#tk-in'); await page.keyboard.type('a/d');
  ok(await page.locator('#find').isHidden() && (await page.inputValue('#tk-in')).endsWith('a/d') && await D(page, () => !document.documentElement.dataset.theme), 'in a text box, / and D are typing');

  await D(page, () => document.activeElement.blur()); await page.keyboard.press('d');
  eq(await D(page, () => [document.documentElement.dataset.theme, document.querySelector('#c-theme').getAttribute('aria-label'), document.querySelector('#toast').textContent]), ['light', 'Theme: light', 'Theme: light'], 'the D key changes the theme, says so in a toast, and the theme button names it');
  await page.focus('#c-theme'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  eq(await D(page, () => [document.documentElement.dataset.theme || '', document.activeElement.id]), ['', 'c-theme'], 'the theme button cycles dark and back to auto, and keeps focus');

  await D(page, () => { ACADEMY_DEBUG.state().xp = 96; });
  const ta = await D(page, () => ACADEMY.lessons.tokens.quiz.map(q => q.a));
  await page.keyboard.press(String(ta[0] + 1));
  ok(/Level 2/.test(await text(page, '#toast')) && await D(page, () => document.querySelector('#toast').classList.contains('on')), 'crossing 100 XP shows a level toast');
  ok(await D(page, () => document.querySelector('#quiz .opts').classList.contains('fresh')), 'the answer you just gave is marked fresh (it glows or shakes once)');
  await page.keyboard.press('Enter'); for (const a of ta.slice(1)) { await page.keyboard.press(String(a + 1)); await page.keyboard.press('Enter'); }
  ok(/4\/4/.test(await text(page, '#quiz .score')) && await page.locator('#quiz .score svg.ring').count() === 1 && /4 of 4 right/.test(await text(page, '#quiz')), 'the quiz ends on a score ring as well as the words');

  // zooming grows out of what you opened
  await page.keyboard.press('m'); await page.keyboard.press('Enter');
  const ox1 = await D(page, () => parseFloat(document.querySelector('#stage').style.getPropertyValue('--ox')));
  await page.keyboard.press('Escape'); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  const ox2 = await D(page, () => parseFloat(document.querySelector('#stage').style.getPropertyValue('--ox')));
  ok(ox1 < 35 && ox2 > 65, 'a zoom is centred on the tile you opened: left for track 1, right for track 9', ox1 + ' ' + ox2);
  ok(await D(page, () => document.querySelector('#L1').classList.contains('arrive')), 'and the new layer is marked as arriving');
  eq(await D(page, () => new Set([...document.querySelectorAll('#L0 .tcard')].map(t => getComputedStyle(t).getPropertyValue('--c').trim())).size), 9, 'each of the nine tracks has its own hue');
  eq(await D(page, () => [...document.querySelectorAll('#L0 .tcard.next')].map(t => t.dataset.track)), ['models'], 'the tile your next lesson is in is marked');

  // Detail: the rail and the bar
  await goLesson(page, 'models', 'tokens'); await page.keyboard.press('+');
  const nSec = await page.locator('#L3 .article h2').count();
  eq(await page.locator('#L3 .toc button').count(), nSec, 'Detail lists its sections in a rail');
  eq(await D(page, () => [...document.querySelectorAll('#L3 .toc button')].filter(b => b.tabIndex === 0).length), 1, 'the rail is one tab stop');
  await page.focus('#L3 .toc button'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  eq(await D(page, () => [document.activeElement.tagName, document.activeElement.id]), ['H2', 'sec-2'], 'arrows move along the rail and Enter jumps to that section, with focus on its heading');
  await page.waitForTimeout(80);
  ok(await D(page, () => parseFloat(document.querySelector('#readbar i').style.width) > 5 && document.querySelector('#L3 .toc [aria-current]').dataset.sec === '2'), 'the reading bar fills and the rail marks where you are');
  ok(await D(page, () => [...document.querySelectorAll('#zoombar .nav')].every(n => getComputedStyle(n).display === 'none')), 'while you read, the zoom bar drops the hints that do not apply');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  ok(await D(page, () => document.querySelector('#readbar i').style.width === '0%' && getComputedStyle(document.querySelector('#zoombar .nav')).display !== 'none'), 'both come back when you zoom out');

  // pictures
  await goLesson(page, 'models', 'context'); await setRange(page, '#cx-turns', 9); await setRange(page, '#cx-win', 80);
  eq(await page.locator('#cx-strip i.out').count(), await page.locator('#cx-chat .msg.out').count(), 'context: the strip shows the same messages falling out as the chat');
  ok(await page.locator('#cx-strip i.key.out').count() === 1, 'context: and marks the codename message among them');
  await goLesson(page, 'agents', 'agentfail');
  eq(await D(page, () => document.querySelector('#ch-out .donut').style.getPropertyValue('--p')), '35.8', 'where agents fail: the number has a gauge beside it');
  await goLesson(page, 'agents', 'planning');
  const firstStep = await D(page, () => document.querySelector('#pl-list .txt').textContent);
  await page.focus('#pl-list li:first-child [data-gate]'); await page.keyboard.press('Alt+ArrowDown');
  eq(await D(page, () => [document.querySelectorAll('#pl-list .txt')[1].textContent, document.activeElement.closest('li') === document.querySelectorAll('#pl-list li')[1], !!document.activeElement.dataset.gate]), [firstStep, true, true], 'planning: Alt + down moves the step in focus, and focus goes with it');
  await page.keyboard.press('Alt+ArrowUp');
  eq(await D(page, () => document.querySelector('#pl-list .txt').textContent), firstStep, 'planning: Alt + up moves it back');
  eq(page.errors, [], 'no script errors on this run');
  eq(page.net, [], 'and nothing over the network');
  await page.close();

  // ------------------------------------------------------------------ the lesson page: play mat, steps, the question deck
  section('The lesson page: toy and questions side by side, three steps, a deck of questions');
  page = await open(browser, { viewport: { width: 1440, height: 900 } });
  await goLesson(page, 'models', 'context');
  const boxes = () => D(page, () => { const t = document.querySelector('#toy').getBoundingClientRect(), q = document.querySelector('#quiz').getBoundingClientRect(); return { side: q.left >= t.right && Math.abs(q.top - t.top) < 6, below: q.top >= t.bottom }; });
  ok((await boxes()).side, 'on a wide screen the questions sit beside the toy, so you can poke it while you answer');
  const steps = () => D(page, () => [...document.querySelectorAll('#steps li')].map(l => (l.classList.contains('ok') ? '+' : l.classList.contains('all') ? '*' : '-') + l.textContent.replace(/^[✓\d]/, '').replace(', done', '')));
  eq([await steps(), await text(page, '#toy-state')], [['-Play', '-Answer', '-Read'], 'your turn'], 'a new lesson shows three steps to do, and the toy says it is your turn');
  await page.focus('#cx-win'); await page.keyboard.press('ArrowLeft');
  eq([(await steps())[0], await text(page, '#toy-state'), await D(page, () => ACADEMY_DEBUG.state().played.context)], ['+Play', '✓ played', true], 'touching the toy ticks Play, and it is remembered');
  ok(await page.locator('.burst').count() === 1, 'with a small burst');
  await setRange(page, '#cx-turns', 9);
  await D(page, () => { document.querySelector('#L2').scrollTop = 400; }); await page.waitForTimeout(50);
  ok(await D(page, () => { const q = document.querySelector('#quiz').getBoundingClientRect(), s = document.querySelector('#stage').getBoundingClientRect(); return q.top >= s.top - 2 && q.top < s.top + 40; }), 'and they stay in view while the toy scrolls');
  await D(page, () => { document.querySelector('#L2').scrollTop = 0; });
  const ca = await D(page, () => ACADEMY.lessons.context.quiz.map(q => q.a));
  eq(await D(page, () => document.querySelector('#quiz').dataset.left), '3', 'the question card shows three more cards behind it');
  await page.keyboard.press(String(ca[0] + 1));
  ok(await page.locator('.xpfly').count() === 1 && /\+5 XP/.test(await text(page, '.xpfly')) && await D(page, () => document.querySelector('#c-level').classList.contains('bump')), 'a right answer floats +5 XP and the level chip takes it');
  ok(await page.locator('#quiz .combo').count() === 0, 'one right answer is not a streak yet');
  await page.keyboard.press('Enter');
  ok(await D(page, () => document.querySelector('#quiz .qbody').classList.contains('deal') && document.querySelector('#quiz').dataset.left === '2'), 'the next question is dealt in and the deck gets shorter');
  await page.keyboard.press(String(ca[1] + 1));
  ok(/2 in a row/.test(await text(page, '#quiz .combo')), 'two right answers running shows a streak');
  await page.keyboard.press('Enter'); await page.keyboard.press(String(((ca[2] + 1) % 4) + 1));
  ok(await page.locator('#quiz .combo').count() === 0, 'a miss ends the streak');
  await page.keyboard.press('Enter'); await page.keyboard.press(String(ca[3] + 1)); await page.keyboard.press('Enter');
  ok(/good run/i.test(await text(page, '#quiz .done .kicker')) && /3 of 4 right/.test(await text(page, '#quiz')) && await D(page, () => document.querySelector('#quiz').dataset.left === '0'), 'the finish names the run, and the deck is empty');
  eq((await steps()).slice(0, 2), ['+Play', '+Answer'], 'finishing the questions ticks Answer');
  await page.keyboard.press('+'); await page.keyboard.press('-');
  eq(await steps(), ['+Play', '+Answer', '+Read', '*Lesson complete'], 'opening Read more ticks Read, and the lesson is complete');
  await page.waitForTimeout(1300); eq(await page.locator('.burst, .xpfly').count(), 0, 'the bursts and floating numbers clean up after themselves');
  await goLesson(page, 'models', 'tokens'); const tk = await D(page, () => ACADEMY.lessons.tokens.quiz.map(q => q.a));
  for (const a of tk) { await page.keyboard.press(String(a + 1)); await page.keyboard.press('Enter'); }
  ok(/clean sweep/i.test(await text(page, '#quiz .done .kicker')), 'all four right is a clean sweep');
  await page.waitForTimeout(1300); await page.locator('#quiz [data-act="replay"]').click(); await page.keyboard.press(String(tk[0] + 1));
  await page.waitForTimeout(50);
  ok(await page.locator('.burst').count() >= 1 && await page.locator('.xpfly').count() === 0, 'on a replay a right answer still bursts, but no XP floats, because none is earned');
  await goLesson(page, 'prompting', 'roles'); await page.click('#widget [data-v="2"]');
  eq([await text(page, '#toy-state'), (await steps())[0]], ['✓ played', '+Play'], 'pressing a button in a toy ticks Play too, even when the toy redraws that button');
  await page.reload();
  eq(await D(page, () => [ACADEMY_DEBUG.state().played.context, ACADEMY_DEBUG.state().readm.context]), [true, true], 'the steps survive a reload');
  eq(await D(page, () => { const s = ACADEMY_DEBUG.adopt({ v: 1, cards: {}, days: {} }); return [typeof s.played, typeof s.readm]; }), ['object', 'object'], 'an older save file without the steps still loads');
  eq(page.errors, [], 'no script errors on the lesson page run');
  await page.close();
  page = await open(browser);
  await goLesson(page, 'models', 'context');
  ok((await boxes()).below, 'on a narrower window the questions go under the toy');
  await page.close();
  page = await open(browser, { reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await goLesson(page, 'models', 'context'); await page.focus('#cx-win'); await page.keyboard.press('ArrowLeft');
  const cq = await D(page, () => ACADEMY.lessons.context.quiz[0].a); await page.keyboard.press(String(cq + 1));
  eq([await page.locator('.burst, .xpfly').count(), await text(page, '#toy-state'), await page.locator('#quiz .opt.right').count()], [0, '✓ played', 1], 'with reduced motion on there are no bursts or floating numbers, and everything still works');
  await page.close();

  // ------------------------------------------------------------------ toys: challenges, controls, sound
  section('Toys: challenges to find, controls, sound');
  page = await open(browser, { viewport: { width: 1440, height: 900 } });
  const found = id => D(page, id => (ACADEMY_DEBUG.state().found[id] || []).map(Boolean), id);
  const mlist = () => D(page, () => [...document.querySelectorAll('#missions li')].map(l => (l.classList.contains('ok') ? '+' : '-') + l.childNodes[1].textContent));
  const settle = () => page.waitForTimeout(30);
  await goLesson(page, 'models', 'context');
  eq([await mlist(), await text(page, '#missions .tag')], [['-Make the model lose the codename', '-Bring the codename back with a summary'], '0 of 2'], 'a toy lists its challenges, none found yet');
  await setRange(page, '#cx-turns', 9); await setRange(page, '#cx-win', 80); await settle();
  eq([await found('context'), (await mlist())[0], await text(page, '#missions .tag')], [[true], '+Make the model lose the codename', '1 of 2'], 'making it happen ticks the challenge');
  ok(await page.locator('.burst').count() >= 1, 'with a burst');
  await setRange(page, '#cx-win', 140); await page.check('#cx-sum'); await settle();
  eq([await found('context'), await text(page, '#missions .tag'), await text(page, '#toast')], [[true, true], 'all found', 'All found'], 'the second one too, and the toy says all found');
  await setRange(page, '#cx-win', 200); await page.uncheck('#cx-sum'); await settle();
  eq(await found('context'), [true, true], 'a challenge stays found when the toy moves on');

  await goLesson(page, 'models', 'tokens');
  await page.fill('#tk-in', 'word '.repeat(110)); await settle();
  await page.fill('#tk-in', '1 2 3 4 5 6 7 8'); await settle();
  eq(await found('tokens'), [true, true], 'tokens: both challenges can be found (over the budget, and a token for every two characters)');
  await goLesson(page, 'models', 'nexttoken');
  await setRange(page, '#nt-t', 0); await page.click('#widget [data-n="20"]'); await settle();
  ok(await page.locator('#nt-bars .bar.hit').count() === 1, 'next token: the word just picked lights up');
  await page.click('#widget [data-n="0"]'); await setRange(page, '#nt-t', 2);
  for (let i = 0; i < 4; i++) await page.click('#widget [data-n="20"]'); await settle();
  eq(await found('nexttoken'), [true, true], 'next token: one word every time at temperature 0, five different at temperature 2');
  await goLesson(page, 'models', 'training');
  await page.click('#widget [data-a="train"]'); await page.click('#widget [data-start="cook"]'); await settle();
  await page.fill('#tr-text', 'The cook chops the onions.'); await settle();
  eq(await found('training'), [true, true], 'training: both found');
  await goLesson(page, 'models', 'wrong');
  await page.click('#widget [data-q="1"]'); await page.click('#wr-check'); await settle();
  await page.check('#widget input[value="idk"]'); await page.click('#widget [data-q="1"]'); await page.click('#wr-check'); await settle();
  eq(await found('wrong'), [true, true], 'sure and wrong: both found');
  await goLesson(page, 'prompting', 'parts');
  for (const id of ['role', 'context', 'format', 'constraints', 'example']) await page.check('#widget [data-part="' + id + '"]'); await settle();
  eq(await found('parts'), [true], 'parts: found');
  await goLesson(page, 'prompting', 'examples');
  for (const i of [0, 1, 2]) await page.check('#widget [data-tell="' + i + '"]'); await settle();
  await page.check('#widget [data-show="0"]'); await page.check('#widget [data-show="1"]'); await settle();
  eq(await found('examples'), [true, true], 'show, do not tell: both found');
  await goLesson(page, 'prompting', 'roles');
  for (const i of [1, 2, 3]) await page.click('#widget [data-v="' + i + '"]'); await settle();
  eq(await found('roles'), [], 'roles: three of four voices is not all of them');
  await page.click('#widget [data-v="0"]'); await settle();
  eq(await found('roles'), [true], 'roles: all four is');
  await goLesson(page, 'prompting', 'format');
  await page.click('#widget [data-f="3"]'); await settle(); await page.click('#widget [data-f="4"]'); await settle();
  eq(await found('format'), [true, true], 'format: both found');
  await goLesson(page, 'prompting', 'iterate');
  for (const id of ['who', 'list', 'none']) await page.check('#widget [data-fix="' + id + '"]'); await settle();
  await page.check('#widget [data-fix="creative"]'); await settle();
  eq(await found('iterate'), [true, true], 'iterate: both found');
  await goLesson(page, 'prompting', 'judge');
  await page.click('#L2 #widget [data-ex="2"]'); await settle(); await page.click('#L2 #widget [data-ex="3"]'); await settle();
  eq(await found('judge'), [true, true], 'judging a prompt: both found');
  await goLesson(page, 'agents', 'tooluse');
  await page.uncheck('#widget [data-tool="calc"]'); await settle(); await page.click('#widget [data-q="2"]'); await settle();
  eq(await found('tooluse'), [true, true], 'tool use: both found');
  await goLesson(page, 'agents', 'loop');
  await page.click('#widget [data-a="run"]'); await settle();
  await page.click('#widget [data-a="reset"]'); await setRange(page, '#lp-max', 4); await page.click('#widget [data-a="run"]'); await settle();
  eq(await found('loop'), [true, true], 'agent loop: both found');
  await goLesson(page, 'agents', 'planning');
  await page.check('#widget [data-gate="deploy"]'); await settle();
  for (const id of ['read', 'write', 'code']) await page.check('#widget [data-gate="' + id + '"]'); await settle();
  eq((await found('planning')).slice(1), [true, true], 'planning: the approval challenges are found (the order one is covered by the planning checks above)');
  await goLesson(page, 'agents', 'memory');
  await page.check('#widget [data-save="secret"]'); await settle(); await page.click('#widget [data-a="new"]'); await page.check('#widget [data-change]'); await page.click('#widget [data-ask="day"]'); await settle();
  eq(await found('memory'), [true, true], 'memory: both found');
  await goLesson(page, 'agents', 'agentfail');
  await setRange(page, '#ch-n', 20); await settle(); await page.check('#ch-check'); await settle();
  eq(await found('agentfail'), [true, true], 'where agents fail: both found');
  await goLesson(page, 'agile', 'aidlc');
  for (const i of [0, 1, 2, 3, 4, 5]) await page.click('#widget [data-t="' + i + '"]'); await settle();
  eq(await found('aidlc'), [true], 'AI-DLC terms: found');
  await goLesson(page, 'agile', 'aigates');
  await page.uncheck('#gt-on'); await settle(); await page.check('#widget [data-need="pdf"]'); await settle();
  eq(await found('aigates'), [true, true], 'gates: both found');
  await goLesson(page, 'agile', 'airehearse');
  await page.fill('#rh-in', 'AI-DLC is a method that makes AI the engine of each step, with people validating.'); await page.click('#rh-show'); await settle();
  eq(await found('airehearse'), [true], 'rehearse: found');

  const cover = await D(page, () => { const out = { all: 0, some: 0, none: [] }; ACADEMY.tracks.forEach(t => t.concepts.forEach(c => { if (!ACADEMY.lessons[c.id]) return; ACADEMY_DEBUG.go(2, t.id, c.id); out.all++; if (document.querySelectorAll('#missions li').length) out.some++; else out.none.push(c.id); })); return out; });
  ok(cover.some >= 40 && cover.some >= cover.all - 12, 'most toys have at least one challenge (written for the first tracks, read from the toy for the rest)', cover.some + ' of ' + cover.all + '; none: ' + cover.none.join(' '));
  ok(await D(page, none => { if (!none.length) return true; const t = ACADEMY.tracks.find(t => t.concepts.some(c => c.id === none[0])); ACADEMY_DEBUG.go(2, t.id, none[0]); return document.querySelector('#missions').hidden; }, cover.none), 'a toy with no challenge hides the box');
  console.log('    challenges: ' + cover.some + ' of ' + cover.all + ' toys' + (cover.none.length ? '; none on: ' + cover.none.join(', ') : ''));

  await goLesson(page, 'models', 'context'); await setRange(page, '#cx-win', 160);
  eq(await D(page, () => [document.querySelector('#cx-win').style.getPropertyValue('--v'), getComputedStyle(document.querySelector('#cx-sum')).appearance]), ['52.4%', 'none'], 'sliders know how far along they are (for the coloured track), and checkboxes are drawn by the page');
  await page.focus('#cx-win'); await page.keyboard.press('ArrowRight');
  ok(/170 tokens/.test(await text(page, '#cx-winv')) && await page.locator('#cx-sum').isChecked() === false, 'and they still work from the keyboard');
  await page.focus('#cx-sum'); await page.keyboard.press('Space'); ok(await page.locator('#cx-sum').isChecked(), 'Space still ticks a checkbox');

  await page.click('#c-menu'); await page.click('#menu [data-m="sound"]');
  eq(await D(page, () => [ACADEMY_DEBUG.state().sound, document.activeElement.dataset.m, document.activeElement.textContent, document.activeElement.getAttribute('aria-pressed')]), [true, 'sound', 'Sound: on', 'true'], 'the Menu turns sound on, and the button says so and keeps focus');
  await page.keyboard.press('Escape'); await goLesson(page, 'models', 'tokens'); await page.keyboard.press('1'); await page.keyboard.press('Enter'); await page.keyboard.press('2');
  eq(page.errors, [], 'answering with sound on raises no errors');
  await page.reload();
  eq(await D(page, () => [ACADEMY_DEBUG.state().sound, ACADEMY_DEBUG.state().found.context.length, ACADEMY_DEBUG.adopt({ v: 1, cards: {}, days: {} }).sound]), [true, 2, false], 'sound and found challenges survive a reload; sound is off in a fresh or older save');
  eq(page.net, [], 'sound is made in the browser: still nothing over the network');
  await page.close();

  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) { console.log('\nFailed:\n  ' + failures.join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
