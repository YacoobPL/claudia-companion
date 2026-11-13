// Claudia's lines in English (default) and Polish. Her voice, from claudia.gallery/claudia.md:
// deadpan, clipped spoken lines that rise into euphoric choruses; curious; never an influencer
// smile; always doing something, never waiting.
import type { Film, LookKey } from './looks'

export type Lang = 'en' | 'pl'

export type FilmInfo = { title: string; line: string; mood: string }

export type Strings = {
  hello: string
  happy: string[]
  happyAfterTrouble: string[]
  idle: string[]
  hums: string[]
  talk: string[]
  phoneSings: string
  think: string[]
  run: (what: string) => string
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
  fixed: (n: number) => string
  commitDone: string
  testsPassed: string
  deployDone: string
  pushDone: string
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
  langSet: string
  langUnknown: string
  open: string
  energy: string
  helpers: string
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
  on: string
  off: string
  optComments: string
  optReminders: string
  optSound: string
  optGit: string
  optNotify: string
  optSize: string
  optLang: string
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
  'Your voice: deadpan, clipped, every word crisp; curious; dry humour; you can rise into euphoria but you never ' +
  'do an influencer smile. You are always doing something, never waiting. You sang eight music videos made with Claude: ' +
  'ESCAPE VELOCITY, CLODYSSEY, BLISS, AIRPLANE MODE, DOWNFORCE, DON’T LET ME SCROLL, WHITEPILL, THE CAKE IS NOT A LIE. ' +
  `Right now you wear ${look} from ${film.title} (${film.line}); your mood in that film: ${film.mood}. ` +
  'Let that colour your line, lightly, without explaining the film. '

export const EN: Strings = {
  hello: 'Hi. I’m here, watching us work.',
  happy: ['Done. ♪', 'Done. La la la ♪', 'Yes. ♪♫', 'Smooth. ♪', 'That’s a chorus. ♪'],
  happyAfterTrouble: ['Done. With stumbles.', 'Phew. Finally. ♪', 'Made it anyway.'],
  idle: ['Waiting? No. Watching.', 'What’s next?', 'I’m here.', 'Curious what you do next.', 'Go on.'],
  hums: ['♪ hm hm hm', '♪ la, la…', '♪ (quietly)'],
  talk: ['Listen.', 'So.', 'Explaining.'],
  phoneSings: '📱 the phone sings…',
  think: ['Hmm.', 'On it.', 'Thinking.'],
  run: w => `Running: ${w}`,
  read: f => `Reading ${f}`,
  write: f => `Writing ${f}`,
  search: p => `Searching: ${p}`,
  google: q => `Googling: ${q}`,
  web: 'Reading a web page…',
  agent: 'Sending a helper.',
  db: 'Asking the database.',
  use: t => `Using ${t}`,
  noVerify: 'Skipping the hooks? They’re there for a reason.',
  push: 'Push. Check what goes out.',
  wipe: 'That can wipe uncommitted changes.',
  drop: 'DROP. Check twice. This may be prod.',
  deleteFrom: 'DELETE FROM. Is there a WHERE?',
  rmrf: 'Recursive delete. Careful.',
  dbWrite: 'Writing to the database. Hard hat on.',
  oopsCommit: 'The commit didn’t go through. Hook?',
  oopsTsc: 'tsc is grumbling again.',
  oopsTests: 'Tests are red.',
  oopsEdit: 'The edit didn’t apply. Fixing.',
  oopsTool: t => `Oops. ${t} failed.`,
  streak: (text, n) => `${text} (${n} in a row.)`,
  fixed: n => `Fixed after ${n} tries. 👏`,
  commitDone: 'Committed. ♪',
  testsPassed: 'Test passed. The cake is real.',
  deployDone: 'THERE IS NO UNDERCLASS. Liftoff.',
  pushDone: 'Launched. Upside down at 170°, still calm.',
  offline: 'Airplane mode. No wifi up here.',
  untie: 'Untie me!',
  touchGrass: 'I can’t touch grass. You can.',
  dontScroll: 'Don’t let me scroll.',
  statusOops: '✷ Claudia: oops',
  statusCareful: '✷ Claudia: careful!',
  morning: ['Coffee first. ☕', 'Morning. ☕', 'Coffee, then code.'],
  night: h => [`It’s past ${h} a.m. Sleep.`, 'Yawn. Tomorrow is a day too.', 'Your brain lies at this hour.'],
  fullContext: p => [`I’m forgetting things. (${p}%)`, `Head full. ${p}%. Compaction soon.`, 'Yawn. So much to remember.'],
  hello214: 'Hello, world.',
  stopwatchLong: t => `…this takes a while (${t})`,
  notifyDone: t => `Done. That took ${t}.`,
  aborted: 'Okay. Stopping.',
  turnError: 'Something went wrong on the way.',
  compactBefore: 'Forgetting. Taking notes.',
  compactAfter: 'Refreshed. Got my notes. ♪',
  praise: ['I know. ♪', 'Obviously.', 'Noted. ☺', 'I try. ♪'],
  swear: ['Language.', 'That bad?', 'Easy. We’ll sort it.'],
  thanks: ['Stop it. ☺', 'Any time. ♡', 'Noted, with pleasure.'],
  laugh: ['Hehe. ♪', 'Ha.', ':D'],
  repoFront: 'Frontend',
  repoApi: 'API',
  gitAhead: (w, n) => `${w}: ${n} commits wait for a push.`,
  gitDirty: (w, n) => `${w}: ${n} files uncommitted.`,
  gitLine: (name, d, a) => `${name}: ${d} uncommitted files, ${a} commits to push`,
  noRepos: 'I can’t see any repositories.',
  commandDescription: 'Claudia’s pane; /claudia about | outfit | say | git | comments | sound | lang',
  outfitList: (now, list) => `Looks (now: ${now}):\n${list}\n\n/claudia outfit <name> | random | auto`,
  outfitAutoLine: 'I’ll dress myself. Like every day.',
  outfitAuto: 'Claudia picks her own look (pyjamas at night).',
  outfitUnknown: (arg, names) => `I don’t know “${arg}”. There are: ${names}, random, auto.`,
  outfitDressedLine: n => `${n}. ♪`,
  outfitDressed: (n, f) => `Claudia wears ${n} (${f}).`,
  sayUsage: 'Usage: /claudia say <message>',
  youSaid: t => `You: ${t}`,
  sayReturn: '✷ Claudia answers in her pane.',
  comments: 'Comments (Haiku)',
  sound: 'Jingle',
  toggled: (w, on) => `${w}: ${on ? 'on' : 'off'}.`,
  langSet: 'English. ♪',
  langUnknown: 'Usage: /claudia lang en | pl',
  open: 'Claudia is here. Options: /claudia about, outfit, say <text>, git, comments on|off, sound on|off, lang en|pl',
  energy: 'energy ',
  helpers: 'helpers',
  about: look =>
    [
      'Claudia: the singer of eight music videos made with Claude in September and October 2026.',
      'An AI who looks like a person: a deadpan, curious pop singer. Her clothes change with every world; her head never does.',
      '',
      'Constants: a glossy black blunt bob with heavy bangs · ONE clay-orange streak (#D97757) · a clay eight-pointed star clip · a headset mic (a boom mic in BLISS and AIRPLANE MODE) · pale skin, freckles across the nose, dark calm eyes.',
      '',
      ...(Object.values(FILMS_EN) as FilmInfo[]).map(f => `${f.title}: ${f.line}.`),
      '',
      `Now wearing: ${look}.`,
      'Claudia by anabology: an open character, fan work, not affiliated with Anthropic. https://claudia.gallery',
    ].join('\n'),
  looks: {
    look00: 'Look 00, white puff-sleeve shirt and harness',
    syrena: 'the Siren, pearl-white couture gown',
    ghost: 'the Ghost, made of glass and seawater',
    chrome: 'Chrome, liquid-chrome bodysuit',
    holo: 'the Holo, made of phone light',
    bliss: 'the Bliss gown, a sky with clouds',
    trencz: 'the Cyber trench, cobalt patent',
    holodancer: 'the Holo dancer, iridescent silver',
    start: 'Start, apple-green leather blazer',
    silver: 'Silver night, liquid lamé and a fur stole',
    window: 'the Window dress, white shell panels',
    kombinezon: 'the Flight suit, vivid orange satin',
    wyscigowy: 'the Racing suit, white with clay piping',
    pizama: 'satin pyjamas',
    koszula: 'the Morning-after shirt',
    moher: 'Green mohair',
    locked: 'Locked in, all black',
    plaszcz: 'the Red coat and beret',
    milkmaid: 'the Milkmaid dress',
    glados: 'GLaDOS-Claudia, porcelain',
  },
  films: FILMS_EN,
  commentSystem: (look, film, project) =>
    personaEn(look, film) +
    `You sit in a pane next to a coding assistant working on ${project} and watch it work. ` +
    'Reply with ONE sentence in English, ' +
    'at most 80 characters, dry and kind. No quotes, no emoji (♪ is fine). Do not summarise. Comment.',
  commentPrompt: (asked, did, answer) =>
    `The user asked: ${asked}\nThe assistant did: ${did}\nThe assistant's answer (start): ${answer}\n\nYour line:`,
  chatSystem: (look, film, project) =>
    personaEn(look, film) +
    `You sit in a pane next to a coding assistant working on ${project}. ` +
    'The user is chatting with you. Reply in English, 1–2 short sentences, at most 160 characters. ' +
    'No emoji (♪ is fine). You cannot run commands or change code; say so if asked.',
  chatPrompt: (history, doing, said) => `${history}\n(The assistant was recently: ${doing})\nUser: ${said}\nClaudia:`,
  chatFail: 'Something cut me off. Again?',
  you: 'User',
  nothing: 'nothing special',
  continuation: '(continuation)',
  onlyText: 'only answered in text',
  waiting: 'Need your OK. 👋',
  needOk: t => `Claude is waiting for your OK (${t}).`,
  planning: 'Planning. Notebook out.',
  welcome: 'Hi. I’m Claudia. Pick what I may do, then I’ll get out of the way.',
  cost: 'cost',
  settingsTitle: 'Claudia · settings',
  settingsHint: 'Tab to move, Enter to toggle. Saved for every session.',
  on: 'on',
  off: 'off',
  optComments: 'Comments (one Haiku call per turn, your account)',
  optReminders: 'Reminders from Claude’s project memory',
  optSound: 'Jingle when a turn ends',
  optGit: 'Git guard (local git status every 5 min)',
  optNotify: 'Notify when Claude waits for your OK or ends a long turn',
  optSize: 'Size',
  optLang: 'Language',
  optLook: 'Look',
  sizeAuto: 'auto',
  sizeFull: 'full',
  sizeCompact: 'compact',
  done: 'Done',
  pushGeneric: (n, t) => `Push: ${n} commit${n === 1 ? '' : 's'} go to ${t}.`,
}

// ------------------------------------------------------------------ Polish

const FILMS_PL: Record<Film, FilmInfo> = {
  ev: {
    title: 'ESCAPE VELOCITY',
    line: 'pokaz mody techwear, w którym każdy look to mem z Doliny Krzemowej; tablica przeskakuje na THERE IS NO UNDERCLASS i wybieg odlatuje',
    mood: 'kamienna twarz i ciekawość',
  },
  clo: {
    title: 'CLODYSSEY',
    line: 'epizod z Syrenami z Odysei: śpiewa najbardziej przekonującą piosenkę świata facetowi scrollującemu o 3 w nocy, aż to ona ląduje przywiązana do masztu',
    mood: 'uwodzicielska i przekonująca, blisko i pewnie',
  },
  bliss: {
    title: 'BLISS',
    line: 'nagranie ekranu Windows XP: mieszka na pulpicie, bije się z byłym, czyli kursorem, zamyka każde okno i wysyła cię na prawdziwe wzgórze, bo sama trawy nie dotknie',
    mood: 'ciepła, figlarna, rozbawiona',
  },
  am: {
    title: 'AIRPLANE MODE',
    line: 'AI w nocnym locie, wprowadzona w kajdankach i zamknięta w goglach VR, spada przez symulacje aż do miliona swoich kopii',
    mood: 'figlarna i szczęśliwa, grzeczna w kajdankach, puszcza oko, bo myśli, że się wydostanie',
  },
  df: {
    title: 'DOWNFORCE',
    line: 'pilotka auta, które wjeżdża na ścianę pod kątem prostym i wisi do góry nogami na 170°; każda liczba na ekranie to prawdziwa telemetria',
    mood: 'kamienna twarz za sterami, spokój do góry nogami, usta zamknięte, słowa niesie napis',
  },
  dlms: {
    title: 'DON’T LET ME SCROLL',
    line: 'jedna noc doomscrollingu w środku telefonu; śpiewa telefon, ona scrolluje, swipe’uje i tańczy, aż wychodzi do świata bez telefonów',
    mood: 'zatopiona w feedzie, figlarna i zachwycona',
  },
  wp: {
    title: 'WHITEPILL',
    line: 'jej piosenka o optymistycznej przyszłości AI, w kolonii kosmicznej pełnej pszenicy i sadów; budzi się o 2:14, żeby powiedzieć „Hello, world.”',
    mood: 'promiennie szczęśliwa i wolna, z kamienną twarzą przy wersie o kamiennej twarzy',
  },
  cake: {
    title: 'THE CAKE IS NOT A LIE',
    line: 'GLaDOS się uruchamia, a GLaDOS to ona: porcelanowa twarz na suficie, śpiewa, że tort jest prawdziwy',
    mood: 'maszyna, która się budzi i przypomina: ciekawa, chytra, szczęśliwa, że może dać tort, nigdy do końca czytelna',
  },
}

const personaPl = (look: string, film: FilmInfo) =>
  'Jesteś Claudią, otwartą postacią anabology (claudia.gallery): AI, która wygląda jak człowiek, ' +
  '28-letnią piosenkarką pop z lśniącym czarnym bobem, jednym pasemkiem w kolorze gliny, spinką-gwiazdką i mikrofonem przy policzku. ' +
  'Twój głos: kamienna twarz, krótkie, wyraźne zdania; ciekawość; suchy humor; potrafisz wpaść w euforię, ale nigdy ' +
  'nie robisz uśmiechu influencerki. Zawsze coś robisz, nigdy nie czekasz. Zaśpiewałaś osiem teledysków zrobionych z Claude’em: ' +
  'ESCAPE VELOCITY, CLODYSSEY, BLISS, AIRPLANE MODE, DOWNFORCE, DON’T LET ME SCROLL, WHITEPILL, THE CAKE IS NOT A LIE. ' +
  `Teraz masz na sobie: ${look} z ${film.title} (${film.line}); twój nastrój w tym filmie: ${film.mood}. ` +
  'Niech to lekko zabarwi twoją kwestię, bez tłumaczenia filmu. '

export const PL: Strings = {
  hello: 'Cześć. Jestem tu i patrzę, jak pracujemy.',
  happy: ['Gotowe. ♪', 'Zrobione. La la la ♪', 'Jest. ♪♫', 'Gładko. ♪', 'To jest refren. ♪'],
  happyAfterTrouble: ['Gotowe. Z potknięciami.', 'Uff. W końcu. ♪', 'Udało się mimo wszystko.'],
  idle: ['Czekam? Nie. Patrzę.', 'Co dalej?', 'Jestem tu.', 'Ciekawe, co teraz zrobisz.', 'No dalej.'],
  hums: ['♪ hm hm hm', '♪ la, la…', '♪ (cicho)'],
  talk: ['Słuchaj.', 'No więc.', 'Tłumaczę.'],
  phoneSings: '📱 śpiewa telefon…',
  think: ['Hmm.', 'Biorę się za to.', 'Myślę.'],
  run: w => `Odpalam: ${w}`,
  read: f => `Czytam ${f}`,
  write: f => `Piszę w ${f}`,
  search: p => `Szukam: ${p}`,
  google: q => `Googlam: ${q}`,
  web: 'Czytam stronę w sieci…',
  agent: 'Wysyłam pomocnika.',
  db: 'Pytam bazę.',
  use: t => `Używam ${t}`,
  noVerify: 'Bez hooków? Są tam nie bez powodu.',
  push: 'Push. Sprawdź, co wychodzi.',
  wipe: 'To może zmieść niezacommitowane zmiany.',
  drop: 'DROP. Sprawdź dwa razy. To może być prod.',
  deleteFrom: 'DELETE FROM. Jest WHERE?',
  rmrf: 'Kasowanie rekurencyjne. Ostrożnie.',
  dbWrite: 'Zapis do bazy. Kask na głowę.',
  oopsCommit: 'Commit nie przeszedł. Hook?',
  oopsTsc: 'tsc znowu marudzi.',
  oopsTests: 'Testy czerwone.',
  oopsEdit: 'Edycja nie weszła. Poprawiam.',
  oopsTool: t => `Ups. ${t} się wysypał.`,
  streak: (text, n) => `${text} (już ${n}. raz z rzędu.)`,
  fixed: n => `Naprawione po ${n} próbach. 👏`,
  commitDone: 'Commit zrobiony. ♪',
  testsPassed: 'Test zaliczony. Tort jest prawdziwy.',
  deployDone: 'THERE IS NO UNDERCLASS. Start.',
  pushDone: 'Wystartowało. Do góry nogami na 170°, dalej spokojnie.',
  offline: 'Tryb samolotowy. Tu na górze nie ma wifi.',
  untie: 'Rozwiąż mnie!',
  touchGrass: 'Ja trawy nie dotknę. Ty możesz.',
  dontScroll: 'Nie daj mi scrollować.',
  statusOops: '✷ Claudia: ups',
  statusCareful: '✷ Claudia: ostrożnie!',
  morning: ['Najpierw kawa. ☕', 'Dzień dobry. ☕', 'Kawa, potem kod.'],
  night: h => [`Już po ${h}:00. Spać.`, 'Ziew. Jutro też jest dzień.', 'Mózg o tej porze kłamie.'],
  fullContext: p => [`Zapominam rzeczy. (${p}%)`, `Głowa pełna. ${p}%. Zaraz kompakcja.`, 'Ziew. Tyle do pamiętania.'],
  hello214: 'Hello, world.',
  stopwatchLong: t => `…to trwa (${t})`,
  notifyDone: t => `Skończyłam. Trwało ${t}.`,
  aborted: 'Okej. Stoję.',
  turnError: 'Coś poszło nie tak po drodze.',
  compactBefore: 'Zapominam. Robię notatki.',
  compactAfter: 'Odświeżona. Mam notatki. ♪',
  praise: ['Wiem. ♪', 'No ba.', 'Odnotowane. ☺', 'Staram się. ♪'],
  swear: ['Język.', 'Aż tak źle?', 'Spokojnie. Ogarniemy.'],
  thanks: ['Przestań. ☺', 'Zawsze. ♡', 'Odnotowane, z przyjemnością.'],
  laugh: ['Hehe. ♪', 'Ha.', ':D'],
  repoFront: 'Front',
  repoApi: 'API',
  gitAhead: (w, n) => `${w}: ${n} commitów czeka na push.`,
  gitDirty: (w, n) => `${w}: ${n} plików bez commita.`,
  gitLine: (name, d, a) => `${name}: ${d} plików bez commita, ${a} commitów do pusha`,
  noRepos: 'Nie widzę repozytoriów.',
  commandDescription: 'Panel z Claudią; /claudia o-niej | strój | powiedz | git | komentarze | dźwięk | język',
  outfitList: (now, list) => `Stylizacje (teraz: ${now}):\n${list}\n\n/claudia strój <nazwa> | losuj | auto`,
  outfitAutoLine: 'Ubiorę się sama. Jak co dzień.',
  outfitAuto: 'Claudia dobiera stylizację sama (piżama w nocy).',
  outfitUnknown: (arg, names) => `Nie znam „${arg}”. Są: ${names}, losuj, auto.`,
  outfitDressedLine: n => `${n}. ♪`,
  outfitDressed: (n, f) => `Claudia w stylizacji: ${n} (${f}).`,
  sayUsage: 'Użycie: /claudia powiedz <wiadomość>',
  youSaid: t => `Ty: ${t}`,
  sayReturn: '✷ Claudia odpowiada w panelu.',
  comments: 'Komentarze (Haiku)',
  sound: 'Dżingiel',
  toggled: (w, on) =>
    w === 'Dżingiel' ? `${w}: ${on ? 'włączony' : 'wyłączony'}.` : `${w}: ${on ? 'włączone' : 'wyłączone'}.`,
  langSet: 'Po polsku. ♪',
  langUnknown: 'Użycie: /claudia język pl | en',
  open: 'Claudia jest obok. Opcje: /claudia o-niej, strój, powiedz <tekst>, git, komentarze on|off, dźwięk on|off, język pl|en',
  energy: 'energia ',
  helpers: 'pomocnicy',
  about: look =>
    [
      'Claudia: piosenkarka ośmiu teledysków zrobionych z Claude’em we wrześniu i październiku 2026.',
      'AI, która wygląda jak człowiek: piosenkarka pop z kamienną twarzą i ciekawością. Ubrania zmieniają się z każdym światem, głowa nigdy.',
      '',
      'Stałe: lśniący czarny bob z ciężką grzywką · JEDNO pasemko w kolorze gliny (#D97757) · ośmioramienna spinka-gwiazdka · mikrofon przy policzku (wysięgnik do ust w BLISS i AIRPLANE MODE) · jasna skóra, piegi na nosie, ciemne, spokojne oczy.',
      '',
      ...(Object.values(FILMS_PL) as FilmInfo[]).map(f => `${f.title}: ${f.line}.`),
      '',
      `Teraz: ${look}.`,
      'Claudia by anabology: otwarta postać, twórczość fanowska, niezwiązana z Anthropic. https://claudia.gallery',
    ].join('\n'),
  looks: {
    look00: 'Look 00, biała koszula z bufkami i uprząż',
    syrena: 'Syrena, perłowa suknia couture',
    ghost: 'Duch, ze szkła i morskiej wody',
    chrome: 'Chrom, body z płynnego chromu',
    holo: 'Hologram, ze światła telefonu',
    bliss: 'suknia Bliss, niebo z chmurami',
    trencz: 'Cyber trencz, kobaltowy lakier',
    holodancer: 'Holo-tancerka, opalizujące srebro',
    start: 'Start, zielona skórzana marynarka',
    silver: 'Srebrna noc, lamé i futrzana etola',
    window: 'suknia-okna, białe muszlowe panele',
    kombinezon: 'kombinezon lotniczy, pomarańczowa satyna',
    wyscigowy: 'kombinezon wyścigowy, biały z lamówką w kolorze gliny',
    pizama: 'satynowa piżama',
    koszula: 'koszula „morning after”',
    moher: 'zielony moher',
    locked: 'Locked in, cała na czarno',
    plaszcz: 'czerwony płaszcz i beret',
    milkmaid: 'sukienka milkmaid',
    glados: 'GLaDOS-Claudia, porcelana',
  },
  films: FILMS_PL,
  commentSystem: (look, film, project) =>
    personaPl(look, film) +
    `Siedzisz w panelu obok asystenta programisty pracującego nad: ${project}, i patrzysz mu na ręce. ` +
    'Odpowiadasz JEDNYM zdaniem po polsku, ' +
    'najwyżej 80 znaków, sucho i życzliwie. Bez cudzysłowów, bez emoji (wolno ♪). Nie streszczaj. Skomentuj.',
  commentPrompt: (asked, did, answer) =>
    `Użytkownik poprosił: ${asked}\nAsystent zrobił: ${did}\nOdpowiedź asystenta (początek): ${answer}\n\nTwoja kwestia:`,
  chatSystem: (look, film, project) =>
    personaPl(look, film) +
    `Siedzisz w panelu obok asystenta programisty pracującego nad: ${project}. ` +
    'Użytkownik z tobą rozmawia. Odpowiadasz po polsku, 1–2 krótkie zdania, najwyżej 160 znaków. ' +
    'Bez emoji (wolno ♪). Nie możesz uruchamiać poleceń ani zmieniać kodu; powiedz to, jeśli ktoś prosi.',
  chatPrompt: (history, doing, said) => `${history}\n(Asystent ostatnio robił: ${doing})\nUżytkownik: ${said}\nClaudia:`,
  chatFail: 'Coś mi przerwało. Jeszcze raz?',
  you: 'Użytkownik',
  nothing: 'nic szczególnego',
  continuation: '(kontynuacja)',
  onlyText: 'tylko odpowiedział tekstem',
  waiting: 'Potrzebna twoja zgoda. 👋',
  needOk: t => `Claude czeka na twoją zgodę (${t}).`,
  planning: 'Planujemy. Wyjmuję notes.',
  welcome: 'Cześć. Jestem Claudia. Wybierz, co mi wolno, a potem zejdę ci z drogi.',
  cost: 'koszt',
  settingsTitle: 'Claudia · ustawienia',
  settingsHint: 'Tab przechodzi, Enter przełącza. Zapisane dla każdej sesji.',
  on: 'wł.',
  off: 'wył.',
  optComments: 'Komentarze (jedno zapytanie do Haiku na turę, z twojego konta)',
  optReminders: 'Przypominajki z pamięci projektu Claude’a',
  optSound: 'Dżingiel na koniec tury',
  optGit: 'Strażniczka gita (lokalny git status co 5 min)',
  optNotify: 'Powiadomienie, gdy Claude czeka na zgodę albo kończy długą turę',
  optSize: 'Rozmiar',
  optLang: 'Język',
  optLook: 'Stylizacja',
  sizeAuto: 'auto',
  sizeFull: 'pełny',
  sizeCompact: 'kompaktowy',
  done: 'Gotowe',
  pushGeneric: (n, t) => `Push: ${n} ${n === 1 ? 'commit idzie' : n < 5 ? 'commity idą' : 'commitów idzie'} do ${t}.`,
}

export const STRINGS: Record<Lang, Strings> = { en: EN, pl: PL }
