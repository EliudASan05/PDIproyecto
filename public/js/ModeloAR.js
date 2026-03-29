// ================================================================
// MODELOAR.JS — MindAR Image Tracking + Three.js
// Dos modelos separados: PoseT2.glb (idle) y Baile.glb (baile)
// ================================================================

import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Estado global ─────────────────────────────────────────────

let mindAR = null;
let scene, camera, renderer;

// Modelo idle (pose base)
let idleModel = null;
let idleMixer = null;

// Modelo de baile
let danceModel  = null;
let danceMixer  = null;
let danceAction = null;

let currentAnchorIndex = -1;
let anchors = [];

let particleSystem = null;
let confettiData   = [];

let clock = null;

let isTracking    = false;
let isAnimating   = false;
let effectsActive = false;
let arRunning     = false;

// ── Textura + info por país ────────────────────────────────────

const targetModels = [
  {
    name: 'México',
    texture: 'Mexico2.png',
    flag: '🇲🇽',
    info: {
      capital: 'Ciudad de México',
      idioma: 'Español',
      continente: 'América del Norte',
      curiosidad: 'México es el origen del chocolate, el aguacate y el chile. Tiene 35 sitios declarados Patrimonio de la Humanidad por la UNESCO.',
    },
  },
  {
    name: 'Corea del Sur',
    texture: 'Corea2.png',
    flag: '🇰🇷',
    info: {
      capital: 'Seúl',
      idioma: 'Coreano',
      continente: 'Asia',
      curiosidad: 'Corea del Sur tiene una de las velocidades de internet más rápidas del mundo y es cuna del fenómeno cultural K-Pop.',
    },
  },
  {
    name: 'Polonia',
    texture: 'Polonia2.png',
    flag: '🇵🇱',
    info: {
      capital: 'Varsovia',
      idioma: 'Polaco',
      continente: 'Europa',
      curiosidad: 'Polonia es el mayor productor de manzanas de Europa y hogar de Marie Curie, única persona en ganar el Nobel en dos ciencias distintas.',
    },
  },
  {
    name: 'Colombia',
    texture: 'Colombia2.png',
    flag: '🇨🇴',
    info: {
      capital: 'Bogotá',
      idioma: 'Español',
      continente: 'América del Sur',
      curiosidad: 'Colombia es el segundo país con mayor biodiversidad del mundo y el mayor productor de esmeraldas a nivel global.',
    },
  },
  {
    name: 'Ucrania',
    texture: 'Ucrania2.png',
    flag: '🇺🇦',
    info: {
      capital: 'Kiev',
      idioma: 'Ucraniano',
      continente: 'Europa',
      curiosidad: 'Ucrania posee el suelo negro más fértil del mundo (chernozem) y es conocida como el "granero de Europa".',
    },
  },
  {
    name: 'Cabo Verde',
    texture: 'Cabo Verde2.png',
    flag: '🇨🇻',
    info: {
      capital: 'Praia',
      idioma: 'Portugués / Criollo caboverdiano',
      continente: 'África (archipiélago)',
      curiosidad: 'Cabo Verde es un archipiélago de 10 islas volcánicas en el Atlántico. Su música Morna, declarada Patrimonio de la UNESCO, expresa la nostalgia llamada "saudade".',
    },
  },
  {
    name: 'Túnez',
    texture: 'Tunez2.png',
    flag: '🇹🇳',
    info: {
      capital: 'Túnez',
      idioma: 'Árabe / Francés',
      continente: 'África del Norte',
      curiosidad: 'Túnez fue el escenario de escenas de la saga Star Wars (Tatooine). También alberga el sitio arqueológico de Cartago, una de las grandes civilizaciones antiguas.',
    },
  },
  {
    name: 'Uzbekistán',
    texture: 'Uzbekistan2.png',
    flag: '🇺🇿',
    info: {
      capital: 'Taskent',
      idioma: 'Uzbeko',
      continente: 'Asia Central',
      curiosidad: 'Uzbekistán es cuna de la Ruta de la Seda y hogar de Samarcanda, una de las ciudades más antiguas del mundo con más de 2,700 años de historia.',
    },
  },
  {
    name: 'Sudáfrica',
    texture: 'Sudafrica2.png',
    flag: '🇿🇦',
    info: {
      capital: 'Pretoria / Ciudad del Cabo / Bloemfontein',
      idioma: '11 idiomas oficiales',
      continente: 'África',
      curiosidad: 'Sudáfrica es el único país del mundo con tres capitales. Fue sede del primer trasplante de corazón exitoso en 1967.',
    },
  },
  {
    name: 'Arabia Saudita',
    texture: 'Arabia Saudita2.png',
    flag: '🇸🇦',
    info: {
      capital: 'Riad',
      idioma: 'Árabe',
      continente: 'Asia (Oriente Medio)',
      curiosidad: 'Arabia Saudita alberga las dos ciudades más sagradas del Islam: La Meca y Medina. Posee las segundas reservas de petróleo más grandes del planeta.',
    },
  },
  {
    name: 'Suiza',
    texture: 'Suiza2.png',
    flag: '🇨🇭',
    info: {
      capital: 'Berna',
      idioma: 'Alemán, Francés, Italiano, Romanche',
      continente: 'Europa',
      curiosidad: 'Suiza tiene 4 idiomas oficiales y es hogar del CERN, el mayor laboratorio de física de partículas del mundo. Lleva más de 200 años de neutralidad política.',
    },
  },
  {
    name: 'Japón',
    texture: 'Japon2.png',
    flag: '🇯🇵',
    info: {
      capital: 'Tokio',
      idioma: 'Japonés',
      continente: 'Asia',
      curiosidad: 'Japón tiene más de 6,800 islas y es el mayor consumidor de pescado del mundo. El Monte Fuji, su símbolo nacional, es un volcán activo.',
    },
  },
];

