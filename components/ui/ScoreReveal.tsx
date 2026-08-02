'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface ScoreRevealProps {
  total: number;
  title: string;
  recommend: string;
  isUpdate?: boolean;
  onDone: () => void;
}

export default function ScoreReveal({ total, title, recommend, isUpdate, onDone }: ScoreRevealProps) {
  const [visible, setVisible] = useState(true);
  const [showCheck, setShowCheck] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  const scoreValue = useMotionValue(0);
  const springScore = useSpring(scoreValue, { stiffness: 100, damping: 20 });
  const displayScore = useTransform(springScore, (v) => v.toFixed(1));

  useEffect(() => {
    scoreValue.set(total);

    const tParticles = setTimeout(() => setParticles(Array.from({ length: 12 }).map((_, i) => i)), 500);
    const tCheck = setTimeout(() => setShowCheck(true), 800);
    const tBadge = setTimeout(() => setShowBadge(true), 1200);
    const tHide = setTimeout(() => setVisible(false), 1800);
    const tDone = setTimeout(() => onDone(), 2200);

    return () => {
      clearTimeout(tParticles);
      clearTimeout(tCheck);
      clearTimeout(tBadge);
      clearTimeout(tHide);
      clearTimeout(tDone);
    };
  }, [total, scoreValue, onDone]);

  const getBadgeStyle = (rec: string) => {
    switch (rec) {
      case 'Peak': return { color: '#9b59f5', borderColor: '#9b59f5', backgroundColor: 'rgba(155,89,245,0.1)' };
      case 'Yes': return { color: '#52b044', borderColor: '#52b044', backgroundColor: 'rgba(82,176,68,0.1)' };
      case 'No': return { color: '#e63232', borderColor: '#e63232', backgroundColor: 'rgba(230,50,50,0.1)' };
      case 'Garbage': return { color: '#6b6b6b', borderColor: '#6b6b6b', backgroundColor: 'rgba(107,107,107,0.1)' };
      default: return { display: 'none' };
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="score-reveal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.3 }}
        >
          <div className="score-reveal-content">
            <motion.div
              className="score-reveal-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.div>

            <div style={{ position: 'relative' }}>
              <motion.div className="score-reveal-number">
                {displayScore}
              </motion.div>
              <div className="score-reveal-denom">/10</div>
              
              {particles.map((i) => {
                const angle = (i / particles.length) * 2 * Math.PI;
                const radius = 60 + Math.random() * 40;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <motion.div
                    key={i}
                    className="score-reveal-particle"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{ x, y, opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      left: '50%',
                      top: '50%',
                      marginLeft: '-2.5px',
                      marginTop: '-2.5px',
                    }}
                  />
                );
              })}
            </div>

            <AnimatePresence>
              {showBadge && recommend && (
                <motion.div
                  className="score-reveal-recommend"
                  style={getBadgeStyle(recommend)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {recommend}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showCheck && (
                <motion.div
                  className="score-reveal-success-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '20px' }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e63232" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <motion.polyline
                      points="20 6 9 17 4 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>
                  <div className="score-reveal-success">
                    {isUpdate ? 'Updated' : 'Added to Vault'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
