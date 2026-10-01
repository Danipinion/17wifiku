package com.danipinion.sobatwiff.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.danipinion.sobatwiff.MainActivity
import com.danipinion.sobatwiff.R
import com.danipinion.sobatwiff.data.local.SessionManager
import com.danipinion.sobatwiff.di.NetworkModule
import com.danipinion.sobatwiff.model.GotifyMessage
import com.google.gson.Gson
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import okhttp3.*
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Manager for Push Notifications using SSE (Server-Sent Events) via API Relay
 * This solves the private IP restriction for Gotify (10.0.0.102)
 */
class GotifyManager(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS) // Persistent stream
        .build()

    private var currentJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val sessionManager = SessionManager(context)
    private val gson = Gson()
    private var lastProcessedId = -1

    // Configuration - Points to the Next.js Relay API
    private val RELAY_URL = "${NetworkModule.BASE_URL}mobile/push-relay"
    private val CLIENT_TOKEN = "ClvQ8BS6vWaIqy5" // Gotify Client Token

    fun startListening() {
        if (currentJob != null) return

        currentJob = scope.launch {
            // Muat ID terakhir dari penyimpanan permanen
            lastProcessedId = sessionManager.lastProcessedId.first()
            Log.d("Gotify", "Starting service. Last persisted ID: $lastProcessedId")
            
            while (isActive) {
                try {
                    val urlWithSince = if (lastProcessedId > 0) {
                        "$RELAY_URL?token=$CLIENT_TOKEN&since=$lastProcessedId"
                    } else {
                        "$RELAY_URL?token=$CLIENT_TOKEN"
                    }
                    
                    Log.d("Gotify", "Connecting to stream: $urlWithSince")
                    
                    val request = Request.Builder()
                        .url(urlWithSince)
                        .header("Accept", "text/event-stream")
                        .build()

                    client.newCall(request).execute().use { response ->
                        if (!response.isSuccessful) throw IOException("Unexpected code: ${response.code}")

                        val source = response.body?.source() ?: return@use
                        while (!source.exhausted() && isActive) {
                            val line = source.readUtf8Line() ?: break
                            
                            if (line.startsWith("data: ")) {
                                val json = line.substring(6)
                                Log.d("Gotify", "New push received: $json")
                                handleMessage(json)
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.e("Gotify", "Connection lost: ${e.message}. Reconnecting in 3s...")
                    delay(3000) // Reconnect after 3 seconds on error
                }
            }
        }
    }

    // Perubahan di GotifyManager.kt pada fungsi handleMessage
private fun handleMessage(json: String) {
    try {
        val message = gson.fromJson(json, GotifyMessage::class.java)
        
        // Cek ID segera sebelum masuk ke coroutine agar tidak ada dobel di stream yang sama
        if (message.id <= lastProcessedId) return
        lastProcessedId = message.id // Tandai sudah diproses
        
        scope.launch {
            val currentUserId = sessionManager.userId.first()
            val targetUserId = message.extras?.get("userId")?.toString()
            
            if (targetUserId != null && targetUserId != currentUserId) return@launch
            
            showNotification(message.title, message.message, message.priority)
            sessionManager.setLastProcessedId(message.id) // Simpan permanen ke DataStore
        }
    } catch (e: Exception) {
        Log.e("Gotify", "Error: ${e.message}")
    }
}


    private fun showNotification(title: String, content: String, priority: Int) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "sobatwiff_push"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Push Notifications",
                if (priority >= 8) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Push Notifications for SobatWiff"
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent, 
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher) // Use default high res icon
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(if (priority >= 8) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }

    fun stopListening() {
        currentJob?.cancel()
        currentJob = null
        Log.d("Gotify", "Push service stopped")
    }
}

