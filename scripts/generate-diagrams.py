"""Render the SongSoong architecture and data-to-music system diagrams.

SVG sources are dependency-free. PNG export uses PyMuPDF when available; the
SVGs remain usable if that optional local renderer is not installed.
"""

from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#173C36"
MUTED = "#5A716B"
GREEN = "#1E5D4D"
SEA = "#3A8C9B"
BLUE = "#93C7DE"
CREAM = "#F6F7F0"
WHITE = "#FFFFFF"
LINE = "#CFDCD1"
LIGHT_GREEN = "#E5F0E7"
LIGHT_BLUE = "#E5F2F5"
GOLD = "#DDBB73"
BODY = "Segoe UI, Arial, sans-serif"
SERIF = "Georgia, serif"


class Svg:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" role="img">',
            """<defs>
              <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#A9DBE7"/>
                <stop offset="1" stop-color="#D8EEE6"/>
              </linearGradient>
              <linearGradient id="deep" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#1A5549"/>
                <stop offset="1" stop-color="#173C36"/>
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#153F36" flood-opacity="0.075"/>
              </filter>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4E9189"/>
              </marker>
            </defs>""",
        ]

    def raw(self, html):
        self.parts.append(html)

    def rect(self, x, y, w, h, fill=WHITE, stroke="none", r=20, sw=1, shadow=False):
        effect = ' filter="url(#shadow)"' if shadow else ""
        self.raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
                 f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{effect}/>')

    def circle(self, x, y, radius, fill, stroke="none", sw=1):
        self.raw(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="{fill}" '
                 f'stroke="{stroke}" stroke-width="{sw}"/>')

    def path(self, d, stroke=GREEN, sw=2, fill="none", dash=None, arrow=False, opacity=1):
        attrs = f' stroke-dasharray="{dash}"' if dash else ""
        attrs += ' marker-end="url(#arrow)"' if arrow else ""
        self.raw(f'<path d="{d}" fill="{fill}" stroke="{stroke}" '
                 f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" '
                 f'opacity="{opacity}"{attrs}/>')

    def text(self, x, y, value, size=19, color=INK, weight=400, family=BODY,
             anchor="start", spacing=0):
        self.raw(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
                 f'font-weight="{weight}" fill="{color}" text-anchor="{anchor}" '
                 f'letter-spacing="{spacing}">{escape(value)}</text>')

    def lines(self, x, y, values, size=18, color=MUTED, line_height=27,
              weight=400, family=BODY):
        for i, value in enumerate(values):
            self.text(x, y + i * line_height, value, size, color, weight, family)

    def pill(self, x, y, w, label, fill=LIGHT_GREEN, color=GREEN, size=15):
        self.rect(x, y, w, 34, fill, "none", 17)
        self.text(x + w / 2, y + 23, label, size, color, 700, anchor="middle")

    def finish(self, stem, description):
        self.parts.insert(2, f"<desc>{escape(description)}</desc>")
        svg = "\n".join(self.parts + ["</svg>"])
        svg_path = OUT / f"{stem}.svg"
        svg_path.write_text(svg, encoding="utf-8")
        try:
            import fitz

            document = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
            pixmap = document[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            pixmap.save(str(OUT / f"{stem}.png"))
            document.close()
        except ImportError:
            print("PyMuPDF is unavailable; SVG source was saved.")
        print(svg_path)


def background(canvas):
    canvas.rect(0, 0, canvas.width, canvas.height, CREAM, r=0)
    canvas.path("M -20 136 C 190 39 381 162 578 107 S 924 35 1154 97 S 1440 144 1645 45",
                stroke="#D6EDE7", sw=52, opacity=0.55)
    canvas.path("M -20 148 C 190 51 381 174 578 119 S 924 47 1154 109 S 1440 156 1645 57",
                stroke="#F9FBF7", sw=20, opacity=0.85)
    canvas.circle(1490, 820, 160, "#EAF2E9")
    canvas.circle(1500, 810, 124, CREAM)


def title(canvas, eyebrow, title_text, subtitle):
    canvas.pill(70, 38, 234, eyebrow, fill=GREEN, color=WHITE, size=13)
    canvas.text(70, 121, title_text, 43, INK, 400, SERIF)
    canvas.text(72, 159, subtitle, 19, MUTED)
    canvas.path("M 70 184 H 1530", stroke=LINE, sw=1.5)


def wave(canvas, x, y, color=SEA):
    for offset in [0, 10, 20]:
        canvas.path(f"M {x} {y + offset} C {x + 12} {y + offset - 9} "
                    f"{x + 23} {y + offset + 9} {x + 35} {y + offset}",
                    stroke=color, sw=3)


def architecture():
    s = Svg(1600, 1020)
    background(s)
    title(s, "SONGSOONG  /  ARCHITECTURE",
          "River observations, heard in the browser",
          "A small, transparent pipeline from published field data to an interactive soundscape.")

    # Column headings
    for x, number, heading in [(70, "01", "PUBLISHED DATA"), (480, "02", "DELIVERY"),
                               (990, "03", "LISTENING EXPERIENCE")]:
        s.circle(x + 16, 225, 16, GREEN)
        s.text(x + 16, 231, number, 12, WHITE, 700, anchor="middle")
        s.text(x + 44, 231, heading, 15, GREEN, 700, spacing=1.4)

    # ENORA source.
    s.rect(70, 258, 340, 395, WHITE, LINE, 25, shadow=True)
    s.pill(94, 283, 104, "ENORA API", fill=LIGHT_BLUE, color=GREEN, size=14)
    s.text(94, 347, "OneAquaHealth", 29, INK, 400, SERIF)
    s.text(94, 379, "published observations", 18, MUTED)
    endpoints = [
        ("/api/cities/all", "5 research cities"),
        ("/api/sites/all", "sampling sites + coordinates"),
        ("/api/dashboards/city", "dated ecological records"),
    ]
    for i, (route, note) in enumerate(endpoints):
        y = 410 + i * 71
        s.path(f"M 94 {y-13} H 384", stroke=LINE, sw=1)
        s.circle(106, y + 14, 5, SEA)
        s.text(123, y + 8, route, 16, INK, 700)
        s.text(123, y + 31, note, 15, MUTED)
    s.text(94, 624, "Read-only public data", 15, GREEN, 700)

    # Build-time snapshot.
    s.rect(480, 258, 420, 180, WHITE, LINE, 25, shadow=True)
    s.pill(504, 281, 132, "BUILD TIME", LIGHT_GREEN, GREEN, 13)
    s.text(504, 345, "Validated snapshot", 27, INK, 400, SERIF)
    s.lines(504, 375, ["sync-enora.mjs fetches all three routes,",
                       "then bundles enoraSnapshot.json."], 16, MUTED, 24)
    s.circle(852, 312, 20, LIGHT_BLUE)
    s.path("M 844 303 H 860 V 321 H 844 Z M 848 309 H 856 M 848 314 H 856",
           stroke=GREEN, sw=1.8)

    # Runtime Vercel proxy.
    s.rect(480, 473, 420, 180, WHITE, LINE, 25, shadow=True)
    s.pill(504, 496, 126, "RUN TIME", LIGHT_BLUE, GREEN, 13)
    s.text(504, 560, "Vercel delivery", 27, INK, 400, SERIF)
    s.lines(504, 590, ["Static Vite app + same-origin rewrites",
                       "for three ENORA GET endpoints."], 16, MUTED, 24)
    s.circle(852, 527, 20, LIGHT_GREEN)
    s.path("M 842 527 H 861 M 854 519 L 862 527 L 854 535", stroke=GREEN, sw=2)

    # Connect source to build and runtime, then delivery to browser.
    s.path("M 410 340 H 480", stroke=SEA, sw=3, arrow=True)
    s.text(445, 329, "sync", 13, MUTED, 700, anchor="middle")
    s.path("M 410 556 H 480", stroke=SEA, sw=3, arrow=True)
    s.text(445, 545, "GET", 13, MUTED, 700, anchor="middle")
    s.path("M 900 348 H 960 V 418 H 990", stroke=SEA, sw=3, arrow=True)
    s.text(937, 333, "fallback", 13, MUTED, 700, anchor="middle")
    s.path("M 900 565 H 990", stroke=SEA, sw=3, arrow=True)
    s.text(945, 553, "JSON", 13, MUTED, 700, anchor="middle")

    # Browser card and its internal process.
    s.rect(990, 258, 540, 491, GREEN, "none", 28, shadow=True)
    s.pill(1018, 284, 137, "WEB BROWSER", "#D8EDE2", GREEN, 13)
    s.text(1018, 349, "React + Vite interface", 31, WHITE, 400, SERIF)
    s.text(1018, 380, "English / Vietnamese · responsive UI", 16, "#C8E2D9")
    blocks = [
        ("01", "Data adapter", "city, site, date, ratings, richness, nitrate"),
        ("02", "Sonification rules", "musical mood + distinct city profile"),
        ("03", "Tone.js / Web Audio", "procedural music on the listener's device"),
        ("04", "FFT visualizer", "sound-linked motion + visible source values"),
    ]
    for i, (num, heading, caption) in enumerate(blocks):
        y = 407 + i * 75
        s.rect(1018, y, 483, 63, "#245B50", "#42796A", 12)
        s.circle(1044, y + 31, 15, "#D3EBDF")
        s.text(1044, y + 36, num, 11, GREEN, 700, anchor="middle")
        s.text(1072, y + 27, heading, 18, WHITE, 700)
        s.text(1072, y + 48, caption, 14, "#D3E8DF")
        if i < 3:
            s.path(f"M 1260 {y + 63} V {y + 75}", stroke="#93C6B0", sw=2)

    # End user output, with explicit external hand-off.
    s.rect(70, 707, 830, 196, "#E7F0E6", "#C5D9C8", 25)
    wave(s, 99, 748)
    s.text(154, 763, "What the listener can do", 26, INK, 400, SERIF)
    s.lines(100, 806, ["Choose a city, site and recorded signal; hear its composition.",
                     "Compare two real Coimbra records, reveal the evidence, then remix.",
                     "Follow the official citizen-science link to take part."], 17, MUTED, 27)
    s.path("M 990 728 H 945 V 805 H 900", stroke=SEA, sw=3, arrow=True)

    s.rect(990, 783, 540, 120, WHITE, LINE, 22)
    s.text(1018, 825, "Design boundary", 19, INK, 700)
    s.lines(1018, 852, ["Playback stays in the browser. Historical ratings are not",
                         "a real-time sensor reading or a water-safety verdict."], 16, MUTED, 23)

    s.path("M 70 944 H 1530", stroke=LINE, sw=1.5)
    s.text(70, 973, "SOURCE  api.enora-oah.eu     ·     IMPLEMENTATION  React / Vite / Tone.js / Vercel", 15, MUTED, 600)
    s.text(1530, 973, "SONGSOONG", 14, GREEN, 800, anchor="end", spacing=2)
    s.finish("architecture", "SongSoong system architecture: ENORA public API supplies a build-time validated snapshot and runtime Vercel proxy. The React application maps data to Tone.js music and a visualizer in the user's browser.")


def mapping_card(s, y, number, source, source_lines, rule, rule_lines,
                 output, output_lines, color, source_fill):
    s.rect(70, y, 1460, 145, WHITE, LINE, 22, shadow=True)
    s.rect(70, y, 10, 145, color, "none", 5)
    s.circle(111, y + 45, 17, source_fill)
    s.text(111, y + 51, number, 13, GREEN, 700, anchor="middle")
    s.text(140, y + 51, source, 20, INK, 700)
    s.lines(141, y + 82, source_lines, 16, MUTED, 23)
    s.path(f"M 478 {y + 72} H 530", stroke=SEA, sw=2.8, arrow=True)
    s.text(560, y + 51, rule, 20, INK, 700)
    s.lines(561, y + 82, rule_lines, 16, MUTED, 23)
    s.path(f"M 972 {y + 72} H 1025", stroke=SEA, sw=2.8, arrow=True)
    s.text(1055, y + 51, output, 20, INK, 700)
    s.lines(1056, y + 82, output_lines, 16, MUTED, 23)


def system_design():
    s = Svg(1600, 1160)
    background(s)
    title(s, "SONGSOONG  /  SYSTEM DESIGN",
          "How a water record becomes a song",
          "Every audible change can be traced back to a published observation or a composed city theme.")

    # Column headers.
    for x, number, heading, subtitle in [
        (70, "01", "OBSERVE", "ENORA record"),
        (560, "02", "INTERPRET", "transparent mapping"),
        (1055, "03", "HEAR", "musical result"),
    ]:
        s.circle(x + 17, 223, 17, GREEN)
        s.text(x + 17, 229, number, 12, WHITE, 700, anchor="middle")
        s.text(x + 48, 219, heading, 16, GREEN, 800, spacing=1.7)
        s.text(x + 48, 242, subtitle, 15, MUTED)

    s.path("M 516 265 V 922", stroke="#DCE7DE", sw=1.5, dash="5 8")
    s.path("M 1010 265 V 922", stroke="#DCE7DE", sw=1.5, dash="5 8")

    mapping_card(s, 274, "A", "City + site", ["Five cities; site code."],
                 "Composed profile", ["Each city has its own scale, chord", "vocabulary, motif and pulse."],
                 "Distinct identity", ["Instrument, melody, rhythm", "and deterministic site variation."],
                 GREEN, LIGHT_GREEN)
    mapping_card(s, 439, "B", "Biological rating", ["Fish, invertebrates or", "diatoms: High → Bad."],
                 "Ecological stress", ["High .08 · Good .25 · Moderate .49", "Poor .73 · Bad .92"],
                 "Musical tension", ["Harmony, register, filter, bass", "and rough texture change."],
                 SEA, LIGHT_BLUE)
    mapping_card(s, 604, "C", "Recorded richness", ["Taxa count where the", "selected signal reports it."],
                 "Relative density", ["Normalize within that biological", "group in the retrieved dataset."],
                 "Signs of life", ["More or fewer bell-like", "water-drop accents."],
                 "#87A86F", "#E9F1E2")
    mapping_card(s, 769, "D", "Nitrate value", ["Show the exact published", "number and record date."],
                 "Dataset percentile", ["Relative rank only; the API gives", "no unit or safety threshold."],
                 "Secondary colour", ["Subtle texture and delay; a", "relative mood if nitrate-only."],
                 GOLD, "#F6EBD2")

    s.rect(70, 941, 1460, 153, GREEN, "none", 26)
    wave(s, 102, 980, "#A9D9E3")
    s.text(154, 988, "Listen, compare, understand", 26, WHITE, 400, SERIF)
    s.lines(101, 1026, ["Tone.js renders the composition locally. The UI shows site, signal, source value and date;",
                         "a guided A/B challenge reveals two Coimbra records, and the remix is labelled as a simulation."],
            17, "#D4E8E0", 25)
    s.path("M 70 1122 H 1530", stroke=LINE, sw=1.5)
    s.text(70, 1146, "SITE PORTRAIT  = mean of available biological ratings; nitrate never overrides that rating.",
           14, MUTED, 600)
    s.text(1530, 1146, "ARTISTIC INTERPRETATION  ·  NOT A SAFETY TEST", 13, GREEN, 800,
           anchor="end", spacing=0.5)
    s.finish("system-design", "SongSoong data-to-music system design: city and site choose a composed musical identity; biological quality becomes ecological stress and musical tension; richness controls accent density; nitrate contributes relative texture without a safety claim. Tone.js renders locally.")


if __name__ == "__main__":
    architecture()
    system_design()
