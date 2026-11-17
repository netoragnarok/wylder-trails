require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const trailsRouter = require('./routes/trails');
const usersRouter = require('./routes/users');
const reviewsRouter = require('./routes/reviews');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', app: 'Wylder Trails API' });
});

// Routes
app.use('/api/trails', trailsRouter);
app.use('/api/users', usersRouter);
app.use('/api/reviews', reviewsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌲 Wylder Trails API rodando na porta ${PORT}`);
});

module.exports = app;
