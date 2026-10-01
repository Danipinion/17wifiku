package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.components.PrimaryButton
import com.danipinion.sobatwiff.ui.components.StandardHeader
import com.danipinion.sobatwiff.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random
import kotlinx.coroutines.delay

import androidx.lifecycle.viewmodel.compose.viewModel
import com.danipinion.sobatwiff.ui.viewmodels.SpeedtestViewModel

data class HistoryItem(
        val download: String,
        val upload: String,
        val ping: String,
        val time: String
)

@Composable
fun SpeedtestScreen(onBack: () -> Unit) {
    val viewModel: SpeedtestViewModel = viewModel()
    val context = androidx.compose.ui.platform.LocalContext.current
    
    LaunchedEffect(Unit) {
        viewModel.updateNetworkInfo(context)
    }
    
    val isTesting = viewModel.isTesting
    val currentStep = viewModel.currentStep
    val downloadSpeed = viewModel.downloadSpeed
    val uploadSpeed = viewModel.uploadSpeed
    val ping = viewModel.ping
    val jitter = viewModel.jitter
    
    val history = remember { mutableStateListOf<HistoryItem>() }

    val animatedSpeed by
            animateFloatAsState(
                    targetValue =
                            if (currentStep == TestStep.DOWNLOAD) downloadSpeed
                            else if (currentStep == TestStep.UPLOAD) uploadSpeed else 0f,
                    animationSpec = tween(durationMillis = 200, easing = LinearEasing),
                    label = "speed"
            )

    // Sync history when test completes
    LaunchedEffect(currentStep) {
        if (currentStep == TestStep.COMPLETED) {
            val time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            history.add(
                0,
                HistoryItem(
                    download = String.format("%.1f", downloadSpeed),
                    upload = String.format("%.1f", uploadSpeed),
                    ping = ping.toString(),
                    time = time
                )
            )
            if (history.size > 5) {
                history.removeLast()
            }
        }
    }

    Scaffold(
            topBar = {
                StandardHeader(
                        title = "Speedtest",
                        subtitle = "Uji kecepatan internet Anda",
                        useGradient = false, // Solid color for better readability
                        action = {
                            IconButton(onClick = onBack) {
                                Icon(
                                        Icons.Default.Close,
                                        contentDescription = "Close",
                                        tint = Color.White
                                )
                            }
                        }
                )
            }
    ) { paddingValues ->
        Column(
                modifier =
                        Modifier.fillMaxSize()
                                .padding(paddingValues)
                                .background(BackgroundBlue)
                                .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            // Network Info Card
            Card(
                modifier = Modifier.padding(horizontal = 24.dp).fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(CircleShape).background(BackgroundBlue),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (viewModel.linkSpeed != null) Icons.Default.Wifi else Icons.Default.SignalCellularAlt,
                            contentDescription = null,
                            tint = BluePrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(text = viewModel.networkName, color = TextDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        viewModel.linkSpeed?.let {
                            Text(text = "Kecepatan Link: $it Mbps", color = TextMedium, fontSize = 12.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Speed Gauge
            SpeedGauge(
                    speed = animatedSpeed,
                    maxSpeed = 100f,
                    isTesting = isTesting,
                    step = currentStep
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Results Row
            Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                    horizontalArrangement = Arrangement.SpaceAround
            ) {
                ResultItem(
                        label = "PING",
                        value = if (ping > 0) "$ping ms" else "-",
                        icon = Icons.Default.Timer
                )
                ResultItem(
                        label = "DOWNLOAD",
                        value =
                                if (downloadSpeed > 0)
                                        String.format("%.1f", downloadSpeed) + " Mbps"
                                else "-",
                        icon = Icons.Default.Download
                )
                ResultItem(
                        label = "UPLOAD",
                        value =
                                if (uploadSpeed > 0) String.format("%.1f", uploadSpeed) + " Mbps"
                                else "-",
                        icon = Icons.Default.Upload
                )
            }

            if (history.isNotEmpty() && !isTesting) {
                SpeedtestHistorySection(history)
            }

            Spacer(modifier = Modifier.height(100.dp))
        }

        // Floating Action Button Style for Mulai Speedtest
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Box(
                    modifier = Modifier.padding(bottom = 32.dp).fillMaxWidth(),
                    contentAlignment = Alignment.Center
            ) {
                if (currentStep == TestStep.IDLE || currentStep == TestStep.COMPLETED) {
                    PrimaryButton(
                            text =
                                    if (currentStep == TestStep.COMPLETED) "Uji Lagi"
                                    else "Mulai Speedtest",
                            onClick = {
                                viewModel.startTest()
                            },
                            modifier = Modifier.fillMaxWidth(0.8f).height(56.dp),
                            icon = Icons.Default.PlayArrow
                    )
                } else {
                    Text(
                            text =
                                    when (currentStep) {
                                        TestStep.PING -> "Inisialisasi..."
                                        TestStep.DOWNLOAD -> "Menguji Unduhan..."
                                        TestStep.UPLOAD -> "Menguji Unggahan..."
                                        else -> ""
                                    },
                            color = BluePrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                    )
                }
            }
        }
    }
}

@Composable
fun SpeedGauge(speed: Float, maxSpeed: Float, isTesting: Boolean, step: TestStep) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by
            infiniteTransition.animateFloat(
                    initialValue = 0.2f,
                    targetValue = 0.5f,
                    animationSpec =
                            infiniteRepeatable(
                                    animation = tween(1000, easing = FastOutSlowInEasing),
                                    repeatMode = RepeatMode.Reverse
                            ),
                    label = "alpha"
            )

    Box(modifier = Modifier.size(280.dp), contentAlignment = Alignment.Center) {
        // Outer pulsing circle when testing
        if (isTesting) {
            Box(
                    modifier =
                            Modifier.fillMaxSize()
                                    .clip(CircleShape)
                                    .background(BluePrimary.copy(alpha = pulseAlpha))
            )
        }

        Canvas(modifier = Modifier.size(240.dp)) {
            val center = size / 2f

            // Background Arc
            drawArc(
                    color = Color.White.copy(alpha = 0.3f),
                    startAngle = 135f,
                    sweepAngle = 270f,
                    useCenter = false,
                    style = Stroke(width = 16.dp.toPx(), cap = StrokeCap.Round)
            )

            // Progress Arc
            val sweep = (speed / maxSpeed) * 270f
            drawArc(
                    brush = Brush.linearGradient(colors = listOf(BluePrimary, Color(0xFF00BCD4))),
                    startAngle = 135f,
                    sweepAngle = sweep.coerceAtLeast(0.1f),
                    useCenter = false,
                    style = Stroke(width = 16.dp.toPx(), cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                    text = String.format("%.1f", speed),
                    fontSize = 56.sp,
                    fontWeight = FontWeight.Black,
                    color = BluePrimary
            )
            Text(text = "Mbps", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextMedium)

            Spacer(modifier = Modifier.height(16.dp))

            StatusTag(step)
        }
    }
}

@Composable
fun StatusTag(step: TestStep) {
    val color =
            when (step) {
                TestStep.IDLE -> TextLocked
                TestStep.PING -> Color(0xFF9C27B0)
                TestStep.DOWNLOAD -> BluePrimary
                TestStep.UPLOAD -> Color(0xFF4CAF50)
                TestStep.COMPLETED -> Color(0xFFFF9800)
            }

    Box(
            modifier =
                    Modifier.clip(RoundedCornerShape(20.dp))
                            .background(color.copy(alpha = 0.1f))
                            .padding(horizontal = 16.dp, vertical = 6.dp)
    ) {
        Text(
                text =
                        when (step) {
                            TestStep.IDLE -> "READY"
                            TestStep.PING -> "PINGING..."
                            TestStep.DOWNLOAD -> "DOWNLOADING"
                            TestStep.UPLOAD -> "UPLOADING"
                            TestStep.COMPLETED -> "FINISHED"
                        },
                color = color,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun ResultItem(label: String, value: String, icon: ImageVector) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(
                imageVector = icon,
                contentDescription = null,
                tint = TextMedium,
                modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, color = TextLocked, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(text = value, color = TextDark, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SpeedtestHistorySection(history: List<HistoryItem>) {
    Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp).fillMaxWidth()) {
        Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                    text = "Riwayat Pengujian",
                    color = TextDark,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Table Header
        Surface(
                color = Color.White.copy(alpha = 0.5f),
                shape = RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp),
                modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                        text = "Waktu",
                        modifier = Modifier.weight(1.2f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMedium
                )
                Text(
                        text = "Ping",
                        modifier = Modifier.weight(1f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMedium
                )
                Text(
                        text = "Down",
                        modifier = Modifier.weight(1.5f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMedium
                )
                Text(
                        text = "Up",
                        modifier = Modifier.weight(1.5f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMedium
                )
            }
        }

        // Table Rows
        history.forEachIndexed { index, item ->
            Surface(
                    color = Color.White,
                    shape =
                            if (index == history.size - 1)
                                    RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp)
                            else RoundedCornerShape(0.dp),
                    modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                                text = item.time,
                                modifier = Modifier.weight(1.2f),
                                fontSize = 13.sp,
                                color = TextDark
                        )
                        Text(
                                text = "${item.ping}ms",
                                modifier = Modifier.weight(1f),
                                fontSize = 13.sp,
                                color = TextDark
                        )
                        Text(
                                text = item.download,
                                modifier = Modifier.weight(1.5f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = BluePrimary
                        )
                        Text(
                                text = item.upload,
                                modifier = Modifier.weight(1.5f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF4CAF50)
                        )
                    }
                    if (index < history.size - 1) {
                        androidx.compose.material3.HorizontalDivider(
                                modifier = Modifier.padding(horizontal = 12.dp),
                                thickness = 0.5.dp,
                                color = BackgroundBlue
                        )
                    }
                }
            }
        }
    }
}

enum class TestStep {
    IDLE,
    PING,
    DOWNLOAD,
    UPLOAD,
    COMPLETED
}
