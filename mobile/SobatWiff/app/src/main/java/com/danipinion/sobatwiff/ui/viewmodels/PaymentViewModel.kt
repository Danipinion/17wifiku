package com.danipinion.sobatwiff.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.remote.model.PaymentCreateResponse
import com.danipinion.sobatwiff.data.remote.model.PaymentStatusResponse
import com.danipinion.sobatwiff.data.repository.UserRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class PaymentUiState {
    object Idle : PaymentUiState()
    object Loading : PaymentUiState()
    data class Created(val data: PaymentCreateResponse) : PaymentUiState()
    object Success : PaymentUiState()
    data class Conflict(
        val message: String, 
        val activePaymentId: String,
        val payment: com.danipinion.sobatwiff.data.remote.model.PaymentDto,
        val qrisData: String
    ) : PaymentUiState()
    data class Error(val message: String) : PaymentUiState()
}

class PaymentViewModel(private val repository: UserRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<PaymentUiState>(PaymentUiState.Idle)
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null

    fun createPayment(id: String) {
        viewModelScope.launch {
            _uiState.value = PaymentUiState.Loading
            val request = if (id.startsWith("bulk:")) {
                val ids = id.removePrefix("bulk:").split(",").filter { it.isNotBlank() }
                com.danipinion.sobatwiff.data.remote.model.PaymentCreateRequest(invoiceIds = ids)
            } else {
                com.danipinion.sobatwiff.data.remote.model.PaymentCreateRequest(invoiceId = id)
            }
            
            repository.createPayment(request).onSuccess { response ->
                _uiState.value = PaymentUiState.Created(response)
                startPolling(response.payment.id)
            }.onFailure { exception ->
                // Handle Conflict 409 error
                if (exception is retrofit2.HttpException && exception.code() == 409) {
                    try {
                        val body = exception.response()?.errorBody()?.string()
                        val errorData = com.google.gson.Gson().fromJson(body, com.danipinion.sobatwiff.data.remote.model.PaymentErrorResponse::class.java)
                        _uiState.value = PaymentUiState.Conflict(
                            errorData.error ?: "Ada pembayaran aktif", 
                            errorData.activePaymentId ?: "",
                            errorData.existingPayment!!,
                            errorData.existingQrisData!!
                        )
                    } catch (e: Exception) {
                        _uiState.value = PaymentUiState.Error("Anda memiliki pembayaran aktif lainnya.")
                    }
                } else {
                    _uiState.value = PaymentUiState.Error(exception.message ?: "Gagal membuat pembayaran")
                }
            }
        }
    }

    fun cancelPayment(paymentId: String, onCancelled: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = PaymentUiState.Loading
            repository.cancelPayment(paymentId).onSuccess {
                _uiState.value = PaymentUiState.Idle
                onCancelled()
            }.onFailure {
                _uiState.value = PaymentUiState.Error("Gagal membatalkan pembayaran: ${it.message}")
            }
        }
    }

    fun openExistingPayment(payment: com.danipinion.sobatwiff.data.remote.model.PaymentDto, qrisData: String) {
        _uiState.value = PaymentUiState.Created(
            com.danipinion.sobatwiff.data.remote.model.PaymentCreateResponse(true, payment, qrisData)
        )
        startPolling(payment.id)
    }

    private fun startPolling(paymentId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (true) {
                delay(5000) // Poll every 5 seconds
                repository.getPaymentStatus(paymentId).onSuccess { status ->
                    if (status.status == "SUCCESS" || status.invoiceStatus == "PAID") {
                        _uiState.value = PaymentUiState.Success
                        pollingJob?.cancel()
                    }
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
