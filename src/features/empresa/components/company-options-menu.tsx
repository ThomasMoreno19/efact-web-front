"use client";

import type { Empresa } from "@/features/empresa/types/empresa";
import { useDismissLayer } from "@/hooks/use-dismiss-layer";
import { useRef, useState } from "react";

interface CompanyOptionsMenuProps {
  empresa: Empresa;
  onDelete: () => void;
  onEdit: () => void;
}

export function CompanyOptionsMenu({
  empresa,
  onDelete,
  onEdit,
}: CompanyOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissLayer(menuRef, () => setIsOpen(false), isOpen);

  return (
    <div ref={menuRef} className="absolute right-3 top-3 z-20">
      <button
        type="button"
        aria-label={`Opciones de ${empresa.nombre}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-10 items-center justify-center rounded-button border border-border bg-surface text-foreground transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-5"
        >
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-12 w-44 rounded-card border border-border bg-surface p-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            className="w-full rounded-button px-3 py-2 text-left text-sm transition hover:bg-surface-raised"
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="w-full rounded-button px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
}
