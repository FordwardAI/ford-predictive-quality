// Materiales compartidos de la escena: paleta Ford, x-ray fresnel, bordes, pintura metalizada,
// partículas y piso. Todo generado en código (sin texturas descargadas).
import * as THREE from 'three';

export const PALETA = {
  fordBlue: new THREE.Color('#00095B'),
  twilight: new THREE.Color('#00142E'),
  skyview: new THREE.Color('#066FEF'),
  blanco: new THREE.Color('#FFFFFF'),
  gris: new THREE.Color('#F0F0F0'),
  negro: new THREE.Color('#0F0F0F'),
};

// Uniforms globales compartidos por todos los shaders propios (se actualizan una vez por cuadro).
export const UNIFORMS_GLOBALES = {
  uTiempo: { value: 0 },
  uNiebla: { value: 0.022 },
  uPixelRatio: { value: 1 },
};

const NIEBLA_GLSL = /* glsl */ `
  float factorNiebla(float profundidad) {
    float d = uNiebla * profundidad;
    return clamp(exp(-d * d), 0.0, 1.0);
  }
`;

// Fresnel aditivo para el efecto x-ray. Soporta instancing y un atributo de resalte opcional.
export function crearMaterialXray({
  color = PALETA.skyview,
  intensidad = 1.0,
  base = 0.035,
  potencia = 2.2,
  barrido = true,
  resalte = false,
} = {}) {
  const defines = {};
  if (resalte) defines.USE_RESALTE = '';
  if (barrido) defines.USE_BARRIDO = '';
  return new THREE.ShaderMaterial({
    defines,
    uniforms: {
      ...UNIFORMS_GLOBALES,
      uColor: { value: color.clone() },
      uColorResalte: { value: PALETA.blanco.clone() },
      uIntensidad: { value: intensidad },
      uBase: { value: base },
      uPotencia: { value: potencia },
      uOpacidad: { value: 1 },
      uMezcla: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vVista;
      varying float vProf;
      varying vec3 vMundo;
      #ifdef USE_RESALTE
        attribute float aResalteA;
        attribute float aResalteB;
        uniform float uMezcla;
        varying float vResalte;
      #endif
      void main() {
        vec4 pos = vec4(position, 1.0);
        vec3 nor = normal;
        #ifdef USE_INSTANCING
          pos = instanceMatrix * pos;
          nor = mat3(instanceMatrix) * nor;
        #endif
        vec4 mundo = modelMatrix * pos;
        vMundo = mundo.xyz;
        vec4 mv = viewMatrix * mundo;
        vNormal = normalize(mat3(viewMatrix) * mat3(modelMatrix) * nor);
        vVista = normalize(-mv.xyz);
        vProf = -mv.z;
        #ifdef USE_RESALTE
          vResalte = mix(aResalteA, aResalteB, uMezcla);
        #endif
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uColorResalte;
      uniform float uIntensidad;
      uniform float uBase;
      uniform float uPotencia;
      uniform float uOpacidad;
      uniform float uTiempo;
      uniform float uNiebla;
      varying vec3 vNormal;
      varying vec3 vVista;
      varying float vProf;
      varying vec3 vMundo;
      #ifdef USE_RESALTE
        varying float vResalte;
      #endif
      ${NIEBLA_GLSL}
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vVista))), uPotencia);
        vec3 col = uColor * (f * uIntensidad + uBase);
        #ifdef USE_BARRIDO
          float banda = smoothstep(0.92, 1.0, sin(vMundo.y * 3.0 - uTiempo * 1.6) * 0.5 + 0.5);
          col += uColor * banda * 0.08;
        #endif
        #ifdef USE_RESALTE
          col = mix(col * 0.6, mix(uColor, uColorResalte, 0.5) * (f * 1.3 + 0.22), vResalte);
        #endif
        float a = uOpacidad * factorNiebla(vProf);
        gl_FragColor = vec4(col * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

// Bordes (EdgesGeometry) aditivos con niebla. Usa colores de vértice opcionales.
export function crearMaterialBordes({ color = PALETA.skyview, opacidad = 0.9, colorVertice = false } = {}) {
  const defines = colorVertice ? { USE_COLOR_V: '' } : {};
  return new THREE.ShaderMaterial({
    defines,
    uniforms: {
      ...UNIFORMS_GLOBALES,
      uColor: { value: color.clone() },
      uOpacidad: { value: opacidad },
      uMezcla: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying float vProf;
      #ifdef USE_COLOR_V
        attribute float aResalteA;
        attribute float aResalteB;
        uniform float uMezcla;
        varying float vResalte;
      #endif
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vProf = -mv.z;
        #ifdef USE_COLOR_V
          vResalte = mix(aResalteA, aResalteB, uMezcla);
        #endif
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacidad;
      uniform float uNiebla;
      varying float vProf;
      #ifdef USE_COLOR_V
        varying float vResalte;
      #endif
      ${NIEBLA_GLSL}
      void main() {
        vec3 col = uColor;
        float a = uOpacidad;
        #ifdef USE_COLOR_V
          col = mix(uColor, vec3(0.75, 0.85, 1.0), vResalte);
          a = mix(uOpacidad * 0.45, uOpacidad * 1.2, vResalte);
        #endif
        a *= factorNiebla(vProf);
        gl_FragColor = vec4(col * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Relleno oscuro opaco para estructuras de la fábrica (bloquea lo que está detrás).
export function crearMaterialRelleno({ color = new THREE.Color('#031a3a'), opacidad = 1 } = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: opacidad,
    fog: true,
  });
}

// Pintura metalizada Ford Blue con clearcoat (requiere scene.environment).
export function crearMaterialPintura() {
  return new THREE.MeshPhysicalMaterial({
    color: PALETA.fordBlue.clone().multiplyScalar(1.35),
    metalness: 0.6,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.2,
    transparent: true,
    opacity: 1,
  });
}

export function crearMaterialVidrio() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#02060f'),
    metalness: 0.2,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 1,
  });
}

export function crearMaterialOscuro(color = '#07090d', rugosidad = 0.75, metal = 0.1) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: metal,
    roughness: rugosidad,
    envMapIntensity: 0.8,
    transparent: true,
    opacity: 1,
  });
}

