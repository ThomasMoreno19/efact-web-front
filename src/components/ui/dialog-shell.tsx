import type { ReactNode } from "react";

interface DialogShellProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function DialogShell({
  children,
  onClose,
  title,
}: DialogShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="my-auto w-full max-w-lg rounded-card border border-border bg-surface p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="dialog-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="size-5"
            >
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
