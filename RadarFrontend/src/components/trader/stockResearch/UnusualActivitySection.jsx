const UnusualActivitySection = ({ items }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Unusual Activity</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {items.map((item) => (
          <li key={item} className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-amber-100">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default UnusualActivitySection;
