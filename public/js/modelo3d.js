// ===============================================
// MODELO3D.JS - Escáner con Realidad Aumentada
// Usa WebXR Hit Test API con fallback AR manual
// ===============================================

// Variables globales Three.js
let scene, camera, renderer, currentModel;
let animationId = null;
let particleSystem = null;
let isAnimating = false;
let effectsActive = false;

// Variables AR
let stream = null;
let currentFacingMode = 'environment';
let arMode = false;          // true = AR activo
let xrSession = null;        // WebXR session
let xrHitTestSource = null;
let xrReferenceSpace = null;
let reticle = null;          // Indicador de superficie
let modelPlaced = false;     // ¿Ya se colocó el modelo?
let arVideo = null;          // <video> background para AR manual

// Elementos DOM
const scanButton    = document.getElementById('scanButton');
const cancelButton  = document.getElementById('cancelButton');
const captureButton = document.getElementById('captureButton');
const switchButton  = document.getElementById('switchButton');
const scanAgainBtn  = document.getElementById('scanAgainBtn');
const scannerSection = document.getElementById('scannerSection');
const cameraSection  = document.getElementById('cameraSection');
const modelSection   = document.getElementById('modelSection');
const topMenu        = document.getElementById('topMenu');
const cameraStream   = document.getElementById('cameraStream');
const loadingOverlay = document.getElementById('loadingOverlay');
const infoPanel      = document.getElementById('infoPanel');
const infoTitle      = document.getElementById('infoTitle');
const infoContent    = document.getElementById('infoContent');
const rotateLeftBtn  = document.getElementById('rotateLeft');
const rotateRightBtn = document.getElementById('rotateRight');
const animateBtn     = document.getElementById('animateBtn');
const infoBtn        = document.getElementById('infoBtn');
const effectsBtn     = document.getElementById('effectsBtn');

// ── Base de datos de objetos ──────────────────────────────────
const objectDatabase = {
    bandera_mexico: {
        name: 'Bandera de México',
        model: 'eagle',
        color: 0x00a844,
        info: {
            title: 'Águila Real — Símbolo de México',
            description: `
                <p><strong>Nombre científico:</strong> Aquila chrysaetos</p>
                <p><strong>Significado:</strong> El águila representa la fuerza, el coraje y la independencia del pueblo mexicano.</p>
                <p><strong>Historia:</strong> Según la leyenda azteca, los mexicas fundaron Tenochtitlan donde vieron un águila devorando una serpiente sobre un nopal.</p>
                <p><strong>Curiosidad:</strong> Puede alcanzar 240 km/h en picada y tiene envergadura de hasta 2.3 m.</p>`
        }
    },
    futbol: {
        name: 'Balón de Fútbol',
        model: 'ball',
        color: 0xffffff,
        info: {
            title: 'Balón de Fútbol',
            description: `
                <p><strong>Deporte:</strong> Fútbol / Soccer</p>
                <p><strong>Tamaño oficial:</strong> 68–70 cm de circunferencia</p>
                <p><strong>Peso:</strong> 410–450 gramos</p>
                <p><strong>Historia:</strong> El diseño moderno con pentágonos y hexágonos fue popularizado en el Mundial de 1970.</p>`
        }
    },
    trofeo: {
        name: 'Trofeo FIFA',
        model: 'trophy',
        color: 0xffd700,
        info: {
            title: 'Copa del Mundo FIFA',
            description: `
                <p><strong>Material:</strong> Oro macizo sobre bronce</p>
                <p><strong>Peso:</strong> 6.175 kg</p>
                <p><strong>Altura:</strong> 36.8 cm</p>
                <p><strong>Diseñador:</strong> Silvio Gazzaniga (1974)</p>
                <p><strong>Curiosidad:</strong> Solo el capitán y el entrenador del equipo campeón pueden tocarlo.</p>`
        }
    },
    default: {
        name: 'Objeto Detectado',
        model: 'cube',
        color: 0x00d4ff,
        info: {
            title: 'Objeto Escaneado',
            description: `
                <p><strong>Análisis:</strong> Objeto genérico detectado.</p>
                <p><strong>Estado:</strong> Modelo 3D generado exitosamente.</p>
                <p><strong>Tip:</strong> Escanea banderas, logos deportivos o camisetas para modelos más detallados.</p>`
        }
    }
};

