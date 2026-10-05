'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LabReport } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface LabReportGalleryProps {
  reports: LabReport[];
  // Alt text / viewer caption prefix, e.g. the product name.
  label: string;
}

// Thumbnails of lab report images; clicking one opens it full size in an
// overlay (Escape, the close button or a click on the backdrop closes it).
export default function LabReportGallery({ reports, label }: LabReportGalleryProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<LabReport | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const caption = (report: LabReport) =>
    [
      report.batchNumber && `${t('labReports.batch')} ${report.batchNumber}`,
      report.testDate && `${t('labReports.tested')} ${report.testDate}`,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => setOpen(report)}
            className="group text-left rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-blue-500 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="aspect-[3/4] bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.image}
                alt={`${label} — ${caption(report) || t('labReports.productSection')}`}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
            {caption(report) && (
              <p className="px-3 py-2 text-xs text-gray-600 border-t border-gray-100">
                {caption(report)}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Portalled to <body> so it covers the sticky site header too. */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${label} — ${caption(open)}`}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4"
            onClick={() => setOpen(null)}
          >
            <div className="flex w-full max-w-4xl items-center justify-between gap-4 pb-3 text-sm text-white">
              <span className="truncate">
                {label}
                {caption(open) && ` — ${caption(open)}`}
              </span>
              <span className="flex shrink-0 items-center gap-4">
                <a
                  href={open.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('labReports.openFull')}
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="rounded border border-white/40 px-3 py-1 hover:bg-white/10"
                >
                  {t('labReports.close')}
                </button>
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.image}
              alt={`${label} — ${caption(open)}`}
              className="max-h-[85vh] max-w-full rounded bg-white object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
