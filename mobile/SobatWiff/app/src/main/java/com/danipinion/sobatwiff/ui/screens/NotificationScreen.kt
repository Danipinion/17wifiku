package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.data.remote.model.NotificationDto
import com.danipinion.sobatwiff.ui.components.StandardHeader
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.viewmodels.NotificationViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScreen(
    viewModel: NotificationViewModel,
    onBack: () -> Unit,
    onNotificationClick: (NotificationDto) -> Unit
) {
    LaunchedEffect(Unit) {
        viewModel.fetchNotifications()
    }

    Scaffold(
        topBar = {
            StandardHeader(
                title = "Notifikasi",
                subtitle = "Log aktivitas dan informasi terbaru",
                useGradient = false, // Solid background
                action = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.background(Color.White.copy(alpha = 0.2f), CircleShape)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }
            )
        },
        floatingActionButton = {
            if (viewModel.notifications.isNotEmpty()) {
                Card(
                    modifier = Modifier
                        .padding(bottom = 16.dp),
                    shape = RoundedCornerShape(32.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(
                            onClick = { viewModel.markAsRead() },
                            colors = ButtonDefaults.textButtonColors(contentColor = BluePrimary)
                        ) {
                            Icon(Icons.Default.DoneAll, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Baca Semua", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        
                        Box(modifier = Modifier.height(24.dp).width(1.dp).background(BackgroundBlue))
                        
                        TextButton(
                            onClick = { viewModel.deleteNotification() },
                            colors = ButtonDefaults.textButtonColors(contentColor = Color.Red)
                        ) {
                            Icon(Icons.Default.DeleteSweep, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Hapus Semua", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        },
        floatingActionButtonPosition = FabPosition.Center
    ) { paddingValues ->
        PullToRefreshBox(
            isRefreshing = viewModel.isRefreshing,
            onRefresh = { viewModel.fetchNotifications() },
            modifier = Modifier.padding(paddingValues)
        ) {
            if (viewModel.notifications.isEmpty()) {
                EmptyNotificationState()
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(BackgroundBlue),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(viewModel.notifications, key = { it.id }) { notification ->
                        NotificationItem(
                            notification = notification,
                            onClick = { onNotificationClick(notification) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NotificationItem(
    notification: NotificationDto,
    onClick: () -> Unit
) {
    val (icon, color) = getNotifVisuals(notification.type)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = SurfaceBlue
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (notification.isRead) 0.dp else 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = notification.title,
                        color = TextDark,
                        fontSize = 15.sp,
                        fontWeight = if (notification.isRead) FontWeight.SemiBold else FontWeight.Bold
                    )
                    if (!notification.isRead) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(BluePrimary, CircleShape)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = notification.content,
                    color = TextMedium,
                    fontSize = 13.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = formatRelDate(notification.createdAt),
                    color = TextLocked,
                    fontSize = 11.sp
                )
            }
        }
    }
}

private fun getNotifVisuals(type: String): Pair<ImageVector, Color> {
    return when (type.uppercase()) {
        "BILLING" -> Icons.Default.ReceiptLong to Color(0xFFE91E63)
        "PROMO" -> Icons.Default.LocalOffer to Color(0xFF9C27B0)
        "SYSTEM" -> Icons.Default.SettingsSuggest to Color(0xFF2196F3)
        "COMPLAINT" -> Icons.Default.SupportAgent to Color(0xFFFF9800)
        else -> Icons.Default.Notifications to Color(0xFF2196F3)
    }
}

private fun formatRelDate(iso: String): String {
    return try {
        // Simple mock for now
        iso.split("T")[0]
    } catch (e: Exception) {
        iso
    }
}

@Composable
fun EmptyNotificationState() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlue),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Outlined.NotificationsNone,
                contentDescription = null,
                modifier = Modifier.size(80.dp),
                tint = TextLocked.copy(alpha = 0.3f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Belum ada notifikasi",
                color = TextMedium,
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "Semua aktivitas Anda akan muncul disini",
                color = TextLocked,
                fontSize = 14.sp
            )
        }
    }
}
