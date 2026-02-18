// ===============================================
// MODELO3D.JS - Sistema integrado de escáner y visualización 3D
// ===============================================

// Variables globales
let stream = null;
let currentFacingMode = 'environment';
let scene, camera, renderer, currentModel;
let animationId = null;
let particleSystem = null;
let isAnimating = false;
let effectsActive = false;

// Elementos del DOM
const scanButton = document.getElementById('scanButton');
const cancelButton = document.getElementById('cancelButton');
const captureButton = document.getElementById('captureButton');
const switchButton = document.getElementById('switchButton');
const scanAgainBtn = document.getElementById('scanAgainBtn');

const scannerSection = document.getElementById('scannerSection');
const cameraSection = document.getElementById('cameraSection');
const modelSection = document.getElementById('modelSection');
const topMenu = document.getElementById('topMenu');

const cameraStream = document.getElementById('cameraStream');
const loadingOverlay = document.getElementById('loadingOverlay');
const infoPanel = document.getElementById('infoPanel');
const infoTitle = document.getElementById('infoTitle');
const infoContent = document.getElementById('infoContent');

// Botones de control del modelo
const rotateLeftBtn = document.getElementById('rotateLeft');
const rotateRightBtn = document.getElementById('rotateRight');
const animateBtn = document.getElementById('animateBtn');
const infoBtn = document.getElementById('infoBtn');
const effectsBtn = document.getElementById('effectsBtn');

// ===============================================
// MANEJO DEL MENÚ DINÁMICO
// ===============================================

/**
 * Actualiza el atributo data-active del menú según
 * qué sección está visible: 'scanner' o 'modelo'
 */
function setMenuActive(section) {
    topMenu.setAttribute('data-active', section);
}

// Base de datos de objetos detectables
const objectDatabase = {
    'bandera_mexico': {
        name: 'Bandera de México',
        model: 'eagle',
        color: 0x00a844,
        info: {
            title: 'Águila Real - Símbolo de México',
            description: `
                <p><strong>Nombre científico:</strong> Aquila chrysaetos</p>
                <p><strong>Significado:</strong> El águila representa la fuerza, el coraje y la independencia del pueblo mexicano.</p>
                <p><strong>Historia:</strong> Según la leyenda azteca, los mexicas fundaron Tenochtitlan donde vieron un águila devorando una serpiente sobre un nopal.</p>
                <p><strong>Características:</strong> El águila real puede alcanzar velocidades de hasta 240 km/h en picada y tiene una envergadura de hasta 2.3 metros.</p>
            `
        }
    },
    'futbol': {
        name: 'Balón de Fútbol',
        model: 'ball',
        color: 0xffffff,
        info: {
            title: 'Balón de Fútbol',
            description: `
                <p><strong>Deporte:</strong> Fútbol / Soccer</p>
                <p><strong>Tamaño oficial:</strong> 68-70 cm de circunferencia</p>
                <p><strong>Peso:</strong> 410-450 gramos</p>
                <p><strong>Material:</strong> Cuero sintético o PVC</p>
                <p><strong>Historia:</strong> El diseño moderno del balón con pentágonos y hexágonos fue popularizado en la Copa del Mundo de 1970.</p>
            `
        }
    },
    'default': {
        name: 'Objeto Detectado',
        model: 'cube',
        color: 0x00d4ff,
        info: {
            title: 'Objeto Escaneado',
            description: `
                <p><strong>Análisis:</strong> Objeto genérico detectado</p>
                <p><strong>Estado:</strong> Modelo 3D generado exitosamente</p>
                <p><strong>Sugerencia:</strong> Intenta escanear banderas, logos deportivos o símbolos para obtener modelos más detallados.</p>
            `
        }
    }
};

// ===============================================
// INICIALIZACIÓN
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Estado inicial: escáner activo
    setMenuActive('scanner');
});

function setupEventListeners() {
    scanButton.addEventListener('click', openCamera);
    cancelButton.addEventListener('click', cancelScanning);
    captureButton.addEventListener('click', captureAndProcess);
    switchButton.addEventListener('click', switchCamera);
    scanAgainBtn.addEventListener('click', resetToScanner);

    rotateLeftBtn.addEventListener('click', () => rotateModel(-1));
    rotateRightBtn.addEventListener('click', () => rotateModel(1));
    animateBtn.addEventListener('click', toggleAnimation);
    infoBtn.addEventListener('click', toggleInfo);
    effectsBtn.addEventListener('click', toggleEffects);
}

// ===============================================
// FUNCIONES DEL ESCÁNER
// ===============================================

async function openCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        cameraStream.srcObject = stream;
        scannerSection.classList.add('hidden');
        cameraSection.classList.remove('hidden');
        // Cámara abierta → sigue siendo "scanner"
        setMenuActive('scanner');
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
}

function cancelScanning() {
    closeCamera();
    cameraSection.classList.add('hidden');
    scannerSection.classList.remove('hidden');
    setMenuActive('scanner');
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await openCamera();
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        cameraStream.srcObject = null;
    }
}

async function captureAndProcess() {
    const canvas = document.createElement('canvas');
    const video = cameraStream;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    closeCamera();
    cameraSection.classList.add('hidden');
    modelSection.classList.remove('hidden');
    loadingOverlay.classList.remove('hidden');

    // Al mostrar el modelo → pestaña "modelo" activa
    setMenuActive('modelo');

    const detectedObject = await analyzeImage(canvas);

    setTimeout(() => {
        initThreeJS();
        create3DModel(detectedObject);
        updateInfoPanel(detectedObject);
        loadingOverlay.classList.add('hidden');
    }, 2000);
}

