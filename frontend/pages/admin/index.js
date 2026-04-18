import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Eye, EyeOff, FolderKanban, KeyRound, PencilLine,
  RefreshCw, Sparkles, Trash2, UploadCloud,
} from "lucide-react";

import { AppShell }          from "@/components/layout/app-shell";
import { PdfThumbnail }      from "@/components/pdf-thumbnail";
import { Button }            from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearStoredToken, getStoredToken } from "@/lib/auth";
import {
  deleteAdminFile, fetchAdminSales, fetchCurrentUser,
  fetchFiles, updateAdminFile, uploadAdminFile,
} from "@/lib/api";

const initialValues = {
  title:            "",
  description:      "",
  subject:          "",
  course:           "",
  semester:         "",
  unitLabel:        "",
  pageCount:        "",
  isFeatured:       false,
  price:            "",
  thumbnail:        "",
  downloadPassword: "",
  file:             null,
};

function mapFileToValues(file) {
  return {
    title:            file.title            || "",
    description:      file.description      || "",
    subject:          file.subject          || "",
    course:           file.course           || "",
    semester:         file.semester         || "",
    unitLabel:        file.unit_label       || "",
    pageCount:        file.page_count ? String(file.page_count) : "",
    isFeatured:       Boolean(file.is_featured),
    price:            file.price != null ? String(file.price) : "",
    thumbnail:        file.thumbnail        || "",
    downloadPassword: file.download_password || "",
    file:             null, // reset — user must re-select to replace
  };
}

const inputCls =
  "w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition focus:border-[#5f6f52]/45";

