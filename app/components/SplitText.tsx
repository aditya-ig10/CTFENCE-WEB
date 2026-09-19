'use client';
import { useEffect, useRef, type CSSProperties } from 'react';

interface Props {
  text: string;
  italic?: boolean;
  className?: string;
  style?: CSSProperties;
  /** base delay in ms before the first word slides in */
  delay?: number;
  /** stagger between words in ms */
  stagger?: number;
}

/**
 * Split-view text reveal: each word sits in its own overflow-hidden
 * mask and slides up into place word by word once scrolled into view.
 */
export default function SplitText({ text, italic = false, className = '', style, delay = 0, stagger = 70 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>('.split-word');

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          words.forEach((w, i) => {
            window.setTimeout(() => {
              w.style.transform = 'translateY(0)';
              w.style.opacity = '1';
            }, delay + i * stagger);
          });
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [text, delay, stagger]);

  const words = text.split(' ');

  return (
    <span ref={ref} className={`split-text ${className}`} style={{ display: 'inline-block', ...style }}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            // small padding so descenders (g, y, p) aren't clipped by the mask
            paddingBottom: '0.12em',
            marginBottom: '-0.12em',
          }}
        >
          <span
            className="split-word"
            style={{
              display: 'inline-block',
              transform: 'translateY(115%)',
              opacity: 0,
              transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease',
              willChange: 'transform',
            }}
          >
            {italic ? <em style={{ fontStyle: 'italic' }}>{word}</em> : word}
          </span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}