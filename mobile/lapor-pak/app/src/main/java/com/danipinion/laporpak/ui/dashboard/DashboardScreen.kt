package com.danipinion.laporpak.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.danipinion.laporpak.domain.model.EmployeeDashboardResponse
import com.danipinion.laporpak.domain.model.RecentJob
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToJobDetail: (String) -> Unit = {}
) {
    val dashboardState by viewModel.dashboardState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Dashboard", 
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFF8FAFC)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (dashboardState) {
                is DashboardState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = Color(0xFF0D47A1)
                    )
                }
                is DashboardState.Error -> {
                    ErrorContent(
                        message = (dashboardState as DashboardState.Error).message,
                        onRetry = { viewModel.loadDashboard() }
                    )
                }
                is DashboardState.Success -> {
                    DashboardContent(
                        data = (dashboardState as DashboardState.Success).data,
                        onNavigateToJobDetail = onNavigateToJobDetail,
                        onRefresh = { viewModel.loadDashboard() }
                    )
                }
            }
        }
    }
}

@Composable
fun ErrorContent(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Oups! Terjadi Kendala",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = Color(0xFF1E293B)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF64748B),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D47A1)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Coba Lagi")
        }
    }
}

@Composable
fun DashboardContent(
    data: EmployeeDashboardResponse,
    onNavigateToJobDetail: (String) -> Unit,
    onRefresh: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Ringkasan Pekerjaan",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFF1E293B)
                )
                IconButton(onClick = onRefresh) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color(0xFF64748B))
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                StatCard(
                    title = "Dalam Proses",
                    value = data.statCards.pendingJobs.toString(),
                    containerColor = Color(0xFFFFF7ED),
                    contentColor = Color(0xFFC2410C),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Selesai",
                    value = data.statCards.completedJobs.toString(),
                    containerColor = Color(0xFFF0FDF4),
                    contentColor = Color(0xFF15803D),
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(32.dp))
        }

        item {
            Text(
                text = "Riwayat Terbaru",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color(0xFF1E293B)
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        if (data.recentJobs.isEmpty()) {
            item {
                Text(
                    text = "Belum ada pekerjaan yang tercatat.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF94A3B8),
                    modifier = Modifier.padding(top = 16.dp)
                )
            }
        } else {
            items(data.recentJobs) { job ->
                JobCard(job = job, onClick = { onNavigateToJobDetail(job.id) })
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                color = contentColor
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                color = contentColor.copy(alpha = 0.8f)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobCard(job: RecentJob, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = job.jobTypeName,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFF1E293B)
                )
                
                // Status Badge
                val (bgColor, textColor, label) = when (job.status) {
                    "PENDING" -> Triple(Color(0xFFFEF3C7), Color(0xFFB45309), "Dalam Proses")
                    "APPROVED" -> Triple(Color(0xFFDCFCE7), Color(0xFF15803D), "Selesai")
                    "REJECTED" -> Triple(Color(0xFFFEE2E2), Color(0xFFB91C1C), "Ditolak")
                    else -> Triple(Color(0xFFF1F5F9), Color(0xFF475569), job.status)
                }
                
                Box(
                    modifier = Modifier
                        .background(bgColor, RoundedCornerShape(16.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = textColor
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            val formatter = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID"))
            val dateStr = try {
                val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { 
                    timeZone = TimeZone.getTimeZone("UTC") 
                }.parse(job.date)
                parsed?.let { formatter.format(it) } ?: job.date
            } catch (e: Exception) { job.date }
            
            Text(
                text = dateStr,
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF64748B)
            )
            
            if (!job.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = job.notes,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF475569),
                    maxLines = 2
                )
            }
        }
    }
}
