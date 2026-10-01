package com.danipinion.laporpak.domain.repository

import com.danipinion.laporpak.domain.model.Job
import kotlinx.coroutines.flow.Flow

interface JobRepository {
    suspend fun getJobTypes(token: String): Result<List<com.danipinion.laporpak.domain.model.JobType>>
    suspend fun submitJobMultipart(
        token: String,
        jobTypeName: String,
        notes: String?,
        latitude: Double,
        longitude: Double,
        evidenceFile: java.io.File,
        jobId: String? = null
    ): Result<String>

    suspend fun getHistoryJobs(token: String, month: String? = null, year: String? = null): Result<com.danipinion.laporpak.domain.model.HistoryResponse>
    suspend fun getJobDetail(token: String, jobId: String): Result<com.danipinion.laporpak.domain.model.RecentJob>
}
