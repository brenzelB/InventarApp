"use client";

import { useState } from "react";

interface QRCodeViewProps {
  /** Bereits vorhandener SVG-String aus der DB (optional) */
  svgString?: string | null;
  /** Artikel-ID – wird für die API-Route /api/articles/qr/[id] genutzt */
  articleId?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function QRCodeView({ svgString, articleId, name, size = "md" }: QRCodeViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-32 h-32",
  };

  // Bevorzuge svgDataUrl wenn vorhanden, sonst API Route
  const svgDataUrl = svgString
    ? `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`
    : null;
  const apiUrl = articleId ? `/api/articles/qr/${articleId}` : null;
  const imgSrc = svgDataUrl ?? apiUrl;

  // Kein QR möglich (weder SVG noch ID)
  if (!imgSrc) {
    return (
      <div
        className={`${sizes[size]} flex items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700`}
        title="Kein QR-Code verfügbar"
      >
        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75V13.5zM13.5 19.5h.75v.75h-.75V19.5zM19.5 13.5h.75v.75h-.75V13.5zM19.5 19.5h.75v.75h-.75V19.5zM16.5 16.5h.75v.75h-.75V16.5z" />
        </svg>
      </div>
    );
  }

  // Fehler-Zustand (img konnte nicht laden)
  if (imgError) {
    return (
      <div
        className={`${sizes[size]} flex items-center justify-center rounded border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600`}
        title="QR konnte nicht geladen werden"
      >
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail in der Tabelle */}
      <div
        className={`${sizes[size]} cursor-zoom-in hover:opacity-80 hover:scale-110 transition-all duration-150 rounded-md border border-slate-200 dark:border-slate-600 bg-white p-0.5 shadow-sm`}
        onClick={() => setIsOpen(true)}
        title={`QR-Code für ${name} – vergrößern`}
      >
        <img
          src={imgSrc}
          alt={`QR Code für ${name}`}
          className="w-full h-full rounded object-contain"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Zoom-Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full"
            style={{ animation: "qrZoomIn 0.15s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate pr-4">
                {name}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR groß */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex justify-center">
              <img src={imgSrc} alt="QR Code" className="w-64 h-64 object-contain" />
            </div>

            <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
              Scan mit Smartphone öffnet die Artikel-Detailseite
            </p>

            {/* Aktionen */}
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={imgSrc}
                download={`QR_${name.replace(/\s+/g, "_")}.svg`}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                SVG herunterladen
              </a>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Drucken
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes qrZoomIn {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
