package com.danipinion.sobatwiff.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.R
import com.danipinion.sobatwiff.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun CustomSplashScreen(onFinished: () -> Unit) {
    var startAnimation by remember { mutableStateOf(false) }
    var progress by remember { mutableStateOf(0f) }
    
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 2000, easing = LinearEasing),
        label = "progress"
    )

    val scale by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.5f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "scale"
    )

    val alpha by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(1000),
        label = "alpha"
    )

    LaunchedEffect(Unit) {
        startAnimation = true
        progress = 1f
        delay(2500) // Wait for animation and progress
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(BackgroundBlue, Color.White)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .scale(scale)
                    .alpha(alpha),
                contentAlignment = Alignment.Center
            ) {
                // Background circle decoration
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(32.dp))
                        .background(BluePrimary.copy(alpha = 0.05f))
                )
                
                Image(
                    painter = painterResource(id = R.drawable.ic_sobatmulya_logo),
                    contentDescription = "SobatMulya Logo",
                    modifier = Modifier.size(100.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "SobatMulya",
                color = BluePrimary,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.alpha(alpha)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Loading bar growing from below
            Box(
                modifier = Modifier
                    .width(200.dp)
                    .height(6.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(PastelBlueMedium.copy(alpha = 0.3f))
                    .alpha(alpha)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(animatedProgress)
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(BluePrimary, BluePrimary.copy(alpha = 0.7f))
                            )
                        )
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Menghubungkan Anda...",
                color = TextMedium,
                fontSize = 14.sp,
                modifier = Modifier.alpha(alpha)
            )
        }
    }
}
