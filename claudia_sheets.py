"""The README's illustrations, drawn from the same layers as the mod (claudia_art.py).

    python claudia_sheets.py          # writes assets/looks.png, moods.png, props.png, social.png and demo.gif

A slate background of their own, so her black bob shows on a dark page as well as on a light one.
"""
from PIL import Image, ImageDraw, ImageFont

import claudia_art as art

SCALE = 5
GAP = 3  # art pixels between two figures
CAPTION = 22  # screen pixels under a figure
GREY = (190, 196, 208)
SLATE = (58, 60, 76)
PAD = 4 * SCALE  # around the sheet

LOOKS = {
    "look00": "Look 00", "siren": "the Siren", "chrome": "Chrome", "bliss": "the Bliss gown", "trench": "the Cyber trench",
    "holodancer": "the Holo dancer", "start": "Start", "silver": "Silver night", "window": "the Window dress",
    "flightsuit": "the Flight suit", "racing": "the Racing suit", "pyjamas": "satin pyjamas", "shirt": "Morning-after shirt",
    "mohair": "Green mohair", "locked": "Locked in", "coat": "the Red coat", "milkmaid": "the Milkmaid dress",
    "glados": "GLaDOS-Claudia",
}
MOODS = {
    "think": "thinking", "talk": "talking", "happy": "done!", "wave": "needs your OK", "oops": "an error", "nervous": "a risky command",
    "blush": "thanked", "hum": "humming", "yawn": "a long wait", "sleep": "asleep",
}
PROPS = {
    "glasses": "reading", "magnifier": "searching", "pencil": "editing", "hardhat": "databases", "globe": "the web",
    "notebook": "plan mode", "coffee": "morning", "cake": "green tests",
}


def font():
    for name in ("consola.ttf", "DejaVuSansMono.ttf", "Menlo.ttc"):
        try:
            return ImageFont.truetype(name, 14)
        except OSError:
            pass
    return ImageFont.load_default()


