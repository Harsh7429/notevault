export function Badge({ children }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
      {children}
    </span>
  );
}
