import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const root=path.resolve(import.meta.dirname,'..');const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/models/manifest.json'),'utf8'));const source=fs.readFileSync(path.join(root,'public/documents/rumah-10902-p01.blend'));
const sha=crypto.createHash('sha256').update(source).digest('hex');if(sha!==manifest.source_sha256)throw Error('Source Blender hash mismatch');
const results=[];let count=0;
for(const group of ['structure','reinforcement','roof-option']){
 const bytes=fs.readFileSync(path.join(root,`public/models/${group}.glb`));if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw Error('Invalid GLB');
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());if(json.buffers?.some(b=>b.uri)||json.images?.some(i=>i.uri&&!i.uri.startsWith('data:')))throw Error('External GLB dependencies');
 const ids=json.nodes.filter(n=>n.extras?.elementId).map(n=>n.extras.elementId);const expected=manifest.objects.filter(o=>o.group===group);if(ids.length!==expected.length||expected.some(o=>!ids.includes(o.id)))throw Error('Object identity mismatch');count+=ids.length;
 const model=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');model.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model.scene);const axisBounds=[box.min.toArray(),box.max.toArray()];
 const expectMin=[Math.min(...expected.map(o=>o.boundsBlender[0][0])),Math.min(...expected.map(o=>o.boundsBlender[0][2])),-Math.max(...expected.map(o=>o.boundsBlender[1][1]))];const expectMax=[Math.max(...expected.map(o=>o.boundsBlender[1][0])),Math.max(...expected.map(o=>o.boundsBlender[1][2])),-Math.min(...expected.map(o=>o.boundsBlender[0][1]))];
 if(axisBounds.some((arr,i)=>arr.some((n,j)=>Math.abs(n-[expectMin,expectMax][i][j])>.0001)))throw Error('GLB world bounds do not match Blender');
 results.push({group,objects:ids.length,bytes:bytes.length,bounds:axisBounds});
}
if(count!==manifest.objects.length)throw Error('Missing objects');const pdf=fs.readFileSync(path.join(root,'public/documents/paket-gambar-p01.pdf'));if(pdf.subarray(0,4).toString()!=='%PDF')throw Error('PDF missing');
console.log(JSON.stringify({verified:true,sourceBlenderSHA256:sha,objects:count,pdfBytes:pdf.length,groups:results},null,2));
const interior=JSON.parse(fs.readFileSync(path.join(root,'public/models/interior-manifest.json'),'utf8'));
const interiorSource=fs.readFileSync(path.join(root,'public/documents/rumah-10902-interior-revcb.blend'));
if(crypto.createHash('sha256').update(interiorSource).digest('hex')!==interior.source_sha256)throw Error('Interior Blender hash mismatch');
for(const entry of interior.exports){
 const bytes=fs.readFileSync(path.join(root,'public/models',entry.file));if(bytes.length!==entry.bytes||bytes.readUInt32LE(0)!==0x46546c67)throw Error('Interior GLB invalid');
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 if(doc.buffers?.some(b=>b.uri)||doc.images?.some(i=>i.uri&&!i.uri.startsWith('data:')))throw Error('Interior has external dependencies');
 const nodes=doc.nodes.filter(n=>n.extras?.sourceObject);if(nodes.length!==entry.objects||nodes.some(n=>n.extras.floor!==entry.floor||n.extras.source!=='RevCB'))throw Error('Interior identities mismatch');
 console.log(`Interior RevCB LT${entry.floor}: ${nodes.length} native objects, ${bytes.length} bytes, provenance verified; baseline 2.80m, NOT P01 height.`);
}
