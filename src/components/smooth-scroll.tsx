"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

declare global {
  interface Window {
    /** the page's smooth scroller, for code that scrolls the page itself (the rail's glide) */
    __lenis?: Lenis;
  }
}

/** Smooth mouse-wheel scrolling for the whole site (Lenis). It eases the native scroll, so
 * everything that reads the scroll position (section index, parallax, lazy stages) keeps
 * working. Touch keeps its own native feel. Inside a dialog the wheel scrolls the dialog, and
 * while one is open the smoothing steps aside. */
export function SmoothScroll() {
  useEffect(() => {
    const dialog = '[role="dialog"], [data-slot="dialog-content"]';
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.09,
      anchors: true,
      allowNestedScroll: true,
      // wheel inside a dialog scrolls the dialog natively
      prevent: (node) => node instanceof Element && !!node.closest(dialog),
    });
    window.__lenis = lenis;
    // while a dialog is open the page is left alone (dialogs render into a portal on <body>)
    const sync = () => (document.querySelector(dialog) ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true });
    return () => {
      mo.disconnect();
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
  return null;
}
