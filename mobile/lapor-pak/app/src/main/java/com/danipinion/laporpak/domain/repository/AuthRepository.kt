package com.danipinion.laporpak.domain.repository

import com.danipinion.laporpak.domain.model.LoginRequest
import com.danipinion.laporpak.domain.model.LoginResponse

interface AuthRepository {
    suspend fun login(request: LoginRequest): Result<LoginResponse>
}
