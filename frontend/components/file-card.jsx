import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Sparkles } from "lucide-react";

import { PdfThumbnail } from "@/components/pdf-thumbnail";
import { Card, CardContent } from "@/components/ui/card";

function buildMeta(file) {
  return [file.subject, file.course, file.semester, file.unit_label || file.unitLabel]
    .filter(Boolean)
    .slice(0, 3);
}

export function FileCard({ file, index = 0, owned = false }) {
  const meta = buildMeta(file);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <Card className="group h-full transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(80,68,48,0.12)]">
        <CardContent className="flex h-full flex-col gap-4 p-4 sm:gap-5 sm:p-6">
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] border border-[#171511]/8 bg-gradient-to-br from-[#efe0be] via-[#f8f3ea] to-[#dce6d4] sm:rounded-[1.75rem]">
            <PdfThumbnail
              fileUrl={file.file_url}
              thumbnail={file.thumbnail}
              alt={file.title}
              className="h-full w-full object-cover"
              fallbackLabel="PDF preview"
            />
            <div className="absolute left-3 top-3 rounded-xl border border-[#171511]/10 bg-white/75 p-2.5 text-[#5f6f52] sm:left-5 sm:top-5 sm:rounded-2xl sm:p-3">
              <FileText className="size-5 sm:size-6" />
            </div>
            {(file.is_featured || file.isFeatured) && (
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#171511] sm:bottom-5 sm:left-5 sm:px-3">
                <Sparkles className="size-3" />
                Featured
              </div>
            )}
            {owned && (
              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#171511] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#fffdf8] sm:right-4 sm:top-4 sm:px-3">
                <CheckCircle2 className="size-3" />
                Owned
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold leading-tight text-[#171511] sm:text-xl">
                {file.title}
              </h2>
              <span className="shrink-0 rounded-full border border-[#171511]/10 bg-[#f7efe4] px-2.5 py-1 text-sm font-medium text-[#171511]">
                Rs.&nbsp;{Number(file.price).toFixed(2)}
              </span>
            </div>

            <p className="line-clamp-2 text-sm leading-6 text-[#5f584d] sm:line-clamp-3">
              {file.description || "Premium digital content available inside NoteVault's secure viewer."}
            </p>

            {meta.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {meta.map((item) => (
                  <span key={item} className="rounded-full border border-[#171511]/8 bg-white px-2.5 py-0.5 text-xs font-medium text-[#5f584d] sm:py-1">
                    {item}
                  </span>
                ))}
                {(file.page_count || file.pageCount) && (
                  <span className="rounded-full border border-[#171511]/8 bg-white px-2.5 py-0.5 text-xs font-medium text-[#5f584d] sm:py-1">
                    {file.page_count || file.pageCount} pages
                  </span>
                )}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7368]">
                {owned ? "Ready to open" : "Open product page"}
              </span>
              <Link
                href={`/files/${file.id}`}
                className="inline-flex min-h-0 items-center gap-1.5 text-sm font-semibold text-[#171511] transition hover:text-[#5f6f52]"
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
