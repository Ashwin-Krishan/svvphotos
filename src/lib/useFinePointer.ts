"use client";

import { useEffect, useState } from "react";

/**
 * True only when cursor-driven effects actually make sense: the device
 * has a fine pointer (a real mouse, not touch), and the user hasn't asked
 * to reduce motion. Every cursor/parallax effect on the site gates on
 * this so it renders nothing (rather than something janky or pointless)
 * on phones/tablets and for people who opt out of animation.
 *
 * Starts false and only flips true after mount, so nothing cursor-based
 * is ever server-rendered or shown before we've confirmed the environment.
 */
export function useFinePointer(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const noReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: no-preference)"
    );

    const update = () => setEnabled(fine.matches && noReducedMotion.matches);
    update();

    fine.addEventListener("change", update);
    noReducedMotion.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      noReducedMotion.removeEventListener("change", update);
    };
  }, []);

  return enabled;
}
