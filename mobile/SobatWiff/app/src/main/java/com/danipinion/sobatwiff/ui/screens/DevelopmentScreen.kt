package com.danipinion.sobatwiff.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Construction
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.BackgroundBlue
import com.danipinion.sobatwiff.ui.theme.BluePrimary
import com.danipinion.sobatwiff.ui.theme.SurfaceBlue
import com.danipinion.sobatwiff.ui.theme.TextMedium

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DevelopmentScreen(title: String, onBack: () -> Unit) {
    Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                        title = { Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                        navigationIcon = {
                            IconButton(onClick = onBack) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                            }
                        },
                        colors =
                                TopAppBarDefaults.centerAlignedTopAppBarColors(
                                        containerColor = SurfaceBlue,
                                        titleContentColor = BluePrimary,
                                        navigationIconContentColor = BluePrimary,
                                        actionIconContentColor = BluePrimary
                                )
                )
            }
    ) { paddingValues ->
        Box(
                modifier = Modifier.fillMaxSize().padding(paddingValues).background(BackgroundBlue),
                contentAlignment = Alignment.Center
        ) {
            Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(32.dp)
            ) {
                Box(
                        modifier =
                                Modifier.size(120.dp)
                                        .clip(CircleShape)
                                        .background(BluePrimary.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                ) {
                    Icon(
                            imageVector = Icons.Default.Construction,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = BluePrimary
                    )
                }
                Spacer(modifier = Modifier.height(32.dp))
                Text(
                        text = "Fitur dalam Pengembangan",
                        color = BluePrimary,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                        text =
                                "Kami sedang bekerja keras untuk menghadirkan fitur $title yang lebih baik untuk Anda. Tunggu update selanjutnya!",
                        color = TextMedium,
                        fontSize = 15.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 22.sp
                )
                Spacer(modifier = Modifier.height(48.dp))
                Button(
                        onClick = onBack,
                        colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
                ) { Text("Kembali ke Beranda", color = Color.White) }
            }
        }
    }
}
