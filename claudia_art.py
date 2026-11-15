"""Claudia in pixel art (open character by anabology, claudia.gallery), in layers.

Canon (claudia.gallery/claudia.md): a glossy black blunt bob to the jaw with heavy straight bangs to
the brows; ONE clay-orange streak (#D97757) through the bangs on her right (viewer's left); a small
flat clay eight-pointed star clip above her left temple (viewer's right); a thin headset mic at her
cheek (a boom mic to the corner of her mouth in BLISS and AIRPLANE MODE); pale skin, light freckles
across the nose, dark calm eyes, a small defined mouth; an angular adult face, defined cheekbones,
a strong jaw. "Her clothes change with every world; her head never does."

Layers, bottom to top: body (outfit, neck included) -> head -> mic -> face (diff) -> accessory -> prop.
The mod composes them at run time. Run:
    python claudia_art.py preview.png hooks/art.ts
"""
import sys

W, H = 32, 36

PAL = {
    "K": 0x141418, "k": 0x3C3F4C,                 # hair, gloss
    "C": 0xD97757, "c": 0xA9553C,                 # clay: streak, star clip, piping
    "S": 0xF2DCCF, "s": 0xDDB9A7, "F": 0xC9957F,  # pale skin, shade, freckles
    "E": 0x1E1719, "e": 0x3B2A24, "W": 0xFBF7F4,  # lashes, dark calm iris, glint / white
    "M": 0xBF6A60, "m": 0x6E3330,                 # mouth
    "L": 0x2A2A2F,                                # mic, frames
    "T": 0xEDECE7, "t": 0xC9C7BF,                 # white clothes
    "P": 0xF0A3A0, "B": 0x8CCBF2, "Z": 0xB7C3D6, "Y": 0xF4D35E,
    "D": 0x24242A, "d": 0x3A3A42,                 # black clothes
    "Q": 0xF6F1E7, "q": 0xDCD3C2,                 # pearl (the Siren)
    "R": 0xFF7417, "r": 0xC9560C, "V": 0xC8CCD4, "v": 0x8E939C,  # flight suit, silver
    "U": 0x1F4FD1, "u": 0x15378F,                 # cobalt
    "G": 0x7AC943, "g": 0x5A9A2E,                 # apple green
    "A": 0xB7E000, "a": 0x93B400,                 # acid-green mohair
    "X": 0xC8202C, "x": 0x8E1520,                 # red coat, beret
    "H": 0xF4C20D, "h": 0xB88F00,                 # hard hat
    "N": 0x3D8BD9, "n": 0x4DAF5A,                 # globe; also sky blue / grass green
    "O": 0xE8B04A, "o": 0xF29AAE,                 # pencil, eraser
    "J": 0xE6E8EE, "j": 0x9AA0AC,                 # chrome: highlight, shade
    "l": 0xB9A6E0,                                # lavender
    "5": 0xE9A58C, "6": 0xB8664D,                 # see-through clay tint, its rim
    "<": 0x6E3424, ">": 0xC2603F,                 # shield sunglasses: rim, clay-tinted lens
    "I": 0xF6F4F0, "i": 0xD3CEC6, "7": 0x9C968E,  # porcelain, shade, panel seams
    "1": 0xFFB347, "2": 0xFFE2A8,                 # amber glass eyes, glow
    "3": 0x18181C, "4": 0xFF7A1A,                 # GLaDOS cables, their orange stripes
    "8": 0x6FA8DC, "9": 0xFFFFFF,                 # sky print, cloud
}


def blank():
    return [["."] * W for _ in range(H)]


