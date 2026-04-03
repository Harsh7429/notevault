import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Sparkles } from "lucide-react";

import { PdfThumbnail } from "@/components/pdf-thumbnail";
import { Card, CardContent } from "@/components/ui/card";

function buildMeta(file) {
  return [file.subject, file.course, file.semester, file.unit_label || file.unitLabel].filter(Boolean).slice(0, 3);
}

export function FileCard({ file, index = 0, owned = false }) {
  const meta = buildMeta(file);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Card className="group h-full transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(80,68,48,0.12)]">
        <CardContent className="flex h-full flex-col gap-5 p-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-[#171511]/8 bg-gradient-to-br from-[#efe0be] via-[#f8f3ea] to-[#dce6d4]">
            <PdfThumbnail fileUrl={file.file_url} thumbnail={file.thumbnail} alt={file.title} className="h-full w-full object-cover" fallbackLabel="PDF preview" />
            <div className="absolute left-5 top-5 rounded-2xl border border-[#171511]/10 bg-white/75 p-3 text-[#5f6f52]">
              <FileText className="size-6" />
            </div>
            {file.is_featured || file.isFeatured ? (
              <div className="absolute left-5 bottom-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#171511]">
                <Sparkles className="size-3.5" />
                Featured
              </div>
            ) : null}
            {owned ? (
              <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#171511] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#fffdf8]">
                <CheckCircle2 className="size-3.5" />
                Owned
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#171511]">{file.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5f584d]">
                  {file.description || "Premium digital content available inside NoteVault's secure viewer."}
                </p>
              </div>
              <span className="rounded-full border border-[#171511]/10 bg-[#f7efe4] px-3 py-1 text-sm font-medium text-[#171511]">
                Rs. {Number(file.price).toFixed(2)}
              </span>
            </div>

            {meta.length ? (
              <div className="flex flex-wrap gap-2">
                {meta.map((item) => (
                  <span key={item} className="rounded-full border border-[#171511]/8 bg-white px-3 py-1 text-xs font-medium text-[#5f584d]">
                    {item}
                  </span>
                ))}
                {file.page_count || file.pageCount ? (
                  <span className="rounded-full border border-[#171511]/8 bg-white px-3 py-1 text-xs font-medium text-[#5f584d]">
                    {file.page_count || file.pageCount} pages
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-auto flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a7368]">
                {owned ? "Ready to open" : "Open product page"}
              </span>
              <Link
                href={`/files/${file.id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#171511] transition hover:text-[#5f6f52]"
              >
                {owned ? "View access" : "View details"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
