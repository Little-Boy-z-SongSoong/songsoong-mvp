import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Compass, Droplets, Fish, Leaf, MapPin, Pause, Play, RefreshCw, Waves } from 'lucide-react';
import { t } from './i18n';
import { CITIES, getCityById } from './data/cities';
import { CITY_PRESENTATION, citySummary, compositionForSite, fallbackOverview, fetchOverview, formatObservationDate, observationsForSite, signalsForSite, siteOptions } from './data/enora';
import { listeningChallengePair } from './data/listeningChallenge';
import AudioEngine from './audio/AudioEngine';
import AudioVisualizer from './components/AudioVisualizer';

const signalIcons = { fish: Fish, macro: Leaf, diatoms: Waves, nitrate: Droplets };
const signalOrder = ['macro', 'diatoms', 'fish', 'nitrate'];
const number = (value, lang) => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', { maximumFractionDigits: 3 }).format(value);

function signalName(lang, kind) { return t(lang, `signal_${kind}`); }
function qualityName(lang, quality) { return t(lang, `quality_${quality}`); }
function stressMood(stress) { return stress < 0.34 ? 'gentle' : stress < 0.66 ? 'shifting' : 'tense'; }

function rowSummary(row, lang) {
  const parts = [];
  if (row.fishQuality) parts.push(`${signalName(lang, 'fish')}: ${qualityName(lang, row.fishQuality)}`);
  if (row.macroinvertebratesQuality) parts.push(`${signalName(lang, 'macro')}: ${qualityName(lang, row.macroinvertebratesQuality)}`);
  if (row.diatomsQuality) parts.push(`${signalName(lang, 'diatoms')}: ${qualityName(lang, row.diatomsQuality)}`);
  if (Number.isFinite(row.nitrate)) parts.push(`${signalName(lang, 'nitrate')}: ${number(row.nitrate, lang)}`);
  return parts.join(' · ');
}

