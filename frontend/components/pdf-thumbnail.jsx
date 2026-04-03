import dynamic from "next/dynamic";

function PreviewFallback({ label = "PDF preview", className = "" }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#efe0be] via-[#f8f3ea] to-[#dce6d4] text-xs font-semibold uppercase tracking-[0.22em] text-[#171511] ${className}`}>
      {label}
    </div>
  );
}

const PdfThumbnailClient = dynamic(() => import("@/components/pdf-thumbnail-client"), {
  ssr: false,
  loading: () => <PreviewFallback />
});

export function PdfThumbnail({ fileUrl, thumbnail, alt, className = "", fallbackLabel = "PDF preview" }) {
  if (thumbnail) {
    return <img src={thumbnail} alt={alt} className={className || "h-full w-full object-cover"} />;
  }

  if (!fileUrl) {
    return <PreviewFallback label={fallbackLabel} className={className} />;
  }

  return <PdfThumbnailClient fileUrl={fileUrl} alt={alt} className={className} fallbackLabel={fallbackLabel} />;
}
