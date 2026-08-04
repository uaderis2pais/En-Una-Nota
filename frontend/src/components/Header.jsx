import React, { useState } from 'react';
import { Music2, HelpCircle, Volume2, Home, Flame, Trophy, Lightbulb } from 'lucide-react';

export const Header = ({ onGoHome, categoryName, playStreak = 0, winStreak = 0, onOpenSuggest }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="w-full max-w-xl mx-auto pt-4 pb-3 px-3 sm:px-4 flex flex-col items-center border-b border-slate-800/80">
      <div className="w-full flex items-center justify-between relative min-h-[44px]">
        {/* Navegación Izquierda: Home, Instrucciones y Sugerir Canción */}
        <div className="flex items-center gap-0.5 sm:gap-1 z-10">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-full transition-all"
              title="Volver a Inicio"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-full transition-all"
            title="Cómo jugar"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {onOpenSuggest && (
            <button 
              onClick={onOpenSuggest}
              className="p-1.5 sm:p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-full transition-all"
              title="Sugerir una canción"
            >
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400/20" />
            </button>
          )}
        </div>

        {/* Título Perfectamente Centrado (Sin Icono Verde para Maximizar Espacio en Mobile) */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-center cursor-pointer max-w-[45%] xs:max-w-[55%] sm:max-w-none"
          onClick={onGoHome}
        >
          <h1 className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent truncate">
            ME SUENA A...
          </h1>
          {categoryName ? (
            <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 truncate">
              Categoría: <span className="text-white">{categoryName}</span>
            </p>
          ) : (
            <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 truncate">
              Adivina la Canción
            </p>
          )}
        </div>

        {/* Rachas Derecha: Participación + Victorias */}
        <div className="flex items-center gap-1 sm:gap-2 z-10">
          <div 
            className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] sm:text-xs shadow-sm"
            title="Racha de participación diaria"
          >
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
            <span>{playStreak}</span>
          </div>

          <div 
            className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] sm:text-xs shadow-sm"
            title="Racha de victorias acumuladas"
          >
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-400 text-emerald-500" />
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
