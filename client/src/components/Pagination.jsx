import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem   = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        i === currentPage - delta - 1 ||
        i === currentPage + delta + 1
      ) {
        pages.push('...');
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between
                    gap-4 px-4 py-3 bg-white border-t border-gray-200">
      {/* Info */}
      <p className="text-sm text-gray-600">
        Showing{' '}
        <span className="font-semibold text-gray-900">{startItem}</span>
        {' '}–{' '}
        <span className="font-semibold text-gray-900">{endItem}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-900">{totalItems}</span>
        {' '}results
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          <FiChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1 text-gray-400 text-sm select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${currentPage === page
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;