import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { InvoiceStatus } from "@prisma/client";

const INVOICES_PER_PAGE = 20; // Mobile bisa menampilkan lebih banyak

// GET: /api/mobile/tagihan?search=...&status=...&month=...&year=...&page=...
export async function GET(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("search");
  const status = searchParams.get("status") as InvoiceStatus | "ALL";
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const page = parseInt(searchParams.get("page") || "1");

  // 1. Bangun query Prisma
  const whereClause: any = {};
  if (query) {
    whereClause.user = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    };
  }
  if (status && status !== "ALL") whereClause.status = status;
  if (month && month !== "ALL") whereClause.month = parseInt(month);
  if (year && year !== "ALL") whereClause.year = parseInt(year);

  try {
    // 2. Ambil data tagihan + user
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        // Kita hanya butuh info dasar user untuk daftar ini
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: INVOICES_PER_PAGE,
      skip: (page - 1) * INVOICES_PER_PAGE,
    });

    // 3. Ambil ringkasan
    const summary = await prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: whereClause,
    });

    const totalFilteredInvoices = summary._count.id;
    const hasMore = page * INVOICES_PER_PAGE < totalFilteredInvoices;

    // 4. Kembalikan data
    return NextResponse.json({
      invoices,
      hasMore,
      summary: {
        totalCount: totalFilteredInvoices,
        totalAmount: summary._sum.amount || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil data tagihan: " + err.message },
      { status: 500 }
    );
  }
}
