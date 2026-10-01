package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.components.*
import com.danipinion.sobatwiff.model.NotificationStore
import android.os.Build
import android.util.Log
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: com.danipinion.sobatwiff.ui.viewmodels.HomeViewModel,
    notificationViewModel: com.danipinion.sobatwiff.ui.viewmodels.NotificationViewModel,
    onNavigateToSpeedtest: () -> Unit = {},
    onNavigateToReferral: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToPayment: (String) -> Unit = {},
    routerViewModel: com.danipinion.sobatwiff.ui.viewmodels.RouterViewModel? = null
) {
    LaunchedEffect(Unit) {
        notificationViewModel.fetchNotifications()
        routerViewModel?.fetchRouterInfo()
    }
    
    var selectedAnnouncement by remember { mutableStateOf<com.danipinion.sobatwiff.data.remote.model.AnnouncementDto?>(null) }

    // Mock urgent announcement state
    val hasUrgentAnnouncement = true 

    PullToRefreshBox(
        isRefreshing = viewModel.isLoading,
        onRefresh = { 
            viewModel.loadData()
            notificationViewModel.fetchNotifications()
            routerViewModel?.fetchRouterInfo()
        },
        modifier = Modifier.fillMaxSize()
    ) {
        LazyColumn(
                modifier = Modifier.fillMaxSize().background(BackgroundBlue),
                contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            // 1. Header Section
            item { 
                HomeHeader(
                    viewModel = viewModel,
                    name = viewModel.userProfile?.name ?: "User",
                    customerId = viewModel.userProfile?.idNumber ?: viewModel.userProfile?.id?.takeLast(8)?.uppercase() ?: "---",
                    unreadCount = notificationViewModel.unreadCount,
                    onNavigateToNotifications = onNavigateToNotifications
                ) 
            }

            // 2. Urgent Announcements
            viewModel.homeData?.announcements?.filter { it.isUrgent }?.forEach { announcement ->
                item { 
                    UrgentAnnouncementSection(
                        title = announcement.title,
                        content = announcement.content,
                        endDate = announcement.endDate,
                        onClick = { selectedAnnouncement = announcement }
                    ) 
                }
            }

            // 3. Billing Section
            item { 
                BillingSection(
                    invoice = viewModel.homeData?.oldestUnpaidInvoice,
                    onPayClick = { viewModel.homeData?.oldestUnpaidInvoice?.id?.let { onNavigateToPayment(it) } }
                ) 
            }

            // 4. Quick Actions
            item {
                QuickActionsGrid(
                    onNavigateToSpeedtest = onNavigateToSpeedtest,
                    onNavigateToReferral = onNavigateToReferral
                )
            }

            // 5. Promo/Info Carousel
            val normalAnnouncements = viewModel.homeData?.announcements?.filter { !it.isUrgent } ?: emptyList()
            if (normalAnnouncements.isNotEmpty()) {
                item { 
                    InfoCarousel(
                        announcements = normalAnnouncements,
                        onAnnouncementClick = { selectedAnnouncement = it }
                    ) 
                }
            }

            // 6. Connection Status & Details
            item { 
                val routerInfo = (routerViewModel?.state as? com.danipinion.sobatwiff.ui.viewmodels.RouterState.Success)?.info
                ConnectionDetailSection(
                    userProfile = viewModel.userProfile,
                    latestInvoice = viewModel.homeData?.oldestUnpaidInvoice,
                    routerInfo = routerInfo
                ) 
            }
        }

        // --- DETAIL DIALOG ---
        if (selectedAnnouncement != null) {
            AnnouncementDetailDialog(
                announcement = selectedAnnouncement!!,
                onDismiss = { selectedAnnouncement = null }
            )
        }
    }
}

@Composable
fun UrgentAnnouncementSection(
    title: String, 
    content: String, 
    endDate: String? = null,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 8.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE)), // Light Red background
        border = BorderStroke(1.dp, Color(0xFFEF5350).copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFEF5350).copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = Color(0xFFEF5350),
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    color = Color(0xFFB71C1C),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = content,
                    color = Color(0xFFC62828),
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
                if (endDate != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    CountdownText(targetDate = endDate, color = Color(0xFFEF5350))
                }
            }
        }
    }
}

