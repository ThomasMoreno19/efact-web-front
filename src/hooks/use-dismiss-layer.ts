import { useEffect, useRef, type RefObject } from "react";

export function useDismissLayer<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onDismiss: () => void,
  enabled = true,
) {
  const callbackRef = useRef(onDismiss);

  useEffect(() => {
    callbackRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) callbackRef.current();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") callbackRef.current();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, ref]);
}
