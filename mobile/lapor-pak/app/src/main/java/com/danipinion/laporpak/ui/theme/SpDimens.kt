package com.danipinion.laporpak.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp

val Int.sdp: Dp
    @Composable
    get() = with(LocalDensity.current) { this@sdp.toDp() * fontScale }

val Float.sdp: Dp
    @Composable
    get() = with(LocalDensity.current) { this@sdp.toDp() * fontScale }
