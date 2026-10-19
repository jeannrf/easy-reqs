// Formulario del respondiente (UI-001, UI-002, UI-003).
// Se genera a partir de config/preguntas.json (DR-001, DES-002).
import { cargarConfig, formato, el, ERROR_CARGA } from './comun.js';
import { validarEnvio, validarPregunta, normalizarEnvio, MAX_RESPUESTA, MAX_NOMBRE, MAX_CORREO } from './validacion.js';
import {
  cargarBorrador, guardarBorrador, borrarBorrador, nuevoId, idDispositivo, ultimoEnvio, marcarEnvio,
} from './almacen-local.js';

const ESPERA_MS = 60 * 1000; // igual que ESPERA_SEGUNDOS en las reglas (NFR-009)
const $ = (id) => document.getElementById(id);

let T;           // textos
let preguntas;   // lista de preguntas en orden
let pasos;       // [{ titulo, campos: [ids] }]; el paso 0 es el contacto
let estado;      // borrador actual
let enviando = false;
let enviado = false; // tras un envío exitoso ya no se guarda nada en el dispositivo (FR-010)

iniciar();

async function iniciar() {
  try {
    const config = await cargarConfig();
    T = config.textos;
    preguntas = ordenarPreguntas(config.secciones, config.preguntas);
    pasos = [
      { titulo: T.contacto.titulo, campos: ['nombre', 'correo'] },
      ...config.secciones.map((s) => ({
        titulo: s.titulo,
        campos: preguntas.filter((p) => p.section === s.id).map((p) => p.id),
      })).filter((p) => p.campos.length > 0),
    ];
  } catch {
    $('mensaje-carga').textContent = ERROR_CARGA;
    $('app').removeAttribute('aria-busy');
    return;
  }

  estado = cargarBorrador(); // FR-007
  estado.paso = Math.min(Math.max(estado.paso, 0), pasos.length - 1);

  pintarTextos();
  pintarPasos();
  restaurarValores();
  conectarEventos();
  mostrarPaso(estado.paso, false);

  $('mensaje-carga').hidden = true;
  $('formulario').hidden = false;
  $('avance').hidden = false;
  $('app').removeAttribute('aria-busy');
}

function ordenarPreguntas(secciones, lista) {
  const orden = new Map(secciones.map((s, i) => [s.id, i]));
  return lista
    .filter((p) => orden.has(p.section))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => orden.get(a.p.section) - orden.get(b.p.section) || a.i - b.i)
    .map(({ p }) => p);
}

// ---------- Construcción de la interfaz ----------

function pintarTextos() {
  document.title = T.titulo;
  $('titulo').textContent = T.titulo;
  $('marca').textContent = T.marca;
  $('pie').textContent = T.pie;
  $('instrucciones').textContent = T.instrucciones;
  $('anterior').textContent = T.botones.anterior;
  $('reintentar').textContent = T.botones.reintentar;
  $('error-envio-titulo').textContent = T.envio.errorTitulo;
  $('confirmacion-titulo').textContent = T.envio.confirmacionTitulo;
  $('confirmacion-texto').textContent = T.envio.confirmacionTexto;
  $('confirmacion-referencia').textContent = T.envio.referencia;
  $('nuevo').textContent = T.botones.nuevo;
}

function pintarPasos() {
  const contenedor = $('pasos');
  pasos.forEach((paso, i) => {
    const fieldset = el('fieldset', { clase: 'paso min-w-0 rounded-2xl bg-superficie p-5 shadow-md ring-1 ring-borde sm:p-8', id: `paso-${i}`, hidden: true },
      el('legend', { clase: 'float-left mb-5 w-full' }, el('h2', { clase: 'paso-titulo border-b-2 border-primario-suave pb-3 text-xl font-bold focus:outline-none', tabindex: '-1', texto: paso.titulo })));
    if (i === 0) {
      fieldset.append(
        campoTexto({ id: 'nombre', etiqueta: T.contacto.nombre, tipo: 'text', autocomplete: 'name', max: MAX_NOMBRE }),
        campoTexto({ id: 'correo', etiqueta: T.contacto.correo, tipo: 'email', autocomplete: 'email', max: MAX_CORREO, ayuda: T.contacto.correoAyuda, inputmode: 'email' }),
        el('p', { clase: 'mt-2 text-sm text-suave', texto: T.contacto.privacidad }),
      );
    } else {
      for (const id of paso.campos) fieldset.append(campoPregunta(preguntas.find((p) => p.id === id)));
    }
    contenedor.append(fieldset);
  });
}

