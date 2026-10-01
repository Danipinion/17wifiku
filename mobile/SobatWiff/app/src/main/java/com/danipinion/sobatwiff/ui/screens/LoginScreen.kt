package com.danipinion.sobatwiff.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import com.danipinion.sobatwiff.ui.viewmodels.LoginViewModel

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*


import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.ui.theme.*

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    SobatMulyaTheme {
        // LoginScreen() // Requires ViewModel
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit = {}
) {
    var isVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        isVisible = true
        viewModel.loginSuccess.collectLatest { success ->
            if (success) onLoginSuccess()
        }
    }
    

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        BackgroundBlue,
                        PastelBlueLight,
                        Color.White
                    )
                )
            )
    ) {
        // Main content wrap to apply blur
        Box(
            modifier = Modifier
                .fillMaxSize()
                .blur(if (viewModel.isBlocked) 10.dp else 0.dp)
        ) {
            // Decorative background elements (subtle circles)
            Box(
                modifier = Modifier
                    .size(300.dp)
                    .offset(x = (-100).dp, y = (-50).dp)
                    .clip(RoundedCornerShape(150.dp))
                    .background(PastelBlueLight.copy(alpha = 0.5f))
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.Start
            ) {
            Spacer(modifier = Modifier.height(60.dp))

            AnimatedVisibility(
                visible = isVisible,
                enter = fadeIn(animationSpec = tween(1000)) + slideInVertically(
                    initialOffsetY = { -40 },
                    animationSpec = tween(1000)
                )
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(BluePrimary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "M",
                                color = Color.White,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "SobatMulya",
                            color = BluePrimary,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Partner Internet Terpercaya Anda",
                        color = TextMedium,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Light
                    )
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            AnimatedVisibility(
                visible = isVisible,
                enter = fadeIn(animationSpec = tween(1200, delayMillis = 400)) + slideInVertically(
                    initialOffsetY = { 40 },
                    animationSpec = tween(1200, delayMillis = 400)
                )
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Selamat Datang!",
                        color = TextDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Silahkan masuk untuk memantau tagihan dan internet Anda",
                        color = TextMedium,
                        fontSize = 14.sp
                    )
                    
                    Spacer(modifier = Modifier.height(40.dp))


                    var passwordVisible by remember { mutableStateOf(false) }

                    // ID / Phone Field
                    OutlinedTextField(
                        value = viewModel.identifier,
                        onValueChange = { viewModel.identifier = it },
                        label = { Text("Nomor HP atau ID Pelanggan") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        leadingIcon = {
                            Icon(Icons.Filled.Phone, contentDescription = null, tint = BluePrimary)
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BluePrimary,
                            unfocusedBorderColor = PastelBlueMedium,
                            focusedContainerColor = Color.White.copy(alpha = 0.7f),
                            unfocusedContainerColor = Color.White.copy(alpha = 0.7f),
                            focusedTextColor = TextDark,
                            unfocusedTextColor = TextDark
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Password Field
                    OutlinedTextField(
                        value = viewModel.password,
                        onValueChange = { viewModel.password = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        leadingIcon = {
                            Icon(Icons.Filled.Lock, contentDescription = null, tint = BluePrimary)
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                    contentDescription = null,
                                    tint = BluePrimary
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BluePrimary,
                            unfocusedBorderColor = PastelBlueMedium,
                            focusedContainerColor = Color.White.copy(alpha = 0.7f),
                            unfocusedContainerColor = Color.White.copy(alpha = 0.7f),
                            focusedTextColor = TextDark,
                            unfocusedTextColor = TextDark
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .weight(1f)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) {
                                    viewModel.rememberMe = !viewModel.rememberMe
                                }
                        ) {
                            Checkbox(
                                checked = viewModel.rememberMe,
                                onCheckedChange = { viewModel.rememberMe = it },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = BluePrimary,
                                    uncheckedColor = PastelBlueMedium
                                )
                            )
                            Text(
                                text = "Ingat Saya",
                                color = TextMedium,
                                fontSize = 14.sp
                            )
                        }
                    }

                    // Error Message UI Improvement
                    AnimatedVisibility(
                        visible = viewModel.error != null,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            color = Color(0xFFFFEBEE).copy(alpha = 0.9f),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFEF5350).copy(alpha = 0.3f))
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = Color(0xFFC62828),
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = buildString {
                                        append(viewModel.error ?: "")
                                        if (viewModel.failedAttemptsCount > 0 && viewModel.failedAttemptsCount < 5) {
                                            append("\n(Tersisa ${5 - viewModel.failedAttemptsCount} kali percobaan lagi)")
                                        }
                                    },
                                    color = Color(0xFFC62828),
                                    fontSize = 13.sp,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Login Button
                    Button(
                        onClick = { 
                            viewModel.onLoginClick()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BluePrimary,
                            contentColor = Color.White
                        ),
                        elevation = ButtonDefaults.buttonElevation(
                            defaultElevation = 0.dp,
                            pressedElevation = 2.dp
                        ),
                        enabled = !viewModel.isLoading
                    ) {
                        if (viewModel.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "Masuk Sekarang",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }


                }
            }
        }
    }

        // Bottom decorative element
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .size(200.dp)
                .offset(x = 50.dp, y = 50.dp)
                .clip(RoundedCornerShape(100.dp))
                .background(PastelBlueMedium.copy(alpha = 0.3f))
        )

        // Brute-force Block Overlay
        if (viewModel.isBlocked) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White.copy(alpha = 0.4f)),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    modifier = Modifier
                        .padding(32.dp)
                        .fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    color = Color.White,
                    shadowElevation = 16.dp
                ) {
                    Column(
                        modifier = Modifier.padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .background(Color(0xFFFFEBEE), RoundedCornerShape(20.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = Color(0xFFC62828),
                                modifier = Modifier.size(40.dp)
                             )
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Text(
                            text = "Akses Dibatasi",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextDark
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Text(
                            text = "Kami mendeteksi aktivitas mencurigakan. Untuk keamanan akun Anda, silakan tunggu sejenak.",
                            textAlign = TextAlign.Center,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextMedium,
                            lineHeight = 22.sp
                        )
                        
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        Text(
                            text = "Bisa dicoba lagi dalam:",
                            style = MaterialTheme.typography.labelLarge,
                            color = TextMedium
                        )
                        
                        Text(
                            text = viewModel.countdownText,
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Black,
                            color = BluePrimary
                        )
                    }
                }
            }
        }
    }
}
