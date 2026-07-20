/**
 * Backend gratuito para "Explicar con IA" del marcador de Scrabble.
 *
 * Recibe una palabra y le pide a un modelo de lenguaje (corriendo gratis en
 * Cloudflare Workers AI) una explicación breve: origen + significado.
 *
 * IMPORTANTE: esto es solo un extra de curiosidad/cultura general. La
 * validez de la palabra para jugar Scrabble sigue decidiéndose SOLO con
 * Wiktionary + las reglas de la app (esta IA puede a veces equivocarse
 * o "inventar" datos, especialmente en etimologías poco comunes).
 */

// TODO: cambia esto por el dominio real donde publiques tu app
// (por ejemplo "https://tuapp.netlify.app"). Mientras tanto, "*" deja
// que cualquier página pueda llamar a tu Worker desde el navegador.
const ALLOWED_ORIGIN = "https://monse6789te-maker.github.io/Contador-Scrabble/";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Método no permitido. Usa POST." }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: "Cuerpo JSON inválido." }, 400);
    }

    const palabra = (body && body.palabra ? String(body.palabra) : "").trim().toLowerCase();

    // Validación básica: solo letras del español, longitud razonable.
    if (!palabra || palabra.length > 25 || !/^[a-záéíóúüñ]+$/i.test(palabra)) {
      return jsonResponse({ error: "Palabra inválida." }, 400);
    }

    try {
      const respuesta = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que explica palabras del español de forma extremadamente breve " +
              "para un juego de Scrabble. Responde en máximo 2 o 3 frases cortas: primero el origen " +
              "etimológico si lo conoces (idioma de origen y significado literal), y después qué " +
              "significa la palabra en español actual. Si no reconoces la palabra o no estás seguro " +
              "de su origen, dilo explícitamente en vez de inventar información. No agregues " +
              "introducciones, saludos ni texto de relleno: responde solo con la explicación.",
          },
          { role: "user", content: `Palabra: ${palabra}` },
        ],
        max_tokens: 150,
      });

      const texto = respuesta && respuesta.response ? String(respuesta.response).trim() : "";
      if (!texto) throw new Error("Respuesta vacía del modelo");

      return jsonResponse({ explicacion: texto });
    } catch (e) {
      return jsonResponse(
        { error: "No se pudo generar la explicación en este momento. Intenta de nuevo." },
        502
      );
    }
  },
};
