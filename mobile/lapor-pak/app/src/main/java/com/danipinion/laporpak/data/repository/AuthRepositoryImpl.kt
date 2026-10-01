package com.danipinion.laporpak.data.repository

import com.danipinion.laporpak.data.remote.ApiService
import com.danipinion.laporpak.domain.model.LoginRequest
import com.danipinion.laporpak.domain.model.LoginResponse
import com.danipinion.laporpak.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : AuthRepository {
    override suspend fun login(request: LoginRequest): Result<LoginResponse> {
        return try {
            val response = apiService.login(request)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(Exception("Empty Response Body"))
            } else {
                val errorMsg = try {
                    val errorBodyString = response.errorBody()?.string()
                    if (!errorBodyString.isNullOrEmpty()) {
                        org.json.JSONObject(errorBodyString).getString("error")
                    } else {
                        "Login Gagal: ${response.code()} ${response.message()}"
                    }
                } catch (e: Exception) {
                    "Login Gagal: ${response.code()} ${response.message()}"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
