    // ── Estado del quiz ────────────────────────────────────────────
    let preguntas = [];
    let indice = 0;
    let correctas = 0;
    let dificultadActual = '';
    let respondida = false;

    const LABELS = ['A', 'B', 'C', 'D'];
    const DIFF_LABELS = { facil: 'FÁCIL', intermedio: 'INTERMEDIO', dificil: 'DIFÍCIL' };
    const BADGE_CLASS  = { facil: 'badge-facil', intermedio: 'badge-intermedio', dificil: 'badge-dificil' };

    // ── Datos incrustados (trivia.json) ───────────────────────────
    const triviaData = {
      "facil": [
        { "id":1, "pregunta":"¿En qué país se jugó el primer Mundial de Fútbol?", "opciones":["Brasil","Uruguay","Argentina","México"], "respuesta":"Uruguay", "dato":"Uruguay 1930 fue el primer Mundial. El anfitrión también ganó el torneo." },
        { "id":2, "pregunta":"¿Cuántos países participan en el Mundial 2026?", "opciones":["32","48","36","64"], "respuesta":"48", "dato":"El Mundial 2026 es el primero en tener 48 selecciones, ampliado desde 32." },
        { "id":3, "pregunta":"¿Qué tres países son co-sede del Mundial 2026?", "opciones":["USA, México, Canadá","USA, Brasil, México","Canadá, Colombia, USA","México, Argentina, USA"], "respuesta":"USA, México, Canadá", "dato":"Es el primer Mundial con tres países anfitriones simultáneamente." },
        { "id":4, "pregunta":"¿Quién es el máximo goleador en la historia de los Mundiales?", "opciones":["Pelé","Ronaldo (Brasil)","Miroslav Klose","Just Fontaine"], "respuesta":"Miroslav Klose", "dato":"Klose marcó 16 goles en Mundiales con Alemania (2002, 2006, 2010, 2014)." },
        { "id":5, "pregunta":"¿Cuántas veces ha ganado Brasil el Mundial?", "opciones":["4","5","6","3"], "respuesta":"5", "dato":"Brasil es el único país en ganar 5 Copas del Mundo (1958, 1962, 1970, 1994, 2002)." },
        { "id":6, "pregunta":"¿En qué año ganó México el Mundial?", "opciones":["1986","1970","1994","México nunca ha ganado"], "respuesta":"México nunca ha ganado", "dato":"México ha llegado máximo a cuartos de final, en 1970 y 1986." },
        { "id":7, "pregunta":"¿Qué selección ganó el Mundial 2022 en Qatar?", "opciones":["Francia","Brasil","Argentina","Alemania"], "respuesta":"Argentina", "dato":"Argentina venció a Francia en penales 4-2 en la final de Qatar 2022." },
        { "id":8, "pregunta":"¿Cuántos goles hizo Ronaldo (Brasil) en Mundiales?", "opciones":["12","15","9","11"], "respuesta":"15", "dato":"Ronaldo Nazário marcó 15 goles en 3 Mundiales, fue récord antes que Klose." }
      ],
      "intermedio": [
        { "id":9, "pregunta":"¿Quién tiene más participaciones en Copas del Mundo como jugador?", "opciones":["Lothar Matthäus","Antonio Carbajal","Gianluigi Buffon","Rafael Márquez"], "respuesta":"Antonio Carbajal", "dato":"El portero mexicano Carbajal jugó 5 Mundiales consecutivos (1950–1966)." },
        { "id":10, "pregunta":"¿Cuántos goles marcó Just Fontaine en el Mundial 1958?", "opciones":["11","13","10","9"], "respuesta":"13", "dato":"Fontaine marcó 13 goles en un solo Mundial (Francia 1958), récord absoluto." },
        { "id":11, "pregunta":"¿En qué Mundial debutó Lionel Messi?", "opciones":["Alemania 2006","Sudáfrica 2010","Korea-Japón 2002","Brasil 2014"], "respuesta":"Alemania 2006", "dato":"Messi tenía 18 años cuando jugó su primer partido mundialista en 2006." },
        { "id":12, "pregunta":"¿Qué estadio será la sede de la final del Mundial 2026?", "opciones":["Rose Bowl, Los Angeles","MetLife Stadium, Nueva York/Nueva Jersey","Estadio Azteca, Ciudad de México","BC Place, Vancouver"], "respuesta":"MetLife Stadium, Nueva York/Nueva Jersey", "dato":"El MetLife Stadium tiene capacidad para más de 82,000 espectadores." },
        { "id":13, "pregunta":"¿Cuántos Mundiales ha ganado Alemania?", "opciones":["3","4","5","2"], "respuesta":"4", "dato":"Alemania ganó en 1954, 1974, 1990 y 2014. En 1954 fue la 'hazaña de Berna'." },
        { "id":14, "pregunta":"¿Qué jugador ganó el Balón de Oro en el Mundial 2022?", "opciones":["Kylian Mbappé","Lionel Messi","Luka Modrić","Emiliano Martínez"], "respuesta":"Lionel Messi", "dato":"Messi ganó también el Balón de Oro en el Mundial 2014, el único en ganar dos." },
        { "id":15, "pregunta":"¿Quién fue el goleador del Mundial 2018 en Rusia?", "opciones":["Cristiano Ronaldo","Harry Kane","Antoine Griezmann","Romelu Lukaku"], "respuesta":"Harry Kane", "dato":"Kane marcó 6 goles con Inglaterra y ganó la Bota de Oro de Rusia 2018." },
        { "id":16, "pregunta":"¿Cuántos partidos se jugarán en el Mundial 2026?", "opciones":["64","80","104","96"], "respuesta":"104", "dato":"Con 48 equipos el torneo tiene 104 partidos, 40 más que el formato anterior." }
      ],
      "dificil": [
        { "id":17, "pregunta":"¿En qué año fue la única vez que el Mundial se jugó en dos países simultáneamente antes del 2026?", "opciones":["1998","2002","2006","Nunca antes del 2026"], "respuesta":"2002", "dato":"Korea 2002 fue el único Mundial co-organizado por dos países (Corea del Sur y Japón)." },
        { "id":18, "pregunta":"¿Cuántos goles tiene Cristiano Ronaldo en Copas del Mundo?", "opciones":["7","9","8","6"], "respuesta":"8", "dato":"Ronaldo marcó 8 goles en 5 Mundiales (2006, 2010, 2014, 2018, 2022)." },
        { "id":19, "pregunta":"¿Qué selección fue eliminada en primera ronda siendo campeona vigente en 2010?", "opciones":["Brasil","Francia","Italia","Alemania"], "respuesta":"Italia", "dato":"Italia, campeona de 2006, quedó eliminada en el Grupo F de Sudáfrica 2010." },
        { "id":20, "pregunta":"¿Cuál es el resultado más abultado en la historia de los Mundiales?", "opciones":["Hungría 10-1 El Salvador (1982)","Hungría 9-0 Corea del Sur (1954)","Yugoslavia 9-0 Zaire (1974)","Alemania 8-0 Arabia Saudita (2002)"], "respuesta":"Hungría 10-1 El Salvador (1982)", "dato":"Hungría goleó 10-1 a El Salvador en España 1982, récord histórico." },
        { "id":21, "pregunta":"¿Cuántos goles tiene Rafael Márquez en Mundiales con México?", "opciones":["4","3","2","5"], "respuesta":"4", "dato":"Márquez es el único capitán mexicano en anotar en 4 Mundiales distintos." },
        { "id":22, "pregunta":"¿En qué año México alcanzó el partido de Quinto lugar en un Mundial?", "opciones":["1970","1986","México nunca jugó ese partido","1978"], "respuesta":"México nunca jugó ese partido", "dato":"México llegó máximo a cuartos de final. El partido de 5to lugar existió hasta 1978." },
        { "id":23, "pregunta":"¿Qué portero tiene más partidos sin recibir gol en la historia de los Mundiales?", "opciones":["Gianluigi Buffon","Peter Shilton","Sepp Maier","Walter Zenga"], "respuesta":"Peter Shilton", "dato":"Shilton tuvo 10 partidos sin goles en Mundiales jugando para Inglaterra (1982–1990)." },
        { "id":24, "pregunta":"¿Cuántos jugadores fueron expulsados en la 'Batalla de Nuremberg' (2006)?", "opciones":["2","3","4","1"], "respuesta":"4", "dato":"Portugal vs Holanda en 2006 terminó con 4 expulsados y 16 tarjetas amarillas." }
      ]
    };

    // ── Funciones principales ──────────────────────────────────────
    function iniciarQuiz(dificultad) {
        dificultadActual = dificultad;
        preguntas = [...triviaData[dificultad]].sort(() => Math.random() - 0.5);
        indice = 0;
        correctas = 0;
        respondida = false;

        const overlay = document.getElementById('quizOverlay');
        overlay.classList.add('active');
        document.getElementById('resultScreen').classList.remove('show');
        document.getElementById('questionCard').style.display = 'block';
        document.getElementById('btnSiguiente').classList.remove('show');

        const badge = document.getElementById('diffBadge');
        badge.textContent = DIFF_LABELS[dificultad];
        badge.className = 'quiz-diff-badge ' + BADGE_CLASS[dificultad];

        mostrarPregunta();
    }

    function cerrarQuiz() {
        document.getElementById('quizOverlay').classList.remove('active');
    }

    function mostrarPregunta() {
        respondida = false;
        const p = preguntas[indice];
        const total = preguntas.length;

        document.getElementById('progressText').textContent = `${indice + 1} / ${total}`;
        document.getElementById('progressBar').style.width = `${(indice / total) * 100}%`;
        document.getElementById('questionNum').textContent = `PREGUNTA ${indice + 1}`;
        document.getElementById('questionText').textContent = p.pregunta;

        const grid = document.getElementById('optionsGrid');
        grid.innerHTML = '';
        p.opciones.forEach((op, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="opt-letter">${LABELS[i]}</span> ${op}`;
            btn.onclick = () => responder(op, btn);
            grid.appendChild(btn);
        });

        document.getElementById('datoBox').classList.remove('show');
        document.getElementById('btnSiguiente').classList.remove('show');
        document.getElementById('btnSiguiente').textContent =
            indice === preguntas.length - 1
            ? '  Ver resultados  '
            : 'Siguiente  ';

        // Añadir ícono al botón siguiente
        const icon = document.createElement('i');
        icon.className = indice === preguntas.length - 1
            ? 'fa-solid fa-flag-checkered'
            : 'fa-solid fa-arrow-right';
        document.getElementById('btnSiguiente').appendChild(icon);
    }

    function responder(opcion, btn) {
        if (respondida) return;
        respondida = true;

        const p = preguntas[indice];
        const esCorrecta = opcion === p.respuesta;
        if (esCorrecta) correctas++;

        // Marcar todas las opciones
        document.querySelectorAll('.option-btn').forEach(b => {
            b.disabled = true;
            const texto = b.textContent.trim().slice(1).trim(); // quitar letra
            if (texto === p.respuesta) b.classList.add('correct');
            else if (b === btn && !esCorrecta) b.classList.add('wrong');
        });

        // Mostrar dato
        document.getElementById('datoText').textContent = p.dato;
        document.getElementById('datoBox').classList.add('show');
        document.getElementById('btnSiguiente').classList.add('show');
    }

    function siguientePregunta() {
        indice++;
        if (indice >= preguntas.length) {
            mostrarResultados();
        } else {
            mostrarPregunta();
        }
    }

    function mostrarResultados() {
        document.getElementById('questionCard').style.display = 'none';
        document.getElementById('btnSiguiente').classList.remove('show');
        document.getElementById('progressBar').style.width = '100%';

        const total = preguntas.length;
        const incorrectas = total - correctas;
        const pct = Math.round((correctas / total) * 100);

        document.getElementById('correctCount').textContent = correctas;
        document.getElementById('wrongCount').textContent = incorrectas;
        document.getElementById('pctCount').textContent = pct + '%';
        document.getElementById('resultScore').textContent = `${correctas} / ${total}`;

        let emoji, titulo, subtitulo;
        if (pct === 100)      { emoji = '🏆'; titulo = '¡Perfecto!';      subtitulo = 'Respondiste todo correctamente'; }
        else if (pct >= 75)   { emoji = '⚽'; titulo = '¡Muy bien!';      subtitulo = 'Eres un experto mundialista'; }
        else if (pct >= 50)   { emoji = '👏'; titulo = 'Bien hecho';       subtitulo = 'Conoces bastante del Mundial'; }
        else if (pct >= 25)   { emoji = '💪'; titulo = 'Sigue intentando'; subtitulo = 'Puedes mejorar con práctica'; }
        else                  { emoji = '😅'; titulo = 'Casi...';          subtitulo = 'Repasa los datos del Mundial'; }

        document.getElementById('resultEmoji').textContent = emoji;
        document.getElementById('resultTitle').textContent = titulo;
        document.getElementById('resultSubtitle').textContent = subtitulo;
        document.getElementById('resultScreen').classList.add('show');
    }

    function repetirQuiz() {
        iniciarQuiz(dificultadActual);
    }