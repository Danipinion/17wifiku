package com.danipinion.laporpak.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.laporpak.domain.model.LoginRequest
import com.danipinion.laporpak.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.danipinion.laporpak.data.local.TokenManager

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    object Success : LoginState()
    data class Error(val message: String) : LoginState()
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    val initialIdentifier = tokenManager.getRememberedIdentifier()
    val initialPassword = tokenManager.getRememberedPassword()

    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()

    fun login(identifier: String, password: String, rememberMe: Boolean) {
        if (identifier.isBlank() || password.isBlank()) {
            _loginState.value = LoginState.Error("Username/email dan sandi tidak boleh kosong")
            return
        }

        _loginState.value = LoginState.Loading
        viewModelScope.launch {
            val request = LoginRequest(identifier = identifier, password = password)
            authRepository.login(request).fold(
                onSuccess = { response ->
                    tokenManager.saveToken(response.token)
                    if (rememberMe) {
                        tokenManager.saveRememberMe(identifier, password)
                    } else {
                        tokenManager.clearRememberMe()
                    }
                    _loginState.value = LoginState.Success
                },
                onFailure = { throwable ->
                    _loginState.value = LoginState.Error(throwable.message ?: "Gagal masuk, periksa kembali koneksi atau kredensial Anda.")
                }
            )
        }
    }

    fun resetState() {
        _loginState.value = LoginState.Idle
    }
}
