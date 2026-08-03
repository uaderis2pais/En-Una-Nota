import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, AlertCircle, Calendar, Youtube, Lightbulb } from 'lucide-react';

export const AudioPlayer = ({ 
  audioUrl, 
  startTime = 0,
  maxAllowedTime, 
  isGameOver = false,
  attemptTimes = [0.5, 1, 2, 3, 5, 10, 15],
  targetSong = null
}) => {
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Duración máxima de la línea de tiempo (15s en juego, 30s en fin de juego)
  const maxGameDuration = attemptTimes[attemptTimes.length - 1] || 15;
  const totalTimelineDuration = isGameOver ? 30 : maxGameDuration;

  // Formateador de vistas de YouTube
  const formatExactViews = (views) => {
    const rawViews = Number(views || 0);
    if (!rawViews || rawViews === 0) return '+10M';
    if (rawViews >= 1000000) return `${(rawViews / 1000000).toFixed(1)}M`;
    if (rawViews >= 1000) return `${(rawViews / 1000).toFixed(0)}K`;
    return rawViews.toString();
  };

  // Detener bucle de animación
  const stopAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // Inicializar / resetear la fuente de audio HTML5
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    stopAnimation();
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.preload = 'auto';
    } else {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }

    const audio = audioRef.current;
    audio.currentTime = startTime;
    setCurrentTime(0);
    setIsPlaying(false);

    const handleError = (e) => {
      console.error("Error al cargar audio:", e);
      setHasError(true);
      setErrorMessage("No se pudo reproducir el fragmento de audio.");
      setIsPlaying(false);
      stopAnimation();
    };

    audio.addEventListener('error', handleError);

    return () => {
      stopAnimation();
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [audioUrl, startTime, isGameOver]);

  // Si cambia el intento maxAllowedTime, resetear la barra al inicio (0)
  useEffect(() => {
    stopAnimation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = startTime;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [maxAllowedTime, startTime]);

  /**
   * Bucle de Alta Precisión (RequestAnimationFrame @ 60fps/120fps)
   */
  const updatePlaybackLoop = () => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const elapsed = Math.max(0, audio.currentTime - startTime);

    if (!isGameOver && elapsed >= maxAllowedTime) {
      audio.pause();
      audio.currentTime = startTime;
      setCurrentTime(maxAllowedTime);
      setIsPlaying(false);
      stopAnimation();
      return;
    }

    if (audio.ended) {
      audio.currentTime = startTime;
      setCurrentTime(isGameOver ? 30 : maxAllowedTime);
      setIsPlaying(false);
      stopAnimation();
      return;
    }

    setCurrentTime(elapsed);

    if (!audio.paused) {
      animFrameRef.current = requestAnimationFrame(updatePlaybackLoop);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || hasError) return;

    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      stopAnimation();
      setIsPlaying(false);
    } else {
      try {
        if (!isGameOver && (currentTime >= maxAllowedTime || currentTime < 0)) {
          audio.currentTime = startTime;
          setCurrentTime(0);
        }

        stopAnimation();
        await audio.play();
        setIsPlaying(true);
        animFrameRef.current = requestAnimationFrame(updatePlaybackLoop);
      } catch (err) {
        console.error("Error al reproducir audio:", err);
        setHasError(true);
        setErrorMessage("El navegador bloqueó la reproducción automática.");
        setIsPlaying(false);
        stopAnimation();
      }
    }
  };

  const formatTime = (timeInSec) => {
    return `${timeInSec.toFixed(2)}s`;
  };

  const progressPercentage = Math.min(100, (currentTime / totalTimelineDuration) * 100);

  return (
    <div className="w-full max-w-xl mx-auto my-3 sm:my-4 p-4 sm:p-5 glass-panel rounded-2xl border border-slate-800 shadow-2xl space-y-3 sm:space-y-4">
      {/* SECCIÓN SUPERIOR DE PISTAS */}
      {targetSong && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>Pistas:</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
            {/* Pista 1: Año de Lanzamiento */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-800 shadow-sm"
              title="Año oficial de lanzamiento"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Año: <strong className="text-cyan-300 font-mono text-xs">{targetSong.year || '2000'}</strong></span>
            </div>

            {/* Pista 2: Visualizaciones en YouTube */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 text-slate-200 border border-rose-500/30 shadow-sm"
              title="Visualizaciones acumuladas en YouTube"
            >
              <Youtube className="w-3.5 h-3.5 text-rose-400 shrink-0 fill-current" />
              <span>YouTube: <strong className="text-rose-300 font-mono text-xs">+{formatExactViews(targetSong.reproducciones || targetSong.views)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ENCABEZADO DEL REPRODUCTOR */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 shrink-0">
          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Fragmento: <strong className="text-emerald-400 font-mono text-xs sm:text-sm">{isGameOver ? '30s (Completo)' : `${maxAllowedTime}s`}</strong></span>
        </div>

        {/* Barras de Ecualizador Animado */}
        <div className="hidden xs:flex items-center gap-1 h-5">
          {[40, 70, 30, 90, 60, 100, 45, 80].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying 
                  ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 animate-pulse' 
                  : 'bg-slate-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(15, (height * Math.random()) + 20)}%` : '20%',
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        <div className="text-xs font-mono font-bold text-slate-200 shrink-0 whitespace-nowrap bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          {formatTime(currentTime)} / {isGameOver ? '30.00s' : formatTime(maxAllowedTime)}
        </div>
      </div>

      {/* NAVEGACIÓN Y MARCADORES LIMPIOS (SIN MINICARDS) INTERCALADOS ARRIBA Y ABAJO */}
      <div className="relative w-full py-7 my-2 flex items-center justify-center">
        {/* BARRA DE PROGRESO CENTRADA EN EL MEDIO */}
        <div className="w-full h-4 bg-slate-950/90 rounded-full overflow-hidden border border-slate-700/80 relative z-10 shadow-inner">
          {!isGameOver && (
            <div 
              className="absolute left-0 top-0 bottom-0 bg-emerald-950/50 border-r-2 border-emerald-400/80 transition-all duration-200"
              style={{ width: `${(maxAllowedTime / totalTimelineDuration) * 100}%` }}
            />
          )}

          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-lg shadow-emerald-500/60"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* TICKS INTERCALADOS (ARRIBA Y ABAJO) SIN ATRAVESAR LA BARRA Y SIN MINICARDS */}
        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
          {attemptTimes.map((time, idx) => {
            const positionPct = (time / totalTimelineDuration) * 100;
            const isUnlocked = time <= maxAllowedTime || isGameOver;
            const isTop = idx % 2 === 0; // Pares arriba (0.5s, 2s, 5s, 15s), Impares abajo (1s, 3s, 10s)

            return (
              <div 
                key={idx}
                className="absolute transform -translate-x-1/2 flex flex-col items-center z-20"
                style={{ 
                  left: `${positionPct}%`,
                  ...(isTop 
                    ? { bottom: 'calc(50% + 8px)' } 
                    : { top: 'calc(50% + 8px)' }
                  )
                }}
              >
                {isTop ? (
                  /* MARCADOR DE ARRIBA: Texto simple + línea que toca exactamente la barra */
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] sm:text-xs font-mono tracking-tight leading-none ${
                      isUnlocked ? 'text-emerald-400 font-extrabold' : 'text-slate-500 font-semibold'
                    }`}>
                      {time}s
                    </span>
                    <div className={`w-0.5 h-2.5 mt-1 ${isUnlocked ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                  </div>
                ) : (
                  /* MARCADOR DE ABAJO: Línea que toca exactamente la barra + Texto simple */
                  <div className="flex flex-col items-center">
                    <div className={`w-0.5 h-2.5 mb-1 ${isUnlocked ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className={`text-[10px] sm:text-xs font-mono tracking-tight leading-none ${
                      isUnlocked ? 'text-emerald-400 font-extrabold' : 'text-slate-500 font-semibold'
                    }`}>
                      {time}s
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerta de Error */}
      {hasError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-300 text-xs justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Botón Principal Play / Pause */}
      <div className="flex justify-center pt-1">
        <button
          onClick={togglePlayPause}
          disabled={hasError}
          className={`w-15 h-15 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 shadow-xl ${
            hasError
              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
              : isPlaying 
                ? 'bg-slate-800 text-emerald-400 border-2 border-emerald-500 shadow-emerald-500/20' 
                : 'bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-emerald-500/30 hover:scale-105'
          }`}
          aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current stroke-none" />
          ) : (
            <Play className="w-8 h-8 fill-current stroke-none ml-1" />
          )}
        </button>
      </div>
    </div>
  );
};
