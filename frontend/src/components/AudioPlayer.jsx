import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

export const AudioPlayer = ({ 
  audioUrl, 
  startTime = 0,
  maxAllowedTime, 
  isGameOver = false,
  attemptTimes = [0.3, 0.8, 1.5, 2.5, 4, 5, 7]
}) => {
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Duración máxima de la línea de tiempo (7s en juego, 30s en fin de juego)
  const maxGameDuration = attemptTimes[attemptTimes.length - 1] || 7;
  const totalTimelineDuration = isGameOver ? 30 : maxGameDuration;

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
   * Garantiza que la barra avance en tiempo real sincrónico con el audio sin lag de transiciones CSS
   */
  const updatePlaybackLoop = () => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const elapsed = Math.max(0, audio.currentTime - startTime);

    // Si no ha terminado el juego y alcanzó o superó el límite del intento
    if (!isGameOver && elapsed >= maxAllowedTime) {
      audio.pause();
      audio.currentTime = startTime;
      // Fijar el tiempo exactamente en maxAllowedTime para que la barra LLEGUE AL FINAL VISUALMENTE
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

  // Formateador de tiempo legible (0.30s, 0.80s, etc.)
  const formatTime = (timeInSec) => {
    return `${timeInSec.toFixed(2)}s`;
  };

  // Porcentaje exacto de progreso de la barra verde
  const progressPercentage = Math.min(100, (currentTime / totalTimelineDuration) * 100);

  return (
    <div className="w-full max-w-xl mx-auto my-4 p-5 glass-panel rounded-2xl border border-slate-800 shadow-2xl space-y-4">
      {/* Visual Header con tiempo límite actual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>Fragmento: <strong className="text-emerald-400 font-mono text-sm">{isGameOver ? '30s (Completo)' : `${maxAllowedTime}s`}</strong></span>
        </div>

        {/* Barras de visualizer animadas */}
        <div className="flex items-center gap-1 h-5">
          {[40, 70, 30, 90, 60, 100, 45, 80, 50, 35].map((height, i) => (
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

        <div className="text-xs font-mono font-bold text-slate-300">
          {formatTime(currentTime)} / {isGameOver ? '30.00s' : formatTime(maxAllowedTime)}
        </div>
      </div>

      {/* Contenedor de Barra de Progreso con Marcadores Ticks Escalonados */}
      <div className="relative w-full">
        {/* Track de Fondo */}
        <div className="w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800 relative">
          {!isGameOver && (
            <div 
              className="absolute left-0 top-0 bottom-0 bg-emerald-950/40 border-r border-emerald-500/50 transition-all duration-200"
              style={{ width: `${(maxAllowedTime / totalTimelineDuration) * 100}%` }}
            />
          )}

          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-lg shadow-emerald-500/50"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Ticks Escalonados: Líneas de longitud creciente (8px, 15px, 22px...) para evitar superposición de etiquetas */}
        <div className="relative w-full h-16 mt-1 overflow-visible">
          {attemptTimes.map((time, idx) => {
            const positionPct = (time / totalTimelineDuration) * 100;
            const isUnlocked = time <= maxAllowedTime || isGameOver;

            // Longitud de la línea verde creciente paso a paso (8px, 15px, 22px, 29px, 36px, 43px, 50px)
            const lineHeightPx = 8 + (idx * 7);

            return (
              <div 
                key={idx}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${positionPct}%` }}
              >
                {/* Línea verde con altura incremental */}
                <div 
                  className={`w-0.5 ${isUnlocked ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`}
                  style={{ height: `${lineHeightPx}px` }}
                />
                
                {/* Texto del tiempo colocado al final de cada línea en cascada */}
                <span className={`text-[10px] font-mono mt-0.5 whitespace-nowrap ${isUnlocked ? 'text-emerald-400 font-extrabold' : 'text-slate-600'}`}>
                  {time}s
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerta de Error */}
      {hasError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-300 text-xs justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Botón Principal de Play / Pause */}
      <div className="flex justify-center pt-2">
        <button
          onClick={togglePlayPause}
          disabled={hasError}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 shadow-xl ${
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
