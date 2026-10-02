## Inspiration

Urban freshwater research produces observations that matter to communities, but a table of ecological ratings rarely feels like a story. For Track 4, we wanted to give a resident, student, or educator a reason to pause, listen, and then look more closely at the source. SongSoong asks: what if each waterway's published observations could shape a distinct piece of music?

## What it does

SongSoong is a bilingual interactive soundscape built from OneAquaHealth observations published through the ENORA API. Choose a sampling site in Oslo, Benevento, Ghent, Toulouse, or Coimbra to hear its available ecological signals. Biological ratings change the harmony, pitch, and pulse; recorded organism richness changes the density of small water-drop accents. Nitrate changes a relative tonal colour. Each city has its own musical theme. Visitors can isolate a signal, inspect the published value and date, and try a clearly labelled hypothetical remix without changing the source record.

The guided **Hear the difference** experience makes the idea testable in about a minute. Two Coimbra invertebrate observations from the same day produce clips A and B. After guessing which rating reflects greater ecological pressure, the listener sees the real records: Conraria C17 is rated Good with richness 39, while Corujeira C20 is rated Poor with richness 17. The reveal explains why the music differs and links back to the selected record. The journey ends with a link to OneAquaHealth's official Citizen Science App for people who want to observe and learn about their own waterways.

## How we built it

We built the interface with React and Vite and synthesize the music in the browser with Tone.js. The app reads three public ENORA endpoints for cities, sites, and observations through same-origin Vercel rewrites. A bundled snapshot of those same public records keeps the story available if the API is temporarily unavailable. The current published dataset contains 5 cities, 106 sampling sites, and 221 observations. The interface shows whether it is using the API or saved data.

![SongSoong system architecture: ENORA data, Vercel delivery, and in-browser music](https://raw.githubusercontent.com/Little-Boy-z-SongSoong/songsoong-mvp/main/docs/diagrams/architecture.png)

The mapping is deliberately inspectable: quality ratings set an ecological musical condition, recorded richness controls accent density, and city-specific scores create different instruments, rhythms, melodies, and chords. Automated checks cover the biological mapping, the five distinct city scores, and the two real records in the listening challenge.

![SongSoong system design: ecological observations mapped to distinct musical features](https://raw.githubusercontent.com/Little-Boy-z-SongSoong/songsoong-mvp/main/docs/diagrams/system-design.png)

## Challenges and what we learned

The hardest design problem was making ecological differences audible without turning an artistic interpretation into a false scientific claim. The ENORA API does not specify a nitrate unit or safety threshold in the schema we used, so SongSoong uses nitrate only as a relative rank within the dataset. Biological ratings refer to the organism group measured; observations at a site may come from different dates. The music is based on historical records, not live monitoring, a drinking-water safety test, or an official quality score. We learned that sonification is most useful when listeners can see the exact observation and the rule behind a sound.

## What is next

We would test whether the listening comparison helps students and community groups understand the meaning and limits of ecological ratings. With more suitable observations, we could add further matched listening stories and ways for educators to share a selected comparison with its source link. We have not yet measured learning or participation outcomes.

**Live prototype:** https://songsoong-mvp.vercel.app/

**Source code:** https://github.com/Little-Boy-z-SongSoong/songsoong-mvp
