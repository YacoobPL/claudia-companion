# Claudia for Claude Code

A pixel-art companion that sits in a pane beside your Claude Code chat and reacts to what Claude does: she thinks while tools run, talks while Claude writes, waves when Claude needs your OK, facepalms on errors, and sings when the work is done.

![Claudia reacting in her pane](assets/demo.gif)

Claudia is the **open character by [anabology](https://claudia.gallery)**, the singer of eight music videos made with Claude. This plugin is fan work: it is not made by, affiliated with or endorsed by Anthropic or by anabology. The character is used under her open terms ([claudia.gallery/use](https://claudia.gallery/use)).

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install claudia-companion --marketplace YacoobPL/claudia-companion
```

Answer `y` to add the marketplace, then pick a scope (user scope loads her in every session). From a shell:

```
claude plugin install claudia-companion --marketplace YacoobPL/claudia-companion
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `YacoobPL/claudia-companion`, then **Add plugin**.

Then type `/claudia`. On the first run she opens her settings so you choose what she may do.

## What she does

| When Claude… | Claudia… |
|---|---|
| starts thinking, runs a tool | looks up, says what runs (`Reading register.tsx`), holds a prop: glasses for reading, a magnifier for search, a pencil for edits, a hard hat for databases, a globe for the web |
| writes its answer | moves her lips (or keeps them shut, or lets the phone sing, depending on her look) |
| waits for your permission | looks at you and waves: **Need your OK** (and, after 15 s, a system notification) |
| hits an error | facepalms: `tsc is grumbling again.` (and counts streaks) |
| fixes it | claps: `Fixed after 3 tries.` |
| finishes | sings and dances, plays a short jingle |
| runs a risky command | gets nervous: `git push`, `--no-verify`, `reset --hard`, `DROP`, `DELETE FROM`, `rm -rf` (she only warns, never blocks) |
| spawns subagents | little Claudias appear beside her, one per helper |
| works in plan mode | takes out a notebook |
| fills the context | an energy bar drains; she yawns past 80 % and takes notes during compaction |

She is never just waiting: she blinks, glances around and hums. In the morning she has coffee, at midnight she says *Don't let me scroll*, at 2:14 a.m. she whispers *Hello, world.*

### Her looks

20 looks from her eight films, each drawn from the canon: Look 00, the Siren, the Ghost (glass and seawater), Chrome, the Holo (phone light, with scan lines), the Bliss gown, the Cyber trench, the Holo dancer, Start, Silver night, the Window dress, the Flight suit, the Racing suit, satin pyjamas, the Morning-after shirt, Green mohair, Locked in, the Red coat and beret, the Milkmaid dress and porcelain GLaDOS-Claudia. Her head never changes: the black bob, **one** clay streak, the star clip, the mic.

She picks a look a day herself (pyjamas at night), or you choose: `/claudia outfit glados`.

## Commands

| | |
|---|---|
| `/claudia` | open the pane |
| `/claudia settings` | toggles, size, language, look |
| `/claudia about` | who she is, her films, the credit |
| `/claudia outfit [name \| random \| auto]` | list or change her look |
| `/claudia say <message>` | chat with her in the pane (uses Haiku) |
| `/claudia git` | uncommitted files and unpushed commits in your repos |
| `/claudia comments on\|off`, `sound`, `reminders`, `notify` | quick toggles |
| `/claudia lang en\|pl` | English (default) or Polish |

## What she reads and what she sends

Everything that costs money or leaves your machine is **off** until you turn it on.

| Feature | Default | What it does |
|---|---|---|
| Comments | **off** | After each turn, one Haiku request with the start of your prompt, the list of tools Claude used and the start of its answer. Uses your Claude account. |
| `/claudia say` | on demand | One Haiku request per message, with your message and the last few exchanges. |
| Reminders | **off** | Reads Claude's project memory index (`~/.claude/projects/<project>/memory/MEMORY.md`) and shows unfinished items. Local only. |
| Git guard | on | Runs `git --no-optional-locks status` and `rev-list` in your repos every 5 minutes. Local only, takes no locks. |
| Jingle | on | Plays a 0.7 s WAV: PowerShell on Windows, `afplay` on macOS, `paplay`/`aplay` on Linux. |
| Notifications | on | System notifications when Claude waits for your OK or ends a turn longer than 2 minutes. |

She reads your prompts locally only to react to “thanks” or “haha”. Nothing else is stored or sent, and there is no telemetry. In `claude -p` and other non-interactive sessions she does nothing at all.

## Where she shows up

- **Terminal, full screen, 110+ columns:** a docked pane beside the chat.
- **Narrower terminals:** an inline block above the prompt, in a compact head-and-shoulders size (choose `full`, `compact` or `auto` in settings).
- **Claude desktop app, VS Code, mobile:** the same pixels as SVG.
- Her pixels need a truecolor terminal (Windows Terminal, iTerm2, kitty, Ghostty, WezTerm, most modern Linux terminals).

## Local overlay

A `local.json` in `~/.claude/claudia/` (or in the plugin folder while developing; ignored by git) can add your own project context: a project description for her persona, the repositories the git guard watches, your own defaults and your own guard lines (per language). See `local.example.json`.

## Notes

- Mods for Claude Code use an **early-access API** that may change between Claude Code releases.
- Built and tested on Claude Code 2.1.316.

## Credits

Claudia by **anabology**, an open character: [claudia.gallery](https://claudia.gallery). Her look, her films and her canon are theirs; any mistakes in the pixels are ours.

Code under the MIT license (see `LICENSE`). The character is not covered by that license: see `NOTICE`.
