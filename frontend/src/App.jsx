import React, { useState, useEffect, useMemo } from 'react';
import { ATTEMPT_TIMES, TOTAL_ATTEMPTS } from './data/songs';
import { Header } from './components/Header';
import { AudioPlayer } from './components/AudioPlayer';
import { AttemptList } from './components/AttemptList';
import { SongSearch } from './components/SongSearch';
import { GameResultModal } from './components/GameResultModal';
import { HomeView, CATEGORIES } from './components/HomeView';
import { SuggestSongModal } from './components/SuggestSongModal';
import AdminView from './views/AdminView';
import { AlertCircle, RefreshCw, Lightbulb } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper local YYYY-MM-DD sin desfasaje UTC
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function App() {
  // Estado de vista actual ('HOME' | 'GAME' | 'ADMIN')
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedCategory, setSelectedCategory] = useState('general');

  // Estado para Modal de Sugerencias de Canciones de Usuario
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestInitialGenre, setSuggestInitialGenre] = useState('rock');

  const handleOpenSuggest = (genreId) => {
    if (genreId) setSuggestInitialGenre(genreId);
    setIsSuggestModalOpen(true);
  };

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

  // Estado del catálogo total de canciones
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/canciones`)
      .then(res => res.json())
      .then(data => {
        if (data.success && typeof data.count === 'number') {
          setTotalCatalogCount(data.count);
        }
      })
      .catch(err => console.error("Error cargando total de canciones:", err));
  }, []);

  // Escuchar Hash o Ruta #admin para abrir el Panel de Control Oculto
  useEffect(() => {
    const checkHashRoute = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setCurrentView('ADMIN');
      }
    };
    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  /**
   * Carga la canción del día y el catálogo según la categoría seleccionada
   */
  const fetchDailySongAndCatalog = async (category) => {
    setIsLoading(true);
    setError(null);
    setTargetSong(null);

    try {
      const resSong = await fetch(`${API_BASE_URL}/cancion-hoy?categoria=${category}`);
      const dataSong = await resSong.json();

      const resCatalog = await fetch(`${API_BASE_URL}/canciones?genero=${category}`);
      const dataCatalog = await resCatalog.json();

      if (dataSong.success && dataSong.data) {
        const song = dataSong.data;
        const todayStr = song.date || getLocalDateString();
        const storageKey = `en_una_nota_daily_${category}_${todayStr}`;
        
        const savedState = localStorage.getItem(storageKey);

        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setCurrentAttemptIndex(parsed.currentAttemptIndex ?? 0);
            if (parsed.attempts && parsed.attempts.length === TOTAL_ATTEMPTS) {
              setAttempts(parsed.attempts);
            } else {
              setAttempts(Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' })));
            }
            setGameStatus(parsed.gameStatus ?? 'PLAYING');
          } catch (e) {
            console.error("Error al parsear localStorage:", e);
            setGameStatus('PLAYING');
            setCurrentAttemptIndex(0);
            setAttempts(Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' })));
          }
        } else {
          setCurrentAttemptIndex(0);
          setGameStatus('PLAYING');
          setAttempts(Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' })));
        }

        setTargetSong(song);
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
   * Guardar estado en localStorage
   */
  useEffect(() => {
    if (!targetSong || currentView !== 'GAME' || isLoading) return;

    const todayStr = targetSong.date || getLocalDateString();
    const storageKey = `en_una_nota_daily_${selectedCategory}_${todayStr}`;

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        songId: targetSong.id,
        date: todayStr,
        currentAttemptIndex,
        attempts,
        gameStatus
      }));
    } catch (e) {
      console.error("Error al guardar en localStorage:", e);
    }
  }, [targetSong, selectedCategory, currentAttemptIndex, attempts, gameStatus, currentView, isLoading]);

  /**
   * Sistema de Rachas Doble (Participación + Victorias)
   */
  const updateStreaksOnGameEnd = (category, isWin) => {
    const todayStr = getLocalDateString();
    const streakKey = `en_una_nota_streaks_${category}`;

    let playStreak = 0;
    let winStreak = 0;
    let lastPlayedDate = null;
    let lastWinDate = null;

    try {
      const raw = localStorage.getItem(streakKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        playStreak = parsed.playStreak || 0;
        winStreak = parsed.winStreak || 0;
        lastPlayedDate = parsed.lastPlayedDate;
        lastWinDate = parsed.lastWinDate;
      }
    } catch (e) {
      console.error("Error leyendo rachas:", e);
    }

    if (lastPlayedDate === todayStr) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let newPlayStreak = (lastPlayedDate === yesterdayStr) ? playStreak + 1 : 1;

    let newWinStreak = 0;
    if (isWin) {
      newWinStreak = (lastWinDate === yesterdayStr || lastPlayedDate === yesterdayStr) ? winStreak + 1 : 1;
    } else {
      newWinStreak = 0;
    }

    const updatedData = {
      playStreak: newPlayStreak,
      winStreak: newWinStreak,
      lastPlayedDate: todayStr,
      lastWinDate: isWin ? todayStr : lastWinDate
    };

    try {
      localStorage.setItem(streakKey, JSON.stringify(updatedData));
    } catch (e) {
      console.error("Error guardando rachas:", e);
    }
  };

  const getActiveCategoryStreaks = () => {
    try {
      const raw = localStorage.getItem(`en_una_nota_streaks_${selectedCategory}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          playStreak: parsed.playStreak || 0,
          winStreak: parsed.winStreak || 0
        };
      }
    } catch (e) {
      console.error(e);
    }
    return { playStreak: 0, winStreak: 0 };
  };

  const activeStreaks = getActiveCategoryStreaks();

  const searchCatalog = useMemo(() => {
    if (!targetSong) return catalog;
    const exists = catalog.some(
      s => String(s.id) === String(targetSong.id) || 
           (s.title.toLowerCase() === targetSong.title.toLowerCase() && s.artist.toLowerCase() === targetSong.artist.toLowerCase())
    );
    return exists ? catalog : [targetSong, ...catalog];
  }, [catalog, targetSong]);

  const isGameOver = gameStatus !== 'PLAYING';
  const currentMaxTime = isGameOver 
    ? 30 
    : ATTEMPT_TIMES[currentAttemptIndex] || 15;

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
      updateStreaksOnGameEnd(selectedCategory, true);
    } else {
      if (currentAttemptIndex < TOTAL_ATTEMPTS - 1) {
        setCurrentAttemptIndex((prev) => prev + 1);
      } else {
        setGameStatus('LOST');
        updateStreaksOnGameEnd(selectedCategory, false);
      }
    }
  };

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
      updateStreaksOnGameEnd(selectedCategory, false);
    }
  };

  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);
  const categoryDisplayName = activeCategoryObj ? activeCategoryObj.name : selectedCategory;

  // RENDER PANTALLA DE ADMIN OCULTA
  if (currentView === 'ADMIN') {
    return (
      <div className="relative">
        <button
          onClick={() => {
            window.location.hash = '';
            setCurrentView('HOME');
          }}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 shadow-lg"
        >
          ← Volver al Juego
        </button>
        <AdminView />
      </div>
    );
  }

  // RENDER PANTALLA PRINCIPAL (HOME)
  if (currentView === 'HOME') {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between">
        <HomeView 
          onSelectCategory={handleSelectCategory} 
          onOpenSuggest={handleOpenSuggest}
          totalSongsCount={totalCatalogCount}
        />
        
        <footer className="text-center text-[11px] text-slate-600 pb-6 flex flex-wrap items-center justify-center gap-3">
          <span>Me Suena a... © 2026</span>
          <span>•</span>
          <a
            href="https://portfolio-2026-changes.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400/80 hover:text-emerald-300 font-bold"
          >
            Creado por Facundo Bautista Pais
          </a>
          <span>•</span>
          <button 
            onClick={() => setIsSuggestModalOpen(true)}
            className="text-amber-400/80 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3 fill-amber-400" />
            <span>Sugerir Canción</span>
          </button>
          <span>•</span>
          <a 
            href="#admin" 
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#admin';
              setCurrentView('ADMIN');
            }} 
            className="text-slate-700 hover:text-slate-500 underline text-[10px]"
          >
            Admin
          </a>
        </footer>

        <SuggestSongModal 
          isOpen={isSuggestModalOpen}
          onClose={() => setIsSuggestModalOpen(false)}
          initialGenre={suggestInitialGenre}
        />
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
        <Header 
          onGoHome={() => setCurrentView('HOME')}
          categoryName={categoryDisplayName}
          playStreak={activeStreaks.playStreak}
          winStreak={activeStreaks.winStreak}
          onOpenSuggest={handleOpenSuggest}
        />

        <AudioPlayer 
          audioUrl={targetSong.audioUrl}
          startTime={targetSong.startTime || 0}
          maxAllowedTime={currentMaxTime}
          isGameOver={isGameOver}
          attemptTimes={ATTEMPT_TIMES}
          targetSong={targetSong}
        />

        <AttemptList 
          attempts={attempts}
          currentAttemptIndex={currentAttemptIndex}
          attemptTimes={ATTEMPT_TIMES}
          isGameOver={isGameOver}
        />

        <SongSearch 
          songList={searchCatalog}
          onGuess={handleGuess}
          onSkip={handleSkip}
          isGameOver={isGameOver}
          currentAttemptTime={ATTEMPT_TIMES[currentAttemptIndex]}
        />

        <GameResultModal 
          gameStatus={gameStatus}
          targetSong={targetSong}
          attemptsCount={currentAttemptIndex + 1}
          onGoHome={() => setCurrentView('HOME')}
        />
      </div>

      <footer className="text-center text-[11px] text-slate-600 pt-6 flex flex-wrap items-center justify-center gap-3">
        <span>Me Suena a... © 2026 • Categoría {categoryDisplayName}</span>
        <span>•</span>
        <a
          href="https://portfolio-2026-changes.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400/80 hover:text-emerald-300 font-bold"
        >
          Creado por Facundo Bautista Pais
        </a>
        <span>•</span>
        <button 
          onClick={() => setIsSuggestModalOpen(true)}
          className="text-amber-400/80 hover:text-amber-300 font-bold flex items-center gap-1"
        >
          <Lightbulb className="w-3 h-3 fill-amber-400" />
          <span>Sugerir Canción</span>
        </button>
        <span>•</span>
        <a 
          href="#admin" 
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '#admin';
            setCurrentView('ADMIN');
          }} 
          className="text-slate-700 hover:text-slate-500 underline text-[10px]"
        >
          Admin
        </a>
      </footer>

      <SuggestSongModal 
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        initialGenre={suggestInitialGenre}
      />
    </div>
  );
}

export default App;
