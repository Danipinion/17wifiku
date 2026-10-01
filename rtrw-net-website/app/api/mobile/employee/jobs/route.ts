import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-auth";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  // 1. Verifikasi Data Login
  const { session, error } = await getAuthSession(request);
  if (error) return error;

  try {
    const formData = await request.formData();

    const jobId = formData.get("jobId") as string | null;
    const jobTypeName = formData.get("jobTypeName") as string;
    const notes = formData.get("notes") as string | null;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const evidenceFile = formData.get("evidence") as File | null;

    if (!jobTypeName) {
      return NextResponse.json(
        { error: "Mohon isi tipe pekerjaan terlebih dahulu." },
        { status: 400 },
      );
    }

    if (!evidenceFile) {
      return NextResponse.json(
        { error: "Mohon lampirkan bukti foto kegiatan yang sudah selesai." },
        { status: 400 },
      );
    }

    if (!latitude || !longitude || latitude === "0.0" || longitude === "0.0") {
      return NextResponse.json(
        {
          error:
            "Lokasi tidak terdeteksi. Mohon pastikan fitur GPS di perangkat Anda sudah menyala.",
        },
        { status: 400 },
      );
    }

    // 3. Kompres & Upload File ke Nextcloud via WebDAV
    let buffer: any = Buffer.from(await evidenceFile.arrayBuffer());

    // Kompres gambar jika itu adalah file gambar
    if (evidenceFile.type.startsWith("image/")) {
      try {
        buffer = await sharp(buffer)
          .rotate() // Mengikuti EXIF orientasi (agar foto tegak)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true }) // Limit resolusi kearah efisien
          .jpeg({ quality: 60, progressive: true }) // Kompres 60% kualitas & progresif
          .toBuffer();
      } catch (err) {
        console.error("Gagal kompres gambar:", err);
        // Lanjutkan dengan buffer original jika kompresi gagal
      }
    }

    const timestamp = Date.now();
    const cleanFileName =
      evidenceFile.name.replace(/[^a-zA-Z0-9.\-]/g, "_").split(".")[0] + ".jpg"; // Pastikan ekstensi .jpg setelah dikompres
    const uniqueFilename = `${timestamp}-${cleanFileName}`;

    // Simpan di folder 'jobs' di Nextcloud
    const folderName = "jobs";
    const targetUrl = `${process.env.NEXTCLOUD_URL}/${folderName}/${uniqueFilename}`;

    // Pastikan folder jobs ada (bisa diabaikan jika sudah pasti ada, atau gunakan MKCOL jika perlu)
    // Upload file menggunakan metode PUT
    const uploadRes = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXTCLOUD_USER}:${process.env.NEXTCLOUD_APP_PASSWORD}`,
        ).toString("base64")}`,
        "Content-Type": evidenceFile.type || "image/jpeg",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      console.error("Nextcloud Upload Error:", await uploadRes.text());
      return NextResponse.json(
        { error: "Gagal mengunggah foto ke storage cloud." },
        { status: 500 },
      );
    }

    // URL yang mengarah ke proxy API Next.js kita
    const fileUrl = `/api/file/${folderName}/${uniqueFilename}`;

    // 4. Cari Job Type ID dari nama
    const jobTypeObj = await prisma.jobType.findFirst({
      where: { name: jobTypeName },
    });

    if (!jobTypeObj) {
      return NextResponse.json(
        { error: `Tipe Pekerjaan '${jobTypeName}' tidak ditemukan di sistem.` },
        { status: 400 },
      );
    }

    // 5. Simpan/Update Laporan Pekerjaan ke Database
    let job;
    if (jobId) {
      job = await prisma.job.update({
        where: { id: jobId },
        data: {
          jobTypeId: jobTypeObj.id,
          date: new Date(),
          evidence: fileUrl,
          notes: notes || "",
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          status: "PENDING",
        },
        include: { jobType: true },
      });
    } else {
      job = await prisma.job.create({
        data: {
          userId: session.id,
          jobTypeId: jobTypeObj.id,
          date: new Date(),
          evidence: fileUrl,
          notes: notes || "",
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          status: "PENDING",
        },
        include: { jobType: true },
      });
    }

    return NextResponse.json({
      message: "Laporan pekerjaan berhasil dikirim dan menunggu persetujuan!",
      data: job,
    });
  } catch (err: any) {
    console.error("Gagal menyimpan pekerjaan:", err);
    return NextResponse.json(
      {
        error:
          "Maaf, terjadi kendala internal server. Tim sedang mengeceknya, silakan coba beberapa saat lagi.",
      },
      { status: 500 },
    );
  }
}
