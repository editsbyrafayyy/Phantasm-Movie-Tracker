'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './OptionWheel.css';

const DEFAULT_ITEMS = [
  'Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave',
  'Trance', 'Funk', 'Disco', 'Hip-Hop', 'Chillwave', 'Drum & Bass'
];

const noop = (_index, _item) => { void _index; void _item; };

/**
 * Imperative animation engine for the wheel. Lives outside React render so the
 * rAF loop can drive transforms directly without re-rendering every frame.
 */
function createWheelEngine({ root, elsRef, cfgRef, cbRef, onIndex, initial }) {
  const s = {
    pos: initial,
    target: initial,
    raf: null,
    last: 0,
    selected: initial,
    lastSettled: initial,
    interacting: false,
    visible: true,
    reduced: false,
    audio: null,
    audioUrl: '',
    lastTick: 0,
    wheelTimer: null,
  };

  const playTick = () => {
    const { soundUrl, soundVolume } = cfgRef.current;
    if (!soundUrl) return;
    const now = performance.now();
    if (now - s.lastTick < 70) return;
    s.lastTick = now;
    if (!s.audio || s.audioUrl !== soundUrl) {
      s.audio = new Audio(soundUrl);
      s.audio.preload = 'auto';
      s.audioUrl = soundUrl;
    }
    s.audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    s.audio.currentTime = 0;
    s.audio.play()?.catch(() => {});
  };

  const paint = (pos) => {
    const cfg = cfgRef.current;
    const els = elsRef.current;
    const n = cfg.count;
    const mirror = cfg.side === 'right' ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      let d = i - pos;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      const scale = Math.max(0.72, 1 - dist * cfg.scaleFalloff);
      const blurPx = s.reduced ? 0 : Math.min(dist * cfg.blur, cfg.maxBlur);
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
      el.style.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }
  };

  const track = (pos, settled) => {
    const cfg = cfgRef.current;
    const idx = ((Math.round(pos) % cfg.count) + cfg.count) % cfg.count;
    if (idx !== s.selected) {
      s.selected = idx;
      onIndex(idx);
      cbRef.current.onChange(idx, cfg.items[idx]);
      playTick();
    }
    // onSettle fires only once the wheel has come to rest after a user action
    if (settled) {
      if (s.interacting && idx !== s.lastSettled) {
        s.lastSettled = idx;
        cbRef.current.onSettle(idx, cfg.items[idx]);
      }
      s.interacting = false;
    }
  };

  const frame = (now) => {
    const dt = Math.min((now - s.last) / 1000, 0.05);
    s.last = now;
    const tau = Math.max(cfgRef.current.smoothing, 1) / 1000;
    const k = s.reduced ? 1 : 1 - Math.exp(-dt / tau);
    let next = s.pos + (s.target - s.pos) * k;
    const settled = Math.abs(s.target - next) < 0.001;
    if (settled) next = s.target;
    s.pos = next;
    track(next, settled);
    paint(next);
    s.raf = settled ? null : requestAnimationFrame(frame);
  };

  const start = () => {
    if (s.raf != null) cancelAnimationFrame(s.raf);
    s.raf = null;
    // Offscreen / hidden tab: jump straight to the target instead of animating.
    if (!s.visible || document.hidden) {
      s.pos = s.target;
      track(s.pos, true);
      paint(s.pos);
      return;
    }
    s.last = performance.now();
    s.raf = requestAnimationFrame(frame);
  };

  const applyTarget = (value, snap, isUserAction = false) => {
    const cfg = cfgRef.current;
    let v = value;
    if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
    if (snap) v = Math.round(v);
    s.target = v;
    if (isUserAction) s.interacting = true;
    start();
  };

  // ── Environment listeners ────────────────────────────────────────────────
  const onWheel = (e) => {
    const cfg = cfgRef.current;
    const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
    if (Math.abs(delta) < Math.abs(e.deltaX)) return; // horizontal gesture — not ours
    // At either end of a non-looping wheel let the page scroll instead of trapping it.
    if (cfg.edgeScroll && !cfg.loop) {
      const at = Math.round(s.target);
      if ((delta < 0 && at <= 0) || (delta > 0 && at >= cfg.count - 1)) return;
    }
    e.preventDefault();
    const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
    applyTarget(s.target + step, false, true);
    if (s.wheelTimer) clearTimeout(s.wheelTimer);
    s.wheelTimer = setTimeout(() => applyTarget(s.target, true, true), 140);
  };
  root.addEventListener('wheel', onWheel, { passive: false });

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  s.reduced = mq.matches;
  const onMotion = () => { s.reduced = mq.matches; paint(s.pos); };
  mq.addEventListener('change', onMotion);

  const io = new IntersectionObserver(([entry]) => {
    s.visible = !!entry?.isIntersecting;
    if (!s.visible && s.raf != null) start(); // finish instantly while offscreen
  });
  io.observe(root);

  const onVisibility = () => { if (document.hidden && s.raf != null) start(); };
  document.addEventListener('visibilitychange', onVisibility);

  paint(s.pos);

  return {
    applyTarget,
    refresh: () => applyTarget(s.target, false, false),
    get target() { return s.target; },
    get pos() { return s.pos; },
    destroy() {
      if (s.raf != null) cancelAnimationFrame(s.raf);
      s.raf = null;
      if (s.wheelTimer) clearTimeout(s.wheelTimer);
      root.removeEventListener('wheel', onWheel);
      mq.removeEventListener('change', onMotion);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      s.audio?.pause();
    },
  };
}

