// Escena 3D de la presentación: implementa la API del contrato (crearEscena → Escena).
// Fondo Ford Twilight con niebla, vehículo x-ray / pintado, línea de producción simulada,
// escenas abstractas (datos, validación, resultado, seguridad) y hotspots CSS2D.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  PALETA,
  UNIFORMS_GLOBALES,
  crearMaterialXray,
  crearMaterialBordes,
  crearMaterialRelleno,
  crearMaterialPuntos,
  fijarOpacidad,
  SHADER_FINAL,
} from './materiales.js';
import { cargarVehiculo } from './vehiculo.js';
import { crearFabrica, crearPiso, ESTACIONES, CENTRO_PLAYA } from './fabrica.js';
import { crearSombraContacto } from './sombra.js';

export const IDS_ESCENA = ['portada', 'linea', 'datos', 'predictor', 'validacion', 'resultado', 'seguridad', 'factibilidad', 'donde-mirar', 'futuro', 'cierre'];
export const IDS_PUNTOS = ['etiqueta-parabrisas', 'carroceria', 'pintura', 'montaje', 'gate-release', 'inspeccion-adicional', 'componente-1', 'componente-2', 'componente-3', 'playa-despacho'];

const NOMBRES_PUNTOS = {
  'etiqueta-parabrisas': 'Etiqueta del parabrisas',
  carroceria: 'Carrocería',
  pintura: 'Pintura',
  montaje: 'Montaje',
  'gate-release': 'Gate Release',
  'inspeccion-adicional': 'Inspección Adicional',
  'componente-1': 'Zona 1 del vehículo',
  'componente-2': 'Zona 2 del vehículo',
  'componente-3': 'Zona 3 del vehículo',
  'playa-despacho': 'Playa de despacho',
};

const CAPAS = ['linea', 'playa', 'convoy', 'datos', 'timeline', 'columnas', 'escudo', 'anillo'];

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const suave = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const envolver = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function inyectarEstilos() {
  if (document.getElementById('escena-estilos')) return;
  const s = document.createElement('style');
  s.id = 'escena-estilos';
  s.textContent = `
  :where(.escena-etiquetas) { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  :where(.escena-etiquetas) :where(.punto) {
    pointer-events:auto; position:relative; width:32px; height:32px; padding:0; margin:0;
    border-radius:9999px; border:2px solid #066FEF; background:rgba(0,20,46,.55); cursor:pointer;
    transition:opacity .35s ease, transform .35s ease; color:#fff; font:inherit;
  }
  :where(.escena-etiquetas) :where(.punto)::before {
    content:""; position:absolute; inset:9px; border-radius:9999px; background:#fff;
  }
  :where(.escena-etiquetas) :where(.punto)::after {
    content:""; position:absolute; inset:-2px; border-radius:9999px; border:2px solid #066FEF;
    animation:escena-pulso 2.2s ease-out infinite;
  }
  :where(.escena-etiquetas) :where(.punto):hover { background:rgba(6,111,239,.35); }
  :where(.escena-etiquetas) :where(.punto):focus-visible { outline:2px solid #066FEF; outline-offset:2px; }
  :where(.escena-etiquetas) :where(.punto--oculto) { opacity:0; pointer-events:none; }
  :where(.escena-etiquetas) :where(.punto--foco) { transform:scale(1.35); background:rgba(6,111,239,.6); border-color:#fff; }
  :where(.escena-etiquetas) :where(.punto--tenue) { opacity:.45; }
  @keyframes escena-pulso { 0% { transform:scale(1); opacity:.9; } 100% { transform:scale(2.1); opacity:0; } }
  @media (prefers-reduced-motion: reduce) { :where(.escena-etiquetas) :where(.punto)::after { animation:none; } }
  `;
  document.head.appendChild(s);
}

// Estudio fotográfico procedural para los reflejos de la pintura (sin texturas descargadas).
function crearEstudio() {
  const s = new THREE.Scene();
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 c = mix(vec3(0.002, 0.008, 0.02), vec3(0.01, 0.045, 0.12), smoothstep(-0.25, 0.35, h));
        c = mix(c, vec3(0.004, 0.015, 0.04), smoothstep(0.35, 1.0, h));
        float dh = (h - 0.04) * 22.0;
        c += vec3(0.35, 0.5, 0.8) * exp(-dh * dh) * 0.9;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  s.add(cielo);
  const caja = (w, h, color, pos, mirar) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.copy(pos);
    m.lookAt(mirar);
    s.add(m);
  };
  const blanco = new THREE.Color(5, 5, 5.4);
  const azul = PALETA.skyview.clone().multiplyScalar(5);
  caja(26, 3.5, blanco, v3(0, 22, 0), v3(0, 0, 0));
  caja(26, 1.6, blanco, v3(0, 16, 14), v3(0, 0, 0));
  caja(2.2, 16, azul, v3(-26, 6, -6), v3(0, 0, 0));
  caja(2.2, 16, azul, v3(24, 6, 10), v3(0, 0, 0));
  caja(14, 1.2, new THREE.Color(2.5, 2.6, 3), v3(-10, 4, 24), v3(0, 0, 0));
  return s;
}

// ---------- Grupos abstractos ----------

