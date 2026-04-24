export default function StatsCards({ stats }) {
  return (
    <div className="grid gap-2 grid-cols-2 md:grid-cols-4 xl:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/5 bg-[#111827] px-2.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">{item.label}</p>
          <p className={`mt-1 text-lg font-semibold leading-none ${item.tone || "text-white"}`}>{item.value}</p>
          {item.helper ? <p className="mt-0.5 text-xs text-gray-600">{item.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}
