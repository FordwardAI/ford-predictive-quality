// Vehículo ilustrativo: intenta cargar un GLB local y, si falla, construye una pickup doble cabina
// procedural. Expone modos x-ray / pintado / mixto y anclas de hotspots en coordenadas locales.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  PALETA,
  crearMaterialXray,
  crearMaterialBordes,
  crearMaterialPintura,
  crearMaterialVidrio,
  crearMaterialOscuro,
  crearMaterialMetal,
  crearMaterialEmisivo,
  fijarOpacidadMaterial,
} from './materiales.js';

const DRACO_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/draco/gltf/';
const LARGO_OBJETIVO = 5.4;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Anclas de hotspots como fracciones del bounding box local [fx (largo, +X = frente),
// fy (alto), fz (ancho, 0 = lado -Z)] y normal hacia afuera (para ocultar el punto si queda detrás).
// Las del GLB se ajustaron con demo.html?anclas=1 sobre la Ranger optimizada.
export const ANCLAS_PROCEDURAL = {
  'etiqueta-parabrisas': [[0.685, 0.67, 0.17], [0.7, 0.6, -0.5]],
  'componente-1': [[0.86, 0.6, 0.5], [0.25, 1, 0]],
  'componente-2': [[0.5, 0.52, 0.0], [0, 0.15, -1]],
  'componente-3': [[0.18, 0.58, 0.5], [-0.2, 1, 0]],
};
export const ANCLAS_GLB = {
  // esquina inferior del parabrisas del lado del conductor (−Z), apenas sobre el torpedo
  'etiqueta-parabrisas': [[0.69, 0.78, 0.2], [0.7, 0.6, -0.5]],
  // capot, sobre el eje delantero
  'componente-1': [[0.86, 0.64, 0.5], [0.25, 1, 0]],
  // puerta trasera, sobre la chapa (la caja incluye los espejos: 0 quedaría en el aire)
  'componente-2': [[0.5, 0.52, 0.06], [0, 0.15, -1]],
  // centro de la caja de carga, a la altura de las barandas
  'componente-3': [[0.18, 0.55, 0.5], [-0.2, 1, 0]],
};

class Vehiculo {
  constructor(tipo) {
    this.tipo = tipo; // 'glb' | 'procedural'
    this.grupo = new THREE.Group();
    this.grupo.name = 'vehiculo';
    this.interior = new THREE.Group();
    this.grupo.add(this.interior);
    this.mallasPintado = [];
    this.mallasXray = [];
    this.lineas = [];
    this.materialesPintado = new Set();
    this.xrayCuerpo = crearMaterialXray({ intensidad: 0.6, base: 0.018 });
    this.xrayCuerpo.side = THREE.FrontSide;
    this.xrayVidrio = crearMaterialXray({ color: PALETA.skyview.clone().lerp(PALETA.blanco, 0.3), intensidad: 0.3, base: 0.02 });
    this.xrayInterior = crearMaterialXray({ intensidad: 0.26, base: 0.008, potencia: 1.8 });
    this.materialBordes = crearMaterialBordes({ opacidad: 0.75 });
    this.materialBordesInterior = crearMaterialBordes({ opacidad: 0.22 });
    this.anclas = {};
    this.halos = [];
    this.caja = new THREE.Box3();
    this.modo = 1;
    this.visibilidad = 1;
    this.brilloHalos = 0;
    this.focoHalo = null; // id del componente enfocado (enfocarPunto) o null
  }

  // Agrega una pieza: malla pintada (opcional), gemela x-ray y bordes.
  agregarPieza(geometria, materialPintado, { xray = 'cuerpo', bordes = true, umbral = 22, padre = this.interior, soloXray = false } = {}) {
    if (materialPintado && !soloXray) {
      const malla = new THREE.Mesh(geometria, materialPintado);
      if (materialPintado.userData.siempreTransparente) malla.renderOrder = 1;
      padre.add(malla);
      this.mallasPintado.push(malla);
      this.materialesPintado.add(materialPintado);
    }
    if (xray) {
      const mat = xray === 'vidrio' ? this.xrayVidrio : xray === 'interior' ? this.xrayInterior : this.xrayCuerpo;
      const gemela = new THREE.Mesh(geometria, mat);
      gemela.renderOrder = 2;
      padre.add(gemela);
      this.mallasXray.push(gemela);
    }
    if (bordes) {
      const lineas = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometria, umbral),
        xray === 'interior' ? this.materialBordesInterior : this.materialBordes,
      );
      lineas.renderOrder = 3;
      padre.add(lineas);
      this.lineas.push(lineas);
    }
  }

  // m: 0 = x-ray, 1 = pintado.
  actualizar() {
    const m = THREE.MathUtils.clamp(this.modo, 0, 1);
    const v = this.visibilidad;
    const pint = m * v;
    // Opacos salvo durante el fundido (0 < pint < 1); vidrios siempre transparentes.
    for (const mat of this.materialesPintado) {
      const base = mat.userData.opacidadBase ?? 1;
      fijarOpacidadMaterial(mat, base * pint, { siempreTransparente: !!mat.userData.siempreTransparente });
    }
    for (const malla of this.mallasPintado) malla.visible = pint > 0.003;
    const rx = (1 - m) * v;
    const bordes = THREE.MathUtils.clamp((1 - m) * 1.15, 0, 1) * v;
    this.xrayCuerpo.uniforms.uOpacidad.value = rx;
    this.xrayVidrio.uniforms.uOpacidad.value = rx;
    this.xrayInterior.uniforms.uOpacidad.value = rx;
    this.materialBordes.uniforms.uOpacidad.value = 0.75 * bordes + 0.12 * pint;
    this.materialBordesInterior.uniforms.uOpacidad.value = 0.22 * bordes;
    for (const malla of this.mallasXray) malla.visible = rx > 0.003;
    for (const l of this.lineas) l.visible = bordes + pint > 0.003;
    for (const h of this.halos) {
      // halos discretos: visibles en «dónde mirar» sin quemar la chapa
      const f = !this.focoHalo ? 0.75 : h.name === this.focoHalo ? 1 : 0.25;
      h.material.opacity = Math.min(1, this.brilloHalos * v * f);
      h.visible = h.material.opacity > 0.003;
    }
  }

  aplicarModo(modo, t = 0) {
    this.modo = modo === 'pintado' ? 1 : modo === 'xray' ? 0 : THREE.MathUtils.clamp(t, 0, 1);
    this.actualizar();
  }

  fijarMezcla(m) { this.modo = m; this.actualizar(); }
  fijarVisibilidad(v) { this.visibilidad = v; this.grupo.visible = v > 0.003; this.actualizar(); }
  fijarHalos(v, tiempo = 0) {
    this.brilloHalos = v;
    this.halos.forEach((h, i) => {
      const s = 0.42 + 0.06 * Math.sin(tiempo * 2.4 + i * 1.7);
      h.scale.setScalar(h.name === this.focoHalo ? s * 1.3 : s);
    });
    this.actualizar();
  }

  // Anclas a partir del bounding box local (sirven para cualquier modelo orientado a +X).
  calcularAnclas(tabla = ANCLAS_PROCEDURAL) {
    this.caja.setFromObject(this.interior, true);
    const { min, max } = this.caja;
    const L = max.x - min.x;
    const H = max.y - min.y;
    const W = max.z - min.z;
    const p = (fx, fy, fz) => new THREE.Vector3(min.x + L * fx, min.y + H * fy, min.z + W * fz);
    this.fraccionAPos = p;
    const definiciones = Object.fromEntries(Object.entries(tabla).map(([id, [f, n]]) => [id, [p(...f), v3(...n)]]));
    const centro = new THREE.Vector3((min.x + max.x) / 2, min.y + H * 0.45, (min.z + max.z) / 2);
    this.centroLocal = centro;
    for (const [id, [pos, normal]] of Object.entries(definiciones)) {
      const ancla = new THREE.Object3D();
      ancla.name = id;
      ancla.position.copy(pos);
      ancla.userData.normal = normal.normalize();
      this.grupo.add(ancla);
      this.anclas[id] = ancla;
    }
    // halos para «dónde mirar»
    const textura = texturaHalo();
    for (const id of ['componente-1', 'componente-2', 'componente-3']) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textura, color: PALETA.skyview.clone().lerp(PALETA.blanco, 0.3), transparent: true,
        opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      }));
      sprite.name = id;
      sprite.position.copy(this.anclas[id].position);
      sprite.renderOrder = 5;
      sprite.visible = false;
      this.grupo.add(sprite);
      this.halos.push(sprite);
    }
  }
}

