package com.danipinion.sobatwiff.ui.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.local.UserCache
import com.danipinion.sobatwiff.data.repository.UserRepository
import kotlinx.coroutines.launch

class HomeViewModel(private val repository: UserRepository) : ViewModel() {

    var userProfile by mutableStateOf<UserCache?>(null)
        private set

    var homeData by mutableStateOf<com.danipinion.sobatwiff.data.remote.model.HomeResponse?>(null)
        private set

    var isLoading by mutableStateOf(false)
        private set

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            // Load from cache first for instant UI
            userProfile = repository.getCachedUser()
            
            // Then fetch from remote
            isLoading = true
            repository.getHomeData().onSuccess {
                homeData = it
                // Trigger profile update to sync abonemen etc in cache
                repository.getProfile().onSuccess {
                    userProfile = repository.getCachedUser()
                }
            }
            isLoading = false
        }
    }
}
