import React from 'react';
import {
  Radio,
  Flame,
  Disc3,
  Music,
  Sparkles,
  Mic2,
  Guitar,
  Play,
  Trophy,
  Zap,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Lightbulb
} from 'lucide-react';
import { FAQ } from './FAQ';
import { DeveloperCard } from './DeveloperCard';

export const FEATURED_CATEGORY = {
  id: 'general',
  name: 'Mix General',
  desc: 'El desafío diario principal con todas las canciones combinadas de todos los géneros (Rock, Cumbia, Reggaeton Old/New School, Pop y Trap).',
  icon: Radio,
  color: 'from-emerald-500 via-teal-500 to-cyan-600',
  badge: 'Desafío Principal'
};

export const GENRE_CATEGORIES = [
  {
    id: 'rock',
    name: 'Rock Nacional',
    desc: 'Soda Stereo, Charly, Spinetta, Los Redondos, Calamaro, Fito y clásicos eternos.',
    icon: Guitar,
    color: 'from-rose-500 to-amber-600',
    borderColor: 'border-rose-500/40',
    glowColor: 'from-rose-500/40 to-amber-500/30',
    hoverGlow: 'hover:shadow-rose-500/30 hover:border-rose-400',
    badge: 'Clásicos'
  },
  {
    id: 'cumbia',
    name: 'Cumbia Argentina',
    desc: 'Villera, Turra y Cheta/Pop: Damas Gratis, Ke Personajes, Marama y Rombai.',
    icon: Disc3,
    color: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/40',
    glowColor: 'from-amber-500/40 to-yellow-500/30',
    hoverGlow: 'hover:shadow-amber-500/30 hover:border-amber-400',
    badge: 'Fiesta'
  },
  {
    id: 'reggaeton',
    name: 'Reggaeton Old School',
    desc: 'Los perreos e himnos clásicos: Daddy Yankee, Don Omar, Wisin & Yandel, Plan B.',
    icon: Flame,
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500/40',
    glowColor: 'from-purple-500/40 to-pink-500/30',
    hoverGlow: 'hover:shadow-purple-500/30 hover:border-purple-400',
    badge: 'Old School'
  },
  {
    id: 'reggaeton_new',
    name: 'Reggaeton New School',
    desc: 'La nueva era: Bad Bunny, Feid, Rauw, Mora y hits globales como Gata Only.',
    icon: Sparkles,
    color: 'from-fuchsia-500 to-rose-600',
    borderColor: 'border-fuchsia-500/40',
    glowColor: 'from-fuchsia-500/40 to-rose-500/30',
    hoverGlow: 'hover:shadow-fuchsia-500/30 hover:border-fuchsia-400',
    badge: 'Éxitos Actuales'
  },
  {
    id: 'pop',
    name: 'Pop Latino',
    desc: 'Grandes éxitos en español: Shakira, Luis Miguel, Ricky Martin, Chayanne y Pop actual.',
    icon: Mic2,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/40',
    glowColor: 'from-cyan-500/40 to-blue-500/30',
    hoverGlow: 'hover:shadow-cyan-500/30 hover:border-cyan-400',
    badge: 'Hitazos'
  },
  {
    id: 'trap',
    name: 'Trap en Español',
    desc: 'Duki, YSY A, Neo Pistea, Travis, C. Tangana, Khea, Cazzu y la ola urbana.',
    icon: Music,
    color: 'from-violet-500 to-indigo-600',
    borderColor: 'border-violet-500/40',
    glowColor: 'from-violet-500/40 to-indigo-500/30',
    hoverGlow: 'hover:shadow-violet-500/30 hover:border-violet-400',
    badge: 'Urbano'
  }
];

export const CATEGORIES = [FEATURED_CATEGORY, ...GENRE_CATEGORIES];

