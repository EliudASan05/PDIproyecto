// server.js - Servidor FutCam con sistema de rutas
const express = require('express');
const path = require('path');
const pageRoutes = require('./rutas/rutas.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON (por si lo necesitas después)
app.use(express.json());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Usar las rutas definidas en rutas.js
app.use('/', pageRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).sendFile('main.html', { root: './public' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║        🎥 FutCam Server 2.0 🎥       ║
    ╚═══════════════════════════════════════╝
    
    ✅ Servidor corriendo en: http://localhost:${PORT}
    
    📄 Rutas disponibles:
       • http://localhost:${PORT}/              → Página principal (main)
       • http://localhost:${PORT}/main          → Videos con filtros
       • http://localhost:${PORT}/scanner       → Escáner de camisetas
       • http://localhost:${PORT}/modelo        → Visualizador 3D
       • http://localhost:${PORT}/estadisticas  → Gráficas
       • http://localhost:${PORT}/tareas        → Quiz
    
    🎨 Filtros implementados:
       • Desenfoque (Blur)
       • Pixelado
       • Cámara Térmica
       • Colores Fríos
    
    🛑 Presiona Ctrl+C para detener el servidor
    `);
});