// Línea de producción simulada en código: piso, cinta, 5 estaciones y playa de despacho.
// Estilo wireframe: rellenos oscuros + bordes Skyview tenues + bandas emisivas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  PALETA,
  UNIFORMS_GLOBALES,
  crearMaterialBordes,
  crearMaterialRelleno,
  crearMaterialXray,
  crearMaterialPuntos,
  crearMaterialPiso,
} from './materiales.js';
import { crearGeometriaPickupSimple } from './vehiculo.js';

export const ESTACIONES = {
  carroceria: -36,
  pintura: -18,
  montaje: 0,
  'gate-release': 18,
  'inspeccion-adicional': 34,
};
export const INICIO_LINEA = -50;
export const FIN_LINEA = 46;
export const PLAYA = { x0: 52, columnas: 12, filas: 5, pasoX: 2.7, pasoZ: 6.6 };
export const CENTRO_PLAYA = new THREE.Vector3(PLAYA.x0 + ((PLAYA.columnas - 1) * PLAYA.pasoX) / 2, 0, 0);

const tmpM = new THREE.Matrix4();
const tmpV = new THREE.Vector3();

function caja(ax, ay, az, x, y, z) {
  const g = new THREE.BoxGeometry(ax, ay, az);
  g.translate(x, y, z);
  return g;
}

// Registro de materiales con opacidad base para atenuar grupos completos.
class Capa {
  constructor(nombre) {
    this.grupo = new THREE.Group();
    this.grupo.name = nombre;
    this.materiales = [];
    this.opacidad = 1;
  }
  registrar(mat, base = null) {
    const b = base ?? (mat.uniforms?.uOpacidad ? mat.uniforms.uOpacidad.value : mat.opacity);
    this.materiales.push({ mat, base: b });
    return mat;
  }
  fijarOpacidad(a) {
    this.opacidad = a;
    this.grupo.visible = a > 0.003;
    for (const { mat, base } of this.materiales) {
      if (mat.uniforms?.uOpacidad) mat.uniforms.uOpacidad.value = base * a;
      else mat.opacity = base * a;
    }
  }
}

export function crearPiso() {
  const material = crearMaterialPiso();
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(600, 300, 1, 1), material);
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = -0.002;
  piso.renderOrder = -1;
  piso.name = 'piso';
  return { malla: piso, material };
}

