import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, FileLock2, GraduationCap, LayoutGrid, ShieldCheck, Sparkles } from "lucide-react";

import { FileCard } from "@/components/file-card";
import { AppShell } from "@/components/layout/app-shell";
import { PdfThumbnail } from "@/components/pdf-thumbnail";
import { PricePill } from "@/components/price-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStoredToken } from "@/lib/auth";
import { API_BASE_URL, createPaymentOrder, fetchCurrentUser, fetchFileById, fetchFiles, fetchMyPurchases, verifyPayment } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/payments";

function buildProductHighlights(file) {
  return [
    file.subject ? `${file.subject} material organized for faster revision.` : "Structured study material organized for faster revision.",
    file.page_count ? `${file.page_count} pages delivered through the protected NoteVault viewer.` : "Protected reading experience inside NoteVault.",
    file.unit_label ? `Covers ${file.unit_label} with secure return access from your library.` : "Easy return access from your library dashboard."
  ];
}

function buildProductFacts(file, formattedDate) {
  return [
    { label: "Product type", value: "Protected PDF note" },
    { label: "Delivery", value: "Secure online viewer" },
    { label: "Subject", value: file.subject || "General study material" },
    { label: "Course", value: file.course || "Not specified" },
    { label: "Semester", value: file.semester || "Not specified" },
    { label: "Unit / Topic", value: file.unit_label || "Not specified" },
    { label: "Pages", value: file.page_count ? `${file.page_count} pages` : "Not specified" },
    { label: "Added to catalog", value: formattedDate },
    { label: "Product ID", value: `#${file.id}` }
  ];
}

