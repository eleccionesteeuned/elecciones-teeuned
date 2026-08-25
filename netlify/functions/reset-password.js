// netlify/functions/reset-password.js
//
// Cambia la contraseña de una o varias cuentas de Firebase Auth de
// estudiantes. El SDK de cliente no puede cambiar la contraseña de OTRO
// usuario (solo la propia, estando esa sesión activa) — por eso se
// necesita Admin SDK, igual que en delete-student.js.
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

// Mismo UID hardcodeado que en firestore.rules (isTeeuned()).
const TEEUNED_UID = "BoQ0s3unG2ZCd5k4nvWQnrzvvVB3";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido." }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const idToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!idToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Falta token de autenticación." }) };
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: "Token inválido." }) };
  }

  if (decoded.uid !== TEEUNED_UID) {
    return { statusCode: 403, body: JSON.stringify({ error: "No autorizado." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido." }) };
  }

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (!updates.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta updates: [{uid, password}]." }) };
  }

  const results = await Promise.all(
    updates.map(async ({ uid, password }) => {
      if (!uid || !password || password.length < 6) {
        return { uid, ok: false, error: "uid o password inválido (mín. 6 caracteres)." };
      }
      try {
        await admin.auth().updateUser(uid, { password });
        return { uid, ok: true };
      } catch (e) {
        return { uid, ok: false, error: e.message };
      }
    })
  );

  return { statusCode: 200, body: JSON.stringify({ results }) };
};
