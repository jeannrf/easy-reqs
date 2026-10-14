import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { correoValido, validarEnvio, normalizarEnvio, MAX_RESPUESTA } from '../../public/js/validacion.js';
import { enviosACsv } from '../../public/js/csv.js';

const { preguntas } = JSON.parse(readFileSync(new URL('../../public/config/preguntas.json', import.meta.url), 'utf8'));
const completas = Object.fromEntries(preguntas.filter((p) => p.required).map((p) => [p.id, 'texto']));
const valido = { nombre: 'Ana', correo: 'ana@correo.com', respuestas: completas };

test('FR-006: formato de correo', () => {
  for (const c of ['ana@correo.com', 'a.b+c@sub.dominio.pe', ' ana@correo.com ']) assert.ok(correoValido(c), c);
  for (const c of ['ana@correo', 'ana', '@correo.com', 'ana @correo.com', 'ana@@correo.com', '']) assert.ok(!correoValido(c), c);
});

test('FR-003, FR-005: un envío completo no tiene errores', () => {
  assert.deepEqual(validarEnvio(valido, preguntas), []);
});

test('FR-003: nombre y correo son obligatorios', () => {
  const errores = validarEnvio({ ...valido, nombre: '  ', correo: '' }, preguntas);
  assert.deepEqual(errores, [{ campo: 'nombre', codigo: 'nombre' }, { campo: 'correo', codigo: 'correoVacio' }]);
});

test('FR-006: correo "ana@correo" se rechaza junto al campo correo', () => {
  assert.deepEqual(validarEnvio({ ...valido, correo: 'ana@correo' }, preguntas), [{ campo: 'correo', codigo: 'correoInvalido' }]);
});

test('FR-005: se indica cuál pregunta obligatoria falta; las opcionales pueden quedar vacías', () => {
  const errores = validarEnvio({ ...valido, respuestas: { ...completas, 'QB-07': '   ' } }, preguntas);
  assert.deepEqual(errores, [{ campo: 'QB-07', codigo: 'obligatoria' }]);
});

test('FR-004: hasta 5000 caracteres por respuesta', () => {
  assert.deepEqual(validarEnvio({ ...valido, respuestas: { ...completas, 'QB-03': 'x'.repeat(MAX_RESPUESTA) } }, preguntas), []);
  assert.deepEqual(validarEnvio({ ...valido, respuestas: { ...completas, 'QB-03': 'x'.repeat(MAX_RESPUESTA + 1) } }, preguntas),
    [{ campo: 'QB-03', codigo: 'muyLargo' }]);
});

test('DR-003, DR-004: todas las respuestas como texto; opcionales vacías como ""', () => {
  const n = normalizarEnvio({ nombre: ' Ana ', correo: ' ana@correo.com ', respuestas: { 'QB-01': '1500', ajena: 'x' } }, preguntas);
  assert.equal(n.nombre, 'Ana');
  assert.equal(n.correo, 'ana@correo.com');
  assert.equal(Object.keys(n.respuestas).length, 33);
  assert.equal(n.respuestas['QB-01'], '1500');
  assert.equal(n.respuestas['QB-33'], '');
  assert.ok(!('ajena' in n.respuestas));
});

test('FR-015: CSV con cabecera, comillas escapadas y sin fórmulas', () => {
  const csv = enviosACsv([{
    numero: 1, recibido: new Date('2026-10-13T10:00:00Z'), nombre: 'Ana', correo: 'ana@correo.com',
    respuestas: { 'QB-01': 'dice "hola",\notra línea', 'QB-02': '=SUMA(A1)' },
  }], preguntas);
  const [cabecera, ...resto] = csv.replace('﻿', '').split('\r\n');
  assert.ok(cabecera.startsWith('Número,Recibido (UTC),Nombre,Correo,QB-01'));
  const fila = resto.join('\r\n');
  assert.ok(fila.startsWith('1,2026-10-13T10:00:00.000Z,Ana,ana@correo.com,'));
  assert.ok(fila.includes('"dice ""hola"",\notra línea"'));
  assert.ok(fila.includes("'=SUMA(A1)"));
});
