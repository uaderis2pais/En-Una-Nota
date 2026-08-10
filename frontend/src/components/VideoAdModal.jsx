import React, { useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, X, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const VideoAdModal = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanSkip(false);
      setIsPlaying(true);
      return;
    }

    // Temporizador de 5 segundos para poder saltar o cerrar el anuncio
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel-elevated rounded-3xl border border-cyan-500/40 p-5 sm:p-6 text-center space-y-4 shadow-2xl overflow-hidden">
        {/* Glow ambiental neón */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Barra superior de estado del anuncio */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Anuncio Patrocinado del Día</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {canSkip ? (
              <span className="text-emerald-400 font-bold">¡Puedes continuar!</span>
            ) : (
              <span>Puedes saltar en <strong className="text-white">{countdown}s</strong></span>
            )}
          </div>
        </div>

        {/* Reproductor de Video Publicitario con Direct Link Monetag */}
        <a 
          href="https://omg10.com/4/11548097" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative w-full aspect-video rounded-2xl bg-slate-950 border border-cyan-500/50 overflow-hidden flex flex-col items-center justify-center group shadow-inner cursor-pointer hover:border-cyan-400 transition-all block"
        >
          {/* Fondo animado de anuncio con Direct Link */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950 via-slate-900 to-emerald-950 opacity-90 flex flex-col items-center justify-center p-4 text-center group-hover:scale-105 transition-transform">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-2 animate-bounce">
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </div>
            <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-1.5 justify-center">
              <span>Publicidad Patrocinada de Servidores</span>
            </h3>
            <p className="text-xs text-cyan-300 max-w-xs mt-1 font-medium">
              ¡Hacé un clic aquí para apoyar los servidores gratuitos del juego!
            </p>
          </div>

          {/* Barra de progreso de reproduccion del video ad */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </a>

        {/* Mensaje aclaratorio */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Gracias por jugar a <strong>Me Suena a...</strong>. Este anuncio ayuda a mantener los servidores gratuitos y cargados diariamente.
        </p>

        {/* Botón de Cierre / Continuar al Juego */}
        <div className="pt-2">
          {canSkip ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 hover:brightness-110 active:scale-98 transition-all animate-pulse"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Ver Resultado del Juego</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed border border-slate-700/80 flex items-center justify-center gap-2"
            >
              <span>Esperá {countdown}s para continuar...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
