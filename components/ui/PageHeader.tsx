import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Main title, rendered in Bebas Neue caps. */
  title:     string;
  /** Optional separate word rendered in Playfair italic after the title. */
  accent?:   string;
  /** Small uppercase label above the title. */
  eyebrow?:  ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned controls (buttons, counts). */
  actions?:  ReactNode;
  /** 'page' for top-level routes, 'section' for headings inside a page. */
  as?:       'page' | 'section';
  className?: string;
}

/** The single heading treatment used across every page. */
export default function PageHeader({ title, accent, eyebrow, subtitle, actions, as = 'page', className }: PageHeaderProps) {
  const Heading = as === 'page' ? 'h1' : 'h2';
  return (
    <header className={`page-header page-header-${as}${className ? ` ${className}` : ''}`}>
      <div className="page-header-text">
        {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
        <Heading className="page-header-title">
          {title}
          {accent && <> <em className="page-header-accent">{accent}</em></>}
        </Heading>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