let texturaHaloCache = null;
function texturaHalo() {
  if (texturaHaloCache) return texturaHaloCache;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.65)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  texturaHaloCache = new THREE.CanvasTexture(c);
  texturaHaloCache.colorSpace = THREE.SRGBColorSpace;
  return texturaHaloCache;
}

function extruir(forma, profundidad, bisel = 0.035) {
  const geo = new THREE.ExtrudeGeometry(forma, {
    depth: profundidad,
    bevelEnabled: bisel > 0,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: 2,
    curveSegments: 18,
  });
  geo.translate(0, 0, -profundidad / 2);
  return geo;
}

function caja(ax, ay, az, x, y, z) {
  const g = new THREE.BoxGeometry(ax, ay, az);
  g.translate(x, y, z);
  return g;
}

// Pickup doble cabina con proporciones de Ranger (≈ 5,37 × 1,92 × 1,88 m), frente hacia +X.
export function crearPickupProcedural() {
  const v = new Vehiculo('procedural');
  const pintura = crearMaterialPintura();
  const vidrio = crearMaterialVidrio();
  const negro = crearMaterialOscuro('#090b10', 0.6, 0.2);
  const goma = crearMaterialOscuro('#050506', 0.9, 0.0);
  const metal = crearMaterialMetal();
  const faro = crearMaterialEmisivo(PALETA.blanco, 1.8);
  const piloto = crearMaterialEmisivo(PALETA.gris, 0.5);

  // Carrocería delantera + cabina inferior (perfil lateral extruido con arco de rueda delantera)
  const cuerpo = new THREE.Shape();
  cuerpo.moveTo(-0.62, 0.44);
  cuerpo.lineTo(-0.62, 1.22);
  cuerpo.lineTo(0.98, 1.25);
  cuerpo.lineTo(1.3, 1.2);
  cuerpo.quadraticCurveTo(2.3, 1.15, 2.56, 1.07);
  cuerpo.lineTo(2.65, 0.98);
  cuerpo.lineTo(2.68, 0.64);
  cuerpo.lineTo(2.6, 0.44);
  cuerpo.lineTo(2.13, 0.44);
  cuerpo.absarc(1.62, 0.44, 0.51, 0, Math.PI, false);
  cuerpo.lineTo(-0.62, 0.44);
  v.agregarPieza(extruir(cuerpo, 1.8, 0.05), pintura, { umbral: 28 });

  // Habitáculo vidriado
  const habitaculo = new THREE.Shape();
  habitaculo.moveTo(-0.6, 1.22);
  habitaculo.lineTo(-0.57, 1.8);
  habitaculo.quadraticCurveTo(-0.2, 1.86, 0.22, 1.85);
  habitaculo.lineTo(0.98, 1.25);
  habitaculo.lineTo(-0.6, 1.22);
  v.agregarPieza(extruir(habitaculo, 1.6, 0.03), vidrio, { xray: 'vidrio', umbral: 28 });

  // Techo, parantes y espejos
  v.agregarPieza(caja(0.86, 0.05, 1.62, -0.17, 1.875, 0), pintura);
  const parante = (z) => {
    const g = new THREE.BoxGeometry(0.98, 0.06, 0.06);
    g.rotateZ(2.457);
    g.translate(0.6, 1.555, z);
    return g;
  };
  v.agregarPieza(mergeGeometries([
    parante(0.8), parante(-0.8),
    caja(0.1, 0.6, 0.04, -0.02, 1.53, 0.815), caja(0.1, 0.6, 0.04, -0.02, 1.53, -0.815),
    caja(0.1, 0.6, 0.04, -0.56, 1.52, 0.815), caja(0.1, 0.6, 0.04, -0.56, 1.52, -0.815),
  ]), pintura, { bordes: false });
  v.agregarPieza(mergeGeometries([
    caja(0.16, 0.13, 0.2, 0.84, 1.33, 1.0), caja(0.16, 0.13, 0.2, 0.84, 1.33, -1.0),
  ]), negro);

  // Caja de carga: laterales con arco trasero, frente, portón y piso
  const lateral = new THREE.Shape();
  lateral.moveTo(-0.66, 0.46);
  lateral.lineTo(-0.66, 1.2);
  lateral.lineTo(-2.66, 1.2);
  lateral.lineTo(-2.66, 0.46);
  lateral.lineTo(-2.11, 0.46);
  lateral.absarc(-1.6, 0.46, 0.51, Math.PI, 0, true);
  lateral.lineTo(-0.66, 0.46);
  const lat = (z) => { const g = extruir(lateral, 0.06, 0.02); g.translate(0, 0, z); return g; };
  v.agregarPieza(lat(0.87), pintura, { umbral: 28 });
  v.agregarPieza(lat(-0.87), pintura, { umbral: 28 });
  v.agregarPieza(caja(0.07, 0.72, 1.78, -2.66, 0.84, 0), pintura);
  v.agregarPieza(caja(0.06, 0.66, 1.68, -0.72, 0.86, 0), pintura, { bordes: false });
  v.agregarPieza(caja(1.9, 0.05, 1.68, -1.68, 0.6, 0), negro, { xray: 'interior' });

  // Paragolpes, parrilla, faros y pilotos
  v.agregarPieza(caja(0.2, 0.22, 1.84, 2.6, 0.45, 0), negro);
  v.agregarPieza(caja(0.16, 0.18, 1.82, -2.74, 0.52, 0), metal);
  v.agregarPieza(caja(0.05, 0.3, 1.24, 2.67, 0.81, 0), negro);
  v.agregarPieza(mergeGeometries([
    caja(0.04, 0.035, 1.3, 2.7, 0.74, 0), caja(0.04, 0.035, 1.3, 2.7, 0.88, 0),
  ]), metal);
  v.agregarPieza(mergeGeometries([
    caja(0.05, 0.11, 0.3, 2.64, 0.93, 0.68), caja(0.05, 0.11, 0.3, 2.64, 0.93, -0.68),
    caja(0.05, 0.24, 0.04, 2.66, 0.8, 0.86), caja(0.05, 0.24, 0.04, 2.66, 0.8, -0.86),
  ]), faro, { xray: false });
  v.agregarPieza(mergeGeometries([
    caja(0.04, 0.4, 0.09, -2.71, 0.98, 0.86), caja(0.04, 0.4, 0.09, -2.71, 0.98, -0.86),
  ]), piloto, { xray: false });
  v.agregarPieza(mergeGeometries([
    caja(1.5, 0.05, 0.16, 0.3, 0.36, 0.92), caja(1.5, 0.05, 0.16, 0.3, 0.36, -0.92),
  ]), negro);

  // Guardabarros (molduras de arco)
  const moldura = (x, y, z) => {
    const g = new THREE.TorusGeometry(0.535, 0.055, 6, 22, Math.PI);
    g.scale(1, 1, 1.6);
    g.translate(x, y, z);
    return g;
  };
  v.agregarPieza(mergeGeometries([
    moldura(1.62, 0.44, 0.92), moldura(1.62, 0.44, -0.92), moldura(-1.6, 0.46, 0.92), moldura(-1.6, 0.46, -0.92),
  ]), negro, { umbral: 40 });

  // Ruedas
  const neumatico = new THREE.CylinderGeometry(0.39, 0.39, 0.27, 40, 1);
  neumatico.rotateX(Math.PI / 2);
  const llanta = (() => {
    const partes = [new THREE.CylinderGeometry(0.255, 0.255, 0.275, 30, 1)];
    for (let i = 0; i < 6; i++) {
      const rayo = new THREE.BoxGeometry(0.05, 0.02, 0.22);
      rayo.translate(0, 0, 0.13);
      rayo.rotateY((i / 6) * Math.PI * 2);
      rayo.translate(0, 0.142, 0);
      partes.push(rayo);
    }
    const g = mergeGeometries(partes);
    g.rotateX(Math.PI / 2);
    return g;
  })();
  for (const [x, z] of [[1.62, 0.79], [1.62, -0.79], [-1.6, 0.79], [-1.6, -0.79]]) {
    const rueda = new THREE.Group();
    rueda.position.set(x, 0.39, z);
    if (z < 0) rueda.rotation.y = Math.PI;
    v.interior.add(rueda);
    v.agregarPieza(neumatico, goma, { padre: rueda, umbral: 30 });
    v.agregarPieza(llanta, metal, { padre: rueda, umbral: 30, xray: 'interior' });
  }

  // Interior y mecánica (solo visibles en x-ray)
  const asiento = (x, z) => [caja(0.5, 0.12, 0.52, x, 0.82, z), caja(0.12, 0.62, 0.5, x - 0.24, 1.12, z)];
  v.agregarPieza(mergeGeometries([
    ...asiento(0.45, 0.4), ...asiento(0.45, -0.4), caja(0.5, 0.12, 1.4, -0.3, 0.82, 0), caja(0.12, 0.6, 1.4, -0.52, 1.12, 0),
  ]), null, { xray: 'interior', umbral: 30 });
  const volante = new THREE.TorusGeometry(0.19, 0.025, 8, 28);
  volante.rotateY(Math.PI / 2);
  volante.rotateZ(0.45);
  volante.translate(0.86, 1.12, -0.4);
  v.agregarPieza(volante, null, { xray: 'interior', umbral: 40 });
  v.agregarPieza(mergeGeometries([
    caja(0.8, 0.46, 0.72, 1.98, 0.84, 0), caja(0.5, 0.2, 0.5, 1.95, 1.12, 0),
  ]), null, { xray: 'interior' });
  v.agregarPieza(mergeGeometries([
    caja(4.9, 0.12, 0.09, 0.0, 0.42, 0.46), caja(4.9, 0.12, 0.09, 0.0, 0.42, -0.46),
    caja(0.08, 0.08, 1.58, 1.62, 0.39, 0), caja(0.08, 0.08, 1.58, -1.6, 0.39, 0),
  ]), null, { xray: 'interior' });

  v.calcularAnclas();
  v.actualizar();
  return v;
}

