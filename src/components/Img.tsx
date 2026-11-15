import { useEffect, useRef, useState } from 'react';
import images from '../data/images.json';
import { assetUrl } from '../lib/format';
import fit from '../data/fit.json';

const FIT = fit as Record<string, { s: number; x: number; y: number; b: number }>;

type Entry = { w: number; h: number; sizes: number[] };
const MANIFEST = images as Record<string, Entry>;

interface Props {
  /** "look/scarf" or "garment/hoodie-black" */
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Responsive <picture>: AVIF first, WebP fallback, real width/height so the
 * browser reserves the space before the file arrives (no layout shift).
 * Below-the-fold images are lazy and decoded off the main thread.
 */
export function Img({ src, alt, sizes, className, priority }: Props) {
  const e = MANIFEST[src];
  if (!e) return null;
  const set = (ext: string) => e.sizes.map((w) => `${assetUrl(`img/${src}-${w}.${ext}`)} ${w}w`).join(', ');
  const fallback = assetUrl(`img/${src}-${e.sizes[Math.min(1, e.sizes.length - 1)]}.webp`);
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={fallback}
        alt={alt}
        width={e.w}
        height={e.h}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  );
}

/**
 * Product photo hotlinked from Pinterest. Shown in a fixed 4:5 frame
 * (object-fit: contain), greyscale and multiplied onto the card colour, so
 * images with white, grey or transparent backgrounds all sit the same way.
 * Fades in from a blur once decoded.
 */
export function ProductImg({ src, alt, priority, className = '' }: { src: string; alt: string; priority?: boolean; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [src]);
  const f = FIT[src.split('/736x/')[1] ?? ''];
  const style = f ? ({ '--fit': `translate(${f.x}%, ${f.y}%) scale(${f.s})`, '--lift': f.b } as React.CSSProperties) : undefined;
  return (
    <img
      ref={ref}
      style={style}
      src={src}
      alt={alt}
      width={736}
      height={920}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      className={`pimg${loaded ? ' is-loaded' : ''} ${className}`}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  );
}
