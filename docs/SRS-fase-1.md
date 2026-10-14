# SRS – Fase 1: formulario web único (mobile-first)

Oct 12, 2026 · @Jeanpier

**Versión 0.3 (borrador)** · Basado en la estructura de ISO/IEC/IEEE 29148 · Idioma: español

Especificación de la Fase 1: un formulario web, mobile first, que guía a quien necesita un software para describir lo que quiere, con preguntas detalladas válidas para cualquier tipo de software. Cada requerimiento tiene identificador y descripción; está escrito para usarse con Claude Code u otros IDEs.

## 1. Introducción

### 1.1 Propósito

Definir qué debe hacer la Fase 1 para que quien la diseñe, programe o pruebe tenga una sola referencia.

### 1.2 Alcance

Aplicación web de un solo formulario, similar a Google Forms pero orientado al levantamiento de requerimientos de software. Una persona que necesita un software responde preguntas abiertas de texto; un analista revisa las respuestas.

**Dentro de la Fase 1:** formulario único por secciones, nombre y correo del respondiente, respuestas de texto libre, guardado automático en el dispositivo, envío, confirmación, y vista de las respuestas para el analista.

**Fuera de la Fase 1:** cuentas y login, edición de un envío ya hecho, resultados para el respondiente, procesamiento o análisis automático de las respuestas, varios formularios, aplicaciones instalables.

### 1.3 Convenciones

- `FR-nnn`: requerimiento funcional. `NFR-nnn`: no funcional. `DR-nnn`: de datos. `CON-nnn`: restricción. `ASM-nnn`: supuesto. `Q-nn`: pregunta abierta. `QB-nn`: pregunta del formulario.
- Prioridad: **Debe** (imprescindible), **Debería** (importante), **Podría** (deseable).
- Un requerimiento solo se escribe como ID y descripción. Lo que aún no se decidió se lista en la sección 9 como **decisión abierta**, con su opción recomendada.

### 1.4 Referencias

- ISO/IEC/IEEE 29148, *Systems and software engineering: Life cycle processes: Requirements engineering* (estructura de referencia, citada de memoria).
- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, nivel AA.

## 2. Descripción general

### 2.1 Hechos confirmados

- Es un formulario web, mobile first, similar a Google Forms, orientado a recolectar requerimientos de software.
- Las preguntas deben ser detalladas y servir para cualquier tipo de software.
- Todas las respuestas son texto libre (los números se escriben como texto y se guardan igual).
- El respondiente escribe su nombre y su correo dentro del formulario; no hay login ni registro.
- Si recarga la página, sus respuestas se conservan en su dispositivo.
- El respondiente no ve resultados; solo recibe una confirmación de envío.
- El analista ve las respuestas, una por una (respuesta 1, respuesta 2, respuesta 3...).
- Los datos no son personales ni sensibles, más allá de nombre y correo.
- Se preguntan plazos y presupuesto como parte del formulario.
- Un envío no se puede corregir en la Fase 1.
- Un servidor para guardar las respuestas y las cuentas queda para una fase posterior.

### 2.2 Roles

- **Respondiente:** persona que necesita un software y completa el formulario desde su celular.
- **Analista:** persona que revisa las respuestas recibidas.

### 2.3 Entorno operativo

- Navegadores móviles actuales (Chrome en Android, Safari en iOS); escritorio como apoyo.
- Ancho mínimo de diseño: 360 px.
- Idioma de la interfaz: español.

### 2.4 Restricciones

- **CON-001.** Aplicación web accesible desde el navegador, sin instalación.
- **CON-002.** Diseño mobile first.
- **CON-003.** La Fase 1 es un único formulario.
- **CON-004.** Sin login ni cuentas en la Fase 1.
- **CON-005.** Plazo, presupuesto y tecnología: sin límites definidos; el implementador debe proponer una opción simple y de bajo costo.

### 2.5 Supuestos

- **ASM-001.** Los respondientes tienen celular con navegador moderno e internet.
- **ASM-002.** Un respondiente puede enviar más de una vez (por ejemplo, para otro software); no se limita el número de envíos.
- **ASM-003.** Cada envío se identifica por su número, nombre y correo, sin verificar el correo.