function crearDatos() {
  const n = 2000;
  const nClusters = 72;
  const centros = [];
  for (let i = 0; i < nClusters; i++) {
    const c = i % 12, f = Math.floor(i / 12);
    centros.push(v3(-11 + c * 2 + (Math.random() - 0.5) * 0.6, 0.9 + f * 0.85 + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 3.5));
  }
  const inicio = new Float32Array(n * 3);
  const destino = new Float32Array(n * 3);
  const semilla = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2, w = Math.acos(2 * Math.random() - 1), r = Math.cbrt(Math.random());
    inicio[i * 3] = Math.sin(w) * Math.cos(u) * r * 13;
    inicio[i * 3 + 1] = 2.8 + Math.cos(w) * r * 3.2;
    inicio[i * 3 + 2] = Math.sin(w) * Math.sin(u) * r * 6;
    // tamaño de cluster desigual: unos VIN con muchos eventos y otros con pocos
    const k = Math.floor(Math.pow(Math.random(), 1.8) * nClusters);
    const c = centros[k];
    const rr = 0.12 + Math.random() * 0.22;
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    destino[i * 3] = c.x + Math.sin(b) * Math.cos(a) * rr;
    destino[i * 3 + 1] = c.y + Math.cos(b) * rr;
    destino[i * 3 + 2] = c.z + Math.sin(b) * Math.sin(a) * rr;
    semilla[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(inicio, 3));
  geo.setAttribute('aDestino', new THREE.BufferAttribute(destino, 3));
  geo.setAttribute('aSemilla', new THREE.BufferAttribute(semilla, 1));
  const mat = crearMaterialPuntos({
    color: PALETA.skyview.clone(),
    tamano: 15,
    uniforms: { uP: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aDestino; attribute float aSemilla;
      uniform float uP; uniform float uTiempo; uniform float uTamano; uniform float uPixelRatio;
      varying float vProf; varying float vBrillo; varying vec3 vTinte;
      void main(){
        float d = aSemilla * 0.45;
        float k = smoothstep(d, d + 0.55, uP);
        vec3 deriva = vec3(sin(uTiempo * 0.3 + aSemilla * 40.0), cos(uTiempo * 0.25 + aSemilla * 23.0), sin(uTiempo * 0.2 + aSemilla * 11.0)) * 0.35;
        vec3 p = mix(position + deriva, aDestino + deriva * 0.08, k);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vProf = -mv.z;
        vBrillo = 0.65 + 0.35 * k + 0.25 * sin(uTiempo * 2.0 + aSemilla * 60.0) * (1.0 - k);
        vTinte = mix(vec3(0.02, 0.43, 0.94), vec3(0.85, 0.93, 1.0), k * 0.7);
        gl_PointSize = uTamano * uPixelRatio * (10.0 / max(vProf, 0.1));
        gl_Position = projectionMatrix * mv;
      }
    `,
  });
  const puntos = new THREE.Points(geo, mat);
  puntos.frustumCulled = false;
  const grupo = new THREE.Group();
  grupo.add(puntos);
  return { grupo, materiales: [{ mat, base: 1 }], fijarP: (p) => { mat.uniforms.uP.value = p; } };
}

function crearLineaTiempo() {
  const grupo = new THREE.Group();
  const materiales = [];
  const dias = 285;
  const paso = 0.066;
  const x0 = -(dias * paso) / 2;
  const geo = new THREE.BoxGeometry(paso * 0.6, 1, 1.5);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  materiales.push({ mat, base: 1 });
  const barras = new THREE.InstancedMesh(geo, mat, dias);
  const m = new THREE.Matrix4();
  const bloque = (d) => (d < 150 ? 'entrenamiento' : d < 195 ? 'validacion' : d < 200 ? 'margen' : 'prueba');
  for (let d = 0; d < dias; d++) {
    const b = bloque(d);
    const alto = b === 'margen' ? 0.02 : b === 'prueba' ? 0.5 : 0.42;
    m.makeScale(1, alto, 1).setPosition(x0 + d * paso, 0, 0);
    barras.setMatrixAt(d, m);
  }
  grupo.add(barras);
  const cEntr = PALETA.skyview.clone().multiplyScalar(0.55);
  const cVal = new THREE.Color(0.42, 0.5, 0.62);
  const cMargen = new THREE.Color(0.05, 0.08, 0.14);
  const cCerrado = new THREE.Color(0.06, 0.1, 0.2);
  const cPrueba = PALETA.skyview.clone().multiplyScalar(1.5);
  let ultimo = -1;
  const colorear = (p) => {
    const q = Math.round(p * 100);
    if (q === ultimo) return;
    ultimo = q;
    const abierto = suave(0.35, 1, p);
    for (let d = 0; d < dias; d++) {
      const b = bloque(d);
      let c = b === 'entrenamiento' ? cEntr : b === 'validacion' ? cVal : b === 'margen' ? cMargen : null;
      if (!c) c = (d - 200) / 85 < abierto ? cPrueba : cCerrado;
      barras.setColorAt(d, c);
    }
    barras.instanceColor.needsUpdate = true;
  };
  colorear(0);

  // Marcos de cada bloque
  const bordes = crearMaterialBordes({ opacidad: 0.6 });
  materiales.push({ mat: bordes, base: 0.6 });
  const marco = (d0, d1, alto) => {
    const w = (d1 - d0) * paso;
    const g = new THREE.BoxGeometry(w, alto, 1.9);
    g.translate(x0 + d0 * paso - paso / 2 + w / 2, alto / 2, 0);
    return new THREE.LineSegments(new THREE.EdgesGeometry(g), bordes);
  };
  grupo.add(marco(0, 150, 0.6), marco(150, 195, 0.6), marco(195, 200, 0.6), marco(200, 285, 0.72));

  // Candado sobre la prueba final
  const relleno = crearMaterialRelleno({ color: new THREE.Color('#031a3a') });
  materiales.push({ mat: relleno, base: 1 });
  const bordesC = crearMaterialBordes({ opacidad: 1 });
  materiales.push({ mat: bordesC, base: 1 });
  const candado = new THREE.Group();
  candado.position.set(x0 + 242 * paso, 1.55, 0);
  candado.scale.setScalar(1.35);
  const cuerpo = new THREE.BoxGeometry(1.0, 0.8, 0.36);
  candado.add(new THREE.Mesh(cuerpo, relleno), new THREE.LineSegments(new THREE.EdgesGeometry(cuerpo), bordesC));
  const ojo = new THREE.CylinderGeometry(0.09, 0.09, 0.38, 16);
  ojo.rotateX(Math.PI / 2);
  candado.add(new THREE.LineSegments(new THREE.EdgesGeometry(ojo, 30), bordesC));
  const arcoPivote = new THREE.Group();
  arcoPivote.position.set(-0.3, 0.4, 0);
  candado.add(arcoPivote);
  const arcoGeo = new THREE.TorusGeometry(0.3, 0.07, 10, 28, Math.PI);
  arcoGeo.translate(0.3, 0.12, 0);
  const patas = new THREE.CylinderGeometry(0.07, 0.07, 0.24, 10);
  const pataA = patas.clone(); pataA.translate(0, 0.0, 0);
  const pataB = patas.clone(); pataB.translate(0.6, 0.0, 0);
  const emis = new THREE.MeshBasicMaterial({ color: PALETA.skyview.clone().multiplyScalar(2.4), transparent: true, opacity: 1 });
  materiales.push({ mat: emis, base: 1 });
  arcoPivote.add(new THREE.Mesh(arcoGeo, emis), new THREE.Mesh(pataA, emis), new THREE.Mesh(pataB, emis));
  grupo.add(candado);

  const fijarP = (p) => {
    colorear(p);
    const a = suave(0.05, 0.4, p);
    arcoPivote.position.y = 0.4 + a * 0.28;
    arcoPivote.rotation.y = -a * 1.1;
    candado.position.y = 1.55 + a * 0.15;
  };
  return { grupo, materiales, fijarP, candado };
}

function crearColumnas() {
  const grupo = new THREE.Group();
  const materiales = [];
  const hacer = (x, valor, color, brillo) => {
    const alto = valor * 0.42;
    const geo = new THREE.CylinderGeometry(0.85, 0.85, 1, 64, 1, true);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...UNIFORMS_GLOBALES, uColor: { value: color.clone() }, uOpacidad: { value: 1 }, uBrillo: { value: brillo } },
      vertexShader: /* glsl */ `
        varying float vY; varying vec3 vN; varying vec3 vV;
        void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position,1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacidad; uniform float uBrillo; uniform float uTiempo;
        varying float vY; varying vec3 vN; varying vec3 vV;
        void main(){
          // max(): con MSAA los varyings se extrapolan y |dot| puede pasar de 1 → pow(negativo) = NaN
          float f = pow(max(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0), 1.6);
          float top = smoothstep(0.86, 1.0, vY);
          float lineas = 0.85 + 0.15 * sin(vY * 60.0 - uTiempo * 2.0);
          vec3 c = uColor * (0.1 + f * 0.9 + top * 1.2) * lineas * uBrillo;
          gl_FragColor = vec4(c * uOpacidad, 1.0);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    materiales.push({ mat, base: 1 });
    const columna = new THREE.Mesh(geo, mat);
    columna.position.x = x;
    columna.scale.y = alto;
    const anilloMat = new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.2 * brillo * brillo), transparent: true, opacity: 1 });
    materiales.push({ mat: anilloMat, base: 1 });
    const tapa = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.025, 8, 72), anilloMat);
    tapa.rotation.x = Math.PI / 2;
    tapa.position.set(x, alto, 0);
    const base = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.25, 72), anilloMat);
    base.rotation.x = -Math.PI / 2;
    base.position.set(x, 0.01, 0);
    grupo.add(columna, tapa, base);
    return { columna, tapa, alto };
  };
  const hoja = hacer(-2.3, 10.9, PALETA.skyview, 1.25);
  const azar = hacer(2.3, 8.2, new THREE.Color(0.45, 0.52, 0.66), 0.55);
  const fijarCrecimiento = (k) => {
    for (const c of [hoja, azar]) {
      c.columna.scale.y = Math.max(0.001, c.alto * k);
      c.tapa.position.y = c.alto * k;
    }
  };
  return { grupo, materiales, fijarCrecimiento };
}