@Composable
fun HomeHeader(
    viewModel: com.danipinion.sobatwiff.ui.viewmodels.HomeViewModel,
    name: String,
    customerId: String,
    unreadCount: Int,
    onNavigateToNotifications: () -> Unit
) {
    StandardHeader(
        title = "Halo, $name!",
        subtitle = "ID Pelanggan: $customerId",
        action = {
            BadgedBox(
                badge = {
                    if (unreadCount > 0) {
                        Badge(
                            containerColor = Color.Red,
                            contentColor = Color.White
                        ) {
                            Text(text = unreadCount.toString())
                        }
                    }
                }
            ) {
                IconButton(onClick = onNavigateToNotifications) {
                    Icon(
                        imageVector = Icons.Outlined.Notifications,
                        contentDescription = "Notifications",
                        tint = Color.White
                    )
                }
            }
        }
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // Connection Summary Card (Floating feel)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp).fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconBox(
                        icon = Icons.Default.Wifi,
                        backgroundColor = PastelBlueLight
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(text = "Paket Aktif", color = TextMedium, fontSize = 12.sp)
                        val abonemen = viewModel.homeData?.user?.abonemen ?: viewModel.userProfile?.abonemen ?: 0f
                        val abonemenText = if (abonemen >= 1000) {
                            "${(abonemen / 1000).toInt()}K"
                        } else {
                            abonemen.toInt().toString()
                        }
                        Text(
                            text = "Abonemen $abonemenText",
                            color = TextDark,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Status", color = TextMedium, fontSize = 12.sp)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier =
                                    Modifier.size(8.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFF4CAF50))
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Terhubung",
                            color = Color(0xFF4CAF50),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BillingSection(
    invoice: com.danipinion.sobatwiff.data.remote.model.InvoiceDto?,
    onPayClick: () -> Unit
) {
    val months = listOf(
        "", "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    )

    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        SectionHeader(title = "Tagihan Saya")

        Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
        ) {
            if (invoice != null) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            val period = "${months.getOrNull(invoice.month)} ${invoice.year}"
                            Text(text = "Periode $period", color = TextMedium, fontSize = 13.sp)
                            
                            java.text.NumberFormat.getCurrencyInstance(java.util.Locale("id", "ID")).let { format ->
                                Text(
                                    text = format.format(invoice.amount),
                                    color = BluePrimary,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                        Box(
                                modifier =
                                        Modifier.clip(RoundedCornerShape(8.dp))
                                                .background(Color(0xFFFFF3E0))
                                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                    text = "Belum Lunas",
                                    color = Color(0xFFFF9800),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = BackgroundBlue)
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                    Icons.Default.EventNote,
                                    contentDescription = null,
                                    tint = TextLocked,
                                    modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                    text = "Pengingat Pembayaran",
                                    color = TextMedium,
                                    fontSize = 12.sp
                            )
                        }

                        PrimaryButton(
                                text = if (invoice?.isPaymentInProgress == true) "Lanjutkan Pembayaran" else "Bayar",
                                onClick = onPayClick,
                                modifier = Modifier.wrapContentWidth()
                        )
                    }
                }
            } else {
                // All Paid - Thank you message
                Column(
                    modifier = Modifier.padding(24.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFE8F5E9)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF4CAF50),
                            modifier = Modifier.size(32.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Terima Kasih Banyak!",
                        color = TextDark,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Semua tagihan Anda telah terbayar lunas. Kami sangat menghargai dukungan dan kepercayaan Anda terhadap layanan kami.",
                        color = TextMedium,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}

@Composable
fun QuickActionsGrid(
    onNavigateToSpeedtest: () -> Unit,
    onNavigateToReferral: () -> Unit
) {
    val actions =
            listOf(
                    QuickActionItem(
                            "Speedtest",
                            Icons.Default.Speed,
                            Color(0xFFE3F2FD),
                            Color(0xFF2196F3)
                    ),
                    QuickActionItem(
                            "Referral",
                            Icons.Default.CardGiftcard,
                            Color(0xFFF3E5F5),
                            Color(0xFF9C27B0)
                    )
            )

    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        SectionHeader(title = "Menu")

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            actions.forEach { action ->
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            when (action.label) {
                                "Speedtest" -> onNavigateToSpeedtest()
                                "Referral" -> onNavigateToReferral()
                            }
                        },
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
                    border = BorderStroke(1.dp, BackgroundBlue)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        IconBox(
                            icon = action.icon,
                            iconColor = action.iconColor,
                            backgroundColor = action.bgColor,
                            size = 36.dp,
                            iconSize = 18.dp,
                            shape = RoundedCornerShape(10.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = action.label,
                            color = TextDark,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

data class QuickActionItem(
        val label: String,
        val icon: ImageVector,
        val bgColor: Color,
        val iconColor: Color
)

fun getAnnouncementColor(announcement: com.danipinion.sobatwiff.data.remote.model.AnnouncementDto): Color {
    val colors = listOf( 
        Color(0xFF3949AB), // Indigo
        Color(0xFF00897B), // Teal
        Color(0xFF8E24AA), // Purple
        Color(0xFFE65100)  // Orange
    )
    return if (announcement.isUrgent) Color(0xFFC62828) 
    else colors[(announcement.id.hashCode().let { if (it < 0) -it else it }) % colors.size]
}

@Composable
fun InfoCarousel(
    announcements: List<com.danipinion.sobatwiff.data.remote.model.AnnouncementDto>,
    onAnnouncementClick: (com.danipinion.sobatwiff.data.remote.model.AnnouncementDto) -> Unit
) {
    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        Text(
                text = "Info & Promo",
                color = TextDark,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 24.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(
                contentPadding = PaddingValues(horizontal = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(announcements.size) { index ->
                val announcement = announcements[index]
                val color = getAnnouncementColor(announcement)
                
                Card(
                        modifier = Modifier
                            .width(300.dp)
                            .clickable { onAnnouncementClick(announcement) },
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = color)
                ) {
                    Box(modifier = Modifier.fillMaxWidth().height(190.dp)) {
                        // --- DECORATIONS ---
                        Box(
                            modifier = Modifier
                                .size(140.dp)
                                .align(Alignment.BottomEnd)
                                .offset(x = 30.dp, y = 30.dp)
                                .background(Color.White.copy(alpha = 0.15f), CircleShape)
                        )
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .align(Alignment.TopStart)
                                .offset(x = (-20).dp, y = (-20).dp)
                                .background(Color.White.copy(alpha = 0.1f), CircleShape)
                        )

                        // --- CONTENT ---
                        Column(
                            modifier = Modifier.fillMaxSize().padding(20.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Box(
                                    modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                        .background(Color.White.copy(alpha = 0.2f))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = announcement.type,
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = announcement.title,
                                    color = Color.White,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = announcement.content,
                                    color = Color.White.copy(alpha = 0.8f),
                                    fontSize = 12.sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            
                            if (announcement.endDate != null) {
                                CountdownText(targetDate = announcement.endDate, color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}


@Composable
fun ConnectionDetailSection(
    userProfile: com.danipinion.sobatwiff.data.local.UserCache?,
    latestInvoice: com.danipinion.sobatwiff.data.remote.model.InvoiceDto?,
    routerInfo: com.danipinion.sobatwiff.data.remote.model.RouterInfo?
) {
    val monthNames = listOf("", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des")
    
    // Logic for Account ID
    val accountId = userProfile?.idNumber ?: userProfile?.id?.takeLast(8)?.uppercase() ?: "---"
    
    // Logic for Masa Aktif (Simplified: If paid, active until 20 next month. If not, 20 current month)
    val calendar = java.util.Calendar.getInstance()
    val currentDay = calendar.get(java.util.Calendar.DAY_OF_MONTH)
    
    val activeDate = if (latestInvoice == null) {
        // No unpaid invoices, means active for current and next period
        // If it's before 20th, it's until 20th of this month (minimal)
        // But usually it means the NEXT billing cycle is the target
        calendar.add(java.util.Calendar.MONTH, 1)
        "20 ${monthNames[calendar.get(java.util.Calendar.MONTH) + 1]} ${calendar.get(java.util.Calendar.YEAR)}"
    } else {
        // Has unpaid invoice
        "20 ${monthNames[latestInvoice.month]} ${latestInvoice.year}"
    }

    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        SectionHeader(title = "Rangkuman Layanan")

        Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                InfoRow(
                    icon = Icons.Default.Router, 
                    label = "IP Router", 
                    value = routerInfo?.ip?.let { ip ->
                        val parts = ip.split(".")
                        if (parts.size >= 2) "${parts[0]}.${parts[1]}.***.***" else ip
                    } ?: "---"
                )
                InfoRow(
                    icon = Icons.Default.Devices, 
                    label = "Model ONT", 
                    value = routerInfo?.model ?: "---"
                )
                InfoRow(
                        icon = Icons.Default.DateRange,
                        label = "Masa Aktif hingga",
                        value = activeDate
                )
                InfoRow(
                        icon = Icons.Default.VerifiedUser,
                        label = "Account ID",
                        value = accountId,
                        isLast = true
                )
            }
        }
    }
}

@Composable
fun CountdownText(
    targetDate: String,
    prefix: String = "Berakhir: ",
    color: Color = Color.White
) {
    var timeLeft by remember { mutableStateOf("...") }
    val isRed = color != Color.White
    
    LaunchedEffect(targetDate) {
        Log.d("SobatWiff", "Timer target: $targetDate")
        while(true) {
            val now = System.currentTimeMillis()
            val target = try { 
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    java.time.Instant.parse(targetDate).toEpochMilli()
                } else {
                    val formats = listOf(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                        "yyyy-MM-dd'T'HH:mm:ss'Z'"
                    )
                    var parsedTime = 0L
                    for (fmt in formats) {
                        try {
                            parsedTime = java.text.SimpleDateFormat(fmt, java.util.Locale.US).apply {
                                timeZone = java.util.TimeZone.getTimeZone("UTC")
                            }.parse(targetDate)?.time ?: 0L
                            if (parsedTime > 0L) break
                        } catch (e: Exception) { continue }
                    }
                    parsedTime
                }
            } catch (e: Exception) { 0L }

            if (target == 0L) {
                timeLeft = "ERR"
                break
            }

            val diff = target - now
            if (diff <= 0) {
                timeLeft = "Habis"
                break
            } else {
                val d = diff / (1000 * 60 * 60 * 24)
                val h = (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                val m = (diff % (1000 * 60 * 60)) / (1000 * 60)
                val s = (diff % (1000 * 60)) / 1000
                timeLeft = if (d > 0) "${d}h ${h}j" else "${h}j ${m}m ${s}s"
            }
            delay(1000)
        }
    }
    
    Surface(
        color = if (isRed) Color(0xFFFF5252).copy(alpha = 0.15f) else Color.White.copy(alpha = 0.2f),
        shape = RoundedCornerShape(6.dp),
        modifier = Modifier.padding(top = 6.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Schedule, 
                contentDescription = null, 
                modifier = Modifier.size(13.dp), 
                tint = if (isRed) Color(0xFFFF5252) else Color.White
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "$prefix$timeLeft", 
                color = if (isRed) Color(0xFFD32F2F) else Color.White, 
                fontSize = 11.sp, 
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.3.sp
            )
        }
    }
}
@Composable
fun AnnouncementDetailDialog(
    announcement: com.danipinion.sobatwiff.data.remote.model.AnnouncementDto,
    onDismiss: () -> Unit
) {
    val baseColor = getAnnouncementColor(announcement)

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onDismiss
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = baseColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 350.dp, max = 650.dp)
            ) {
                // --- PREMIUM DECORATIONS (Spirals, Waves, Confetti) ---
                Canvas(modifier = Modifier.matchParentSize()) {
                    // 1. Abstract Spirals
                    val spiralPath1 = androidx.compose.ui.graphics.Path().apply {
                        val centerX = size.width * 0.1f
                        val centerY = size.height * 0.1f
                        moveTo(centerX, centerY)
                        for (i in 0..300) {
                            val angle = 0.1f * i
                            val x = centerX + (angle * 2.5f) * Math.cos(angle.toDouble()).toFloat()
                            val y = centerY + (angle * 2.5f) * Math.sin(angle.toDouble()).toFloat()
                            lineTo(x, y)
                        }
                    }
                    drawPath(path = spiralPath1, color = Color.White.copy(alpha = 0.08f), style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f))

                    // 2. Wave Lines
                    val wavePath = androidx.compose.ui.graphics.Path().apply {
                        val step = 10f
                        moveTo(0f, size.height * 0.7f)
                        for (x in 0..(size.width.toInt()) step 10) {
                            val y = size.height * 0.7f + Math.sin(x * 0.03).toFloat() * 30f
                            lineTo(x.toFloat(), y)
                        }
                    }
                    drawPath(path = wavePath, color = Color.White.copy(alpha = 0.06f), style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3f, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)))

                    // 3. Large Confetti Particles
                    val random = java.util.Random(announcement.id.hashCode().toLong())
                    repeat(30) {
                        val x = random.nextFloat() * size.width
                        val y = random.nextFloat() * size.height
                        val pSize = (random.nextFloat() * 6 + 6).dp.toPx() // 6dp to 12dp
                        if (it % 3 == 0) {
                            drawCircle(color = Color.White.copy(alpha = 0.12f), radius = pSize / 2, center = androidx.compose.ui.geometry.Offset(x, y))
                        } else if (it % 3 == 1) {
                            drawRect(color = Color.White.copy(alpha = 0.08f), size = androidx.compose.ui.geometry.Size(pSize, pSize), topLeft = androidx.compose.ui.geometry.Offset(x, y))
                        } else {
                            // Triangle
                            val triPath = androidx.compose.ui.graphics.Path().apply {
                                moveTo(x, y)
                                lineTo(x + pSize, y)
                                lineTo(x + pSize / 2, y - pSize)
                                close()
                            }
                            drawPath(path = triPath, color = Color.White.copy(alpha = 0.07f))
                        }
                    }
                }

                // --- FLOATING CIRCLES ---
                // Right Bottom Large
                Box(
                    modifier = Modifier.size(160.dp).align(Alignment.BottomEnd).offset(x = 40.dp, y = 40.dp)
                        .background(Color.White.copy(alpha = 0.12f), CircleShape)
                )
                // Top Right Medium
                Box(
                    modifier = Modifier.size(100.dp).align(Alignment.TopEnd).offset(x = 20.dp, y = (-30).dp)
                        .background(Color.White.copy(alpha = 0.08f), CircleShape)
                )
                // Center Left Small
                Box(
                    modifier = Modifier.size(70.dp).align(Alignment.CenterStart).offset(x = (-30).dp, y = 80.dp)
                        .background(Color.White.copy(alpha = 0.06f), CircleShape)
                )
                // Top Left X-Small
                Box(
                    modifier = Modifier.size(40.dp).align(Alignment.TopStart).offset(x = 20.dp, y = 60.dp)
                        .background(Color.White.copy(alpha = 0.1f), CircleShape)
                )

                // --- CONTENT ---
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(28.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Type Badge
                    Surface(
                        color = Color.White.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = announcement.type,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Title
                    Text(
                        text = announcement.title,
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 32.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Small Divider Shape
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.15f)
                            .height(3.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.4f))
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Full Content
                    Text(
                        text = announcement.content,
                        color = Color.White.copy(alpha = 0.95f),
                        fontSize = 15.sp,
                        lineHeight = 22.sp,
                        fontWeight = FontWeight.Medium
                    )

                    if (announcement.endDate != null) {
                        Spacer(modifier = Modifier.height(24.dp))
                        CountdownText(
                            targetDate = announcement.endDate, 
                            prefix = "Promo Selesai: ",
                            color = Color.White
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(20.dp))
                }

                // --- CLOSE BUTTON ---
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .size(36.dp)
                        .background(Color.Black.copy(alpha = 0.2f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
