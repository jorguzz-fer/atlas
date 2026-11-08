/** Minimal typing of the Sketchfab Viewer API we use (https://sketchfab.com/developers/viewer). */
type Vec3 = [number, number, number];
type Cb<T = unknown> = (err: unknown, value: T) => void;

export interface SketchfabApi {
  start(cb?: Cb): void;
  addEventListener(event: 'viewerready', cb: () => void): void;
  addEventListener(event: 'annotationSelect', cb: (index: number) => void): void;
  addEventListener(event: 'click', cb: (info: {position3D?: Vec3; instanceID?: number}) => void, opts?: {pick: 'fast' | 'slow'}): void;
  removeEventListener(event: string, cb: (...args: never[]) => void): void;
  getAnnotationList(cb: Cb<{name: string; content?: {raw?: string}; position: Vec3; eye: Vec3; target: Vec3}[]>): void;
  removeAllAnnotations(cb?: Cb): void;
  createAnnotationFromWorldPosition(position: Vec3, eye: Vec3, target: Vec3, title: string, text: string, cb?: Cb<number>): void;
  updateAnnotation(index: number, options: {title?: string; content?: string}, cb?: Cb): void;
  gotoAnnotation(index: number, options?: {preventCameraAnimation?: boolean; preventCameraMove?: boolean}, cb?: Cb<number>): void;
  unselectAnnotation(cb?: Cb): void;
  getCameraLookAt(cb: Cb<{position: Vec3; target: Vec3}>): void;
  setCameraLookAt(position: Vec3, target: Vec3, duration?: number, cb?: Cb): void;
  recenterCamera(cb?: Cb): void;
  pickFromScreen(position2D: [number, number], cb: Cb<{position3D: Vec3; instanceID: number} | null>): void;
  getScreenShot(w: number, h: number, mime: string, cb: Cb<string>): void;
  getNodeMap(cb: Cb<Record<string, {name: string; instanceID: number; type: string}>>): void;
}

type Client = {init(uid: string, options: Record<string, unknown> & {success: (api: SketchfabApi) => void; error: () => void}): void};
type Ctor = new (version: string, iframe: HTMLIFrameElement) => Client;

const VERSION = '1.12.1';
const SRC = `https://static.sketchfab.com/api/sketchfab-viewer-${VERSION}.js`;
let loading: Promise<Ctor> | null = null;

/** Loads the Viewer API script once. */
export function loadSketchfab(): Promise<Ctor> {
  const w = window as unknown as {Sketchfab?: Ctor};
  if (w.Sketchfab) return Promise.resolve(w.Sketchfab);
  loading ??= new Promise<Ctor>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => (w.Sketchfab ? resolve(w.Sketchfab) : reject(new Error('Sketchfab indisponível')));
    s.onerror = () => { loading = null; s.remove(); reject(new Error('Sketchfab indisponível')); };
    document.head.append(s);
  });
  return loading;
}

/** Starts the viewer for a model with a clean, Portuguese-friendly UI. */
export async function startViewer(iframe: HTMLIFrameElement, uid: string): Promise<SketchfabApi> {
  const Sketchfab = await loadSketchfab();
  return new Promise((resolve, reject) => {
    new Sketchfab(VERSION, iframe).init(uid, {
      success: api => { api.start(); api.addEventListener('viewerready', () => resolve(api)); },
      error: () => reject(new Error('Não foi possível abrir o modelo no Sketchfab.')),
      autostart: 1, dnt: 1, ui_theme: 'dark',
      ui_infos: 0, ui_inspector: 0, ui_settings: 0, ui_vr: 0, ui_ar: 0, ui_help: 0, ui_hint: 0,
      scrollwheel: 1,
    });
  });
}
