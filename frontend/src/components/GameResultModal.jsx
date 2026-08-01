import React from 'react';
import { Trophy, Frown, RefreshCw, Share2, Sparkles, Music } from 'lucide-react';

export const GameResultModal = ({ 
  gameStatus, 
  targetSong, 
  attemptsCount, 
  onPlayAgain 
}) => {
  if (gameStatus !== 'WON' && gameStatus !== 'LOST') return null;

  const isWon = gameStatus === 'WON';

  return (
    <div className="w-full max-w-xl mx-auto my-6 p-6 glass-panel rounded-2xl border border-emerald-500/30 shadow-2xl text-center space-y-5 animate-fadeIn relative overflow-hidden">
      {/* Decorative Glow Background */}
      <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30 ${isWon ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="relative z-10 space-y-4">
        {/* Result Icon Header */}
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

        {/* Title */}
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
              ? `¡Adivinaste la canción en el intento ${attemptsCount} de 6!`
              : `Agotaste tus 6 intentos. ¡La canción era:`}
          </p>
        </div>

        {/* Song Info Card */}
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

        {/* Audio unlocked note */}
        <div className="text-xs text-emerald-400/90 font-medium bg-emerald-950/30 py-2 px-3 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1.5">
          <Music className="w-3.5 h-3.5" />
          <span>¡Audio de 30s desbloqueado! Puedes usar el reproductor arriba para escuchar más.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Probar otra canción</span>
          </button>
        </div>
      </div>
    </div>
  );
};
