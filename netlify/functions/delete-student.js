// netlify/functions/delete-student.js
//
// Borra la cuenta de Firebase Auth de un estudiante cuando TEEUNED lo
// elimina del padrón. El SDK de cliente (firebase.js) NO puede borrar
// cuentas de otros usuarios — solo el Admin SDK puede, y este requiere
// un backend. Esta función sirve ese propósito puntual, sin necesitar
// pasar el proyecto de Firebase a plan de pago (Netlify Functions es
// gratis dentro de límites generosos).
//
// Sin esto: al eliminar un estudiante del padrón solo se borraba su
// documento en Firestore, pero su cuenta de Auth quedaba huérfana, y
// volver a agregarlo con el mismo correo fallaba con
// "auth/email-already-in-use".
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

  const uids = Array.isArray(body.uids) ? body.uids : (body.uid ? [body.uid] : []);
  const emails = Array.isArray(body.emails) ? body.emails : (body.email ? [body.email] : []);
  if (!uids.length && !emails.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta uid(s) o email(s)." }) };
  }

  const results = await Promise.all(
    uids.map(async (uid) => {
      try {
        await admin.auth().deleteUser(uid);
        return { uid, ok: true };
      } catch (e) {
        if (e.code === "auth/user-not-found") return { uid, ok: true, note: "ya no existía" };
        return { uid, ok: false, error: e.message };
      }
    })
  );

  // Limpieza de cuentas huérfanas de ANTES de este arreglo: no tenemos su
  // UID (el documento del padrón que lo guardaba ya fue borrado), pero sí
  // el correo, y Admin SDK puede resolver UID -> correo.
  const emailResults = await Promise.all(
    emails.map(async (email) => {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(user.uid);
        return { email, ok: true };
      } catch (e) {
        if (e.code === "auth/user-not-found") return { email, ok: true, note: "ya no existía" };
        return { email, ok: false, error: e.message };
      }
    })
  );

  return { statusCode: 200, body: JSON.stringify({ results: results.concat(emailResults) }) };
};
