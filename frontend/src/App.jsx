import React, { useState, useEffect } from 'react';
import { MOCK_SONGS, ATTEMPT_TIMES, TOTAL_ATTEMPTS } from './data/songs';
import { Header } from './components/Header';
import { AudioPlayer } from './components/AudioPlayer';
import { AttemptList } from './components/AttemptList';
import { SongSearch } from './components/SongSearch';
import { GameResultModal } from './components/GameResultModal';

const STORAGE_KEY = 'en_una_nota_game_state_v1';

// Función para obtener el estado guardado desde localStorage
const loadSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.songIndex === 'number' && Array.isArray(parsed.attempts)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error al cargar localStorage:", err);
  }
  return null;
};

export function App() {
  const savedState = loadSavedState();

  // Estado de la canción activa (rotando entre MOCK_SONGS)
  const [songIndex, setSongIndex] = useState(savedState?.songIndex ?? 0);
  const targetSong = MOCK_SONGS[songIndex] || MOCK_SONGS[0];

  // Estado del intento actual (0 a TOTAL_ATTEMPTS - 1)
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(savedState?.currentAttemptIndex ?? 0);

  // Estado de los 7 intentos
  const [attempts, setAttempts] = useState(() => {
    if (savedState?.attempts && savedState.attempts.length === TOTAL_ATTEMPTS) {
      return savedState.attempts;
    }
    return Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' }));
  });

  // Estado general del juego: 'PLAYING' | 'WON' | 'LOST'
  const [gameStatus, setGameStatus] = useState(savedState?.gameStatus ?? 'PLAYING');

  // Guardar en localStorage ante cualquier cambio de estado del juego
  useEffect(() => {
    try {
      const stateToStore = {
        songIndex,
        currentAttemptIndex,
        attempts,
        gameStatus
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (err) {
      console.error("Error guardando en localStorage:", err);
    }
  }, [songIndex, currentAttemptIndex, attempts, gameStatus]);

  // Límite de tiempo actual de reproducción (0.3s a 7s en juego, 30s al terminar)
  const isGameOver = gameStatus !== 'PLAYING';
  const currentMaxTime = isGameOver 
    ? 30 
    : ATTEMPT_TIMES[currentAttemptIndex] || 7;

  /**
   * Maneja la acción de arriesgar una canción ("Adivinar")
   */
  const handleGuess = (selectedSong) => {
    if (isGameOver) return;

    const isCorrect = selectedSong.id === targetSong.id || 
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
   * Pasa a la siguiente canción de prueba y reinicia el estado guardado
   */
  const handleResetGame = () => {
    const nextIndex = (songIndex + 1) % MOCK_SONGS.length;
    setSongIndex(nextIndex);
    setCurrentAttemptIndex(0);
    setGameStatus('PLAYING');
    const freshAttempts = Array(TOTAL_ATTEMPTS).fill(null).map(() => ({ status: 'pending', guessText: '' }));
    setAttempts(freshAttempts);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        songIndex: nextIndex,
        currentAttemptIndex: 0,
        attempts: freshAttempts,
        gameStatus: 'PLAYING'
      }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between px-4 pb-8">
      {/* Contenedor Principal */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        {/* Cabecera */}
        <Header 
          onResetGame={handleResetGame}
          currentSongIndex={songIndex}
          totalSongs={MOCK_SONGS.length}
        />

        {/* Reproductor de Audio Minimalista */}
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

        {/* Formulario / Buscador de Canciones */}
        <SongSearch 
          songList={MOCK_SONGS}
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
        En Una Nota © 2026 • Música en Español • Estado Guardado Automáticamente
      </footer>
    </div>
  );
}

export default App;
