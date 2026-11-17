function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado' });
  }

  if (err.code === '23503') {
    return res.status(404).json({ error: 'Recurso referenciado não encontrado' });
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
}

module.exports = { errorHandler };
