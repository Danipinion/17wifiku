package com.danipinion.sobatwiff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.danipinion.sobatwiff.ui.theme.*

/**
 * Standard Header used across main screens.
 */
@Composable
fun StandardHeader(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    useGradient: Boolean = true,
    horizontalAlignment: Alignment.Horizontal = Alignment.Start,
    action: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit = {}
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (useGradient) {
                    Modifier.background(
                        Brush.verticalGradient(
                            colors = listOf(BluePrimary, BackgroundBlue)
                        )
                    )
                } else {
                    Modifier.background(BluePrimary)
                }
            )
    ) {
        Column(
            modifier = Modifier
                .statusBarsPadding()
                .padding(horizontal = 24.dp)
                .padding(top = 16.dp, bottom = 24.dp)
                .fillMaxWidth(),
            horizontalAlignment = horizontalAlignment
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = horizontalAlignment
                ) {
                    Text(
                        text = title,
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = subtitle,
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 14.sp
                    )
                }
                action?.invoke()
            }
            content()
        }
    }
}

/**
 * Standard Section Title used for grouping content.
 */
@Composable
fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    trailing: (@Composable () -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            color = TextDark,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        trailing?.invoke()
    }
}

/**
 * Standard Primary Button with White Text.
 */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    icon: ImageVector? = null,
    containerColor: Color = BluePrimary
) {
    Button(
        onClick = { if (!isLoading) onClick() },
        modifier = modifier,
        enabled = enabled && !isLoading,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = Color.White
        ),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            if (icon != null) {
                Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Box with Icon used in menu items or grid actions.
 */
@Composable
fun IconBox(
    icon: ImageVector,
    iconColor: Color = BluePrimary,
    backgroundColor: Color = BackgroundBlue,
    size: Dp = 44.dp,
    iconSize: Dp = 24.dp,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(12.dp)
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(shape)
            .background(backgroundColor),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = iconColor,
            modifier = Modifier.size(iconSize)
        )
    }
}

/**
 * Badge/Status Tag.
 */
@Composable
fun StatusBadge(
    text: String,
    color: Color,
    backgroundColor: Color
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

/**
 * Standard Info Row for details.
 */
@Composable
fun InfoRow(
    label: String,
    value: String,
    icon: ImageVector? = null,
    isLast: Boolean = false
) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = BluePrimary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
            }
            Text(
                text = label,
                color = TextMedium,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = value,
                color = TextDark,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
        if (!isLast) {
            HorizontalDivider(
                color = BackgroundBlue,
                thickness = 1.dp
            )
        }
    }
}
/**
 * Standard Text Field with consistent styling.
 */
@Composable
fun StandardTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    passwordVisible: Boolean = true,
    onPasswordToggle: () -> Unit = {},
    enabled: Boolean = true
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            color = if (enabled) TextDark else TextLocked,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = enabled,
            placeholder = { Text(placeholder, color = TextLocked, fontSize = 14.sp) },
            shape = RoundedCornerShape(16.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White,
                disabledContainerColor = Color(0xFFF5F5F5),
                focusedBorderColor = BluePrimary,
                unfocusedBorderColor = BackgroundBlue,
                disabledBorderColor = BackgroundBlue,
                focusedTextColor = TextDark,
                unfocusedTextColor = TextDark,
                disabledTextColor = TextLocked
            ),
            visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
            trailingIcon = {
                if (isPassword) {
                    IconButton(onClick = onPasswordToggle) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (passwordVisible) "Hide password" else "Show password",
                            tint = TextLocked
                        )
                    }
                }
            }
        )
    }
}

/**
 * Simple Message Dialog for alerts.
 */
@Composable
fun SimpleMessageDialog(
    title: String,
    message: String,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = title,
                color = TextDark,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Text(
                text = message,
                color = TextMedium,
                fontSize = 14.sp
            )
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Tutup", color = BluePrimary, fontWeight = FontWeight.Bold)
            }
        },
        shape = RoundedCornerShape(28.dp),
        containerColor = SurfaceBlue
    )
}
