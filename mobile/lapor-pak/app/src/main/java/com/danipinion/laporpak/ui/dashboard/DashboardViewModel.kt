package com.danipinion.laporpak.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.laporpak.data.local.TokenManager
import com.danipinion.laporpak.domain.model.EmployeeDashboardResponse
import com.danipinion.laporpak.domain.repository.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(val data: EmployeeDashboardResponse) : DashboardState()
    data class Error(val message: String) : DashboardState()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _dashboardState = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val dashboardState: StateFlow<DashboardState> = _dashboardState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        val token = tokenManager.getToken()
        if (token.isNullOrBlank()) {
            _dashboardState.value = DashboardState.Error("Sesi Anda telah berakhir, silakan login kembali.")
            return
        }

        _dashboardState.value = DashboardState.Loading
        viewModelScope.launch {
            dashboardRepository.getDashboardInfo(token).fold(
                onSuccess = { response ->
                    _dashboardState.value = DashboardState.Success(response)
                },
                onFailure = { throwable ->
                    _dashboardState.value = DashboardState.Error(
                        throwable.message ?: "Maaf, terjadi kesalahan saat menghubungi server."
                    )
                }
            )
        }
    }

    fun logout() {
        tokenManager.clearToken()
        _dashboardState.value = DashboardState.Error("Sesi Anda telah berakhir, silakan login kembali.")
    }
}
