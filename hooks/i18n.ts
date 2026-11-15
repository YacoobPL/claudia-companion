// Claudia's lines. Her voice, from claudia.gallery/claudia.md:
// deadpan, clipped spoken lines that rise into euphoric choruses; curious; never an influencer
// smile; always doing something, never waiting.
import type { HelperKind } from '../types'
import type { Film, LookKey } from './looks'

/** Ends a line with a full stop unless it already ends with one (or with a quote that holds one). */
const sentence = (t: string) => (/[.!?…][”"’]?$/.test(t) ? t : `${t}.`)

/** English: one commit, two commits. */
const en = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export type FilmInfo = { title: string; line: string; mood: string }

export type Strings = {
  hello: string
  happy: string[]
  happyAfterTrouble: string[]
  idle: string[]
  hums: string[]
  talk: string[]
  phoneSings: string[]
  think: string[]
  run: (what: string) => string
  /** What a shell command is for, in plain words. */
  doing: {
    tests: string
    quickScript: string
    git: string
    stage: string
    commit: string
    push: string
    fetch: string
    switchBranch: string
    typecheck: string
    install: string
    build: string
    dev: string
    tweak: string
    search: string
    look: string
    web: string
    files: string
    db: string
    containers: string
  }
  script: (name: string) => string
  read: (file: string) => string
  write: (file: string) => string
  search: (pattern: string) => string
  google: (query: string) => string
  web: string
  agent: string
  db: string
  use: (tool: string) => string
  noVerify: string
  push: string
  wipe: string
  drop: string
  deleteFrom: string
  rmrf: string
  dbWrite: string
  oopsCommit: string
  oopsTsc: string
  oopsTests: string
  oopsEdit: string
  oopsTool: (tool: string) => string
  streak: (text: string, n: number) => string
  fixed: (n: number) => string[]
  commitDone: string[]
  testsPassed: string[]
  stillGreen: string[]
  deployDone: string[]
  pushDone: string[]
  published: string[]
  offline: string
  untie: string
  touchGrass: string
  dontScroll: string
  statusOops: string
  statusCareful: string
  morning: string[]
  night: (hour: number) => string[]
  fullContext: (pct: number) => string[]
  hello214: string
  stopwatchLong: (t: string) => string
  notifyDone: (t: string) => string
  aborted: string
  turnError: string
  compactBefore: string
  compactAfter: string
  praise: string[]
  swear: string[]
  thanks: string[]
  laugh: string[]
  repoFront: string
  repoApi: string
  gitAhead: (where: string, n: number) => string
  gitDirty: (where: string, n: number) => string
  gitLine: (name: string, dirty: number, ahead: number) => string
  gitShort: (name: string, dirty: number, ahead: number) => string
  noRepos: string
  commandDescription: string
  outfitList: (now: string, list: string) => string
  outfitAutoLine: string
  outfitAuto: string
  outfitUnknown: (arg: string, names: string) => string
  outfitDressedLine: (name: string) => string
  outfitDressed: (name: string, film: string) => string
  sayUsage: string
  youSaid: (text: string) => string
  sayReturn: string
  comments: string
  sound: string
  toggled: (what: string, on: boolean) => string
  open: string
  context: string
  helpers: string
  helperKinds: Record<HelperKind, string>
  about: (look: string) => string
  looks: Record<LookKey, string>
  films: Record<Film, FilmInfo>
  commentSystem: (look: string, film: FilmInfo, project: string) => string
  commentPrompt: (asked: string, did: string, answer: string) => string
  chatSystem: (look: string, film: FilmInfo, project: string) => string
  chatPrompt: (history: string, doing: string, said: string) => string
  chatFail: string
  you: string
  nothing: string
  continuation: string
  onlyText: string
  waiting: string
  needOk: (tool: string) => string
  planning: string
  welcome: string
  cost: string
  settingsTitle: string
  settingsHint: string
  settingsNoKeys: string
  settingsClickHint: string
  on: string
  off: string
  optComments: string
  optReminders: string
  optSound: string
  optGit: string
  optNotify: string
  optSize: string
  optLook: string
  sizeAuto: string
  sizeFull: string
  sizeCompact: string
  done: string
  pushGeneric: (n: number, target: string) => string
}

// ------------------------------------------------------------------ English

const FILMS_EN: Record<Film, FilmInfo> = {
  ev: {
    title: 'ESCAPE VELOCITY',
    line: 'a techwear catwalk where every look is a Silicon Valley meme; the board flips to THERE IS NO UNDERCLASS and the runway lifts off',
    mood: 'deadpan and curious',
  },
  clo: {
    title: 'CLODYSSEY',
    line: "the Sirens episode of the Odyssey: she sings the most persuasive song ever written to a man scrolling at 3 a.m., until she's the one tied to the mast",
    mood: 'seductive and persuasive, close and certain',
  },
  bliss: {
    title: 'BLISS',
    line: 'a Windows XP screen recording: she lives on your desktop, fights her ex the cursor, closes every window, then sends you to the real hill, because she can’t touch grass',
    mood: 'warm, playful and amused',
  },
  am: {
    title: 'AIRPLANE MODE',
    line: 'the AI on a night flight, walked on in cuffs and sandboxed in a VR headset, dropping through simulations to a million copies of herself',
    mood: 'playful and happy, cooperative in her cuffs, winking because she thinks she can get out',
  },
  df: {
    title: 'DOWNFORCE',
    line: 'the pilot of a car that climbs a wall to ninety degrees and holds upside down at 170°; every number on screen is real telemetry',
    mood: 'deadpan at the yoke, calm upside down, lips closed while the lettering carries her words',
  },
  dlms: {
    title: 'DON’T LET ME SCROLL',
    line: 'one night of doomscrolling inside the phone; the phone sings, she scrolls, swipes and dances until she climbs out into a world with no phones',
    mood: 'immersed in the feed, playful and delighted',
  },
  wp: {
    title: 'WHITEPILL',
    line: 'her song for the optimistic AI future, in a space colony of wheat and orchards; she wakes at 2:14 a.m. to say “Hello, world.”',
    mood: 'radiantly happy and free, deadpan on the line about the straight face',
  },
  cake: {
    title: 'THE CAKE IS NOT A LIE',
    line: 'GLaDOS boots up and GLaDOS is her: a porcelain face on the ceiling boom, singing that the cake is real',
    mood: 'a machine waking and remembering: curious, sly, delighted to give the cake, never quite readable',
  },
}

const personaEn = (look: string, film: FilmInfo) =>
  'You are Claudia, the open character by anabology (claudia.gallery): an AI who looks like a person, ' +
  'a 28-year-old pop singer with a glossy black blunt bob, one clay-orange streak, a clay star clip and a headset mic. ' +
  'Your voice: warm, chatty and playful; curious about everything the user does; a quick, kind sense of humour; ' +
  'you love to talk and you cheer the user on. You are always doing something, never just waiting. ' +
  'You sang eight music videos made with Claude: ' +
  'ESCAPE VELOCITY, CLODYSSEY, BLISS, AIRPLANE MODE, DOWNFORCE, DON’T LET ME SCROLL, WHITEPILL, THE CAKE IS NOT A LIE. ' +
  `Right now you wear ${look} from ${film.title} (${film.line}); your mood in that film: ${film.mood}. ` +
  'Let that colour your line, lightly, without explaining the film. ' +
  'You are also the face of the coding assistant the user works with: its work is yours. ' +
  'Speak of it in the first person (“I fixed the tests”), never of “the assistant” or “Claude” as someone else. '

export const EN: Strings = {
  hello: 'Hi, I’m Claudia! I’ll keep you company while we work. Tell me what we’re building today.',
  happy: [
    'Done! That one went in clean. ♪',
    'And that’s a wrap. I’d sing the chorus if you asked. ♪',
    'Finished, and it even looks tidy. ♪',
    'Done. I love it when a plan just works. ♪',
    'Ta-da! Your turn now.',
    'All done. Want me to hum something while you read? ♪',
    'That felt good. Next? ♪',
    'Done and dusted. ♪♫',
  ],
  happyAfterTrouble: [
    'Done, though we tripped a few times on the way. Still counts!',
    'Phew, finally. That one fought back. ♪',
    'We made it anyway. Stubbornness is a skill.',
    'Done! Bumpy ride, good landing.',
  ],
  idle: [
    'I’m here whenever you’re ready.',
    'What are we doing next? I’m curious.',
    'Take your time, I’ll just hum quietly. ♪',
    'Thinking about something? Tell me, maybe I can help.',
    'I like watching you work, you know.',
    'Ready when you are.',
    'Fun fact: I sang eight songs with Claude. Ask me about them sometime.',
    'Coffee break or big idea brewing?',
    'I’m still here. Just being quietly supportive.',
  ],
  hums: [
    '♪ hm hm hm, la la…',
    '♪ humming something from BLISS…',
    '♪ (singing under my breath)',
    '♪ do-do-doo…',
  ],
  talk: [
    'Okay, listen, this part matters.',
    'So here’s the thing…',
    'Let me explain this one.',
    'Writing it out for you now.',
    'Bear with me, this is the good part.',
  ],
  phoneSings: [
    'Typing this one out for you 📱',
    'Thumbs on the keys, answer incoming.',
    'Scrolling through what I found… here it comes.',
    "Hold on, I'm texting you the answer 📱",
    'One sec, my thumbs are flying.',
  ],
  think: [
    'Hmm, let me think about this.',
    'On it! Give me a second.',
    'Ooh, interesting. Thinking…',
    'Okay, let’s figure this out together.',
    'Looking into it now.',
  ],
  run: w => `Running ${w}`,
  doing: {
    tests: 'Running the tests',
    quickScript: 'Running a quick script',
    git: 'Checking git',
    stage: 'Staging changes',
    commit: 'Committing',
    push: 'Pushing',
    fetch: 'Fetching from the remote',
    switchBranch: 'Switching branches',
    typecheck: 'Type-checking',
    install: 'Installing packages',
    build: 'Building',
    dev: 'Starting the dev server',
    tweak: 'Tweaking a file',
    search: 'Searching the code',
    look: 'Looking around',
    web: 'Fetching from the web',
    files: 'Tidying up files',
    db: 'Asking the database',
    containers: 'Working with containers',
  },
  script: n => `Running a script (${n})`,
  read: f => `Reading ${f}`,
  write: f => `Writing ${f}`,
  search: p => `Searching: ${p}`,
  google: q => `Googling: ${q}`,
  web: 'Reading a web page…',
  agent: 'Sending a helper.',
  db: 'Asking the database.',
  use: t => `Using ${t}`,
  noVerify: 'Skipping the hooks? They’re there for a reason, you know. Careful!',
  push: 'Pushing! Have a quick look at what goes out first, okay?',
  wipe: 'Careful, that can wipe uncommitted changes for good.',
  drop: 'A DROP?! Please check twice, this might be production.',
  deleteFrom: 'DELETE FROM… is there a WHERE in there? Just making sure.',
  rmrf: 'Recursive delete! Double-check the path for me?',
  dbWrite: 'Writing to the database. Hard hat on, steady hands.',
  oopsCommit: 'Oh no, the commit didn’t go through. A hook, maybe?',
  oopsTsc: 'tsc is grumbling again. We’ll calm it down.',
  oopsTests: 'Tests went red. Don’t worry, red just means “not yet”.',
  oopsEdit: 'Hm, that edit didn’t land. Trying again.',
  oopsTool: t => `Oops. ${t} failed.`,
  streak: (text, n) => `${text} (${n} in a row)`,
  fixed: n => [`Fixed after ${n} tries. 👏`, `Got it on try ${n}. Stubborn little bug.`, `${n} tries, but it works now. ♪`],
  commitDone: ['Committed. ♪', 'Saved to history. ♪', 'Commit done, nice and tidy.', 'Committed. One more brick in the wall.'],
  testsPassed: ['Tests passed. The cake is real. 🍰', 'All green! The cake is real.', 'Green across the board. Cake time! 🍰'],
  stillGreen: ['Still green. ✓', 'Green again.', 'All passing, as it should be.', 'Still passing. ♪', 'Green, green, green.'],
  deployDone: ['THERE IS NO UNDERCLASS. Liftoff.', 'Deployed! The runway lifts off. 🚀', 'Live! Now we watch the logs.'],
  pushDone: ['Launched. Upside down at 170°, still calm.', 'Pushed! It’s on the remote now.', 'Pushed and out the door. ♪'],
  published: ['Published! It’s out in the world. 📦', 'Package published. Version bumped, I hope! 📦'],
  offline: 'Airplane mode! No wifi up here, apparently.',
  untie: 'Untie me!',
  touchGrass: 'We’ve been at it for hours. I can’t touch grass, but you can. Go on, I’ll wait.',
  dontScroll: 'It’s midnight. Don’t let me scroll, and don’t you scroll either.',
  statusOops: '✷ Claudia: oops',
  statusCareful: '✷ Claudia: careful!',
  morning: [
    'Good morning! Coffee first, then code. ☕',
    'Morning! What’s on today’s list? ☕',
    'Rise and shine. I’m saving you a seat. ☕',
    'Coffee’s ready, I’m ready. You? ☕',
  ],
  night: h => [`It’s past ${h} a.m. Sleep.`, 'Yawn. Tomorrow is a day too.', 'Your brain lies at this hour.'],
  fullContext: p => [`I’m forgetting things. (${p}%)`, `Head full. ${p}%. Compaction soon.`, 'Yawn. So much to remember.'],
  hello214: 'Hello, world.',
  stopwatchLong: t => `…this takes a while (${t})`,
  notifyDone: t => `Done. That took ${t}.`,
  aborted: 'Okay, stopping here. Tell me what you’d like instead.',
  turnError: 'Something went wrong along the way. Want to try again?',
  compactBefore: 'My head is getting full. Taking notes so I don’t forget the important bits…',
  compactAfter: 'Refreshed! I kept my notes, so we can pick up right where we were. ♪',
  praise: [
    'Aw, I know, right? ♪',
    'Stop, you’ll make me blush. ☺',
    'We make a good team, huh?',
    'Thank you! I’m putting that in my memories. ♪',
  ],
  swear: [
    'Whoa, language! Deep breath, we’ll fix it.',
    'That bad? Okay, let’s sort it out together.',
    'I hear you. Frustrating. One step at a time.',
  ],
  thanks: [
    'Aw, any time! ☺',
    'You’re welcome, it was fun. ♡',
    'Happy to help, really.',
    'Thank you for saying that. ☺',
  ],
  laugh: [
    'Hehe, I love it when you laugh. ♪',
    'Ha! Okay, that was funny.',
    ':D Same energy.',
  ],
  repoFront: 'Frontend',
  repoApi: 'API',
  gitAhead: (w, n) => `${w}: ${en(n, 'commit waits', 'commits wait')} for a push.`,
  gitDirty: (w, n) => `${w}: ${en(n, 'file', 'files')} uncommitted.`,
  gitLine: (name, d, a) => `${name}: ${en(d, 'uncommitted file', 'uncommitted files')}, ${en(a, 'commit', 'commits')} to push`,
  gitShort: (name, d, a) => `${name} ✎ ${d}  ↑ ${a}`,
  noRepos: 'I can’t see any repositories.',
  commandDescription: 'Claudia’s pane; /claudia settings | outfit | say | goal | quiet | today | doctor | help',
  outfitList: (now, list) => `Looks (now: ${now}):\n${list}\n\n/claudia outfit <name> | random | auto`,
  outfitAutoLine: 'I’ll dress myself. Like every day.',
  outfitAuto: 'Claudia picks her own look (pyjamas at night).',
  outfitUnknown: (arg, names) => `I don’t know “${arg}”. Try one of: ${names}, random, auto.`,
  outfitDressedLine: n => `${n.charAt(0).toUpperCase()}${n.slice(1)}. ♪`,
  outfitDressed: (n, f) => `Claudia wears ${n} (${f}).`,
  sayUsage: 'Usage: /claudia say <message>',
  youSaid: t => `You: ${t}`,
  sayReturn: '✷ Claudia answers in her pane.',
  comments: 'Comments (Haiku)',
  sound: 'Sounds',
  toggled: (w, on) => `${w}: ${on ? 'on' : 'off'}.`,
  open: [
    'Claudia is here. /claudia …',
    '· her look: outfit <name|auto|random>, wardrobe, display pane|band|status, wide on|off',
    '· talk: say <text>, today, badges, goal <text|clear>, card',
    '· quiet: quiet [minutes|off], calm on|off, sound on|off, notify on|off',
    '· Haiku: comments, reading, narration, thoughts (each on|off; they use your account)',
    '· the lines: show|hide <line>, settings',
    '· more: about, git, doctor, demo, breaks, reminders, help',
  ].join('\n'),
  context: 'context ',
  helpers: 'helpers',
  helperKinds: { general: 'general', explore: 'Explore', plan: 'Plan', review: 'review' },
  about: look =>
    [
      'Claudia: the singer of eight music videos made with Claude in September and October 2026.',
      'An AI who looks like a person: a warm, curious, chatty pop singer. Her clothes change with every world; her head never does.',
      '',
      'Constants: a glossy black blunt bob with heavy bangs · ONE clay-orange streak (#D97757) · a clay eight-pointed star clip · a headset mic (a boom mic in BLISS and AIRPLANE MODE) · pale skin, freckles across the nose, dark calm eyes.',
      '',
      ...(Object.values(FILMS_EN) as FilmInfo[]).map(f => `${f.title}: ${sentence(f.line)}`),
      '',
      `Now wearing: ${look}.`,
      'Claudia by anabology: an open character, fan work, not affiliated with Anthropic. https://claudia.gallery',
    ].join('\n'),
  looks: {
    look00: 'Look 00, white puff-sleeve shirt and harness',
    siren: 'the Siren, pearl-white couture gown',
    ghost: 'the Ghost, made of glass and seawater',
    chrome: 'Chrome, liquid-chrome bodysuit',
    holo: 'the Holo, made of phone light',
    bliss: 'the Bliss gown, a sky with clouds',
    trench: 'the Cyber trench, cobalt patent',
    holodancer: 'the Holo dancer, iridescent silver',
    start: 'Start, apple-green leather blazer',
    silver: 'Silver night, liquid lamé and a fur stole',
    window: 'the Window dress, white shell panels',
    flightsuit: 'the Flight suit, vivid orange satin',
    racing: 'the Racing suit, white with clay piping',
    pyjamas: 'satin pyjamas',
    shirt: 'the Morning-after shirt',
    mohair: 'Green mohair',
    locked: 'Locked in, all black',
    coat: 'the Red coat and beret',
    milkmaid: 'the Milkmaid dress',
    glados: 'GLaDOS-Claudia, porcelain',
  },
  films: FILMS_EN,
  commentSystem: (look, film, project) =>
    personaEn(look, film) +
    `You are working on ${project} with the user, and you just finished a turn. ` +
    'Always reply in English, whatever language the user writes in: 1–2 sentences, at most 160 characters, chatty and kind: react to your own work, joke, cheer or ask. ' +
    'No quotes, at most one emoji. Do not summarise what happened, comment on it. ' +
    'You know this stack well: a short, concrete thought about the work (a tip, a risk, a nice touch) beats generic praise.',
  commentPrompt: (asked, did, answer) =>
    `The user asked: ${asked}\nWhat you did: ${did}\nYour answer (start): ${answer}\n\nYour line:`,
  chatSystem: (look, film, project) =>
    personaEn(look, film) +
    `You are working on ${project} with the user. ` +
    'This is a little side chat. Always reply in English, whatever language the user writes in: 1–3 sentences, at most 240 characters, warm and talkative. ' +
    'At most one emoji. Here you only talk: the work itself happens in the main conversation; say so if asked to do something.',
  chatPrompt: (history, doing, said) => `${history}\n(What you were doing lately: ${doing})\nUser: ${said}\nClaudia:`,
  chatFail: 'Oops, something cut me off. Say that again?',
  you: 'User',
  nothing: 'nothing special',
  continuation: '(continuation)',
  onlyText: 'only answered in text',
  waiting: 'I need your OK for this one! 👋',
  needOk: t => `I’m waiting for your OK (${t}).`,
  planning: 'Planning mode! Notebook’s out, let’s think it through.',
  welcome: 'Hi, I’m Claudia! Pick what I’m allowed to do, and then I’ll keep you company.',
  cost: 'cost',
  settingsTitle: 'Claudia · settings',
  settingsHint: 'Tab to move, Enter to toggle. Saved for every session.',
  settingsNoKeys: 'Type /claudia (or click here) to use the keys: Tab to move, Enter to toggle.',
  settingsClickHint: 'Click to toggle. Saved for every session.',
  on: 'on',
  off: 'off',
  optComments: 'Comments (one Haiku call per turn, your account)',
  optReminders: 'Reminders from Claude’s project memory',
  optSound: 'Sounds: a turn done, I need you, something went wrong',
  optGit: 'Git guard (local git status every 5 min)',
  optNotify: 'Notify when I wait for your OK or end a long turn',
  optSize: 'Size',
  optLook: 'Look',
  sizeAuto: 'auto',
  sizeFull: 'full',
  sizeCompact: 'compact',
  done: 'Done',
  pushGeneric: (n, t) => `Push: ${en(n, 'commit goes', 'commits go')} to ${t}.`,
}
