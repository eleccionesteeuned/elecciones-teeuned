// procesos.js — Módulo Firestore para procesos y votos
import { db } from "./firebase.js";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Carga todos los procesos con sus votos desde Firestore
export async function cargarProcesos() {
  const snap = await getDocs(query(collection(db, "procesos"), orderBy("createdAt", "desc")));
  const lista = [];
  for (const d of snap.docs) {
    const p = { ...d.data() };
    if (!p.candidates) p.candidates = null;
    if (!p.votedCarnets) p.votedCarnets = [];
    const votesSnap = await getDocs(collection(db, "procesos", d.id, "votos"));
    p.votes = votesSnap.docs.map(v => v.data());
    p.votedCarnets = p.votes.map(v => v.voterCarnet);
    lista.push(p);
  }
  return lista;
}

// Guarda o actualiza un proceso (sin incluir votos)
export async function guardarProceso(p) {
  const { votes, votedCarnets, ...data } = p;
  await setDoc(doc(db, "procesos", p.id), data);
}

// Registra un voto. Lanza "ya-voto" si el estudiante ya votó.
export async function registrarVoto(processId, voto) {
  const ref = doc(db, "procesos", processId, "votos", voto.voterCarnet);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error("ya-voto");
  await setDoc(ref, voto);
  await updateDoc(doc(db, "procesos", processId), {
    votedCarnets: arrayUnion(voto.voterCarnet)
  });
}

// Cierra un proceso activo
export async function cerrarProceso(processId) {
  await updateDoc(doc(db, "procesos", processId), { status: "cerrada" });
}
