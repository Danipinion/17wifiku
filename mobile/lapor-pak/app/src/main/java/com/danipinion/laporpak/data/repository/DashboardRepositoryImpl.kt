package com.danipinion.laporpak.data.repository

import com.danipinion.laporpak.data.remote.ApiService
import com.danipinion.laporpak.domain.model.EmployeeDashboardResponse
import com.danipinion.laporpak.domain.repository.DashboardRepository
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : DashboardRepository {
    override suspend fun getDashboardInfo(token: String): Result<EmployeeDashboardResponse> {
        return try {
            val response = apiService.getDashboardInfo("Bearer $token")
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(Exception("Data dari server kosong."))
                }
            } else {
                val errorMsg = try {
                    val jsonObj = JSONObject(response.errorBody()?.string() ?: "")
                    jsonObj.getString("error")
                } catch(e: Exception) {
                    "Gagal mengambil data: ${response.code()}"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
             Result.failure(Exception("Koneksi gagal, silakan periksa koneksi internet Anda."))
        }
    }
}