## 3. Pantallas

Diseño visual: ver el prototipo en el lienzo de diseño (los campos de ejemplo de ese prototipo se reemplazan por el banco de preguntas de la sección 7).

- **UI-001. Formulario.** Título, instrucciones breves, datos de contacto (nombre y correo), secciones con sus preguntas, indicador de avance y botón Enviar.
- **UI-002. Confirmación.** Mensaje de recibido y número de referencia del envío.
- **UI-003. Error de envío.** Mensaje claro, lo escrito se conserva, botón Reintentar.
- **UI-004. Lista de respuestas (analista).** Lista de envíos numerados (Respuesta 1, Respuesta 2...) con nombre, correo y fecha.
- **UI-005. Detalle de una respuesta (analista).** Todas las preguntas con lo que respondió la persona.

Comportamiento común: una columna, etiquetas visibles, errores junto al campo, teclado adecuado por campo y botones de al menos 44 × 44 px.

## 4. Requerimientos funcionales

- **FR-001.** El sistema debe permitir abrir el formulario mediante un enlace desde el navegador del celular, sin instalar nada.
- **FR-002.** El sistema debe mostrar el formulario organizado en secciones, con las preguntas definidas en la sección 7, y mostrar el avance.
- **FR-003.** El sistema debe pedir al respondiente su nombre y su correo electrónico, ambos obligatorios, al inicio del formulario.
- **FR-004.** El sistema debe aceptar respuestas de texto libre en todas las preguntas, de cualquier longitud razonable (hasta 5000 caracteres por respuesta).
- **FR-005.** El sistema debe distinguir preguntas obligatorias y opcionales, y no permitir enviar si falta una obligatoria, indicando cuál.
- **FR-006.** El sistema debe validar que el correo tenga formato válido (por ejemplo, nombre@dominio.com).
- **FR-007.** El sistema debe guardar las respuestas escritas en el dispositivo mientras el respondiente avanza, y restaurarlas si recarga la página o vuelve más tarde.
- **FR-008.** El sistema debe enviar el formulario completo con un solo botón y evitar envíos duplicados por doble toque.
- **FR-009.** El sistema debe mostrar una confirmación con un número de referencia cuando el envío se recibe, y un mensaje claro con la opción de reintentar si falla, sin perder lo escrito.
- **FR-010.** El sistema debe vaciar las respuestas guardadas en el dispositivo después de un envío exitoso.
- **FR-011.** El sistema debe guardar cada envío con número correlativo, fecha y hora de recepción, nombre, correo y todas las respuestas.
- **FR-012.** El sistema debe permitir al analista ver la lista de envíos y abrir cada uno para leer todas sus respuestas.
- **FR-013.** El sistema debe restringir la vista del analista a personas autorizadas. *(Método por elegir; ver decisión D-01.)*
- **FR-014.** El sistema no debe permitir editar ni borrar un envío desde la interfaz del respondiente.
- **FR-015.** El sistema debería permitir al analista exportar los envíos a un archivo (por ejemplo CSV).

Prioridad: FR-001 a FR-014 son imprescindibles (Debe). FR-015 es importante (Debería).

### Criterios de aceptación

