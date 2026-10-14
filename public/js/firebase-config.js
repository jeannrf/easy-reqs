// Configuración web del proyecto de Firebase (Consola > Configuración del proyecto > Tus apps).
// Estos valores son públicos por diseño; la protección de los datos está en firestore.rules (DES-004).
export const firebaseConfig = {
  apiKey: 'AIzaSyA6tnBcab10X_uB49XNHm0I68TW_ASRRvo',
  authDomain: 'easy-reqs.firebaseapp.com',
  projectId: 'easy-reqs',
  appId: '1:2803410243:web:3eded0b66dd50d521f7bf6',
};

// En localhost se usan los emuladores locales (npm run emuladores), nunca el proyecto real.
export const usarEmuladores = ['localhost', '127.0.0.1'].includes(location.hostname);
export const proyectoEmulador = 'demo-easy-reqs';