const textureCache = {};

// ── Archivos de modelos ────────────────────────────────────────
const IDLE_FILE  = 'PoseT2.glb';
const DANCE_FILE = 'Baile.glb';

// ── Transform base compartido ──────────────────────────────────
const MODEL_SCALE    = new THREE.Vector3(5.5, 5.5, 5.5);
const MODEL_POSITION = new THREE.Vector3(0, 0, 0.2);

// ================================================================
// INICIO
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnLaunchAR').addEventListener('click', launchAR);
  document.getElementById('btnExitAR').addEventListener('click', stopAR);
  document.getElementById('btnAnimate').addEventListener('click', toggleAnimation);
  document.getElementById('btnEffects').addEventListener('click', toggleEffects);
  document.getElementById('btnScaleUp').addEventListener('click', () => scaleModels(1.2));
  document.getElementById('btnScaleDown').addEventListener('click', () => scaleModels(0.83));
  document.getElementById('btnInfo').addEventListener('click', () => toggleInfo(true));
});

// ================================================================
// LANZAR AR
// ================================================================

async function launchAR() {
  if (arRunning) return;

  const btn = document.getElementById('btnLaunchAR');
  btn.classList.add('loading');
  btn.querySelector('span').textContent = 'Iniciando...';

  try {
    document.getElementById('scannerScreen').style.display = 'none';
    document.getElementById('arScreen').classList.remove('hidden');

    await initMindAR();
    arRunning = true;
  } catch (err) {
    console.error(err);
    alert('Error iniciando AR');
    document.getElementById('scannerScreen').style.display = '';
    document.getElementById('arScreen').classList.add('hidden');
  }

  btn.classList.remove('loading');
  btn.querySelector('span').textContent = 'INICIAR AR';
}

// ================================================================
// INIT MINDAR
// ================================================================

async function initMindAR() {
  const container = document.getElementById('mindar-container');

  mindAR = new MindARThree({
    container,
    imageTargetSrc: 'media/targets.mind',
    maxTrack: 1,
  });

  renderer = mindAR.renderer;
  scene    = mindAR.scene;
  camera   = mindAR.camera;
  clock    = new THREE.Clock();

  // ── Luces ────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 4.0));
const dirLight = new THREE.DirectionalLight(0xffffff, 6.5);
dirLight.position.set(2, 4, 3);
scene.add(dirLight);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 7.5);
dirLight2.position.set(-2, -2, 3);
scene.add(dirLight2);

  // ── Cargar ambos modelos en paralelo ─────────────────────────
  const [idleGltf, danceGltf] = await Promise.all([
    loadGLTF(IDLE_FILE),
    loadGLTF(DANCE_FILE),
  ]);

  // ── Modelo idle ──────────────────────────────────────────────
  idleModel = idleGltf.scene;
  idleModel.scale.copy(MODEL_SCALE);
  idleModel.position.copy(MODEL_POSITION);
  idleModel.visible = true;

  idleMixer = new THREE.AnimationMixer(idleModel);
  // Descomenta si PoseT2.glb tiene una animación idle propia:
  // if (idleGltf.animations.length > 0) {
  //   idleMixer.clipAction(idleGltf.animations[0]).setLoop(THREE.LoopRepeat, Infinity).play();
  // }

  // ── Modelo de baile ──────────────────────────────────────────
  danceModel = danceGltf.scene;
  danceModel.scale.copy(MODEL_SCALE);
  danceModel.position.copy(MODEL_POSITION);
  danceModel.visible = false;  // oculto al inicio

  danceMixer = new THREE.AnimationMixer(danceModel);
  if (danceGltf.animations.length > 0) {
    danceAction = danceMixer.clipAction(danceGltf.animations[0]);
    danceAction.setLoop(THREE.LoopRepeat, Infinity);
  }

  // ── Anchors ──────────────────────────────────────────────────
  anchors = [];

  for (let i = 0; i < targetModels.length; i++) {
    const a = mindAR.addAnchor(i);

    a.onTargetFound = () => {
      currentAnchorIndex = i;
      isTracking = true;

      // Adjuntar ambos modelos al anchor activo
      a.group.add(idleModel);
      a.group.add(danceModel);

      // Siempre arrancar mostrando el idle
      showIdle();

      // Aplicar textura del país a ambos modelos
      applyTexture(targetModels[i].texture);

      // Actualizar HUD y drawer
      document.getElementById('hudModelName').textContent = targetModels[i].name;
      populateDrawer(i);

      showHint(false);
      showDetectToast();
    };

    a.onTargetLost = () => {
      if (currentAnchorIndex !== i) return;

      isTracking = false;
      currentAnchorIndex = -1;

      // Detener baile
      if (danceAction) danceAction.stop();
      isAnimating = false;
      document.getElementById('btnAnimate').classList.remove('active');

      // Desanclar modelos
      a.group.remove(idleModel);
      a.group.remove(danceModel);

      showHint(true);
    };

    anchors.push(a);
  }

  await mindAR.start();
  renderer.setAnimationLoop(renderLoop);
}

