'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  colors?: string[];
}

export function Confetti({ active, colors = ['#ffde59', '#0b6d41', '#fbfbee', '#ffa500', '#ff6b6b'] }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      // Generate 50 confetti pieces
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Random X position (percentage)
        delay: Math.random() * 0.5, // Random delay
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setPieces(newPieces);
    } else {
      setPieces([]);
    }
  }, [active, colors]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              y: -20,
              x: `${piece.x}vw`,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              y: '110vh',
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
              opacity: [1, 1, 0.8, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: piece.delay,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
