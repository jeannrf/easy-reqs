// Utilidades para las pruebas de aceptación: acceso directo a los emuladores.
import { readFileSync } from 'node:fs';

const PROYECTO = 'demo-easy-reqs';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROYECTO}/databases/(default)/documents`;
const AUTH = 'http://127.0.0.1:9099';
const COMO_DUENO = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }; // ignora las reglas

export const { preguntas } = JSON.parse(readFileSync(new URL('../../public/config/preguntas.json', import.meta.url), 'utf8'));
export const textos = JSON.parse(readFileSync(new URL('../../public/config/textos.json', import.meta.url), 'utf8'));

export async function limpiarEmuladores() {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`${AUTH}/emulator/v1/projects/${PROYECTO}/accounts`, { method: 'DELETE' });
}

export async function listarEnvios() {
  const r = await (await fetch(`${FIRESTORE}/envios`, { headers: COMO_DUENO })).json();
  return (r.documents ?? []).map((d) => ({
    numero: Number(d.fields.numero.integerValue),
    nombre: d.fields.nombre.stringValue,
    recibido: d.fields.recibido.timestampValue,
  }));
}

export async function crearEnvio(numero, nombre, correo, respuestas) {
  const campos = Object.fromEntries(preguntas.map((p) => [p.id, { stringValue: respuestas[p.id] ?? '' }]));
  const cuerpo = {
    fields: {
      numero: { integerValue: String(numero) },
      recibido: { timestampValue: new Date().toISOString() },
      nombre: { stringValue: nombre },
      correo: { stringValue: correo },
      dispositivo: { stringValue: crypto.randomUUID() },
      respuestas: { mapValue: { fields: campos } },
    },
  };
  await fetch(`${FIRESTORE}/envios?documentId=${crypto.randomUUID()}`, { method: 'POST', headers: COMO_DUENO, body: JSON.stringify(cuerpo) });
}

export async function crearCuenta(correo, clave, { analista }) {
  const r = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: clave, returnSecureToken: true }),
  })).json();
  if (analista) {
    await fetch(`${FIRESTORE}/analistas?documentId=${r.localId}`, { method: 'POST', headers: COMO_DUENO, body: JSON.stringify({ fields: {} }) });
  }
  return r.localId;
}

// Respuestas válidas: todas las obligatorias con texto.
export function respuestasCompletas(cambios = {}) {
  const r = Object.fromEntries(preguntas.filter((p) => p.required).map((p) => [p.id, `Respuesta a ${p.id}`]));
  return { ...r, ...cambios };
}

// Carga un borrador en el dispositivo y abre el formulario (por defecto, en el último paso).
export async function abrirConBorrador(page, { nombre = 'Ana Pérez', correo = 'ana@correo.com', respuestas = respuestasCompletas(), paso = 8 } = {}) {
  // Se escribe desde otra página del mismo origen: el formulario guarda su estado
  // al cerrarse (pagehide) y sobrescribiría el borrador.
  await page.goto('/config/textos.json');
  await page.evaluate((b) => localStorage.setItem('easyreqs.borrador.v1', JSON.stringify(b)), { nombre, correo, respuestas, paso, idEnvio: null });
  await page.goto('/');
  await page.locator('#siguiente').waitFor();
}
