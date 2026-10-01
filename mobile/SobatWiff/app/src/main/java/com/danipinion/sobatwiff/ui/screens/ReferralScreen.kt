package com.danipinion.sobatwiff.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.animation.core.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Context
import android.content.ClipboardManager
import android.content.ClipData
import android.content.Intent
import com.danipinion.sobatwiff.data.remote.model.ReferralDto
import com.danipinion.sobatwiff.ui.components.*
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.viewmodels.ReferralState
import com.danipinion.sobatwiff.ui.viewmodels.ReferralViewModel
import com.danipinion.sobatwiff.ui.viewmodels.SubmitReferralState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReferralScreen(
    viewModel: ReferralViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val referralState by viewModel.referralState.collectAsState()

    // Submit state logic removed as input field is no longer present

    Scaffold(
        topBar = {
            UniqueReferralHeader(onBack = onBack)
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundBlue)
        ) {
            val isRefreshing = referralState is ReferralState.Loading
            
            PullToRefreshBox(
                isRefreshing = isRefreshing,
                onRefresh = { viewModel.fetchReferralData() },
                modifier = Modifier.fillMaxSize()
            ) {
                when (val state = referralState) {
                    is ReferralState.Loading -> {
                        if (state.currentData == null) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = BluePrimary)
                            }
                        } else {
                            ReferralListContent(data = state.currentData)
                        }
                    }
                    is ReferralState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(text = state.message, color = Color.Red, modifier = Modifier.padding(16.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(onClick = { viewModel.fetchReferralData() }) {
                                    Text("Coba Lagi")
                                }
                            }
                        }
                    }
                    is ReferralState.Success -> {
                        ReferralListContent(data = state.data)
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
fun ReferralListContent(
    data: com.danipinion.sobatwiff.data.remote.model.ReferralResponse
) {
    val context = LocalContext.current
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // 1. Hero / Banner Section
        item {
            AnimatedReferralHero()
        }

        // 4. Stats Section
        item {
            ReferralStats(
                count = data.successfulCount.toString(),
                bonus = "Rp ${(data.totalBonus / 1000).toInt()}k"
            )
        }

        // 5. List Header
        item {
            SectionHeader(
                title = "Teman yang Diajak",
                trailing = {
                    Text(
                        text = "${data.referrals.size} Orang",
                        color = TextMedium,
                        fontSize = 12.sp
                    )
                }
            )
        }

        // 6. Invited List
        if (data.referrals.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "Belum ada teman yang diajak", color = TextLocked)
                }
            }
        } else {
            items(data.referrals) { referral ->
                InvitedItem(referral)
            }
        }
    }
}

@Composable
fun AnimatedReferralHero() {
    val infiniteTransition = rememberInfiniteTransition(label = "heroScale")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .scale(scale)
            .clip(RoundedCornerShape(24.dp))
            .background(BluePrimary)
            .padding(24.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(Color.White.copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CardGiftcard,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        text = "Bonus Melimpah!",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Dapatkan potongan Rp 10.000",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 13.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Setiap teman yang menggunakan layanan kami melalui Anda, segera lapor ke admin untuk mendapatkan potongan tagihan Rp 10.000 di bulan berikutnya!",
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 12.sp,
                lineHeight = 18.sp
            )
        }
    }
}

// Fix for Error state message prop naming
private val SubmitReferralState.Error.error_message_label_fix: String get() = (this as SubmitReferralState.Error).message

@Composable
fun UniqueReferralHeader(onBack: () -> Unit) {
    Surface(
        color = BluePrimary,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .windowInsetsPadding(WindowInsets.statusBars)
                .height(140.dp)
                .padding(24.dp)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCircle(color = Color.White.copy(alpha = 0.1f), radius = 100f, center = center.copy(x = size.width + 20f, y = -20f))
            }

            Column(modifier = Modifier.align(Alignment.CenterStart)) {
                Text(
                    text = "REZEKI NOMPLOK",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Referral Program",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Ajak Teman & Raih Bonusnya!",
                    color = Color.White.copy(alpha = 0.9f),
                    fontSize = 14.sp
                )
            }

            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .background(Color.White.copy(alpha = 0.2f), CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
            }
        }
    }
}

@Composable
fun ReferralCodeCard(code: String, context: android.content.Context) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 24.dp, start = 24.dp, end = 24.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "KODE REFERRAL ANDA",
                color = TextMedium,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(12.dp))
            Surface(
                color = BackgroundBlue,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BluePrimary.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = code,
                        color = BluePrimary,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    IconButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Referral Code", code)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Kode disalin!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            Icons.Default.ContentCopy,
                            contentDescription = "Copy",
                            tint = BluePrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            PrimaryButton(
                text = "Bagikan Sekarang",
                onClick = {
                    val sendIntent: Intent = Intent().apply {
                        action = Intent.ACTION_SEND
                        putExtra(Intent.EXTRA_TEXT, "Ayo gunakan kode referral saya: $code untuk dapatkan diskon di 17WIFI!")
                        type = "text/plain"
                    }
                    val shareIntent = Intent.createChooser(sendIntent, null)
                    context.startActivity(shareIntent)
                },
                modifier = Modifier.fillMaxWidth(),
                icon = Icons.Default.Share
            )
        }
    }
}

@Composable
fun ReferralStats(count: String, bonus: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 16.dp, start = 24.dp, end = 24.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        StatCard(
            title = "Berhasil Diajak",
            value = count,
            icon = Icons.Default.Groups,
            color = BluePrimary,
            modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Total Bonus",
            value = bonus,
            icon = Icons.Default.AccountBalanceWallet,
            color = Color(0xFF4CAF50),
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = title, color = TextMedium, fontSize = 11.sp)
            Text(
                text = value,
                color = TextDark,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun InvitedItem(referral: ReferralDto) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 6.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(BackgroundBlue),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = referral.refereeName.first().toString(),
                    color = BluePrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = referral.refereeName,
                    color = TextDark,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = referral.refereeIdNumber ?: "Pending",
                    color = TextMedium,
                    fontSize = 12.sp
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                StatusTag(
                    text = if (referral.paymentStatus == "PAID") "SUDAH BAYAR" else "BELUM BAYAR",
                    color = if (referral.paymentStatus == "PAID") Color(0xFF4CAF50) else Color(0xFFE53935)
                )
                if (referral.arrearsCount > 0) {
                    Text(
                        text = "Tunggakan: ${referral.arrearsCount} Bulan",
                        color = Color(0xFFE53935),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun StatusTag(text: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(20.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}