export function crearFabrica() {
  const linea = new Capa('linea');
  const playa = new Capa('playa');
  const convoy = new Capa('convoy');
  const raiz = new THREE.Group();
  raiz.name = 'fabrica';
  raiz.add(linea.grupo, playa.grupo, convoy.grupo);

  const relleno = linea.registrar(crearMaterialRelleno({ color: new THREE.Color('#021431') }));
  const rellenoTranslucido = linea.registrar(crearMaterialRelleno({ color: new THREE.Color('#04204a'), opacidad: 0.28 }));
  rellenoTranslucido.depthWrite = false;
  const bordes = linea.registrar(crearMaterialBordes({ opacidad: 0.2 }));
  const bordesFuertes = linea.registrar(crearMaterialBordes({ opacidad: 0.42 }));
  const emisivo = linea.registrar(new THREE.MeshBasicMaterial({
    color: PALETA.skyview.clone().multiplyScalar(1.5), transparent: true, opacity: 1, fog: true,
  }));
  const emisivoBlanco = linea.registrar(new THREE.MeshBasicMaterial({
    color: PALETA.blanco.clone().multiplyScalar(1.6), transparent: true, opacity: 0.9, fog: true,
  }));

  const estaticos = [];      // rellenos opacos con bordes tenues
  const translucidos = [];   // cabinas (relleno translúcido)
  const bandas = [];         // emisivos Skyview
  const anclas = {};

  const agregarAncla = (id, x, y, z, padre = linea.grupo) => {
    const a = new THREE.Object3D();
    a.position.set(x, y, z);
    a.name = id;
    padre.add(a);
    anclas[id] = a;
  };

  // ----- Cinta transportadora -----
  const largo = FIN_LINEA - INICIO_LINEA;
  const centroCinta = (FIN_LINEA + INICIO_LINEA) / 2;
  estaticos.push(caja(largo, 0.16, 0.18, centroCinta, 0.08, 1.7), caja(largo, 0.16, 0.18, centroCinta, 0.08, -1.7));
  bandas.push(caja(largo, 0.02, 0.04, centroCinta, 0.17, 1.7), caja(largo, 0.02, 0.04, centroCinta, 0.17, -1.7));
  const cintaMat = new THREE.ShaderMaterial({
    uniforms: { ...UNIFORMS_GLOBALES, uColor: { value: PALETA.skyview.clone() }, uOpacidad: { value: 1 }, uVelocidad: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vProf;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vProf = -mv.z; gl_Position = projectionMatrix * mv; }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacidad; uniform float uTiempo; uniform float uNiebla; uniform float uVelocidad;
      varying vec2 vUv; varying float vProf;
      void main(){
        float x = vUv.x * ${largo.toFixed(1)} - uTiempo * 0.8 * uVelocidad;
        float chevron = fract(x / 1.2 + abs(vUv.y - 0.5) * 0.9);
        float l = smoothstep(0.0, 0.06, chevron) * (1.0 - smoothstep(0.1, 0.16, chevron));
        float borde = smoothstep(0.46, 0.5, abs(vUv.y - 0.5));
        float d = uNiebla * vProf; float n = exp(-d*d);
        vec3 c = uColor * (l * 0.22 + borde * 0.25 + 0.02);
        gl_FragColor = vec4(c * uOpacidad * n, 1.0);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  linea.registrar(cintaMat);
  const cinta = new THREE.Mesh(new THREE.PlaneGeometry(largo, 3.2), cintaMat);
  cinta.rotation.x = -Math.PI / 2;
  cinta.position.set(centroCinta, 0.01, 0);
  linea.grupo.add(cinta);

  // Rodillos repetidos (instanced)
  const rodillosGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.3, 8);
  rodillosGeo.rotateX(Math.PI / 2);
  const nRod = Math.floor(largo / 1.5);
  const rodillos = new THREE.InstancedMesh(rodillosGeo, relleno, nRod);
  for (let i = 0; i < nRod; i++) {
    tmpM.makeTranslation(INICIO_LINEA + i * 1.5 + 0.75, 0.06, 0);
    rodillos.setMatrixAt(i, tmpM);
  }
  linea.grupo.add(rodillos);

  // Banda emisiva en el piso a la entrada de cada estación
  for (const x of Object.values(ESTACIONES)) {
    bandas.push(caja(0.08, 0.01, 7.6, x - 3.4, 0.01, 0), caja(0.08, 0.01, 7.6, x + 3.4, 0.01, 0));
  }

  // ----- 1. Carrocería: pórtico + robots articulados + chispas -----
  const xC = ESTACIONES.carroceria;
  const portico = (x, alto, ancho, prof, conVigaLuz = true) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      estaticos.push(caja(0.32, alto, 0.32, x + sx * prof / 2, alto / 2, sz * ancho / 2));
    }
    estaticos.push(caja(prof + 0.32, 0.36, 0.36, x, alto, ancho / 2), caja(prof + 0.32, 0.36, 0.36, x, alto, -ancho / 2));
    estaticos.push(caja(0.36, 0.36, ancho, x - prof / 2, alto, 0), caja(0.36, 0.36, ancho, x + prof / 2, alto, 0));
    if (conVigaLuz) bandas.push(caja(prof, 0.04, 0.06, x, alto - 0.2, ancho / 2 - 0.2), caja(prof, 0.04, 0.06, x, alto - 0.2, -ancho / 2 + 0.2));
  };
  portico(xC, 5.2, 7.2, 6.4);
  agregarAncla('carroceria', xC, 4.4, 0);

  const robots = [];
  const puntas = [];
  const crearRobot = (x, z, fase) => {
    const base = new THREE.Group();
    base.position.set(x, 0, z);
    linea.grupo.add(base);
    const piezas = [];
    const pieza = (geo, padre) => {
      const m = new THREE.Mesh(geo, relleno);
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), bordesFuertes);
      padre.add(m, l);
      piezas.push(m);
    };
    const pedestal = new THREE.CylinderGeometry(0.42, 0.5, 0.6, 16); pedestal.translate(0, 0.3, 0);
    pieza(pedestal, base);
    const torreta = new THREE.Group(); torreta.position.y = 0.6; base.add(torreta);
    const tg = new THREE.CylinderGeometry(0.3, 0.34, 0.4, 14); tg.translate(0, 0.2, 0);
    pieza(tg, torreta);
    const hombro = new THREE.Group(); hombro.position.y = 0.4; torreta.add(hombro);
    const brazo1 = caja(0.26, 1.7, 0.3, 0, 0.85, 0); pieza(brazo1, hombro);
    const codo = new THREE.Group(); codo.position.y = 1.7; hombro.add(codo);
    const brazo2 = caja(0.2, 1.4, 0.22, 0, 0.7, 0); pieza(brazo2, codo);
    const muneca = new THREE.Group(); muneca.position.y = 1.4; codo.add(muneca);
    const herr = new THREE.CylinderGeometry(0.05, 0.1, 0.35, 8); herr.translate(0, 0.17, 0);
    pieza(herr, muneca);
    const punta = new THREE.Object3D(); punta.position.y = 0.38; muneca.add(punta);
    const orient = z > 0 ? 1 : -1;
    robots.push({ torreta, hombro, codo, muneca, fase, orient });
    puntas.push(punta);
  };
  crearRobot(xC - 1.6, 3.0, 0);
  crearRobot(xC + 1.6, 3.0, 1.3);
  crearRobot(xC - 1.6, -3.0, 2.1);
  crearRobot(xC + 1.6, -3.0, 3.4);

  const nChispas = 640;
  const chispasGeo = new THREE.BufferGeometry();
  const semillas = new Float32Array(nChispas * 4);
  for (let i = 0; i < nChispas; i++) {
    semillas[i * 4] = i % 4;
    semillas[i * 4 + 1] = Math.random();
    semillas[i * 4 + 2] = Math.random() * 2 - 1;
    semillas[i * 4 + 3] = Math.random() * 2 - 1;
  }
  chispasGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nChispas * 3), 3));
  chispasGeo.setAttribute('aSemilla', new THREE.BufferAttribute(semillas, 4));
  const chispasMat = crearMaterialPuntos({
    color: new THREE.Color('#bfe0ff'),
    tamano: 5,
    uniforms: { uOrigenes: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) }, uSoldando: { value: new THREE.Vector4(1, 1, 1, 1) } },
    vertexShader: /* glsl */ `
      attribute vec4 aSemilla;
      uniform vec3 uOrigenes[4];
      uniform vec4 uSoldando;
      uniform float uTiempo; uniform float uTamano; uniform float uPixelRatio;
      varying float vProf; varying float vBrillo; varying vec3 vTinte;
      void main(){
        int k = int(aSemilla.x + 0.5);
        vec3 o = uOrigenes[0]; float s = uSoldando.x;
        if (k == 1) { o = uOrigenes[1]; s = uSoldando.y; }
        if (k == 2) { o = uOrigenes[2]; s = uSoldando.z; }
        if (k == 3) { o = uOrigenes[3]; s = uSoldando.w; }
        float t = fract(uTiempo * 1.3 + aSemilla.y);
        vec3 vel = vec3(aSemilla.z * 1.6, 1.2 + aSemilla.y * 1.5, aSemilla.w * 1.6);
        vec3 p = o + vel * t + vec3(0.0, -4.9, 0.0) * t * t;
        p.y = max(p.y, 0.02);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vProf = -mv.z;
        vBrillo = (1.0 - t) * (1.0 - t) * s * 2.2;
        vTinte = vec3(1.0);
        gl_PointSize = uTamano * uPixelRatio * (1.0 - t * 0.6) * (10.0 / max(vProf, 0.1));
        gl_Position = projectionMatrix * mv;
      }
    `,
  });
  linea.registrar(chispasMat);
  const chispas = new THREE.Points(chispasGeo, chispasMat);
  chispas.frustumCulled = false;
  linea.grupo.add(chispas);

  // ----- 2. Pintura: cabina cerrada + cortina de partículas -----
  const xP = ESTACIONES.pintura;
  translucidos.push(caja(7.2, 4.4, 5.6, xP, 2.2, 0));
  estaticos.push(caja(7.6, 0.3, 6.0, xP, 4.55, 0));
  bandas.push(caja(7.0, 0.05, 0.08, xP, 4.36, 2.75), caja(7.0, 0.05, 0.08, xP, 4.36, -2.75));
  bandas.push(caja(0.06, 3.9, 0.06, xP - 3.62, 2.2, 2.82), caja(0.06, 3.9, 0.06, xP + 3.62, 2.2, 2.82));
  agregarAncla('pintura', xP, 4.4, 0);
  const nNiebla = 1100;
  const nieblaGeo = new THREE.BufferGeometry();
  const posN = new Float32Array(nNiebla * 3);
  const semN = new Float32Array(nNiebla);
  for (let i = 0; i < nNiebla; i++) {
    posN[i * 3] = xP + (Math.random() - 0.5) * 6.6;
    posN[i * 3 + 1] = Math.random();
    posN[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
    semN[i] = Math.random();
  }
  nieblaGeo.setAttribute('position', new THREE.BufferAttribute(posN, 3));
  nieblaGeo.setAttribute('aSemilla', new THREE.BufferAttribute(semN, 1));
  const cortinaMat = crearMaterialPuntos({
    color: PALETA.skyview.clone().lerp(PALETA.blanco, 0.4),
    tamano: 3.5,
    vertexShader: /* glsl */ `
      attribute float aSemilla;
      uniform float uTiempo; uniform float uTamano; uniform float uPixelRatio;
      varying float vProf; varying float vBrillo; varying vec3 vTinte;
      void main(){
        float t = fract(position.y - uTiempo * (0.18 + aSemilla * 0.12));
        vec3 p = vec3(position.x + sin(uTiempo + aSemilla * 30.0) * 0.08, t * 4.2, position.z);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vProf = -mv.z;
        vBrillo = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.8, t) * 0.55;
        vTinte = vec3(0.7, 0.85, 1.0);
        gl_PointSize = uTamano * uPixelRatio * (10.0 / max(vProf, 0.1));
        gl_Position = projectionMatrix * mv;
      }
    `,
  });
  linea.registrar(cortinaMat);
  const cortina = new THREE.Points(nieblaGeo, cortinaMat);
  cortina.frustumCulled = false;
  linea.grupo.add(cortina);

  // ----- 3. Montaje: pórtico con elevador -----
  const xM = ESTACIONES.montaje;
  portico(xM, 5.6, 7.0, 5.0);
  estaticos.push(caja(0.5, 0.5, 6.6, xM, 5.25, 0));
  agregarAncla('montaje', xM, 4.4, 0);
  const elevador = new THREE.Group();
  linea.grupo.add(elevador);
  {
    const plataforma = caja(3.4, 0.12, 2.6, xM, 0, 0);
    const cables = mergeGeometries([caja(0.03, 3, 0.03, xM - 1.5, 1.5, 1.2), caja(0.03, 3, 0.03, xM + 1.5, 1.5, 1.2),
      caja(0.03, 3, 0.03, xM - 1.5, 1.5, -1.2), caja(0.03, 3, 0.03, xM + 1.5, 1.5, -1.2)]);
    elevador.add(new THREE.Mesh(plataforma, relleno), new THREE.LineSegments(new THREE.EdgesGeometry(plataforma), bordesFuertes));
    elevador.add(new THREE.LineSegments(new THREE.EdgesGeometry(cables), bordes));
    const luz = new THREE.Mesh(caja(3.2, 0.03, 0.05, xM, -0.08, 1.25), emisivo);
    const luz2 = new THREE.Mesh(caja(3.2, 0.03, 0.05, xM, -0.08, -1.25), emisivo);
    elevador.add(luz, luz2);
  }

  // ----- 4. Gate Release: arco con luces -----
  const xG = ESTACIONES['gate-release'];
  const arco = new THREE.Shape();
  arco.moveTo(-3.4, 0); arco.lineTo(-3.4, 2.0);
  arco.absarc(0, 2.0, 3.4, Math.PI, 0, true);
  arco.lineTo(3.4, 0); arco.lineTo(3.0, 0); arco.lineTo(3.0, 2.0);
  arco.absarc(0, 2.0, 3.0, 0, Math.PI, false);
  arco.lineTo(-3.4, 0);
  const arcoGeo = new THREE.ExtrudeGeometry(arco, { depth: 0.6, bevelEnabled: false, curveSegments: 40 });
  arcoGeo.translate(0, 0, -0.3);
  arcoGeo.rotateY(Math.PI / 2);
  arcoGeo.translate(xG, 0, 0);
  const arcoMalla = new THREE.Mesh(arcoGeo, relleno);
  linea.grupo.add(arcoMalla, new THREE.LineSegments(new THREE.EdgesGeometry(arcoGeo, 20), bordesFuertes));
  agregarAncla('gate-release', xG, 4.4, 0);
  const nLuces = 29;
  const lucesGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const lucesMat = linea.registrar(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
  const luces = new THREE.InstancedMesh(lucesGeo, lucesMat, nLuces * 2);
  for (let i = 0; i < nLuces; i++) {
    const ang = Math.PI - (i / (nLuces - 1)) * Math.PI;
    for (const lado of [0, 1]) {
      tmpM.makeTranslation(xG + (lado ? 0.34 : -0.34), 2.0 + Math.sin(ang) * 2.92, Math.cos(ang) * 2.92);
      luces.setMatrixAt(i * 2 + lado, tmpM);
      luces.setColorAt(i * 2 + lado, PALETA.blanco);
    }
  }
  linea.grupo.add(luces);
  const colorLuz = new THREE.Color();
  const colorGate = PALETA.skyview.clone().multiplyScalar(1.8);
  const colorBlanco = new THREE.Color(0.9, 0.9, 0.95);

  // ----- 5. Inspección Adicional: túnel con plano de escaneo -----
  const xI = ESTACIONES['inspeccion-adicional'];
  const marcos = [];
  for (let i = 0; i < 7; i++) {
    const x = xI - 3.6 + i * 1.2;
    marcos.push(caja(0.14, 4.4, 0.14, x, 2.2, 2.9), caja(0.14, 4.4, 0.14, x, 2.2, -2.9), caja(0.14, 0.14, 5.94, x, 4.4, 0));
  }
  estaticos.push(...marcos);
  translucidos.push(caja(7.4, 0.05, 5.8, xI, 4.5, 0));
  bandas.push(caja(7.4, 0.04, 0.06, xI, 4.33, 0));
  agregarAncla('inspeccion-adicional', xI, 4.4, 0);
  const escaneoMat = new THREE.ShaderMaterial({
    uniforms: { ...UNIFORMS_GLOBALES, uOpacidad: { value: 1 }, uColor: { value: PALETA.skyview.clone() } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacidad; uniform vec3 uColor; uniform float uTiempo; varying vec2 vUv;
      void main(){
        float lineas = 0.5 + 0.5 * sin(vUv.y * 160.0 + uTiempo * 6.0);
        float borde = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x) * smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
        vec3 c = mix(uColor, vec3(1.0), 0.25) * (0.18 + lineas * 0.12) * borde;
        gl_FragColor = vec4(c * uOpacidad, 1.0);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  linea.registrar(escaneoMat);
  const escaneo = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.2), escaneoMat);
  escaneo.rotation.y = Math.PI / 2;
  escaneo.position.set(xI, 2.15, 0);
  const escaneoBorde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.01, 4.2, 5.6)), linea.registrar(crearMaterialBordes({ color: PALETA.blanco, opacidad: 0.9 })));
  escaneoBorde.position.copy(escaneo.position);
  linea.grupo.add(escaneo, escaneoBorde);

  // Fusionar estáticos: pocos draw calls
  const estaticosGeo = mergeGeometries(estaticos.map((g) => g.toNonIndexed()));
  linea.grupo.add(new THREE.Mesh(estaticosGeo, relleno), new THREE.LineSegments(new THREE.EdgesGeometry(estaticosGeo, 20), bordes));
  const translGeo = mergeGeometries(translucidos.map((g) => g.toNonIndexed()));
  linea.grupo.add(new THREE.Mesh(translGeo, rellenoTranslucido), new THREE.LineSegments(new THREE.EdgesGeometry(translGeo, 20), bordesFuertes));
  linea.grupo.add(new THREE.Mesh(mergeGeometries(bandas.map((g) => g.toNonIndexed())), emisivo));

  // ----- Playa de despacho: pickups fusionadas con resalte por atributo -----
  const base = crearGeometriaPickupSimple();
  const baseBordes = new THREE.EdgesGeometry(base, 25);
  const n = PLAYA.columnas * PLAYA.filas;
  // 5 % ≈ 3 de 60. A: al azar; B: agrupadas (contiguas) — misma cantidad.
  const azar = new Set([7, 26, 49]);
  const agrupadas = new Set([29, 30, 31]);
  const posiciones = [];
  const geos = [];
  const geosB = [];
  for (let i = 0; i < n; i++) {
    const c = i % PLAYA.columnas;
    const f = Math.floor(i / PLAYA.columnas);
    const x = PLAYA.x0 + c * PLAYA.pasoX;
    const z = (f - (PLAYA.filas - 1) / 2) * PLAYA.pasoZ;
    posiciones.push([x, z]);
    tmpM.makeRotationY(Math.PI / 2).setPosition(x, 0, z);
    const g = base.clone().applyMatrix4(tmpM);
    const cnt = g.attributes.position.count;
    g.setAttribute('aResalteA', new THREE.BufferAttribute(new Float32Array(cnt).fill(azar.has(i) ? 1 : 0), 1));
    g.setAttribute('aResalteB', new THREE.BufferAttribute(new Float32Array(cnt).fill(agrupadas.has(i) ? 1 : 0), 1));
    geos.push(g);
    const b = baseBordes.clone().applyMatrix4(tmpM);
    const cb = b.attributes.position.count;
    b.setAttribute('aResalteA', new THREE.BufferAttribute(new Float32Array(cb).fill(azar.has(i) ? 1 : 0), 1));
    b.setAttribute('aResalteB', new THREE.BufferAttribute(new Float32Array(cb).fill(agrupadas.has(i) ? 1 : 0), 1));
    geosB.push(b);
  }
  const playaMat = playa.registrar(crearMaterialXray({ intensidad: 0.6, base: 0.02, barrido: false, resalte: true }));
  const playaBordesMat = playa.registrar(crearMaterialBordes({ opacidad: 0.5, colorVertice: true }));
  const playaMalla = new THREE.Mesh(mergeGeometries(geos), playaMat);
  const playaLineas = new THREE.LineSegments(mergeGeometries(geosB), playaBordesMat);
  playa.grupo.add(playaMalla, playaLineas);
  // marcas de estacionamiento
  const marcas = [];
  for (let f = 0; f < PLAYA.filas; f++) {
    const z = (f - (PLAYA.filas - 1) / 2) * PLAYA.pasoZ;
    for (let c = 0; c <= PLAYA.columnas; c++) {
      marcas.push(caja(0.05, 0.01, 5.8, PLAYA.x0 - PLAYA.pasoX / 2 + c * PLAYA.pasoX, 0.005, z));
    }
  }
  const marcasMat = playa.registrar(new THREE.MeshBasicMaterial({ color: PALETA.skyview.clone().multiplyScalar(0.5), transparent: true, opacity: 0.6, fog: true }));
  playa.grupo.add(new THREE.Mesh(mergeGeometries(marcas.map((g) => g.toNonIndexed())), marcasMat));
  agregarAncla('playa-despacho', CENTRO_PLAYA.x, 3.2, CENTRO_PLAYA.z, playa.grupo);

  // ----- Convoy de unidades en la línea (vista «futuro») -----
  const nConvoy = 8;
  const convoyMat = convoy.registrar(crearMaterialXray({ intensidad: 0.55, base: 0.02, barrido: false }));
  const convoyMalla = new THREE.InstancedMesh(base, convoyMat, nConvoy);
  convoyMalla.frustumCulled = false;
  convoy.grupo.add(convoyMalla);

  // ----- Animación -----
  const tiposPorEstacion = Object.entries(ESTACIONES);
  let ultimoGate = -1;

  function actualizar(tiempo, { vehiculoX = 0, playaMezcla = 0, reducido = false } = {}) {
    const t = reducido ? 0 : tiempo;
    // Robots
    robots.forEach((r, i) => {
      const s = Math.sin(t * 0.9 + r.fase);
      r.torreta.rotation.y = r.orient > 0 ? Math.PI + s * 0.5 : s * 0.5;
      r.torreta.rotation.y += Math.PI / 2;
      r.hombro.rotation.z = 0.55 + Math.sin(t * 1.1 + r.fase) * 0.18;
      r.codo.rotation.z = 0.95 + Math.sin(t * 1.4 + r.fase * 1.3) * 0.25;
      r.muneca.rotation.z = 0.4 + Math.sin(t * 2.0 + r.fase) * 0.2;
      r.torreta.updateMatrixWorld(true);
      puntas[i].getWorldPosition(chispasMat.uniforms.uOrigenes.value[i]);
      linea.grupo.worldToLocal(chispasMat.uniforms.uOrigenes.value[i]);
    });
    const sold = chispasMat.uniforms.uSoldando.value;
    sold.set(...[0, 1, 2, 3].map((k) => (reducido ? 0.4 : Math.max(0, Math.sin(t * 2.3 + k * 1.7)) ** 0.5)));
    // Elevador
    elevador.position.y = 2.6 + (reducido ? 0 : Math.sin(t * 0.6) * 1.0);
    // Escaneo: barre el túnel
    const fase = reducido ? 0.5 : (t * 0.22) % 1;
    escaneo.position.x = xI - 3.4 + Math.abs(fase * 2 - 1) * 6.8;
    escaneoBorde.position.x = escaneo.position.x;
    // Gate Release: blanco → Skyview según el paso del vehículo
    const g = THREE.MathUtils.smoothstep(vehiculoX, xG - 2.5, xG + 1.5);
    const gq = Math.round(g * 40);
    if (gq !== ultimoGate) {
      ultimoGate = gq;
      colorLuz.copy(colorBlanco).lerp(colorGate, g);
      for (let i = 0; i < nLuces * 2; i++) luces.setColorAt(i, colorLuz);
      luces.instanceColor.needsUpdate = true;
    }
    // Playa
    playaMat.uniforms.uMezcla.value = playaMezcla;
    playaBordesMat.uniforms.uMezcla.value = playaMezcla;
    // Convoy
    if (convoy.opacidad > 0.003) {
      for (let i = 0; i < nConvoy; i++) {
        const x = INICIO_LINEA + (((reducido ? 0 : t * 1.6) + i * (largo / nConvoy)) % largo);
        tmpM.makeTranslation(x, 0, 0);
        convoyMalla.setMatrixAt(i, tmpM);
      }
      convoyMalla.instanceMatrix.needsUpdate = true;
    }
  }

  return {
    grupo: raiz,
    anclas,
    capas: { linea, playa, convoy },
    actualizar,
    posicionesPlaya: posiciones,
    estaciones: tiposPorEstacion,
  };
}
