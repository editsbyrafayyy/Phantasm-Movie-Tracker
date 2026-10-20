'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  onClose:    () => void;
  /** Visible heading. Omit only when the children render their own heading with `labelledBy`. */
  title?:     ReactNode;
  labelledBy?: string;
  size?:      'sm' | 'md' | 'lg';
  /** Extra class on the panel for component-specific layout. */
  className?: string;
  /** Hide the built-in close button (e.g. when the content provides its own). */
  hideClose?: boolean;
  children:   ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared accessible modal: portal, scrim, Escape to close, focus trap,
 * focus restore and body scroll lock. Renders as a bottom sheet on phones.
 * Mount it conditionally — it is always "open" while rendered.
 */
export default function Modal({ onClose, title, labelledBy, size = 'md', className, hideClose, children }: ModalProps) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId   = useId();

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(n => n.offsetParent !== null);
      if (nodes.length === 0) { e.preventDefault(); return; }
      const firstNode = nodes[0];
      const lastNode  = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) { e.preventDefault(); lastNode.focus(); }
      else if (!e.shiftKey && document.activeElement === lastNode) { e.preventDefault(); firstNode.focus(); }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-root">
      <div className="modal-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
        tabIndex={-1}
        className={`modal-panel modal-${size}${className ? ` ${className}` : ''}`}
      >
        {(title || !hideClose) && (
          <div className="modal-head">
            {title && <h2 id={titleId} className="modal-title">{title}</h2>}
            {!hideClose && (
              <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