export function HomeView({ onSelectCategory, onOpenSuggest, totalSongsCount }) {
  // Helper local YYYY-MM-DD sin desfasaje UTC
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Obtiene la racha de victoria de una categoría específica desde localStorage
   */
  const getCategoryStreaks = (catId) => {
    try {
      const raw = localStorage.getItem(`en_una_nota_streaks_${catId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          playStreak: parsed.playStreak || 0,
          winStreak: parsed.winStreak || 0
        };
      }
    } catch (e) {
      console.error(e);
    }
    return { playStreak: 0, winStreak: 0 };
  };

  /**
   * Obtiene el estado completado de hoy para la categoría ('WON' | 'LOST' | null)
   */
  const getCategoryCompletedStatus = (catId) => {
    try {
      const todayStr = getLocalDateString();
      const todayKey = `en_una_nota_daily_${catId}_${todayStr}`;
      const rawToday = localStorage.getItem(todayKey);
      if (rawToday) {
        const parsed = JSON.parse(rawToday);
        if (parsed.gameStatus === 'WON' || parsed.gameStatus === 'LOST') {
          return parsed.gameStatus;
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`en_una_nota_daily_${catId}_`)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.date === todayStr && (parsed.gameStatus === 'WON' || parsed.gameStatus === 'LOST')) {
              return parsed.gameStatus;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const generalStreaks = getCategoryStreaks('general');
  const generalStatus = getCategoryCompletedStatus('general');

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col items-center relative z-20">
      {/* Hero Header Adaptado a Mobile */}
      <div className="text-center space-y-2 sm:space-y-3 mb-5 sm:mb-8">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Juego Diario de Música en Español
          {totalSongsCount > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-white font-black">{totalSongsCount} Canciones Cargadas hasta el momento</span>
            </>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
          ME SUENA A...
        </h1>
        <p className="text-slate-400 text-xs sm:text-base max-w-xs sm:max-w-md mx-auto">
          ¿Puedes adivinar la canción del día en solo unos milisegundos?
        </p>
      </div>

      {/* BANNER DESTACADO: MIX GENERAL (DESAFÍO PRINCIPAL - COMPACTO EN MOBILE) */}
      <div
        onClick={() => onSelectCategory('general')}
        className="w-full glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-emerald-500/50 hover:border-emerald-400 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl shadow-emerald-500/10 cursor-pointer relative overflow-hidden group mb-6 sm:mb-12"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-25 blur-3xl group-hover:opacity-45 transition-opacity" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3 sm:gap-6 text-center sm:text-left">
            <div className="p-3 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-slate-950 shadow-xl shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Radio className="w-6 h-6 sm:w-10 sm:h-10 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] sm:text-xs font-black uppercase tracking-wider">
                  {FEATURED_CATEGORY.badge}
                </span>

                {/* Badge de completado del día */}
                {generalStatus === 'WON' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] sm:text-xs font-black flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-3 h-3" /> ¡Completado!
                  </span>
                )}
                {generalStatus === 'LOST' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] sm:text-xs font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-400" /> Jugado hoy
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
                {FEATURED_CATEGORY.name}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg hidden sm:block">
                {FEATURED_CATEGORY.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 shrink-0 w-full sm:w-auto justify-center">
            {/* Racha del Mix General */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-1 text-amber-400" title="Racha de días jugados">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{generalStreaks.playStreak}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-emerald-400" title="Racha de victorias">
                <Trophy className="w-3.5 h-3.5 fill-emerald-400" />
                <span>{generalStreaks.winStreak}</span>
              </div>
            </div>

            <button className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 group-hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all w-full sm:w-auto justify-center">
              <span>{generalStatus ? 'Ver Resultado' : 'Jugar Desafío Principal'}</span>
              {generalStatus ? <Eye className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CATEGORÍAS DE GÉNEROS (TARJETAS MÁS COMPACTAS EN MOBILE) */}
      <div className="w-full space-y-4 mb-8 sm:mb-12">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Disc3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <span>Categorías por Género</span>
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Selecciona tu estilo favorito
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
          {GENRE_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const streaks = getCategoryStreaks(cat.id);
            const status = getCategoryCompletedStatus(cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`glass-panel-elevated p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border ${cat.borderColor} ${cat.hoverGlow} transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
              >
                {/* Glow Neón de Fondo por Género */}
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${cat.glowColor} blur-2xl group-hover:opacity-100 opacity-60 group-hover:scale-125 transition-all duration-500 pointer-events-none`} />

                <div className="space-y-2 sm:space-y-3 relative z-10">
                  <div className="flex items-center justify-between gap-1">
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                      <IconComponent className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[8px] sm:text-[10px] font-bold border border-slate-700 truncate max-w-[90px] sm:max-w-none">
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {cat.name}
                      </h4>
                      {status === 'WON' && (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2 mt-0.5 sm:mt-1 hidden sm:block">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 sm:pt-4 border-t border-slate-800/60 mt-2 sm:mt-4 flex flex-col gap-2 relative z-10">
                  <div className="flex items-center justify-between text-[9px] sm:text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        {streaks.playStreak}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <Trophy className="w-3 h-3 fill-emerald-400" />
                        {streaks.winStreak}
                      </span>
                    </div>

                    <span className="font-extrabold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      <span>{status ? 'Ver' : 'Jugar'}</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón de Sugerir Canción central (debajo de la grilla) */}
      {onOpenSuggest && (
        <div className="mb-8 flex flex-col items-center gap-2">
          <button
            onClick={() => onOpenSuggest()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 hover:from-amber-500/25 hover:to-orange-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/10 active:scale-98 group"
          >
            <Lightbulb className="w-4 h-4 fill-amber-400 group-hover:scale-110 transition-transform" />
            <span>¿Falta un temazo? ¡Sugerí una canción al equipo!</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black border border-amber-500/30">NUEVO</span>
          </button>

          {totalSongsCount > 0 && (
            <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>Actualmente: <strong className="text-emerald-400">{totalSongsCount} canciones</strong> verificadas</span>
            </p>
          )}
        </div>
      )}

      {/* SECCIÓN FAQ */}
      <FAQ onOpenSuggest={onOpenSuggest} />

      {/* SECCIÓN DE AUTOR / DESARROLLADOR */}
      <DeveloperCard />
    </div>
  );
}
