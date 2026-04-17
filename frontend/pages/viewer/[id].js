import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { SecurePdfViewer } from "@/components/viewer/secure-pdf-viewer";
import { DownloadModal } from "@/components/viewer/download-modal";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import { fetchSecureViewerAccess } from "@/lib/api";

export default function ViewerPage({ fileId: fileIdProp }) {
  const router = useRouter();
  const fileId = fileIdProp ?? Number(router.query.id);

  const [viewerUrl, setViewerUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    if (!fileId) return;

    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchSecureViewerAccess(token, fileId)
      .then((data) => {
        setFile(data.file);
        setViewerUrl(data.viewerUrl);
      })
      .catch((err) => {
        const msg = err.message || "";
        // Session expired → back to login
        if (
          msg.toLowerCase().includes("session") ||
          msg.toLowerCase().includes("token")
        ) {
          clearStoredToken();
          router.replace("/login");
          return;
        }
        // Not purchased / no access → redirect to the product page
        if (
          msg.toLowerCase().includes("purchase") ||
          msg.toLowerCase().includes("access") ||
          msg.toLowerCase().includes("forbidden") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          router.replace(`/files/${fileId}`);
          return;
        }
        setError(msg || "Could not load this document.");
      })
      .finally(() => setLoading(false));
  }, [fileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageTitle = file
    ? `${file.title} — NoteVault Reader`
    : "NoteVault Reader";

  return (
    <AppShell>
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar: back link + download button */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5f584d] transition hover:text-[#171511]"
          >
            <ArrowLeft className="size-4" />
            Back to library
          </Link>

          {viewerUrl && file && (
            <button
              onClick={() => setShowDownload(true)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all"
              style={{
                background: "rgba(217,183,115,0.12)",
                border: "1px solid rgba(217,183,115,0.25)",
                color: "#d9b773",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(217,183,115,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(217,183,115,0.12)")
              }
            >
              <Download className="size-4" />
              Download PDF
            </button>
          )}
        </div>

        {/* File title */}
        {file && (
          <h1 className="mb-6 text-xl font-semibold tracking-tight text-[#171511]">
            {file.title}
          </h1>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2
                className="size-8 animate-spin"
                style={{ color: "#d9b773" }}
              />
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                Loading secure viewer…
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-base font-medium text-red-500">{error}</p>
            <Link
              href="/dashboard"
              className="text-sm font-medium underline"
              style={{ color: "#d9b773" }}
            >
              Return to library
            </Link>
          </div>
        )}

        {/* PDF Viewer */}
        {!loading && !error && viewerUrl && (
          <SecurePdfViewer
            fileUrl={viewerUrl}
            numPages={numPages}
            onDocumentLoadSuccess={({ numPages: n }) => setNumPages(n)}
          />
        )}
      </section>

      {/* Password-protected download modal */}
      {showDownload && file && (
        <DownloadModal
          fileId={fileId}
          fileName={file.title}
          onClose={() => setShowDownload(false)}
        />
      )}
    </AppShell>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  const fileId = Number(id);

  if (!id || Number.isNaN(fileId) || fileId <= 0) {
    return { notFound: true };
  }

  return { props: { fileId } };
}
