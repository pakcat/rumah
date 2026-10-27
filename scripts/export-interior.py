import bpy,json,hashlib
from pathlib import Path
D=Path(__file__).resolve().parents[1]; source=D/'public/documents/rumah-10902-interior-revcb.blend'
bpy.ops.wm.open_mainfile(filepath=str(source)); orig=bpy.data.scenes['CB_Interior_Detail_Views']
records=[]
for f in [1,2]:
 obs=[o for o in orig.objects if o.type in ['MESH','CURVE'] and o.get('floor')==f and o.get('view_mode','both') in ['cut','both'] and not o.get('study',False)]
 temp=bpy.data.scenes.new('WEB_INTERIOR_%s'%f); bpy.context.window.scene=temp
 for ob in obs: temp.collection.objects.link(ob); ob.hide_set(False); ob.hide_viewport=False
 bpy.context.view_layer.update(); deps=bpy.context.evaluated_depsgraph_get(); copies=[]
 for ob in obs:
  ev=ob.evaluated_get(deps); mesh=bpy.data.meshes.new_from_object(ev,depsgraph=deps)
  if not mesh.vertices: continue
  new=bpy.data.objects.new(ob.name+'__WEB',mesh);temp.collection.objects.link(new);new.matrix_world=ob.matrix_world.copy();new['sourceObject']=ob.name;new['source']='RevCB';new['floor']=f;copies.append(new)
 bpy.ops.object.select_all(action='DESELECT')
 for ob in copies:ob.select_set(True)
 bpy.context.view_layer.objects.active=copies[0]
 target=D/'public/models'/('interior-lt%s.glb'%f)
 bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=False,export_apply=True)
 records.append({'floor':f,'objects':len(copies),'bytes':target.stat().st_size,'file':target.name})
 print('INTERIOR',records[-1])
(D/'public/models/interior-manifest.json').write_text(json.dumps({'source':'RevCB','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'floorToFloor':2.8,'units':'metres','notCoordinatedWithP01':True,'exports':records},indent=2),encoding='utf-8')
