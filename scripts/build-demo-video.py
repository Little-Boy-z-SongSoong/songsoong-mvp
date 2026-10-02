"""Build a narrated Devpost demo from SongSoong UI captures and real app audio.

Requires ffmpeg, Pillow, edge-tts, and the two browser-recorded Coimbra clips.
The narration is synthetic. The music clips are captured from AudioEngine.js.
"""

import asyncio
from dataclasses import dataclass
from pathlib import Path
import subprocess
import textwrap

import edge_tts
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "demo"
SEGMENTS = OUT / "segments"
SOURCE_SCREEN = OUT / "assets/full-page-ui.jpg"
CLIP_A = OUT / "assets/songsoong-coimbra-A.webm"
CLIP_B = OUT / "assets/songsoong-coimbra-B.webm"
WIDTH, HEIGHT = 1920, 1080
GREEN = (23, 74, 57)
CREAM = (245, 246, 237)
GOLD = (226, 186, 109)
FONT_DIR = Path(r"C:\Windows\Fonts")


@dataclass
class Scene:
    key: str
    kicker: str
    title: str
    points: tuple[str, ...]
    narration: str = ""
    image: str = ""
    crop: tuple[int, int, int, int] | None = None
    audio: Path | None = None


SCENES = [
    Scene("01-intro", "SONGSOONG / THE IDEA", "Every river has a melody.",
          ("Real waterway observations", "An interactive musical story"),
          "Waterway observations contain valuable knowledge, but a table of ratings can feel distant. SongSoong gives each urban stream a musical portrait. The visitor hears a difference, makes a guess, and then sees the published record behind the sound. This is an invitation to explore ecological evidence, not an environmental diagnosis.",
          "screen", (0, 0, 1920, 1080)),
    Scene("02-mission", "ONEAQUAHEALTH / TRACK 4", "From data to awareness.",
          ("Urban freshwater ecosystems", "Biodiversity and human wellbeing", "A route into citizen science"),
          "OneAquaHealth studies urban freshwater ecosystems and their links to biodiversity and human wellbeing. Track four asks for awareness and storytelling. Our response is a short, sensory path from curiosity to evidence, using the project's own published ENORA data and a clear link to its official citizen science app.",
          "screen", (0, 1050, 1920, 2130)),
    Scene("03-cities", "FIVE CITIES / FIVE VOICES", "Choose a place.",
          ("Oslo · Benevento · Ghent", "Toulouse · Coimbra", "Distinct composed city themes"),
          "Visitors can choose Oslo, Benevento, Ghent, Toulouse, or Coimbra. Each city has its own instrument, scale, chord vocabulary, motif, and pulse. A sampling site adds a repeatable variation. The music is composed to be engaging, while the selected ecological observation remains the source of its changing character.",
          "screen", (0, 900, 1920, 1980)),
    Scene("04-data", "PUBLISHED OBSERVATIONS", "Read the waterway.",
          ("5 cities · 106 sites · 221 records", "API with saved-data fallback", "Source value and date stay visible"),
          "The app reads cities, sampling sites, and observations from the public ENORA API. The bundled snapshot examined here has five cities, one hundred and six sites, and two hundred and twenty-one observation rows. A saved copy keeps the prototype usable when the API is unavailable, and the interface tells visitors which source is displayed.",
          "screen", (0, 2700, 1920, 3780)),
    Scene("05-challenge", "GUIDED LISTENING", "Can you hear the difference?",
          ("Two Coimbra sites", "Same date and organism group", "Listen before seeing the ratings"),
          "The guided challenge compares two macroinvertebrate observations recorded in Coimbra on the same day, June sixth, twenty twenty-three. The musical palette stays in Coimbra, while ecological rating and recorded richness change. Listen to the two short pieces before we reveal which observation indicates more ecological pressure.",
          "screen", (0, 1630, 1920, 2710)),
    Scene("06-a", "COIMBRA / CLIP A", "Listen to A.",
          ("Real SongSoong audio", "12 seconds"), image="screen", crop=(0, 1630, 1920, 2710), audio=CLIP_A),
    Scene("07-b", "COIMBRA / CLIP B", "Now listen to B.",
          ("Real SongSoong audio", "12 seconds"), image="screen", crop=(0, 1630, 1920, 2710), audio=CLIP_B),
    Scene("08-reveal", "THE SOURCE RECORDS", "B shows more pressure.",
          ("A · C17 · Good · richness 39", "B · C20 · Poor · richness 17", "Both observed 6 June 2023"),
          "Clip B represents Corujeira, site C twenty, rated Poor with seventeen recorded kinds. Clip A is Conraria, site C seventeen, rated Good with thirty-nine. The poorer rating selects lower, more strained harmony and a heavier pulse; the lower richness reduces small water-drop accents. These ratings describe macroinvertebrates. They do not say whether water is safe to use.",
          "reveal"),
    Scene("09-explore", "INTERACTIVE PORTRAIT", "Hear a real sampling site.",
          ("Select an available signal", "Hear the full mix or one observation", "Open location and records"),
          "Beyond the challenge, visitors can select a real sampling site and hear its whole composition or isolate an available signal. The selected rating or value and observation date appear beside the music. They can open the site on a map and inspect the source rows. This keeps the artistic interpretation accountable to the published evidence.",
          "screen", (0, 2700, 1920, 3780)),
    Scene("10-mapping", "TRANSPARENT MAPPING", "Why does the sound change?",
          ("Biological rating → harmony", "Recorded richness → accents", "Nitrate rank → relative colour"),
          "The mapping is deliberately visible. Biological categories alter harmony, register, bass, and texture. Recorded organism richness changes accent density within its biological group. Nitrate adds a secondary colour based on its relative position in the retrieved dataset. Since the API schema does not provide a unit or safety threshold here, SongSoong never calls nitrate safe or unsafe.",
          "system"),
    Scene("11-remix", "CREATIVE EXPERIMENT", "Explore without changing evidence.",
          ("Move musical tension", "Clearly marked as hypothetical", "Return to the source record"),
          "A visitor can also move a musical-tension slider to hear a hypothetical version. The published observation never changes, and the interface labels this as a creative experiment. We separate what the data says from what the composition chooses. That boundary matters when making environmental information engaging without overstating its scientific meaning.",
          "screen", (0, 3910, 1920, 4990)),
    Scene("12-architecture", "HOW IT WORKS", "Built for an open, working demo.",
          ("ENORA API → React interface", "Tone.js synthesis in the browser", "Static deployment and data fallback"),
          "SongSoong is a React and Vite web application. Three read-only routes deliver ENORA observations; a bundled validated snapshot supplies a fallback. Tone dot J S generates the music on the listener's device, so the app does not need recorded songs for each site. Its public repository contains the mapping, automated checks, data provenance, and research paper.",
          "architecture"),
    Scene("13-participate", "FROM LISTENING TO PARTICIPATING", "The story continues.",
          ("Understand an observation", "Inspect the source", "Visit OneAquaHealth Citizen Science"),
          "The experience ends by pointing visitors to the official OneAquaHealth Citizen Science App, where they can learn about and report urban streams. SongSoong does not collect observations itself. Our next research step is a listener study with students and community groups to test whether this sound-and-evidence journey improves understanding. We have not claimed that outcome yet.",
          "screen", (0, 4400, 1920, 5480)),
    Scene("14-close", "LITTLE BOY'Z SONGSOONG", "Listen. Compare. Understand.",
          ("songsoong-mvp.vercel.app", "github.com/Little-Boy-z-SongSoong/songsoong-mvp"),
          "SongSoong turns published waterway observations into a musical invitation to learn. Listen, compare, then check the data. Every river has a melody, and every melody has a source.",
          "screen", (0, 0, 1920, 1080)),
]


