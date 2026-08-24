// firebase.js
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyALYV5C9IiXxxQRUOy167wZoHS0E7x7OoU",
  authDomain: "teeuned-votacion.firebaseapp.com",
  projectId: "teeuned-votacion",
  storageBucket: "teeuned-votacion.firebasestorage.app",
  messagingSenderId: "301132119065",
  appId: "1:301132119065:web:58b4083498054849a5be88"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Crea una cuenta de Firebase Auth para un estudiante SIN afectar la sesión
// activa del administrador TEEUNED. createUserWithEmailAndPassword() en la
// app principal inicia sesión automáticamente como el usuario nuevo, lo cual
// cerraría la sesión del admin — por eso se usa una segunda instancia de
// Firebase App (nombrada, efímera) solo para este propósito, y se destruye
// al terminar. La sesión del admin en la app principal nunca se toca.
// Devuelve el UID del nuevo usuario. Lanza el error de Firebase Auth tal cual
// (p.ej. auth/email-already-in-use) para que el llamador lo maneje.
export async function createStudentAuthAccount(email, password) {
  const secondaryApp = initializeApp(
    firebaseConfig,
    "secondary-" + Date.now() + "-" + Math.random().toString(36).slice(2)
  );
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp).catch(() => {});
  }
}
