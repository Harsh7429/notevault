export function EmptyState({ title, description }) {
  return (
    <div className="market-card rounded-[2rem] border border-dashed border-[#171511]/12 px-5 py-12 text-center sm:px-6 sm:py-16">
      <h3 className="text-xl font-semibold text-[#171511] sm:text-2xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#5a5449] sm:text-base sm:leading-7">{description}</p>
    </div>
  );
}