// Silueta media de pickup doble cabina para repetir en la playa (fusionada) y en el convoy
// (instanciada): perfil lateral extruido con arcos de rueda, cabina más angosta y ruedas.
// Unos 1,5 k triángulos; sin índices para poder fusionar con atributos por vértice.
export function crearGeometriaPickupSimple() {
  const perfil = new THREE.Shape();
  perfil.moveTo(-2.66, 0.46);
  perfil.lineTo(-2.68, 1.2);
  perfil.lineTo(-0.66, 1.2);
  perfil.lineTo(-0.64, 1.24);
  perfil.lineTo(0.98, 1.25);
  perfil.lineTo(1.3, 1.2);
  perfil.quadraticCurveTo(2.3, 1.15, 2.56, 1.07);
  perfil.lineTo(2.66, 0.96);
  perfil.lineTo(2.68, 0.62);
  perfil.lineTo(2.6, 0.44);
  perfil.lineTo(2.13, 0.44);
  perfil.absarc(1.62, 0.44, 0.51, 0, Math.PI, false);
  perfil.lineTo(-1.09, 0.46);
  perfil.absarc(-1.6, 0.46, 0.51, 0, Math.PI, false);
  perfil.lineTo(-2.66, 0.46);
  const opciones = (prof, bisel) => ({ depth: prof, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 8 });
  const cuerpo = new THREE.ExtrudeGeometry(perfil, opciones(1.74, 0.04));
  cuerpo.translate(0, 0, -0.87);

  const cabina = new THREE.Shape();
  cabina.moveTo(-0.62, 1.2);
  cabina.lineTo(-0.58, 1.8);
  cabina.quadraticCurveTo(-0.2, 1.87, 0.22, 1.85);
  cabina.lineTo(1.0, 1.24);
  cabina.lineTo(-0.62, 1.2);
  const techo = new THREE.ExtrudeGeometry(cabina, opciones(1.52, 0.04));
  techo.translate(0, 0, -0.76);

  const partes = [cuerpo, techo];
  for (const [x, z] of [[1.62, 0.8], [1.62, -0.8], [-1.6, 0.8], [-1.6, -0.8]]) {
    const r = new THREE.CylinderGeometry(0.39, 0.39, 0.27, 18, 1);
    r.rotateX(Math.PI / 2);
    r.translate(x, 0.39, z);
    partes.push(r);
  }
  const geo = mergeGeometries(partes.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute('uv');
    return n;
  }));
  geo.computeBoundingSphere();
  return geo;
}

