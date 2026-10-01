package com.danipinion.laporpak.domain.repository

import com.danipinion.laporpak.domain.model.EmployeeDashboardResponse

interface DashboardRepository {
    suspend fun getDashboardInfo(token: String): Result<EmployeeDashboardResponse>
}
