import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../lib/format';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Types its text out quickly, letter by letter, once it scrolls into view.
 * The full text is in the DOM from the start (for screen readers and SEO);
 * only the visible copy is animated.
 */
export function Type({ children, as: Tag = 'span', className, delay = 0, speed = 14 }: { children: string; as?: 'span' | 'p' | 'h1' | 'h2'; className?: string; delay?: number; speed?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(-1); // -1: not started (text hidden but space kept)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) {
      setN(children.length);
      return;
    }
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now() + delay;
      const tick = (now: number) => {
        const k = Math.max(0, Math.floor((now - start) / speed));
        setN(Math.min(children.length, k));
        if (k < children.length) t = requestAnimationFrame(tick);
      };
      t = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(t);
    };
  }, [children, delay, speed]);
  const shown = n < 0 ? '' : children.slice(0, n);
  return (
    <Tag ref={ref as never} className={`type ${className ?? ''}`}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" className="type__ghost">{children}</span>
      <span aria-hidden="true" className="type__live">
        {shown}
        {n >= 0 && n < children.length && <span className="type__caret" />}
      </span>
    </Tag>
  );
}

/** The VX mark: a V set inside an X. */
export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M10 10 L54 54 M54 10 L10 54" strokeWidth="3" />
      <path d="M21 10 L32 23 L43 10" strokeWidth="3" />
    </svg>
  );
}

/**
 * Centre text that flows around the VX mark: the text is split into two
 * halves at a word break and set either side of the mark.
 */
export function AroundMark({ text, as: Tag = 'p', className }: { text: string; as?: 'p' | 'h1' | 'h2'; className?: string }) {
  const words = text.split(' ');
  // split where the character count is closest to half, so both sides of the mark carry equal weight
  let mid = 1, best = Infinity, acc = 0;
  words.forEach((w, i) => { acc += w.length + 1; const d = Math.abs(acc - text.length / 2); if (d < best && i < words.length - 1) { best = d; mid = i + 1; } });
  return (
    <Tag className={`around ${className ?? ''}`}>
      <Type as="span" className="around__l">{words.slice(0, mid).join(' ')}</Type>
      <Mark className="around__mark" />
      <Type as="span" className="around__r" delay={120}>{words.slice(mid).join(' ')}</Type>
    </Tag>
  );
}

/** Thin solid grid lines with + markers and circle markers. */
export function HudGrid({ circles = true }: { circles?: boolean }) {
  return (
    <div className="hud-grid" aria-hidden="true">
      {[25, 50, 75].map((x) => <span key={x} className="hud-grid__v" style={{ left: `${x}%` }} />)}
      {[33.333, 66.666].map((y) => <span key={y} className="hud-grid__h" style={{ top: `${y}%` }} />)}
      {[25, 75].map((x) => [33.333, 66.666].map((y) => <span key={`${x}-${y}`} className="hud-plus" style={{ left: `${x}%`, top: `${y}%` }} />))}
      {circles && (
        <>
          <span className="hud-circle" style={{ left: '50%', top: '33.333%' }} />
          <span className="hud-circle" style={{ left: '50%', top: '66.666%' }} />
        </>
      )}
    </div>
  );
}

interface TrackData {
  fps: number;
  w: number;
  h: number;
  tracks: { id: string; label: string; sub: string; f: number[][] }[];
}

/**
 * Background video with a canvas on top that draws:
 * - tracker boxes on the person's clothes (hat, pockets, sleeve), played back
 *   from boxes measured offline with OpenCV (scripts/track-video.py) and eased
 *   slowly towards each new position
 * - a short glitch burst every few seconds (slices of the frame shifted sideways)
 * Paused off screen, in background tabs, and for reduced motion.
 */
