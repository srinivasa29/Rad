import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder = "Search setups by stock or sector..." }) => {
  return (
    <div className="relative min-w-[260px] flex-1">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-3 text-sm text-white outline-none transition duration-300 ease-in-out focus:border-cyan-300/45"
      />
    </div>
  );
};

export default SearchBar;