export default function AdminPage() {
  const router = useRouter();

  const [user,      setUser]      = useState(null);
  const [files,     setFiles]     = useState([]);
  const [sales,     setSales]     = useState({
    totalFiles: 0, featuredProducts: 0, subjectCount: 0,
    totalPurchases: 0, totalRevenue: 0, uniqueBuyers: 0,
    topProducts: [], recentPurchases: [],
  });
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [editingFileId, setEditingFileId] = useState(null);
  const [values,        setValues]        = useState(initialValues);
  const [showPassword,  setShowPassword]  = useState(false);

  async function loadAdminData(token) {
    const [currentUser, allFiles, salesData] = await Promise.all([
      fetchCurrentUser(token),
      fetchFiles(),
      fetchAdminSales(token),
    ]);
    if (currentUser.role !== "admin") throw new Error("Admin access is required.");
    setUser(currentUser);
    setFiles(allFiles);
    setSales(salesData);
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace("/login"); return; }

    loadAdminData(token)
      .catch((err) => {
        if (err.message.toLowerCase().includes("session") ||
            err.message.toLowerCase().includes("token")) {
          clearStoredToken();
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleChange(e) {
    const { name, value, files: fileList, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]:
        name === "file"   ? fileList?.[0] || null :
        type === "checkbox" ? checked :
        value,
    }));
  }

  function handleEdit(file) {
    setEditingFileId(file.id);
    setValues(mapFileToValues(file));
    setError("");
    setSuccess("");
    setShowPassword(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingFileId(null);
    setValues(initialValues);
    setShowPassword(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getStoredToken();
      if (editingFileId) {
        const updated = await updateAdminFile(token, editingFileId, values);
        setSuccess(`Updated "${updated.title}" successfully.`);
      } else {
        const uploaded = await uploadAdminFile(token, values);
        setSuccess(`Uploaded "${uploaded.title}" successfully.`);
      }
      resetForm();
      await loadAdminData(getStoredToken());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(fileId) {
    if (!window.confirm("Delete this file from NoteVault?")) return;
    try {
      const token = getStoredToken();
      await deleteAdminFile(token, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSuccess("File deleted successfully.");
      if (editingFileId === fileId) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  const isEdit = Boolean(editingFileId);

  return (
    <>
      <Head><title>Admin Panel | NoteVault</title></Head>
      <AppShell>
        <section className="space-y-8 py-8 sm:py-12">
          {/* ── Header ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Admin panel</p>
              <h1 className="mt-3 font-heading text-4xl text-[#171511] sm:text-5xl">
                Upload and manage your note products
              </h1>
            </div>
            <div className="rounded-full border border-[#171511]/10 bg-white px-4 py-2 text-sm text-[#5a5449]">
              {user ? `Signed in as ${user.email}` : "Checking access..."}
            </div>
          </div>

          {loading ? (
            <Card><CardContent className="p-8 text-[#5a5449]">Loading admin workspace...</CardContent></Card>
          ) : error && !user ? (
            <Card>
              <CardContent className="space-y-4 p-8">
                <h2 className="text-2xl font-semibold text-[#171511]">Admin access unavailable</h2>
                <p className="text-[#5a5449]">{error}</p>
                <Button asChild><a href="/dashboard">Go to dashboard</a></Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                {/* ── Upload / Edit form ── */}
                <Card>
                  <CardContent className="space-y-6 p-8">
                    <div className="inline-flex rounded-2xl bg-[#eff4ea] p-3 text-[#5f6f52]">
                      {isEdit ? <PencilLine className="size-6" /> : <UploadCloud className="size-6" />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold text-[#171511]">
                        {isEdit ? "Edit note product" : "Add a new note product"}
                      </h2>
                      <p className="mt-2 text-[#5a5449]">
                        {isEdit
                          ? "Update metadata, replace the PDF, or change the download password."
                          : "Upload a PDF and define its academic metadata. The download password is optional — leave it blank to serve the file without encryption."}
                      </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                      {/* Title */}
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#3f3a31]">Title</span>
                        <input name="title" value={values.title} onChange={handleChange} required className={inputCls} placeholder="DBMS Unit 1 Notes" />
                      </label>

                      {/* Description */}
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#3f3a31]">Description</span>
                        <textarea name="description" value={values.description} onChange={handleChange} rows={4} className={inputCls} placeholder="Short product description" />
                      </label>

                      {/* Subject / Course */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Subject</span>
                          <input name="subject" value={values.subject} onChange={handleChange} className={inputCls} placeholder="Database Systems" />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Course</span>
                          <input name="course" value={values.course} onChange={handleChange} className={inputCls} placeholder="BCA" />
                        </label>
                      </div>

                      {/* Semester / Unit / Pages */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Semester</span>
                          <input name="semester" value={values.semester} onChange={handleChange} className={inputCls} placeholder="Semester 3" />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Unit / Topic</span>
                          <input name="unitLabel" value={values.unitLabel} onChange={handleChange} className={inputCls} placeholder="Unit 1" />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Pages</span>
                          <input name="pageCount" type="number" min="1" step="1" value={values.pageCount} onChange={handleChange} className={inputCls} placeholder="42" />
                        </label>
                      </div>

                      {/* Price / Thumbnail */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Price (Rs.)</span>
                          <input name="price" type="number" min="0" step="0.01" value={values.price} onChange={handleChange} required className={inputCls} placeholder="149" />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-[#3f3a31]">Custom thumbnail URL <span className="text-[#7a7368]">(optional)</span></span>
                          <input name="thumbnail" value={values.thumbnail} onChange={handleChange} className={inputCls} placeholder="Leave blank to use PDF page 1" />
                        </label>
                      </div>

                      {/* Featured */}
                      <label className="flex items-center gap-3 rounded-[1.4rem] border border-[#171511]/10 bg-[#fbf7f1] px-4 py-3 text-sm text-[#3f3a31]">
                        <input name="isFeatured" type="checkbox" checked={values.isFeatured} onChange={handleChange} className="size-4 rounded border-[#171511]/20 text-[#171511] focus:ring-[#5f6f52]" />
                        Mark this product as featured in the storefront
                      </label>

                      {/* ── PDF file field ──
                           New upload: required.
                           Edit: optional — if left blank the existing file is kept. */}
                      <div className="space-y-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-[#3f3a31]">
                          {isEdit
                            ? <><RefreshCw className="size-3.5 text-[#5f6f52]" /> Replace PDF file <span className="font-normal text-[#7a7368]">(optional — leave blank to keep current file)</span></>
                            : "PDF file"}
                        </span>
                        <input
                          name="file"
                          type="file"
                          accept="application/pdf"
                          onChange={handleChange}
                          required={!isEdit}
                          className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-[#171511] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#171511] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                        />
                        {isEdit && values.file && (
                          <p className="text-xs text-[#5f6f52]">
                            ✓ New file selected: {values.file.name} — this will replace the existing PDF in storage.
                          </p>
                        )}
                      </div>

                      {/* ── Download password ── */}
                      <div className="space-y-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-[#3f3a31]">
                          <KeyRound className="size-3.5 text-[#5f6f52]" />
                          Download password{" "}
                          <span className="font-normal text-[#7a7368]">(optional)</span>
                        </span>
                        <div className="relative">
                          <input
                            name="downloadPassword"
                            type={showPassword ? "text" : "password"}
                            value={values.downloadPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className={`${inputCls} pr-12`}
                            placeholder="Leave blank for no password protection"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#7a7368] transition hover:text-[#171511]"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        <p className="text-xs leading-5 text-[#7a7368]">
                          When set, buyers will see this password in the download modal and the file they receive will be encrypted with it.
                          The in-browser viewer is always unencrypted regardless of this setting.
                          {isEdit && !values.downloadPassword && " (Currently: no password — clear the field to remove an existing password.)"}
                        </p>
                      </div>

                      {/* Feedback */}
                      {error   && <div className="rounded-2xl border border-[#c98773]/35 bg-[#f6e7e2] px-4 py-3 text-sm text-[#8f4d3c]">{error}</div>}
                      {success && <div className="rounded-2xl border border-[#5f6f52]/25 bg-[#edf4eb] px-4 py-3 text-sm text-[#486245]">{success}</div>}

                      <div className="flex flex-wrap gap-3">
                        <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                          {submitting
                            ? (isEdit ? "Saving..." : "Uploading...")
                            : (isEdit ? "Save changes" : "Upload product")}
                        </Button>
                        {isEdit && (
                          <Button type="button" variant="ghost" size="lg" onClick={resetForm}>
                            Cancel edit
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* ── Right column: stats ── */}
                <div className="grid gap-6">
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="inline-flex rounded-2xl bg-[#f4ebe6] p-3 text-[#b36e58]">
                        <FolderKanban className="size-6" />
                      </div>
                      <h3 className="text-2xl font-semibold text-[#171511]">Sales overview</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          ["Uploaded products",  sales.totalFiles      ?? files.length],
                          ["Featured products",  sales.featuredProducts ?? 0],
                          ["Total purchases",    sales.totalPurchases   ?? 0],
                          ["Total revenue",      `Rs. ${Number(sales.totalRevenue ?? 0).toFixed(2)}`],
                          ["Unique buyers",      sales.uniqueBuyers     ?? 0],
                          ["Subjects covered",   sales.subjectCount     ?? 0],
                        ].map(([label, val]) => (
                          <div key={label} className="rounded-[1.6rem] border border-[#171511]/8 bg-white p-5">
                            <div className="text-sm text-[#7a7368]">{label}</div>
                            <div className="mt-2 text-3xl font-semibold text-[#171511]">{val}</div>
                          </div>
                        ))}
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
                          {sales.topProducts.map((p) => (
                            <div key={p.id} className="rounded-[1.4rem] border border-[#171511]/8 bg-white px-4 py-4 text-sm text-[#5a5449]">
                              <div className="font-semibold text-[#171511]">{p.title}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#7a7368]">
                                <span>{p.subject || "General"}</span>
                                <span>{p.purchase_count} sales</span>
                                <span>Rs. {Number(p.revenue || 0).toFixed(2)} revenue</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[1.4rem] border border-dashed border-[#171511]/10 bg-white px-4 py-6 text-sm text-[#5a5449]">
                          No purchases yet — top products appear here once sales begin.
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
                          Recent purchases appear here after the first successful checkout.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── File list ── */}
              <Card>
                <CardContent className="space-y-6 p-8">
                  <div>
                    <h2 className="text-3xl font-semibold text-[#171511]">Uploaded files</h2>
                    <p className="mt-2 text-[#5a5449]">This list comes from the same catalog your users browse.</p>
                  </div>

                  {files.length === 0 ? (
                    <div className="rounded-[1.8rem] border border-dashed border-[#171511]/12 bg-white/65 px-6 py-12 text-center text-[#5a5449]">
                      No files uploaded yet.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="grid gap-4 rounded-[1.7rem] border border-[#171511]/8 bg-white p-5 lg:grid-cols-[160px_1fr_auto_auto_auto] lg:items-center"
                        >
                          <div className="overflow-hidden rounded-[1.2rem] border border-[#171511]/8 bg-[#f8f2e9]">
                            <div className="aspect-[4/3]">
                              <PdfThumbnail
                                fileUrl={file.file_url}
                                thumbnail={file.thumbnail}
                                alt={file.title}
                                className="h-full w-full object-cover"
                                fallbackLabel="Page 1 preview"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#7a7368]">
                              <span>File #{file.id}</span>
                              {file.is_featured && (
                                <span className="rounded-full bg-[#171511] px-3 py-1 text-[10px] tracking-[0.18em] text-[#fffdf8]">
                                  Featured
                                </span>
                              )}
                              {/* Show a lock badge if a download password is set */}
                              {file.download_password && (
                                <span className="flex items-center gap-1 rounded-full border border-[#5f6f52]/20 bg-[#eff4ea] px-3 py-1 text-[10px] tracking-[0.18em] text-[#5f6f52]">
                                  <KeyRound className="size-3" />
                                  Password protected
                                </span>
                              )}
                            </div>
                            <div className="mt-2 text-xl font-semibold text-[#171511]">{file.title}</div>
                            <div className="mt-2 text-sm text-[#5a5449]">{file.description || "No description added yet."}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {[file.subject, file.course, file.semester, file.unit_label]
                                .filter(Boolean)
                                .map((item) => (
                                  <span key={`${file.id}-${item}`} className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">
                                    {item}
                                  </span>
                                ))}
                              {file.page_count && (
                                <span className="rounded-full border border-[#171511]/8 bg-[#f8f2e9] px-3 py-1 text-xs font-medium text-[#5a5449]">
                                  {file.page_count} pages
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-full bg-[#f5ecdf] px-4 py-2 text-sm font-medium text-[#171511]">
                            Rs. {Number(file.price).toFixed(2)}
                          </div>

                          <Button variant="ghost" onClick={() => handleEdit(file)}>
                            <PencilLine className="mr-2 size-4" /> Edit
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(file.id)}>
                            <Trash2 className="mr-2 size-4" /> Delete
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
