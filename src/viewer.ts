import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import project from '../public/models/project.json';
import { asset,layerLabels } from './types';
import type { Layer,ViewerOptions,CameraView,ElementInfo } from './types';

interface Callbacks {ready:(elements:ElementInfo[])=>void; select:(e:ElementInfo|null)=>void; measure:(value:number|null)=>void; status:(s:string)=>void; error:(s:string)=>void}
interface Meta {elementId:string;layer:Layer;minElevation:number;maxElevation:number}
const fmt=(v:number)=>v.toLocaleString('id-ID',{maximumFractionDigits:2});
const center=new THREE.Vector3(3,3.0,-7);
export class HouseViewer {
 readonly renderer:THREE.WebGLRenderer;
 readonly scene=new THREE.Scene();
 readonly camera=new THREE.PerspectiveCamera(36,1,.05,180);
 readonly controls:OrbitControls;
 private loader=new GLTFLoader(); private meshes:THREE.Mesh[]=[];
 private models=new THREE.Group(); private planes:THREE.Plane[]=[];
 private options:ViewerOptions; private callbacks:Callbacks; private host:HTMLElement;
 private frame=0; private destroyed=false; private initialFramed=false; private resize:ResizeObserver;
 private rebarPromise?:Promise<void>; private roofPromise?:Promise<void>;
 private selected:ElementInfo|null=null; private selectedBounds?:THREE.Box3;
 private selectionHelper?:THREE.Box3Helper; private measureGroup=new THREE.Group();
 private measurePoints:THREE.Vector3[]=[]; private tween=0; private clickStart={x:0,y:0};
 private onMove=(e:PointerEvent)=>{this.clickStart={x:e.clientX,y:e.clientY};};
 private onClick=(e:PointerEvent)=>{if(Math.hypot(e.clientX-this.clickStart.x,e.clientY-this.clickStart.y)<6)this.pick(e);};
 private onKey=(e:KeyboardEvent)=>{if(e.key==='Home'){e.preventDefault();this.setView('iso');}if(e.key==='Escape'){this.clearSelection();this.clearMeasurement();}};
 constructor(host:HTMLElement,options:ViewerOptions,callbacks:Callbacks){
  this.host=host;this.options=options;this.callbacks=callbacks;
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.localClippingEnabled=true;
  this.renderer.domElement.setAttribute('aria-label','Model 3D Rumah 10902. Seret untuk memutar, gulir untuk zoom. Home untuk reset.');this.renderer.domElement.tabIndex=0;
  this.renderer.domElement.addEventListener('pointerdown',this.onMove);this.renderer.domElement.addEventListener('pointerup',this.onClick);this.renderer.domElement.addEventListener('keydown',this.onKey);
  host.append(this.renderer.domElement);this.scene.background=new THREE.Color('#e9eeed');
  this.camera.position.set(17,15,17);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.copy(center);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minDistance=4;this.controls.maxDistance=48;this.controls.maxPolarAngle=Math.PI*.49;this.controls.addEventListener('change',this.invalidate);
  this.scene.add(this.models,this.measureGroup);this.scene.add(new THREE.HemisphereLight(0xf0f6ff,0x788b86,2.8));
  const sun=new THREE.DirectionalLight(0xfff6e8,3.5);sun.position.set(8,17,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-13;sun.shadow.camera.right=13;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;sun.shadow.normalBias=.08;sun.shadow.bias=-.00015;sun.target.position.set(3,0,-7);this.scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0xd8e8ff,1.3);fill.position.set(-8,9,-14);this.scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xe9eeed,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.18;ground.receiveShadow=true;this.scene.add(ground);
  const grid=new THREE.GridHelper(30,30,0xa3b8bc,0xd1dddc);grid.position.set(3,-.16,-7);(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.45;this.scene.add(grid);
  const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.14,0),new THREE.Vector3(6,-.14,0),new THREE.Vector3(6,-.14,-14),new THREE.Vector3(0,-.14,-14)]),new THREE.LineBasicMaterial({color:0x72969e}));this.scene.add(outline);
  this.resize=new ResizeObserver(this.onResize);this.resize.observe(host);this.onResize();
  void this.load('structure.glb').then(()=>{if(this.destroyed)return;this.update(options);callbacks.ready(this.getElements());callbacks.status('Model Blender siap');}).catch(()=>callbacks.error('Model belum berhasil dimuat. Coba muat ulang, atau buka gambar studi.'));
 }
 private onResize=()=>{const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(!this.initialFramed){this.camera.position.copy(center.clone().add(new THREE.Vector3(14,12,24).multiplyScalar(Math.max(1,Math.sqrt(1/this.camera.aspect)))));this.controls.update();this.initialFramed=true;}this.invalidate();};
 private invalidate=()=>{if(!this.frame&&!this.destroyed)this.frame=requestAnimationFrame(()=>{this.frame=0;this.controls.update();this.renderer.render(this.scene,this.camera);});};
 private meta(mesh:THREE.Object3D):Meta|null{let o:THREE.Object3D|null=mesh;while(o){if(o.userData.elementId)return o.userData as Meta;o=o.parent;}return null;}
 private async load(file:string){
  const gltf=await this.loader.loadAsync(asset('models/'+file));if(this.destroyed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});return;}
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const meta=this.meta(o);if(!meta)return;this.meshes.push(o);o.castShadow=!meta.layer.startsWith('rebar');o.receiveShadow=true;
   const material=(Array.isArray(o.material)?o.material:[o.material]) as THREE.MeshStandardMaterial[];
   for(const m of material){m.side=THREE.DoubleSide;m.clipShadows=true;m.roughness=meta.layer.startsWith('rebar')?.5:.85;m.metalness=meta.layer.startsWith('rebar')?.35:0;}
   if(!meta.layer.startsWith('rebar')){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,35),new THREE.LineBasicMaterial({color:0x3d6470,transparent:true,opacity:.26}));edges.userData.edge=true;o.add(edges);}
  });this.models.add(gltf.scene);this.models.updateMatrixWorld(true);this.applyVisibility();this.invalidate();
 }
 update(options:ViewerOptions){
  this.options=options;this.planes=[];
  if(options.floor==='lt1')this.planes.push(new THREE.Plane(new THREE.Vector3(0,-1,0),3.401));
  if(options.floor==='lt2')this.planes.push(new THREE.Plane(new THREE.Vector3(0,1,0),-3.279));
  if(options.clip!=='off'){
   const val=options.clipValue/100*({x:6,y:14,z:6.8}[options.clip])+.002;
   this.planes.push(options.clip==='x'?new THREE.Plane(new THREE.Vector3(-1,0,0),val):options.clip==='y'?new THREE.Plane(new THREE.Vector3(0,0,1),val):new THREE.Plane(new THREE.Vector3(0,-1,0),val));
  }
  if(Object.entries(options.layers).some(([k,v])=>k.startsWith('rebar')&&v)&&!this.rebarPromise){this.callbacks.status('Memuat tulangan ilustratif…');this.rebarPromise=this.load('reinforcement.glb').then(()=>this.callbacks.status('Tulangan visual siap')).catch(()=>{this.rebarPromise=undefined;this.callbacks.error('Tulangan belum termuat. Coba aktifkan kembali lapisannya.');});}
  if(options.layers.roof&&!this.roofPromise){this.roofPromise=this.load('roof-option.glb').catch(()=>{this.roofPromise=undefined;this.callbacks.error('Opsi dak atap belum termuat.');});}
  this.applyVisibility();if(this.selected&&!options.layers[this.selected.layer])this.clearSelection();this.renderer.domElement.style.cursor=options.measure?'crosshair':'grab';this.invalidate();
 }
 private applyVisibility(){for(const mesh of this.meshes){const meta=this.meta(mesh);if(!meta)continue;mesh.visible=this.options.layers[meta.layer];const isConcrete=!meta.layer.startsWith('rebar');
  for(const m of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){m.clippingPlanes=this.planes;if(isConcrete){m.opacity=this.options.opacity;m.transparent=m.opacity<1;m.depthWrite=m.opacity>=1;}m.needsUpdate=true;}
  for(const child of mesh.children)if(child instanceof THREE.LineSegments){const m=child.material as THREE.LineBasicMaterial;m.clippingPlanes=this.planes;m.opacity=.24*this.options.opacity;}
 }}
 getElements(){const seen=new Set<string>();return this.meshes.flatMap(mesh=>{const m=this.meta(mesh);if(!m||m.layer.startsWith('rebar')||seen.has(m.elementId))return [];seen.add(m.elementId);return [this.describe(mesh)];});}
 private describe(mesh:THREE.Mesh,point?:THREE.Vector3):ElementInfo{
  const m=this.meta(mesh)!;const b=new THREE.Box3().setFromObject(mesh);const size=b.getSize(new THREE.Vector3());let title=layerLabels[m.layer],span:number|undefined,id=m.elementId;
  if(m.layer==='columns'){const found=m.elementId.match(/K1_([AB]\d)_L(\d)/);if(found)title=`Kolom ${found[1]} · LT${found[2]}`;}
  if(m.layer==='beams'){
   const isRoof=m.elementId.includes('Roof');title=isRoof?'Kesatuan balok atap':'Kesatuan balok LT2';
   if(point){const px=point.x,py=-point.z;let best=Infinity;let nearest=project.beamMembers[0];for(const member of project.beamMembers){const a=new THREE.Vector2(...member.p1 as [number,number]),z=new THREE.Vector2(...member.p2 as [number,number]);const delta=z.clone().sub(a);const t=THREE.MathUtils.clamp(new THREE.Vector2(px,py).sub(a).dot(delta)/delta.lengthSq(),0,1);const dist=a.addScaledVector(delta,t).distanceTo(new THREE.Vector2(px,py));if(dist<best){best=dist;nearest=member;}}
    span=nearest.span_m;title=`${isRoof?'RB':'B1'}-${nearest.suffix}`;id=title;
   }
  }
  if(m.layer==='slab')title='PL1 · Pelat lantai 2';if(m.layer==='stairs')title=m.elementId.includes('Flight')?'Flight tangga L':m.elementId.includes('Top')?'Bordes atas':'Bordes putar';
  const volumeMap:Record<string,string>={slab:'12_Dak_LT2',roof:'90_Dak_Atap_OPSI'};
  const volume=m.layer==='columns'?size.x*size.y*size.z:m.layer==='slab'||m.layer==='roof'?project.volumes[volumeMap[m.layer] as keyof typeof project.volumes]:undefined;
  return {id,modelId:m.elementId,title,layer:m.layer,kind:layerLabels[m.layer],elevation:`+${fmt(b.min.y)} – +${fmt(b.max.y)} m`,dimensions:m.layer==='beams'?'300 × 500 mm · envelope studi':m.layer==='columns'?'300 × 300 mm · envelope studi':`${fmt(size.x)} × ${fmt(size.z)} × ${fmt(size.y)} m`,volume,span,warning:m.layer.startsWith('rebar')?'Pola visual saja. Diameter, jarak, kait dan sambungan belum dirancang.':m.layer==='roof'?'Opsi, bukan atap default. Tambahan beban belum dianalisis.':'Geometri studi. Ukuran dan kapasitas struktur belum disahkan.'};
 }
 private hitAt(e:PointerEvent){const r=this.renderer.domElement.getBoundingClientRect();const p=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(p,this.camera);return ray.intersectObjects(this.meshes,false).find(h=>h.object.visible&&this.planes.every(p=>p.distanceToPoint(h.point)>=-.0001));}
 private pick(e:PointerEvent){const h=this.hitAt(e);if(!h){if(!this.options.measure)this.clearSelection();return;}if(this.options.measure){this.addMeasure(h.point);return;}const mesh=h.object as THREE.Mesh;this.selected=this.describe(mesh,h.point);this.selectedBounds=new THREE.Box3().setFromObject(mesh);if(this.selected.span!==undefined){const member=project.beamMembers.find(m=>this.selected?.id.endsWith('-'+m.suffix));if(member){const top=this.selected.id.startsWith('RB')?6.8:3.4;this.selectedBounds=new THREE.Box3(new THREE.Vector3(Math.min(member.p1[0],member.p2[0])-.15,top-.5,-Math.max(member.p1[1],member.p2[1])-.15),new THREE.Vector3(Math.max(member.p1[0],member.p2[0])+.15,top,-Math.min(member.p1[1],member.p2[1])+.15));}}this.showBox(this.selectedBounds);this.callbacks.select(this.selected);}
 private showBox(bounds:THREE.Box3){if(this.selectionHelper){this.scene.remove(this.selectionHelper);this.selectionHelper.geometry.dispose();(this.selectionHelper.material as THREE.Material).dispose();}this.selectionHelper=new THREE.Box3Helper(bounds,0xbb7148);this.scene.add(this.selectionHelper);this.invalidate();}
 selectElement(modelId:string){const mesh=this.meshes.find(m=>this.meta(m)?.elementId===modelId);if(!mesh)return;this.selected=this.describe(mesh);this.selectedBounds=new THREE.Box3().setFromObject(mesh);this.showBox(this.selectedBounds);this.callbacks.select(this.selected);}
 clearSelection(){this.selected=null;this.selectedBounds=undefined;if(this.selectionHelper){this.scene.remove(this.selectionHelper);this.selectionHelper.geometry.dispose();(this.selectionHelper.material as THREE.Material).dispose();this.selectionHelper=undefined;}this.callbacks.select(null);this.invalidate();}
 focusSelection(){if(!this.selectedBounds)return;const target=this.selectedBounds.getCenter(new THREE.Vector3());const size=this.selectedBounds.getSize(new THREE.Vector3()).length();this.animateCamera(target.clone().add(new THREE.Vector3(1,.7,1).normalize().multiplyScalar(Math.max(size*1.8,4))),target);}
 setView(view:CameraView){const configs={iso:[17,15,17],front:[3,5,22],top:[3,29,-6.99],side:[27,6,-7]};const pos=new THREE.Vector3(...configs[view] as [number,number,number]);pos.sub(center).multiplyScalar(Math.max(1,Math.sqrt(1/this.camera.aspect))).add(center);this.animateCamera(pos,center.clone());}
 private animateCamera(pos:THREE.Vector3,target:THREE.Vector3){cancelAnimationFrame(this.tween);if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(pos);this.controls.target.copy(target);this.controls.update();this.invalidate();return;}const old=this.camera.position.clone(),oldTarget=this.controls.target.clone(),start=performance.now();const step=(now:number)=>{if(this.destroyed)return;const t=Math.min((now-start)/650,1),k=1-Math.pow(1-t,3);this.camera.position.lerpVectors(old,pos,k);this.controls.target.lerpVectors(oldTarget,target,k);this.controls.update();this.invalidate();if(t<1)this.tween=requestAnimationFrame(step);};this.tween=requestAnimationFrame(step);}
 private addMeasure(point:THREE.Vector3){if(this.measurePoints.length===2)this.clearMeasurement();this.measurePoints.push(point.clone());const dot=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color:0xbb7148,depthTest:false}));dot.position.copy(point);dot.renderOrder=5;this.measureGroup.add(dot);
  if(this.measurePoints.length===2){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(this.measurePoints),new THREE.LineBasicMaterial({color:0xbb7148,depthTest:false}));line.renderOrder=5;this.measureGroup.add(line);this.callbacks.measure(this.measurePoints[0].distanceTo(this.measurePoints[1]));}else this.callbacks.measure(null);this.invalidate();}
 clearMeasurement(){this.measurePoints=[];for(const child of [...this.measureGroup.children]){this.measureGroup.remove(child);if(child instanceof THREE.Mesh||child instanceof THREE.Line){child.geometry.dispose();(child.material as THREE.Material).dispose();}}this.callbacks.measure(null);this.invalidate();}
 snapshot(){this.renderer.render(this.scene,this.camera);this.renderer.domElement.toBlob(blob=>{if(!blob)return;const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='rumah-10902-studi-p01.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);});}
 dispose(){this.destroyed=true;cancelAnimationFrame(this.frame);cancelAnimationFrame(this.tween);this.resize.disconnect();this.controls.removeEventListener('change',this.invalidate);this.controls.dispose();this.renderer.domElement.removeEventListener('pointerdown',this.onMove);this.renderer.domElement.removeEventListener('pointerup',this.onClick);this.renderer.domElement.removeEventListener('keydown',this.onKey);
  const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>();this.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());this.renderer.dispose();this.renderer.domElement.remove();}
}
