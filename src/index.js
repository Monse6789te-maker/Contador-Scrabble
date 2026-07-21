const ALLOWED_ORIGIN = "https://monse6789te-maker.github.io";

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
      const respuesta = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          {
            role: "system",
            content: "Responde únicamente en español. Da una explicación muy breve (máximo 2 frases). No expliques tu razonamiento.",
          },
          {
            role: "user",
            content: `Palabra: ${palabra}`,
          },
        ],
        max_tokens: 1024,
      });
      console.log(JSON.stringify(respuesta, null, 2));
      const texto = respuesta && respuesta.response
          ? String(respuesta.response).trim()
          : "";

      if (!texto) throw new Error("Respuesta vacía del modelo");

      return jsonResponse({
        explicacion: texto
      });

    } catch (e) {
      console.error(e);

      return jsonResponse({
          error: String(e.message || e),
          stack: String(e.stack || "")
      }, 500);
    }
  } // <-- Aquí cierra la función fetch
}; // <-- Aquí cierra el objeto export default
