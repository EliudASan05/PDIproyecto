// Función para reproducir/pausar video
function togglePlay(videoId, button) {
    const video = document.getElementById(videoId);
    if (video.paused) {
        video.play();
        button.classList.add('playing');
    } else {
        video.pause();
        button.classList.remove('playing');
    }
}

// Función para aplicar filtros al video
function applyFilter(videoId, filterType, button) {
    const video = document.getElementById(videoId);
    const container = video.closest('.video-container');
    const allButtons = container.querySelectorAll('.filter-btn:not(.upload)');
    
    // Remover clase active de todos los botones
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // Remover todos los filtros
    video.classList.remove('filter-sepia', 'filter-bw', 'filter-cold');
    
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
        const previousSrc = video.querySelector('source').src;
        video.dataset.originalSrc = previousSrc;
        
        // Cargar el nuevo video
        video.querySelector('source').src = url;
        video.load();
        
        // Actualizar el título del video
        const container = video.closest('.video-container');
        const titleElement = container.querySelector('.video-title');
        titleElement.textContent = file.name.replace(/\.[^/.]+$/, ""); // Nombre sin extensión
        
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