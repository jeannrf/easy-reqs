// Pruebas de aceptación (DES-006) contra los emuladores de Firebase.
// Ejecutar con: npm run test:emuladores (levanta los emuladores y este servidor).
import { defineConfig, devices } from '@playwright/test';

// NFR-001: ancho mínimo de diseño de 360 px.
const celular = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true };

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1, // los emuladores se limpian entre pruebas
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:5173', locale: 'es-PE' },
  webServer: { command: 'node scripts/servir.mjs', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
  projects: [
    // NFR-007: Chrome en Android y Safari en iOS. WebKit necesita las librerías
    // de Ubuntu; en otros sistemas se activa con WEBKIT=1 o corre en CI.
    { name: 'chrome-android', use: { ...devices['Pixel 7'], ...celular } },
    ...(process.env.CI || process.env.WEBKIT
      ? [{ name: 'safari-ios', use: { ...devices['iPhone 15'], ...celular } }]
      : []),
  ],
});