```gherkin
# language: es
Característica: Formulario de levantamiento de requerimientos

  # FR-001, FR-002
  Escenario: Abrir el formulario en un celular
    Dado un celular con navegador móvil actual
    Cuando la persona abre el enlace
    Entonces ve el formulario por secciones sin desplazamiento horizontal

  # FR-003, FR-006
  Escenario: Datos de contacto inválidos
    Dado que el correo escrito es "ana@correo"
    Cuando la persona presiona Enviar
    Entonces no se envía y se pide un correo válido junto a ese campo

  # FR-005
  Escenario: Falta una pregunta obligatoria
    Dado una pregunta obligatoria vacía
    Cuando la persona presiona Enviar
    Entonces no se envía y se indica cuál pregunta falta

  # FR-007, FR-010
  Escenario: Conservar respuestas al recargar
    Dado un formulario a medias
    Cuando la persona recarga la página
    Entonces sus respuestas siguen allí
    Y tras un envío exitoso el dispositivo ya no las conserva

  # FR-008, FR-009, FR-011
  Escenario: Enviar con éxito
    Dado un formulario válido
    Cuando la persona presiona Enviar dos veces seguidas
    Entonces se guarda un solo envío con número, fecha y hora
    Y ve la confirmación con el número de referencia

  # FR-009
  Escenario: Fallo al enviar
    Dado que el servicio no responde
    Cuando la persona presiona Enviar
    Entonces ve un mensaje con la opción de reintentar
    Y sus respuestas siguen en pantalla

  # FR-012, FR-013
  Escenario: El analista lee una respuesta
    Dado un analista autorizado y envíos guardados
    Cuando abre la respuesta 2
    Entonces ve el nombre, el correo y todas las preguntas con sus respuestas

  Escenario: Acceso no autorizado
    Dado una persona sin autorización
    Cuando intenta abrir la lista de respuestas
    Entonces no se muestra ningún dato
```

## 5. Datos

- **DR-001.** Las preguntas del formulario deben definirse como datos de configuración (sección, texto, ayuda, ejemplo, obligatoria sí/no), no escritas fijas en la interfaz, para poder agregar o cambiar preguntas sin reprogramar.
- **DR-002.** Cada envío debe guardarse como un registro con: número correlativo, fecha y hora de recepción (UTC), nombre, correo y una respuesta de texto por cada pregunta.
- **DR-003.** Todas las respuestas se guardan como texto, incluidos los números, sin conversión ni cálculo.
- **DR-004.** Las respuestas no respondidas de preguntas opcionales se guardan como vacías.
- **DR-005.** Solo se recoge nombre y correo como datos de la persona; no se piden otros datos personales.

Ejemplo ilustrativo de una pregunta como dato:

```json
{
  "id": "p05",
  "section": "problema",
  "label": "¿Qué problema quieres resolver con este software?",
  "help": "Cuéntalo como se lo explicarías a un amigo.",
  "example": "Hoy anoto los pedidos en un cuaderno y se me pierden.",
  "required": true
}
```

## 6. Requerimientos no funcionales

- **NFR-001.** La interfaz debe diseñarse desde 360 px de ancho, en una columna, sin desplazamiento horizontal, y ampliarse en pantallas mayores.
- **NFR-002.** Los elementos que se tocan deben medir al menos 44 × 44 px, con separación entre ellos.
- **NFR-003.** El texto de los campos debe ser de al menos 16 px; las respuestas largas usan área de texto que crece y no se corta.
- **NFR-004.** Una persona nueva debe completar el formulario sin ayuda, con etiquetas visibles y errores junto al campo. Se comprueba con 3 a 5 personas reales.
- **NFR-005.** La primera pantalla debe ser utilizable en menos de 3 segundos con datos móviles típicos.
- **NFR-006.** La interfaz debe cumplir WCAG 2.2 nivel AA (contraste, tamaños, lector de pantalla).
- **NFR-007.** Debe funcionar en las últimas versiones de Chrome (Android) y Safari (iOS).
- **NFR-008.** Todo el tráfico debe usar HTTPS y las respuestas se validan también en el servidor.
- **NFR-009.** El sistema debería limitar envíos repetidos por dispositivo o por tiempo para evitar spam.
- **NFR-010.** Debe haber copia de respaldo periódica de las respuestas guardadas.
- **NFR-011.** La interfaz debe estar en español, con todos los textos en un solo lugar de configuración.
- **NFR-012.** Debe poder agregarse o cambiarse una pregunta editando solo la configuración (ver DR-001).

Privacidad: el aviso de privacidad no es obligatorio según lo indicado (no hay datos sensibles), pero se recomienda una línea visible: "Usaremos tu nombre y correo solo para contactarte sobre tu solicitud." Si luego se recogen otros datos personales, conviene revisar la normativa del país (en Perú, la Ley N.º 29733); no es asesoría legal.

## 7. Banco de preguntas del formulario

