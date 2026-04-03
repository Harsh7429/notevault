import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FolderKanban, PencilLine, Sparkles, Trash2, UploadCloud } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PdfThumbnail } from "@/components/pdf-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import { deleteAdminFile, fetchAdminSales, fetchCurrentUser, fetchFiles, updateAdminFile, uploadAdminFile } from "@/lib/api";

const initialValues = {
  title: "",
  description: "",
  subject: "",
  course: "",
  semester: "",
  unitLabel: "",
  pageCount: "",
  isFeatured: false,
  price: "",
  thumbnail: "",
  file: null
};

function mapFileToValues(file) {
  return {
    title: file.title || "",
    description: file.description || "",
    subject: file.subject || "",
    course: file.course || "",
    semester: file.semester || "",
    unitLabel: file.unit_label || "",
    pageCount: file.page_count ? String(file.page_count) : "",
    isFeatured: Boolean(file.is_featured),
    price: file.price != null ? String(file.price) : "",
    thumbnail: file.thumbnail || "",
    file: null
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [sales, setSales] = useState({
    totalFiles: 0,
    featuredProducts: 0,
    subjectCount: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    uniqueBuyers: 0,
    topProducts: [],
    recentPurchases: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingFileId, setEditingFileId] = useState(null);
  const [values, setValues] = useState(initialValues);

  async function loadAdminData(token) {
    const [currentUser, allFiles, salesData] = await Promise.all([
      fetchCurrentUser(token),
      fetchFiles(),
      fetchAdminSales(token)
    ]);

    if (currentUser.role !== "admin") {
      throw new Error("Admin access is required.");
    }

    setUser(currentUser);
    setFiles(allFiles);
    setSales(salesData);
  }

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    loadAdminData(token)
      .catch((requestError) => {
        if (requestError.message.toLowerCase().includes("session") || requestError.message.toLowerCase().includes("token")) {
          clearStoredToken();
        }

        setError(requestError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  function handleChange(event) {
    const { name, value, files, type, checked } = event.target;

    setValues((current) => ({
      ...current,
      [name]: name === "file" ? files?.[0] || null : type === "checkbox" ? checked : value
    }));
  }

  function handleEdit(file) {
    setEditingFileId(file.id);
    setValues(mapFileToValues(file));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingFileId(null);
    setValues(initialValues);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getStoredToken();

      if (editingFileId) {
        const updatedFile = await updateAdminFile(token, editingFileId, values);
        setSuccess(`Updated ${updatedFile.title} successfully.`);
      } else {
        const uploadedFile = await uploadAdminFile(token, values);
        setSuccess(`Uploaded ${uploadedFile.title} successfully.`);
      }

      resetForm();
      await loadAdminData(token);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(fileId) {
    const confirmed = window.confirm("Delete this file from NoteVault?");
    if (!confirmed) {
      return;
    }

    try {
      const token = getStoredToken();
      await deleteAdminFile(token, fileId);
      setFiles((current) => current.filter((file) => file.id !== fileId));
      setSuccess("File deleted successfully.");
      if (editingFileId === fileId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Panel | NoteVault</title>
      </Head>
      <AppShell>
        <section className="space-y-8 py-8 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Admin panel</p>
              <h1 className="mt-3 font-heading text-4xl text-[#171511] sm:text-5xl">Upload and manage your note products</h1>
            </div>
            <div className="rounded-full border border-[#171511]/10 bg-white px-4 py-2 text-sm text-[#5a5449]">
              {user ? `Signed in as ${user.email}` : "Checking access..."}
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-[#5a5449]">Loading admin workspace...</CardContent>
            </Card>
          ) : error && !user ? (
            <Card>
              <CardContent className="space-y-4 p-8">
                <h2 className="text-2xl font-semibold text-[#171511]">Admin access unavailable</h2>
                <p className="text-[#5a5449]">{error}</p>
                <Button asChild>
                  <a href="/dashboard">Go to dashboard</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <Card>
                  <CardContent className="space-y-6 p-8">
                    <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                      {editingFileId ? <PencilLine className="size-6" /> : <UploadCloud className="size-6" />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold text-[#171511]">{editingFileId ? "Edit note product" : "Add a new note product"}</h2>
                      <p className="mt-2 text-[#5a5449]">
                        {editingFileId
                          ? "Update the product details that power the storefront, filters, and viewer experience."
                          : "Upload a PDF, define its academic metadata, and let NoteVault use page 1 as the default storefront preview when you skip a custom thumbnail."}
                      </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#3f3a31]">Title</span>
                        <input name="title" value={values.title} onChange={handleChange} required className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="DBMS Unit 1 Notes" />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#3f3a31]">Description</span>
                        <textarea name="description" value={values.description} onChange={handleChange} rows={4} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="Short product description" />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Subject</span>
                          <input name="subject" value={values.subject} onChange={handleChange} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="Database Systems" />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Course</span>
                          <input name="course" value={values.course} onChange={handleChange} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="BCA" />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Semester</span>
                          <input name="semester" value={values.semester} onChange={handleChange} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="Semester 3" />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Unit / Topic</span>
                          <input name="unitLabel" value={values.unitLabel} onChange={handleChange} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="Unit 1" />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Pages</span>
                          <input name="pageCount" type="number" min="1" step="1" value={values.pageCount} onChange={handleChange} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="42" />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Price (Rs.)</span>
                          <input name="price" type="number" min="0" step="0.01" value={values.price} onChange={handleChange} required className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="149" />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Custom thumbnail URL (optional)</span>
                          <input name="thumbnail" value={values.thumbnail} onChange={handleChange} className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45" placeholder="Leave blank to use PDF page 1" />
                        </label>
                      </div>

                      <label className="flex items-center gap-3 rounded-[1.4rem] border border-[#171511]/10 bg-[#fbf7f1] px-4 py-3 text-sm text-[#3f3a31]">
                        <input name="isFeatured" type="checkbox" checked={values.isFeatured} onChange={handleChange} className="size-4 rounded border-[#171511]/20 text-[#171511] focus:ring-[#5f6f52]" />
                        Mark this product as featured in the storefront
                      </label>

                      {!editingFileId ? (
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">PDF file</span>
                          <input name="file" type="file" accept="application/pdf" onChange={handleChange} required className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#171511] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" />
                        </label>
                      ) : (
                        <div className="rounded-[1.4rem] border border-[#171511]/10 bg-[#fbf7f1] px-4 py-4 text-sm leading-7 text-[#5a5449]">
                          PDF replacement is still intentionally locked to keep edits safe. This form updates product metadata, pricing, and storefront presentation.
                        </div>
                      )}

                      {error ? <div className="rounded-2xl border border-[#c98773]/35 bg-[#f6e7e2] px-4 py-3 text-sm text-[#8f4d3c]">{error}</div> : null}
                      {success ? <div className="rounded-2xl border border-[#5f6f52]/25 bg-[#edf4eb] px-4 py-3 text-sm text-[#486245]">{success}</div> : null}

                      <div className="flex flex-wrap gap-3">
                        <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                          {submitting ? (editingFileId ? "Saving..." : "Uploading...") : editingFileId ? "Save changes" : "Upload product"}
                        </Button>
                        {editingFileId ? (
                          <Button type="button" variant="ghost" size="lg" onClick={resetForm}>
                            Cancel edit
                          </Button>
                        ) : null}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                        <FolderKanban className="size-6" />
                      </div>
                      <h3 className="text-2xl font-semibold text-[#171511]">Sales overview</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                          <div className="text-sm text-[#7a7368]">Uploaded products</div>
                          <div className="mt-2 text-3xl font-semibold text-[#171511]">{sales.totalFiles ?? files.length}</div>
                        </div>
                        <div className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                          <div className="text-sm text-[#7a7368]">Featured products</div>
                          <div className="mt-2 text-3xl font-semibold text-[#171511]">{sales.featuredProducts ?? 0}</div>
                        </div>
                        <div className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                          <div className="text-sm text-[#7a7368]">Total purchases</div>
                          <div className="mt-2 text-3xl font-semibold text-[#171511]">{sales.totalPurchases ?? 0}</div>
                        </div>
                        <div className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                          <div className="text-sm text-[#7a7368]">Total revenue</div>
                          <div className="mt-2 text-3xl font-semibold text-[#171511]">Rs. {Number(sales.totalRevenue ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                          <div className="text-sm text-[#7a7368]">Unique buyers</div>
                          <div className="mt-2 text-3xl font-semibold text-[#171511]">{sales.uniqueBuyers ?? 0}</div>
                        </div>
                        <div className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                          <div className="text-sm text-[#7a7368]">Subjects covered</div>
                          <div className="mt-2 text-3xl font-semibold text-[#171511]">{sales.subjectCount ?? 0}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                        <Sparkles className="size-6" />
                      </div>
                      <h3 className="text-2xl font-semibold text-[#171511]">Top products</h3>
                      {sales.topProducts?.length ? (
                        <div className="space-y-3">
                          {sales.topProducts.map((product) => (
                            <div key={product.id} className="rounded-[1.4rem] border border-[#171511]/8 bg-white px-4 py-4 text-sm text-[#5a5449]">
                              <div className="font-semibold text-[#171511]">{product.title}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#7a7368]">
                                <span>{product.subject || "General"}</span>
                                <span>{product.purchase_count} sales</span>
                                <span>Rs. {Number(product.revenue || 0).toFixed(2)} revenue</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[1.4rem] border border-dashed border-[#171511]/10 bg-white px-4 py-6 text-sm text-[#5a5449]">
                          No purchases yet, so top products will appear here once sales begin.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <h3 className="text-2xl font-semibold text-[#171511]">Recent purchases</h3>
                      {sales.recentPurchases?.length ? (
                        <div className="space-y-3">
                          {sales.recentPurchases.map((purchase) => (
                            <div key={purchase.id} className="rounded-[1.4rem] border border-[#171511]/8 bg-white px-4 py-4 text-sm text-[#5a5449]">
                              <div className="font-semibold text-[#171511]">{purchase.title}</div>
                              <div className="mt-2">{purchase.email}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#7a7368]">
                                <span>Rs. {Number(purchase.price).toFixed(2)}</span>
                                <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[1.4rem] border border-dashed border-[#171511]/10 bg-white px-4 py-6 text-sm text-[#5a5449]">
                          Recent purchases will show here after the first successful buyer completes checkout.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-semibold text-[#171511]">Uploaded files</h2>
                      <p className="mt-2 text-[#5a5449]">This list comes from the same file catalog your users browse.</p>
                    </div>
                  </div>

                  {files.length === 0 ? (
                    <div className="rounded-[1.8rem] border border-dashed border-[#171511]/12 bg-white/65 px-6 py-12 text-center text-[#5a5449]">
                      No files uploaded yet.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {files.map((file) => (
                        <div key={file.id} className="grid gap-4 rounded-[1.7rem] border border-[#171511]/8 bg-white p-5 lg:grid-cols-[160px_1fr_auto_auto_auto] lg:items-center">
                          <div className="overflow-hidden rounded-[1.2rem] border border-[#171511]/8 bg-[#f8f2e9]">
                            <div className="aspect-[4/3]">
                              <PdfThumbnail fileUrl={file.file_url} thumbnail={file.thumbnail} alt={file.title} className="h-full w-full object-cover" fallbackLabel="Page 1 preview" />
                            </div>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">
                              <span>File #{file.id}</span>
                              {file.is_featured ? <span className="rounded-full bg-[#171511] px-3 py-1 text-[10px] tracking-[0.18em] text-[#fffdf8]">Featured</span> : null}
                            </div>
                            <div className="mt-2 text-xl font-semibold text-[#171511]">{file.title}</div>
                            <div className="mt-2 text-sm text-[#5a5449]">{file.description || "No description added yet."}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {[file.subject, file.course, file.semester, file.unit_label].filter(Boolean).map((item) => (
                                <span key={`${file.id}-${item}`} className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">
                                  {item}
                                </span>
                              ))}
                              {file.page_count ? <span className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">{file.page_count} pages</span> : null}
                            </div>
                          </div>
                          <div className="rounded-full bg-[#f5ecdf] px-4 py-2 text-sm font-medium text-[#171511]">Rs. {Number(file.price).toFixed(2)}</div>
                          <Button variant="ghost" onClick={() => handleEdit(file)}>
                            <PencilLine className="mr-2 size-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(file.id)}>
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </section>
      </AppShell>
    </>
  );
}
