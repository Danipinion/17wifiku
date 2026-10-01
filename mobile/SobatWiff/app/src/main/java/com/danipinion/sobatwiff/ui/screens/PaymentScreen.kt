package com.danipinion.sobatwiff.ui.screens

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.view.View
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.danipinion.sobatwiff.data.remote.model.PaymentCreateResponse
import com.danipinion.sobatwiff.ui.components.PrimaryButton
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.viewmodels.PaymentUiState
import com.danipinion.sobatwiff.ui.viewmodels.PaymentViewModel
import com.danipinion.sobatwiff.util.ImageHelper
import kotlinx.coroutines.delay
import androidx.compose.ui.draw.alpha
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    invoiceId: String,
    viewModel: PaymentViewModel,
    onBack: () -> Unit,
    onFinish: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(invoiceId) {
        viewModel.createPayment(invoiceId)
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { 
                    Text(
                        text = if (uiState is PaymentUiState.Success) "Pembayaran Berhasil" else "Selesaikan Pembayaran",
                        fontSize = 18.sp, 
                        fontWeight = FontWeight.Bold 
                    ) 
                },
                navigationIcon = {
                    if (uiState !is PaymentUiState.Success) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                        }
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundBlue)
        ) {
            AnimatedContent(
                targetState = uiState,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "payment_step"
            ) { state ->
                when (state) {
                    is PaymentUiState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = BluePrimary)
                        }
                    }
                    is PaymentUiState.Created -> {
                        PaymentInstructionContent(
                            data = state.data,
                            onFinish = onFinish
                        )
                    }
                    is PaymentUiState.Success -> {
                        PaymentSuccessContent(onFinish = onFinish)
                    }
                    is PaymentUiState.Conflict -> {
                        Column(
                            modifier = Modifier.fillMaxSize().padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.PendingActions, contentDescription = null, tint = Color(0xFFFFA000), modifier = Modifier.size(64.dp))
                            Spacer(modifier = Modifier.height(24.dp))
                            Text(state.message, textAlign = TextAlign.Center, fontWeight = FontWeight.Bold, color = TextDark)
                            Spacer(modifier = Modifier.height(32.dp))
                            PrimaryButton(
                                text = "Selesaikan Yang Sudah Ada",
                                onClick = { 
                                    viewModel.openExistingPayment(state.payment, state.qrisData)
                                },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            TextButton(onClick = { 
                                viewModel.cancelPayment(state.activePaymentId) {
                                    viewModel.createPayment(invoiceId) 
                                }
                            }) {
                                Text("Batalkan & Buat Baru", color = Color.Red, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    is PaymentUiState.Error -> {
                        Column(
                            modifier = Modifier.fillMaxSize().padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.Error, contentDescription = null, tint = Color.Red, modifier = Modifier.size(64.dp))
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(state.message, textAlign = TextAlign.Center, color = TextDark)
                            Spacer(modifier = Modifier.height(24.dp))
                            PrimaryButton(text = "Kembali", onClick = onBack)
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
fun PaymentInstructionContent(data: PaymentCreateResponse, onFinish: () -> Unit) {
    val context = LocalContext.current
    var timeLeft by remember { 
        mutableLongStateOf(
            try {
                val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
                sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
                val expiryDate = sdf.parse(data.payment.expiresAt)
                val diff = (expiryDate?.time ?: 0) - System.currentTimeMillis()
                (diff / 1000).coerceAtLeast(0)
            } catch (e: Exception) {
                900L // Fallback to 15m
            }
        ) 
    }

    LaunchedEffect(Unit) {
        // Countdown timer logic
        while (timeLeft > 0) {
            delay(1000)
            timeLeft--
        }
    }

    // Logic for the 5-minute "Late" Warning
    val initialElapsed = remember {
        try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val createDate = sdf.parse(data.payment.createdAt)
            val diff = System.currentTimeMillis() - (createDate?.time ?: 0)
            (diff / 1000).coerceAtLeast(0)
        } catch (e: Exception) { 0L }
    }
    
    var showWarning by remember { mutableStateOf(initialElapsed >= 300) }
    
    LaunchedEffect(Unit) {
        if (!showWarning) {
            val waitSeconds = (300 - initialElapsed).coerceAtLeast(0)
            delay(waitSeconds * 1000)
            showWarning = true
        }
    }

    val minutes = (timeLeft / 60).toString().padStart(2, '0')
    val seconds = (timeLeft % 60).toString().padStart(2, '0')
    val timeFormatted = "$minutes:$seconds"
    
    val qrUrl = "https://api.qrserver.com/v1/create-qr-code/?data=${data.qrisData}&size=720x720&margin=2"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
            .background(BackgroundBlue)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Late Payment Notification Banner (Prominent)
        if (showWarning) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                color = Color(0xFFFFF3E0),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.5.dp, Color(0xFFFFA000).copy(alpha = 0.5f))
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color(0xFFEF6C00),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        text = "Jika lebih dari 5 menit belum mendapatkan status dan anda sudah melakukan pembayaran, segera laporkan kepada admin untuk konfirmasi pembayaran, dikarenakan sistem pembayaran online mengalami gangguan.",
                        color = Color(0xFFE65100),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 18.sp
                    )
                }
            }
        }
        
        // Timer Banner
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = if (timeLeft < 60) Color(0xFFFFEBEE) else BluePrimary.copy(alpha = 0.05f),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    Icons.Default.Timer, 
                    contentDescription = null, 
                    tint = if (timeLeft < 60) Color.Red else BluePrimary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Selesaikan dalam $timeFormatted",
                    color = if (timeLeft < 60) Color.Red else BluePrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("TOTAL PEMBAYARAN", color = TextLocked, fontSize = 11.sp, fontWeight = FontWeight.Black)
                Text(
                    "Rp ${String.format(Locale("in", "ID"), "%,.0f", data.payment.totalAmount).replace(",", ".")}",
                    color = TextDark,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Surface(
                    color = Color(0xFFF1F8E9),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text(
                        "Dukungan Layanan: Rp ${data.payment.uniqueCode}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        color = Color(0xFF388E3C),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // QR Code Section
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White)
                        .border(1.dp, Color.LightGray.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = qrUrl,
                        contentDescription = "QRIS Code",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                
                Button(
                    onClick = {
                        ImageHelper.saveQrFlyerToGallery(
                            context = context,
                            qrUrl = qrUrl,
                            amount = data.payment.totalAmount,
                            uniqueCode = data.payment.uniqueCode,
                            invoiceId = data.payment.invoiceId,
                            bulkInvoiceIds = data.payment.bulkInvoiceIds
                        )
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BluePrimary, contentColor = Color.White),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Simpan QR ke Galeri", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Text(
                    "Pindai QR ini atau simpan ke galeri jika ingin membayar nanti melalui aplikasi perbankan.",
                    textAlign = TextAlign.Center,
                    fontSize = 11.sp,
                    color = TextMedium,
                    lineHeight = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))
                
                // Pulsing Status Indicator (Watching)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BluePrimary.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                    val alpha by infiniteTransition.animateFloat(
                        initialValue = 0.3f,
                        targetValue = 1f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(1000),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "alpha"
                    )
                    
                    Surface(
                        modifier = Modifier.size(8.dp).alpha(alpha),
                        color = Color(0xFF4CAF50),
                        shape = CircleShape
                    ) {}
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Text(
                        "Menunggu Pembayaran...",
                        color = Color(0xFF388E3C),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Donation Info
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color(0xFFFFF8E1),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(modifier = Modifier.padding(16.dp)) {
                Icon(Icons.Default.Handshake, contentDescription = null, tint = Color(0xFFFFA000), modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    "Warga Sobat! Nominal unik di atas adalah donasi sukarela untuk pemeliharaan infrastruktur jaringan demi kenyamanan bersama. Terima kasih!",
                    fontSize = 11.sp,
                    lineHeight = 16.sp,
                    color = Color(0xFF795548)
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = SurfaceBlue,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = BluePrimary)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Sistem memantau pembayaran Anda...", fontSize = 13.sp, color = TextMedium)
                }
            }
        }
    }
}


@Composable
fun PaymentSuccessContent(onFinish: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(contentAlignment = Alignment.Center) {
            Surface(
                modifier = Modifier.size(160.dp),
                color = Color(0xFF4CAF50).copy(alpha = 0.1f),
                shape = CircleShape
            ) {}
            Surface(
                modifier = Modifier.size(120.dp),
                color = Color(0xFF4CAF50).copy(alpha = 0.2f),
                shape = CircleShape
            ) {}
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF4CAF50)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(48.dp)
                )
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        
        Text(
            "Pembayaran Berhasil!",
            color = TextDark,
            fontSize = 26.sp,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            "Terima kasih atas dukungannya! Tagihan Anda telah dilunasi secara otomatis. Selamat menikmati layanan WiFi kami.",
            color = TextMedium,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp
        )
        
        Spacer(modifier = Modifier.height(64.dp))
        
        PrimaryButton(
            text = "Kembali ke Beranda",
            onClick = onFinish,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