// ---------- GLB ----------

async function intentarGLB(url) {
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/loaders/DRACOLoader.js'),
  ]);
  const cargador = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_URL);
  cargador.setDRACOLoader(draco);
  try {
    const gltf = await cargador.loadAsync(url);
    return gltf.scene;
  } finally {
    draco.dispose();
  }
}

function areaMalla(malla) {
  const g = malla.geometry;
  const pos = g.attributes.position;
  if (!pos) return 0;
  const idx = g.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const s = new THREE.Vector3();
  malla.getWorldScale(s);
  const escala = Math.abs(s.x * s.y);
  let area = 0;
  const n = idx ? idx.count : pos.count;
  const paso = Math.max(3, Math.floor(n / 3 / 4000) * 3); // muestreo para modelos pesados
  for (let i = 0; i + 2 < n; i += paso) {
    const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    area += b.sub(a).cross(c.sub(a)).length() * 0.5;
  }
  return area * (paso / 3) * escala;
}

function vehiculoDesdeGLB(raiz) {
  const v = new Vehiculo('glb');
  // Normalizar: largo a lo largo de X, ~5,4 m, centrado y apoyado en el piso.
  raiz.updateMatrixWorld(true);
  let cajaM = new THREE.Box3().setFromObject(raiz, true);
  const tam = cajaM.getSize(new THREE.Vector3());
  const envoltura = new THREE.Group();
  envoltura.add(raiz);
  // glTF mira hacia +Z: girar +90° deja el frente hacia +X, el sentido de avance de la cinta.
  if (tam.z > tam.x) envoltura.rotation.y = Math.PI / 2;
  envoltura.updateMatrixWorld(true);
  cajaM = new THREE.Box3().setFromObject(envoltura, true);
  const largo = cajaM.max.x - cajaM.min.x;
  envoltura.scale.setScalar(LARGO_OBJETIVO / largo);
  envoltura.updateMatrixWorld(true);
  cajaM = new THREE.Box3().setFromObject(envoltura, true);
  const centro = cajaM.getCenter(new THREE.Vector3());
  envoltura.position.set(-centro.x, -cajaM.min.y, -centro.z);
  envoltura.updateMatrixWorld(true);
  v.interior.add(envoltura);

  const mallas = [];
  raiz.traverse((o) => { if (o.isMesh) mallas.push(o); });

  // Detectar la pintura por nombre o, si no, por el material de mayor área.
  const areas = new Map();
  for (const m of mallas) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const a = areaMalla(m);
    for (const mat of mats) areas.set(mat, (areas.get(mat) || 0) + a / mats.length);
  }
  const esPintura = (mat) => /paint|body|carrocer|carpaint|exterior/i.test(mat.name || '');
  const esVidrio = (mat) => /glass|window|vidrio|cristal|windshield|parabrisas/i.test(mat.name || '') ||
    (mat.transmission && mat.transmission > 0) || (mat.transparent && mat.opacity < 0.9);
  let pinturas = [...areas.keys()].filter(esPintura);
  if (!pinturas.length) {
    let mayor = null, max = -1;
    for (const [mat, a] of areas) if (!esVidrio(mat) && a > max) { max = a; mayor = mat; }
    if (mayor) pinturas = [mayor];
  }
  const pinturaFord = crearMaterialPintura();
  const vidrioFord = crearMaterialVidrio({ opacidad: 0.78 });
  // Ópticas y lentes: vidrio casi invisible para que se vea el faro detrás (oscuro: uno claro
  // toma la luz clave y florece con el bloom).
  const vidrioClaro = crearMaterialVidrio({ opacidad: 0.25, color: '#0a0f18' });
  const esOptica = (mat) => /clear|lens|lente|faro|light/i.test(mat.name || '');
  const reemplazos = new Map();
  const reemplazar = (mat) => {
    if (reemplazos.has(mat)) return reemplazos.get(mat);
    let nuevo;
    if (pinturas.includes(mat)) nuevo = pinturaFord;
    else if (esVidrio(mat)) nuevo = esOptica(mat) ? vidrioClaro : vidrioFord;
    else {
      // Clon opaco: `actualizar` lo vuelve transparente sólo mientras se funde. Si el original ya
      // era transparente (calcos, rejillas con alfa) lo sigue siendo, sin escribir profundidad.
      nuevo = mat.clone();
      // las ópticas emisivas del modelo florecen demasiado con el bloom de la escena
      if (nuevo.emissiveMap || (nuevo.emissive && nuevo.emissive.getHex() !== 0)) nuevo.emissiveIntensity = (nuevo.emissiveIntensity ?? 1) * 0.3;
      const transparenteOriginal = mat.transparent && mat.opacity < 1;
      nuevo.userData.opacidadBase = transparenteOriginal ? mat.opacity : 1;
      nuevo.userData.siempreTransparente = !!mat.transparent;
      nuevo.transparent = !!mat.transparent;
      if (mat.transparent) nuevo.depthWrite = false;
    }
    reemplazos.set(mat, nuevo);
    return nuevo;
  };

  for (const m of mallas) {
    m.material = Array.isArray(m.material) ? m.material.map(reemplazar) : reemplazar(m.material);
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mat) => v.materialesPintado.add(mat));
    v.mallasPintado.push(m);
    const vidrioMalla = mats.every((mat) => mat === vidrioFord || mat === vidrioClaro);
    // Orden: opaco (0) → transparentes del modelo (1) → gemela x-ray (2) → bordes (3).
    if (mats.some((mat) => mat.userData.siempreTransparente)) m.renderOrder = 1;
    const gemela = new THREE.Mesh(m.geometry, vidrioMalla ? v.xrayVidrio : v.xrayCuerpo);
    gemela.renderOrder = 2;
    m.parent.add(gemela);
    gemela.position.copy(m.position); gemela.quaternion.copy(m.quaternion); gemela.scale.copy(m.scale);
    v.mallasXray.push(gemela);
    if (m.geometry.attributes.position.count < 250000) {
      const lineas = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), v.materialBordes);
      lineas.position.copy(m.position); lineas.quaternion.copy(m.quaternion); lineas.scale.copy(m.scale);
      lineas.renderOrder = 3;
      m.parent.add(lineas);
      v.lineas.push(lineas);
    }
  }
  v.calcularAnclas(ANCLAS_GLB);
  taparEmblemas(v, pinturaFord);
  v.actualizar();
  return v;
}

