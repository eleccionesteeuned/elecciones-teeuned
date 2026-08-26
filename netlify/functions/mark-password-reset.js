// netlify/functions/mark-password-reset.js
//
// Refresca passwordSetAt en padron/{carnet} cuando un estudiante solicita
// "¿Olvidó su contraseña?" desde index.html. Necesario porque esa acción
// ocurre ANTES de iniciar sesión (sendPasswordResetEmail no requiere auth)
// y las reglas de Firestore solo permiten escribir en /padron a TEEUNED —
// el cliente no puede refrescar el timestamp por sí mismo. Se usa Admin SDK
// para saltarse esa restricción solo para este campo.
//
// El timestamp se refresca al momento de la SOLICITUD, no de la
// confirmación (Firebase no expone un hook para esta app 100% cliente sin
// un actionCodeSettings/handler propio) — es una aproximación optimista:
// si el estudiante no completa el reseteo en 24h, su siguiente intento de
// login simplemente lo vuelve a bloquear y puede solicitar de nuevo.
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido." }) };
  }

  const carnet = (body.carnet || "").trim();
  if (!/^\d{4,12}$/.test(carnet)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Carnet inválido." }) };
  }

  try {
    const ref = admin.firestore().collection("padron").doc(carnet);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.set({ passwordSetAt: Date.now() }, { merge: true });
    }
  } catch (e) {
    console.error("mark-password-reset:", e);
  }

  // Respuesta genérica siempre — no revela si el carnet existe.
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
