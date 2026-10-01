package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.components.*
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.viewmodels.SecurityViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SecurityScreen(
    viewModel: SecurityViewModel,
    onBack: () -> Unit
) {
    var oldPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    
    var showOldPassword by remember { mutableStateOf(false) }
    var showNewPassword by remember { mutableStateOf(false) }
    var showConfirmPassword by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "Keamanan & Sandi",
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
            // Status Message Animation
            AnimatedVisibility(
                visible = viewModel.statusMessage != null,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Surface(
                    color = if (viewModel.isSuccess) Color(0xFFE8F5E9) else Color(0xFFFFEBEE),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.padding(bottom = 16.dp).fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (viewModel.isSuccess) Icons.Default.CheckCircle else Icons.Default.Error,
                            contentDescription = null,
                            tint = if (viewModel.isSuccess) Color(0xFF4CAF50) else Color(0xFFD32F2F)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            viewModel.statusMessage ?: "",
                            color = if (viewModel.isSuccess) Color(0xFF2E7D32) else Color(0xFFC62828),
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // Section: Kata Sandi
            SecuritySectionHeader(title = "Ubah Kata Sandi", icon = Icons.Default.Lock)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = Color.White,
                shadowElevation = 1.dp
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    StandardTextField(
                        value = oldPassword,
                        onValueChange = { oldPassword = it },
                        label = "Kata Sandi Lama",
                        placeholder = "Masukkan sandi lama",
                        isPassword = true,
                        passwordVisible = showOldPassword,
                        onPasswordToggle = { showOldPassword = !showOldPassword }
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    StandardTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = "Kata Sandi Baru",
                        placeholder = "Minimal 8 karakter",
                        isPassword = true,
                        passwordVisible = showNewPassword,
                        onPasswordToggle = { showNewPassword = !showNewPassword }
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    StandardTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        label = "Konfirmasi Sandi Baru",
                        placeholder = "Ulangi sandi baru",
                        isPassword = true,
                        passwordVisible = showConfirmPassword,
                        onPasswordToggle = { showConfirmPassword = !showConfirmPassword }
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    PrimaryButton(
                        text = if (viewModel.isLoading) "Memproses..." else "Simpan Perubahan",
                        onClick = {
                            viewModel.changePassword(oldPassword, newPassword)
                            oldPassword = ""
                            newPassword = ""
                            confirmPassword = ""
                        },
                        enabled = !viewModel.isLoading && oldPassword.isNotEmpty() && newPassword.length >= 8 && newPassword == confirmPassword,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Section: Riwayat Perangkat
            SecuritySectionHeader(title = "Perangkat Terhubung", icon = Icons.Default.Devices)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = Color.White,
                shadowElevation = 1.dp
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    if (viewModel.sessions.isEmpty()) {
                        Text("Tidak ada perangkat lain yang terhubung", fontSize = 12.sp, color = TextMedium, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    } else {
                        viewModel.sessions.forEachIndexed { index, session ->
                            DeviceSessionItem(
                                deviceName = session.device ?: "Unknown Device",
                                location = session.location ?: "Unknown Location",
                                time = if (index == 0) "Aktif" else formatRelativeTime(session.lastActive),
                                isCurrent = index == 0,
                                onLogout = { viewModel.logoutSession(session.id) }
                            )
                            if (index < viewModel.sessions.size - 1) {
                                HorizontalDivider(
                                    modifier = Modifier.padding(vertical = 12.dp),
                                    thickness = 0.5.dp,
                                    color = Color.LightGray.copy(alpha = 0.2f)
                                )
                            }
                        }
                    }
                    
                    if (viewModel.sessions.size > 1) {
                        Spacer(modifier = Modifier.height(20.dp))
                        
                        TextButton(
                            onClick = { viewModel.logoutOtherDevices() },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFE53935))
                        ) {
                            Text("Keluar dari Semua Perangkat Lain", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SecuritySectionHeader(title: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
    ) {
        Icon(icon, contentDescription = null, tint = BluePrimary, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            color = TextDark
        )
    }
}

@Composable
fun DeviceSessionItem(
    deviceName: String,
    location: String,
    time: String,
    isCurrent: Boolean,
    onLogout: () -> Unit = {}
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        val isDesktop = deviceName.contains("PC", ignoreCase = true) || 
                        deviceName.contains("Windows", ignoreCase = true) ||
                        deviceName.contains("Mac", ignoreCase = true) ||
                        deviceName.contains("Linux", ignoreCase = true)

        IconBox(
            icon = if (isDesktop) Icons.Default.DesktopWindows else Icons.Default.Smartphone,
            iconColor = if (isCurrent) BluePrimary else TextLocked,
            backgroundColor = if (isCurrent) BluePrimary.copy(alpha = 0.1f) else BackgroundBlue.copy(alpha = 0.5f),
            size = 46.dp,
            iconSize = 22.dp,
            shape = RoundedCornerShape(14.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = deviceName, 
                fontSize = 15.sp, 
                fontWeight = FontWeight.Bold, 
                color = TextDark,
                maxLines = 1
            )
            Text(
                text = "$location • $time", 
                fontSize = 12.sp, 
                color = if (isCurrent) BluePrimary else TextMedium
            )
        }
        
        if (!isCurrent) {
            IconButton(
                onClick = onLogout,
                modifier = Modifier.background(Color(0xFFFFEBEE), CircleShape).size(36.dp)
            ) {
                Icon(
                    Icons.Default.Logout, 
                    contentDescription = "Remove", 
                    tint = Color(0xFFD32F2F), 
                    modifier = Modifier.size(18.dp)
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(Color(0xFF4CAF50), CircleShape)
            )
        }
    }
}

fun formatRelativeTime(dateString: String): String {
    return try {
        // Handle ISO format like 2024-03-23T10:00:00Z
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
        sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = sdf.parse(dateString) ?: return dateString
        
        val now = java.util.Date()
        val diff = now.time - date.time
        
        val seconds = diff / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24
        
        when {
            seconds < 60 -> "Beberapa detik yang lalu"
            minutes < 2 -> "1 menit yang lalu"
            minutes < 5 -> "Beberapa menit yang lalu"
            minutes < 60 -> "$minutes menit yang lalu"
            hours < 2 -> "1 jam yang lalu"
            hours < 24 -> "$hours jam yang lalu"
            days == 1L -> "Kemarin"
            else -> "$days hari yang lalu"
        }
    } catch (e: Exception) {
        dateString
    }
}
