import { lazy, type ComponentType } from 'react';

/**
 * React.lazy with a preload hook. If the chunk was loaded before the first
 * render (we do that for the current route before hydrating), the component
 * renders synchronously, so hydration never meets a suspended boundary and
 * the prerendered HTML is kept as is (no flash of the loading skeleton).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>) {
  let loaded: ComponentType<P> | null = null;
  const Lazy = lazy(factory);
  const Page = (props: P) => {
    const C = loaded ?? Lazy;
    return <C {...props} />;
  };
  Page.preload = () => factory().then((m) => (loaded = m.default));
  return Page;
}
