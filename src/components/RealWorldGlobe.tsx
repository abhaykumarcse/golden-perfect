import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Point = { name: string; lat: number; lon: number; address?: string; heading?: number };
type Poi = { id: string; name: string; lat: number; lon: number; category: string; address?: string };
type Props = {
  focusPoint: Point | null;
  start: Point | null;
  destination: Point | null;
  selected: Point | null;
  pois: Poi[];
  poiCategory: string;
  path: Array<[number, number]>;
  livePoint: Point | null;
  navigationActive: boolean;
  mapCommand?: { type: 'zoomIn' | 'zoomOut' | 'reset' | 'locate'; id: number } | null;
  onTap: (lat: number, lon: number) => void;
  onPoiSelect: (poi: Poi) => void;
};

const pointFeature = (p: Point) => ({
  type: 'Feature' as const,
  geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
  properties: { name: p.name },
});

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const showMapInfo = async (map: maplibregl.Map, lat: number, lon: number) => {
  const popup = new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: '320px' })
    .setLngLat([lon, lat])
    .setHTML('<div style="padding:6px 4px;font:14px/1.45 system-ui,sans-serif"><strong>Finding this place...</strong><br/><span style="opacity:.7">Loading map information</span></div>')
    .addTo(map);
  try {
    const response = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&zoom=18&addressdetails=1', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('reverse geocode failed');
    const data = await response.json();
    const address = data.address || {};
    const title = data.name || address.road || address.city || address.town || address.village || address.state || 'Selected location';
    const type = data.type || data.category || 'location';
    const parts = [address.road, address.neighbourhood || address.suburb, address.city || address.town || address.village || address.municipality, address.state, address.country].filter(Boolean);
    const html = '<div style="padding:6px 4px;font:14px/1.45 system-ui,sans-serif"><strong style="font-size:16px">' + escapeHtml(String(title)) + '</strong><div style="margin-top:5px;opacity:.78">' + escapeHtml(String(type)) + '</div>' + (parts.length ? '<div style="margin-top:6px">' + escapeHtml(parts.join(', ')) + '</div>' : '') + '<div style="margin-top:6px;font-size:12px;opacity:.62">' + lat.toFixed(6) + ', ' + lon.toFixed(6) + '</div></div>';
    popup.setHTML(html);
  } catch {
    popup.setHTML('<div style="padding:6px 4px;font:14px/1.45 system-ui,sans-serif"><strong>Selected location</strong><br/><span style="opacity:.75">' + lat.toFixed(6) + ', ' + lon.toFixed(6) + '</span><br/><span style="opacity:.65">Place information is temporarily unavailable.</span></div>');
  }
};

