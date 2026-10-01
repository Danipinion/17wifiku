package com.danipinion.sobatwiff.data.remote.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val identifier: String,
    val password: String,
    val app: String = "sobatwiff",
    val deviceId: String? = null,
    val deviceName: String? = null,
    val location: String? = null,
    val ip: String? = null
)

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val name: String,
    val role: String
)

data class ErrorResponse(
    val error: String
)

data class UserProfile(
    val id: String,
    val idNumber: String?,
    val name: String,
    val phone: String,
    val role: String,
    val status: String,
    val address: String?,
    val abonemen: Float,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val notifBilling: Boolean,
    val notifPromo: Boolean,
    val genieacsDeviceId: String? = null
)

data class RouterInfo(
    val model: String,
    val uptime: String,
    val temperature: String,
    val rxPower: String,
    val ssid: String,
    val ip: String,
    val connectedDevices: Int,
    val deviceList: List<ConnectedDeviceDto> = emptyList(),
    val currentDeviceId: String? = null,
    val availableDevices: List<AvailableDeviceDto> = emptyList()
)

data class AvailableDeviceDto(
    val id: String,
    val name: String
)

data class ConnectedDeviceDto(
    val name: String,
    val ip: String,
    val mac: String
)

data class RouterActionRequest(
    val action: String,
    val password: String? = null,
    val deviceId: String? = null
)

data class NotificationSettingsRequest(
    val notifBilling: Boolean? = null,
    val notifPromo: Boolean? = null
)

data class UpdateLocationRequest(
    val latitude: Double,
    val longitude: Double
)

data class PasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

data class SessionDto(
    val id: String,
    val userId: String,
    val device: String?,
    val location: String?,
    val ip: String?,
    val lastActive: String,
    val createdAt: String
)

data class MessageResponse(
    val success: Boolean,
    val message: String
)

data class HomeResponse(
    val user: HomeUserDto,
    val oldestUnpaidInvoice: InvoiceDto?,
    val announcements: List<AnnouncementDto>
)

data class HomeUserDto(
    val name: String,
    val abonemen: Float
)

data class InvoiceDto(
    val id: String,
    val month: Int,
    val year: Int,
    val amount: Float,
    val status: String,
    val paidAt: String? = null,
    val pdfUrl: String? = null,
    val isPaymentInProgress: Boolean? = false
)

data class MyInvoicesResponse(
    val invoices: List<InvoiceDto>
)
data class NotificationDto(
    val id: String,
    val title: String,
    val content: String,
    val type: String,
    val isRead: Boolean,
    val createdAt: String,
    val metadata: String?
)

data class MarkReadRequest(
    val id: String? = null
)

data class AnnouncementDto(
    val id: String,
    val title: String,
    val content: String,
    val type: String,
    val isUrgent: Boolean,
    val startDate: String,
    val endDate: String? = null
)
