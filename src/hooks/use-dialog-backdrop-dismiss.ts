import { useEffect, useRef } from 'react';
import type { MouseEventHandler, PointerEventHandler } from 'react';

export function useDialogBackdropDismiss(onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);
  const pointerStartedOnBackdropRef = useRef(false);
  const pointerEndedOnBackdropRef = useRef(false);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const onPointerDown: PointerEventHandler<HTMLDialogElement> = (event) => {
    pointerStartedOnBackdropRef.current =
      event.isPrimary && event.button === 0 && event.target === event.currentTarget;
    pointerEndedOnBackdropRef.current = false;
  };

  const onPointerUp: PointerEventHandler<HTMLDialogElement> = (event) => {
    pointerEndedOnBackdropRef.current =
      event.isPrimary && event.target === event.currentTarget;
  };

  const onPointerCancel: PointerEventHandler<HTMLDialogElement> = () => {
    pointerStartedOnBackdropRef.current = false;
    pointerEndedOnBackdropRef.current = false;
  };

  const onClick: MouseEventHandler<HTMLDialogElement> = (event) => {
    const shouldDismiss =
      event.detail > 0 &&
      pointerStartedOnBackdropRef.current &&
      pointerEndedOnBackdropRef.current;
    pointerStartedOnBackdropRef.current = false;
    pointerEndedOnBackdropRef.current = false;
    if (shouldDismiss) onDismissRef.current();
  };

  return { onPointerDown, onPointerUp, onPointerCancel, onClick };
}
