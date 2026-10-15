"use client";

import { useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2, UserRound } from "lucide-react";
import { useDismissLayer } from "@/hooks/use-dismiss-layer";
import type { UsuarioInterno } from "@/features/usuario/types/usuario-interno";

export function UsuarioInternoCard({
  usuario,
  onEdit,
  onDelete,
}: {
  usuario: UsuarioInterno;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissLayer(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  return (
    <li>
      <article className="relative flex min-h-40 flex-col items-center justify-center rounded-card border border-border bg-surface-raised p-5 pt-12 text-center">
        <div ref={menuRef} className="absolute right-3 top-3 z-20">
          <button
            type="button"
            aria-label={`Opciones del usuario interno ${usuario.id}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex size-10 items-center justify-center rounded-button border border-border bg-surface text-foreground transition hover:bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <MoreVertical aria-hidden="true" className="size-5" />
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-12 w-40 rounded-card border border-border bg-surface p-1 text-left"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-sm transition hover:bg-surface-raised"
              >
                <Pencil aria-hidden="true" className="size-4 shrink-0" />
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
              >
                <Trash2 aria-hidden="true" className="size-4 shrink-0" />
                Eliminar
              </button>
            </div>
          ) : null}
        </div>

        <UserRound
          aria-hidden="true"
          className="size-10 text-muted"
          strokeWidth={1.6}
        />
        <p className="mt-3 max-w-full break-all text-sm font-semibold">
          Usuario interno {usuario.id}
        </p>
      </article>
    </li>
  );
}
