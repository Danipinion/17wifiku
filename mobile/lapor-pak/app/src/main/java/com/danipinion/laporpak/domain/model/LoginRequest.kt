package com.danipinion.laporpak.domain.model

data class LoginRequest(
    val identifier: String,
    val password: String,
    val app: String = "laporpak"
)
