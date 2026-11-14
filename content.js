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
    { id: 'agents', title: 'Tools and agents', blurb: 'Models that call tools, plan, remember, and where that breaks.', concepts: [
      { id: 'tooluse', title: 'Tool use' }, { id: 'loop', title: 'The agent loop' }, { id: 'memory', title: 'Memory' }, { id: 'agentfail', title: 'Where agents fail' }
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
/*SOURCES*/
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
/*LESSONS*/
  }
};
