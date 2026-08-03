import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Music, Calendar, Zap, ShieldCheck, Flame, Lightbulb, Youtube, Send } from 'lucide-react';

export const FAQ = ({ onOpenSuggest }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      icon: Music,
      question: "¿Cómo se juega a Me Suena a...?",
      answer: "Elige tu categoría preferida (Mix General, Rock Nacional, Cumbia, Reggaeton Old/New School, Pop Latino o Trap). Tienes 7 intentos para adivinar la canción del día escuchando fragmentos progresivos que van desde 0.5s, 1s, 2s, 3s, 5s, 10s hasta 15 segundos."
    },
    {
      icon: Calendar,
      question: "¿Cuándo se renuevan las canciones diarias?",
      answer: "Las canciones del día se actualizan automáticamente todos los días exactamente a las 00:00 hs (medianoche). Cada categoría tiene su propia canción del día y el Mix General ofrece una canción exclusiva que no se repite con ninguna otra categoría ese mismo día."
    },
    {
      icon: Flame,
      question: "¿Cómo funciona el Sistema de Rachas Doble?",
      answer: "El juego registra dos rachas independientes por categoría: 🔥 Racha Diaria (Premia tu constancia sumando días consecutivos que entras a jugar, ganes o pierdas) y 🏆 Victorias (Premia tu precisión manteniendo el conteo de partidas ganadas consecutivas)."
    },
    {
      icon: Lightbulb,
      question: "¿Qué pistas tengo disponibles durante la partida?",
      answer: "En la pantalla de juego verás una tarjeta de pistas con el Año oficial de lanzamiento de la canción y el número real y exacto de Visualizaciones acumuladas en YouTube."
    },
    {
      icon: Youtube,
      question: "¿Puedo escuchar la canción completa al terminar?",
      answer: "¡Sí! Al adivinar la canción o agotar tus 7 intentos, se desbloqueará el reproductor completo de 30 segundos y tendrás un botón directo para ir a escuchar el tema oficial completo en YouTube."
    },
    {
      icon: ShieldCheck,
      question: "¿De dónde proviene la música y la información?",
      answer: "Utilizamos un sistema híbrido que extrae la metadata exacta, carátulas HD y popularidad desde Spotify, reproducciones exactas de YouTube y streams de audio verificados en alta calidad."
    },
    {
      icon: Lightbulb,
      question: "¿Cómo puedo sugerir una canción para el juego?",
      answer: "¡Muy fácil! Si sentís que falta un temazo en el juego, podés enviarnos el enlace de Spotify de la canción que querés agregar. Nuestro equipo revisa todas las sugerencias y las más populares son agregadas al juego. Solo canciones individuales (no playlists).",
      hasAction: true
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="flex items-center justify-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-emerald-400" />
        <h2 className="text-2xl font-extrabold text-white text-center">Preguntas Frecuentes (FAQ)</h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          const isOpen = openIndex === idx;

          return (
            <div 
              key={idx}
              className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-100 text-sm sm:text-base">{faq.question}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180 text-emerald-400' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 border-t border-slate-800/60 pt-3 animate-fadeIn leading-relaxed space-y-3">
                  <p>{faq.answer}</p>
                  {faq.hasAction && onOpenSuggest && (
                    <button
                      onClick={onOpenSuggest}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>¡Sugerir una Canción Ahora!</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
