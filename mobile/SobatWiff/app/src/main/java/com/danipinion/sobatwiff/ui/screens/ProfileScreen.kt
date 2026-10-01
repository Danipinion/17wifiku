package com.danipinion.sobatwiff.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.components.*
import androidx.compose.runtime.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    name: String,
    customerId: String,
    isRefreshing: Boolean = false,
    onRefresh: () -> Unit = {},
    onNavigateToEditProfile: () -> Unit = {},
    onNavigateToSecurity: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToPolicies: () -> Unit = {},
    onNavigateToHelp: () -> Unit = {},
    onNavigateToQris: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Text("Ya, Keluar Akun", fontWeight = FontWeight.Bold, color = Color.White)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showLogoutDialog = false },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Batal", color = TextMedium)
                }
            },
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .background(Color(0xFFFFEBEE), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Logout,
                            contentDescription = null,
                            tint = Color(0xFFE53935),
                            modifier = Modifier.size(30.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Konfirmasi Keluar",
                        fontWeight = FontWeight.Black,
                        fontSize = 20.sp,
                        color = TextDark
                    )
                }
            },
            text = {
                Text(
                    "Apakah Anda yakin ingin mengakhiri sesi ini? Anda harus login kembali untuk mengakses layanan.",
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    color = TextMedium,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            containerColor = Color.White,
            shape = RoundedCornerShape(28.dp)
        )
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundBlue)
                .verticalScroll(rememberScrollState())
        ) {
            // 1. Premium Interactive Header
            ProfileHeader(name = name, customerId = customerId)

            Spacer(modifier = Modifier.height(24.dp))

            // 2. Main Account Section (Grouped in a visual bucket)
            Column(
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .fillMaxWidth()
            ) {
                ProfileSectionTitle("Akun Personal")
                
                ProfileMenuItem(
                    icon = Icons.Default.PersonOutline,
                    title = "Data Diri",
                    subtitle = "Kelola nama, email & alamat",
                    onClick = onNavigateToEditProfile
                )
                
                ProfileMenuItem(
                    icon = Icons.Default.LockReset,
                    title = "Keamanan & Sandi",
                    subtitle = "Ubah sandi & kelola perangkat",
                    onClick = onNavigateToSecurity
                )

                ProfileSectionTitle("Layanan & Tagihan")
                
                ProfileMenuItem(
                    icon = Icons.Default.QrCodeScanner,
                    title = "Tata Cara Pembayaran",
                    subtitle = "Lihat panduan bayar via QRIS",
                    onClick = onNavigateToQris
                )

                ProfileSectionTitle("Dukungan & Hukum")
                
                ProfileMenuItem(
                    icon = Icons.AutoMirrored.Filled.HelpOutline,
                    title = "Bantuan & Dukungan",
                    subtitle = "Lapor kendala atau tanya CS",
                    onClick = onNavigateToHelp
                )
                
                ProfileMenuItem(
                    icon = Icons.AutoMirrored.Filled.MenuBook,
                    title = "Kebijakan Privasi",
                    subtitle = "Cara kami melindungi data Anda",
                    onClick = onNavigateToPolicies
                )

                Spacer(modifier = Modifier.height(32.dp))

                // 3. Danger Zone / Logout Action
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .clickable { showLogoutDialog = true },
                    color = Color(0xFFFFEBEE).copy(alpha = 0.5f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCDD2).copy(alpha = 0.3f))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconBox(
                            icon = Icons.AutoMirrored.Filled.Logout,
                            iconColor = Color(0xFFE53935),
                            backgroundColor = Color(0xFFE53935).copy(alpha = 0.1f),
                            shape = CircleShape,
                            size = 44.dp
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(
                                text = "Keluar Akun",
                                color = Color(0xFFE53935),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black
                            )
                            Text(
                                text = "Sesi Anda akan segera berakhir",
                                color = Color(0xFFE53935).copy(alpha = 0.6f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // 4. Footer info
            AppFooter()
            
            Spacer(modifier = Modifier.height(110.dp))
        }
    }
}

@Composable
fun ProfileHeader(name: String, customerId: String) {
    StandardHeader(
        title = name,
        subtitle = customerId,
        useGradient = false,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(contentAlignment = Alignment.BottomEnd) {
                // Profile Avatar Container
                Surface(
                    modifier = Modifier.size(100.dp),
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(3.dp, Color.White)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.AccountCircle,
                            contentDescription = null,
                            modifier = Modifier.size(80.dp),
                            tint = Color.White
                        )
                    }
                }
                
                // Edit Indicator
                Surface(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White),
                    color = Color.White,
                    tonalElevation = 4.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Ubah Foto",
                            tint = BluePrimary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Status Badge in Header
            StatusBadge(
                text = "STATUS AKTIF",
                color = Color.White,
                backgroundColor = Color(0xFF4CAF50).copy(alpha = 0.3f)
            )
        }
    }
}

@Composable
fun ProfileSectionTitle(title: String) {
    Text(
        text = title,
        modifier = Modifier.padding(top = 20.dp, bottom = 0.dp),
        color = TextLocked,
        fontSize = 13.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.sp
    )
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconBox(
                icon = icon,
                iconColor = BluePrimary,
                backgroundColor = BackgroundBlue,
                shape = RoundedCornerShape(14.dp),
                size = 46.dp,
                iconSize = 22.dp
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    color = TextDark,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = subtitle,
                    color = TextMedium,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }

            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = TextLocked.copy(alpha = 0.5f),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
fun AppFooter() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "SobatMulya App v1.0.4",
            color = TextLocked.copy(alpha = 0.4f),
            fontSize = 11.sp
        )
        Text(
            text = "Crafted with ❤ by danipinions dev",
            color = TextLocked.copy(alpha = 0.4f),
            fontSize = 10.sp,
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}
