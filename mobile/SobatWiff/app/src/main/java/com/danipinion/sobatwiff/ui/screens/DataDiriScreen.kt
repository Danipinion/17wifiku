package com.danipinion.sobatwiff.ui.screens

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
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.Manifest
import android.content.pm.PackageManager
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.danipinion.sobatwiff.ui.components.*
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.viewmodels.ProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DataDiriScreen(
    viewModel: ProfileViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val userProfile = viewModel.userProfile
    var showPermissionRationale by remember { mutableStateOf(false) }
    
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        
        if (fineGranted || coarseGranted) {
            viewModel.updateCurrentLocation(context)
        } else {
            viewModel.updateStatusMessage("Izin lokasi ditolak. Buka pengaturan aplikasi jika popup tidak muncul.")
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "Informasi Data Diri",
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
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Image Section
            Box(contentAlignment = Alignment.BottomEnd) {
                Surface(
                    modifier = Modifier.size(100.dp),
                    shape = CircleShape,
                    color = SurfaceBlue
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(50.dp),
                            tint = BluePrimary
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(BluePrimary, CircleShape)
                        .padding(6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Verified, contentDescription = null, tint = Color.White)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                "ID Pelanggan: ${userProfile?.idNumber ?: "---"}",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = BluePrimary,
                modifier = Modifier
                    .background(BluePrimary.copy(alpha = 0.1f), CircleShape)
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Info Section
            InfoCard(
                title = "Informasi Personal",
                items = listOf(
                    InfoItemData("Nama", userProfile?.name ?: "---", Icons.Default.Badge),
                    InfoItemData("Nomor Ponsel", userProfile?.phone ?: "---", Icons.Default.PhoneAndroid),
                )
            )

            Spacer(modifier = Modifier.height(20.dp))

            InfoCard(
                title = "Alamat Instalasi",
                items = mutableListOf(
                    InfoItemData("Alamat Lengkap", userProfile?.address ?: "---", Icons.Default.LocationOn),
                ).apply {
                    val lat = userProfile?.latitude
                    val lon = userProfile?.longitude
                    if (lat != null && lon != null) {
                        add(InfoItemData("Lokasi Rumah", "$lat, $lon", Icons.Default.MyLocation))
                    }
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            PrimaryButton(
                text = if (userProfile?.latitude != null) "Perbarui Lokasi Rumah" else "Set Lokasi Rumah",
                onClick = {
                    val fineLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                    val coarseLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
                    
                    if (fineLocation == PackageManager.PERMISSION_GRANTED || coarseLocation == PackageManager.PERMISSION_GRANTED) {
                        viewModel.updateCurrentLocation(context)
                    } else {
                        viewModel.updateStatusMessage("Izin lokasi diperlukan...")
                        showPermissionRationale = true
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                icon = Icons.Default.LocationSearching,
                enabled = !viewModel.isLoading
            )

            if (viewModel.statusMessage != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = viewModel.statusMessage!!,
                    fontSize = 12.sp,
                    color = if (viewModel.statusMessage!!.contains("Error") || viewModel.statusMessage!!.contains("Gagal")) Color.Red else BluePrimary,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Note Section
            Surface(
                color = Color(0xFFFFF9C4),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = null,
                        tint = Color(0xFFFBC02D),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        "Gunakan tombol di atas untuk menandai lokasi rumah Anda agar memudahkan teknisi kami melakukan pengecekan jika terjadi kendala.",
                        fontSize = 12.sp,
                        color = Color(0xFF5D4037),
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }

    // Permission Rationale Dialog
    if (showPermissionRationale) {
        AlertDialog(
            onDismissRequest = { showPermissionRationale = false },
            icon = {
                IconBox(
                    icon = Icons.Default.LocationOn,
                    iconColor = BluePrimary,
                    backgroundColor = BluePrimary.copy(alpha = 0.1f),
                    size = 64.dp,
                    iconSize = 32.dp
                )
            },
            title = {
                Text(
                    "Izin Lokasi Diperlukan",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = TextDark
                )
            },
            text = {
                Text(
                    "Kami membutuhkan izin akses lokasi Anda untuk menentukan titik koordinat rumah secara akurat. Hal ini memudahkan teknisi dalam memberikan bantuan jika terjadi masalah pada koneksi Anda.",
                    textAlign = TextAlign.Center,
                    color = TextMedium,
                    fontSize = 14.sp
                )
            },
            confirmButton = {
                PrimaryButton(
                    text = "Berikan Izin",
                    onClick = {
                        showPermissionRationale = false
                        viewModel.updateStatusMessage("Meminta izin lokasi...")
                        try {
                            locationPermissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                )
                            )
                        } catch (e: Exception) {
                            viewModel.updateStatusMessage("Gagal meminta izin: ${e.message}")
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            dismissButton = {
                TextButton(
                    onClick = { showPermissionRationale = false },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Batal", color = TextLocked, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = Color.White,
            shape = RoundedCornerShape(28.dp)
        )
    }
}

@Composable
fun InfoCard(title: String, items: List<InfoItemData>) {
    Column {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            color = TextDark,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = Color.White,
            shadowElevation = 2.dp
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                items.forEachIndexed { index, item ->
                    InfoRow(item)
                    if (index < items.size - 1) {
                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 12.dp),
                            thickness = 0.5.dp,
                            color = Color.LightGray.copy(alpha = 0.3f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InfoRow(data: InfoItemData) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(SurfaceBlue.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                data.icon,
                contentDescription = null,
                tint = BluePrimary,
                modifier = Modifier.size(20.dp)
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(
                data.label,
                fontSize = 11.sp,
                color = TextMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                data.value,
                fontSize = 14.sp,
                color = TextDark,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

data class InfoItemData(
    val label: String,
    val value: String,
    val icon: ImageVector
)