// ── Helpers ───────────────────────────────────────────────────
function setMenuActive(section) {
    topMenu.setAttribute('data-active', section);
}

function showSection(show, ...hide) {
    show.classList.remove('hidden');
    hide.forEach(s => s.classList.add('hidden'));
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setMenuActive('scanner');
    injectARButton();
});

function setupEventListeners() {
    scanButton.addEventListener('click', openCamera);
    cancelButton.addEventListener('click', cancelScanning);
    captureButton.addEventListener('click', captureAndProcess);
    switchButton.addEventListener('click', switchCamera);
    scanAgainBtn.addEventListener('click', resetToScanner);

    rotateLeftBtn.addEventListener('click',  () => rotateModel(-1));
    rotateRightBtn.addEventListener('click', () => rotateModel(1));
    animateBtn.addEventListener('click',  toggleAnimation);
    infoBtn.addEventListener('click',     toggleInfo);
    effectsBtn.addEventListener('click',  toggleEffects);
}

// ══════════════════════════════════════════════════════════════
// CÁMARA
// ══════════════════════════════════════════════════════════════
async function openCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        cameraStream.srcObject = stream;
        showSection(cameraSection, scannerSection);
        setMenuActive('scanner');
    } catch (err) {
        console.error(err);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
}

function cancelScanning() {
    closeCamera();
    showSection(scannerSection, cameraSection);
    setMenuActive('scanner');
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await openCamera();
}

function closeCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; cameraStream.srcObject = null; }
}

// ══════════════════════════════════════════════════════════════
// CAPTURA Y ANÁLISIS
// ══════════════════════════════════════════════════════════════
async function captureAndProcess() {
    const canvas = document.createElement('canvas');
    canvas.width  = cameraStream.videoWidth;
    canvas.height = cameraStream.videoHeight;
    canvas.getContext('2d').drawImage(cameraStream, 0, 0);

    closeCamera();
    showSection(modelSection, cameraSection);
    loadingOverlay.classList.remove('hidden');
    setMenuActive('modelo');

    const detected = await analyzeImage(canvas);

    setTimeout(() => {
        initThreeJS();
        create3DModel(detected);
        updateInfoPanel(detected);
        loadingOverlay.classList.add('hidden');
        // Ofrecer AR automáticamente si está disponible
        checkARAvailability();
    }, 1800);
}

async function analyzeImage(canvas) {
    return new Promise(resolve => {
        setTimeout(() => {
            const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0, g = 0, b = 0;
            const n = data.length / 4;
            for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; }
            r = r/n; g = g/n; b = b/n;

            if (g > r && g > b && g > 90)                              resolve('bandera_mexico');
            else if (r > g && r > b && r > 110 && g < 100)            resolve('bandera_mexico');
            else if (Math.abs(r-g) < 30 && Math.abs(g-b) < 30 && r > 150) resolve('futbol');
            else if (r < 80 && g < 80 && b < 80)                      resolve('futbol');
            else if (r > 180 && g > 140 && b < 80)                    resolve('trofeo');
            else                                                        resolve('default');
        }, 800);
    });
}

