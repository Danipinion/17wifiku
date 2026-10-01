package com.danipinion.sobatwiff.ui.viewmodels

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.danipinion.sobatwiff.data.remote.ApiService
import com.danipinion.sobatwiff.data.remote.model.InvoiceDto
import com.danipinion.sobatwiff.data.repository.UserRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.TimeUnit
import okhttp3.ResponseBody

class HistoryViewModel(private val userRepository: UserRepository) : ViewModel() {

    var isLoading by mutableStateOf(false)
        private set

    var invoices = mutableStateListOf<InvoiceDto>()
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set

    init {
        fetchInvoices()
    }

    fun fetchInvoices() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            userRepository.getMyInvoices().onSuccess { response ->
                invoices.clear()
                invoices.addAll(response.invoices)
            }.onFailure { e ->
                errorMessage = "Gagal mengambil riwayat: ${e.message}"
            }
            isLoading = false
        }
    }

    fun downloadAndShareInvoice(context: Context, invoiceId: String) {
        viewModelScope.launch {
            isLoading = true
            try {
                val result = userRepository.downloadInvoicePdf(invoiceId)
                val body = result.getOrThrow()
                val file = withContext(Dispatchers.IO) {
                    val tempFile = File(context.cacheDir, "nota-$invoiceId.pdf")
                    body.byteStream().use { input ->
                        tempFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    tempFile
                }

                shareFile(context, file)
            } catch (e: Exception) {
                errorMessage = "Gagal mengunduh nota: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    private fun shareFile(context: Context, file: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.provider",
            file
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Bagikan Nota Tagihan"))
    }
}
