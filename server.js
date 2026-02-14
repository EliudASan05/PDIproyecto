// server.js - Servidor simple para probar FutCam localmente
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// Ruta principal redirige a main.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║        🎥 FutCam Server 1.0 🎥       ║
    ╚═══════════════════════════════════════╝
    
    ✅ Servidor corriendo en: http://localhost:${PORT}
    
    📄 Páginas disponibles:
       • http://localhost:${PORT}/main.html
       • http://localhost:${PORT}/scanner.html
       • http://localhost:${PORT}/Modelo.html
       • http://localhost:${PORT}/Estadisticas.html
       • http://localhost:${PORT}/Tareas.html
    
    🎨 Nuevos filtros implementados:
       • Desenfoque (Blur)
       • Pixelado
       • Cámara Térmica
       • Colores Pastel
    
    🛑 Presiona Ctrl+C para detener el servidor
    `);
});