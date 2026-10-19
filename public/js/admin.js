// Panel de administración (/admin): lista (UI-004) y detalle (UI-005) de respuestas.
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

  $('ingresar').addEventListener('click', ingresar);
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
  $('ingreso-texto').textContent = T.analista.ingresoTexto;
  $('ingresar-texto').textContent = T.analista.ingresar;
  $('marca').textContent = T.marca;
  $('pie').textContent = T.pie;
  $('panel').textContent = T.analista.panel;
  $('salir').textContent = T.analista.salir;
  $('exportar').textContent = T.analista.exportar;
}

async function ingresar() {
  $('ingreso-error').hidden = true;
  try {
    await servicio.ingresar();
  } catch (error) {
    // Cerrar la ventana de Google no es un error que haya que mostrar.
    if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error?.code)) return;
    console.error(error);
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
    $('vista').replaceChildren(el('p', { clase: 'rounded-xl bg-superficie p-4 shadow-md ring-1 ring-borde', texto: T.analista.vacio }));
    return;
  }
  $('vista').replaceChildren(el('ul', { clase: 'grid gap-3' }, ...envios.map((e) =>
    el('li', {}, el('a', {
      href: `#/respuesta/${e.numero}`,
      clase: 'grid gap-1 rounded-xl bg-superficie p-4 text-texto no-underline shadow-sm ring-1 ring-borde transition hover:ring-2 hover:ring-primario sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-4',
    },
      el('strong', { clase: 'text-primario', texto: formato(T.analista.respuesta, { n: e.numero }) }),
      el('span', { clase: 'text-suave', texto: `${e.nombre} · ${e.correo}` }),
      el('span', { clase: 'text-sm text-suave', texto: fechaLocal(e.recibido) }),
    )))));
}

function mostrarDetalle(n) {
  const envio = envios.find((e) => e.numero === n);
  const volver = el('a', { href: '#/', clase: 'mb-3 inline-flex min-h-11 items-center font-semibold text-primario hover:underline', texto: `← ${T.analista.volver}` });
  if (!envio) {
    $('vista').replaceChildren(volver, el('p', { clase: 'rounded-xl bg-superficie p-4 shadow-md ring-1 ring-borde', texto: formato(T.analista.noEncontrada, { n }) }));
    return;
  }
  const titulo = el('h2', { clase: 'text-2xl font-bold focus:outline-none', tabindex: '-1', texto: formato(T.analista.respuesta, { n }) });
  const dt = (texto) => el('dt', { clase: 'mt-4 font-semibold', texto });
  const dd = (texto) => el('dd', { clase: 'mt-1 whitespace-pre-wrap', texto });
  const datos = el('dl', {},
    dt(T.analista.nombre), dd(envio.nombre),
    dt(T.analista.correoCampo), el('dd', { clase: 'mt-1' }, el('a', { href: `mailto:${envio.correo}`, clase: 'text-primario underline', texto: envio.correo })),
    dt(T.analista.recibido), dd(fechaLocal(envio.recibido)),
  );
  const bloques = secciones.map((s) => {
    const deSeccion = preguntas.filter((p) => p.section === s.id);
    if (!deSeccion.length) return null;
    return [el('h3', { clase: 'mt-8 border-b-2 border-primario-suave pb-1.5 text-lg font-bold text-primario', texto: s.titulo }), el('dl', {}, ...deSeccion.flatMap((p) => {
      const r = envio.respuestas?.[p.id] ?? '';
      return [
        dt(`${p.id}. ${p.label}`),
        r.trim() ? dd(r) : el('dd', { clase: 'mt-1 italic text-suave', texto: T.analista.sinResponder }),
      ];
    }))];
  }).filter(Boolean).flat();
  $('vista').replaceChildren(volver, el('article', { clase: 'rounded-2xl bg-superficie p-5 shadow-md ring-1 ring-borde sm:p-8' }, titulo, datos, ...bloques));
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
