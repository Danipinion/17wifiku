package com.danipinion.sobatwiff

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.danipinion.sobatwiff.di.ServiceLocator
import com.danipinion.sobatwiff.ui.screens.*
import com.danipinion.sobatwiff.ui.theme.SobatMulyaTheme
import com.danipinion.sobatwiff.ui.viewmodels.LoginViewModel
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.danipinion.sobatwiff.services.GotifyService
import android.content.Intent
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

enum class AppState {
    Splash, GettingStarted, Login, Dashboard
}

class MainActivity : AppCompatActivity() {

    private val userRepository by lazy { ServiceLocator.provideUserRepository(this) }
    private var downloadId: Long = -1

    private val onDownloadComplete = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
            android.util.Log.d("AppUpdater", "Download complete signal received! System ID: $id, App ID: $downloadId")
            if (downloadId == id) {
                showInstallDialog()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        cleanupOldUpdateFile()

        setContent {
            SobatMulyaTheme {
                var currentState by remember { mutableStateOf(AppState.Splash) }

                // --- IN-APP UPDATE CHECK ---
                LaunchedEffect(Unit) {
                    val updateUrl = com.danipinion.sobatwiff.di.NetworkModule.BASE_URL + "mobile/update-check"
                    com.github.javiersantos.appupdater.AppUpdaterUtils(this@MainActivity)
                        .setUpdateFrom(com.github.javiersantos.appupdater.enums.UpdateFrom.JSON)
                        .setUpdateJSON(updateUrl)
                        .withListener(object : com.github.javiersantos.appupdater.AppUpdaterUtils.UpdateListener {
                            override fun onSuccess(update: com.github.javiersantos.appupdater.objects.Update, isUpdateAvailable: Boolean) {
                                if (isUpdateAvailable) {
                                    try {
                                        val latestVersion = update.latestVersion
                                        val downloadUrl = update.urlToDownload.toString()
                                        
                                        androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                                            .setTitle("Pembaruan Tersedia")
                                            .setMessage("Versi terbaru ($latestVersion) sudah tersedia untuk pengalaman yang lebih baik. Silakan perbarui aplikasi Anda sekarang.")
                                            .setPositiveButton("Perbarui Sekarang") { _, _ ->
                                                startDownload(downloadUrl)
                                            }
                                            .setNegativeButton("Nanti Saja", null)
                                            .show()
                                    } catch (e: Exception) {
                                        android.util.Log.e("AppUpdater", "Error parsing update: ${e.message}")
                                    }
                                }
                            }
                            override fun onFailed(p0: com.github.javiersantos.appupdater.enums.AppUpdaterError?) {
                                android.util.Log.e("AppUpdater", "Update check failed: ${p0?.name}")
                            }
                        })
                        .start()
                }
                
                // Navigation Logic
                LaunchedEffect(Unit) {
                    // Initial check
                    val isValid = userRepository.checkSession()
                    if (isValid) {
                        currentState = AppState.Dashboard
                    }
                }


                BackHandler(enabled = currentState != AppState.Dashboard && currentState != AppState.Splash) {
                    when (currentState) {
                        AppState.Login -> currentState = AppState.GettingStarted
                        AppState.GettingStarted -> currentState = AppState.Splash
                        else -> {}
                    }
                }

                // Permission Launcher for Notifications
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { isGranted ->
                    if (isGranted) {
                        Log.d("Gotify", "Notification permission granted")
                    } else {
                        Log.w("Gotify", "Notification permission denied")
                    }
                }

                LaunchedEffect(Unit) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }
                }

                LaunchedEffect(currentState) {
                    val serviceIntent = Intent(this@MainActivity, GotifyService::class.java)
                    if (currentState == AppState.Dashboard) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            startForegroundService(serviceIntent)
                        } else {
                            startService(serviceIntent)
                        }
                    } else if (currentState != AppState.Splash) {
                        // Jangan stop saat splash, krn bisa jadi transisi ke dashboard
                        stopService(serviceIntent)
                    }
                }

                when (currentState) {
                    AppState.Splash -> {
                        CustomSplashScreen(onFinished = {
                            lifecycleScope.launch {
                                val isValid = userRepository.checkSession()
                                if (isValid) {
                                    currentState = AppState.Dashboard
                                } else {
                                    val seen = userRepository.hasSeenOnboarding.first()
                                    currentState = if (seen) AppState.Login else AppState.GettingStarted
                                }
                            }
                        })
                    }
                    AppState.GettingStarted -> {
                        GettingStartedScreen(onFinished = {
                            lifecycleScope.launch {
                                userRepository.setHasSeenOnboarding(true)
                                currentState = AppState.Login
                            }
                        })
                    }
                    AppState.Login -> {
                        val loginViewModel: LoginViewModel = viewModel { LoginViewModel(userRepository) }
                        LoginScreen(
                            viewModel = loginViewModel,
                            onLoginSuccess = {
                                currentState = AppState.Dashboard
                            }
                        )
                    }
                    AppState.Dashboard -> {
                        DashboardScreen(onLogout = {
                            lifecycleScope.launch {
                                userRepository.logout()
                                // Restart activity to clear all ViewModels and global state
                                val intent = android.content.Intent(this@MainActivity, MainActivity::class.java).apply {
                                    flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
                                }
                                startActivity(intent)
                                finish()
                            }
                        })
                    }
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(onDownloadComplete, filter, RECEIVER_EXPORTED)
        } else {
            registerReceiver(onDownloadComplete, filter)
        }
    }

    override fun onStop() {
        super.onStop()
        unregisterReceiver(onDownloadComplete)
    }

    private fun cleanupOldUpdateFile() {
        try {
            val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "SobatWiff_Update.apk")
            if (file.exists()) {
                file.delete()
                android.util.Log.d("AppUpdater", "Old update APK cleaned up.")
            }
        } catch (e: Exception) {
            android.util.Log.e("AppUpdater", "Failed to cleanup old APK: ${e.message}")
        }
    }

    private fun showInstallDialog() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Unduhan Selesai")
            .setMessage("Versi terbaru sudah siap untuk dipasang. Klik 'Buka Sekarang' untuk memperbarui aplikasi.")
            .setPositiveButton("Buka Sekarang") { _, _ ->
                installApk()
            }
            .setNegativeButton("Keluarkan", null)
            .show()
    }

    private fun startDownload(url: String) {
        try {
            // Delete old file if exists to prevent rename issues like -1.apk, -2.apk
            val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "SobatWiff_Update.apk")
            if (file.exists()) {
                file.delete()
            }

            val request = DownloadManager.Request(Uri.parse(url))
                .setTitle("Update SobatWiff")
                .setDescription("Sedang mengunduh versi terbaru...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "SobatWiff_Update.apk")
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            downloadId = dm.enqueue(request)
            Toast.makeText(this, "Unduhan dimulai di latar belakang...", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Gagal memulai unduhan: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun installApk() {
        try {
            val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "SobatWiff_Update.apk")
            if (!file.exists()) return
            
            val uri = FileProvider.getUriForFile(this, "${packageName}.provider", file)
            
            val install = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(install)
        } catch (e: Exception) {
            Toast.makeText(this, "Gagal menginstal aplikasi: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    // Helper for simple ViewModel injection without Hilt
    private inline fun <reified T : ViewModel> viewModel(crossinline factory: () -> T): T {
        return ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <U : ViewModel> create(modelClass: Class<U>): U {
                return factory() as U
            }
        }).get(T::class.java)
    }
}
