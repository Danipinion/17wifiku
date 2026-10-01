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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.danipinion.sobatwiff.data.remote.model.RouterInfo
import com.danipinion.sobatwiff.ui.components.*
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.viewmodels.RouterState
import com.danipinion.sobatwiff.ui.viewmodels.RouterViewModel

@Composable
fun RouterScreen(
    viewModel: RouterViewModel,
    onNavigateToDevelopment: (String) -> Unit = {}
) {
    var showRebootDialog by remember { mutableStateOf(false) }
    var showChangePasswordDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.fetchRouterInfo()
    }

    val state = viewModel.state
    
    // Manage reboot cooldown at top level to be accessible to all components
    var rebootCooldown by remember { mutableIntStateOf(0) }
    LaunchedEffect(state) {
        val currentDeviceId = (state as? RouterState.Success)?.info?.currentDeviceId
        while (true) {
            rebootCooldown = viewModel.getRebootRemainingSeconds(currentDeviceId)
            kotlinx.coroutines.delay(1000L)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(BackgroundBlue)) {
        // Main Content (Blurred if not available)
        val blurRadius = if (state is RouterState.NotAvailable) 15.dp else 0.dp
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .blur(blurRadius)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 100.dp)
            ) {
                when (state) {
                    is RouterState.Loading -> {
                        item {
                            Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = BluePrimary)
                            }
                        }
                    }
                    is RouterState.Error -> {
                        item {
                            Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(text = state.message, color = TextDark)
                                    Button(onClick = { viewModel.fetchRouterInfo() }) {
                                        Text("Coba Lagi")
                                    }
                                }
                            }
                        }
                    }
                    is RouterState.Success -> {
                        val info = state.info
                        val localSignal = state.localSignalStrength

                        item { RouterHeader(info) }

                        if (info.availableDevices.size > 1) {
                            item {
                                DeviceSwitcher(
                                    currentId = info.currentDeviceId ?: "",
                                    devices = info.availableDevices,
                                    onSelect = { viewModel.fetchRouterInfo(it) }
                                )
                            }
                        }

                        item { WiFiStatusOverview(info, localSignal) }
                        item {
                            RouterControls(
                                rebootCooldown = rebootCooldown,
                                onRebootClick = { 
                                    if (rebootCooldown == 0) showRebootDialog = true 
                                },
                                onChangePasswordClick = { showChangePasswordDialog = true },
                                onNavigateToDevelopment = onNavigateToDevelopment
                            )
                        }
                        item { ConnectedDevicesHeader(count = info.connectedDevices) }
                        
                        items(info.deviceList) { device ->
                            ConnectedDeviceRow(
                                name = device.name,
                                ip = device.ip,
                                mac = device.mac
                            )
                        }

                        if (info.deviceList.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
                                ) {
                                    Text(
                                        text = "Saat ini ada ${info.connectedDevices} perangkat yang terhubung ke jaringan Anda.",
                                        modifier = Modifier.padding(16.dp),
                                        fontSize = 14.sp,
                                        color = TextMedium
                                    )
                                }
                            }
                        }
                    }
                    is RouterState.NotAvailable -> {
                        // Show placeholder background while blurred
                        item { RouterHeader(null) }
                    }
                    else -> {}
                }
            }
        }

        // Feature Not Available Popup
        if (state is RouterState.NotAvailable) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.padding(32.dp).fillMaxWidth(),
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        IconBox(
                            icon = Icons.Default.Lock,
                            iconColor = Color.Red,
                            backgroundColor = Color.Red.copy(alpha = 0.1f),
                            size = 64.dp,
                            iconSize = 32.dp
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "Fitur Belum Tersedia",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDark
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Mohon maaf fitur ini belum tersedia di akun anda konfirmasi kepada admin kami untuk info lebih lanjut",
                            fontSize = 14.sp,
                            color = TextMedium,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        }

        // Action Feedback
        viewModel.actionMessage?.let { data ->
            val (success, message) = data
            SimpleMessageDialog(
                title = if (success) "Berhasil" else "Gagal",
                message = message,
                onDismiss = { viewModel.clearActionMessage() }
            )
        }

        if (showRebootDialog) {
            RebootConfirmationDialog(
                isLoading = viewModel.isActionLoading,
                onDismiss = { showRebootDialog = false },
                onConfirm = { 
                    viewModel.reboot()
                    showRebootDialog = false
                }
            )
        }

        if (showChangePasswordDialog) {
            ChangePasswordDialog(
                isLoading = viewModel.isActionLoading,
                onDismiss = { showChangePasswordDialog = false },
                onConfirm = { newPass ->
                    viewModel.changeWifiPassword(newPass)
                    showChangePasswordDialog = false
                }
            )
        }
    }
}

