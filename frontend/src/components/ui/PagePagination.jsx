import PaginationBar from './PaginationBar';

/** Sahifa pastidagi markazlashtirilgan pagination (POS uslubi). */
export default function PagePagination({ currentPage, totalPages, onPageChange, info }) {
  if (totalPages < 1) return null;

  return (
    <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex flex-col items-center justify-center gap-2 shrink-0 w-full">
      {info ? (
        <span className="text-xs font-medium text-gray-500 text-center">{info}</span>
      ) : null}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
