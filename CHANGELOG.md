# Changelog

## 0.4.0

- Her open mouth drawn anew (talking, singing, yawning): her teeth, the dark of her mouth and her lower lip, in place of a ring of lip round a dark middle. A new screenshot of her pane; the social image names the fan work's author.
- The code in smaller files: reading a shell line (`hooks/shell.ts`) and drawing her (`hooks/draw.ts`) are modules of their own, pure functions out of `hooks/register.tsx`; nothing she does changed.
- The marketplace has a description; the README says where to report a problem and what to put in the report, and which surroundings she was tried in.
- `assets/demo.gif` drawn anew from her layers (`python claudia_sheets.py`): her moods, what she holds, and the line she says.
- README written anew: a table of contents, her three places in one table, commands in groups, what she reads, sends and costs (with a rough measure of her CPU time by display mode), and pictures of her moods, props and looks drawn by `claudia_sheets.py` from the mod's own layers.
- Narration asks Haiku for one step at a time: a quick run of steps asked for each of them, and the answers came after their steps were gone. A step that comes while a call is out keeps her stock line.
- Her pane takes all its state in one go: a drawing asked the engine some forty things one after another, and a busy moment in between could push it past the engine's ten seconds (`ui.render hook skipped: ran past its 10s budget`); five are left. A pane on its way out to the band no longer counts as her showing.
- More of her words fitted: thanks, praise and a laugh are short messages to her, not words inside a task (`build an awesome thank-you page`); a session opened beside one at work is `A second window!`, not `Back already?`; a conversation picked up again gets `Welcome back to this one. Where were we?`; a `DELETE` with its `WHERE` is not asked about one; a deploy is `Live! Now we watch the logs.` (she never watched them); her Haiku comment is told when a turn stopped at a failure.
- Her words fitted to what happened (every pool checked against the moment the code says it):
  - **The end of a turn.** A turn whose last step failed is not sung about: `I stopped at a red light. Have a look?`, no dance, no jingle, and the word stays up a minute. `Phew, finally. That one fought back.` and `tripped a few times` are kept for a real fight (three stumbles, or two and a recovery); one or two get `Done, with a stumble on the way. Still counts!`. A turn that only answered, or ended with a caution, no longer `went in clean`.
  - **What counts as a stumble.** A grep with no match, a `diff`, a `test -f` are answers, not errors. An edit turned away before it began (file not read yet, text not found) gets her word but starts no streak.
  - **Fixed, red to green.** `Fixed after 3 tries` is said when the thing that failed works again (the same file, program or the tests), on the try it really took; before, any success after two failures, a `Read` included, was “fixed”. `Red to green` needs tests that were red: a linter failing before them is not that.
  - **Results she misread.** Test failures printed by a run that still ended well (`| tee`, `|| true`) are failures; a run that only lists tests is not a cake. `git push` with nothing to push is `Nothing new to push`, not `Pushed!`, and is not counted; nor is a commit with nothing to commit. A rejected push says so. A page that would not open is not `Airplane mode` unless the network is down. A script's own `TypeError` is not `tsc`; “the build failed” is said of builds and checks only; a formatter is `Formatted`, not a clean lint.
  - **Helpers and hours.** A helper that was stopped or failed is not `back with answers`. Her morning word and her midnight one are said once a day, not after every turn of that hour; `touch grass` keeps to the day and out of focus mode; 2:14 a.m. does not talk over a running turn; she does not fall asleep while helpers work. Dec 31 is not yet `Happy New Year`. A TODO she spots is one the edit adds. No more `committing.. Git and I…`.

