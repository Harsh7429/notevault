import Head from "next/head";
import { useMemo, useEffect, useState } from "react";
import { AlertCircle, RefreshCcw, Search } from "lucide-react";

import { AppShell }         from "@/components/layout/app-shell";
import { EmptyState }       from "@/components/empty-state";
import { FileCard }         from "@/components/file-card";
import { FileCardSkeleton } from "@/components/file-card-skeleton";
import { Button }           from "@/components/ui/button";
import { fetchAllFiles, fetchMyPurchases } from "@/lib/api";
import { getStoredToken }   from "@/lib/auth";

function normalizeValue(value) {
  return String(value || "").trim();
}

export default function BrowsePage() {
  const [files,          setFiles]          = useState([]);
  const [purchases,      setPurchases]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [subjectFilter,  setSubjectFilter]  = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [sortBy,         setSortBy]         = useState("featured");

  const ownedFileIds = useMemo(
    () => new Set(purchases.map((p) => Number(p.file_id))),
    [purchases]
  );
  const subjects = useMemo(
    () => Array.from(new Set(files.map((f) => normalizeValue(f.subject)).filter(Boolean))).sort(),
    [files]
  );
  const semesters = useMemo(
    () => Array.from(new Set(files.map((f) => normalizeValue(f.semester)).filter(Boolean))).sort(),
    [files]
  );

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = files.filter((f) => {
      const target = [f.title, f.description, f.subject, f.course, f.semester, f.unit_label].join(" ").toLowerCase();
      return (
        (!q || target.includes(q)) &&
        (subjectFilter  === "all" || normalizeValue(f.subject)  === subjectFilter) &&
        (semesterFilter === "all" || normalizeValue(f.semester) === semesterFilter)
      );
    });
    const sorted = [...filtered];
    switch (sortBy) {
      case "price-asc":  sorted.sort((a, b) => Number(a.price) - Number(b.price));                    break;
      case "price-desc": sorted.sort((a, b) => Number(b.price) - Number(a.price));                    break;
      case "title":      sorted.sort((a, b) => a.title.localeCompare(b.title));                       break;
      case "newest":     sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));      break;
      default:
        sorted.sort((a, b) => {
          if (Boolean(b.is_featured) !== Boolean(a.is_featured))
            return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
          return new Date(b.created_at) - new Date(a.created_at);
        });
    }
    return sorted;
  }, [files, search, subjectFilter, semesterFilter, sortBy]);

  async function loadFiles() {
    try {
      setLoading(true);
      setError("");
      const token = getStoredToken();
      const reqs  = [fetchAllFiles()];
      if (token) reqs.push(fetchMyPurchases(token));
      const [fileData, purchaseData = []] = await Promise.all(reqs);
      setFiles(fileData);
      setPurchases(purchaseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFiles(); }, []);

  function resetFilters() {
    setSearch("");
    setSubjectFilter("all");
    setSemesterFilter("all");
    setSortBy("featured");
  }

  return (
    <>
      <Head><title>Browse Notes | NoteVault</title></Head>
      <AppShell>
        <section className="space-y-6 py-6 sm:space-y-8 sm:py-10">

          {/* ── Page heading — compact on mobile ── */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Catalog</div>
            <h1 className="mt-2 font-heading text-3xl text-[#171511] sm:text-4xl lg:text-5xl">
              Browse the NoteVault catalog.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5a5449] sm:text-base sm:leading-7">
              Every product comes from the admin upload panel. Open a product page before purchase.
            </p>
          </div>

          {/* ── Filters — 2-col on mobile, 4-col on desktop ── */}
          <div className="grid gap-3 rounded-[1.6rem] border border-[#171511]/8 bg-white/70 p-4 sm:rounded-[1.8rem] sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
            {/* Search spans full width on mobile, 1 col on lg */}
            <label className="block space-y-1.5 sm:col-span-2 lg:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9a9489]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title, subject, course, unit…"
                  className="w-full rounded-2xl border border-[#171511]/10 bg-white py-3 pl-10 pr-4 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Subject</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45"
              >
                <option value="all">All subjects</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Semester</span>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45"
              >
                <option value="all">All semesters</option>
                {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45"
              >
                <option value="featured">Featured first</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
          </div>

          {/* ── Status bar ── */}
          <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[#171511]/8 bg-white/65 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="text-sm text-[#5a5449]">
              <span className="font-semibold text-[#171511]">{filteredFiles.length}</span> result{filteredFiles.length !== 1 && "s"} from{" "}
              <span className="font-semibold text-[#171511]">{files.length}</span> products
              {purchases.length > 0 && ` · ${purchases.length} already owned`}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
              <Button variant="ghost" size="sm" onClick={loadFiles}>
                <RefreshCcw className="mr-1.5 size-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* ── Results ── */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <FileCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="market-card rounded-[2rem] p-6 sm:p-10">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                  <AlertCircle className="size-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[#171511] sm:text-2xl">Catalog unavailable</h3>
                  <p className="text-sm text-[#5a5449] sm:text-base">
                    The storefront could not load products right now.
                  </p>
                  <p className="text-xs text-[#7a7368]">{error}</p>
                </div>
              </div>
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              title="No notes uploaded yet"
              description="Once an admin uploads notes, they appear here automatically."
            />
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              title="No products match these filters"
              description="Try clearing some filters or searching with fewer keywords."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {filteredFiles.map((file, index) => (
                <FileCard key={file.id} file={file} index={index} owned={ownedFileIds.has(Number(file.id))} />
              ))}
            </div>
          )}
        </section>
      </AppShell>
    </>
  );
}
