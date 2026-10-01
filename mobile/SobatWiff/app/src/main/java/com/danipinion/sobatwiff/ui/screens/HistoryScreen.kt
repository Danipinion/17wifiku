package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.automirrored.outlined.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.vector.ImageVector
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.components.*
import com.danipinion.sobatwiff.ui.viewmodels.HistoryViewModel
import com.danipinion.sobatwiff.data.remote.model.InvoiceDto
import java.util.Locale
import java.text.SimpleDateFormat
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    viewModel: HistoryViewModel,
    onNavigateToPayment: (String) -> Unit = {}
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var selectedFilter by remember { mutableStateOf("Semua") }
    var searchQuery by remember { mutableStateOf("") }
    var selectedTransaction by remember { mutableStateOf<InvoiceDto?>(null) }
    val sheetState = rememberModalBottomSheetState()
    var showSheet by remember { mutableStateOf(false) }
    var showBulkDialog by remember { mutableStateOf(false) }
    var bulkMonthCount by remember { mutableIntStateOf(1) }
    val unpaidInvoices = viewModel.invoices.filter { it.status == "UNPAID" }
        .sortedWith(compareBy<com.danipinion.sobatwiff.data.remote.model.InvoiceDto> { it.year }.thenBy { it.month })
    val oldestUnpaid = unpaidInvoices.firstOrNull()

    val monthNames = listOf("", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember")

    val filteredList = viewModel.invoices.filter { 
        val matchesFilter = when (selectedFilter) {
            "Lunas" -> it.status == "PAID"
            "Belum Lunas" -> it.status == "UNPAID"
            else -> true
        }
        val invoiceId = "INV/${it.month}/${it.year}/${it.id.takeLast(4)}"
        val period = "${monthNames[it.month]} ${it.year}"
        val matchesSearch = invoiceId.contains(searchQuery, ignoreCase = true) || 
                            period.contains(searchQuery, ignoreCase = true)
        matchesFilter && matchesSearch
    }

    val groupedTransactions = filteredList.groupBy { it.year.toString() }

    Box(modifier = Modifier.fillMaxSize().background(BackgroundBlue)) {
        PullToRefreshBox(
            isRefreshing = viewModel.isLoading,
            onRefresh = { viewModel.fetchInvoices() },
            modifier = Modifier.fillMaxSize()
        ) {
            LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 100.dp)
            ) {
                // 1. Header with Search
                item { 
                    val totalUnpaid = viewModel.invoices.filter { it.status == "UNPAID" }.sumOf { it.amount.toDouble() }.toFloat()
                    HistoryHeader(
                        amount = "Rp ${String.format("%,.0f", totalUnpaid).replace(",", ".")}", 
                        onPayClick = { 
                            if (unpaidInvoices.isNotEmpty()) {
                                if (unpaidInvoices.size == 1) {
                                    onNavigateToPayment(unpaidInvoices[0].id)
                                } else {
                                    bulkMonthCount = 1
                                    showBulkDialog = true
                                }
                            }
                        },
                        searchQuery = searchQuery,
                        onSearchChange = { searchQuery = it }
                    ) 
                }

                // 2. Quick Stats
                item { TransactionStats(viewModel.invoices) }

                // 3. Filter Section
                item {
                    HistoryFilters(
                            selectedFilter = selectedFilter,
                            onFilterSelected = { selectedFilter = it }
                    )
                }

                // 4. Transaction List with Year Headers

                groupedTransactions.forEach { (year, transactions) ->
                    item {
                        Text(
                            text = "Tahun $year",
                            color = BluePrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)
                        )
                    }
                    items(transactions) { invoice ->
                        val isLocked = invoice.status == "UNPAID" && invoice.id != oldestUnpaid?.id
                        TransactionItemRow(
                            invoice = invoice,
                            isLocked = isLocked,
                            onClick = {
                                selectedTransaction = invoice
                                showSheet = true
                            }
                        )
                    }
                }

                if (filteredList.isEmpty()) {
                    item { EmptyHistoryState() }
                }
            }
        }
        
        // Bulk Payment Selection Dialog
        if (showBulkDialog) {
            val maxMonths = unpaidInvoices.size
            val selectedInvoices = unpaidInvoices.take(bulkMonthCount)
            val totalBulkAmount = selectedInvoices.sumOf { it.amount.toDouble() }

            AlertDialog(
                onDismissRequest = { showBulkDialog = false },
                containerColor = SurfaceBlue,
                title = { Text("Bayar Sekaligus", color = TextDark, fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Pilih jumlah bulan yang ingin dibayarkan:", color = TextMedium, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = { if (bulkMonthCount > 1) bulkMonthCount-- },
                                modifier = Modifier.background(BackgroundBlue, CircleShape)
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = null, tint = BluePrimary)
                            }
                            
                            Text(
                                text = "$bulkMonthCount Bulan",
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center,
                                fontWeight = FontWeight.Black,
                                fontSize = 20.sp,
                                color = TextDark
                            )
                            
                            IconButton(
                                onClick = { if (bulkMonthCount < maxMonths) bulkMonthCount++ },
                                modifier = Modifier.background(BackgroundBlue, CircleShape)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = BluePrimary)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = BluePrimary.copy(alpha = 0.05f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(Modifier.padding(16.dp)) {
                                Text("Total yang harus dibayar:", color = TextMedium, fontSize = 12.sp)
                                Text(
                                    "Rp ${String.format("%,.0f", totalBulkAmount).replace(",", ".")}",
                                    color = BluePrimary,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 18.sp
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    PrimaryButton(
                        text = "Bayar Sekarang",
                        onClick = {
                            showBulkDialog = false
                            val ids = selectedInvoices.joinToString(",") { it.id }
                            onNavigateToPayment("bulk:$ids")
                        }
                    )
                },
                dismissButton = {
                    TextButton(onClick = { showBulkDialog = false }) {
                        Text("Batal", color = TextMedium)
                    }
                }
            )
        }

        // Transaction Detail Bottom Sheet
        if (showSheet && selectedTransaction != null) {
            ModalBottomSheet(
                    onDismissRequest = { showSheet = false },
                    sheetState = sheetState,
                    containerColor = SurfaceBlue,
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
            ) {
                TransactionDetailSheetContent(
                        invoice = selectedTransaction!!,
                        allInvoices = viewModel.invoices,
                        onDownloadInvoice = { 
                            viewModel.downloadAndShareInvoice(context, selectedTransaction!!.id)
                        },
                        onPayClick = { onNavigateToPayment(selectedTransaction!!.id) }
                )
            }
        }
    }
}

