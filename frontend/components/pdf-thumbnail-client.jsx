import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

function PreviewFallback({ label = "PDF preview", className = "" }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#efe0be] via-[#f8f3ea] to-[#dce6d4] text-xs font-semibold uppercase tracking-[0.22em] text-[#171511] ${className}`}>
      {label}
    </div>
  );
}

// PDF options that suppress the browser's native password dialog entirely.
// onPassword is called by pdfjs when it encounters a password-protected file.
// We intentionally do NOT call updatePassword — this makes pdfjs treat the
// file as unrenderable and trigger the `error` prop, showing our fallback
// instead of the browser's native "Enter password to open this PDF" popup.
const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export default function PdfThumbnailClient({ fileUrl, alt, className = "", fallbackLabel = "PDF preview" }) {
  const [ready,        setReady]        = useState(false);
  const [width,        setWidth]        = useState(280);
  const [isProtected,  setIsProtected]  = useState(false);

  useEffect(() => {
    setReady(true);

    function updateWidth() {
      const viewportWidth = window.innerWidth;
      if (viewportWidth < 640) {
        setWidth(220);
      } else if (viewportWidth < 1024) {
        setWidth(260);
      } else {
        setWidth(280);
      }
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (!ready || isProtected) {
    return <PreviewFallback label={fallbackLabel} className={className} />;
  }

  return (
    <div className={`h-full w-full overflow-hidden bg-[#f6f1e8] ${className}`} aria-label={alt}>
      <Document
        file={fileUrl}
        options={PDF_OPTIONS}
        loading={<PreviewFallback label={fallbackLabel} className="h-full w-full" />}
        error={<PreviewFallback label={fallbackLabel} className="h-full w-full" />}
        // KEY FIX: intercept the password request and show fallback instead
        // of letting the browser pop up its native "Enter PDF password" dialog.
        onPassword={() => {
          setIsProtected(true); // switch to fallback silently
        }}
        onLoadError={() => {
          setIsProtected(true); // any load error → fallback, never crash
        }}
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="mx-auto"
        />
      </Document>
    </div>
  );
}
