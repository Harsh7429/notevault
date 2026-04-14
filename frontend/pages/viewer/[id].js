import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, ShieldAlert, ShieldCheck, Tags } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import { fetchCurrentUser, fetchSecureViewerAccess } from "@/lib/api";

const SecurePdfViewer = dynamic(
  () => import("@/components/viewer/secure-pdf-viewer").then((module) => module.SecurePdfViewer),
  { ssr: false }
);

export default function ViewerPage({ fileId }) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    file: null,
    viewerUrl: "",
    email: "",
    numPages: 0,
    token: ""
  });

  const metaChips = useMemo(() => {
    return [state.file?.subject, state.file?.course, state.file?.semester, state.file?.unitLabel].filter(Boolean);
  }, [state.file]);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    function blockEvent(event) {
      event.preventDefault();
    }

    function blockShortcuts(event) {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;

      if (event.key === "F12" || key === "printscreen") {
        event.preventDefault();
      }

      if (modifier && ["p", "s", "u"].includes(key)) {
        event.preventDefault();
      }
    }

    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("dragstart", blockEvent);
    document.addEventListener("keydown", blockShortcuts);
    window.addEventListener("beforeprint", blockEvent);

    Promise.all([fetchCurrentUser(token), fetchSecureViewerAccess(token, fileId)])
      .then(([user, access]) => {
        setState((current) => ({
          ...current,
          loading: false,
          email: user.email,
          viewerUrl: access.viewerUrl,
          file: access.file,
          token,
          error: ""
        }));
      })
      .catch((error) => {
        if (error.message.toLowerCase().includes("session") || error.message.toLowerCase().includes("token")) {
          clearStoredToken();
        }

        setState((current) => ({
          ...current,
          loading: false,
          error: error.message
        }));
      });

    return () => {
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("dragstart", blockEvent);
      document.removeEventListener("keydown", blockShortcuts);
      window.removeEventListener("beforeprint", blockEvent);
    };
  }, [fileId]);

  return (
    <>
      <Head>
        <title>{state.file ? `${state.file.title} Viewer | NoteVault` : "Secure Viewer | NoteVault"}</title>
      </Head>
      <AppShell>
        <section className="space-y-8 py-8 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/files/${fileId}`} className="inline-flex items-center gap-2 text-sm font-medium text-[#5a5449] transition hover:text-[#171511]">
              <ArrowLeft className="size-4" />
              Back to product
            </Link>
            <div className="rounded-full border border-[#171511]/10 bg-white px-4 py-2 text-sm text-[#5f6f52]">Secure viewer mode</div>
          </div>

          {state.loading ? (
            <Card>
              <CardContent className="p-8 text-[#5a5449]">Preparing your protected viewer...</CardContent>
            </Card>
          ) : state.error ? (
            <Card>
              <CardContent className="space-y-4 p-8">
                <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                  <ShieldAlert className="size-6" />
                </div>
                <h1 className="text-3xl font-semibold text-[#171511]">Viewer access blocked</h1>
                <p className="text-[#5a5449]">{state.error}</p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/login">Go to login</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`/files/${fileId}`}>Return to file</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-3xl font-semibold text-[#171511]">{state.file?.title}</h1>
                      <p className="mt-2 max-w-3xl text-[#5a5449]">Protected access granted for {state.email}. This session includes a live watermark and browser-side restrictions.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#eff4ea] px-4 py-2 text-sm text-[#5f6f52]">
                      <ShieldCheck className="size-4" />
                      Viewing only
                    </div>
                  </div>

                  {metaChips.length ? (
                    <div className="flex flex-wrap gap-2">
                      {metaChips.map((chip) => (
                        <span key={chip} className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">
                          {chip}
                        </span>
                      ))}
                      {state.file?.pageCount ? <span className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">{state.file.pageCount} pages</span> : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-[#171511]/8 bg-white p-4 text-sm text-[#5a5449]">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">
                        <Tags className="size-4" />
                        Access
                      </div>
                      <div className="mt-2 leading-7">Open this document only inside the protected NoteVault viewer.</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-[#171511]/8 bg-white p-4 text-sm text-[#5a5449]">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">
                        <Clock3 className="size-4" />
                        Session
                      </div>
                      <div className="mt-2 leading-7">Viewer requests now flow through a protected backend route with JWT and purchase enforcement.</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-[#171511]/8 bg-white p-4 text-sm text-[#5a5449]">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">
                        <ShieldCheck className="size-4" />
                        Protection
                      </div>
                      <div className="mt-2 leading-7">Watermarking and blocked shortcuts help reduce casual copying and unauthorized sharing.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SecurePdfViewer
                fileUrl={state.viewerUrl}
                email={state.email}
                numPages={state.numPages}
                onDocumentLoadSuccess={({ numPages }) => {
                  setState((current) => ({
                    ...current,
                    numPages
                  }));
                }}
              />
            </div>
          )}
        </section>
      </AppShell>
    </>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      fileId: context.params.id
    }
  };
}
