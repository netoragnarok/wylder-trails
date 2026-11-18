let adminInstance = null;

function getAdmin() {
  if (adminInstance) return adminInstance;

  const admin = require('firebase-admin');

  if (admin.apps.length) {
    adminInstance = admin;
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const hasRealCredentials =
    projectId &&
    privateKey &&
    clientEmail &&
    privateKey !== 'placeholder' &&
    privateKey.includes('BEGIN PRIVATE KEY');

  if (hasRealCredentials) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin inicializado com credenciais reais.');
    } catch (err) {
      console.warn('⚠️  Firebase credential error:', err.message);
      admin.initializeApp({ projectId: projectId || 'wylder-dev' });
    }
  } else {
    console.warn('⚠️  Firebase credentials not configured. Auth will reject all tokens.');
    // Inicializa sem credenciais reais — servidor sobe, /health e /api/trails funcionam
    admin.initializeApp({ projectId: projectId || 'wylder-dev' });
  }

  adminInstance = admin;
  return admin;
}

module.exports = getAdmin;
