import React, { useState, useEffect } from 'react';
import { Trophy, Frown, Sparkles, Music, LayoutGrid, Clock, Youtube } from 'lucide-react';
import { AdBanner } from './AdBanner';

/**
 * Contador descendiente hasta medianoche (00:00:00)
 */
export const MidnightCountdown = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Próxima medianoche 00:00:00

      const diffMs = midnight - now;
      if (diffMs <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 py-2.5 px-4 rounded-xl border border-emerald-500/30 shadow-inner my-2">
      <Clock className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
      <span>Próxima canción diaria en: <strong className="text-white font-extrabold">{timeLeft}</strong></span>
    </div>
  );
};

export const GameResultModal = ({ 
  gameStatus, 
  targetSong, 
  attemptsCount, 
  onGoHome 
}) => {
  if (gameStatus !== 'WON' && gameStatus !== 'LOST') return null;

  const isWon = gameStatus === 'WON';
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${targetSong.title} ${targetSong.artist} audio oficial`)}`;

  return (
    <div className="w-full max-w-xl mx-auto my-6 p-6 glass-panel rounded-2xl border border-emerald-500/30 shadow-2xl text-center space-y-5 animate-fadeIn relative overflow-hidden">
      {/* Glow de fondo decorativo */}
      <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30 ${isWon ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="relative z-10 space-y-4">
        {/* Icono de resultado */}
        <div className="flex justify-center">
          {isWon ? (
            <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full ring-8 ring-emerald-500/10 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="p-4 bg-rose-500/20 text-rose-400 rounded-full ring-8 ring-rose-500/10">
              <Frown className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Título y subtítulo */}
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
            {isWon ? (
              <>
                <span>¡Logro Desbloqueado!</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </>
            ) : (
              <span>¡Fin del juego!</span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isWon 
              ? `¡Adivinaste la canción en el intento ${attemptsCount} de 7!`
              : `Agotaste tus 7 intentos. ¡La canción era:`}
          </p>
        </div>

        {/* Tarjeta con info de la canción */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-4 text-left shadow-inner">
          <img 
            src={targetSong.coverUrl} 
            alt={targetSong.title}
            className="w-16 h-16 rounded-lg object-cover border border-slate-700 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-emerald-300 truncate">{targetSong.title}</h3>
            <p className="text-sm text-slate-200 font-medium truncate">{targetSong.artist}</p>
            <p className="text-xs text-slate-400 truncate">{targetSong.album} ({targetSong.year})</p>
          </div>
        </div>

        {/* Notificación de audio de 30s desbloqueado */}
        <div className="text-xs text-emerald-400/90 font-medium bg-emerald-950/30 py-2 px-3 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1.5">
          <Music className="w-3.5 h-3.5" />
          <span>¡Audio de 30s desbloqueado! Puedes usar el reproductor arriba para escuchar más.</span>
        </div>

        {/* Contador regresivo a medianoche */}
        <MidnightCountdown />

        {/* BANNER SPONSOR CON DIRECT LINK DE MONETAG */}
        <a 
          href="https://omg10.com/4/11548097"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-gradient-to-r from-cyan-950/80 to-slate-900/90 rounded-xl border border-cyan-500/40 hover:border-cyan-400 flex items-center justify-between gap-3 text-left transition-all group block shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">Publicidad de Servidores</div>
              <div className="text-xs font-extrabold text-white group-hover:text-cyan-300">
                ¡Apoyá al juego haciendo un clic aquí! ➔
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 group-hover:bg-cyan-500/20">
            Apoyar ➔
          </span>
        </a>

        {/* Acciones principales: Escuchar en YouTube + Probar otra categoría */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Youtube className="w-5 h-5 fill-current" />
            <span>Escuchar en YouTube</span>
          </a>

          <button
            onClick={onGoHome}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Probar otra categoría</span>
          </button>
        </div>
      </div>
    </div>
  );
};