Son las preguntas iniciales (texto libre). Valen para cualquier tipo de software y están redactadas de forma abierta y neutral, sin asumir si será una web, una app u otra cosa. La columna de ayuda se muestra debajo de cada pregunta; los ejemplos son ilustrativos y deben cambiar de tema para no inducir la respuesta. Se pueden editar sin tocar el código (DR-001, NFR-012).

### Sección 1. El problema

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-01 | ¿Qué problema o necesidad quieres resolver? | Cuéntalo como se lo explicarías a un amigo. | Sí |
| QB-02 | ¿Por qué es importante resolverlo ahora? | Por ejemplo: pierdo tiempo, cometo errores, quiero crecer. | Sí |
| QB-03 | ¿Qué pasa si no se resuelve? | Qué te costaría en tiempo, dinero u oportunidades. | No |
| QB-04 | ¿Has intentado resolverlo antes? ¿Qué funcionó y qué no? | Herramientas, programas o métodos que probaste. | No |

### Sección 2. Cómo lo haces hoy

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-05 | Describe paso a paso cómo realizas hoy esta actividad. | Desde que empieza hasta que termina. | Sí |
| QB-06 | ¿Qué herramientas, papeles o archivos usas hoy? | Cuaderno, hoja de cálculo, mensajes, otro programa. | No |
| QB-07 | ¿Dónde se pierden tiempo, dinero o información? ¿Qué errores ocurren? | Cuenta el último caso en que pasó. | Sí |
| QB-08 | ¿Quiénes participan en esta actividad y qué hace cada uno? | Roles o cargos, no hace falta dar nombres. | No |

### Sección 3. Quiénes lo usarán

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-09 | ¿Quiénes usarían el software? | Tipos de personas y cuántas aproximadamente. | Sí |
| QB-10 | ¿Qué necesita hacer cada tipo de persona con el software? | Una lista por tipo de persona. | Sí |
| QB-11 | ¿Qué tanta experiencia tienen con tecnología? | Usan poco el celular, usan programas a diario, etc. | No |
| QB-12 | ¿Alguien administraría el software (altas, bajas, correcciones)? ¿Quién? |  | No |

### Sección 4. Qué debe hacer el software

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-13 | ¿Qué objetivos esperas lograr con el software? | Lo que quieres que cambie cuando esté funcionando. | Sí |
| QB-14 | Enumera las funciones o tareas que debe permitir. | Aunque sean ideas sueltas; luego se ordenan. | Sí |
| QB-15 | ¿Qué información se registrará, consultará, cambiará, borrará o exportará? | Datos que se manejan y quién los usa. | Sí |
| QB-16 | ¿Qué reglas o políticas deben cumplirse siempre? Da un ejemplo con números o casos reales. | Por ejemplo, de otra actividad: "un pedido grande necesita aprobación". | No |
| QB-17 | ¿Qué situaciones raras o excepciones pueden ocurrir? ¿Qué debería pasar en cada una? | Cancelaciones, datos faltantes, errores. | No |

### Sección 5. Resultados y permisos

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-18 | ¿Qué resultados, reportes, alertas o avisos necesitas? ¿Quién los recibe y cada cuánto? |  | No |
| QB-19 | ¿Quién debe poder ver, crear, cambiar o borrar cada tipo de información? | Qué no debería ver cierta persona. | No |
| QB-20 | ¿El software debe conectarse con otros programas o servicios que ya usas? | Correo, pagos, hojas de cálculo, etc. | No |

### Sección 6. Dónde y cómo se usará

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-21 | ¿Desde qué dispositivos o lugares se usaría? | Celular, computadora, tienda, calle, oficina. | Sí |
| QB-22 | ¿Habrá siempre conexión a internet? ¿Qué pasa si se corta? |  | No |
| QB-23 | ¿Qué información es sensible o confidencial y debe protegerse? | Datos de clientes, precios, documentos. | No |
| QB-24 | ¿Qué tan grave sería que el software no estuviera disponible un día o que se perdiera información? |  | No |
| QB-25 | ¿Cuánta información manejará y cuánto crecerá? ¿Cuántas personas lo usarían a la vez? | Cifras aproximadas hoy y en dos o tres años. | No |