function etiquetaCon(texto, obligatoria, para, marca = obligatoria ? T.obligatorioMarca : T.opcionalMarca) {
  return el('label', { for: para, clase: 'mb-1 block font-semibold' },
    texto, ' ',
    el('span', {
      clase: obligatoria
        ? 'ml-1 inline-block rounded-full bg-primario-suave px-2 py-0.5 align-middle text-xs font-medium text-primario'
        : 'ml-1 align-middle text-xs font-normal text-suave',
      texto: marca,
    }));
}

function campoTexto({ id, etiqueta, tipo, autocomplete, max, ayuda, inputmode }) {
  const describe = [ayuda ? `ayuda-${id}` : null, `error-${id}`].filter(Boolean).join(' ');
  return el('div', { clase: 'mb-6 last:mb-0', id: `campo-${id}` },
    etiquetaCon(etiqueta, true, id, T.contacto.obligatorioMarca),
    ayuda ? el('p', { clase: 'mb-2 text-sm text-suave', id: `ayuda-${id}`, texto: ayuda }) : null,
    el('input', {
      clase: 'campo-texto', id, name: id, type: tipo, autocomplete, inputmode, maxlength: String(max),
      required: true, 'aria-required': 'true', 'aria-describedby': describe,
      autocapitalize: tipo === 'email' ? 'off' : 'words', spellcheck: tipo === 'email' ? 'false' : null,
    }),
    el('p', { clase: 'mt-1 text-sm font-semibold text-error', id: `error-${id}`, hidden: true }),
  );
}

function campoPregunta(p) {
  const ayuda = [p.help, p.example].filter(Boolean).join(' ');
  const describe = [ayuda ? `ayuda-${p.id}` : null, `error-${p.id}`].filter(Boolean).join(' ');
  return el('div', { clase: 'mb-6 last:mb-0', id: `campo-${p.id}` },
    etiquetaCon(p.label, p.required, p.id),
    ayuda ? el('p', { clase: 'mb-2 text-sm text-suave', id: `ayuda-${p.id}`, texto: ayuda }) : null,
    el('textarea', {
      clase: 'campo-texto', id: p.id, name: p.id, rows: '3', maxlength: String(MAX_RESPUESTA),
      required: p.required, 'aria-required': p.required ? 'true' : 'false', 'aria-describedby': describe,
    }),
    el('p', { clase: 'mt-1 text-sm font-semibold text-error', id: `error-${p.id}`, hidden: true }),
  );
}

function restaurarValores() {
  $('nombre').value = estado.nombre;
  $('correo').value = estado.correo;
  for (const p of preguntas) $(p.id).value = estado.respuestas[p.id] ?? '';
}

// NFR-003: las áreas de texto crecen con el contenido.
function ajustarAltura(t) {
  t.style.height = 'auto';
  t.style.height = `${t.scrollHeight + 2}px`;
}

// ---------- Eventos ----------

let temporizadorGuardado;

function conectarEventos() {
  const form = $('formulario');
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'nombre' || t.id === 'correo') estado[t.id] = t.value;
    else estado.respuestas[t.id] = t.value;
    if (t.tagName === 'TEXTAREA') ajustarAltura(t);
    if (t.getAttribute('aria-invalid') === 'true') limpiarError(t.id);
    actualizarRespondidas();
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(() => guardarBorrador(estado), 250);
  });
  // Por si el navegador cierra la pestaña antes de que corra el temporizador.
  addEventListener('pagehide', () => { if (!enviado) guardarBorrador(estado); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (estado.paso < pasos.length - 1) siguiente();
    else enviarFormulario();
  });
  $('anterior').addEventListener('click', () => mostrarPaso(estado.paso - 1));
  $('reintentar').addEventListener('click', () => enviarFormulario());
  $('nuevo').addEventListener('click', () => location.reload());
}

function siguiente() {
  const errores = validarCampos(pasos[estado.paso].campos);
  if (errores.length) return mostrarErrores(errores);
  mostrarPaso(estado.paso + 1);
}

function mostrarPaso(i, enfocar = true) {
  estado.paso = i;
  guardarBorrador(estado);
  pasos.forEach((_, j) => { $(`paso-${j}`).hidden = j !== i; });
  $('anterior').hidden = i === 0;
  const ultimo = i === pasos.length - 1;
  $('siguiente').textContent = ultimo ? T.botones.enviar : T.botones.siguiente;
  $('resumen-errores').hidden = true;
  $('error-envio').hidden = true;
  $(`paso-${i}`).querySelectorAll('textarea').forEach(ajustarAltura);

  // FR-002: indicador de avance.
  $('avance-texto').textContent = formato(T.avance, { actual: i + 1, total: pasos.length });
  $('barra-relleno').style.width = `${((i + 1) / pasos.length) * 100}%`;
  actualizarRespondidas();

  if (enfocar) {
    scrollTo({ top: 0 });
    $(`paso-${i}`).querySelector('.paso-titulo').focus();
  }
}