- A review of everything around the code:
  - **The keys for the settings and the wardrobe.** `/claudia settings` and `/claudia wardrobe` on a pane already up got no keyboard: the pane is now opened anew with it, Tab then moves through its buttons (nothing is under the first Enter, so no paid feature is turned on by a slip); in the wardrobe the focus starts on ▶.
  - **A failure hidden behind its exit code.** `npm test; echo EXIT=$?` always ends well for the shell; she reads the printed code and stumbles as on any error.
  - **A short command after your OK** is her work again: the engine says how long the tool itself ran, and that much is taken back out of the wait.
  - **Her words:** a helper back says its kind in brackets (`A helper is back (Explore).`); a locked look is named by its short name; `(3 in a row)` without the stray full stop.
  - **A new person's first minutes**, gone through on a clean install (from the marketplace folder, with a store of its own): a bare `/claudia` no longer closes the first-run settings but gives them the keyboard; the settings say how to get the keys while they have none, and have Done at the top as well (the list is longer than most panes); any command of hers ends the first run, so it does not come back every session; a command she does not know says so before the list; the list of looks lines up.
  - **A narrow window:** `/claudia` from the band opened an empty frame above the prompt (the mark she leaves when she moves to the band was never drawn over); the pane is drawn anew whenever it is asked for.
  - **Status-line mode without the warning sign:** on the terminal her word now ends the hint line under the prompt, in its dim colour (`? for shortcuts · ✷ Done and dusted. ♪`), not the plugin's pinned notice, which the terminal draws yellow with a `⚠`. The notice stays for what it suits: an oops, a wait for your OK, a caution. The turn's stopwatch leaves the line when the turn ends.
  - **Lighter.** Her dance ends by itself after twelve seconds (a comment held on screen kept the pane redrawing until your next message); an edit's line counts are saved with the turn, not before each tool's result; git is looked at after a turn that edited a file or ran a command, not after every turn; the heartbeat of a session that died is cleared after an hour, not read for a week; a line hidden in one session stays hidden when another changes its own.
  - **Safer.** Three patterns that read a command could take seconds, then minutes, on a line built to make them (`py -m` many times over, a row of `--flags` after `terraform`, `git -C ""` repeated, a heredoc of blank lines): each word now reads one way, and she reads no more than the first 8000 characters of any command. Escape sequences and direction marks are taken out of every name she shows (a file, a tool, a folder, another session), so none reaches a toast, the status line or a system notification. A script named `constructor` no longer trips her; `local.json` is checked before use; `git status` runs with `core.fsmonitor` off.
  - **README:** her real lines in the examples, *She is not a safety net*, every line under her, how to make her quieter, hide her or remove her, and where the Haiku requests go.

