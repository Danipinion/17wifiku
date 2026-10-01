package com.danipinion.sobatwiff.util

import android.content.ContentValues
import android.content.Context
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import coil.ImageLoader
import coil.request.ImageRequest
import coil.request.SuccessResult
import kotlinx.coroutines.*
import java.io.OutputStream
import java.util.Locale

object ImageHelper {
    private val mainScope = CoroutineScope(Dispatchers.Main + Job())

    fun saveQrFlyerToGallery(context: Context, qrUrl: String, amount: Double, uniqueCode: Int, invoiceId: String?, bulkInvoiceIds: String? = null) {
        Toast.makeText(context, "Mencetak QR... Silahkan Tunggu", Toast.LENGTH_SHORT).show()
        
        mainScope.launch {
            try {
                // 1. Fetch QR Bitmap
                val loader = ImageLoader(context)
                val request = ImageRequest.Builder(context)
                    .data(qrUrl)
                    .allowHardware(false) // Must be software for canvas drawing
                    .build()

                val result = (loader.execute(request) as? SuccessResult)?.drawable
                val qrBitmap = (result as? android.graphics.drawable.BitmapDrawable)?.bitmap

                if (qrBitmap == null) {
                    Toast.makeText(context, "Gagal memuat QR Code. Pastikan koneksi internet aktif.", Toast.LENGTH_SHORT).show()
                    return@launch
                }

                // 2. Create Flyer Bitmap (Professional Template)
                val flyer = createFlyerBitmap(context, qrBitmap, amount, uniqueCode, invoiceId)

                // 3. Save to Gallery
                val fileName = if (invoiceId != null) "Invoice_$invoiceId" else "Invoice_Bulk_${System.currentTimeMillis()}"
                saveBitmapToGallery(context, flyer, fileName)
            } catch (e: Exception) {
                Toast.makeText(context, "Gagal membuat QR: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun createFlyerBitmap(context: Context, qrBitmap: Bitmap, amount: Double, uniqueCode: Int, invoiceId: String?): Bitmap {
        val width = 1080
        val height = 1920
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint()

        // --- BACKGROUND ---
        // Blue Gradient
        val gradient = LinearGradient(0f, 0f, 0f, height.toFloat(),
            Color.parseColor("#1565C0"), // BluePrimary Dark
            Color.parseColor("#F9FBFF"), // BackgroundBlue
            Shader.TileMode.CLAMP
        )
        paint.shader = gradient
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
        paint.shader = null

        // --- WHITE CARD ---
        paint.color = Color.WHITE
        val cardMargin = 80f
        val cardRect = RectF(cardMargin, 200f, width - cardMargin, height - 150f)
        canvas.drawRoundRect(cardRect, 60f, 60f, paint)

        // --- LOGO / SOBAT MULYA Branding ---
        paint.color = Color.WHITE
        paint.textSize = 48f
        paint.isFakeBoldText = true
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("PEMBAYARAN ONLINE", width / 2f, 120f, paint)
        
        paint.textSize = 28f
        paint.isFakeBoldText = false
        paint.color = Color.argb(204, 255, 255, 255) // 80% Alpha White
        canvas.drawText("Layanan Internet Masyarakat & Keberkahan", width / 2f, 160f, paint)

        // --- CARD CONTENT ---
        // Header
        paint.color = Color.BLACK
        paint.textSize = 36f
        paint.isFakeBoldText = true
        canvas.drawText("TAGIHAN INTERNET", width / 2f, 320f, paint)
        
        paint.color = Color.GRAY
        paint.textSize = 24f
        paint.isFakeBoldText = false
        val idText = if (invoiceId != null) "Invoice ID: $invoiceId" else "TAGIHAN BULK (BEBERAPA BULAN)"
        canvas.drawText(idText, width / 2f, 360f, paint)

        // Amount Section
        paint.color = Color.parseColor("#1E88E5")
        paint.textSize = 84f
        paint.isFakeBoldText = true
        val amountStr = "Rp ${String.format(Locale("in", "ID"), "%,.0f", amount).replace(",", ".")}"
        canvas.drawText(amountStr, width / 2f, 500f, paint)

        // Donation Badge
        paint.color = Color.parseColor("#F1F8E9") // Light Green
        val badgeW = 600f
        val badgeH = 80f
        val badgeRect = RectF(width / 2f - badgeW / 2, 540f, width / 2f + badgeW / 2, 540f + badgeH)
        canvas.drawRoundRect(badgeRect, 40f, 40f, paint)
        
        paint.color = Color.parseColor("#388E3C")
        paint.textSize = 24f
        paint.isFakeBoldText = true
        canvas.drawText("Sudah termasuk Donasi Rp $uniqueCode", width / 2f, 590f, paint)

        // --- QR CODE ---
        val qrSize = 650
        val qrLeft = (width - qrSize) / 2
        val qrTop = 680
        val qrRect = Rect(qrLeft, qrTop, qrLeft + qrSize, qrTop + qrSize)
        
        // QR Border
        paint.color = Color.parseColor("#EEEEEE")
        canvas.drawRoundRect(RectF(qrLeft - 20f, qrTop - 20f, qrLeft + qrSize + 20f, qrTop + qrSize + 20f), 20f, 20f, paint)
        
        canvas.drawBitmap(qrBitmap, null, qrRect, null)

        // --- SCAN INSTRUCTIONS ---
        paint.color = Color.BLACK
        paint.textSize = 32f
        paint.isFakeBoldText = true
        canvas.drawText("PINDAI QRIS DI ATAS", width / 2f, 1400f, paint)
        
        paint.color = Color.DKGRAY
        paint.textSize = 24f
        paint.isFakeBoldText = false
        canvas.drawText("Melalui m-Banking atau e-Wallet Pilihan Anda", width / 2f, 1450f, paint)

        // --- WHY DONATION? (Copywriting) ---
        paint.color = Color.parseColor("#FFF8E1") // Yellowish
        val infoRect = RectF(cardMargin + 60, 1550f, width - cardMargin - 60, 1720f)
        canvas.drawRoundRect(infoRect, 30f, 30f, paint)
        
        paint.color = Color.parseColor("#795548")
        paint.textSize = 20f
        val lines = listOf(
            "Terima kasih atas dukungannya! Kode unik pembayaran digunakan untuk",
            "pemeliharaan infrastruktur jaringan demi kenyamanan akses internet kita.",
            "Setiap kontribusi Anda sangat berarti!"
        )
        var lineY = 1600f
        for (line in lines) {
            canvas.drawText(line, width / 2f, lineY, paint)
            lineY += 35f
        }

        return bitmap
    }

    private fun saveBitmapToGallery(context: Context, bitmap: Bitmap, fileName: String) {
        val resolver = context.contentResolver
        val imageCollection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        } else {
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        }

        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "$fileName.jpg")
            put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/SobatMulya")
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
        }

        val imageUri: Uri? = resolver.insert(imageCollection, contentValues)

        imageUri?.let { uri ->
            try {
                val outputStream: OutputStream? = resolver.openOutputStream(uri)
                outputStream?.use { 
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, it)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    contentValues.clear()
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(uri, contentValues, null, null)
                }
                
                Toast.makeText(context, "QR Berhasil Disimpan ke Galeri!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Gagal simpan gambar: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
