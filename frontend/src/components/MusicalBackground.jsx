import React, { useEffect, useState, useRef } from 'react';

const MUSIC_SYMBOLS = ['♪', '♫', '♬', '♩', '🎶'];
const NEON_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

// Generar una red de 45 notas distribuidas por toda la pantalla
const generateBackgroundNotes = (count = 45) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    symbol: MUSIC_SYMBOLS[i % MUSIC_SYMBOLS.length],
    neonColor: NEON_COLORS[i % NEON_COLORS.length],
    xPct: Math.random() * 94 + 3, // 3% a 97%
    yPct: Math.random() * 92 + 4, // 4% a 96%
    size: Math.floor(Math.random() * 14) + 20, // 20px a 34px
    rotation: Math.floor(Math.random() * 40) - 20,
    animDelay: `${(Math.random() * 5).toFixed(1)}s`,
    animDuration: `${(Math.random() * 6 + 8).toFixed(1)}s`, // 8s a 14s
  }));
};

export const MusicalBackground = () => {
  const [bgNotes] = useState(() => generateBackgroundNotes(45));
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [clickNotes, setClickNotes] = useState([]);
  const [twinklingIds, setTwinklingIds] = useState(new Set());
  const containerRef = useRef(null);
  const idCounter = useRef(0);

  // Titilado aleatorio automático (ideal para Mobile y ambiente en Desktop)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndices = new Set();
      while (randomIndices.size < 5) {
        const randomIndex = Math.floor(Math.random() * bgNotes.length);
        randomIndices.add(randomIndex);
      }
      setTwinklingIds(randomIndices);
    }, 1400);

    return () => clearInterval(interval);
  }, [bgNotes.length]);

  // Mover cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Efecto de ráfaga de notas al hacer clic
  useEffect(() => {
    const handleClick = (e) => {
      const newNotes = Array.from({ length: 3 }).map((_, index) => {
        idCounter.current += 1;
        const symbol = MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)];
        const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 20;
        const rotation = (Math.random() - 0.5) * 60;
        const size = Math.floor(Math.random() * 14) + 18;

        return {
          id: idCounter.current + '-' + index,
          symbol,
          color,
          x: e.clientX + offsetX,
          y: e.clientY + offsetY,
          rotation,
          size,
        };
      });

      setClickNotes((prev) => [...prev, ...newNotes]);

      setTimeout(() => {
        setClickNotes((prev) => prev.filter((n) => !newNotes.some((nn) => nn.id === n.id)));
      }, 1200);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {/* Fondo de Notas Musicales Grises que Flotan, Titilan en Mobile y se Encienden al pasar el Cursor */}
      <div 
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      >
        {bgNotes.map((note) => {
          // Calcular distancia en pantalla pixel a pixel
          const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          const noteX = (note.xPct / 100) * windowWidth;
          const noteY = (note.yPct / 100) * windowHeight;

          const dx = mousePos.x - noteX;
          const dy = mousePos.y - noteY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const RADIUS = 190;
          const isCursorNear = dist < RADIUS;
          const isTwinkling = twinklingIds.has(note.id);
          const isLit = isCursorNear || isTwinkling;
          const litFactor = isCursorNear ? Math.max(0, 1 - dist / RADIUS) : 0.6;

          return (
            <span
              key={note.id}
              className="absolute font-black transition-all duration-700 ease-out animate-bg-float"
              style={{
                left: `${note.xPct}%`,
                top: `${note.yPct}%`,
                fontSize: `${note.size}px`,
                transform: `rotate(${note.rotation}deg) scale(${isLit ? 1.3 : 1})`,
                color: isLit ? note.neonColor : '#334155', // Gris slate cuando lejos, Neón cuando prende
                opacity: isLit ? 0.45 + litFactor * 0.55 : 0.3,
                textShadow: isLit 
                  ? `0 0 12px ${note.neonColor}, 0 0 24px ${note.neonColor}` 
                  : 'none',
                animationDelay: note.animDelay,
                animationDuration: note.animDuration,
              }}
            >
              {note.symbol}
            </span>
          );
        })}
      </div>

      {/* Ráfaga de Notas Musicales al hacer Clic (Z-40 por encima) */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
        {clickNotes.map((note) => (
          <span
            key={note.id}
            className="absolute font-black animate-float-note pointer-events-none"
            style={{
              left: `${note.x}px`,
              top: `${note.y}px`,
              color: note.color,
              fontSize: `${note.size}px`,
              transform: `rotate(${note.rotation}deg)`,
              textShadow: `0 0 14px ${note.color}, 0 0 28px ${note.color}`,
            }}
          >
            {note.symbol}
          </span>
        ))}
      </div>
    </>
  );
};
