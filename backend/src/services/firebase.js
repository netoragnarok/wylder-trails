let adminInstance = null;

function getAdmin() {
  if (adminInstance) return adminInstance;

  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️  Firebase credentials not set. Auth middleware will reject all requests.');
      // Inicializa sem credenciais para não travar o servidor
      admin.initializeApp({ projectId: projectId || 'placeholder' });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }

  adminInstance = admin;
  return admin;
}

module.exports = getAdmin;
