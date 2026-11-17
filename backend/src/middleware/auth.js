const getAdmin = require('../services/firebase');
const db = require('../db');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const admin = getAdmin();
    const decoded = await admin.auth().verifyIdToken(token);

    // Busca ou cria usuário no banco
    const { rows } = await db.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decoded.uid]
    );

    if (rows.length === 0) {
      const { rows: newUser } = await db.query(
        `INSERT INTO users (firebase_uid, name, email, avatar_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [decoded.uid, decoded.name || 'Trilheiro', decoded.email, decoded.picture || null]
      );
      req.user = newUser[0];
    } else {
      req.user = rows[0];
    }

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = { authenticate };
