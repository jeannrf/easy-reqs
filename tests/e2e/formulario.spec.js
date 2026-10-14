// Escenarios de aceptación del SRS (sección 4) para el respondiente.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { limpiarEmuladores, listarEnvios, preguntas, textos, abrirConBorrador, respuestasCompletas } from './ayuda.js';

test.beforeEach(() => limpiarEmuladores());

const sinScrollHorizontal = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('FR-001, FR-002, NFR-001: el formulario se abre en el celular por secciones, sin scroll horizontal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: textos.titulo })).toBeVisible();
  await expect(page.getByText('Paso 1 de 9')).toBeVisible();
  expect(await sinScrollHorizontal(page)).toBe(true);

  // FR-003: nombre y correo al inicio, con teclado adecuado.
  await expect(page.getByLabel(textos.contacto.nombre)).toHaveAttribute('autocomplete', 'name');
  await expect(page.getByLabel(textos.contacto.correo)).toHaveAttribute('type', 'email');

  // Criterio 9.1: las 33 preguntas, 13 obligatorias.
  await expect(page.locator('textarea')).toHaveCount(33);
  await expect(page.locator('textarea[aria-required="true"]')).toHaveCount(13);

  // Recorre todas las secciones sin scroll horizontal.
  await page.getByLabel(textos.contacto.nombre).fill('Ana');
  await page.getByLabel(textos.contacto.correo).fill('ana@correo.com');
  for (let paso = 2; paso <= 9; paso++) {
    const visibles = page.locator('fieldset:not([hidden]) textarea[aria-required="true"]');
    for (const t of await visibles.all()) await t.fill('texto');
    await page.getByRole('button', { name: textos.botones.siguiente }).click();
    if (paso === 9) break;
    await expect(page.getByText(`Paso ${paso} de 9`)).toBeVisible();
    expect(await sinScrollHorizontal(page)).toBe(true);
  }
});

test('NFR-002, NFR-003: botones de al menos 44 × 44 px y texto de campos de 16 px', async ({ page }) => {
  await abrirConBorrador(page, { paso: 3 });
  for (const b of await page.locator('button:visible').all()) {
    const caja = await b.boundingBox();
    expect(caja.height).toBeGreaterThanOrEqual(44);
    expect(caja.width).toBeGreaterThanOrEqual(44);
  }
  const tamano = await page.locator('textarea:visible').first().evaluate((t) => parseFloat(getComputedStyle(t).fontSize));
  expect(tamano).toBeGreaterThanOrEqual(16);
});

test('NFR-003: el área de texto crece con respuestas largas', async ({ page }) => {
  await abrirConBorrador(page, { paso: 1 });
  const area = page.locator('#QB-01');
  const antes = (await area.boundingBox()).height;
  await area.fill(Array.from({ length: 30 }, (_, i) => `Línea ${i}`).join('\n'));
  expect((await area.boundingBox()).height).toBeGreaterThan(antes * 3);
});

test('FR-003, FR-006: correo "ana@correo" no se envía y se pide uno válido junto al campo', async ({ page }) => {
  await abrirConBorrador(page, { correo: 'ana@correo' });
  await page.getByRole('button', { name: textos.botones.enviar }).click();
  const correo = page.getByLabel(textos.contacto.correo);
  await expect(correo).toBeFocused();
  await expect(correo).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#error-correo')).toHaveText(textos.errores.correoInvalido);
  expect(await listarEnvios()).toHaveLength(0);
});

test('FR-005: si falta una obligatoria no se envía y se indica cuál', async ({ page }) => {
  await abrirConBorrador(page, { respuestas: respuestasCompletas({ 'QB-07': '' }) });
  await page.getByRole('button', { name: textos.botones.enviar }).click();
  const qb07 = preguntas.find((p) => p.id === 'QB-07');
  await expect(page.getByRole('alert').filter({ hasText: qb07.label })).toBeVisible();
  await expect(page.locator('#QB-07')).toBeFocused();
  await expect(page.locator('#error-QB-07')).toHaveText(textos.errores.obligatoria);
  expect(await listarEnvios()).toHaveLength(0);
});

