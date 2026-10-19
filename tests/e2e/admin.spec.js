// Escenarios de aceptación del SRS (sección 4) para el analista.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { limpiarEmuladores, crearEnvio, ingresarConGoogle, correoAnalista, preguntas, textos } from './ayuda.js';

test.beforeEach(async () => {
  await limpiarEmuladores();
  await crearEnvio(1, 'Ana Pérez', 'ana@correo.com', { 'QB-01': 'Pierdo pedidos' });
  await crearEnvio(2, 'Luis Rojas', 'luis@correo.com', Object.fromEntries(preguntas.map((p) => [p.id, p.required ? `Luis responde ${p.id}` : ''])));
});

async function ingresar(page, correo) {
  await page.goto('/admin');
  await ingresarConGoogle(page, correo);
}

test('FR-012, FR-013: un analista autorizado abre la respuesta 2 y ve todo', async ({ page }) => {
  await ingresar(page, correoAnalista);

  // UI-004: lista numerada con nombre, correo y fecha.
  await expect(page.getByRole('link', { name: /Respuesta 1/ })).toContainText('ana@correo.com');
  await page.getByRole('link', { name: /Respuesta 2/ }).click();

  // UI-005: nombre, correo y todas las preguntas con sus respuestas.
  await expect(page.getByRole('heading', { name: 'Respuesta 2' })).toBeVisible();
  await expect(page.getByText('Luis Rojas')).toBeVisible();
  await expect(page.getByText('luis@correo.com')).toBeVisible();
  for (const p of preguntas) await expect(page.getByText(`${p.id}. ${p.label}`)).toBeVisible();
  await expect(page.getByText('Luis responde QB-30')).toBeVisible();
  await expect(page.getByText(textos.analista.sinResponder)).toHaveCount(20);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('FR-015: el analista exporta los envíos a CSV', async ({ page }) => {
  await ingresar(page, correoAnalista);
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: textos.analista.exportar }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toMatch(/^respuestas-\d{4}-\d{2}-\d{2}\.csv$/);
  const contenido = await (await archivo.createReadStream()).toArray();
  const texto = Buffer.concat(contenido).toString('utf8');
  expect(texto).toContain('Ana Pérez');
  expect(texto).toContain('Luis responde QB-30');
});

test('FR-013: una persona sin sesión no ve ningún dato', async ({ page }) => {
  await page.goto('/admin#/respuesta/2');
  await expect(page.getByRole('button', { name: textos.analista.ingresar })).toBeVisible();
  await expect(page.getByText('Luis Rojas')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Respuesta/ })).toHaveCount(0);
});

test('FR-013: otra cuenta de Google no ve ningún dato', async ({ page }) => {
  await ingresar(page, 'curioso@correo.com');
  await expect(page.getByText(textos.analista.sinAcceso)).toBeVisible();
  await expect(page.getByText('Luis Rojas')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Respuesta/ })).toHaveCount(0);
});

