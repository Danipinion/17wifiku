package com.danipinion.laporpak.ui.submit_job

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.laporpak.data.local.TokenManager
import com.danipinion.laporpak.domain.repository.JobRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

@HiltViewModel
class SubmitJobViewModel @Inject constructor(
    private val repository: JobRepository,
    private val tokenManager: TokenManager,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmitJobUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadJobTypes()
    }

    fun setJobId(jobId: String?) {
        if (jobId == null) return
        _uiState.value = _uiState.value.copy(jobId = jobId, isLoading = true)
        
        val token = tokenManager.getToken() ?: return
        
        viewModelScope.launch {
            repository.getJobDetail(token, jobId).fold(
                onSuccess = { job ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        selectedJobTypeId = job.jobTypeName,
                        instruction = job.instruction,
                        adminPhoto = job.adminPhoto,
                        targetLat = job.targetLatitude ?: 0.0,
                        targetLong = job.targetLongitude ?: 0.0,
                        notes = job.notes ?: ""
                    )
                },
                onFailure = { throwable ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Gagal memuat detail tugas: ${throwable.message}"
                    )
                }
            )
        }
    }

    private fun loadJobTypes() {
        val token = tokenManager.getToken()
        if (token.isNullOrBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Sesi Anda telah berakhir, silakan login kembali.")
            return
        }

        viewModelScope.launch {
            repository.getJobTypes(token).fold(
                onSuccess = { types ->
                    _uiState.value = _uiState.value.copy(jobTypes = types.map { it.name })
                },
                onFailure = { throwable ->
                    // Kalau gagal mengambil data, tetap bisa memasukkan manual, atau tampilkan pesan error
                    _uiState.value = _uiState.value.copy(errorMessage = throwable.message)
                }
            )
        }
    }

    fun onEvent(event: SubmitJobEvent) {
        when (event) {
            is SubmitJobEvent.OnJobTypeChanged -> {
                _uiState.value = _uiState.value.copy(selectedJobTypeId = event.jobTypeId, errorMessage = null)
            }
            is SubmitJobEvent.OnNotesChanged -> {
                _uiState.value = _uiState.value.copy(notes = event.notes, errorMessage = null)
            }
            is SubmitJobEvent.OnLocationRetrieved -> {
                _uiState.value = _uiState.value.copy(lat = event.lat, long = event.long, errorMessage = null)
            }
            is SubmitJobEvent.OnEvidenceChanged -> {
                _uiState.value = _uiState.value.copy(evidenceUri = event.uri, errorMessage = null)
            }
            is SubmitJobEvent.OnEvidenceError -> {
                _uiState.value = _uiState.value.copy(errorMessage = event.message)
            }
            SubmitJobEvent.Submit -> submitJob()
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }

    private fun submitJob() {
        val currentState = _uiState.value
        
        // Validation
        if (currentState.selectedJobTypeId.isBlank()) {
            _uiState.value = currentState.copy(errorMessage = "Mohon pilih tipe pekerjaan terlebih dahulu.")
            return
        }
        if (currentState.evidenceUri.isNullOrBlank()) {
            _uiState.value = currentState.copy(errorMessage = "Mohon lampirkan bukti foto untuk laporan.")
            return
        }
        if (currentState.lat == 0.0 || currentState.long == 0.0) {
            _uiState.value = currentState.copy(errorMessage = "Mohon pastikan GPS perangkat Anda aktif dan lokasi telah terdeteksi.")
            return
        }
        
        val token = tokenManager.getToken()
        if (token.isNullOrBlank()) {
            _uiState.value = currentState.copy(errorMessage = "Sesi Anda telah berakhir, silakan login kembali.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            try {
                // Convert Uri to File
                val uri = Uri.parse(currentState.evidenceUri)
                val inputStream = context.contentResolver.openInputStream(uri)
                val tempFile = File(context.cacheDir, "evidence_${System.currentTimeMillis()}.jpg")
                val outputStream = FileOutputStream(tempFile)
                
                inputStream?.use { input ->
                    outputStream.use { output ->
                        input.copyTo(output)
                    }
                }

                repository.submitJobMultipart(
                    token = token,
                    jobTypeName = currentState.selectedJobTypeId,
                    notes = currentState.notes,
                    latitude = currentState.lat,
                    longitude = currentState.long,
                    evidenceFile = tempFile,
                    jobId = currentState.jobId
                ).fold(
                    onSuccess = { message ->
                        _uiState.value = SubmitJobUiState(
                            jobTypes = _uiState.value.jobTypes, // retain loaded job types
                            successMessage = message
                        )
                    },
                    onFailure = { throwable ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = throwable.message ?: "Gagal mengirim data. Silakan coba lagi."
                        )
                    }
                )

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Maaf, gagal memproses foto. Silakan muat ulang atau gunakan foto lain."
                )
            }
        }
    }
}

data class SubmitJobUiState(
    val jobTypes: List<String> = emptyList(),
    val selectedJobTypeId: String = "",
    val jobId: String? = null,
    val instruction: String? = null,
    val adminPhoto: String? = null,
    val notes: String = "",
    val lat: Double = 0.0,
    val long: Double = 0.0,
    val targetLat: Double = 0.0,
    val targetLong: Double = 0.0,
    val evidenceUri: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

sealed class SubmitJobEvent {
    data class OnJobTypeChanged(val jobTypeId: String) : SubmitJobEvent()
    data class OnNotesChanged(val notes: String) : SubmitJobEvent()
    data class OnLocationRetrieved(val lat: Double, val long: Double) : SubmitJobEvent()
    data class OnEvidenceChanged(val uri: String) : SubmitJobEvent()
    data class OnEvidenceError(val message: String) : SubmitJobEvent()
    object Submit : SubmitJobEvent()
}
