'use client';

import Modal from '@/components/ui/Modal';

interface Shortcut {
  keys: string[];
  description: string;
  membersOnly?: boolean;
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Search films and pages' },
  { keys: ['R'],         description: 'Film roulette' },
  { keys: ['G', 'H'],    description: 'Go to Home' },
  { keys: ['G', 'V'],    description: 'Go to Vault' },
  { keys: ['G', 'S'],    description: 'Go to Profile & stats', membersOnly: true },
  { keys: ['N'],         description: 'Log a film', membersOnly: true },
  { keys: ['?'],         description: 'Show this list' },
  { keys: ['Esc'],       description: 'Close dialog' },
];

export default function KeyboardShortcutsModal({ onClose, signedIn }: { onClose: () => void; signedIn: boolean }) {
  const visible = SHORTCUTS.filter(s => signedIn || !s.membersOnly);
  return (
    <Modal onClose={onClose} title="Keyboard shortcuts" size="sm">
      <dl className="shortcuts-list">
        {visible.map(sc => (
          <div key={sc.description} className="shortcuts-row">
            <dt className="shortcuts-desc">{sc.description}</dt>
            <dd className="shortcuts-keys">
              {sc.keys.map(k => <kbd key={k} className="palette-kbd">{k}</kbd>)}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
