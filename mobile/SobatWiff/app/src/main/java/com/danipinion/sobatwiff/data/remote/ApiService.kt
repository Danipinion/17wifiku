package com.danipinion.sobatwiff.data.remote

import com.danipinion.sobatwiff.data.remote.model.*
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body
import retrofit2.http.Query

interface ApiService {
    @POST("mobile/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("mobile/payments/create")
    suspend fun createPayment(@Body request: PaymentCreateRequest): PaymentCreateResponse

    @GET("mobile/payments/{paymentId}")
    suspend fun getPaymentStatus(@retrofit2.http.Path("paymentId") paymentId: String): PaymentStatusResponse

    @POST("mobile/payments/{paymentId}/cancel")
    suspend fun cancelPayment(@retrofit2.http.Path("paymentId") paymentId: String): MessageResponse

    @GET("mobile/ping")
    suspend fun ping(): String

    @GET("mobile/profile")
    suspend fun getProfile(): UserProfile

    @GET("mobile/home")
    suspend fun getHomeData(): HomeResponse

    @GET("mobile/my-invoices")
    suspend fun getMyInvoices(): MyInvoicesResponse

    @retrofit2.http.Streaming
    @GET("mobile/my-invoices/{invoiceId}/download")
    suspend fun downloadInvoicePdf(@retrofit2.http.Path("invoiceId") invoiceId: String): okhttp3.ResponseBody

    @retrofit2.http.PATCH("mobile/profile")
    suspend fun updateLocation(@Body request: UpdateLocationRequest): okhttp3.ResponseBody

    @retrofit2.http.PATCH("mobile/profile/password")
    suspend fun changePassword(@Body request: PasswordRequest): MessageResponse

    @retrofit2.http.PATCH("mobile/profile/notifications")
    suspend fun updateNotifications(@Body request: NotificationSettingsRequest): MessageResponse

    @retrofit2.http.GET("mobile/notifications")
    suspend fun getNotifications(): List<NotificationDto>

    @retrofit2.http.PATCH("mobile/notifications")
    suspend fun markNotificationsRead(@Body request: MarkReadRequest): MessageResponse

    @retrofit2.http.DELETE("mobile/notifications")
    suspend fun deleteNotifications(@retrofit2.http.Query("id") id: String?): MessageResponse

    @retrofit2.http.GET("mobile/sessions")
    suspend fun getSessions(): List<SessionDto>

    @retrofit2.http.DELETE("mobile/sessions/{id}")
    suspend fun logoutSession(@retrofit2.http.Path("id") id: String): MessageResponse

    @retrofit2.http.DELETE("mobile/sessions")
    suspend fun logoutOtherSessions(): MessageResponse

    @GET("mobile/referral")
    suspend fun getReferralData(): ReferralResponse

    @POST("mobile/referral")
    suspend fun submitReferralCode(@Body request: ReferralCodeRequest): MessageResponse

    @GET("mobile/router")
    suspend fun getRouterInfo(@Query("deviceId") deviceId: String? = null): RouterInfo

    @POST("mobile/router")
    suspend fun executeRouterAction(@Body request: RouterActionRequest): MessageResponse
}
