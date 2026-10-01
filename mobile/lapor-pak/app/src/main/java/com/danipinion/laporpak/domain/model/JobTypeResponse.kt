package com.danipinion.laporpak.domain.model

data class JobTypeResponse(
    val jobTypes: List<JobType>
)

data class JobType(
    val id: String,
    val name: String
)

data class SubmitJobResponse(
    val message: String,
    val error: String? = null
)
