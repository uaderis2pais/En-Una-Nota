import React from 'react';
import { Linkedin, Mail, Globe, Code2, Heart } from 'lucide-react';

export const DeveloperCard = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-[#0d121f] to-slate-950/90 shadow-2xl relative overflow-hidden group">
        {/* Glow de fondo */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center md:text-left">

            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                  Creador de la Página
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white">
                Facundo Bautista Pais
              </h3>
              <p className="text-slate-400 text-xs max-w-md">
                Desarrollador Full Stack. ¿Te gustó el juego o tenés una sugerencia/idea? ¡Contactame!
              </p>
            </div>
          </div>

          {/* Enlaces y redes */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <a
              href="https://www.linkedin.com/in/facundo-bautista-pais"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-[#0077b5] text-slate-200 hover:text-white font-bold text-xs border border-slate-700 hover:border-transparent transition-all shadow-md active:scale-95"
            >
              <Linkedin className="w-4 h-4 text-[#0a66c2] group-hover:text-white" />
              <span>LinkedIn</span>
            </a>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/60 text-slate-300 font-mono text-xs border border-slate-700/80">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>facubpais@gmail.com</span>
            </div>

            <a
              href="https://portfolio-2026-changes.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>Mi Portfolio</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
