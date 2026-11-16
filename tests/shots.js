// Screenshots for a pull request: the main views, light and dark, at 1440 x 900.
//   node tests/shots.js [out-dir]        (default: docs/screens)
// Like tests/run.js it opens index.html from disk. It seeds a little made-up progress so the gauges have something to show.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), URL = 'file://' + path.join(ROOT, 'index.html');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'docs', 'screens'));

const seed = () => {
  const S = ACADEMY_DEBUG.state(), t = ACADEMY_DEBUG.dayNow(), A = ACADEMY;
  const done = ['tokens', 'context', 'nexttoken', 'training', 'wrong', 'parts', 'examples', 'tooluse'];
  done.forEach((id, k) => { S.done[id] = true; A.lessons[id].quiz.forEach((q, i) => { S.cards[q.id] = { ef: 2.5, rep: 1 + (i % 2), int: 6, due: t + ((k + i) % 5 === 0 ? 0 : 3 + i), n: 2 }; }); });
  A.lessons.roles.quiz.slice(0, 2).forEach(q => { S.cards[q.id] = { ef: 2.5, rep: 1, int: 1, due: t + 1, n: 1 }; });
  A.roles.families[0].quiz.forEach(q => { S.cards[q.id] = { ef: 2.5, rep: 1, int: 1, due: t + 2, n: 1 }; });
  S.xp = 236; S.goal = 20; S.days = {};
  [[0, 12], [1, 22], [2, 9], [3, 20], [5, 14], [6, 4]].forEach(([d, m]) => { S.days[t - d] = { min: m, xp: 30 }; });
  S.pos = { space: 'learn', track: 'prompting', concept: 'roles', zoom: 0, fam: 'delivery', role: 'sm' };
  ACADEMY_DEBUG.go(0);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await page.goto(URL); await page.evaluate(seed);
    const shot = async name => { await page.waitForTimeout(120); await page.screenshot({ path: path.join(OUT, name + '-' + scheme + '.png') }); };
    await page.keyboard.press('m'); await page.keyboard.press('ArrowRight'); await shot('1-map');                    // the Map, with the keyboard on a tile
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter'); await shot('2-track');                 // the Track, on the lesson you are at
    await page.keyboard.press('Enter'); await page.locator('#widget [data-v="2"]').click(); await page.evaluate(() => { document.querySelector('#L2').scrollTop = 0; }); await shot('3-concept');
    { const qa = await page.evaluate(() => ACADEMY.lessons.roles.quiz[0].a); await page.keyboard.press(String(qa + 1)); await shot('3b-answering'); }
    await page.keyboard.press('+'); await shot('4-detail');
    await page.keyboard.press('r'); await page.keyboard.press('ArrowDown'); await shot('5-review');
    await page.keyboard.press('Escape'); await page.keyboard.press('s');
    await page.locator('#sandbox [data-ex="3"]').click(); await page.locator('#sb-text').focus(); await shot('6-sandbox');
    await page.keyboard.press('Escape'); await page.keyboard.press('t'); await page.keyboard.press('ArrowDown'); await shot('7-roles-tree');
    await page.keyboard.press('?'); await shot('8-keys');
    await page.keyboard.press('Escape'); await page.keyboard.press('/'); await page.keyboard.type('agent'); await page.keyboard.press('ArrowDown'); await shot('9-find');
    await ctx.close();
  }
  await browser.close();
  console.log('wrote 20 screenshots to ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
