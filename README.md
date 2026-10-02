# El bosque de los laberintos

Aplicación infantil en HTML, CSS y JavaScript para generar y jugar laberintos, con una ilustración original de cuento.

- Cuatro dificultades orientativas: 3, 4, 5 y 6–7 años.
- Aventuras en el bosque, el océano y el espacio.
- Laberintos nuevos generados aleatoriamente, siempre con solución.
- Movimiento con teclado, botones, clics y arrastre táctil. Las paredes bloquean el paso.
- Pistas temporales, reinicio de la misma partida y celebración al llegar.
- Sonidos opcionales, desactivados inicialmente; respeto por la preferencia de movimiento reducido.
- Diseño adaptable a móviles, tabletas y ordenadores. Sin cuentas, anuncios, temporizador ni servicios externos.

## Uso

Descarga el repositorio y abre `index.html` en un navegador moderno. No hace falta instalar dependencias ni conectarse a Internet.

También puedes servir esta carpeta con `python -m http.server 8000` y visitar `http://localhost:8000`.

## GitHub Pages

En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda para publicar la aplicación. La publicación requiere activar esa configuración del repositorio.

## Archivos

- `index.html`: interfaz y textos en español.
- `styles.css`: diseño y adaptación de pantalla.
- `app.js`: generación, juego, pistas y sonido.
- `assets/bosque.webp`: ilustración original.

Las edades son orientativas; el nivel puede elegirse según cada niño. El nivel más sencillo limita la longitud del camino y tiene casillas grandes.
