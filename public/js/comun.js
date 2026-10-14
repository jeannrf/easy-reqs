// Utilidades compartidas por el formulario y la vista del analista.

export async function cargarConfig() {
  const [textos, config] = await Promise.all([
    fetch('config/textos.json').then(aJson),
    fetch('config/preguntas.json').then(aJson),
  ]);
  return { textos, ...config };
}

function aJson(respuesta) {
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

// "Paso {actual} de {total}" -> "Paso 2 de 9"
export function formato(plantilla, valores) {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => String(valores[k] ?? ''));
}

// Crea un elemento con atributos y contenido de texto (nunca HTML).
export function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === false || v == null) continue;
    if (k === 'texto') nodo.textContent = v;
    else if (k === 'clase') nodo.className = v;
    else nodo.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos) if (h) nodo.append(h);
  return nodo;
}

export const ERROR_CARGA = 'No se pudo cargar la página. Revisa tu conexión y recarga.';