def sheet(path, shots, cols):
    """shots: (caption, body, mic, face, accessories, prop)."""
    cw, ch = (art.W + GAP) * SCALE, art.H * SCALE + CAPTION + GAP * SCALE
    rows = (len(shots) + cols - 1) // cols
    img = Image.new("RGB", (cols * cw - GAP * SCALE + 2 * PAD, rows * ch - GAP * SCALE + 2 * PAD), SLATE)
    draw, f = ImageDraw.Draw(img), font()
    for i, (caption, body, mic, face, acc, prop) in enumerate(shots):
        g = art.compose(body, mic, face, acc, prop)
        ox, oy = PAD + (i % cols) * cw, PAD + (i // cols) * ch
        for y in range(art.H):
            for x in range(art.W):
                c = art.PAL.get(g[y][x])
                if c is None:
                    continue
                if body == "glados":  # the porcelain face, as the mod maps it
                    c = art.PAL.get({"S": "I", "s": "i", "e": "1", "W": "2"}.get(g[y][x], g[y][x]), c)
                rgb = ((c >> 16) & 255, (c >> 8) & 255, c & 255)
                draw.rectangle([ox + x * SCALE, oy + y * SCALE, ox + (x + 1) * SCALE - 1, oy + (y + 1) * SCALE - 1], fill=rgb)
        w = draw.textlength(caption, font=f)
        draw.text((ox + (art.W * SCALE - w) / 2, oy + art.H * SCALE + 4), caption, fill=GREY, font=f)
    img.save(path)
    print(path, img.size)


def social(path):
    """The repository's social preview (1280x640): set by hand in the repository's settings on GitHub."""
    img = Image.new("RGB", (1280, 640), (58, 60, 76))
    draw = ImageDraw.Draw(img)
    scale, shots = 7, [("flightsuit", "boom", "happy", ()), ("look00", "headset", "wave", ()), ("coat", "headset", "think", ("beret",)), ("bliss", "boom", "blush", ("shield",)), ("mohair", "headset", "hum", ())]
    step = (1280 - len(shots) * art.W * scale) // (len(shots) + 1)
    for i, (body, mic, face, acc) in enumerate(shots):
        g = art.compose(body, mic, face, acc, None)
        ox, oy = step + i * (art.W * scale + step), 640 - art.H * scale
        for y in range(art.H):
            for x in range(art.W):
                c = art.PAL.get(g[y][x])
                if c is not None:
                    draw.rectangle([ox + x * scale, oy + y * scale, ox + (x + 1) * scale - 1, oy + (y + 1) * scale - 1], fill=((c >> 16) & 255, (c >> 8) & 255, c & 255))
    try:
        big, small = ImageFont.truetype("consolab.ttf", 72), ImageFont.truetype("consola.ttf", 30)
    except OSError:
        big = small = ImageFont.load_default()
    draw.text((640, 110), "Claudia for Claude Code", fill=(217, 119, 87), font=big, anchor="mm")
    draw.text((640, 190), "a pixel-art companion beside your chat", fill=(237, 236, 231), font=small, anchor="mm")
    draw.text((640, 240), "open character by anabology · fan work", fill=(170, 176, 190), font=small, anchor="mm")
    img.save(path)
    print(path, img.size)


# What she holds, her face and her real line, moment by moment; milliseconds on screen.
DEMO = [
    (None, None, "Hi, I’m Claudia! I’ll keep you company while we work. Tell me what we’re building today.", 2200),
    ("blink", None, None, 160),
    ("think", None, "Hmm, let me think about this.", 1300),
    ("think", "glasses", "Reading register.tsx", 1200),
    ("think", "magnifier", "Searching the code", 1200),
    ("think", "pencil", "Writing draw.ts", 1200),
    ("nervous", None, "Pushing! Have a quick look at what goes out first, okay?", 2000),
    ("wave", None, "I need your OK for this one! 👋", 1800),
    ("think", None, "Running the tests. Fingers crossed!", 1400),
    ("oops", None, "Tests went red. Don’t worry, red just means “not yet”.", 2000),
    ("think", "pencil", "Writing draw.ts", 1100),
    ("talk", None, None, 220), (None, None, None, 220), ("talk", None, None, 220), (None, None, None, 220),
    ("happy", "cake", "Done and dusted. ♪♫", 1600),
    ("hum", "cake", None, 500), ("happy", "cake", None, 500), ("hum", "cake", None, 500),
    ("sleep", None, None, 1600),
]


def demo(path):
    """The animation at the top of the README: one session in a dozen moments."""
    scale, width, text_top = 8, 440, art.H * 8 + 14
    height = text_top + 3 * 22 + 12

    def load(names, size):
        for name in names:
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                pass
        return None

    mono = load(("consola.ttf", "DejaVuSansMono.ttf", "Menlo.ttc"), 17) or ImageFont.load_default()
    symbols = load(("seguisym.ttf", "DejaVuSans.ttf"), 17)
    emoji = load(("seguiemj.ttf",), 17)
    step = mono.getlength("m")

    def write(draw, x, y, text, fill):
        for ch in text:
            f = emoji if ord(ch) > 0xFFFF else symbols if ch in "✷♪♫" else mono
            if f is not None:
                draw.text((x, y), ch, fill=fill, font=f, embedded_color=f is emoji)
            x += step * (2 if ord(ch) > 0xFFFF else 1)

    frames, times, said = [], [], ""
    for face, prop, text, ms in DEMO:
        said = text if text is not None else said
        if face == "sleep":
            said = ""
        img = Image.new("RGB", (width, height), SLATE)
        draw = ImageDraw.Draw(img)
        g = art.compose("look00", "headset", face, (), prop)
        ox = (width - art.W * scale) // 2
        for y in range(art.H):
            for x in range(art.W):
                c = art.PAL.get(g[y][x])
                if c is not None:
                    draw.rectangle([ox + x * scale, 6 + y * scale, ox + (x + 1) * scale - 1, 6 + (y + 1) * scale - 1], fill=((c >> 16) & 255, (c >> 8) & 255, c & 255))
        if said:
            rows, row = [], ""
            for word in said.split(" "):
                if row and len(row) + 1 + len(word) > int((width - 24) / step) - 2:
                    rows.append(row)
                    row = word
                else:
                    row = f"{row} {word}".strip()
            rows.append(row)
            write(draw, 12, text_top, "✷", (217, 119, 87))
            for i, r in enumerate(rows):
                write(draw, 12 + 2 * step, text_top + i * 22, r, (237, 236, 231))
        frames.append(img)
        times.append(ms)
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=times, loop=0, optimize=False)
    print(path, frames[0].size, len(frames), "frames")


if __name__ == "__main__":
    sheet("assets/looks.png", [(LOOKS[b], b, m, None, a, None) for b, m, a in art.PREVIEW_LOOKS], 6)
    sheet("assets/moods.png", [(text, "look00", "headset", face, (), None) for face, text in MOODS.items()], 5)
    sheet("assets/props.png", [(text, "look00", "headset", "think", (), p) for p, text in PROPS.items()], 8)
    social("assets/social.png")
    demo("assets/demo.gif")
