import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Bike, Car, Footprints, Fuel, Hotel, LocateFixed, MapPin, Navigation, Pause, Play, RotateCcw, Search, ShoppingBag, Store, Utensils, X } from 'lucide-react';
import RealWorldGlobe from './RealWorldGlobe';

type Point={name:string;lat:number;lon:number;address?:string;heading?:number};
type Poi={id:string;name:string;lat:number;lon:number;category:string;address?:string;tags?:Record<string,string>};
type Vehicle='car'|'bike'|'foot';
type NavStep={instruction:string;distance:number;type?:string;modifier?:string;lat?:number;lon?:number};
type Props={notify?:(message:string)=>void};
const R=2.5;
const v=(lat:number,lon:number,r=R+0.08)=>{const la=lat*Math.PI/180,lo=lon*Math.PI/180;return new THREE.Vector3(r*Math.cos(la)*Math.cos(lo),r*Math.sin(la),r*Math.cos(la)*Math.sin(lo));};
const latLonFromVector=(p:THREE.Vector3)=>{const n=p.clone().normalize();const lat=Math.asin(THREE.MathUtils.clamp(n.y,-1,1))*180/Math.PI;let lon=Math.atan2(n.z,n.x)*180/Math.PI;if(lon>180)lon-=360;if(lon<-180)lon+=360;return {lat,lon};};
const km=(a:Point,b:Point)=>{const r=6371,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180,h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return r*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));};