// ══════════════════════════════════════════════════════════════
// THREE.JS — INIT
// ══════════════════════════════════════════════════════════════
function initThreeJS() {
    const canvas    = document.getElementById('threeCanvas');
    const container = document.getElementById('modelViewer');

    if (renderer) {
        renderer.dispose();
        if (currentModel) scene.remove(currentModel);
        if (particleSystem) scene.remove(particleSystem);
        if (reticle) scene.remove(reticle);
    }

    scene = new THREE.Scene();
    // Fondo transparente para modo AR; azul oscuro para modo normal
    scene.background = arMode ? null : new THREE.Color(0x0a0a0f);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.01, 1000);
    camera.position.set(0, 0, arMode ? 0 : 5);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;  // Habilitar WebXR

    // Iluminación
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pl = new THREE.PointLight(0xffffff, 1.2); pl.position.set(5, 5, 5); scene.add(pl);
    const pl2 = new THREE.PointLight(0x00d4ff, 0.5); pl2.position.set(-5, -5, 5); scene.add(pl2);
    const dirl = new THREE.DirectionalLight(0xffffff, 0.8); dirl.position.set(0, 10, 5); scene.add(dirl);

    window.addEventListener('resize', onWindowResize);
}

// ══════════════════════════════════════════════════════════════
// MODELOS 3D
// ══════════════════════════════════════════════════════════════
function create3DModel(objectType) {
    const obj = objectDatabase[objectType] || objectDatabase.default;

    switch (obj.model) {
        case 'eagle':  currentModel = createEagle(obj.color);  break;
        case 'ball':   currentModel = createBall(obj.color);   break;
        case 'trophy': currentModel = createTrophy(obj.color); break;
        default:       currentModel = createCube(obj.color);
    }

    if (arMode) {
        currentModel.visible = false; // se mostrará al hacer tap
        currentModel.scale.set(0.3, 0.3, 0.3);
    } else {
        currentModel.position.set(0, 0, 0);
    }

    scene.add(currentModel);
    animate();
}

function createEagle(color) {
    const g = new THREE.Group();
    const add = (geo, mat, pos, rot, scale) => {
        const m = new THREE.Mesh(geo, mat);
        if (pos)   m.position.set(...pos);
        if (rot)   m.rotation.set(...rot);
        if (scale) m.scale.set(...scale);
        g.add(m); return m;
    };
    const bodyMat  = new THREE.MeshPhongMaterial({ color: 0x4a3520, shininess: 60 });
    const headMat  = new THREE.MeshPhongMaterial({ color: 0xf5f5dc });
    const beakMat  = new THREE.MeshPhongMaterial({ color: 0xffa500 });
    const wingMat  = new THREE.MeshPhongMaterial({ color, shininess: 80 });
    const tailMat  = new THREE.MeshPhongMaterial({ color: 0x4a3520 });
    const eyeMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });

    add(new THREE.SphereGeometry(0.8, 32, 32), bodyMat, [0,0,0], null, [1,1.2,0.8]);
    add(new THREE.SphereGeometry(0.5, 32, 32), headMat, [0,1.2,0]);
    add(new THREE.SphereGeometry(0.05,8,8), eyeMat, [-0.18,1.3,0.42]);
    add(new THREE.SphereGeometry(0.05,8,8), eyeMat, [ 0.18,1.3,0.42]);
    add(new THREE.ConeGeometry(0.18,0.4,8), beakMat, [0,1.1,0.55], [Math.PI/2,0,0]);
    add(new THREE.BoxGeometry(2.2,0.12,1),  wingMat, [-1.3,0,0], [0,0,-Math.PI/7]);
    add(new THREE.BoxGeometry(2.2,0.12,1),  wingMat, [ 1.3,0,0], [0,0, Math.PI/7]);
    add(new THREE.ConeGeometry(0.5,1,8),    tailMat, [0,-0.6,-0.8], [Math.PI/2,0,0]);
    return g;
}

function createBall(color) {
    const g = new THREE.SphereGeometry(1.5, 32, 32);
    const m = new THREE.MeshPhongMaterial({ color, shininess: 120, specular: 0x444444 });
    const ball = new THREE.Mesh(g, m);
    // Parches negros
    const pMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let i = 0; i < 12; i++) {
        const p = new THREE.Mesh(new THREE.CircleGeometry(0.28, 5), pMat);
        const phi = Math.acos(-1 + (2*i)/12);
        const theta = Math.sqrt(12*Math.PI)*phi;
        p.position.setFromSphericalCoords(1.52, phi, theta);
        p.lookAt(0,0,0); ball.add(p);
    }
    return ball;
}

