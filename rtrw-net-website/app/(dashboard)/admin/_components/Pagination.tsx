// app/(dashboard)/admin/_components/Pagination.tsx
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 10, // Sesuai permintaan Anda, maks 10 nomor
}: PaginationProps) {
  if (totalPages <= 1) return null; // Jangan tampilkan jika hanya 1 halaman

  // Logika untuk membuat blok 10 halaman
  const startPage =
    Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const btnBaseStyle =
    "flex items-center justify-center h-9 w-9 rounded-md bg-slate-800 text-sm hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const btnActiveStyle = "!bg-blue-600 text-white";

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {/* Tombol Pertama */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={btnBaseStyle}
        title="Halaman Pertama"
      >
        <ChevronsLeft size={16} />
      </button>
      {/* Tombol Sebelumnya */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={btnBaseStyle}
        title="Halaman Sebelumnya"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Nomor Halaman */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={currentPage === page}
          className={`${btnBaseStyle} ${
            currentPage === page ? btnActiveStyle : ""
          }`}
        >
          {page}
        </button>
      ))}

      {/* Tombol Berikutnya */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={btnBaseStyle}
        title="Halaman Berikutnya"
      >
        <ChevronRight size={16} />
      </button>
      {/* Tombol Terakhir */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={btnBaseStyle}
        title="Halaman Terakhir"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
}
