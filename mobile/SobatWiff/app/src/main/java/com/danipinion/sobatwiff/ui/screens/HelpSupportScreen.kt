package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.*
import com.danipinion.sobatwiff.ui.components.*
import androidx.compose.ui.platform.LocalContext
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.interaction.MutableInteractionSource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpSupportScreen(onBack: () -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "Pusat Bantuan",
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
        ) {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(24.dp)
            ) {
                Text(
                    "Halo, ada yang bisa kami bantu hari ini?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = TextDark,
                    lineHeight = 28.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Contact Channels
            Column(modifier = Modifier.padding(24.dp)) {
                Text(
                    "Hubungi Dukungan Langsung",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    color = TextDark,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    val context = LocalContext.current
                    val openWhatsApp1 = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/6285237224488"))
                        context.startActivity(intent)
                    }
                    val openWhatsApp2 = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/6285850958737"))
                        context.startActivity(intent)
                    }

                    ContactCard(
                        icon = Icons.Default.Chat,
                        title = "WhatsApp 1",
                        subtitle = "Respon Cepat",
                        color = Color(0xFF4CAF50),
                        modifier = Modifier.weight(1f),
                        onClick = openWhatsApp1
                    )
                    ContactCard(
                        icon = Icons.Default.Chat,
                        title = "WhatsApp 2",
                        subtitle = "Bantuan Teknis",
                        color = Color(0xFF4CAF50),
                        modifier = Modifier.weight(1f),
                        onClick = openWhatsApp2
                    )
                }
            }

            // FAQ Sections
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                Text(
                    "Pertanyaan Sering Diajukan",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    color = TextDark,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                FAQItem(
                    question = "Bagaimana jika koneksi internet terasa lambat?",
                    answer = "Silakan coba matikan modem Anda dengan mencabut kabel power (daya) selama 10 detik, lalu pasang kembali. Anda juga dapat menekan tombol 'Reboot Router' di aplikasi ini dan menunggu 2-3 menit agar jaringan kembali normal."
                )
                FAQItem(
                    question = "Bagaimana cara mengganti kata sandi WiFi?",
                    answer = "Anda dapat menggantinya melalui menu 'Router' lalu pilih ganti kata sandi. Masukkan kata sandi baru yang diinginkan, kemudian pilih 'Simpan'. Modem akan otomatis memulai ulang untuk memperbarui pengaturan Anda."
                )
                FAQItem(
                    question = "Bagaimana cara menambah kecepatan atau ganti paket?",
                    answer = "Jika Anda ingin menambah kecepatan atau mengubah paket internet, silakan hubungi tim kami melalui WhatsApp 1 atau 2 di atas. Tim kami akan membantu memberikan pilihan paket terbaik sesuai kebutuhan Anda."
                )
            }
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun ContactCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    val interactionSource = remember { MutableInteractionSource() }
    Surface(
        modifier = modifier.clickable(
            interactionSource = interactionSource,
            indication = null
        ) { onClick() },
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        shadowElevation = 1.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            IconBox(icon = icon, iconColor = color, backgroundColor = color.copy(alpha = 0.1f), shape = CircleShape)
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextDark)
            Text(subtitle, fontSize = 11.sp, color = TextMedium)
        }
    }
}

@Composable
fun FAQItem(question: String, answer: String) {
    var expanded by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp)
            .clickable { expanded = !expanded },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.5.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = question,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDark,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = BluePrimary
                )
            }
            AnimatedVisibility(visible = expanded) {
                Column {
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = BackgroundBlue, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = answer,
                        fontSize = 13.sp,
                        color = TextMedium,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
}
