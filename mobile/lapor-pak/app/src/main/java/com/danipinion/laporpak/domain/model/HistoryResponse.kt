package com.danipinion.laporpak.domain.model

data class HistoryResponse(
    val baseSalary: Double,
    val totalIncome: Double,
    val historyJobs: List<HistoryJobData>
)

data class HistoryJobData(
    val id: String,
    val jobTypeName: String,
    val price: Double,
    val status: String,
    val date: String,
    val notes: String?,
    val evidence: String?,
    val latitude: Double?,
    val longitude: Double?
)
