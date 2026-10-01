package com.danipinion.laporpak.domain.model

data class Job(
    val id: String?, // Assuming backend generates ID, or UUID on client
    val userId: String,
    val jobTypeId: String,
    val date: String, // ISO date string or Long timestamp, using String for simplicity with JSON
    val evidence: String?, // URL or path
    val notes: String,
    val lat: Double,
    val long: Double,
    val status: String // Pending, Approved, Rejected
)
