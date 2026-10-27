import {useEffect,useRef,useState} from 'react';

import {Icon} from './Icon';
import {InteriorExperience} from './InteriorExperience';

import {Modal} from './Modal';

import project from '../public/models/project.json';

import {asset,defaultLayers,layerLabels,concreteLayers,rebarLayers} from './types';

import type {ViewerOptions,Layer,CameraView,ElementInfo} from './types';

import type {HouseViewer} from './viewer';

import './style.css';

const format=(v:number,digits=2)=>v.toLocaleString('id-ID',{maximumFractionDigits:digits});

const initialOptions:ViewerOptions={layers:{...defaultLayers},floor:'all',clip:'off',clipValue:100,opacity:1,measure:false};

const sheets=[['lt1','Denah lantai 1','A-01'],['lt2','Denah lantai 2','A-02'],['pondasi','Titik pondasi & kolom','S-01'],['balok','Balok lantai 2','S-02'],['pelat','Pelat & tangga','S-04'],['material','Rekap material','Q-01']] as const;

export function App(){

 const [view,setView]=useState<'interior'|'model'|'drawings'|'data'>(()=>new URLSearchParams(location.search).has('view')?'model':'interior');const [options,setOptions]=useState<ViewerOptions>(initialOptions);const initial=useRef(initialOptions);

 const [ready,setReady]=useState(false);const [status,setStatus]=useState('Menyiapkan model Blender…');const [error,setError]=useState('');const [elements,setElements]=useState<ElementInfo[]>([]);const [selected,setSelected]=useState<ElementInfo|null>(null);const [distance,setDistance]=useState<number|null>(null);

 const [mode,setMode]=useState('concrete');const [camera,setCamera]=useState<CameraView>('iso');const [mobilePanel,setMobilePanel]=useState(false);const [dialog,setDialog]=useState<'help'|'roof'|'docs'|null>(null);const [sheet,setSheet]=useState('lt1');const [zoom,setZoom]=useState(1);const [toast,setToast]=useState('');

 const host=useRef<HTMLDivElement>(null);const viewer=useRef<HouseViewer|null>(null);initial.current=options;

 useEffect(()=>{if(view!=='model')return;setReady(false);setError('');let disposed=false;void import('./viewer').then(({HouseViewer})=>{if(disposed||!host.current)return;try{viewer.current=new HouseViewer(host.current,initial.current,{ready:els=>{setElements(els);setReady(true);},select:setSelected,measure:setDistance,status:setStatus,error:setError});}catch{setError('Browser ini belum dapat menampilkan WebGL. Gambar studi dan PDF tetap dapat dibuka.');}});return()=>{disposed=true;viewer.current?.dispose();viewer.current=null;};},[view]);

 useEffect(()=>{viewer.current?.update(options);},[options]);

 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(id);},[toast]);

 function toggleLayer(layer:Layer){if(layer==='roof'&&!options.layers.roof){setDialog('roof');return;}setOptions(o=>({...o,layers:{...o.layers,[layer]:!o.layers[layer]}}));setMode('custom');}

 function preset(next:string){setMode(next);setOptions(o=>({...o,layers:{...defaultLayers,...Object.fromEntries(concreteLayers.map(k=>[k,next!=='rebar'])),...Object.fromEntries(rebarLayers.map(k=>[k,next!=='concrete']))},opacity:next==='combined'?.22:1}));}

 function changeCamera(v:CameraView){setCamera(v);viewer.current?.setView(v);}

 function reset(){setOptions({...initialOptions,layers:{...defaultLayers}});setMode('concrete');changeCamera('iso');viewer.current?.clearSelection();viewer.current?.clearMeasurement();setToast('Tampilan awal dipulihkan');}

 async function share(){const url=new URL(location.href);url.searchParams.set('view',camera);url.searchParams.set('mode',mode);url.searchParams.set('floor',options.floor);url.searchParams.set('clip',options.clip);url.searchParams.set('cut',String(options.clipValue));url.searchParams.set('layers',Object.keys(defaultLayers).map(k=>options.layers[k as Layer]?'1':'0').join(''));url.searchParams.set('opacity',String(Math.round(options.opacity*100)));try{await navigator.clipboard.writeText(url.toString());setToast('Tautan tampilan disalin');}catch{setToast('Salin alamat halaman dari browser untuk membagikan proyek.');}}

 useEffect(()=>{if(!ready)return;const params=new URLSearchParams(location.search);const v=params.get('view');const m=params.get('mode');if(['iso','front','top','side'].includes(v??''))changeCamera(v as CameraView);if(['concrete','rebar','combined'].includes(m??''))preset(m!);const flags=params.get('layers');if(flags&&/^[01]{9}$/.test(flags)){const nextLayers={...defaultLayers};Object.keys(defaultLayers).forEach((k,i)=>{nextLayers[k as Layer]=flags[i]==='1';});const floor=params.get('floor'),clip=params.get('clip'),cut=Number(params.get('cut')??100),opacity=Number(params.get('opacity')??100);const roof=nextLayers.roof;nextLayers.roof=false;setOptions(o=>({...o,layers:nextLayers,floor:['all','lt1','lt2'].includes(floor??'')?floor as ViewerOptions['floor']:'all',clip:['off','x','y','z'].includes(clip??'')?clip as ViewerOptions['clip']:'off',clipValue:Number.isFinite(cut)?Math.max(0,Math.min(cut,100)):100,opacity:Number.isFinite(opacity)?Math.max(.1,Math.min(opacity/100,1)):1}));setMode(m??'custom');if(roof)setDialog('roof');}},[ready]);

 const clipExtent=options.clip==='off'?0:{x:6,y:14,z:6.8}[options.clip]*options.clipValue/100;

 const sheetItem=sheets.find(s=>s[0]===sheet)!;

 return <div className="app"><h1 className="sr-only">Rumah 10902  -  studio eksplorasi model dan gambar studi</h1><a className="skip-link" href="#workspace">Langsung ke konten</a>

  <header className="topbar"><a className="brand" href={import.meta.env.BASE_URL} aria-label="Rumah 10902, tampilan awal"><span className="brand-mark"><span/><span/><span/></span><span>RUMAH <b>10902</b><small>STUDIO RENCANA · SURABAYA</small></span></a>

   <nav className="main-nav" aria-label="Tampilan proyek">{[['interior','Interior','camera'],['model','Struktur','cube'],['drawings','Gambar','file'],['data','Data proyek','data']].map(([id,label,icon])=><button key={id} className={view===id?'active':''} aria-current={view===id?'page':undefined} onClick={()=>{setView(id as typeof view);setMobilePanel(false);}}><Icon name={icon} size={17}/>{label}</button>)}</nav>

   <div className="header-actions"><span className="revision">{view==='interior'?'RevCB':'P01'} <i/> STUDI</span><button className="button quiet documents-button" onClick={()=>setDialog('docs')}><Icon name="download" size={16}/><span>Dokumen</span></button></div>

  </header>

  <div className={`workspace ${view==='interior'?'interior-active':''}`}>

   <aside className={`sidebar ${mobilePanel?'open':''}`} aria-label="Pengaturan model"><div className="sidebar-heading"><div><span className="eyebrow">PROYEK PERSONAL / 10902</span><p className="project-title">Rumah, lapis<br/>demi lapis.</p></div><button className="icon-button mobile-only" onClick={()=>setMobilePanel(false)} aria-label="Tutup pengaturan"><Icon name="close"/></button></div><p className="intro">Lihat apa yang membentuk ruang.<br/>Model asli dari Blender, kini di tanganmu.</p>

    <section className="control-section"><h2>Tampilan model</h2><div className="mode-control">{[['concrete','Struktur'],['rebar','Tulangan'],['combined','Gabungan']].map(([id,label])=><button key={id} aria-pressed={mode===id} disabled={!ready} onClick={()=>{preset(id);setView('model');}}>{label}</button>)}</div></section>

    <section className="control-section"><div className="section-heading"><h2>Lapisan</h2><span className="utility">{Object.values(options.layers).filter(Boolean).length} aktif</span></div><fieldset disabled={!ready} className="layer-list"><legend className="sr-only">Lapisan model 3D</legend>{concreteLayers.map((l,i)=><label className="layer-row" key={l}><span className={`layer-swatch swatch-${l}`}/><span>{layerLabels[l]}<small>{['10 posisi · 20 segmen','13 garis per tingkat','Elevasi +3,40 m','20 kenaikan · bentuk L'][i]}</small></span><input type="checkbox" role="switch" checked={options.layers[l]} onChange={()=>toggleLayer(l)} aria-label={layerLabels[l]}/></label>)}

     <details className="rebar-details" open={rebarLayers.some(k=>options.layers[k])}><summary><Icon name="layers" size={15}/> Tulangan ilustratif <span>4 lapisan</span></summary>{rebarLayers.map(l=><label className="layer-row compact" key={l}><span>{layerLabels[l]}</span><input type="checkbox" role="switch" checked={options.layers[l]} onChange={()=>toggleLayer(l)} aria-label={layerLabels[l]}/></label>)}</details>

     <label className="layer-row roof-row"><span className="layer-swatch swatch-roof"/><span>Opsi dak atap<small>Di luar skenario default</small></span><input type="checkbox" role="switch" checked={options.layers.roof} onChange={()=>toggleLayer('roof')} aria-label="Opsi dak atap"/></label>

    </fieldset></section>

    <section className="control-section"><h2>Isolasi lantai</h2><div className="segment">{[['all','Semua'],['lt1','Lantai 1'],['lt2','Lantai 2']].map(([id,label])=><button key={id} aria-pressed={options.floor===id} disabled={!ready} onClick={()=>setOptions(o=>({...o,floor:id as ViewerOptions['floor']}))}>{label}</button>)}</div></section>

    <section className="control-section"><div className="section-heading"><h2>Potong model</h2><Icon name="cut" size={16}/></div><select className="select" aria-label="Arah potongan" value={options.clip} disabled={!ready} onChange={e=>setOptions(o=>({...o,clip:e.target.value as ViewerOptions['clip']}))}><option value="off">Tanpa potongan</option><option value="z">Ketinggian · Z</option><option value="x">Lebar · X</option><option value="y">Kedalaman · Y</option></select>{options.clip!=='off'&&<label className="range-label"><span>Batas potongan <b>{format(clipExtent)} m</b></span><input aria-label="Batas potongan" type="range" min="0" max="100" value={options.clipValue} onChange={e=>setOptions(o=>({...o,clipValue:+e.target.value}))}/></label>}</section>

    <div className="sidebar-bottom"><Icon name="info" size={16}/><p>Studi koordinasi, <strong>bukan gambar siap bangun.</strong> Tulangan yang terlihat belum menjadi desain pemasangan.</p></div>

   </aside>

   <main className="main-stage" id="workspace" tabIndex={-1}>
{view==='interior'&&<InteriorExperience/>}

    <section className="model-workspace" hidden={view!=='model'} aria-label="Eksplorasi model Blender"><div ref={host} className="canvas-host" data-model-status={ready?'ready':error?'error':'loading'}/>

     {!ready&&<div className="loading-cover"><img src={asset('images/model-01.webp')} alt="Pratinjau rangka dan pelat rumah dari Blender"/><div className="loading-text">{!error&&<span className="spinner"/>}<strong>{error||status}</strong>{error&&<button className="button" onClick={()=>location.reload()}>Muat ulang</button>}</div></div>}

     <div className="stage-heading"><span className="eyebrow">MODEL BLENDER / P01</span><h2>Eksplorasi ruang & struktur</h2><p><span className="live-dot"/>{status}</p></div>

     <div className="stage-tools"><button className="icon-button" title="Ambil gambar" aria-label="Ambil gambar model" disabled={!ready} onClick={()=>viewer.current?.snapshot()}><Icon name="camera"/></button><button className="icon-button" title="Bagikan tampilan" aria-label="Bagikan tampilan" onClick={()=>void share()}><Icon name="share"/></button><button className="icon-button" title="Cara menjelajah" aria-label="Cara menjelajah" onClick={()=>setDialog('help')}><Icon name="info"/></button></div>

     {error&&ready&&<div className="asset-error" role="alert">{error}<button onClick={()=>location.reload()}>Muat ulang</button></div>}<div className="model-facts"><span><b>6 × 14</b> m tapak konsep</span><span><b>3,40</b> m antarlantai</span><span><b>6,80</b> m atas balok atap</span></div>

     {options.layers.roof&&<div className="roof-notice"><Icon name="info" size={16}/><span>Dak atap adalah opsi. Berat beton tambahan <b>{format(project.roofAddedDeadLoad,1)} kN</b>, belum dianalisis.</span></div>}

     {selected?<aside className="inspector" aria-label="Properti elemen terpilih"><div className="inspector-top"><span className="eyebrow">ELEMEN TERPILIH</span><button className="icon-button small" aria-label="Hapus pilihan elemen" onClick={()=>viewer.current?.clearSelection()}><Icon name="close" size={16}/></button></div><h3>{selected.title}</h3><span className="element-type">{selected.kind}</span><dl><div><dt>Elevasi model</dt><dd>{selected.elevation}</dd></div><div><dt>Ukuran model</dt><dd>{selected.dimensions}</dd></div>{selected.span!==undefined&&<div><dt>Bentang antarsumbu</dt><dd>{format(selected.span)} m</dd></div>}{selected.volume!==undefined&&<div><dt>Volume model</dt><dd>{format(selected.volume,3)} m³</dd></div>}</dl><p className="inspector-note">{selected.warning}</p><button className="button focus-button" onClick={()=>viewer.current?.focusSelection()}><Icon name="focus" size={16}/>Fokus elemen</button></aside>:<div className="selection-hint"><span className="cursor-symbol">↖</span>Klik elemen untuk melihat datanya</div>}

     <div className="element-picker"><label className="sr-only" htmlFor="element-select">Pilih elemen melalui daftar</label><select id="element-select" value={selected?.modelId??''} disabled={!ready} onChange={e=>e.target.value?viewer.current?.selectElement(e.target.value):viewer.current?.clearSelection()}><option value="">Pilih elemen…</option>{elements.map(e=><option key={e.modelId} value={e.modelId}>{e.title}</option>)}</select></div>

     <div className="viewport-bottom"><div className="camera-bar" aria-label="Sudut kamera">{[['iso','Isometri'],['front','Depan'],['top','Atas'],['side','Samping']].map(([id,label])=><button key={id} aria-pressed={camera===id} disabled={!ready} onClick={()=>changeCamera(id as CameraView)}>{label}</button>)}<span className="toolbar-divider"/><button aria-label="Reset tampilan" title="Reset tampilan" disabled={!ready} onClick={reset}><Icon name="reset" size={17}/></button></div><button className={`measure-button ${options.measure?'active':''}`} aria-pressed={options.measure} disabled={!ready} onClick={()=>setOptions(o=>({...o,measure:!o.measure}))}><Icon name="measure" size={18}/><span>Ukur jarak</span></button></div>

     {options.measure&&<div className="measure-status" role="status"><Icon name="measure" size={16}/>{distance===null?'Pilih dua titik pada permukaan model':`${format(distance,3)} m · jarak titik model`}<button onClick={()=>viewer.current?.clearMeasurement()}>Hapus</button></div>}

     <div className="canvas-gesture">Seret untuk memutar <span>·</span> Gulir untuk zoom <span>·</span> Klik kanan untuk geser</div>

    </section>

    {view==='drawings'&&<section className="drawings-view"><div className="content-heading"><div><span className="eyebrow">PAKET GAMBAR / A3</span><h2>Di balik setiap garis.</h2><p>Denah, struktur, dan batas data dalam satu paket studi.</p></div><a className="button primary" href={asset('documents/paket-gambar-p01.pdf')} download><Icon name="download" size={17}/>PDF · 12 lembar</a></div><div className="sheet-tabs">{sheets.map(([id,label,code])=><button key={id} aria-pressed={sheet===id} onClick={()=>{setSheet(id);setZoom(1);}}><span>{code}</span>{label}</button>)}</div><div className="drawing-toolbar"><strong>{sheetItem[2]} / {sheetItem[1]}</strong><label>Zoom <input type="range" aria-label="Zoom gambar" min="80" max="200" value={zoom*100} onChange={e=>setZoom(+e.target.value/100)}/><span>{Math.round(zoom*100)}%</span></label></div><div className="drawing-canvas"><img src={asset(`drawings/${sheet}.svg`)} alt={`${sheetItem[1]}, lembar ${sheetItem[2]} dalam format A3`} style={{width:`${zoom*100}%`}}/></div><p className="drawing-footnote"><Icon name="info" size={14}/>Skala cetak hanya berlaku pada PDF A3 100%. Gambar browser mengikuti zoom layar.</p></section>}

    {view==='data'&&<section className="data-view"><div className="content-heading"><div><span className="eyebrow">DATA MODEL / P01</span><h2>Angka yang bisa ditelusuri.</h2><p>Geometri dari Blender. Asumsi anggaran dibedakan dari desain.</p></div><span className="status-tag">Studi, bukan sertifikasi</span></div><div className="data-headline"><div><span>Luas lantai model</span><strong>{format(project.floorArea,3)}<small>m²</small></strong></div><div><span>Posisi kolom</span><strong>10<small>titik</small></strong></div><div><span>Allowance besi rangka atas</span><strong>{format(project.steelAllowanceKg/1000,2)}<small>ton</small></strong></div></div><h3>Volume beton model</h3><table className="data-table"><thead><tr><th>Elemen</th><th>Volume</th><th>Status</th></tr></thead><tbody>{[['Kolom','10_Concrete_Columns'],['Balok dua tingkat','11_Concrete_Beams'],['Pelat LT2, bersih di luar balok & bordes','12_Dak_LT2'],['Tangga & bordes','13_Stair']].map(([label,key])=><tr key={key}><td>{label}</td><td>{format(project.volumes[key as keyof typeof project.volumes],3)} m³</td><td>Geometri studi</td></tr>)}</tbody></table><div className="data-note"><Icon name="info"/><div><h3>Yang belum menjadi desain</h3><p>Pondasi, sloof, diameter dan jumlah besi, sengkang, sambungan, data tanah, serta kapasitas gempa belum ditetapkan. Tulangan visual bukan bar bending schedule. Angka besi berasal dari allowance per volume, bukan hitungan batang pada layar.</p></div></div><a className="text-link" href={asset('documents/paket-gambar-p01.pdf')} target="_blank" rel="noreferrer">Baca seluruh asumsi di paket gambar <Icon name="arrow" size={17}/></a></section>}

   </main>

  </div>

  <footer className="app-footer"><span><i/>RUMAH 10902 · {view==='interior'?'INTERIOR':'P01'}</span><p>Studi koordinasi. Bukan as-built atau gambar siap konstruksi.</p><button onClick={()=>setDialog('help')}>Panduan <Icon name="arrow" size={13}/></button></footer>

  {view==='model'&&<button className="mobile-layer-button" onClick={()=>setMobilePanel(!mobilePanel)} aria-expanded={mobilePanel}><Icon name="layers" size={18}/>{mobilePanel?'Kembali ke model':'Lapisan & kontrol'}</button>}

  {toast&&<div className="toast" role="status"><Icon name="check" size={17}/>{toast}</div>}

  {dialog&&<Modal title={dialog==='roof'?'Opsi dak atap beton':dialog==='docs'?'Bawa proyek ini bersamamu.':'Cara menjelajahi rumah'} onClose={()=>setDialog(null)}>{dialog==='roof'?<><p>Dak atap beton <strong>bukan skenario default</strong>. Model opsi ini menambah {format(project.roofAddedDeadLoad,1)} kN berat beton; selisih terhadap asumsi atap ringan sekitar {format(project.roofNetAddedDeadLoad,1)} kN sebelum finishing.</p><div className="warning-block">Kapasitas kolom, balok dan pondasi untuk opsi ini belum dianalisis. Menyalakan lapisan tidak berarti desain aman.</div><button className="button primary" onClick={()=>{setOptions(o=>({...o,layers:{...o.layers,roof:true}}));setMode('custom');setDialog(null);}}>Tampilkan sebagai opsi studi <Icon name="eye" size={17}/></button></>:dialog==='docs'?<><p>Paket teknis P01 memakai LT2 +3,40 m dan balok atap +6,80 m. Interior RevCB terpisah, masih menggunakan acuan antarlantai 2,80 m; keduanya belum diselaraskan.</p><a className="document-row" href={asset('documents/paket-gambar-p01.pdf')} download><Icon name="file" size={28}/><span><strong>Paket gambar P01</strong><small>12 lembar A3 · PDF · 6,4 MB</small></span><Icon name="download"/></a><a className="document-row" href={asset('documents/rumah-10902-p01.blend')} download><Icon name="cube" size={28}/><span><strong>Blender rangka P01</strong><small>4 scene · .blend · Blender 4.5 LTS</small></span><Icon name="download"/></a><a className="document-row" href={asset('documents/rumah-10902-interior-revcb.blend')} download><Icon name="cube" size={28}/><span><strong>Blender interior RevCB</strong><small>Acuan interior 2,80 m · .blend · 13,5 MB</small></span><Icon name="download"/></a><div className="warning-block">Semua berstatus studi. Baca catatan batas desain sebelum menggunakannya untuk diskusi pembangunan.</div></>:<><div className="help-row"><Icon name="camera"/><span><strong>Interior lebih dulu</strong>Pilih lantai dan ruangan untuk melihat render Blender. Perbesar membuka gambar utuh. Model 3D menampilkan cutaway dengan perabot yang dapat diputar.</span></div><div className="help-row"><Icon name="cube"/><span><strong>Putar & jelajahi</strong>Seret untuk orbit, gulir untuk zoom, klik kanan untuk geser. Di ponsel, gunakan satu atau dua jari.</span></div><div className="help-row"><Icon name="layers"/><span><strong>Buka lapisan</strong>Pilih struktur, tulangan, atau gabungan. Isolasi lantai dan geser potongan untuk melihat bagian dalam.</span></div><div className="help-row"><Icon name="focus"/><span><strong>Pilih elemen</strong>Klik model atau gunakan daftar elemen. Pilih Fokus untuk melihat dari dekat. Tombol Home mengembalikan kamera.</span></div><div className="help-row"><Icon name="measure"/><span><strong>Ukur dua titik</strong>Klik dua permukaan model. Ini jarak geometri model, bukan ukuran lapangan atau bukti ruang bebas.</span></div><p className="modal-small">Tombol Escape menghapus pilihan dan pengukuran saat kanvas aktif. Dukung reduced motion mengikuti pengaturan perangkat.</p></>}</Modal>}

 </div>

}

