/**
 * Pagination utilities for cursor-based and offset pagination
 */

/**
 * Apply cursor-based pagination to an array
 * @param {Array} items - Items to paginate
 * @param {string|null} cursor - Cursor to start from (id of last item from previous page)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} {items, nextCursor, hasMore}
 */
export function cursorPaginate(items, cursor = null, pageSize = 10) {
  let startIndex = 0;
  
  if (cursor) {
    startIndex = items.findIndex(item => item.id == cursor);
    if (startIndex === -1) startIndex = 0;
    else startIndex += 1; // Start after the cursor
  }

  const paginatedItems = items.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < items.length;
  const nextCursor = paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].id : null;

  return {
    items: paginatedItems,
    nextCursor,
    hasMore,
    startIndex,
    endIndex: startIndex + paginatedItems.length,
    total: items.length,
  };
}

/**
 * Apply offset-based pagination to an array
 * @param {Array} items - Items to paginate
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} {items, page, pageSize, totalPages, hasMore, total}
 */
export function offsetPaginate(items, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const paginatedItems = items.slice(offset, offset + pageSize);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const hasMore = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    items: paginatedItems,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : totalPages,
    hasMore,
    hasPrevPage,
    total,
    offset,
    startItem: total === 0 ? 0 : offset + 1,
    endItem: Math.min(offset + pageSize, total),
  };
}

/**
 * Calculate pagination stats
 * @param {number} total - Total items
 * @param {number} pageSize - Items per page
 * @param {number} currentPage - Current page (1-based)
 * @returns {Object} Pagination stats
 */
export function getPaginationStats(total, pageSize, currentPage = 1) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, total);
  
  return {
    total,
    pageSize,
    currentPage,
    totalPages,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
