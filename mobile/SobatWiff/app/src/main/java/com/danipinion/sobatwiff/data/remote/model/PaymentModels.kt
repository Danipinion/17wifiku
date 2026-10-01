package com.danipinion.sobatwiff.data.remote.model

import com.google.gson.annotations.SerializedName

data class PaymentCreateRequest(
    val invoiceId: String? = null,
    val invoiceIds: List<String>? = null
)

data class PaymentCreateResponse(
    val success: Boolean,
    val payment: PaymentDto,
    val qrisData: String? = null
)

data class PaymentStatusResponse(
    val id: String,
    val status: String,
    val totalAmount: Double,
    val invoiceStatus: String,
    val paidAt: String? = null
)

data class PaymentDto(
    val id: String,
    val invoiceId: String? = null,
    val bulkInvoiceIds: String? = null,
    val userId: String,
    val originalAmount: Double,
    val uniqueCode: Int,
    val totalAmount: Double,
    val status: String,
    val createdAt: String,
    val expiresAt: String
)

data class PaymentErrorResponse(
    val error: String,
    val activePaymentId: String? = null,
    val existingPayment: PaymentDto? = null,
    val existingQrisData: String? = null
)
