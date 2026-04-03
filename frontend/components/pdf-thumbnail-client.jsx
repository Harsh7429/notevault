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

export default function PdfThumbnailClient({ fileUrl, alt, className = "", fallbackLabel = "PDF preview" }) {
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(280);

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

  if (!ready) {
    return <PreviewFallback label={fallbackLabel} className={className} />;
  }

  return (
    <div className={`h-full w-full overflow-hidden bg-[#f6f1e8] ${className}`} aria-label={alt}>
      <Document
        file={fileUrl}
        loading={<PreviewFallback label={fallbackLabel} className="h-full w-full" />}
        error={<PreviewFallback label={fallbackLabel} className="h-full w-full" />}
        options={{ cMapUrl: "cmaps/", standardFontDataUrl: "standard_fonts/" }}
      >
        <Page pageNumber={1} width={width} renderTextLayer={false} renderAnnotationLayer={false} className="mx-auto" />
      </Document>
    </div>
  );
}
