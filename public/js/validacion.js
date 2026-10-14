// Validación en el cliente (DES-003): solo por comodidad. La fuente de verdad
// son las reglas de Firestore, generadas desde la misma configuración.

export const MAX_RESPUESTA = 5000; // FR-004
export const MAX_NOMBRE = 200;
export const MAX_CORREO = 254;

// FR-006: algo@dominio.tld, sin espacios. La misma expresión se usa en las reglas.
export const PATRON_CORREO = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';
const regexCorreo = new RegExp(PATRON_CORREO);

export function correoValido(correo) {
  const c = (correo ?? '').trim();
  return c.length <= MAX_CORREO && regexCorreo.test(c);
}

/**
 * Valida el contacto y las respuestas. Devuelve una lista de errores
 * [{ campo, codigo }] en el orden del formulario; vacía si todo está bien.
 * campo: 'nombre' | 'correo' | id de pregunta. codigo: clave de textos.errores.
 */
export function validarEnvio({ nombre, correo, respuestas }, preguntas) {
  const errores = [];
  const n = (nombre ?? '').trim();
  if (!n) errores.push({ campo: 'nombre', codigo: 'nombre' });
  else if (n.length > MAX_NOMBRE) errores.push({ campo: 'nombre', codigo: 'muyLargo' });

  const c = (correo ?? '').trim();
  if (!c) errores.push({ campo: 'correo', codigo: 'correoVacio' });
  else if (!correoValido(c)) errores.push({ campo: 'correo', codigo: 'correoInvalido' });

  for (const p of preguntas) {
    errores.push(...validarPregunta(p, respuestas?.[p.id]));
  }
  return errores;
}

export function validarPregunta(pregunta, valor) {
  const v = valor ?? '';
  if (pregunta.required && !v.trim()) return [{ campo: pregunta.id, codigo: 'obligatoria' }];
  if (v.length > MAX_RESPUESTA) return [{ campo: pregunta.id, codigo: 'muyLargo' }];
  return [];
}

// DR-002, DR-003, DR-004: una respuesta de texto por pregunta; las vacías se guardan como ''.
export function normalizarEnvio({ nombre, correo, respuestas }, preguntas) {
  const r = {};
  for (const p of preguntas) r[p.id] = String(respuestas?.[p.id] ?? '');
  return { nombre: (nombre ?? '').trim(), correo: (correo ?? '').trim(), respuestas: r };
}
