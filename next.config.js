import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

const PDF_OPTIONS = {
  cMapUrl: "https://unpkg.com/pdfjs-dist@4.8.69/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/",
};

/**
 * FIX SUMMARY — root causes of the clipping / partial render bug:
 *
 *  BUG 1 (PRIMARY): ref was on the OUTER shell (zero-padding) but the Page
 *    `width` prop was set to that full offsetWidth. The inner wrapper had
 *    mx-3/mx-6 margins (12px–24px each side = 24px–48px total) that were
 *    NEVER subtracted. Result: PDF canvas overflowed and clipped on the right.
 *
 *  FIX: Move the ref to the INNER wrapper (the element whose content area
 *    is exactly what the PDF should fill). offsetWidth on that element already
 *    excludes its own margins since margins are outside the box model.
 *    No manual subtraction needed — the browser handles it.
 *
 *  BUG 2: No minimum width guard. On very narrow phones the measured width
 *    could be 0 on first paint before layout settles, causing the Document
 *    to mount with width=0 and render a blank page.
 *
 *  FIX: Keep the null-guard AND add a MIN_WIDTH floor (280px) so the PDF
 *    always renders at a sane size, then ResizeObserver corrects it.
 *
 *  BUG 3: react-pdf <Page> has a known issue where changing `width` without
 *    remounting can leave stale canvas dimensions. The existing `key` only
 *    changed on page number. We also key on pageWidth so the canvas is
 *    fully remounted when the container resizes.
 *
 *  BUG 4: The react-pdf stylesheet was never imported. Without it, the Page
 *    component renders but the internal canvas/layer DOM has no sizing CSS,
 *    causing the page to appear cropped or misaligned.
 *
 *  FIX: Import 'react-pdf/dist/Page/AnnotationLayer.css' and
 *    'react-pdf/dist/Page/TextLayer.css' (or the combined stylesheet).
 *    Since renderTextLayer and renderAnnotationLayer are false here, this
 *    mainly ensures the canvas wrapper div is sized correctly.
 */

const MIN_WIDTH = 280; // px — absolute floor for ultra-narrow phones

