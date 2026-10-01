package com.danipinion.laporpak.ui.home

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import com.danipinion.laporpak.domain.model.RecentJob
import com.danipinion.laporpak.ui.components.JobDetailDialog
import com.danipinion.laporpak.ui.dashboard.DashboardState
import com.danipinion.laporpak.ui.dashboard.DashboardViewModel
import com.danipinion.laporpak.ui.theme.toDp
import com.danipinion.laporpak.util.Constants

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

enum class JobStatusColor(val label: String, val color: Color, val bgColor: Color) {
    APPROVED("Disetujui", Color(0xFF2E7D32), Color(0xFFE8F5E9)),
    PENDING("Menunggu", Color(0xFFF57F17), Color(0xFFFFFDE7)),
    TODO("Tugas", Color(0xFF0D47A1), Color(0xFFE3F2FD)),
    REJECTED("Ditolak", Color(0xFFC62828), Color(0xFFFFEBEE))
}

fun getStatusColor(status: String): JobStatusColor {
    return when(status.uppercase()) {
        "APPROVED" -> JobStatusColor.APPROVED
        "PENDING" -> JobStatusColor.PENDING
        "TODO" -> JobStatusColor.TODO
        "REJECTED" -> JobStatusColor.REJECTED
        else -> JobStatusColor.PENDING
    }
}

fun formatRupiah(amount: Double): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    return formatter.format(amount).replace(",00", "")
}

fun formatDate(isoString: String): String {
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { 
            timeZone = TimeZone.getTimeZone("UTC") 
        }
        val date = parser.parse(isoString) ?: return isoString
        val formatter = SimpleDateFormat("dd MMM yyyy", Locale("id", "ID"))
        formatter.format(date)
    } catch (e: Exception) {
        isoString
    }
}

@Composable
fun HomeScreen(
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = hiltViewModel(),
    onLogout: () -> Unit = {},
    onTaskClick: (String) -> Unit = {}
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    var selectedJob by remember { mutableStateOf<RecentJob?>(null) }
    val context = LocalContext.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF5F7FA))
            .blur(if (selectedJob != null) 12.dp else 0.dp)
    ) {
        // Aesthetic Modern Curved Header Background
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(340.dp)
                .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF0D47A1), // Deep Blue
                            Color(0xFF1976D2)  // Lighter Blue
                        )
                    )
                )
        )

        Column(modifier = Modifier.fillMaxSize()) {
            Spacer(modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars).height(24.dp))
            val currentUserName = if (dashboardState is DashboardState.Success) {
                (dashboardState as DashboardState.Success).data.userName ?: "Karyawan"
            } else "Memuat..."
            
            HeaderSection(
                userName = currentUserName,
                onLogout = {
                    viewModel.logout()
                    onLogout()
                }
            )

            Spacer(modifier = Modifier.height(32.dp))

            when (val state = dashboardState) {
                is DashboardState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                }
                is DashboardState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = "Error", tint = Color.Red, modifier = Modifier.size(48.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "Gagal Memuat Data",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF1E293B)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = state.message,
                                    style = MaterialTheme.typography.bodyMedium,
                                    textAlign = TextAlign.Center,
                                    color = Color(0xFF64748B)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = { viewModel.loadDashboard() },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D47A1))
                                ) {
                                    Text("Coba Lagi")
                                }
                            }
                        }
                    }
                }
                is DashboardState.Success -> {
                    val data = state.data
                    SummaryStatsSection(
                        approvedJobs = data.statCards.completedJobs,
                        todoJobs = data.statCards.todoJobs,
                        currentIncome = formatRupiah(data.statCards.currentIncome ?: 0.0)
                    )

                    Spacer(modifier = Modifier.height(70.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Laporan Pekerjaan Terkini",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                            color = Color(0xFF1E293B)
                        )
                        IconButton(onClick = { viewModel.loadDashboard() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color(0xFF64748B))
                        }
                    }

                    if (data.recentJobs.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.TopCenter) {
                            Text(
                                text = "Belum ada pekerjaan yang tercatat.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(bottom = 24.dp)
                        ) {
                            items(data.recentJobs) { job ->
                                RecentJobCard(job, onClick = { 
                                    if (job.status.uppercase() == "TODO") {
                                        onTaskClick(job.id)
                                    } else {
                                        selectedJob = job 
                                    }
                                })
                            }
                        }
                    }
                }
            }
        }
    }
    
    selectedJob?.let { job ->
        val statusTheme = getStatusColor(job.status)
        
        // Build the full URL for the image
        val fullPhotoUrl = job.evidence?.let { 
            if (it.startsWith("/")) "${Constants.BASE_URL.trimEnd('/')}$it" else it 
        }
        
        // Format location if both lat and long are present
        val locationText = if (job.latitude != null && job.longitude != null) {
            "${job.latitude}, ${job.longitude}"
        } else null
        
        JobDetailDialog(
            title = job.jobTypeName,
            date = formatDate(job.date),
            statusLabel = statusTheme.label,
            statusColor = statusTheme.color,
            statusBgColor = statusTheme.bgColor,
            notes = job.notes,
            location = locationText,
            photoUrl = fullPhotoUrl,
            onDismiss = { selectedJob = null },
            onLocationClick = if (job.latitude != null && job.longitude != null) {
                {
                    val uri = Uri.parse("geo:${job.latitude},${job.longitude}?q=${job.latitude},${job.longitude}")
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    context.startActivity(intent)
                }
            } else null
        )
    }
}

