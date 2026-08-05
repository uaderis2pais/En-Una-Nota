import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, AlertCircle, Calendar, Youtube, Lightbulb, Disc3, Music } from 'lucide-react';

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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

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
    audio.volume = isMuted ? 0 : volume;
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

      {/* ENCABEZADO DEL REPRODUCTOR CON CONTROL DE VOLUMEN */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 shrink-0">
          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Fragmento: <strong className="text-emerald-400 font-mono text-xs sm:text-sm">{isGameOver ? '30s (Completo)' : `${maxAllowedTime}s`}</strong></span>
        </div>

        {/* Control de Volumen Interactivo */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              if (audioRef.current) {
                audioRef.current.volume = nextMute ? 0 : volume;
              }
            }}
            className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5"
            title={isMuted ? "Desmutear" : "Mutear"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              setIsMuted(val === 0);
              if (audioRef.current) {
                audioRef.current.volume = val;
              }
            }}
            className="w-16 sm:w-20 h-1.5 bg-slate-700 accent-emerald-400 rounded-lg cursor-pointer"
            title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
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

      {/* DISCO DE VINILO INTERACTIVO (BOTÓN PLAY/PAUSE PRINCIPAL) */}
      <div className="flex flex-col items-center justify-center pt-2 relative">
        {/* Glow de fondo para el vinilo */}
        <div className={`absolute w-44 h-44 rounded-full bg-emerald-500/25 blur-3xl transition-all duration-700 pointer-events-none ${isPlaying ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`} />

        {/* El Vinilo Completo es el Botón Clicable */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={hasError}
          className={`relative group flex items-center justify-center my-3 cursor-pointer outline-none transition-transform duration-300 active:scale-95 ${
            hasError ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'
          }`}
          title={isPlaying ? "Pausar fragmento de audio" : "Reproducir fragmento de audio"}
          aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
        >
          {/* Disco de Vinilo (Giratorio en Play) */}
          <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full vinyl-disc flex items-center justify-center border-4 shadow-2xl transition-all duration-700 relative ${
            isPlaying 
              ? 'animate-spin-vinyl border-emerald-400 shadow-emerald-500/40 ring-4 ring-emerald-500/20' 
              : 'border-slate-700 shadow-slate-950/80 group-hover:border-emerald-500/60'
          }`}>
            {/* Etiqueta Central de Vinilo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg flex items-center justify-center relative overflow-hidden">
              {targetSong?.coverUrl ? (
                <img src={targetSong.coverUrl} alt="Cover" className="w-full h-full object-cover rounded-full opacity-90" />
              ) : (
                <Disc3 className="w-8 h-8 text-slate-950 stroke-[2.5]" />
              )}

              {/* Overlay de Icono Play/Pause en el centro del Vinilo */}
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center transition-all group-hover:bg-slate-950/40">
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 fill-emerald-400 animate-pulse" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-0.5 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>
          </div>

          {/* Badge interactivo bajo el vinilo */}
          <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-slate-900/95 border border-slate-700 text-slate-200 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xl group-hover:border-emerald-500/60 group-hover:text-emerald-400 transition-all">
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span>Escuchar Fragmento</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
