import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  BookOpenText, FolderKanban, LogOut,
  ShieldCheck, Store, Wallet,
} from "lucide-react";

import { AppShell }          from "@/components/layout/app-shell";
import { Button }            from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import {
  fetchCurrentUser, fetchDownloadPassword,
  fetchMyPurchases, logoutUser,
} from "@/lib/api";

function purchaseMeta(purchase) {
  return [purchase.subject, purchase.course, purchase.semester, purchase.unit_label].filter(Boolean);
}

export default function DashboardPage() {
  const router = useRouter();
  const [user,          setUser]          = useState(null);
  const [purchases,     setPurchases]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [loggingOut,    setLoggingOut]    = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace("/login"); return; }

    Promise.all([fetchCurrentUser(token), fetchMyPurchases(token)])
      .then(([currentUser, purchaseData]) => {
        setUser(currentUser);
        setPurchases(purchaseData);
      })
      .catch((err) => {
        clearStoredToken();
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    const token = getStoredToken();
    setLoggingOut(true);
    try {
      if (token) await logoutUser(token);
    } catch (err) {
      setError(err.message);
    } finally {
      clearStoredToken();
      router.push("/login");
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Head><title>Dashboard | NoteVault</title></Head>
      <AppShell>
        <section className="space-y-6 py-6 sm:space-y-8 sm:py-10">

          {/* ── Page header ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">
                {user?.role === "admin" ? "Admin dashboard" : "Student dashboard"}
              </p>
              <h1 className="mt-2 font-heading text-2xl text-[#171511] sm:text-3xl lg:text-4xl">
                {user?.role === "admin"
                  ? "Manage your catalog from one place"
                  : "Your NoteVault library"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user?.role === "admin" && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/admin">Admin panel</a>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="mr-1.5 size-3.5" />
                {loggingOut ? "Logging out…" : "Logout"}
              </Button>
            </div>
          </div>

          {loading ? (
            <Card><CardContent className="p-6 text-[#5a5449]">Loading your account…</CardContent></Card>
          ) : error && !user ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold text-[#171511]">Session unavailable</h2>
                <p className="text-[#5a5449]">{error}</p>
                <Button asChild><a href="/login">Go to login</a></Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ── Account overview ── */}
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardContent className="space-y-5 p-5 sm:p-8">
                    <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                      <ShieldCheck className="size-5 sm:size-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-[#171511] sm:text-3xl">
                        Welcome, {user?.name}
                      </h2>
                      <p className="mt-2 text-sm text-[#5a5449] sm:text-base">
                        {user?.role === "admin"
                          ? "Your admin account can upload products, manage the storefront, and review the live catalog."
                          : "Your account is ready for purchases, secure viewing, and easy access to your bought notes."}
                      </p>
                    </div>
                    {/* Email + Role — side by side on any screen ≥ sm */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="rounded-[1.4rem] border border-[#171511]/8 bg-white p-4 sm:rounded-[1.7rem]">
                        <div className="text-xs text-[#7a7368] sm:text-sm">Email</div>
                        <div className="mt-1.5 break-all text-sm font-semibold text-[#171511] sm:text-lg">{user?.email}</div>
                      </div>
                      <div className="rounded-[1.4rem] border border-[#171511]/8 bg-white p-4 sm:rounded-[1.7rem]">
                        <div className="text-xs text-[#7a7368] sm:text-sm">Role</div>
                        <div className="mt-1.5 text-sm font-semibold capitalize text-[#171511] sm:text-lg">{user?.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                      <Wallet className="size-5 sm:size-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#171511] sm:text-2xl">
                      {user?.role === "admin" ? "Admin overview" : "Account overview"}
                    </h3>
                    <p className="text-sm text-[#5a5449] sm:text-base">
                      {user?.role === "admin"
                        ? "Keep the storefront updated, upload new notes, and check the public catalog."
                        : purchases.length
                          ? `You own ${purchases.length} note product${purchases.length !== 1 ? "s" : ""}. Open any item below to continue reading.`
                          : "Your purchase history and secure note access live here."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* ── Admin section ── */}
              {user?.role === "admin" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {[
                      { icon: FolderKanban, color: "bg-[#ede4d5] text-[#8f725a]", title: "Admin tools", desc: "Upload, review, or remove note products.", href: "/admin", label: "Open admin panel" },
                      { icon: Store,        color: "bg-[#eff4ea] text-[#5f6f52]",  title: "Storefront review", desc: "See the catalog students land on.", href: "/browse", label: "Open catalog" },
                    ].map(({ icon: Icon, color, title, desc, href, label }) => (
                      <Card key={title}>
                        <CardContent className="space-y-3 p-5 sm:p-6">
                          <div className={`inline-flex rounded-2xl p-3 ${color}`}><Icon className="size-5 sm:size-6" /></div>
                          <h3 className="text-lg font-semibold text-[#171511] sm:text-xl">{title}</h3>
                          <p className="text-sm text-[#5a5449]">{desc}</p>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={href}>{label}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <Card>
                      <CardContent className="space-y-3 p-5 sm:p-6">
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Workspace note</div>
                        <p className="text-sm text-[#5a5449]">Student purchase widgets are hidden here so the admin dashboard stays focused on management.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="space-y-4 p-5 sm:p-8">
                      <h2 className="text-2xl font-semibold text-[#171511] sm:text-3xl">Admin quick actions</h2>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Button asChild><Link href="/admin">Go to admin panel</Link></Button>
                        <Button variant="ghost" asChild><Link href="/browse">Preview student catalog</Link></Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* ── Student stats ── */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="space-y-3 p-5 sm:p-6">
                        <div className="inline-flex rounded-2xl bg-[#ede4d5] p-3 text-[#8f725a]"><BookOpenText className="size-5" /></div>
                        <h3 className="text-lg font-semibold text-[#171511]">My notes</h3>
                        <div className="text-3xl font-semibold text-[#171511]">{purchases.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="space-y-3 p-5 sm:p-6">
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Device security</div>
                        <p className="text-sm text-[#5a5449]">One-device sessions — older logins can be invalidated when a new device signs in.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="space-y-3 p-5 sm:p-6">
                        <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]"><FolderKanban className="size-5" /></div>
                        <h3 className="text-lg font-semibold text-[#171511]">Browse more</h3>
                        <p className="text-sm text-[#5a5449]">Discover more products and buy new material.</p>
                        <Button variant="ghost" size="sm" asChild><Link href="/browse">Open catalog</Link></Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ── Purchased notes list ── */}
                  <Card>
                    <CardContent className="space-y-5 p-5 sm:p-8">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold text-[#171511] sm:text-3xl">Purchased notes</h2>
                          <p className="mt-1 text-sm text-[#5a5449]">Products linked to your account.</p>
                        </div>
                        {purchases.length === 0 && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/browse">Browse catalog</Link>
                          </Button>
                        )}
                      </div>

                      {purchases.length === 0 ? (
                        <div className="rounded-[1.6rem] border border-dashed border-[#171511]/12 bg-white/65 px-5 py-10 text-center text-sm text-[#5a5449]">
                          <div className="font-medium">No purchases yet.</div>
                          <div className="mt-2 text-xs">Open the catalog to explore notes and unlock viewer access after checkout.</div>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {purchases.map((purchase) => (
                            <div
                              key={purchase.id}
                              className="rounded-[1.5rem] border border-[#171511]/8 bg-white p-4 sm:p-5"
                            >
                              {/* Title + meta */}
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a7368]">
                                  Purchase #{purchase.id}
                                </div>
                                <div className="mt-1.5 text-lg font-semibold text-[#171511] sm:text-xl">
                                  {purchase.title}
                                </div>
                                <div className="mt-1 text-sm text-[#5a5449] line-clamp-2">
                                  {purchase.description || "Purchased note product"}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {purchaseMeta(purchase).map((item) => (
                                    <span key={`${purchase.id}-${item}`} className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-2.5 py-0.5 text-xs font-medium text-[#5a5449]">
                                      {item}
                                    </span>
                                  ))}
                                  {purchase.page_count && (
                                    <span className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-2.5 py-0.5 text-xs font-medium text-[#5a5449]">
                                      {purchase.page_count} pages
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Price + date + actions */}
                              <div className="mt-4 flex flex-col gap-3 border-t border-[#171511]/6 pt-4">
                                {/* Price + date row */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="rounded-full bg-[#f5ecdf] px-3 py-1 text-sm font-medium text-[#171511]">
                                    Rs. {Number(purchase.price).toFixed(2)}
                                  </div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-[#7a7368]">
                                    {purchase.created_at
                                      ? new Date(purchase.created_at).toLocaleDateString(undefined, {
                                          year: "numeric", month: "short", day: "numeric",
                                        })
                                      : "In your library"}
                                  </div>
                                </div>
                                {/* Action buttons — full-width stacked on mobile, row on sm+ */}
                                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                                  <Button variant="ghost" size="sm" asChild className="justify-center">
                                    <Link href={`/files/${purchase.file_id}`}>View product</Link>
                                  </Button>
                                  <Button size="sm" asChild className="justify-center">
                                    <Link href={`/viewer/${purchase.file_id}`}>Open viewer</Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="col-span-2 justify-center sm:col-span-1"
                                    onClick={async () => {
                                      const token = getStoredToken();
                                      try {
                                        const data = await fetchDownloadPassword(token, purchase.file_id);
                                        if (data.hasPassword) {
                                          setPasswordModal({ fileId: purchase.file_id, title: purchase.title, password: data.password });
                                        } else {
                                          setPasswordModal({ fileId: purchase.file_id, title: purchase.title, password: null });
                                        }
                                      } catch (e) { alert(e.message); }
                                    }}
                                  >
                                    🔑 Password
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </section>
      </AppShell>

      {/* ── Password modal ── */}
      {passwordModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 sm:items-center sm:pb-0"
          onClick={() => setPasswordModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#171511]/10 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-xl font-semibold text-[#171511]">Download Password</h3>
            <p className="mt-1 text-sm text-[#5a5449]">{passwordModal.title}</p>

            {passwordModal.password ? (
              <>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#171511]/10 bg-[#f8f3ea] px-4 py-3">
                  <span className="font-mono text-lg font-bold tracking-widest text-[#171511]">
                    {passwordModal.password}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(passwordModal.password)}
                    className="rounded-xl border border-[#171511]/10 bg-white px-3 py-1.5 text-xs font-medium text-[#171511] transition hover:bg-[#f0e8da]"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-3 text-xs text-[#7a7368]">
                  Use this password to open the encrypted PDF in any PDF reader after downloading from the viewer.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-[#5a5449]">
                No download password has been set for this file — the downloaded PDF won&apos;t require a password.
              </p>
            )}

            <button
              onClick={() => setPasswordModal(null)}
              className="mt-5 w-full rounded-2xl bg-[#171511] py-3 text-sm font-medium text-white transition hover:bg-[#2a251d]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
