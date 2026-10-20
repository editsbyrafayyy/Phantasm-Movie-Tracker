'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

type Format = 'csv' | 'json';

export default function ExportButton() {
  const [downloading, setDownloading] = useState<Format | null>(null);

  function handleExport(format: Format) {
    setDownloading(format);
    const link = document.createElement('a');
    link.href = `/api/export?format=${format}`;
    link.download = `vault-export.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 1500);
  }

  return (
    <section className="settings-block" aria-labelledby="export-heading">
      <h3 id="export-heading" className="settings-title">Export your data</h3>
      <p className="settings-desc">
        Download every logged film with its ratings, scores and notes.
      </p>
      <div className="settings-actions">
        {(['csv', 'json'] as const).map(format => (
          <button
            key={format}
            type="button"
            onClick={() => handleExport(format)}
            disabled={downloading !== null}
            className="btn-secondary"
          >
            <Download size={16} aria-hidden="true" />
            {downloading === format ? 'Preparing…' : format.toUpperCase()}
          </button>
        ))}
      </div>
    </section>
  );
}