function createTrophy(color) {
    const g = new THREE.Group();
    const mat  = new THREE.MeshPhongMaterial({ color, shininess: 200, specular: 0xffd700, emissive: 0x332200 });
    const dark = new THREE.MeshPhongMaterial({ color: 0x555500, shininess: 80 });

    // Base
    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.9,1.1,0.2,32), mat), {position: new THREE.Vector3(0,-2,0)}));
    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,0.3,32), mat), {position: new THREE.Vector3(0,-1.75,0)}));
    // Tallo
    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,1.4,16), mat), {position: new THREE.Vector3(0,-0.8,0)}));
    // Copa
    g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.9,32,32), mat), {position: new THREE.Vector3(0,0.5,0), scale: new THREE.Vector3(1,1.1,1)}));
    // Asas (toroides)
    const torusMat = mat;
    const lt = new THREE.Mesh(new THREE.TorusGeometry(0.45,0.07,8,16), torusMat);
    lt.position.set(-1.1,0.5,0); lt.rotation.set(0,0,Math.PI/3); g.add(lt);
    const rt = new THREE.Mesh(new THREE.TorusGeometry(0.45,0.07,8,16), torusMat);
    rt.position.set( 1.1,0.5,0); rt.rotation.set(0,0,-Math.PI/3); g.add(rt);
    // Estrella en la cima
    const starMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffff88, shininess: 200 });
    g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8), starMat), {position: new THREE.Vector3(0,1.55,0)}));

    g.scale.set(0.8,0.8,0.8);
    return g;
}

function createCube(color) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(2,2,2),
        new THREE.MeshPhongMaterial({ color, emissive: 0x111111, wireframe: false })
    );
    // Aristas brillantes
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2,2,2)),
        new THREE.LineBasicMaterial({ color: 0x00d4ff })
    );
    m.add(edges);
    return m;
}

// ══════════════════════════════════════════════════════════════
// BUCLE DE ANIMACIÓN (modo normal)
// ══════════════════════════════════════════════════════════════
function animate() {
    if (arMode) return; // AR usa su propio loop
    animationId = requestAnimationFrame(animate);
    if (currentModel && !isAnimating) currentModel.rotation.y += 0.005;
    if (particleSystem && effectsActive) particleSystem.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function onWindowResize() {
    const c = document.getElementById('modelViewer');
    camera.aspect = c.clientWidth / c.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(c.clientWidth, c.clientHeight);
}

// ══════════════════════════════════════════════════════════════
// ─────────────  REALIDAD AUMENTADA  ──────────────────────────
// ══════════════════════════════════════════════════════════════

/**
 * Inyecta botón AR en el panel de acciones del modelo.
 * Se inyecta aquí (JS) para que siempre esté disponible.
 */
function injectARButton() {
    const actions = document.querySelector('.model-actions');
    if (!actions) return;
    const btn = document.createElement('button');
    btn.id = 'arBtn';
    btn.className = 'filter-btn';
    btn.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i> VER EN AR';
    btn.style.cssText = 'background: linear-gradient(135deg,#00d4ff,#5a9fff); color:#fff; font-weight:700;';
    btn.addEventListener('click', launchAR);
    actions.insertBefore(btn, actions.firstChild);
}

/**
 * Detecta la mejor forma de AR disponible:
 * 1. WebXR (Chrome Android con ARCore)
 * 2. AR Manual (video cámara + overlay Three.js) — fallback universal
 */
async function checkARAvailability() {
    const btn = document.getElementById('arBtn');
    if (!btn) return;
    // Si WebXR inmersive-ar está disponible, marcarlo
    if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
        if (supported) {
            btn.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i> VER EN AR ✨';
        }
    }
}

