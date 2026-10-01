"use server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function getInvoices() {
  const session = await getSession();
  if (!session.userId) return [];

  return db.query.invoices.findMany({
    where: eq(invoices.userId, session.userId),
    orderBy: [desc(invoices.createdAt)],
  });
}

export async function uploadPaymentProof(
  invoiceId: number,
  formData: FormData
) {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");

  const file = formData.get("proof") as File;
  if (!file) throw new Error("No file uploaded");

  // Basic server-side file saving (In production, use S3/R2)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Ensure unique filename
  const filename = `proof-${invoiceId}-${Date.now()}-${file.name.replace(
    /[^a-zA-Z0-9.]/g,
    ""
  )}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
  } catch (err) {
    console.error("File upload failed", err);
    throw new Error("Failed to save file");
  }

  const fileUrl = `/uploads/${filename}`;

  await db
    .update(invoices)
    .set({
      status: "pending",
      proofImageUrl: fileUrl,
      paymentMethod: "bank_transfer", // Default for now
    })
    .where(eq(invoices.id, invoiceId));

  revalidatePath("/bills");
  return { success: true };
}
