import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2, Info } from 'lucide-react';

export const InstallPwaModal = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capturar evento de instalación de Chrome / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar si ya está instalada como PWA standalone
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Para instalar en Android: tocá el menú de tres puntos (⋮) de Chrome y elegí "Agregar a la pantalla principal". En iPhone/iOS: tocá Compartir y elegí "Agregar a inicio".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 glass-panel-elevated rounded-3xl border border-emerald-500/40 shadow-2xl space-y-5 text-center overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header con Icono de Celular */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-xl shadow-emerald-500/30">
            <Smartphone className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-heading">
              Instalar App Celular
            </h2>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
              Me Suena a... PWA Web App
            </p>
          </div>
        </div>

        {/* Contenido descriptivo */}
        <div className="space-y-3 text-xs text-slate-300 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-left">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Accedé al juego diario directamente desde el icono en tu pantalla de inicio.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Sin ocupar espacio en memoria ni depender de tiendas de aplicaciones.</span>
          </div>

          <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso de versión:</strong> Momentáneamente disponible como Web App / APK directo. ¡Estamos trabajando para subirla muy pronto a Google Play Store!
            </span>
          </div>
        </div>

        {/* Botón de Acción de Instalación */}
        {isInstalled ? (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡App Ya Instalada en tu Celular!</span>
          </div>
        ) : isIOS ? (
          <div className="p-3 bg-slate-800 text-slate-200 rounded-xl text-xs space-y-1 text-center">
            <p className="font-bold text-emerald-400">¿Cómo instalar en iPhone / iOS?</p>
            <p className="text-[11px] text-slate-400">
              Tocá el botón <strong>Compartir (⎋)</strong> de Safari y seleccioná <strong>"Agregar a la pantalla de inicio (+)"</strong>.
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 hover:brightness-110 active:scale-98 transition-all"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>Descargar / Instalar App Ahora</span>
          </button>
        )}
      </div>
    </div>
  );
};