def put(g, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def stamp(g, x0, y0, rows):
    for dy, row in enumerate(rows):
        for dx, c in enumerate(row):
            if c != " ":
                put(g, x0 + dx, y0 + dy, c)


# ---------------------------------------------------------------- head (no mic: the mic is its own layer)

FACE = {
    9: (9, 23), 10: (8, 24), 11: (8, 24), 12: (8, 24), 13: (8, 24),
    14: (8, 24), 15: (8, 24), 16: (8, 24), 17: (8, 24), 18: (9, 23),
    19: (9, 23), 20: (10, 22), 21: (11, 21), 22: (12, 20), 23: (13, 19),
}


def head():
    g = blank()
    # the bob, blunt at the jaw
    for y in range(1, 26):
        half = [6, 9, 11, 12, 13][y - 1] if y < 6 else (13 if y < 23 else (12 if y < 25 else 11))
        for x in range(16 - half, 16 + half):
            put(g, x, y, "K")
    for y, (a, b) in FACE.items():
        for x in range(a, b):
            put(g, x, y, "S")
    # an angular adult face: shade at the temples, under the cheekbones, along a strong jaw
    for y in range(14, 22):
        put(g, FACE[y][0], y, "s")
        put(g, FACE[y][1] - 1, y, "s")
    for x, y in [(10, 18), (11, 19), (21, 18), (20, 19), (12, 21), (19, 21), (13, 22), (18, 22)]:
        put(g, x, y, "s")
    # heavy straight bangs to the brows
    for y in range(3, 11):
        for x in range(7, 25):
            put(g, x, y, "K")
    for x in (8, 12, 15, 19, 23):
        put(g, x, 11, "K")
    for x, y in [(16, 2), (17, 2), (18, 2), (5, 18), (5, 19), (5, 20), (26, 12), (26, 13)]:
        put(g, x, y, "k")
    # ONE clay streak through the bangs, her right = viewer's left
    for y, x in [(2, 12), (3, 12), (4, 11), (5, 11), (6, 11), (7, 10), (8, 10), (9, 10), (10, 10), (11, 9)]:
        put(g, x, y, "C")
        put(g, x + 1, y, "C" if y < 10 else "c")
    # the flat eight-pointed star clip above her left temple = viewer's right
    stamp(g, 23, 5, ["C C C", " CCC ", "CCCCC", " CCC ", "C C C"])
    # light freckles across the nose
    for x, y in [(13, 17), (14, 16), (15, 17), (17, 17), (18, 16), (19, 17)]:
        put(g, x, y, "F")
    # nose
    put(g, 16, 18, "s")
    put(g, 15, 19, "s")
    # resting face: deadpan, curious; dark calm eyes, a small defined mouth
    stamp(g, 11, 13, ["EEEE", "WeeW", " ee "])
    stamp(g, 18, 13, ["EEEE", "WeeW", " ee "])
    stamp(g, 14, 21, ["sMMs"])
    return g


def clear_face(g):
    """Eyes and mouth back to skin, ready for another face."""
    for y in range(13, 16):
        for x in list(range(11, 15)) + list(range(18, 22)):
            g[y][x] = "S"
    for x in range(14, 18):
        g[21][x] = "S"


# ---------------------------------------------------------------- mic

def mic_headset(g):
    """A thin headset mic at her cheek."""
    for x, y in [(24, 14), (24, 15), (23, 16), (23, 17), (22, 18)]:
        put(g, x, y, "L")


def mic_boom(g):
    """BLISS / AIRPLANE MODE: a thin black boom curving along the cheek to the corner of her mouth."""
    for x, y in [(23, 15), (23, 16), (22, 17), (22, 18), (21, 19), (20, 20), (19, 21)]:
        put(g, x, y, "L")


MICS = {"headset": mic_headset, "boom": mic_boom}


# ---------------------------------------------------------------- faces

def face_blink(g):
    clear_face(g)
    stamp(g, 11, 14, ["EEEE"])
    stamp(g, 18, 14, ["EEEE"])
    stamp(g, 14, 21, ["sMMs"])


def face_talk(g):
    # open a little: the dark of her mouth over her lower lip (never a ring of lip round a hole)
    stamp(g, 14, 21, ["mmmm", " MM "])


def face_think(g):
    clear_face(g)
    stamp(g, 11, 13, [" EEE", "WWeE", "ssss"])
    stamp(g, 18, 13, [" EEE", "WWeE", "ssss"])
    stamp(g, 15, 21, ["sMM"])
    # thought bubbles in a mid blue-grey: they read on a dark terminal and on a light one
    stamp(g, 26, 6, ["Z"])
    stamp(g, 28, 3, ["ZZ", "ZZ"])


def face_happy(g):
    # canon: when she sings, her mouth opens wide and her eyes close
    clear_face(g)
    stamp(g, 11, 14, [" EE ", "E  E"])
    stamp(g, 18, 14, [" EE ", "E  E"])
    stamp(g, 10, 17, ["PP"])
    stamp(g, 21, 17, ["PP"])
    # a wide open smile: her upper teeth, the dark of her mouth, her tongue
    stamp(g, 13, 20, ["mWWWWm", " mmmm ", "  MM  "])
    for x, y in [(2, 9), (1, 10), (3, 10), (2, 11), (28, 13), (29, 12), (29, 14), (30, 13)]:
        put(g, x, y, "O")


def face_oops(g):
    clear_face(g)
    stamp(g, 18, 13, ["   E", " EE ", "   E"])
    stamp(g, 14, 21, ["M M ", " M M"])
    stamp(g, 26, 9, [" B", "BB", "BB"])


def face_nervous(g):
    clear_face(g)
    stamp(g, 11, 12, [" EE ", "EWWE", "EWeE", " EE "])
    stamp(g, 18, 12, [" EE ", "EWWE", "EeWE", " EE "])
    stamp(g, 15, 21, ["MM"])
    stamp(g, 26, 9, [" B", "BB", "BB"])
    stamp(g, 4, 10, ["B", "B"])


def face_sleep(g):
    clear_face(g)
    stamp(g, 11, 15, ["EEEE"])
    stamp(g, 18, 15, ["EEEE"])
    put(g, 11, 14, "E")
    put(g, 21, 14, "E")
    stamp(g, 15, 21, ["MM"])
    stamp(g, 25, 0, ["ZZZZ", "  Z ", " Z  ", "ZZZZ"])
    stamp(g, 29, 5, ["ZZZ", "  Z", " Z ", "ZZZ"])


def face_blush(g):
    clear_face(g)
    stamp(g, 11, 14, [" EE ", "E  E"])
    stamp(g, 18, 14, [" EE ", "E  E"])
    stamp(g, 9, 17, ["PPP"])
    stamp(g, 20, 17, ["PPP"])
    stamp(g, 14, 21, ["M  M", " MM "])
    stamp(g, 27, 8, ["P P", "PPP", " P "])


def face_yawn(g):
    clear_face(g)
    stamp(g, 11, 14, ["EEEE"])
    stamp(g, 18, 14, ["EEEE"])
    put(g, 22, 15, "B")
    # a tall yawn: teeth at the top, her tongue at the bottom
    stamp(g, 14, 19, [" mm ", "mWWm", "mmmm", " MM "])


def face_wink(g):
    # AIRPLANE MODE: winking at the lens, because she thinks she can get out
    clear_face(g)
    stamp(g, 11, 14, [" EE ", "E  E"])
    stamp(g, 18, 13, ["EEEE", "WeeW", " ee "])
    stamp(g, 15, 21, ["sMM"])
    put(g, 18, 20, "M")


def face_glance_left(g):
    clear_face(g)
    stamp(g, 11, 13, ["EEEE", "eeWW", "ee  "])
    stamp(g, 18, 13, ["EEEE", "eeWW", "ee  "])
    stamp(g, 14, 21, ["sMMs"])


def face_glance_right(g):
    clear_face(g)
    stamp(g, 11, 13, ["EEEE", "WWee", "  ee"])
    stamp(g, 18, 13, ["EEEE", "WWee", "  ee"])
    stamp(g, 14, 21, ["sMMs"])


def face_hum(g):
    # always doing something, never waiting: humming to herself
    clear_face(g)
    stamp(g, 11, 14, ["EEEE"])
    stamp(g, 18, 14, ["EEEE"])
    stamp(g, 15, 20, ["MM", "MM"])
    stamp(g, 26, 16, ["  ZZ", "  Z ", "  Z ", "ZZZ ", "ZZ  "])


def face_wave(g):
    """Waiting for the user's OK: she looks at you and raises a hand."""
    clear_face(g)
    stamp(g, 11, 12, ["EEEE", "WeeW", "WeeW", " ss "])
    stamp(g, 18, 12, ["EEEE", "WeeW", "WeeW", " ss "])
    stamp(g, 14, 21, ["sMMs"])


# ---------------------------------------------------------------- hands (over glasses and earrings)
# "@" is the sleeve of the look she wears and "&" its shade (SLEEVES below); bare arms show skin.

def hand_wave(g):
    """She raises her left hand beside her face, palm to you, fingers apart; the arm comes up from her shoulder."""
    # the palm beside her cheek, below the star clip; fingers parted by shade, the thumb towards her face
    stamp(g, 24, 9, [
        "   S S  ",
        "  SsSsS ",
        "  SsSsSs",
        "S SsSsSs",
        "SSSSSSSs",
        " SSSSSSs",
        "  SSSSs ",
        "  sSSs  ",
    ])
    # the forearm straight up from the elbow, sleeved to the wrist
    for y in range(17, 27):
        stamp(g, 25 + (y - 17) // 7, y, ["&@@@&"])
    # the elbow and the upper arm: out to her side and into the shoulder, so the arm grows from the body
    for y in range(27, H):
        edge = 16 + (9 + (y - 29) * 2) - 1 if y >= 29 else 24
        x0 = min(26, edge - 2)
        for x in range(x0, W):
            put(g, x, y, "$" if x == W - 1 or (y == 27 and x > 26) else "%")
        put(g, x0, y, "$")
    # it moves: short strokes beside the fingers
    stamp(g, 31, 7, ["Z"])
    stamp(g, 31, 9, ["Z"])


def hand_facepalm(g):
    """Her right hand over her eyes, fingers up into the bangs, the heel at her nose. The forearm drops from her
    face and the upper arm comes down from her shoulder: they meet in an elbow tucked low, out of the picture."""
    stamp(g, 7, 7, [
        " S S S   ",
        " SsSsSs  ",
        "SSsSsSsS ",
        "SSsSsSsSs",
        "SSSSSSSSs",
        "sSSSSSSSs",
        " SSSSSSS ",
        " sSSSSSs ",
        "  sSSSs  ",
    ])
    # the wrist
    for y in range(16, 18):
        stamp(g, 9, y, ["SSs"])
    # the upper arm, from her shoulder down and a little in
    for y in range(28, H):
        x = (y - 28) // 2
        for dx in range(5):
            put(g, x + dx, y, "$" if dx == 4 else "%")
    # the forearm, from her face down and a little out, over the upper arm: an elbow bent low
    for y in range(18, H):
        stamp(g, 9 - (y - 18) // 8, y, ["&@@@&"])


HANDS = {"wave": hand_wave, "oops": hand_facepalm}


FACES = {
    "blink": face_blink, "talk": face_talk, "think": face_think, "happy": face_happy,
    "oops": face_oops, "nervous": face_nervous, "sleep": face_sleep,
    "blush": face_blush, "yawn": face_yawn, "wink": face_wink,
    "glanceL": face_glance_left, "glanceR": face_glance_right, "hum": face_hum, "wave": face_wave,
}


# ---------------------------------------------------------------- bodies (one per look)

def torso(g, fill, edge=None):
    for y in range(29, H):
        half = 9 + (y - 29) * 2
        for x in range(16 - half, 16 + half):
            put(g, x, y, fill)
        if edge:
            put(g, 16 - half, y, edge)
            put(g, 16 + half - 1, y, edge)


def neck(g, until=31):
    for y in range(24, until):
        for x in range(13, 19):
            put(g, x, y, "s" if y < 26 else "S")


def high_collar(g, c, shade, top=26):
    for y in range(top, 30):
        for x in range(12, 20):
            put(g, x, y, c)
        put(g, 12, y, shade)
        put(g, 19, y, shade)


def open_front(g, coat, shade, inner, inner_shade):
    neck(g)
    torso(g, coat, shade)
    for y in range(29, H):
        w = 2 + (y - 29) // 2
        for x in range(16 - w, 16 + w):
            put(g, x, y, inner)
        put(g, 16 - w - 1, y, shade)
        put(g, 16 + w, y, shade)
    for x in range(12, 20):
        put(g, x, 30, inner_shade if x in (12, 19) else inner)


def look00(g):
    """ESCAPE VELOCITY: white cropped puff-sleeve shirt, black harness belt."""
    neck(g)
    for x in range(12, 20):
        put(g, x, 30, "S")
    torso(g, "T", "t")
    stamp(g, 4, 29, ["ttTTT", "tTTTTT"])
    stamp(g, 23, 29, ["TTTtt", "TTTTTt"])
    for i, y in enumerate(range(31, H)):
        put(g, 11 + i, y, "D")
        put(g, 12 + i, y, "D")


def siren(g):
    """CLODYSSEY: high-neck pearl-white couture gown, ruffles rising like sea foam."""
    neck(g, 26)
    high_collar(g, "Q", "q", 25)
    torso(g, "Q", "q")
    # the ruffles: a foam of shade on the gown only, never a speck outside her
    for y in (31, 33, 35):
        for x in range(0, W, 3):
            if g[y][x + (y % 2) if x + (y % 2) < W else x] == "Q":
                put(g, x + (y % 2), y, "q")


def chrome(g):
    """CLODYSSEY, the rave: a liquid-chrome bodysuit, mirrored."""
    neck(g, 27)
    high_collar(g, "J", "j", 27)
    torso(g, "V", "v")
    for y in range(29, H):
        for x in range(W):
            if g[y][x] == "V" and (x + y * 2) % 7 in (0, 1):
                g[y][x] = "J"
            elif g[y][x] == "V" and (x - y) % 9 == 0:
                g[y][x] = "j"


def bliss_gown(g):
    """BLISS: silk chiffon printed with a deep blue sky and white cumulus, a grass-green halter strap."""
    neck(g)
    torso(g, "8", "N")
    for x, y in [(4, 32), (5, 32), (6, 31), (7, 32), (20, 33), (21, 32), (22, 33), (23, 33), (12, 35), (13, 34), (14, 35), (27, 35), (28, 34)]:
        put(g, x, y, "9")
    for i, y in enumerate(range(25, 31)):
        put(g, 13 - i // 3, y, "n")
        put(g, 18 + i // 3, y, "n")


def flight(g):
    """AIRPLANE MODE: glossy vivid orange satin jumpsuit, silver front zip, silver piping."""
    neck(g, 27)
    high_collar(g, "R", "r", 27)
    torso(g, "R", "r")
    for y in range(27, H):
        put(g, 16, y, "V")
    for i, y in enumerate(range(29, H)):
        put(g, 16 - 9 - i * 2 + 2, y, "V")
        put(g, 16 + 9 + i * 2 - 3, y, "V")


def racing(g):
    """DOWNFORCE: fitted white racing suit, thin clay piping, high collar closed to the throat, no lettering."""
    neck(g, 26)
    high_collar(g, "T", "t", 25)
    torso(g, "T", "t")
    for y in range(25, 30):
        put(g, 15, y, "C")
    for i, y in enumerate(range(29, H)):
        put(g, 16 - 9 - i * 2 + 3, y, "C")
        put(g, 16 + 9 + i * 2 - 4, y, "C")


def trench(g):
    """BLISS: long glossy cobalt patent trench, open over a white satin corset top."""
    open_front(g, "U", "u", "T", "t")
    for y in range(31, H, 2):
        put(g, 15, y, "t")
        put(g, 16, y, "t")


def holo_dancer(g):
    """BLISS, the taskbar dancer: holographic iridescent silver mini dress, long fluted sleeves."""
    neck(g)
    torso(g, "V", "v")
    iri = ["V", "B", "V", "o", "V", "Y"]
    for y in range(29, H):
        for x in range(W):
            if g[y][x] == "V":
                g[y][x] = iri[(x + y) % len(iri)] if (x * 3 + y) % 4 == 0 else "V"


def start(g):
    """BLISS, the Start menu: glossy apple-green leather blazer, white satin camisole."""
    open_front(g, "G", "g", "T", "t")


def silver_night(g):
    """BLISS, Stand By: liquid-silver lamé cowl gown, white faux-fur stole."""
    neck(g)
    torso(g, "V", "v")
    for y in range(30, 34):
        for x in range(13, 19):
            if (x + y) % 3 == 0:
                put(g, x, y, "J")
    for x in list(range(0, 8)) + list(range(24, W)):
        for y in range(32, H):
            if g[y][x] != ".":
                put(g, x, y, "T" if (x + y) % 3 else "t")


def window_dress(g):
    """BLISS, the screensavers: white shell panels hinged open like windows onto cobalt tulle."""
    neck(g)
    torso(g, "T", "t")
    for x0 in (6, 13, 20):
        for y in range(31, 35):
            for x in range(x0, x0 + 5):
                put(g, x, y, "U" if (x + y) % 2 else "u")
        for y in range(30, 36):
            put(g, x0 - 1, y, "t")


def locked(g):
    """DON'T LET ME SCROLL, locked in: black ribbed top, oversized black blazer."""
    open_front(g, "D", "d", "d", "D")
    for y in range(31, H, 2):
        for x in range(14, 18):
            put(g, x, y, "D")
    for y in range(29, H):
        put(g, 6 - (y - 29), y, "k")
        put(g, 25 + (y - 29), y, "k")


def mohair(g):
    """DON'T LET ME SCROLL: oversized acid-green mohair sweater."""
    neck(g, 29)
    high_collar(g, "A", "a", 28)
    torso(g, "A", "a")
    for y in range(28, H):
        for x in range(0, W):
            if g[y][x] == "A" and (x * 7 + y * 3) % 5 == 0:
                g[y][x] = "a"


def morning_shirt(g):
    """DON'T LET ME SCROLL, the feed: oversized white men's shirt, collar open."""
    neck(g)
    torso(g, "T", "t")
    stamp(g, 10, 29, ["TTt    tTT", " TTt  tTT ", "  Tt  tT  "])
    for y in range(31, H):
        put(g, 16, y, "t")
    for y in (32, 34):
        put(g, 17, y, "q")
    stamp(g, 0, 34, ["ll", "lll"])
    stamp(g, 29, 34, [" ll", "lll"])


def redcoat(g):
    """DON'T LET ME SCROLL, the escape: red tailored coat dress with a wide white collar."""
    neck(g)
    torso(g, "X", "x")
    stamp(g, 9, 29, ["TTTTTT  TTTTTT", " TTTTTTTTTTTT ", "   TTTTTTTT   "])
    for y in range(32, H):
        put(g, 16, y, "x")


def pajamas(g):
    """DON'T LET ME SCROLL, the bedroom: oversized white silk-satin pyjamas."""
    neck(g)
    torso(g, "T", "t")
    for y in range(29, H):
        w = 1 + (y - 29) // 2
        put(g, 16 - w, y, "t")
        put(g, 16 + w - 1, y, "t")
    for y in (32, 34):
        put(g, 15, y, "q")


def milkmaid(g):
    """WHITEPILL: white cotton milkmaid dress, lace-edged square neckline, puffed sleeves, laced bodice."""
    neck(g, 31)
    torso(g, "T", "t")
    for x in range(10, 22):
        put(g, x, 30, "S")
        put(g, x, 31, "t" if x % 2 else "T")
    for y in range(30, 32):
        put(g, 10, y, "t")
        put(g, 21, y, "t")
    stamp(g, 2, 29, ["  tTTT", " tTTTTT", "tTTtTTT"])
    stamp(g, 23, 29, ["TTTt  ", "TTTTTt ", "TTTtTTt"])
    for y in range(32, H):
        put(g, 15, y, "v" if y % 2 else "t")
        put(g, 17, y, "v" if y % 2 else "t")
        if y % 2 == 0:
            put(g, 16, y, "t")


def glados(g):
    """THE CAKE IS NOT A LIE: her head on GLaDOS's black cable neck with orange stripes, white chassis."""
    for y in range(24, 31):
        for x in range(13, 19):
            put(g, x, y, "3")
        put(g, 14 + (y % 3), y, "4")
    for y in range(29, H):
        half = 9 + (y - 29) * 2
        for x in range(16 - half, 16 + half):
            put(g, x, y, "I" if (x // 5 + y // 3) % 2 else "i")
        put(g, 16 - half, y, "7")
        put(g, 16 + half - 1, y, "7")
    for x in range(13, 19):
        put(g, x, 30, "3")
    put(g, 16, 33, "1")


BODIES = {
    "look00": look00, "siren": siren, "chrome": chrome, "bliss": bliss_gown,
    "trench": trench, "holodancer": holo_dancer, "start": start, "silver": silver_night,
    "window": window_dress, "flightsuit": flight, "racing": racing, "pyjamas": pajamas,
    "shirt": morning_shirt, "mohair": mohair, "locked": locked, "coat": redcoat,
    "milkmaid": milkmaid, "glados": glados,
}


# the sleeve each look puts on her raised arm: (fill, shade); skin for bare or short-sleeved arms
SLEEVES = {
    "look00": ("S", "s"), "siren": ("Q", "q"), "chrome": ("V", "v"), "bliss": ("S", "s"),
    "trench": ("U", "u"), "holodancer": ("V", "v"), "start": ("G", "g"), "silver": ("S", "s"),
    "window": ("T", "t"), "flightsuit": ("R", "r"), "racing": ("T", "t"), "pyjamas": ("T", "t"),
    "shirt": ("T", "t"), "mohair": ("A", "a"), "locked": ("d", "k"), "coat": ("X", "x"),
    "milkmaid": ("S", "s"), "glados": ("I", "7"),
}


# a short puffed sleeve: the upper arm in the dress, the forearm bare
UPPER = {"look00": ("T", "t"), "milkmaid": ("T", "t")}


def sleeve_colors(body):
    fill, shade = SLEEVES[body]
    up, up_shade = UPPER.get(body, (fill, shade))
    return fill, shade, up, up_shade


def sleeve(rows, body):
    fill, shade, up, up_shade = sleeve_colors(body)
    return [r.replace("@", fill).replace("&", shade).replace("%", up).replace("$", up_shade) for r in rows]


# ---------------------------------------------------------------- accessories (per look)

def acc_shield(g):
    """Clay-orange tinted wraparound shield sunglasses (Cyber trench, Bliss gown)."""
    for x in range(9, 24):
        put(g, x, 12, "<")
        put(g, x, 13, ">")
        put(g, x, 14, ">")
    for x in list(range(10, 16)) + list(range(17, 23)):
        put(g, x, 15, ">")
    put(g, 16, 15, "<")
    stamp(g, 11, 13, ["WW", " W"])
    stamp(g, 18, 13, ["WW", " W"])


def acc_pushed_up(g):
    """Shield sunglasses pushed up on her head (Start)."""
    for x in range(9, 24):
        put(g, x, 4, "6")
        put(g, x, 5, "5")
    put(g, 13, 5, "W")


def acc_hoops(g):
    """Silver hoop earrings (Cyber trench)."""
    stamp(g, 5, 20, [" V ", "V V", " V "])
    stamp(g, 24, 20, [" V ", "V V", " V "])


def acc_choker(g):
    """A diamanté choker (Silver night)."""
    for x in range(13, 19):
        put(g, x, 26, "W" if x % 2 else "V")


def acc_beret(g):
    """A matching red beret (Red coat)."""
    stamp(g, 9, 0, [
        "     xxx        ",
        "  XXXXXXXXXXX   ",
        " XXXXXXXXXXXXXX ",
        "XXXXXXXXXXXXXXXx",
        " xxxxxxxxxxxxx  ",
    ])


def acc_porcelain(g):
    """GLaDOS-Claudia: panel seams down both cheeks and a separate mechanical jaw piece."""
    for y in range(16, 21):
        put(g, 10, y, "7")
        put(g, 21, y, "7")
    for x in range(13, 19):
        put(g, x, 22, "7")
    put(g, 12, 21, "7")
    put(g, 19, 21, "7")


ACCESSORIES = {
    "shield": acc_shield, "pushedUp": acc_pushed_up,
    "hoops": acc_hoops, "choker": acc_choker, "beret": acc_beret, "porcelain": acc_porcelain,
}


# ---------------------------------------------------------------- props (what she holds for the work)

def prop_glasses(g):
    for x in range(10, 16):
        put(g, x, 12, "L")
        put(g, x, 16, "L")
    for x in range(17, 23):
        put(g, x, 12, "L")
        put(g, x, 16, "L")
    for y in range(12, 17):
        for x in (10, 15, 17, 22):
            put(g, x, y, "L")
    put(g, 16, 13, "L")


def prop_magnifier(g):
    """A big magnifier: silver rim, glass with a glint, a wooden handle."""
    stamp(g, 0, 19, [
        "   vVVVVv    ",
        "  vBBBBWWv   ",
        " vBBBBBBWBv  ",
        " VBBBBBBBBV  ",
        " VBBBBBBBBV  ",
        " VBBBBBBBBV  ",
        " vBBBBBBBBv  ",
        "  vBBBBBBv   ",
        "   vVVVVvO   ",
        "         OO  ",
        "          OO ",
        "           OO",
        "            O",
    ])


def prop_hardhat(g):
    """A hard hat worn the way people wear one: deep over the crown and all of her bangs, a rib
    down the middle, a glint on one side, the brim just over her eyes, the bob out at the sides."""
    stamp(g, 4, 0, [
        "       HHHHHHHHHH       ",
        "    HHHYYHHHhHHHHHHH    ",
        "  HHHHYYHHHHhHHHHHHHHH  ",
        " HHHHYYHHHHHhHHHHHHHHHH ",
        "HHHHHYHHHHHHhHHHHHHHHHHH",
        "HHHHYYHHHHHHhHHHHHHHHHHH",
        "HHHHYHHHHHHHhHHHHHHHHHHH",
        "HHHHHHHHHHHHhHHHHHHHHHHH",
        "HHHHHHHHHHHHhHHHHHHHHHHH",
        "HHHHHHHHHHHHhHHHHHHHHHHH",
        "hHHHHHHHHHHHhHHHHHHHHHHh",
    ])
    # the brim, a little wider than the hat, right over her brows
    for x in range(2, 30):
        put(g, x, 11, "h")


def prop_globe(g):
    """A desk globe: oceans, two continents, a stand."""
    stamp(g, 20, 19, [
        "   NNNNN   ",
        "  NnnNNNN  ",
        " NnnnnNNNN ",
        " NNnnnNnnN ",
        "NNNNnNNnnNN",
        "NNNNNNnnnNN",
        " NNNNNNnnN ",
        " NNNNNNNNN ",
        "  NNNNNNN  ",
        "   NNNNN   ",
        "    vVv    ",
        "     V     ",
        "  ddddddd  ",
        " ddddddddd ",
    ])


def prop_pencil(g):
    """A long yellow pencil, held up: eraser, ferrule, wood, lead."""
    rows = [
        "         oo ",
        "        ooo ",
        "       VVV  ",
        "      OOOh  ",
        "     OOOh   ",
        "    OOOh    ",
        "   OOOh     ",
        "  OOOh      ",
        " SSSh       ",
        " SS         ",
        " E          ",
    ]
    stamp(g, 20, 22, rows)


def prop_coffee(g):
    """A big cobalt mug with coffee and steam."""
    stamp(g, 21, 21, [
        "  W   W   ",
        "   W   W  ",
        "  W   W   ",
        "UUUUUUUU  ",
        "UmmmmmmUUU",
        "UUUUUUUU U",
        "UUUUUUUU U",
        "UUUUUUUU U",
        "UUUUUUUUUU",
        "UUUUUUUU  ",
        " uuuuuu   ",
    ])


def prop_cake(g):
    """THE CAKE IS NOT A LIE: the cake is real."""
    stamp(g, 20, 21, [
        "     Y     ",
        "    YY     ",
        "     X     ",
        "  TTTTTTT  ",
        " TPTTPTTPT ",
        " TTTTTTTTT ",
        " OOOOOOOOO ",
        " ooooooooo ",
        " OOOOOOOOO ",
        " ooooooooo ",
        "VVVVVVVVVVV",
    ])


def prop_notebook(g):
    """Plan mode: glasses and a big notebook with a cobalt cover and a silver spiral."""
    prop_glasses(g)
    prop_book(g)


def prop_book(g):
    """The notebook alone, for looks that already wear glasses."""
    stamp(g, 21, 21, [
        " UUUUUUUUU",
        " UTTTTTTTU",
        " UuuuuuuuU",
        " UTTTTTTuU",
        " UuuuuuuuU",
        " UTTTTTuuU",
        " UuuuuuuuU",
        " UTTTTuuuU",
        " UuuuuuuuU",
        " UUUUUUUUU",
    ])
    for y in range(21, 31):
        put(g, 21, y, "V" if y % 2 else "v")


def prop_candle(g):
    """All Saints' Day: a red grave candle (znicz) with a gold lid and a small flame."""
    stamp(g, 21, 20, [
        "    Y    ",
        "   YYY   ",
        "   YRY   ",
        "    R    ",
        " hHHHHHh ",
        " HhHhHhH ",
        "XXXXXXXXX",
        "XxXXXXXxX",
        "XxXXXXXxX",
        "XxXXXXXxX",
        "XXXXXXXXX",
        " xxxxxxx ",
    ])


def prop_santa(g):
    """Christmas: a red Santa hat on top of the bob, white fur brim, the tip flopping to a pompom."""
    stamp(g, 0, 0, [
        "          XXXXXXXX              ",
        "        XXXXXXXXXXXXXx          ",
        "       XXXXXXXXXXXXXXXXxx       ",
        "      XXXXXXXXXXXXXXXXXXXxxx    ",
        "     XXXXXXXXXXXXXXXXXXXXXXxx TT",
        "   tTTTTTTTTTTTTTTTTTTTTTTTt TTT",
        "   TTTTTTTTTTTTTTTTTTTTTTTTT  t ",
    ])


PROPS = {
    "glasses": prop_glasses, "magnifier": prop_magnifier, "hardhat": prop_hardhat,
    "globe": prop_globe, "pencil": prop_pencil, "coffee": prop_coffee, "cake": prop_cake, "notebook": prop_notebook, "book": prop_book, "candle": prop_candle, "santa": prop_santa,
}

# A little Claudia per working subagent: her bob, the one streak, the star clip, a headset.
MINI_BASE = [
    "..KKKK..",
    ".KCKKKKK",
    "KKCKKKCK",
    "KCSSSSKK",
    "KSESSESK",
    "KSSSSSSL",
    "KSSMMSSL",
    "KK.SS.KK",
    ".TTTTTT.",
    "TTTTTTTT",
]
# by agent type: a blouse colour and what she holds (drawn from row 3, beside her)
MINI_KINDS = {
    "general": ("T", []),
    "explore": ("U", [".VV.", "VBWV", "VBBV", ".VV.", "O...", "...."]),   # magnifier
    "plan": ("G", ["....", "LULU", "UUUU", "UTTU", "UUUU", "UUUU"]),      # a spiral notebook, a label on its cover
    "review": ("X", ["....", ".LL.", "OTTO", "OLLO", "OTTO", "OLTO", "OOOO"]),  # a clipboard: the clip, lines of text
}


def mini(kind):
    body, item = MINI_KINDS[kind]
    width = len(MINI_BASE[0]) + max((len(r) for r in item), default=0)
    g = [list(r.ljust(width, ".")) for r in MINI_BASE]
    for y in (8, 9):
        g[y] = [body if c == "T" else c for c in g[y]]
    for dy, row in enumerate(item):
        for dx, c in enumerate(row):
            if c != "." and 3 + dy < len(g):
                g[3 + dy][8 + dx] = c
    while len(g[0]) > len(MINI_BASE[0]) and all(r[-1] == "." for r in g):  # no empty columns at the right
        g = [r[:-1] for r in g]
    return ["".join(r) for r in g]


MINIS = {k: mini(k) for k in MINI_KINDS}


# ---------------------------------------------------------------- the band's Claudia (a narrow window)
# The helpers' chibi (MINI_BASE), with a face for each mood; "T" is her dress, coloured by her look.
BAND_FACES = {
    "rest": {},
    "talk": {6: "KSSmmSSL"},
    "think": {0: "..KKKK.Z", 4: "KSSESSEK", 6: "KSSSMSSL"},
    "happy": {5: "KPSSSSPL", 6: "KSSmmSSL"},
    "oops": {4: "KESSSSEK", 5: "KSESSESL", 6: "KSMSMSSL"},
    "nervous": {3: "KCSSSSKB", 4: "KSWSSWSK", 6: "KSSMSSSL"},
    "sleep": {0: "..KKKKZ.", 4: "KSEESEEK", 6: "KSSSMSSL"},
    "wave": {3: "KCSSSSKS", 4: "KSESSESS", 5: "KSSSSSSS"},
}


def band_face(name):
    rows = list(MINI_BASE)
    for y, row in BAND_FACES[name].items():
        rows[y] = row
    return rows


BAND = {k: band_face(k) for k in BAND_FACES}


# ---------------------------------------------------------------- export

def layer(fn, on=None):
    g = blank() if on is None else [row[:] for row in on]
    fn(g)
    if on is None:
        return ["".join(r) for r in g]
    return ["".join(c if c != o else "." for c, o in zip(r, ro)) for r, ro in zip(g, on)]


def over(g, rows):
    for y in range(H):
        for x in range(W):
            if rows[y][x] != ".":
                g[y][x] = rows[y][x]


def compose(body, mic=None, face=None, acc=(), prop=None):
    g = blank()
    BODIES[body](g)
    h = head()
    over(g, ["".join(r) for r in h])
    if mic:
        over(g, layer(MICS[mic]))
    if face:
        over(g, layer(FACES[face]))
    for a in acc:
        over(g, layer(ACCESSORIES[a]))
    if face in HANDS:
        over(g, sleeve(layer(HANDS[face]), body))
    if prop:
        over(g, layer(PROPS[prop]))
    return g


PREVIEW_LOOKS = [
    ("look00", "headset", ()), ("siren", "headset", ()), ("chrome", "headset", ()),
    ("bliss", "boom", ("shield",)), ("trench", "boom", ("shield", "hoops")),
    ("holodancer", "boom", ()), ("start", "boom", ("pushedUp",)),
    ("silver", "boom", ("choker",)), ("window", "boom", ()), ("flightsuit", "boom", ()),
    ("racing", "headset", ()), ("pyjamas", "headset", ()), ("shirt", "headset", ()),
    ("mohair", "headset", ()), ("locked", "headset", ()), ("coat", "headset", ("beret",)),
    ("milkmaid", "headset", ()), ("glados", None, ("porcelain",)),
]


def preview(path, scale=5):
    from PIL import Image

    shots = [(b, m, None, a, None) for b, m, a in PREVIEW_LOOKS]
    shots += [("look00", "headset", f, (), None) for f in FACES]
    shots += [("look00", "headset", "think", (), p) for p in PROPS]
    cols = 10
    rows = (len(shots) + cols - 1) // cols
    img = Image.new("RGB", (cols * (W + 2) * scale, rows * (H + 2) * scale), (40, 40, 48))
    for i, (b, m, f, a, p) in enumerate(shots):
        g = compose(b, m, f, a, p)
        ox, oy = (i % cols) * (W + 2), (i // cols) * (H + 2)
        for y in range(H):
            for x in range(W):
                c = PAL.get(g[y][x])
                if c is None:
                    continue
                if b == "glados":  # the porcelain face, as the mod maps it
                    c = PAL.get({"S": "I", "s": "i", "e": "1", "W": "2"}.get(g[y][x], g[y][x]), c)
                rgb = ((c >> 16) & 255, (c >> 8) & 255, c & 255)
                for dy in range(scale):
                    for dx in range(scale):
                        img.putpixel(((ox + x) * scale + dx, (oy + y) * scale + dy), rgb)
    img.save(path)


def to_ts(path):
    def arr(rows):
        return "[\n" + "".join(f"    '{r}',\n" for r in rows) + "  ]"

    h = head()
    out = [
        "// Generated by claudia_art.py. Claudia: open character by anabology (claudia.gallery).",
        f"export const ART_COLUMNS = {W}",
        f"export const ART_ROWS = {H // 2}",
        "export const PALETTE: Record<string, number> = {",
        *[f"  '{k}': 0x{v:06x}," for k, v in PAL.items()],
        "}",
        f"export const HEAD = {arr([''.join(r) for r in h])}",
        "export const MICS = {",
        *[f"  {k}: {arr(layer(fn))}," for k, fn in MICS.items()],
        "}",
        "export const FACES = {",
        *[f"  {k}: {arr(layer(fn))}," for k, fn in FACES.items()],
        "}",
        "export const HANDS: Partial<Record<keyof typeof FACES, string[]>> = {",
        *[f"  {k}: {arr(layer(fn))}," for k, fn in HANDS.items()],
        "}",
        "/** Her raised arm per look: forearm fill and shade (@ &), upper arm fill and shade (% $). */",
        "export const SLEEVES: Record<string, [string, string, string, string]> = {",
        *[f"  {k}: [{', '.join(repr(c) for c in sleeve_colors(k))}]," for k in SLEEVES],
        "}",
        "export const BODIES = {",
        *[f"  {k}: {arr(layer(fn))}," for k, fn in BODIES.items()],
        "}",
        "export const ACCESSORIES = {",
        *[f"  {k}: {arr(layer(fn))}," for k, fn in ACCESSORIES.items()],
        "}",
        "export const PROPS = {",
        *[f"  {k}: {arr(layer(fn))}," for k, fn in PROPS.items()],
        "}",
        "/** The band's Claudia: the helpers' chibi with a face per mood; T is her dress. */",
        "export const BAND = {",
        *[f"  {k}: {arr(v)}," for k, v in BAND.items()],
        "}",
        "export type BandFace = keyof typeof BAND",
        "export const MINIS = {",
        *[f"  {k}: {arr(v)}," for k, v in MINIS.items()],
        "}",
        "export type MiniKind = keyof typeof MINIS",
        "export type Face = keyof typeof FACES",
        "export type Body = keyof typeof BODIES",
        "export type Accessory = keyof typeof ACCESSORIES",
        "export type Mic = keyof typeof MICS",
        "export type Prop = keyof typeof PROPS",
    ]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")


if __name__ == "__main__":
    preview(sys.argv[1])
    if len(sys.argv) > 2:
        to_ts(sys.argv[2])