async function launchAR() {
    if (!currentModel) { alert('Primero escanea un objeto.'); return; }

    // Intentar WebXR primero
    if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
        if (supported) {
            await startWebXR();
            return;
        }
    }
    // Fallback: AR manual
    startManualAR();
}

// ─── WebXR Hit Test ───────────────────────────────────────────
async function startWebXR() {
    try {
        xrSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures:  ['dom-overlay'],
            domOverlay: { root: document.getElementById('ar-overlay') }
        });

        renderer.xr.setReferenceSpaceType('local');
        await renderer.xr.setSession(xrSession);

        xrReferenceSpace = await xrSession.requestReferenceSpace('local');
        const viewerSpace = await xrSession.requestReferenceSpace('viewer');
        xrHitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace });

        // Retícula para indicar superficie
        reticle = createReticle();
        scene.add(reticle);

        if (currentModel) { currentModel.visible = false; modelPlaced = false; }
        arMode = true;
        scene.background = null;

        showAROverlay();

        // Tap para colocar modelo
        document.getElementById('ar-overlay').addEventListener('click', placeModelXR, { once: false });

        renderer.setAnimationLoop(renderXR);
        xrSession.addEventListener('end', onXRSessionEnd);
    } catch (err) {
        console.warn('WebXR falló, iniciando AR manual:', err);
        startManualAR();
    }
}

function createReticle() {
    const r = new THREE.Group();
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.16, 32),
        new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    r.add(ring);
    // Cruz central
    [[1,0],[0,1]].forEach(([x,z]) => {
        const bar = new THREE.Mesh(
            new THREE.PlaneGeometry(0.24, 0.02),
            new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide })
        );
        bar.rotation.x = -Math.PI/2;
        bar.rotation.z = z ? Math.PI/2 : 0;
        r.add(bar);
    });
    r.visible = false;
    r.matrixAutoUpdate = false;
    return r;
}

