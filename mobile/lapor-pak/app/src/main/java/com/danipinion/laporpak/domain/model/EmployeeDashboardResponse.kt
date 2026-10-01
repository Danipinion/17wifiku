package com.danipinion.laporpak.domain.model

data class EmployeeDashboardResponse(
    val userName: String? = null,
    val statCards: StatCards,
    val recentJobs: List<RecentJob>
)

data class StatCards(
    val todoJobs: Int = 0,
    val pendingJobs: Int,
    val completedJobs: Int,
    val totalJobs: Int,
    val currentIncome: Double? = 0.0
)

data class RecentJob(
    val id: String,
    val jobTypeName: String,
    val price: Double,
    val status: String,
    val date: String,
    val instruction: String? = null,
    val notes: String?,
    val evidence: String?,
    val adminPhoto: String? = null,
    val latitude: Double?,
    val longitude: Double?,
    val targetLatitude: Double? = null,
    val targetLongitude: Double? = null
)