export default function SpatialJourneyMap({notify}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),cam=useRef<THREE.PerspectiveCamera|null>(null),ctrl=useRef<OrbitControls|null>(null),scene=useRef<THREE.Scene|null>(null),markers=useRef<THREE.Group|null>(null),poiGroup=useRef<THREE.Group|null>(null),line=useRef<THREE.Object3D|null>(null),liveRef=useRef<Point|null>(null),watch=useRef<number|null>(null),raf=useRef(0),playing=useRef(false),cache=useRef(new Map<string,Point>()),pointerDown=useRef({x:0,y:0}),routeInFlight=useRef(false),lastRouteAt=useRef(0),lastRouteOrigin=useRef<Point|null>(null),routeRequestId=useRef(0);
 const [q,setQ]=useState(''),[sq,setSq]=useState(''),[dq,setDq]=useState(''),[mapCommand,setMapCommand]=useState<{type:'zoomIn'|'zoomOut'|'reset'|'locate';id:number}|null>(null),[start,setStart]=useState<Point|null>(null),[dest,setDest]=useState<Point|null>(null),[selected,setSelected]=useState<Point|null>(null),[path,setPath]=useState<Array<[number,number]>>([]),[summary,setSummary]=useState<{km:number;mins:number}|null>(null),[busy,setBusy]=useState(false),[live,setLive]=useState(false),[mode,setMode]=useState<'start'|'destination'|null>(null),[vehicle,setVehicle]=useState<Vehicle>('car'),[pois,setPois]=useState<Poi[]>([]),[poiBusy,setPoiBusy]=useState(false),[poiCategory,setPoiCategory]=useState('all'),[selectedPoi,setSelectedPoi]=useState<Poi|null>(null),[navSteps,setNavSteps]=useState<NavStep[]>([]),[navActive,setNavActive]=useState(false),[navIndex,setNavIndex]=useState(0),[immersive,setImmersive]=useState(false),[play,setPlay]=useState(false),[msg,setMsg]=useState('');

 const focus=(lat:number,lon:number,d=5)=>{if(!cam.current||!ctrl.current)return;const t=v(lat,lon,R);ctrl.current.target.copy(t);cam.current.position.copy(t.clone().normalize().multiplyScalar(d));cam.current.lookAt(t);ctrl.current.update();};
 const geo=async(value:string):Promise<Point|null>=>{const q=value.trim(),key=q.toLowerCase();if(!q)return null;if(cache.current.has(key))return cache.current.get(key)!;try{const c=new AbortController(),t=window.setTimeout(()=>c.abort(),4500),r=await fetch('https://photon.komoot.io/api/?q='+encodeURIComponent(q)+'&limit=1',{signal:c.signal});window.clearTimeout(t);const f=(await r.json())?.features?.[0],co=f?.geometry?.coordinates,p=f?.properties||{};if(Array.isArray(co)){const x={name:p.name||p.city||q,lat:Number(co[1]),lon:Number(co[0]),address:[p.name,p.city,p.state,p.country].filter(Boolean).join(', ')};if(Number.isFinite(x.lat)&&Number.isFinite(x.lon)){cache.current.set(key,x);return x;}}}catch{}try{const c=new AbortController(),t=window.setTimeout(()=>c.abort(),4500),r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=in&q='+encodeURIComponent(q),{signal:c.signal});window.clearTimeout(t);const x=(await r.json())?.[0];if(!x)return null;const p={name:x.name||q,lat:Number(x.lat),lon:Number(x.lon),address:x.display_name};cache.current.set(key,p);return p;}catch{return null;}};
 const route=async(a:Point,b:Point,keepNavigation=false,silent=false)=>{
  if(routeInFlight.current)return;
  const requestId=++routeRequestId.current;
  routeInFlight.current=true;
  if(!silent)setBusy(true);
  try{
    const profile=vehicle==='car'?'car':vehicle==='bike'?'bike':'foot';
    const encoded=a.lon+','+a.lat+';'+b.lon+','+b.lat;
    const primary=profile==='car'
      ? 'https://router.project-osrm.org/route/v1/driving/'
      : 'https://routing.openstreetmap.de/routed-'+profile+'/route/v1/driving/';
    const fallback=profile==='car'
      ? 'https://routing.openstreetmap.de/routed-car/route/v1/driving/'
      : 'https://router.project-osrm.org/route/v1/driving/';
    const makeUrl=(base:string)=>base+encoded+'?overview=full&geometries=geojson&steps=true&alternatives=false';
    const urls=[makeUrl(primary),makeUrl(fallback)];
    const getRoute=async(url:string)=>{
      const c=new AbortController(),t=window.setTimeout(()=>c.abort(),6500);
      try{
        const r=await fetch(url,{signal:c.signal,cache:'no-store'});
        if(!r.ok)throw new Error('route '+r.status);
        const data=await r.json();
        const x=data?.routes?.[0];
        if(!x?.geometry?.coordinates?.length)throw new Error('empty route');
        return x;
      }finally{window.clearTimeout(t);}
    };
    const x=await new Promise<any>((resolve,reject)=>{
      let left=urls.length,last:any;
      urls.forEach(url=>getRoute(url).then(resolve).catch(err=>{last=err;left-=1;if(left===0)reject(last);}));
    });
    if(requestId!==routeRequestId.current)return;
    const nextPath=x.geometry.coordinates.map(([lo,la]:[number,number])=>[la,lo] as [number,number]);
    const nextSummary={km:Number(x.distance||0)/1000,mins:Math.max(1,Math.round(Number(x.duration||0)/60))};
    const steps:NavStep[]=(x.legs||[]).flatMap((leg:any)=>leg.steps||[]).map((st:any)=>{
      const m=st.maneuver||{};
      const mod=m.modifier?String(m.modifier).replace('slight ','').replace('sharp ','sharp '):'';
      let instruction='Continue';
      if(m.type==='depart')instruction='Start on '+(st.name||'the road');
      else if(m.type==='arrive')instruction='You have arrived';
      else if(m.type==='roundabout')instruction='At the roundabout, take exit '+(m.exit||'');
      else if(m.type==='fork')instruction='Keep '+(mod||'ahead')+(st.name?' onto '+st.name:'');
      else if(['turn','merge','on ramp','off ramp','end of road'].includes(m.type))instruction=(mod?mod.charAt(0).toUpperCase()+mod.slice(1):'Continue')+(st.name?' onto '+st.name:'');
      else if(st.name)instruction='Continue on '+st.name;
      return {instruction,distance:Number(st.distance||0),type:m.type,modifier:m.modifier,lat:Number(m.location?.[1]),lon:Number(m.location?.[0])};
    }).filter((z:NavStep)=>z.instruction);
    setPath(nextPath);
    setSummary(nextSummary);
    setNavSteps(steps);
    if(!keepNavigation)setNavIndex(0);
    else setNavIndex(i=>Math.min(i,Math.max(0,steps.length-1)));
    if(!keepNavigation)setNavActive(false);
    setMsg(profile==='car'?'Car route ready':profile==='bike'?'Bike route ready':'Walking route ready');
    lastRouteAt.current=Date.now();
    lastRouteOrigin.current=a;
    if(!keepNavigation)focus((a.lat+b.lat)/2,(a.lon+b.lon)/2,Math.min(6.2,Math.max(3.45,3.15+Math.sqrt(Math.max(1,km(a,b)))/40)));
  }catch{
    if(requestId===routeRequestId.current&&!keepNavigation&&!path.length){
      const d=km(a,b);
      setPath([[a.lat,a.lon],[b.lat,b.lon]]);
      setSummary({km:d,mins:Math.max(1,Math.round(d/(vehicle==='car'?55:vehicle==='bike'?18:5)*60))});
      setNavSteps([{instruction:'Route service temporarily unavailable',distance:d*1000,lat:b.lat,lon:b.lon}]);
      setNavIndex(0);setNavActive(false);setMsg('Route service unavailable — retrying is safe.');
    }
  }finally{
    if(requestId===routeRequestId.current){routeInFlight.current=false;if(!silent)setBusy(false);}
  }
};
 const choose=(p:Point,m:'start'|'destination')=>{setSelected(p);setMode(null);if(m==='start'){setStart(p);setSq(p.name);if(dest)void route(p,dest,true);}else{setDest(p);setDq(p.name);if(start)void route(start,p);}focus(p.lat,p.lon,4.7);};
 useEffect(()=>{if(start&&dest&&!busy)void route(start,dest,true);},[vehicle]);
 const search=async(value:string,m?:'start'|'destination')=>{if(!value.trim())return;setBusy(true);setMsg('Finding location…');const p=await geo(value);if(!p){setBusy(false);setMsg('Location not found.');return;}setSelected(p);focus(p.lat,p.lon,4.9);if(m){setBusy(false);choose(p,m);return;}setDest(p);setDq(p.name);const origin=liveRef.current||start;if(origin){setBusy(false);void route(origin,p);}else if(navigator.geolocation){navigator.geolocation.getCurrentPosition(pos=>{const here={name:'My live location',lat:pos.coords.latitude,lon:pos.coords.longitude,address:'Current device location'};liveRef.current=here;setStart(here);setSq(here.name);setBusy(false);void route(here,p);},()=>{setBusy(false);setMsg('Destination found — choose a start point.');},{enableHighAccuracy:true,timeout:7000,maximumAge:5000});}else{setBusy(false);setMsg('Destination found — choose a start point.');}};
 const locate=()=>{if(!navigator.geolocation){notify?.('Live location is not supported.');return;}setMsg('Getting precise live location…');navigator.geolocation.getCurrentPosition(pos=>{const previousHeading=liveRef.current?.heading;
   const heading=Number.isFinite(pos.coords.heading as number) ? Number(pos.coords.heading) : previousHeading;
   const p={name:'My live location',lat:pos.coords.latitude,lon:pos.coords.longitude,address:'Current device location',heading};liveRef.current=p;setStart(p);setSq(p.name);setSelected(p);focus(p.lat,p.lon,4.8);setMsg('Live location ready');if(dest)void route(p,dest,true);},()=>notify?.('Please allow precise location access and turn on device location.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});};
 const distanceTo=(a:Point,b:Point)=>km(a,b);
 const updateLivePosition=(pos:GeolocationPosition)=>{
   const previousHeading=liveRef.current?.heading;
   const heading=Number.isFinite(pos.coords.heading as number) ? Number(pos.coords.heading) : previousHeading;
   const p={name:'My live location',lat:pos.coords.latitude,lon:pos.coords.longitude,address:'Current device location',heading};
   liveRef.current=p;setStart(p);setSq(p.name);
   if(navActive){
     setNavIndex(i=>{
       let n=i;
       while(n+1<navSteps.length && navSteps[n+1]?.lat!==undefined && distanceTo(p,{name:'step',lat:navSteps[n+1].lat!,lon:navSteps[n+1].lon!})<0.045)n++;
       return n;
     });
   }
   if(dest){
     const previous=lastRouteOrigin.current;
     const moved=previous?km(previous,p):Infinity;
     const due=Date.now()-lastRouteAt.current>12000;
     if(!routeInFlight.current&&due&&moved>0.05)void route(p,dest,true,true);
   }
 };
 const toggleLive=()=>{
   const n=!live;setLive(n);
   if(!n){if(watch.current!==null)navigator.geolocation.clearWatch(watch.current);watch.current=null;return;}
   locate();
   if(navigator.geolocation)watch.current=navigator.geolocation.watchPosition(updateLivePosition,undefined,{enableHighAccuracy:true,maximumAge:1000,timeout:10000});
 };
 const beginNavigation=()=>{
   if(!start||!dest||!summary){notify?.('Set a route first.');return;}
   setNavActive(true);setNavIndex(0);setImmersive(true);setPlay(true);
   if(!live){
     setLive(true);
     if(navigator.geolocation){
       locate();
       if(watch.current===null)watch.current=navigator.geolocation.watchPosition(updateLivePosition,undefined,{enableHighAccuracy:true,maximumAge:1000,timeout:10000});
     }
   }
 };
 const loadPois=async(lat:number,lon:number)=>{setPoiBusy(true);try{const query=`[out:json][timeout:8];(node(around:900,${lat},${lon})[amenity~"fuel|restaurant|cafe|fast_food"];node(around:900,${lat},${lon})[shop];node(around:900,${lat},${lon})[tourism~"hotel|hostel"];);out center tags 30;`;const r=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query));const d=await r.json();const list=(d.elements||[]).map((e:any)=>{const tags=e.tags||{};const la=Number(e.lat??e.center?.lat),lo=Number(e.lon??e.center?.lon);let category='place';if(tags.amenity==='fuel')category='fuel';else if(['restaurant','cafe','fast_food'].includes(tags.amenity))category='food';else if(['hotel','hostel'].includes(tags.tourism))category='hotel';else if(tags.shop)category='shop';return {id:String(e.id),name:tags.name||category,lat:la,lon:lo,category,address:[tags['addr:housenumber'],tags['addr:street'],tags['addr:city']].filter(Boolean).join(', '),tags};}).filter((p:Poi)=>p.name&&Number.isFinite(p.lat)&&Number.isFinite(p.lon));setPois(list);setPoiCategory('all');setMsg(list.length?list.length+' nearby places found':'No nearby places found');}catch{setPois([]);setMsg('Nearby places unavailable right now.')}finally{setPoiBusy(false);}};
const iconForPoi=(category:string)=>category==='fuel'?<Fuel size={14}/>:category==='food'?<Utensils size={14}/>:category==='hotel'?<Hotel size={14}/>:category==='shop'?<ShoppingBag size={14}/>:<Store size={14}/>;
const selectPoi=(p:Poi)=>{setSelectedPoi(p);setSelected({name:p.name,lat:p.lat,lon:p.lon,address:p.address||p.category});focus(p.lat,p.lon,4.8);};
const handleMapTap=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!canvas.current||Math.hypot(e.clientX-pointerDown.current.x,e.clientY-pointerDown.current.y)>8)return;const rect=canvas.current.getBoundingClientRect(),ndc=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1),ray=new THREE.Raycaster();ray.setFromCamera(ndc,cam.current!);const hit=ray.intersectObjects([scene.current?.children.find(x=>x.type==='Mesh')].filter(Boolean) as THREE.Object3D[],false)[0];if(!hit)return;const ll=latLonFromVector(hit.point);const p={name:'Selected map point',lat:ll.lat,lon:ll.lon,address:ll.lat.toFixed(4)+', '+ll.lon.toFixed(4)};setSelected(p);setSelectedPoi(null);focus(ll.lat,ll.lon,4.9);void loadPois(ll.lat,ll.lon);};
const clear=()=>{setStart(null);setDest(null);setSelected(null);setSelectedPoi(null);setPois([]);setPath([]);setSummary(null);setSq('');setDq('');setMsg('');};
 useEffect(()=>{playing.current=play;},[play]);
