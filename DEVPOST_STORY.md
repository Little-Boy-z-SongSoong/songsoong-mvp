## Inspiration

OneAquaHealth publishes valuable observations about urban waterways, but ecological ratings in a table can feel distant to people who do not work with environmental data. We wanted to create a memorable first encounter with those records: listen to a waterway, notice a difference, then discover the evidence behind it. Music gives each place a voice while the published observation remains visible and checkable.

## What it does

Little Boy'z SongSoong turns published ENORA observations from Oslo, Benevento, Ghent, Toulouse, and Coimbra into interactive musical portraits. Visitors choose a real sampling site and hear a composition shaped by its available ecological signals. Biological ratings influence musical tension; recorded organism richness changes the density of water-drop accents. Each city has its own instrument, scale, chords, melody, and rhythm. Visitors can isolate a signal, see its value and observation date, open the site on a map, and try a clearly labelled hypothetical remix.

The guided **Hear the difference** challenge makes the idea tangible in about a minute. Listeners compare two invertebrate observations from Coimbra on the same day, guess which suggests greater ecological pressure, then reveal the records: Conraria (C17) is rated Good with richness 39; Corujeira (C20) is rated Poor with richness 17. The experience closes with a link to OneAquaHealth's official Citizen Science App for people who want to learn about and observe waterways themselves.

## How we built it

We built the bilingual interface with React and Vite and synthesize music locally in the browser with Tone.js. The app reads three public ENORA API routes for cities, sampling sites, and observations through same-origin Vercel rewrites. A bundled snapshot of those same records keeps the experience available when the API cannot be reached, and the interface shows which source it is using. The dataset currently contains 5 cities, 106 sites, and 221 observations.

![SongSoong system architecture: ENORA data, Vercel delivery, and in-browser music](https://raw.githubusercontent.com/Little-Boy-z-SongSoong/songsoong-mvp/main/docs/diagrams/architecture.png)

Our mapping is intentionally inspectable. Published biological quality categories select a musical condition; richness controls accent density; and city-specific scores keep places recognisably different. Nitrate adds only a subtle texture based on its relative rank in the retrieved dataset. Automated checks cover the mapping, five city profiles, and the real records used in the listening challenge. We use credited OneAquaHealth area photographs rather than presenting them as images of individual sampling sites.

![SongSoong system design: ecological observations mapped to distinct musical features](https://raw.githubusercontent.com/Little-Boy-z-SongSoong/songsoong-mvp/main/docs/diagrams/system-design.png)

## Challenges we ran into

We had to make the compositions pleasant to hear while ensuring that different cities and ecological conditions did not collapse into the same tune. We also needed a reliable way to use the public API in a browser and to keep the prototype usable if it was temporarily unavailable. Most importantly, the data required careful interpretation: biological ratings apply to the organism group measured, observations at one site may have different dates, and the API schema we used does not state a nitrate unit or safety threshold. We therefore show source values and dates, treat nitrate as relative, and avoid claiming that the music is a live measurement or a water-safety test.

## Accomplishments that we're proud of

We created five distinct musical identities tied to real OneAquaHealth locations, with a traceable path from a selected observation to the sound and its explanation. The Coimbra A/B challenge lets someone hear a contrast, make a guess, and immediately inspect the Good/Poor ratings and richness values that shaped it. The experience works in English and Vietnamese, includes a visible API/snapshot status, and connects curiosity to OneAquaHealth's citizen-science work.

## What we learned

Sonification is more useful when people can check why something sounds different. A beautiful track alone does not explain an ecological observation; the comparison, date, rating, and transparent mapping make the sound meaningful. We also learned to separate artistic choices from scientific claims: a composed city theme and a relative nitrate texture are storytelling tools, not official water-quality scores.

## What's next for Little Boy'z SongSoong

We want to test the guided listening experience with students and community groups to see whether it improves understanding of ecological ratings and encourages people to inspect the original records. With suitable additional observations, we could add more matched listening stories and shareable comparisons for educators. We have not yet measured those learning or participation outcomes.

**Live prototype:** https://songsoong-mvp.vercel.app/

**Source code:** https://github.com/Little-Boy-z-SongSoong/songsoong-mvp
