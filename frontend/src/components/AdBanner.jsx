import React, { useEffect, useRef } from 'react';
import { Volume2, Play, Info, Sparkles, ExternalLink } from 'lucide-react';

export const AdBanner = ({ 
  slotId = '1234567890', 
  format = 'auto', 
  isDemo = true,
  className = '' 
}) => {
  const adRef = useRef(null);

  useEffect(() => {
    // Si no es demo y existe el objeto de AdSense en el window
    if (!isDemo && window && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('Error al inicializar AdSense:', err);
      }
    }
  }, [isDemo]);

  // Si estamos en modo demo (para previsualización visual antes del alta de AdSense)
  if (isDemo) {
    if (format === 'video') {
      return (
        <div className={`w-full glass-panel p-4 rounded-2xl border border-cyan-500/40 relative overflow-hidden bg-slate-900/90 shadow-xl ${className}`}>
          {/* Banner / Video Ad Demo Placeholder */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-md shrink-0 animate-pulse">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase tracking-wider mb-1">
                  <span>Anuncio de Video Patrocinado</span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Sponsor Oficial: Spotify / Passline Entradas
                </h4>
                <p className="text-[10px] text-slate-400">
                  Mira las fechas de recitales y listas oficiales de tu categoría preferida.
                </p>
              </div>
            </div>

            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              onClick={() => window.open('https://spotify.com', '_blank')}
            >
              <span>Ver Más</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full glass-panel p-3.5 rounded-2xl border border-slate-800 relative overflow-hidden bg-slate-950/70 text-center ${className}`}>
        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-slate-500 border-b border-slate-800/80 pb-1.5 mb-2 px-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-emerald-400" />
            <span>Publicidad Patrocinada</span>
          </span>
          <span className="text-slate-600">Google AdSense Demo</span>
        </div>

        <div className="py-3 px-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Espacio de Anuncio ({format === 'horizontal' ? '728x90 Banner' : '300x250 Rectángulo'})</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Anuncio adaptativo alimentado por Google AdSense (`ca-pub-5446238585157670`).
          </p>
        </div>
      </div>
    );
  }

  // Código real de Google AdSense
  return (
    <div className={`w-full text-center overflow-hidden my-3 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5446238585157670"
        data-ad-slot={slotId}
        data-ad-format={format === 'video' ? 'auto' : format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
