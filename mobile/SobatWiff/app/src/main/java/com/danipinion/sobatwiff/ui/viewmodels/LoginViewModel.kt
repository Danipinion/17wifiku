package com.danipinion.sobatwiff.ui.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.repository.UserRepository
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import retrofit2.HttpException

class LoginViewModel(private val repository: UserRepository) : ViewModel() {

    var identifier by mutableStateOf("")
    var password by mutableStateOf("")
    var rememberMe by mutableStateOf(false)
    var isLoading by mutableStateOf(false)
    var error by mutableStateOf<String?>(null)
    var failedAttemptsCount by mutableStateOf(0)
    var blockExpiryMillis by mutableStateOf(0L)
    var countdownText by mutableStateOf("")
    var isBlocked by mutableStateOf(false)
    
    init {
        viewModelScope.launch {
            rememberMe = repository.rememberMe.first()
            if (rememberMe) {
                identifier = repository.savedIdentifier.first() ?: ""
            }
        }

        viewModelScope.launch {
            repository.failedAttempts.collect { 
                failedAttemptsCount = it 
            }
        }

        viewModelScope.launch {
            repository.blockExpiry.collect { expiry ->
                blockExpiryMillis = expiry
                if (expiry > System.currentTimeMillis() && !checkJobStarted) {
                    checkJobStarted = true
                    startBlockCheckTimer()
                }
            }
        }
    }

    private var checkJobStarted = false

    private fun startBlockCheckTimer() {
        viewModelScope.launch {
            while (true) {
                val currentTime = System.currentTimeMillis()
                if (blockExpiryMillis > currentTime) {
                    isBlocked = true
                    val remainingSeconds = (blockExpiryMillis - currentTime) / 1000
                    val minutes = remainingSeconds / 60
                    val seconds = remainingSeconds % 60
                    countdownText = String.format("%02d:%02d", minutes, seconds)
                    delay(1000)
                } else {
                    if (isBlocked) {
                        repository.resetFailedAttempts()
                        isBlocked = false
                    }
                    checkJobStarted = false
                    break
                }
            }
        }
    }

    private val _loginSuccess = MutableSharedFlow<Boolean>()
    val loginSuccess = _loginSuccess.asSharedFlow()

    fun onLoginClick() {
        if (isBlocked) return
        
        if (identifier.isBlank() || password.isBlank()) {
            error = "Nomor HP dan password harus diisi lengkap ya!"
            return
        }

        viewModelScope.launch {
            isLoading = true
            error = null
            val result = repository.login(identifier, password)
            isLoading = false
            
            result.onSuccess {
                repository.resetFailedAttempts()
                repository.saveRememberMe(rememberMe, identifier)
                _loginSuccess.emit(true)
            }.onFailure {
                repository.incrementFailedAttempts()
                error = handleHumanError(it)
            }
        }
    }

    private fun handleHumanError(t: Throwable): String {
        return when (t) {
            is HttpException -> {
                when (t.code()) {
                    401 -> "Nomor HP atau password salah. Coba cek lagi ya!"
                    403 -> "Waduh, akun kamu sepertinya belum aktif atau akses ditolak. Hubungi admin ya!"
                    else -> "Server lagi sibuk nih, coba lagi sebentar lagi ya."
                }
            }
            is java.net.UnknownHostException, 
            is java.net.ConnectException,
            is java.net.SocketTimeoutException -> 
                "Koneksi internet lagi bermasalah nih. Pastikan kamu terhubung ke internet ya!"
            else -> "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi ya."
        }
    }
}
