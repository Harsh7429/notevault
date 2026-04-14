import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// Must be a plain string URL — Next.js cannot resolve import.meta.url for
// bare module specifiers inside dynamic components.
pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

const PDF_OPTIONS = {
  cMapUrl: "https://unpkg.com/pdfjs-dist@4.8.69/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/",
};

export function SecurePdfViewer({ fileUrl, onDocumentLoadSuccess, numPages }) {
  const [pageWidth, setPageWidth] = useState(900);
  const [currentPage, setCurrentPage] = useState(1);
  // Input state for the "go to page" field
  const [inputValue, setInputValue] = useState("1");
  const [inputError, setInputError] = useState(false);
  const viewerRef = useRef(null);

  // ── Responsive width ────────────────────────────────────────────────────
  useEffect(() => {
    function updateWidth() {
      const vw = window.innerWidth;
      if (vw < 640) setPageWidth(Math.max(280, vw - 48));
      else if (vw < 1024) setPageWidth(Math.min(760, vw - 120));
      else setPageWidth(900);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Keep input in sync when currentPage changes via prev/next buttons
  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const safeNumPages = numPages || 0;

  // Scroll to TOP of the viewer card only (not the whole page)
  function scrollToViewer() {
    if (viewerRef.current) {
      viewerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goToPrev() {
    setCurrentPage((p) => {
      const next = Math.max(1, p - 1);
      scrollToViewer();
      return next;
    });
  }

  function goToNext() {
    setCurrentPage((p) => {
      const next = Math.min(safeNumPages, p + 1);
      scrollToViewer();
      return next;
    });
  }

  // Handle the "go to page" input
  function handleInputChange(e) {
    setInputValue(e.target.value);
    setInputError(false);
  }

  function commitPageJump() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= safeNumPages) {
      setCurrentPage(parsed);
      setInputError(false);
      scrollToViewer();
    } else {
      setInputError(true);
      setInputValue(String(currentPage)); // reset to valid value
    }
  }

  function handleInputKeyDown(e) {
    if (e.key === "Enter") commitPageJump();
    // Prevent non-numeric keys (allow backspace, arrows, etc.)
    if (
      !/[0-9]/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key)
    ) {
      e.preventDefault();
    }
  }

  return (
    <div
      ref={viewerRef}
      className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80 sm:rounded-[2rem]"
    >
      {/* ── Header / page controls ─────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-slate-950/90 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Title */}
          <div className="inline-flex items-center gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="font-medium text-white">Protected viewer session</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Streaming inside NoteVault
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Prev button */}
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage <= 1}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Page jump input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={commitPageJump}
                disabled={!safeNumPages}
                className={[
                  "w-14 rounded-full border bg-white/5 px-2 py-1.5 text-center text-xs font-semibold text-white outline-none transition",
                  "focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40",
                  inputError
                    ? "border-rose-400/60 ring-1 ring-rose-400/40"
                    : "border-white/10",
                ].join(" ")}
                aria-label="Go to page"
              />
              <span className="text-xs text-slate-400">
                / {safeNumPages || 0}
              </span>
            </div>

            {/* Next button */}
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

      {/* ── PDF document ──────────────────────────────────────────────────── */}
      <div className="select-none p-3 sm:p-6">
        <Document
          file={fileUrl}
          options={PDF_OPTIONS}
          loading={
            <div className="p-10 text-center text-slate-300">
              Loading secure document...
            </div>
          }
          error={
            <div className="p-10 text-center text-rose-300">
              Unable to render this PDF right now. Please refresh the page and try again.
            </div>
          }
          onLoadSuccess={(payload) => {
            onDocumentLoadSuccess(payload);
            setCurrentPage(1);
            setInputValue("1");
          }}
          onLoadError={(err) => {
            console.error("[SecurePdfViewer] load error:", err?.message || err);
          }}
        >
          <div className="overflow-hidden rounded-xl border border-[#d9cba9] bg-white sm:rounded-2xl">
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

      {/* ── Bottom nav — visible on all screen sizes ──────────────────────── */}
      {safeNumPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {currentPage} of {safeNumPages}
          </span>
          <button
            type="button"
            onClick={goToNext}
            disabled={currentPage >= safeNumPages}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
