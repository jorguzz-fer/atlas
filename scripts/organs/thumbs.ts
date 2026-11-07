// Dev tool, run in the browser with the Vite dev server: renders each organ as a transparent WebP
// icon (public/models/thumbs/<key>.webp) with the same light as the organ viewer.
//   const m = await import('/@fs/<projeto>/scripts/organs/thumbs.ts'); await m.renderAll('http://127.0.0.1:3999');
// The receiving end is any small server that writes POST /<key>.webp to public/models/thumbs.
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {ORGAN_MODELS} from '../../app/organs/organ-models';
import {decodeModelResponse} from '../../app/model-download';
import type {OrganIcon} from '../../app/catalog';

const SIZE = 256;

type Source =
  | {model: string; keep?: RegExp; view?: [number, number, number]; zoom?: number}
  | {atlasConcept: string; color: string; view?: [number, number, number]; zoom?: number};

// Which model each icon comes from. The intestines model is split into its two parts.
const SOURCES: Record<OrganIcon, Source> = {
  brain: {model: 'brain', view: [0.55, 0.15, 1], zoom: 1.35},
  lungs: {model: 'lungs'},
  liver: {model: 'liver'},
  heart: {model: 'heart'},
  stomach: {atlasConcept: 'stomach', color: '#a8604f'},
  pancreas: {model: 'pancreas', keep: /polySurface|sweep/},
  kidneys: {model: 'kidneys'},
  'small-intestine': {model: 'small-intestine', keep: /Tunntarm/},
  'large-intestine': {model: 'small-intestine', keep: /Tjocktarm/},
  eyes: {model: 'eyes', view: [0.75, 0.05, 0.7], zoom: 1.3},
};

async function loadModel(key: string, keep?: RegExp): Promise<T.Object3D> {
  const m = ORGAN_MODELS.find(x => x.key === key)!;
  const r = (await new GLTFLoader().loadAsync(m.url)).scene;
  if (m.rotation) r.rotation.set(...m.rotation);
  if (keep) {
    const drop: T.Object3D[] = [];
    r.traverse(o => { if (o instanceof T.Mesh && !keep.test(o.name)) drop.push(o); });
    drop.forEach(o => o.removeFromParent());
  }
  r.traverse(o => {
    if (o instanceof T.Mesh) {
      const mat = o.material as T.MeshStandardMaterial;
      mat.envMapIntensity = 0.56;
      mat.roughness = Math.max(0.35, mat.roughness);
    }
  });
  return r;
}

async function loadAtlasConcept(name: string, color: string): Promise<T.Object3D> {
  const atlas = await (await fetch('/models/atlas.json')).json();
  const concept = atlas.concepts.find((c: {name: string}) => c.name === name);
  const parts = atlas.parts.filter((p: {id: string}) => concept.elements.includes(p.id));
  const group = new T.Group();
  const material = new T.MeshPhysicalMaterial({color, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3, sheen: 0.15, sheenColor: new T.Color('#ffb4a4'), side: T.DoubleSide});
  for (const ci of new Set<number>(parts.map((p: {chunk: number}) => p.chunk))) {
    const chunk = atlas.chunks[ci];
    const buffer = await decodeModelResponse(await fetch(chunk.gzip), chunk.bytes, true);
    for (const p of parts.filter((x: {chunk: number}) => x.chunk === ci)) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3));
      g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true));
      g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
      group.add(new T.Mesh(g, material));
    }
  }
  return group;
}

/** Renders one object, framed to fill the square, to a transparent WebP. */
function render(object: T.Object3D, view: [number, number, number] = [0.25, 0.12, 1], zoom = 1): Promise<Blob> {
  const renderer = new T.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new T.DirectionalLight(0xfff1ea, 2.2); key.position.set(2, 3, 4); scene.add(key);
  const rim = new T.DirectionalLight(0xff9a8a, 1.4); rim.position.set(-3, 1, -3); scene.add(rim);
  scene.add(object);
  object.updateMatrixWorld(true);
  const sphere = new T.Box3().setFromObject(object).getBoundingSphere(new T.Sphere());
  const camera = new T.PerspectiveCamera(30, 1, sphere.radius * 0.05, sphere.radius * 10);
  const dir = new T.Vector3(...view).normalize();
  camera.position.copy(sphere.center).addScaledVector(dir, (sphere.radius / Math.sin(T.MathUtils.degToRad(15))) * 0.92 / zoom);
  camera.lookAt(sphere.center);
  renderer.render(scene, camera);
  return new Promise((resolve, reject) => renderer.domElement.toBlob(b => {
    renderer.dispose(); pmrem.dispose();
    if (b) resolve(b); else reject(new Error('Falha ao gerar a imagem.'));
  }, 'image/webp', 0.9));
}

export async function renderAll(receiver: string, only?: OrganIcon[]) {
  const done: string[] = [];
  for (const [key, src] of Object.entries(SOURCES) as [OrganIcon, Source][]) {
    if (only && !only.includes(key)) continue;
    const object = 'model' in src ? await loadModel(src.model, src.keep) : await loadAtlasConcept(src.atlasConcept, src.color);
    const blob = await render(object, src.view, src.zoom);
    // Raw bytes, no content type: a plain cross-port POST without a CORS preflight.
    await fetch(`${receiver}/${key}.webp`, {method: 'POST', body: await blob.arrayBuffer()});
    done.push(`${key}:${blob.size}`);
  }
  return done;
}
