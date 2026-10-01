package com.danipinion.laporpak

import android.app.AlertDialog
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.danipinion.laporpak.ui.navigation.AppNavigation
import com.danipinion.laporpak.ui.theme.LaporPakTheme
import com.danipinion.laporpak.util.UpdateManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var updateManager: UpdateManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        updateManager.checkForUpdate { versionName, releaseNotes, downloadUrl ->
            AlertDialog.Builder(this)
                .setTitle("Update Tersedia (v$versionName)")
                .setMessage("Ada versi baru dari aplikasi Lapor Pak!\n\n$releaseNotes")
                .setPositiveButton("Update") { _, _ ->
                    updateManager.downloadAndInstall(downloadUrl)
                }
                .setNegativeButton("Nanti", null)
                .setCancelable(false)
                .show()
        }

        setContent {
            LaporPakTheme {
                AppNavigation()
            }
        }
    }
}