package com.danipinion.sobatwiff.ui.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.local.SessionManager
import com.danipinion.sobatwiff.data.remote.model.SessionDto
import com.danipinion.sobatwiff.data.repository.UserRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class SecurityViewModel(
    private val repository: UserRepository
) : ViewModel() {

    var sessions by mutableStateOf<List<SessionDto>>(emptyList())
        private set

    var isLoading by mutableStateOf(false)
        private set

    var statusMessage by mutableStateOf<String?>(null)
        private set

    var isSuccess by mutableStateOf(false)
        private set

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            fetchSessions()
        }
    }

    fun fetchSessions() {
        viewModelScope.launch {
            repository.getSessions().onSuccess {
                sessions = it
            }
        }
    }

    fun changePassword(oldPass: String, newPass: String) {
        viewModelScope.launch {
            isLoading = true
            statusMessage = null
            isSuccess = false
            repository.changePassword(oldPass, newPass)
                .onSuccess {
                    statusMessage = it
                    isSuccess = true
                }
                .onFailure {
                    statusMessage = it.message ?: "Gagal memperbarui sandi"
                    isSuccess = false
                }
            isLoading = false
        }
    }

    fun logoutSession(sessionId: String) {
        viewModelScope.launch {
            repository.logoutSession(sessionId).onSuccess {
                fetchSessions()
            }
        }
    }

    fun logoutOtherDevices() {
        viewModelScope.launch {
            repository.logoutOtherSessions().onSuccess {
                fetchSessions()
            }
        }
    }
}
