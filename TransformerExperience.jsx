export function EmptyState({ title, description }) {
  return (
    <div className="market-card rounded-[2rem] border border-dashed border-[#171511]/12 px-6 py-16 text-center">
      <h3 className="text-2xl font-semibold text-[#171511]">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-[#5a5449]">{description}</p>
    </div>
  );
}
