import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { DownloadModal } from "@/components/viewer/download-modal";
import { SecurePdfViewer } from "@/components/viewer/secure-pdf-viewer";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import {
  fetchCurrentUser,
  fetchDownloadPassword,
  fetchFileById,
  fetchMyPurchases,
  fetchSecureViewerAccess,
} from "@/lib/api";

export default function ViewerPage() {
  const router = useRouter();
  const { id } = router.query;
  const fileId = id ? Number(id) : null;

  const [status, setStatus] = useState("loading"); // loading | ready | forbidden | error
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [pdfPassword, setPdfPassword] = useState(null); // null = no password
  const [user, setUser] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    if (!fileId) return;

    const token = getStoredToken();
    if (!token) {
      router.replace(`/login?next=/viewer/${fileId}`);
      return;
    }

    async function init() {
      try {
        // Run public + authed fetches in parallel for speed
        const [fileData, currentUser, purchases] = await Promise.all([
          fetchFileById(fileId),
          fetchCurrentUser(token),
          fetchMyPurchases(token),
        ]);

        setFile(fileData);
        setUser(currentUser);

        const owned = purchases.some(
          (p) => Number(p.file_id) === Number(fileId)
        );

        if (!owned) {
          setStatus("forbidden");
          return;
        }

        // ── Get the short-lived signed URL + password in parallel ──
        const [accessData, pwData] = await Promise.all([
          fetchSecureViewerAccess(token, fileId),
          fetchDownloadPassword(token, fileId).catch(() => ({ hasPassword: false })),
        ]);

        // The backend key is "viewerUrl" — do NOT use url/file_url/signedUrl
        const url = accessData.viewerUrl;
        if (!url) {
          throw new Error("Viewer URL missing from server response. Please try again.");
        }

        setFileUrl(url);
        // Only set the password if the file actually has one.
        // This is passed to SecurePdfViewer so pdfjs can open it without
        // triggering the browser's native "Enter PDF password" dialog.
        if (pwData?.hasPassword && pwData?.password) {
          setPdfPassword(pwData.password);
        }
        setStatus("ready");
      } catch (err) {
        const msg = err.message || "";
        if (
          msg.toLowerCase().includes("session") ||
          msg.toLowerCase().includes("token") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          clearStoredToken();
          router.replace(`/login?next=/viewer/${fileId}`);
          return;
        }
        if (msg.toLowerCase().includes("purchase") || msg.toLowerCase().includes("403")) {
          setStatus("forbidden");
          return;
        }
        setErrorMsg(msg || "Failed to load viewer.");
        setStatus("error");
      }
    }

    init();
  }, [fileId]); // eslint-disable-line react-hooks/exhaustive-deps
        if (
          msg.toLowerCase().includes("session") ||
          msg.toLowerCase().includes("token") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          clearStoredToken();
          router.replace(`/login?next=/viewer/${fileId}`);
          return;
        }
        if (msg.toLowerCase().includes("purchase") || msg.toLowerCase().includes("403")) {
          setStatus("forbidden");
          return;
        }
        setErrorMsg(msg || "Failed to load viewer.");
        setStatus("error");
      }
    }

    init();
  }, [fileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──
  if (status === "loading") {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              className="size-10 animate-spin"
              style={{ color: "#d9b773" }}
            />
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Verifying access…
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Forbidden ──
  if (status === "forbidden") {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center"
            style={{
              background: "#0d1117",
              border: "1px solid rgba(217,183,115,0.15)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <Lock className="size-7" style={{ color: "#f87171" }} />
            </div>
            <h1
              className="mb-2 text-lg font-bold"
              style={{ color: "#f0e6cc" }}
            >
              Access denied
            </h1>
            <p
              className="mb-6 text-sm leading-6"
              style={{ color: "#6b7280" }}
            >
              You haven&apos;t purchased this file yet. Complete the checkout to
              unlock the secure viewer.
            </p>
            <Link
              href={`/files/${fileId}`}
              className="inline-block w-full rounded-2xl py-2.5 text-sm font-semibold transition-all"
              style={{
                background: "rgba(217,183,115,0.12)",
                border: "1px solid rgba(217,183,115,0.25)",
                color: "#d9b773",
              }}
            >
              Go to purchase page
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center"
            style={{
              background: "#0d1117",
              border: "1px solid rgba(217,183,115,0.15)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <ShieldAlert className="size-7" style={{ color: "#f87171" }} />
            </div>
            <h1
              className="mb-2 text-lg font-bold"
              style={{ color: "#f0e6cc" }}
            >
              Something went wrong
            </h1>
            <p className="mb-6 text-sm" style={{ color: "#6b7280" }}>
              {errorMsg}
            </p>
            <button
              onClick={() => router.reload()}
              className="w-full rounded-2xl py-2.5 text-sm font-semibold"
              style={{
                background: "rgba(217,183,115,0.12)",
                border: "1px solid rgba(217,183,115,0.25)",
                color: "#d9b773",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Ready ──
  return (
    <AppShell>
      <Head>
        <title>
          {file?.title
            ? `${file.title} — NoteVault Viewer`
            : "NoteVault Viewer"}
        </title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <section className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* ── Top bar ── */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={`/files/${fileId}`}
            className="inline-flex items-center gap-2 text-sm font-medium transition"
            style={{ color: "#5f584d" }}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to details</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {file && (
            <div className="flex items-center gap-2">
              <h1
                className="hidden max-w-[200px] truncate text-sm font-semibold sm:block"
                style={{ color: "#f0e6cc" }}
              >
                {file.title}
              </h1>
              <button
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm"
                style={{
                  background: "rgba(217,183,115,0.1)",
                  border: "1px solid rgba(217,183,115,0.22)",
                  color: "#d9b773",
                }}
              >
                <Download className="size-3.5" />
                Download
              </button>
            </div>
          )}
        </div>

        {/* ── Watermark strip ── */}
        {user && (
          <div
            className="mb-3 flex items-center justify-between rounded-xl px-3 py-2 sm:px-4"
            style={{
              background: "rgba(217,183,115,0.05)",
              border: "1px solid rgba(217,183,115,0.1)",
            }}
          >
            <span
              className="text-[10px] sm:text-xs"
              style={{ color: "#4b5563" }}
            >
              Licensed to:{" "}
              <span className="font-semibold" style={{ color: "#6b7280" }}>
                {user.email}
              </span>
            </span>
            <span
              className="text-[10px] sm:text-xs"
              style={{ color: "#374151" }}
            >
              {new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </span>
          </div>
        )}

        {/* ── PDF Viewer ──
            fileUrl comes from accessData.viewerUrl (Supabase signed URL).
            pdfPassword is fetched alongside so pdfjs can open encrypted files
            without triggering the browser's native password dialog. */}
        {fileUrl ? (
          <SecurePdfViewer
            fileUrl={fileUrl}
            pdfPassword={pdfPassword}
            numPages={numPages}
            onDocumentLoadSuccess={({ numPages: n }) => setNumPages(n)}
          />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2
              className="size-8 animate-spin"
              style={{ color: "#d9b773" }}
            />
          </div>
        )}
      </section>

      {/* ── Download modal ── */}
      {showDownloadModal && file && (
        <DownloadModal
          fileId={fileId}
          fileName={file.title}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
    </AppShell>
  );
}
