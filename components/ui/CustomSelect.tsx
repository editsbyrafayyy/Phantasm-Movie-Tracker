'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  icon?: React.ReactNode;
  align?: 'left' | 'right';
}

export default function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  icon,
  align = 'left',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync focused index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(o => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, value, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
        }
        setIsOpen(false);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="custom-select-container" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`custom-select-trigger${isOpen ? ' active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        {icon && <span className="custom-select-icon-wrap">{icon}</span>}
        <span className="custom-select-label">{selectedOption?.label ?? ''}</span>
        <ChevronDown size={14} className={`custom-select-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul className={`custom-select-dropdown align-${align}`} role="listbox">
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isFocused = idx === focusedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-select-option${isSelected ? ' selected' : ''}${isFocused ? ' focused' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