export function crearMaterialMetal() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#4a525e'),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1.0,
    transparent: true,
    opacity: 1,
  });
}

export function crearMaterialEmisivo(color = PALETA.blanco, intensidad = 2.5) {
  return new THREE.MeshBasicMaterial({
    color: color.clone().multiplyScalar(intensidad),
    transparent: true,
    opacity: 1,
    toneMapped: true,
  });
}

// Puntos aditivos redondos con tamaño atenuado por distancia.
export function crearMaterialPuntos({ vertexShader, color = PALETA.skyview, tamano = 6, uniforms = {} }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...UNIFORMS_GLOBALES,
      uColor: { value: color.clone() },
      uTamano: { value: tamano },
      uOpacidad: { value: 1 },
      ...uniforms,
    },
    vertexShader,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacidad;
      uniform float uNiebla;
      varying float vProf;
      varying float vBrillo;
      varying vec3 vTinte;
      ${NIEBLA_GLSL}
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float suave = smoothstep(0.5, 0.0, d);
        suave *= suave;
        float a = uOpacidad * vBrillo * factorNiebla(vProf);
        gl_FragColor = vec4(mix(uColor, vTinte, 0.5) * suave * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Piso: grilla procedural con desvanecido radial y bandas de «días alternados».
export function crearMaterialPiso() {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...UNIFORMS_GLOBALES,
      uColorFondo: { value: PALETA.twilight.clone() },
      uColorLinea: { value: PALETA.skyview.clone() },
      uAlternar: { value: 0 },
      uCentro: { value: new THREE.Vector2(0, 0) },
      uOpacidadGrilla: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vMundo;
      varying float vProf;
      void main() {
        vec4 mundo = modelMatrix * vec4(position, 1.0);
        vMundo = mundo.xyz;
        vec4 mv = viewMatrix * mundo;
        vProf = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorFondo;
      uniform vec3 uColorLinea;
      uniform float uAlternar;
      uniform vec2 uCentro;
      uniform float uOpacidadGrilla;
      uniform float uNiebla;
      uniform float uTiempo;
      varying vec3 vMundo;
      varying float vProf;
      ${NIEBLA_GLSL}
      float grilla(vec2 p, float paso, float grosor) {
        vec2 g = abs(fract(p / paso - 0.5) - 0.5) / fwidth(p / paso);
        return 1.0 - min(min(g.x, g.y) / grosor, 1.0);
      }
      void main() {
        vec2 p = vMundo.xz;
        float fino = grilla(p, 1.0, 1.0) * 0.18;
        float grueso = grilla(p, 6.0, 1.2) * 0.45;
        float r = length(p - uCentro);
        float halo = exp(-r * r * 0.004);
        vec3 col = uColorFondo * 0.55;
        // días alternados: bandas a lo largo de X
        float dia = mod(floor((vMundo.x + 300.0) / 6.0), 2.0);
        vec3 tonoB = uColorFondo * 0.55 + vec3(0.004, 0.018, 0.05);
        col = mix(col, mix(col, tonoB, dia), uAlternar);
        float bordeDia = grilla(vec2(vMundo.x, 0.0), 6.0, 1.5) * uAlternar;
        col += uColorLinea * (fino + grueso + bordeDia * 0.35) * halo * uOpacidadGrilla * 0.6;
        col += uColorLinea * 0.04 * exp(-r * r * 0.02);
        float n = factorNiebla(vProf);
        gl_FragColor = vec4(mix(uColorFondo, col, n), 1.0);
      }
    `,
    depthWrite: true,
  });
}

// Ajusta la opacidad de un material sin importar su tipo.
export function fijarOpacidad(material, valor) {
  if (material.uniforms && material.uniforms.uOpacidad) material.uniforms.uOpacidad.value = valor;
  else material.opacity = valor;
}
