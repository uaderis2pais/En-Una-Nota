import { Router } from 'express';
import { 
  getCancionHoy, 
  getCancionesCatalog, 
  createCancion, 
  setCancionDiaria 
} from '../controllers/songController.js';

const router = Router();

// Ruta principal para la canción diaria (consumida por el Frontend)
router.get('/cancion-hoy', getCancionHoy);

// Rutas de catálogo y administración
router.get('/canciones', getCancionesCatalog);
router.post('/canciones', createCancion);
router.post('/cancion-diaria', setCancionDiaria);

export default router;
