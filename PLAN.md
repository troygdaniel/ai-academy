# AI Academy: one-page plan (v1, 2026-11-14)

**For:** Troy: Agile coach, PM and Scrum Master with a dev background, aiming to be extremely well versed in AI, at work and in any tool.
**What it is:** a calm, game-like study app. Static files, runs offline in a browser, nothing to install, nothing sent anywhere.

## How a day feels
Open it, the ring shows today's goal (10 min to an hour; you set it). One tap starts the next lesson or the due reviews. A lesson is 10 minutes: one idea, one picture you can poke, four quick questions. Streak and level move. If you have more time, "Read more" opens the same idea in big type, and the next lesson chains on.

## Semantic zoom (first-class)
Four stops, one control (a slider, `-` and `+`, pinch or Ctrl-wheel), breadcrumb always visible:
1. **Map**: every track and concept as a tree, rings show what you know, a dot shows where you are.
2. **Track**: the concepts of one track in order.
3. **Concept**: the one idea, its picture, its questions.
4. **Detail**: Read more in big type (text size A- / A+), with the layer under it (how it really works).

## Curriculum (bottom up; each concept also has an **Agile lens** line and a **Tools in practice** line)
1. **How models work**: what a model is, tokens, context window, next-token and temperature, training vs using, why they are confidently wrong
2. **Prompting**: structure, examples, roles, format, iterating, judging a prompt
3. **Tools and agents**: tool use, the agent loop, planning, memory, where they fail
4. **Grounding**: embeddings, search, RAG, citations
5. **Evals and quality**: test sets, rubrics, judges and their limits, regressions
6. **Risk and governance**: data leakage, hallucination, IP, bias, prompt injection, human in the loop (generic; nothing from any employer or client)
7. **Cost and operations**: tokens as cost, latency, caching, choosing a model size
8. **Tools in practice**: Copilot, Claude, Devin, plus a template to add your own
9. **Agile x AI**: built as **AI-DLC** (AWS's AI-driven development life cycle) and how to bring a team along: why a new life cycle, the plan-ask-validate-build loop, three phases and who does what, rollout, evidence, rehearsal. Estimation, metrics and wider change management are still to come (also threaded through every concept above)

## Roles family tree (from your reference; built)
Ian Miell's family tree of 104 software job titles (https://ianmiell.github.io/sw-job-title-family-tree/, post at zwischenzugs.com, 2026-11-03) is the model: click a family to filter, click a title for its history, solid arrows grew out of, dashed arrows influence or a common move, dates are his estimates. We will link to it and credit him, and build **our own** small tree of AI-era roles in our own words (DevOps, SRE, platform engineering, ML engineer, AI Agent / Context Engineer, and where Agile Coach, PM and Scrum Master sit and are heading). Three uses: a "zoom out" lesson on how roles evolve, a tree view inside the Academy (same zoom as the Map, each node opens a big-type Read more), and quiz cards on it. **Licence:** the repo shows no licence file and the post states no reuse terms, so we copy none of his titles list, dates or text.

## Memory (SM-2)
Every quiz question becomes a review card. Four buttons (Again, Hard, Good, Easy) set the grade; intervals start 1 day, 6 days, then grow by the card's ease factor (starts 2.5, never below 1.3), after Wozniak's SM-2. Due cards are the "Review" session. Streak, daily goal, XP, levels, skill tree.

## Sandbox (built)
A prompt workbench that never calls a model: it scores a prompt against a rubric (role, task, context, format, constraints, example) and warns when text looks like real data (emails, long digit runs, names you list), so practice stays clean.

## Rules it keeps
Local only; progress in your browser's storage plus Save/Load to a file; no company or client data in any content; no accounts, no spend, no push. Facts carry a source in `content/SOURCES.md`; anything unchecked is marked **verify**.

## Look
Agentboard's, after its Watch view: the same tokens, light and dark, tinted tiles with rings, bars cut into cells, pill switches, calm motion (reduced-motion respected). Little text on the Map and the tree; the data is drawn. Driven from the keyboard: arrows inside a list, one tab stop per list, Esc up a level, `?` for the keys. System fonts, so it works offline.

## Built so far
Open `index.html`. All nine tracks are built (47 lessons, each with a picture you can poke and four questions), plus the prompt sandbox, the roles family tree with its own zoom and quiz cards, review, streak, goal ring, light and dark, keyboard use and Save/Load. Checks live in `tests/run.js`.

## Decisions taken while building (simplest option each time)
1. The Map stays the home screen; the roles tree is a second map behind a switch at the top.
2. Tone: plain, with a light touch of playful.
3. The roles tree has no timeline, only an earlier-to-later order, and the few dated facts on role pages come from their own sources (R2 to R10), so none of Ian Miell's dates are echoed and nothing unsourced is implied.
4. Track 2 has six lessons (a "roles" lesson was added to the five outlined).
5. Track 9 was built first, for interview preparation on AI-DLC, and tracks 4 to 8 followed. The later pictures live in `widgets-extra.js` so that a redesign of `widgets.js` and the content work do not collide. Examples in it are generic and name no real app, because the repo may be shared. Bungay's three gaps (knowledge, alignment, effects) sit in one paragraph of the gates lesson, where they fit. The culture models from Tribal Leadership and Reinventing Organizations are left out until something fits; add them where they do.
