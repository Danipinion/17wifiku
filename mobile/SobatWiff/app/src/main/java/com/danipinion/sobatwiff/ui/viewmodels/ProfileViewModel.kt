package com.danipinion.sobatwiff.ui.viewmodels

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.local.UserCache
import com.danipinion.sobatwiff.data.repository.UserRepository
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class ProfileViewModel(private val repository: UserRepository) : ViewModel() {

    var userProfile by mutableStateOf<UserCache?>(null)
        private set

    var isLoading by mutableStateOf(false)
        private set

    var statusMessage by mutableStateOf<String?>(null)
        private set

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            userProfile = repository.getCachedUser()
            repository.getProfile().onSuccess {
                userProfile = repository.getCachedUser()
            }
        }
    }

    @SuppressLint("MissingPermission")
    fun updateCurrentLocation(context: Context) {
        viewModelScope.launch {
            isLoading = true
            statusMessage = "Mendapatkan lokasi..."
            try {
                // First check if location client is available
                val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
                
                // Try to get current location with high accuracy
                val locationTask = fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    CancellationTokenSource().token
                )
                
                val location = try {
                    locationTask.await()
                } catch (e: SecurityException) {
                    statusMessage = "Error Keamanan: Izin lokasi tidak diberikan."
                    null
                } catch (e: Exception) {
                    statusMessage = "Gagal mengambil lokasi: ${e.message}"
                    null
                }

                if (location != null) {
                    statusMessage = "Menyimpan ke server..."
                    repository.updateLocation(location.latitude, location.longitude).onSuccess {
                        statusMessage = "Lokasi berhasil diperbarui"
                        // Refresh profile after update
                        repository.getProfile().onSuccess {
                            userProfile = repository.getCachedUser()
                        }
                    }.onFailure {
                        statusMessage = "Gagal menyimpan: ${it.message}"
                    }
                } else if (statusMessage == "Mendapatkan lokasi...") {
                    statusMessage = "Gagal mendapatkan lokasi. Pastikan GPS aktif."
                }
            } catch (e: Exception) {
                statusMessage = "Terjadi kesalahan: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun updateStatusMessage(message: String?) {
        statusMessage = message
    }
}
