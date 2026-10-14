// Exportación de envíos a CSV (FR-015).

function celda(valor) {
  let v = String(valor ?? '');
  // Evita que una hoja de cálculo interprete la respuesta como fórmula.
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\n\r;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

export function enviosACsv(envios, preguntas) {
  const cabecera = ['Número', 'Recibido (UTC)', 'Nombre', 'Correo', ...preguntas.map((p) => `${p.id} ${p.label}`)];
  const filas = envios.map((e) => [
    e.numero,
    e.recibido ? e.recibido.toISOString() : '',
    e.nombre,
    e.correo,
    ...preguntas.map((p) => e.respuestas?.[p.id] ?? ''),
  ]);
  // BOM para que Excel reconozca UTF-8 (tildes y ñ).
  return '﻿' + [cabecera, ...filas].map((f) => f.map(celda).join(',')).join('\r\n');
}
