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
        setPageWidth(Math.max(280, viewportWidth - 48));
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

  function goToPrev() {
    setCurrentPage((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNext() {
    setCurrentPage((current) => Math.min(safeNumPages, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80 shadow-glass sm:rounded-[2rem]">
      <WatermarkLayer email={email} />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-slate-950/90 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="font-medium text-white">Protected viewer session</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Streaming inside NoteVault</div>
            </div>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage <= 1}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white sm:px-4 sm:py-2 sm:tracking-[0.22em]">
              {safeNumPages ? currentPage : 0} / {safeNumPages}
            </div>
            <button
              type="button"
              onClick={goToNext}
              disabled={!safeNumPages || currentPage >= safeNumPages}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF — only renders the current page, fixes the crash on large PDFs */}
      <div className="relative z-10 select-none p-3 sm:p-6">
        <Document
          file={fileUrl}
          loading={
            <div className="p-10 text-center text-slate-300">Loading secure document...</div>
          }
          error={
            <div className="p-10 text-center text-rose-300">Unable to render this PDF right now.</div>
          }
          onLoadSuccess={(payload) => {
            onDocumentLoadSuccess(payload);
            setCurrentPage(1);
          }}
          options={{ cMapUrl: "cmaps/", standardFontDataUrl: "standard_fonts/" }}
        >
          <div className="overflow-hidden rounded-xl border border-[#d9cba9] bg-white/10 sm:rounded-2xl">
            <Page
              key={`page_${currentPage}`}
              pageNumber={currentPage}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={pageWidth}
              className="mx-auto"
            />
          </div>
        </Document>
      </div>

      {/* Bottom navigation for easy thumb reach on mobile */}
      {safeNumPages > 1 && (
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-4 py-3 sm:hidden">
          <button
            type="button"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            {currentPage} of {safeNumPages}
          </span>
          <button
            type="button"
            onClick={goToNext}
            disabled={currentPage >= safeNumPages}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}