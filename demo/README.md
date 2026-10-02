# SongSoong Devpost demo

The [4:48 demo video](../public-live/demo/songsoong-demo.mp4) presents the
working UI, data-to-music mapping, real Coimbra A/B sound clips, source
observations, system architecture, and the route to OneAquaHealth's official
Citizen Science App. The English narration uses a synthetic voice.

The two `.webm` files in `assets/` were recorded directly from SongSoong's
`AudioEngine.js` and the bundled ENORA observations: A is C17, record 786
(Good, richness 39); B is C20, record 790 (Poor, richness 17). They are
application-generated music, not field recordings. The `full-page-ui.jpg`
asset is a screenshot of the working application. The area photographs
visible in that screenshot are credited in `PHOTO_SOURCES.md`.

`scripts/build-demo-video.py` assembles the video from these assets, the
existing repository diagrams and a generated narration. It requires Python
with Pillow and edge-tts, plus FFmpeg. The generated segment files are
ignored by Git. The video reports implementation behavior only; no listener
study or water-safety claim is implied.