function DataBadge({ source, lang }) {
  return <span className={`data-badge ${source === 'api' ? 'is-current' : ''}`}>
    <span className="data-badge-dot" />
    {t(lang, source === 'api' ? 'apiConnected' : 'savedSnapshot')}
  </span>;
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [overview, setOverview] = useState(fallbackOverview);
  const [cityId, setCityId] = useState('ghent');
  const [siteCode, setSiteCode] = useState(null);
  const [signalKind, setSignalKind] = useState('site');
  const [remixStress, setRemixStress] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyserData, setAnalyserData] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [challengeClip, setChallengeClip] = useState(null);
  const [challengeGuess, setChallengeGuess] = useState(null);
  const [challengeAudioError, setChallengeAudioError] = useState(false);
  const audioRef = useRef(null);
  const challengeClipRef = useRef(null);
  const challengeTimerRef = useRef(null);
  const audioBusyRef = useRef(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t(lang, 'pageTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t(lang, 'pageDescription'));
  }, [lang]);

  const city = getCityById(cityId);
  const cityVisual = CITY_PRESENTATION[cityId];
  const sites = useMemo(() => siteOptions(overview, cityId), [overview, cityId]);
  const site = sites.find((item) => item.code === siteCode) || sites[0];
  const records = useMemo(() => observationsForSite(overview, site?.code), [overview, site?.code]);
  const signals = useMemo(() => signalsForSite(overview, site?.code), [overview, site?.code]);
  const siteComposition = useMemo(() => compositionForSite(signals), [signals]);
  const signal = signalKind === 'site' && siteComposition?.basis === 'nitrate'
    ? signals.find((item) => item.kind === 'nitrate')
    : signalKind === 'site' ? siteComposition : signals.find((item) => item.kind === signalKind) || siteComposition;
  const stress = remixStress ?? signal?.stress ?? 0.5;
  const richness = signal?.layerDensity ?? 0.4;
  const nitrateRank = signal?.kind === 'site' || signal?.kind === 'nitrate' ? signal?.percentile ?? null : null;
  const mood = stressMood(stress);
  const nitrateOnly = signal?.kind === 'nitrate' || signal?.basis === 'nitrate';
  const compositionTitle = nitrateOnly
    ? remixStress === null
      ? `nitrateMood_${nitrateRank < 0.34 ? 'low' : nitrateRank < 0.67 ? 'middle' : 'high'}`
      : `remixMood_${mood}`
    : `mood_${mood}`;
  const condition = remixStress === null && nitrateOnly ? 'nitrate' : mood;
  const conditionText = remixStress !== null ? `remixConditionText_${mood}` : signal?.kind === 'site' && !nitrateOnly ? `siteConditionText_${mood}` : `conditionText_${condition}`;
  const stats = useMemo(() => citySummary(overview, cityId), [overview, cityId]);
  const challengePair = useMemo(() => listeningChallengePair(overview, fallbackOverview), [overview]);

  useEffect(() => {
    let mounted = true;
    fetchOverview().then((data) => { if (mounted) setOverview(data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    audioRef.current = new AudioEngine();
    return () => { clearTimeout(challengeTimerRef.current); audioRef.current?.dispose(); };
  }, []);

  useEffect(() => { audioRef.current?.setCity(city); }, [city]);
  useEffect(() => { audioRef.current?.setSite(site?.code); }, [site?.code]);
  useEffect(() => {
    if (isPlaying && !challengeClipRef.current && audioRef.current?.isPlaying) audioRef.current.setLiveParams(stress, richness, nitrateRank);
  }, [isPlaying, stress, richness, nitrateRank]);

  useEffect(() => {
    let frame;
    const tick = () => {
      if (audioRef.current?.isPlaying) setAnalyserData(audioRef.current.getFFTData());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const stopChallenge = useCallback(() => {
    clearTimeout(challengeTimerRef.current);
    if (challengeClipRef.current && audioRef.current?.isPlaying) audioRef.current.stop();
    challengeClipRef.current = null;
    setChallengeClip(null);
  }, []);

  const changeCity = useCallback((id) => {
    stopChallenge();
    setCityId(id);
    setSiteCode(null);
    setSignalKind('site');
    setRemixStress(null);
    setShowAllRecords(false);
  }, [stopChallenge]);

  const changeSite = useCallback((code) => {
    stopChallenge();
    setSiteCode(code);
    setSignalKind('site');
    setRemixStress(null);
    setShowAllRecords(false);
  }, [stopChallenge]);

  const changeSignal = useCallback((kind) => {
    stopChallenge();
    setSignalKind(kind);
    setRemixStress(null);
  }, [stopChallenge]);

  const playChallenge = useCallback(async (key) => {
    const clip = challengePair?.find((item) => item.key === key);
    if (!clip || !audioRef.current || audioBusyRef.current) return;
    if (challengeClipRef.current === key) { stopChallenge(); return; }
    audioBusyRef.current = true;
    try {
      setChallengeAudioError(false);
      stopChallenge();
      if (audioRef.current.isPlaying) audioRef.current.stop();
      setIsPlaying(false);
      await audioRef.current.init();
      audioRef.current.setCity(getCityById('coimbra'));
      audioRef.current.setSite(clip.code);
      audioRef.current.start(clip.signal.stress, clip.signal.layerDensity);
      challengeClipRef.current = key;
      setChallengeClip(key);
      challengeTimerRef.current = setTimeout(() => {
        if (challengeClipRef.current === key) stopChallenge();
      }, 12000);
    } catch {
      stopChallenge();
      setChallengeAudioError(true);
    } finally {
      audioBusyRef.current = false;
    }
  }, [challengePair, stopChallenge]);

  const toggleAudio = useCallback(async () => {
    if (!signal || !audioRef.current || audioBusyRef.current) return;
    audioBusyRef.current = true;
    try {
      setAudioError(false);
      if (challengeClipRef.current) stopChallenge();
      await audioRef.current.init();
      audioRef.current.setCity(city);
      audioRef.current.setSite(site?.code);
      if (isPlaying && audioRef.current.isPlaying) {
        audioRef.current.stop();
        setIsPlaying(false);
      } else {
        if (audioRef.current.isPlaying) audioRef.current.stop();
        audioRef.current.start(stress, richness, nitrateRank);
        setIsPlaying(true);
      }
    } catch {
      setAudioError(true);
      setIsPlaying(false);
    } finally {
      audioBusyRef.current = false;
    }
  }, [city, site?.code, signal, stress, richness, nitrateRank, isPlaying, stopChallenge]);

  const revealChallenge = useCallback((key) => {
    stopChallenge();
    setChallengeGuess(key);
  }, [stopChallenge]);

  const exploreChallengeSite = useCallback((code) => {
    stopChallenge();
    if (audioRef.current?.isPlaying) audioRef.current.stop();
    setIsPlaying(false);
    setCityId('coimbra');
    setSiteCode(code);
    setSignalKind('macro');
    setRemixStress(null);
  }, [stopChallenge]);

  const siteMap = site ? `https://www.openstreetmap.org/?mlat=${site.latitude}&mlon=${site.longitude}#map=15/${site.latitude}/${site.longitude}` : '#';
  const activeQuality = signal?.quality ? qualityName(lang, signal.quality) : null;

  return <div className="app-shell" style={{ '--city-accent': city.colors.accent, '--city-photo': `url(${cityVisual.photo})` }}>
    <a className="skip-link" href="#top">{t(lang, 'skipToContent')}</a>
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#top" className="brand" aria-label="SongSoong">
          <span className="brand-icon"><img src="/favicon.png" alt="" /></span>
          <span><strong>SongSoong</strong><small>{t(lang, 'brandLine')}</small></span>
        </a>
        <div className="header-actions">
          <DataBadge source={overview.source} lang={lang} />
          <button type="button" className="language-button" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} aria-label={t(lang, 'changeLanguage')}>
            {lang === 'vi' ? 'EN' : 'VI'}
          </button>
        </div>
      </div>
    </header>

    <main id="top" tabIndex={-1}>
      <section className="story-hero" aria-labelledby="hero-title">
        <img className="story-hero-photo" src={cityVisual.photo} alt={cityVisual.photoAlt[lang]} />
        <div className="story-hero-overlay" />
        <div className="story-hero-content">
          <div className="eyebrow light"><span className="eyebrow-line" /> {t(lang, 'heroEyebrow')}</div>
          <h1 id="hero-title">{t(lang, 'heroTitleA')}<br /><em>{t(lang, 'heroTitleB')}</em></h1>
          <p>{t(lang, 'heroDescription')}</p>
          <a className="hero-project" href="https://www.oneaquahealth.eu/oneaquahealth-ieee-global-hackathon/" target="_blank" rel="noreferrer">
            <span className="hero-project-copy"><strong><span>OneAquaHealth × IEEE</span>{' '}<span>Global Hackathon 2026</span></strong><span>{t(lang, 'heroProjectTrack')}</span></span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={toggleAudio} disabled={!signal}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {t(lang, isPlaying ? 'pause' : 'listenNow')}
            </button>
            <a href="#listen-challenge" className="button button-outline">{t(lang, 'tryChallenge')} <ArrowDown size={17} /></a>
          </div>
          <div className="hero-flow" aria-label={t(lang, 'flowLabel')}>
            <span>{t(lang, 'flow1')}</span><ArrowRight size={15} /><span>{t(lang, 'flow2')}</span><ArrowRight size={15} /><span>{t(lang, 'flow3')}</span>
          </div>
        </div>
        <div className="photo-credit">{t(lang, 'photoCredit')} <a href={cityVisual.source} target="_blank" rel="noreferrer">OneAquaHealth <ArrowUpRight size={12} /></a></div>
      </section>

      <div className="content-container">
        <section className="city-section" aria-labelledby="cities-title">
          <div className="section-heading compact">
            <div><span className="eyebrow">{t(lang, 'choosePlace')}</span><h2 id="cities-title">{t(lang, 'fivePlaces')}</h2></div>
            <p>{t(lang, 'citiesDescription')}</p>
          </div>
          <div className="city-list">
            {CITIES.map((item) => {
              const visual = CITY_PRESENTATION[item.id];
              const count = citySummary(overview, item.id).sites;
              return <button key={item.id} type="button" className={`city-choice ${item.id === cityId ? 'selected' : ''}`} onClick={() => changeCity(item.id)} aria-pressed={item.id === cityId}>
                <img src={visual.photo} alt="" />
                <span className="city-choice-text"><small>{item.countryCode} · {count} {t(lang, 'sitesShort')}</small><strong>{item.name[lang]}</strong></span>
                <ArrowUpRight size={16} />
              </button>;
            })}
          </div>
        </section>

        <section className="project-section" aria-labelledby="project-title">
          <div><span className="eyebrow">{t(lang, 'projectEyebrow')}</span><h2 id="project-title">{t(lang, 'projectTitle')}</h2></div>
          <div className="project-story"><p>{t(lang, 'projectDescription')}</p><div className="project-links"><a href="https://www.oneaquahealth.eu/" target="_blank" rel="noreferrer">{t(lang, 'projectLink')} <ArrowUpRight size={15} aria-hidden="true" /></a><a href="https://api.enora-oah.eu/swagger-ui/index.html" target="_blank" rel="noreferrer">{t(lang, 'projectDataLink')} <ArrowUpRight size={15} aria-hidden="true" /></a></div></div>
        </section>

        <section id="listen-challenge" className="challenge-section" aria-labelledby="challenge-title">
          <div className="section-heading"><div><span className="eyebrow">{t(lang, 'challengeEyebrow')}</span><h2 id="challenge-title">{t(lang, 'challengeTitle')}</h2></div><p>{t(lang, 'challengeDescription')}</p></div>
          <div className="challenge-panel">
            <div className="challenge-topline"><span>{t(lang, 'challengeContext')}</span><span>01 / 03</span></div>
            <div className="challenge-grid">
              {challengePair?.map((clip) => <article key={clip.key} className={`challenge-card ${challengeClip === clip.key ? 'is-playing' : ''}`}>
                <div className="challenge-card-top"><span className="challenge-letter">{clip.key}</span><span className="challenge-record-label">{challengeGuess ? `${t(lang, 'challengeRating')}: ${qualityName(lang, clip.signal.quality)}` : t(lang, 'challengeHidden')}</span></div>
                <AudioLines size={38} strokeWidth={1.3} aria-hidden="true" />
                <button type="button" className="challenge-play" onClick={() => playChallenge(clip.key)} aria-pressed={challengeClip === clip.key}>
                  {challengeClip === clip.key ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  {t(lang, challengeClip === clip.key ? 'challengePause' : 'challengeListen')} {clip.key}
                </button>
                <div className="challenge-record">{challengeGuess ? <><strong>{clip.site.name} · {clip.code}</strong><span>{t(lang, 'challengeRichness')}: {number(clip.signal.richness, lang)} · {formatObservationDate(clip.row.date, lang)}</span></> : <span>{t(lang, 'challengeRecordPrompt')}</span>}</div>
              </article>)}
            </div>
            <p className="challenge-audio-note">{t(lang, 'challengeAudioNote')}</p>
            {challengeAudioError && <p className="audio-error" role="alert">{t(lang, 'audioError')}</p>}
            {!challengeGuess ? <div className="challenge-decision">
              <div><span className="eyebrow light">02 / 03 · {t(lang, 'challengeGuessEyebrow')}</span><h3>{t(lang, 'challengeQuestion')}</h3></div>
              <div className="challenge-choices"><button type="button" onClick={() => revealChallenge('A')}>{t(lang, 'challengeChoose')} A</button><button type="button" onClick={() => revealChallenge('B')}>{t(lang, 'challengeChoose')} B</button></div>
            </div> : <div className="challenge-reveal" role="status">
              <span className="eyebrow">03 / 03 · {t(lang, 'challengeRevealEyebrow')}</span>
              <h3>{t(lang, challengeGuess === 'B' ? 'challengeCorrect' : 'challengeAnswer')} <strong>B · {challengePair?.[1]?.site.name}</strong></h3>
              <p>{t(lang, 'challengeExplanation')} {challengePair?.[0]?.signal.richness} {t(lang, 'challengeVersus')} {challengePair?.[1]?.signal.richness} {t(lang, 'challengeRecordedKinds')}</p>
              <p className="challenge-caveat">{t(lang, 'challengeCaveat')}</p>
              <div className="challenge-links"><button type="button" onClick={() => { setChallengeGuess(null); stopChallenge(); }}>{t(lang, 'challengeRetry')}</button><a href="#explore" onClick={() => exploreChallengeSite('C20')}>{t(lang, 'challengeExplore')} <ArrowRight size={14} /></a><a href="https://www.oneaquahealth.eu/project-solutions/" target="_blank" rel="noreferrer">{t(lang, 'challengeLearnMore')} <ArrowUpRight size={14} /></a></div>
            </div>}
          </div>
        </section>

        <section id="explore" className="explore-section" aria-labelledby="explore-title">
          <div className="section-heading">
            <div><span className="eyebrow">{t(lang, 'exploreEyebrow')}</span><h2 id="explore-title">{t(lang, 'exploreTitle')}</h2></div>
            <p>{t(lang, 'exploreDescription')}</p>
          </div>

          <div className="explore-grid">
            <div className="landscape-panel">
              <div className="landscape-photo" style={{ backgroundImage: `linear-gradient(180deg, rgba(12,43,40,.08), rgba(4,28,28,.92)), url(${cityVisual.photo})` }} />
              <div className="landscape-topline"><span><MapPin size={15} /> {t(lang, 'photoArea')} {city.name[lang]}</span><span>OneAquaHealth</span></div>
              <div className="landscape-content">
                <span className="eyebrow light">{t(lang, 'currentComposition')}</span>
                <h3>{t(lang, compositionTitle)}</h3>
                <p>{signal ? signal.kind === 'site' ? `${signalName(lang, 'site')} · ${signal.signalCount} ${t(lang, 'available')}` : `${signalName(lang, signal.kind)} · ${formatObservationDate(signal.date, lang)}` : t(lang, 'noObservation')}</p>
                <span className="city-voice">{t(lang, `cityVoice_${cityId}`)}</span>
                <div className="sound-visual"><AudioVisualizer analyserData={analyserData} pollution={stress} cityBarColors={city.colors.barColor} /></div>
                <div className="landscape-bottom"><AudioLines size={16} /> {t(lang, remixStress === null ? 'dataLedMusic' : 'remixMusic')}</div>
              </div>
            </div>

            <div className="reading-panel">
              <div className="panel-header"><span className="eyebrow">{t(lang, 'fieldReading')}</span><span className="panel-index">01 / 03</span></div>
              <h3>{t(lang, 'selectReading')}</h3>
              <label className="select-label" htmlFor="site-select">{t(lang, 'sampleSite')}</label>
              <select id="site-select" value={site?.code || ''} onChange={(event) => changeSite(event.target.value)}>
                {sites.map((item) => <option key={item.code} value={item.code} disabled={item.signalCount === 0}>{item.code} — {item.name}{item.signalCount === 0 ? ` (${t(lang, 'noDataShort')})` : ''}</option>)}
              </select>
              {site && <div className="site-location"><Compass size={14} /><span>{site.latitude.toFixed(4)}°, {site.longitude.toFixed(4)}°</span><a href={siteMap} target="_blank" rel="noreferrer">{t(lang, 'viewMap')} <ArrowUpRight size={13} /></a></div>}

              <div className="signal-title"><span>{t(lang, 'chooseSignal')}</span><span>{signals.length} {t(lang, 'available')}</span></div>
              <div className="signal-grid" role="group" aria-label={t(lang, 'chooseSignal')}>
                {siteComposition?.basis !== 'nitrate' && <button type="button" className={`signal-choice signal-choice-site ${signal?.kind === 'site' ? 'selected' : ''}`} disabled={!siteComposition} onClick={() => changeSignal('site')} aria-pressed={signal?.kind === 'site'}>
                  <Waves size={17} /> <span>{signalName(lang, 'site')}</span><small>{t(lang, 'siteMixHint')}</small>
                </button>}
                {signalOrder.map((kind) => {
                  const available = signals.find((item) => item.kind === kind);
                  const Icon = signalIcons[kind];
                  return <button key={kind} type="button" className={`signal-choice ${signal?.kind === kind ? 'selected' : ''}`} disabled={!available} onClick={() => changeSignal(kind)} aria-pressed={signal?.kind === kind}>
                    <Icon size={17} /> <span>{signalName(lang, kind)}</span>
                  </button>;
                })}
              </div>

              {signal ? <div className="reading-result">
                {signal.kind === 'site' ? <>
                  <div><span className="reading-label">{t(lang, 'signalsInMix')}</span><strong>{signal.signalCount} / 4</strong></div>
                  <div><span className="reading-label">{t(lang, 'latestInMix')}</span><strong>{formatObservationDate(signal.date, lang)}</strong></div>
                </> : <>
                  <div><span className="reading-label">{t(lang, 'reportedValue')}</span><strong>{activeQuality || number(signal.value, lang)}</strong></div>
                  <div><span className="reading-label">{t(lang, 'observationDate')}</span><strong>{formatObservationDate(signal.date, lang)}</strong></div>
                  {signal.richness !== null && <div><span className="reading-label">{t(lang, 'richness')}</span><strong>{number(signal.richness, lang)}</strong></div>}
                </>}
              </div> : <p className="empty-reading">{t(lang, 'noObservation')}</p>}
              {signal && <div className="sound-reading" aria-live="polite">
                <span className="eyebrow">{t(lang, 'soundCondition')}</span>
                <strong>{t(lang, `condition_${condition}`)}</strong>
                <p>{t(lang, conditionText)}</p>
                {(!nitrateOnly || remixStress !== null) && <div className="sound-scale" aria-hidden="true">
                  {['gentle', 'shifting', 'tense'].map((part) => <span key={part} className={mood === part ? 'active' : ''}>{t(lang, `soundScale${part === 'gentle' ? 'Open' : part === 'shifting' ? 'Mixed' : 'Strained'}`)}</span>)}
                </div>}
                {nitrateOnly && remixStress === null && <div className="nitrate-rank">
                  <span>{t(lang, 'relativeRank')}</span><strong>{Math.round(signal.percentile * 100)}%</strong>
                  <div aria-hidden="true"><span style={{ width: `${signal.percentile * 100}%` }} /></div>
                </div>}
              </div>}
              <p className="reading-note">{t(lang, remixStress !== null ? 'remixNote' : signal?.kind === 'site' && nitrateOnly ? 'nitrateOnlyNote' : signal?.kind === 'site' ? 'siteMixNote' : signal?.kind === 'nitrate' ? 'nitrateNote' : 'qualityNote')}</p>
              {audioError && <p className="audio-error" role="alert">{t(lang, 'audioError')}</p>}
              <button type="button" className="button play-reading" onClick={toggleAudio} disabled={!signal}>
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {t(lang, isPlaying ? 'pause' : signal?.kind === 'site' ? 'hearSite' : 'hearReading')}
              </button>
            </div>
          </div>
        </section>

        <section className="interpret-section" aria-labelledby="interpret-title">
          <div className="section-heading"><div><span className="eyebrow">{t(lang, 'interpretEyebrow')}</span><h2 id="interpret-title">{t(lang, 'interpretTitle')}</h2></div><p>{t(lang, 'interpretDescription')}</p></div>
          <div className="interpret-grid">
            <div className="mapping-card"><span className="mapping-number">01</span><Waves size={23} /><h3>{t(lang, 'mappingHarmony')}</h3><p>{t(lang, 'mappingHarmonyText')}</p></div>
            <div className="mapping-card"><span className="mapping-number">02</span><AudioLines size={23} /><h3>{t(lang, 'mappingLayers')}</h3><p>{t(lang, 'mappingLayersText')}</p></div>
            <div className="mapping-card"><span className="mapping-number">03</span><Droplets size={23} /><h3>{t(lang, 'mappingTexture')}</h3><p>{t(lang, 'mappingTextureText')}</p></div>
          </div>
          <div className="remix-panel">
            <div><span className="eyebrow">{t(lang, 'remixEyebrow')}</span><h3>{t(lang, 'remixTitle')}</h3><p>{t(lang, 'remixDescription')}</p></div>
            <div className="remix-control"><label htmlFor="remix-range">{t(lang, 'soundTension')} <strong>{Math.round(stress * 100)}%</strong></label><input id="remix-range" type="range" min="0" max="100" value={Math.round(stress * 100)} onChange={(event) => setRemixStress(Number(event.target.value) / 100)} /><div className="range-ends"><span>{t(lang, 'gentle')}</span><span>{t(lang, 'tense')}</span></div><button type="button" onClick={() => setRemixStress(null)} disabled={remixStress === null}><RefreshCw size={14} /> {t(lang, 'backToData')}</button></div>
          </div>
        </section>

        <section className="record-section" aria-labelledby="record-title">
          <div className="section-heading"><div><span className="eyebrow">{t(lang, 'recordEyebrow')}</span><h2 id="record-title">{t(lang, 'recordTitle')}</h2></div><p>{t(lang, 'recordDescription')}</p></div>
          <div className="record-layout">
            <div className="record-summary"><span className="eyebrow">{city.name[lang]}</span><strong>{stats.sites}</strong><span>{t(lang, 'samplingSites')}</span><div className="record-summary-divider" /><strong>{stats.observations}</strong><span>{t(lang, 'observations')}</span><small>{t(lang, 'latestRecord')}: {formatObservationDate(stats.latestDate, lang)}</small></div>
            <div className="record-list"><div className="record-list-header"><span>{site?.name || '—'}</span><span>{records.length} {t(lang, records.length === 1 ? 'record' : 'records')}</span></div>
              {records.slice(0, showAllRecords ? undefined : 5).map((row) => <div className="record-row" key={row.id}><time>{formatObservationDate(row.date, lang)}</time><span>{rowSummary(row, lang)}</span></div>)}
              {records.length > 5 && <button type="button" className="show-records" onClick={() => setShowAllRecords(!showAllRecords)}>{t(lang, showAllRecords ? 'showLess' : 'showAll')} <ArrowRight size={16} /></button>}
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer className="site-footer"><div className="footer-brand"><img src="/favicon.png" alt="" /><div><strong>SongSoong</strong><span>{t(lang, 'footerLine')}</span></div></div><div><span>{t(lang, 'dataSource')}: <a href="https://api.enora-oah.eu/swagger-ui/index.html" target="_blank" rel="noreferrer">ENORA API <ArrowUpRight size={12} /></a></span><span>{t(lang, 'photoSource')}: <a href={cityVisual.source} target="_blank" rel="noreferrer">OneAquaHealth <ArrowUpRight size={12} /></a></span><small>{t(lang, 'dataCaveat')}</small></div></footer>
  </div>;
}
