import React from 'react';
import { Calendar, Eye, Lightbulb, Youtube } from 'lucide-react';

export const SongHints = ({ targetSong }) => {
  if (!targetSong) return null;

  const year = targetSong.year || '2000';
  const rawViews = Number(targetSong.reproducciones || targetSong.views || 0);

  // Formatear visualizaciones exactas de YouTube a formato M (Millones) o K (Miles)
  const formatExactViews = (views) => {
    if (!views || views === 0) {
      // Fallback a estimado genérico si no hay vista guardada
      return '+10M';
    }
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`;
    }
    return views.toString();
  };

  return (
    <div className="w-full max-w-xl mx-auto my-3 p-3.5 glass-panel rounded-2xl border border-amber-500/30 bg-amber-950/10 flex flex-wrap items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-amber-500/5">
      <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
        <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
        <span>Pistas de la Canción:</span>
      </div>

      <div className="flex items-center gap-2.5 text-xs font-bold flex-wrap">
        {/* Pista 1: Año de Lanzamiento */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-800 shadow-sm"
          title="Año oficial de lanzamiento"
        >
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Año: <strong className="text-cyan-300 font-mono text-xs">{year}</strong></span>
        </div>

        {/* Pista 2: Visualizaciones Exactas en YouTube */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 border border-rose-500/30 shadow-sm"
          title="Visualizaciones oficiales acumuladas en YouTube"
        >
          <Youtube className="w-4 h-4 text-rose-400 shrink-0 fill-current" />
          <span>YouTube: <strong className="text-rose-300 font-mono text-xs">+{formatExactViews(rawViews)} vistas</strong></span>
        </div>
      </div>
    </div>
  );
};
