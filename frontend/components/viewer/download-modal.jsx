import { useEffect, useState } from "react";
import { Check, Copy, Download, Key, Loader2, Lock, X } from "lucide-react";
import { buildDownloadUrl, fetchDownloadPassword } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

export function DownloadModal({ fileId, fileName, onClose }) {
  const [step, setStep] = useState("confirm"); // confirm | loading | ready | downloading
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleRevealAndDownload() {
    setStep("loading");
    setError("");
    try {
      const token = getStoredToken();
      const data = await fetchDownloadPassword(token, fileId);
      setPassword(data.password);
      setStep("ready");
    } catch (err) {
      setError(err.message || "Failed to prepare download.");
      setStep("confirm");
    }
  }

  async function handleDownload() {
    setStep("downloading");
    try {
      const token = getStoredToken();
      const url = buildDownloadUrl(fileId);

      // Fetch with auth header then trigger browser download
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Download failed.");
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${fileName || "note"}-protected.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      setStep("ready"); // back to ready so user can copy password again
    } catch (err) {
      setError(err.message || "Download failed. Please try again.");
      setStep("ready");
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

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        style={{ background: "#0d1117", border: "1px solid rgba(217,183,115,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2" style={{ background: "rgba(217,183,115,0.1)", border: "1px solid rgba(217,183,115,0.2)" }}>
              <Lock className="size-4" style={{ color: "#d9b773" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "#f0e6cc" }}>Protected Download</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Encrypted with your personal key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f0e6cc"}
            onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-4 space-y-5">

          {/* Step: confirm */}
          {step === "confirm" && (
            <>
              <div className="rounded-2xl p-4 text-sm leading-6" style={{ background: "rgba(217,183,115,0.06)", border: "1px solid rgba(217,183,115,0.1)", color: "#c9bfae" }}>
                The PDF will be locked with a <strong style={{ color: "#d9b773" }}>unique password</strong> generated specifically for your account.
                Keep the password safe — you'll need it to open the file in any PDF reader.
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <button
                onClick={handleRevealAndDownload}
                className="w-full rounded-2xl py-3 text-sm font-semibold transition-all"
                style={{ background: "rgba(217,183,115,0.12)", border: "1px solid rgba(217,183,115,0.25)", color: "#d9b773" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(217,183,115,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(217,183,115,0.12)"}
              >
                Get my password &amp; download
              </button>
            </>
          )}

          {/* Step: loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="size-8 animate-spin" style={{ color: "#d9b773" }} />
              <p className="text-sm" style={{ color: "#9ca3af" }}>Preparing your encrypted PDF…</p>
            </div>
          )}

          {/* Step: ready / downloading */}
          {(step === "ready" || step === "downloading") && (
            <>
              {/* Password display */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                  Your personal PDF password
                </p>
                <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: "rgba(217,183,115,0.07)", border: "1px solid rgba(217,183,115,0.15)" }}>
                  <Key className="size-4 shrink-0" style={{ color: "#d9b773" }} />
                  <span className="flex-1 font-mono text-lg font-bold tracking-widest" style={{ color: "#f0e6cc" }}>
                    {password}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: copied ? "rgba(74,222,128,0.15)" : "rgba(217,183,115,0.1)",
                      border: copied ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(217,183,115,0.2)",
                      color: copied ? "#4ade80" : "#d9b773",
                    }}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: "#6b7280" }}>
                  Save this password. You can always retrieve it again from your library.
                </p>
              </div>

              {/* Warning */}
              <div className="rounded-xl px-4 py-3 text-xs leading-5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                ⚠️ This file is encrypted for <strong>your account only</strong>. Sharing the file without the password makes it unreadable. Sharing both the file and password violates the terms of purchase.
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={step === "downloading"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #b8973a, #d9b773)",
                  color: "#0d1117",
                }}
              >
                {step === "downloading" ? (
                  <><Loader2 className="size-4 animate-spin" /> Downloading…</>
                ) : (
                  <><Download className="size-4" /> Download Encrypted PDF</>
                )}
              </button>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
