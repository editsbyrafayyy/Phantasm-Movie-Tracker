'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  icon?: ReactNode;
  align?: 'left' | 'right';
}

/**
 * Styled single-select (listbox pattern). Keyboard: Enter/Space/ArrowUp/ArrowDown open,
 * arrows/Home/End move, Enter/Space choose, Escape/Tab close.
 */
export default function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  icon,
  align = 'left',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const selectedIndex = options.findIndex(o => o.value === value);
  const selectedOption = options[selectedIndex] ?? options[0];

  function open(index = selectedIndex >= 0 ? selectedIndex : 0) {
    setActiveIndex(index);
    setIsOpen(true);
  }
  function close(refocus = false) {
    setIsOpen(false);
    if (refocus) triggerRef.current?.focus();
  }
  function choose(index: number) {
    const opt = options[index];
    if (opt) onChange(opt.value);
    close(true);
  }

  // Close when clicking outside.
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  // Keep the active option in view.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        open();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => (i + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => (i - 1 + options.length) % options.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case 'Tab':
        close();
        break;
    }
  };

  return (
    <div className="custom-select-container" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`custom-select-trigger${isOpen ? ' active' : ''}`}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined}
        aria-label={ariaLabel}
      >
        {icon && <span className="custom-select-icon-wrap" aria-hidden="true">{icon}</span>}
        <span className="custom-select-label">{selectedOption?.label ?? ''}</span>
        <ChevronDown size={16} className={`custom-select-chevron${isOpen ? ' open' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={listId}
          className={`custom-select-dropdown align-${align}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${baseId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                className={`custom-select-option${isSelected ? ' selected' : ''}${idx === activeIndex ? ' focused' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => choose(idx)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
