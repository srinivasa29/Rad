import React, { useEffect, useMemo, useState } from 'react';
import './TradingWatchlistGrid.css';

// Empty fallback — real data is provided by the parent via the `stocks` prop
// (AdvancedWatchlistDashboard loads from the backend; this array is never shown in production)
const MOCK_ROWS = [];

const COLUMNS = [
  { key: 'symbol', label: 'Symbol', sortable: false },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'changePct', label: 'Change %', sortable: true },
  { key: 'volume', label: 'Volume', sortable: true },
  { key: 'chart', label: 'Chart', sortable: false },
  { key: 'notes', label: 'Notes', sortable: false },
  { key: 'open', label: 'Open', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false },
];

const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const compactNumber = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
};

const sortRows = (rows, key, direction) => {
  const normalized = Array.isArray(rows) ? rows : [];
  if (!key) return normalized;

  return [...normalized].sort((a, b) => {
    const aValue = Number(a[key] ?? 0);
    const bValue = Number(b[key] ?? 0);
    if (aValue === bValue) return 0;
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  });
};

const getTrend = (value) => {
  const pct = Number(value || 0);
  if (pct > 0.4) return { label: 'Bull', tone: 'up' };
  if (pct < -0.4) return { label: 'Bear', tone: 'down' };
  return { label: 'Side', tone: 'flat' };
};

const WatchlistHeader = ({ sortKey, sortDirection, onSort }) => (
  <div className="watchlist-grid watchlist-header-row">
    {COLUMNS.map((column) => (
      <div key={column.key} className={`watchlist-cell watchlist-header-cell ${column.key === 'actions' ? 'align-center' : ''}`}>
        {column.sortable ? (
          <button type="button" className="watchlist-sort-btn" onClick={() => onSort(column.key)}>
            <span>{column.label}</span>
            {sortKey === column.key && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ) : (
          <span>{column.label}</span>
        )}
      </div>
    ))}
  </div>
);

const WatchlistRow = ({ row, selected, onSelect, onAlert, onDelete }) => {
  const isPositive = Number(row.changePct || 0) >= 0;
  const trend = getTrend(row.changePct);
  const pe = Number(row.pe || 0);
  const peBar = Math.max(4, Math.min(100, (pe / 45) * 100));

  return (
    <div
      role="button"
      tabIndex={0}
      className={`watchlist-grid watchlist-data-row ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(row)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(row);
        }
      }}
    >
      <div className="watchlist-cell symbol-cell">
        <div className="symbol-main">
          <span className="symbol-code">{row.symbol}</span>
          <span className="sector-tag">{row.sector || 'General'}</span>
        </div>
        <div className="symbol-name">{row.name || row.symbol}</div>
      </div>

      <div className="watchlist-cell price-cell">{currency(row.price)}</div>

      <div className={`watchlist-cell change-cell ${isPositive ? 'tone-up' : 'tone-down'}`}>
        {isPositive ? '+' : ''}{Number(row.changePct || 0).toFixed(2)}%
      </div>

      <div className="watchlist-cell volume-cell">{compactNumber(row.volume)}</div>

      <div className="watchlist-cell chart-cell">
        <div className="pe-track">
          <span className="pe-fill" style={{ width: `${peBar}%` }} />
        </div>
        <div className="chart-meta">
          <span className="pe-value">P/E {pe.toFixed(1)}</span>
          <span className={`trend-pill trend-${trend.tone}`}>{trend.label}</span>
        </div>
      </div>

      <div className="watchlist-cell notes-cell">{row.notes || '-'}</div>

      <div className="watchlist-cell open-cell">{currency(row.open ?? Number(row.price || 0) - Number(row.change || 0))}</div>

      <div className="watchlist-cell actions-cell">
        <div className="row-actions" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="icon-btn"
            title="Set Alert"
            onClick={() => onAlert(row)}
          >
            🔔
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Open"
            onClick={() => onSelect(row)}
          >
            ›
          </button>
          <button
            type="button"
            className="icon-btn danger"
            title="Remove"
            onClick={() => onDelete(row)}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TradingWatchlistGrid({
  stocks,
  selectedStockId,
  onSelectStock,
  onAddAlert,
  onRemoveStock,
}) {
  const sourceRows = (Array.isArray(stocks) && stocks.length > 0) ? stocks : MOCK_ROWS;
  const [sortKey, setSortKey] = useState('volume');
  const [sortDirection, setSortDirection] = useState('desc');
  const [focusedRowId, setFocusedRowId] = useState(sourceRows[0]?.id || null);

  const rows = useMemo(() => sortRows(sourceRows, sortKey, sortDirection), [sourceRows, sortKey, sortDirection]);

  useEffect(() => {
    if (!rows.some((row) => row.id === focusedRowId)) {
      setFocusedRowId(rows[0]?.id || null);
    }
  }, [rows, focusedRowId]);

  const handleSort = (key) => {
    if (!['price', 'changePct', 'volume'].includes(key)) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  const onKeyDown = (event) => {
    const index = rows.findIndex((row) => row.id === focusedRowId);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = rows[Math.min(index + 1, rows.length - 1)];
      if (next) setFocusedRowId(next.id);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = rows[Math.max(index - 1, 0)];
      if (prev) setFocusedRowId(prev.id);
      return;
    }

    const active = rows.find((row) => row.id === focusedRowId);
    if (!active) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      onSelectStock?.(active);
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onRemoveStock?.(active);
    }
  };

  return (
    <section className="watchlist-shell" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="watchlist-header sticky-zone">
        <WatchlistHeader sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
      </div>

      <div className="watchlist-body">
        {rows.map((row) => (
          <WatchlistRow
            key={row.id}
            row={row}
            selected={selectedStockId === row.id || focusedRowId === row.id}
            onSelect={(selectedRow) => {
              setFocusedRowId(selectedRow.id);
              onSelectStock?.(selectedRow);
            }}
            onAlert={onAddAlert}
            onDelete={onRemoveStock}
          />
        ))}
      </div>
    </section>
  );
}