test('FR-005: "Siguiente" no avanza con obligatorias vacías', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: textos.botones.siguiente }).click();
  await expect(page.getByText('Paso 1 de 9')).toBeVisible();
  await expect(page.locator('#error-nombre')).toHaveText(textos.errores.nombre);
  await expect(page.locator('#error-correo')).toHaveText(textos.errores.correoVacio);
});

test('FR-007, FR-010: las respuestas se conservan al recargar y se vacían tras un envío exitoso', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(textos.contacto.nombre).fill('Ana Pérez');
  await page.getByLabel(textos.contacto.correo).fill('ana@correo.com');
  await page.getByRole('button', { name: textos.botones.siguiente }).click();
  await page.locator('#QB-01').fill('Pierdo los pedidos');
  await page.reload();

  await expect(page.getByText('Paso 2 de 9')).toBeVisible();
  await expect(page.locator('#QB-01')).toHaveValue('Pierdo los pedidos');
  await expect(page.getByLabel(textos.contacto.nombre)).toHaveValue('Ana Pérez');

  // Completa el resto de obligatorias paso a paso hasta el final.
  for (let paso = 2; paso <= 9; paso++) {
    for (const t of await page.locator('fieldset:not([hidden]) textarea[aria-required="true"]').all()) {
      if (!(await t.inputValue())) await t.fill('texto');
    }
    await page.getByRole('button', { name: paso === 9 ? textos.botones.enviar : textos.botones.siguiente }).click();
  }
  await expect(page.getByRole('heading', { name: textos.envio.confirmacionTitulo })).toBeVisible();

  expect(await page.evaluate(() => localStorage.getItem('easyreqs.borrador.v1'))).toBeNull();
  await page.reload();
  await expect(page.getByLabel(textos.contacto.nombre)).toHaveValue('');
});

test('FR-008, FR-009, FR-011: dos toques seguidos guardan un solo envío con número, fecha y hora', async ({ page }) => {
  await abrirConBorrador(page);
  await page.getByRole('button', { name: textos.botones.enviar }).dblclick();
  await expect(page.getByRole('heading', { name: textos.envio.confirmacionTitulo })).toBeVisible();
  await expect(page.locator('#numero-referencia')).toHaveText('1');

  const envios = await listarEnvios();
  expect(envios).toHaveLength(1);
  expect(envios[0]).toMatchObject({ numero: 1, nombre: 'Ana Pérez' });
  expect(Date.now() - Date.parse(envios[0].recibido)).toBeLessThan(60_000);
});

test('FR-009: sin conexión se muestra Reintentar y no se pierde lo escrito', async ({ page, context }) => {
  await abrirConBorrador(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: textos.botones.enviar }).click();
  await expect(page.getByRole('alert').filter({ hasText: textos.envio.errorTitulo })).toBeVisible();
  await expect(page.getByText(textos.envio.errorRed)).toBeVisible();
  await expect(page.locator('#QB-30')).toHaveValue('Respuesta a QB-30');
  expect(await listarEnvios()).toHaveLength(0);

  await context.setOffline(false);
  await page.getByRole('button', { name: textos.botones.reintentar }).click();
  await expect(page.locator('#numero-referencia')).toHaveText('1');
  expect(await listarEnvios()).toHaveLength(1);
});

test('FR-009: si el servicio falla se muestra Reintentar y no se pierde lo escrito', async ({ page }) => {
  await abrirConBorrador(page);
  await page.route('https://www.gstatic.com/firebasejs/**', (r) => r.abort());
  await page.getByRole('button', { name: textos.botones.enviar }).click();
  await expect(page.getByText(textos.envio.errorGeneral)).toBeVisible();
  await expect(page.getByRole('button', { name: textos.botones.reintentar })).toBeFocused();
  await expect(page.locator('#QB-30')).toHaveValue('Respuesta a QB-30');
  expect(await listarEnvios()).toHaveLength(0);
});

test('NFR-006: sin problemas de accesibilidad WCAG 2.2 AA detectables', async ({ page }) => {
  await abrirConBorrador(page, { correo: 'mal' });
  await page.getByRole('button', { name: textos.botones.enviar }).click(); // incluye estados de error
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(resultado.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
