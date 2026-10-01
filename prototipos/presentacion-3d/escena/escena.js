// Escena 3D de la presentación: implementa la API del contrato (crearEscena → Escena).
// Fondo Ford Twilight con niebla, vehículo x-ray / pintado, línea de producción simulada,
// escenas abstractas (datos, validación, resultado, seguridad) y hotspots CSS2D.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  PALETA,
  UNIFORMS_GLOBALES,
  crearMaterialXray,
  crearMaterialBordes,
  crearMaterialRelleno,
  crearMaterialPuntos,
} from './materiales.js';
import { cargarVehiculo } from './vehiculo.js';
import { crearFabrica, crearPiso, ESTACIONES, CENTRO_PLAYA } from './fabrica.js';

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
        c += vec3(0.35, 0.5, 0.8) * exp(-pow((h - 0.04) * 22.0, 2.0)) * 0.9;
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
          float f = pow(1.0 - abs(dot(vN, vV)), 1.6);
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

function crearSombra() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacidad: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform float uOpacidad; varying vec2 vUv;
      void main(){ vec2 c = (vUv - 0.5) * 2.0; float d = length(c * vec2(1.0, 1.0));
        float a = smoothstep(1.0, 0.25, d) * 0.75; gl_FragColor = vec4(0.0, 0.0, 0.0, a * uOpacidad); }`,
    transparent: true, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 2.9), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  m.renderOrder = 0;
  return m;
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

function mezclarEstado(a, b, k, salida) {
  salida.cam.lerpVectors(a.cam, b.cam, k);
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

// ---------- API ----------

export async function crearEscena({ canvas, capaEtiquetas, modeloUrl = 'assets/ranger.glb', movimientoReducido = false } = {}) {
  inyectarEstilos();
  const gsap = window.gsap;
  const debug = typeof location !== 'undefined' && location.search.includes('debug');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(PALETA.twilight, 1);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);

  const escena = new THREE.Scene();
  escena.background = PALETA.twilight.clone();
  escena.fog = new THREE.FogExp2(PALETA.twilight, UNIFORMS_GLOBALES.uNiebla.value);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ambiente = crearEstudio();
  const envTex = pmrem.fromScene(ambiente, 0.02).texture;
  escena.environment = envTex;
  escena.environmentIntensity = 0.9;
  ambiente.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });

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

  // Vehículo (GLB o procedural; nunca falla)
  const vehiculo = await cargarVehiculo(modeloUrl);
  escena.add(vehiculo.grupo);
  const sombra = crearSombra();
  escena.add(sombra);

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
        for (const { mat, base } of g.materiales) {
          if (mat.uniforms?.uOpacidad) mat.uniforms.uOpacidad.value = base * a;
          else mat.opacity = base * a;
        }
      },
    };
  }

  // Postproceso
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(escena, camara));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.9, 0.5, 0.55);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

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

  function objetivo() {
    return ESCENAS[actual](progresos[actual]);
  }

  function aplicarEstado(e) {
    vehiculo.grupo.position.set(e.vehX, 0, 0);
    vehiculo.grupo.rotation.y = e.vehRot;
    vehiculo.modo = e.modo;
    vehiculo.fijarVisibilidad(e.veh);
    vehiculo.fijarHalos(e.halos, movimientoReducido ? 0 : tiempo);
    sombra.position.x = e.vehX;
    sombra.rotation.z = e.vehRot;
    sombra.material.uniforms.uOpacidad.value = e.veh;
    for (const c of CAPAS) capas[c].fijarOpacidad(e.opac[c]);
    bloom.strength = e.bloom;
    piso.material.uniforms.uAlternar.value = e.alternar;
    piso.material.uniforms.uOpacidadGrilla.value = e.grilla;
    piso.material.uniforms.uCentro.value.set(e.vehX * 0.5, 0);
    if (!orbitando) {
      camara.position.copy(e.cam);
      controles.target.copy(e.mira);
      camara.lookAt(e.mira);
    }
    // Los fov de cada escena están pensados para 16:9; en pantallas más angostas se conserva
    // el campo horizontal para que el vehículo no se salga de cuadro.
    const fov = fovPara(e.fov, camara.aspect);
    if (Math.abs(camara.fov - fov) > 0.01) { camara.fov = fov; camara.updateProjectionMatrix(); }
  }

  function actualizarPuntos() {
    const camPos = camara.position;
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
    }
  }

  // Encuadre: corre el centro óptico para que el sujeto quede del lado opuesto al texto.
  // desplazamiento ∈ [-1, 1]: negativo = sujeto a la izquierda, positivo = a la derecha.
  const encuadre = { x: 0 };
  function aplicarEncuadre() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const angosto = w < 900; // en mobile el texto ocupa todo el ancho: sin corrimiento
    const dx = angosto ? 0 : -encuadre.x * w * 0.2;
    if (dx === 0) camara.clearViewOffset();
    else camara.setViewOffset(w, h, dx, 0, w, h);
    camara.updateProjectionMatrix();
  }

  // Tamaño
  function redimensionar() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);
    bloom.setSize(Math.round((w * pixelRatio) / 2), Math.round((h * pixelRatio) / 2));
    etiquetas.setSize(w, h);
    camara.aspect = w / h;
    aplicarEncuadre();
    UNIFORMS_GLOBALES.uPixelRatio.value = pixelRatio * (h / 900);
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();

  // Bucle
  let raf = 0;
  let activo = true;
  let acumulado = 0, cuadros = 0, lentos = 0;
  function cuadro() {
    raf = requestAnimationFrame(cuadro);
    const ahora = performance.now();
    const dt = Math.min((ahora - ultimoT) / 1000, 0.1);
    ultimoT = ahora;
    if (!movimientoReducido) tiempo += dt;
    UNIFORMS_GLOBALES.uTiempo.value = tiempo;

    const meta = objetivo();
    const e = desde && transicion.k < 1 ? mezclarEstado(desde, meta, transicion.k, estadoActual) : mezclarEstado(meta, meta, 1, estadoActual);
    if (transicion.k >= 1 && orbitaPedida && !orbitando) activarOrbita();
    aplicarEstado(e);

    // animaciones internas
    datos.fijarP(progresos.datos);
    timeline.fijarP(progresos.validacion);
    columnas.fijarCrecimiento(crecimiento.k);
    fabrica.actualizar(tiempo, { vehiculoX: e.vehX, playaMezcla: e.playaMezcla, reducido: movimientoReducido });
    if (orbitando) controles.update();

    composer.render();
    actualizarPuntos();
    etiquetas.render(escena, camara);

    // calidad adaptativa: baja el pixel ratio si el cuadro es lento
    acumulado += dt; cuadros++;
    if (acumulado > 1.5) {
      const ms = (acumulado / cuadros) * 1000;
      if (ms > 24 && pixelRatio > 1) { lentos++; if (lentos >= 2) { pixelRatio = Math.max(1, pixelRatio - 0.25); redimensionar(); lentos = 0; } }
      else lentos = 0;
      acumulado = 0; cuadros = 0;
    }
  }
  function alCambiarVisibilidad() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (activo && !raf) { ultimoT = performance.now(); raf = requestAnimationFrame(cuadro); }
  }
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  raf = requestAnimationFrame(cuadro);

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

    irA(idEscena, { duracion = 1.6 } = {}) {
      if (!ESCENAS[idEscena]) { console.warn('[escena] id desconocido:', idEscena); return; }
      // instantánea del estado visible (incluye la cámara de la órbita si estaba activa)
      const instante = copiarEstado(estadoActual);
      instante.cam.copy(camara.position);
      instante.mira.copy(controles.target);
      orbitaPedida = false;
      desactivarOrbita();
      const cambio = idEscena !== actual;
      actual = idEscena;
      desde = instante;
      if (tween) tween.kill?.();
      const d = movimientoReducido ? 0 : duracion;
      if (idEscena === 'resultado' && cambio) {
        crecimiento.k = movimientoReducido ? 1 : 0;
        if (!movimientoReducido && gsap) gsap.to(crecimiento, { k: 1, duration: 1.8, delay: d * 0.5, ease: 'power2.out' });
        else crecimiento.k = 1;
      }
      if (d <= 0 || !gsap) { transicion.k = 1; return; }
      transicion.k = 0;
      tween = gsap.to(transicion, { k: 1, duration: d, ease: 'power3.inOut' });
    },

    // lado = lado del TEXTO ('izquierda' | 'derecha' | null): el sujeto se corre al opuesto.
    encuadrar(lado, { duracion = 1.2 } = {}) {
      const meta = lado === 'izquierda' ? 1 : lado === 'derecha' ? -1 : 0;
      const d = movimientoReducido || !gsap ? 0 : duracion;
      if (d <= 0) { encuadre.x = meta; aplicarEncuadre(); return; }
      gsap.to(encuadre, { x: meta, duration: d, ease: 'power3.inOut', onUpdate: aplicarEncuadre, overwrite: true });
    },

    progreso(idEscena, t) {
      if (!(idEscena in progresos)) return;
      progresos[idEscena] = clamp01(Number(t) || 0);
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

    destruir() {
      activo = false;
      cancelAnimationFrame(raf);
      if (tween) tween.kill?.();
      window.removeEventListener('resize', redimensionar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      controles.dispose();
      etiquetas.domElement.remove();
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

  if (debug) window.__escena = { renderer, escena, camara, bloom, vehiculo, fabrica };
  return api;
}
