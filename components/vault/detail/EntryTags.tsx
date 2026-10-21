'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface EntryTagsProps {
  entryId:     string;
  initialTags: string[];
  editable:    boolean;
  onError:     (message: string) => void;
}

const MAX_TAGS = 10;

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/[^\w\s-]/g, '').trim().toLowerCase();
}

/** Personal tag chips. Owners edit inline; saves are serialized (latest wins). */
export default function EntryTags({ entryId, initialTags, editable, onError }: EntryTagsProps) {
  const [tags, setTags]       = useState<string[]>(initialTags);
  const [input, setInput]     = useState('');
  const [saving, setSaving]   = useState(false);
  const savedRef  = useRef<string[]>(initialTags);   // last state confirmed by the server
  const ctrlRef   = useRef<AbortController | null>(null);
  const seqRef    = useRef(0);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function persist(next: string[]) {
    ctrlRef.current?.abort();               // a newer edit supersedes any in-flight save
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const seq = ++seqRef.current;
    setSaving(true);
    try {
      const res = await fetch(`/api/movies/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_tags: next }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Tag save failed (${res.status})`);
      if (seq === seqRef.current) savedRef.current = next;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (seq === seqRef.current) {
        setTags(savedRef.current);          // roll back to what the server has
        onError('Could not save tags. Try again.');
      }
    } finally {
      if (seq === seqRef.current) setSaving(false);
    }
  }

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    setInput('');
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    const next = [...tags, tag];
    setTags(next);
    void persist(next);
  }

  function removeTag(tag: string) {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    void persist(next);
  }

  if (!editable && tags.length === 0) return null;

  return (
    <div className="custom-tags-panel">
      <div className="custom-tags-header">
        <span className="custom-tags-label" id={`tags-${entryId}`}>Your tags</span>
        {saving && <span className="custom-tags-saving" role="status">Saving…</span>}
      </div>
      <ul className="custom-tags-chips" aria-labelledby={`tags-${entryId}`}>
        {tags.map(tag => (
          <li key={tag} className="custom-tag-chip">
            {tag}
            {editable && (
              <button
                type="button"
                className="custom-tag-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
        {editable && tags.length < MAX_TAGS && (
          <li className="custom-tag-input-item">
            <input
              className="custom-tag-input"
              type="text"
              placeholder="Add tag"
              aria-label="Add a tag"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(input);
                } else if (e.key === 'Backspace' && !input && tags.length > 0) {
                  removeTag(tags[tags.length - 1]);
                }
              }}
              onBlur={() => { if (input.trim()) addTag(input); }}
              maxLength={24}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
