"""Make a compact favicon from the user-supplied Little Boy'z artwork."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / "branding/little-boyz-original.png").convert("RGB")

# The full illustration has text that becomes unreadable at favicon size.
# Keep the face and water motif, with the white area confined to a circle.
portrait = source.crop((205, 185, 815, 605))
portrait.thumbnail((252, 210), Image.Resampling.LANCZOS)

icon = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
circle = Image.new("L", icon.size, 0)
ImageDraw.Draw(circle).ellipse((2, 2, 254, 254), fill=255)

artwork = Image.new("RGBA", icon.size, "white")
artwork.paste(portrait, ((256 - portrait.width) // 2, (256 - portrait.height) // 2))
icon.paste(artwork, (0, 0), circle)
icon.save(ROOT / "public-live/favicon.png", optimize=True)
