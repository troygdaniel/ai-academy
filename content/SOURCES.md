# Sources and what is checked

Last checked on 2026-11-14.

**Read this first.** None of these pages could be opened from the machine that built the app (its network blocked them), so every row below was checked from **web search summaries only**: the title, the authors, the year and the one claim the app takes from it. That is weaker than reading the page. Every row is therefore marked **verify**: open the link and read it before you rely on the claim or repeat it at work. Where even the summary was thin, the row says so. Nothing here comes from any employer or client.

Product documentation changes often. Anything about a specific tool's limits, settings or data handling **may be out of date** by the time you read it.

## Sources used in the lessons

| Id | Source | What the app takes from it | Status |
|---|---|---|---|
| S1 | OpenAI Help Center, "What are tokens and how to count them?" https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them | English: about 4 characters, or 3/4 of a word, per token; 100 tokens is about 75 words; an estimate | search summary; **verify**. Wording varies between snapshots of the page |
| S2 | Sennrich, Haddow, Birch (2016), "Neural Machine Translation of Rare Words with Subword Units", ACL 2016. https://arxiv.org/abs/1508.07909 | Rare words handled as subword units, including byte pair encoding | arXiv record seen in the first build; paper not read in full; **verify** |
| S3 | Anthropic docs, "Context windows". https://platform.claude.com/docs/en/build-with-claude/context-windows (the older docs.anthropic.com address redirects) | The context window as the model's "working memory", separate from training | search summary; **verify**. That the window covers input plus output, and that earlier turns are re-sent, was not seen in the summaries: it is the standard description, treat as unconfirmed. Model sizes are **not quoted** |
| S4 | Wozniak, SM-2 (1990). https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method (older copy: https://www-v1.supermemo.com/archives1990-2015/english/ol/sm2) | First intervals 1 and 6 days, then the previous interval times the ease factor; ease starts at 2.5 and changes by `0.1 - (5-q)*(0.08 + (5-q)*0.02)`; a grade below 3 restarts the card without changing the ease; floor of 1.3 | search summary; **verify**. The formula text came from a sibling page on the same site. The app computes the next interval with the old ease, then updates the ease, and rounds intervals up |
| S5 | Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang (2023), "Lost in the Middle: How Language Models Use Long Contexts". https://arxiv.org/abs/2307.03172 | Models used facts at the start or end of a long input better than facts in the middle | search summary; **verify**. The start/end wording came from a secondary summary, not the abstract. Tested on 2023 models: **may be out of date** |
| S6 | Holtzman, Buys, Du, Forbes, Choi (2019), "The Curious Case of Neural Text Degeneration", ICLR 2020. https://arxiv.org/abs/1904.09751 | Nucleus (top-p) sampling: draw from the smallest set of top tokens whose chances add up to p | search summary; **verify** |
| S7 | Hinton, Vinyals, Dean (2015), "Distilling the Knowledge in a Neural Network". https://arxiv.org/abs/1503.02531 | Softmax with a temperature; a higher temperature gives a softer spread | search summary of the paper body; **verify** |
| S8 | Anthropic API reference, Messages. https://platform.claude.com/docs/en/api/messages | Lower temperature is more focused; "even with temperature of 0.0, the results will not be fully deterministic" | search summary; **verify**. Secondary sources say some newer Claude models reject a non-default temperature; not confirmed, so the lesson only says "some newer models are reported not to let you set them". **May be out of date** |
| S9 | Vaswani and others (2017), "Attention Is All You Need". https://arxiv.org/abs/1706.03762 | Introduced the transformer and attention | search summary; **verify**. "The work grows much faster than the length" is my plain-words gloss of the paper's cost table, not a quote |
| S10 | Brown and others (2020), "Language Models are Few-Shot Learners". https://arxiv.org/abs/2005.14165 | A task can be picked up from a few examples in the prompt, with no gradient updates | search summary; **verify** |
| S11 | Kalai, Nachum, Vempala, Zhang (2025), "Why Language Models Hallucinate". https://arxiv.org/abs/2509.04664 | Training and evaluation reward guessing over acknowledging uncertainty; the "good test-taker" comparison | abstract summary; **verify**. One paper's argument, not settled. The lesson's test analogy is my paraphrase |
| S12 | Ji and others (2022), "Survey of Hallucination in Natural Language Generation", ACM Computing Surveys. https://arxiv.org/abs/2202.03629 | The term hallucination for generated text that is not supported | existence only, by search summary; **verify** |
| S13 | NIST AI 600-1 (July 2024), "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile". https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf | The term confabulation: "confidently stated but erroneous or false content" | secondary sources only, the PDF was not opened; **verify** |
| S14 | Anthropic docs, "Reduce hallucinations". https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations | Explicitly allowing the model to say "I don't know" | search summary; **verify** |
| S15 | Anthropic docs, "Prompting best practices". https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | "A brilliant but new employee who lacks context"; examples wrapped in example tags; tags stop instructions being mixed up with examples or context | search summary; **verify**. Setting a role through the system prompt was seen in secondary summaries only. A "3 to 5 examples" figure was **not** confirmed and is not used |
| S16 | Zheng, Pei, Logeswaran, Lee, Jurgens (2023, revised 2024), "When 'A Helpful Assistant' Is Not Really Helpful: Personas in System Prompts Do Not Improve Performances of Large Language Models". https://arxiv.org/abs/2311.10054 | 162 personas, factual questions: no accuracy gain over no persona | search summary; **verify**. Open-source models of that time: **may be out of date** |
| S17 | OpenAI docs, "Structured outputs". https://developers.openai.com/api/docs/guides/structured-outputs | JSON mode gives valid JSON; structured outputs also hold to a supplied schema | secondary quotes of the guide; **verify**. The address may have moved |
| S18 | Anthropic docs, "Define success criteria and build evaluations". https://platform.claude.com/docs/en/test-and-evaluate/define-success | Define measurable success and build tests before iterating on a prompt | search summary; **verify** |
| S19 | OWASP Top 10 for LLM Applications 2025, "LLM02:2025 Sensitive Information Disclosure". https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/ | Sensitive information disclosure is on the list | page title seen in search; **verify** |

## Sources used in track 3 (Tools and agents)

Checked on 2026-11-14 by web search summaries, same caveat as above: none of these pages was opened.

| Id | Source | What the app takes from it | Status |
|---|---|---|---|
| S20 | Anthropic docs, "Tool use with Claude". https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview | A tool is defined by a name, a description and an input schema; the model returns a tool request; your application runs the tool and sends the result back; some provider-run tools execute on the provider's side | search summary, partly from translated versions of the page; **verify** |
| S21 | Anthropic Engineering (December 2024), "Building effective agents". https://www.anthropic.com/engineering/building-effective-agents | The distinction between workflows and agents; workflows for predictability, agents for flexibility; chaining and orchestrator-with-workers patterns | search summary. The distinction and the predictability/flexibility line were seen; the exact wording and the pattern names come from secondary write-ups; **verify** |
| S22 | Yao, Zhao, Yu, Du, Shafran, Narasimhan, Cao (2022), "ReAct: Synergizing Reasoning and Acting in Language Models", ICLR 2023. https://arxiv.org/abs/2210.03629 | Interleaving reasoning steps with actions | search summary, the abstract was not returned in full; **verify**. "Think, act, observe" is the usual shorthand, not a quote |
| S23 | Model Context Protocol, introduction. https://modelcontextprotocol.io/ | MCP described as "an open-source standard for connecting AI applications to external systems" | search summary of a versioned docs page; **verify**. Wording **may be out of date** |
| S24 | OWASP Top 10 for LLM Applications 2025, "LLM01:2025 Prompt Injection". https://genai.owasp.org/llmrisk/llm01-prompt-injection/ | Prompt injection is first on the list; the indirect kind arrives in outside content | search summary; **verify** |
| S25 | OWASP Top 10 for LLM Applications 2025, "LLM06:2025 Excessive Agency". https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ | Three root causes (excessive functionality, permissions, autonomy); least privilege; a person approving high-impact actions | search summary; **verify** |
| S26 | Simon Willison (16 June 2025), "The lethal trifecta for AI agents: private data, untrusted content, and external communication". https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ | The three-part combination, and that the defence is to avoid having all three | search summary and secondary sites; his post was not opened; **verify** |

Track 3 also reuses R8 (Anthropic, "Effective context engineering for AI agents") for agents keeping notes outside the window.

## Sources used in the roles family tree

| Id | Source | What the app takes from it | Status |
|---|---|---|---|
| R1 | Ian Miell, "A family tree of software job titles", zwischenzugs.com, 2026-11-03, and the tool at https://ianmiell.github.io/sw-job-title-family-tree/ | The **idea** only: a clickable tree, a family filter, solid arrows for "grew out of", dashed for "influence or a common move". Credited and linked in the app | page summary in the first build; **verify**. The post states no licence and the repository shows no LICENSE file, so nothing is reused: the roles chosen, their wording and their order are ours, and our tree carries no dates at all. His page was not opened while writing ours |
| R2 | Google, "Site Reliability Engineering", Introduction by Ben Treynor Sloss. https://sre.google/sre-book/introduction/ | "SRE is what happens when you ask a software engineer to design an operations team"; he joined Google in 2003 to run a production team | search summary; **verify**. The book's year is deliberately not stated |
| R3 | devopsdays.org, Patrick Debois speaker biography. https://devopsdays.org/events/2019-ghent/speakers/patrick-debois/ | He organised the first devopsdays in 2009 | search summary; **verify**. The 2009 Ghent event page itself was not found; a July 2009 mailing-list announcement supports the date |
| R4 | CNCF TAG App Delivery (2023), "Platforms White Paper". https://tag-app-delivery.cncf.io/whitepapers/platforms/ | Evan Bottcher's definition of a platform, as quoted in the paper | search summary; **verify** |
| R5 | Sculley and others (2015), "Hidden Technical Debt in Machine Learning Systems", NIPS 2015. https://proceedings.neurips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf | That real ML systems carry large maintenance costs beyond the model code | existence confirmed by search; the "small fraction is ML code" sentence was **not** confirmed and the app says so; **verify** |
| R6 | Davenport and Patil (October 2012), "Data Scientist: The Sexiest Job of the 21st Century", Harvard Business Review. https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century | The article that popularised the title | search summary; **verify** |
| R7 | Shawn Wang (2023), "The Rise of the AI Engineer", Latent Space. https://www.latent.space/p/ai-engineer | That the "AI engineer" title is usually traced to this essay | weak: the link is from memory and the essay was not opened. The role description in the app is mine, not his; **verify** |
| R8 | Anthropic Engineering (2025), "Effective context engineering for AI agents". https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | "the set of strategies for curating and maintaining the optimal set of tokens (information) during LLM inference"; "the natural progression of prompt engineering" | search summary; **verify** |
| R9 | Schwaber and Sutherland (2020), "The Scrum Guide". https://scrumguides.org/scrum-guide.html | The Scrum Master is accountable for establishing Scrum and for the Scrum Team's effectiveness | search summary; **verify** |
| R10 | Agile Manifesto, "History". https://agilemanifesto.org/history.html | Seventeen people met at Snowbird, Utah, on 11 to 13 February 2001 | search summary; **verify** |

## Looked for and not used

- An OpenAI prompt engineering guide: the current official page could not be found, so no lesson cites it.
- An OpenAI temperature range (0 to 2): only seen quoted in a forum. Not stated in the app.
- "Scrum was first presented at OOPSLA 1995": not confirmed. Not stated in the app.

## Claims that are teaching judgment, not sourced facts

These are marked in the lesson text with "(Teaching judgment.)", "(My framing.)" or "verify".

- Every **Agile lens** and **In practice** line. They are my framing for a coach, PM and Scrum Master.
- "Counting letters can trip a model because it sees tokens, not letters": the commonly given explanation. Not checked.
- That a model keeps nothing between answers and the app re-sends the conversation: the standard description of how chat products work. Not confirmed from a source here.
- What tools do when the window fills (drop, summarise, stop), how "memory" features work, and whether chats are used for training: general descriptions. **Verify per tool**; they change.
- "A model does not store documents the way a database does", "sounding sure is just more text" and "asking 'are you sure?' just generates another answer": common explanations. Not checked against one source.
- Where made-up answers are most likely (exact numbers, dates, names, citations).
- The list of six prompt parts (role, task, context, format, constraints, example): my framing of a widely used pattern.
- How structured output features work (restricting which tokens can be picked): a general description. Verify for your provider.
- In track 3: "95% a step over 20 steps is about 36%" is arithmetic (0.95 to the power 20), assuming every step fails independently and equally often. It is an illustration, not a measurement of any tool. The retry figure assumes a check catches every failure.
- In track 3: that an agent can report "done" when it is not; the three kinds of memory; that memory can go stale, leak or carry a planted instruction; that a plan can drift in a long run; and why prompt injection is hard to fix (one stream of tokens). Common explanations, not checked against one source.
- In the roles tree: everything under "What AI changes", "What to learn" and "Where it is heading"; the "AI enablement coach" node (my observation, no source); the "Delivery lead for human and agent teams" node (a **forecast**, labelled so in the app); the order of the rows; and which arrows are drawn.

## Things in the app that are made up on purpose

- The toy tokenizer's pieces and numbers, the next-word scores, the tiny trainable model, Team Heron and its page, the seven readings of the status-line request, the four role answers, the five risk formats, the iterate test cases, the tool-use answers and ticket HER-42, the seven-step agent run, the export plan and the memory session are all written by hand. No model produced them and none runs in the app.
- The sandbox's score is keyword matching. It is not a measure of prompt quality.
- Example data in the sandbox (`jo.sample@example.com`, `4000 1234 5678 9010`, "Mr Sample") is invented.
