# El bosque de los laberintos

Aplicación infantil en HTML, CSS y JavaScript para generar y jugar laberintos, con una ilustración original de cuento.

- Cuatro dificultades orientativas: 3, 4, 5 y 6–7 años.
- Aventuras en el bosque, el océano y el espacio.
- Laberintos nuevos generados aleatoriamente, siempre con solución. El recorrido correcto incluye bifurcaciones y caminos sin salida según la edad: al menos 1, 2, 4 y 5 puntos de decisión respectivamente. En 6–7 años, cada desvío contado tiene al menos tres casillas.
- Dibujo del recorrido con dedo, lápiz de PDI o ratón: el personaje permanece en la salida. El trazo se detiene en las paredes, también en movimientos rápidos y diagonales.
- Laberintos horizontales de 6 × 3, 8 × 4, 10 × 5 y 12 × 6 casillas.
- Altura de salida regulable: abajo (por defecto), centro o arriba. La llegada se coloca al otro lado del tablero.
- Paredes más gruesas con acabado de seto o ladrillo. Al tocar o intentar cruzar una pared, las paredes parpadean dos veces en rojo; con movimiento reducido se muestra un aviso rojo continuo.
- Pantallas separadas de inicio, ajustes y juego. El laberinto ocupa la pantalla durante la partida.
- Dibujo asistido y pistas automáticas configurables; se recomiendan para 3–4 años.
- Continuación del trazo después de levantar el dedo. Retrocede por tu propio recorrido para corregirlo.
- Menú de adultos mediante pulsación mantenida de 1,2 segundos. No es un bloqueo de seguridad.
- Pantalla completa al jugar cuando el navegador lo admite; en una PDI con ordenador también puedes usar F11.
- Pistas temporales, borrado del recorrido, nuevos laberintos y celebración al llegar.
- Siguiente partida automática opcional, para evitar botones durante el juego.
- Ajustes guardados en el dispositivo, sin datos personales.
- Sonidos opcionales, desactivados inicialmente; respeto por la preferencia de movimiento reducido.
- Diseño adaptable a móviles, tabletas y ordenadores. Sin cuentas, anuncios, temporizador ni servicios externos.

## Uso

Descarga el repositorio y abre `index.html` en un navegador moderno. No hace falta instalar dependencias ni conectarse a Internet.

También puedes servir esta carpeta con `python -m http.server 8000` y visitar `http://localhost:8000`.

## Jugar en tablet o PDI

El adulto elige el nivel y los ajustes antes de comenzar. En **Altura de la salida** puede situar el inicio abajo, en el centro o arriba; en **Aspecto de las paredes** puede elegir seto o ladrillo. Toca **¡Vamos a dibujar!** y dibuja desde el círculo de salida hasta el destino. Si levantas el dedo, continúa en el punto dorado. Las paredes detienen el trazo; vuelve al punto para seguir por otro camino. El personaje no se arrastra.

El juego utiliza toda el área disponible y solicita pantalla completa al empezar si está activada. La pantalla completa y el bloqueo de orientación dependen del navegador; si no se admiten, gira la tablet manualmente. El juego sigue funcionando sin ellos.

Para volver a los ajustes, mantén pulsado el engranaje de la esquina durante 1,2 segundos. Con teclado: Tab para enfocarlo y Enter para abrirlo. Las flechas dibujan el recorrido desde el extremo y Retroceso deshace un tramo.

## Netlify

El repositorio incluye `netlify.toml`: publica la carpeta raíz y no necesita comando de compilación ni dependencias.

1. Abre [Netlify](https://app.netlify.com/start) y elige importar un proyecto de GitHub.
2. Selecciona `Charlyfire/laberintos-infantiles-` y la rama `main`.
3. Deja vacío el comando de compilación; la carpeta de publicación es `.`.
4. Publica el proyecto. Netlify asignará un enlace para jugar y publicará automáticamente los siguientes cambios de `main`.

## GitHub Pages

En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda para publicar la aplicación. La publicación requiere activar esa configuración del repositorio.

## Archivos

- `index.html`: interfaz y textos en español.
- `styles.css`: diseño y adaptación de pantalla.
- `app.js`: dibujo, pantallas, ajustes, pistas y sonido.
- `maze-core.js`: generación y geometría de colisión de paredes.
- `tests/maze-core.test.cjs`: comprobaciones de conectividad, dificultad y colisiones.
- `assets/bosque.webp`: ilustración original.
- `netlify.toml`: configuración de publicación en Netlify.

## Comprobaciones

Ejecuta `node tests/maze-core.test.cjs`. Comprueba 1200 laberintos (cuatro niveles y tres alturas), paredes simétricas, conectividad, límites de dificultad, bifurcaciones con desvíos de profundidad suficiente, generación con fuentes aleatorias constantes, márgenes de colisión y bloqueos de trazos rápidos y diagonales.

Las edades son orientativas; el nivel puede elegirse según cada niño. El nivel más sencillo limita la longitud del camino y tiene casillas grandes.
