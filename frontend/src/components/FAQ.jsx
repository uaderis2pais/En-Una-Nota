import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Music, Calendar, Zap, ShieldCheck } from 'lucide-react';

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      icon: Music,
      question: "¿Cómo se juega a En Una Nota?",
      answer: "Elige tu categoría musical favorita. Cada día tendrás una canción secreta para adivinar escuchando fragmentos ultra cortos que van aumentando (0.3s, 0.8s, 1.5s, 2.5s, 4s, 5s y 7s). Tienes 7 intentos en total."
    },
    {
      icon: Calendar,
      question: "¿Cuándo se renuevan las canciones?",
      answer: "Las canciones del día se actualizan automáticamente todos los días a las 00:00 hs (hora local). Cada categoría (Rock, Cumbia, Reggaeton, etc.) tiene su propia canción del día independiente."
    },
    {
      icon: ShieldCheck,
      question: "¿De dónde provienen los audios y canciones?",
      answer: "Utilizamos la API pública oficial de Apple Music / iTunes para obtener vistas previas de 30 segundos en alta calidad y carátulas oficiales en alta resolución."
    },
    {
      icon: Zap,
      question: "¿Cómo funciona el sistema de Rachas (Streaks)?",
      answer: "Si adivinas la canción del día en una categoría, ganas 1 día de racha. Si juegas todos los días consecutivos en esa categoría, tu racha aumentará. Si dejas pasar un día sin adivinar, la racha se reiniciará a 1."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="flex items-center justify-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-emerald-400" />
        <h2 className="text-2xl font-extrabold text-white text-center">Preguntas Frecuentes</h2>
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
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 border-t border-slate-800/60 pt-3 animate-fadeIn">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