### Sección 7. Prioridades, plazo y presupuesto

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-26 | De lo que mencionaste, ¿qué es imprescindible, qué sería bueno tener y qué puede esperar? | Tres listas cortas. | Sí |
| QB-27 | ¿Cuál es tu plazo? ¿Hay una fecha que no se pueda mover? ¿Por qué? |  | Sí |
| QB-28 | ¿Cuál es tu presupuesto aproximado, o cuánto estás dispuesto a invertir? Incluye costos mensuales si los hay. | Un rango sirve. | No |
| QB-29 | ¿Hay tecnologías, plataformas o proveedores que quieras usar o evitar? ¿Quién lo mantendrá después? |  | No |

### Sección 8. Éxito y cierre

| ID | Pregunta | Ayuda o ejemplo | Obligatoria |
| --- | --- | --- | --- |
| QB-30 | ¿Cómo sabrás que el software funciona bien? | Una señal, número o situación que lo muestre. | Sí |
| QB-31 | ¿Cómo sabremos que el proyecto está terminado? |  | No |
| QB-32 | Si tienes ejemplos reales (formularios, planillas, capturas), describe dónde están o cómo se ven. | En esta fase no se adjuntan archivos. | No |
| QB-33 | ¿Hay algo importante que no te hayamos preguntado? |  | No |

Las preguntas obligatorias son las marcadas "Sí" (13). Los nombres de las secciones y el orden pueden cambiarse en la configuración.

## 8. Guía para el asistente de código

### 8.1 Principios de diseño

- **DES-001.** Escribir primero los estilos para celular y ampliar con reglas para pantallas mayores.
- **DES-002.** Generar el formulario a partir de la configuración de preguntas (DR-001); no escribir preguntas fijas en la interfaz.
- **DES-003.** Validar en el cliente por comodidad y en el servidor por seguridad; el servidor es la fuente de verdad.
- **DES-004.** Ningún secreto (claves, credenciales) en el código del cliente ni en el repositorio.
- **DES-005.** Textos de la interfaz en un solo lugar.
- **DES-006.** Cada requerimiento "Debe" tiene al menos una prueba derivada de sus criterios de aceptación.

### 8.2 Reglas de comportamiento

1. No añadir funcionalidad que no esté listada (login, edición de envíos, procesamiento de respuestas, subida de archivos) sin que se registre antes como cambio.
2. Los detalles que este documento no define (nombres internos, carpetas, librerías) los decide el implementador, respetando las restricciones CON-xxx y los principios DES-xxx.
3. Referenciar identificadores (`FR-007`, `NFR-002`) en pruebas, commits y comentarios relevantes.
4. Si dos requerimientos se contradicen o uno es ambiguo, detenerse y preguntar.
5. Proponer el stack (máximo 10 líneas, con motivos) y esperar aprobación antes de generar el proyecto.
6. Resolver D-01 y D-02 (sección 9) antes de implementar FR-011 a FR-013.

### 8.3 Orden de implementación sugerido

1. Proyecto con HTTPS y la configuración de preguntas (DR-001) con el banco de la sección 7.
2. Formulario mobile first con secciones, avance y validaciones (FR-001 a FR-006).
3. Guardado en el dispositivo y restauración (FR-007, FR-010).
4. Envío, confirmación y error (FR-008, FR-009, FR-011).
5. Vista del analista: lista, detalle y acceso (FR-012, FR-013).
6. Exportación (FR-015) y mejoras de robustez (NFR-009, NFR-010).
7. Pruebas de aceptación, accesibilidad y rendimiento.

### 8.4 Instrucción de arranque (para pegar en el IDE)

```text
Lee el SRS completo. No agregues funcionalidad que no esté listada. Primero propón el stack (máximo 10 líneas, con motivos) y la estructura del proyecto, y espera aprobación. Luego implementa en el orden de la sección 8.3, creando para cada requerimiento "Debe" una prueba basada en sus criterios de aceptación. Al terminar cada paso, indica qué FR/NFR cubre. Pregunta antes de decidir D-01 y D-02.
```