const OptionWheel = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 0,
  onChange = noop,
  onSettle = noop,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'left',
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  maxBlur = 4,
  fade = 0.25,
  minOpacity = 0.05,
  scaleFalloff = 0,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  edgeScroll = true,
  autoFocus = false,
  soundUrl = '',
  soundVolume = 0.5,
  ariaLabel = 'Options',
  className = ''
}) => {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const engineRef = useRef(null);
  const cfgRef = useRef(null);
  const cbRef = useRef({ onChange, onSettle });
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);
  const baseId = useId();
  const optionId = (i) => `${baseId}-opt-${i}`;

  // Keep the engine's view of props current (layout effect → before paint).
  useLayoutEffect(() => {
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    cbRef.current = { onChange, onSettle };
    cfgRef.current = {
      count: items.length,
      items,
      rowH: Math.max(fontSize * spacing * remPx, 1),
      curve, tilt, blur, maxBlur, fade, minOpacity, scaleFalloff,
      side, loop, smoothing, draggable, edgeScroll, soundUrl, soundVolume,
    };
  });

  // Create / destroy the animation engine (layout effect so items are placed before first paint).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const engine = createWheelEngine({
      root,
      elsRef: itemRefs,
      cfgRef,
      cbRef,
      onIndex: setSelectedIndex,
      initial: defaultSelected,
    });
    engineRef.current = engine;
    if (autoFocus) root.focus({ preventScroll: true });
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // defaultSelected / autoFocus are mount-time only (remount with a key to reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-layout when visual configuration changes.
  useEffect(() => {
    engineRef.current?.refresh();
  }, [items, fontSize, spacing, curve, tilt, blur, maxBlur, fade, minOpacity, scaleFalloff, side, loop, smoothing]);

  const handlePointerDown = (e) => {
    const engine = engineRef.current;
    if (!draggable || !engine) return;
    dragRef.current = { y: e.clientY, start: engine.target, id: e.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!dragMovedRef.current && Math.abs(dy) > 4) {
      dragMovedRef.current = true;
      rootRef.current?.setPointerCapture(drag.id);
    }
    if (dragMovedRef.current) {
      engineRef.current?.applyTarget(drag.start - dy / cfgRef.current.rowH, false, true);
    }
  };

  const handlePointerEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) engineRef.current?.applyTarget(engineRef.current.target, true, true);
  };

  const handleItemClick = (index) => {
    const engine = engineRef.current;
    if (dragMovedRef.current || !engine) return;
    const count = items.length;
    const cur = engine.pos;
    let d = index - (((Math.round(cur) % count) + count) % count);
    if (loop && count > 1) {
      if (d > count / 2) d -= count;
      else if (d < -count / 2) d += count;
    }
    engine.applyTarget(cur + d, true, true);
  };

  const handleKeyDown = (e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const at = Math.round(engine.target);
    let next = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = at - 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = at + 1;
    else if (e.key === 'PageUp') next = at - 5;
    else if (e.key === 'PageDown') next = at + 5;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next == null) return;
    e.preventDefault();
    engine.applyTarget(next, true, true);
  };

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-activedescendant={optionId(selectedIndex)}
      className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${isDragging ? ' option-wheel--dragging' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--ow-text-color': textColor,
        '--ow-active-color': activeColor,
        '--ow-font-size': `${fontSize}rem`,
        '--ow-inset': `${inset}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          id={optionId(index)}
          ref={el => { itemRefs.current[index] = el; }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${selectedIndex === index ? ' option-wheel__item--selected' : ''}`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

export default OptionWheel;
