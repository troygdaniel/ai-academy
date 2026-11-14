// AI Academy content: the curriculum map and the lessons. Plain data, no code. Sources and what is checked: content/SOURCES.md.
// A concept with ready:true has a lesson in LESSONS; the others are on the map but greyed ("coming").
var ACADEMY = {
  tracks: [
    { id: 'models', title: 'How models work', blurb: 'What a model is, what it reads, and why it sometimes sounds sure and is wrong.', concepts: [
      { id: 'tokens', title: 'Tokens', idea: 'What a model really reads.', ready: true },
      { id: 'context', title: 'The context window', idea: 'How much it can look at at once.' },
      { id: 'nexttoken', title: 'Next token and temperature', idea: 'How it picks each word.' },
      { id: 'training', title: 'Training vs using a model', idea: 'Where knowledge comes from.' },
      { id: 'wrong', title: 'Sure and wrong', idea: 'Why fluent is not the same as true.' }
    ] },
    { id: 'prompting', title: 'Prompting', blurb: 'Asking so the answer is useful: parts, examples, format, iteration.', concepts: [
      { id: 'parts', title: 'The parts of a prompt', idea: 'Role, task, context, format.' },
      { id: 'examples', title: 'Show, do not tell', idea: 'Examples steer better than adjectives.' },
      { id: 'format', title: 'Ask for a format', idea: 'Tables, lists, JSON, a template.' },
      { id: 'iterate', title: 'Iterate like a sprint', idea: 'Small changes, check, repeat.' },
      { id: 'judge', title: 'Judging an answer', idea: 'Is it right, or only fluent?' }
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

  sources: [
    { id: 'S1', title: 'OpenAI Help Center: What are tokens and how to count them?', url: 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them', note: 'English rule of thumb: about 4 characters, or 3/4 of a word, per token; 100 tokens is about 75 words. An estimate; other languages differ.' },
    { id: 'S2', title: 'Sennrich, Haddow, Birch (2016): Neural Machine Translation of Rare Words with Subword Units', url: 'https://arxiv.org/abs/1508.07909', note: 'Splitting rare words into subword units, including byte pair encoding. ACL 2016.' },
    { id: 'S3', title: 'Anthropic docs: Understanding the context window', url: 'https://docs.anthropic.com/en/docs/build-with-claude/context-windows', note: 'The context window is the text a model can look at plus what it writes. Sizes differ by model and change, so none are quoted here.' }
  ],

  lessons: {
    tokens: {
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
    }
  }
};
