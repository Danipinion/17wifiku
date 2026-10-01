package com.danipinion.sobatwiff.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.clip
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QrisInstructionScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Tata Cara Pembayaran", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = SurfaceBlue,
                    titleContentColor = BluePrimary,
                    navigationIconContentColor = BluePrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundBlue)
                .verticalScroll(rememberScrollState())
        ) {
            // Header Illustration / Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.verticalGradient(listOf(BluePrimary, BlueSecondary)))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.QrCode2,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Pembayaran Instan via QRIS",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Satu kode untuk semua aplikasi pembayaran digital kamu.",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            Text(
                text = "Panduan Pembayaran Tagihan",
                modifier = Modifier.padding(horizontal = 24.dp),
                color = TextDark,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            // Step List
            InstructionStep(
                number = 1,
                title = "Temukan Tagihan Anda",
                description = "Buka halaman 'Home' atau 'History'. Jika Anda memiliki beberapa tagihan, dimohon untuk mendahulukan pembayaran tagihan yang paling lama (tertua) demi kenyamanan layanan.",
                icon = Icons.Default.Search
            )
            
            InstructionStep(
                number = 2,
                title = "Ingin Bayar Beberapa Bulan?",
                description = "Jika ada tagihan lebih dari 1 bulan, masuk ke menu 'History'. Klik tombol 'Bayar' di pojok atas, lalu gunakan tombol (+) atau (-) untuk memilih berapa bulan yang ingin Anda bayar sekaligus.",
                icon = Icons.Default.AddToPhotos
            )
            
            InstructionStep(
                number = 3,
                title = "Simpan Kode Pembayaran",
                description = "Klik 'Bayar Sekarang' untuk memunculkan kode QR. Silakan ambil tangkapan layar (screenshot) atau simpan gambar kode QR tersebut ke galeri HP Anda.",
                icon = Icons.Default.Screenshot
            )
            
            InstructionStep(
                number = 4,
                title = "Gunakan Aplikasi Bank / E-Wallet",
                description = "Buka aplikasi m-Banking atau E-Wallet (seperti Dana, OVO, GoPay). Pilih menu Scan/Bayar dan unggah gambar kode QR yang sudah Anda simpan tadi.",
                icon = Icons.Default.AccountBalanceWallet
            )
            
            InstructionStep(
                number = 5,
                title = "Notifikasi & Status Sukses",
                description = "Setelah membayar, Anda akan menerima pesan konfirmasi melalui WhatsApp dan status di aplikasi otomatis berubah menjadi 'Lunas'.",
                icon = Icons.Default.CheckCircle
            )

            InstructionStep(
                number = 6,
                title = "Lapor Jika Ada Kendala",
                description = "Jika dalam 5 menit status belum berubah, segera lapor ke admin melalui menu 'Profil' > 'Bantuan' dengan melampirkan foto bukti pembayaran Anda.",
                icon = Icons.Default.SupportAgent,
                isLast = true
            )

            Spacer(modifier = Modifier.height(32.dp))
            
            // Helpful Tip
            Surface(
                modifier = Modifier.padding(horizontal = 24.dp),
                color = Color(0xFFE3F2FD),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Terima kasih telah melakukan pembayaran tagihan Anda tepat waktu. Dukungan Anda sangat berarti bagi kelancaran layanan kami.",
                        fontSize = 13.sp,
                        color = BluePrimary,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

@Composable
fun InstructionStep(
    number: Int,
    title: String,
    description: String,
    icon: ImageVector,
    isLast: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(BluePrimary),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = number.toString(),
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(80.dp)
                        .background(BluePrimary.copy(alpha = 0.2f))
                )
            }
        }
        
        Spacer(modifier = Modifier.width(20.dp))
        
        Column(modifier = Modifier.padding(bottom = 24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = BluePrimary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    color = TextDark,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                color = TextMedium,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )
        }
    }
}
