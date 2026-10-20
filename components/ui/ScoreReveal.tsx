'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion';

interface ScoreRevealProps {
  total: number;
  title: string;
  recommend: string;
  isUpdate?: boolean;
  onDone: () => void;
}

interface Particle { id: number; x: number; y: number }

const PARTICLE_COUNT = 12;

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle  = (i / PARTICLE_COUNT) * 2 * Math.PI;
    const radius = 60 + Math.random() * 40;
    return { id: i, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

const RECOMMEND_CLASS: Record<string, string> = {
  Peak:    'is-peak',
  Yes:     'is-yes',
  No:      'is-no',
  Garbage: 'is-garbage',
};

/** Full-screen score count-up shown after saving a rating. Tap to skip. */
export default function ScoreReveal({ total, title, recommend, isUpdate, onDone }: ScoreRevealProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [showCheck, setShowCheck] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Keep the latest callback without restarting the timeline when the parent re-renders
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  const scoreValue = useMotionValue(0);
  const springScore = useSpring(scoreValue, { stiffness: 100, damping: 20 });
  const displayScore = useTransform(springScore, (v) => v.toFixed(1));

  useEffect(() => {
    scoreValue.set(total);

    const timers = [
      reduceMotion ? null : setTimeout(() => setParticles(makeParticles()), 500),
      setTimeout(() => setShowCheck(true), 800),
      setTimeout(() => setShowBadge(true), 1200),
      setTimeout(() => setVisible(false), 1800),
      setTimeout(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        onDoneRef.current();
      }, 2200),
    ];

    return () => { timers.forEach(t => t && clearTimeout(t)); };
  }, [total, scoreValue, reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="score-reveal-overlay"
          role="status"
          aria-live="polite"
          aria-label={`${title}: ${total.toFixed(1)} out of 10. ${isUpdate ? 'Updated' : 'Added to vault'}.`}
          onClick={finish}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          transition={{ duration: 0.3 }}
        >
          <div className="score-reveal-content" aria-hidden="true">
            <motion.div
              className="score-reveal-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.div>

            <div className="score-reveal-score">
              <motion.div className="score-reveal-number">
                {displayScore}
              </motion.div>
              <div className="score-reveal-denom">/10</div>

              {particles.map(p => (
                <motion.div
                  key={p.id}
                  className="score-reveal-particle"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ))}
            </div>

            <AnimatePresence>
              {showBadge && RECOMMEND_CLASS[recommend] && (
                <motion.div
                  className={`score-reveal-recommend ${RECOMMEND_CLASS[recommend]}`}
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
                >
                  <svg className="score-reveal-check" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <motion.polyline
                      points="20 6 9 17 4 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>
                  <div className="score-reveal-success">
                    {isUpdate ? 'Updated' : 'Added to vault'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="score-reveal-skip">Tap to continue</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
