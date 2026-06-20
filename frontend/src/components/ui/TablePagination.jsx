import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';

export default function TablePagination({
  currentPage,
  totalPages,
  startItem,
  endItem,
  total,
  hasMore,
  hasPrevPage,
  onPageChange,
  itemLabel = '',
  className = '',
}) {
  if (total === 0) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-xs text-gray-600">
        {startItem}-{endItem} / {total}
        {itemLabel ? ` ${itemLabel}` : ''}
      </div>
      <div className="flex gap-2 items-center">
        <IconButton
          size="small"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className="text-xs px-2 py-1 rounded font-medium"
              style={{
                background: currentPage === page ? '#4361ee' : '#f3f4f6',
                color: currentPage === page ? '#fff' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {page}
            </button>
          ))}
        </Box>
        <IconButton
          size="small"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}
