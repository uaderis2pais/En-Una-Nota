import React from 'react';
import { X, ShieldCheck, FileText, Info, Lock } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] p-6 glass-panel-elevated rounded-3xl border border-emerald-500/40 text-slate-300 text-xs sm:text-sm space-y-4 shadow-2xl overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Política de Privacidad y Términos de Uso</h2>
            <p className="text-xs text-slate-400">Me Suena a... • Última actualización: 2026</p>
          </div>
        </div>

        {/* Contenido Legible para Google AdSense y Usuarios */}
        <div className="space-y-4 leading-relaxed text-slate-300">
          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-base flex items-center gap-1.5 text-emerald-400">
              <Lock className="w-4 h-4" /> 1. Protección de Datos y Privacidad
            </h3>
            <p>
              En <strong>Me Suena a...</strong> respetamos la privacidad de nuestros usuarios. Esta plataforma no requiere registro previo, nombres de usuario, ni contraseñas. Almacenamos únicamente tu progreso local de rachas e historial de partidas directamente en el almacenamiento web de tu navegador (<code>localStorage</code>).
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-base flex items-center gap-1.5 text-cyan-400">
              <Info className="w-4 h-4" /> 2. Uso de Cookies y Publicidad de Google AdSense
            </h3>
            <p>
              Esta web utiliza servicios publicitarios de terceros, incluyendo <strong>Google AdSense</strong>, para mostrar anuncios. Google utiliza cookies para publicar anuncios basados en las visitas anteriores del usuario a este o a otros sitios web.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li>Los proveedores de terceros, incluido Google, utilizan cookies para mostrar anuncios relevantes.</li>
              <li>Los usuarios pueden inhabilitar la publicidad personalizada consultando la <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">Configuración de Anuncios de Google</a>.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-white text-base flex items-center gap-1.5 text-amber-400">
              <FileText className="w-4 h-4" /> 3. Derechos de Propiedad Intelectual y Contenido
            </h3>
            <p>
              <strong>Me Suena a...</strong> es una plataforma recreativa y educativa de trivia musical. Todos los nombres de canciones, artistas, álbumes e imágenes pertenecen a sus respectivos dueños y titulares de derechos de autor.
            </p>
            <p>
              La información del catálogo y reproducciones se obtiene a través de las APIs públicas oficiales de <strong>Spotify</strong> y <strong>YouTube</strong>. Los fragmentos de audio utilizados son breves extractos didácticos para la mecánica de trivia diaria de adivinanza.
            </p>
          </section>
        </div>

        {/* Footer del Modal */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
