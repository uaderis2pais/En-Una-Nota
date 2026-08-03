import React, { useState } from 'react';
import { Music2, HelpCircle, Volume2, Home, Flame, Trophy, Lightbulb } from 'lucide-react';

export const Header = ({ onGoHome, categoryName, playStreak = 0, winStreak = 0, onOpenSuggest }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="w-full max-w-xl mx-auto pt-6 pb-4 px-4 flex flex-col items-center border-b border-slate-800/80">
      <div className="w-full flex items-center justify-between">
        {/* Navegación a Home, Instrucciones y Sugerir Canción */}
        <div className="flex items-center gap-1">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-full transition-all"
              title="Volver a Inicio"
            >
              <Home className="w-5 h-5" />
            </button>
          )}

          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-full transition-all"
            title="Cómo jugar"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {onOpenSuggest && (
            <button 
              onClick={onOpenSuggest}
              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-full transition-all"
              title="Sugerir una canción"
            >
              <Lightbulb className="w-5 h-5 fill-amber-400/20" />
            </button>
          )}
        </div>

        {/* Logo / Título */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onGoHome}>
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
            <Music2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              ME SUENA A...
            </h1>
            {categoryName ? (
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/90">
                Categoría: <span className="text-white">{categoryName}</span>
              </p>
            ) : (
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/90">
                Adivina la Canción en Español
              </p>
            )}
          </div>
        </div>

        {/* Rachas visibles arriba a la derecha (Participación + Victorias) */}
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs shadow-md shadow-amber-500/10"
            title="Racha de participación diaria"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
            <span>{playStreak}</span>
          </div>

          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs shadow-md shadow-emerald-500/10"
            title="Racha de victorias acumuladas"
          >
            <Trophy className="w-3.5 h-3.5 fill-emerald-400 text-emerald-500" />
            <span>{winStreak}</span>
          </div>
        </div>
      </div>

      {/* Modal / Acordeón de Instrucciones */}
      {showHelp && (
        <div className="w-full mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs space-y-2 animate-fade-in">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            ¿Cómo jugar a Me Suena a...?
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li>Escucha el primer fragmento de audio (empieza con 0.5s).</li>
            <li>Si no adivinas, presiona <strong>Saltear</strong> para escuchar más tiempo (0.5s → 1s → 2s → 3s → 5s → 10s → 15s).</li>
            <li>Escribe y selecciona la canción correcta en el buscador.</li>
            <li>¡Intenta adivinar en la menor cantidad de intentos posible!</li>
          </ul>
        </div>
      )}
    </header>
  );
};
