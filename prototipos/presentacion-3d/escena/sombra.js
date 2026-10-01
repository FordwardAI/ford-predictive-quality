// Sombra de contacto (patrón «webgl_shadow_contact» de three.js): una cámara ortográfica mira
// desde el piso hacia arriba, dibuja la silueta del vehículo en un render target chico, se
// desenfoca en dos pasadas (horizontal y vertical) y el resultado se apoya como textura en un
// plano bajo el vehículo. El plano es hijo del vehículo: moverlo o girarlo no exige volver a
// renderizar; sólo `actualizar()` lo hace (al cargar, o si cambia la geometría).
import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const RESOLUCION = 256;

export function crearSombraContacto(renderer, vehiculo, { ancho = 7.4, largo = 3.6, altura = 1.4, oscuridad = 1.6, desenfoque = 2.2 } = {}) {
  const rt = new THREE.WebGLRenderTarget(RESOLUCION, RESOLUCION);
  const rtBlur = new THREE.WebGLRenderTarget(RESOLUCION, RESOLUCION);
  rt.texture.generateMipmaps = false;
  rtBlur.texture.generateMipmaps = false;

  // Escena propia en coordenadas locales del vehículo: proxies de las mallas pintadas.
  const escena = new THREE.Scene();
  const camara = new THREE.OrthographicCamera(-ancho / 2, ancho / 2, largo / 2, -largo / 2, 0, altura);
  camara.rotation.x = Math.PI / 2; // mira hacia arriba
  camara.updateMatrixWorld(true);

  // Lo más cercano al piso deja la sombra más oscura (z ortográfica lineal).
  const materialProfundidad = new THREE.ShaderMaterial({
    uniforms: { uOscuridad: { value: oscuridad } },
    vertexShader: /* glsl */ `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uOscuridad;
      void main(){ float a = (1.0 - gl_FragCoord.z) * uOscuridad; gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(a, 0.0, 1.0)); }`,
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  });

  const planoGeo = new THREE.PlaneGeometry(ancho, largo).rotateX(Math.PI / 2);
  const blurH = new THREE.ShaderMaterial({ ...HorizontalBlurShader, uniforms: THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms), depthTest: false });
  const blurV = new THREE.ShaderMaterial({ ...VerticalBlurShader, uniforms: THREE.UniformsUtils.clone(VerticalBlurShader.uniforms), depthTest: false });
  const planoBlur = new THREE.Mesh(planoGeo, blurH);
  planoBlur.position.y = altura * 0.5;
  planoBlur.updateMatrixWorld(true);

  const material = new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, depthWrite: false, opacity: 1 });
  const plano = new THREE.Mesh(planoGeo, material);
  plano.name = 'sombra-contacto';
  plano.position.y = 0.006;
  plano.scale.y = -1; // la cámara mira hacia arriba: la imagen queda espejada
  plano.renderOrder = -0.5;

  function reconstruirProxies() {
    escena.clear();
    vehiculo.grupo.updateMatrixWorld(true);
    const inversa = vehiculo.grupo.matrixWorld.clone().invert();
    for (const malla of vehiculo.mallasPintado) {
      const proxy = new THREE.Mesh(malla.geometry, materialProfundidad);
      proxy.matrixAutoUpdate = false;
      proxy.matrix.multiplyMatrices(inversa, malla.matrixWorld);
      proxy.matrixWorldAutoUpdate = false;
      proxy.matrixWorld.copy(proxy.matrix);
      escena.add(proxy);
    }
  }

  function desenfocar(cantidad) {
    planoBlur.material = blurH;
    blurH.uniforms.tDiffuse.value = rt.texture;
    blurH.uniforms.h.value = cantidad / RESOLUCION;
    renderer.setRenderTarget(rtBlur);
    renderer.render(planoBlur, camara);
    planoBlur.material = blurV;
    blurV.uniforms.tDiffuse.value = rtBlur.texture;
    blurV.uniforms.v.value = cantidad / RESOLUCION;
    renderer.setRenderTarget(rt);
    renderer.render(planoBlur, camara);
  }

  function actualizar() {
    reconstruirProxies();
    const rtPrevio = renderer.getRenderTarget();
    const colorPrevio = renderer.getClearColor(new THREE.Color());
    const alfaPrevio = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(escena, camara);
    desenfocar(desenfoque);
    desenfocar(desenfoque * 0.4);
    renderer.setRenderTarget(rtPrevio);
    renderer.setClearColor(colorPrevio, alfaPrevio);
  }

  vehiculo.grupo.add(plano);
  actualizar();

  return {
    malla: plano,
    actualizar,
    fijarOpacidad(a) {
      material.opacity = a;
      plano.visible = a > 0.003;
    },
    destruir() {
      rt.dispose(); rtBlur.dispose();
      planoGeo.dispose(); material.dispose(); materialProfundidad.dispose(); blurH.dispose(); blurV.dispose();
    },
  };
}
