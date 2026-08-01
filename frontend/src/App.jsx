import React, { useState, useEffect } from 'react';
import { ATTEMPT_TIMES, TOTAL_ATTEMPTS } from './data/songs';
import { Header } from './components/Header';
import { AudioPlayer } from './components/AudioPlayer';
import { AttemptList } from './components/AttemptList';
import { SongSearch } from './components/SongSearch';
import { GameResultModal } from './components/GameResultModal';
import { HomeView, CATEGORIES } from './components/HomeView';
import { AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

export function App() {
  // Estado de vista actual ('HOME' | 'GAME')
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedCategory, setSelectedCategory] = useState('general');

  // Estado de datos desde la API
  const [targetSong, setTargetSong] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado del juego
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [attempts, setAttempts] = useState(
    Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' }))
  );
  const [gameStatus, setGameStatus] = useState('PLAYING');

  /**
   * Carga la canción del día y el catálogo según la categoría seleccionada
   */
  const fetchDailySongAndCatalog = async (category) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtener la canción del día para esta categoría
      const resSong = await fetch(`${API_BASE_URL}/cancion-hoy?categoria=${category}`);
      const dataSong = await resSong.json();

      // 2. Obtener el catálogo para el autocompletado del buscador en esta categoría
      const resCatalog = await fetch(`${API_BASE_URL}/canciones?genero=${category}`);
      const dataCatalog = await resCatalog.json();

      if (dataSong.success && dataSong.data) {
        const song = dataSong.data;
        setTargetSong(song);

        // Restaurar estado guardado de localStorage para esta canción y categoría
        const storageKey = `en_una_nota_daily_${category}_${song.id}_${song.date || 'today'}`;
        const savedState = localStorage.getItem(storageKey);

        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setCurrentAttemptIndex(parsed.currentAttemptIndex ?? 0);
            if (parsed.attempts && parsed.attempts.length === TOTAL_ATTEMPTS) {
              setAttempts(parsed.attempts);
            }
            setGameStatus(parsed.gameStatus ?? 'PLAYING');
          } catch (e) {
            console.error("Error al parsear localStorage:", e);
          }
        } else {
          // Si no hay estado previo, iniciar partida limpia
          setCurrentAttemptIndex(0);
          setGameStatus('PLAYING');
          setAttempts(Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' })));
        }
      } else {
        setError(dataSong.message || 'No se pudo obtener la canción del día.');
      }

      if (dataCatalog.success && Array.isArray(dataCatalog.data)) {
        setCatalog(dataCatalog.data);
      }
    } catch (err) {
      console.error("Error conectando con la API Backend:", err);
      setError('No se pudo conectar con el servidor backend (http://localhost:4000). Asegúrate de que el servidor Express esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Al seleccionar una categoría desde la pantalla Home
   */
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setCurrentView('GAME');
    fetchDailySongAndCatalog(catId);
  };

  /**
   * Guardar estado en localStorage por categoría
   */
  useEffect(() => {
    if (!targetSong || currentView !== 'GAME') return;

    const storageKey = `en_una_nota_daily_${selectedCategory}_${targetSong.id}_${targetSong.date || 'today'}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        currentAttemptIndex,
        attempts,
        gameStatus
      }));
    } catch (e) {
      console.error("Error al guardar en localStorage:", e);
    }
  }, [targetSong, selectedCategory, currentAttemptIndex, attempts, gameStatus, currentView]);

  /**
   * Sistema de Rachas (Streaks): Actualiza la racha al ganar
   */
  const updateStreakOnWin = (category) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const streakKey = `en_una_nota_streak_${category}`;

    let currentStreak = 0;
    let lastWinDate = null;

    try {
      const raw = localStorage.getItem(streakKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        currentStreak = parsed.currentStreak || 0;
        lastWinDate = parsed.lastWinDate;
      }
    } catch (e) {
      console.error("Error leyendo racha:", e);
    }

    if (lastWinDate === todayStr) {
      // Ya registró la victoria de hoy
      return;
    }

    // Calcular la fecha de ayer YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastWinDate === yesterdayStr) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }

    try {
      localStorage.setItem(streakKey, JSON.stringify({
        currentStreak: newStreak,
        lastWinDate: todayStr
      }));
    } catch (e) {
      console.error("Error guardando racha:", e);
    }
  };

  // Límite de tiempo actual de reproducción
  const isGameOver = gameStatus !== 'PLAYING';
  const currentMaxTime = isGameOver 
    ? 30 
    : ATTEMPT_TIMES[currentAttemptIndex] || 7;

  /**
   * Maneja la acción de arriesgar una canción ("Adivinar")
   */
  const handleGuess = (selectedSong) => {
    if (isGameOver || !targetSong) return;

    const isCorrect = String(selectedSong.id) === String(targetSong.id) || 
      selectedSong.title.toLowerCase() === targetSong.title.toLowerCase();

    const guessLabel = `${selectedSong.title} - ${selectedSong.artist}`;

    const newAttempts = [...attempts];
    newAttempts[currentAttemptIndex] = {
      status: isCorrect ? 'correct' : 'incorrect',
      guessText: guessLabel
    };
    setAttempts(newAttempts);

    if (isCorrect) {
      setGameStatus('WON');
      updateStreakOnWin(selectedCategory);
    } else {
      if (currentAttemptIndex < TOTAL_ATTEMPTS - 1) {
        setCurrentAttemptIndex((prev) => prev + 1);
      } else {
        setGameStatus('LOST');
      }
    }
  };

  /**
   * Maneja la acción de saltar el intento ("Saltar")
   */
  const handleSkip = () => {
    if (isGameOver) return;

    const newAttempts = [...attempts];
    newAttempts[currentAttemptIndex] = {
      status: 'skipped',
      guessText: ''
    };
    setAttempts(newAttempts);

    if (currentAttemptIndex < TOTAL_ATTEMPTS - 1) {
      setCurrentAttemptIndex((prev) => prev + 1);
    } else {
      setGameStatus('LOST');
    }
  };

  /**
   * Reinicia la partida actual de la categoría
   */
  const handleResetGame = () => {
    setCurrentAttemptIndex(0);
    setGameStatus('PLAYING');
    const freshAttempts = Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' }));
    setAttempts(freshAttempts);

    if (targetSong) {
      const storageKey = `en_una_nota_daily_${selectedCategory}_${targetSong.id}_${targetSong.date || 'today'}`;
      localStorage.removeItem(storageKey);
    }
  };

  // Buscar nombre formateado de la categoría actual
  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);
  const categoryDisplayName = activeCategoryObj ? activeCategoryObj.name : selectedCategory;

  // RENDER PANTALLA PRINCIPAL (HOME)
  if (currentView === 'HOME') {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between">
        <HomeView onSelectCategory={handleSelectCategory} />
        <footer className="text-center text-[11px] text-slate-600 pb-6">
          En Una Nota © 2026 • Juego Diario de Música en Español
        </footer>
      </div>
    );
  }

  // RENDER PANTALLA DE CARGA (LOADING)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-emerald-500/30 flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <div>
            <h2 className="font-bold text-lg text-slate-100">Cargando canción ({categoryDisplayName})...</h2>
            <p className="text-xs text-slate-400 mt-1">Conectando con la API Backend</p>
          </div>
        </div>
      </div>
    );
  }

  // RENDER PANTALLA DE ERROR
  if (error || !targetSong) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <div>
            <h2 className="font-bold text-lg text-white">No se pudo cargar el juego</h2>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('HOME')}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all"
            >
              Volver al Inicio
            </button>
            <button
              onClick={() => fetchDailySongAndCatalog(selectedCategory)}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-xs transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER PANTALLA DE JUEGO (GAME VIEW)
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between px-4 pb-8">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        {/* Cabecera con botón para volver a Home y nombre de Categoría */}
        <Header 
          onResetGame={handleResetGame}
          onGoHome={() => setCurrentView('HOME')}
          categoryName={categoryDisplayName}
          currentSongIndex={0}
          totalSongs={catalog.length || 1}
        />

        {/* Reproductor de Audio Minimalista con Alta Precisión */}
        <AudioPlayer 
          audioUrl={targetSong.audioUrl}
          startTime={targetSong.startTime || 0}
          maxAllowedTime={currentMaxTime}
          isGameOver={isGameOver}
          attemptTimes={ATTEMPT_TIMES}
        />

        {/* Lista Visual de los 7 Intentos */}
        <AttemptList 
          attempts={attempts}
          currentAttemptIndex={currentAttemptIndex}
          attemptTimes={ATTEMPT_TIMES}
          isGameOver={isGameOver}
        />

        {/* Buscador Autocompletado consumiendo catálogo real de la categoría */}
        <SongSearch 
          songList={catalog.length > 0 ? catalog : [targetSong]}
          onGuess={handleGuess}
          onSkip={handleSkip}
          isGameOver={isGameOver}
          currentAttemptTime={ATTEMPT_TIMES[currentAttemptIndex]}
        />

        {/* Modal / Card de Resultado Final (Victoria / Derrota) */}
        <GameResultModal 
          gameStatus={gameStatus}
          targetSong={targetSong}
          attemptsCount={currentAttemptIndex + 1}
          onPlayAgain={handleResetGame}
        />
      </div>

      {/* Footer minimalista */}
      <footer className="text-center text-[11px] text-slate-600 pt-6">
        En Una Nota © 2026 • Categoría {categoryDisplayName} • Canción Diaria
      </footer>
    </div>
  );
}

export default App;
