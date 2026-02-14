// Función para reproducir/pausar video
function togglePlay(videoId, button) {
    const video = document.getElementById(videoId);
    if (video.paused) {
        // Intentar reproducir el video
        video.play().then(() => {
            button.classList.add('playing');
        }).catch(error => {
            console.error('Error al reproducir el video:', error);
            // Si falla, intentar cargar y reproducir de nuevo
            video.load();
            video.play().then(() => {
                button.classList.add('playing');
            }).catch(err => {
                console.error('Error persistente al reproducir:', err);
                alert('No se pudo reproducir el video. Intenta de nuevo.');
            });
        });
    } else {
        video.pause();
        button.classList.remove('playing');
    }
}

// Función para aplicar filtros al video
function applyFilter(videoId, filterType, button) {
    const video = document.getElementById(videoId);
    const card = video.closest('.card');
    const allButtons = card.querySelectorAll('.filter-btn:not(.upload)');
    
    // Remover clase active de todos los botones
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // Remover todos los filtros
    video.classList.remove(
        'filter-blur', 
        'filter-pixelated', 
        'filter-thermal', 
        'filter-cold'
    );
    
    // Aplicar nuevo filtro si no es "original"
    if (filterType !== 'original') {
        video.classList.add('filter-' + filterType);
    }
    
    // Marcar botón como activo
    button.classList.add('active');
}

// Función para subir video
function uploadVideo(videoId, input) {
    const file = input.files[0];
    if (file && file.type.startsWith('video/')) {
        const video = document.getElementById(videoId);
        const url = URL.createObjectURL(file);
        
        // Guardar el video anterior en caso de querer volver
        const source = video.querySelector('source');
        const previousSrc = source.src;
        video.dataset.originalSrc = previousSrc;
        
        // Cargar el nuevo video
        source.src = url;
        video.load();
        
        // Reproducir automáticamente el video cargado
        video.play().catch(error => {
            console.log('Video cargado, presiona play para reproducir');
        });
        
        console.log('Video cargado exitosamente:', file.name);
    } else {
        alert('Por favor, selecciona un archivo de video válido.');
    }
}

// Limpiar URLs de objetos cuando se cierra la página
window.addEventListener('beforeunload', () => {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        const src = video.querySelector('source').src;
        if (src.startsWith('blob:')) {
            URL.revokeObjectURL(src);
        }
    });
});

// Cargar videos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        // Cargar el video
        video.load();
        
        // Manejar errores de carga
        video.addEventListener('error', (e) => {
            console.error('Error al cargar el video:', e);
            console.error('Video source:', video.querySelector('source').src);
            
            // Mostrar mensaje de error en consola
            const errorMessages = {
                1: 'MEDIA_ERR_ABORTED - Descarga abortada por el usuario',
                2: 'MEDIA_ERR_NETWORK - Error de red al descargar',
                3: 'MEDIA_ERR_DECODE - Error al decodificar el video',
                4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Formato no soportado o video no disponible'
            };
            
            console.error('Código de error:', video.error.code, '-', errorMessages[video.error.code]);
        });
        
        // Evento cuando el video está listo
        video.addEventListener('loadedmetadata', () => {
            console.log(`Video ${video.id} cargado correctamente`);
        });
        
        // Evento cuando puede reproducirse
        video.addEventListener('canplay', () => {
            console.log(`Video ${video.id} listo para reproducir`);
        });
    });
});