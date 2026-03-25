const cardClasses = 'rounded-xl border border-white/10 bg-[#0f172a] text-[#e2e8f0] p-6 shadow-sm';

export default function ScaffoldCard({ name, category, description }) {
  return (
    <section className={cardClasses} data-scaffold-component={name}>
      <p className="text-xs uppercase tracking-wide text-[#38bdf8]">{category}</p>
      <h2 className="mt-2 text-lg font-semibold">{name}</h2>
      <p className="mt-1 text-sm text-[#94a3b8]">{description}</p>
    </section>
  );
}
