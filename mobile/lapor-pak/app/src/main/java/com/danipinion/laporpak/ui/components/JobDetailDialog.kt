package com.danipinion.laporpak.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.ui.platform.LocalContext
import com.danipinion.laporpak.ui.theme.toDp

@Composable
fun JobDetailDialog(
    title: String,
    date: String,
    statusLabel: String,
    statusColor: Color,
    statusBgColor: Color,
    notes: String?,
    location: String?,
    photoUrl: String?,
    onDismiss: () -> Unit,
    onLocationClick: (() -> Unit)? = null
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false, 
            dismissOnClickOutside = true, 
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f)) // Semi-transparent overlay
                .padding(24.dp)
                .clickable(
                    interactionSource = androidx.compose.foundation.interaction.MutableInteractionSource(),
                    indication = null,
                    onClick = onDismiss
                ),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        interactionSource = androidx.compose.foundation.interaction.MutableInteractionSource(),
                        indication = null,
                        onClick = {} // Consume click here
                    ),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Photo Header
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .background(Color(0xFFF1F5F9))
                    ) {
                        if (!photoUrl.isNullOrEmpty()) {
                            val context = LocalContext.current
                            AsyncImage(
                                model = ImageRequest.Builder(context)
                                    .data(photoUrl)
                                    .crossfade(true)
                                    .addHeader("User-Agent", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36")
                                    .build(),
                                contentDescription = "Bukti Pekerjaan",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Text(
                                text = "Tidak ada foto bukti", 
                                modifier = Modifier.align(Alignment.Center), 
                                color = Color.Gray,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        
                        // Close button
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(12.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.5f))
                                .size(32.sp.toDp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Color.White, modifier = Modifier.size(16.sp.toDp))
                        }
                    }

                    // Detail Content
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = title,
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF1E293B)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = date,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF64748B)
                                )
                            }
                            
                            Spacer(modifier = Modifier.width(12.dp))
                            
                            // Status Badge
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = statusBgColor,
                                contentColor = statusColor
                            ) {
                                Text(
                                    text = statusLabel,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))
                        HorizontalDivider(color = Color(0xFFF1F5F9))
                        Spacer(modifier = Modifier.height(16.dp))

                        // Location Area
                        Row(verticalAlignment = Alignment.Top) {
                            Icon(Icons.Default.LocationOn, contentDescription = "Lokasi", tint = Color(0xFF1976D2), modifier = Modifier.size(20.sp.toDp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Lokasi Pekerjaan", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF1E293B))
                                Text(
                                    text = location ?: "Belum ada lokasi yang direkam", 
                                    style = MaterialTheme.typography.bodyMedium, 
                                    color = if (location != null && onLocationClick != null) Color(0xFF1976D2) else Color(0xFF64748B),
                                    modifier = Modifier.then(
                                        if (location != null && onLocationClick != null) Modifier.clickable { onLocationClick() } else Modifier
                                    ),
                                    textDecoration = if (location != null && onLocationClick != null) androidx.compose.ui.text.style.TextDecoration.Underline else null
                                )
                            }
                        }

                        // Notes Area
                        if (!notes.isNullOrEmpty()) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(verticalAlignment = Alignment.Top) {
                                Icon(Icons.Default.Info, contentDescription = "Catatan", tint = Color(0xFFF57F17), modifier = Modifier.size(20.sp.toDp))
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Catatan Tambahan", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF1E293B))
                                    Text(
                                        text = notes, 
                                        style = MaterialTheme.typography.bodyMedium, 
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
