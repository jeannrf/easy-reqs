// Validación del lado del servidor (NFR-008, DES-003) contra el emulador de Firestore.
// Ejecutar con: npm run test:emuladores
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';

const leer = (ruta) => readFileSync(new URL(`../../${ruta}`, import.meta.url), 'utf8');
const { preguntas } = JSON.parse(leer('public/config/preguntas.json'));

let entorno;

before(async () => {
  entorno = await initializeTestEnvironment({
    projectId: 'demo-easy-reqs-reglas',
    firestore: { rules: leer('firestore.rules'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => entorno?.cleanup());
beforeEach(() => entorno.clearFirestore());

const anonimo = () => entorno.unauthenticatedContext().firestore();

function respuestasValidas(cambios = {}) {
  const r = Object.fromEntries(preguntas.map((p) => [p.id, p.required ? 'respuesta' : '']));
  return { ...r, ...cambios };
}

function datosValidos(cambios = {}) {
  return { nombre: 'Ana', correo: 'ana@correo.com', respuestas: respuestasValidas(), ...cambios };
}

// Misma lógica que public/js/servicio.js#enviar.
function enviar(db, datos, { idEnvio = randomUUID(), dispositivo = randomUUID(), envio = {} } = {}) {
  return runTransaction(db, async (tx) => {
    const recibo = await tx.get(doc(db, 'recibos', idEnvio));
    if (recibo.exists()) return recibo.data().numero;
    const contador = await tx.get(doc(db, 'contadores', 'envios'));
    const numero = (contador.exists() ? contador.data().n : 0) + 1;
    tx.set(doc(db, 'contadores', 'envios'), { n: numero, ultimoId: idEnvio });
    tx.set(doc(db, 'envios', idEnvio), {
      numero, recibido: serverTimestamp(), dispositivo, ...datos, ...envio,
    });
    tx.set(doc(db, 'recibos', idEnvio), { numero });
    tx.set(doc(db, 'dispositivos', dispositivo), { ultimo: serverTimestamp() });
    return numero;
  });
}

// Igual que servicio.js: reintenta si otra transacción ganó la carrera por el contador.
async function enviarConReintentos(db, datos, intentos = 5) {
  for (let i = 1; ; i++) {
    try {
      return await enviar(db, datos);
    } catch (error) {
      if (!['permission-denied', 'aborted', 'failed-precondition'].includes(error?.code) || i >= intentos) throw error;
      await new Promise((r) => setTimeout(r, 150 * i + Math.random() * 250));
    }
  }
}

async function contarEnvios() {
  let n;
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    n = (await getDocs(collection(ctx.firestore(), 'envios'))).size;
  });
  return n;
}

const { correo: CORREO_ANALISTA } = JSON.parse(leer('public/config/analista.json'));
const cuenta = (uid, correo, verificado = true) =>
  entorno.authenticatedContext(uid, { email: correo, email_verified: verificado }).firestore();
const analista = () => cuenta('analista1', CORREO_ANALISTA);

test('FR-011: un envío válido se guarda con número correlativo y fecha del servidor', async () => {
  const db = anonimo();
  assert.equal(await assertSucceeds(enviar(db, datosValidos())), 1);
  assert.equal(await assertSucceeds(enviar(db, datosValidos())), 2);
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const todos = (await getDocs(collection(ctx.firestore(), 'envios'))).docs.map((d) => d.data());
    assert.deepEqual(todos.map((e) => e.numero).sort(), [1, 2]);
    assert.ok(todos.every((e) => e.recibido instanceof Timestamp));
  });
});

test('FR-008: reintentar el mismo envío no lo duplica y devuelve el mismo número', async () => {
  const db = anonimo();
  const idEnvio = randomUUID();
  const dispositivo = randomUUID();
  assert.equal(await enviar(db, datosValidos(), { idEnvio, dispositivo }), 1);
  assert.equal(await enviar(db, datosValidos(), { idEnvio, dispositivo }), 1);
  assert.equal(await contarEnvios(), 1);
});

test('FR-011: envíos simultáneos reciben números distintos', async () => {
  const numeros = await Promise.all(Array.from({ length: 5 }, () => enviarConReintentos(anonimo(), datosValidos())));
  assert.deepEqual([...numeros].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test('FR-006: el servidor rechaza un correo con formato inválido', async () => {
  await assertFails(enviar(anonimo(), datosValidos({ correo: 'ana@correo' })));
  await assertFails(enviar(anonimo(), datosValidos({ correo: 'ana correo.com' })));
});

test('FR-003: el servidor rechaza nombre vacío', async () => {
  await assertFails(enviar(anonimo(), datosValidos({ nombre: '   ' })));
});

test('FR-005: el servidor rechaza una obligatoria vacía y acepta opcionales vacías', async () => {
  await assertFails(enviar(anonimo(), datosValidos({ respuestas: respuestasValidas({ 'QB-01': '  ' }) })));
  await assertSucceeds(enviar(anonimo(), datosValidos({ respuestas: respuestasValidas({ 'QB-03': '' }) })));
});

test('FR-004, DR-003: respuestas de texto de hasta 5000 caracteres', async () => {
  await assertSucceeds(enviar(anonimo(), datosValidos({ respuestas: respuestasValidas({ 'QB-03': 'x'.repeat(5000) }) })));
  await assertFails(enviar(anonimo(), datosValidos({ respuestas: respuestasValidas({ 'QB-03': 'x'.repeat(5001) }) })));
  await assertFails(enviar(anonimo(), datosValidos({ respuestas: respuestasValidas({ 'QB-03': 1500 }) })));
});

test('DR-002, DR-005: no se aceptan campos ni preguntas que no estén en la configuración', async () => {
  await assertFails(enviar(anonimo(), datosValidos({ telefono: '999' })));
  await assertFails(enviar(anonimo(), datosValidos({ respuestas: respuestasValidas({ 'QB-99': 'x' }) })));
  const sinUna = respuestasValidas();
  delete sinUna['QB-33'];
  await assertFails(enviar(anonimo(), datosValidos({ respuestas: sinUna })));
});

test('FR-011: no se puede falsear el número ni la fecha', async () => {
  await assertFails(enviar(anonimo(), datosValidos(), { envio: { numero: 50 } }));
  await assertFails(enviar(anonimo(), datosValidos(), { envio: { recibido: Timestamp.fromDate(new Date('2020-01-01')) } }));
  const id = randomUUID();
  await assertFails(setDoc(doc(anonimo(), 'envios', id), {
    numero: 1, recibido: serverTimestamp(), dispositivo: randomUUID(), ...datosValidos(),
  }));
  await assertFails(setDoc(doc(anonimo(), 'contadores', 'envios'), { n: 10, ultimoId: id }));
});

test('FR-014: nadie puede editar ni borrar un envío', async () => {
  const idEnvio = randomUUID();
  await enviar(anonimo(), datosValidos(), { idEnvio });
  for (const db of [anonimo(), analista()]) {
    await assertFails(updateDoc(doc(db, 'envios', idEnvio), { nombre: 'Otro' }));
    await assertFails(deleteDoc(doc(db, 'envios', idEnvio)));
  }
});

test('FR-013: sin autorización no se puede leer ningún envío', async () => {
  const idEnvio = randomUUID();
  await enviar(anonimo(), datosValidos(), { idEnvio });
  const sinPermiso = [
    anonimo(),
    entorno.authenticatedContext('intruso').firestore(),
    cuenta('otro', 'otro@correo.com'),
    cuenta('falso', CORREO_ANALISTA, false), // mismo correo, pero sin verificar
  ];
  for (const db of sinPermiso) {
    await assertFails(getDocs(collection(db, 'envios')));
    await assertFails(getDoc(doc(db, 'envios', idEnvio)));
  }
});

test('FR-012, FR-013: un analista autorizado lee todos los envíos', async () => {
  await enviar(anonimo(), datosValidos());
  await enviar(anonimo(), datosValidos({ nombre: 'Luis' }));
  const db = analista();
  const lista = await assertSucceeds(getDocs(collection(db, 'envios')));
  assert.equal(lista.size, 2);
});

test('NFR-009: un mismo dispositivo no puede enviar dos veces dentro de un minuto', async () => {
  const dispositivo = randomUUID();
  await assertSucceeds(enviar(anonimo(), datosValidos(), { dispositivo }));
  await assertFails(enviar(anonimo(), datosValidos(), { dispositivo }));
  await assertSucceeds(enviar(anonimo(), datosValidos(), { dispositivo: randomUUID() }));
});
