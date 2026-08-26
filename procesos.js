// procesos.js — Módulo Firestore para procesos y votos
import { db } from "./firebase.js";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy
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
// No actualiza "votedCarnets" en el documento del proceso: ese campo se
// recalcula siempre desde la subcolección "votos" en cargarProcesos(), y
// los estudiantes no tienen (ni necesitan) permiso para escribir en el
// documento del proceso — solo TEEUNED puede.
export async function registrarVoto(processId, voto) {
  const ref = doc(db, "procesos", processId, "votos", voto.voterCarnet);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error("ya-voto");
  await setDoc(ref, voto);
}

// Cierra un proceso activo
export async function cerrarProceso(processId) {
  await updateDoc(doc(db, "procesos", processId), { status: "cerrada" });
}

// Formatea una duración en milisegundos como "1d 3h", "2h 15m", "5m 30s" o
// "12s". Usado tanto para el reloj de "activa desde hace..." como para el
// cronómetro de cierre ("cierra en...").
export function formatDuration(ms) {
  const neg = ms < 0;
  ms = Math.abs(ms);
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  let out;
  if (d > 0) out = `${d}d ${h}h`;
  else if (h > 0) out = `${h}h ${m}m`;
  else if (m > 0) out = `${m}m ${s}s`;
  else out = `${s}s`;
  return neg ? "-" + out : out;
}

// Arranca (una sola vez por página) un intervalo de 1s que actualiza todos
// los elementos [data-since] (reloj de tiempo activo, desde createdAt) y
// [data-ends] (cronómetro de cierre, hasta endsAt) presentes en el DOM.
// Se apoya en atributos data-* en vez de recibir una lista de procesos para
// no tener que re-renderizar tarjetas completas cada segundo (perdería el
// estado abierto/cerrado de los grupos por fecha).
export function startTickers() {
  if (window.__teeTickerStarted) return;
  window.__teeTickerStarted = true;
  const tick = () => {
    const now = Date.now();
    document.querySelectorAll("[data-since]").forEach((el) => {
      const since = new Date(el.dataset.since).getTime();
      if (isNaN(since)) return;
      el.textContent = "⏱ Activa desde hace " + formatDuration(now - since);
    });
    document.querySelectorAll("[data-ends]").forEach((el) => {
      const ends = new Date(el.dataset.ends).getTime();
      if (isNaN(ends)) return;
      const diff = ends - now;
      if (diff <= 0) {
        el.textContent = "⚠ Tiempo agotado";
        el.classList.add("countdown-expired");
        el.classList.remove("countdown-warn");
      } else {
        el.textContent = "⏳ Cierra en " + formatDuration(diff);
        el.classList.toggle("countdown-warn", diff < 5 * 60 * 1000);
      }
    });
  };
  tick();
  setInterval(tick, 1000);
}

// Agrupa procesos por día de creación (fecha local), más reciente primero.
// Usado por los 3 paneles (TEEUNED/Fiscalía/Estudiantil) para que la lista
// de procesos no se sature — se colapsan por día en vez de mostrarse todos
// juntos, y el filtro de fecha se apoya en la misma clave (YYYY-MM-DD).
export function groupByDay(processes) {
  const groups = new Map();
  for (const p of processes) {
    const d = new Date(p.createdAt);
    const key = isNaN(d) ? "sin-fecha" : d.toLocaleDateString("en-CA");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({
      key,
      label: key === "sin-fecha" ? "Sin fecha" : new Date(key + "T00:00:00").toLocaleDateString("es-CR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      items,
    }));
}
