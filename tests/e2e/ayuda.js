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

export const correoAnalista = JSON.parse(readFileSync(new URL('../../public/config/analista.json', import.meta.url), 'utf8')).correo;

// Crea en el emulador de Auth una cuenta de Google con el correo verificado, como en producción.
async function crearCuentaGoogle(correo) {
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestUri: 'http://localhost',
      returnSecureToken: true,
      postBody: `providerId=google.com&id_token=${encodeURIComponent(JSON.stringify({ sub: correo, email: correo, email_verified: true }))}`,
    }),
  });
}

// Inicia sesión con Google en el emulador de Auth eligiendo la cuenta con ese correo.
export async function ingresarConGoogle(page, correo) {
  await crearCuentaGoogle(correo);
  const [ventana] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: textos.analista.ingresar }).click(),
  ]);
  await ventana.waitForLoadState('load'); // antes de esto, el clic no hace nada
  await ventana.getByText(correo).click();
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