@Composable
fun HistoryHeader(
    amount: String, 
    onPayClick: () -> Unit,
    searchQuery: String,
    onSearchChange: (String) -> Unit
) {
    StandardHeader(
        title = "Riwayat",
        subtitle = "Kelola tagihan internet Anda",
        useGradient = false
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        // Integrated Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Total Tunggakan", color = TextMedium, fontSize = 12.sp)
                    Text(
                        text = amount,
                        color = Color(0xFFEF5350),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                PrimaryButton(
                    text = "Bayar",
                    onClick = onPayClick,
                    modifier = Modifier.height(44.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Integrated Search Bar with premium solid look
        TextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier.fillMaxWidth().height(54.dp),
            placeholder = { Text("Cari Invoice atau Periode...", color = TextLocked, fontSize = 14.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = BluePrimary) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchChange("") }) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = TextMedium)
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(28.dp),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White,
                focusedTextColor = TextDark,
                unfocusedTextColor = TextDark,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                cursorColor = BluePrimary
            )
        )
    }
}

@Composable
fun TransactionStats(transactions: List<InvoiceDto>) {
    val totalLunas = transactions.filter { it.status == "PAID" }.size
    val totalBelum = transactions.filter { it.status == "UNPAID" }.size

    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatPill(label = "Berhasil", count = totalLunas, color = Color(0xFF4CAF50), icon = Icons.Default.DoneAll, modifier = Modifier.weight(1f))
        StatPill(label = "Tertunda", count = totalBelum, color = Color(0xFFFF9800), icon = Icons.Default.PendingActions, modifier = Modifier.weight(1f))
    }
}

