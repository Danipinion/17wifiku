package com.danipinion.sobatwiff.data.repository

import com.danipinion.sobatwiff.data.local.SessionManager
import com.danipinion.sobatwiff.data.local.UserDao
import com.danipinion.sobatwiff.data.local.UserCache
import com.danipinion.sobatwiff.data.remote.ApiService
import com.danipinion.sobatwiff.data.remote.model.LoginRequest
import com.danipinion.sobatwiff.data.remote.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

class UserRepository(
    private val context: android.content.Context,
    private val apiService: ApiService,
    private val userDao: UserDao,
    private val sessionManager: SessionManager
) {
    val hasSeenOnboarding: Flow<Boolean> = sessionManager.hasSeenOnboarding
    
    suspend fun setHasSeenOnboarding(seen: Boolean) {
        sessionManager.setHasSeenOnboarding(seen)
    }

    suspend fun login(identifier: String, password: String): Result<Unit> {
        return try {
            val deviceId = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            )
            val deviceName = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
            
            val response = apiService.login(
                LoginRequest(
                    identifier = identifier, 
                    password = password,
                    deviceId = deviceId,
                    deviceName = deviceName
                )
            )
            sessionManager.saveSession(
                token = response.token,
                userId = response.user.id,
                userName = response.user.name
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkSession(): Boolean {
        return sessionManager.isSessionValid.first()
    }

    suspend fun logout() {
        sessionManager.clearSession()
        userDao.clearUser()
    }

    suspend fun updateActivity() {
        sessionManager.updateActivity()
    }

    val authToken: Flow<String?> = sessionManager.authToken
    val rememberMe: Flow<Boolean> = sessionManager.rememberMe
    val savedIdentifier: Flow<String?> = sessionManager.savedIdentifier

    suspend fun saveRememberMe(enabled: Boolean, identifier: String?) {
        sessionManager.saveRememberMe(enabled, identifier)
    }

    suspend fun incrementFailedAttempts() = sessionManager.incrementFailedAttempts()
    suspend fun resetFailedAttempts() = sessionManager.resetFailedAttempts()

    val failedAttempts: Flow<Int> = sessionManager.failedAttempts
    val blockExpiry: Flow<Long> = sessionManager.blockExpiry

    suspend fun getProfile(): Result<UserProfile> {
        return try {
            val profile = apiService.getProfile()
            userDao.insertUser(UserCache(
                id = profile.id,
                idNumber = profile.idNumber,
                name = profile.name,
                phone = profile.phone,
                role = profile.role,
                abonemen = profile.abonemen,
                address = profile.address,
                latitude = profile.latitude,
                longitude = profile.longitude,
                notifBilling = profile.notifBilling,
                notifPromo = profile.notifPromo
            ))
            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCachedUser(): UserCache? {
        return userDao.getUser()
    }

    suspend fun updateLocation(latitude: Double, longitude: Double): Result<Unit> {
        return try {
            apiService.updateLocation(com.danipinion.sobatwiff.data.remote.model.UpdateLocationRequest(latitude, longitude))
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHomeData(): Result<com.danipinion.sobatwiff.data.remote.model.HomeResponse> {
        return try {
            val response = apiService.getHomeData()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun changePassword(oldPass: String, newPass: String): Result<String> {
        return try {
            val response = apiService.changePassword(com.danipinion.sobatwiff.data.remote.model.PasswordRequest(oldPass, newPass))
            if (response.success) Result.success(response.message)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateNotifications(notifBilling: Boolean? = null, notifPromo: Boolean? = null): Result<String> {
        return try {
            val response = apiService.updateNotifications(com.danipinion.sobatwiff.data.remote.model.NotificationSettingsRequest(notifBilling, notifPromo))
            if (response.success) Result.success(response.message)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNotifications(): Result<List<com.danipinion.sobatwiff.data.remote.model.NotificationDto>> {
        return try {
            Result.success(apiService.getNotifications())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markNotificationsRead(id: String? = null): Result<Unit> {
        return try {
            apiService.markNotificationsRead(com.danipinion.sobatwiff.data.remote.model.MarkReadRequest(id))
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteNotification(id: String? = null): Result<Unit> {
        return try {
            apiService.deleteNotifications(id)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSessions(): Result<List<com.danipinion.sobatwiff.data.remote.model.SessionDto>> {
        return try {
            val response = apiService.getSessions()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logoutSession(id: String): Result<String> {
        return try {
            val response = apiService.logoutSession(id)
            if (response.success) Result.success(response.message)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logoutOtherSessions(): Result<String> {
        return try {
            val response = apiService.logoutOtherSessions()
            if (response.success) Result.success(response.message)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyInvoices(): Result<com.danipinion.sobatwiff.data.remote.model.MyInvoicesResponse> {
        return try {
            Result.success(apiService.getMyInvoices())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun downloadInvoicePdf(invoiceId: String): Result<okhttp3.ResponseBody> {
        return try {
            Result.success(apiService.downloadInvoicePdf(invoiceId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPayment(request: com.danipinion.sobatwiff.data.remote.model.PaymentCreateRequest): Result<com.danipinion.sobatwiff.data.remote.model.PaymentCreateResponse> {
        return try {
            Result.success(apiService.createPayment(request))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPaymentStatus(paymentId: String): Result<com.danipinion.sobatwiff.data.remote.model.PaymentStatusResponse> {
        return try {
            Result.success(apiService.getPaymentStatus(paymentId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelPayment(paymentId: String): Result<String> {
        return try {
            val response = apiService.cancelPayment(paymentId)
            if (response.success) Result.success(response.message)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
