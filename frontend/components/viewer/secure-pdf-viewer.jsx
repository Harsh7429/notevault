import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function WatermarkLayer({ email }) {
  const [timestamp, setTimestamp] = useState(new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimestamp(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const stamps = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);
  const label = `${email} | ${timestamp.toLocaleString()}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid grid-cols-2 gap-10 overflow-hidden p-8 opacity-20 sm:grid-cols-3">
      {stamps.map((stamp) => (
        <div
          key={stamp}
          className="flex items-center justify-center text-center text-xs font-semibold uppercase tracking-[0.22em] text-white sm:text-sm"
          style={{ transform: "rotate(-24deg)" }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export function SecurePdfViewer({ fileUrl, email, onDocumentLoadSuccess, numPages }) {
  const [pageWidth, setPageWidth] = useState(900);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    function updateWidth() {
      const viewportWidth = window.innerWidth;
      if (viewportWidth < 640) {
        setPageWidth(Math.max(280, viewportWidth - 72));
      } else if (viewportWidth < 1024) {
        setPageWidth(Math.min(760, viewportWidth - 120));
      } else {
        setPageWidth(900);
      }
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const safeNumPages = numPages || 0;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-glass">
      <WatermarkLayer email={email} />
      <div className="relative z-10 border-b border-white/10 bg-slate-950/90 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="font-medium text-white">Protected viewer session</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Streaming inside NoteVault</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
              Page {safeNumPages ? currentPage : 0} / {safeNumPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.min(safeNumPages, current + 1))}
              disabled={!safeNumPages || currentPage >= safeNumPages}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-h-[80vh] overflow-auto select-none p-4 sm:p-6">
        <Document
          file={fileUrl}
          loading={<div className="p-10 text-center text-slate-300">Loading secure document...</div>}
          error={<div className="p-10 text-center text-rose-300">Unable to render this PDF right now.</div>}
          onLoadSuccess={(payload) => {
            onDocumentLoadSuccess(payload);
            setCurrentPage(1);
          }}
          options={{ cMapUrl: "cmaps/", standardFontDataUrl: "standard_fonts/" }}
        >
          {Array.from(new Array(safeNumPages || 0), (_, index) => (
            <div
              key={`page_${index + 1}`}
              className={`mb-6 overflow-hidden rounded-2xl border ${currentPage === index + 1 ? "border-[#d9cba9] bg-white/10" : "border-white/10 bg-white/5"}`}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={pageWidth}
                className="mx-auto"
                onRenderSuccess={() => {
                  if (index + 1 === currentPage) {
                    return;
                  }
                }}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
