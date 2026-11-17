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
  // half a second longer per line than plain char-by-char, so the text reads like it is being typed
  const step = speed + 500 / Math.max(1, children.length);
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
        const k = Math.max(0, Math.floor((now - start) / step));
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
  }, [children, delay, step]);
  const k = Math.max(0, n);
  // One layer: the typed part, the caret, then the rest of the text kept in the
  // layout but invisible. Lines therefore break in their final places from the
  // first letter instead of running long and jumping at the end.
  return (
    <Tag ref={ref as never} className={`type ${className ?? ''}`}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" className="type__text">
        {children.slice(0, k)}
        {n >= 0 && n < children.length && <span className="type__caret" />}
        <span className="type__rest">{children.slice(k)}</span>
      </span>
    </Tag>
  );
}

/** The VX mark: a V set inside an X. */
export function Mark({ className, title, ref }: { className?: string; title?: string; ref?: React.Ref<SVGSVGElement> }) {
  return (
    <svg ref={ref} className={className} viewBox="0 0 64 64" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M10 10 L54 54 M54 10 L10 54" strokeWidth="3" />
      <path d="M21 10 L32 23 L43 10" strokeWidth="3" />
    </svg>
  );
}

/**
 * Centre text that flows around the VX mark: the text is split into two
 * halves at a word break and set either side of the mark.
 */
export function AroundMark({ text, as: Tag = 'p', className, markRef, center }: { text: string; as?: 'p' | 'h1' | 'h2'; className?: string; markRef?: React.Ref<HTMLSpanElement>; center?: React.ReactNode }) {
  const words = text.split(' ');
  // split where the character count is closest to half, so both sides of the mark carry equal weight
  let mid = 1, best = Infinity, acc = 0;
  words.forEach((w, i) => { acc += w.length + 1; const d = Math.abs(acc - text.length / 2); if (d < best && i < words.length - 1) { best = d; mid = i + 1; } });
  return (
    <Tag className={`around ${className ?? ''}`}>
      <Type as="span" className="around__l">{words.slice(0, mid).join(' ')}</Type>
      {center ?? (markRef ? <span ref={markRef} className="around__mark around__slot" aria-hidden="true" /> : <Mark className="around__mark" />)}
      <Type as="span" className="around__r" delay={120}>{words.slice(mid).join(' ')}</Type>
    </Tag>
  );
}

/** Thin solid grid lines with + markers and circle markers. */
export function HudGrid({ circles = true, spot = false }: { circles?: boolean; spot?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useSpotlight(ref, spot);
  const lines = (
    <>
      {[25, 50, 75].map((x) => <span key={x} className="hud-grid__v" style={{ left: `${x}%` }} />)}
      {[33.333, 66.666].map((y) => <span key={y} className="hud-grid__h" style={{ top: `${y}%` }} />)}
    </>
  );
  return (
    <div ref={ref} className={`hud-grid${spot ? ' hud-grid--spot' : ''}`} aria-hidden="true">
      {spot && <div className="hud-grid__lit">{lines}</div>}
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
 * - a motion-blur copy of the video underneath (frames blended over the last
 *   ones, so moving parts leave a soft trail)
 * Paused off screen, in background tabs, and for reduced motion.
 */
export function GlitchVideo({ src, poster, srcSmall }: { src: string; poster: string; srcSmall?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const v = video.current;
    const c = canvas.current;
    const tc = trailRef.current;
    if (!v || !c || !tc) return;
    if (reduced()) {
      v.pause();
      return;
    }
    v.play().catch(() => {});
    const ctx = c.getContext('2d')!;
    const tctx = tc.getContext('2d', { alpha: false })!;
    let fresh = true; // first frame after a resize is drawn solid
    let data: TrackData | null = null;
    fetch(assetUrl('video/tracks.json'))
      .then((r) => r.json())
      .then((d) => (data = d))
      .catch(() => {});

    const shown: { x: number; y: number; w: number; h: number; a: number; conf: number }[] = [];
    let visible = true;
    let raf = 0;
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
      // the motion-blur layer does not need full resolution
      tc.width = Math.round(c.clientWidth * 0.75);
      tc.height = Math.round(c.clientHeight * 0.75);
      tctx.setTransform(0.75, 0, 0, 0.75, 0, 0);
      fresh = true;
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

      // Motion blur: each new frame is laid over the previous ones at low
      // opacity, so whatever moves leaves a soft trail and still parts stay sharp.
      tctx.globalAlpha = fresh ? 1 : 0.2;
      tctx.drawImage(v, m.ox, m.oy, m.vw * m.s, m.vh * m.s);
      if (fresh) { fresh = false; tc.classList.add('is-on'); }
      if (!data) return;
      const frame = Math.floor(v.currentTime * data.fps);
      const k = m.vw / data.w;
      const updateConf = now > nextConf;
      if (updateConf) nextConf = now + 1400;
      ctx.font = '500 12px RX100, ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 1.5;
      // soft glow on every line and label
      ctx.shadowColor = 'rgba(255,255,255,0.85)';
      ctx.shadowBlur = 9;

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

        ctx.strokeStyle = `rgba(255,255,255,${0.95 * alpha})`;
        ctx.strokeRect(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5, Math.round(b.w), Math.round(b.h));
        const L = 9;
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        for (const [x, y] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]) {
          ctx.moveTo(x - L, y);
          ctx.lineTo(x + L, y);
          ctx.moveTo(x, y - L);
          ctx.lineTo(x, y + L);
        }
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillText(`${t.label} ${b.conf.toFixed(2)}`, b.x + 4, b.y - 15);
        ctx.fillStyle = `rgba(255,255,255,${0.75 * alpha})`;
        ctx.fillText(t.sub, b.x + 4, b.y + b.h + 5);
        // a thin leader line from each box to the next one
        const n = shown[i + 1];
        if (n && alpha > 0.2) {
          ctx.strokeStyle = `rgba(255,255,255,${0.45 * alpha})`;
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
      <canvas ref={trailRef} className="gvideo__trail" />
      <canvas ref={canvas} className="gvideo__fx" />
      <div className="gvideo__grain" />
    </div>
  );
}

/**
 * Lights the grid lines around the cursor: a second, brighter copy of the lines
 * is masked by a circle that follows the pointer with easing and grows in/out.
 */
function useSpotlight(ref: React.RefObject<HTMLDivElement | null>, on: boolean) {
  useEffect(() => {
    const grid = ref.current;
    const host = grid?.parentElement;
    if (!on || !grid || !host || reduced() || !matchMedia('(hover: hover)').matches) return;
    const cur = { x: -999, y: -999, r: 0 };
    const goal = { x: -999, y: -999, r: 0 };
    let raf = 0;
    const loop = () => {
      cur.x += (goal.x - cur.x) * 0.12;
      cur.y += (goal.y - cur.y) * 0.12;
      cur.r += (goal.r - cur.r) * 0.08;
      grid.style.setProperty('--mx', `${cur.x.toFixed(1)}px`);
      grid.style.setProperty('--my', `${cur.y.toFixed(1)}px`);
      grid.style.setProperty('--mr', `${cur.r.toFixed(1)}px`);
      const still = Math.abs(goal.x - cur.x) + Math.abs(goal.y - cur.y) + Math.abs(goal.r - cur.r) < 0.5;
      raf = still ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      goal.x = e.clientX - r.left;
      goal.y = e.clientY - r.top;
      if (cur.r < 1) { cur.x = goal.x; cur.y = goal.y; } // appear where the pointer is, not fly in
      goal.r = 240;
      kick();
    };
    const leave = () => { goal.r = 0; kick(); };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [ref, on]);
}
