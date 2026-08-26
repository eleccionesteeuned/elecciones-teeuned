// netlify/functions/set-student-scope.js
//
// Asigna la Sede (y su Región, derivada del catálogo config/aurCatalog) de
// un estudiante como custom claims de Firebase Auth. Las reglas de
// Firestore usan request.auth.token.sede/region para decidir qué
// Votaciones AUR puede leer/votar cada estudiante — por eso esto tiene que
// hacerse con Admin SDK (el cliente no puede fijar sus propios claims) y la
// región se resuelve aquí, en el servidor, a partir del catálogo — nunca la
// envía el cliente — para que Sede y Región nunca queden inconsistentes.
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

  const uids = Array.isArray(body.updates) ? body.updates : (body.uid ? [{ uid: body.uid, sede: body.sede || null }] : []);
  if (!uids.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta uid/sede o updates: [{uid, sede}]." }) };
  }

  let sedeToRegion = {};
  try {
    const catalogSnap = await admin.firestore().doc("config/aurCatalog").get();
    const sedes = (catalogSnap.exists && catalogSnap.data().sedes) || [];
    sedes.forEach((s) => { if (s && s.name) sedeToRegion[s.name] = s.region || null; });
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Error leyendo el catálogo de sedes: " + e.message }) };
  }

  const results = await Promise.all(
    uids.map(async ({ uid, sede }) => {
      if (!uid) return { uid, ok: false, error: "Falta uid." };
      const cleanSede = sede || null;
      const region = cleanSede ? (sedeToRegion[cleanSede] || null) : null;
      try {
        await admin.auth().setCustomUserClaims(uid, { sede: cleanSede, region });
        return { uid, ok: true, sede: cleanSede, region };
      } catch (e) {
        return { uid, ok: false, error: e.message };
      }
    })
  );

  return { statusCode: 200, body: JSON.stringify({ results }) };
};
