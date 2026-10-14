// Guardado en el dispositivo (FR-007, FR-010). Si el navegador bloquea
// localStorage (modo privado estricto), el formulario sigue funcionando sin guardar.

const CLAVE_BORRADOR = 'easyreqs.borrador.v1';
const CLAVE_DISPOSITIVO = 'easyreqs.dispositivo';
const CLAVE_ULTIMO_ENVIO = 'easyreqs.ultimoEnvio';

function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento disponible: se ignora.
  }
}

export function nuevoId() {
  return crypto.randomUUID();
}

export function cargarBorrador() {
  const b = leer(CLAVE_BORRADOR);
  if (!b || typeof b !== 'object') return { nombre: '', correo: '', respuestas: {}, paso: 0, idEnvio: null };
  return {
    nombre: typeof b.nombre === 'string' ? b.nombre : '',
    correo: typeof b.correo === 'string' ? b.correo : '',
    respuestas: b.respuestas && typeof b.respuestas === 'object' ? b.respuestas : {},
    paso: Number.isInteger(b.paso) ? b.paso : 0,
    idEnvio: typeof b.idEnvio === 'string' ? b.idEnvio : null,
  };
}

export function guardarBorrador(borrador) {
  escribir(CLAVE_BORRADOR, borrador);
}

export function borrarBorrador() {
  try {
    localStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    // Sin almacenamiento disponible: no hay nada que borrar.
  }
}

// Identificador anónimo del dispositivo, solo para limitar envíos seguidos (NFR-009).
export function idDispositivo() {
  let id = leer(CLAVE_DISPOSITIVO);
  if (typeof id !== 'string') {
    id = nuevoId();
    escribir(CLAVE_DISPOSITIVO, id);
  }
  return id;
}

export function ultimoEnvio() {
  const t = leer(CLAVE_ULTIMO_ENVIO);
  return typeof t === 'number' ? t : 0;
}

export function marcarEnvio() {
  escribir(CLAVE_ULTIMO_ENVIO, Date.now());
}
