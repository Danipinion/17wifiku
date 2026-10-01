package com.danipinion.laporpak.domain.model

data class LoginResponse(
    val token: String,
    val user: User
)
