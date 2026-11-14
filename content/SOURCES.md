# Sources and what is checked

Checked on 2026-11-14 by web search summaries. A summary is not a full read of the page, so anything not marked **checked** should be read before you rely on it. Nothing here comes from RBC or any client.

## Sources used in the Tokens lesson

| Id | Source | What the lesson takes from it | Status |
|---|---|---|---|
| S1 | OpenAI Help Center, "What are tokens and how to count them?" https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them | English: about 4 characters, or 3/4 of a word, per token; 100 tokens is about 75 words; an estimate, other languages differ, and request structure adds tokens | checked by search summary; **verify** against the page |
| S2 | Sennrich, Haddow, Birch (2016), "Neural Machine Translation of Rare Words with Subword Units", ACL 2016. https://arxiv.org/abs/1508.07909 | Rare words handled as subword units, including byte pair encoding | checked (arXiv record); the paper itself not read in full |
| S3 | Anthropic docs, "Understanding the context window". https://docs.anthropic.com/en/docs/build-with-claude/context-windows | The context window is the text a model can look at plus what it writes | checked in outline. Model sizes are **not quoted**: third-party pages disagree, so read the official page for current numbers |

## Spaced repetition (the review cards)

| Id | Source | Used for | Status |
|---|---|---|---|
| S4 | Wozniak, SM-2 (1990). https://www-v1.supermemo.com/archives1990-2015/english/ol/sm2 | First intervals 1 and 6 days, then the previous interval times the ease factor; ease starts at 2.5 and changes by `0.1 - (5-q)*(0.08 + (5-q)*0.02)`; a grade below 3 restarts the card; floor of 1.3 | checked by search summary. One passage in the text says 1.1; most summaries and the text's own advice say 1.3, which the app uses. The app computes the next interval with the old ease factor, then updates the ease |

## Reference for the planned roles tree (not used in the prototype)

| Id | Source | Used for | Status |
|---|---|---|---|
| R1 | Ian Miell, "A family tree of software job titles", zwischenzugs.com, 2026-11-03, and the tool at https://ianmiell.github.io/sw-job-title-family-tree/ | A model for the interaction only (family filter, click a title for its history, solid arrow = grew out of, dashed = influence or common move). We link and credit. We do **not** copy his data or text | checked by page summary 2026-11-14. The post states no licence and the repo (github.com/ianmiell/sw-job-title-family-tree) shows no LICENSE file, so nothing is reused. He says his dates are estimates of when a title became common, not sourced first uses |

## Claims that are teaching judgment, not sourced facts

- The **Agile lens** and **Tools in practice** lines are my framing for a coach and PM. They are not facts from a source.
- "Counting letters can trip a model because it sees tokens, not letters" is the commonly given explanation. **Not checked** against a source. Marked verify in the lesson.
- "Copilot, Claude and Devin each limit and report context in their own way" is true in general but changes by model and version. **Verify per tool** before you quote it at work.
- The toy tokenizer's numbers are made up, and its pieces come from a small hand-made list.