// ================================================================
// CARGAR GLTF
// ================================================================

function loadGLTF(file) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(`models/${file}`, resolve, undefined, reject);
  });
}

// ================================================================
// ALTERNAR ENTRE IDLE Y BAILE
// ================================================================

function showIdle() {
  if (danceAction) danceAction.stop();
  if (danceModel)  danceModel.visible = false;
  if (idleModel)   idleModel.visible  = true;
  isAnimating = false;
  document.getElementById('btnAnimate').classList.remove('active');
}

function showDance() {
  if (idleModel)   idleModel.visible  = false;
  if (danceModel)  danceModel.visible = true;
  if (danceAction) danceAction.reset().play();
  isAnimating = true;
  document.getElementById('btnAnimate').classList.add('active');
}

// ================================================================
// APLICAR TEXTURA AL MODELO (ambos modelos reciben la misma)
// ================================================================

function applyTexture(textureFile) {
  if (textureCache[textureFile]) {
    _assignTexture(textureCache[textureFile]);
    return;
  }

  const loader = new THREE.TextureLoader();
  loader.load(
    `models/${textureFile}`,
    (tex) => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCache[textureFile] = tex;
      _assignTexture(tex);
    },
    undefined,
    (err) => console.warn('No se pudo cargar textura:', textureFile, err)
  );
}

function _assignTexture(tex) {
  // Aplicar a idle y dance para que coincidan al alternar
  [idleModel, danceModel].forEach((model) => {
    if (!model) return;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.map = tex;
          mat.needsUpdate = true;
        });
      }
    });
  });
}

// ================================================================
// POBLAR INFO DRAWER
// ================================================================

function populateDrawer(index) {
  const { flag, name, info } = targetModels[index];

  document.getElementById('drawerTitle').textContent = `${flag} ${name}`;

  document.getElementById('drawerContent').innerHTML = `
    <div class="drawer-info-grid">
      <div class="drawer-info-row">
        <span class="drawer-info-label">🏛 Capital</span>
        <span class="drawer-info-value">${info.capital}</span>
      </div>
      <div class="drawer-info-row">
        <span class="drawer-info-label">🗣 Idioma</span>
        <span class="drawer-info-value">${info.idioma}</span>
      </div>
      <div class="drawer-info-row">
        <span class="drawer-info-label">🌍 Continente</span>
        <span class="drawer-info-value">${info.continente}</span>
      </div>
      <div class="drawer-info-curiosity">
        <span class="curiosity-label">💡 Curiosidad</span>
        <p class="curiosity-text">${info.curiosidad}</p>
      </div>
    </div>
  `;
}

// ================================================================
// RENDER LOOP
// ================================================================

function renderLoop() {
  if (!clock) return;

  const delta = clock.getDelta();

  if (isAnimating) {
    // Actualizar mixer del modelo de baile
    if (danceMixer) danceMixer.update(delta);
  } else {
    // Actualizar mixer del idle (por si tiene animación propia)
    if (idleMixer) idleMixer.update(delta);
    // Rotación suave mientras está en pose base
    if (idleModel && isTracking) {
      idleModel.rotation.y += 0.3 * delta;
    }
  }

  if (particleSystem && effectsActive) {
    updateConfetti(delta);
  }

  renderer.render(scene, camera);
}

// ================================================================
// UI
// ================================================================

