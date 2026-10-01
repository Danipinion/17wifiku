package com.danipinion.sobatwiff.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.danipinion.sobatwiff.R
import com.danipinion.sobatwiff.util.GotifyManager

class GotifyService : Service() {
    private var gotifyManager: GotifyManager? = null

    override fun onCreate() {
        super.onCreate()
        gotifyManager = GotifyManager(this)
        startForegroundService()
        gotifyManager?.startListening()
        Log.d("GotifyService", "Gotify Background Service Created")
    }

    private fun startForegroundService() {
        val channelId = "gotify_persistent"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Layanan Latar Belakang",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Menjaga koneksi notifikasi tetap aktif"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_SECRET
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("SobatMulya")
            .setContentText("Layanan notifikasi aktif")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setSilent(true)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(1001, notification)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY // Jika dimatikan OS, hidupkan kembali otomatis
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        gotifyManager?.stopListening()
        super.onDestroy()
        Log.d("GotifyService", "Gotify Background Service Destroyed")
    }
}
