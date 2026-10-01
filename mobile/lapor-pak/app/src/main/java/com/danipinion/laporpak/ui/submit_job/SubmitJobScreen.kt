package com.danipinion.laporpak.ui.submit_job

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.danipinion.laporpak.ui.theme.toDp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitJobScreen(
    modifier: Modifier = Modifier,
    jobId: String? = null,
    viewModel: SubmitJobViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    LaunchedEffect(jobId) {
        viewModel.setJobId(jobId)
    }
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearMessages()
        }
    }
    
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearMessages()
        }
    }

    // Android Native LocationManager
    val locationManager = remember {
        context.getSystemService(android.content.Context.LOCATION_SERVICE) as android.location.LocationManager
    }

    // Permission launcher for Location
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
        
        if (fineGranted || coarseGranted) {
            try {
                // Get last known location using GPS
                val location = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                    ?: locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                    
                if (location != null) {
                    viewModel.onEvent(SubmitJobEvent.OnLocationRetrieved(location.latitude, location.longitude))
                } else {
                    viewModel.onEvent(SubmitJobEvent.OnEvidenceError("Gagal melacak lokasi. Pastikan GPS HP Anda aktif."))
                }
            } catch (e: SecurityException) {
                // Ignore since permission checked
            }
        }
    }

    // Target for Camera Photo
    var tempPhotoUri by remember { mutableStateOf<Uri?>(null) }
    
    // Gallery Launcher
    val pickMediaLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            viewModel.onEvent(SubmitJobEvent.OnEvidenceChanged(uri.toString()))
        }
    }

    // Camera Photo Launcher
    val takePictureLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success) {
            tempPhotoUri?.let { uri ->
                viewModel.onEvent(SubmitJobEvent.OnEvidenceChanged(uri.toString()))
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color(0xFFF5F7FA)
    ) { paddingValues ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 12.dp, start = 24.dp, end = 24.dp, bottom = 24.dp)
        ) {
            
            // Header
            Column {
                Spacer(modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars))
                Text(
                    text = "Lapor Pekerjaan",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                    color = Color(0xFF1E293B)
                )
                Text(
                    text = "Isi detail pekerjaan yang telah diselesaikan",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            
            // Fixed Form Section without Scroll
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .verticalScroll(scrollState),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {

                // Assigned Instruction & Admin Info Card
                if (!uiState.instruction.isNullOrEmpty() || !uiState.adminPhoto.isNullOrEmpty() || uiState.targetLat != 0.0) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = "Tugas",
                                    tint = Color(0xFF0D47A1),
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = "Instruksi & Detail dari Admin",
                                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF003366)
                                )
                            }
                            
                            if (!uiState.instruction.isNullOrEmpty()) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = uiState.instruction!!,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF0D47A1)
                                )
                            }

                            if (!uiState.adminPhoto.isNullOrEmpty()) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "Foto Referensi:",
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF0D47A1)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                AsyncImage(
                                    model = if (uiState.adminPhoto!!.startsWith("http")) {
                                        uiState.adminPhoto
                                    } else {
                                        "${com.danipinion.laporpak.util.Constants.BASE_URL.trimEnd('/')}/${uiState.adminPhoto!!.trimStart('/')}"
                                    },
                                    contentDescription = "Foto Referensi Admin",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(200.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.White),
                                    contentScale = ContentScale.Crop
                                )
                            }

                            if (uiState.targetLat != 0.0) {
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = {
                                        val gmmIntentUri = Uri.parse("google.navigation:q=${uiState.targetLat},${uiState.targetLong}")
                                        val mapIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, gmmIntentUri)
                                        mapIntent.setPackage("com.google.android.apps.maps")
                                        context.startActivity(mapIntent)
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D47A1)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Buka Lokasi di Google Maps")
                                }
                            }
                        }
                    }
                }

            // Job Type Dropdown Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(4.dp, RoundedCornerShape(16.dp), spotColor = Color(0x1A000000)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Tipe Pekerjaan", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color(0xFF1E293B))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("(Wajib)", style = MaterialTheme.typography.labelMedium, color = Color(0xFFEF4444))
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    var expanded by remember { mutableStateOf(false) }
                    ExposedDropdownMenuBox(
                        expanded = expanded,
                        onExpandedChange = { expanded = !expanded }
                    ) {
                        OutlinedTextField(
                            value = uiState.selectedJobTypeId.ifEmpty { "Pilih tipe pekerjaan" },
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(
                                unfocusedBorderColor = Color(0xFFE2E8F0),
                                focusedBorderColor = Color(0xFF1976D2),
                                focusedContainerColor = Color(0xFFF8FAFC),
                                unfocusedContainerColor = Color(0xFFF8FAFC)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false },
                            modifier = Modifier.background(Color.White)
                        ) {
                            if (uiState.jobTypes.isEmpty()) {
                                DropdownMenuItem(
                                    text = { Text("Memuat tipe pekerjaan...", color = Color.Gray) },
                                    onClick = { expanded = false }
                                )
                            } else {
                                uiState.jobTypes.forEach { typeName ->
                                    DropdownMenuItem(
                                        text = { Text(typeName) },
                                        onClick = {
                                            viewModel.onEvent(SubmitJobEvent.OnJobTypeChanged(typeName))
                                            expanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Evidence Upload Section
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(4.dp, RoundedCornerShape(16.dp), spotColor = Color(0x1A000000)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Bukti Foto", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color(0xFF1E293B))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("(Wajib)", style = MaterialTheme.typography.labelMedium, color = Color(0xFFEF4444))
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    var showImageSourceDialog by remember { mutableStateOf(false) }

                    if (showImageSourceDialog) {
                        AlertDialog(
                            onDismissRequest = { showImageSourceDialog = false },
                            title = { Text("Pilih Sumber Foto") },
                            text = { Text("Ambil foto baru atau pilih dari galeri?") },
                            confirmButton = {
                                TextButton(onClick = {
                                    val uri = context.createImageFileUri()
                                    tempPhotoUri = uri
                                    takePictureLauncher.launch(uri)
                                    showImageSourceDialog = false
                                }) {
                                    Text("Kamera")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = {
                                    pickMediaLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                    showImageSourceDialog = false
                                }) {
                                    Text("Galeri")
                                }
                            }
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF1F5F9))
                            .border(2.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                            .clickable {
                                showImageSourceDialog = true
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (uiState.evidenceUri.isNullOrEmpty()) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = "Upload Foto",
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Ketuk untuk mengunggah foto", color = Color(0xFF64748B), style = MaterialTheme.typography.bodyMedium)
                            }
                        } else {
                            AsyncImage(
                                model = uiState.evidenceUri,
                                contentDescription = "Bukti Foto",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            // Small edit button overlay
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(8.dp)
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color.Black.copy(alpha = 0.5f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = "Ganti Foto", tint = Color.White, modifier = Modifier.size(20.sp.toDp))
                            }
                        }
                    }
                }
            }

            // Location Section
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(4.dp, RoundedCornerShape(16.dp), spotColor = Color(0x1A000000)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFE3F2FD)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = "Lokasi", tint = Color(0xFF1976D2))
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Lokasi Pekerjaan", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color(0xFF1E293B))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("(Wajib)", style = MaterialTheme.typography.labelMedium, color = Color(0xFFEF4444))
                        }
                        Text(
                            text = if (uiState.lat == 0.0) "Belum diatur" else "${uiState.lat}, ${uiState.long}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (uiState.lat == 0.0) Color(0xFFEF4444) else Color(0xFF64748B)
                        )
                    }

                    IconButton(
                        onClick = {
                            val fineLoc = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                            val coarseLoc = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                            
                            if (fineLoc || coarseLoc) {
                                try {
                                    val location = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                                        ?: locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                                        
                                    if (location != null) {
                                        viewModel.onEvent(SubmitJobEvent.OnLocationRetrieved(location.latitude, location.longitude))
                                    } else {
                                        viewModel.onEvent(SubmitJobEvent.OnEvidenceError("Gagal melacak lokasi. Pastikan GPS/Lokasi HP Anda hidup."))
                                    }
                                } catch (e: SecurityException) { }
                            } else {
                                locationPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        modifier = Modifier.size(40.dp).background(Color(0xFFF8FAFC), CircleShape)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Update Location", tint = Color(0xFF1E293B))
                    }
                }
            }

            // Notes Section
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(4.dp, RoundedCornerShape(16.dp), spotColor = Color(0x1A000000)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Catatan Tambahan", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color(0xFF1E293B))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("(Opsional)", style = MaterialTheme.typography.labelMedium, color = Color(0xFF94A3B8))
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = uiState.notes,
                        onValueChange = { viewModel.onEvent(SubmitJobEvent.OnNotesChanged(it)) },
                        placeholder = { Text("Misal: Router diletakkan di lantai 2", color = Color(0xFF94A3B8)) },
                        modifier = Modifier.fillMaxWidth().height(120.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color(0xFFE2E8F0),
                            focusedBorderColor = Color(0xFF1976D2),
                            focusedContainerColor = Color(0xFFF8FAFC),
                            unfocusedContainerColor = Color(0xFFF8FAFC)
                        )
                    )
                }
            }

            } // end of Form Section

            Spacer(modifier = Modifier.height(16.dp))

            // Submit Button Fixed at Bottom
            Button(
                onClick = { viewModel.onEvent(SubmitJobEvent.Submit) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .shadow(8.dp, RoundedCornerShape(16.dp), spotColor = Color(0xFF1976D2)),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1976D2),
                    disabledContainerColor = Color(0xFF1976D2).copy(alpha = 0.7f),
                    disabledContentColor = Color.White
                ),
                enabled = !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.sp.toDp), 
                        color = Color.White,
                        strokeWidth = 2.5.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Mengirim Laporan...", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                } else {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(20.sp.toDp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Kirim Laporan", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
        }
    }
}
}

private fun android.content.Context.createImageFileUri(): Uri {
    val file = java.io.File(cacheDir, "camera_image_${System.currentTimeMillis()}.jpg")
    return androidx.core.content.FileProvider.getUriForFile(
        this,
        applicationContext.packageName + ".fileprovider",
        file
    )
}

private fun android.content.Context.clearImageCache() {
    val files = cacheDir.listFiles()
    files?.forEach { file ->
        // Delete all camera and temporary evidence images in the cache dir
        if ((file.name.startsWith("camera_image_") || file.name.startsWith("evidence_")) && file.name.endsWith(".jpg")) {
            file.delete()
        }
    }
}
