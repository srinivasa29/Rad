export default function PageControls({ page, totalPages, pageSize, setPage, setPageSize }) {
  const sizes = [10, 20, 50];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#111827] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2 text-sm text-gray-300 transition-all duration-200 hover:bg-[#1f2937] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-400">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
          className="rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2 text-sm text-gray-300 transition-all duration-200 hover:bg-[#1f2937] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
