'use client';
import Nav from './Nav';
import SmoothScroll from './SmoothScroll';
import Footer from './Footer';
import type { ReactNode } from 'react';

/**
 * Shared chrome for the non-home pages (About / Privacy / Terms / 404).
 */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main
        style={{
          background: 'var(--white)',
          color: 'var(--ink)',
          minHeight: 'calc(100vh - 4.5rem)',
          paddingTop: '4.5rem',
        }}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