export function GlitchVideo({ src, poster, srcSmall }: { src: string; poster: string; srcSmall?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const v = video.current;
    const c = canvas.current;
    if (!v || !c) return;
    if (reduced()) {
      v.pause();
      return;
    }
    v.play().catch(() => {});
    const ctx = c.getContext('2d')!;
    let data: TrackData | null = null;
    fetch(assetUrl('video/tracks.json'))
      .then((r) => r.json())
      .then((d) => (data = d))
      .catch(() => {});

    const shown: { x: number; y: number; w: number; h: number; a: number; conf: number }[] = [];
    let visible = true;
    let raf = 0;
    let glitchUntil = 0;
    let nextGlitch = performance.now() + 4000;
    let nextConf = 0;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(c);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // object-fit: cover mapping from video pixels to canvas pixels
    const cover = () => {
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      const vw = v.videoWidth || 1280;
      const vh = v.videoHeight || 720;
      const s = Math.max(cw / vw, ch / vh);
      return { s, ox: (cw - vw * s) / 2, oy: (ch - vh * s) / 2, vw, vh };
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden || v.readyState < 2) return;
      const W = c.clientWidth;
      const H = c.clientHeight;
      ctx.clearRect(0, 0, W, H);
      const m = cover();

      if (now > nextGlitch) {
        glitchUntil = now + 140 + Math.random() * 180;
        nextGlitch = now + 6000 + Math.random() * 6000;
      }
      if (now < glitchUntil) {
        const slices = 4 + ((Math.random() * 5) | 0);
        for (let i = 0; i < slices; i++) {
          const sy = Math.random() * m.vh;
          const sh = 4 + Math.random() * m.vh * 0.05;
          const shift = (Math.random() - 0.5) * 60;
          ctx.drawImage(v, 0, sy, m.vw, sh, m.ox + shift, m.oy + sy * m.s, m.vw * m.s, sh * m.s);
        }
      }

      if (!data) return;
      const frame = Math.floor(v.currentTime * data.fps);
      const k = m.vw / data.w;
      const updateConf = now > nextConf;
      if (updateConf) nextConf = now + 1400;
      ctx.font = '11px RX100, ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 1;

      data.tracks.forEach((t, i) => {
        const f = t.f[Math.min(frame, t.f.length - 1)];
        const tx = m.ox + f[0] * k * m.s;
        const ty = m.oy + f[1] * k * m.s;
        const tw = f[2] * k * m.s;
        const th = f[3] * k * m.s;
        let b = shown[i];
        if (!b) b = shown[i] = { x: tx, y: ty, w: tw, h: th, a: 0, conf: 0.9 };
        // slow easing: boxes drift after the clothes instead of snapping to them
        const e = 0.045;
        b.x += (tx - b.x) * e;
        b.y += (ty - b.y) * e;
        b.w += (tw - b.w) * e;
        b.h += (th - b.h) * e;
        b.a = Math.min(1, b.a + 0.008); // each box fades in slowly
        if (updateConf) b.conf = 0.86 + Math.random() * 0.12;
        const alpha = Math.min(1, Math.max(0, b.a * 1.6 - i * 0.25));
        if (alpha <= 0) return;

        ctx.strokeStyle = `rgba(236,236,234,${0.75 * alpha})`;
        ctx.strokeRect(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5, Math.round(b.w), Math.round(b.h));
        const L = 7;
        ctx.strokeStyle = `rgba(236,236,234,${alpha})`;
        ctx.beginPath();
        for (const [x, y] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]) {
          ctx.moveTo(x - L, y);
          ctx.lineTo(x + L, y);
          ctx.moveTo(x, y - L);
          ctx.lineTo(x, y + L);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(236,236,234,${alpha})`;
        ctx.fillText(`${t.label} ${b.conf.toFixed(2)}`, b.x + 4, b.y - 15);
        ctx.fillStyle = `rgba(236,236,234,${0.6 * alpha})`;
        ctx.fillText(t.sub, b.x + 4, b.y + b.h + 5);
        // a thin leader line from each box to the next one
        const n = shown[i + 1];
        if (n && alpha > 0.2) {
          ctx.strokeStyle = `rgba(236,236,234,${0.25 * alpha})`;
          ctx.beginPath();
          ctx.moveTo(b.x + b.w, b.y + b.h / 2);
          ctx.lineTo(n.x, n.y + n.h / 2);
          ctx.stroke();
        }
      });
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="gvideo" aria-hidden="true">
      <video ref={video} className="gvideo__video" muted loop playsInline autoPlay preload="auto" poster={poster}>
        {srcSmall && <source src={srcSmall} type="video/mp4" media="(max-width: 899px)" />}
        <source src={src} type="video/mp4" />
      </video>
      <canvas ref={canvas} className="gvideo__fx" />
      <div className="gvideo__grain" />
    </div>
  );
}