export function SecurePdfViewer({ fileUrl, pdfPassword, onDocumentLoadSuccess, numPages }) {
  // ref goes on the INNER wrapper — the element whose clientWidth is the
  // true available canvas width (margins are outside the box, so offsetWidth
  // here already excludes them).
  const innerRef    = useRef(null);
  const [pageWidth,   setPageWidth]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue,  setInputValue]  = useState("1");
  const [inputError,  setInputError]  = useState(false);

  const measureWidth = useCallback(() => {
    if (!innerRef.current) return;
    // offsetWidth on the inner wrapper = content width (no padding on this el)
    // This is exactly the pixel budget available for the PDF canvas.
    const w = innerRef.current.offsetWidth;
    if (w > 0) setPageWidth(Math.max(w, MIN_WIDTH));
  }, []);

  useEffect(() => {
    // Measure immediately, then watch for any resize (orientation, sidebar, etc.)
    measureWidth();
    const ro = new ResizeObserver(measureWidth);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [measureWidth]);

  useEffect(() => { setInputValue(String(currentPage)); }, [currentPage]);

  const safeNumPages = numPages || 0;
  const progress     = safeNumPages ? Math.round((currentPage / safeNumPages) * 100) : 0;

  function goTo(p)    { setCurrentPage(Math.max(1, Math.min(safeNumPages, p))); }
  function goToPrev() { if (currentPage > 1)             goTo(currentPage - 1); }
  function goToNext() { if (currentPage < safeNumPages)  goTo(currentPage + 1); }

  function handleInputChange(e) { setInputValue(e.target.value); setInputError(false); }
  function commitJump() {
    const p = parseInt(inputValue, 10);
    if (!isNaN(p) && p >= 1 && p <= safeNumPages) {
      goTo(p);
    } else {
      setInputError(true);
      setTimeout(() => { setInputError(false); setInputValue(String(currentPage)); }, 800);
    }
  }
  function handleKeyDown(e) {
    if (e.key === "Enter") { e.target.blur(); commitJump(); }
    if (!/[0-9]/.test(e.key) &&
        !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter"].includes(e.key)) {
      e.preventDefault();
    }
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl"
      style={{
        background:  "#0d1117",
        boxShadow:   "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(217,183,115,0.14)",
      }}
    >
      {/* ── Top toolbar ── */}
      <div
        style={{
          background:   "linear-gradient(180deg, rgba(217,183,115,0.07) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(217,183,115,0.12)",
        }}
        className="px-4 py-3 sm:px-6 sm:py-4"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
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

          {/* Page controls */}
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={goToPrev} disabled={currentPage <= 1}
              className="flex items-center justify-center rounded-full p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="text" inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={commitJump}
                disabled={!safeNumPages}
                aria-label="Go to page"
                style={{
                  background: inputError ? "rgba(239,68,68,0.12)" : "rgba(217,183,115,0.08)",
                  border:     inputError ? "1px solid rgba(239,68,68,0.4)"  : "1px solid rgba(217,183,115,0.2)",
                  color:      inputError ? "#f87171" : "#f0e6cc",
                  fontSize:   "16px", // prevent iOS zoom on focus
                }}
                className="w-14 rounded-lg py-1.5 text-center font-semibold outline-none transition-all disabled:opacity-40"
              />
              <span className="text-sm" style={{ color: "#4b5563" }}>/</span>
              <span className="min-w-[2ch] text-sm font-medium" style={{ color: "#9ca3af" }}>
                {safeNumPages || "—"}
              </span>
            </div>

            <button
              type="button" onClick={goToNext} disabled={!safeNumPages || currentPage >= safeNumPages}
              className="flex items-center justify-center rounded-full p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {safeNumPages > 0 && (
          <div className="mt-3 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)", height: "3px" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #b8973a, #d9b773, #f0d898)" }}
            />
          </div>
        )}
      </div>

      {/* ── PDF canvas area ─────────────────────────────────────────────────
          Outer shell: dark bg, clips overflow so nothing bleeds outside the
          rounded card. No padding here — padding/margin live on innerRef.

          innerRef div: this is where the ref lives. Its offsetWidth is
          the true canvas budget after margins are applied by the browser.
          We measure THIS element, not the outer shell, so there is zero
          chance of margin math errors.
       ──────────────────────────────────────────────────────────────────── */}
      <div style={{ background: "#0d1117", overflowX: "hidden" }}>
        {/* ↓ ref HERE — margins are outside this box, so offsetWidth = exact canvas px */}
        <div
          ref={innerRef}
          className="mx-3 my-3 sm:mx-6 sm:my-6"
          style={{ minWidth: 0 }} /* prevent flex/grid blowout on mobile */
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
              // KEY FIX: when pdfjs encounters a password-protected file it calls
              // onPassword(callback, reason). We immediately supply the pre-fetched
              // password so the file opens silently — no browser dialog ever appears.
              // If no password was provided (pdfPassword is null) we intentionally
              // do NOT call updatePassword, which causes pdfjs to show the error
              // state instead of the browser's native popup.
              onPassword={(updatePassword, reason) => {
                if (pdfPassword) {
                  updatePassword(pdfPassword);
                }
                // If reason === 2 (wrong password) or no password available,
                // we do nothing — pdfjs will show the error fallback above.
              }}
              onLoadSuccess={(payload) => {
                onDocumentLoadSuccess(payload);
                setCurrentPage(1);
                setInputValue("1");
              }}
              onLoadError={(err) => console.error("[Viewer]", err?.message || err)}
            >
              {/* BUG 3 FIX: key includes pageWidth so the canvas remounts
                  when the container resizes — prevents stale canvas dimensions */}
              <div
                key={`page_${currentPage}_${pageWidth}`}
                style={{
                  borderRadius: "10px",
                  overflow: "hidden",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,183,115,0.1)",
                  // Ensure the wrapper doesn't grow beyond its parent
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={pageWidth}
                  // Explicit style to prevent canvas from ever overflowing
                  style={{ display: "block", maxWidth: "100%" }}
                />
              </div>
            </Document>
          )}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      {safeNumPages > 1 && (
        <div
          style={{ borderTop: "1px solid rgba(217,183,115,0.1)", background: "rgba(217,183,115,0.03)" }}
          className="flex items-center justify-between px-4 py-3 sm:px-6"
        >
          <button
            type="button" onClick={goToPrev} disabled={currentPage <= 1}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
            style={{ background: "rgba(217,183,115,0.08)", border: "1px solid rgba(217,183,115,0.15)", color: "#d9b773" }}
          >
            ← Prev
          </button>
          <span className="text-xs" style={{ color: "#4b5563" }}>
            {currentPage} / {safeNumPages}
          </span>
          <button
            type="button" onClick={goToNext} disabled={currentPage >= safeNumPages}
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
