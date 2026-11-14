import images from '../data/images.json';
import { assetUrl } from '../lib/format';

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
