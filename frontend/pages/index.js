import Head from "next/head";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { ArrowRight, Check, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { FileCard } from "@/components/file-card";
import { FileCardSkeleton } from "@/components/file-card-skeleton";
import { Navbar } from "@/components/Navbar";
import {
  featureColumns,
  featuredCollections,
  heroStats,
  platformSteps,
  previewProducts,
  trustPoints
} from "@/data/notevaultHomeData";
import { fetchFiles } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

function pickFeatured(files) {
  const featured = files.filter((file) => file.is_featured);
  return (featured.length ? featured : files).slice(0, 3);
}

function pickNewest(files) {
  return [...files]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
}

export default function HomePage() {
  const scrollRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"]
  });

  const featuredFiles = useMemo(() => pickFeatured(files), [files]);
  const newestFiles = useMemo(() => pickNewest(files), [files]);
  const subjectCount = useMemo(() => new Set(files.map((file) => file.subject).filter(Boolean)).size, [files]);

  useEffect(() => {
    setHasToken(Boolean(getStoredToken()));

    fetchFiles()
      .then((data) => {
        setFiles(data);
      })
      .catch(() => {
        setFiles([]);
      })
      .finally(() => {
        setLoadingFiles(false);
      });
  }, []);

  return (
    <>
      <Head>
        <title>NoteVault | Secure Notes Marketplace</title>
        <meta
          name="description"
          content="Browse premium study notes and PDFs in a clean marketplace, purchase securely, and access them inside NoteVault's protected viewer."
        />
      </Head>

      <main ref={scrollRef} className="min-h-screen bg-[#f6f1e8] text-[#161616]">
        <Navbar scrollYProgress={scrollYProgress} />

        <section className="relative overflow-hidden px-4 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:pt-36">
          <div className="absolute inset-0 soft-grid opacity-60" />
          <div className="home-orb absolute -left-10 top-24 h-52 w-52 rounded-full bg-[#e8dac2]" />
          <div className="home-orb absolute right-0 top-0 h-72 w-72 rounded-full bg-[#dce4d3]" />
          <div className="home-orb absolute bottom-12 right-20 h-56 w-56 rounded-full bg-[#edcfc6]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex rounded-full border border-[#171511]/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#5b564c] backdrop-blur-xl">
                Curated notes. Secure access. Clean buying flow.
              </div>

              <div className="space-y-6">
                <h1 className="max-w-4xl font-heading text-4xl leading-[1.05] text-[#171511] sm:text-5xl lg:text-7xl">
                  A cleaner way for students to discover and buy premium notes.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[#4b463d] sm:text-xl">
                  {hasToken
                    ? "You are signed in, so you can jump straight into the catalog, open product pages, and return to your library anytime."
                    : "Admin uploads stay behind the scenes. Students land on a clear storefront, open a product page, pay securely, and read inside the platform."}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center rounded-full bg-[#171511] px-6 py-3 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#2b271f]"
                >
                  Explore Notes
                  <ArrowRight className="ml-2 size-4" />
                </Link>
                {hasToken ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-[#171511]/12 bg-white/70 px-6 py-3 text-sm font-semibold text-[#171511] transition hover:bg-white"
                  >
                    Go to My Library
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-full border border-[#171511]/12 bg-white/70 px-6 py-3 text-sm font-semibold text-[#171511] transition hover:bg-white"
                  >
                    Create Account
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {heroStats.map((item) => (
                  <div key={item.label} className="market-card rounded-[1.5rem] p-3 sm:p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">{item.label}</div>
                    <div className="mt-3 text-3xl font-semibold text-[#171511]">{item.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="relative"
            >
              <div className="market-card relative overflow-hidden rounded-[2.4rem] p-5 sm:p-6">
                <div className="rounded-[2rem] bg-[#faf6ef] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="flex items-center justify-between border-b border-[#171511]/8 pb-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#7f786d]">Live shelf</div>
                      <div className="mt-2 text-2xl font-semibold text-[#171511]">What students can open right now</div>
                    </div>
                    <div className="rounded-full border border-[#171511]/10 bg-white px-3 py-1 text-xs font-semibold text-[#5f6f52]">
                      Product pages
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {(featuredFiles.length > 0 ? featuredFiles : previewProducts).map((product, index) => (
                      <Link
                        key={product.id || product.title}
                        href={product.id ? `/files/${product.id}` : "/browse"}
                        className="grid gap-4 rounded-[1.6rem] border border-[#171511]/8 bg-white p-4 transition hover:border-[#171511]/16 hover:shadow-[0_18px_36px_rgba(80,68,48,0.08)] sm:grid-cols-[96px_1fr_auto] sm:items-center"
                      >
                        <div
                          className="flex aspect-[4/5] items-end rounded-[1.2rem] p-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#171511]"
                          style={{ background: index === 0 ? "linear-gradient(180deg,#efe0be,#d5c09a)" : index === 1 ? "linear-gradient(180deg,#dce6d4,#b6c6a9)" : "linear-gradient(180deg,#f2d8d0,#d8a99c)" }}
                        >
                          PDF
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f786d]">{product.subject || "Uploaded product"}</div>
                          <div className="mt-2 text-xl font-semibold text-[#171511]">{product.title}</div>
                          <div className="mt-2 text-sm text-[#686153]">{product.meta || product.description || "Open the product page to review details and continue to checkout."}</div>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <div className="rounded-full bg-[#171511] px-3 py-1 text-sm font-semibold text-[#fffdf8]">{typeof product.price === "number" ? `Rs. ${Number(product.price).toFixed(2)}` : product.price}</div>
                          <div className="text-xs uppercase tracking-[0.22em] text-[#7f786d]">Open product</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Featured catalog</div>
                <h2 className="mt-3 font-heading text-4xl text-[#171511] sm:text-5xl">Uploaded products should be easy to spot the moment someone lands here.</h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#5a5449]">
                This section pushes attention toward the live storefront first, instead of burying products behind generic landing-page copy.
              </p>
            </div>

            {loadingFiles ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <FileCardSkeleton key={index} />
                ))}
              </div>
            ) : files.length === 0 ? (
              <EmptyState
                title="No products uploaded yet"
                description="Once an admin uploads notes, they will appear here on the homepage and in the browse catalog."
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {files.slice(0, 6).map((file, index) => (
                  <FileCard key={file.id} file={file} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {files.length ? (
          <section className="px-6 py-6 sm:px-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-7xl rounded-[2.4rem] border border-[#171511]/10 bg-white/72 p-6 shadow-[0_20px_60px_rgba(82,68,45,0.06)] sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Storefront pulse</div>
                  <h2 className="mt-3 font-heading text-3xl text-[#171511] sm:text-4xl">The catalog now has {files.length} live products across {subjectCount || 1} subject{subjectCount === 1 ? "" : "s"}.</h2>
                </div>
                <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-[#171511] transition hover:text-[#5f6f52]">
                  View full catalog
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {newestFiles.map((file, index) => (
                  <div key={file.id} className="rounded-[1.8rem] border border-[#171511]/8 bg-[#faf6ef] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a7368]">New arrival</div>
                        <div className="mt-2 text-xl font-semibold text-[#171511]">{file.title}</div>
                      </div>
                      {file.is_featured ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#171511] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#fffdf8]">
                          <Sparkles className="size-3.5" />
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-sm leading-7 text-[#5a5449]">{file.description || "Freshly added to the catalog and ready for product-page review."}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[file.subject, file.semester, file.unit_label].filter(Boolean).slice(0, 3).map((item) => (
                        <span key={`${file.id}-${item}`} className="rounded-full border border-[#171511]/8 bg-white px-3 py-1 text-xs font-medium text-[#5f584d]">
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <span className="rounded-full bg-[#f5ecdf] px-3 py-1 text-sm font-medium text-[#171511]">Rs. {Number(file.price).toFixed(2)}</span>
                      <Link href={`/files/${file.id}`} className="text-sm font-semibold text-[#171511] transition hover:text-[#5f6f52]">
                        Open product
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-4 py-10 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="market-card rounded-[2.2rem] p-8 sm:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">How it works</div>
              <h2 className="mt-4 font-heading text-4xl text-[#171511] sm:text-5xl">Admin uploads notes. Students buy. Access stays inside NoteVault.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#5a5449]">
                The product story should be obvious in seconds, without mixing admin operations into the student-facing experience.
              </p>

              <div className="mt-8 grid gap-4">
                {platformSteps.map((item) => (
                  <div key={item.step} className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8174]">Step {item.step}</div>
                    <div className="mt-2 text-xl font-semibold text-[#171511]">{item.title}</div>
                    <div className="mt-2 leading-7 text-[#5f584d]">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="market-card rounded-[2.2rem] p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                    <Search className="size-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8174]">Catalog experience</div>
                    <div className="mt-2 text-2xl font-semibold text-[#171511]">Users should move from homepage to product page without confusion.</div>
                  </div>
                </div>
                <p className="mt-5 leading-8 text-[#5f584d]">
                  The store should feel focused: browse products, open one, review the details, and continue into payment and secure access.
                </p>
              </div>

              <div className="market-card rounded-[2.2rem] p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8174]">Protected access</div>
                    <div className="mt-2 text-2xl font-semibold text-[#171511]">Students can read securely, but casual downloading becomes much harder.</div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3 rounded-[1.2rem] border border-[#171511]/8 bg-white px-4 py-3 text-[#514b40]">
                      <Check className="mt-0.5 size-4 text-[#5f6f52]" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-7xl rounded-[2.6rem] bg-[#171511] px-6 py-12 text-[#f9f4ec] sm:px-8 lg:px-12 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c8bba7]">Why it works</div>
                <h2 className="mt-4 font-heading text-4xl text-white sm:text-5xl">Admin management stays in the back. Student buying stays in the front.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {featureColumns.map((column) => (
                  <div key={column.title} className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c7bbab]">{column.eyebrow}</div>
                    <div className="mt-3 text-xl font-semibold text-white">{column.title}</div>
                    <div className="mt-3 leading-7 text-[#d8cec0]">{column.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 pt-8 sm:px-8 lg:px-10 lg:pb-24">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-[2.6rem] border border-[#171511]/10 bg-white/70 px-6 py-12 shadow-[0_24px_70px_rgba(82,68,45,0.08)] sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Collections</div>
              <h2 className="mt-4 font-heading text-4xl text-[#171511] sm:text-5xl">Keep the storefront focused, but still show students what kind of notes they can expect.</h2>
            </div>

            <div className="grid gap-4 lg:max-w-md">
              {featuredCollections.map((collection, index) => (
                <div key={collection.title} className="rounded-[1.8rem] border border-[#171511]/10 bg-[#f9f4eb] p-5">
                  <div
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#5a5449]"
                    style={{ background: index === 0 ? "rgba(217,200,169,0.35)" : index === 1 ? "rgba(197,212,187,0.45)" : "rgba(227,190,179,0.42)" }}
                  >
                    {collection.accent}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-[#171511]">{collection.title}</h3>
                  <p className="mt-2 text-sm font-medium text-[#2f2c27]">{collection.subtitle}</p>
                  <p className="mt-3 text-sm leading-7 text-[#625b50]">{collection.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