// El modelo trae el óvalo de Ford en la parrilla y en el portón, el nombre del modelo estampado
// en el portón y la insignia «Sport»; la presentación no usa logos de Ford. Se tapan con placas
// del color de la pieza: oscura en la parrilla (se lee como la barra central) y pintura en el
// portón. Posiciones medidas por raycast sobre la Ranger optimizada, en metros desde el frente
// (max.x) o la cola (min.x) de la caja y desde el piso; z desde el centro.
const EMBLEMAS_GLB = [
  // [extremo, dx hacia adentro, y, z, profundidad, alto, ancho, material]
  ['frente', 0.006, 0.98, 0, 0.03, 0.118, 0.34, 'parrilla'],
  ['cola', 0.052, 1.055, 0, 0.02, 0.125, 0.27, 'pintura'],
  ['cola', 0.085, 0.84, 0, 0.02, 0.135, 1.46, 'pintura'],
  ['cola', 0.09, 1.128, 0.53, 0.02, 0.075, 0.3, 'pintura'],
];
function taparEmblemas(v, pintura) {
  const { min, max } = v.caja;
  const zc = (min.z + max.z) / 2;
  const materiales = { parrilla: crearMaterialOscuro('#0b0e14', 0.4, 0.5), pintura };
  const geos = { parrilla: [], pintura: [] };
  for (const [extremo, dx, y, z, prof, alto, ancho, mat] of EMBLEMAS_GLB) {
    const g = new THREE.BoxGeometry(prof, alto, ancho);
    g.translate(extremo === 'frente' ? max.x - dx : min.x + dx, min.y + y, zc + z);
    geos[mat].push(g);
  }
  for (const [clave, lista] of Object.entries(geos)) {
    if (!lista.length) continue;
    const malla = new THREE.Mesh(mergeGeometries(lista), materiales[clave]);
    malla.name = `tapa-emblemas-${clave}`;
    v.interior.add(malla);
    v.mallasPintado.push(malla);
    v.materialesPintado.add(materiales[clave]);
  }
}

// Nunca rechaza: si el GLB no existe o falla, devuelve la pickup procedural.
export async function cargarVehiculo(url) {
  if (url) {
    try {
      const raiz = await intentarGLB(url);
      return vehiculoDesdeGLB(raiz);
    } catch (error) {
      console.info('[escena] Modelo GLB no disponible; se usa la pickup procedural.', error?.message || '');
    }
  }
  return crearPickupProcedural();
}

export function aplicarModo(vehiculo, modo, t = 0) {
  vehiculo.aplicarModo(modo, t);
}
