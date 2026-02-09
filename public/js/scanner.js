// Variables globales
let stream = null;
let currentFacingMode = 'environment'; // 'user' para frontal, 'environment' para trasera

// Elementos del DOM
const scanButton = document.getElementById('scanButton');
const cancelButton = document.getElementById('cancelButton');
const captureButton = document.getElementById('captureButton');
const switchButton = document.getElementById('switchButton');
const retryButton = document.getElementById('retryButton');

const scannerSection = document.getElementById('scannerSection');
const cameraSection = document.getElementById('cameraSection');
const resultSection = document.getElementById('resultSection');

const cameraStream = document.getElementById('cameraStream');
const capturedImage = document.getElementById('capturedImage');

// Abrir cámara al hacer click en "ESCANEAR"
scanButton.addEventListener('click', async () => {
    try {
        await openCamera();
        scannerSection.classList.add('hidden');
        cameraSection.classList.remove('hidden');
    } catch (error) {
        console.error('Error al abrir la cámara:', error);
        alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    }
});

// Cancelar y volver a la pantalla inicial
cancelButton.addEventListener('click', () => {
    closeCamera();
    cameraSection.classList.add('hidden');
    scannerSection.classList.remove('hidden');
});

// Capturar imagen
captureButton.addEventListener('click', () => {
    captureImage();
    closeCamera();
    cameraSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
});

// Cambiar entre cámara frontal y trasera
switchButton.addEventListener('click', async () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await openCamera();
});

// Reintentar escaneo
retryButton.addEventListener('click', async () => {
    resultSection.classList.add('hidden');
    await openCamera();
    cameraSection.classList.remove('hidden');
});

// Función para abrir la cámara
async function openCamera() {
    // Cerrar stream anterior si existe
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
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        
        // Si falla con facing mode, intentar sin él
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            cameraStream.srcObject = stream;
        } catch (fallbackError) {
            throw fallbackError;
        }
    }
}

// Función para cerrar la cámara
function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        cameraStream.srcObject = null;
    }
}

// Función para capturar imagen
function captureImage() {
    const canvas = capturedImage;
    const video = cameraStream;
    
    // Ajustar el tamaño del canvas al video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Opcional: Guardar la imagen
    canvas.toBlob((blob) => {
        console.log('Imagen capturada:', blob);
        // Aquí puedes hacer algo con el blob, como enviarlo a un servidor
    }, 'image/jpeg', 0.95);
}

// Guardar imagen
document.querySelector('.result-btn.save').addEventListener('click', () => {
    const canvas = capturedImage;
    const link = document.createElement('a');
    link.download = `futcam-scan-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    closeCamera();
});

// Manejar errores de permisos
window.addEventListener('error', (event) => {
    if (event.message.includes('getUserMedia')) {
        alert('Para usar el escáner, necesitas permitir el acceso a la cámara en la configuración de tu navegador.');
    }
});