package com.danipinion.laporpak.data.repository

import com.danipinion.laporpak.data.remote.ApiService
import com.danipinion.laporpak.domain.model.Job
import com.danipinion.laporpak.domain.repository.JobRepository
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

class JobRepositoryImpl @Inject constructor(
    private val api: ApiService
) : JobRepository {

    override suspend fun getJobTypes(token: String): Result<List<com.danipinion.laporpak.domain.model.JobType>> {
        return try {
            val response = api.getJobTypes("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.jobTypes)
            } else {
                Result.failure(Exception("Gagal mengambil daftar pekerjaan: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Pastikan internet Anda stabil."))
        }
    }

    override suspend fun submitJobMultipart(
        token: String,
        jobTypeName: String,
        notes: String?,
        latitude: Double,
        longitude: Double,
        evidenceFile: java.io.File,
        jobId: String?
    ): Result<String> {
        return try {
            val jobTypeBody = jobTypeName.toRequestBody("text/plain".toMediaTypeOrNull())
            val notesBody = notes?.toRequestBody("text/plain".toMediaTypeOrNull())
            val latBody = latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val longBody = longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            
            val jobIdBody = jobId?.toRequestBody("text/plain".toMediaTypeOrNull())
            
            val requestFile = evidenceFile.asRequestBody("image/*".toMediaTypeOrNull())
            val evidenceBody = okhttp3.MultipartBody.Part.createFormData("evidence", evidenceFile.name, requestFile)

            val response = api.submitJobMultipart(
                token = "Bearer $token",
                jobTypeName = jobTypeBody,
                notes = notesBody,
                latitude = latBody,
                longitude = longBody,
                evidence = evidenceBody,
                jobId = jobIdBody
            )

            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.message)
            } else {
                val errorMsg = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("Gagal mengirim laporan: $errorMsg"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Koneksi gagal saat mengunggah. Pastikan internet Anda lancar."))
        }
    }

    override suspend fun getHistoryJobs(token: String, month: String?, year: String?): Result<com.danipinion.laporpak.domain.model.HistoryResponse> {
        return try {
            val response = api.getHistoryJobs("Bearer $token", month, year)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("Gagal mengambil riwayat: $errorMsg"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Pastikan internet Anda stabil."))
        }
    }

    override suspend fun getJobDetail(token: String, jobId: String): Result<com.danipinion.laporpak.domain.model.RecentJob> {
        return try {
            val response = api.getJobDetail("Bearer $token", jobId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("Gagal mengambil detail tugas: $errorMsg"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Pastikan internet Anda stabil."))
        }
    }
}
