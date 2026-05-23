import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useSymbolSearch } from '../hooks/useSymbolSearch';
import { currency, normalizeSymbol, toPercent } from '../utils/formatters';

const SearchResultRow = ({ item, active, onSelect }) => {
  const positive = Number(item.changePercent || 0) >= 0;
  const ex = item.exchange || 'NSE';
  const sector = item.sector || item.industry || 'Equity';

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(item)}
      className={`w-full border-b border-slate-800/80 px-4 py-3 text-left transition-colors last:border-0 ${
        active ? 'bg-cyan-500/15 ring-1 ring-inset ring-cyan-400/30' : 'hover:bg-slate-800/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">{normalizeSymbol(item.symbol)}</p>
          <p className="truncate text-xs text-slate-400">{item.name || '—'}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {ex}
            {' • '}
            {sector}
            {item.price > 0 && (
              <>
                {' • '}
                <span className="text-slate-300">{currency(item.price)}</span>
                {' '}
                <span className={positive ? 'text-emerald-400' : 'text-rose-400'}>
                  {positive ? '↑' : '↓'}
                </span>
              </>
            )}
          </p>
        </div>
        {item.price > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-black text-white">{currency(item.price)}</p>
            <p className={`flex items-center justify-end gap-0.5 text-xs font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {toPercent(item.changePercent)}
            </p>
          </div>
        )}
      </div>
    </button>
  );
};

const SymbolSearchInput = ({
  value,
  onChange,
  onSelect,
  onSubmit,
  placeholder = 'Search stocks (e.g. TCS, RELIANCE, INFY)',
  adding = false,
  className = '',
  inputClassName = '',
  showDropdown = true,
}) => {
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const { results, loading } = useSymbolSearch(value, { enabled: showDropdown && open });

  const updatePosition = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 360),
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setHighlighted(-1);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (highlighted >= results.length) setHighlighted(results.length ? 0 : -1);
  }, [results.length, highlighted]);

  const pickResult = (item) => {
    const sym = normalizeSymbol(item?.symbol || item?.name);
    onChange(sym);
    setOpen(false);
    setHighlighted(-1);
    onSelect?.(item);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      if (!results.length) return;
      event.preventDefault();
      setOpen(true);
      setHighlighted((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      if (!results.length) return;
      event.preventDefault();
      setHighlighted((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlighted >= 0 && results[highlighted]) {
        pickResult(results[highlighted]);
      } else if (onSubmit) {
        onSubmit(event);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  const showPanel = open && showDropdown && value.trim().length > 0;

  const dropdown = (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'fixed',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
            zIndex: 99999,
          }}
          className="max-h-[min(380px,55vh)] overflow-y-auto overscroll-contain rounded-xl border border-slate-600/50 bg-[#0b1220]/98 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          role="listbox"
        >
          {loading && (
            <p className="px-4 py-3 text-xs font-semibold text-cyan-400/80">Searching live markets…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-xs font-semibold text-slate-500">No NSE symbols found</p>
          )}
          {!loading && results.map((item, index) => (
            <SearchResultRow
              key={`${item.symbol}-${index}`}
              item={item}
              active={highlighted === index}
              onSelect={pickResult}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className={`relative z-[1] ${className}`}>
      <label className={`flex h-12 items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 transition-all duration-200 focus-within:border-[#00f3ff]/40 focus-within:bg-[#00f3ff]/[0.02] focus-within:shadow-[0_0_12px_rgba(0,243,255,0.08)] ${inputClassName}`}>
        <Search size={14} className="shrink-0 text-slate-500" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => {
            setOpen(true);
            updatePosition();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={adding}
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-sm text-white border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none focus-visible:outline-none focus-visible:ring-0 shadow-none placeholder:text-slate-500"
        />
      </label>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
};

export default SymbolSearchInput;
