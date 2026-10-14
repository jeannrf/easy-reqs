// Vista del analista: lista (UI-004) y detalle (UI-005) de respuestas.
// El acceso lo controlan las reglas de Firestore (FR-013); esta página solo
// muestra lo que el servidor permite leer.
import { cargarConfig, formato, el, ERROR_CARGA } from './comun.js';
import { enviosACsv } from './csv.js';

const $ = (id) => document.getElementById(id);
let T;
let preguntas;
let secciones;
let servicio;
let envios = null; // se cargan una vez por sesión

iniciar();

async function iniciar() {
  try {
    const config = await cargarConfig();
    T = config.textos;
    preguntas = config.preguntas;
    secciones = config.secciones;
    servicio = await import('./servicio.js');
  } catch {
    $('estado').textContent = ERROR_CARGA;
    $('app').removeAttribute('aria-busy');
    return;
  }
  pintarTextos();

  $('ingreso').addEventListener('submit', ingresar);
  $('salir').addEventListener('click', () => servicio.salir());
  $('exportar').addEventListener('click', exportar);
  addEventListener('hashchange', mostrarRuta);

  servicio.alCambiarSesion(async (usuario) => {
    envios = null;
    $('vista').replaceChildren();
    $('exportar').hidden = true;
    $('salir').hidden = !usuario;
    $('app').removeAttribute('aria-busy');
    if (!usuario) {
      $('estado').textContent = '';
      $('ingreso').hidden = false;
      return;
    }
    $('ingreso').hidden = true;
    $('estado').textContent = T.analista.cargando;
    if (!(await servicio.esAnalista(usuario.uid))) {
      $('estado').textContent = T.analista.sinAcceso;
      return;
    }
    try {
      envios = await servicio.listarEnvios();
    } catch (error) {
      console.error(error);
      $('estado').textContent = error?.code === 'permission-denied' ? T.analista.sinAcceso : T.analista.errorCarga;
      return;
    }
    $('estado').textContent = '';
    $('exportar').hidden = envios.length === 0;
    mostrarRuta();
  });
}

function pintarTextos() {
  document.title = T.analista.titulo;
  $('titulo').textContent = T.analista.titulo;
  $('ingreso-titulo').textContent = T.analista.ingresoTitulo;
  $('ingreso-correo-etiqueta').textContent = T.analista.correo;
  $('ingreso-clave-etiqueta').textContent = T.analista.clave;
  $('ingresar').textContent = T.analista.ingresar;
  $('salir').textContent = T.analista.salir;
  $('exportar').textContent = T.analista.exportar;
}

async function ingresar(e) {
  e.preventDefault();
  $('ingreso-error').hidden = true;
  try {
    await servicio.ingresar($('ingreso-correo').value.trim(), $('ingreso-clave').value);
    $('ingreso-clave').value = '';
  } catch {
    $('ingreso-error').textContent = T.analista.ingresoError;
    $('ingreso-error').hidden = false;
  }
}

function mostrarRuta() {
  if (!envios) return;
  const m = location.hash.match(/^#\/respuesta\/(\d+)$/);
  if (m) mostrarDetalle(Number(m[1]));
  else mostrarLista();
}

const fechaLocal = (d) => (d ? d.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }) : '');

function mostrarLista() {
  if (envios.length === 0) {
    $('vista').replaceChildren(el('p', { texto: T.analista.vacio }));
    return;
  }
  $('vista').replaceChildren(el('ul', { clase: 'lista' }, ...envios.map((e) =>
    el('li', {}, el('a', { href: `#/respuesta/${e.numero}` },
      el('strong', { texto: formato(T.analista.respuesta, { n: e.numero }) }),
      el('span', { texto: `${e.nombre} · ${e.correo}` }),
      el('span', { texto: fechaLocal(e.recibido) }),
    )))));
}

function mostrarDetalle(n) {
  const envio = envios.find((e) => e.numero === n);
  const volver = el('a', { href: '#/', clase: 'enlace-volver', texto: `← ${T.analista.volver}` });
  if (!envio) {
    $('vista').replaceChildren(volver, el('p', { texto: formato(T.analista.noEncontrada, { n }) }));
    return;
  }
  const titulo = el('h2', { tabindex: '-1', texto: formato(T.analista.respuesta, { n }) });
  const datos = el('dl', {},
    el('dt', { texto: T.analista.nombre }), el('dd', { texto: envio.nombre }),
    el('dt', { texto: T.analista.correoCampo }), el('dd', {}, el('a', { href: `mailto:${envio.correo}`, texto: envio.correo })),
    el('dt', { texto: T.analista.recibido }), el('dd', { texto: fechaLocal(envio.recibido) }),
  );
  const bloques = secciones.map((s) => {
    const deSeccion = preguntas.filter((p) => p.section === s.id);
    if (!deSeccion.length) return null;
    return [el('h3', { texto: s.titulo }), el('dl', {}, ...deSeccion.flatMap((p) => {
      const r = envio.respuestas?.[p.id] ?? '';
      return [
        el('dt', { texto: `${p.id}. ${p.label}` }),
        r.trim() ? el('dd', { texto: r }) : el('dd', { clase: 'sin-respuesta', texto: T.analista.sinResponder }),
      ];
    }))];
  }).filter(Boolean).flat();
  $('vista').replaceChildren(volver, el('article', { clase: 'detalle' }, titulo, datos, ...bloques));
  scrollTo({ top: 0 });
  titulo.focus();
}

function exportar() {
  const blob = new Blob([enviosACsv(envios, preguntas)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `respuestas-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
