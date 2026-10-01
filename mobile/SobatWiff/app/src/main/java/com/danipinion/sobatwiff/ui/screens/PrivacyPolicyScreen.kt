package com.danipinion.sobatwiff.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacyPolicyScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "Kebijakan Privasi",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali", tint = TextDark)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        containerColor = Color(0xFFF8FAFF)
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = Color.White,
                shadowElevation = 1.dp
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    PolicySection(
                        title = "1. Komitmen Privasi Utama",
                        content = "Keamanan privasi Anda adalah amanah terbesar bagi kami. SobatMulya berdedikasi penuh untuk menjaga setiap data pribadi pelanggan sebagai wujud transparansi dan tanggung jawab profesional kami sebagai penyedia layanan internet terpercaya."
                    )
                    
                    PolicySection(
                        title = "2. Data yang Kami Kelola",
                        content = "Demi efisiensi dan kenyamanan pengalaman layanan yang prima, kami mengelola informasi identitas utama Anda yang mencakup: Nama Lengkap, Nomor Ponsel aktif, Alamat Instalasi akurat, serta Koordinat Lokasi Kediaman. Seluruh data tersebut bersifat rahasia dan hanya digunakan untuk kepentingan teknis serta administrasi internal layanan Anda."
                    )
                    
                    PolicySection(
                        title = "3. Tujuan Pemanfaatan Data",
                        content = "Data Anda kami manfaatkan secara strategis untuk: Percepatan proses aktivasi layanan, akurasi penagihan bulanan yang transparan, pemantauan kualitas jaringan secara real-time, serta penanganan kendala teknis dengan respon yang jauh lebih cepat dan tepat sasaran."
                    )
                    
                    PolicySection(
                        title = "4. Standar Keamanan Berlapis",
                        content = "Privasi Anda dilindungi oleh infrastruktur keamanan dengan enkripsi standar industri. Kami memastikan hanya sistem terverifikasi yang memiliki akses sangat terbatas guna mencegah segala bentuk penyalahgunaan informasi oleh pihak luar yang tidak bertanggung jawab."
                    )
                    
                    PolicySection(
                        title = "5. Kendali & Kedaulatan Data",
                        content = "Kami sangat menghargai kedaulatan data Anda. Anda memiliki hak penuh untuk memastikan integritas informasi yang benar serta melakukan konsultasi terkait privasi data melalui tim Customer Support profesional kami kapan pun Anda perlukan."
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(
                        "Dengan tetap membangun kepercayaan bersama ekosistem layanan SobatMulya, Anda dianggap telah memahami dan menyatukan visi kenyamanan layanan dalam kebijakan perlindungan data profesional ini.",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = TextMedium,
                        lineHeight = 20.sp
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun PolicySection(title: String, content: String) {
    Column(modifier = Modifier.padding(bottom = 24.dp)) {
        Text(
            text = title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            color = BluePrimary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = content,
            fontSize = 14.sp,
            color = TextDark,
            lineHeight = 22.sp,
            fontWeight = FontWeight.Normal
        )
    }
}
