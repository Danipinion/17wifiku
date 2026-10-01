package com.danipinion.laporpak.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.laporpak.domain.model.HistoryJobData
import com.danipinion.laporpak.domain.repository.JobRepository
import com.danipinion.laporpak.data.local.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class HistoryState {
    object Idle : HistoryState()
    object Loading : HistoryState()
    data class Success(
        val jobs: List<HistoryJobData>,
        val baseSalary: Double,
        val totalIncome: Double
    ) : HistoryState()
    data class Error(val message: String) : HistoryState()
}

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val repository: JobRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _state = MutableStateFlow<HistoryState>(HistoryState.Idle)
    val state: StateFlow<HistoryState> = _state.asStateFlow()

    private val _selectedMonth = MutableStateFlow<Int>(java.util.Calendar.getInstance().get(java.util.Calendar.MONTH) + 1)
    val selectedMonth: StateFlow<Int> = _selectedMonth.asStateFlow()

    private val _selectedYear = MutableStateFlow<Int>(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR))
    val selectedYear: StateFlow<Int> = _selectedYear.asStateFlow()

    init {
        loadHistory()
    }

    fun setMonthYear(month: Int, year: Int) {
        _selectedMonth.value = month
        _selectedYear.value = year
        loadHistory()
    }

    fun loadHistory() {
        viewModelScope.launch {
            _state.value = HistoryState.Loading
            val token = tokenManager.getToken()
            if (token.isNullOrEmpty()) {
                _state.value = HistoryState.Error("Sesi Anda telah habis. Silakan login kembali.")
                return@launch
            }

            val monthStr = _selectedMonth.value.toString()
            val yearStr = _selectedYear.value.toString()

            repository.getHistoryJobs(token, monthStr, yearStr).fold(
                onSuccess = { response ->
                    _state.value = HistoryState.Success(
                        jobs = response.historyJobs,
                        baseSalary = response.baseSalary,
                        totalIncome = response.totalIncome
                    )
                },
                onFailure = { throwable ->
                    _state.value = HistoryState.Error(throwable.message ?: "Terjadi kesalahan")
                }
            )
        }
    }
}
