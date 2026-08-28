// mociones.js — Módulo Firestore para Mociones (orden/forma/fondo)
//
// Cualquier votante puede presentar una moción; TEEUNED/Fiscalía la
// discuten (subcolección "discusion") y TEEUNED puede convertirla en un
// proceso electoral (procesos.js) o descartarla. Ver firestore.rules para
// el modelo de permisos.
import { db } from "./firebase.js";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Orden de prioridad parlamentaria: orden > forma > fondo.
export const PRIORIDAD_MOCION = { orden: 1, forma: 2, fondo: 3 };

export const TIPOS_MOCION = [
  { id: "orden", label: "Moción de Orden", desc: "Corrige o encauza de inmediato el procedimiento de la sesión." },
  { id: "forma", label: "Moción de Forma", desc: "Modifica la manera en que se tramita, discute o presenta el asunto." },
  { id: "fondo", label: "Moción de Fondo", desc: "Resuelve el contenido sustantivo sometido a consideración." },
];

// Carga todas las mociones con su hilo de discusión, ordenadas por
// prioridad (orden→forma→fondo) y, dentro de cada tipo, por orden de
// presentación (más antigua primero).
export async function cargarMociones() {
  const snap = await getDocs(query(collection(db, "mociones"), orderBy("createdAt", "asc")));
  const lista = [];
  for (const d of snap.docs) {
    const m = { id: d.id, ...d.data() };
    const discSnap = await getDocs(query(collection(db, "mociones", d.id, "discusion"), orderBy("createdAt", "asc")));
    m.discusion = discSnap.docs.map((x) => x.data());
    lista.push(m);
  }
  lista.sort((a, b) => (PRIORIDAD_MOCION[a.tipo] || 9) - (PRIORIDAD_MOCION[b.tipo] || 9) || (a.createdAt || "").localeCompare(b.createdAt || ""));
  return lista;
}

export async function presentarMocion(m) {
  await setDoc(doc(db, "mociones", m.id), m);
}

// Interruptor general: si está apagado, nadie puede presentar mociones
// nuevas (validado también en firestore.rules — la regla de creación lee
// este mismo documento, así que no basta con ocultar el formulario en la
// UI). Las mociones ya presentadas y su discusión siguen visibles siempre.
export async function getMocionesConfig() {
  const snap = await getDoc(doc(db, "config", "mocionesConfig"));
  return { enabled: snap.exists() ? snap.data().enabled !== false : true };
}
export async function setMocionesEnabled(enabled) {
  await setDoc(doc(db, "config", "mocionesConfig"), { enabled });
}

export async function agregarComentarioMocion(mocionId, comentario) {
  const ref = doc(collection(db, "mociones", mocionId, "discusion"));
  await setDoc(ref, comentario);
}

export async function descartarMocion(mocionId, nota) {
  await updateDoc(doc(db, "mociones", mocionId), { status: "descartada", discardNote: nota || "" });
}

export async function convertirMocion(mocionId, processId, processType) {
  await updateDoc(doc(db, "mociones", mocionId), { status: "convertida", linkedProcessId: processId, linkedProcessType: processType });
}
