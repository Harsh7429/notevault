import { useEffect, useState } from "react";
import { Check, Copy, Download, Key, Loader2, Lock, X, AlertTriangle } from "lucide-react";
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
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ── Step 1: fetch the per-user password from the backend ──
  async function handleRevealPassword() {
    setStep("loading");
    setError("");
    try {
      const token = getStoredToken();
      if (!token) throw new Error("You are not logged in.");
      const data = await fetchDownloadPassword(token, fileId);
      if (!data?.password) throw new Error("Server did not return a password.");
      setPassword(data.password);
      setStep("ready");
    } catch (err) {
      setError(err.message || "Failed to prepare download.");
      setStep("confirm");
    }
  }

  // ── Step 2: trigger the authenticated download ──
  // We use fetch + Blob so the Authorization header is sent (required by the
  // backend). A plain <a href> would NOT send the header and would return 401.
  async function handleDownload() {
    setStep("downloading");
    setError("");
    try {
      const token = getStoredToken();
      if (!token) throw new Error("You are not logged in.");

      const url = buildDownloadUrl(fileId);

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Try to parse a JSON error body; fall back to status text
        let msg = `Server error ${res.status}`;
        try {
          const json = await res.json();
          msg = json.message || msg;
        } catch {
          // not JSON — keep status message
        }
        throw new Error(msg);
      }

      // Verify the response is actually a PDF, not an error page
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/pdf")) {
        throw new Error(
          `Unexpected response type: ${contentType}. Please try again.`
        );
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("Received empty file. Please try again.");
      }

      // Trigger browser download
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${(fileName || "note").replace(/[^a-zA-Z0-9._-]/g, "-")}-protected.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Small delay before revoking so the download can start
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

      setStep("ready"); // back to ready so user can copy password or download again
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
      <div
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(217,183,115,0.18)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2"
              style={{
                background: "rgba(217,183,115,0.1)",
                border: "1px solid rgba(217,183,115,0.2)",
              }}
            >
              <Lock className="size-4" style={{ color: "#d9b773" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "#f0e6cc" }}>
                Protected Download
              </p>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Encrypted with your personal key
              </p>
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

          {/* ── Step: confirm ── */}
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
                The PDF will be locked with a{" "}
                <strong style={{ color: "#d9b773" }}>unique password</strong>{" "}
                generated for your account. Keep it safe — you&apos;ll need it
                to open the file in any PDF reader.
              </div>
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                  }}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}
              <button
                onClick={handleRevealPassword}
                className="w-full rounded-2xl py-3 text-sm font-semibold transition-all"
                style={{
                  background: "rgba(217,183,115,0.12)",
                  border: "1px solid rgba(217,183,115,0.25)",
                  color: "#d9b773",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(217,183,115,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(217,183,115,0.12)")
                }
              >
                Get my password &amp; download
              </button>
            </>
          )}

          {/* ── Step: loading ── */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2
                className="size-8 animate-spin"
                style={{ color: "#d9b773" }}
              />
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                Preparing your encrypted PDF…
              </p>
            </div>
          )}

          {/* ── Step: ready / downloading ── */}
          {(step === "ready" || step === "downloading") && (
            <>
              {/* Password display */}
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6b7280" }}
                >
                  Your personal PDF password
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
                      background: copied
                        ? "rgba(74,222,128,0.15)"
                        : "rgba(217,183,115,0.1)",
                      border: copied
                        ? "1px solid rgba(74,222,128,0.3)"
                        : "1px solid rgba(217,183,115,0.2)",
                      color: copied ? "#4ade80" : "#d9b773",
                    }}
                    aria-label="Copy password"
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: "#6b7280" }}>
                  Save this password. You can retrieve it again from your
                  library at any time.
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
                ⚠️ This file is encrypted{" "}
                <strong>for your account only</strong>. Sharing it without the
                password makes it unreadable. Sharing both violates the terms of
                purchase.
              </div>

              {/* Error display */}
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                  }}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}

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
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Download Encrypted PDF
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
