// NFR-010: copia de respaldo de todos los envíos a un archivo JSON.
// Credenciales: variable FIREBASE_CUENTA_SERVICIO con el JSON de una cuenta de
// servicio (en GitHub Actions viene de un secreto; nunca se guarda en el repositorio, DES-004).
import { mkdirSync, writeFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const cuenta = process.env.FIREBASE_CUENTA_SERVICIO;
if (!cuenta) {
  console.error('Falta la variable FIREBASE_CUENTA_SERVICIO con el JSON de la cuenta de servicio.');
  process.exit(1);
}

const db = getFirestore(initializeApp({ credential: cert(JSON.parse(cuenta)) }));
const instantanea = await db.collection('envios').orderBy('numero').get();
const envios = instantanea.docs.map((d) => {
  const datos = d.data();
  return { id: d.id, ...datos, recibido: datos.recibido?.toDate().toISOString() ?? null };
});

mkdirSync('respaldos', { recursive: true });
const archivo = `respaldos/envios-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(archivo, JSON.stringify({ generado: new Date().toISOString(), total: envios.length, envios }, null, 2));
console.log(`${envios.length} envíos respaldados en ${archivo}`);
