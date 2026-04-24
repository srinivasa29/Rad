const NewsPanelSection = ({ news }) => {
  return (
    <aside className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-5 lg:sticky lg:top-4">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">News Panel</h2>
      <div className="mt-3 space-y-2">
        {news.map((item) => (
          <article key={`${item.headline}-${item.time}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <h3 className="text-sm font-semibold leading-tight text-slate-100">{item.headline}</h3>
            <div className="mt-2 text-xs text-slate-400">{item.source} · {item.time}</div>
          </article>
        ))}
      </div>
    </aside>
  );
};

export default NewsPanelSection;
