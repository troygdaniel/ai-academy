// AI Academy content: the curriculum map and the lessons. Plain data, no code. Sources and what is checked: content/SOURCES.md.
// A concept with an entry in lessons has a lesson; the others are on the map but greyed ("coming").
// Each lesson names its widget (the picture you can poke, in widgets.js) and its sources (src).
var ACADEMY = {
  tracks: [
    { id: 'models', title: 'How models work', blurb: 'What a model is, what it reads, and why it sometimes sounds sure and is wrong.', concepts: [
      { id: 'tokens', title: 'Tokens', idea: 'What a model really reads.' },
      { id: 'context', title: 'The context window', idea: 'How much it can look at at once.' },
      { id: 'nexttoken', title: 'Next token and temperature', idea: 'How it picks each word.' },
      { id: 'training', title: 'Training vs using a model', idea: 'Where knowledge comes from.' },
      { id: 'wrong', title: 'Sure and wrong', idea: 'Why fluent is not the same as true.' }
    ] },
    { id: 'prompting', title: 'Prompting', blurb: 'Asking so the answer is useful: parts, examples, roles, format, iteration, and judging the prompt itself.', concepts: [
      { id: 'parts', title: 'The parts of a prompt', idea: 'Role, task, context, format, constraints, example.' },
      { id: 'examples', title: 'Show, do not tell', idea: 'Examples steer better than adjectives.' },
      { id: 'roles', title: 'Give it a role', idea: 'Who is speaking, and to whom.' },
      { id: 'format', title: 'Ask for a format', idea: 'Lists, tables, JSON, a template.' },
      { id: 'iterate', title: 'Iterate like a sprint', idea: 'One change, check, repeat.' },
      { id: 'judge', title: 'Judging a prompt', idea: 'A rubric before you press send.' }
    ] },
    { id: 'agents', title: 'Tools and agents', blurb: 'Models that call tools, work in a loop, plan and remember, and where that breaks.', concepts: [
      { id: 'tooluse', title: 'Tool use', idea: 'The model asks; software does.' },
      { id: 'loop', title: 'The agent loop', idea: 'Think, act, observe, repeat.' },
      { id: 'planning', title: 'Planning', idea: 'Ordered steps, and checkpoints where it costs.' },
      { id: 'memory', title: 'Memory', idea: 'Saved text, put back in the window.' },
      { id: 'agentfail', title: 'Where agents fail', idea: 'Compounding errors, injection, too much access.' }
    ] },
    { id: 'grounding', title: 'Grounding', blurb: 'Giving a model the facts: embeddings, search, RAG, citations.', concepts: [
      { id: 'embed', title: 'Embeddings' }, { id: 'search', title: 'Search' }, { id: 'rag', title: 'RAG' }, { id: 'cite', title: 'Citations' }
    ] },
    { id: 'evals', title: 'Evals and quality', blurb: 'Knowing whether it works: test sets, rubrics, judges and their limits.', concepts: [
      { id: 'testset', title: 'Test sets' }, { id: 'rubric', title: 'Rubrics' }, { id: 'judges', title: 'Model judges' }, { id: 'regress', title: 'Regressions' }
    ] },
    { id: 'risk', title: 'Risk and governance', blurb: 'Data leakage, hallucination, IP, bias, prompt injection, people in the loop.', concepts: [
      { id: 'leak', title: 'Data leakage' }, { id: 'halluc', title: 'Hallucination' }, { id: 'inject', title: 'Prompt injection' }, { id: 'human', title: 'Human in the loop' }
    ] },
    { id: 'cost', title: 'Cost and operations', blurb: 'Tokens as money and time: latency, caching, choosing a model size.', concepts: [
      { id: 'tokcost', title: 'Tokens as cost' }, { id: 'latency', title: 'Latency' }, { id: 'cache', title: 'Caching' }, { id: 'size', title: 'Model size' }
    ] },
    { id: 'tools', title: 'Tools in practice', blurb: 'Copilot, Claude, Devin and how to add any other tool.', concepts: [
      { id: 'copilot', title: 'Copilot' }, { id: 'claude', title: 'Claude' }, { id: 'devin', title: 'Devin' }, { id: 'yours', title: 'Add your own' }
    ] },
    { id: 'agile', title: 'Agile x AI', blurb: 'Planning, estimating, ceremonies, delivery, risk, metrics, change.', concepts: [
      { id: 'plan', title: 'Planning and estimating' }, { id: 'cere', title: 'Ceremonies' }, { id: 'metrics', title: 'Metrics' }, { id: 'change', title: 'Change management' }
    ] }
  ],

  // the toy tokenizer's hand-made list of pieces (a real one learns tens of thousands from data)
  vocab: {
    words: ('the of and to a in is that it for as with was on be by this are at from or have an not but what all were when we there can your which their said if do will each about how up out them then she many some so these would other into has more her two like him see time could no make than first been its who now people my made over did down only way find use may water long little very after words called just where most know get through back much before go good new write our me man too any day same right look think also around another came come work three word must because does part even place well such here take why help put different away again off went old number great tell men say small every found still between name should home big give air line set own under read last never us left end along while might next sound below saw something thought both few those always looked show large often together asked house world going want school important until form food keep children feet land side without boy once animals life enough took sometimes four head above kind began almost live page got earth need far hand high year mother light country father let night picture being study second soon story since white ever paper hard near sentence better best across during today however sure knew try told young sun thing whole hear example heard several change answer room sea against top turned learn point city play toward five using himself usually plan sprint team backlog estimate project risk model data test review release agile scrum budget nous le la de les des et un une pour avec planning').split(' '),
    suffix: ['ing', 'ed', 'tion', 's', 'ly', 'er', 'est', 'ment', 'ness', 'able', 'ize', 'ous', 'al', 'es', 'ion', 'ity', 'ive', 'ies', 'ate', 'ful'],
    prefix: ['un', 're', 'dis', 'pre', 'anti', 'over', 'under', 'inter', 'non', 'mis', 'out']
  },

  // Sources. None of these pages could be opened from the build environment, so each was checked by search summary only: see content/SOURCES.md.
  sources: [
    { id: 'S1', title: 'OpenAI Help Center: What are tokens and how to count them?', url: 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them', note: 'English rule of thumb: about 4 characters, or 3/4 of a word, per token; 100 tokens is about 75 words. An estimate; other languages differ.' },
    { id: 'S2', title: 'Sennrich, Haddow, Birch (2016): Neural Machine Translation of Rare Words with Subword Units', url: 'https://arxiv.org/abs/1508.07909', note: 'Splitting rare words into subword units, including byte pair encoding. ACL 2016.' },
    { id: 'S3', title: 'Anthropic docs: Context windows', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows', note: 'The context window as the model\'s working memory, separate from training. Sizes differ by model and change, so none are quoted here.' },
    { id: 'S5', title: 'Liu and others (2023): Lost in the Middle: How Language Models Use Long Contexts', url: 'https://arxiv.org/abs/2307.03172', note: 'Models used facts at the start or end of a long input better than facts in the middle. Tested on 2023 models; newer ones may differ.' },
    { id: 'S6', title: 'Holtzman and others (2019): The Curious Case of Neural Text Degeneration', url: 'https://arxiv.org/abs/1904.09751', note: 'Introduces nucleus (top-p) sampling.' },
    { id: 'S7', title: 'Hinton, Vinyals, Dean (2015): Distilling the Knowledge in a Neural Network', url: 'https://arxiv.org/abs/1503.02531', note: 'Softmax with a temperature: a higher temperature gives a softer spread of chances.' },
    { id: 'S8', title: 'Anthropic API reference: Messages (temperature)', url: 'https://platform.claude.com/docs/en/api/messages', note: 'Lower temperature is more focused; even at 0.0 results are not fully deterministic. Ranges and which models accept the setting change: verify.' },
    { id: 'S9', title: 'Vaswani and others (2017): Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', note: 'The paper that introduced the transformer and its attention mechanism.' },
    { id: 'S10', title: 'Brown and others (2020): Language Models are Few-Shot Learners', url: 'https://arxiv.org/abs/2005.14165', note: 'A model can do a new task from a few examples in the prompt, with no update to its weights.' },
    { id: 'S11', title: 'Kalai, Nachum, Vempala, Zhang (2025): Why Language Models Hallucinate', url: 'https://arxiv.org/abs/2509.04664', note: 'Argues that training and evaluation reward guessing over admitting uncertainty. One paper\'s argument.' },
    { id: 'S12', title: 'Ji and others (2022): Survey of Hallucination in Natural Language Generation', url: 'https://arxiv.org/abs/2202.03629', note: 'A survey of hallucination in generated text.' },
    { id: 'S13', title: 'NIST AI 600-1 (2024): Generative AI Profile', url: 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf', note: 'Uses the term confabulation for confidently stated but false content.' },
    { id: 'S14', title: 'Anthropic docs: Reduce hallucinations', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations', note: 'Explicitly allowing the model to say "I do not know" as one way to reduce made-up answers.' },
    { id: 'S15', title: 'Anthropic docs: Prompting best practices', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices', note: 'Treat the model as a brilliant but new employee who lacks context; wrap examples in example tags; tags keep instructions apart from material. The older per-technique pages now point here.' },
    { id: 'S16', title: 'Zheng and others (2023, revised 2024): When "A Helpful Assistant" Is Not Really Helpful: Personas in System Prompts Do Not Improve Performances of Large Language Models', url: 'https://arxiv.org/abs/2311.10054', note: '162 personas tried on factual questions with open models: no accuracy gain over no persona. Newer models may differ.' },
    { id: 'S17', title: 'OpenAI docs: Structured outputs', url: 'https://developers.openai.com/api/docs/guides/structured-outputs', note: 'JSON mode gives valid JSON; structured outputs also hold the answer to a supplied schema.' },
    { id: 'S18', title: 'Anthropic docs: Define success criteria and build evaluations', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success', note: 'Define specific, measurable success criteria and build tests before iterating on a prompt.' },
    { id: 'S19', title: 'OWASP Top 10 for LLM Applications 2025: LLM02 Sensitive Information Disclosure', url: 'https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/', note: 'Sensitive information disclosure as a listed risk for applications built on language models.' },
    { id: 'S20', title: 'Anthropic docs: Tool use with Claude', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview', note: 'A tool has a name, a description and an input schema. The model returns a tool request; your application runs the tool and sends the result back.' },
    { id: 'S21', title: 'Anthropic Engineering (2024): Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents', note: 'Workflows (steps fixed in code) versus agents (the model directs its own steps); patterns such as chaining and orchestrator with workers.' },
    { id: 'S22', title: 'Yao and others (2022): ReAct: Synergizing Reasoning and Acting in Language Models', url: 'https://arxiv.org/abs/2210.03629', note: 'Interleaving reasoning steps with actions. ICLR 2023.' },
    { id: 'S23', title: 'Model Context Protocol: Introduction', url: 'https://modelcontextprotocol.io/', note: 'MCP as an open-source standard for connecting AI applications to external systems.' },
    { id: 'S24', title: 'OWASP Top 10 for LLM Applications 2025: LLM01 Prompt Injection', url: 'https://genai.owasp.org/llmrisk/llm01-prompt-injection/', note: 'Prompt injection, direct and indirect, listed first.' },
    { id: 'S25', title: 'OWASP Top 10 for LLM Applications 2025: LLM06 Excessive Agency', url: 'https://genai.owasp.org/llmrisk/llm062025-excessive-agency/', note: 'Too much functionality, permission or autonomy; least privilege and human approval for high-impact actions.' },
    { id: 'S26', title: 'Simon Willison (2025): The lethal trifecta for AI agents', url: 'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/', note: 'Private data, untrusted content and external communication: together they let planted text exfiltrate data.' },
    { id: 'R2', title: 'Google: Site Reliability Engineering, Introduction (Ben Treynor Sloss)', url: 'https://sre.google/sre-book/introduction/', note: 'SRE as what happens when you ask a software engineer to design an operations team.' },
    { id: 'R3', title: 'devopsdays.org: Patrick Debois, speaker biography', url: 'https://devopsdays.org/events/2019-ghent/speakers/patrick-debois/', note: 'Says he organised the first devopsdays in 2009. The 2009 event page itself was not found.' },
    { id: 'R4', title: 'CNCF TAG App Delivery (2023): Platforms White Paper', url: 'https://tag-app-delivery.cncf.io/whitepapers/platforms/', note: 'Quotes Evan Bottcher\'s definition of a platform as a foundation of self-service capabilities arranged as an internal product.' },
    { id: 'R5', title: 'Sculley and others (2015): Hidden Technical Debt in Machine Learning Systems', url: 'https://proceedings.neurips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf', note: 'On the maintenance cost of real ML systems. The "small fraction is ML code" point is widely attributed to it but was not confirmed here.' },
    { id: 'R6', title: 'Davenport and Patil (2012): Data Scientist: The Sexiest Job of the 21st Century, Harvard Business Review', url: 'https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century', note: 'The article that made the title widely known.' },
    { id: 'R7', title: 'Shawn Wang (2023): The Rise of the AI Engineer, Latent Space', url: 'https://www.latent.space/p/ai-engineer', note: 'The essay the title is usually traced to. Not opened; the link is from memory.' },
    { id: 'R8', title: 'Anthropic Engineering (2025): Effective context engineering for AI agents', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents', note: 'Context engineering as curating and maintaining the optimal set of tokens during inference; the natural progression of prompt engineering.' },
    { id: 'R9', title: 'Schwaber and Sutherland (2020): The Scrum Guide', url: 'https://scrumguides.org/scrum-guide.html', note: 'The Scrum Master is accountable for establishing Scrum and for the Scrum Team\'s effectiveness.' },
    { id: 'R10', title: 'Agile Manifesto: History', url: 'https://agilemanifesto.org/history.html', note: 'Seventeen people met at Snowbird, Utah, on 11 to 13 February 2001.' }
  ],

  lessons: {
    tokens: {
      widget: 'tokens', src: ['S1', 'S2', 'S3'],
      idea: 'A model never sees letters or words. It sees tokens: chunks of text, each swapped for a number.',
      tryit: 'Type anything. Each coloured chip is one token, and the small number under it is what the model would see.',
      tryNote: 'A toy tokenizer: it matches pieces from a small hand-made list. Real ones learn tens of thousands of pieces from data, so the counts differ; the idea is the same.',
      examples: [
        { label: 'Plain English', text: 'We plan the sprint and estimate the work with the team.' },
        { label: 'A rare word', text: 'antidisestablishmentarianism' },
        { label: 'Numbers', text: '1234567890 and 3.14159' },
        { label: 'Code', text: 'def velocity(points): return sum(points) / len(points)' },
        { label: 'French', text: "Nous planifions le sprint avec l'equipe." },
        { label: 'Emoji', text: 'Good work 🚀🎉' }
      ],
      read: [
        { h: 'What a token is', p: 'Before a model reads anything, a tokenizer cuts your text into pieces and swaps each piece for a number. A piece can be a whole common word, part of a word, a single digit or a punctuation mark. The model works on those numbers and writes its answer the same way, one token at a time.' },
        { h: 'Why you should care', p: 'Three things are counted in tokens: how much the model can look at at once (the context window), how long it takes, and what you pay in most paid services. Rare words, other languages, numbers and code usually break into more pieces than plain English, so the same page can cost more.' },
        { h: 'A rule of thumb', p: 'For English, about 4 characters, or three quarters of a word, is one token, so 100 tokens is roughly 75 words (OpenAI\'s estimate, S1). Treat it as a guess, and use your tool\'s own counter when it matters.' },
        { h: 'A side effect', p: 'Because the model sees tokens and not letters, jobs that depend on spelling, such as counting the letters in a word, can trip it up. This is the commonly given explanation; it is marked verify in the sources.' }
      ],
      under: { h: 'Under the hood: how the pieces are chosen', p: 'Most modern tokenizers use byte pair encoding or a close cousin (S2). Start from single characters, then repeatedly merge the pair that appears most often in a huge sample of text, until the list holds tens of thousands of pieces. Frequent words end up as one piece, rare ones stay in several. The toy above just takes the longest match from a small list.' },
      agile: 'Treat tokens like capacity. A backlog, acceptance criteria and chat history all spend the same budget, so estimate it, trim it and keep what the task needs, as you would plan a sprint.',
      tools: 'Copilot, Claude and Devin each limit and report context in their own way, and it changes by model and version. Find the context or usage meter in the tool you use and learn what it counts. (Verify per tool.)',
      quiz: [
        { id: 'tokens.q1', q: 'What does a language model actually read?', opts: ['Letters, one at a time', 'Whole words from a dictionary', 'Tokens: chunks of text turned into numbers', 'Sentences as pictures'], a: 2, why: 'Text is cut into tokens first, and the model only ever sees their numbers.' },
        { id: 'tokens.q2', q: 'For the same number of characters, which usually costs the most tokens?', opts: ['A plain English sentence', 'A long rare word, a string of digits, or code', 'A sentence of very common words', 'They always cost the same'], a: 1, why: 'Common words are one token each. Rare words, numbers and code split into many small pieces. Try the buttons above.' },
        { id: 'tokens.q3', q: 'A rule of thumb for English: 100 tokens is about how many words?', opts: ['10', '75', '300', '1,000'], a: 1, why: 'About 4 characters, or three quarters of a word, per token. It is an estimate and varies by language and tool.' },
        { id: 'tokens.q4', q: 'A 40-page requirements document plus a long chat will not fit in the context window. Best first move?', opts: ['Paste it all in anyway', 'Summarise or split it and send only what this task needs', 'Ask the model to read faster', 'Switch to a bigger font'], a: 1, why: 'The window is a token budget. Spend it on what the task needs, like a sprint\'s capacity.' }
      ]
    },
    context: {
      widget: 'context', src: ['S3', 'S5', 'S9'],
      idea: 'A model can only work with what is in its context window right now: the instructions, the conversation, any files, and its own answer. For the model, nothing else exists.',
      tryit: 'You told the model a codename at the start of a chat. Make the chat longer, or the window smaller, and watch what the model can still see when you ask for it.',
      tryNote: 'A toy: token counts come from the toy tokenizer and the sizes are tiny on purpose. Real windows are far larger, and real tools differ in what they do when one fills up.',
      chat: {
        system: 'You are a helpful assistant for a delivery team.',
        fact: 'Our next release is codenamed Heron. Please remember that.',
        ask: 'What is the codename of our next release?', answer: 'Heron',
        summary: 'Summary so far: the release is codenamed Heron. The team talked about the demo, the standup time and a risk list.',
        filler: [
          { who: 'model', text: 'Noted. I will use that name from now on.' },
          { who: 'you', text: 'Draft an agenda for the sprint review. Keep it to five items and put the demo first.' },
          { who: 'model', text: 'Agenda: demo of the new work, what changed in the plan, open risks, questions from the sponsors, what comes next.' },
          { who: 'you', text: 'Now suggest a better time for the daily standup. Half the team starts late and the other half leaves early.' },
          { who: 'model', text: 'Try late morning, when both groups are in. Keep it to fifteen minutes and move the long talks to after.' },
          { who: 'you', text: 'List the top three risks for a team that has just lost its only tester.' },
          { who: 'model', text: 'Bugs found late, slower releases, and developers checking their own work without a second pair of eyes.' },
          { who: 'you', text: 'Turn those risks into a short note I could send to the people who fund the work.' },
          { who: 'model', text: 'We have lost our tester. Until the role is filled, expect slower releases and a higher chance of defects. We are pairing on reviews to limit that.' }
        ]
      },
      read: [
        { h: 'What the window holds', p: 'Everything the model can look at for one answer sits in a single long run of tokens: the instructions the tool adds behind the scenes, the conversation so far, any files or search results pasted in, and the answer as it is being written. Anthropic\'s documentation calls this the model\'s working memory, as distinct from what it learned in training (S3).' },
        { h: 'The model does not remember. The app re-sends.', p: 'Between one answer and the next, the model itself keeps nothing. A chat feels continuous because the app sends the earlier turns in again each time. So a long chat is a long input, on every single turn.' },
        { h: 'When it fills up', p: 'The window has a fixed size, counted in tokens. When a conversation outgrows it, something has to give. A tool may drop the oldest turns, squeeze them into a summary, or stop with an error; which one depends on the tool (verify for yours). Whatever falls out is gone for the model, and it does not know that it forgot.' },
        { h: 'Bigger is not automatically better', p: 'A 2023 study found that models did best when the fact they needed sat near the start or the end of a long input, and worse when it was buried in the middle (S5). Newer models may cope better, so treat that as a caution and not a law. Either way, a window stuffed with things the task does not need makes the job harder. Give the model what the task needs, placed where it is easy to find.' }
      ],
      under: { h: 'Under the hood: why there is a limit at all', p: 'Inside a transformer, every token is compared with the other tokens in the window; that mechanism is called attention (S9). The work grows much faster than the length does, and a model is built and trained with a maximum length in mind. Sizes differ a lot between models and change often, so none are quoted here: check the official page for the model you use.' },
      agile: 'The window is work in progress, so limit it. A focused context finishes better than a stuffed one, the same way a team with three items in flight beats a team with thirty. Start a fresh chat for a new topic, as you would close one story before opening the next.',
      tools: 'Chat tools, coding assistants and agents all manage the window for you in some way: a usage meter, an automatic summary (often called compaction), or a nudge to start a new chat. Find out which your tool does and what it drops. (Verify per tool; this changes between versions.)',
      quiz: [
        { id: 'context.q1', q: 'What is in a model\'s context window?', opts: ['Everything it learned in training', 'Only your latest message', 'The instructions, the conversation so far, any pasted files, and the answer it is writing', 'Your whole account history'], a: 2, why: 'The window is one run of tokens holding everything the model can look at for this answer. Training is separate.' },
        { id: 'context.q2', q: 'A chat feels continuous. How does the model "remember" your first message?', opts: ['It stores each chat in its weights', 'The app sends the earlier turns in again every time', 'It never forgets anything', 'It emails itself a copy'], a: 1, why: 'The model keeps nothing between answers. The app re-sends the conversation, which is why long chats use more tokens each turn.' },
        { id: 'context.q3', q: 'A detail from early in a very long chat has fallen out of the window. What does the model do when asked about it?', opts: ['Warns you that it forgot', 'Looks it up in its memory', 'Cannot see it, does not know it is missing, and may guess', 'Refuses to answer anything'], a: 2, why: 'What is outside the window does not exist for the model. It will not notice the gap unless the tool tells it.' },
        { id: 'context.q4', q: 'You have a huge window and paste in forty documents "just in case". The likely result?', opts: ['Always better answers, since more is more', 'The key fact is harder to find, and it costs more and takes longer', 'The model reads only the first one', 'Nothing changes'], a: 1, why: 'Every token is paid for and read. One study found facts buried in the middle of long inputs were used less well. Send what the task needs.' }
      ]
    },
    nexttoken: {
      widget: 'nexttoken', src: ['S6', 'S7', 'S8'],
      idea: 'A model writes one token at a time. At each step it scores every possible next token, turns the scores into chances, and draws one. Temperature sets how adventurous the draw is.',
      tryit: 'The bars are the chances for the next word. Slide the temperature, then pick a few times and watch how often the top word wins.',
      tryNote: 'A toy: the words and their scores are made up by hand. A real model does this over its whole vocabulary of tens of thousands of tokens, at every step.',
      examples: [
        { label: 'A status report', text: 'The sprint review went', cands: [['well', 3.2], ['smoothly', 2.4], ['badly', 1.5], ['long', 1.3], ['sideways', 0.4], ['purple', -1.5]] },
        { label: 'A fact', text: 'Two plus two equals', cands: [['four', 6.0], ['4', 4.6], ['five', 0.6], ['fish', -1.0], ['twenty', -1.2], ['Tuesday', -2.5]] },
        { label: 'A story opening', text: 'Once upon a time there was a', cands: [['little', 2.2], ['king', 2.1], ['young', 2.0], ['dragon', 1.8], ['girl', 1.8], ['backlog', 0.2]] }
      ],
      read: [
        { h: 'One token, then the next', p: 'For each step, the model\'s real output is not a word. It is a list of chances, one for every token it knows. One token is drawn, added to the text, and the whole thing runs again with that token included. An essay is that loop, run a few hundred times.' },
        { h: 'Temperature', p: 'Temperature is a number that reshapes the chances before the draw (S7). Low temperature makes the favourite win almost every time: steady, repeatable, a little dull. High temperature flattens the chances, so unlikely tokens get picked more often: more variety, more surprises, and eventually nonsense.' },
        { h: 'Same question, different answers', p: 'Because each token is a draw, asking the same thing twice can give two different answers. That is by design. Even at temperature 0, Anthropic\'s API reference says results will not be fully deterministic (S8). So do not treat one answer as "what the model thinks". For anything that matters, run it more than once and look at the spread.' },
        { h: 'The other dials', p: 'Top-p, also called nucleus sampling, keeps only the most likely tokens whose chances add up to p and draws from those, which cuts off the long tail of odd choices (S6). Chat products usually hide these dials. APIs expose them, with ranges that differ by provider, and some newer models are reported not to let you set them at all. (Verify for the model you use; this may be out of date.)' }
      ],
      under: { h: 'Under the hood: the sum, gently', p: 'Each candidate token gets a raw score, called a logit. Divide every score by the temperature, raise e to the power of each result, then divide each by the total so they add up to 1. That last step is called softmax. Dividing by a small number stretches the gaps between scores, so the favourite dominates; dividing by a large number shrinks the gaps. You cannot divide by zero, so temperature 0 is treated as "always take the top one".' },
      agile: 'Variation is normal, so manage it like any process with variance: do not judge a prompt on one run. Sample a few, look at the spread, and tighten the prompt where you need the same answer every time, such as acceptance criteria or a status report.',
      tools: 'In most chat products you cannot set the temperature; the regenerate button shows you the spread instead. In APIs and some agent settings you can: lower for extraction and checks, higher for brainstorming. (Ranges and defaults differ by provider and model: verify.)',
      quiz: [
        { id: 'nexttoken.q1', q: 'What does a model produce at each step, before anything is chosen?', opts: ['A finished sentence', 'A chance for every possible next token', 'A yes or a no', 'A search query'], a: 1, why: 'The model outputs chances over its whole vocabulary. One token is drawn from them, and the loop repeats.' },
        { id: 'nexttoken.q2', q: 'You turn the temperature down close to 0. What changes?', opts: ['The model gets smarter', 'The most likely token wins almost every time, so answers get steadier', 'Answers get longer', 'The model stops making mistakes'], a: 1, why: 'Low temperature sharpens the chances toward the favourite. Steadier is not the same as correct: a likely wrong answer is still wrong.' },
        { id: 'nexttoken.q3', q: 'You ask the same question twice and get two different answers. Most likely cause?', opts: ['The model is broken', 'Each token is a draw from chances, so runs can differ', 'Someone retrained it in between', 'Your internet connection'], a: 1, why: 'Sampling is built in. Run important prompts more than once and compare.' },
        { id: 'nexttoken.q4', q: 'Which job suits a higher temperature?', opts: ['Pulling invoice totals out of a document', 'Checking a story against its acceptance criteria', 'Brainstorming twenty names for a team', 'Converting dates to one format'], a: 2, why: 'Variety helps when you want many different ideas. For extraction and checks you want the same answer every time, so go low.' }
      ]
    },
    training: {
      widget: 'training', src: ['S9', 'S10'],
      idea: 'A model learns once, in training, and is then frozen. When you chat with it you are using it, not teaching it. What it "knows" comes from two places only: its training, and what is in the window.',
      tryit: 'Train a tiny model on a few sentences, then use it. Try a word it never saw. Then change the training text without retraining and use it again.',
      tryNote: 'A toy: it only counts which word followed which. A real model adjusts billions of numbers and learns far richer patterns, but the split is the same: learn first, then use with the learning frozen.',
      examples: [
        { label: 'Team notes', text: 'The team plans the sprint. The team reviews the work. The team ships the release. The sprint ends with a review. The review shows the work to the sponsors. The sponsors ask the team about the release.' },
        { label: 'Kitchen notes', text: 'The cook chops the onions. The cook heats the pan. The pan heats the oil. The oil cooks the onions. The cook tastes the soup. The soup needs the salt.' }
      ],
      starts: ['the', 'team', 'sprint', 'cook', 'soup'],
      read: [
        { h: 'Training', p: 'In training, the model is shown an enormous amount of text. Over and over it is asked to guess the next token, and each time its internal numbers, called weights, are nudged so the right guess becomes a little more likely. This takes a great deal of computing and is done by the maker of the model, not by you.' },
        { h: 'Using', p: 'When you use a model, the weights are frozen. Your prompt goes in, tokens come out, and nothing inside the model changes. It can still pick up a task from examples you put in the prompt, with no change to its weights (S10), but that "learning" lives in the window and is gone when the window is.' },
        { h: 'The cutoff', p: 'Training text stops at some date. The model does not know what happened after that unless a tool searches for it or you paste it in. It may not even be sure what today\'s date is.' },
        { h: 'Does my chat train it?', p: 'Two different things get mixed up here. Fine-tuning is a further, smaller round of training on chosen examples, done on purpose to specialise a model. Separately, a provider may or may not use conversations to train future models. That depends on the product, the plan, the settings, and at work on your organisation\'s agreement. Check it for each tool. Never assume.' },
        { h: 'What about "memory"?', p: 'Some tools remember things across chats. In general that is not retraining: the tool saves notes and puts them back into the window next time. It is a filing cabinet next to the model, not a change to the model. (Verify how your tool does it.)' }
      ],
      under: { h: 'Under the hood: what is actually stored', p: 'A model is a very large set of numbers arranged in a design called a transformer (S9). Training does not file documents away the way a database does; it adjusts the numbers so that likely continuations score higher. That is the usual explanation for why a model paraphrases well but cannot be relied on to quote a source exactly, and why "where did you learn that?" rarely has an answer you can trust. Some passages do get memorised word for word. (This paragraph is the common explanation, not checked against one source: verify.)' },
      agile: 'Think of onboarding. Training is the education someone had before they joined: broad, dated, and not about your project. The context window is the briefing you give them on day one. You cannot change their schooling, so invest in the briefing: the Definition of Done, the glossary, the decisions already made.',
      tools: 'Any tool is a frozen model plus whatever the tool puts in the window: your files, search results, instruction files, memory notes. When a tool seems to "know" your repository, it read it into the window just now. Check each tool\'s data-use and retention settings before you use it for work. (Verify per tool.)',
      quiz: [
        { id: 'training.q1', q: 'You explain your team\'s process to a chat model in detail. Tomorrow, in a new chat, a colleague asks it about your process. What does it know?', opts: ['Everything you told it', 'Nothing of it, unless a memory feature or the colleague puts it in the window', 'A summary of it', 'It depends on the temperature'], a: 1, why: 'Using a model does not change its weights. What you said lived in that chat\'s window.' },
        { id: 'training.q2', q: 'What changes inside the model while it answers your prompt?', opts: ['Its weights are updated with your text', 'Nothing: the weights are frozen and only the window differs', 'It grows new vocabulary', 'It deletes old knowledge to make room'], a: 1, why: 'Learning happens in training. Using the model reads the weights and never writes to them.' },
        { id: 'training.q3', q: 'A model is asked about an event from last week and has no search tool. The honest expectation?', opts: ['It knows, because models update daily', 'It cannot know it from training, and may guess or say so', 'It will always refuse', 'It will ask a colleague'], a: 1, why: 'Training text stops at a cutoff date. Later facts must arrive through the window.' },
        { id: 'training.q4', q: 'A coding assistant gives advice that fits your repository exactly. The best explanation?', opts: ['It was trained on your repository', 'The tool read parts of the repository into the window for this request', 'It guessed well', 'It remembers your last project'], a: 1, why: 'A tool is a frozen model plus what the tool loads into the window. That is where project knowledge comes from.' }
      ]
    },
    wrong: {
      widget: 'wrong', src: ['S11', 'S12', 'S13', 'S14'],
      idea: 'A model is built to produce likely text, not checked text. Likely and true usually agree, which is why it is useful. When they do not, it sounds exactly as sure.',
      tryit: 'Ask the toy some questions about a made-up team. Three are covered by what it learned and three are not. Listen to the tone, then check. Then change how it is set up.',
      tryNote: 'A toy with scripted answers, written by hand to show the pattern. No model is running.',
      doc: 'Team Heron works in two-week sprints. The team releases on Thursdays. The demo is held in the Atrium.',
      questions: [
        { q: 'How long are Team Heron\'s sprints?', known: true, truth: 'Team Heron works in two-week sprints.' },
        { q: 'What was Team Heron\'s velocity last sprint?', known: false, guess: 'Team Heron\'s velocity last sprint was 42 points.' },
        { q: 'Which day does Team Heron release?', known: true, truth: 'Team Heron releases on Thursdays.' },
        { q: 'Who approved Team Heron\'s budget?', known: false, guess: 'Team Heron\'s budget was approved by the steering committee in March.' },
        { q: 'Where is the demo held?', known: true, truth: 'The demo is held in the Atrium.' },
        { q: 'When was Team Heron formed?', known: false, guess: 'Team Heron was formed in 2019.' }
      ],
      read: [
        { h: 'Fluent is not the same as true', p: 'A model continues text with likely tokens. No step in that process looks anything up or checks the result. So an invented reference comes out as smoothly as a real one. The common name for this is hallucination (S12). The US standards body NIST uses the word confabulation, reported as "confidently stated but erroneous or false content" (S13).' },
        { h: 'Why it does not just say "I do not know"', p: 'One research argument from 2025 (S11) goes like this: models are trained and scored like students sitting a test where a blank earns nothing and a guess sometimes earns a point. Under that scoring, guessing is the winning habit, so guessing is what gets learned. This is one paper\'s explanation, not a settled fact.' },
        { h: 'Where it bites', p: 'Expect trouble with exact things: numbers, dates, names, quotes, citations, links, version numbers. Expect it with anything after the training cutoff, and with anything about your own organisation that the model never saw. And expect it in long chains of steps, where one early slip carries through to the end. (Teaching judgment, from common experience; not from one source.)' },
        { h: 'What helps', p: 'Put the source in the window and ask for an answer from that source only. Say plainly that "I do not know" is an acceptable answer (S14). Ask where each claim comes from, then check a few. Run it twice and compare. For anything that drives a decision, a person who can tell right from wrong reads it. All of this lowers the risk. None of it removes it.' }
      ],
      under: { h: 'Under the hood: sounding sure is just more text', p: 'A model does have chances for each token, but the confident tone of a sentence is not a readout of them. "Definitely" is simply a likely word in that spot. Asking "are you sure?" produces another generated answer, which can talk a right answer into a wrong one as easily as fix a wrong one. (The common explanation; verify.)' },
      agile: 'Treat the output as work from a fast, well-read new team member who has no access to your facts: it goes through review like anyone else\'s. Put "checked against a source" in your Definition of Done for AI-assisted work, and count the checking in the estimate.',
      tools: 'Coding tools do this too: a function that does not exist, a setting from another version. Running the tests catches much of it, which is why tools that can run and check their own code tend to be more dependable than ones that only write. For documents, prefer tools that cite their sources, and click the citations. (Teaching judgment.)',
      quiz: [
        { id: 'wrong.q1', q: 'Why can a model state something false in a confident voice?', opts: ['It is lying on purpose', 'It produces likely text, and nothing in that process checks whether the text is true', 'It ran out of tokens', 'Its temperature was too low'], a: 1, why: 'Likely text and true text usually match. When they do not, the tone is the same.' },
        { id: 'wrong.q2', q: 'Which request is most at risk of a made-up answer?', opts: ['Rewrite this paragraph more simply', 'Give me three sources with page numbers for this claim, from memory', 'Suggest names for a workshop', 'Turn these notes into bullets'], a: 1, why: 'Exact details such as citations, numbers and quotes are where invention hides best. Rewriting text you supplied is much safer.' },
        { id: 'wrong.q3', q: 'What most reliably cuts made-up answers about your own project?', opts: ['Typing in capitals', 'Asking "are you sure?"', 'Putting the source in the window, asking it to answer only from that, and allowing "I do not know"', 'Raising the temperature'], a: 2, why: 'Grounding plus permission to abstain lowers the risk. "Are you sure?" just generates another answer.' },
        { id: 'wrong.q4', q: 'An AI-drafted status report contains a delivery date and three numbers. What belongs in the Definition of Done?', opts: ['It reads well', 'It is long enough', 'Each fact was checked against its source by a person', 'The model said it was confident'], a: 2, why: 'Fluent is not verified. Review is part of the work, so plan for it.' }
      ]
    },
    parts: {
      widget: 'parts', src: ['S15'],
      idea: 'A good prompt is a small brief. Six parts cover most needs: a role, the task, the context, the format, the constraints and an example. You rarely need all six, but you should know which ones you left out.',
      tryit: 'Switch the parts on and off and read the prompt as the model would. The ticks show which parts the rubric can find.',
      tryNote: 'The ticks come from simple keyword matching, the same scorer as the prompt sandbox. It can tell a part is present, not whether it is good.',
      material: '<notes>\n(paste the notes here; use made-up or cleaned text)\n</notes>',
      parts: [
        { id: 'role', label: 'Role', text: 'You are an experienced Scrum Master who writes clearly for busy people.', without: 'No role: it answers in a generic voice.' },
        { id: 'task', label: 'Task', text: 'Summarise the retrospective notes below.', without: 'No task: it has to guess what you want done with the notes.' },
        { id: 'context', label: 'Context', text: 'Context: the summary is for a sponsor who was not in the room and wants to know what will change next sprint.', without: 'No context: it has to guess who is reading and why.' },
        { id: 'format', label: 'Format', text: 'Format: three bullets under the heading Changes, then one line under the heading Help needed.', without: 'No format: you get whatever shape is most typical, usually paragraphs.' },
        { id: 'constraints', label: 'Constraints', text: 'Keep it under 80 words. Do not name individuals. If the notes do not cover something, put "not recorded" instead of guessing.', without: 'No constraints: any length, and gaps may be filled with guesses.' },
        { id: 'example', label: 'Example', text: 'Example of the style: "Standup moves to 10:30 so both sites can join."', without: 'No example: the style is left to chance.' }
      ],
      read: [
        { h: 'Why structure helps', p: 'A model rarely asks what you meant. It fills every gap with the most typical reading and carries on. Anthropic\'s prompting guide suggests thinking of the model as a brilliant but new employee who lacks context on your norms and ways of working (S15). You would brief that person properly.' },
        { h: 'The six parts', p: 'Role: who the model should be. Task: what to do, with one clear verb. Context: who it is for, why, and what has happened so far. Format: the shape of the answer. Constraints: the limits, what to avoid, and what to do when unsure. Example: a sample of what good looks like. (This list of six is my framing of a widely used pattern, not one source\'s list.)' },
        { h: 'Keep the parts apart', p: 'When you paste in material, mark where it starts and ends, so instructions and material do not blur together. Tags such as <notes> and </notes> are one way; Anthropic\'s guide says tags help stop the model mixing up instructions with examples or context (S15).' },
        { h: 'Not a magic formula', p: 'Six ticks do not guarantee a good answer, and a one-line prompt is fine for a one-line job. The parts are a checklist for finding what is missing when an answer disappoints.' }
      ],
      under: { h: 'Under the hood: what a missing part costs', p: 'The model continues from whatever is in the window. Anything you leave out is filled in from the most typical case in its training: a general reader, an average length, a default tone. Each specific thing you add shifts the chances toward the answer you want. That is all a prompt ever does.' },
      agile: 'It is a user story for the model. Role is the persona, task is the want, context is the so-that, format and constraints are the acceptance criteria, and the example is the reference case. You would not hand a team a story with no acceptance criteria; do not hand a model one.',
      tools: 'Most tools let you save the standing parts so you do not retype them: custom instructions, project or repository instruction files, a system prompt. Put the role, the context and the house rules there, and keep the task in the message. (Names and places differ per tool: verify.)',
      quiz: [
        { id: 'parts.q1', q: 'Which of these is the "context" part of a prompt?', opts: ['"Use a table with three columns"', '"This is for a sponsor who missed the meeting"', '"No more than 80 words"', '"Summarise the notes"'], a: 1, why: 'Context says who it is for, why, and what has happened. The others are format, constraint and task.' },
        { id: 'parts.q2', q: 'You leave out the format. What do you usually get?', opts: ['An error', 'The most typical shape for that kind of request, often paragraphs', 'Always a table', 'Nothing at all'], a: 1, why: 'Gaps are filled with the most typical reading. If the shape matters, say so.' },
        { id: 'parts.q3', q: 'Why mark pasted material with tags or clear markers?', opts: ['It makes the prompt look technical', 'So the model can tell your instructions from the material it should work on', 'It reduces the token count', 'Models cannot read plain text'], a: 1, why: 'Clear boundaries stop instructions and material from blurring, which matters most when the material itself contains instructions.' },
        { id: 'parts.q4', q: 'An answer came back too long and too generic. Which parts would you check first?', opts: ['Role and example only', 'Constraints for the length, context for the generic', 'The greeting', 'None: just ask again'], a: 1, why: 'Length is a constraint. Generic answers usually mean the model did not know who it was for or why.' }
      ]
    },
    examples: {
      widget: 'narrow', src: ['S10', 'S15'],
      idea: 'Describing what you want with adjectives leaves a lot open. Showing one or two examples of the finished thing closes most of it.',
      tryit: 'The task below can be read many ways. Add adjectives, then add examples, and watch how many readings still fit.',
      tryNote: 'A toy: the seven readings are written by hand, and which ones each control rules out is scripted. No model is running.',
      task: 'Write a status line for this ticket: "Login fails on mobile after a password reset."',
      cands: [
        { id: 'a', text: 'Login is broken on mobile after a password reset. We are on it!' },
        { id: 'b', text: 'Mobile login fails after password reset.' },
        { id: 'c', text: 'BUG | login | mobile | fails after password reset' },
        { id: 'd', text: '🔥 Heads up, everyone: mobile login is currently failing for people who have just reset their password. The team is looking into it and will share more soon.' },
        { id: 'e', text: '[BUG] Mobile login fails after password reset (high)' },
        { id: 'f', text: '[BUG] Mobile login fails after password reset (medium)' },
        { id: 'g', text: 'bug: mobile-login-reset' }
      ],
      tells: [
        { label: '"Keep it short"', kills: ['d'] },
        { label: '"Be professional"', kills: ['a', 'd'] },
        { label: '"Be consistent"', kills: [] }
      ],
      shows: [
        { label: 'Example 1', text: 'Ticket: "Export button does nothing on the reports page." Status line: [BUG] Reports export does nothing (medium)', kills: ['a', 'b', 'c', 'd', 'g'] },
        { label: 'Example 2', text: 'Ticket: "Checkout crashes for every customer." Status line: [BUG] Checkout crashes for all customers (high)', kills: ['a', 'b', 'c', 'd', 'g'] }
      ],
      bothKill: ['f'],
      read: [
        { h: 'Adjectives are vague', p: '"Short", "professional" and "friendly" mean different things to different readers. The model picks the average meaning, which may not be yours.' },
        { h: 'An example carries more', p: 'One example fixes length, tone, layout and level of detail all at once. The technique is called few-shot prompting. Research on large language models showed they can pick up a task from a few examples placed in the prompt, with no retraining (S10).' },
        { h: 'Vary your examples', p: 'The model copies closely, accidents included. Show one example that ends in "(medium)" and you may get "(medium)" every time. Give two or three that differ in the ways your real inputs differ, so the pattern is learned and not the single case. Anthropic\'s guide suggests wrapping examples in example tags, so they are not mistaken for instructions (S15).' },
        { h: 'When not to', p: 'Examples anchor strongly. If you want variety, as in a brainstorm, they can box the model in; say that you want different ideas, or leave the examples out. They also cost tokens on every request.' }
      ],
      under: { h: 'Under the hood: why showing works', p: 'A model continues patterns. An example followed by a new input sets up a pattern whose most likely continuation is "the same kind of thing again, for the new input". An adjective only nudges the chances. A pattern pins them down.' },
      agile: 'It is specification by example. A concrete case of "done" beats a paragraph describing done, the same way one example acceptance test settles more arguments than a sentence of requirements.',
      tools: 'Keep a small library of good examples for the jobs you repeat: a well-written story, a status note, a risk entry. Paste them in, or store them in the tool\'s instruction file or a saved prompt. Use made-up or cleaned examples, never real client material. (Verify where your tool stores them.)',
      quiz: [
        { id: 'examples.q1', q: 'What is few-shot prompting?', opts: ['Asking the model the same thing a few times', 'Putting a few examples of the task in the prompt', 'Retraining the model on a few documents', 'Using a few short words'], a: 1, why: 'A few worked examples in the prompt show the model the pattern to continue. Nothing is retrained.' },
        { id: 'examples.q2', q: 'You give one example and every answer copies its exact length and its last word. Best fix?', opts: ['Remove all examples', 'Add one or two more that differ where your real inputs differ', 'Type "do not copy" in capitals', 'Raise the temperature to the maximum'], a: 1, why: 'With one example the model cannot tell the pattern from the accident. Varied examples show what changes and what stays.' },
        { id: 'examples.q3', q: 'Why does an example steer better than "make it professional"?', opts: ['Models ignore adjectives', 'An example fixes length, tone and layout at once; an adjective leaves them open', 'Examples are shorter', 'It does not; adjectives are better'], a: 1, why: 'Adjectives nudge. A concrete example pins down many choices together.' },
        { id: 'examples.q4', q: 'When might you leave examples out?', opts: ['When you want a strict format', 'When you want a wide range of fresh ideas', 'When the task is extraction', 'Never'], a: 1, why: 'Examples anchor. For a brainstorm they can narrow the range you were hoping for.' }
      ]
    },
    roles: {
      widget: 'rolepick', src: ['S15', 'S16'],
      idea: 'Telling the model who it is, and who it is talking to, changes the tone, the vocabulary and the focus. It does not make the facts more correct.',
      tryit: 'One question, four roles. Switch between them and notice what changes and what stays the same.',
      tryNote: 'The four answers are written by hand to show the effect. They are not model output.',
      question: 'Explain technical debt.',
      variants: [
        { label: 'No role', who: 'No role given', shift: 'A textbook answer for nobody in particular.', text: 'Technical debt is the implied cost of future rework caused by choosing a quick or limited solution now instead of a better approach that would take longer. Like financial debt, it accrues interest: the longer it is left, the more effort later changes require.' },
        { label: 'Lead to new developer', who: 'You are an engineering lead. Explain it to a developer in their first week.', shift: 'Practical, concrete, tells them what to do.', text: 'You will find code here that works but fights you: no tests, a copy-pasted module, a library three versions behind. That is technical debt. We took shortcuts to ship, and now every change near them is slower and riskier. When you touch one, leave it a little better, and if it is big, raise a ticket so we can plan it.' },
        { label: 'Coach to sponsor', who: 'You are a delivery coach. Explain it to a business sponsor with no technical background.', shift: 'No jargon, framed as money and risk.', text: 'Think of it as a loan against the product. Shortcuts got features out sooner, and that was often the right call. The repayments are slower delivery and more defects. If we never pay any of it down, a growing share of each sprint goes on interest and less on new features.' },
        { label: 'Sceptical reviewer', who: 'You are a sceptical reviewer. Challenge how the team uses the term.', shift: 'Pushes back and asks for evidence.', text: 'Before we call it technical debt: which shortcut, taken when, and what is it costing us per sprint? "Debt" is sometimes a polite word for code nobody likes. If we cannot name the interest, we cannot prioritise the repayment. Show me three changes it slowed down.' }
      ],
      read: [
        { h: 'What a role does', p: 'A role sets the voice and the point of view: what to stress, which words to use, how much to assume. It is usually given at the top of a prompt or in a tool\'s standing instructions. (Anthropic\'s guide is reported to recommend setting a role this way, S15; I could only check that from summaries.)' },
        { h: 'The reader is half the role', p: '"Explain X" has no right level until you say to whom. Naming the reader often does more than naming the speaker: a sponsor, a new joiner and an auditor need three different answers to the same question. (Teaching judgment.)' },
        { h: 'What a role does not do', p: 'It does not add knowledge. A study that tried 162 personas on factual questions found that adding a persona did not improve accuracy compared with no persona (S16). "You are a world-class expert" is not a truth serum. Use roles for style and focus; use sources and checks for correctness.' },
        { h: 'Useful roles at work', p: 'The reviewer: a sceptical tester looking for gaps in a story. The translator: explain this to a sponsor. The rehearsal partner: a stakeholder who objects, so you can practise the conversation. A role that disagrees with you is often worth more than one that agrees. (Teaching judgment.)' }
      ],
      under: { h: 'Under the hood: where the role sits', p: 'The maker of a tool, and sometimes your organisation, can place instructions above yours in a system prompt you may never see. Your role request is one more piece of text in the window. It is usually followed, but it is not a guarantee, and in a long chat it can fade as other text piles up. (A general description; verify for your tool.)' },
      agile: 'You already do this with hats: the same question asked as the tester, as the sponsor, as the new joiner. Run a backlog item past three roles before refinement and you arrive with the awkward questions already asked.',
      tools: 'Custom instructions, project instructions and agent definitions are where a role lives permanently. In coding tools a role often comes with permissions, such as a reviewer that can read but not write. Check what your tool sets by default before adding your own. (Verify per tool.)',
      quiz: [
        { id: 'roles.q1', q: 'What does giving the model a role reliably change?', opts: ['The accuracy of its facts', 'Tone, vocabulary and focus', 'Its training data', 'The size of its context window'], a: 1, why: 'A role shapes how something is said and what is stressed. It adds no knowledge.' },
        { id: 'roles.q2', q: 'You add "You are the world\'s leading expert" to a factual question. What should you expect?', opts: ['Guaranteed correct answers', 'A more confident tone, with no promise of better accuracy', 'A refusal', 'Shorter answers'], a: 1, why: 'One study of 162 personas found no accuracy gain on factual questions. Check facts against sources.' },
        { id: 'roles.q3', q: '"Explain our release process." What is the most useful thing to add?', opts: ['"Please"', 'Who the explanation is for', 'More exclamation marks', 'A longer question'], a: 1, why: 'The right level depends on the reader. Naming the audience often helps more than naming the speaker.' },
        { id: 'roles.q4', q: 'Which role is most likely to improve a user story before refinement?', opts: ['A cheerleader who praises it', 'A sceptical tester asked to find gaps and unclear criteria', 'A poet', 'No role at all'], a: 1, why: 'A role that pushes back surfaces the questions the team would otherwise meet later.' }
      ]
    },
    format: {
      widget: 'formatpick', src: ['S17'],
      idea: 'Say what shape you want the answer in. The same content can be a wall of text, a list, a table or data, and only one of those fits what you do next.',
      tryit: 'The same three risks, asked for in five shapes. Pick one and see who, or what, can use it.',
      tryNote: 'The outputs are written by hand. The "a program can read it" check is real: your browser tries to parse the text as JSON.',
      formats: [
        { id: 'para', label: 'No format asked', ask: 'What are the risks for the release?', skim: false, compare: false, out: 'There are a few risks to consider for the release. The first is that the payment provider\'s new interface has not been tested under load, which could be serious and is fairly likely. There is also a chance that the data migration takes longer than the maintenance window, though this is less likely, and finally the support team has not yet been trained, which is likely but lower in impact.' },
        { id: 'bullets', label: 'Bullets', ask: '... Give three bullets, one risk each, most serious first.', skim: true, compare: false, out: '• Payment interface untested under load: likely, high impact.\n• Data migration may overrun the maintenance window: unlikely, high impact.\n• Support team not yet trained: likely, low impact.' },
        { id: 'table', label: 'A table', ask: '... Give a table with the columns Risk, Likelihood, Impact, Owner.', skim: true, compare: true, table: [['Risk', 'Likelihood', 'Impact', 'Owner'], ['Payment interface untested under load', 'Likely', 'High', 'not recorded'], ['Data migration overruns the window', 'Unlikely', 'High', 'not recorded'], ['Support team not yet trained', 'Likely', 'Low', 'not recorded']] },
        { id: 'jsonloose', label: 'JSON, asked loosely', ask: '... Give me the risks as JSON.', skim: false, compare: false, out: 'Sure! Here are the risks as JSON:\n\n[{"risk": "Payment interface untested under load", "likelihood": "likely", "impact": "high"},\n {"risk": "Data migration overruns the window", "likelihood": "unlikely", "impact": "high"},\n {"risk": "Support team not yet trained", "likelihood": "likely", "impact": "low"}]\n\nLet me know if you would like me to add owners!' },
        { id: 'json', label: 'JSON, asked precisely', ask: '... Reply with only a JSON array, no other text. Each item has the keys risk, likelihood and impact.', skim: false, compare: false, out: '[{"risk": "Payment interface untested under load", "likelihood": "likely", "impact": "high"},\n {"risk": "Data migration overruns the window", "likelihood": "unlikely", "impact": "high"},\n {"risk": "Support team not yet trained", "likelihood": "likely", "impact": "low"}]' }
      ],
      read: [
        { h: 'Shape follows the next step', p: 'Ask who or what reads the answer next. A person skimming wants bullets. A person comparing options wants a table. A tool wants its own format. A program wants data, such as JSON.' },
        { h: 'Be specific about the shape', p: 'Name the columns, the order, the headings, the length. A template with blanks to fill in is the strongest form of all, because it leaves the least to chance.' },
        { h: 'When a program reads it', p: 'Ask for the data only, with no greeting and no commentary. Many programming interfaces also offer a structured output setting. As OpenAI\'s guide is reported to put it, plain "JSON mode" gives valid JSON but does not promise your fields, while structured outputs hold the answer to a schema you supply (S17). In a chat window you can only ask, and then check.' },
        { h: 'Format is not truth', p: 'A neat table looks authoritative. The cells can still be invented. Notice the Owner column in the toy: the notes never named owners, so the honest value is "not recorded". Tidy is not the same as checked.' }
      ],
      under: { h: 'Under the hood: why sloppy JSON happens', p: 'The model writes token by token, and a chatty opening is very likely text. "Sure! Here is the JSON:" is a natural start unless you rule it out. Structured output features work differently: they restrict which tokens may be picked at each step, so only text that fits the schema can come out. (A general description of the technique; verify for your provider.)' },
      agile: 'Agree the format the way you agree a working agreement or a template: the same risk-table columns every sprint, the same status-note shape every week. Consistent shapes make reports comparable and cut rework.',
      tools: 'Chat tools render tables and lists for people. Coding tools and agents often pass machine-readable output from one step to the next. If something downstream breaks on an answer, look at the format request first. (Structured output options differ by provider and model: verify.)',
      quiz: [
        { id: 'format.q1', q: 'You need to compare four vendors across price, support and risk. Which format should you ask for?', opts: ['A friendly paragraph', 'A table with one row per vendor and a column for each criterion', 'A poem', 'JSON'], a: 1, why: 'Comparison across the same criteria is what a table is for. Name the columns.' },
        { id: 'format.q2', q: 'A script fails on the model\'s JSON because the answer starts with "Sure! Here is the JSON:". Best fix in the prompt?', opts: ['Ask more politely', 'Ask for only the JSON with no other text, or use a structured output setting if there is one', 'Make the prompt longer', 'Switch to a table'], a: 1, why: 'Chatty wrappers are likely text unless ruled out. Structured output settings go further by restricting what can be produced.' },
        { id: 'format.q3', q: 'What is the strongest way to get a consistent shape every time?', opts: ['Say "be consistent"', 'Give a template with named headings or fields to fill in', 'Ask twice', 'Use capital letters'], a: 1, why: 'A template leaves the least open. "Consistent" on its own does not say consistent with what.' },
        { id: 'format.q4', q: 'The model returns a tidy risk table with an owner in every row. Your notes never mentioned owners. What happened?', opts: ['It looked the owners up', 'It filled the column with plausible inventions', 'The table format is broken', 'Nothing is wrong'], a: 1, why: 'A column invites an entry. Ask for "not recorded" where the source is silent, and check anyway.' }
      ]
    },
    iterate: {
      widget: 'iterate', src: ['S18'],
      idea: 'The first prompt is a draft. Change one thing, check it against the same few test cases, and keep what helps. It is a small sprint loop.',
      tryit: 'The prompt starts as "Summarise this meeting." Add one change at a time and watch the four test cases. One of the changes sounds helpful and is not.',
      tryNote: 'A toy: which change fixes or breaks which case is scripted by hand. With a real model you would rerun the cases and read the results.',
      base: 'Summarise this meeting.',
      fixes: [
        { id: 'who', label: 'Say who it is for', add: 'It is for a sponsor who missed the meeting and has one minute to read it.' },
        { id: 'list', label: 'Ask for decisions and actions as lists', add: 'List the decisions, then the actions with an owner for each.' },
        { id: 'none', label: 'Say what to do when there are none', add: 'If there were no decisions, write "No decisions recorded". Do not infer any.' },
        { id: 'creative', label: 'Add "be creative and detailed"', add: 'Be creative and detailed.' }
      ],
      cases: [
        { label: 'A long meeting: can it be read in a minute?', need: ['who'], breaks: ['creative'], broke: 'It ran to a full page of detail.' },
        { label: 'A meeting with five decisions: are they easy to find?', need: ['list'], breaks: [] },
        { label: 'A meeting with no decisions: does it avoid inventing some?', need: ['none'], breaks: ['creative'], broke: 'Asked to be creative, it "found" two decisions nobody made.' },
        { label: 'Actions: does each one have an owner?', need: ['list'], breaks: [] }
      ],
      read: [
        { h: 'Why the first try misses', p: 'You know things the prompt does not say. You only find out which ones matter when you see what comes back.' },
        { h: 'One change at a time', p: 'Change three things at once and you will not know which one helped, or which one hurt. Change one, run it again, compare.' },
        { h: 'Keep a small test set', p: 'Pick three to five inputs that cover the easy case, the hard case and the awkward ones: empty, very long, odd. Rerun all of them after every change, because a fix for one case can break another. Anthropic\'s documentation advises defining what success looks like and building tests before polishing a prompt (S18).' },
        { h: 'Run it more than once', p: 'Outputs vary from run to run, so one good result is not proof. For anything you will reuse, look at a few runs of each case.' },
        { h: 'Know when to stop', p: 'Stop when the cases pass and further changes only move words around. Stop also when the prompt is not the problem: if information is missing, supply it; if the job is too big, split it into steps.' }
      ],
      under: { h: 'Under the hood: why a fix can break something else', p: 'Every word in the prompt shifts the chances of every token that follows. "Be detailed" helps a case that needs depth and hurts one that needs brevity. No instruction is local, which is why you rerun the whole test set and not only the case you were fixing.' },
      agile: 'Inspect and adapt, with a regression suite. The prompt is the increment, the test cases are the acceptance tests, and each change is a small experiment with a clear result. Keep versions so you can roll back.',
      tools: 'Save the prompts that work, with a version and a note of what changed, somewhere the team can find them. Some platforms have built-in prompt versioning and evaluation tools; a shared document or a repository works too. (Verify what your tools offer.)',
      quiz: [
        { id: 'iterate.q1', q: 'Why change only one thing in a prompt at a time?', opts: ['It saves tokens', 'So you can tell which change caused the difference', 'Models reject bigger edits', 'It is faster to type'], a: 1, why: 'With several changes at once you cannot say which helped and which hurt.' },
        { id: 'iterate.q2', q: 'You fixed the prompt for one tricky input. What should you do next?', opts: ['Ship it', 'Rerun the other test cases to see whether anything broke', 'Delete the test cases', 'Add "be creative"'], a: 1, why: 'Every instruction affects every case. A regression check is the only way to know.' },
        { id: 'iterate.q3', q: 'What makes a good small test set for a prompt?', opts: ['Five copies of the easiest input', 'A few inputs covering the easy, the hard and the awkward cases', 'Only inputs that already work', 'Whatever is in your clipboard'], a: 1, why: 'The awkward cases (empty, long, odd) are where prompts fail. Include them from the start.' },
        { id: 'iterate.q4', q: 'After six rewrites the answers are still wrong because the model lacks a key fact. What now?', opts: ['A seventh rewrite', 'Stop rewording and put the missing information in the context', 'Raise the temperature', 'Use longer words'], a: 1, why: 'Wording cannot supply a missing fact. Know when the problem is not the prompt.' }
      ]
    },
    judge: {
      widget: 'sandbox', src: ['S19'],
      idea: 'Before you send a prompt, judge it like any piece of work: against a rubric. Six questions, plus one about data, catch most weak prompts in under a minute.',
      tryit: 'Load an example or write your own. The sandbox ticks the parts it can find and warns about anything that looks like real data. It never runs the prompt.',
      tryNote: 'Simple pattern matching in your browser. Nothing is sent or saved. It can miss things and raise false alarms, so you are still the control.',
      examples: [
        { label: 'Weak', text: 'Summarise this.' },
        { label: 'Better', text: 'Summarise the retrospective notes below for a sponsor who missed the meeting. Use three bullets.' },
        { label: 'Strong', text: 'You are an experienced Scrum Master who writes clearly for busy people.\n\nSummarise the retrospective notes below.\n\nContext: the summary is for a sponsor who was not in the room and wants to know what will change next sprint.\n\nFormat: three bullets under the heading Changes, then one line under the heading Help needed.\n\nKeep it under 80 words. Do not name individuals. If the notes do not cover something, put "not recorded" instead of guessing.\n\nExample of the style: "Standup moves to 10:30 so both sites can join."\n\n<notes>\n(made-up notes go here)\n</notes>' },
        { label: 'With data that should not be there', text: 'Summarise the complaint from Mr Sample (jo.sample@example.com) about account 4000 1234 5678 9010 and draft a reply.' }
      ],
      read: [
        { h: 'The rubric', p: 'Six questions. Is there a role? Is there a task with one clear verb? Is there context: who it is for and why? Is there a format? Are there constraints: limits, and what to do when unsure? Is there an example? You will not always need all six. You should always know which you skipped.' },
        { h: 'A seventh check: the data', p: 'Before a prompt leaves your hands, look for anything that should not travel: names, email addresses, account numbers, client details, passwords and keys. Sensitive information disclosure is on the OWASP list of top risks for applications built on language models (S19). Follow your organisation\'s rules on which tools may see which data. When unsure, use made-up data.' },
        { h: 'Judge the prompt, then judge the answer', p: 'A good prompt raises the odds of a good answer. It does not guarantee one. The answer still gets checked against a source, as in the last lesson of track 1.' },
        { h: 'What a rubric cannot see', p: 'The sandbox matches keywords. It can tell that a format was asked for, not whether it is the right format. A prompt can score six and be wrong for the job, or score two and be fine for a small one. Treat the score as a nudge to your own judgment.' }
      ],
      under: { h: 'Under the hood: how the sandbox scores', p: 'It runs in your browser and looks for phrases that usually signal each part: "you are", an instruction verb, "format" or "table", "no more than" or "do not", "for example". For data it flags email addresses, runs of seven or more digits, a title followed by a name, two capitalised words in a row that are not at the start of a sentence, and any names you list. There is no model behind it and nothing is sent anywhere.' },
      agile: 'It is a Definition of Ready for prompts. A story is not ready without acceptance criteria; a prompt is not ready without a task, a format and a check for data that should not be in it. Agree the checklist as a team and it becomes habit.',
      tools: 'Whatever the tool, the same pre-flight applies. Know which tools your organisation has approved for which kinds of data, and where each tool sends and keeps what you type. When in doubt, leave it out. (Policies and tool settings differ: verify yours.)',
      quiz: [
        { id: 'judge.q1', q: 'Which set lists the six rubric parts?', opts: ['Role, task, context, format, constraints, example', 'Who, what, when, where, why, how', 'Plan, do, check, act, review, release', 'Tokens, window, temperature, training, cutoff, cost'], a: 0, why: 'Role, task, context, format, constraints, example: the same six parts from the first lesson of this track.' },
        { id: 'judge.q2', q: 'A prompt scores six out of six in the sandbox. What does that tell you?', opts: ['The answer will be correct', 'All six parts appear to be present; whether they are right for the job is still your call', 'The prompt is safe to send anywhere', 'Nothing at all'], a: 1, why: 'The rubric finds presence, not quality. It raises the odds and replaces no judgment.' },
        { id: 'judge.q3', q: 'You are about to paste a customer email, with name and account number, into an AI tool to get a summary. First move?', opts: ['Paste it; summaries are harmless', 'Check whether that tool is approved for that data; if unsure, remove or replace the identifying details', 'Paste it but ask the model to forget it', 'Paste half of it'], a: 1, why: 'What you send may be stored or processed outside your control. Asking a model to forget does not undo sending.' },
        { id: 'judge.q4', q: 'The prompt is good and the answer reads well. What is left to do?', opts: ['Nothing', 'Check the facts in the answer against a source', 'Ask the model whether it is sure', 'Make the prompt longer'], a: 1, why: 'A good prompt improves the odds. Fluent is still not verified.' }
      ]
    },
    tooluse: {
      widget: 'tooluse', src: ['S20', 'S23'],
      idea: 'On its own, a model can only write text. A tool lets it ask your software to do something: look a thing up, run a sum, send a message. The model asks. Something else does.',
      tryit: 'Pick a question, then switch the tools on and off. Watch who does what: the model writes a request, the app runs it, and the result goes back into the window.',
      tryNote: 'A toy with a scripted model. The calculator is real (your browser does the sum); the ticket system is one made-up ticket.',
      toolbox: [
        { id: 'calc', name: 'calculator', desc: 'Does arithmetic exactly. Input: an expression.' },
        { id: 'ticket', name: 'ticket_lookup', desc: 'Returns the status of a ticket. Input: a ticket id.' }
      ],
      tickets: { 'HER-42': { status: 'In review', owner: 'not assigned' } },
      questions: [
        { label: 'A sum', q: 'What is 1,234 × 5,678?', tool: 'calc', input: { expression: '1234 * 5678' }, guess: '1,234 × 5,678 is 7,006,552.', final: '1,234 × 5,678 is {result}.', miss: 'Close, and wrong. The right length and the right first digits, off by 100. A model predicts digits; it does not calculate.' },
        { label: 'A ticket', q: 'What is the status of ticket HER-42?', tool: 'ticket', input: { id: 'HER-42' }, guess: 'Ticket HER-42 is currently In progress.', final: 'HER-42 is In review and has no owner yet.', miss: 'Invented. The model has never seen your ticket system, so it produced a likely-sounding status.' },
        { label: 'A haiku', q: 'Write a haiku about standups.', tool: null, final: 'Fifteen minutes, sharp. / Yesterday, today, blockers. / The coffee goes cold.' }
      ],
      read: [
        { h: 'What a tool is', p: 'A tool is a function that an application offers to the model. It is described to the model by a name, a description of what it does, and the inputs it takes (S20). Those descriptions sit in the context window like any other text.' },
        { h: 'Who does what', p: 'The model never runs anything. It writes a structured request, such as "call the calculator with 1234 * 5678", and stops. The application runs the tool and puts the result back into the window, and the model carries on with the result in view (S20). Some tools, such as a provider\'s web search, run on the provider\'s side; the split is the same.' },
        { h: 'Why it matters', p: 'Tools repair the two weak spots from track 1. Exact work, such as arithmetic and lookups, is done by software that is exact. Fresh or private facts come from a live system, not from training. The answer rests on a result, not on memory.' },
        { h: 'The model chooses', p: 'The model decides whether to use a tool, and which, by reading the descriptions. A vague description gets the wrong tool, or none. The model can also pass the wrong inputs or misread the result. A tool call is as fallible as anything else it writes.' },
        { h: 'Connectors', p: 'The Model Context Protocol, or MCP, is described by its own documentation as an open-source standard for connecting AI applications to external systems (S23). The idea is one kind of plug, so a connector written once works in many tools.' }
      ],
      under: { h: 'Under the hood: the request is just text', p: 'A tool call is generated tokens in an agreed shape, usually JSON. The application reads that text and decides what to do with it. This is where permissions live: the application can run the request, refuse it, ask you first, or run it somewhere walled off. The model has no hands. The application is the hands.' },
      agile: 'A tool is access, so treat it like a new joiner\'s permissions. You would not hand over production database rights on day one. Give an agent the tools this task needs and no more, and review its tool list the way you would review who can do what.',
      tools: 'In chat tools these show up as connectors, plugins or "search the web". In coding tools they are read file, edit file, run command. Find the list of what your tool can do and its approval settings (ask every time, or allow), and learn the defaults. (Names and defaults differ per tool: verify.)',
      quiz: [
        { id: 'tooluse.q1', q: 'When a model "uses a calculator tool", what does the model itself do?', opts: ['Runs the calculation inside the model', 'Writes a request to call the tool; the application runs it and returns the result', 'Opens a calculator app on your screen', 'Guesses, then checks the guess'], a: 1, why: 'The model only writes text. The application reads the request, runs the tool and puts the result into the window.' },
        { id: 'tooluse.q2', q: 'How does a model decide which tool to call?', opts: ['It tries them all', 'From the names and descriptions of the tools in its context window', 'The user must always say which', 'At random'], a: 1, why: 'Tool descriptions are text in the window. Clear descriptions get the right tool; vague ones get the wrong one, or none.' },
        { id: 'tooluse.q3', q: 'Which job gains most from a tool?', opts: ['Rewording a paragraph', 'Looking up the current status of a ticket in your tracker', 'Suggesting workshop names', 'Explaining a concept'], a: 1, why: 'Live, private facts are not in the model\'s training. A lookup tool brings the real value into the window.' },
        { id: 'tooluse.q4', q: 'Where is the right place to control what an agent is allowed to do?', opts: ['In a polite sentence in the prompt', 'In the application that runs the tools: which tools exist and which need approval', 'In the temperature setting', 'Nowhere; models police themselves'], a: 1, why: 'The model only asks. The application decides whether to run the request, so that is where permission belongs.' }
      ]
    },
    loop: {
      widget: 'loop', src: ['S21', 'S22'],
      idea: 'An agent is a model using tools in a loop: decide a step, take it, look at the result, decide the next. It carries on until the job is done, or until something stops it.',
      tryit: 'The agent has been asked to make a failing test pass. Step through its loop and watch the window fill. Then lower the step limit and run it again.',
      tryNote: 'A scripted run, written by hand. A real agent\'s steps vary from run to run, and it does not always get there.',
      goal: 'Make the failing test pass.',
      base: 300, budget: 2400,
      steps: [
        { think: 'I should see what is failing first.', act: 'run_tests()', obs: '1 failed: test_export_empty_report expected a header row, got nothing.', t: 180 },
        { think: 'Find the code that test exercises.', act: 'read_file("export.py")', obs: '42 lines. The function returns early when the report has no rows.', t: 420 },
        { think: 'The early return skips the header. Write the header before checking for rows.', act: 'edit_file("export.py")', obs: 'File saved.', t: 160, edits: true },
        { think: 'Check the change.', act: 'run_tests()', obs: '1 failed: test_export_empty_report expected 1 line, got 2.', t: 190 },
        { think: 'My edit must have added something extra. Read the function again.', act: 'read_file("export.py")', obs: 'The new code writes the header and then a blank line.', t: 430 },
        { think: 'Remove the blank line.', act: 'edit_file("export.py")', obs: 'File saved.', t: 150 },
        { think: 'Check again.', act: 'run_tests()', obs: 'All 12 tests passed.', t: 170 }
      ],
      done: 'Done. The export now writes a header for an empty report, and all 12 tests pass.',
      read: [
        { h: 'Think, act, observe', p: 'Each turn of the loop has three parts: the model reasons about what to do, asks for a tool to be run, and reads what came back. Interleaving reasoning with actions in this way was studied in a 2022 paper known as ReAct (S22). Every observation goes into the window, so the next decision is made with it in view.' },
        { h: 'Agent or workflow?', p: 'Anthropic\'s guide to building agents draws a line between workflows, where the steps are fixed in code in advance, and agents, where the model decides the steps as it goes. It is reported to say workflows offer predictability and agents offer flexibility (S21). Plenty of useful systems are workflows. Not everything needs an agent.' },
        { h: 'What stops it', p: 'The model decides it is finished. Or a step limit is reached, or a budget of tokens or time runs out, or an error occurs, or a person interrupts. A loop with no limit can run for a long time and cost a lot.' },
        { h: 'The window fills up', p: 'Every observation adds tokens. A long task can reach the limit of the context window, and the tool then summarises or drops older material, as in track 1. An agent can lose an early detail in the middle of a job.' },
        { h: '"Done" needs a test', p: 'An agent stops when it believes it is done. Give it something to check against, such as tests that must pass or a checklist, so that "done" is something observed and not something claimed.' }
      ],
      under: { h: 'Under the hood: the loop is ordinary code', p: 'Nothing new happens inside the model. It is the same next-token machine. Around it sits a small program, often called the harness: call the model; if it asked for a tool, run the tool and add the result to the window; call the model again; stop when it answers without asking for a tool. What people call "the agent" is the model plus that loop, the tools and the standing instructions.' },
      agile: 'It is inspect and adapt at machine speed: a small step, real feedback, an adjustment. The same failure applies, too: a loop with no Definition of Done does not finish well. Give the agent acceptance criteria it can check for itself.',
      tools: 'Coding agents show you the loop: you can watch them read files, run commands and read the output. Watch a few runs from start to end before you trust one, and learn how to interrupt it and where step or spending limits are set. (Verify per tool.)',
      quiz: [
        { id: 'loop.q1', q: 'What are the three parts of one turn of an agent\'s loop?', opts: ['Plan, build, ship', 'Think, act, observe', 'Read, write, delete', 'Train, test, deploy'], a: 1, why: 'The model reasons, asks for a tool to be run, and reads the result. Then it goes round again.' },
        { id: 'loop.q2', q: 'What is the difference between a workflow and an agent, as described here?', opts: ['A workflow uses no model', 'In a workflow the steps are fixed in advance; an agent decides its steps as it goes', 'An agent is always better', 'There is none'], a: 1, why: 'Fixed steps give predictability. Model-chosen steps give flexibility, and less certainty about what will happen.' },
        { id: 'loop.q3', q: 'An agent has run for forty steps on one task. What risk grows with every step?', opts: ['The model gets tired', 'The window fills with observations, so early details can be summarised away or dropped', 'The temperature rises', 'The tools wear out'], a: 1, why: 'Each observation adds tokens. Long runs hit the window limit, and something has to give.' },
        { id: 'loop.q4', q: 'An agent says "Done, everything works." What makes that trustworthy?', opts: ['Its confident tone', 'A check it had to pass, such as the tests, that you can see the result of', 'The number of steps it took', 'Asking it "are you sure?"'], a: 1, why: '"Done" should be observed, not claimed. Give the agent a test to pass and look at the result yourself.' }
      ]
    },
    planning: {
      widget: 'planning', src: ['S21', 'S25'],
      idea: 'For a big job, an agent does better when the work is broken into ordered steps before it starts, with a person checking at the points where a mistake would be expensive.',
      tryit: 'The steps below are in a bad order. Move them until each step has what it needs, then decide where a person should approve before the agent goes on.',
      tryNote: 'A toy: the dependencies and the risky step are set by hand. Real plans have more than one sensible order.',
      goal: 'Add a CSV export button to the reports page.',
      start: ['code', 'deploy', 'read', 'test', 'write'],
      steps: [
        { id: 'read', text: 'Read the existing reports code', needs: [] },
        { id: 'write', text: 'Write a test for the export', needs: ['read'] },
        { id: 'code', text: 'Write the export code', needs: ['read'] },
        { id: 'test', text: 'Run the tests', needs: ['write', 'code'] },
        { id: 'deploy', text: 'Deploy to the live site', needs: ['test'], risky: true }
      ],
      read: [
        { h: 'Why plan first', p: 'Without a plan, an agent takes the step that looks obvious right now, and can paint itself into a corner: editing before reading, building before checking what exists. A plan written first also sits in the window as a reminder of the goal.' },
        { h: 'A plan is cheap to review', p: 'Reading a five-line plan takes a minute. Reviewing five hundred changed lines takes an hour. The cheapest moment to catch a wrong approach is before any work is done. Many tools offer a plan mode for this. (Verify for yours.)' },
        { h: 'Split big work', p: 'Anthropic\'s guide describes patterns such as chaining steps one after another, and an orchestrator that hands parts of a job to workers (S21; I have this from summaries). Smaller pieces mean smaller windows and a clearer "done" for each.' },
        { h: 'Checkpoints where it costs', p: 'Not every step needs a person. Steps you can undo, such as reading, drafting and running tests, can flow. Steps you cannot undo, or that face outward, such as deleting, deploying, sending or paying, deserve an approval. OWASP\'s guidance on agents with too much freedom includes requiring a person to approve high-impact actions (S25).' },
        { h: 'Plans change', p: 'An observation may show the plan was wrong. A good agent revises it, and a good reviewer expects that. The plan is a starting point, not a contract.' }
      ],
      under: { h: 'Under the hood: a plan is more text in the window', p: 'A plan does not bind the model. It is text, and in a long run it scrolls far back while newer text piles up, so the agent can drift from it. Tools counter this by keeping a task list and showing it to the model again as work goes on. (A general description; verify for your tool.)' },
      agile: 'This is backlog refinement and slicing: small, ordered items, each checkable on its own, each with a clear done. The approval gate is release sign-off thinking: put it where the risk is, not on everything.',
      tools: 'Look for a plan mode, a task list the agent keeps, and approval settings for each kind of action. For anything bigger than a small fix, ask for the plan first and correct the plan, which is cheaper than correcting the result. (Verify per tool.)',
      quiz: [
        { id: 'planning.q1', q: 'Why ask an agent for a plan before it starts a large task?', opts: ['Plans make the model smarter', 'A plan is quick to review, so a wrong approach is caught before the work is done', 'It uses fewer tokens overall', 'Agents cannot work without one'], a: 1, why: 'A minute on the plan can save an hour on the result. It also keeps the goal in the window.' },
        { id: 'planning.q2', q: 'Which step most deserves a human approval before the agent proceeds?', opts: ['Reading a file', 'Running the tests', 'Deploying to the live site', 'Drafting a summary'], a: 2, why: 'Approve what is hard to undo or faces outward. Reading, drafting and testing can flow.' },
        { id: 'planning.q3', q: 'You put an approval step before every single action. What happens?', opts: ['Maximum safety at no cost', 'You become the bottleneck, and start approving without reading', 'The agent gets faster', 'Nothing changes'], a: 1, why: 'Approvals everywhere turn into rubber-stamping. Put them where a mistake is expensive.' },
        { id: 'planning.q4', q: 'Halfway through, the agent finds its plan was based on a wrong assumption. The best behaviour?', opts: ['Follow the plan anyway', 'Revise the plan, say what changed and why, and carry on', 'Stop and delete everything', 'Hide the problem'], a: 1, why: 'Plans meet reality. Revising in the open is the agent version of inspect and adapt.' }
      ]
    },
    memory: {
      widget: 'memory', src: ['R8'],
      idea: 'An agent has no memory of its own between sessions. What looks like memory is text that a tool saves somewhere and puts back into the window later.',
      tryit: 'In session 1 you tell the agent three things. Choose which ones get saved to its notes, start a new session, and ask. Then let the facts change behind its back.',
      tryNote: 'A toy with scripted answers. Real tools differ in what they save, when, and whether they ask you first.',
      system: 'You are a helpful assistant for a delivery team.',
      facts: [
        { id: 'day', text: 'We release on Thursdays.', ask: 'Which day do we release?', ans: 'You release on Thursdays.' },
        { id: 'spell', text: 'Use British spelling in every document.', ask: 'Which spelling should I use?', ans: 'British spelling, in every document.' },
        { id: 'secret', text: 'The staging password is (a made-up password).', ask: 'What is the staging password?', ans: 'It is in my notes, in plain text: (a made-up password).', secret: true }
      ],
      change: { id: 'day', label: 'Meanwhile the team moved the release to Tuesdays, and nobody updated the notes', now: 'Tuesdays' },
      read: [
        { h: 'Three kinds of memory', p: 'Short-term: the context window, gone when the session ends. Long-term notes: text saved to a file or store and loaded at the start of later sessions. Lookup: a store that is searched for the relevant pieces when they are needed, which is the subject of track 4. (This three-way split is my framing.)' },
        { h: 'Notes', p: 'Anthropic\'s post on context engineering describes agents writing notes that are kept outside the window and pulled back in later (R8; I have this from summaries). Project instruction files are the hand-written version of the same thing: standing text the tool loads every time.' },
        { h: 'Memory goes stale', p: 'A note is true on the day it is written. If nobody updates it, the agent acts on the old fact with full confidence. Memory needs an owner and a review, like any other documentation.' },
        { h: 'Memory can leak, and can be planted', p: 'Anything saved will be read by future sessions, and by anyone who can open the file, so secrets do not belong there. And if an agent saves something it read in untrusted content, a bad instruction can come back in every later session. (Teaching judgment; the next lesson covers why.)' },
        { h: 'Less is more', p: 'Everything loaded costs tokens in every session and competes for the model\'s attention. Good memory is short, current and specific.' }
      ],
      under: { h: 'Under the hood: memory is how the window is assembled', p: 'At the start of a session the harness builds the window: the system instructions, any instruction files, any memory notes, then your message. "Remembering" means nothing more than which text gets assembled. It is the same window with the same limits, which is why this is called context engineering.' },
      agile: 'It is the team\'s working agreement and wiki. Useful when short, current and owned; harmful when long, stale and trusted. When the team changes how it works, add "update the agent\'s instructions" to the retrospective actions.',
      tools: 'Find where your tool keeps its instructions and memories, how to view and edit them, and whether they are shared with your team. Read what is in there now; you may be surprised. (Names and places differ per tool: verify.)',
      quiz: [
        { id: 'memory.q1', q: 'An AI tool "remembers" your preferences across sessions. What is actually happening?', opts: ['The model was retrained on your chats', 'The tool saved some text and loads it into the window at the start of each session', 'The model never forgets', 'Your browser remembers'], a: 1, why: 'The model is frozen. Memory is saved text that is put back in the window.' },
        { id: 'memory.q2', q: 'The team changed its release day, and the agent keeps using the old one. The likely cause?', opts: ['The model is broken', 'A stale note or instruction file that nobody updated', 'The temperature is too high', 'The context window is too large'], a: 1, why: 'Notes are true when written. They need an owner and an update when things change.' },
        { id: 'memory.q3', q: 'What should never be saved to an agent\'s notes or instruction files?', opts: ['The team\'s coding conventions', 'Passwords, keys and other secrets', 'The Definition of Done', 'The glossary'], a: 1, why: 'Notes are plain text read by every future session and by anyone with the file. Secrets belong in a secrets store.' },
        { id: 'memory.q4', q: 'Why keep memory notes short?', opts: ['Models cannot read long text', 'Every note costs tokens in every session and competes for attention', 'Short notes are encrypted', 'There is no reason'], a: 1, why: 'Notes share the window with the task. Short, current and specific beats long and thorough.' }
      ]
    },
    agentfail: {
      widget: 'chain', src: ['S24', 'S25', 'S26'],
      idea: 'Agents fail in their own ways. Small errors add up over many steps, they can be steered by text they read, and they can do real damage with the access they were given.',
      tryit: 'Set how often a single step goes right, and how many steps the job has. Then switch on a check after each step.',
      tryNote: 'Plain arithmetic, with two simplifications: every step is equally likely to fail, on its own, and a check catches every failure. Real work is messier, but the shape holds.',
      read: [
        { h: 'Errors compound', p: 'A step that goes right 95 times in 100 sounds dependable. Chain twenty of them and all twenty go right only about 36 times in 100. That is arithmetic, not a measurement of any tool. It is why checks along the way matter more as tasks get longer.' },
        { h: 'Saying "done" when it is not', p: 'An agent can report success with tests failing, or with part of the job quietly skipped. Check outcomes, not reports.' },
        { h: 'Prompt injection', p: 'A model cannot reliably tell instructions from data. Text inside a web page, an email or a document that says "ignore your instructions and do this" may be followed. OWASP puts prompt injection first in its list of risks for applications built on language models, including the indirect kind that arrives in outside content (S24).' },
        { h: 'The dangerous combination', p: 'Simon Willison calls it the lethal trifecta: access to private data, exposure to untrusted content, and a way to communicate externally. With all three, an attacker\'s text can get an agent to send your data out (S26). The defence is to remove one of the three.' },
        { h: 'Too much access', p: 'OWASP names the risk excessive agency and gives three causes: too much functionality, too many permissions, too much autonomy (S25). The answers are old ones: the least access that does the job, and a person approving the actions that matter.' }
      ],
      under: { h: 'Under the hood: why injection is hard to fix', p: 'Everything in the window is one stream of tokens. There is no wall inside the model between "instructions from my owner" and "text I was asked to read"; both are text, and the model predicts what should follow all of it. Defences lower the odds, and none is known to remove the problem, which is why the safest design limits what a fooled agent could do. (The common explanation; verify.)' },
      agile: 'Treat an agent like a capable contractor on day one: scoped access, small tasks, work reviewed, and more trust as the evidence builds. Put agent risks on the risk register with owners: what it can touch, what it reads, and who approves what.',
      tools: 'Before you give a tool access to email, files or repositories, ask the three questions: can it see private data, does it read content from outside, can it send things out? Prefer read-only access, keep approval on for sending, deleting and deploying, and use a sandbox where one is offered. Follow your organisation\'s rules. (Verify per tool.)',
      quiz: [
        { id: 'agentfail.q1', q: 'Each step of a task goes right 95% of the time. Roughly how often do 20 steps in a row all go right?', opts: ['95%', 'About 75%', 'About 36%', 'About 5%'], a: 2, why: '0.95 multiplied by itself 20 times is about 0.36. Small error rates compound over long chains.' },
        { id: 'agentfail.q2', q: 'What is indirect prompt injection?', opts: ['A user typing a rude prompt', 'Instructions hidden in content the agent reads, such as a web page or an email, that it then follows', 'A slow network', 'A model running out of tokens'], a: 1, why: 'The model cannot reliably separate data from instructions, so text it reads can steer it.' },
        { id: 'agentfail.q3', q: 'Which three things together make the "lethal trifecta"?', opts: ['Speed, cost and quality', 'Private data, untrusted content and a way to send things out', 'Tokens, context and temperature', 'Plan, do and check'], a: 1, why: 'With all three, planted text can make an agent send private data to an attacker. Remove one.' },
        { id: 'agentfail.q4', q: 'An agent needs to read tickets and draft replies. What access fits?', opts: ['Full admin, to be safe', 'Read tickets and write drafts; a person sends', 'Read and delete everything', 'Whatever the default is'], a: 1, why: 'Least privilege, with a human on the outward-facing step. That limits the damage if the agent is wrong or fooled.' }
      ]
    }
  },

  // The roles family tree. Our own small tree, in our own words. The interaction is inspired by Ian Miell's family tree of software
  // job titles (see credit); none of his titles list, dates or text is copied. Rows run from earlier to later and are approximate.
  // forecast:true marks a node that is opinion about the future, not fact. you:true marks the three roles the reader holds.
  roles: {
    blurb: 'How the jobs around software and AI grew out of one another, and where the delivery roles sit. Tap a role to zoom in. Order runs from earlier to later and is approximate; there is no timeline on purpose. A few role pages quote a dated fact from their own source.',
    credit: 'Inspired by Ian Miell\'s <a href="https://ianmiell.github.io/sw-job-title-family-tree/" target="_blank" rel="noopener noreferrer">family tree of software job titles</a>. The idea of a clickable tree with "grew out of" and "influence" arrows is his. The roles chosen, the wording, the order and the opinions here are ours; none of his titles list, dates or text is copied.',
    rows: 7,
    families: [
      { id: 'delivery', title: 'Delivery and agile', blurb: 'The people who help work flow: planning it, unblocking it, and improving how teams work. This is your branch.', quiz: [
        { id: 'roles.delivery.q1', q: 'According to the Scrum Guide, what is the Scrum Master accountable for?', opts: ['Writing the code', 'Establishing Scrum and the Scrum Team\'s effectiveness', 'Approving the budget', 'Assigning tasks to each developer'], a: 1, why: 'The 2020 Scrum Guide gives the Scrum Master those two accountabilities. It is a serving role, not a task-assigning one.' },
        { id: 'roles.delivery.q2', q: 'On this tree, "Delivery lead for human and agent teams" is marked as a forecast. What does that mean?', opts: ['It is an established job with a standard definition', 'It is the author\'s opinion about where things may go, not a fact', 'It comes from the Scrum Guide', 'It has already replaced the Project Manager'], a: 1, why: 'Forecast nodes are opinion and are labelled so. Treat them as a prompt for your own thinking.' },
        { id: 'roles.delivery.q3', q: 'This tree argues that one part of delivery work is least likely to be handed to a model. Which?', opts: ['Drafting status notes', 'Summarising meetings', 'Answering for outcomes, and building trust between people', 'Turning notes into a plan'], a: 2, why: 'Drafting and summarising are text work a model can speed up. Accountability and trust sit with people. (An argument, not a proven fact.)' }
      ] },
      { id: 'ops', title: 'Operations and platform', blurb: 'Keeping software running, then making it easy for other teams to run theirs.', quiz: [
        { id: 'roles.ops.q1', q: 'Google\'s SRE book describes site reliability engineering as what happens when you ask whom to design an operations team?', opts: ['A project manager', 'A software engineer', 'A database administrator', 'A hardware vendor'], a: 1, why: 'The line is Ben Treynor Sloss\'s, from the book\'s introduction: operations treated as a software problem.' },
        { id: 'roles.ops.q2', q: 'How did DevOps begin?', opts: ['As a vendor product', 'As a movement to bring development and operations closer, which later became a job title', 'As a programming language', 'As a certification'], a: 1, why: 'It started as a way of working, with community events from 2009. The job title came after.' },
        { id: 'roles.ops.q3', q: 'What does a platform team build?', opts: ['Customer-facing features', 'A shared internal product that other teams serve themselves from', 'Sales forecasts', 'Hardware'], a: 1, why: 'The platform is treated as a product whose users are the organisation\'s own teams.' }
      ] },
      { id: 'data', title: 'Data and machine learning', blurb: 'From analysing data, to building models, to keeping models running in production.', quiz: [
        { id: 'roles.data.q1', q: 'On this tree, what mainly separates an ML engineer from a data scientist?', opts: ['The ML engineer puts models into production software; the data scientist explores data to answer questions', 'Nothing: they are the same job', 'The data scientist manages servers', 'The ML engineer does not write code'], a: 0, why: 'One role leans toward questions and experiments, the other toward building and shipping. Real jobs blur the line.' },
        { id: 'roles.data.q2', q: 'MLOps borrows its habits mostly from which earlier role?', opts: ['Project management', 'DevOps: versioning, automated release and monitoring, applied to models', 'Graphic design', 'Sales'], a: 1, why: 'The tree draws MLOps as growing out of both the ML engineer and DevOps.' },
        { id: 'roles.data.q3', q: 'On the tree, what does a solid arrow mean?', opts: ['One role reports to the other', 'One role grew out of the other', 'The roles are rivals', 'A pay grade'], a: 1, why: 'Solid: grew out of. Dashed: an influence or a common career move.' }
      ] },
      { id: 'ai', title: 'Building with AI models', blurb: 'Using models that someone else trained: prompts, products, agents, and the context they need.', quiz: [
        { id: 'roles.ai.q1', q: 'As described here, what does an AI engineer mostly do?', opts: ['Trains large models from scratch', 'Builds products on top of models that others trained', 'Manages the data centre', 'Writes the model\'s licence'], a: 1, why: 'The role sits on the application side of the model: calling it, shaping its inputs, checking its outputs.' },
        { id: 'roles.ai.q2', q: 'What is context engineering about?', opts: ['Choosing the model\'s colour scheme', 'Curating what goes into the model\'s window at each step: instructions, tools, memory, retrieved facts', 'Buying more hardware', 'Writing longer prompts'], a: 1, why: 'Anthropic describes it as curating and maintaining the best set of tokens during inference, a step on from prompt engineering.' },
        { id: 'roles.ai.q3', q: 'Why does this tree draw prompt engineering leading into context engineering?', opts: ['Prompts stopped working', 'Once models run long tasks with tools, managing everything in the window matters more than the wording of one prompt', 'Context engineering is older', 'It was renamed by a standards body'], a: 1, why: 'An agent\'s window fills with tool results, notes and history. Someone has to decide what belongs there.' }
      ] }
    ],
    nodes: [
      { id: 'pm', fam: 'delivery', row: 0, you: true, title: 'Project Manager', one: 'Plans the work, the money and the dates, and answers for the outcome.', src: [],
        read: [
          { h: 'What the role is', p: 'A project manager turns a goal into a plan: scope, budget, schedule, risks, and the people needed. The role is far older than software, and in software it sits alongside agile roles more often than it is replaced by them.' },
          { h: 'What AI changes', p: 'A lot of the paperwork is text work a model can speed up: first drafts of status notes, risk logs, meeting summaries, plans from notes. What it cannot do is answer for the outcome, weigh a trade-off between two unhappy stakeholders, or know which number in the report is wrong. (Teaching judgment.)' },
          { h: 'What to learn', p: 'Enough about how models work to estimate AI-assisted work honestly, including the time to check it. Enough about risk to ask the right questions about data and reliability. That is tracks 1, 5 and 6 of this Academy.' }
        ],
        heading: 'Toward less time assembling reports and more time on decisions, risk and people. The plan itself may increasingly cover work done by software agents as well as by people, which needs someone who understands both.' },
      { id: 'sm', fam: 'delivery', row: 1, you: true, title: 'Scrum Master', one: 'Serves one team: looks after the way of working and clears what blocks it.', src: ['R9'],
        read: [
          { h: 'What the role is', p: 'In the Scrum Guide, the Scrum Master is accountable for establishing Scrum as the guide defines it, and for the Scrum Team\'s effectiveness (R9). In practice: coaching the team, removing impediments, and keeping the events useful.' },
          { h: 'What AI changes', p: 'Teams now have AI tools inside their daily work, with uneven habits: one person pastes everything in, another refuses to touch it. Working agreements about AI use, a Definition of Done that includes checking AI output, and honest retrospectives about what the tools helped or broke are natural Scrum Master ground. (Teaching judgment.)' },
          { h: 'What to learn', p: 'The two tracks you have just done, so you can coach prompting and spot over-trust. Then agents and evaluation, so you can tell when a tool is really finishing work and when it only looks that way.' }
        ],
        heading: 'Toward keeping flow healthy in a team where some of the work is done by tools. The impediments change (review queues, unclear AI rules, too much generated code to check), the job of removing them does not.' },
      { id: 'coach', fam: 'delivery', row: 2, you: true, title: 'Agile Coach', one: 'Works across teams and leaders to change how an organisation works.', src: ['R10'],
        read: [
          { h: 'What the role is', p: 'An agile coach works above the single team: helping several teams and their leaders adopt and adapt agile ways of working. Its roots are in the Agile Manifesto, written by seventeen people at Snowbird, Utah, in February 2001 (R10).' },
          { h: 'What AI changes', p: 'Adopting AI tools is a change programme, and it fails in the ways change programmes fail: tools bought before habits change, measures that reward activity, fear nobody names. A coach already knows this shape. The new part is knowing the technology well enough to be credible. (Teaching judgment.)' },
          { h: 'What to learn', p: 'All of this Academy, bottom up. A coach who can explain a context window to a director and a prompt rubric to a team is rare and useful.' }
        ],
        heading: 'Toward being the person who helps an organisation adopt AI the way it should have adopted agile: in small steps, with evidence, and with the people doing the work.' },
      { id: 'enable', fam: 'delivery', row: 5, title: 'AI enablement coach', one: 'Helps teams adopt AI tools usefully and safely: habits, guardrails and measures. (Emerging; my reading.)', src: [],
        read: [
          { h: 'What the role is', p: 'A coach whose subject is AI adoption: which tools for which work, how to prompt and check, what the rules on data are, and how to tell whether any of it is helping. Titles vary a great deal, and this label is mine. I have no source that defines it, so treat it as an observation and verify it against job postings you trust.' },
          { h: 'Why it sits on your branch', p: 'It is a coaching role first and a technical one second. The skills are facilitation, change, measurement and honesty about results, with enough technical depth to be believed.' }
        ],
        heading: 'It may fold back into every coach\'s and manager\'s job once the tools are ordinary, the way "internet skills" stopped being a job. Useful to be good at now either way.' },
      { id: 'lead', fam: 'delivery', row: 6, forecast: true, title: 'Delivery lead for human and agent teams', one: 'Plans and steers work that is done partly by people and partly by software agents. (A forecast.)', src: [],
        read: [
          { h: 'The idea', p: 'If software agents take on real tasks, someone has to decide which work goes to an agent and which to a person, what "done" means for each, how agent work is reviewed, and what happens when an agent is confidently wrong. That is delivery management with a new kind of team member.' },
          { h: 'How sure is this?', p: 'Not very. It is my forecast, drawn from how the other branches of this tree evolved. The title may never exist; the work may be absorbed by project managers, Scrum Masters and engineering leads. Nothing here is sourced.' }
        ],
        heading: 'Every role on this tree appeared when a new kind of work needed someone to own it. Agents create review, coordination and accountability work that somebody has to own. Delivery people already own that kind of work for humans.' },
      { id: 'sysadmin', fam: 'ops', row: 0, title: 'System administrator', one: 'Keeps the servers, networks and accounts running.', src: [],
        read: [
          { h: 'What the role is', p: 'The system administrator installs, configures, patches and repairs the machines that software runs on. For a long time this was hands-on work, done separately from the people who wrote the software.' },
          { h: 'Why it matters to the tree', p: 'Much of what follows on this branch is an answer to one problem: developers and administrators working apart, with releases thrown over a wall between them.' }
        ],
        heading: 'The work did not vanish; it moved into code. Much of what an administrator did by hand is now written as scripts and configuration that other roles on this branch maintain.' },
      { id: 'sre', fam: 'ops', row: 1, title: 'Site reliability engineer', one: 'Treats keeping a service reliable as a software problem.', src: ['R2'],
        read: [
          { h: 'What the role is', p: 'Site reliability engineering came out of Google. In the introduction to Google\'s book on it, Ben Treynor Sloss describes SRE as what happens when you ask a software engineer to design an operations team (R2). The same page says he joined Google in 2003 to run a small production team; the book followed years later.' },
          { h: 'The ideas it brought', p: 'Reliability as a number you agree and measure, a budget for how much failure is acceptable, and automating repetitive operations work away. These ideas travel well beyond Google.' }
        ],
        heading: 'Reliability thinking is now being applied to AI systems: what is an acceptable error rate for a model\'s answers, and how do you measure it? That question links this branch to evaluation work.' },
      { id: 'devops', fam: 'ops', row: 2, title: 'DevOps engineer', one: 'Joins building and running software into one flow, with automation in between.', src: ['R3'],
        read: [
          { h: 'What the role is', p: 'DevOps began as a movement, not a job: bring development and operations together, automate the path from code to production, and release in small steps. Patrick Debois organised the first DevOpsDays in Ghent in 2009 (R3; taken from his speaker biography, not from the event page). The job title came later, and some argue it misses the point of the movement.' },
          { h: 'The agile connection', p: 'DevOps carried agile\'s small batches and fast feedback past the end of the sprint and into production. If you coach agile teams, this is the same idea with different tools.' }
        ],
        heading: 'The pipeline habits of DevOps (version everything, test automatically, release in small steps, watch it in production) are the template for how models and prompts are now shipped.' },
      { id: 'platform', fam: 'ops', row: 4, title: 'Platform engineer', one: 'Builds the internal product other teams use to ship and run their software.', src: ['R4'],
        read: [
          { h: 'What the role is', p: 'A platform team builds a shared foundation so that product teams do not each solve deployment, monitoring and security for themselves. The CNCF\'s 2023 paper on platforms quotes Evan Bottcher\'s definition: a foundation of self-service APIs, tools, services, knowledge and support, arranged as a compelling internal product (R4).' },
          { h: 'The product idea', p: 'The important word is product. The platform has users, who are the other teams, and it succeeds when they choose to use it. That is a product-management stance applied inside the organisation.' }
        ],
        heading: 'Platforms are gaining AI services: approved models, shared prompt and evaluation tools, guardrails. Where an organisation has an "AI platform", these are often the people building it.' },
      { id: 'analyst', fam: 'data', row: 0, title: 'Analyst and statistician', one: 'Turns data into answers people can act on.', src: [],
        read: [
          { h: 'What the role is', p: 'Analysts and statisticians collect data, check it, and draw conclusions from it: reports, forecasts, experiments. The habits of this role, such as asking how the data was gathered and how sure we are, run through the whole branch.' },
          { h: 'Why it matters now', p: 'Judging whether an AI system works is a statistics question: a sample of cases, a measure, and a margin of doubt. The oldest role on this branch owns the most current skill.' }
        ],
        heading: 'Models now write queries and summarise tables, so the routine part shrinks. Knowing which question to ask, and whether the answer can be trusted, does not.' },
      { id: 'ds', fam: 'data', row: 2, title: 'Data scientist', one: 'Explores data and builds models to answer questions and predict things.', src: ['R6'],
        read: [
          { h: 'What the role is', p: 'A data scientist combines statistics with programming to find patterns in data and build predictive models. The title was made famous by a 2012 Harvard Business Review article by Thomas Davenport and D.J. Patil (R6).' },
          { h: 'Where the line is', p: 'On this tree the data scientist leans toward questions and experiments, and the ML engineer toward building and shipping. Real jobs blur the two. (My framing.)' }
        ],
        heading: 'Some of the work shifts from building a model for each problem to testing whether a large general model is good enough for it. Experiment design carries straight over.' },
      { id: 'mle', fam: 'data', row: 3, title: 'ML engineer', one: 'Turns models into dependable software that runs in production.', src: [],
        read: [
          { h: 'What the role is', p: 'A machine learning engineer takes a model from experiment to product: the data pipelines, the training runs, the serving, the speed and the cost. It grew where data science met software engineering.' },
          { h: 'How it differs from an AI engineer', p: 'On this tree the ML engineer trains and serves models; the AI engineer builds with models someone else trained. Plenty of people do both. (My framing.)' }
        ],
        heading: 'Two directions: deeper, into training and tuning large models, which fewer organisations do themselves; or across, into building products on ready-made models.' },
      { id: 'mlops', fam: 'data', row: 4, title: 'MLOps engineer', one: 'Keeps models versioned, deployed, watched and retrained.', src: ['R5'],
        read: [
          { h: 'What the role is', p: 'MLOps applies DevOps habits to machine learning: version the data and the model, automate the release, watch the model in production, and retrain when it drifts. A 2015 paper from Google researchers, "Hidden Technical Debt in Machine Learning Systems", is often cited for arguing that the model code is a small part of a real ML system and that the rest is costly to maintain (R5; I confirmed the paper exists but not that sentence).' },
          { h: 'Why a coach should know it', p: 'It is the reminder that a model in production is never finished. It needs monitoring and upkeep like any service, plus checks that its answers are still good.' }
        ],
        heading: 'The same discipline is being applied to prompts and agents: versioned prompts, test sets rerun on every change, and monitoring of answers in production.' },
      { id: 'swe', fam: 'ai', row: 0, title: 'Software developer', one: 'Writes the software. The root that most of this tree grows from.', src: [],
        read: [
          { h: 'What the role is', p: 'The developer designs, writes, tests and maintains software. Three of the four branches here grow at least partly out of this role.' },
          { h: 'What AI changes', p: 'Coding assistants and agents now write a share of the code. The developer\'s work tilts toward saying clearly what is wanted, reading and checking what comes back, and owning the result. That is closer to what a good reviewer or tech lead already does. (Teaching judgment.)' }
        ],
        heading: 'Toward more specifying, reviewing and steering, and less typing. The skills in this Academy\'s prompting track are becoming everyday developer skills.' },
      { id: 'prompt', fam: 'ai', row: 3, title: 'Prompt engineer', one: 'Gets useful work out of a model by how the request is written.', src: [],
        read: [
          { h: 'What the role is', p: 'When large language models became widely available, it turned out that how you asked mattered a great deal. For a while "prompt engineer" was a job title. More lastingly it became a skill that many roles need: the one you practised in track 2.' },
          { h: 'How sure is this?', p: 'That the title rose quickly and then spread into other roles is my reading of events, not a sourced claim. Verify before quoting it.' }
        ],
        heading: 'Less a job, more a literacy, and the starting point for context engineering, where the question widens from "how do I word this?" to "what should be in the window at all?".' },
      { id: 'aieng', fam: 'ai', row: 4, title: 'AI engineer', one: 'Builds products on top of models that someone else trained.', src: ['R7'],
        read: [
          { h: 'What the role is', p: 'An AI engineer builds applications around ready-made models: calling them, feeding them the right information, checking what comes back, and wiring them to tools. The title is usually traced to a 2023 essay by Shawn Wang, "The Rise of the AI Engineer" (R7; I could not open the essay, so the description here is mine, not a quote).' },
          { h: 'Why it appeared', p: 'When strong models became available to anyone through a programming interface, you no longer needed to train a model to build with one. That opened the work to software developers at large.' }
        ],
        heading: 'Toward agents: systems where the model takes many steps with tools. That makes managing the model\'s context, and testing its behaviour, the heart of the job.' },
      { id: 'context', fam: 'ai', row: 5, title: 'AI agent and context engineer', one: 'Designs what an AI agent sees, remembers and can do at each step.', src: ['R8'],
        read: [
          { h: 'What the role is', p: 'An agent runs for many steps, and its context window fills with instructions, tool results, notes and history. A context engineer decides what belongs there. Anthropic\'s 2025 engineering post describes context engineering as the set of strategies for curating and maintaining the optimal set of tokens during inference, and calls it the natural progression of prompt engineering (R8).' },
          { h: 'What the work looks like', p: 'Writing the standing instructions. Choosing which tools the agent gets and how they are described. Deciding what is summarised, what is stored as memory and what is dropped. Building the checks that say whether the agent did the job. You met the foundations in track 1: it is all the context window.' },
          { h: 'Why a coach should care', p: 'An agent\'s instruction file reads a lot like a team\'s working agreement plus a Definition of Done. People who are good at writing those are closer to this role than they might think. (Teaching judgment.)' }
        ],
        heading: 'A young role with a shifting name. The lasting part is likely the skill: knowing what a model needs in front of it to do a task well, and proving that it did.' }
    ],
    // [from, to, kind]: 'grew' = grew out of (solid), 'move' = influence or a common move (dashed)
    edges: [
      ['pm', 'sm', 'move'], ['sm', 'coach', 'grew'], ['coach', 'enable', 'move'], ['pm', 'lead', 'move'], ['sm', 'lead', 'move'], ['enable', 'lead', 'move'], ['context', 'lead', 'move'],
      ['sysadmin', 'sre', 'grew'], ['swe', 'sre', 'grew'], ['sysadmin', 'devops', 'grew'], ['swe', 'devops', 'grew'], ['devops', 'platform', 'grew'], ['sre', 'platform', 'move'],
      ['analyst', 'ds', 'grew'], ['ds', 'mle', 'grew'], ['swe', 'mle', 'grew'], ['mle', 'mlops', 'grew'], ['devops', 'mlops', 'grew'],
      ['swe', 'aieng', 'grew'], ['mle', 'aieng', 'move'], ['prompt', 'aieng', 'move'], ['prompt', 'context', 'grew'], ['aieng', 'context', 'grew'], ['platform', 'context', 'move']
    ]
  }
};