useEffect(()=>{if(!navigator.geolocation)return;const p=(navigator.permissions as any)?.query?.({name:'geolocation'});if(p?.then)p.then((x:any)=>{if(x.state==='granted')locate();});},[]);
 useEffect(()=>{const el=canvas.current;if(!el)return;const s=new THREE.Scene();s.background=new THREE.Color(0x020710);const c=new THREE.PerspectiveCamera(42,1,.1,100);c.position.z=6.4;const r=new THREE.WebGLRenderer({canvas:el,antialias:false,alpha:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio||1,1.5));r.outputColorSpace=THREE.SRGBColorSpace;const o=new OrbitControls(c,el);o.enableDamping=true;o.dampingFactor=.075;o.enablePan=true;o.minDistance=3.2;o.maxDistance=9;o.rotateSpeed=.5;o.zoomSpeed=.8;const a=new THREE.AmbientLight(0x7fa9c4,1.55);s.add(a);const l=new THREE.DirectionalLight(0xe7f6ff,2.35);l.position.set(4,3,5);s.add(l);const e=new THREE.Mesh(new THREE.SphereGeometry(R,96,96),new THREE.MeshStandardMaterial({color:0x466b82,roughness:.82,metalness:.04,emissive:0x0b2533,emissiveIntensity:.22}));s.add(e);const at=new THREE.Mesh(new THREE.SphereGeometry(R+.08,48,48),new THREE.MeshBasicMaterial({color:0x54d8e8,transparent:true,opacity:.105,side:THREE.BackSide}));s.add(at);const g=new THREE.Group();const pg=new THREE.Group();s.add(g);s.add(pg);scene.current=s;cam.current=c;ctrl.current=o;markers.current=g;poiGroup.current=pg;new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',t=>{t.colorSpace=THREE.SRGBColorSpace;(e.material as THREE.MeshStandardMaterial).map=t;e.material.needsUpdate=true;});const resize=()=>{const b=el.getBoundingClientRect();r.setSize(Math.max(1,b.width),Math.max(1,b.height),false);c.aspect=b.width/Math.max(1,b.height);c.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();const anim=()=>{o.update();if(!playing.current&&!immersive)e.rotation.y+=.00045;r.render(s,c);raf.current=requestAnimationFrame(anim);};anim();return()=>{ro.disconnect();cancelAnimationFrame(raf.current);o.dispose();r.dispose();};},[]);
 useEffect(()=>{const g=markers.current;if(!g)return;g.clear();[start,dest,selected].filter(Boolean).forEach(p=>{const x=p as Point,m=new THREE.Mesh(new THREE.SphereGeometry(x.name==='My live location'?.045:.035,18,18),new THREE.MeshBasicMaterial({color:x.name==='My live location'?0x4bf08b:x===dest?0xff6178:0x69e6f0}));m.position.copy(v(x.lat,x.lon,R+.19));m.userData.journeyPoint=x;g.add(m);});},[start,dest,selected]);
 useEffect(()=>{const s=scene.current;if(!s)return;if(line.current){s.remove(line.current);const o=line.current as any;o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach((m:any)=>m.dispose());else o.material?.dispose();line.current=null;}if(path.length<2)return;const pts=path.map(([la,lo])=>v(la,lo,R+.22));const curve=new THREE.CatmullRomCurve3(pts);const g=new THREE.TubeGeometry(curve,Math.min(900,Math.max(32,path.length*4)),.014,6,false);const mat=new THREE.MeshBasicMaterial({color:vehicle==='bike'?0xffd56a:0x62e7f2,transparent:true,opacity:.98});const mesh=new THREE.Mesh(g,mat);mesh.renderOrder=20;line.current=mesh;s.add(mesh);},[path,vehicle]);
useEffect(()=>{const g=poiGroup.current;if(!g)return;g.clear();pois.filter(p=>poiCategory==='all'||p.category===poiCategory).forEach(p=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.045,10,10),new THREE.MeshBasicMaterial({color:p.category==='fuel'?0xffcf5b:p.category==='food'?0xff796f:p.category==='hotel'?0xc89cff:0x62e7f2}));m.position.copy(v(p.lat,p.lon,R+.14));m.userData.poi=p;g.add(m);});},[pois,poiCategory]);
 useEffect(()=>()=>{if(watch.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watch.current);},[]);
 return <section className={'spatial-journey '+(immersive?'is-immersive':'')}><header className="spatial-journey-header"><div><span>03 · SPATIAL JOURNEY</span><h2>3D Interactive Journey</h2><p>Real Earth · live GPS · road route · explore</p></div><button className={live?'live-button active':'live-button'} onClick={toggleLive}><LocateFixed size={15}/>{live?'Live ON':'Live'}</button></header>
 {!immersive&&<div className="spatial-controls"><div className="spatial-search-row"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&void search(q)} placeholder="Search any place, landmark, hotel…"/><button onClick={()=>void search(q)} disabled={busy}>{busy?'…':'Search'}</button></div><div className="spatial-route-card"><div className="spatial-route-title"><div><span>ROUTE SETUP</span><strong>Plan your journey</strong></div><button onClick={locate}><LocateFixed size={14}/> Current</button></div><div className="spatial-vehicle-switch"><button className={vehicle==='car'?'active':''} onClick={()=>setVehicle('car')}><Car size={14}/> Car</button><button className={vehicle==='bike'?'active':''} onClick={()=>setVehicle('bike')}><Bike size={14}/> Bike</button><button className={vehicle==='foot'?'active':''} onClick={()=>setVehicle('foot')}><Footprints size={14}/> Walk</button></div><div className="spatial-route-points"><button onClick={()=>{setMode('start');setSq(start?.name||'')}}><i className="route-dot start"/><div><small>START</small><strong>{start?.name||'Choose starting place'}</strong></div></button><span>→</span><button onClick={()=>{setMode('destination');setDq(dest?.name||'')}}><i className="route-dot end"/><div><small>DESTINATION</small><strong>{dest?.name||'Choose destination'}</strong></div></button></div>{mode&&<div className="spatial-inline-search"><input autoFocus value={mode==='start'?sq:dq} onChange={e=>mode==='start'?setSq(e.target.value):setDq(e.target.value)} onKeyDown={e=>e.key==='Enter'&&void search(mode==='start'?sq:dq,mode)} placeholder={mode==='start'?'Enter starting place…':'Enter destination…'}/><button onClick={()=>void search(mode==='start'?sq:dq,mode)}>Find</button><button onClick={()=>setMode(null)}><X size={14}/></button></div>}<div className="spatial-actions"><button className="spatial-primary" disabled={!start||!dest||busy} onClick={()=>start&&dest&&void route(start,dest)}>{busy?'Finding route…':'Build road route'}</button><button onClick={clear}>Clear</button></div>{summary&&<div className="spatial-summary"><strong>{summary.km.toFixed(0)} km</strong><span>≈ {Math.floor(summary.mins/60)}h {summary.mins%60}m</span><small>{live?'Updating from live location':'Road route ready'}</small></div>}</div></div>}
 <div className="spatial-earth-wrap"><RealWorldGlobe focusPoint={selected} start={start} destination={dest} selected={selected} pois={pois} poiCategory={poiCategory} path={path} livePoint={liveRef.current} navigationActive={navActive} mapCommand={mapCommand} onTap={handleMapTap} onPoiSelect={selectPoi}/><div className="spatial-earth-badge"><span/> REAL 3D EARTH</div><div className="spatial-earth-controls"><button aria-label="Reset globe" onClick={()=>setMapCommand({type:'reset',id:Date.now()})}><RotateCcw size={15}/></button><button aria-label="Zoom in" onClick={()=>setMapCommand({type:'zoomIn',id:Date.now()})}>+</button><button aria-label="Zoom out" onClick={()=>setMapCommand({type:'zoomOut',id:Date.now()})}>−</button><button aria-label="Go to current location" onClick={()=>liveRef.current?setMapCommand({type:'locate',id:Date.now()}):locate()}><Navigation size={15}/></button></div>{summary&&!immersive&&!navActive&&<button className="spatial-begin-nav" onClick={beginNavigation}><Navigation size={22}/><span><b>Begin live navigation</b><small>{vehicle==='car'?'Car':vehicle==='bike'?'Bike':'Walking'} · follow route</small></span></button>}{busy&&<div className="spatial-loading">Finding…</div>}{!busy&&msg&&<div className="spatial-search-message">{msg}</div>}{immersive&&<button className="spatial-exit" onClick={()=>{setImmersive(false);setNavActive(false);setPlay(false)}}><X size={14}/> Exit Journey</button>}{selected&&<div className="spatial-info-card"><span>MAP LOCATION</span><strong>{selectedPoi?.name||selected.name}</strong><small>{selectedPoi?.category?selectedPoi.category.toUpperCase()+' · ':''}{selected.address||selected.lat.toFixed(4)+', '+selected.lon.toFixed(4)}</small><div><button onClick={()=>choose(selected,'start')}>Start here</button><button onClick={()=>choose(selected,'destination')}>Destination</button><button onClick={()=>void loadPois(selected.lat,selected.lon)} disabled={poiBusy}>{poiBusy?'…':'Nearby'}</button></div></div>}</div>
 {!immersive&&<><div className="spatial-poi-panel"><div className="spatial-poi-head"><div><span>EXPLORE NEARBY</span><strong>{poiBusy?'Finding nearby places…':pois.length?pois.length+' places around you':'Tap the Earth to explore this area'}</strong></div>{pois.length>0&&<button onClick={()=>{setPois([]);setSelectedPoi(null)}}><X size={13}/></button>}</div>{pois.length>0&&<div className="spatial-poi-filters"><button className={poiCategory==='all'?'active':''} onClick={()=>setPoiCategory('all')}><MapPin size={12}/> All</button><button className={poiCategory==='fuel'?'active':''} onClick={()=>setPoiCategory('fuel')}><Fuel size={12}/> Fuel</button><button className={poiCategory==='food'?'active':''} onClick={()=>setPoiCategory('food')}><Utensils size={12}/> Food</button><button className={poiCategory==='shop'?'active':''} onClick={()=>setPoiCategory('shop')}><ShoppingBag size={12}/> Shops</button><button className={poiCategory==='hotel'?'active':''} onClick={()=>setPoiCategory('hotel')}><Hotel size={12}/> Hotels</button></div>}{pois.length>0&&<div className="spatial-poi-list">{pois.filter(p=>poiCategory==='all'||p.category===poiCategory).slice(0,8).map(p=><button key={p.id} onClick={()=>selectPoi(p)}><span>{iconForPoi(p.category)}</span><div><strong>{p.name}</strong><small>{p.category} · {p.address||'OpenStreetMap place'}</small></div><b>›</b></button>)}</div>}</div><div className="spatial-journey-footer"><div><span>JOURNEY ROUTE</span><strong>{start&&dest?start.name+' → '+dest.name:'Set start and destination'}</strong></div><button onClick={beginNavigation}><Navigation size={14}/> Begin live journey</button></div><button className="spatial-offline" onClick={()=>{localStorage.setItem('golden-perfect-spatial-journey',JSON.stringify({start,dest,path,summary}));notify?.('Journey saved offline.')}}>Save journey offline</button></>}{immersive&&<div className="spatial-nav-panel"><div className="spatial-nav-top"><div><span>{navActive?'LIVE NAVIGATION':'SPATIAL JOURNEY'}</span><strong>{navSteps[navIndex]?.instruction||'Route ready'}</strong></div><button onClick={()=>setPlay(x=>!x)}>{play?<Pause size={14}/>:<Play size={14}/>}</button></div><div className="spatial-nav-meta"><span>{navSteps[navIndex]?.distance?Math.round(navSteps[navIndex].distance):0} m</span><span>{navIndex+1} / {Math.max(1,navSteps.length)}</span><span>{vehicle==='car'?'CAR':vehicle==='bike'?'BIKE':'WALK'}</span></div><div className="spatial-nav-actions"><button onClick={()=>setNavIndex(i=>Math.min(Math.max(0,navSteps.length-1),i+1))}>Next instruction</button><button onClick={()=>{setNavActive(false);setImmersive(false);setPlay(false)}}>End</button></div></div>}</section>;
}