export default function FileDetailPage({ file, relatedFiles = [], errorMessage }) {
  const router = useRouter();
  const [purchaseState, setPurchaseState] = useState({
    loading: false,
    message: "",
    error: ""
  });
  const [accessState, setAccessState] = useState({
    loading: true,
    isLoggedIn: false,
    isAdmin: false,
    hasPurchased: false,
    purchaseRecord: null
  });

  const pageTitle = file ? `${file.title} | NoteVault` : "File details | NoteVault";
  const pageDescription = file
    ? `${file.description || file.title} ${file.subject ? `Explore ${file.subject} details, pricing, and protected viewer access.` : "Explore details, pricing, and protected viewer access."}`
    : "Browse NoteVault product details.";
  const formattedPrice = useMemo(() => Number(file?.price || 0).toFixed(2), [file?.price]);
  const formattedDate = useMemo(() => {
    if (!file?.created_at) {
      return "Recently added";
    }

    return new Date(file.created_at).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }, [file?.created_at]);
  const metaChips = useMemo(() => [file?.subject, file?.course, file?.semester, file?.unit_label].filter(Boolean), [file]);
  const productHighlights = useMemo(() => (file ? buildProductHighlights(file) : []), [file]);
  const productFacts = useMemo(() => (file ? buildProductFacts(file, formattedDate) : []), [file, formattedDate]);

  useEffect(() => {
    const token = getStoredToken();

    if (!token || !file) {
      setAccessState({
        loading: false,
        isLoggedIn: false,
        isAdmin: false,
        hasPurchased: false,
        purchaseRecord: null
      });
      return;
    }

    Promise.all([fetchCurrentUser(token), fetchMyPurchases(token)])
      .then(([user, purchases]) => {
        const purchaseRecord = purchases.find((purchase) => Number(purchase.file_id) === Number(file.id)) || null;

        setAccessState({
          loading: false,
          isLoggedIn: true,
          isAdmin: user.role === "admin",
          hasPurchased: Boolean(purchaseRecord),
          purchaseRecord
        });
      })
      .catch(() => {
        setAccessState({
          loading: false,
          isLoggedIn: false,
          isAdmin: false,
          hasPurchased: false,
          purchaseRecord: null
        });
      });
  }, [file]);

  async function handlePurchase() {
    if (!file) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setPurchaseState({ loading: true, message: "Preparing secure checkout...", error: "" });

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Razorpay checkout could not be loaded. Please check your internet connection.");
      }

      const orderData = await createPaymentOrder(token, file.id);
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "NoteVault",
        description: file.title,
        order_id: orderData.order.id,
        handler: async function (response) {
          setPurchaseState({ loading: true, message: "Verifying payment...", error: "" });

          try {
            await verifyPayment(token, {
              fileId: file.id,
              ...response
            });

            setAccessState((current) => ({
              ...current,
              hasPurchased: true,
              purchaseRecord: {
                ...(current.purchaseRecord || {}),
                created_at: new Date().toISOString()
              }
            }));
            setPurchaseState({
              loading: false,
              message: "Payment successful. Viewer access is now unlocked for this product.",
              error: ""
            });
          } catch (verificationError) {
            setPurchaseState({
              loading: false,
              message: "",
              error: verificationError.message
            });
          }
        },
        modal: {
          ondismiss: function () {
            setPurchaseState({
              loading: false,
              message: "Checkout was closed before payment completed.",
              error: ""
            });
          }
        },
        theme: {
          color: "#171511"
        }
      });

      razorpay.open();
      setPurchaseState((current) => ({
        ...current,
        loading: false,
        message: current.message,
        error: ""
      }));
    } catch (purchaseError) {
      setPurchaseState({
        loading: false,
        message: "",
        error: purchaseError.message
      });
    }
  }

  function renderPrimaryAction() {
    if (!file) {
      return null;
    }

    if (accessState.loading) {
      return (
        <Button size="lg" className="w-full" disabled>
          Checking access...
        </Button>
      );
    }

    if (!accessState.isLoggedIn) {
      return (
        <Button size="lg" className="w-full" asChild>
          <Link href="/login">Login to buy this note</Link>
        </Button>
      );
    }

    if (accessState.isAdmin || accessState.hasPurchased) {
      return (
        <Button size="lg" className="w-full" asChild>
          <Link href={`/viewer/${file.id}`}>{accessState.isAdmin ? "Open secure viewer" : "Open your viewer access"}</Link>
        </Button>
      );
    }

    return (
      <Button size="lg" className="w-full" onClick={handlePurchase} disabled={purchaseState.loading}>
        {purchaseState.loading ? "Processing..." : `Buy for Rs. ${formattedPrice}`}
      </Button>
    );
  }

  function renderSecondaryMessage() {
    if (accessState.loading) {
      return "Checking your account status for this product.";
    }

    if (!accessState.isLoggedIn) {
      return "Sign in first, then you can complete checkout and unlock viewer access.";
    }

    if (accessState.isAdmin) {
      return "Your admin account can review this product directly without creating a purchase record.";
    }

    if (accessState.hasPurchased) {
      return "This note is already in your library. You can open the secure viewer any time.";
    }

    return "Complete checkout to unlock viewer access. The viewer stays hidden until the purchase is verified.";
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {file ? <meta property="og:title" content={pageTitle} /> : null}
        {file ? <meta property="og:description" content={pageDescription} /> : null}
      </Head>
      <AppShell>
        <section className="space-y-8 py-8 sm:py-12">
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-medium text-[#5a5449] transition hover:text-[#171511]">
            <ArrowLeft className="size-4" />
            Back to browse
          </Link>

          {!file ? (
            <Card>
              <CardContent className="space-y-4 p-8">
                <h1 className="text-3xl font-semibold text-[#171511]">File unavailable</h1>
                <p className="text-[#5a5449]">{errorMessage || "We could not load this file right now. Please try again once the backend is ready."}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                  <Card>
                    <CardContent className="space-y-6 p-8">
                      <div className="relative overflow-hidden rounded-[2rem] border border-[#171511]/8 bg-gradient-to-br from-[#efe0be] via-[#f8f3ea] to-[#dce6d4] p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.72),_transparent_34%)]" />
                        <div className="relative flex min-h-[280px] flex-col justify-between gap-8 sm:min-h-[340px]">
                          <div className="flex flex-wrap items-center gap-3">
                            <PricePill price={file.price} />
                            <span className="rounded-full border border-[#171511]/10 bg-white/80 px-4 py-2 text-sm text-[#5a5449]">Secure PDF access</span>
                            <span className="rounded-full border border-[#171511]/10 bg-white/80 px-4 py-2 text-sm text-[#5a5449]">Updated {formattedDate}</span>
                            {file.is_featured ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-[#171511]/10 bg-white/80 px-4 py-2 text-sm text-[#171511]">
                                <Sparkles className="size-4" />
                                Featured listing
                              </span>
                            ) : null}
                            {accessState.hasPurchased ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-[#171511] px-4 py-2 text-sm font-medium text-[#fffdf8]">
                                <CheckCircle2 className="size-4" />
                                In your library
                              </span>
                            ) : null}
                          </div>

                          <div className="relative ml-auto w-full max-w-[300px] overflow-hidden rounded-[1.6rem] border border-white/70 bg-white shadow-[0_20px_44px_rgba(55,48,37,0.12)]">
                            <PdfThumbnail fileUrl={file.file_url} thumbnail={file.thumbnail} alt={file.title} className="h-full w-full object-cover" fallbackLabel="Page 1 preview" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {metaChips.length ? (
                          <div className="flex flex-wrap gap-2">
                            {metaChips.map((chip) => (
                              <span key={chip} className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">
                                {chip}
                              </span>
                            ))}
                            {file.page_count ? <span className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">{file.page_count} pages</span> : null}
                          </div>
                        ) : null}
                        <h1 className="font-heading text-4xl font-semibold tracking-tight text-[#171511] sm:text-5xl">{file.title}</h1>
                        <p className="max-w-3xl text-lg leading-8 text-[#5a5449]">{file.description || "Premium protected content managed through NoteVault."}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                          <Sparkles className="size-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#171511]">Why students buy this</h3>
                        <div className="space-y-3 text-sm leading-7 text-[#5a5449]">
                          {productHighlights.map((point) => (
                            <div key={point} className="rounded-[1.2rem] border border-[#171511]/8 bg-white px-4 py-3">
                              {point}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                          <LayoutGrid className="size-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#171511]">Product snapshot</h3>
                        <div className="space-y-3 text-sm text-[#5a5449]">
                          {productFacts.map((fact) => (
                            <div key={fact.label} className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[#171511]/8 bg-white px-4 py-3">
                              <span>{fact.label}</span>
                              <span className="text-right font-medium text-[#171511]">{fact.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardContent className="space-y-5 p-6">
                      <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                        <FileLock2 className="size-6" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-[#171511]">Purchase and access</h2>
                        <p className="text-[#5a5449]">{renderSecondaryMessage()}</p>
                      </div>
                      {renderPrimaryAction()}
                      {accessState.isLoggedIn && !accessState.isAdmin && !accessState.hasPurchased ? (
                        <div className="rounded-[1.4rem] border border-dashed border-[#171511]/10 bg-[#fbf7f1] px-4 py-4 text-sm leading-7 text-[#5a5449]">
                          After a successful payment, this product is added to your account automatically and the secure viewer button becomes available here and in your library.
                        </div>
                      ) : null}
                      {purchaseState.message ? <p className="text-sm text-[#5f6f52]">{purchaseState.message}</p> : null}
                      {purchaseState.error ? <p className="text-sm text-[#b36e58]">{purchaseState.error}</p> : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                        <ShieldCheck className="size-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#171511]">Protected delivery</h3>
                      <ul className="space-y-3 text-sm leading-6 text-[#5a5449]">
                        <li>Viewer access requires login plus a verified purchase record.</li>
                        <li>Each session shows the signed-in user email and live timestamp as a watermark.</li>
                        <li>Right-click, print shortcuts, and text selection are blocked in the viewer surface.</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="inline-flex rounded-2xl bg-[#ede4d5] p-3 text-[#8f725a]">
                        <GraduationCap className="size-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#171511]">Best for</h3>
                      <div className="space-y-3 text-sm leading-7 text-[#5a5449]">
                        <div className="rounded-[1.2rem] border border-[#171511]/8 bg-white px-4 py-3">
                          Students who want a structured product page before paying, not a random PDF link.
                        </div>
                        <div className="rounded-[1.2rem] border border-[#171511]/8 bg-white px-4 py-3">
                          Buyers who want secure return access from their library after checkout.
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-3 p-6 text-sm text-[#5a5449]">
                      <div className="flex items-center justify-between gap-4">
                        <span>Backend source</span>
                        <span className="truncate text-right text-[#7a7368]">{API_BASE_URL}</span>
                      </div>
                      {accessState.purchaseRecord?.created_at ? (
                        <div className="flex items-center justify-between gap-4">
                          <span>Purchased on</span>
                          <span className="text-right text-[#7a7368]">
                            {new Date(accessState.purchaseRecord.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-4">
                        <span>Catalog status</span>
                        <span className="text-right text-[#7a7368]">{file.is_featured ? "Featured listing" : "Live now"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {relatedFiles.length ? (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-5 text-[#7a7368]" />
                    <div>
                      <h2 className="text-3xl font-semibold text-[#171511]">More notes from the catalog</h2>
                      <p className="mt-1 text-[#5a5449]">Keep browsing related products before you leave the storefront.</p>
                    </div>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-3">
                    {relatedFiles.map((relatedFile, index) => (
                      <FileCard key={relatedFile.id} file={relatedFile} index={index} />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </section>
      </AppShell>
    </>
  );
}

export async function getServerSideProps(context) {
  try {
    const [file, allFiles] = await Promise.all([fetchFileById(context.params.id), fetchFiles()]);
    const relatedFiles = (allFiles || [])
      .filter((item) => Number(item.id) !== Number(context.params.id))
      .sort((a, b) => {
        const scoreA = Number(a.subject && file.subject && a.subject === file.subject) + Number(a.course && file.course && a.course === file.course);
        const scoreB = Number(b.subject && file.subject && b.subject === file.subject) + Number(b.course && file.course && b.course === file.course);

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3);

    return {
      props: {
        file,
        relatedFiles
      }
    };
  } catch (error) {
    return {
      props: {
        file: null,
        relatedFiles: [],
        errorMessage: error.message
      }
    };
  }
}
