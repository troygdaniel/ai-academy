# AI Academy (prototype)

A calm, game-like way to learn AI from the ground up, from an Agile coach / PM / Scrum Master view. Static files: double-click `index.html`. No install, no network, no accounts. Progress stays in your browser (and Save / Load to a file in the Menu).

Read `PLAN.md` first (one page). Facts and what is checked: `content/SOURCES.md`.

## What works in this prototype
- **Semantic zoom**: Map, Track, Concept, Detail. Buttons at the bottom, `-` and `+` keys, Ctrl + wheel or a pinch.
- **One finished lesson, Tokens**: a toy tokenizer you type into, four questions, Read more in big type (A- / A+), the Agile lens and a tools line.
- **Spaced review** (SM-2): the quiz questions become cards; the Review button runs the due ones.
- Streak, daily goal ring (minutes you actually study), XP and levels. Light and dark.

## Not built yet
Tracks 2 to 9 (outlined on the Map, greyed), the prompt sandbox, the roles family tree (see `PLAN.md`), more lessons.

## Files
`index.html` page, `style.css` look (agentboard's tokens), `content.js` curriculum and lessons (plain data), `app.js` logic, `content/SOURCES.md` sources.

Checked in headless Chrome (behaviour, SM-2 intervals, phone width, light and dark); that script is not in this folder.
