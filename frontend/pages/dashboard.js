import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BookOpenText, FolderKanban, LogOut, ShieldCheck, Store, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import { fetchCurrentUser, fetchMyPurchases, logoutUser } from "@/lib/api";

function purchaseMeta(purchase) {
  return [purchase.subject, purchase.course, purchase.semester, purchase.unit_label].filter(Boolean);
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    Promise.all([fetchCurrentUser(token), fetchMyPurchases(token)])
      .then(([currentUser, purchaseData]) => {
        setUser(currentUser);
        setPurchases(purchaseData);
      })
      .catch((requestError) => {
        clearStoredToken();
        setError(requestError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    const token = getStoredToken();
    setLoggingOut(true);

    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      clearStoredToken();
      router.push("/login");
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Head>
        <title>Dashboard | NoteVault</title>
      </Head>
      <AppShell>
        <section className="space-y-8 py-8 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">{user?.role === "admin" ? "Admin dashboard" : "Student dashboard"}</p>
              <h1 className="mt-3 font-heading text-4xl text-[#171511] sm:text-5xl">{user?.role === "admin" ? "Manage your catalog from one place" : "Your NoteVault library"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user?.role === "admin" ? (
                <Button variant="ghost" asChild>
                  <a href="/admin">Open admin panel</a>
                </Button>
              ) : null}
              <Button variant="ghost" onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="mr-2 size-4" />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-[#5a5449]">Loading your account...</CardContent>
            </Card>
          ) : error && !user ? (
            <Card>
              <CardContent className="space-y-4 p-8">
                <h2 className="text-2xl font-semibold text-[#171511]">Session unavailable</h2>
                <p className="text-[#5a5449]">{error}</p>
                <Button asChild>
                  <a href="/login">Go to login</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardContent className="space-y-6 p-8">
                    <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold text-[#171511]">Welcome, {user?.name}</h2>
                      <p className="mt-2 text-[#5a5449]">
                        {user?.role === "admin"
                          ? "Your admin account can upload products, manage the storefront, and review the live catalog."
                          : "Your account is ready for purchases, secure viewing, and easy access to your bought notes."}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.7rem] border border-[#171511]/8 bg-white p-5">
                        <div className="text-sm text-[#7a7368]">Email</div>
                        <div className="mt-2 text-lg font-semibold text-[#171511]">{user?.email}</div>
                      </div>
                      <div className="rounded-[1.7rem] border border-[#171511]/8 bg-white p-5">
                        <div className="text-sm text-[#7a7368]">Role</div>
                        <div className="mt-2 text-lg font-semibold capitalize text-[#171511]">{user?.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                      <Wallet className="size-6" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#171511]">{user?.role === "admin" ? "Admin overview" : "Account overview"}</h3>
                    <p className="text-[#5a5449]">
                      {user?.role === "admin"
                        ? "Keep the storefront updated, upload new notes, and check the public catalog before sharing links with students."
                        : purchases.length
                          ? `You already own ${purchases.length} note product${purchases.length === 1 ? "" : "s"}. Open any item below to continue reading.`
                          : "Your purchase history and secure note access live here so you can return to products without searching again."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {user?.role === "admin" ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="inline-flex rounded-2xl bg-[#ede4d5] p-3 text-[#8f725a]">
                          <FolderKanban className="size-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#171511]">Admin tools</h3>
                        <p className="text-[#5a5449]">Go straight to the upload panel to add, review, or remove note products.</p>
                        <Button variant="ghost" asChild>
                          <Link href="/admin">Open admin panel</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                          <Store className="size-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#171511]">Storefront review</h3>
                        <p className="text-[#5a5449]">See the exact catalog students land on when they arrive through a shared link.</p>
                        <Button variant="ghost" asChild>
                          <Link href="/browse">Open catalog</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Workspace note</div>
                        <p className="text-[#5a5449]">Student purchase widgets are hidden here so the admin dashboard stays focused on management.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="space-y-5 p-8">
                      <div>
                        <h2 className="text-3xl font-semibold text-[#171511]">Admin quick actions</h2>
                        <p className="mt-2 text-[#5a5449]">Use the admin panel to manage products and the browse page to check the student-facing catalog.</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild>
                          <Link href="/admin">Go to admin panel</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                          <Link href="/browse">Preview student catalog</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="inline-flex rounded-2xl bg-[#ede4d5] p-3 text-[#8f725a]">
                          <BookOpenText className="size-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#171511]">My notes</h3>
                        <p className="text-[#5a5449]">Purchased products appear here so you can return to them without searching again.</p>
                        <div className="text-3xl font-semibold text-[#171511]">{purchases.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Device security</div>
                        <p className="text-[#5a5449]">This account flow is designed around one-device sessions so older logins can be invalidated when a new device signs in.</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                          <FolderKanban className="size-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#171511]">Browse more notes</h3>
                        <p className="text-[#5a5449]">Open the live catalog any time to discover more products and buy new material.</p>
                        <Button variant="ghost" asChild>
                          <Link href="/browse">Open catalog</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="space-y-6 p-8">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-3xl font-semibold text-[#171511]">Purchased notes</h2>
                          <p className="mt-2 text-[#5a5449]">These are the products currently linked to your account.</p>
                        </div>
                        {purchases.length ? null : (
                          <Button variant="ghost" asChild>
                            <Link href="/browse">Browse catalog</Link>
                          </Button>
                        )}
                      </div>

                      {purchases.length === 0 ? (
                        <div className="rounded-[1.8rem] border border-dashed border-[#171511]/12 bg-white/65 px-6 py-12 text-center text-[#5a5449]">
                          <div>No purchases yet.</div>
                          <div className="mt-3 text-sm">Open the catalog to explore notes and unlock viewer access after checkout.</div>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {purchases.map((purchase) => (
                            <div key={purchase.id} className="grid gap-4 rounded-[1.7rem] border border-[#171511]/8 bg-white p-5 lg:grid-cols-[1fr_auto]">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">Purchase #{purchase.id}</div>
                                <div className="mt-2 text-xl font-semibold text-[#171511]">{purchase.title}</div>
                                <div className="mt-2 text-sm text-[#5a5449]">{purchase.description || "Purchased note product"}</div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {purchaseMeta(purchase).map((item) => (
                                    <span key={`${purchase.id}-${item}`} className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">
                                      {item}
                                    </span>
                                  ))}
                                  {purchase.page_count ? <span className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">{purchase.page_count} pages</span> : null}
                                </div>
                              </div>
                              <div className="flex flex-col items-start gap-3 lg:items-end">
                                <div className="rounded-full bg-[#f5ecdf] px-4 py-2 text-sm font-medium text-[#171511]">Rs. {Number(purchase.price).toFixed(2)}</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-[#7a7368]">
                                  {purchase.created_at
                                    ? `Purchased ${new Date(purchase.created_at).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric"
                                      })}`
                                    : "In your library"}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <Button variant="ghost" asChild>
                                    <Link href={`/files/${purchase.file_id}`}>View product</Link>
                                  </Button>
                                  <Button asChild>
                                    <Link href={`/viewer/${purchase.file_id}`}>Open viewer</Link>
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
    </>
  );
}
