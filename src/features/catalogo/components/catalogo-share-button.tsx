'use client';

import { Copy, Mail, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ShareOption = 'copy' | 'whatsapp' | 'instagram' | 'facebook' | 'x' | 'email' | 'more';

interface MenuPosition {
  left: number;
  top: number;
}

export function CatalogoShareButton({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function dismiss(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof KeyboardEvent) buttonRef.current?.focus();
      if (
        event instanceof PointerEvent &&
        (buttonRef.current?.contains(event.target as Node) ||
          menuRef.current?.contains(event.target as Node))
      ) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    function closeOnViewportChange() {
      setIsOpen(false);
    }
    window.addEventListener('scroll', closeOnViewportChange, true);
    window.addEventListener('resize', closeOnViewportChange);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
      window.removeEventListener('scroll', closeOnViewportChange, true);
      window.removeEventListener('resize', closeOnViewportChange);
    };
  }, [isOpen]);

  function toggleMenu() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const trigger = buttonRef.current;
    if (!trigger) return;
    setPortalTarget(trigger.closest('dialog') ?? document.body);
    const bounds = trigger.getBoundingClientRect();
    const menuHeight = Math.min(window.innerHeight * 0.7, 320);
    const top =
      bounds.bottom + menuHeight + 8 > window.innerHeight - 12
        ? Math.max(12, bounds.top - menuHeight - 8)
        : bounds.bottom + 8;
    const menuWidth = Math.min(224, window.innerWidth - 24);
    const left = Math.max(12, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 12));
    setMenuPosition({ left, top });
    setStatus(null);
    setIsOpen(true);
  }

  async function selectOption(option: ShareOption) {
    const absoluteUrl = new URL(href, window.location.origin).toString();
    const shareText = `${title}: ${absoluteUrl}`;

    if (option === 'copy' || option === 'instagram') {
      try {
        await navigator.clipboard.writeText(absoluteUrl);
        setStatus(
          option === 'instagram'
            ? 'Enlace copiado. Pegalo en una historia o chat de Instagram.'
            : 'Enlace copiado.',
        );
      } catch {
        setStatus('No se pudo copiar el enlace. Intentá nuevamente.');
      }
      return;
    }

    if (option === 'more') {
      if (navigator.share) {
        try {
          await navigator.share({ title, text: title, url: absoluteUrl });
          setIsOpen(false);
        } catch (cause) {
          if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
            setStatus('No se pudo abrir el menú para compartir.');
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(absoluteUrl);
          setStatus('Enlace copiado para compartir desde otra aplicación.');
        } catch {
          setStatus('No se pudo copiar el enlace. Intentá nuevamente.');
        }
      }
      return;
    }

    const encodedUrl = encodeURIComponent(absoluteUrl);
    const encodedText = encodeURIComponent(title);
    const destinations: Record<Exclude<ShareOption, 'copy' | 'instagram' | 'more'>, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      email: `mailto:?subject=${encodedText}&body=${encodeURIComponent(shareText)}`,
    };
    const destination = destinations[option];
    if (option === 'email') window.location.href = destination;
    else window.open(destination, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }

  const dialog = isOpen && portalTarget && menuPosition
    ? createPortal(
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label={`Compartir ${title}`}
          style={{ left: menuPosition.left, top: menuPosition.top }}
          className="fixed z-[100] max-h-[min(70vh,20rem)] w-[min(14rem,calc(100vw-1.5rem))] overflow-y-auto rounded-input border border-border bg-surface p-2 text-left shadow-2xl"
        >
          <ShareMenuItem icon={Copy} label="Copiar enlace" onClick={() => void selectOption('copy')} />
          <ShareMenuItem icon={MessageCircle} label="WhatsApp" onClick={() => void selectOption('whatsapp')} />
          <ShareMenuItem label="Instagram" onClick={() => void selectOption('instagram')} />
          <ShareMenuItem label="Facebook" onClick={() => void selectOption('facebook')} />
          <ShareMenuItem label="X" onClick={() => void selectOption('x')} />
          <ShareMenuItem icon={Mail} label="Correo electrónico" onClick={() => void selectOption('email')} />
          <ShareMenuItem icon={MoreHorizontal} label="Más aplicaciones" onClick={() => void selectOption('more')} />
          {status ? (
            <p role="status" className="px-3 py-2 text-xs leading-5 text-muted">
              {status}
            </p>
          ) : null}
        </div>,
        portalTarget,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Compartir ${title}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title="Compartir"
        onClick={toggleMenu}
        className="flex size-9 shrink-0 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Share2 aria-hidden="true" className="size-4" />
      </button>
      {dialog}
    </>
  );
}

function ShareMenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex min-h-10 w-full items-center gap-3 rounded-button px-3 py-2 text-left text-sm transition hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-2 focus-visible:outline-brand"
    >
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" /> : null}
      <span>{label}</span>
    </button>
  );
}
