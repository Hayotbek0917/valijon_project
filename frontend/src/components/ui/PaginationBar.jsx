import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const PRIMARY = '#4361ee';

function buildPageItems(current, total) {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

/**
 * Sahifalash — oq panel, faol sahifa ko'k (#4361ee).
 */
export default function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) {
  if (totalPages < 1) return null;

  const items = buildPageItems(currentPage, totalPages);

  return (
    <div
      className={`flex items-center justify-center gap-1 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        aria-label="Oldingi"
      >
        <ChevronLeft fontSize="small" />
      </button>

      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span key={`e-${idx}`} className="px-1.5 text-gray-400 text-sm font-medium select-none">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className="min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold transition-all"
            style={
              currentPage === item
                ? { background: PRIMARY, color: '#fff', boxShadow: '0 2px 8px rgba(67,97,238,0.35)' }
                : { color: '#6b7280' }
            }
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 bg-gray-50 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors border border-gray-100"
        aria-label="Keyingi"
      >
        <ChevronRight fontSize="small" />
      </button>
    </div>
  );
}
