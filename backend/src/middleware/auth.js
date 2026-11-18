const db = require('../db');

// Middleware de autenticação simplificado para deploy sem Firebase.
// Aceita o header Authorization: Bearer <firebase_uid>
// Em produção com Firebase configurado, substitua pela verificação de token JWT real.
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token || token === 'undefined') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    // Busca usuário pelo firebase_uid (que é o token no modo simplificado)
    const { rows } = await db.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ error: 'Erro de autenticação' });
  }
}

module.exports = { authenticate };
