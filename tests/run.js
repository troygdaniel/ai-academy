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
  const files = ['index.html', 'style.css', 'content.js', 'widgets.js', 'app.js'];
  const src = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  ok(!/<(script|link|img|iframe)[^>]+(src|href)="(https?:)?\/\//i.test(src['index.html']), 'index.html loads nothing from the network');
  ok(!/@import|url\(\s*['"]?https?:/i.test(src['style.css']), 'style.css loads nothing from the network');
  for (const f of ['content.js', 'widgets.js', 'app.js']) ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts)\b\s*\(/.test(src[f]) && !/new\s+(XMLHttpRequest|WebSocket|EventSource)/.test(src[f]), f + ' makes no network calls');
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
  eq(shape.lessons.length, 22, 'twenty-two lessons');
  eq(shape.tracks.slice(0, 4), [5, 6, 5, 0], 'track 1 has five lessons, track 2 has six, track 3 has five, track 4 none yet');
  eq(shape.tracks[8], 6, 'track 9 (Agile x AI, AI-DLC) has six lessons');
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
  for (const [t, c] of [['models', 'tokens'], ['models', 'context'], ['models', 'nexttoken'], ['models', 'training'], ['models', 'wrong'], ['prompting', 'parts'], ['prompting', 'examples'], ['prompting', 'roles'], ['prompting', 'format'], ['prompting', 'iterate'], ['prompting', 'judge'], ['agents', 'tooluse'], ['agents', 'loop'], ['agents', 'planning'], ['agents', 'memory'], ['agents', 'agentfail'], ['agile', 'aidlc'], ['agile', 'aigates'], ['agile', 'aiphases'], ['agile', 'airollout'], ['agile', 'aievidence'], ['agile', 'airehearse']]) {
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

  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) { console.log('\nFailed:\n  ' + failures.join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
