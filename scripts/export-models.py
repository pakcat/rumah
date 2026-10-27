import bpy,json,hashlib
from pathlib import Path
D=Path(__file__).resolve().parents[1];source=D/'public/documents/rumah-10902-p01.blend';(D/'public/models').mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source))
temp=bpy.data.scenes.new('WEB_EXPORT');bpy.context.window.scene=temp
wanted=[c for c in bpy.data.collections if c.name.startswith(('10_','11_','12_','13_','20_','21_','22_','23_','90_'))]
for col in wanted:temp.collection.children.link(col)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();roles={'10_':'columns','11_':'beams','12_':'slab','13_':'stairs','20_':'rebarColumns','21_':'rebarBeams','22_':'rebarSlab','23_':'rebarStairs','90_':'roof'}
exportcol=bpy.data.collections.new('WEB_EXPORT_MESHES');temp.collection.children.link(exportcol);groups={'structure':[],'reinforcement':[],'roof-option':[]};meta=[]
for col in wanted:
 role=next(v for k,v in roles.items() if col.name.startswith(k))
 for ob in list(col.objects):
  if ob.type not in ['MESH','CURVE']:continue
  ev=ob.evaluated_get(deps);mesh=bpy.data.meshes.new_from_object(ev,depsgraph=deps);new=bpy.data.objects.new(ob.name+'__WEB',mesh);exportcol.objects.link(new);new.matrix_world=ob.matrix_world.copy()
  corners=[new.matrix_world@v.co for v in mesh.vertices];bounds=[[min(v[i] for v in corners) for i in range(3)],[max(v[i] for v in corners) for i in range(3)]]
  new['elementId']=ob.name;new['layer']=role;new['source']='Blender P01';new['studyOnly']=True;new['minElevation']=bounds[0][2];new['maxElevation']=bounds[1][2]
  group='roof-option' if role=='roof' else 'reinforcement' if role.startswith('rebar') else 'structure';groups[group].append(new)
  meta.append({'id':ob.name,'layer':role,'boundsBlender':bounds,'vertices':len(mesh.vertices),'faces':len(mesh.polygons),'group':group})
for group,obs in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for ob in obs:ob.select_set(True)
 bpy.context.view_layer.objects.active=obs[0]
 target=D/'public/models'/('%s.glb'%group);bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=False,export_apply=True)
 print('EXPORTED',group,len(obs),target.stat().st_size)
(D/'public/models/manifest.json').write_text(json.dumps({'source_sha256':hashlib.sha256((source).read_bytes()).hexdigest(),'units':'metres','coordinateMapping':'Blender X,Y,Z -> glTF X,Z,-Y','studyOnly':True,'objects':meta},indent=2))
