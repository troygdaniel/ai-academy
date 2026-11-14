# AI Academy

A calm, game-like way to learn AI from the ground up, from an Agile coach / PM / Scrum Master view. Static files: double-click `index.html`. No install, no build step, no network, no accounts. Progress stays in your browser, with Save / Load to a file in the Menu.

Read `PLAN.md` first (one page). Facts and what is checked: `content/SOURCES.md`.

## What works
- **Semantic zoom**, four stops: Map, Track, Concept, Detail. Buttons at the bottom, `-` and `+` keys, Ctrl + wheel or a pinch.
- **Track 1, How models work** (5 lessons): tokens, the context window, next token and temperature, training vs using, sure and wrong.
- **Track 2, Prompting** (6 lessons): the parts of a prompt, examples, roles, format, iterating, judging a prompt.
- Every lesson: one idea, one picture you can poke, four questions, Read more in big type (A- / A+), an Agile lens and an In practice line. About ten minutes each.
- **Prompt sandbox** (Menu, the Map, or the `S` key): scores a prompt against a six-part rubric and warns when text looks like real data (emails, long digit runs, names). It never calls a model, and what you type is not saved.
- **Roles family tree** (the switch at the top of the Map, or the `T` key): our own tree of AI-era roles, with the same zoom (Tree, Family, Role, Detail), a Read more for each role, and quiz cards. Inspired by Ian Miell's family tree of software job titles; none of his data is used.
- **Spaced review** (SM-2): every quiz question becomes a card; Review runs the due ones.
- Streak, daily goal ring (minutes you actually study), XP and levels. Light and dark. Keyboard throughout, phone width, reduced motion respected.

## Keys
`-` `+` zoom · `1` to `4` answer · `Enter` next · `R` review · `M` map · `T` roles tree · `S` sandbox · `Esc` close. In a review, after a right answer: `1` Hard, `2` Good, `3` Easy.

## Not built yet
Tracks 3 to 9 (outlined on the Map, greyed).

## Files
- `index.html` the page
- `style.css` the look (agentboard's tokens)
- `content.js` the curriculum, the lessons and the roles tree: plain data, no code
- `widgets.js` the pictures you can poke, and the sandbox scorer
- `app.js` state, zoom, quiz, review, Save / Load
- `content/SOURCES.md` every source, and how well each was checked
- `tests/run.js` the browser checks

## Tests
The app needs nothing installed. The checks need Node and Playwright:

```bash
node tests/run.js
```

It opens `index.html` from disk in headless Chromium and checks behaviour, every lesson's picture, the sandbox, SM-2 intervals, Save / Load (including a file from the first prototype), phone width (360 px), light and dark contrast, reduced motion, keyboard use, and that the page asks for nothing over the network.

## Adding a lesson
Add a concept to a track in `content.js`, add a lesson under `lessons` with the same id, and name a widget from `widgets.js` (or write one: a function that draws into the element it is given). Give every factual claim a row in `content/SOURCES.md`, and mark what you could not check as **verify**.
