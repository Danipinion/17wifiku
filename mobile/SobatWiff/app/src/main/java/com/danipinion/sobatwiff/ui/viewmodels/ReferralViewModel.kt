package com.danipinion.sobatwiff.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.remote.ApiService
import com.danipinion.sobatwiff.data.remote.model.ReferralCodeRequest
import com.danipinion.sobatwiff.data.remote.model.ReferralResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ReferralState {
    object Idle : ReferralState()
    data class Loading(val currentData: ReferralResponse? = null) : ReferralState()
    data class Success(val data: ReferralResponse) : ReferralState()
    data class Error(val message: String) : ReferralState()
}

sealed class SubmitReferralState {
    object Idle : SubmitReferralState()
    object Loading : SubmitReferralState()
    data class Success(val message: String) : SubmitReferralState()
    data class Error(val message: String) : SubmitReferralState()
}

class ReferralViewModel(
    private val apiService: ApiService
) : ViewModel() {

    private val _referralState = MutableStateFlow<ReferralState>(ReferralState.Loading())
    val referralState = _referralState.asStateFlow()

    private val _submitState = MutableStateFlow<SubmitReferralState>(SubmitReferralState.Idle)
    val submitState = _submitState.asStateFlow()

    init {
        fetchReferralData()
    }

    fun fetchReferralData() {
        viewModelScope.launch {
            val currentData = (referralState.value as? ReferralState.Success)?.data
                ?: (referralState.value as? ReferralState.Loading)?.currentData
            
            _referralState.value = ReferralState.Loading(currentData)
            try {
                val response = apiService.getReferralData()
                _referralState.value = ReferralState.Success(response)
            } catch (e: Exception) {
                _referralState.value = ReferralState.Error(e.message ?: "Terjadi kesalahan")
            }
        }
    }

    fun submitCode(code: String) {
        viewModelScope.launch {
            _submitState.value = SubmitReferralState.Loading
            try {
                apiService.submitReferralCode(ReferralCodeRequest(code))
                _submitState.value = SubmitReferralState.Success("Kode referral berhasil dikirim")
                fetchReferralData() // Refresh list
            } catch (e: Exception) {
                _submitState.value = SubmitReferralState.Error(e.message ?: "Gagal mengirim kode")
            }
        }
    }

    fun resetSubmitState() {
        _submitState.value = SubmitReferralState.Idle
    }
}