async function analyzeImage(canvas) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let r = 0, g = 0, b = 0;
            const pixelCount = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
            }

            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);

            console.log(`🎨 Color detectado - R:${r} G:${g} B:${b}`);

            if (g > r && g > b && g > 90) {
                resolve('bandera_mexico');
            } else if (r > g && r > b && r > 110 && g < 100) {
                resolve('bandera_mexico');
            } else if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r > 150) {
                resolve('futbol');
            } else if (r < 80 && g < 80 && b < 80) {
                resolve('futbol');
            } else {
                resolve('default');
            }
        }, 1000);
    });
}

// ===============================================
// FUNCIONES DE THREE.JS
// ===============================================

function initThreeJS() {
    const canvas = document.getElementById('threeCanvas');
    const container = document.getElementById('modelViewer');

    if (renderer) {
        renderer.dispose();
        if (currentModel) scene.remove(currentModel);
        if (particleSystem) scene.remove(particleSystem);
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x00d4ff, 0.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    window.addEventListener('resize', onWindowResize);
}

function create3DModel(objectType) {
    const objData = objectDatabase[objectType] || objectDatabase['default'];
    let geometry, material;

    switch (objData.model) {
        case 'eagle':
            currentModel = createEagle(objData.color);
            break;
        case 'ball':
            geometry = new THREE.SphereGeometry(1.5, 32, 32);
            material = new THREE.MeshPhongMaterial({
                color: objData.color,
                emissive: 0x111111,
                shininess: 100
            });
            currentModel = new THREE.Mesh(geometry, material);
            addSoccerPattern(currentModel);
            break;
        default:
            geometry = new THREE.BoxGeometry(2, 2, 2);
            material = new THREE.MeshPhongMaterial({
                color: objData.color,
                emissive: 0x111111
            });
            currentModel = new THREE.Mesh(geometry, material);
    }

    scene.add(currentModel);
    animate();
}

function createEagle(color) {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3520 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.2, 0.8);
    group.add(body);

    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    group.add(head);

    const beakGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 1.2, 0.5);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    const wingGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: color });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.2, 0, 0);
    leftWing.rotation.z = -Math.PI / 6;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.2, 0, 0);
    rightWing.rotation.z = Math.PI / 6;
    group.add(rightWing);

    const tailGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3520 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, -0.5, -0.8);
    tail.rotation.x = Math.PI / 2;
    group.add(tail);

    return group;
}

function addSoccerPattern(ball) {
    const pentagonGeometry = new THREE.CircleGeometry(0.3, 5);
    const pentagonMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    for (let i = 0; i < 12; i++) {
        const pentagon = new THREE.Mesh(pentagonGeometry, pentagonMaterial);
        const phi = Math.acos(-1 + (2 * i) / 12);
        const theta = Math.sqrt(12 * Math.PI) * phi;
        pentagon.position.setFromSphericalCoords(1.51, phi, theta);
        pentagon.lookAt(0, 0, 0);
        ball.add(pentagon);
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);

    if (currentModel && !isAnimating) {
        currentModel.rotation.y += 0.005;
    }

    if (particleSystem && effectsActive) {
        particleSystem.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('modelViewer');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// ===============================================
// CONTROLES DEL MODELO
// ===============================================

function rotateModel(direction) {
    if (currentModel) {
        currentModel.rotation.y += direction * 0.3;
    }
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) {
        animateBtn.classList.add('active');
        performAnimation();
    } else {
        animateBtn.classList.remove('active');
    }
}

function performAnimation() {
    if (!currentModel || !isAnimating) return;
    const time = Date.now() * 0.003;
    currentModel.position.y = Math.sin(time) * 0.3;
    currentModel.rotation.x = Math.sin(time * 0.5) * 0.1;
    currentModel.rotation.z = Math.cos(time * 0.5) * 0.1;
    setTimeout(() => performAnimation(), 16);
}

function toggleInfo() {
    infoPanel.classList.toggle('hidden');
    infoBtn.classList.toggle('active');
}

function toggleEffects() {
    effectsActive = !effectsActive;
    if (effectsActive) {
        effectsBtn.classList.add('active');
        createParticleSystem();
    } else {
        effectsBtn.classList.remove('active');
        removeParticleSystem();
    }
}

function createParticleSystem() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x00d4ff,
        size: 0.05,
        transparent: true,
        opacity: 0.8
    });
    particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
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
    const objData = objectDatabase[objectType] || objectDatabase['default'];
    infoTitle.textContent = objData.info.title;
    infoContent.innerHTML = objData.info.description;
}

function resetToScanner() {
    if (animationId) cancelAnimationFrame(animationId);

    if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }

    if (particleSystem) removeParticleSystem();

    isAnimating = false;
    effectsActive = false;
    animateBtn.classList.remove('active');
    effectsBtn.classList.remove('active');
    infoPanel.classList.add('hidden');
    infoBtn.classList.remove('active');

    modelSection.classList.add('hidden');
    scannerSection.classList.remove('hidden');

    // Volver al escáner → pestaña cámara activa
    setMenuActive('scanner');
}

window.addEventListener('beforeunload', () => {
    closeCamera();
    if (renderer) renderer.dispose();
});