function actualizarRespondidas() {
  const respondidas = preguntas.filter((p) => (estado.respuestas[p.id] ?? '').trim()).length;
  $('avance-respondidas').textContent = formato(T.avanceRespondidas, { respondidas, total: preguntas.length });
}

// ---------- Validación (FR-003, FR-005, FR-006) ----------

function validarCampos(campos) {
  const errores = [];
  for (const id of campos) {
    if (id === 'nombre' || id === 'correo') {
      errores.push(...validarEnvio({ ...estado, respuestas: {} }, []).filter((e) => e.campo === id));
    } else {
      errores.push(...validarPregunta(preguntas.find((p) => p.id === id), estado.respuestas[id]));
    }
  }
  return errores;
}

function mensajeError(codigo) {
  return formato(T.errores[codigo], { max: MAX_RESPUESTA });
}

function etiquetaCampo(id) {
  if (id === 'nombre') return T.contacto.nombre;
  if (id === 'correo') return T.contacto.correo;
  return preguntas.find((p) => p.id === id).label;
}

function mostrarErrores(errores) {
  for (const { campo, codigo } of errores) {
    $(campo).setAttribute('aria-invalid', 'true');
    const p = $(`error-${campo}`);
    p.textContent = mensajeError(codigo);
    p.hidden = false;
  }
  const resumen = $('resumen-errores');
  resumen.replaceChildren(
    el('p', { clase: 'mb-2 font-semibold', texto: formato(T.errores.resumen, { n: errores.length }) }),
    el('ul', { clase: 'list-disc space-y-1 pl-5' }, ...errores.map(({ campo }) => {
      const a = el('a', { href: `#${campo}`, clase: 'underline', texto: etiquetaCampo(campo) });
      a.addEventListener('click', (e) => { e.preventDefault(); $(campo).focus(); });
      return el('li', {}, a);
    })),
  );
  resumen.hidden = false;
  $(errores[0].campo).focus();
}

function limpiarError(id) {
  $(id).removeAttribute('aria-invalid');
  $(`error-${id}`).hidden = true;
}

// ---------- Envío (FR-008, FR-009, FR-010, FR-011) ----------

async function enviarFormulario() {
  if (enviando) return; // FR-008: un doble toque no envía dos veces.

  const errores = validarEnvio(estado, preguntas);
  if (errores.length) {
    const primero = errores[0].campo;
    const pasoConError = pasos.findIndex((p) => p.campos.includes(primero));
    if (pasoConError !== estado.paso) mostrarPaso(pasoConError, false);
    return mostrarErrores(errores.filter((e) => pasos[pasoConError].campos.includes(e.campo)));
  }

  $('error-envio').hidden = true;
  if (Date.now() - ultimoEnvio() < ESPERA_MS) return mostrarErrorEnvio(T.envio.errorEspera);
  if (!navigator.onLine) return mostrarErrorEnvio(T.envio.errorRed);

  enviando = true;
  const boton = $('siguiente');
  boton.textContent = T.botones.enviando;
  boton.setAttribute('aria-disabled', 'true');
  $('reintentar').setAttribute('aria-disabled', 'true');

  // El id se guarda antes de enviar: si se recarga o reintenta, no se duplica.
  if (!estado.idEnvio) estado.idEnvio = nuevoId();
  guardarBorrador(estado);

  try {
    const { enviar } = await import('./servicio.js');
    const numero = await enviar({
      idEnvio: estado.idEnvio,
      dispositivo: idDispositivo(),
      ...normalizarEnvio(estado, preguntas),
    });
    marcarEnvio();
    enviado = true;
    clearTimeout(temporizadorGuardado);
    borrarBorrador(); // FR-010
    mostrarConfirmacion(numero);
  } catch (error) {
    console.error(error);
    const sinRed = !navigator.onLine || error?.code === 'unavailable';
    mostrarErrorEnvio(sinRed ? T.envio.errorRed : T.envio.errorGeneral);
  } finally {
    enviando = false;
    boton.textContent = T.botones.enviar;
    boton.removeAttribute('aria-disabled');
    $('reintentar').removeAttribute('aria-disabled');
  }
}

function mostrarErrorEnvio(texto) {
  $('error-envio-texto').textContent = texto;
  $('error-envio').hidden = false;
  $('reintentar').focus();
}

function mostrarConfirmacion(numero) {
  $('formulario').hidden = true;
  $('avance').hidden = true;
  $('instrucciones').hidden = true;
  $('numero-referencia').textContent = String(numero);
  const c = $('confirmacion');
  c.hidden = false;
  scrollTo({ top: 0 });
  c.focus();
}