def run(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def font(name: str, size: int):
    return ImageFont.truetype(str(FONT_DIR / name), size)


def draw_lines(draw, lines, x, y, fnt, fill, gap=14):
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + gap
    return y


def slide(scene: Scene, index: int):
    canvas = Image.new("RGB", (WIDTH, HEIGHT), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, WIDTH, 106), fill=GREEN)
    draw.text((72, 34), "SongSoong", font=font("georgiab.ttf", 35), fill=CREAM)
    draw.text((1540, 42), "RIVER  ·  DATA  ·  MUSIC", font=font("arialbd.ttf", 19), fill=GOLD)
    draw.rounded_rectangle((66, 160, 1255, 950), radius=28, fill=(255, 255, 255))
    if scene.image == "screen":
        source = Image.open(SOURCE_SCREEN).convert("RGB")
        content = source.crop(scene.crop)
    elif scene.image == "reveal":
        content = Image.open(ROOT / "docs/screenshots/challenge-reveal.jpg").convert("RGB")
    elif scene.image == "architecture":
        content = Image.open(ROOT / "docs/diagrams/architecture.png").convert("RGB")
    else:
        content = Image.open(ROOT / "docs/diagrams/system-design.png").convert("RGB")
    content = ImageOps.contain(content, (1150, 750), method=Image.Resampling.LANCZOS)
    canvas.paste(content, (86 + (1150 - content.width) // 2, 180 + (750 - content.height) // 2))
    draw.rounded_rectangle((1290, 160, 1850, 950), radius=28, fill=GREEN)
    draw.text((1330, 205), scene.kicker, font=font("arialbd.ttf", 21), fill=GOLD)
    wrapped_title = textwrap.wrap(scene.title, width=18)
    y = draw_lines(draw, wrapped_title, 1330, 267, font("georgia.ttf", 56), CREAM, gap=7)
    y += 38
    for point in scene.points:
        wrapped = textwrap.wrap(point, width=32)
        draw.ellipse((1331, y + 13, 1345, y + 27), fill=GOLD)
        y = draw_lines(draw, wrapped, 1365, y, font("arial.ttf", 27), CREAM, gap=4) + 21
    draw.text((78, 985), "OneAquaHealth observations · artistic interpretation, not a water-safety test", font=font("arial.ttf", 24), fill=GREEN)
    draw.text((1760, 985), f"{index:02d} / {len(SCENES):02d}", font=font("arialbd.ttf", 24), fill=GREEN)
    path = SEGMENTS / f"{scene.key}.png"
    canvas.save(path)
    return path


async def voice(scene: Scene):
    path = SEGMENTS / f"{scene.key}.mp3"
    if scene.narration and not path.exists():
        await edge_tts.Communicate(scene.narration, voice="en-US-EmmaMultilingualNeural", rate="-10%").save(str(path))
    return path


def encode(scene: Scene, image: Path, voice_path: Path):
    target = SEGMENTS / f"{scene.key}.mp4"
    audio_path = scene.audio or voice_path
    length = duration(audio_path) + (0.55 if scene.audio else 1.15)
    audio_filter = "volume=14dB,alimiter=limit=0.93" if scene.audio else "loudnorm=I=-18:TP=-2:LRA=9"
    run("ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", str(image),
        "-i", str(audio_path), "-vf", f"fade=t=in:st=0:d=0.35,fade=t=out:st={length-0.35:.2f}:d=0.35,format=yuv420p",
        "-af", audio_filter, "-c:v", "libx264", "-preset", "veryfast", "-crf", "25", "-c:a", "aac", "-b:a", "160k",
        "-ar", "48000", "-ac", "2", "-t", f"{length:.3f}", "-shortest", "-movflags", "+faststart", str(target))
    print(scene.key, round(length, 1), "seconds")
    return target


async def main():
    if not SOURCE_SCREEN.exists() or not CLIP_A.exists() or not CLIP_B.exists():
        raise RuntimeError("Need the full-page UI screenshot and both real audio clips")
    SEGMENTS.mkdir(parents=True, exist_ok=True)
    parts = []
    for index, scene in enumerate(SCENES, 1):
        image = slide(scene, index)
        voice_path = await voice(scene)
        parts.append(encode(scene, image, voice_path))
    concat_file = SEGMENTS / "concat.txt"
    concat_file.write_text("".join(f"file '{part.as_posix()}'\n" for part in parts), encoding="utf-8")
    untrimmed = OUT / "SongSoong_Devpost_Demo_untrimmed.mp4"
    run("ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-c", "copy", "-movflags", "+faststart", str(untrimmed))
    target = ROOT / "demo/SongSoong_Devpost_Demo.mp4"
    target.parent.mkdir(parents=True, exist_ok=True)
    run("ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(untrimmed),
        "-filter_complex", "[0:v]setpts=0.95*PTS[v];[0:a]atempo=1.0526316[a]",
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(target))
    print("Wrote", target, "duration", round(duration(target), 1), "seconds")


if __name__ == "__main__":
    asyncio.run(main())
