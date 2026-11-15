import { useEffect, useRef, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+.:_';

/**
 * Text that resolves from random glyphs into its real value whenever it
 * changes (the "decoding" look on the moodboard). Purely decorative, so the
 * real text is what screen readers get.
 */
export function Scramble({ text, className, every }: { text: string | string[]; className?: string; every?: number }) {
  const list = Array.isArray(text) ? text : [text];
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(list[0]);
  const target = list[idx % list.length];

  useEffect(() => {
    if (!every || list.length < 2) return;
    const t = setInterval(() => setIdx((i) => i + 1), every);
    return () => clearInterval(t);
  }, [every, list.length]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      return;
    }
    let frame = 0;
    let raf = 0;
    const total = 18;
    const tick = () => {
      frame++;
      const done = Math.floor((frame / total) * target.length);
      setShown(
        target
          .split('')
          .map((ch, i) => (i < done || ch === ' ' || ch === '\n' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(''),
      );
      if (frame < total) raf = window.setTimeout(tick, 34);
    };
    tick();
    return () => clearTimeout(raf);
  }, [target]);

  return (
    <span className={className}>
      <span className="sr-only">{target}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** Thin grid lines with + markers and circle markers, like a viewfinder. */
export function HudGrid({ circles = true }: { circles?: boolean }) {
  return (
    <div className="hud-grid" aria-hidden="true">
      <span className="hud-grid__v" style={{ left: '25%' }} />
      <span className="hud-grid__v" style={{ left: '50%' }} />
      <span className="hud-grid__v" style={{ left: '75%' }} />
      <span className="hud-grid__h" style={{ top: '33.333%' }} />
      <span className="hud-grid__h" style={{ top: '66.666%' }} />
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

interface Track {
  x: number;
  y: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  conf: number;
  tag: string;
}

const TAGS = ['SUBJ', 'FABRIC', 'DENIM', 'HOOD', 'LIGHT', 'PILLAR', 'MOTION', 'SIGNAL'];

/**
 * Background video with two canvas effects drawn on top:
 * - tracker boxes that follow the brightest and most-moving regions
 *   (frame analysis on a 64x36 copy, about 12 times a second)
 * - short glitch bursts every few seconds: horizontal slices of the current
 *   frame shifted sideways for a fraction of a second
 * Both stop when the video is off screen, the tab is hidden, or the visitor
 * prefers reduced motion.
 */
export function GlitchVideo({ src, poster, srcSmall }: { src: string; poster: string; srcSmall?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const v = video.current;
    const c = canvas.current;
    if (!v || !c) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      v.pause();
      return;
    }
    v.play().catch(() => {});
    const ctx = c.getContext('2d')!;
    const small = document.createElement('canvas');
    const SW = 64;
    const SH = 36;
    small.width = SW;
    small.height = SH;
    const sctx = small.getContext('2d', { willReadFrequently: true })!;
    let prev: Uint8ClampedArray | null = null;
    const tracks: Track[] = [];
    let visible = true;
    let raf = 0;
    let last = 0;
    let glitchUntil = 0;
    let nextGlitch = performance.now() + 2500;

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

    // Maps a point in the video frame to the canvas, matching object-fit: cover.
    const cover = () => {
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      const vw = v.videoWidth || 16;
      const vh = v.videoHeight || 9;
      const s = Math.max(cw / vw, ch / vh);
      return { s, ox: (cw - vw * s) / 2, oy: (ch - vh * s) / 2, vw, vh };
    };

    const analyse = () => {
      sctx.drawImage(v, 0, 0, SW, SH);
      const px = sctx.getImageData(0, 0, SW, SH).data;
      const cells: { x: number; y: number; score: number }[] = [];
      const CW = 8;
      const CH = 6;
      for (let cy = 0; cy < SH; cy += CH) {
        for (let cx = 0; cx < SW; cx += CW) {
          let bright = 0;
          let motion = 0;
          for (let y = cy; y < cy + CH; y++) {
            for (let x = cx; x < cx + CW; x++) {
              const i = (y * SW + x) * 4;
              bright += px[i];
              if (prev) motion += Math.abs(px[i] - prev[i]);
            }
          }
          const n = CW * CH;
          cells.push({ x: cx, y: cy, score: (bright / n / 255) * 0.6 + (motion / n / 40) * 1.4 });
        }
      }
      prev = new Uint8ClampedArray(px);
      cells.sort((a, b) => b.score - a.score);
      const { s, ox, oy, vw } = cover();
      const k = vw / SW;
      const picks: typeof cells = [];
      for (const cell of cells) {
        if (picks.length >= 4) break;
        if (picks.every((q) => Math.abs(q.x - cell.x) > CW || Math.abs(q.y - cell.y) > CH)) picks.push(cell);
      }
      const shrink = c.clientWidth < 700 ? 0.55 : 0.85;
      picks.forEach((p, i) => {
        const w = CW * k * s * shrink * (1 + ((i * 37) % 7) / 10);
        const h = CH * k * s * shrink * (1.1 + ((i * 53) % 5) / 10);
        const tx = ox + p.x * k * s - w * 0.05;
        const ty = oy + p.y * k * s - h * 0.05;
        const t = tracks[i];
        if (!t) tracks[i] = { x: tx, y: ty, w, h, tx, ty, tw: w, th: h, conf: 0.6 + Math.min(p.score, 0.39), tag: TAGS[(Math.random() * TAGS.length) | 0] };
        else {
          Object.assign(t, { tx, ty, tw: w, th: h, conf: Math.min(0.99, 0.55 + p.score * 0.6) });
          if (Math.random() < 0.04) t.tag = TAGS[(Math.random() * TAGS.length) | 0];
        }
      });
      tracks.length = picks.length;
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden || v.readyState < 2) return;
      if (now - last > 85) {
        analyse();
        last = now;
      }
      const W = c.clientWidth;
      const H = c.clientHeight;
      ctx.clearRect(0, 0, W, H);

      // glitch burst
      if (now > nextGlitch) {
        glitchUntil = now + 160 + Math.random() * 220;
        nextGlitch = now + 4000 + Math.random() * 5000;
      }
      if (now < glitchUntil) {
        const { s, ox, oy, vw, vh } = cover();
        const slices = 5 + ((Math.random() * 6) | 0);
        for (let i = 0; i < slices; i++) {
          const sy = Math.random() * vh;
          const sh = 4 + Math.random() * vh * 0.06;
          const shift = (Math.random() - 0.5) * 70;
          ctx.drawImage(v, 0, sy, vw, sh, ox + shift, oy + sy * s, vw * s, sh * s);
        }
        ctx.fillStyle = 'rgba(235,234,230,0.06)';
        ctx.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6);
      }

      // tracker boxes
      ctx.lineWidth = 1;
      ctx.font = '10px RX100, ui-monospace, monospace';
      ctx.textBaseline = 'top';
      tracks.forEach((t, i) => {
        t.x += (t.tx - t.x) * 0.12;
        t.y += (t.ty - t.y) * 0.12;
        t.w += (t.tw - t.w) * 0.12;
        t.h += (t.th - t.h) * 0.12;
        ctx.strokeStyle = 'rgba(235,234,230,0.85)';
        ctx.strokeRect(Math.round(t.x) + 0.5, Math.round(t.y) + 0.5, Math.round(t.w), Math.round(t.h));
        // corner ticks
        const L = 6;
        ctx.beginPath();
        [[t.x, t.y], [t.x + t.w, t.y], [t.x, t.y + t.h], [t.x + t.w, t.y + t.h]].forEach(([x, y]) => {
          ctx.moveTo(x - L, y);
          ctx.lineTo(x + L, y);
          ctx.moveTo(x, y - L);
          ctx.lineTo(x, y + L);
        });
        ctx.stroke();
        ctx.fillStyle = 'rgba(235,234,230,0.92)';
        ctx.fillText(`${t.tag} ${t.conf.toFixed(2)}`, t.x + 3, t.y + t.h + 4);
        ctx.fillText(`X${Math.round(t.x)} Y${Math.round(t.y)}`, t.x + 3, t.y - 13);
        if (i > 0) {
          const p = tracks[i - 1];
          ctx.strokeStyle = 'rgba(235,234,230,0.35)';
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y + p.h / 2);
          ctx.lineTo(t.x + t.w / 2, t.y + t.h / 2);
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
