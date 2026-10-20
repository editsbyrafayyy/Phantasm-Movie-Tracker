'use client';

import type { ReactNode } from 'react';
import OmdbSearchInput from '@/components/forms/OmdbSearchInput';
import ScoreField      from '@/components/ScoreField';
import RecommendPills  from '@/components/RecommendPills';
import BonusToggle     from '@/components/BonusToggle';
import { SUBGENRES, SECONDARY_TAGS, SCORE_FIELDS } from '@/lib/config';
import type { MovieFormData, OmdbSearchHit } from '@/lib/types';

export type RatingForm = MovieFormData & { notes: string };
export type RatingErrors = Partial<Record<keyof RatingForm, string>>;

export const NOTES_MAX = 500;

/** Title + subgenre are the only required fields (matches the API contract). */
export function validateRatingForm(form: RatingForm): RatingErrors {
  const errors: RatingErrors = {};
  if (!form.title.trim()) errors.title = 'Enter a title';
  if (!form.subgenre)     errors.subgenre = 'Pick a subgenre';
  return errors;
}

interface RatingFormFieldsProps {
  form:          RatingForm;
  errors:        RatingErrors;
  disabled:      boolean;
  onField:       <K extends keyof RatingForm>(key: K, value: RatingForm[K]) => void;
  onTitleChange: (title: string) => void;
  onOmdbSelect:  (hit: OmdbSearchHit) => void;
  onClearMatch:  () => void;
  /** Rendered under the title field (e.g. duplicate warning). */
  titleExtra?:    ReactNode;
  /** Rendered under the subgenre select (e.g. your average). */
  subgenreExtra?: ReactNode;
}

/** The shared field set for the add + edit rating forms. */
export default function RatingFormFields({
  form, errors, disabled, onField, onTitleChange, onOmdbSelect, onClearMatch, titleExtra, subgenreExtra,
}: RatingFormFieldsProps) {
  return (
    <>
      <div className="form-section">
        <label className="form-label" htmlFor="title">Title <span className="form-required">required</span></label>
        <OmdbSearchInput
          id="title"
          value={form.title}
          onTitleChange={onTitleChange}
          onSelect={onOmdbSelect}
          disabled={disabled}
          invalid={!!errors.title}
          describedBy={errors.title ? 'title-error' : undefined}
        />
        {errors.title && <p id="title-error" className="field-error">{errors.title}</p>}
        {form.omdbId && (
          <p className="field-hint field-hint-ok">
            Matched — poster and details will be filled in.{' '}
            <button type="button" className="link-btn" onClick={onClearMatch} disabled={disabled}>
              Clear match
            </button>
          </p>
        )}
        {titleExtra}
      </div>

      <div className="form-grid-2">
        <div className="form-section">
          <label className="form-label" htmlFor="subgenre">Subgenre <span className="form-required">required</span></label>
          <select
            id="subgenre"
            className="field-input field-select"
            value={form.subgenre}
            onChange={e => onField('subgenre', e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.subgenre || undefined}
            aria-describedby={errors.subgenre ? 'subgenre-error' : undefined}
          >
            <option value="">Select…</option>
            {SUBGENRES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.subgenre && <p id="subgenre-error" className="field-error">{errors.subgenre}</p>}
          {subgenreExtra}
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="secondary-tag">Secondary tag</label>
          <select
            id="secondary-tag"
            className="field-input field-select"
            value={form.secondaryTag}
            onChange={e => onField('secondaryTag', e.target.value)}
            disabled={disabled}
          >
            <option value="">None</option>
            {SECONDARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="form-section">
        <p className="form-label" id="recommend-label">Verdict</p>
        <RecommendPills
          value={form.recommend}
          onChange={v => onField('recommend', v)}
          disabled={disabled}
          labelledBy="recommend-label"
        />
      </div>

      <fieldset className="form-section form-fieldset">
        <legend className="form-label">Scores</legend>
        <div className="score-grid">
          {SCORE_FIELDS.map(f => (
            <ScoreField
              key={f.key}
              id={`score-${f.key}`}
              label={f.label}
              max={f.max}
              value={form[f.key]}
              onChange={v => onField(f.key, v)}
              disabled={disabled}
            />
          ))}
        </div>
        <BonusToggle
          value={form.bonus}
          onChange={v => onField('bonus', v)}
          disabled={disabled}
        />
      </fieldset>

      <div className="form-section">
        <label className="form-label" htmlFor="notes">Notes</label>
        <div className="notes-wrap">
          <textarea
            id="notes"
            className="field-input notes-textarea"
            value={form.notes}
            onChange={e => onField('notes', e.target.value.slice(0, NOTES_MAX))}
            placeholder="What stood out, a quote, anything…"
            rows={3}
            disabled={disabled}
            maxLength={NOTES_MAX}
          />
          <span className="notes-char-count" aria-hidden="true">{form.notes.length}/{NOTES_MAX}</span>
        </div>
      </div>
    </>
  );
}

interface FormSubmitBarProps {
  total:    number;
  loading:  boolean;
  label:    string;
  /** Optional extra control rendered above the bar (e.g. restore previous). */
  children?: ReactNode;
}

/** Sticky footer: running total + primary action, always in reach on phones. */
export function FormSubmitBar({ total, loading, label, children }: FormSubmitBarProps) {
  const hasScore = total > 0;
  return (
    <div className="form-submit-bar">
      {children}
      <div className="form-submit-row">
        <div className="form-total" aria-live="polite">
          <span className="form-total-label">Total</span>
          <span className={`form-total-value${hasScore ? ' is-set' : ''}`}>
            {hasScore ? total : '—'}
            <span className="form-total-denom">/10</span>
          </span>
        </div>
        <button type="submit" className="btn-primary form-submit-btn" disabled={loading}>
          {loading ? 'Saving…' : label}
        </button>
      </div>
    </div>
  );
}
