# Backend de IA gratis para "Explicar con IA" (Cloudflare Workers)

Este mini-proyecto es tu backend propio: recibe una palabra desde tu app y le
pide a un modelo de lenguaje (corriendo gratis en Cloudflare) una explicación
breve de origen + significado. Tu API key/credenciales nunca quedan expuestas
en el navegador porque viven aquí, del lado del servidor.

## Requisitos

- Una cuenta gratuita de Cloudflare — no pide tarjeta de crédito:
  https://dash.cloudflare.com/sign-up
- Node.js instalado en tu computadora (para usar el CLI `wrangler`)

## Pasos para desplegar

1. **Instala Wrangler** (el CLI de Cloudflare para Workers):
   ```
   npm install -g wrangler
   ```

2. **Inicia sesión** (abre el navegador para autorizar tu cuenta):
   ```
   wrangler login
   ```

3. **Despliega**, parado dentro de esta carpeta (`cloudflare-worker-ia/`):
   ```
   wrangler deploy
   ```
   Wrangler te va a dar una URL parecida a:
   ```
   https://scrabble-ia-explicaciones.TU-USUARIO.workers.dev
   ```
   Guárdala, es la URL que necesitas para el paso siguiente.

4. **(Recomendado) Restringe quién puede llamar a tu Worker.**
   Abre `src/index.js` y cambia esta línea:
   ```js
   const ALLOWED_ORIGIN = "*";
   ```
   por el dominio real donde vayas a publicar tu app, por ejemplo:
   ```js
   const ALLOWED_ORIGIN = "https://tuapp.netlify.app";
   ```
   Vuelve a correr `wrangler deploy` para aplicar el cambio.

5. **Conecta tu app**: en `index.html`, busca la constante
   `AI_EXPLAIN_ENDPOINT` (cerca de la función `explicarConIA`) y reemplaza el
   valor de ejemplo por la URL que te dio Wrangler en el paso 3.

Con eso, el botón "🤖 Explicar con IA" del verificador de palabras ya debería
funcionar.

## Límites del plan gratis

- 10,000 "neuronas" gratis por día, sin tarjeta, se reinician a medianoche UTC.
- Con el modelo que usamos (8B), esto alcanza para cientos de explicaciones
  diarias — de sobra para este uso ocasional dentro de un juego.
- Si algún día se agota la cuota del día, el botón de IA devolverá un error
  hasta el día siguiente. El resto de la app (el verificador con Wiktionary,
  que es lo que decide si la palabra vale para jugar) sigue funcionando
  normal, porque es completamente independiente de esto.

## Una advertencia honesta sobre la IA

A diferencia de Wiktionary (una fuente de referencia), un modelo de lenguaje
puede a veces sonar muy seguro y aun así inventar datos — sobre todo en
etimologías poco comunes o palabras raras. Por eso en la app esto se muestra
como un extra de curiosidad, separado del resultado de validez: la palabra se
valida solo con Wiktionary + las reglas de Scrabble, nunca con lo que diga
esta IA.

## Sobre la seguridad

Este endpoint queda público en internet (cualquiera con la URL puede
llamarlo), igual que cualquier página web estática. Restringir `ALLOWED_ORIGIN`
al dominio de tu app evita que OTRAS páginas web lo usen desde el navegador de
sus visitantes, pero no impide que alguien lo llame directamente desde fuera
del navegador (por ejemplo con `curl`). Para un proyecto personal esto
normalmente no es un problema real; si en algún momento notas abuso, Cloudflare
permite agregar reglas de "Rate Limiting" gratis desde su panel de control.
