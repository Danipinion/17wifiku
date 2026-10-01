package com.danipinion.laporpak.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit

val TextUnit.toDp: Dp
    @Composable
    get() = with(LocalDensity.current) { this@toDp.toDp() }
