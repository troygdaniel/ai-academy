# AI Academy

A calm, game-like way to learn AI from the ground up, from an Agile coach / PM / Scrum Master view. Static files: double-click `index.html`. No install, no build step, no network, no accounts. Progress stays in your browser, with Save / Load to a file in the Menu.

Read `PLAN.md` first (one page). Facts and what is checked: `content/SOURCES.md`.

## What works
- **Semantic zoom**, four stops: Map, Track, Concept, Detail. Buttons at the bottom, `-` and `+` keys, Ctrl + wheel or a pinch.
- **Track 1, How models work** (5 lessons): tokens, the context window, next token and temperature, training vs using, sure and wrong.
- **Track 2, Prompting** (6 lessons): the parts of a prompt, examples, roles, format, iterating, judging a prompt.
- **Track 3, Tools and agents** (5 lessons): tool use, the agent loop, planning, memory, where agents fail.
- **Track 4, Grounding** (4 lessons): embeddings, search, RAG, citations.
- **Track 5, Evals and quality** (4 lessons): test sets, rubrics, model judges and their biases, regressions.
- **Track 6, Risk and governance** (6 lessons): data leakage, IP and ownership, hallucination risk, bias and fairness, injection and design defences, people in the loop. Generic teaching, not legal advice.
- **Track 7, Cost and operations** (4 lessons): tokens as cost, latency, caching, choosing a model size. All prices in the toys are made up.
- **Track 8, Tools in practice** (4 lessons): a tool in your editor, in the terminal, one that takes a ticket and returns a pull request, and a six-question card for any tool you add.
- **Track 9, Agile x AI** (9 lessons): AI-DLC, the AI-driven development life cycle that AWS published. Why a new life cycle, plan-ask-validate-build and its gates, three phases and who does what, stages and plans, rules and the audit trail, bringing a team along, the facilitator's first week, what the evidence says (and does not), and a rehearsal where you write your own answer before seeing a sample. Sourced from AWS's own post, the white paper and the open tooling docs.
- Every claim has a source id in `content/SOURCES.md`, with how well each source was checked. Anything unchecked is marked **verify**.
- Every lesson: one idea, one picture you can poke, four questions, Read more in big type (A- / A+), an Agile lens and an In practice line. About ten minutes each.
- **Prompt sandbox** (Menu, the Map, or the `S` key): scores a prompt against a six-part rubric and warns when text looks like real data (emails, long digit runs, names). It never calls a model. The prompt is not saved; the names you list for it to watch for are kept in this browser only, and left out of the Save file.
- **Roles family tree** (the switch at the top of the Map, or the `T` key): our own tree of AI-era roles, with the same zoom (Tree, Family, Role, Detail), a Read more for each role, and quiz cards. Inspired by Ian Miell's family tree of software job titles; none of his data is used.
- **Find** (the `/` key or the button at the top): type a few letters and jump to any lesson, track, role or action.
- **Spaced review** (SM-2): every quiz question becomes a card; Review runs the due ones.
- Streak, daily goal ring (minutes you actually study), XP and levels, shown as gauges on the Map. Light and dark. Keyboard throughout, reduced motion respected. Built for desktop; phone width is not a goal.

## Keys
Everything works without a mouse. Press `?` for the full list.

| Key | What it does |
|---|---|
| `←` `↑` `↓` `→` | Move between tracks, lessons, roles, answers and zoom stops |
| `Enter` | Open or press what has focus. In a quiz, the next question |
| `Tab` | The next group of controls. A list, a grid or a row of choices is one stop |
| `Home` `End` | First or last in a list |
| `Esc` | Close a sheet or the Menu. Otherwise, up one level |
| `-` `+` | Zoom out and in |
| `M` `T` `S` `R` | The map, the roles tree, the sandbox, review |
| `/` | Find: type a few letters to jump to any lesson, track, role or action |
| `C` | Continue with the next lesson |
| `D` | Theme: auto, light, dark |
| `Alt` + `↑` `↓` | In a plan, move the step in focus |
| `1` to `4` | Answer. In a review, after a right answer: `1` Hard, `2` Good, `3` Easy |
| `?` | The keys sheet |

Keys never fire while you type in a text box. Review, the sandbox and the keys sheet hold the keyboard while they are open and hand focus back when they close.

## Not built yet
Nothing outlined is left: all nine tracks have lessons (47 in all). Ideas for later: estimation and metrics, the culture models from Tribal Leadership and Reinventing Organizations, and more tools as they matter.

## Files
- `index.html` the page
- `style.css` the look (agentboard's tokens, after its Watch view: tiles, rings, pill switches)
- `content.js` the curriculum, the lessons and the roles tree: plain data, no code
- `widgets.js` the pictures you can poke for tracks 1 to 3 and 9, and the sandbox scorer
- `widgets-extra.js` the pictures for tracks 4 to 9 that came later (loads after `widgets.js`)
- `app.js` state, zoom, quiz, review, Save / Load, and the keyboard (arrows, one tab stop per list, focus)
- `content/SOURCES.md` every source, and how well each was checked
- `tests/run.js` the browser checks
- `tests/shots.js` screenshots of the main views, light and dark (`node tests/shots.js`, into `docs/screens`)

## Tests
The app needs nothing installed. The checks need Node and Playwright:

```bash
node tests/run.js
```

It opens `index.html` from disk in headless Chromium and checks behaviour, every lesson's picture, the sandbox, SM-2 intervals, Save / Load (including a file from the first prototype), that every lesson opens without errors, light and dark contrast, reduced motion, keyboard use (arrows, tab stops, focus after every zoom and sheet, focus traps, that typing is never interrupted), and that the page asks for nothing over the network.

## Adding a lesson
Add a concept to a track in `content.js`, add a lesson under `lessons` with the same id, and name a widget from `widgets.js` (or write one: a function that draws into the element it is given). Give every factual claim a row in `content/SOURCES.md`, and mark what you could not check as **verify**.
