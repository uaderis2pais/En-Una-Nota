import { Router } from 'express';
import { 
  getCancionHoy, 
  getCancionesCatalog, 
  createCancion, 
  setCancionDiaria 
} from '../controllers/songController.js';
import { crearSugerenciaUsuario } from '../controllers/adminController.js';

const router = Router();

// Rutas públicas del juego
router.get('/cancion-hoy', getCancionHoy);
router.get('/canciones', getCancionesCatalog);
router.post('/canciones', createCancion);
router.post('/cancion-diaria', setCancionDiaria);

// Ruta pública para sugerir canciones (Usuarios)
router.post('/sugerencias', crearSugerenciaUsuario);

export default router;
