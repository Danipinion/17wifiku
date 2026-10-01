package com.danipinion.sobatwiff.ui.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.remote.ApiService
import com.danipinion.sobatwiff.data.remote.model.RouterActionRequest
import com.danipinion.sobatwiff.data.remote.model.RouterInfo
import androidx.compose.runtime.mutableStateMapOf
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

sealed class RouterState {
    object Idle : RouterState()
    object Loading : RouterState()
    data class Success(val info: RouterInfo, val localSignalStrength: Int = 0) : RouterState()
    data class Error(val message: String) : RouterState()
    object NotAvailable : RouterState()
}

class RouterViewModel(
    private val apiService: ApiService,
    private val wifiHelper: com.danipinion.sobatwiff.util.WifiHelper? = null
) : ViewModel() {
    private val rebootCooldowns = mutableStateMapOf<String, Long>()
    var state by mutableStateOf<RouterState>(RouterState.Idle)
        private set

    var isActionLoading by mutableStateOf(false)
        private set

    var actionMessage by mutableStateOf<Pair<Boolean, String>?>(null) // success to message
        private set

    var currentDeviceId: String? by mutableStateOf(null)
        private set

    fun fetchRouterInfo(deviceId: String? = null) {
        viewModelScope.launch {
            state = RouterState.Loading
            try {
                val info = apiService.getRouterInfo(deviceId)
                currentDeviceId = info.currentDeviceId
                val localSignal = wifiHelper?.getSignalStrengthForSsid(info.ssid) ?: 0
                state = RouterState.Success(info, localSignal)
            } catch (e: retrofit2.HttpException) {
                if (e.code() == 403) {
                    state = RouterState.NotAvailable
                } else {
                    state = RouterState.Error(e.message() ?: "Kesalahan koneksi")
                }
            } catch (e: Exception) {
                state = RouterState.Error(e.message ?: "Gagal mengambil data router")
            }
        }
    }

    fun reboot() {
        val deviceId = currentDeviceId ?: "default"
        if (getRebootRemainingSeconds(deviceId) > 0) return

        viewModelScope.launch {
            isActionLoading = true
            try {
                val response = apiService.executeRouterAction(RouterActionRequest("reboot", deviceId = currentDeviceId))
                actionMessage = true to response.message
                rebootCooldowns[deviceId] = System.currentTimeMillis()
            } catch (e: Exception) {
                actionMessage = false to (e.message ?: "Gagal mengirim perintah reboot")
            } finally {
                isActionLoading = false
            }
        }
    }

    fun getRebootRemainingSeconds(deviceId: String?): Int {
        val lastReboot = rebootCooldowns[deviceId ?: "default"] ?: return 0
        val elapsed = (System.currentTimeMillis() - lastReboot) / 1000
        return (120 - elapsed).toInt().coerceAtLeast(0)
    }

    fun changeWifiPassword(newPass: String) {
        viewModelScope.launch {
            isActionLoading = true
            try {
                val response = apiService.executeRouterAction(RouterActionRequest("change-password", newPass, deviceId = currentDeviceId))
                actionMessage = true to response.message
            } catch (e: Exception) {
                actionMessage = false to (e.message ?: "Gagal mengganti password")
            } finally {
                isActionLoading = false
            }
        }
    }

    fun clearActionMessage() {
        actionMessage = null
    }
}
