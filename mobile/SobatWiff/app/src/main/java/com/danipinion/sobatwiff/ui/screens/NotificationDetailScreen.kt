package com.danipinion.sobatwiff.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.data.remote.model.NotificationDto
import com.danipinion.sobatwiff.ui.components.PrimaryButton
import com.danipinion.sobatwiff.ui.theme.*
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationDetailScreen(
    notification: NotificationDto,
    onBack: () -> Unit,
    onMarkRead: (String) -> Unit,
    onDelete: (String) -> Unit
) {
    // Mark as read when opened
    if (!notification.isRead) {
        onMarkRead(notification.id)
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Detail Aktivitas", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        onDelete(notification.id)
                        onBack()
                    }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Red)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = SurfaceBlue,
                    titleContentColor = BluePrimary,
                    navigationIconContentColor = BluePrimary,
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
                .padding(24.dp)
        ) {
            val (icon, color) = getNotifVisuals(notification.type)
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(color.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = color,
                            modifier = Modifier.size(36.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = notification.title,
                        color = TextDark,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = formatDate(notification.createdAt),
                        color = TextLocked,
                        fontSize = 13.sp
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    HorizontalDivider(color = BackgroundBlue)

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = notification.content,
                        color = TextMedium,
                        fontSize = 15.sp,
                        lineHeight = 22.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    PrimaryButton(
                        text = "Tutup",
                        onClick = onBack,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
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

private fun formatDate(iso: String): String {
    return try {
        // Simple mock for now, can use java.time if minSdk is 26+
        iso.split("T")[0]
    } catch (e: Exception) {
        iso
    }
}
