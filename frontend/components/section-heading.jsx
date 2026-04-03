export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">{eyebrow}</p>
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#171511] sm:text-4xl">{title}</h2>
      <p className="text-lg leading-8 text-[#5a5449]">{description}</p>
    </div>
  );
}