@Composable
fun DeviceSwitcher(
    currentId: String,
    devices: List<com.danipinion.sobatwiff.data.remote.model.AvailableDeviceDto>,
    onSelect: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp)) {
        Text(
            text = "Pilih Perangkat",
            color = TextMedium,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            devices.forEach { device ->
                val isSelected = device.id == currentId
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { if (!isSelected) onSelect(device.id) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) BluePrimary else SurfaceBlue,
                        contentColor = if (isSelected) Color.White else TextDark
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = if (isSelected) 4.dp else 0.dp)
                ) {
                    Box(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = device.name,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun WiFiStatusOverview(info: com.danipinion.sobatwiff.data.remote.model.RouterInfo, localSignal: Int) {
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp)) {
        Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
        ) {
            Row(
                    modifier = Modifier.padding(24.dp),
                    verticalAlignment = Alignment.CenterVertically
            ) {
                // Sesuai permintaan: Ambil dari sistem wifi android (localSignal)
                // Jika SSID cocok dengan ACS, localSignal akan bernilai 0-100. Jika tidak ada, 0.
                val progress = (localSignal / 100f).coerceIn(0f, 1f)
                val signalColor = when {
                    progress > 0.7f -> Color(0xFF4CAF50)
                    progress > 0.4f -> Color(0xFFFF9800)
                    else -> Color(0xFFF44336)
                }

                Box(modifier = Modifier.size(80.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(
                            progress = { progress },
                            modifier = Modifier.fillMaxSize(),
                            color = signalColor,
                            strokeWidth = 8.dp,
                            trackColor = signalColor.copy(alpha = 0.1f),
                            strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                    )
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                                "${(progress * 100).toInt()}%",
                                color = TextDark,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black
                        )
                        Text("Sinyal", color = TextMedium, fontSize = 9.sp)
                    }
                }

                Spacer(modifier = Modifier.width(24.dp))

                Column {
                    Text("WiFi Aktif", color = TextMedium, fontSize = 12.sp)
                    Text(
                            info.ssid,
                            color = BluePrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                                Icons.Default.Lock,
                                contentDescription = null,
                                tint = TextLocked,
                                modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("WPA2 Protected", color = TextLocked, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun RouterHeader(info: RouterInfo?) {
    StandardHeader(title = "Manajemen Router", subtitle = "Pantau dan atur koneksi internet Anda") {
        Spacer(modifier = Modifier.height(24.dp))

        // ONT Status Summary Card
        Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Model ONT", color = TextMedium, fontSize = 12.sp)
                        Text(
                                text = info?.model ?: "---",
                                color = TextDark,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                    StatusBadge(
                            text = if (info != null) "Online" else "OFFLINE",
                            color = if (info != null) Color(0xFF4CAF50) else Color.Red,
                            backgroundColor = if (info != null) Color(0xFFE8F5E9) else Color.Red.copy(alpha = 0.1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = BackgroundBlue)
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    InfoColumn(label = "Uptime", value = info?.uptime ?: "---")
                    InfoColumn(label = "Suhu", value = info?.temperature?.let { "$it°C" } ?: "---")
                    InfoColumn(label = "Daya", value = info?.rxPower ?: "---")
                }
            }
        }
    }
}

@Composable
fun InfoColumn(label: String, value: String) {
    Column {
        Text(text = label, color = TextMedium, fontSize = 11.sp)
        Text(text = value, color = TextDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun RouterControls(
    rebootCooldown: Int,
    onRebootClick: () -> Unit, 
    onChangePasswordClick: () -> Unit,
    onNavigateToDevelopment: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp)) {
        Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Change Password Card
            ControlCard(
                    icon = Icons.Default.VpnKey,
                    title = "Ganti Sandi",
                    subtitle = "Keamanan WiFi",
                    iconColor = BluePrimary,
                    backgroundColor = BluePrimary.copy(alpha = 0.1f),
                    modifier = Modifier.weight(1f),
                    onClick = onChangePasswordClick
            )

            // Reboot Card
            ControlCard(
                    icon = Icons.Default.RestartAlt,
                    title = if (rebootCooldown > 0) "${rebootCooldown}s" else "Reboot ONT",
                    subtitle = if (rebootCooldown > 0) "Tunggu..." else "Mulai Ulang",
                    iconColor = if (rebootCooldown > 0) Color.Gray else Color(0xFFFF9800),
                    backgroundColor = if (rebootCooldown > 0) Color.Gray.copy(alpha = 0.1f) else Color(0xFFFF9800).copy(alpha = 0.1f),
                    modifier = Modifier.weight(1f),
                    enabled = rebootCooldown == 0,
                    onClick = onRebootClick
            )
        }

    }
}

@Composable
fun ControlCard(
        icon: ImageVector,
        title: String,
        subtitle: String,
        iconColor: Color,
        backgroundColor: Color,
        modifier: Modifier = Modifier,
        enabled: Boolean = true,
        onClick: () -> Unit
) {
    Card(
            modifier = modifier.clickable(enabled = enabled) { onClick() },
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (enabled) SurfaceBlue else SurfaceBlue.copy(alpha = 0.6f)
            )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            IconBox(
                    icon = icon,
                    iconColor = iconColor,
                    backgroundColor = backgroundColor,
                    iconSize = 20.dp,
                    size = 40.dp,
                    shape = CircleShape
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = title, color = TextDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(text = subtitle, color = TextMedium, fontSize = 11.sp)
        }
    }
}

@Composable
fun ConnectedDevicesHeader(count: Int) {
    SectionHeader(
            title = "Perangkat Terkoneksi",
            trailing = {
                StatusBadge(
                        text = "$count Perangkat",
                        color = BluePrimary,
                        backgroundColor = BluePrimary.copy(alpha = 0.1f)
                )
            }
    )
}

@Composable
fun ConnectedDeviceRow(
    name: String,
    ip: String,
    mac: String
) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceBlue)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconBox(
                icon = Icons.Default.Smartphone, // Sesuai permintaan: icon hp semua
                backgroundColor = BackgroundBlue
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = name,
                    color = TextDark,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "$ip • $mac",
                    color = TextMedium,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
fun RebootConfirmationDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    var timeLeft by remember { mutableIntStateOf(5) }
    var canReboot by remember { mutableStateOf(timeLeft == 0) }

    LaunchedEffect(key1 = timeLeft) {
        if (timeLeft > 0) {
            kotlinx.coroutines.delay(1000L)
            timeLeft -= 1
        } else {
            canReboot = true
        }
    }

    AlertDialog(
            onDismissRequest = if (isLoading) ({}) else onDismiss,
            icon = {
                IconBox(
                        icon = Icons.Default.RestartAlt,
                        iconColor = Color(0xFFFF9800),
                        backgroundColor = Color(0xFFFF9800).copy(alpha = 0.1f),
                        size = 64.dp,
                        iconSize = 32.dp
                )
            },
            title = {
                Text(
                        text = "Reboot Router?",
                        color = TextDark,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                            text =
                                    "Internet Anda akan terputus selama kurang lebih 2-3 menit selama proses mulai ulang. Pastikan tidak ada aktivitas penting saat ini.",
                            color = TextMedium,
                            fontSize = 14.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    if (!canReboot && !isLoading) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                                text = "Mohon baca pesan di atas... ($timeLeft)",
                                color = Color(0xFFEF5350),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                }
            },
            confirmButton = {
                PrimaryButton(
                        text = if (isLoading) "Memproses..." else if (canReboot) "Ya, Reboot Sekarang" else "Mohon Tunggu ($timeLeft)",
                        onClick = onConfirm,
                        containerColor =
                                if (canReboot && !isLoading) Color(0xFFEF5350)
                                else Color(0xFFEF5350).copy(alpha = 0.5f),
                        enabled = canReboot && !isLoading,
                        modifier = Modifier.fillMaxWidth()
                )
            },
            dismissButton = {
                if (!isLoading) {
                    TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                        Text("Batal", color = TextLocked, fontWeight = FontWeight.Bold)
                    }
                }
            },
            shape = RoundedCornerShape(28.dp),
            containerColor = SurfaceBlue
    )
}

@Composable
fun ChangePasswordDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showNew by remember { mutableStateOf(false) }
    var showConfirm by remember { mutableStateOf(false) }

    AlertDialog(
            onDismissRequest = if (isLoading) ({}) else onDismiss,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.VpnKey, contentDescription = null, tint = BluePrimary)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                            text = "Ganti Sandi WiFi",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDark
                    )
                }
            },
            text = {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    Text(
                            "Masukkan sandi baru untuk jaringan WiFi Anda. Minimal 8 karakter.",
                            color = TextMedium,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                    )

                    StandardTextField(
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            label = "Sandi Baru",
                            placeholder = "Minimal 8 karakter",
                            isPassword = true,
                            passwordVisible = showNew,
                            onPasswordToggle = { showNew = !showNew },
                            enabled = !isLoading
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    StandardTextField(
                            value = confirmPassword,
                            onValueChange = { confirmPassword = it },
                            label = "Konfirmasi Sandi Baru",
                            placeholder = "Ulangi sandi baru",
                            isPassword = true,
                            passwordVisible = showConfirm,
                            onPasswordToggle = { showConfirm = !showConfirm },
                            enabled = !isLoading
                    )

                    if (newPassword.isNotEmpty() &&
                                    confirmPassword.isNotEmpty() &&
                                    newPassword != confirmPassword
                    ) {
                        Text(
                                "Sandi baru tidak cocok",
                                color = Color.Red,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                        )
                    }
                }
            },
            confirmButton = {
                PrimaryButton(
                        text = if (isLoading) "Menyimpan..." else "Simpan Perubahan",
                        onClick = { onConfirm(newPassword) },
                        enabled = !isLoading && newPassword.length >= 8 && newPassword == confirmPassword,
                        modifier = Modifier.fillMaxWidth()
                )
            },
            dismissButton = {
                if (!isLoading) {
                    TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                        Text("Batal", color = TextMedium)
                    }
                }
            },
            shape = RoundedCornerShape(28.dp),
            containerColor = SurfaceBlue
    )
}
