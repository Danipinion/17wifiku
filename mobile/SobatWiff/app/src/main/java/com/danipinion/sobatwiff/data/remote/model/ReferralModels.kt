package com.danipinion.sobatwiff.data.remote.model

data class ReferralResponse(
    val referralCode: String,
    val totalBonus: Double,
    val successfulCount: Int,
    val referrals: List<ReferralDto>
)

data class ReferralDto(
    val id: String,
    val refereeName: String,
    val refereeIdNumber: String?,
    val status: String, // PENDING, APPROVED, REJECTED
    val paymentStatus: String, // PAID, UNPAID
    val arrearsCount: Int,
    val createdAt: String
)

data class ReferralCodeRequest(
    val code: String
)

