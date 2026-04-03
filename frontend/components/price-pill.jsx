export function PricePill({ price }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#171511]/10 bg-[#f5ecdf] px-4 py-2 text-sm font-medium text-[#171511]">
      Rs. {Number(price).toFixed(2)}
    </span>
  );
}
