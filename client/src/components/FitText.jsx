import { useLayoutEffect, useRef } from "react";

// One line of text that starts at maxRem and shrinks just enough to fit its box (never below minRem,
// where an ellipsis takes over). Refits when the box resizes and when web fonts finish loading, since a
// newly loaded font changes the text's width.
export default function FitText({ as: Tag = "span", children, className, style, maxRem, minRem }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let lastWidth = -1;
    const fit = (force) => {
      if (!force && el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const min = minRem * root;
      let size = maxRem * root;
      el.style.fontSize = `${size}px`;
      for (let i = 0; i < 5 && el.scrollWidth > el.clientWidth + 0.5 && size > min; i++) {
        size = Math.max(min, (size * el.clientWidth) / el.scrollWidth - 0.5);
        el.style.fontSize = `${size}px`;
      }
    };
    const refit = () => fit(true);
    fit(true);
    const observer = new ResizeObserver(() => fit(false));
    observer.observe(el);
    document.fonts?.ready.then(refit);
    document.fonts?.addEventListener?.("loadingdone", refit);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", refit);
    };
  }, [children, maxRem, minRem, style?.fontFamily]);

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
