import {useEffect,useRef,useState} from 'react';
import type {InteriorViewer} from './interior-viewer';
import {asset} from './types';
import {Icon} from './Icon';
import {Modal} from './Modal';
const rooms=[
 {id:'living',name:'Ruang keluarga',floor:1,source:'RevBS',desc:'Tempat pulang, duduk, dan berbagi cerita. Sofa terang, kayu natural, dan aksen hijau yang tenang.',tags:['Sofa linen','Kayu natural','Aksen sage']},
 {id:'dining',name:'Ruang makan',floor:1,source:'RevBS',desc:'Empat kursi menghadap taman. Kaca besar membuat area makan terasa lapang dan terhubung ke luar.',tags:['4 kursi','Kaca ke taman','Cahaya alami']},
 {id:'kitchen',name:'Dapur',floor:1,source:'RevBY',desc:'Komposisi dapur L dengan warna lembut dan bidang kerja yang menyatu dengan ruang bersama.',tags:['Layout L','Kabinet kayu','Palet netral']},
 {id:'foyer',name:'Foyer',floor:1,source:'RevBS',desc:'Transisi kecil dari carport menuju rumah. Area masuk dibuat berbeda dari ruang keluarga.',tags:['Area transisi','Pintu depan','Elevasi masuk']},
 {id:'guest',name:'Kamar tamu',floor:1,source:'RevBY',desc:'Kamar lantai dasar dengan furnitur ringkas dan bukaan kaca ke area taman belakang.',tags:['Tempat tidur','Bukaan taman','Warna hangat']},
 {id:'wc1',name:'Kamar mandi 1',floor:1,source:'RevBY',desc:'Wastafel, area shower berkaca, dan kloset dalam ruang bawah tangga. Detail tinggi bebas masih perlu koordinasi.',tags:['Pemisah kaca','Area basah/kering','Bawah tangga']},
 {id:'master',name:'Kamar utama',floor:2,source:'RevBS',desc:'Material kayu dan warna lembut untuk istirahat. Area depan terhubung dengan balkon pribadi.',tags:['Headboard kayu','Warna tenang','Akses balkon']},
 {id:'bedroom2',name:'Kamar 2',floor:2,source:'RevCB',desc:'Tata letak kamar hasil revisi akses lemari. Komposisi sederhana tanpa menutup jalur menuju pintu.',tags:['Akses lemari','Revisi RevCB','Furnitur ringkas']},
 {id:'rear',name:'Kamar belakang',floor:2,source:'RevBY',desc:'Tempat tidur di sisi ruangan, menyisakan ruang aktivitas. Bukaan mengarah ke area kosong taman.',tags:['Kasur sudut','Bukaan taman','Ruang aktivitas']},
 {id:'wc2',name:'Kamar mandi 2',floor:2,source:'RevBY',desc:'Area shower terpisah dengan kaca, material batu bernuansa hangat, dan sanitair berwarna terang.',tags:['Shower kaca','Batu hangat','Sanitair terang']},
];
export function InteriorExperience(){
 const [enlarged,setEnlarged]=useState(false);
 const [floor,setFloor]=useState(1),[roomId,setRoomId]=useState('living'),[mode,setMode]=useState<'render'|'3d'>('render'),[status,setStatus]=useState('loading'),[selection,setSelection]=useState('');const host=useRef<HTMLDivElement>(null),viewer=useRef<InteriorViewer|null>(null);const room=rooms.find(r=>r.id===roomId)!;
 useEffect(()=>{if(mode!=='3d')return;let dead=false;setStatus('loading');void import('./interior-viewer').then(({InteriorViewer})=>{if(dead||!host.current)return;try{const v=new InteriorViewer(host.current,setStatus,setSelection);viewer.current=v;void v.load(floor);}catch{setStatus('error');}});return()=>{dead=true;viewer.current?.dispose();viewer.current=null;};},[mode,floor]);
 function changeFloor(f:number){setFloor(f);setRoomId(f===1?'living':'master');setSelection('');}
 function choose(id:string){setRoomId(id);setMode('render');}
 return <section className="interior-experience" aria-label="Jelajah interior rumah">
  <aside className="interior-index"><div className="interior-intro"><span className="eyebrow">RUANG / MATERIAL / SUASANA</span><h2>Rumah yang<br/>terasa pulang.</h2><p>Jelajahi setiap ruang, bukan hanya rangkanya.</p></div>
   <div className="interior-floors" aria-label="Lantai interior">{[1,2].map(f=><button key={f} aria-pressed={floor===f} onClick={()=>changeFloor(f)}>Lantai {f}<span>{f===1?'Bersama':'Privat'}</span></button>)}</div>
   <nav className="room-list" aria-label="Pilih ruangan interior">{rooms.filter(r=>r.floor===floor).map((r,i)=><button key={r.id} aria-current={roomId===r.id?'true':undefined} onClick={()=>choose(r.id)}><span className="room-num">{String(i+1).padStart(2,'0')}</span><span>{r.name}</span><span className="room-arrow">↗</span></button>)}</nav>
   <div className="interior-materials"><span className="eyebrow">PALET INTERIOR</span><div><i style={{background:'#d8c3a6'}} title="Kayu natural"/><i style={{background:'#ede9df'}} title="Putih hangat"/><i style={{background:'#a8b6a0'}} title="Sage"/><i style={{background:'#4c5654'}} title="Aksen gelap"/></div><p>Kayu natural · putih hangat · sage</p></div>
   <p className="interior-baseline"><Icon name="info" size={14}/><span>Interior acuan RevCB, antarlantai <strong>2,80 m</strong>. Belum diselaraskan dengan rangka P01 3,40 m. Visual konsep, bukan gambar pelaksanaan.</span></p>
  </aside>
  <div className="interior-showcase"><div className="interior-image-stage">
   {mode==='render'?<img className="room-hero" key={room.id} src={asset(`images/interior/${room.id}.webp`)} alt={`Render Blender ${room.name}, acuan ${room.source}`} fetchPriority="high"/>:<><div ref={host} className="interior-canvas" data-interior-status={status}/>{status!=='ready'&&<div className="interior-loading"><img src={asset(`images/interior/floor${floor}.webp`)} alt={`Pratinjau interior lantai ${floor}`}/><p role="status">{status==='error'?'Model belum bisa dimuat. Render ruang tetap tersedia.':'Memuat interior Blender…'}</p></div>}</>}
   <div className="interior-mode" aria-label="Jenis tampilan interior"><button aria-pressed={mode==='render'} onClick={()=>setMode('render')}><Icon name="camera" size={16}/>Render ruang</button><button aria-pressed={mode==='3d'} onClick={()=>setMode('3d')}><Icon name="cube" size={16}/>Model 3D</button></div>
   {mode==='render'&&<button className="interior-enlarge" aria-label="Perbesar render ruangan" onClick={()=>setEnlarged(true)}><Icon name="focus" size={16}/>Perbesar</button>}
   <span className="interior-image-label">{mode==='render'?`BLENDER / ${room.source}`:'BLENDER / RevCB'}<b>LT {floor}</b></span>
   {mode==='3d'&&<div className="interior-3d-tools"><span>Seret untuk memutar · cubit / gulir untuk zoom</span><div><button disabled={status!=='ready'} onClick={()=>viewer.current?.setView('iso')}>Isometri</button><button disabled={status!=='ready'} onClick={()=>viewer.current?.setView('top')}>Denah atas</button></div></div>}
   {mode==='3d'&&selection&&<p className="interior-selection">{selection.replace(/__/g,' · ')}<button onClick={()=>setSelection('')} aria-label="Tutup informasi interior">×</button></p>}
  </div>
  <div className="room-caption"><div><span className="eyebrow">{mode==='render'?`INTERIOR / LANTAI ${floor}`:'MODEL INTERAKTIF / POTONGAN TERBUKA'}</span><h3>{mode==='render'?room.name:`Interior lantai ${floor}`}</h3><p>{mode==='render'?room.desc:'Model cutaway dari file Blender asli. Lihat posisi perabot, tangga, dan hubungan antar-ruang; klik objek untuk melihat ukurannya pada model.'}</p></div><div className="room-tags">{(mode==='render'?room.tags:['Geometri asli','Orbit & zoom','Klik objek']).map(t=><span key={t}>{t}</span>)}</div></div>
  <div className="interior-filmstrip" aria-label="Galeri ruang">{rooms.filter(r=>r.floor===floor).map(r=><button key={r.id} aria-label={`Lihat ${r.name}`} aria-pressed={mode==='render'&&roomId===r.id} onClick={()=>choose(r.id)}><img loading="lazy" src={asset(`images/interior/${r.id}.webp`)} alt=""/><span>{r.name}</span></button>)}</div>
  </div>
 {enlarged&&<Modal title={room.name} onClose={()=>setEnlarged(false)}><img className="interior-lightbox" src={asset(`images/interior/${room.id}.webp`)} alt={`Render utuh ${room.name} dari Blender ${room.source}`}/><p className="modal-small">Render acuan {room.source}. Interior belum diselaraskan ke tinggi struktur P01.</p></Modal>}
 </section>;
}
