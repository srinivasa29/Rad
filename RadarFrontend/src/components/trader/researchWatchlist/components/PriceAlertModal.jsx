import React from 'react';

const PriceAlertModal = ({
  open,
  symbol,
  currentPrice,
  targetPrice,
  condition,
  onTargetPriceChange,
  onConditionChange,
  onClose,
  onSubmit,
  loading,
  error,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-5 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400/80">Price Alert</p>
            <h3 className="mt-1 text-lg font-black text-white">{symbol}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Current: {currentPrice != null ? `₹${Number(currentPrice).toLocaleString('en-IN')}` : '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block text-xs font-semibold text-slate-400">
            Trigger when price is
            <select
              value={condition}
              onChange={(event) => onConditionChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-white"
            >
              <option value="above">Above or equal</option>
              <option value="below">Below or equal</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-400">
            Target price (INR)
            <input
              type="number"
              min="0"
              step="0.05"
              value={targetPrice}
              onChange={(event) => onTargetPriceChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-white"
              placeholder="Enter target price"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900/60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onSubmit}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceAlertModal;
