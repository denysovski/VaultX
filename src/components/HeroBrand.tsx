import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';

/**
 * The big VAULTX in the middle of the landing hero. As you scroll past the
 * hero it glides up and shrinks into the nav logo's place; scrolling back up
 * sends it back. One fixed element is moved between the two spots (the hero
 * placeholder and the hidden nav logo), with easing so it trails the scroll.
 */
export function HeroBrand({ slot }: { slot: React.RefObject<HTMLElement | null> }) {
  const el = useRef<HTMLAnchorElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const a = el.current, from = slot.current;
    const to = document.querySelector<HTMLElement>('.nav__logo');
    const nav = document.querySelector<HTMLElement>('.nav');
    if (!mounted || !a || !from || !to || !nav) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const BIG = parseFloat(getComputedStyle(from).fontSize);
    let cur = -1, raf = 0;
    const loop = () => {
      const H = innerHeight;
      // 0 while the hero fills the screen, 1 once it is mostly scrolled away
      const t = Math.min(1, Math.max(0, (scrollY - H * 0.12) / (H * 0.6)));
      const goal = t * t * (3 - 2 * t);
      cur = cur < 0 || still ? goal : cur + (goal - cur) * 0.1;
      if (Math.abs(goal - cur) < 0.0005) cur = goal;
      const s = from.getBoundingClientRect();
      const d = to.getBoundingClientRect();
      const small = parseFloat(getComputedStyle(to).fontSize);
      const x = s.left + s.width / 2 + (d.left + d.width / 2 - (s.left + s.width / 2)) * cur;
      const y = s.top + s.height / 2 + (d.top + d.height / 2 - (s.top + s.height / 2)) * cur;
      const k = (BIG + (small - BIG) * cur) / BIG;
      const ls = 0.02 + (0.34 - 0.02) * cur;
      a.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${k.toFixed(4)})`;
      a.style.letterSpacing = a.style.paddingLeft = `${ls.toFixed(3)}em`;
      a.classList.toggle('is-dark', nav.classList.contains('nav--solid') && cur > 0.5);
      a.classList.toggle('is-docked', cur > 0.98);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mounted, slot]);

  if (!mounted) return null;
  return createPortal(
    <Link ref={el} to="/" className="hero-brand" aria-label="VAULTX home" onClick={() => scrollY > 0 && scrollTo({ top: 0, behavior: 'smooth' })}>
      VAULTX
    </Link>,
    document.body,
  );
}
