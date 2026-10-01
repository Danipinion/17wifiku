package com.danipinion.laporpak.ui.splash

import androidx.lifecycle.ViewModel
import com.danipinion.laporpak.data.local.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _nextDestination = MutableStateFlow<String?>(null)
    val nextDestination: StateFlow<String?> = _nextDestination.asStateFlow()

    fun determineNextDestination(loginRoute: String, mainRoute: String) {
        val token = tokenManager.getToken()
        if (token.isNullOrBlank()) {
            _nextDestination.value = loginRoute
        } else {
            _nextDestination.value = mainRoute
        }
    }
}
