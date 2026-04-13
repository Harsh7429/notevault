import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PdfThumbnail } from "@/components/pdf-thumbnail";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import {
  createPaymentOrder,
  fetchCurrentUser,
  fetchFileById,
  fetchMyPurchases,
  verifyPayment,
} from "@/lib/api";
import { loadRazorpayScript } from "@/lib/payments";

export default function FileDetailPage({ fileId }) {
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!fileId) return;

    const token = getStoredToken();
    const requests = [fetchFileById(fileId)];

    if (token) {
      requests.push(fetchCurrentUser(token), fetchMyPurchases(token));
    }

    Promise.all(requests)
      .then(([fileData, currentUser, purchases]) => {
        setFile(fileData);
        if (currentUser) setUser(currentUser);
        if (purchases) {
          const alreadyOwned = purchases.some(
            (p) => Number(p.file_id) === Number(fileId)
          );
          setOwned(alreadyOwned);
        }
      })
      .catch((err) => {
        if (
          err.message?.toLowerCase().includes("session") ||
          err.message?.toLowerCase().includes("token")
        ) {
          clearStoredToken();
        }
        setError(err.message || "Failed to load file details.");
      })
      .finally(() => setLoading(false));
  }, [fileId]);

  async function handlePurchase() {
    const token = getStoredToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setPurchasing(true);
    setError("");
    setSuccessMessage("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Failed to load Razorpay checkout. Please check your connection and try again."
        );
      }

      const orderData = await createPaymentOrder(token, fileId);
      const { keyId, order } = orderData;

      await new Promise((resolve, reject) => {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "NoteVault",
          description: file.title,
          order_id: order.id,
          prefill: {
            email: user?.email || "",
            name: user?.name || "",
          },
          theme: { color: "#171511" },
          handler: async function (response) {
            try {
              await verifyPayment(token, {
                fileId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setOwned(true);
              setSuccessMessage(
                "Payment successful! You can now access this file."
              );
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: function () {
              reject(new Error("Payment was cancelled."));
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });
    } catch (err) {
      if (err.message !== "Payment was cancelled.") {
        setError(err.message || "Something went wrong during checkout.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  const metaChips = file
    ? [file.subject, file.course, file.semester, file.unit_label].filter(Boolean)
    : [];

  const pageTitle = file ? `${file.title} — NoteVault` : "NoteVault";

  return (
    <AppShell>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            file?.description ||
            "Secure notes marketplace. Purchase and access premium study materials."
          }
        />
      </Head>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/browse"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#5f584d] transition hover:text-[#171511]"
        >
          <ArrowLeft className="size-4" />
          Back to catalogue
        </Link>

        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#5f584d]" />
          </div>
        )}

        {!loading && error && !file && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <FileText className="size-10 text-[#c0392b]" />
              <p className="text-base font-medium text-[#171511]">{error}</p>
              <Button variant="ghost" onClick={() => router.push("/browse")}>
                Return to catalogue
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && file && (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* ── Left: details ── */}
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#171511]">
                  {file.title}
                </h1>
                {metaChips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metaChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-[#171511]/8 bg-white px-3 py-1 text-xs font-medium text-[#5f584d]"
                      >
                        {chip}
                      </span>
                    ))}
                    {file.page_count ? (
                      <span className="rounded-full border border-[#171511]/8 bg-white px-3 py-1 text-xs font-medium text-[#5f584d]">
                        {file.page_count} pages
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#171511]/8 bg-gradient-to-br from-[#efe0be] via-[#f8f3ea] to-[#dce6d4]">
                <PdfThumbnail
                  fileUrl={file.file_url}
                  thumbnail={file.thumbnail}
                  alt={file.title}
                  className="h-full w-full object-cover"
                  fallbackLabel="PDF preview"
                />
              </div>

              {file.description && (
                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#7a7368]">
                    About this product
                  </h2>
                  <p className="leading-7 text-[#5f584d]">{file.description}</p>
                </div>
              )}

              <Card>
                <CardContent className="grid grid-cols-2 gap-y-3 p-5 text-sm">
                  {file.subject && (
                    <>
                      <span className="font-medium text-[#7a7368]">Subject</span>
                      <span className="text-[#171511]">{file.subject}</span>
                    </>
                  )}
                  {file.course && (
                    <>
                      <span className="font-medium text-[#7a7368]">Course</span>
                      <span className="text-[#171511]">{file.course}</span>
                    </>
                  )}
                  {file.semester && (
                    <>
                      <span className="font-medium text-[#7a7368]">Semester</span>
                      <span className="text-[#171511]">{file.semester}</span>
                    </>
                  )}
                  {file.unit_label && (
                    <>
                      <span className="font-medium text-[#7a7368]">Unit</span>
                      <span className="text-[#171511]">{file.unit_label}</span>
                    </>
                  )}
                  {file.page_count && (
                    <>
                      <span className="font-medium text-[#7a7368]">Pages</span>
                      <span className="text-[#171511]">{file.page_count}</span>
                    </>
                  )}
                  <span className="font-medium text-[#7a7368]">Added to catalog</span>
                  <span className="text-[#171511]">
                    {new Date(file.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-medium text-[#7a7368]">Product ID</span>
                  <span className="text-[#171511]">#{file.id}</span>
                </CardContent>
              </Card>
            </div>

            {/* ── Right: purchase panel ── */}
            <div className="flex flex-col gap-4">
              <Card className="sticky top-6">
                <CardContent className="flex flex-col gap-5 p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-[#171511]">
                      Rs.&nbsp;{Number(file.price).toFixed(2)}
                    </span>
                    {file.is_featured && (
                      <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#5f6f52]">
                        Featured
                      </span>
                    )}
                  </div>

                  {successMessage && (
                    <div className="flex items-center gap-2 rounded-2xl bg-[#e8f5e9] px-4 py-3 text-sm font-medium text-[#2e7d32]">
                      <CheckCircle2 className="size-4 shrink-0" />
                      {successMessage}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-2xl bg-[#fff3f3] px-4 py-3 text-sm font-medium text-[#c0392b]">
                      {error}
                    </div>
                  )}

                  {owned ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => router.push(`/viewer/${fileId}`)}
                    >
                      <BookOpen className="mr-2 size-4" />
                      Open secure viewer
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handlePurchase}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Opening checkout…
                        </>
                      ) : (
                        `Buy for Rs. ${Number(file.price).toFixed(2)}`
                      )}
                    </Button>
                  )}

                  {!owned && (
                    <p className="text-center text-xs leading-5 text-[#7a7368]">
                      After a successful payment, this product is added to your
                      account automatically and the secure viewer button becomes
                      available here and in your library.
                    </p>
                  )}

                  {owned && (
                    <div className="flex items-center gap-2 rounded-2xl border border-[#171511]/8 bg-[#f8f3ea] px-4 py-3 text-sm font-medium text-[#5f584d]">
                      <CheckCircle2 className="size-4 shrink-0 text-[#5f6f52]" />
                      You already own this product
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-[#171511]/8 bg-[#f8f3ea] p-2">
                      <FileText className="size-4 text-[#5f6f52]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#171511]">
                        Purchase and access
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-[#7a7368]">
                        Complete checkout to unlock viewer access. The viewer
                        stays hidden until the purchase is verified.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-[#171511]/8 bg-[#f8f3ea] p-2">
                      <ShieldCheck className="size-4 text-[#5f6f52]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#171511]">
                        Protected delivery
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-[#7a7368]">
                        Viewer access requires login plus a verified purchase
                        record. Each session shows the signed-in user email and
                        live timestamp as a watermark.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-[#171511]/8 bg-[#f8f3ea] p-2">
                      <Lock className="size-4 text-[#5f6f52]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#171511]">
                        Secure payments
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-[#7a7368]">
                        Payments are processed by Razorpay. NoteVault never
                        stores your card details.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  const fileId = Number(id);

  if (!id || Number.isNaN(fileId) || fileId <= 0) {
    return { notFound: true };
  }

  return {
    props: { fileId },
  };
}