@Composable
fun StatPill(label: String, count: Int, color: Color, icon: ImageVector, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = SurfaceBlue,
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(32.dp).background(color.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(text = label, color = TextMedium, fontSize = 10.sp)
                Text(text = "$count Transaksi", color = TextDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}


@Composable
fun HistoryFilters(selectedFilter: String, onFilterSelected: (String) -> Unit) {
    val filters = listOf("Semua", "Lunas", "Belum Lunas")

    Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        filters.forEach { filter ->
            val isSelected = selectedFilter == filter
            Surface(
                    modifier =
                            Modifier.clip(RoundedCornerShape(12.dp)).clickable {
                                onFilterSelected(filter)
                            },
                    color = if (isSelected) BluePrimary else SurfaceBlue,
                    border = if (!isSelected) BorderStroke(1.dp, BackgroundBlue) else null
            ) {
                Text(
                        text = filter,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        color = if (isSelected) Color.White else TextMedium,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun TransactionItemRow(invoice: com.danipinion.sobatwiff.data.remote.model.InvoiceDto, isLocked: Boolean = false, onClick: () -> Unit) {
    val isPaid = invoice.status == "PAID"
    val monthNames = listOf("", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember")
    val displayId = "INV/${invoice.month}/${invoice.year}/${invoice.id.takeLast(4)}"

    Card(
            modifier =
                    Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 6.dp).clickable {
                        onClick()
                    },
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceBlue),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                    modifier =
                            Modifier.size(44.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                            if (isPaid) Color(0xFF4CAF50).copy(alpha = 0.1f) 
                                            else Color(0xFFFF9800).copy(alpha = 0.1f)
                                    ),
                    contentAlignment = Alignment.Center
            ) {
                Icon(
                        imageVector =
                                if (isPaid) Icons.AutoMirrored.Filled.ReceiptLong 
                                else if (isLocked) Icons.Default.Lock
                                else Icons.Default.Feedback,
                        contentDescription = null,
                        tint = if (isPaid) Color(0xFF4CAF50) else if (isLocked) Color.LightGray else Color(0xFFFF9800),
                        modifier = Modifier.size(20.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                        text = "Periode ${monthNames[invoice.month]} ${invoice.year}",
                        color = if (isLocked) TextLocked else TextDark,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                )
                Text(text = displayId, color = TextMedium, fontSize = 11.sp)
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                        text = "Rp ${String.format("%,.0f", invoice.amount).replace(",", ".")}",
                        color = if (isLocked) TextLocked else if (isPaid) TextDark else Color(0xFFEF5350),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black
                )
                Spacer(modifier = Modifier.height(4.dp))
                StatusBadge(
                    text = if (isPaid) "Lunas" else if (isLocked) "Terkunci" else "Belum Lunas",
                    color = if (isPaid) Color(0xFF4CAF50) else if (isLocked) Color.Gray else Color(0xFFFF9800),
                    backgroundColor = if (isPaid) Color(0xFF4CAF50).copy(alpha = 0.1f) 
                                    else Color(0xFFFF9800).copy(alpha = 0.1f)
                )
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextLocked, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
fun TransactionDetailSheetContent(
    invoice: InvoiceDto, 
    allInvoices: List<InvoiceDto>,
    onDownloadInvoice: () -> Unit,
    onPayClick: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val isPaid = invoice.status == "PAID"
    val monthNames = listOf("", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember")
    val displayId = "INV/${invoice.month}/${invoice.year}/${invoice.id.takeLast(4)}"

    Column(modifier = Modifier.fillMaxWidth().padding(24.dp).padding(bottom = 32.dp)) {
        Text(
                text = if (isPaid) "Detail Transaksi" else "Tagihan Belum Dibayar",
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = TextDark,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
                text =
                        if (isPaid) "Berikut adalah rincian pembayaran Anda"
                        else "Segera lakukan pembayaran untuk menikmati layanan",
                fontSize = 13.sp,
                color = TextMedium,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Receipt UI Look
        Surface(
                modifier = Modifier.fillMaxWidth(),
                color = BackgroundBlue.copy(alpha = 0.3f),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, BackgroundBlue.copy(alpha = 0.5f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                InfoRow(label = "ID Transaksi", value = displayId)
                InfoRow(label = "Periode Layanan", value = "${monthNames[invoice.month]} ${invoice.year}")
                InfoRow(label = "Status Pembayaran", value = if (isPaid) "Lunas" else "Belum Dibayar")
                if (isPaid) {
                    val dateStr = if (invoice.paidAt != null) {
                        try {
                            // SimpleDateFormat ISO 8601 to readable
                            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            val outputFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
                            val date = inputFormat.parse(invoice.paidAt)
                            outputFormat.format(date!!)
                        } catch (e: Exception) { invoice.paidAt }
                    } else "-"
                    InfoRow(label = "Tanggal Bayar", value = dateStr)
                } else {
                    InfoRow(label = "Jatuh Tempo", value = "Tgl 20", isLast = true)
                }

                Spacer(modifier = Modifier.height(16.dp))
                // Dotted line simulation
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.LightGray.copy(alpha = 0.5f)))
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Total Bayar", color = TextMedium, fontSize = 12.sp)
                        Text(
                            text = "Rp ${String.format("%,.0f", invoice.amount).replace(",", ".")}",
                            color = if (isPaid) BluePrimary else Color(0xFFEF5350),
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp
                        )
                    }
                    if (isPaid) {
                        StatusBadge(text = "SUKSES", color = Color(0xFF4CAF50), backgroundColor = Color(0xFF4CAF50).copy(alpha = 0.1f))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (isPaid) {
            PrimaryButton(
                text = "Unduh PDF",
                onClick = onDownloadInvoice,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                icon = Icons.Default.Download
            )
        } else {
            val unpaidInvoices = allInvoices.filter { it.status == "UNPAID" }
                .sortedWith(compareBy<com.danipinion.sobatwiff.data.remote.model.InvoiceDto> { it.year }.thenBy { it.month })
            val oldestUnpaid = unpaidInvoices.firstOrNull()
            val isLocked = invoice.status == "UNPAID" && invoice.id != oldestUnpaid?.id
            
            PrimaryButton(
                text = if (isLocked) "Selesaikan Tagihan Lama" 
                       else if (invoice.isPaymentInProgress == true) "Lanjutkan Pembayaran" 
                       else "Bayar Sekarang",
                onClick = {
                    if (isLocked && oldestUnpaid != null) {
                        android.widget.Toast.makeText(context, "Silahkan lunasi tagihan bulan ${monthNames[oldestUnpaid.month]} ${oldestUnpaid.year} terlebih dahulu.", android.widget.Toast.LENGTH_SHORT).show()
                    } else {
                        onPayClick()
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                icon = if (isLocked) Icons.Default.Lock else Icons.AutoMirrored.Filled.ArrowForward,
                containerColor = if (isLocked) Color.LightGray else BluePrimary
            )
        }
    }
}


@Composable
fun EmptyHistoryState() {
    Column(
            modifier = Modifier.fillMaxWidth().padding(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
                Icons.Default.History,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = TextLocked.copy(alpha = 0.3f)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "Belum Ada Riwayat", color = TextMedium, fontWeight = FontWeight.Bold)
        Text(
                text = "Transaksi Anda akan muncul di sini",
                color = TextLocked,
                fontSize = 13.sp,
                textAlign = TextAlign.Center
        )
    }
}

data class TransactionData(
        val id: String,
        val period: String,
        val amount: String,
        val date: String,
        val status: String,
        val method: String
)
