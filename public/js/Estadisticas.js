// ── Datos de partidos ──────────────────────────────────────────
    const partidos = [
      {
        id: 1, jornada: 1, fecha: "11 Jun 2026", hora: "18:00",
        sede: "Azteca, CDMX",
        local:     { nombre: "México",     bandera: "🇲🇽", goles: 2 },
        visitante: { nombre: "Sudáfrica",  bandera: "🇿🇦", goles: 0 },
        estado: "finalizado"
      },
      {
        id: 2, jornada: 1, fecha: "12 Jun 2026", hora: "15:00",
        sede: "Akron, Guadalajara",
        local:     { nombre: "Polonia",      bandera: "🇵🇱", goles: 1 },
        visitante: { nombre: "Corea del Sur",bandera: "🇰🇷", goles: 1 },
        estado: "finalizado"
      },
      {
        id: 3, jornada: 1, fecha: "12 Jun 2026", hora: "21:00",
        sede: "BBVA, Monterrey",
        local:     { nombre: "Colombia",   bandera: "🇨🇴", goles: 3 },
        visitante: { nombre: "Cabo Verde", bandera: "🇨🇻", goles: 1 },
        estado: "finalizado"
      },
      {
        id: 4, jornada: 1, fecha: "13 Jun 2026", hora: "18:00",
        sede: "Azteca, CDMX",
        local:     { nombre: "Japón",   bandera: "🇯🇵", goles: 0 },
        visitante: { nombre: "Ucrania", bandera: "🇺🇦", goles: 2 },
        estado: "finalizado"
      },
      {
        id: 5, jornada: 1, fecha: "14 Jun 2026", hora: "18:00",
        sede: "Akron, Guadalajara",
        local:     { nombre: "Túnez",          bandera: "🇹🇳", goles: 1 },
        visitante: { nombre: "Arabia Saudita", bandera: "🇸🇦", goles: 1 },
        estado: "finalizado"
      },
      {
        id: 6, jornada: 2, fecha: "15 Jun 2026", hora: "18:00",
        sede: "BBVA, Monterrey",
        local:     { nombre: "Uzbekistán", bandera: "🇺🇿", goles: 0 },
        visitante: { nombre: "México",     bandera: "🇲🇽", goles: 1 },
        estado: "finalizado"
      },
      {
        id: 7, jornada: 2, fecha: "16 Jun 2026", hora: "15:00",
        sede: "Azteca, CDMX",
        local:     { nombre: "Corea del Sur", bandera: "🇰🇷", goles: 2 },
        visitante: { nombre: "Sudáfrica",     bandera: "🇿🇦", goles: 0 },
        estado: "finalizado"
      },
      {
        id: 8, jornada: 2, fecha: "17 Jun 2026", hora: "21:00",
        sede: "Akron, Guadalajara",
        local:     { nombre: "Polonia",   bandera: "🇵🇱", goles: null },
        visitante: { nombre: "Colombia",  bandera: "🇨🇴", goles: null },
        estado: "en-vivo"
      },
      {
        id: 9, jornada: 2, fecha: "18 Jun 2026", hora: "18:00",
        sede: "BBVA, Monterrey",
        local:     { nombre: "Ucrania", bandera: "🇺🇦", goles: null },
        visitante: { nombre: "Túnez",   bandera: "🇹🇳", goles: null },
        estado: "proximo"
      },
      {
        id: 10, jornada: 2, fecha: "19 Jun 2026", hora: "18:00",
        sede: "Azteca, CDMX",
        local:     { nombre: "Arabia Saudita", bandera: "🇸🇦", goles: null },
        visitante: { nombre: "Japón",          bandera: "🇯🇵", goles: null },
        estado: "proximo"
      },
      {
        id: 11, jornada: 3, fecha: "20 Jun 2026", hora: "20:00",
        sede: "Akron, Guadalajara",
        local:     { nombre: "Cabo Verde",  bandera: "🇨🇻", goles: null },
        visitante: { nombre: "Uzbekistán",  bandera: "🇺🇿", goles: null },
        estado: "proximo"
      },
      {
        id: 12, jornada: 3, fecha: "21 Jun 2026", hora: "18:00",
        sede: "Azteca, CDMX",
        local:     { nombre: "México",  bandera: "🇲🇽", goles: null },
        visitante: { nombre: "Polonia", bandera: "🇵🇱", goles: null },
        estado: "proximo"
      }
    ];

    // ── Simulación de gol en vivo ──────────────────────────────────
    // El partido en-vivo (id=8) simula un gol cada 30 seg
    let golesLocal = 0, golesVisitante = 0;
    let segundos = 0;

    function simularGol() {
      const partido = partidos.find(p => p.estado === "en-vivo");
      if (!partido) return;

      // Cada 30 seg hay 30% de probabilidad de gol
      if (Math.random() < 0.30) {
        if (Math.random() < 0.5) golesLocal++;
        else golesVisitante++;
        partido.local.goles = golesLocal;
        partido.visitante.goles = golesVisitante;
        renderPartidos(jornadaActiva);
      }
    }

    // ── Render ────────────────────────────────────────────────────
    let jornadaActiva = 0;

    function estadoBadge(estado) {
      const labels = { finalizado: "Finalizado", "en-vivo": "● En vivo", proximo: "Próximo" };
      return `<span class="estado-badge ${estado}">${labels[estado]}</span>`;
    }

    function renderMarcador(partido) {
      if (partido.estado === "proximo") {
        return `<div class="score-pending">VS</div>`;
      }
      const l = partido.local.goles ?? 0;
      const v = partido.visitante.goles ?? 0;
      return `
        <div class="score-num">${l}</div>
        <div class="score-sep">—</div>
        <div class="score-num">${v}</div>`;
    }

    function renderPartidos(jornada) {
      const container = document.getElementById('matchesContainer');
      const filtrados = jornada === 0
        ? partidos
        : partidos.filter(p => p.jornada === jornada);

      let html = '';
      let jornadaActual = null;

      filtrados.forEach(p => {
        if (jornada === 0 && p.jornada !== jornadaActual) {
          jornadaActual = p.jornada;
          html += `<div class="jornada-label">Jornada ${jornadaActual}</div>`;
        }

        html += `
        <div class="match-card ${p.estado}">
          <div class="match-meta">
            <div class="sede"><i class="fa-solid fa-location-dot"></i> ${p.sede}</div>
            ${estadoBadge(p.estado)}
          </div>
          <div class="match-score">
            <div class="team">
              <div class="team-flag">${p.local.bandera}</div>
              <div class="team-name">${p.local.nombre}</div>
            </div>
            <div class="score-box">${renderMarcador(p)}</div>
            <div class="team">
              <div class="team-flag">${p.visitante.bandera}</div>
              <div class="team-name">${p.visitante.nombre}</div>
            </div>
          </div>
          <div class="match-time">
            <i class="fa-regular fa-calendar"></i> ${p.fecha} &nbsp;·&nbsp;
            <span>${p.hora}</span>
          </div>
        </div>`;
      });

      container.innerHTML = html;
    }

    function filtrarJornada(jornada, btn) {
      jornadaActiva = jornada;
      document.querySelectorAll('.jornada-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPartidos(jornada);
    }

    // ── Contador de actualización simulado ────────────────────────
    setInterval(() => {
      segundos++;
      document.getElementById('updateTime').textContent = segundos;
      // Simular actualización cada 30 segundos
      if (segundos % 30 === 0) {
        simularGol();
        segundos = 0;
      }
    }, 1000);

    // ── Init ──────────────────────────────────────────────────────
    renderPartidos(0);