function crearEscudo() {
  const grupo = new THREE.Group();
  const materiales = [];
  const radio = 4.4;
  const centro = v3(0, 0.3, 0);
  const n = 520;
  const hex = new THREE.RingGeometry(0.24, 0.3, 6, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...UNIFORMS_GLOBALES, uColor: { value: PALETA.skyview.clone() }, uOpacidad: { value: 1 } },
    vertexShader: /* glsl */ `
      varying float vOnda; varying float vProf;
      uniform float uTiempo;
      void main(){
        vec4 p = instanceMatrix * vec4(position, 1.0);
        vec4 w = modelMatrix * p;
        vOnda = 0.5 + 0.5 * sin(w.y * 2.2 + w.x * 0.6 - uTiempo * 1.8);
        vec4 mv = viewMatrix * w; vProf = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacidad; uniform float uNiebla; varying float vOnda; varying float vProf;
      void main(){ float d = uNiebla * vProf; float nb = exp(-d*d);
        vec3 c = uColor * (0.35 + 1.4 * pow(vOnda, 6.0)); gl_FragColor = vec4(c * uOpacidad * nb, 1.0); }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  materiales.push({ mat, base: 1 });
  const inst = new THREE.InstancedMesh(hex, mat, n);
  const m = new THREE.Matrix4();
  const o = new THREE.Object3D();
  let k = 0;
  const total = Math.round(n / 0.56);
  for (let i = 0; i < total && k < n; i++) {
    const y = 1 - (i + 0.5) / total * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    const p = v3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(radio).add(centro);
    if (p.y < 0.05) continue;
    o.position.copy(p);
    o.lookAt(centro);
    o.updateMatrix();
    m.copy(o.matrix);
    inst.setMatrixAt(k++, m);
  }
  inst.count = k;
  grupo.add(inst);
  const burbuja = crearMaterialXray({ intensidad: 0.55, base: 0.01, potencia: 3.0, barrido: false });
  materiales.push({ mat: burbuja, base: 1 });
  const esfera = new THREE.Mesh(new THREE.SphereGeometry(radio * 1.01, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.54), burbuja);
  esfera.position.copy(centro);
  grupo.add(esfera);
  const anilloMat = new THREE.MeshBasicMaterial({ color: PALETA.skyview.clone().multiplyScalar(2), transparent: true, opacity: 1 });
  materiales.push({ mat: anilloMat, base: 1 });
  const rsuelo = Math.sqrt(radio * radio - centro.y * centro.y);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(rsuelo - 0.04, rsuelo + 0.04, 128), anilloMat);
  anillo.rotation.x = -Math.PI / 2;
  anillo.position.y = 0.012;
  grupo.add(anillo);
  return { grupo, materiales };
}

function crearAnillo() {
  const grupo = new THREE.Group();
  const materiales = [];
  const mat = new THREE.MeshBasicMaterial({ color: PALETA.skyview.clone().multiplyScalar(1.6), transparent: true, opacity: 0.8 });
  materiales.push({ mat, base: 0.8 });
  const anillo = new THREE.Mesh(new THREE.RingGeometry(3.55, 3.6, 160), mat);
  anillo.rotation.x = -Math.PI / 2;
  anillo.position.y = 0.01;
  const mat2 = new THREE.MeshBasicMaterial({ color: PALETA.skyview.clone().multiplyScalar(0.6), transparent: true, opacity: 0.5 });
  materiales.push({ mat: mat2, base: 0.5 });
  const anillo2 = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.62, 160), mat2);
  anillo2.rotation.x = -Math.PI / 2;
  anillo2.position.y = 0.01;
  grupo.add(anillo, anillo2);
  return { grupo, materiales };
}

// ---------- Estados por escena ----------

function estadoBase() {
  return {
    cam: v3(7, 2, 8), mira: v3(0, 1, 0), fov: 35,
    vehX: 0, vehRot: 0, modo: 0, veh: 1, halos: 0,
    bloom: 0.85, alternar: 0, grilla: 1, playaMezcla: 0,
    opac: Object.fromEntries(CAPAS.map((c) => [c, 0])),
  };
}

// La cámara recorre una Bézier cuadrática con el punto de control elevado `elev` sobre el punto
// medio; algebraicamente es el lerp más 2·k·(1−k)·elev en Y (pico de elev/2 en k = 0,5).
function mezclarEstado(a, b, k, salida, elev = 0) {
  salida.cam.lerpVectors(a.cam, b.cam, k);
  if (elev) salida.cam.y += 2 * k * (1 - k) * elev;
  salida.mira.lerpVectors(a.mira, b.mira, k);
  for (const c of ['fov', 'vehX', 'modo', 'veh', 'halos', 'bloom', 'alternar', 'grilla', 'playaMezcla']) salida[c] = a[c] + (b[c] - a[c]) * k;
  const ra = envolver(a.vehRot), rb = envolver(b.vehRot);
  salida.vehRot = ra + envolver(rb - ra) * k;
  for (const c of CAPAS) salida.opac[c] = a.opac[c] + (b.opac[c] - a.opac[c]) * k;
  return salida;
}

function copiarEstado(e) {
  return { ...e, cam: e.cam.clone(), mira: e.mira.clone(), opac: { ...e.opac } };
}

const ASPECTO_DISENO = 16 / 9;
function fovPara(fovBase, aspecto) {
  if (!aspecto || aspecto >= ASPECTO_DISENO) return fovBase;
  const mitad = THREE.MathUtils.degToRad(fovBase / 2);
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(mitad) * ASPECTO_DISENO / aspecto));
  return Math.min(fov, 90);
}

// ---------- Calidad ----------

// 'alta': pixel ratio del dispositivo (≤ 2), MSAA ×4 en el render target del composer y bloom a ½.
// 'baja': pixel ratio 1, sin MSAA (FXAA en el pass final), bloom a ¼, la mitad de las
// partículas y 30 cuadros por segundo. 'auto' empieza en alta y se adapta en ambos sentidos.
const CALIDADES = {
  alta: { muestras: 4, divBloom: 2, particulas: 1, fps: 0, fxaa: 0 },
  baja: { muestras: 0, divBloom: 4, particulas: 0.5, fps: 30, fxaa: 1 },
};
const INACTIVIDAD_MS = 90000;
const EXPOSICION = 1.05;

// Zonas lejanas entre sí: saltar entre ellas pasa por un fundido a oscuro.
const ZONAS = { linea: 'linea', factibilidad: 'playa', futuro: 'futuro' };

// Progreso de la escena «linea» que deja el vehículo en la estación `id` (o null).
const X_INICIO_LINEA = ESTACIONES.carroceria - 8;
const X_FIN_LINEA = ESTACIONES['inspeccion-adicional'] + 6;
export function progresoEstacion(id) {
  if (!(id in ESTACIONES)) return null;
  return clamp01((ESTACIONES[id] - X_INICIO_LINEA) / (X_FIN_LINEA - X_INICIO_LINEA));
}

// ---------- API ----------

export async function crearEscena({
  canvas,
  capaEtiquetas,
  modeloUrl = 'assets/ranger.glb',
  movimientoReducido = false,
  calidad: calidadInicial = 'auto',
  entorno = 'estudio',
  captura = false,
} = {}) {
  inyectarEstilos();
  // En modo captura (Chrome headless con tiempo virtual) no corren requestAnimationFrame ni el
  // ticker de GSAP: el bucle usa setTimeout y las transiciones son instantáneas.
  const gsap = captura ? null : window.gsap;
  const busqueda = typeof location !== 'undefined' ? location.search : '';
  const debug = busqueda.includes('debug');
  const programar = captura ? (f) => setTimeout(() => f(performance.now()), 16) : (f) => requestAnimationFrame(f);
  const cancelar = captura ? (id) => clearTimeout(id) : (id) => cancelAnimationFrame(id);

  // Sin antialias nativo: todo pasa por el composer, que tiene su propio MSAA o FXAA.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = EXPOSICION;
  renderer.setClearColor(PALETA.twilight, 1);
  renderer.info.autoReset = false;
  const pixelRatioMax = Math.min(window.devicePixelRatio || 1, 2);
  let pixelRatio = pixelRatioMax;
  renderer.setPixelRatio(pixelRatio);

  const escena = new THREE.Scene();
  escena.background = PALETA.twilight.clone();
  escena.fog = new THREE.FogExp2(PALETA.twilight, UNIFORMS_GLOBALES.uNiebla.value);
  // Entorno para los reflejos de la pintura. Se compararon el estudio procedural y RoomEnvironment
  // (three/addons) con demo.html?env=estudio|room: los dos leen bien el azul con la pintura
  // ajustada, pero las luces de la sala florecen en llantas y vidrios con el bloom; el estudio
  // deja reflejos de horizonte en los vidrios y encaja con el fondo Twilight. Queda el estudio.
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTex;
  if (entorno === 'estudio') {
    const ambiente = crearEstudio();
    envTex = pmrem.fromScene(ambiente, 0.02).texture;
    escena.environmentIntensity = 0.9;
    ambiente.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  } else {
    const sala = new RoomEnvironment();
    envTex = pmrem.fromScene(sala, 0.04).texture;
    escena.environmentIntensity = 0.42;
    sala.dispose?.();
  }
  escena.environment = envTex;

  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 400);
  camara.position.set(7, 2, 8);

  // Luces: rasante + contraluz frío para la variante pintada
  escena.add(new THREE.HemisphereLight(0x2a4a80, 0x00142e, 0.5));
  const clave = new THREE.DirectionalLight(0xffffff, 3.2);
  clave.position.set(-7, 1.6, 6);
  const contra = new THREE.DirectionalLight(0x6fa8ff, 4.0);
  contra.position.set(6, 3.5, -7);
  const cenital = new THREE.DirectionalLight(0xdfe8ff, 0.9);
  cenital.position.set(0, 10, 2);
  escena.add(clave, contra, cenital);

  // Piso y fábrica
  const piso = crearPiso();
  escena.add(piso.malla);
  const fabrica = crearFabrica();
  escena.add(fabrica.grupo);

  // Vehículo (GLB o procedural; nunca falla) y su sombra de contacto
  const vehiculo = await cargarVehiculo(modeloUrl);
  escena.add(vehiculo.grupo);
  const sombra = crearSombraContacto(renderer, vehiculo);

  // Grupos abstractos
  const datos = crearDatos();
  const timeline = crearLineaTiempo();
  timeline.grupo.position.set(0, 0, 0);
  const columnas = crearColumnas();
  const escudo = crearEscudo();
  const anillo = crearAnillo();
  for (const g of [datos, timeline, columnas, escudo, anillo]) escena.add(g.grupo);
  const capas = {
    linea: fabrica.capas.linea,
    playa: fabrica.capas.playa,
    convoy: fabrica.capas.convoy,
    datos: envolverCapa(datos),
    timeline: envolverCapa(timeline),
    columnas: envolverCapa(columnas),
    escudo: envolverCapa(escudo),
    anillo: envolverCapa(anillo),
  };
  function envolverCapa(g) {
    return {
      grupo: g.grupo,
      opacidad: 1,
      fijarOpacidad(a) {
        this.opacidad = a;
        g.grupo.visible = a > 0.003;
        for (const { mat, base } of g.materiales) fijarOpacidad(mat, base * a, base);
      },
    };
  }
  const geometriasParticulas = [datos.grupo.children[0].geometry, ...fabrica.particulas];
  const totalesParticulas = geometriasParticulas.map((g) => g.attributes.position.count);

  // Postproceso: render target HalfFloat con MSAA (alta) → bloom → OutputPass (tone mapping y
  // sRGB) → pass final propio (FXAA en baja + viñeta).
  const rtComposer = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: CALIDADES.alta.muestras });
  const composer = new EffectComposer(renderer, rtComposer);
  composer.addPass(new RenderPass(escena, camara));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.9, 0.5, 0.55);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const passFinal = new ShaderPass(SHADER_FINAL);
  composer.addPass(passFinal);

  // Etiquetas CSS2D
  const etiquetas = new CSS2DRenderer();
  etiquetas.domElement.classList.add('escena-etiquetas');
  if (capaEtiquetas) capaEtiquetas.appendChild(etiquetas.domElement);
  const callbacksPunto = new Set();
  const puntos = {};
  const anclasVehiculo = new Set(['etiqueta-parabrisas', 'componente-1', 'componente-2', 'componente-3']);
  for (const id of IDS_PUNTOS) {
    const ancla = vehiculo.anclas[id] || fabrica.anclas[id];
    if (!ancla) continue;
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'punto';
    boton.dataset.punto = id;
    boton.setAttribute('aria-label', NOMBRES_PUNTOS[id] || id);
    boton.addEventListener('click', (ev) => { ev.stopPropagation(); callbacksPunto.forEach((cb) => cb(id)); });
    const obj = new CSS2DObject(boton);
    obj.visible = false;
    ancla.add(obj);
    puntos[id] = { obj, boton, ancla, deVehiculo: anclasVehiculo.has(id), oculto: false };
  }
  const puntosActivos = new Set();

  // Órbita
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enabled = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.enablePan = false;
  controles.rotateSpeed = 0.6;
  controles.zoomSpeed = 0.6;
  controles.minPolarAngle = 0.35;
  controles.maxPolarAngle = 1.4;
  let orbitando = false;
  let orbitaPedida = false;

  // Estado
  const progresos = Object.fromEntries(IDS_ESCENA.map((id) => [id, 0]));
  let actual = 'portada';
  let desde = null;
  const transicion = { k: 1 };
  let tween = null;
  let crecimiento = { k: 1 };
  let ultimoT = performance.now();
  let tiempo = 0;
  const estadoActual = estadoBase();
  const tmp = new THREE.Vector3();

  const anclaLocal = (id) => vehiculo.anclas[id].position;
  const posVehiculo = (local, x, rot) => local.clone().applyAxisAngle(THREE.Object3D.DEFAULT_UP, rot).add(v3(x, 0, 0));
  const idle = (vel) => (movimientoReducido ? 0 : tiempo * vel);

  const ESCENAS = {
    portada(p) {
      const e = estadoBase();
      e.modo = 1; e.vehRot = 0.55 + idle(0.12); e.bloom = 0.65;
      e.cam.set(5.4, 0.85, 6.9).multiplyScalar(1 + p * 0.15);
      e.mira.set(0.2, 0.85, 0);
      e.opac.anillo = 1; e.grilla = 0.7; e.fov = 32;
      return e;
    },
    linea(p) {
      const e = estadoBase();
      e.vehX = THREE.MathUtils.lerp(ESTACIONES.carroceria - 8, ESTACIONES['inspeccion-adicional'] + 6, p);
      e.vehRot = 0; e.modo = 0; e.bloom = 0.94;
      e.cam.set(e.vehX - 5.5, 2.7, 11);
      e.mira.set(e.vehX + 1.2, 1.7, 0);
      e.opac.linea = 1; e.opac.playa = 1;
      return e;
    },
    datos(p) {
      const e = estadoBase();
      e.veh = 0.22; e.vehRot = 0.4 + idle(0.05); e.bloom = 0.99;
      e.cam.set(1.5, 3.4, 19 - p * 2.5); e.mira.set(0, 2.6, 0);
      e.opac.datos = 1; e.grilla = 0.5;
      return e;
    },
    predictor(p) {
      const e = estadoBase();
      e.vehRot = 0; e.modo = 0; e.bloom = 1.07; e.fov = 30;
      const a = posVehiculo(anclaLocal('etiqueta-parabrisas'), 0, 0);
      const s = THREE.MathUtils.lerp(1.1, 0.85, p);
      e.cam.copy(a).add(v3(3.4, 1.1, -3.6).multiplyScalar(s));
      e.mira.copy(a).add(v3(-0.3, -0.05, 0.1));
      return e;
    },
    validacion(p) {
      const e = estadoBase();
      e.veh = 0; e.bloom = 0.94;
      e.cam.set(-3 + p * 4, 6.2, 17); e.mira.set(0.5 + p * 2.5, 0.4, 0);
      e.opac.timeline = 1; e.grilla = 0.6;
      return e;
    },
    resultado(p) {
      const e = estadoBase();
      e.veh = 0; e.bloom = 1.04;
      e.cam.set(0.8, 3.4, 13.5 - p * 1.5); e.mira.set(0, 2.4, 0);
      e.opac.columnas = 1; e.grilla = 0.6;
      return e;
    },
    seguridad(p) {
      const e = estadoBase();
      e.modo = 0; e.vehRot = -0.5 + idle(0.06); e.bloom = 0.99;
      e.cam.set(9.5, 3.6, 10.5).multiplyScalar(1 - p * 0.12); e.mira.set(0, 1.4, 0);
      e.opac.escudo = 1;
      return e;
    },
    factibilidad(p) {
      const e = estadoBase();
      e.veh = 0; e.bloom = 0.89;
      e.cam.set(CENTRO_PLAYA.x + 1, 54 - p * 5, CENTRO_PLAYA.z + 12); e.mira.copy(CENTRO_PLAYA);
      e.opac.playa = 1; e.opac.linea = 0.35;
      e.playaMezcla = suave(0.25, 0.75, p);
      return e;
    },
    'donde-mirar'(p) {
      const e = estadoBase();
      e.modo = 0; e.vehRot = 0; e.halos = 1; e.bloom = 1.04;
      e.cam.set(4.6, 3.1, -7.2).multiplyScalar(1 - p * 0.1); e.mira.set(0.1, 0.95, 0);
      return e;
    },
    futuro(p) {
      const e = estadoBase();
      e.veh = 0; e.bloom = 0.94; e.alternar = 1;
      e.cam.set(-10 + p * 12, 17, 33); e.mira.set(4 + p * 8, 0.5, 0);
      e.opac.linea = 1; e.opac.playa = 1; e.opac.convoy = 1;
      return e;
    },
    cierre(p) {
      const e = estadoBase();
      e.modo = 1; e.vehRot = -0.6 + idle(0.1); e.bloom = 1.17;
      const s = 1 + p * 0.9;
      e.cam.set(6.2 * s, 1.4 + p * 3.5, 7.4 * s); e.mira.set(0, 0.9 + p * 0.2, 0);
      e.opac.anillo = 1; e.grilla = 0.8; e.fov = 32;
      return e;
    },
  };

  // Perfil de transición por escena: duración base (se escala con la distancia) y curva.
  ESCENAS.portada.perfil = { duracion: 1.6, ease: 'power3.inOut' };
  ESCENAS.linea.perfil = { duracion: 1.8, ease: 'power2.inOut' };
  ESCENAS.datos.perfil = { duracion: 1.6, ease: 'power3.inOut' };
  ESCENAS.predictor.perfil = { duracion: 1.4, ease: 'expo.inOut' };
  ESCENAS.validacion.perfil = { duracion: 1.5, ease: 'power3.inOut' };
  ESCENAS.resultado.perfil = { duracion: 1.4, ease: 'power3.inOut' };
  ESCENAS.seguridad.perfil = { duracion: 1.6, ease: 'power3.inOut' };
  ESCENAS.factibilidad.perfil = { duracion: 2.0, ease: 'power2.inOut' };
  ESCENAS['donde-mirar'].perfil = { duracion: 1.4, ease: 'power3.inOut' };
  ESCENAS.futuro.perfil = { duracion: 2.0, ease: 'power2.inOut' };
  ESCENAS.cierre.perfil = { duracion: 1.8, ease: 'power3.inOut' };

  const viaje = { elev: 0, fundido: false };
  const foco = { id: null, k: 0 };
  let tweenFoco = null;
  const posFoco = new THREE.Vector3();

  function objetivo() {
    return ESCENAS[actual](progresos[actual]);
  }

  function aplicarEstado(e) {
    vehiculo.grupo.position.set(e.vehX, 0, 0);
    vehiculo.grupo.rotation.y = e.vehRot;
    vehiculo.modo = e.modo;
    vehiculo.fijarVisibilidad(e.veh);
    vehiculo.fijarHalos(e.halos, movimientoReducido ? 0 : tiempo);
    // en x-ray el vehículo es casi transparente: la sombra se aclara
    sombra.fijarOpacidad(e.veh * (0.35 + 0.65 * THREE.MathUtils.clamp(e.modo, 0, 1)));
    for (const c of CAPAS) capas[c].fijarOpacidad(e.opac[c]);
    bloom.strength = e.bloom;
    piso.material.uniforms.uAlternar.value = e.alternar;
    piso.material.uniforms.uOpacidadGrilla.value = e.grilla;
    piso.material.uniforms.uCentro.value.set(e.vehX * 0.5, 0);
    if (!orbitando) {
      camara.position.copy(e.cam);
      controles.target.copy(e.mira);
      // Foco: la mirada se corre hacia el punto y la cámara se acerca un poco (no en la línea,
      // donde el vehículo mismo avanza hasta la estación).
      if (foco.k > 0.001 && foco.id && puntos[foco.id] && actual !== 'linea') {
        vehiculo.grupo.updateMatrixWorld(true);
        puntos[foco.id].ancla.getWorldPosition(posFoco);
        controles.target.lerp(posFoco, 0.28 * foco.k);
        camara.position.lerp(posFoco, 0.1 * foco.k);
      }
      camara.lookAt(controles.target);
    }
    // Los fov de cada escena están pensados para 16:9; en pantallas más angostas se conserva
    // el campo horizontal para que el vehículo no se salga de cuadro.
    const fov = fovPara(e.fov, camara.aspect);
    if (Math.abs(camara.fov - fov) > 0.01) { camara.fov = fov; camara.updateProjectionMatrix(); }
  }

  let focoMarcado;
  function actualizarPuntos() {
    const camPos = camara.position;
    const cambioFoco = focoMarcado !== foco.id;
    focoMarcado = foco.id;
    for (const [id, p] of Object.entries(puntos)) {
      let visible = puntosActivos.has(id);
      if (visible) {
        if (p.deVehiculo) {
          visible = vehiculo.visibilidad > 0.5;
          const n = tmp.copy(p.ancla.userData.normal).applyQuaternion(vehiculo.grupo.quaternion);
          const pos = p.ancla.getWorldPosition(new THREE.Vector3());
          const haciaCam = camPos.clone().sub(pos).normalize();
          const oculto = n.dot(haciaCam) < -0.08;
          if (oculto !== p.oculto) { p.oculto = oculto; p.boton.classList.toggle('punto--oculto', oculto); p.boton.tabIndex = oculto ? -1 : 0; }
        } else {
          const capa = id === 'playa-despacho' ? capas.playa : capas.linea;
          visible = capa.opacidad > 0.5;
        }
      }
      p.obj.visible = visible;
      if (cambioFoco) {
        p.boton.classList.toggle('punto--foco', foco.id === id);
        p.boton.classList.toggle('punto--tenue', !!foco.id && foco.id !== id);
        if (foco.id === id) p.boton.setAttribute('aria-current', 'true');
        else p.boton.removeAttribute('aria-current');
      }
    }
  }

  // Encuadre: corre el centro óptico para que el sujeto quede del lado opuesto al texto.
  // desplazamiento ∈ [-1, 1]: negativo = sujeto a la izquierda, positivo = a la derecha.
  const encuadre = { x: 0 };
  function aplicarEncuadre(w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight) {
    const angosto = w < 900; // en mobile el texto ocupa todo el ancho: sin corrimiento
    const dx = angosto ? 0 : -encuadre.x * w * 0.2;
    if (dx === 0) camara.clearViewOffset();
    else camara.setViewOffset(w, h, dx, 0, w, h);
    camara.updateProjectionMatrix();
  }

  // ---------- Calidad ----------
  let modoCalidad = ['alta', 'baja', 'auto'].includes(calidadInicial) ? calidadInicial : 'auto';
  let calidadEfectiva = modoCalidad === 'baja' ? 'baja' : 'alta';

  // Tamaño (w, h en px CSS; pr = pixel ratio). Lo usa también capturar() con otra resolución.
  function dimensionar(w, h, pr) {
    const cfg = CALIDADES[calidadEfectiva];
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    bloom.setSize(Math.round((w * pr) / cfg.divBloom), Math.round((h * pr) / cfg.divBloom));
    passFinal.uniforms.uResolucion.value.set(w * pr, h * pr);
    etiquetas.setSize(w, h);
    camara.aspect = w / h;
    aplicarEncuadre(w, h);
    UNIFORMS_GLOBALES.uPixelRatio.value = pr * (h / 900);
  }
  function redimensionar() {
    dimensionar(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, pixelRatio);
  }

  function aplicarCalidad(efectiva, { pr } = {}) {
    calidadEfectiva = efectiva;
    const cfg = CALIDADES[efectiva];
    pixelRatio = pr ?? (efectiva === 'baja' ? 1 : pixelRatioMax);
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) {
      if (rt.samples !== cfg.muestras) { rt.samples = cfg.muestras; rt.dispose(); }
    }
    passFinal.uniforms.uFxaa.value = cfg.fxaa;
    geometriasParticulas.forEach((g, i) => g.setDrawRange(0, Math.round(totalesParticulas[i] * cfg.particulas)));
    redimensionar();
    medicion.reiniciar();
  }

  // Medición para 'auto' y para el panel ?debug.
  const medicion = {
    acumulado: 0, cuadros: 0, intervalos: 0, nIntervalos: 0, lentos: 0, rapidos: 0, ultimaBaja: -Infinity, espera: 6,
    ms: 0, fps: 0, ultimaSubida: -Infinity,
    reiniciar() { this.acumulado = 0; this.cuadros = 0; this.intervalos = 0; this.nIntervalos = 0; this.lentos = 0; this.rapidos = 0; },
  };
  function adaptar(ahora) {
    const m = medicion;
    if (m.acumulado < 1.5) return;
    m.ms = (m.acumulado / m.cuadros) * 1000;
    m.fps = m.cuadros / m.acumulado;
    const intervalo = m.nIntervalos ? (m.intervalos / m.nIntervalos) * 1000 : m.ms;
    m.acumulado = 0; m.cuadros = 0; m.intervalos = 0; m.nIntervalos = 0;
    if (modoCalidad !== 'auto' || captura) return;
    if (calidadEfectiva === 'alta') {
      if (m.ms > 24) {
        m.rapidos = 0;
        if (++m.lentos >= 2) {
          m.lentos = 0;
          if (pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); redimensionar(); }
          else {
            // si recién se había subido, esperar el doble antes de volver a probar
            m.espera = ahora - m.ultimaSubida < 15000 ? Math.min(m.espera * 2, 48) : 6;
            aplicarCalidad('baja');
          }
        }
      } else if (m.ms < 14 && pixelRatio < pixelRatioMax) {
        m.lentos = 0;
        if (++m.rapidos >= 4) { m.rapidos = 0; pixelRatio = Math.min(pixelRatioMax, pixelRatio + 0.25); redimensionar(); }
      } else { m.lentos = 0; m.rapidos = 0; }
    } else if (intervalo < 19) {
      // En baja se dibuja a 30 fps; si el navegador igual llega a 60 callbacks fluidos, hay margen.
      if (++m.rapidos >= m.espera) { m.ultimaSubida = ahora; aplicarCalidad('alta', { pr: 1 }); }
    } else m.rapidos = 0;
  }

  window.addEventListener('resize', redimensionar);
  aplicarCalidad(calidadEfectiva);

  // ---------- Panel de depuración (?debug) ----------
  let panelDebug = null;
  if (debug && !captura) {
    panelDebug = document.createElement('div');
    panelDebug.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99;font:12px/1.4 monospace;color:#cfe3ff;background:rgba(0,10,30,.75);padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(panelDebug);
  }

  // ---------- Bucle, pausa por inactividad ----------
  let raf = 0;
  let activo = true;
  let pausaManual = false;
  let pausaInactividad = false;
  let capturando = false;
  let ultimaActividad = performance.now();
  let ultimoRender = 0;
  let ultimoCallback = performance.now();

  const corriendo = () => activo && !pausaManual && !pausaInactividad && !document.hidden;
  function reanudarBucle() {
    if (!raf && corriendo()) { ultimoT = performance.now(); ultimoCallback = ultimoT; raf = programar(cuadro); }
  }
  function detenerBucle() {
    if (raf) cancelar(raf);
    raf = 0;
  }
  function registrarActividad() {
    ultimaActividad = performance.now();
    if (pausaInactividad) { pausaInactividad = false; reanudarBucle(); }
  }
  const EVENTOS_ACTIVIDAD = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart', 'scroll'];
  for (const ev of EVENTOS_ACTIVIDAD) window.addEventListener(ev, registrarActividad, { passive: true, capture: true });

  function renderizar(ahora) {
    const dt = Math.min((ahora - ultimoT) / 1000, 0.1);
    ultimoT = ahora;
    if (!movimientoReducido) tiempo += dt;
    UNIFORMS_GLOBALES.uTiempo.value = tiempo;

    const meta = objetivo();
    const e = desde && transicion.k < 1
      ? mezclarEstado(desde, meta, transicion.k, estadoActual, viaje.elev)
      : mezclarEstado(meta, meta, 1, estadoActual);
    // Fundido a oscuro en saltos largos: la exposición baja a 0,7 en la mitad del viaje.
    const s = viaje.fundido && transicion.k < 1 ? Math.sin(Math.PI * transicion.k) : 0;
    renderer.toneMappingExposure = EXPOSICION * (1 - 0.3 * s * s);
    aplicarEstado(e);
    // la órbita arranca desde la cámara ya ubicada en la escena (no desde la inicial)
    if (transicion.k >= 1 && orbitaPedida && !orbitando) activarOrbita();

    // animaciones internas
    datos.fijarP(progresos.datos);
    timeline.fijarP(progresos.validacion);
    columnas.fijarCrecimiento(crecimiento.k);
    fabrica.actualizar(tiempo, { vehiculoX: e.vehX, playaMezcla: e.playaMezcla, reducido: movimientoReducido });
    if (orbitando) controles.update();

    renderer.info.reset();
    composer.render();
    actualizarPuntos();
    etiquetas.render(escena, camara);
    return dt;
  }

  function cuadro(ahora = performance.now()) {
    raf = 0;
    if (!corriendo()) return;
    raf = programar(cuadro);
    if (capturando) return;
    medicion.intervalos += Math.min((ahora - ultimoCallback) / 1000, 0.1);
    medicion.nIntervalos++;
    ultimoCallback = ahora;
    const fps = CALIDADES[calidadEfectiva].fps;
    if (fps) {
      // conserva la fase para promediar 30 fps aunque la pantalla vaya a 60, 120 o 144 Hz
      const intervalo = 1000 / fps, transcurrido = ahora - ultimoRender;
      if (transcurrido < intervalo - 1) return;
      ultimoRender = transcurrido > intervalo * 3 ? ahora : ultimoRender + intervalo;
    } else ultimoRender = ahora;
    const dt = renderizar(ahora);
    medicion.acumulado += dt; medicion.cuadros++;
    adaptar(ahora);
    if (panelDebug) {
      const i = renderer.info.render;
      panelDebug.textContent = `${medicion.fps.toFixed(0)} fps · ${medicion.ms.toFixed(1)} ms/cuadro\n` +
        `draw calls ${i.calls} · tris ${(i.triangles / 1000).toFixed(0)} k\n` +
        `calidad ${modoCalidad} → ${calidadEfectiva} · pr ${pixelRatio}`;
    }
    // Pausa por inactividad: sin input ni transición durante 90 s se deja de dibujar.
    const quieto = transicion.k >= 1 && !tweenFoco?.isActive?.() && !orbitando;
    if (!captura && quieto && ahora - ultimaActividad > INACTIVIDAD_MS) {
      pausaInactividad = true;
      detenerBucle();
    }
  }
  function alCambiarVisibilidad() {
    if (document.hidden) detenerBucle();
    else reanudarBucle();
  }
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  raf = programar(cuadro);

  function activarOrbita() {
    orbitando = true;
    const dist = camara.position.distanceTo(controles.target);
    controles.minDistance = dist * 0.6;
    controles.maxDistance = dist * 1.6;
    controles.enabled = true;
    controles.update();
  }
  function desactivarOrbita() {
    orbitando = false;
    controles.enabled = false;
  }

  const api = {
    modeloCargado: vehiculo.tipo,

    // Sin `duracion` se usa el perfil de la escena destino escalado por la distancia recorrida.
    irA(idEscena, { duracion } = {}) {
      if (!ESCENAS[idEscena]) { console.warn('[escena] id desconocido:', idEscena); return; }
      registrarActividad();
      // instantánea del estado visible (incluye la cámara de la órbita si estaba activa)
      const instante = copiarEstado(estadoActual);
      instante.cam.copy(camara.position);
      instante.mira.copy(controles.target);
      orbitaPedida = false;
      desactivarOrbita();
      const cambio = idEscena !== actual;
      const zonaPrevia = ZONAS[actual] || 'centro';
      actual = idEscena;
      desde = instante;
      if (tween) tween.kill?.();
      const meta = objetivo();
      const distancia = instante.cam.distanceTo(meta.cam);
      const perfil = ESCENAS[idEscena].perfil || {};
      const d = movimientoReducido || !gsap ? 0
        : duracion ?? THREE.MathUtils.clamp((perfil.duracion ?? 1.6) * (0.75 + distancia / 40), 1.1, 2.4);
      const zonaNueva = ZONAS[idEscena] || 'centro';
      viaje.fundido = cambio && (zonaPrevia !== zonaNueva) && (zonaPrevia !== 'centro' || zonaNueva !== 'centro' || distancia > 28);
      viaje.elev = distancia < 4 ? 0 : Math.min(distancia * 0.2, 14);
      if (idEscena === 'resultado' && cambio) {
        crecimiento.k = movimientoReducido || !gsap ? 1 : 0;
        if (crecimiento.k < 1) gsap.to(crecimiento, { k: 1, duration: 1.8, delay: d * 0.5, ease: 'power2.out' });
      }
      if (d <= 0) { transicion.k = 1; return; }
      transicion.k = 0;
      tween = gsap.to(transicion, { k: 1, duration: d, ease: perfil.ease || 'power3.inOut' });
    },

    // lado = lado del TEXTO ('izquierda' | 'derecha' | null): el sujeto se corre al opuesto.
    encuadrar(lado, { duracion = 1.2 } = {}) {
      const meta = lado === 'izquierda' ? 1 : lado === 'derecha' ? -1 : 0;
      const d = movimientoReducido || !gsap ? 0 : duracion;
      if (d <= 0) { encuadre.x = meta; aplicarEncuadre(); return; }
      gsap.to(encuadre, { x: meta, duration: d, ease: 'power3.inOut', onUpdate: () => aplicarEncuadre(), overwrite: true });
    },

    progreso(idEscena, t) {
      if (!(idEscena in progresos)) return;
      const v = clamp01(Number(t) || 0);
      if (v !== progresos[idEscena]) registrarActividad();
      progresos[idEscena] = v;
    },

    mostrarPuntos(ids = []) {
      puntosActivos.clear();
      for (const id of ids || []) if (puntos[id]) puntosActivos.add(id);
    },

    alTocarPunto(callback) {
      if (typeof callback === 'function') callbacksPunto.add(callback);
      return () => callbacksPunto.delete(callback);
    },

    orbita(habilitada) {
      orbitaPedida = !!habilitada;
      if (!habilitada) desactivarOrbita();
      else if (transicion.k >= 1) activarOrbita();
    },

    // Resalta el punto `id` (o quita el foco con null): el botón crece y los demás se atenúan,
    // el halo correspondiente brilla más y la cámara se inclina hacia él. En «linea», si `id` es
    // una estación, el vehículo avanza hasta ella (ver progresoEstacion).
    enfocarPunto(id = null) {
      registrarActividad();
      const nuevo = id && puntos[id] ? id : null;
      if (nuevo && actual === 'linea') {
        const p = progresoEstacion(nuevo);
        if (p !== null) {
          if (gsap && !movimientoReducido) gsap.to(progresos, { linea: p, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto' });
          else progresos.linea = p;
        }
      }
      vehiculo.focoHalo = nuevo;
      if (nuevo === foco.id) return;
      const anterior = foco.id;
      if (tweenFoco) tweenFoco.kill?.();
      const d = movimientoReducido || !gsap ? 0 : 0.9;
      if (!nuevo) {
        if (d) tweenFoco = gsap.to(foco, { k: 0, duration: d, ease: 'power2.inOut', onComplete: () => { foco.id = null; } });
        else { foco.k = 0; foco.id = null; }
        return;
      }
      foco.id = nuevo;
      // de un punto a otro se reparte el viaje sin volver a cero
      if (d) tweenFoco = gsap.fromTo(foco, { k: anterior ? Math.min(foco.k, 0.5) : foco.k }, { k: 1, duration: d, ease: 'power2.inOut' });
      else foco.k = 1;
    },

    // 'alta' | 'baja' | 'auto' (sin argumento sólo consulta). Devuelve la calidad efectiva.
    calidad(modo) {
      if (modo && ['alta', 'baja', 'auto'].includes(modo) && modo !== modoCalidad) {
        modoCalidad = modo;
        aplicarCalidad(modo === 'baja' ? 'baja' : 'alta');
      }
      return calidadEfectiva;
    },

    // Pausa (true) o reanuda (false) el render. Una pausa manual no se levanta con el input;
    // la de inactividad sí.
    pausar(pausado = true) {
      pausaManual = !!pausado;
      if (pausaManual) detenerBucle();
      else { pausaInactividad = false; ultimaActividad = performance.now(); reanudarBucle(); }
    },

    // Renderiza un cuadro a `ancho`×`alto` (pixel ratio 1) y devuelve Promise<Blob>.
    // Por defecto 1920×1080 en PNG; `tipo: 'image/webp'` y `calidad` para los renders.
    capturar({ ancho = 1920, alto = 1080, tipo = 'image/png', calidad: q = 0.92 } = {}) {
      return new Promise((resolver) => {
        capturando = true;
        dimensionar(ancho, alto, 1);
        UNIFORMS_GLOBALES.uPixelRatio.value = alto / 900;
        renderizar(performance.now());
        renderer.domElement.toBlob((blob) => {
          capturando = false;
          redimensionar();
          resolver(blob);
        }, tipo, q);
      });
    },

    destruir() {
      activo = false;
      detenerBucle();
      if (tween) tween.kill?.();
      if (tweenFoco) tweenFoco.kill?.();
      window.removeEventListener('resize', redimensionar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      for (const ev of EVENTOS_ACTIVIDAD) window.removeEventListener(ev, registrarActividad, { capture: true });
      panelDebug?.remove();
      controles.dispose();
      etiquetas.domElement.remove();
      sombra.destruir();
      escena.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      envTex.dispose();
      pmrem.dispose();
      composer.dispose?.();
      renderer.dispose();
    },
  };

  if (debug || busqueda.includes('anclas')) window.__escena = { renderer, escena, camara, bloom, vehiculo, fabrica, sombra, composer };
  return api;
}