## 9. Verificación y decisiones abiertas

### 9.1 Criterios de aceptación de la Fase 1

- [ ] Una persona abre el enlace en un celular Android y en un iPhone y completa el formulario sin ayuda.
- [ ] No hay desplazamiento horizontal desde 360 px de ancho.
- [ ] Aparecen las 33 preguntas de la sección 7, en sus secciones, y las 13 obligatorias exigen respuesta.
- [ ] Un correo con formato inválido se rechaza con un mensaje claro junto al campo.
- [ ] Al recargar la página a medias, las respuestas se conservan; tras un envío exitoso se vacían.
- [ ] Un envío válido queda guardado con número, fecha y hora, y se muestra la confirmación; un doble toque no lo duplica.
- [ ] Si el envío falla, se muestra un mensaje con Reintentar y no se pierde lo escrito.
- [ ] El analista ve la lista de respuestas y puede leer cada una completa; una persona sin autorización no ve nada.
- [ ] Todo el tráfico usa HTTPS.
- [ ] Se probó con 3 a 5 personas reales y se registraron sus observaciones.
- [ ] Quien define el producto acepta por escrito que la fase cumple lo acordado.

### 9.2 Decisiones abiertas

Son las únicas decisiones que bloquean la implementación. Cada una trae una opción recomendada para avanzar si no se decide otra.

| ID | Decisión | Opciones | Recomendación |
| --- | --- | --- | --- |
| D-01 | ¿Dónde se guardan los envíos y cómo entra el analista? | A) Un servicio de guardado mínimo (base de datos gestionada) con una clave simple para el analista. B) Sin servidor: el formulario genera un archivo o correo que el respondiente envía, y el analista lo recibe por ese canal. | A, porque sin guardado central no existe la lista de respuestas (FR-011, FR-012). Si se elige B, FR-011 a FR-013 cambian. |
| D-02 | ¿Cómo se autoriza al analista en la Fase 1? | A) Clave compartida en un enlace privado. B) Inicio de sesión simple con correo y contraseña. | A para la Fase 1 (la gestión de cuentas queda para después, como indicaste). |
| D-03 | ¿Qué stack se usará? | El implementador propone una opción simple y de bajo costo (CON-005). | Aprobar la propuesta antes de programar. |

### 9.3 Riesgos

- **RISK-001.** Formulario largo (33 preguntas) en celular: riesgo de abandono. Mitigación: guardado automático, avance visible, solo 13 obligatorias, prueba con personas reales.
- **RISK-002.** Respuestas muy cortas o vagas. Mitigación en Fase 1: ayuda y ejemplo bajo cada pregunta; una Fase 2 podría sugerir al respondiente ampliar respuestas vagas.
- **RISK-003.** Envíos de spam. Mitigación: NFR-009.
- **RISK-004.** Sin edición posterior, un error del respondiente no se corrige. Mitigación: el analista contacta por el correo que dejó.
- **RISK-005.** Correo escrito mal o falso. Mitigación: validar formato (FR-006); verificarlo queda para después.

## 10. Apéndices

### 10.1 Glosario

- **Respondiente:** persona que completa el formulario.
- **Analista:** persona que revisa las respuestas recibidas.
- **Envío:** cada vez que un respondiente completa y envía el formulario.
- **Mobile first:** diseñar y probar primero para celular y ampliar después.
- **Texto libre:** respuesta escrita con las palabras de la persona, sin opciones fijas.

### 10.2 Control de cambios

Tras aprobar la Fase 1, todo cambio se registra aquí antes de implementarlo: fecha, cambio pedido, motivo, requerimientos afectados, decisión (ahora, después o no).

### 10.3 Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 0.1 | 2026-10-12 | Primer borrador con hechos confirmados y propuestas |
| 0.2 | 2026-10-12 | Reestructurado como SRS con roles generales |
| 0.3 | 2026-10-13 | Producto redefinido como formulario de levantamiento de requerimientos (texto libre, sin login, sin procesamiento); formato ID + descripción; banco de 33 preguntas; decisiones abiertas D-01 a D-03 |
