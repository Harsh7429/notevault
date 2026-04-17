import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

const PDF_OPTIONS = {
  cMapUrl: "https://unpkg.com/pdfjs-dist@4.8.69/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/",
};

export function SecurePdfViewer({ fileUrl, onDocumentLoadSuccess, numPages }) {
  const containerRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [inputError, setInputError] = useState(false);

  const measureWidth = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.offsetWidth;
    if (w > 0) setPageWidth(w);
  }, []);

  useEffect(() => {
    measureWidth();
    const ro = new ResizeObserver(() => measureWidth());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureWidth]);

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const safeNumPages = numPages || 0;
  const progress = safeNumPages ? Math.round((currentPage / safeNumPages) * 100) : 0;

  function goTo(page) {
    const clamped = Math.max(1, Math.min(safeNumPages, page));
    setCurrentPage(clamped);
  }

  function goToPrev() { if (currentPage > 1) goTo(currentPage - 1); }
  function goToNext() { if (currentPage < safeNumPages) goTo(currentPage + 1); }

  function handleInputChange(e) {
    setInputValue(e.target.value);
    setInputError(false);
  }

  function commitJump() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= safeNumPages) {
      goTo(parsed);
    } else {
      setInputError(true);
      setTimeout(() => {
        setInputError(false);
        setInputValue(String(currentPage));
      }, 800);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") { e.target.blur(); commitJump(); }
    if (!/[0-9]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter"].includes(e.key)) {
      e.preventDefault();
    }
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl"
      style={{
        background: "#0d1117",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(217,183,115,0.14)",
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(217,183,115,0.07) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(217,183,115,0.12)",
        }}
        className="px-4 py-3 sm:px-6 sm:py-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-xl p-2"
              style={{ background: "rgba(217,183,115,0.1)", border: "1px solid rgba(217,183,115,0.2)" }}
            >
              <BookOpen className="size-4" style={{ color: "#d9b773" }} />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold" style={{ color: "#f0e6cc" }}>NoteVault Reader</div>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#6b7280" }}>Protected session</div>
            </div>
            <div className="sm:hidden text-sm font-semibold" style={{ color: "#f0e6cc" }}>Reader</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage <= 1}
              className="flex items-center justify-center rounded-full p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={commitJump}
                disabled={!safeNumPages}
                aria-label="Go to page"
                style={{
                  background: inputError ? "rgba(239,68,68,0.12)" : "rgba(217,183,115,0.08)",
                  border: inputError ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(217,183,115,0.2)",
                  color: inputError ? "#f87171" : "#f0e6cc",
                  fontSize: "16px",
                }}
                className="w-14 rounded-lg py-1.5 text-center font-semibold outline-none transition-all disabled:opacity-40"
              />
              <span className="text-sm" style={{ color: "#4b5563" }}>/</span>
              <span className="min-w-[2ch] text-sm font-medium" style={{ color: "#9ca3af" }}>
                {safeNumPages || "—"}
              </span>
            </div>

            <button
              type="button"
              onClick={goToNext}
              disabled={!safeNumPages || currentPage >= safeNumPages}
              className="flex items-center justify-center rounded-full p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {safeNumPages > 0 && (
          <div className="mt-3 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)", height: "3px" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #b8973a, #d9b773, #f0d898)" }}
            />
          </div>
        )}
      </div>

      {/* PDF canvas — ref measures true pixel width, so Page never overflows */}
      <div
        ref={containerRef}
        className="select-none p-3 sm:p-6"
        style={{ background: "#0d1117" }}
      >
        {pageWidth !== null && (
          <Document
            file={fileUrl}
            options={PDF_OPTIONS}
            loading={
              <div className="flex flex-col items-center gap-4 py-20">
                <div
                  className="h-10 w-10 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "#d9b773", animation: "spin 0.8s linear infinite" }}
                />
                <p className="text-sm" style={{ color: "#6b7280" }}>Loading document…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            }
            error={
              <div className="py-16 text-center">
                <p className="text-sm" style={{ color: "#f87171" }}>
                  Unable to render this PDF. Please refresh and try again.
                </p>
              </div>
            }
            onLoadSuccess={(payload) => {
              onDocumentLoadSuccess(payload);
              setCurrentPage(1);
              setInputValue("1");
            }}
            onLoadError={(err) => console.error("[Viewer]", err?.message || err)}
          >
            <div
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,183,115,0.1)",
              }}
            >
              <Page
                key={`page_${currentPage}`}
                pageNumber={currentPage}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={pageWidth}
              />
            </div>
          </Document>
        )}
      </div>

      {safeNumPages > 1 && (
        <div
          style={{ borderTop: "1px solid rgba(217,183,115,0.1)", background: "rgba(217,183,115,0.03)" }}
          className="flex items-center justify-between px-4 py-3 sm:px-6"
        >
          <button
            type="button"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
            style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
          >
            ← Prev
          </button>
          <span className="text-xs" style={{ color: "#4b5563" }}>
            {currentPage} / {safeNumPages}
          </span>
          <button
            type="button"
            onClick={goToNext}
            disabled={currentPage >= safeNumPages}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
            style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
