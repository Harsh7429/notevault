import Head from "next/head";
import { useMemo, useEffect, useState } from "react";
import { AlertCircle, RefreshCcw, Search } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileCard } from "@/components/file-card";
import { FileCardSkeleton } from "@/components/file-card-skeleton";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { fetchFiles, fetchMyPurchases } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

function normalizeValue(value) {
  return String(value || "").trim();
}

export default function BrowsePage() {
  const [files, setFiles] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const ownedFileIds = useMemo(() => new Set(purchases.map((purchase) => Number(purchase.file_id))), [purchases]);
  const subjects = useMemo(() => Array.from(new Set(files.map((file) => normalizeValue(file.subject)).filter(Boolean))).sort(), [files]);
  const semesters = useMemo(() => Array.from(new Set(files.map((file) => normalizeValue(file.semester)).filter(Boolean))).sort(), [files]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = files.filter((file) => {
      const searchTarget = [file.title, file.description, file.subject, file.course, file.semester, file.unit_label].join(" ").toLowerCase();
      const matchesQuery = !query || searchTarget.includes(query);
      const matchesSubject = subjectFilter === "all" || normalizeValue(file.subject) === subjectFilter;
      const matchesSemester = semesterFilter === "all" || normalizeValue(file.semester) === semesterFilter;

      return matchesQuery && matchesSubject && matchesSemester;
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        sorted.sort((a, b) => {
          if (Boolean(b.is_featured) !== Boolean(a.is_featured)) {
            return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
          }

          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
    }

    return sorted;
  }, [files, search, subjectFilter, semesterFilter, sortBy]);

  async function loadFiles() {
    try {
      setLoading(true);
      setError("");
      const token = getStoredToken();
      const requests = [fetchFiles()];

      if (token) {
        requests.push(fetchMyPurchases(token));
      }

      const [fileData, purchaseData = []] = await Promise.all(requests);
      setFiles(fileData);
      setPurchases(purchaseData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <>
      <Head>
        <title>Browse Notes | NoteVault</title>
      </Head>
      <AppShell>
        <section className="space-y-10 py-8 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <SectionHeading
              eyebrow="Catalog"
              title="Browse the live NoteVault catalog."
              description="Every product here comes from the admin-managed upload panel, so students can scan the collection and open a clean product page before purchase."
            />

            <div className="market-card rounded-[2rem] p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                  <Search className="size-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Student flow</div>
                  <div className="mt-2 text-xl font-semibold text-[#171511]">Search by subject, compare products, then open a stronger sales page.</div>
                  <p className="mt-3 leading-7 text-[#5a5449]">Owned notes are marked directly in the catalog so returning users can jump back into access without guessing.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.8rem] border border-[#171511]/8 bg-white/70 p-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] lg:items-end">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, subject, course, or unit"
                className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Subject</span>
              <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45">
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Semester</span>
              <select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45">
                <option value="all">All semesters</option>
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition focus:border-[#5f6f52]/45">
                <option value="featured">Featured first</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-4 rounded-[1.8rem] border border-[#171511]/8 bg-white/65 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Live catalog</div>
              <div className="mt-1 text-sm text-[#5a5449]">
                {filteredFiles.length} result{filteredFiles.length === 1 ? "" : "s"} shown from {files.length} product{files.length === 1 ? "" : "s"}{purchases.length ? `, ${purchases.length} already in your library.` : "."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => {
                setSearch("");
                setSubjectFilter("all");
                setSemesterFilter("all");
                setSortBy("featured");
              }}>
                Reset filters
              </Button>
              <Button variant="ghost" onClick={loadFiles}>
                <RefreshCcw className="mr-2 size-4" />
                Refresh catalog
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <FileCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="market-card rounded-[2rem] p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                  <AlertCircle className="size-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-[#171511]">Catalog unavailable</h3>
                  <p className="max-w-2xl text-[#5a5449]">
                    The storefront could not load products right now. This usually means the backend server is not running, the database is unavailable, or the API is temporarily unreachable.
                  </p>
                  <p className="text-sm text-[#7a7368]">Technical detail: {error}</p>
                </div>
              </div>
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              title="No notes uploaded yet"
              description="Once an admin uploads notes or PDFs, they will appear here automatically as products students can open and buy."
            />
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              title="No products match these filters"
              description="Try clearing some filters or searching with fewer keywords to widen the catalog results."
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
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