function showHint(v) {
  document.getElementById('scanHint').classList.toggle('hidden', !v);
}

function showDetectToast() {
  const toast = document.getElementById('detectToast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ================================================================
// STOP AR
// ================================================================

async function stopAR() {
  if (!arRunning) return;

  renderer.setAnimationLoop(null);
  await mindAR.stop();

  document.getElementById('mindar-container').innerHTML = '';
  document.querySelectorAll(
    '.mindar-ui-overlay, .mindar-ui-loading, .mindar-ui-scanning'
  ).forEach((el) => el.remove());

  mindAR      = null;
  idleModel   = null;
  danceModel  = null;
  idleMixer   = null;
  danceMixer  = null;
  danceAction = null;

  removeParticleSystem();

  arRunning  = false;
  isTracking = false;
  isAnimating = false;
  currentAnchorIndex = -1;

  document.getElementById('arScreen').classList.add('hidden');
  document.getElementById('scannerScreen').style.display = '';
  showHint(true);
}

// ================================================================
// CONTROLES
// ================================================================

function toggleAnimation() {
  if (!isTracking) return;

  if (isAnimating) showIdle();
  else             showDance();
}

function toggleEffects() {
  effectsActive = !effectsActive;
  document.getElementById('btnEffects').classList.toggle('active', effectsActive);

  if (effectsActive) createParticleSystem();
  else removeParticleSystem();
}

// Escalar ambos modelos de forma sincronizada
function scaleModels(f) {
  if (idleModel)  idleModel.scale.multiplyScalar(f);
  if (danceModel) danceModel.scale.multiplyScalar(f);
}

function toggleInfo(open) {
  document.getElementById('infoDrawer').classList.toggle('hidden', !open);
}

// ================================================================
// CONFETTI
// ================================================================

const CONFETTI_COUNT  = 120;
const CONFETTI_COLORS = [
  0xff2d55, 0xff9500, 0xffcc00, 0x34c759,
  0x00d4ff, 0x5a9fff, 0xaf52de, 0xff6b6b,
  0xffd700, 0x00e676,
];

function createParticleSystem() {
  const activeAnchor = currentAnchorIndex >= 0 ? anchors[currentAnchorIndex] : null;
  if (particleSystem || !activeAnchor) return;

  confettiData   = [];
  particleSystem = new THREE.Group();

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const w   = 0.18 + Math.random() * 0.16;
    const h   = 0.09 + Math.random() * 0.09;
    const geo = new THREE.PlaneGeometry(w, h);
    const col = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const mat = new THREE.MeshBasicMaterial({
      color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.95,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 3.0,
      0.8 + Math.random() * 2.0,
      (Math.random() - 0.5) * 3.0
    );
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    confettiData.push({
      vx: (Math.random() - 0.5) * 0.008,
      vy: -(0.003 + Math.random() * 0.005),
      vz: (Math.random() - 0.5) * 0.008,
      rx: (Math.random() - 0.5) * 0.08,
      ry: (Math.random() - 0.5) * 0.06,
      rz: (Math.random() - 0.5) * 0.14,
      life: Math.random() * Math.PI * 2,
    });
    particleSystem.add(mesh);
  }

  activeAnchor.group.add(particleSystem);
}

function updateConfetti(delta) {
  if (!particleSystem || !effectsActive) return;
  particleSystem.children.forEach((mesh, i) => {
    const d = confettiData[i];
    d.life += delta;
    mesh.position.x += d.vx + Math.sin(d.life * 0.8 + i * 0.5) * 0.006;
    mesh.position.y += d.vy;
    mesh.position.z += d.vz + Math.cos(d.life * 0.7 + i * 0.5) * 0.004;
    mesh.rotation.x += d.rx * delta * 3;
    mesh.rotation.y += d.ry * delta * 3;
    mesh.rotation.z += d.rz * delta * 3;
    if (mesh.position.y < -1.6) {
      mesh.position.set(
        (Math.random() - 0.5) * 3.0,
        1.8 + Math.random() * 1.0,
        (Math.random() - 0.5) * 3.0
      );
    }
  });
}

function removeParticleSystem() {
  if (!particleSystem) return;
  const activeAnchor = currentAnchorIndex >= 0 ? anchors[currentAnchorIndex] : null;
  if (activeAnchor) activeAnchor.group.remove(particleSystem);
  particleSystem.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  particleSystem = null;
  confettiData   = [];
}

// ================================================================
// GLOBAL
// ================================================================

window.toggleInfo     = toggleInfo;
window.toggleTutorial = (show) =>
  document.getElementById('tutorialOverlay').classList.toggle('hidden', !show);
window.handleTutorialBg = (e) => {
  if (e.target === e.currentTarget) window.toggleTutorial(false);
};