import React from 'react';
import { XCircle, CheckCircle2, FastForward, Lock, PlayCircle } from 'lucide-react';

export const AttemptList = ({ 
  attempts, 
  currentAttemptIndex, 
  attemptTimes = [0.3, 0.8, 1.5, 2.5, 4, 5, 7],
  isGameOver 
}) => {
  return (
    <div className="w-full max-w-xl mx-auto space-y-2 my-4">
      {attemptTimes.map((time, index) => {
        const attemptData = attempts[index];
        const isCurrent = index === currentAttemptIndex && !isGameOver;

        let statusStyle = "border-slate-800/60 bg-slate-900/40 text-slate-500";
        let content = null;

        if (attemptData?.status === 'correct') {
          statusStyle = "border-emerald-500/80 bg-emerald-950/40 text-emerald-300 shadow-md shadow-emerald-500/10";
          content = (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-200 truncate">{attemptData.guessText}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                ¡CORRECTO! ({time}s)
              </span>
            </div>
          );
        } else if (attemptData?.status === 'incorrect') {
          statusStyle = "border-rose-500/50 bg-rose-950/30 text-rose-300";
          content = (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 truncate">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="font-medium text-rose-200 truncate line-through opacity-80">{attemptData.guessText}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono">
                Incorrecto ({time}s)
              </span>
            </div>
          );
        } else if (attemptData?.status === 'skipped') {
          statusStyle = "border-amber-500/40 bg-amber-950/20 text-amber-300/80";
          content = (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FastForward className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-medium text-amber-200/90 italic">Intento saltado</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                Saltado ({time}s)
              </span>
            </div>
          );
        } else if (isCurrent) {
          statusStyle = "border-emerald-500 bg-slate-900/90 text-slate-200 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50";
          content = (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-100">Intento actual</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                Escucha hasta {time}s
              </span>
            </div>
          );
        } else {
          // Bloqueado / Futuro
          content = (
            <div className="flex items-center justify-between w-full opacity-50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-500 text-xs">Intento {index + 1}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                {time}s
              </span>
            </div>
          );
        }

        return (
          <div 
            key={index}
            className={`w-full min-h-[44px] px-4 py-2 rounded-xl border flex items-center transition-all duration-200 ${statusStyle}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};
