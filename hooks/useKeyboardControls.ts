"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TVControlsActions } from "@/lib/tvTypes";

interface UseKeyboardControlsOptions {
  actions: TVControlsActions;
  isPowered: boolean;
  enabled?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function useKeyboardControls({
  actions,
  isPowered,
  enabled = true,
}: UseKeyboardControlsOptions) {
  const actionsRef = useRef(actions);
  const isPoweredRef = useRef(isPowered);

  useEffect(() => {
    actionsRef.current = actions;
    isPoweredRef.current = isPowered;
  }, [actions, isPowered]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key;

      if (key === " ") {
        event.preventDefault();
        actionsRef.current.togglePower();
        return;
      }

      if (!isPoweredRef.current) return;

      switch (key) {
        case "ArrowUp":
          event.preventDefault();
          actionsRef.current.channelUp();
          break;
        case "ArrowDown":
          event.preventDefault();
          actionsRef.current.channelDown();
          break;
        case "ArrowLeft":
          event.preventDefault();
          actionsRef.current.volumeDown();
          break;
        case "ArrowRight":
          event.preventDefault();
          actionsRef.current.volumeUp();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
