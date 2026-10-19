// Genera firestore.rules a partir de firestore.rules.plantilla y
// public/config/preguntas.json y public/config/analista.json (DR-001, NFR-012).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MAX_RESPUESTA, PATRON_CORREO } from '../public/js/validacion.js';

export const ESPERA_SEGUNDOS = 60;
const raiz = new URL('../', import.meta.url);

export function generarReglas() {
  const plantilla = readFileSync(new URL('firestore.rules.plantilla', raiz), 'utf8');
  const { preguntas } = JSON.parse(readFileSync(new URL('public/config/preguntas.json', raiz), 'utf8'));
  const { correo } = JSON.parse(readFileSync(new URL('public/config/analista.json', raiz), 'utf8'));
  if (!/^[^@\s'\\]+@[^@\s'\\]+$/.test(correo)) throw new Error(`correo de analista inválido: ${correo}`);
  for (const p of preguntas) {
    if (!/^[A-Za-z0-9_-]+$/.test(p.id)) throw new Error(`id de pregunta inválido: ${p.id}`);
  }
  const ids = `[${preguntas.map((p) => `'${p.id}'`).join(', ')}]`;
  const chequeos = preguntas
    .map(({ id, required }) => {
      const v = `r['${id}']`;
      return `${v} is string && ${v}.size() <= ${MAX_RESPUESTA}${required ? ` && ${v}.trim().size() > 0` : ''}`;
    })
    .join('\n        && ');
  const cabecera = '// ARCHIVO GENERADO por scripts/generar-reglas.mjs. No editar a mano:\n// cambia firestore.rules.plantilla o public/config/*.json.\n';
  return cabecera + plantilla
    .replaceAll('{{IDS}}', ids)
    .replace('{{CHEQUEOS}}', chequeos)
    .replace('{{CANTIDAD}}', String(preguntas.length))
    .replaceAll('{{MAX_RESPUESTA}}', String(MAX_RESPUESTA))
    .replace('{{PATRON_CORREO}}', PATRON_CORREO.replaceAll('\\', '\\\\'))
    .replace('{{ESPERA_SEGUNDOS}}', String(ESPERA_SEGUNDOS))
    .replace('{{CORREO_ANALISTA}}', correo.toLowerCase());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('firestore.rules', raiz), generarReglas());
  console.log('firestore.rules generado');
}
