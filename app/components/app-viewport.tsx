'use client';

import {useEffect} from 'react';

// Safari resizes the visual viewport for the keyboard, not the layout viewport.
export default function AppViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const update = () => {
      // Preserve browser pinch zoom instead of resizing the app while zooming.
      if (Math.abs(viewport.scale - 1) > 0.01) return;
      root.style.setProperty('--app-height', `${viewport.height}px`);
      root.style.setProperty('--app-top', `${viewport.offsetTop}px`);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--app-height');
      root.style.removeProperty('--app-top');
    };
  }, []);
  return null;
}
