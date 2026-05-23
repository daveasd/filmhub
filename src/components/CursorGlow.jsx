import { useEffect, useRef, useState } from 'react';

const LERP = 0.14;

function useCursorEffectsEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      '(min-width: 768px) and (hover: hover) and (pointer: fine)',
    );
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => {
      setEnabled(mq.matches && !motionMq.matches);
    };

    update();
    mq.addEventListener('change', update);
    motionMq.addEventListener('change', update);
    return () => {
      mq.removeEventListener('change', update);
      motionMq.removeEventListener('change', update);
    };
  }, []);

  return enabled;
}

/**
 * Desktop-only ambient cursor glow. pointer-events: none — never blocks clicks.
 */
export default function CursorGlow() {
  const enabled = useCursorEffectsEnabled();
  const [visible, setVisible] = useState(false);

  const target = useRef({ x: -9999, y: -9999 });
  const current = useRef({ x: -9999, y: -9999 });
  const spotlightRef = useRef(null);
  const orbRef = useRef(null);
  const rafId = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
    };

    const onLeave = () => setVisible(false);

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;

      const transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      if (spotlightRef.current) spotlightRef.current.style.transform = transform;
      if (orbRef.current) orbRef.current.style.transform = transform;

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor-glow-layer" aria-hidden="true">
      <div
        ref={spotlightRef}
        className={`cursor-glow-spotlight ${visible ? 'is-visible' : ''}`}
      />
      <div ref={orbRef} className={`cursor-glow-orb ${visible ? 'is-visible' : ''}`} />
    </div>
  );
}
