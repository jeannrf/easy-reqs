// DR-001, NFR-011, NFR-012: banco de preguntas y textos como configuración.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generarReglas } from '../../scripts/generar-reglas.mjs';

const leer = (ruta) => readFileSync(new URL(`../../${ruta}`, import.meta.url), 'utf8');
const { secciones, preguntas } = JSON.parse(leer('public/config/preguntas.json'));

test('DR-001: el banco tiene las 33 preguntas de la sección 7 del SRS, 13 obligatorias', () => {
  assert.equal(preguntas.length, 33);
  assert.equal(preguntas.filter((p) => p.required).length, 13);
  assert.deepEqual(preguntas.map((p) => p.id), Array.from({ length: 33 }, (_, i) => `QB-${String(i + 1).padStart(2, '0')}`));
});

test('DR-001: cada pregunta tiene sección, texto, ayuda, ejemplo y obligatoria', () => {
  const ids = new Set(secciones.map((s) => s.id));
  assert.equal(secciones.length, 8);
  for (const p of preguntas) {
    assert.ok(ids.has(p.section), `${p.id}: sección desconocida ${p.section}`);
    assert.equal(typeof p.label, 'string');
    assert.ok(p.label.length > 0);
    assert.equal(typeof p.help, 'string');
    assert.equal(typeof p.example, 'string');
    assert.equal(typeof p.required, 'boolean');
  }
});

test('NFR-011: los textos de la interfaz están en un solo archivo de configuración', () => {
  const textos = JSON.parse(leer('public/config/textos.json'));
  for (const clave of ['titulo', 'contacto', 'botones', 'errores', 'envio', 'analista']) assert.ok(textos[clave], clave);
});

test('NFR-012: firestore.rules está sincronizado con la configuración (npm run reglas)', () => {
  assert.equal(leer('firestore.rules'), generarReglas());
});
