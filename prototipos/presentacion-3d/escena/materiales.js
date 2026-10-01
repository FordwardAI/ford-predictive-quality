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
        // max(): con MSAA los varyings se extrapolan y |dot| puede pasar de 1 → pow(negativo) = NaN,
        // que el bloom esparce por toda la pantalla
        float f = pow(max(1.0 - abs(dot(normalize(vNormal), normalize(vVista))), 0.0), uPotencia);
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
    transparent: opacidad < 1,
    opacity: opacidad,
    fog: true,
  });
}

// Opacidad base guardada en userData: los grupos se atenúan multiplicando por ella.
function conBase(mat, base = 1) {
  mat.userData.opacidadBase = base;
  return mat;
}

// Pintura metalizada Ford Blue con clearcoat (requiere scene.environment). El azul Ford es muy
// oscuro: con metalness alto refleja sólo el entorno y queda negro, así que se usa un metalizado
// moderado sobre un azul algo más claro y el clearcoat aporta los reflejos nítidos.
// Opaca por defecto: `fijarOpacidadMaterial` la vuelve transparente sólo durante los fundidos.
export function crearMaterialPintura() {
  return conBase(new THREE.MeshPhysicalMaterial({
    color: PALETA.fordBlue.clone().lerp(PALETA.skyview, 0.12).multiplyScalar(1.15),
    metalness: 0.5,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.5,
    transparent: false,
    opacity: 1,
  }));
}

// Vidrio: siempre transparente y sin escribir profundidad, así no tapa el interior ni produce
// cortes al ordenar; se dibuja después de lo opaco (renderOrder 1).
export function crearMaterialVidrio({ opacidad = 0.82, color = '#02060f' } = {}) {
  const mat = conBase(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0.2,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.6,
    transparent: true,
    depthWrite: false,
    opacity: opacidad,
  }), opacidad);
  mat.userData.siempreTransparente = true;
  return mat;
}

export function crearMaterialOscuro(color = '#07090d', rugosidad = 0.75, metal = 0.1) {
  return conBase(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: metal,
    roughness: rugosidad,
    envMapIntensity: 0.8,
  }));
}

export function crearMaterialMetal() {
  return conBase(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#4a525e'),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1.0,
  }));
}

export function crearMaterialEmisivo(color = PALETA.blanco, intensidad = 2.5) {
  return conBase(new THREE.MeshBasicMaterial({
    color: color.clone().multiplyScalar(intensidad),
    toneMapped: true,
  }));
}

// Fija la opacidad de un material estándar (no shader) y conmuta `transparent` sólo cuando hace
// falta: un material opaco se ordena y escribe profundidad bien; uno transparente con opacidad 1
// produce artefactos de orden entre piezas del mismo modelo.
export function fijarOpacidadMaterial(mat, valor, { siempreTransparente = false } = {}) {
  mat.opacity = valor;
  const transparente = siempreTransparente || valor < 0.997;
  if (mat.transparent !== transparente) {
    mat.transparent = transparente;
    mat.needsUpdate = true;
  }
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

// Ajusta la opacidad de un material sin importar su tipo. Los materiales estándar que nacieron
// opacos (base 1) se vuelven transparentes sólo mientras se funden.
export function fijarOpacidad(material, valor, base = 1) {
  if (material.uniforms && material.uniforms.uOpacidad) material.uniforms.uOpacidad.value = valor;
  else if (base >= 1 && !material.userData.siempreTransparente) fijarOpacidadMaterial(material, valor);
  else material.opacity = valor;
}

// Pass final propio: FXAA (sólo cuando no hay MSAA) + viñeta suave.
// Va después del OutputPass, así trabaja sobre color ya convertido a sRGB, que es lo que FXAA espera.
export const SHADER_FINAL = {
  name: 'PassFinal',
  uniforms: {
    tDiffuse: { value: null },
    uResolucion: { value: new THREE.Vector2(1, 1) },
    uFxaa: { value: 0 },
    uVineta: { value: 0.32 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolucion;
    uniform float uFxaa;
    uniform float uVineta;
    varying vec2 vUv;
    float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    // FXAA «simple» (Lottes): detecta bordes por luminancia y promedia a lo largo del borde.
    vec3 fxaa(vec2 uv) {
      vec2 px = 1.0 / uResolucion;
      vec3 nw = texture2D(tDiffuse, uv + vec2(-1.0, -1.0) * px).rgb;
      vec3 ne = texture2D(tDiffuse, uv + vec2(1.0, -1.0) * px).rgb;
      vec3 sw = texture2D(tDiffuse, uv + vec2(-1.0, 1.0) * px).rgb;
      vec3 se = texture2D(tDiffuse, uv + vec2(1.0, 1.0) * px).rgb;
      vec3 m = texture2D(tDiffuse, uv).rgb;
      float lNW = luma(nw), lNE = luma(ne), lSW = luma(sw), lSE = luma(se), lM = luma(m);
      float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
      float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
      float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
      float inv = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
      dir = clamp(dir * inv, vec2(-8.0), vec2(8.0)) * px;
      vec3 a = 0.5 * (texture2D(tDiffuse, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tDiffuse, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
      vec3 b = a * 0.5 + 0.25 * (texture2D(tDiffuse, uv - dir * 0.5).rgb + texture2D(tDiffuse, uv + dir * 0.5).rgb);
      float lB = luma(b);
      return (lB < lMin || lB > lMax) ? a : b;
    }
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec3 c = uFxaa > 0.5 ? fxaa(vUv) : base.rgb;
      vec2 q = vUv - 0.5;
      float v = 1.0 - uVineta * smoothstep(0.25, 0.85, dot(q, q) * 2.2);
      c *= v;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};
