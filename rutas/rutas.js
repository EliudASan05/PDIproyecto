const express = require('express');
const router = express.Router();

/**
 * RUTAS DE NAVEGACIÓN - FutCam
 * 
 * Estructura:
 * - GET /             → Redirige a main.html (página principal)
 * - GET /main         → Página de videos con filtros
 * - GET /scanner      → Escáner de camisetas
 * - GET /modelo       → Visualizador 3D
 * - GET /estadisticas → Gráficas y estadísticas
 * - GET /tareas       → Quiz de dificultades
 */

// Ruta raíz - Redirige a la página principal
router.get('/', (request, response) => {
    response.sendFile('main.html', { root: './public' });
});

// Página principal - Videos con filtros
router.get('/main', (request, response) => {
    response.sendFile('main.html', { root: './public' });
});

// Escáner de camisetas
router.get('/scanner', (request, response) => {
    response.sendFile('scanner.html', { root: './public' });
});

// Visualizador 3D
router.get('/modelo', (request, response) => {
    response.sendFile('Modelo.html', { root: './public' });
});

// Estadísticas
router.get('/estadisticas', (request, response) => {
    response.sendFile('Estadisticas.html', { root: './public' });
});

// Quiz/Tareas
router.get('/tareas', (request, response) => {
    response.sendFile('Tareas.html', { root: './public' });
});

module.exports = router;