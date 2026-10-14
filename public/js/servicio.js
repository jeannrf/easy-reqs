// Acceso a Firebase. Se carga solo cuando hace falta (al enviar o en la vista del
// analista) para que la primera pantalla del formulario sea liviana (NFR-005).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getFirestore, connectFirestoreEmulator, doc, collection, query, orderBy,
  runTransaction, getDocs, getDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import {
  getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { firebaseConfig, usarEmuladores, proyectoEmulador } from './firebase-config.js';

const app = initializeApp(usarEmuladores
  ? { apiKey: 'demo', projectId: proyectoEmulador }
  : firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
if (usarEmuladores) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

const TIEMPO_MAXIMO_MS = 20000;

/**
 * Guarda un envío y devuelve su número de referencia (FR-011).
 * Es idempotente por idEnvio: si se reintenta un envío que ya llegó,
 * devuelve el mismo número sin duplicarlo (FR-008).
 */
export async function enviar(datos) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(Object.assign(new Error('tiempo agotado'), { code: 'unavailable' })), TIEMPO_MAXIMO_MS);
  });
  try {
    return await Promise.race([enviarConReintentos(datos), limite]);
  } finally {
    clearTimeout(temporizador);
  }
}

// Si dos personas envían a la vez, las reglas pueden evaluar el contador ya
// cambiado y rechazar con permission-denied en lugar de reintentar. Reintentar
// es seguro porque el envío es idempotente por idEnvio.
async function enviarConReintentos(datos, intentos = 5) {
  for (let i = 1; ; i++) {
    try {
      return await transaccionEnvio(datos);
    } catch (error) {
      const reintentable = ['permission-denied', 'aborted', 'failed-precondition'].includes(error?.code);
      if (!reintentable || i >= intentos) throw error;
      await new Promise((r) => setTimeout(r, 150 * i + Math.random() * 250));
    }
  }
}

function transaccionEnvio({ idEnvio, dispositivo, nombre, correo, respuestas }) {
  const contadorRef = doc(db, 'contadores', 'envios');
  const reciboRef = doc(db, 'recibos', idEnvio);
  return runTransaction(db, async (tx) => {
    const recibo = await tx.get(reciboRef);
    if (recibo.exists()) return recibo.data().numero;
    const contador = await tx.get(contadorRef);
    const numero = (contador.exists() ? contador.data().n : 0) + 1;
    tx.set(contadorRef, { n: numero, ultimoId: idEnvio });
    tx.set(doc(db, 'envios', idEnvio), {
      numero, recibido: serverTimestamp(), nombre, correo, dispositivo, respuestas,
    });
    tx.set(reciboRef, { numero });
    tx.set(doc(db, 'dispositivos', dispositivo), { ultimo: serverTimestamp() });
    return numero;
  });
}

// --- Analista (FR-012, FR-013) ---

export function alCambiarSesion(callback) {
  return onAuthStateChanged(auth, callback);
}

export function ingresar(correo, clave) {
  return signInWithEmailAndPassword(auth, correo, clave);
}

export function salir() {
  return signOut(auth);
}

export async function esAnalista(uid) {
  try {
    return (await getDoc(doc(db, 'analistas', uid))).exists();
  } catch {
    return false;
  }
}

export async function listarEnvios() {
  const resultado = await getDocs(query(collection(db, 'envios'), orderBy('numero')));
  return resultado.docs.map((d) => {
    const datos = d.data();
    return { ...datos, id: d.id, recibido: datos.recibido?.toDate() ?? null };
  });
}
