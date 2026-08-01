import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db.js';
import songRoutes from './routes/songRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de comprobación de estado de la API (Healthcheck)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'En Una Nota API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas principales de la API
app.use('/api', songRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada en la API'
  });
});

// Inicialización del servidor HTTP y la conexión a PostgreSQL
app.listen(PORT, async () => {
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT} (http://localhost:${PORT})`);
  await initDatabase();
});
