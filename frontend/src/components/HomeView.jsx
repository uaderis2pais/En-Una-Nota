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
  Star
} from 'lucide-react';
import { FAQ } from './FAQ';

export const FEATURED_CATEGORY = {
  id: 'general',
  name: 'Mix General',
  desc: 'El desafío diario principal con todas las canciones combinadas de todos los géneros (Rock, Cumbia, Reggaeton, Pop, Cuarteto y Trap).',
  icon: Radio,
  color: 'from-emerald-500 via-teal-500 to-cyan-600',
  badge: 'Desafío Principal'
};

export const GENRE_CATEGORIES = [
  {
    id: 'rock',
    name: 'Rock Nacional',
    desc: 'Grandes clásicos del rock argentino y latinoamericano.',
    icon: Guitar,
    color: 'from-rose-500 to-amber-600',
    borderColor: 'border-rose-500/30',
    badge: 'Clásicos'
  },
  {
    id: 'cumbia',
    name: 'Cumbia Villera',
    desc: 'El ritmo tropical y cumbia bailable argentina.',
    icon: Disc3,
    color: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/30',
    badge: 'Fiesta'
  },
  {
    id: 'reggaeton',
    name: 'Reggaeton Old School',
    desc: 'Los perreos e himnos urbanos que hicieron historia.',
    icon: Flame,
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500/30',
    badge: 'Urbano'
  },
  {
    id: 'pop',
    name: 'Pop Latino',
    desc: 'Baladas y pop pegadizo en español.',
    icon: Music,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
    badge: 'Éxitos'
  },
  {
    id: 'cuarteto',
    name: 'Cuarteto Cordobés',
    desc: 'Alegría, fiesta y el tunga-tunga de Córdoba.',
    icon: Sparkles,
    color: 'from-orange-500 to-red-600',
    borderColor: 'border-orange-500/30',
    badge: 'Córdoba'
  },
  {
    id: 'trap',
    name: 'Trap Argentino',
    desc: 'La nueva ola del trap y música urbana actual.',
    icon: Mic2,
    color: 'from-violet-500 to-indigo-600',
    borderColor: 'border-violet-500/30',
    badge: 'Tendencia'
  }
];

export const CATEGORIES = [FEATURED_CATEGORY, ...GENRE_CATEGORIES];

export const HomeView = ({ onSelectCategory }) => {
  // Función para obtener la racha guardada en localStorage por categoría
  const getCategoryStreak = (catId) => {
    try {
      const raw = localStorage.getItem(`en_una_nota_streak_${catId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.currentStreak || 0;
      }
    } catch (e) {
      console.error("Error leyendo racha de localStorage:", e);
    }
    return 0;
  };

  const generalStreak = getCategoryStreak('general');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Hero Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-4 h-4" /> Juego Diario de Música en Español
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
          EN UNA NOTA
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
          ¿Puedes adivinar la canción del día en solo unos milisegundos?
        </p>
      </div>

      {/* BANNER DESTACADO: MIX GENERAL (DESAFÍO PRINCIPAL) */}
      <div 
        onClick={() => onSelectCategory('general')}
        className="w-full glass-panel p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/50 hover:border-emerald-400 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl shadow-emerald-500/10 cursor-pointer relative overflow-hidden group mb-12"
      >
        {/* Glow de fondo animado */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-25 blur-3xl group-hover:opacity-45 transition-opacity" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-md shadow-emerald-500/20">
                <Star className="w-3.5 h-3.5 fill-current" /> Desafío Principal del Día
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Incluye Todo el Catálogo
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
              Mix General
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El desafío definitivo del día. Incluye canciones de todos los géneros combinados (Rock, Cumbia, Reggaeton, Pop, Cuarteto y Trap).
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pt-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Racha Principal: <strong className="text-amber-300 font-extrabold">{generalStreak} {generalStreak === 1 ? 'día' : 'días'}</strong></span>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-end shrink-0">
            <button className="w-full md:w-auto py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-500/30 group-hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-98">
              <Play className="w-5 h-5 fill-current" />
              <span>¡Jugar Desafío Principal!</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE CATEGORÍAS POR GÉNERO */}
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              <span>Explorar Categorías por Género</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Juega desafíos específicos según tu estilo musical favorito
            </p>
          </div>
        </div>

        {/* Grilla de los 6 Géneros */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GENRE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const streak = getCategoryStreak(cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`glass-panel p-6 rounded-2xl border ${cat.borderColor} hover:border-emerald-500/60 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
              >
                {/* Glow traslucido de fondo */}
                <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${cat.color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${cat.color} text-slate-950 font-bold shadow-lg shadow-black/40`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Racha: <strong>{streak} {streak === 1 ? 'día' : 'días'}</strong></span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>Jugar</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección de FAQ */}
      <FAQ />
    </div>
  );
};
