import { useEffect, useState } from "react";
import {
  AlertTriangle, Check, Copy, Download,
  Key, Loader2, Lock, X,
} from "lucide-react";
import { buildDownloadUrl, fetchDownloadPassword } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

/**
 * Download flow:
 *
 * 1. "confirm" — user sees an info box and clicks the CTA button.
 * 2. "loading"  — we call /download-password to find out if a password exists.
 * 3a. "ready"   — password exists: show it, then let the user download.
 * 3b. Directly triggers the download when there is NO password set.
 * 4. "downloading" — fetch in progress.
 */
export function DownloadModal({ fileId, fileName, onClose }) {
  const [step,        setStep]     = useState("confirm");
  const [password,    setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [copied,      setCopied]   = useState(false);
  const [error,       setError]    = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Step 1: fetch password info ───────────────────────────────────────────
  async function handleStart() {
    setStep("loading");
    setError("");
    try {
      const token = getStoredToken();
      if (!token) throw new Error("You are not logged in.");

      const data = await fetchDownloadPassword(token, fileId);

      if (data.hasPassword && data.password) {
        setPassword(data.password);
        setHasPassword(true);
        setStep("ready");           // show the password before downloading
      } else {
        setHasPassword(false);
        // No password set — go straight to download, passing false explicitly
        // so triggerDownload doesn't read the stale hasPassword state closure.
        await triggerDownload(false);
      }
    } catch (err) {
      setError(err.message || "Failed to prepare download.");
      setStep("confirm");
    }
  }

  // ── Step 2: download ──────────────────────────────────────────────────────
  // wasPassword is passed explicitly to avoid stale React state closure issues.
  async function triggerDownload(wasPassword = hasPassword) {
    setStep("downloading");
    setError("");
    try {
      const token = getStoredToken();
      if (!token) throw new Error("You are not logged in.");

      const res = await fetch(buildDownloadUrl(fileId), {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let msg = `Server error ${res.status}`;
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/pdf")) {
        throw new Error(`Unexpected response type: ${contentType}. Please try again.`);
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Received empty file. Please try again.");

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href     = objectUrl;
      a.download = `${(fileName || "note").replace(/[^a-zA-Z0-9._-]/g, "-")}-download.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

      // Stay on "ready" if there was a password to show; otherwise close
      if (wasPassword) {
        setStep("ready");
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Download failed. Please try again.");
      setStep(wasPassword ? "ready" : "confirm");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom-sheet on mobile, centered card on sm+ */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl shadow-2xl
                   sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        style={{ background: "#0d1117", border: "1px solid rgba(217,183,115,0.18)" }}
      >
        {/* Safe-area spacer for iOS home bar (only shown at bottom on mobile) */}
        <div className="sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
        {/* Drag handle hint — only visible on mobile where modal is a bottom sheet */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2"
              style={{ background: "rgba(217,183,115,0.1)", border: "1px solid rgba(217,183,115,0.2)" }}
            >
              <Lock className="size-4" style={{ color: "#d9b773" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "#f0e6cc" }}>Download File</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Purchased content delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors"
            style={{ color: "#6b7280" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f0e6cc")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6 pt-4">

          {/* ── confirm ── */}
          {step === "confirm" && (
            <>
              <div
                className="rounded-2xl p-4 text-sm leading-6"
                style={{
                  background: "rgba(217,183,115,0.06)",
                  border: "1px solid rgba(217,183,115,0.1)",
                  color: "#c9bfae",
                }}
              >
                Click below to download your purchased PDF. If a password has been set for this file, it will be shown to you before the download begins.
              </div>
              {error && <ErrorBox message={error} />}
              <GoldButton onClick={handleStart}>
                Prepare download
              </GoldButton>
            </>
          )}

          {/* ── loading ── */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="size-8 animate-spin" style={{ color: "#d9b773" }} />
              <p className="text-sm" style={{ color: "#9ca3af" }}>Preparing your file…</p>
            </div>
          )}

          {/* ── downloading (no password) ── */}
          {step === "downloading" && !hasPassword && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="size-8 animate-spin" style={{ color: "#d9b773" }} />
              <p className="text-sm" style={{ color: "#9ca3af" }}>Downloading…</p>
            </div>
          )}

          {/* ── ready (password exists) ── */}
          {(step === "ready" || (step === "downloading" && hasPassword)) && (
            <>
              {/* Password card */}
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7280" }}
                >
                  Your file password
                </p>
                <div
                  className="flex items-center gap-3 rounded-2xl p-4"
                  style={{
                    background: "rgba(217,183,115,0.07)",
                    border: "1px solid rgba(217,183,115,0.15)",
                  }}
                >
                  <Key className="size-4 shrink-0" style={{ color: "#d9b773" }} />
                  <span
                    className="flex-1 font-mono text-lg font-bold tracking-widest"
                    style={{ color: "#f0e6cc" }}
                  >
                    {password}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: copied ? "rgba(74,222,128,0.15)" : "rgba(217,183,115,0.1)",
                      border:     copied ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(217,183,115,0.2)",
                      color:      copied ? "#4ade80" : "#d9b773",
                    }}
                    aria-label="Copy password"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: "#6b7280" }}>
                  Save this password — you will need it to open the downloaded PDF in any reader.
                </p>
              </div>

              {/* Warning */}
              <div
                className="rounded-xl px-4 py-3 text-xs leading-5"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                }}
              >
                ⚠️ This file is encrypted for <strong>your purchase only</strong>. Sharing it violates the terms of purchase.
              </div>

              {error && <ErrorBox message={error} />}

              {/* Download button */}
              <button
                onClick={() => triggerDownload(true)}
                disabled={step === "downloading"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #b8973a, #d9b773)", color: "#0d1117" }}
              >
                {step === "downloading" ? (
                  <><Loader2 className="size-4 animate-spin" /> Downloading…</>
                ) : (
                  <><Download className="size-4" /> Download Encrypted PDF</>
                )}
              </button>
            </>
          )}
        </div>
        {/* iOS safe-area bottom padding for bottom-sheet on iPhone */}
        <div className="sm:hidden" style={{ height: "env(safe-area-inset-bottom, 12px)" }} />
      </div>
    </>
  );
}

function ErrorBox({ message }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#fca5a5",
      }}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

function GoldButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl py-3 text-sm font-semibold transition-all"
      style={{
        background: "rgba(217,183,115,0.12)",
        border: "1px solid rgba(217,183,115,0.25)",
        color: "#d9b773",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(217,183,115,0.2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(217,183,115,0.12)")}
    >
      {children}
    </button>
  );
}
