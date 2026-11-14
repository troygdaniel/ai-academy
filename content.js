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
/*LESSONS*/
  }
};
