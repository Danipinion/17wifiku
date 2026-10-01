package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.components.*
import kotlinx.coroutines.launch

data class OnboardingPage(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val color: Color
)

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun GettingStartedScreen(onFinished: () -> Unit) {
    val pages = listOf(
        OnboardingPage(
            title = "Dashboard Real-Time",
            description = "Pantau status koneksi internet Anda secara langsung. Informasi internet dan status aktif selalu diperbarui setiap saat.",
            icon = Icons.Default.Dashboard,
            color = BluePrimary
        ),
        OnboardingPage(
            title = "Pembayaran Instan",
            description = "Bayar tagihan bulanan Anda dengan berbagai metode pembayaran aman. Instan, praktis, dan tanpa antri.",
            icon = Icons.Default.Payments,
            color = Color(0xFF4CAF50)
        ),
        OnboardingPage(
            title = "Lapor Gangguan",
            description = "Alami kendala koneksi? Laporkan langsung melalui aplikasi. Teknisi kami akan segera menangani laporan Anda.",
            icon = Icons.Default.ReportProblem,
            color = Color(0xFFFF9800)
        ),
        OnboardingPage(
            title = "Uji Kecepatan",
            description = "Pastikan Anda mendapatkan kecepatan yang sesuai dengan paket Anda menggunakan fitur Speedtest terintegrasi.",
            icon = Icons.Default.Speed,
            color = Color(0xFF2196F3)
        ),
        OnboardingPage(
            title = "Kendali Router",
            description = "Ganti password Wi-Fi atau reboot router ONT Anda langsung dari genggaman tanpa perlu login manual.",
            icon = Icons.Default.Router,
            color = Color(0xFF9C27B0)
        ),
        OnboardingPage(
            title = "Program Referral",
            description = "Bagikan kode referral Anda ke teman. Dapatkan fee tagihan untuk setiap pelanggan baru.",
            icon = Icons.Default.GroupAdd,
            color = Color(0xFFFF5722)
        ),
        OnboardingPage(
            title = "Riwayat Transaksi",
            description = "Semua transaksi dan riwayat tagihan tersusun rapi. Cek kapan saja untuk transparansi biaya langganan Anda.",
            icon = Icons.Default.History,
            color = Color(0xFF607D8B)
        )
    )

    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(BackgroundBlue, Color.White)
                )
            )
    ) {
        // Background Decorations
        Box(
            modifier = Modifier
                .size(300.dp)
                .offset(x = (-100).dp, y = (-100).dp)
                .background(BluePrimary.copy(alpha = 0.05f), CircleShape)
        )
        Box(
            modifier = Modifier
                .size(200.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 50.dp, y = 50.dp)
                .background(BluePrimary.copy(alpha = 0.05f), CircleShape)
        )

        Column(modifier = Modifier.fillMaxSize()) {
            // Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, start = 24.dp, end = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SobatMulya",
                    style = MaterialTheme.typography.titleLarge,
                    color = BluePrimary,
                    fontWeight = FontWeight.Bold
                )
                
                if (pagerState.currentPage < pages.size - 1) {
                    TextButton(onClick = { onFinished() }) {
                        Text("Lewati", color = TextMedium)
                    }
                }
            }

            // Pager Content
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) { position ->
                OnboardingSlide(page = pages[position])
            }

            // Bottom Navigation
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 48.dp, start = 32.dp, end = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Page Indicator
                Row(
                    modifier = Modifier.padding(bottom = 32.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    repeat(pages.size) { iteration ->
                        val color = if (pagerState.currentPage == iteration) BluePrimary else PastelBlueMedium
                        val width = if (pagerState.currentPage == iteration) 24.dp else 8.dp
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 4.dp)
                                .clip(CircleShape)
                                .background(color)
                                .width(width)
                                .height(8.dp)
                                .animateContentSize()
                        )
                    }
                }

                // Button
                PrimaryButton(
                    text = if (pagerState.currentPage == pages.size - 1) "Mulai Sekarang" else "Selanjutnya",
                    onClick = {
                        if (pagerState.currentPage < pages.size - 1) {
                            scope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        } else {
                            onFinished()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                )
            }
        }
    }
}

@Composable
fun OnboardingSlide(page: OnboardingPage) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Animated Icon Container
        val infiniteTransition = rememberInfiniteTransition(label = "icon_animation")
        val floatAnim by infiniteTransition.animateFloat(
            initialValue = -10f,
            targetValue = 10f,
            animationSpec = infiniteRepeatable(
                animation = tween(2000, easing = LinearOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "float"
        )

        Box(
            modifier = Modifier
                .size(200.dp)
                .offset(y = floatAnim.dp)
                .clip(CircleShape)
                .background(page.color.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = page.icon,
                contentDescription = null,
                modifier = Modifier.size(100.dp),
                tint = page.color
            )
        }

        Spacer(modifier = Modifier.height(48.dp))

        Text(
            text = page.title,
            color = TextDark,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            lineHeight = 36.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = page.description,
            color = TextMedium,
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
    }
}