@Composable
fun HeaderSection(userName: String, onLogout: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Selamat datang kembali,",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White.copy(alpha = 0.8f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = userName,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                color = Color.White
            )
        }
        
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.2f))
                .clickable { onLogout() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                contentDescription = "Logout",
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
fun SummaryStatsSection(approvedJobs: Int, todoJobs: Int, currentIncome: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        StatCard(
            title = "Tugas Baru",
            value = todoJobs.toString(),
            icon = Icons.AutoMirrored.Filled.List,
            iconTint = Color(0xFF0D47A1),
            modifier = Modifier.width(160.dp)
        )
        StatCard(
            title = "Selesai",
            value = approvedJobs.toString(),
            icon = Icons.Default.CheckCircle,
            iconTint = Color(0xFF4CAF50),
            modifier = Modifier.width(160.dp)
        )
        StatCard(
            title = "Estimasi Gaji",
            value = currentIncome,
            icon = Icons.Default.Star,
            iconTint = Color(0xFFFFA000),
            modifier = Modifier.width(200.dp)
        )
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    iconTint: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .shadow(elevation = 6.dp, shape = RoundedCornerShape(20.dp), spotColor = Color(0x20000000)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(iconTint.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon, 
                    contentDescription = title, 
                    tint = iconTint,
                    modifier = Modifier.size(22.dp)
                )
            }
            
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = value, 
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 18.sp), 
                    color = Color(0xFF1E293B),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = title, 
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold, color = Color(0xFF94A3B8)), 
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun RecentJobCard(job: RecentJob, onClick: () -> Unit) {
    val statusTheme = getStatusColor(job.status)
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 8.dp)
            .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp), spotColor = Color(0x1A000000))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = job.jobTypeName,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF1E293B)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = null,
                            modifier = Modifier.size(14.sp.toDp),
                            tint = Color(0xFF64748B)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = formatDate(job.date),
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                            color = Color(0xFF64748B)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                // Status Badge
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = statusTheme.bgColor,
                    contentColor = statusTheme.color
                ) {
                    Text(
                        text = statusTheme.label,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }


            // Instruction & Reference Info (For TODO jobs)
            if (job.status.uppercase() == "TODO" && (!job.instruction.isNullOrEmpty() || !job.adminPhoto.isNullOrEmpty() || (job.targetLatitude ?: 0.0) != 0.0)) {
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color(0xFFF1F5F9), thickness = 1.dp)
                Spacer(modifier = Modifier.height(12.dp))
                
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFE3F2FD))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (!job.instruction.isNullOrEmpty()) {
                        Row(verticalAlignment = Alignment.Top) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = Color(0xFF0D47A1),
                                modifier = Modifier.size(16.sp.toDp).padding(top = 2.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = job.instruction,
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFF0D47A1),
                                maxLines = 3,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    if (!job.adminPhoto.isNullOrEmpty()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Place, contentDescription = null, tint = Color(0xFF0D47A1), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Ada Foto Referensi", style = MaterialTheme.typography.labelSmall, color = Color(0xFF0D47A1))
                        }
                    }

                    if ((job.targetLatitude ?: 0.0) != 0.0) {
                        Button(
                            onClick = {
                                val gmmIntentUri = Uri.parse("google.navigation:q=${job.targetLatitude},${job.targetLongitude}")
                                val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
                                mapIntent.setPackage("com.google.android.apps.maps")
                                context.startActivity(mapIntent)
                            },
                            modifier = Modifier.fillMaxWidth().height(32.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D47A1)),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Buka Lokasi di Maps", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
            
            // Notes Section
            if (!job.notes.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                if (job.instruction.isNullOrEmpty()) {
                    HorizontalDivider(color = Color(0xFFF1F5F9), thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))
                }                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFF8FAFC))
                        .padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Notes",
                        tint = Color(0xFF94A3B8),
                        modifier = Modifier.size(16.sp.toDp).padding(top = 2.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = job.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF475569),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
