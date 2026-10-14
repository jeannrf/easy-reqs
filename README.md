# easy-reqs: Fase 1

Formulario web mobile-first para que quien necesita un software describa lo que quiere, y vista para que el analista lea las respuestas. La especificación completa está en [`docs/SRS-fase-1.md`](docs/SRS-fase-1.md).

## Decisiones (sección 9.2 del SRS)

| ID | Decisión |
| --- | --- |
| D-01 | Guardado central en **Cloud Firestore** (plan gratuito Spark). |
| D-02 | Analista con **Firebase Auth** (correo y contraseña). Solo pueden leer las cuentas que tengan un documento en `analistas/{uid}`. |
| D-03 | **HTML, CSS y JS sin frameworks** publicados en **GitHub Pages**. La validación del servidor está en las reglas de Firestore. Pruebas con `node:test`, el emulador de Firebase y Playwright. |

## Estructura

```
public/                  Lo que se publica en GitHub Pages
  index.html             Formulario (UI-001 a UI-003)
  analista.html          Lista y detalle de respuestas (UI-004, UI-005)
  config/preguntas.json  Banco de preguntas (DR-001)
  config/textos.json     Todos los textos de la interfaz (NFR-011)
  js/firebase-config.js  Configuración web de tu proyecto de Firebase
firestore.rules.plantilla  Reglas de seguridad (validación del servidor)
firestore.rules          Generado desde la plantilla y preguntas.json (no editar)
scripts/                 Generador de reglas, servidor local y respaldo
tests/unit, tests/reglas, tests/e2e
```

## Desarrollo local

Requisitos: Node 22 o superior y Java 21 (para los emuladores de Firebase).

```bash
npm install
npx playwright install chromium   # una sola vez
npm run emuladores                # terminal 1: Firestore y Auth locales
npm run servir                    # terminal 2: http://localhost:5173
```

En `localhost` la app usa siempre los emuladores, nunca tu proyecto real. La vista del analista está en http://localhost:5173/analista.html. Para entrar, crea una cuenta en el emulador y su documento en `analistas`, como en `tests/e2e/ayuda.js`.

## Pruebas

```bash
npm test               # todo: unitarias + reglas + aceptación
npm run test:unit      # solo las unitarias (no necesitan emuladores)
```

Las pruebas de aceptación usan Chrome en un celular de 360 px. Safari (WebKit) se prueba en GitHub Actions, o en local con `WEBKIT=1` si tu sistema tiene sus librerías.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto de Firebase** en https://console.firebase.google.com (plan Spark, gratis).
   - *Firestore Database* > Crear base de datos > modo producción > región `southamerica-east1` (o la más cercana).
   - *Authentication* > Comenzar > habilitar **Correo/contraseña**.
   - *Configuración del proyecto* > Tus apps > agregar app **Web**. Copia los valores en `public/js/firebase-config.js`. Son públicos por diseño.
2. **Publicar las reglas de seguridad:**
   ```bash
   npx firebase login
   npx firebase use --add          # elige tu proyecto
   npm run desplegar:reglas
   ```
3. **Crear al analista:**
   - *Authentication* > Usuarios > Agregar usuario (correo y contraseña). Copia su **UID**.
   - *Firestore* > Iniciar colección `analistas` > ID del documento = ese UID (sin campos).
4. **Publicar en GitHub Pages:**
   - Sube el repositorio a GitHub (rama `main`).
   - *Settings* > *Pages* > Source: **GitHub Actions**. El flujo `publicar.yml` publica `public/` en cada push.
   - El formulario queda en `https://<usuario>.github.io/<repo>/` y la vista del analista en `.../analista.html`. Ambos usan HTTPS (NFR-008).
   - En Firebase, *Authentication* > *Configuración* > *Dominios autorizados*: agrega `<usuario>.github.io`.
5. **Respaldo diario (NFR-010):**
   - En Firebase, *Configuración del proyecto* > *Cuentas de servicio* > Generar nueva clave privada.
   - En GitHub, *Settings* > *Secrets and variables* > *Actions*, crea dos secretos: `FIREBASE_CUENTA_SERVICIO` (el contenido completo del JSON) y `RESPALDO_CLAVE` (una contraseña larga para cifrar).
   - Cada día el flujo `respaldo.yml` deja un archivo cifrado en *Actions* > *Respaldo diario* > Artifacts, que se conserva 90 días. Para descifrarlo: `openssl enc -d -aes-256-cbc -pbkdf2 -in envios-AAAA-MM-DD.json.enc -out envios.json`.

## Cambiar preguntas (NFR-012)

1. Edita `public/config/preguntas.json` (sección, texto, ayuda, ejemplo y si es obligatoria).
2. Ejecuta `npm run desplegar:reglas`. Las reglas se regeneran solas antes del deploy.
3. Haz push para publicar el formulario.

Ojo: la prueba `tests/unit/config.test.js` exige exactamente 33 preguntas y 13 obligatorias, como dice el SRS v0.3. Si cambias el banco, actualiza también esa prueba y registra el cambio en el SRS (sección 10.2).

## Cobertura de requerimientos

| Requerimiento | Dónde se prueba |
| --- | --- |
| FR-001, FR-002, NFR-001 | e2e `formulario.spec.js` (360 px, secciones, avance, sin scroll horizontal) |
| FR-003, FR-006 | unit `validacion.test.js`, reglas, e2e (correo `ana@correo`) |
| FR-004, FR-005 | unit, reglas, e2e |
| FR-007, FR-010 | e2e (recargar conserva; tras enviar se vacía) |
| FR-008, FR-009, FR-011 | reglas (idempotencia, concurrencia, número y fecha del servidor), e2e (doble toque, sin conexión, fallo del servicio) |
| FR-012, FR-013 | reglas, e2e `analista.spec.js` (analista, sin sesión, cuenta no autorizada) |
| FR-014 | reglas (nadie edita ni borra) |
| FR-015 | unit (CSV), e2e (descarga) |
| DR-001 a DR-005 | unit `config.test.js`, reglas |
| NFR-002, NFR-003 | e2e (44 × 44 px, 16 px, área que crece) |
| NFR-006 | e2e con axe-core (WCAG 2.2 AA automatizable) |
| NFR-007 | e2e en Chrome Android y Safari iOS emulados (WebKit en CI) |
| NFR-009 | reglas (un envío por minuto por dispositivo) |
| NFR-011, NFR-012 | unit (textos en un archivo; reglas sincronizadas con la configuración) |

### Pendiente fuera del código (criterios 9.1)

- Probar con 3 a 5 personas reales en un Android y un iPhone reales y anotar sus observaciones (NFR-004).
- Medir la carga con datos móviles reales (NFR-005). La primera pantalla pesa unos 35 KB (unos 12 KB comprimidos); Firebase se descarga recién al enviar.
- Obtener la aceptación escrita de quien define el producto.

### Limitaciones conocidas

- **NFR-009** se cumple de forma parcial: sin backend propio (plan Spark) no se puede limitar por IP, así que el límite es de un envío por minuto **por dispositivo**. Quien borre los datos del navegador lo evita.
- El contador correlativo admite pocos envíos por segundo. Si dos personas envían a la vez, el cliente reintenta solo, lo que basta para el volumen esperado.
