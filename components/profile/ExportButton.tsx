'use client';

import { useState } from 'react';
import { Download, FileText, FileCode } from 'lucide-react';

export default function ExportButton() {
  const [downloading, setDownloading] = useState<'csv' | 'json' | null>(null);

  function handleExport(format: 'csv' | 'json') {
    setDownloading(format);
    const link = document.createElement('a');
    link.href = `/api/export?format=${format}`;
    link.download = `vault-export.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  }

  return (
    <div className="export-container">
      <div className="export-header">
        <h3 className="export-title">Export Vault Data</h3>
        <p className="export-subtitle">
          Download a complete archive of your logged films, ratings, scores, and personal notes.
        </p>
      </div>

      <div className="export-actions">
        <button
          onClick={() => handleExport('csv')}
          disabled={downloading !== null}
          className="btn-edit export-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <FileText size={15} style={{ color: 'var(--red)' }} />
          <span>{downloading === 'csv' ? 'Downloading CSV…' : 'Export as CSV'}</span>
          <Download size={14} style={{ opacity: 0.7 }} />
        </button>

        <button
          onClick={() => handleExport('json')}
          disabled={downloading !== null}
          className="btn-edit export-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <FileCode size={15} style={{ color: '#9b59f5' }} />
          <span>{downloading === 'json' ? 'Downloading JSON…' : 'Export as JSON'}</span>
          <Download size={14} style={{ opacity: 0.7 }} />
        </button>
      </div>
    </div>
  );
}
