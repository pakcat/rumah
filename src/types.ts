export type Layer = 'columns'|'beams'|'slab'|'stairs'|'rebarColumns'|'rebarBeams'|'rebarSlab'|'rebarStairs'|'roof';
export type CameraView = 'iso'|'front'|'top'|'side';
export interface ViewerOptions { layers: Record<Layer,boolean>; floor: 'all'|'lt1'|'lt2'; clip: 'off'|'x'|'y'|'z'; clipValue:number; opacity:number; measure:boolean }
export interface ElementInfo { id:string; modelId:string; title:string; layer:Layer; kind:string; elevation:string; dimensions:string; volume?:number; span?:number; warning:string }
export const asset=(path:string)=>`${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`;
export const layerLabels:Record<Layer,string>={columns:'Kolom beton',beams:'Balok beton',slab:'Pelat lantai 2',stairs:'Tangga L',rebarColumns:'Tulangan kolom',rebarBeams:'Tulangan balok',rebarSlab:'Tulangan pelat',rebarStairs:'Tulangan tangga',roof:'Opsi dak atap'};
export const concreteLayers:Layer[]=['columns','beams','slab','stairs'];
export const rebarLayers:Layer[]=['rebarColumns','rebarBeams','rebarSlab','rebarStairs'];
export const defaultLayers:Record<Layer,boolean>={columns:true,beams:true,slab:true,stairs:true,rebarColumns:false,rebarBeams:false,rebarSlab:false,rebarStairs:false,roof:false};