function renderXR(timestamp, frame) {
    if (!frame) return;
    const pose = frame.getViewerPose(xrReferenceSpace);
    if (xrHitTestSource && pose) {
        const hits = frame.getHitTestResults(xrHitTestSource);
        if (hits.length > 0) {
            const hit = hits[0];
            const hitPose = hit.getPose(xrReferenceSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(hitPose.transform.matrix);
        } else {
            reticle.visible = false;
        }
    }
    if (currentModel && isAnimating) {
        currentModel.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}

function placeModelXR() {
    if (!reticle.visible || !currentModel) return;
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    reticle.matrix.decompose(pos, quat, scale);

    currentModel.position.copy(pos);
    currentModel.quaternion.copy(quat);
    currentModel.visible = true;
    modelPlaced = true;

    // Pequeña animación de aparición
    currentModel.scale.set(0.01, 0.01, 0.01);
    const targetScale = 0.35;
    let s = 0.01;
    const grow = setInterval(() => {
        s = Math.min(s + 0.02, targetScale);
        currentModel.scale.set(s, s, s);
        if (s >= targetScale) clearInterval(grow);
    }, 16);
}

function onXRSessionEnd() {
    xrSession = null; xrHitTestSource = null;
    arMode = false;
    if (reticle) { scene.remove(reticle); reticle = null; }
    renderer.setAnimationLoop(null);
    scene.background = new THREE.Color(0x0a0a0f);
    if (currentModel) { currentModel.scale.set(1,1,1); currentModel.visible = true; }
    hideAROverlay();
    animate();
}

// ─── AR Manual (fallback) ─────────────────────────────────────
/**
 * AR Manual: renderiza el video de la cámara como fondo
 * y superpone el canvas Three.js con alpha transparent.
 * Funciona en cualquier dispositivo con cámara.
 */
async function startManualAR() {
    try {
        const arStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });

        arMode = true;
        const container = document.getElementById('modelViewer');

        // Crear <video> de fondo si no existe
        if (!arVideo) {
            arVideo = document.createElement('video');
            arVideo.autoplay = true;
            arVideo.playsInline = true;
            arVideo.muted = true;
            arVideo.style.cssText = `
                position:absolute; top:0; left:0; width:100%; height:100%;
                object-fit:cover; z-index:0; border-radius:inherit;`;
            container.insertBefore(arVideo, container.firstChild);
        }
        arVideo.srcObject = arStream;
        arVideo.play();

        // Canvas Three.js encima con fondo transparente
        const canvas = document.getElementById('threeCanvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0'; canvas.style.left = '0';
        canvas.style.zIndex = '1';
        canvas.style.background = 'transparent';
        renderer.setClearColor(0x000000, 0); // alpha = 0
        scene.background = null;

        // Ajustar modelo para AR manual
        if (currentModel) {
            currentModel.position.set(0, -0.5, -2);
            currentModel.scale.set(0.6, 0.6, 0.6);
        }
        camera.position.set(0, 0, 0);
        camera.fov = 70; camera.updateProjectionMatrix();

        showAROverlay(true);
        arManualLoop();
    } catch (err) {
        alert('No se pudo acceder a la cámara para AR: ' + err.message);
        arMode = false;
    }
}

function arManualLoop() {
    if (!arMode) return;
    animationId = requestAnimationFrame(arManualLoop);
    if (currentModel) {
        if (!isAnimating) currentModel.rotation.y += 0.008;
        // Ligero "float"
        currentModel.position.y = -0.5 + Math.sin(Date.now() * 0.0015) * 0.08;
    }
    if (particleSystem && effectsActive) particleSystem.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function stopManualAR() {
    arMode = false;
    if (arVideo && arVideo.srcObject) {
        arVideo.srcObject.getTracks().forEach(t => t.stop());
        arVideo.srcObject = null;
    }
    // Restaurar canvas
    const canvas = document.getElementById('threeCanvas');
    canvas.style.position = '';
    canvas.style.zIndex = '';
    renderer.setClearColor(0x000000, 1);
    scene.background = new THREE.Color(0x0a0a0f);
    if (currentModel) {
        currentModel.position.set(0,0,0);
        currentModel.scale.set(1,1,1);
    }
    camera.position.set(0,0,5);
    camera.fov = 75; camera.updateProjectionMatrix();
    hideAROverlay();
    animate();
}

// ─── Overlay UI para AR ───────────────────────────────────────
function showAROverlay(isManual = false) {
    let overlay = document.getElementById('ar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ar-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div id="ar-ui">
            <div id="ar-hint">
                ${isManual
                    ? '🎯 El modelo flota sobre la cámara — usa los controles'
                    : '📱 Apunta al suelo y toca para colocar el modelo'}
            </div>
            <div id="ar-controls">
                <button id="ar-scale-up"  class="ar-ctrl-btn"><i class="fa-solid fa-plus"></i></button>
                <button id="ar-scale-down" class="ar-ctrl-btn"><i class="fa-solid fa-minus"></i></button>
                <button id="ar-spin"       class="ar-ctrl-btn"><i class="fa-solid fa-rotate"></i></button>
                <button id="ar-exit"       class="ar-ctrl-btn ar-exit-btn"><i class="fa-solid fa-xmark"></i> Salir</button>
            </div>
        </div>`;

    overlay.style.cssText = `
        position:fixed; inset:0; z-index:999; pointer-events:none;
        display:flex; flex-direction:column; justify-content:flex-end; padding:20px;`;

    const ui = overlay.querySelector('#ar-ui');
    ui.style.cssText = `pointer-events:auto; display:flex; flex-direction:column; align-items:center; gap:12px;`;

    const hint = overlay.querySelector('#ar-hint');
    hint.style.cssText = `
        background:rgba(0,0,0,0.65); color:#fff; padding:10px 20px;
        border-radius:20px; font-size:0.85rem; font-weight:600; text-align:center;
        border:1px solid rgba(0,212,255,0.4);`;

    const ctrls = overlay.querySelector('#ar-controls');
    ctrls.style.cssText = `display:flex; gap:14px; align-items:center;`;

    overlay.querySelectorAll('.ar-ctrl-btn').forEach(b => {
        b.style.cssText = `
            background:rgba(0,0,0,0.7); border:1.5px solid rgba(0,212,255,0.6);
            color:#fff; border-radius:50%; width:52px; height:52px;
            display:flex; align-items:center; justify-content:center;
            font-size:1.1rem; cursor:pointer; transition:all 0.2s; outline:none;`;
    });
    const exitBtn = overlay.querySelector('#ar-exit');
    exitBtn.style.cssText += `border-radius:24px; width:auto; padding:0 18px; border-color:#ff4444;`;

    // Eventos controles AR
    overlay.querySelector('#ar-scale-up').addEventListener('click',   () => scaleARModel(1.15));
    overlay.querySelector('#ar-scale-down').addEventListener('click', () => scaleARModel(0.87));
    overlay.querySelector('#ar-spin').addEventListener('click',       () => toggleAnimation());
    overlay.querySelector('#ar-exit').addEventListener('click', () => {
        if (xrSession) xrSession.end();
        else stopManualAR();
    });
}

function hideAROverlay() {
    const o = document.getElementById('ar-overlay');
    if (o) o.remove();
}

function scaleARModel(factor) {
    if (!currentModel) return;
    currentModel.scale.multiplyScalar(factor);
}

// ══════════════════════════════════════════════════════════════
// CONTROLES MODELO (modo normal)
// ══════════════════════════════════════════════════════════════
function rotateModel(dir) {
    if (currentModel) currentModel.rotation.y += dir * 0.3;
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    animateBtn.classList.toggle('active', isAnimating);
    if (isAnimating) performAnimation();
}

function performAnimation() {
    if (!currentModel || !isAnimating) return;
    const t = Date.now() * 0.003;
    currentModel.position.y = arMode ? (currentModel.position.y) : Math.sin(t) * 0.3;
    currentModel.rotation.x = Math.sin(t * 0.5) * 0.1;
    currentModel.rotation.z = Math.cos(t * 0.5) * 0.1;
    currentModel.rotation.y += 0.02;
    setTimeout(performAnimation, 16);
}

function toggleInfo() {
    infoPanel.classList.toggle('hidden');
    infoBtn.classList.toggle('active');
}

function toggleEffects() {
    effectsActive = !effectsActive;
    effectsBtn.classList.toggle('active', effectsActive);
    if (effectsActive) createParticleSystem();
    else removeParticleSystem();
}

function createParticleSystem() {
    const geo = new THREE.BufferGeometry();
    const n = 1200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 10;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0x00d4ff, size: 0.05, transparent: true, opacity: 0.75
    }));
    scene.add(particleSystem);
}

function removeParticleSystem() {
    if (particleSystem) {
        scene.remove(particleSystem);
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
        particleSystem = null;
    }
}

function updateInfoPanel(objectType) {
    const obj = objectDatabase[objectType] || objectDatabase.default;
    infoTitle.textContent = obj.info.title;
    infoContent.innerHTML = obj.info.description;
}

// ══════════════════════════════════════════════════════════════
// RESET
// ══════════════════════════════════════════════════════════════
function resetToScanner() {
    if (arMode) {
        if (xrSession) xrSession.end();
        else stopManualAR();
    }
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    if (currentModel) { scene.remove(currentModel); currentModel = null; }
    removeParticleSystem();
    isAnimating = false; effectsActive = false;
    animateBtn.classList.remove('active');
    effectsBtn.classList.remove('active');
    infoPanel.classList.add('hidden');
    infoBtn.classList.remove('active');
    hideAROverlay();
    showSection(scannerSection, modelSection);
    setMenuActive('scanner');
}

window.addEventListener('beforeunload', () => { closeCamera(); if (renderer) renderer.dispose(); });