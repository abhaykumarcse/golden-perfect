import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@appdeploy/client';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type Ad = {
  id: string;
  name: string;
  brand: string;
  type?: string;
  source?: string;
  landingUrl?: string;
  imageUrl?: string;
  headline?: string;
  description?: string;
  cta?: string;
  closeButton?: boolean;
};
type AdsenseConfig = { enabled?: boolean; publisherId?: string; unitId?: string };
export type AdSlotName =
  | 'Home Page (Top Banner)'
  | 'Home Page (Middle)'
  | 'Search Page'
  | 'Destination Details Page'
  | 'Trip Planner'
  | 'Video Section'
  | 'Notes Section'
  | 'Globe & Map'
  | 'App Drawer / Menu'
  | 'Jobs Section';

const validUrl = (value?: string) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

function countImpressionOnce(id: string) {
  if (!id) return;
  const key = 'gp-ad-impression:' + id;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* private mode */ }
  void api.post('/api/ads/' + encodeURIComponent(id) + '/impression', {}).catch(() => undefined);
}

function AdSense({ config }: { config: AdsenseConfig }) {
  const element = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const publisher = config.publisherId || '';
    const unit = config.unitId || '';
    if (!config.enabled || !/^ca-pub-\d{6,30}$/.test(publisher) || !/^\d{5,20}$/.test(unit)) return;
    if (!document.querySelector('script[data-gp-adsense="true"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.gpAdsense = 'true';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(publisher);
      document.head.appendChild(script);
    }
    const node = element.current;
    if (node && !node.getAttribute('data-adsbygoogle-status')) {
      try {
        ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
      } catch { /* blocked by browser or consent settings */ }
    }
  }, [config.enabled, config.publisherId, config.unitId]);
  if (!config.enabled || !config.publisherId || !config.unitId) return null;
  return <div className="gp-ad-sense">
    <small>Advertisement</small>
    <ins ref={element} className="adsbygoogle" style={{ display: 'block' }} data-ad-client={config.publisherId} data-ad-slot={config.unitId} data-ad-format="auto" data-full-width-responsive="true" />
  </div>;
}

export default function AdSlot({ slot, className = '' }: { slot: AdSlotName; className?: string }) {
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [config, setConfig] = useState<AdsenseConfig | null>(null);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const track = useRef<HTMLDivElement | null>(null);
  const pause = useRef(false);
  const touchPause = useRef(false);

  useEffect(() => {
    let alive = true;
    const query = encodeURIComponent(slot);
    Promise.all([
      api.get('/api/ads?slot=' + query).then(r => Array.isArray(r.data) ? r.data as Ad[] : []).catch(() => []),
      api.get('/api/ads/config?slot=' + query).then(r => r.data as AdsenseConfig).catch(() => null)
    ]).then(([items, settings]) => {
      if (alive) { setAds(items); setConfig(settings); }
    });
    return () => { alive = false; };
  }, [slot]);

  const visibleAds = (ads || []).filter(ad => !dismissed.includes(ad.id));
  useEffect(() => {
    const root = track.current;
    if (!root || !visibleAds.length || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) countImpressionOnce((entry.target as HTMLElement).dataset.adId || '');
    }), { threshold: [0.6] });
    root.querySelectorAll<HTMLElement>('[data-ad-id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleAds]);

  const move = useCallback((next: number) => {
    const root = track.current;
    const slide = root?.children[next] as HTMLElement | undefined;
    if (root && slide) {
      // offsetLeft can be relative to the page because slides are positioned;
      // calculate the slide's actual position inside the horizontal track.
      const left = slide.getBoundingClientRect().left - root.getBoundingClientRect().left + root.scrollLeft;
      root.scrollTo({ left, behavior: 'smooth' });
      setIndex(next);
    }
  }, []);

  useEffect(() => {
    if (slot !== 'Home Page (Top Banner)' || visibleAds.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!pause.current && !touchPause.current && !document.hidden) move((index + 1) % visibleAds.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slot, visibleAds, index, move]);

  const onScroll = () => {
    const root = track.current;
    if (!root?.children.length) return;
    const width = (root.children[0] as HTMLElement).offsetWidth || 1;
    const next = Math.max(0, Math.min(visibleAds.length - 1, Math.round(root.scrollLeft / width)));
    if (next !== index) setIndex(next);
  };

  const open = (ad: Ad) => {
    void api.post('/api/ads/' + encodeURIComponent(ad.id) + '/click', {}).catch(() => undefined);
    const url = validUrl(ad.landingUrl);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (ads === null) return null;
  if (!visibleAds.length) {
    return config?.enabled && config.unitId
      ? <aside className={'gp-ad-slot ' + className}><AdSense config={config} /></aside>
      : null;
  }

  return <aside className={'gp-ad-slot ' + className + (slot === 'Home Page (Top Banner)' ? ' gp-ad-top-banner' : '')}
    aria-label="Sponsored offers"
    onMouseEnter={() => { pause.current = true; }}
    onMouseLeave={() => { pause.current = false; }}>
    <div className="gp-ad-track" ref={track} onScroll={onScroll}
      onTouchStart={() => { touchPause.current = true; }}
      onTouchEnd={() => { window.setTimeout(() => { touchPause.current = false; }, 1800); }}>
      {visibleAds.map(ad => <article className="gp-ad-slide" key={ad.id} data-ad-id={ad.id}>
        <button type="button" className="gp-ad-card" onClick={() => open(ad)} aria-label={'Open offer from ' + (ad.brand || 'partner')}>
          {ad.imageUrl && <img className="gp-ad-image" src={ad.imageUrl} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} />}
          <span className="gp-ad-badge">{ad.source === 'Campaign' ? 'Campaign' : 'Sponsored'} · {ad.brand || 'Partner'}</span>
          <strong>{ad.headline || ad.name || 'Partner offer'}</strong>
          {ad.description && <span className="gp-ad-description">{ad.description}</span>}
          <span className="gp-ad-cta">{ad.cta || (ad.landingUrl ? 'Explore offer ↗' : 'Featured partner')}</span>
        </button>
        {ad.closeButton !== false && <button type="button" className="gp-ad-close" aria-label="Dismiss advertisement" onClick={() => setDismissed(current => [...current, ad.id])}><X size={14} /></button>}
      </article>)}
    </div>
    {slot === 'Home Page (Top Banner)' && visibleAds.length > 1 && <div className="gp-ad-carousel-controls">
      <button type="button" aria-label="Previous advertisement" onClick={() => move((index - 1 + visibleAds.length) % visibleAds.length)}><ChevronLeft size={15} /></button>
      <div className="gp-ad-dots" aria-label="Choose offer">{visibleAds.map((ad, i) => <button key={ad.id} type="button" aria-label={'Offer ' + (i + 1)} aria-current={i === index ? 'true' : undefined} className={i === index ? 'active' : ''} onClick={() => move(i)} />)}</div>
      <button type="button" aria-label="Next advertisement" onClick={() => move((index + 1) % visibleAds.length)}><ChevronRight size={15} /></button>
    </div>}
  </aside>;
}
