import React, { useState } from 'react';
import { Music2, HelpCircle, RefreshCw, Volume2 } from 'lucide-react';

export const Header = ({ onResetGame, currentSongIndex, totalSongs }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="w-full max-w-xl mx-auto pt-6 pb-4 px-4 flex flex-col items-center border-b border-slate-800/80">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-full transition-all"
            title="Cómo jugar"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Logo / Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
            <Music2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              EN UNA NOTA
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/90">
              Adivina la Canción en Español
            </p>
          </div>
        </div>

        {/* Reset / Change Song for testing */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetGame}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-full transition-all flex items-center gap-1 text-xs font-medium"
            title="Siguiente canción de prueba"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] text-slate-400">#{currentSongIndex + 1}/{totalSongs}</span>
          </button>
        </div>
      </div>

      {/* Help Banner Modal */}
      {showHelp && (
        <div className="w-full mt-4 p-4 glass-panel rounded-xl text-xs text-slate-300 space-y-2 border border-emerald-500/30 animate-fadeIn">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" /> ¿Cómo jugar?
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Escucha el fragmento inicial de la canción (comienza con <strong>0.3 segundos</strong>).</li>
            <li>Si no la reconoces, presiona <strong>Saltar</strong> o intenta adivinar para desbloquear más tiempo.</li>
            <li>Los fragmentos aumentan: <strong>0.3s, 0.8s, 1.5s, 2.5s, 4s, 5s y 7s</strong>.</li>
            <li>¡Tienes <strong>7 intentos</strong> para acertar el nombre correcto de la canción!</li>
          </ul>
        </div>
      )}
    </header>
  );
};