export default function RealWorldGlobe({ focusPoint, start, destination, selected, pois, poiCategory, path, livePoint, navigationActive, mapCommand, onTap, onPoiSelect }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const focusRef = useRef<Point | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const liveMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeSvgRef = useRef<SVGSVGElement | null>(null);
  const routeGlowRef = useRef<SVGPolylineElement | null>(null);
  const routeCoreRef = useRef<SVGPolylineElement | null>(null);
  const onTapRef = useRef(onTap);
  const onPoiSelectRef = useRef(onPoiSelect);
  const pathRef = useRef(path);
  onTapRef.current = onTap;
  onPoiSelectRef.current = onPoiSelect;
  pathRef.current = path;

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: host.current,
      center: [78.9629, 20.5937],
      zoom: 2.7,
      minZoom: 1.4,
      maxZoom: 20,
      fadeDuration: 0,
      refreshExpiredTiles: false,
      maxTileCacheSize: 256,
      dragRotate: true,
      touchPitch: false,
      renderWorldCopies: true,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm',
          paint: {
            'raster-fade-duration': 0,
            'raster-saturation': -0.05,
            'raster-contrast': 0.16,
            'raster-brightness-min': 0.04,
            'raster-brightness-max': 0.92,
            'raster-opacity': 0.98,
          },
        }],
      },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: false }), 'top-right');
    map.scrollZoom.setWheelZoomRate(1 / 260);
    map.scrollZoom.setWheelZoomRate(1 / 260);
    map.touchZoomRotate.enable();
    map.doubleClickZoom.enable();
    map.dragPan.enable();
    map.on('click', event => {
      onTapRef.current(event.lngLat.lat, event.lngLat.lng);
      void showMapInfo(map, event.lngLat.lat, event.lngLat.lng);
    });
    map.on('load', () => {
      const applyGlobeTheme = () => {
        const root = document.documentElement;
        const read = (name: string, fallback: string) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
        const atmosphere = read('--globe-atmosphere', '#35cfe7');
        const space = read('--globe-space', '#01050b');
        const route = read('--globe-route', '#70efff');
        const routeGlow = read('--globe-route-glow', '#21dfff');
        const indiaFill = read('--globe-india-fill', '#6ce8f7');
        const indiaLine = read('--globe-india-line', '#cffaff');
        map.setSky({ 'sky-color': atmosphere, 'horizon-color': atmosphere, 'fog-color': atmosphere, 'horizon-fog-blend': 0.16, 'space-color': space, 'star-intensity': 0.12 });
        if (map.getLayer('india-claimed-fill')) map.setPaintProperty('india-claimed-fill', 'fill-color', indiaFill);
        if (map.getLayer('india-claimed-outline')) map.setPaintProperty('india-claimed-outline', 'line-color', indiaLine);
        if (map.getLayer('journey-route-glow')) map.setPaintProperty('journey-route-glow', 'line-color', routeGlow);
        if (map.getLayer('journey-route')) map.setPaintProperty('journey-route', 'line-color', route);
        routeGlowRef.current?.setAttribute('stroke', routeGlow);
        routeCoreRef.current?.setAttribute('stroke', route);
      };
      const applyOnLoad = () => applyGlobeTheme();
      applyOnLoad();
      const themeObserver = new MutationObserver(applyGlobeTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      map.addSource('india-claimed-area', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india.json',
      });
      map.addLayer({
        id: 'india-claimed-fill',
        type: 'fill',
        source: 'india-claimed-area',
        minzoom: 1.4,
        paint: {
          'fill-color': '#6ce8f7',
          'fill-opacity': 0.16,
          'fill-outline-color': '#cffaff',
        },
      });
      map.addLayer({
        id: 'india-claimed-outline',
        type: 'line',
        source: 'india-claimed-area',
        minzoom: 1.4,
        paint: {
          'line-color': '#cffaff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 1.4, 1.15, 5, 1.8, 9, 2.6, 14, 3.8],
          'line-opacity': 0.92,
          'line-blur': 0.08,
        },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
      map.addSource('journey-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({ id: 'journey-route-shadow', type: 'line', source: 'journey-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#071321', 'line-width': 17, 'line-opacity': 0.72, 'line-blur': 2.5 } });
      map.addLayer({ id: 'journey-route-glow', type: 'line', source: 'journey-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#25e7ff', 'line-width': 13, 'line-opacity': 0.55, 'line-blur': 3.5 } });
      map.addLayer({ id: 'journey-route', type: 'line', source: 'journey-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#6ff7ff', 'line-width': 7, 'line-opacity': 1, 'line-blur': 0 } });
      const source = map.getSource('journey-route') as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: pathRef.current.map(([lat, lon]) => [lon, lat]) },
      });
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','globe-route-overlay');
    svg.setAttribute('aria-hidden','true');
    const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
    const filter=document.createElementNS('http://www.w3.org/2000/svg','filter'); filter.setAttribute('id','gp-route-glow'); filter.setAttribute('x','-50%'); filter.setAttribute('y','-50%'); filter.setAttribute('width','200%'); filter.setAttribute('height','200%');
    const blur=document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur'); blur.setAttribute('stdDeviation','5'); filter.appendChild(blur); defs.appendChild(filter); svg.appendChild(defs);
    const glow=document.createElementNS('http://www.w3.org/2000/svg','polyline'); glow.setAttribute('fill','none'); glow.setAttribute('stroke','#24e7ff'); glow.setAttribute('stroke-width','15'); glow.setAttribute('stroke-linecap','round'); glow.setAttribute('stroke-linejoin','round'); glow.setAttribute('opacity','.72'); glow.setAttribute('filter','url(#gp-route-glow)');
    const core=document.createElementNS('http://www.w3.org/2000/svg','polyline'); core.setAttribute('fill','none'); core.setAttribute('stroke','#67f5ff'); core.setAttribute('stroke-width','6'); core.setAttribute('stroke-linecap','round'); core.setAttribute('stroke-linejoin','round');
    svg.appendChild(glow); svg.appendChild(core); host.current?.appendChild(svg); routeSvgRef.current=svg; routeGlowRef.current=glow; routeCoreRef.current=core;
    mapRef.current = map;
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      routeSvgRef.current?.remove(); routeSvgRef.current=null; routeGlowRef.current=null; routeCoreRef.current=null;
      map.remove();
      mapRef.current = null;