- `energy` is now `context`, and reads like the limits under it: how full the context window is (`context ▰▰▰▰▱▱▱▱▱▱ 37% · $4.20`), green to amber to red as it fills. `/claudia hide context`; a line hidden as `energy` stays hidden.
- Her clocks, gone through one by one (eight new tests with a clock of their own, and a live session):
  - **Waiting for you is not her work.** The time a turn waits for your OK, for an answer to a question or for a plan's approval is taken out of `I worked` and of today's minutes; the stopwatch in her bubble counts from the OK, not from the request.
  - **The computer asleep in the middle of a turn** adds nothing: a silence of a minute or more between two ticks is taken out of the turn's clock, its stopwatch and its work (before, a lid closed on a running turn could read as hours of work).
  - **Helpers sent to the background** work on after the turn: that time counts as work, without overlap with a turn, and ends two minutes after one was last seen if it never reports back.
  - **Closing the session in the middle of a turn** keeps the work done so far and the open minute (before, that turn's time was lost); should the turn's end still arrive, nothing is counted twice.
  - Checked and left as they were: idle hours count as open time and never as work; a gap of more than three minutes (sleep, a closed session) adds nothing to the open time; a resumed conversation counts on; `/clear` starts a clock of its own.
- The lines under her, checked one by one (every width from 8 to 70 columns, numbers that are not numbers, a live session with all eleven at once):
  - **A short window keeps her words and her lines.** Her figure needs room for them below it; with less she is drawn as her head, with less still as her words alone (before, a 22-row window showed her picture and nothing under it).
  - Every line there is room for is shown, the most important first: twelve at most instead of eight, so the git and day lines no longer give way in a tall pane.
  - A turn that is over always says `last:`; when the long form does not fit, the short one does (`last: ⏱ 0:07 · ✎ 2 +6 −0 · 🔧 4`) instead of looking like a turn still running.
  - The git line is fresh at the end of every turn that did something, not at the next five-minute look.
  - A limit window whose reset has passed is not shown until a new reading comes; a count that is missing or not a number reads as zero, never `NaN`; a task or a goal with line breaks stays on one line; never more sessions waiting than there are, and a waiting session named once.
  - A helper sent to the background keeps its kind (Explore, Plan, a reviewer): its little Claudia no longer falls back to the plain one.
  - The permission mode line also follows a mode changed with shift+tab at the next request for an OK, not only at the next message.
  - The room her words take is counted as the pane wraps them, at words.
- A broad review with five readers, a storm of events in the test kit and live sessions under load. What it changed:
  - **A tool, a helper's start, a message and a turn's end run exactly once.** Her hooks no longer fall back to running the step again when something of hers fails after it; everything she does around a step fails quietly on its own. A push is no longer held back while she counts its commits.
  - **The guard reads what runs, not what is said.** Quoted text and heredoc bodies are set aside, so a commit message or a `grep` for `DROP TABLE`, `rm -rf` or `jest` raises nothing and bakes no cake; a script handed to a shell (`bash -c "…"`, `ssh host "…"`) is still read. `git -C <repo> push --force`, `git -c k=v commit` and `git --no-pager …` are seen for what they are (and named `git push`, not `git <folder>`). SQL warnings only where SQL goes to a database (`psql -c`, a heredoc with psycopg, `echo … | psql`, a database tool). New: a warning for `curl … | sh`. A dry run (`git push --dry-run`, `npm publish --dry-run`, `kubectl apply --dry-run`) is neither warned about nor celebrated; `--force-with-lease` gets the plain push line.
  - **No pattern can hang on a long command** (a line of many flags took exponential time in one); commands are read up to 8000 characters.
  - **`/clear`, resume and fork:** the window goes on with another conversation; she reads her settings again and starts that conversation's own clock (before, her settings fell back to defaults and the session line vanished until a restart).
  - **A wave that outlived its OK** (the request for it arriving late on a busy machine) no longer stays for the whole command and no longer hides the stopwatch.
  - **A tool you turn down yourself** is your choice: no oops, no "we tripped a few times".
  - **Counts:** a helper's errors do not feed her error streak or oops count; a streak ends with the turn; a turn she saw only the end of is not credited twice, and a session that died mid-turn leaves no hours behind; a reload of the plugin is not a new hello; what a failed save could not write waits for the next save; the day rolls over at midnight in an open session; stored numbers that are not numbers are ignored.
  - **Layout:** the settings opened from the narrow window's band no longer show her twice; a dock that was refused is tried again later instead of at every column; a widget placement is drawn like a dock.
  - **Words:** `:D` inside `id:Description`, `!!` and `??` no longer read as a laugh or as frustration; `feedback` is not a database tool; `Contest.java` is not a test; a file's last new line is not one more line added; "the build failed" only for a build.
  - **Haiku:** a call gives up after 25 s; a late comment or idle thought never lands over a newer word; `OK`, `Okay.`, `None` and `Nothing missing` all mean nothing is missing.
  - Tests: 119 (a seeded storm of 160 events with a store that fails one write in five; long hostile command lines; the guard's true and false alarms), each with room for a loaded machine.
- 🕐 counts the time a session has been open, not the clock since its first launch: a minute is added each minute, a longer gap (the computer asleep or off, the session closed) adds nothing; kept by the first launch, so a resumed session counts on. A session from before starts from its work time.
- Helpers: more than a row holds go on in a second and third row under her (a 34-column pane held two with a prop, the rest were left out); Plan's notebook has a spiral and a label, Review's clipboard an amber board, a clip and lines of text; the narrow window's band says who works (`👥 helpers: Explore ×2 · Plan`). The outline is near-black, so no grey squares round light things on a dark terminal.
- The band's Claudia (a narrow window) is the helpers' chibi, 8 x 10 in 5 rows, in the colour of her look and with a face for each mood (rest, talk, think, happy, oops, nervous, sleep, wave); porcelain for GLaDOS, ghost and holo tinted. A dressed look's line starts with a capital.
- A chain of commands is split as a shell would: never inside quotes (`python -c "import x; print(x)"` is one step) nor inside a heredoc's body (a script fed to `python - <<'EOF'` is not a list of commands). No more `then running print('winpty`.
- A light terminal: a dark rim where something light of hers (a white dress, a pale arm, a sparkle) meets the background, lost on a dark terminal, her outline on a light one; thought bubbles, the hum's note and the wave's strokes in a mid blue-grey, the happy sparkles in amber, so they read on both. The band's little Claudia too. A locked look's message starts with a capital. The Siren gown's shoulders are smooth: no ruffle bumps with a gap at the collar, no ruffle specks outside her.
- `/claudia` (and `/claudia help`) lists every command, grouped; after your OK her bubble turns from the wave to what she does within two seconds; the band's little Claudia wears the colour of her look; the context and limit bars read on a light terminal too (a darker green, amber, red); `/claudia doctor` counts the tokens her Haiku calls took this session. Measured idle in a live session: her own work is two renders in half a minute.
- Three sounds with a meaning: the jingle when a turn of 20 s or more is done (none for a short turn you watched, none for one you stopped); two rising tones when she needs you (an OK to give, a question left at the end of an answer); one low tone when something went wrong (a turn ended in an error, three errors in a row). Each waits 15 s before it plays again; none in focus or calm mode. The two new ones are made by `claudia_sounds.py`.
- From a live run in a real terminal: any other `/claudia` command brings her back from the settings or the wardrobe (their Done needs the pane's focus); `display band` and `display status` close the pane instead of showing her twice; after an OK the other sessions see this one working again, not still waiting; what she holds is put down while she waves or facepalms; a failed `tsc` that is not a type error gets neutral words; the overlay's project and repos apply only in the folders where those repos are (its words still everywhere); 2 November reads "Days of remembrance".
- A narrow window: below the dock's width (144 columns for a pane nobody asked for, 110 once you opened her yourself), where Claude Code seats the pane under the chat (and its figure held the window from narrowing), she moves to the band above the prompt and back beside the chat when the window widens. A pane you open yourself there (`/claudia`, settings, wardrobe) stays; your saved display choice is never changed.
- Her hands redrawn: a wave is a forearm raised from the shoulder with the hand beside her cheek; a facepalm has fingers up into the bangs, the forearm dropping from her face and the upper arm coming down from her shoulder to an elbow tucked low. Both arms wear the sleeve of the look (bare for sleeveless ones) and sit over sunglasses and earrings.
- Haiku is heard more: her comment on an answer stays until your next message (and is no longer lost when she waves); with comments on, the moments of a turn (red turned green, a fix after errors, a commit, a push, a deploy, three errors in a row) get her own word over the stock line, at most three a turn; opt-in idle thoughts (`/claudia thoughts on`); `/claudia doctor` counts her Haiku calls (answered, shown, too late) and shows the last failure.
- The local overlay is found in `~/.claude/claudia/` also when the plugin runs from a folder of its own (a dev copy); a folder with no manifest reads as TypeScript or Python from its files.
- The stack by folder (with Python manifests: FastAPI, PostgreSQL, GIS, Stripe…), package scripts read through, more lines per technology, words for builds and checks that pass or fail in each world, small tips for the stack, and the stack and the turn's files in Haiku's context.
- Opt-in narration (`/claudia narration on`): Haiku turns Claude's note on each step, in any language, into her own short English line; repeated notes cost nothing twice.
- She is Claude with a face: she speaks of the work in the first person and always in English (no quotes of Claude's own text); a chain of commands reads `Checking the types, then running the tests.`; the cake comes once a turn (or when red turns green), with short varied words after; commits, pushes, deploys and fixes have several lines each.
- Your stack: file kinds for some forty languages and formats, what commands are for across ecosystems (npm, uv, cargo, go, gradle, dotnet, composer, bundler, flutter, docker, terraform and more), test runners, deploys, publishes and migrations everywhere, more risky commands, compile, lint, dependency, port and memory errors, and the project's stack.
- Other sessions: heartbeats in the local store; `⧉ 3 other sessions · 1 waiting for OK` under her, a toast when one waits.
- Focus mode (`/claudia quiet`), calm mode (reduced motion), and where she shows: pane, band above the prompt, or status line (`/claudia display`).
- `/claudia demo`, `/claudia doctor`, `/claudia goal`, `/claudia wardrobe`, `/claudia card` (an SVG card of the day).
- Six looks earned with badges; frustration and stuck streaks get a gentle word; `/claudia react` for other plugins.
- While Claude works, her bubble says what for: the last sentence Claude wrote before the tool, its short description of the command, or plain words (`Searching the code`, `Checking git`); the program moves to the turn line (`▶ python`).
- English only: the Polish language, `/claudia lang` and the Polish command names are gone; outfits have English names (`siren`, `trench`, `flightsuit`, `racing`, `pyjamas`, `shirt`, `mohair`, `coat`). A local overlay can add words of its own she reacts to (`words` in local.json).
- Helpers dressed by agent type (Explore, Plan, a reviewer, any other), 8×10 pixels; each says what it did when it comes back. Background helpers stay past the end of a turn.
- Memory of the two of you: first meeting, streaks, a long absence, milestones; no line repeated while it is fresh, and no repeated Haiku comment.
- Her calendar: Monday, Friday afternoon, weekend, late night; Halloween, All Saints' Day (a candle), Christmas (a Santa hat), New Year.
- Opinions and running jokes: force push, TODOs, red-to-green tests, the cake.
- Lines for programs (git, npm/bun, python, psql, docker, curl, tsc) and file types; error kinds (types, tests, network, permissions, not found, merge conflict, timeout, syntax); big changes and deletions.
- `/claudia today` and a once-a-day summary after 5 p.m.; badges with `/claudia badges`; an opt-in break reminder.
- The git line shortens the repository name, never the counts.
- Lines under her: Claude's task list, this turn, plan limits, background tasks, the permission mode, today; ordered by importance, as many as the pane holds (twelve at most now), each can be hidden.
- Screens of every size: a big size (every pixel doubled) in a wide, tall pane; an opt-in "wider pixels" setting for fonts with tall cells; symbols a terminal may widen count as two cells, so no line wraps; in the desktop app and editors she scales to the pane.
- She reads Claude's answer (locally): a question left for you makes her wave; “not tested”, “could not verify”, “skipped” make her say a heads-up (she does not quote the sentence).
- Opt-in “reading the exchange”: Haiku checks that everything you asked for was done, and comments get the fuller exchange.
- Several sessions share her memory safely: a save adds its own changes to what is stored.
- Reactions only to what the person typed, never to a task notification.

## 0.3.0 (first release candidate)

- Settings in the pane, with first-run onboarding; settings kept across sessions.
- Comments and reminders are opt-in; nothing leaves your machine unless you turn it on.
- Waves when Claude waits for your permission, with a system notification after 15 s.
- Plan mode: notebook and glasses. Session cost next to the context bar (then called energy).
- Compact size for narrow terminals; SVG drawing in the desktop app, VS Code and mobile.
- Animations pause while the pane is hidden; silent in non-interactive sessions.
- Jingle on Windows, macOS and Linux.
- Git guard finds your repositories by itself; the push warning says how many commits go where.
- Local overlay (`local.json`) for your own project context and guard lines.

## 0.2.0

- 20 looks from the canon, with per-film mics, sunglasses, beret, porcelain and glass.
- Film moments: the cake is real, liftoff, untie me, airplane mode, touch grass, 2:14.
- English by default, Polish with `/claudia lang pl`.

## 0.1.0

- Pixel-art Claudia in a pane: thinking, talking, oops, happy, sleeping.
