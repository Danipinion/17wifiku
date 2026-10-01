package com.danipinion.laporpak.ui.history

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.blur
import androidx.compose.ui.platform.LocalContext
import com.danipinion.laporpak.ui.theme.toDp
import com.danipinion.laporpak.util.Constants
import android.content.Intent
import android.net.Uri
import androidx.hilt.navigation.compose.hiltViewModel
import com.danipinion.laporpak.domain.model.HistoryJobData
import com.danipinion.laporpak.ui.components.JobDetailDialog
import com.danipinion.laporpak.ui.home.formatDate
import com.danipinion.laporpak.ui.home.getStatusColor

@Composable
fun HistoryScreen(
    modifier: Modifier = Modifier,
    viewModel: HistoryViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var selectedFilter by remember { mutableStateOf<String?>(null) }
    var selectedJob by remember { mutableStateOf<HistoryJobData?>(null) }
    val context = LocalContext.current
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current

    val selectedMonth by viewModel.selectedMonth.collectAsState()
    val selectedYear by viewModel.selectedYear.collectAsState()
    var expandedMonth by remember { mutableStateOf(false) }
    var expandedYear by remember { mutableStateOf(false) }

    val months = listOf("Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember")
    val years = (2024..2030).toList()

    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                viewModel.loadHistory()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF5F7FA))
            .blur(if (selectedJob != null) 12.dp else 0.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 24.dp)
            ) {
                Spacer(modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars).height(16.dp))
                Text(
                    text = "Riwayat Laporan",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                    color = Color(0xFF1E293B)
                )
                Text(
                    text = "Cari dan filter laporan pekerjaan Anda",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                )
                // Filter Bulan & Tahun
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedButton(
                            onClick = { expandedMonth = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF1E293B)),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                        ) {
                            Text(months[selectedMonth - 1], fontWeight = FontWeight.SemiBold)
                        }
                        DropdownMenu(
                            expanded = expandedMonth,
                            onDismissRequest = { expandedMonth = false },
                            modifier = Modifier.background(Color.White)
                        ) {
                            months.forEachIndexed { index, monthName ->
                                DropdownMenuItem(
                                    text = { Text(monthName) },
                                    onClick = {
                                        viewModel.setMonthYear(index + 1, selectedYear)
                                        expandedMonth = false
                                    }
                                )
                            }
                        }
                    }

                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedButton(
                            onClick = { expandedYear = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF1E293B)),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                        ) {
                            Text(selectedYear.toString(), fontWeight = FontWeight.SemiBold)
                        }
                        DropdownMenu(
                            expanded = expandedYear,
                            onDismissRequest = { expandedYear = false },
                            modifier = Modifier.background(Color.White)
                        ) {
                            years.forEach { year ->
                                DropdownMenuItem(
                                    text = { Text(year.toString()) },
                                    onClick = {
                                        viewModel.setMonthYear(selectedMonth, year)
                                        expandedYear = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                // Filters Status
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(bottom = 16.dp)
                ) {
                    item {
                        FilterChipUI(
                            text = "Semua",
                            selected = selectedFilter == null,
                            onClick = { selectedFilter = null },
                            activeColor = Color(0xFF0D47A1)
                        )
                    }
                    item {
                        FilterChipUI(
                            text = "Disetujui",
                            selected = selectedFilter == "APPROVED",
                            onClick = { selectedFilter = "APPROVED" },
                            activeColor = Color(0xFF2E7D32)
                        )
                    }
                    item {
                        FilterChipUI(
                            text = "Menunggu",
                            selected = selectedFilter == "PENDING",
                            onClick = { selectedFilter = "PENDING" },
                            activeColor = Color(0xFFF57F17)
                        )
                    }
                    item {
                        FilterChipUI(
                            text = "Ditolak",
                            selected = selectedFilter == "REJECTED",
                            onClick = { selectedFilter = "REJECTED" },
                            activeColor = Color(0xFFC62828)
                        )
                    }
                }
            }

            // List Content
            when (state) {
                is HistoryState.Loading, HistoryState.Idle -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF0D47A1))
                    }
                }
                is HistoryState.Error -> {
                    val errorMsg = (state as HistoryState.Error).message
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
                                    text = errorMsg,
                                    style = MaterialTheme.typography.bodyMedium,
                                    textAlign = TextAlign.Center,
                                    color = Color(0xFF64748B)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = { viewModel.loadHistory() },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D47A1))
                                ) {
                                    Text("Coba Lagi")
                                }
                            }
                        }
                    }
                }
                is HistoryState.Success -> {
                    val jobs = (state as HistoryState.Success).jobs
                    val baseSalary = (state as HistoryState.Success).baseSalary
                    val totalIncome = (state as HistoryState.Success).totalIncome
                    val filteredJobs = if (selectedFilter == null) jobs else jobs.filter { it.status.uppercase() == selectedFilter }
                    
                    Column(modifier = Modifier.fillMaxSize()) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 8.dp)
                                .shadow(elevation = 3.dp, shape = RoundedCornerShape(16.dp), spotColor = Color(0x1A000000)),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0D47A1))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Pendapatan Bulan Ini", style = MaterialTheme.typography.titleSmall, color = Color.White.copy(alpha = 0.8f))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = formatCurrency(totalIncome),
                                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("Gaji Pokok: ", style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.8f))
                                    Text(formatCurrency(baseSalary), style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold), color = Color.White)
                                }
                            }
                        }

                        LazyColumn(
                            modifier = Modifier.fillMaxWidth().weight(1f),
                            contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
                        ) {

                        if (filteredJobs.isEmpty()) {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 48.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Tidak ada laporan ditemukan.",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                        } else {
                            items(filteredJobs) { job ->
                                HistoryJobCard(job, onClick = { selectedJob = job })
                            }
                        }
                    }
                }
            }
        }
    }
    }
    
    selectedJob?.let { job ->
        val statusTheme = getStatusColor(job.status)
        val fullPhotoUrl = job.evidence?.let { 
            if (it.startsWith("/")) "${Constants.BASE_URL.trimEnd('/')}$it" else it 
        }
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
fun FilterChipUI(text: String, selected: Boolean, onClick: () -> Unit, activeColor: Color) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = if (selected) activeColor else Color.White,
        contentColor = if (selected) Color.White else Color(0xFF64748B),
        border = if (!selected) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)) else null,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
    }
}

@Composable
fun HistoryJobCard(job: HistoryJobData, onClick: () -> Unit) {
    val statusTheme = getStatusColor(job.status)
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
            
            // Notes Section
            if (!job.notes.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color(0xFFF1F5F9), thickness = 1.dp)
                Spacer(modifier = Modifier.height(12.dp))
                
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

fun formatCurrency(amount: Double): String {
    val formatter = java.text.NumberFormat.getCurrencyInstance(java.util.Locale("id", "ID"))
    return formatter.format(amount).replace("Rp", "Rp ").replace(",00", "")
}
