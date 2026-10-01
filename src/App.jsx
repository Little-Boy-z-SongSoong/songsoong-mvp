import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Compass, Droplets, Fish, Leaf, MapPin, Pause, Play, RefreshCw, Waves } from 'lucide-react';
import { t } from './i18n';
import { CITIES, getCityById } from './data/cities';
import { CITY_PRESENTATION, citySummary, compositionForSite, fallbackOverview, fetchOverview, formatObservationDate, observationsForSite, signalsForSite, siteOptions } from './data/enora';
import AudioEngine from './audio/AudioEngine';
import AudioVisualizer from './components/AudioVisualizer';

const signalIcons = { fish: Fish, macro: Leaf, diatoms: Waves, nitrate: Droplets };
const signalOrder = ['macro', 'diatoms', 'fish', 'nitrate'];
const number = (value, lang) => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', { maximumFractionDigits: 3 }).format(value);

function signalName(lang, kind) { return t(lang, `signal_${kind}`); }
function qualityName(lang, quality) { return t(lang, `quality_${quality}`); }
function stressMood(stress) { return stress < 0.31 ? 'gentle' : stress < 0.61 ? 'shifting' : 'tense'; }

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
  const [lang, setLang] = useState('vi');
  const [overview, setOverview] = useState(fallbackOverview);
  const [cityId, setCityId] = useState('ghent');
  const [siteCode, setSiteCode] = useState(null);
  const [signalKind, setSignalKind] = useState('site');
  const [remixStress, setRemixStress] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyserData, setAnalyserData] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const city = getCityById(cityId);
  const cityVisual = CITY_PRESENTATION[cityId];
  const sites = useMemo(() => siteOptions(overview, cityId), [overview, cityId]);
  const site = sites.find((item) => item.code === siteCode) || sites[0];
  const records = useMemo(() => observationsForSite(overview, site?.code), [overview, site?.code]);
  const signals = useMemo(() => signalsForSite(overview, site?.code), [overview, site?.code]);
  const siteComposition = useMemo(() => compositionForSite(signals), [signals]);
  const signal = signalKind === 'site' ? siteComposition : signals.find((item) => item.kind === signalKind) || siteComposition;
  const stress = remixStress ?? signal?.stress ?? 0.5;
  const richness = signal?.layerDensity ?? 0.4;
  const mood = stressMood(stress);
  const stats = useMemo(() => citySummary(overview, cityId), [overview, cityId]);

  useEffect(() => {
    let mounted = true;
    fetchOverview().then((data) => { if (mounted) setOverview(data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    audioRef.current = new AudioEngine();
    return () => audioRef.current?.dispose();
  }, []);

  useEffect(() => { audioRef.current?.setCity(city); }, [city]);
  useEffect(() => { audioRef.current?.setSite(site?.code); }, [site?.code]);
  useEffect(() => {
    if (audioRef.current?.isPlaying) audioRef.current.setLiveParams(stress, richness);
  }, [stress, richness]);

  useEffect(() => {
    let frame;
    const tick = () => {
      if (audioRef.current?.isPlaying) setAnalyserData(audioRef.current.getFFTData());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const changeCity = useCallback((id) => {
    setCityId(id);
    setSiteCode(null);
    setSignalKind('site');
    setRemixStress(null);
    setShowAllRecords(false);
  }, []);

  const changeSite = useCallback((code) => {
    setSiteCode(code);
    setSignalKind('site');
    setRemixStress(null);
    setShowAllRecords(false);
  }, []);

  const changeSignal = useCallback((kind) => {
    setSignalKind(kind);
    setRemixStress(null);
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!signal || !audioRef.current) return;
    try {
      setAudioError(false);
      if (!audioRef.current.isInitialized) {
        await audioRef.current.init();
        audioRef.current.setCity(city);
      }
      if (audioRef.current.isPlaying) {
        audioRef.current.stop();
        setIsPlaying(false);
      } else {
        audioRef.current.start(stress, richness);
        setIsPlaying(true);
      }
    } catch {
      setAudioError(true);
      setIsPlaying(false);
    }
  }, [city, signal, stress, richness]);

  const siteMap = site ? `https://www.openstreetmap.org/?mlat=${site.latitude}&mlon=${site.longitude}#map=15/${site.latitude}/${site.longitude}` : '#';
  const activeQuality = signal?.quality ? qualityName(lang, signal.quality) : null;

  return <div className="app-shell" style={{ '--city-accent': city.colors.accent, '--city-photo': `url(${cityVisual.photo})` }}>
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#top" className="brand" aria-label="SongSoong">
          <span className="brand-icon"><Waves size={24} strokeWidth={1.8} /></span>
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

    <main id="top">
      <section className="story-hero" aria-labelledby="hero-title">
        <img className="story-hero-photo" src={cityVisual.photo} alt={cityVisual.photoAlt[lang]} />
        <div className="story-hero-overlay" />
        <div className="story-hero-content">
          <div className="eyebrow light"><span className="eyebrow-line" /> {t(lang, 'heroEyebrow')}</div>
          <h1 id="hero-title">{t(lang, 'heroTitleA')}<br /><em>{t(lang, 'heroTitleB')}</em></h1>
          <p>{t(lang, 'heroDescription')}</p>
          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={toggleAudio} disabled={!signal}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {t(lang, isPlaying ? 'pause' : 'listenNow')}
            </button>
            <a href="#explore" className="button button-outline">{t(lang, 'exploreData')} <ArrowDown size={17} /></a>
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
                <h3>{t(lang, `mood_${mood}`)}</h3>
                <p>{signal ? signal.kind === 'site' ? `${signalName(lang, 'site')} · ${signal.signalCount} ${t(lang, 'available')}` : `${signalName(lang, signal.kind)} · ${formatObservationDate(signal.date, lang)}` : t(lang, 'noObservation')}</p>
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
                <button type="button" className={`signal-choice signal-choice-site ${signal?.kind === 'site' ? 'selected' : ''}`} disabled={!siteComposition} onClick={() => changeSignal('site')} aria-pressed={signal?.kind === 'site'}>
                  <Waves size={17} /> <span>{signalName(lang, 'site')}</span><small>{t(lang, 'siteMixHint')}</small>
                </button>
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
              <p className="reading-note">{t(lang, signal?.kind === 'site' ? 'siteMixNote' : signal?.kind === 'nitrate' ? 'nitrateNote' : 'qualityNote')}</p>
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
            <div className="record-list"><div className="record-list-header"><span>{site?.name || '—'}</span><span>{records.length} {t(lang, 'records')}</span></div>
              {records.slice(0, showAllRecords ? undefined : 5).map((row) => <div className="record-row" key={row.id}><time>{formatObservationDate(row.date, lang)}</time><span>{rowSummary(row, lang)}</span></div>)}
              {records.length > 5 && <button type="button" className="show-records" onClick={() => setShowAllRecords(!showAllRecords)}>{t(lang, showAllRecords ? 'showLess' : 'showAll')} <ArrowRight size={16} /></button>}
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer className="site-footer"><div><strong>SongSoong</strong><span>{t(lang, 'footerLine')}</span></div><div><span>{t(lang, 'dataSource')}: <a href="https://api.enora-oah.eu/swagger-ui/index.html" target="_blank" rel="noreferrer">ENORA API <ArrowUpRight size={12} /></a></span><span>{t(lang, 'photoSource')}: <a href={cityVisual.source} target="_blank" rel="noreferrer">OneAquaHealth <ArrowUpRight size={12} /></a></span><small>{t(lang, 'dataCaveat')}</small></div></footer>
  </div>;
}
