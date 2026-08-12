import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { 
  adminLogin, 
  setDailyForTomorrow, 
  previewSpotifyUrl,
  addSingleSong,
  deleteSong,
  importFromSpotify,
  getSugerenciasAdmin,
  aprobarSugerenciaAdmin,
  rechazarSugerenciaAdmin,
  autoImportSongs
} from '../controllers/adminController.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASS || 'admin123';

/**
 * Middleware de Autenticación para Rutas de Administración (JWT Bearer Token)
 */
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Se requiere un token de Administrador válido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token de Administrador inválido o expirado.'
    });
  }
};

// 1. Autenticación (Pública)
router.post('/login', adminLogin);

// 2. Programar canción de mañana (Protegida)
router.post('/set-daily', verifyAdmin, setDailyForTomorrow);

// 3. Escanear/Previsualizar canción o playlist de Spotify (Protegida)
router.post('/preview', verifyAdmin, previewSpotifyUrl);

// 4. Agregar canción individual (Protegida)
router.post('/add-song', verifyAdmin, addSingleSong);

// 5. Eliminar canción individual por ID (Protegida)
router.delete('/songs/:id', verifyAdmin, deleteSong);

// 6. Importar canción o playlist completa (Protegida)
router.post('/import', verifyAdmin, importFromSpotify);

// 7. Gestión de Sugerencias de Usuarios (Protegidas)
router.get('/sugerencias', verifyAdmin, getSugerenciasAdmin);
router.post('/sugerencias/:id/aprobar', verifyAdmin, aprobarSugerenciaAdmin);
router.delete('/sugerencias/:id', verifyAdmin, rechazarSugerenciaAdmin);

// 8. Automatización Semanal para Make.com (Protegida por x-api-key)
router.post('/auto-import', autoImportSongs);

export default router;
