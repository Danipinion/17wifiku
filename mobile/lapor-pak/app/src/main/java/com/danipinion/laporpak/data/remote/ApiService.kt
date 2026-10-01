package com.danipinion.laporpak.data.remote

import com.danipinion.laporpak.domain.model.Job
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {

    @GET("/api/mobile/employee/job-types")
    suspend fun getJobTypes(@retrofit2.http.Header("Authorization") token: String): Response<com.danipinion.laporpak.domain.model.JobTypeResponse>

    @GET("/api/jobs/{id}")
    suspend fun getJobDetail(
        @retrofit2.http.Header("Authorization") token: String,
        @retrofit2.http.Path("id") id: String
    ): Response<com.danipinion.laporpak.domain.model.RecentJob>

    @retrofit2.http.Multipart
    @POST("/api/mobile/employee/jobs")
    suspend fun submitJobMultipart(
        @retrofit2.http.Header("Authorization") token: String,
        @retrofit2.http.Part("jobTypeName") jobTypeName: okhttp3.RequestBody,
        @retrofit2.http.Part("notes") notes: okhttp3.RequestBody?,
        @retrofit2.http.Part("latitude") latitude: okhttp3.RequestBody,
        @retrofit2.http.Part("longitude") longitude: okhttp3.RequestBody,
        @retrofit2.http.Part evidence: okhttp3.MultipartBody.Part,
        @retrofit2.http.Part("jobId") jobId: okhttp3.RequestBody? = null
    ): Response<com.danipinion.laporpak.domain.model.SubmitJobResponse>

    @POST("/api/mobile/login")
    suspend fun login(@Body request: com.danipinion.laporpak.domain.model.LoginRequest): Response<com.danipinion.laporpak.domain.model.LoginResponse>

    @GET("/api/mobile/employee/dashboard")
    suspend fun getDashboardInfo(@retrofit2.http.Header("Authorization") token: String): Response<com.danipinion.laporpak.domain.model.EmployeeDashboardResponse>

    @GET("/api/mobile/employee/history")
    suspend fun getHistoryJobs(
        @retrofit2.http.Header("Authorization") token: String,
        @retrofit2.http.Query("month") month: String? = null,
        @retrofit2.http.Query("year") year: String? = null
    ): Response<com.danipinion.laporpak.domain.model.HistoryResponse>

    @GET("/api/mobile/version")
    suspend fun getVersion(): Response<com.danipinion.laporpak.domain.model.VersionResponse>
}
