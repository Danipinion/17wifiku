package com.danipinion.sobatwiff.ui.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.repository.UserRepository
import com.danipinion.sobatwiff.data.remote.model.NotificationDto
import kotlinx.coroutines.launch

class NotificationViewModel(private val repository: UserRepository) : ViewModel() {

    var notifBilling by mutableStateOf(true)
    var notifPromo by mutableStateOf(true)
    var isLoading by mutableStateOf(false)
    var isRefreshing by mutableStateOf(false)
    var statusMessage by mutableStateOf<String?>(null)

    val notifications = mutableStateListOf<NotificationDto>()
    var unreadCount by mutableStateOf(0)
        private set

    init {
        loadSettings()
        fetchNotifications()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            repository.getProfile().onSuccess { profile ->
                notifBilling = profile.notifBilling
                notifPromo = profile.notifPromo
            }
        }
    }

    fun fetchNotifications() {
        viewModelScope.launch {
            isRefreshing = true
            repository.getNotifications().onSuccess { list ->
                notifications.clear()
                notifications.addAll(list)
                unreadCount = list.count { !it.isRead }
            }.onFailure {
                statusMessage = "Gagal memuat notifikasi"
            }
            isRefreshing = false
        }
    }

    fun markAsRead(id: String? = null) {
        viewModelScope.launch {
            repository.markNotificationsRead(id).onSuccess {
                if (id == null) {
                    // Mark all
                    val updatedList = notifications.map { it.copy(isRead = true) }
                    notifications.clear()
                    notifications.addAll(updatedList)
                    unreadCount = 0
                } else {
                    // Mark single
                    val index = notifications.indexOfFirst { it.id == id }
                    if (index != -1) {
                        notifications[index] = notifications[index].copy(isRead = true)
                        unreadCount = notifications.count { !it.isRead }
                    }
                }
            }
        }
    }

    fun deleteNotification(id: String? = null) {
        viewModelScope.launch {
            repository.deleteNotification(id).onSuccess {
                if (id == null) {
                    notifications.clear()
                    unreadCount = 0
                } else {
                    notifications.removeIf { it.id == id }
                    unreadCount = notifications.count { !it.isRead }
                }
            }.onFailure {
                statusMessage = "Gagal menghapus notifikasi"
            }
        }
    }

    fun updateBilling(enabled: Boolean) {
        notifBilling = enabled
        saveSettings(notifBilling = enabled)
    }

    fun updatePromo(enabled: Boolean) {
        notifPromo = enabled
        saveSettings(notifPromo = enabled)
    }

    private fun saveSettings(notifBilling: Boolean? = null, notifPromo: Boolean? = null) {
        viewModelScope.launch {
            isLoading = true
            repository.updateNotifications(notifBilling, notifPromo).onSuccess {
                statusMessage = it
            }.onFailure {
                statusMessage = "Gagal memperbarui: ${it.message}"
            }
            isLoading = false
        }
    }
}
