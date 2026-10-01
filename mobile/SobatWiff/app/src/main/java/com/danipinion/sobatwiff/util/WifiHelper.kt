package com.danipinion.sobatwiff.util

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build

data class ScannedWifi(
    val ssid: String,
    val level: Int, // RSSI
    val signalPercentage: Int
)

class WifiHelper(private val context: Context) {
    private val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager

    fun getScannedWifiList(): List<ScannedWifi> {
        return try {
            val results = wifiManager.scanResults
            results.map {
                val level = it.level
                val percentage = WifiManager.calculateSignalLevel(level, 100)
                ScannedWifi(
                    ssid = it.SSID.replace("\"", ""),
                    level = level,
                    signalPercentage = percentage
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun getSignalStrengthForSsid(targetSsid: String): Int {
        val list = getScannedWifiList()
        val match = list.find { it.ssid == targetSsid }
        return match?.signalPercentage ?: 0
    }
}
