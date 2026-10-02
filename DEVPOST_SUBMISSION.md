# SongSoong — submission draft

Track 4: Awareness & Storytelling · OneAquaHealth IEEE Global Hackathon 2026

Live prototype: https://songsoong-mvp.vercel.app/  
Source code: https://github.com/Little-Boy-z-SongSoong/songsoong-mvp
Demo video (4:48): https://songsoong-mvp.vercel.app/demo/songsoong-demo.mp4

Screenshots from the live prototype: [opening screen](docs/screenshots/hero.jpg) · [listening challenge and source values](docs/screenshots/challenge-reveal.jpg)

Presentation diagrams: [system architecture](docs/diagrams/architecture.png) · [data-to-music system design](docs/diagrams/system-design.png)

The exact Markdown prepared for Devpost's **Project Story** field is in [DEVPOST_STORY.md](DEVPOST_STORY.md).

## Short pitch

What if a river's ecological observations could be heard? SongSoong turns published OneAquaHealth data from five European cities into distinct, interactive musical portraits. Listeners can compare two real observations, guess what the difference means, and inspect the records behind the sound.

## Project description

### Problem and audience

Freshwater monitoring results can be hard for people outside research to engage with. A table of ecological ratings and organism richness says little to a curious resident, student, or community educator unless someone explains what those measures describe. SongSoong is an awareness tool for those audiences: it offers a memorable way into the data and then lets them check the underlying observations.

### What SongSoong does

Visitors choose among Oslo, Benevento, Ghent, Toulouse, and Coimbra, then select a real sampling site. The app turns available biological ratings into harmonic character and pulse, recorded organism richness into the density of small sound accents, and nitrate into a relative tonal colour. Each city has its own composition, rhythm, and lead sound. Visitors can isolate a signal, inspect its value and observation date, try a clearly marked hypothetical remix, and open the site on a map.

At the end of the experience, visitors can follow a clearly labelled link to the official OneAquaHealth Citizen Science App to continue learning and contribute their own observations. SongSoong itself does not collect or submit observations.

A guided listening challenge asks visitors to hear two Coimbra invertebrate observations collected on 6 June 2023. Conraria (C17, record 786) is rated Good with recorded richness 39; Corujeira (C20, record 790) is rated Poor with recorded richness 17. After hearing A and B, the visitor guesses which rating indicates greater ecological pressure. The reveal shows the actual records and explains the musical differences. This interaction gives a short, repeatable way to introduce both the sound and its scientific limits.

### Data and technical approach

SongSoong is a React web app with music synthesized in the browser through Tone.js. It reads the ENORA API supplied for the hackathon through same-origin Vercel rewrites. A bundled snapshot of the same public data keeps the prototype usable if the API is temporarily unavailable. The current dataset contains 5 cities, 106 sites, and 221 observations. The interface tells visitors whether it has connected to the API or is showing saved data. The source code, mapping rules, and data provenance are public in the repository.

The music is a transparent artistic interpretation of historical observations. A biological rating applies to the organism group measured. Nitrate is represented by its relative rank within the dataset because the published API does not specify a unit or safety threshold for that field. SongSoong does not diagnose drinking-water safety, claim live monitoring, or infer a trend from isolated observations.

### Intended impact and next steps

The intended outcome is that more people can notice ecological differences, understand what a biological rating refers to, and become curious enough to examine the original data. This is a prototype; those learning and engagement outcomes have not yet been measured. A next iteration could test comprehension with students and community groups, add more guided stories as suitable observations become available, and let educators share a selected musical comparison with a source link.

## Demo video script (3–5 minutes)

Record the browser with sound enabled. Use English, the default language. The timings allow about 20 seconds for transitions and narration.

| Time | On screen | Suggested narration |
| --- | --- | --- |
| 0:00–0:25 | Open the live prototype. Show the hero, OneAquaHealth credit, and five city choices. | “Water monitoring data is valuable, but it can feel distant. SongSoong lets people hear real observations, then see what created the music.” |
| 0:25–1:20 | Click **Hear the difference**. Play A and B for several seconds each. | “These are two invertebrate observations from Coimbra on the same day. The compositions use the same city palette, so the ecological rating and recorded richness drive the contrast.” |
| 1:20–1:55 | Choose B. Show the reveal and point to C17 Good/39 and C20 Poor/17. | “B represents the Poor rating. The melody is lower and the pulse is heavier; the lower recorded richness reduces the small sound accents. The result describes this organism group, not whether the water is safe to use.” |
| 1:55–2:55 | Click **Explore C20 record**. Show its rating, date, sound explanation, and source records. Isolate another available signal and play the observation. | “Every musical choice leads back to a published observation. Visitors can separate signals rather than taking one composition as a single official quality score.” |
| 2:55–3:35 | Select another city, play its composition, and show its different character. Move the remix slider, then return to source data. | “Each city has a distinct musical voice. The remix invites exploration, but is explicitly hypothetical; it never changes the source value.” |
| 3:35–4:10 | Show the mapping cards, the official citizen science link, and API/photo credits. Optionally switch to Vietnamese and back. | “The mapping is visible, the interface supports English and Vietnamese, and listeners can continue with OneAquaHealth’s citizen science app.” |

The repository includes a 4:48 narrated demo with two audio clips captured from SongSoong itself. The direct MP4 above is a fallback link; Devpost's embedded video field still needs an accepted video-host link. Confirm the live site and video open in an incognito window before final submission.

### Record the demo on Windows with the real music

1. Open the live prototype in a maximized browser window. Check that **Listen to A** and **Listen to B** are audible before recording.
2. Press **Windows + G**, open **Settings → Capturing**, and choose **All** for audio so the recording includes the computer's sound. Make a short trial clip and listen back to confirm the music is present.
3. Press **Windows + Alt + R** to start recording. Follow the timeline above. Use **Windows + Alt + M** if you need to toggle microphone narration. Press **Windows + Alt + R** again to stop.
4. Find the MP4 in **Videos/Captures**. Watch the full file before uploading: verify that A and B sound different, the Good/Poor and 39/17 values are readable, no notifications or private tabs appear, and the total length is 3–5 minutes.

Windows recording steps: https://support.microsoft.com/en-us/accessibility/windows/use-a-screen-reader-to-record-your-screen-with-xbox-game-bar

Official submission requirements: https://oneaquahealth-ieee-hackathon.devpost.com/
